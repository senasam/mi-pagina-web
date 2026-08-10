from __future__ import annotations

import asyncio
import json
import shutil
import threading
import uuid
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from local_tools.local_agent.models import utc_now
from local_tools.local_agent.software.installers.base import InstallerProvider
from local_tools.local_agent.software.models import SoftwareDescriptor, SoftwareInstall
from local_tools.local_agent.software.installers.portable_zip import PortableZipInstaller
from local_tools.local_agent.tasks.manager import TaskManager


class SoftwareManager:
    def __init__(self, root: Path, *, registry: dict[str, dict[str, Any]] | None = None, task_manager: TaskManager | None = None):
        self.root = Path(root).resolve()
        self.cache = self.root / "software"
        self.installs = self.root / "installs"
        self.cache.mkdir(parents=True, exist_ok=True)
        self.installs.mkdir(parents=True, exist_ok=True)
        self.registry = registry or {}
        self.providers: dict[str, InstallerProvider] = {
            "portable-zip": PortableZipInstaller(),
        }
        self.install_sessions: dict[str, SoftwareInstall] = {}
        self.task_manager = task_manager

    def list_software(self) -> list[dict[str, Any]]:
        return [self._build_descriptor(software_id).public() for software_id in sorted(self.registry)]

    def _build_descriptor(self, software_id: str) -> SoftwareDescriptor:
        descriptor = self.registry[software_id]
        software = SoftwareDescriptor(
            id=software_id,
            display_name=descriptor.get("displayName", software_id),
            description=descriptor.get("description", ""),
            installed_version=self._read_installed_version(software_id),
            available_version=descriptor.get("version"),
            state="installed" if self._read_installed_version(software_id) else "not-installed",
            installable=True if descriptor.get("url") else False,
            update_available=self._read_installed_version(software_id) != descriptor.get("version"),
            metadata=descriptor.get("metadata", {}),
        )
        return software

    def _read_installed_version(self, software_id: str) -> str | None:
        install_file = self.cache / f"{software_id}.json"
        if not install_file.exists():
            return None
        try:
            payload = json.loads(install_file.read_text(encoding="utf-8"))
            return payload.get("version")
        except (OSError, ValueError, json.JSONDecodeError):
            return None

    def get_software(self, software_id: str) -> SoftwareDescriptor:
        if software_id not in self.registry:
            raise KeyError(f"Software no registrado: {software_id}")
        return self._build_descriptor(software_id)

    def create_install(self, software_id: str, action: str) -> SoftwareInstall:
        software = self.get_software(software_id)
        if action not in {"install", "update", "repair"}:
            raise HTTPException(400, "Accion de software no valida.")
        if not software.installable:
            raise HTTPException(409, "Software no instalable.")
        install = SoftwareInstall(
            id=uuid.uuid4().hex,
            software_id=software_id,
            action=action,
            state="queued",
            phase="queued",
            percentage=0.0,
            message="Instalación en cola.",
        )
        self.install_sessions[install.id] = install
        return install

    async def create_install_task(self, software_id: str, action: str) -> tuple[SoftwareInstall, dict[str, Any]]:
        if not self.task_manager:
            raise RuntimeError("TaskManager no configurado para SoftwareManager.")
        install = self.create_install(software_id, action)
        task = self.task_manager.create(
            task_id=install.id,
            capability="software-manager",
            operation=f"{action}",
            message=install.message,
            metadata={"softwareId": software_id, "action": action},
        )
        self.task_manager.attach_cancel_handler(install.id, lambda install=install: self.cancel_install(install))
        asyncio.create_task(self._run_install_task(install, task))
        return install, task

    async def _run_install_task(self, install: SoftwareInstall, task: Any) -> None:
        try:
            self.task_manager.update(
                install.id,
                status="starting",
                progress=install.percentage,
                message="Iniciando instalacion.",
                phase="download",
                metadata={"softwareId": install.software_id, "action": install.action},
            )
            install_task = asyncio.create_task(asyncio.to_thread(self.run_install, install))
            while not install_task.done():
                await asyncio.sleep(0.25)
                self.task_manager.update(
                    install.id,
                    status="running",
                    progress=install.percentage,
                    message=install.message,
                    phase=install.phase,
                    metadata={"softwareId": install.software_id, "action": install.action},
                    source_event="install_progress",
                )
            await install_task
            self.task_manager.update(
                install.id,
                status="completed",
                progress=100.0,
                message="Instalación completada.",
                phase="completed",
                result={"softwareId": install.software_id, "version": self.get_software(install.software_id).installed_version},
                metadata={"softwareId": install.software_id, "action": install.action},
                source_event="install_completed",
            )
        except Exception as exc:
            if isinstance(exc, RuntimeError) and str(exc) == "cancelled":
                self.task_manager.update(
                    install.id,
                    status="cancelled",
                    progress=install.percentage,
                    message="Instalación cancelada.",
                    phase="cancelled",
                    metadata={"softwareId": install.software_id, "action": install.action},
                    source_event="install_cancelled",
                )
                return
            self.task_manager.update(
                install.id,
                status="failed",
                progress=install.percentage,
                message=str(exc),
                phase="failed",
                error={"code": "software_install_failed", "message": str(exc)},
                metadata={"softwareId": install.software_id, "action": install.action},
                source_event="install_failed",
            )

    def cancel_install(self, install: SoftwareInstall) -> None:
        if install.state in {"completed", "failed", "cancelled"}:
            return
        install.state = "cancelling"
        install.message = "Cancelando instalación..."
        install.updated_at = utc_now()
        install.cancel_event.set()
        if self.task_manager:
            self.task_manager.update(
                install.id,
                status="cancelled",
                progress=install.percentage,
                message=install.message,
                phase="cancelling",
                metadata={"softwareId": install.software_id, "action": install.action},
                source_event="cancel_requested",
            )

    def get_install(self, install_id: str) -> SoftwareInstall:
        install = self.install_sessions.get(install_id)
        if not install:
            raise HTTPException(404, "Instalación no encontrada.")
        return install

    def run_install(self, install: SoftwareInstall) -> None:
        software = self.get_software(install.software_id)
        descriptor = self.registry[install.software_id]
        plan = self.providers["portable-zip"].install_plan(install.software_id, descriptor)
        staging = self.installs / install.id
        staging.mkdir(parents=True, exist_ok=True)
        try:
            install.state = "downloading"
            self.providers[plan["provider"]].run_install(install.software_id, install, plan, staging)
            install.state = "completed"
            install.percentage = 100.0
            install.message = "Instalación completada."
            self._write_installed_version(install.software_id, software.available_version)
        except Exception as exc:
            install.state = "failed"
            install.message = str(exc)
            raise
        finally:
            install.updated_at = utc_now()

    def _write_installed_version(self, software_id: str, version: str | None) -> None:
        if not version:
            return
        self.cache.joinpath(f"{software_id}.json").write_text(
            json.dumps({"version": version}), encoding="utf-8"
        )
