"""Registro de fuentes y gestor asincrono de trabajos musicales."""

from __future__ import annotations

import asyncio
import json
import os
import secrets
import shutil
import subprocess
import sys
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from local_tools.local_agent.artifacts import ArtifactService
from local_tools.local_agent.destinations import DestinationRegistry, ensure_within
from local_tools.local_agent.events import publish_event
from local_tools.local_agent.files import SourceRegistry
from local_tools.local_agent.media_sessions import MediaSessionService
from local_tools.local_agent.models import utc_now
from local_tools.local_agent.tasks import (
    TERMINAL_TASK_STATUSES,
    TaskCancelledError,
    TaskExecutionError,
    TaskManager,
)

from .contracts import (
    DEFAULT_MAX_DURATION_SECONDS,
    DEFAULT_MAX_FILE_BYTES,
    TERMINAL_STATES,
)
from .engine.validation import validate_source


@dataclass
class MusicJob:
    id: str
    created_at: str
    state: str = "created"
    percentage: float = 0.0
    phase_percentage: float | None = None
    message: str = "Trabajo creado."
    updated_at: str = field(default_factory=utc_now)
    error: dict[str, str] | None = None
    artifacts: list[dict[str, Any]] = field(default_factory=list)
    artifact_paths: dict[str, Path] = field(default_factory=dict, repr=False)
    output_dir: Path | None = field(default=None, repr=False)
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event, repr=False)
    events: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=500), repr=False)
    subscribers: set[asyncio.Queue] = field(default_factory=set, repr=False)
    event_sequence: int = 0
    task: asyncio.Task | None = field(default=None, repr=False)
    process: asyncio.subprocess.Process | None = field(default=None, repr=False)

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "state": self.state,
            "percentage": round(self.percentage, 1),
            "phasePercentage": (
                round(self.phase_percentage, 1) if self.phase_percentage is not None else None
            ),
            "message": self.message,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "error": self.error,
            "artifacts": self.artifacts,
        }

    async def publish(self, event_type: str, **data: Any) -> None:
        await publish_event(self, event_type, **data)


@dataclass(frozen=True)
class MediaSession:
    id: str
    job_id: str
    artifact_id: str
    path: Path
    origin: str
    expires_at: float


