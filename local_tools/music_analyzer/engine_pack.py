"""Instalacion allowlist del Audio Engine Pack desde un manifiesto confiable."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
import shutil
import sys
import tempfile
import urllib.parse
import urllib.request
import uuid
import zipfile
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from local_tools.local_agent.events import publish_event
from local_tools.local_agent.models import utc_now

ALLOWED_DOWNLOAD_HOSTS = {"github.com", "objects.githubusercontent.com"}


class EnginePackError(Exception):
    pass


@dataclass
class EngineInstall:
    id: str
    state: str = "downloading"
    percentage: float = 0
    message: str = "Preparando Audio Engine Pack."
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event, repr=False)
    events: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=200), repr=False)
    subscribers: set[asyncio.Queue] = field(default_factory=set, repr=False)
    event_sequence: int = 0
    task: asyncio.Task | None = field(default=None, repr=False)

    def public(self) -> dict[str, Any]:
        return {"id": self.id, "state": self.state, "percentage": round(self.percentage, 1), "message": self.message, "createdAt": self.created_at, "updatedAt": self.updated_at}

    async def publish(self, event_type: str, **data: Any) -> None:
        await publish_event(self, event_type, **data)


class EnginePackManager:
    def __init__(self, root: Path, *, descriptor_path: Path | None = None):
        self.root = Path(root).resolve()
        self.versions = self.root / "versions"
        self.versions.mkdir(parents=True, exist_ok=True)
        configured = descriptor_path or os.environ.get("FELIPE_AUDIO_ENGINE_DESCRIPTOR")
        if configured:
            self.descriptor_path = Path(configured).resolve()
        elif getattr(sys, "frozen", False):
            self.descriptor_path = Path(sys.executable).resolve().parent / "engine-pack-manifest.json"
        else:
            self.descriptor_path = Path(__file__).resolve().parent / "packaging" / "engine-pack-manifest.json"
        self.installs: dict[str, EngineInstall] = {}

    def descriptor(self) -> dict[str, Any] | None:
        if not self.descriptor_path.is_file():
            return None
        try:
            payload = json.loads(self.descriptor_path.read_text(encoding="utf-8-sig"))
            if payload.get("schemaVersion") != 1 or payload.get("platform") != "windows-x64":
                return None
            if not isinstance(payload.get("sha256"), str) or len(payload["sha256"]) != 64:
                return None
            return payload
        except (OSError, TypeError, ValueError, json.JSONDecodeError):
            return None

    def installed_root(self) -> Path | None:
        pointer = self.root / "current.json"
        try:
            payload = json.loads(pointer.read_text(encoding="utf-8-sig"))
            candidate = (self.versions / payload["version"]).resolve()
            if candidate.is_relative_to(self.versions.resolve()) and self._validate_pack(candidate):
                return candidate
        except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
            pass
        return None

    @staticmethod
    def _validate_pack(root: Path) -> bool:
        required = (
            root / "engine-pack.json",
            root / "python" / "python.exe",
            root / "ffmpeg" / "bin" / "ffmpeg.exe",
            root / "ffmpeg" / "bin" / "ffprobe.exe",
            root / "local_tools" / "music_analyzer" / "worker.py",
        )
        return all(path.is_file() for path in required)

    def status(self) -> dict[str, Any]:
        descriptor = self.descriptor()
        installed = self.installed_root()
        version = None
        if installed:
            try:
                version = json.loads((installed / "engine-pack.json").read_text(encoding="utf-8-sig"))["version"]
            except (OSError, KeyError, json.JSONDecodeError):
                installed = None
        return {
            "state": "installed" if installed else "not-installed",
            "available": bool(installed),
            "version": version,
            "availableVersion": descriptor.get("version") if descriptor else None,
            "downloadBytes": descriptor.get("size") if descriptor else None,
            "installable": descriptor is not None,
        }

    def worker_command(self, module: str) -> list[str] | None:
        installed = self.installed_root()
        if not installed:
            return None
        return [str(installed / "python" / "python.exe"), "-m", module]

    def worker_environment(self) -> dict[str, str]:
        environment = os.environ.copy()
        installed = self.installed_root()
        if installed:
            environment["PYTHONPATH"] = str(installed)
            environment["PATH"] = f"{installed / 'ffmpeg' / 'bin'}{os.pathsep}{environment.get('PATH', '')}"
        return environment

    async def start_install(self) -> EngineInstall:
        if not self.descriptor():
            raise HTTPException(503, "El instalador del motor aun no esta publicado.")
        if any(item.state in {"downloading", "verifying", "installing"} for item in self.installs.values()):
            raise HTTPException(409, "Ya hay una instalacion del motor activa.")
        install = EngineInstall(id=uuid.uuid4().hex)
        self.installs[install.id] = install
        install.task = asyncio.create_task(self._run_install(install), name=f"engine-install-{install.id}")
        await install.publish("engine_install_progress", install=install.public())
        return install

    def get_install(self, install_id: str) -> EngineInstall:
        install = self.installs.get(install_id)
        if not install:
            raise HTTPException(404, "Instalacion del motor no encontrada.")
        return install

    async def cancel(self, install: EngineInstall) -> None:
        if install.state in {"downloading", "verifying", "installing"}:
            install.cancel_event.set()

    async def _run_install(self, install: EngineInstall) -> None:
        try:
            await asyncio.to_thread(self._install_sync, install)
            install.state, install.percentage, install.message = "completed", 100, "Audio Engine Pack instalado."
            install.updated_at = utc_now()
            await install.publish("completed", install=install.public())
        except EnginePackError as exc:
            if install.cancel_event.is_set():
                install.state, install.message = "cancelled", "Instalacion cancelada."
                await install.publish("cancelled", install=install.public())
            else:
                install.state, install.message = "failed", str(exc)
                await install.publish("error", install=install.public())
        except Exception:
            install.state, install.message = "failed", "No se pudo instalar el Audio Engine Pack."
            await install.publish("error", install=install.public())
        install.updated_at = utc_now()

    def _install_sync(self, install: EngineInstall) -> None:
        descriptor = self.descriptor()
        if not descriptor:
            raise EnginePackError("El manifiesto del motor no es valido.")
        with tempfile.TemporaryDirectory(prefix="felipe-audio-pack-") as temporary:
            archive = Path(temporary) / "engine-pack.zip"
            self._obtain_archive(descriptor, archive, install)
            install.state, install.percentage, install.message = "verifying", 72, "Verificando integridad..."
            hasher = hashlib.sha256()
            with archive.open("rb") as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    hasher.update(chunk)
            digest = hasher.hexdigest()
            if not hmac.compare_digest(digest.lower(), descriptor["sha256"].lower()):
                raise EnginePackError("La verificacion SHA-256 del motor fallo.")
            if install.cancel_event.is_set():
                raise EnginePackError("cancelled")
            install.state, install.percentage, install.message = "installing", 82, "Instalando componentes locales..."
            staging = self.root / f"staging-{install.id}"
            shutil.rmtree(staging, ignore_errors=True)
            staging.mkdir(parents=True)
            try:
                with zipfile.ZipFile(archive) as bundle:
                    for member in bundle.infolist():
                        target = (staging / member.filename).resolve()
                        if not target.is_relative_to(staging.resolve()):
                            raise EnginePackError("El paquete contiene una ruta no permitida.")
                    bundle.extractall(staging)
                pack_root = staging / "audio-engine-pack"
                if not self._validate_pack(pack_root):
                    raise EnginePackError("El paquete no contiene todos los componentes requeridos.")
                version = str(descriptor["version"])
                destination = (self.versions / version).resolve()
                if not destination.is_relative_to(self.versions.resolve()):
                    raise EnginePackError("Version de paquete no valida.")
                shutil.rmtree(destination, ignore_errors=True)
                shutil.move(str(pack_root), str(destination))
                (self.root / "current.json").write_text(json.dumps({"version": version}), encoding="utf-8")
            finally:
                shutil.rmtree(staging, ignore_errors=True)

    def _obtain_archive(self, descriptor: dict[str, Any], archive: Path, install: EngineInstall) -> None:
        url = str(descriptor["url"])
        if url.startswith("bundled:"):
            name = url.removeprefix("bundled:")
            if Path(name).name != name:
                raise EnginePackError("Referencia de paquete local no valida.")
            source = (self.descriptor_path.parent / name).resolve()
            if not source.is_file():
                raise EnginePackError("El instalador no contiene el Audio Engine Pack.")
            total = source.stat().st_size
            with source.open("rb") as reader, archive.open("wb") as writer:
                self._copy_stream(reader, writer, total, install)
            return
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or parsed.hostname not in ALLOWED_DOWNLOAD_HOSTS:
            raise EnginePackError("El origen de descarga del motor no esta permitido.")
        request = urllib.request.Request(url, headers={"User-Agent": "FelipeLocalTools/1.2"})
        with urllib.request.urlopen(request, timeout=60) as response, archive.open("wb") as writer:
            total = int(response.headers.get("Content-Length", descriptor.get("size", 0)))
            self._copy_stream(response, writer, total, install)

    @staticmethod
    def _copy_stream(reader: Any, writer: Any, total: int, install: EngineInstall) -> None:
        copied = 0
        while True:
            if install.cancel_event.is_set():
                raise EnginePackError("cancelled")
            chunk = reader.read(1024 * 1024)
            if not chunk:
                break
            writer.write(chunk)
            copied += len(chunk)
            install.percentage = min(70, copied / total * 70) if total else 25
            install.message = "Descargando Audio Engine Pack..."
            install.updated_at = utc_now()
