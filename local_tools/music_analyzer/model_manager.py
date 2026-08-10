"""Catalogo permitido y descargas explicitas de modelos Demucs."""

from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from local_tools.local_agent.events import publish_event
from local_tools.local_agent.models import utc_now

from .contracts import EngineError
from .model_store import marker_path, validate_installed_model

MODEL_CATALOG = {
    "htdemucs": {
        "name": "Demucs 4 pistas",
        "description": "Voz, bateria, bajo y otros.",
        "downloadBytesApprox": 90 * 1024 * 1024,
        "recommendedRamBytes": 8 * 1024**3,
    },
    "htdemucs_6s": {
        "name": "Demucs 6 pistas",
        "description": "Agrega guitarra y piano.",
        "downloadBytesApprox": 100 * 1024 * 1024,
        "recommendedRamBytes": 12 * 1024**3,
    },
}


@dataclass
class ModelPull:
    id: str
    model_id: str
    state: str = "downloading"
    percentage: float = 0
    message: str = "Preparando descarga."
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event, repr=False)
    events: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=200), repr=False)
    subscribers: set[asyncio.Queue] = field(default_factory=set, repr=False)
    event_sequence: int = 0
    task: asyncio.Task | None = field(default=None, repr=False)
    process: asyncio.subprocess.Process | None = field(default=None, repr=False)

    def public(self) -> dict[str, Any]:
        return {"id": self.id, "engine": "demucs", "modelId": self.model_id, "state": self.state, "percentage": self.percentage, "message": self.message, "createdAt": self.created_at, "updatedAt": self.updated_at}

    async def publish(self, event_type: str, **data: Any) -> None:
        await publish_event(self, event_type, **data)


class ModelManager:
    def __init__(self, model_root: Path, *, worker_command: list[str] | None = None, engine_pack=None):
        self.root = Path(model_root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.pulls: dict[str, ModelPull] = {}
        self.engine_pack = engine_pack
        self.worker_command = worker_command or (
            None if engine_pack else [sys.executable, "-m", "local_tools.music_analyzer.model_worker"]
        )

    def catalog(self) -> list[dict[str, Any]]:
        result = []
        for model_id, metadata in MODEL_CATALOG.items():
            try:
                installed = validate_installed_model(self.root, model_id)
            except EngineError:
                installed = None
            result.append({"engine": "demucs", "id": model_id, **metadata, "state": "installed" if installed else "not-installed", "sizeBytes": sum(item.get("size", 0) for item in (installed or {}).get("checkpoints", []))})
        return result

    def get_pull(self, pull_id: str) -> ModelPull:
        pull = self.pulls.get(pull_id)
        if not pull:
            raise HTTPException(404, "Descarga de modelo no encontrada.")
        return pull

    async def start_pull(self, model_id: str) -> ModelPull:
        if model_id not in MODEL_CATALOG:
            raise HTTPException(422, "Modelo no permitido.")
        if any(item.state == "downloading" for item in self.pulls.values()):
            raise HTTPException(409, "Ya hay una descarga de modelo activa.")
        if not self._worker_command():
            raise HTTPException(409, "Instala el Audio Engine Pack antes de descargar modelos.")
        pull = ModelPull(id=uuid.uuid4().hex, model_id=model_id)
        self.pulls[pull.id] = pull
        pull.task = asyncio.create_task(self._run_pull(pull), name=f"model-pull-{pull.id}")
        await pull.publish("model_pull_progress", pull=pull.public())
        return pull

    async def _run_pull(self, pull: ModelPull) -> None:
        environment = self.engine_pack.worker_environment() if self.engine_pack else os.environ.copy()
        environment["FELIPE_MUSIC_MODEL_ROOT"] = str(self.root)
        try:
            pull.process = await asyncio.create_subprocess_exec(
                *self._worker_command(),
                pull.model_id, str(self.root),
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                env=environment,
            )
            assert pull.process.stdout
            while True:
                if pull.cancel_event.is_set():
                    pull.process.terminate()
                    await pull.process.wait()
                    pull.state, pull.message = "cancelled", "Descarga cancelada."
                    await pull.publish("cancelled", pull=pull.public())
                    return
                try:
                    line = await asyncio.wait_for(pull.process.stdout.readline(), timeout=.2)
                except TimeoutError:
                    if pull.process.returncode is not None:
                        break
                    continue
                if not line:
                    break
                pull.percentage = min(95, pull.percentage + 5)
                pull.message = "Descargando y verificando el modelo..."
                pull.updated_at = utc_now()
                await pull.publish("model_pull_progress", pull=pull.public())
            code = await pull.process.wait()
            validate_installed_model(self.root, pull.model_id)
            if code:
                raise RuntimeError("model worker failed")
            pull.state, pull.percentage, pull.message = "completed", 100, "Modelo instalado."
            pull.updated_at = utc_now()
            await pull.publish("completed", pull=pull.public())
        except Exception:
            if pull.state != "cancelled":
                pull.state, pull.message = "failed", "No se pudo descargar el modelo."
                pull.updated_at = utc_now()
                await pull.publish("error", pull=pull.public())

    def _worker_command(self) -> list[str] | None:
        if self.engine_pack:
            return self.engine_pack.worker_command("local_tools.music_analyzer.model_worker")
        return self.worker_command

    async def cancel(self, pull: ModelPull) -> None:
        if pull.state == "downloading":
            pull.cancel_event.set()

    def delete(self, model_id: str) -> None:
        payload = validate_installed_model(self.root, model_id)
        for item in payload["checkpoints"]:
            checkpoint = (self.root / item["path"]).resolve()
            if checkpoint.is_relative_to(self.root):
                checkpoint.unlink(missing_ok=True)
        marker_path(self.root, model_id).unlink(missing_ok=True)