class MusicJobManager:
    def __init__(
        self,
        runtime_root: Path,
        *,
        worker_command: list[str] | None = None,
        model_root: Path | None = None,
        engine_pack=None,
        task_manager: TaskManager | None = None,
        artifact_service: ArtifactService | None = None,
        media_session_service: MediaSessionService | None = None,
    ):
        self.root = Path(runtime_root).resolve()
        self.jobs_root = ensure_within(self.root / "jobs", self.root)
        self.outputs_root = ensure_within(self.root / "outputs", self.root)
        self.logs_root = ensure_within(self.root / "logs", self.root)
        self.model_root = Path(model_root or self.root / "models" / "demucs").resolve()
        for path in (self.jobs_root, self.outputs_root, self.logs_root, self.model_root):
            path.mkdir(parents=True, exist_ok=True)
        self.sources = SourceRegistry(
            validator=lambda path: validate_source(
                path,
                max_file_bytes=DEFAULT_MAX_FILE_BYTES,
                max_duration_seconds=DEFAULT_MAX_DURATION_SECONDS,
            )
        )
        self.destinations = DestinationRegistry()
        self.jobs: dict[str, MusicJob] = {}
        self._lock = asyncio.Lock()
        self.engine_pack = engine_pack
        self.worker_command = worker_command or (
            None if engine_pack else [sys.executable, "-m", "local_tools.music_analyzer.worker"]
        )
        self.task_manager = task_manager
        self.artifact_service = artifact_service or ArtifactService()
        self.media_session_service = media_session_service or MediaSessionService()

    def get(self, job_id: str) -> MusicJob:
        job = self.jobs.get(job_id)
        if not job:
            raise HTTPException(404, "Analisis musical no encontrado.")
        return job

    async def create(self, body: dict[str, Any]) -> MusicJob:
        async with self._lock:
            if not self._worker_command():
                raise HTTPException(409, "Instala el Audio Engine Pack antes de analizar.")
            if any(job.state not in TERMINAL_STATES for job in self.jobs.values()):
                raise HTTPException(409, "Ya hay un analisis musical activo.")
            source = self.sources.get(str(body["sourceId"]))
            job_id = uuid.uuid4().hex
            parent = self.outputs_root
            destination_id = body.get("destinationId")
            if destination_id:
                parent = self.destinations.consume(str(destination_id))
                if parent is None:
                    raise HTTPException(400, "La autorizacion de carpeta expiro.")
            output = (parent / f"music-analysis-{job_id[:8]}").resolve()
            output.mkdir(parents=True, exist_ok=False)
            job_dir = ensure_within(self.jobs_root / job_id, self.jobs_root)
            job_dir.mkdir(parents=True, exist_ok=False)
            request_payload = {
                "jobId": job_id,
                "sourcePath": str(source.path),
                "outputDir": str(output),
                "tasks": body.get("tasks", {}),
                "separation": body.get("separation", {}),
                "audio": body.get("audio", {}),
            }
            request_path = job_dir / "request.json"
            request_path.write_text(json.dumps(request_payload), encoding="utf-8")
            job = MusicJob(id=job_id, created_at=utc_now(), output_dir=output)
            self.jobs[job_id] = job
            self._save(job)
            if self.task_manager:
                self.task_manager.create(
                    task_id=job.id,
                    capability="music-analyzer",
                    operation="analyze",
                    message=job.message,
                    metadata={"legacy": job.public()},
                )
                self.task_manager.attach_cancel_handler(job.id, lambda job=job: self.cancel(job))
            if self.task_manager:
                job.task = self.task_manager.launch(
                    job.id,
                    lambda job=job, request_path=request_path: self._run(job, request_path),
                )
            else:
                job.task = asyncio.create_task(self._run(job, request_path), name=f"music-{job_id}")
            await job.publish("job_created", jobId=job.id, job=job.public())
            return job

    async def _run(self, job: MusicJob, request_path: Path) -> None:
        job.state = "queued"
        job.updated_at = utc_now()
        await job.publish("job_progress", jobId=job.id, **self._progress_payload(job))
        creation_flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        try:
            job.process = await asyncio.create_subprocess_exec(
                *self._worker_command(),
                str(request_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
                creationflags=creation_flags,
                env={**self._worker_environment(), "FELIPE_MUSIC_MODEL_ROOT": str(self.model_root)},
            )
            assert job.process.stdout
            while True:
                if job.cancel_event.is_set():
                    job.process.terminate()
                    await job.process.wait()
                    job.state = "cancelled"
                    job.message = "Analisis cancelado."
                    job.updated_at = utc_now()
                    if self.task_manager:
                        self.task_manager.finalize(
                            job.id,
                            status="cancelled",
                            phase="cancelled",
                            message=job.message,
                        )
                    await job.publish("cancelled", jobId=job.id, job=job.public())
                    self._save(job)
                    raise TaskCancelledError()
                try:
                    line = await asyncio.wait_for(job.process.stdout.readline(), timeout=0.2)
                except TimeoutError:
                    if job.process.returncode is not None:
                        break
                    continue
                if not line:
                    break
                try:
                    event = json.loads(line.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
                await self._apply_worker_event(job, event)
            code = await job.process.wait()
            if job.state not in TERMINAL_STATES:
                raise RuntimeError(f"worker_exit_{code}")
            result = {"artifacts": job.artifacts}
            if self.task_manager and self.task_manager.get(job.id).status not in TERMINAL_TASK_STATUSES:
                self.task_manager.finalize(
                    job.id,
                    status="completed",
                    result=result,
                    phase="completed",
                    message=job.message,
                )
            return result
        except TaskCancelledError:
            raise
        except Exception as exc:
            if job.state not in TERMINAL_STATES:
                job.state = "failed"
                job.message = "El motor musical finalizo inesperadamente."
                job.error = {"code": "worker_failed", "message": job.message}
                job.updated_at = utc_now()
                if self.task_manager:
                    self.task_manager.finalize(
                        job.id,
                        status="failed",
                        error=job.error,
                        phase="failed",
                        message=job.message,
                    )
                await job.publish("error", jobId=job.id, error=job.error, job=job.public())
                self._save(job)
            raise TaskExecutionError(
                job.error.get("code", "worker_failed") if job.error else "worker_failed",
                job.error.get("message", job.message) if job.error else str(exc),
            ) from exc
        finally:
            request_path.unlink(missing_ok=True)

    def _worker_command(self) -> list[str] | None:
        if self.engine_pack:
            return self.engine_pack.worker_command("local_tools.music_analyzer.worker")
        return self.worker_command

    def _worker_environment(self) -> dict[str, str]:
        return self.engine_pack.worker_environment() if self.engine_pack else os.environ.copy()

    async def _apply_worker_event(self, job: MusicJob, event: dict[str, Any]) -> None:
        event_type = event.get("type")
        if event_type == "job_progress":
            reported_state = str(event.get("state", job.state))
            # El resultado y sus rutas internas se validan antes de publicar el terminal.
            job.state = "exporting" if reported_state == "completed" else reported_state
            job.percentage = float(event.get("percentage", job.percentage))
            job.phase_percentage = event.get("phasePercentage")
            job.message = str(event.get("message", job.message))
            job.updated_at = str(event.get("updatedAt", utc_now()))
            if self.task_manager:
                self.task_manager.update(
                    job.id,
                    status="running",
                    progress=job.percentage,
                    message=job.message,
                    phase=job.state,
                    metadata={"legacy": job.public()},
                    source_event="job_progress",
                )
            await job.publish("job_progress", jobId=job.id, **self._progress_payload(job))
        elif event_type == "job_result":
            internal = {item["id"]: Path(item["path"]).resolve() for item in event.get("internalArtifacts", [])}
            for artifact_id, path in internal.items():
                if not job.output_dir or not path.is_relative_to(job.output_dir.resolve()) or not path.is_file():
                    raise RuntimeError("invalid_worker_artifact")
            job.artifacts = list(event.get("artifacts", []))
            job.artifact_paths = internal
            self.artifact_service.register(job.id, job.artifacts, job.artifact_paths)
            job.state = "completed"
            job.percentage = 100
            job.phase_percentage = 100
            job.message = "Analisis completado."
            job.updated_at = utc_now()
            if self.task_manager:
                self.task_manager.finalize(
                    job.id,
                    status="completed",
                    result={"artifacts": job.artifacts},
                    phase="completed",
                    message=job.message,
                )
            await job.publish("completed", jobId=job.id, job=job.public())
        elif event_type == "job_error":
            code = str(event.get("code", "engine_failed"))
            if code == "cancelled":
                job.state = "cancelled"
                job.message = "Analisis cancelado."
                job.updated_at = utc_now()
                self._save(job)
                if self.task_manager:
                    self.task_manager.finalize(
                        job.id,
                        status="cancelled",
                        phase="cancelled",
                        message=job.message,
                    )
                await job.publish("cancelled", jobId=job.id, job=job.public())
                raise TaskCancelledError()
            else:
                job.state = "failed"
                job.message = str(event.get("message", "El analisis musical fallo."))
                job.error = {"code": code, "message": job.message}
                job.updated_at = utc_now()
                self._save(job)
                if self.task_manager:
                    self.task_manager.finalize(
                        job.id,
                        status="failed",
                        error=job.error,
                        phase="failed",
                        message=job.message,
                    )
                await job.publish("error", jobId=job.id, error=job.error, job=job.public())
                raise TaskExecutionError(code, job.message) from None
            job.updated_at = utc_now()
        self._save(job)

    @staticmethod
    def _progress_payload(job: MusicJob) -> dict[str, Any]:
        return {
            "state": job.state,
            "percentage": job.percentage,
            "phasePercentage": job.phase_percentage,
            "message": job.message,
            "updatedAt": job.updated_at,
        }

    async def cancel(self, job: MusicJob) -> None:
        if job.state in TERMINAL_STATES:
            return
        job.state = "cancelling"
        job.message = "Cancelando analisis..."
        job.cancel_event.set()
        job.updated_at = utc_now()
        await job.publish("job_progress", jobId=job.id, **self._progress_payload(job))
        self._save(job)

    def delete(self, job: MusicJob) -> None:
        if job.state not in TERMINAL_STATES:
            raise HTTPException(409, "No se puede eliminar un trabajo activo.")
        self.jobs.pop(job.id, None)
        if self.task_manager:
            self.task_manager.delete(job.id)
        if self.media_session_service:
            self.media_session_service.revoke_job_sessions(job.id)
        if self.artifact_service:
            self.artifact_service.delete_job(job.id)
        if job.output_dir and job.output_dir.is_dir():
            shutil.rmtree(job.output_dir)
        job_dir = ensure_within(self.jobs_root / job.id, self.jobs_root)
        if job_dir.is_dir():
            shutil.rmtree(job_dir)

    def artifact(self, job: MusicJob, artifact_id: str) -> tuple[dict[str, Any], Path]:
        try:
            return self.artifact_service.get(job.id, artifact_id)
        except KeyError as exc:
            raise HTTPException(404, "Artefacto no encontrado.") from exc

    def create_media_session(self, job: MusicJob, artifact_id: str, origin: str) -> MediaSession:
        metadata, path = self.artifact(job, artifact_id)
        if not metadata.get("playable"):
            raise HTTPException(409, "El artefacto no se puede reproducir.")
        try:
            session = self.media_session_service.create(job.id, artifact_id, path, origin)
        except Exception as exc:
            raise HTTPException(500, "No se pudo crear la sesion de reproduccion.") from exc
        return session

    def get_media_session(self, session_id: str, origin: str) -> MediaSession:
        try:
            return self.media_session_service.get(session_id, origin)
        except KeyError as exc:
            raise HTTPException(404, "La sesion de reproduccion expiro.") from exc

    def _save(self, job: MusicJob) -> None:
        job_dir = ensure_within(self.jobs_root / job.id, self.jobs_root)
        job_dir.mkdir(parents=True, exist_ok=True)
        manifest = job.public()
        (job_dir / "job.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
