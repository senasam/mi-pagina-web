"""API heredada de Instagram y facade hacia el Local Agent neutral."""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import sys
import uuid
from collections import deque
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import Field, field_validator

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from local_tools.local_agent.config import DEFAULT_PORT, load_or_create_config
from local_tools.local_agent.destinations import DestinationRegistry, ensure_within
from local_tools.local_agent.events import publish_event, stream_events
from local_tools.local_agent.models import StrictRequest, utc_now
from local_tools.local_agent.runtime import AgentPaths, project_runtime
from local_tools.local_agent.tasks import TaskCancelledError, TaskExecutionError, TaskManager

try:
    from .instagram_exporter import (
        ExportCancelled,
        ExportConfig,
        InstagramExportEngine,
        profile_url,
        profile_url_from_browser_url,
    )
except ImportError:  # Compatibilidad al ejecutar/importar agent.py directamente.
    from instagram_exporter import (
        ExportCancelled,
        ExportConfig,
        InstagramExportEngine,
        profile_url,
        profile_url_from_browser_url,
    )

AGENT_VERSION = "1.3.0"
TERMINAL_STATES = {"completed", "cancelled", "failed"}
ALLOWED_STATES = {
    "created", "opening_browser", "awaiting_login", "collecting_posts",
    "awaiting_selection", "exporting", "organizing", "completed",
    "cancelling", "cancelled", "failed",
}
TASK_STATUS_BY_NATIVE_STATE = {
    "created": "queued",
    "opening_browser": "starting",
    "awaiting_login": "waiting_for_user",
    "collecting_posts": "running",
    "awaiting_selection": "waiting_for_user",
    "exporting": "running",
    "organizing": "running",
    "cancelling": "running",
    "completed": "completed",
    "cancelled": "cancelled",
    "failed": "failed",
}

def validate_profile(value: str) -> str:
    if not value or len(value) > 200:
        raise ValueError("Escribe un usuario o URL de Instagram valido.")
    return profile_url(value)


class ExportRequest(StrictRequest):
    profile: str = Field(min_length=1, max_length=200)
    max_posts: int = Field(default=0, alias="maxPosts", ge=0, le=100_000)
    organize_after_export: bool = Field(default=False, alias="organizeAfterExport")
    ai_provider: str = Field(default="ollama", alias="aiProvider")
    ollama_model: str = Field(default="qwen3-vl:4b", alias="ollamaModel", max_length=100)
    openai_model: str = Field(default="gpt-4.1-mini", alias="openaiModel", max_length=100)
    destination_id: str | None = Field(default=None, alias="destinationId", max_length=64)

    @field_validator("profile")
    @classmethod
    def profile_is_valid(cls, value: str) -> str:
        validate_profile(value)
        return value.strip()

    @field_validator("ai_provider")
    @classmethod
    def provider_is_valid(cls, value: str) -> str:
        if value not in {"ollama", "openai"}:
            raise ValueError("Proveedor de IA no valido.")
        return value


class SelectionRequest(StrictRequest):
    count: int = Field(ge=0, le=100_000)


class CredentialRequest(StrictRequest):
    openai_api_key: str = Field(alias="openaiApiKey", min_length=20, max_length=300)


@dataclass
class Job:
    id: str
    profile: str
    created_at: str
    state: str = "created"
    total_found: int = 0
    selected_count: int = 0
    current_post: int = 0
    current_post_url: str = ""
    percentage: float = 0.0
    message: str = "Trabajo creado."
    output_folder: str = ""
    error: str | None = None
    organize_after_export: bool = False
    ai_provider: str = "ollama"
    model: str = ""
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event, repr=False)
    events: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=500), repr=False)
    subscribers: set[asyncio.Queue] = field(default_factory=set, repr=False)
    interaction: "ApiInteraction | None" = field(default=None, repr=False)
    task: asyncio.Task | None = field(default=None, repr=False)
    event_sequence: int = 0

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id, "state": self.state, "profile": self.profile,
            "createdAt": self.created_at, "totalFound": self.total_found,
            "selectedCount": self.selected_count, "currentPost": self.current_post,
            "currentPostUrl": self.current_post_url,
            "percentage": round(self.percentage, 2), "message": self.message,
            "outputFolder": self.output_folder, "error": self.error,
            "organizeAfterExport": self.organize_after_export,
            "aiProvider": self.ai_provider, "model": self.model,
        }

    async def publish(self, event_type: str, **data: Any) -> None:
        await publish_event(self, event_type, **data)


class ApiInteraction:
    def __init__(self, job: Job) -> None:
        self.job = job
        self.login_event = asyncio.Event()
        self.selection_event = asyncio.Event()
        self.context: Any = None
        self.page: Any = None
        self.target = ""
        self.selection: int | None = None

    async def wait_for_login(self, context: Any, page: Any, target: str) -> tuple[Any, str]:
        self.context, self.page, self.target = context, page, target
        login_wait = asyncio.create_task(self.login_event.wait())
        cancel_wait = asyncio.create_task(self.job.cancel_event.wait())
        done, pending = await asyncio.wait({login_wait, cancel_wait}, return_when=asyncio.FIRST_COMPLETED)
        for item in pending:
            item.cancel()
        if cancel_wait in done:
            raise ExportCancelled()
        pages = [candidate for candidate in context.pages if not candidate.is_closed()]
        instagram = [candidate for candidate in pages if "instagram.com" in (urlparse(candidate.url).netloc or "").lower()]
        active = instagram[-1] if instagram else page
        detected = profile_url_from_browser_url(active.url)
        if detected != target:
            raise RuntimeError("Chrome no esta en el perfil solicitado de Instagram.")
        return active, detected

    async def choose_count(self, total: int, requested_limit: int) -> int:
        if requested_limit > 0:
            return min(total, requested_limit)
        selection_wait = asyncio.create_task(self.selection_event.wait())
        cancel_wait = asyncio.create_task(self.job.cancel_event.wait())
        done, pending = await asyncio.wait({selection_wait, cancel_wait}, return_when=asyncio.FIRST_COMPLETED)
        for item in pending:
            item.cancel()
        if cancel_wait in done:
            raise ExportCancelled()
        selected = self.selection or total
        return min(total, selected)

    def browser_is_on_target_profile(self) -> bool:
        if not self.context:
            return False
        pages = [candidate for candidate in self.context.pages if not candidate.is_closed()]
        instagram = [candidate for candidate in pages if "instagram.com" in (urlparse(candidate.url).netloc or "").lower()]
        if not instagram:
            return False
        return profile_url_from_browser_url(instagram[-1].url) == self.target


class JobManager:
    def __init__(
        self,
        paths: AgentPaths,
        *,
        max_history: int = 50,
        engine_factory: Callable[..., Any] = InstagramExportEngine,
        task_manager: TaskManager | None = None,
    ) -> None:
        self.paths = paths
        self.max_history = max_history
        self.engine_factory = engine_factory
        self.jobs: dict[str, Job] = {}
        self.order: deque[str] = deque()
        self.destinations = DestinationRegistry()
        self._lock = asyncio.Lock()
        self.task_manager = task_manager

    def attach_task_manager(self, task_manager: TaskManager) -> None:
        self.task_manager = task_manager

    async def _publish(self, target: Job, event_type: str, **data: Any) -> None:
        await target.publish(event_type, **data)
        if not self.task_manager:
            return
        status = TASK_STATUS_BY_NATIVE_STATE.get(target.state, "running")
        if status in {"completed", "failed", "cancelled"}:
            return
        self.task_manager.update(
            target.id,
            status=status,
            progress=target.percentage,
            message=target.message,
            phase=target.state,
            metadata={"legacy": target.public()},
            source_event=event_type,
        )

    def get(self, job_id: str) -> Job:
        job = self.jobs.get(job_id)
        if not job:
            raise HTTPException(404, "Exportacion no encontrada.")
        return job

    async def create(self, request: ExportRequest) -> Job:
        async with self._lock:
            if any(job.state not in TERMINAL_STATES for job in self.jobs.values()):
                raise HTTPException(409, "Ya hay una exportacion activa para el perfil persistente.")
            while len(self.order) >= self.max_history:
                oldest = self.order.popleft()
                self.jobs.pop(oldest, None)
            job_id = uuid.uuid4().hex
            canonical = validate_profile(request.profile)
            username = urlparse(canonical).path.strip("/")
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            parent = self.paths.exports
            if request.destination_id:
                parent = self.destinations.consume(request.destination_id)
                if parent is None:
                    raise HTTPException(400, "La autorizacion de carpeta expiro; seleccionala otra vez.")
            output = (parent / f"{username}_{stamp}_{job_id[:6]}").resolve()
            output.mkdir(parents=True, exist_ok=False)
            job = Job(
                id=job_id, profile=canonical, created_at=utc_now(),
                output_folder=str(output), organize_after_export=request.organize_after_export,
                ai_provider=request.ai_provider,
                model=request.ollama_model if request.ai_provider == "ollama" else request.openai_model,
            )
            interaction = ApiInteraction(job)
            job.interaction = interaction
            self.jobs[job_id] = job
            self.order.append(job_id)
            if self.task_manager:
                self.task_manager.create(
                    task_id=job.id,
                    capability="instagram-exporter",
                    operation="export-account",
                    message=job.message,
                    metadata={"legacy": job.public()},
                )
                self.task_manager.attach_cancel_handler(
                    job.id,
                    lambda job=job: self.cancel(job),
                )
            if self.task_manager:
                job.task = self.task_manager.launch(
                    job.id,
                    lambda job=job, request=request, output=output: self._run(job, request, output),
                )
            else:
                job.task = asyncio.create_task(self._run(job, request, output), name=f"instagram-{job_id}")
            await job.publish("state_changed", state="created", job=job.public())
            return job

    async def _engine_event(self, job: Job, event_type: str, data: dict[str, Any]) -> None:
        state = data.get("state")
        if state in ALLOWED_STATES:
            job.state = state
        if "message" in data:
            job.message = str(data["message"])
        if event_type in {"posts_detected", "total_found"}:
            job.total_found = int(data.get("total", 0))
        elif event_type == "selection_applied":
            job.selected_count = int(data.get("selected", 0))
        elif event_type in {"post_started", "post_completed"}:
            job.current_post = int(data.get("index", 0))
            job.current_post_url = str(data.get("url", job.current_post_url))
            denominator = job.selected_count or int(data.get("total", 0))
            job.percentage = (job.current_post / denominator * 100) if denominator else 0
        await self._publish(job, event_type, **data, job=job.public())

    async def _run(self, job: Job, request: ExportRequest, output: Path) -> None:
        engine = self.engine_factory(
            ExportConfig(
                profile=job.profile, output_dir=output, session_dir=self.paths.session,
                max_posts=request.max_posts, browser="chrome", headless=False,
            ),
            job.interaction,
            on_event=lambda event, data: self._engine_event(job, event, data),
            cancel_event=job.cancel_event,
        )
        try:
            result = await engine.run()
            if request.organize_after_export:
                await self._organize(job, output)
            job.state = "completed"
            job.percentage = 100
            job.message = "Exportacion completada."
            if self.task_manager:
                self.task_manager.finalize(
                    job.id,
                    status="completed",
                    result=result if isinstance(result, dict) else {"outputFolder": job.output_folder},
                    phase="completed",
                    message=job.message,
                )
            await self._publish(job, "completed", result=result, job=job.public())
            return result if isinstance(result, dict) else {"outputFolder": job.output_folder}
        except ExportCancelled:
            job.state = "cancelled"
            job.message = "Exportacion cancelada; se conservaron los archivos procesados."
            if self.task_manager:
                self.task_manager.finalize(
                    job.id,
                    status="cancelled",
                    phase="cancelled",
                    message=job.message,
                )
            await self._publish(job, "cancelled", job=job.public())
            raise TaskCancelledError() from None
        except Exception as exc:  # noqa: BLE001
            organization_failed = job.state == "organizing"
            job.state = "failed"
            job.error = str(exc)
            job.message = (
                "La exportacion se conservo, pero la organizacion con IA fallo."
                if organization_failed else "La exportacion fallo."
            )
            if self.task_manager:
                self.task_manager.finalize(
                    job.id,
                    status="failed",
                    error={
                        "code": "INSTAGRAM_EXPORT_FAILED",
                        "message": job.message,
                        "retryable": True,
                    },
                    phase=job.state,
                    message=job.message,
                )
            await self._publish(job, "error", message=str(exc), job=job.public())
            raise TaskExecutionError(
                "INSTAGRAM_EXPORT_FAILED",
                job.message,
            ) from exc

    async def _organize(self, job: Job, output: Path) -> None:
        job.state = "organizing"
        job.message = "Organizando archivos con IA..."
        await self._publish(job, "state_changed", state="organizing", job=job.public())
        await self._publish(job, "organization_started", provider=job.ai_provider, model=job.model)
        model_was_missing = False
        if job.ai_provider == "ollama":
            try:
                listed = await asyncio.to_thread(
                    subprocess.run, ["ollama", "list"], capture_output=True,
                    text=True, timeout=30, check=True,
                )
                installed = {line.split()[0] for line in listed.stdout.splitlines()[1:] if line.split()}
                model_was_missing = job.model not in installed and f"{job.model}:latest" not in installed
            except Exception:  # noqa: BLE001
                model_was_missing = True
            if model_was_missing:
                await self._publish(job, "model_download_started", provider="ollama", model=job.model)
        script = Path(__file__).with_name("organizar_multimedia.py")
        command = [sys.executable]
        if getattr(sys, "frozen", False):
            command.append("--organize-worker")
        else:
            command.append(str(script))
        command.extend(["--root", str(output), "--model", job.model, "--deps-ready"])
        if job.ai_provider == "openai":
            command.extend(["--provider", "openai", "--api-key-file", str(self.paths.root / "openai.key")])
        process = await asyncio.create_subprocess_exec(
            *command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        assert process.stdout
        while True:
            if job.cancel_event.is_set():
                process.terminate()
                await process.wait()
                raise ExportCancelled()
            try:
                line = await asyncio.wait_for(process.stdout.readline(), timeout=0.5)
            except TimeoutError:
                continue
            if not line:
                break
            text = line.decode("utf-8", "replace").strip()
            if text:
                await self._publish(job, "organization_progress", message=text[:500])
        code = await process.wait()
        if code:
            raise RuntimeError(f"La exportacion se completo, pero la organizacion con IA fallo (codigo {code}).")
        if model_was_missing:
            await self._publish(job, "model_download_completed", provider="ollama", model=job.model)
        await self._publish(job, "organization_completed", provider=job.ai_provider, model=job.model)

    async def cancel(self, job: Job) -> None:
        if job.state in TERMINAL_STATES:
            return
        job.state = "cancelling"
        job.message = "Cancelando y cerrando Chrome..."
        job.cancel_event.set()
        await self._publish(job, "state_changed", state="cancelling", job=job.public())
        await self._publish(job, "cancellation_requested")

    def register_destination(self, path: Path) -> tuple[str, str]:
        return self.destinations.register(path)


def chrome_available() -> bool:
    candidates = [
        Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Google/Chrome/Application/chrome.exe",
    ]
    return any(path.is_file() for path in candidates)


def chromium_available() -> bool:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            return Path(playwright.chromium.executable_path).is_file()
    except Exception:  # noqa: BLE001
        return False


def ollama_available() -> bool:
    return shutil.which("ollama") is not None


def choose_folder() -> Path | None:
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    try:
        selected = filedialog.askdirectory(title="Selecciona la carpeta para la exportacion de Instagram", mustexist=True)
        return Path(selected).resolve() if selected else None
    finally:
        root.destroy()


def register_instagram_routes(
    app: FastAPI,
    *,
    paths: AgentPaths,
    manager: JobManager,
) -> None:
    """Monta la API heredada sin poseer el servidor FastAPI."""

    @app.post("/exports", status_code=202)
    async def create_export(body: ExportRequest) -> dict[str, Any]:
        job = await manager.create(body)
        return {"id": job.id, "job": job.public()}

    @app.get("/exports/{job_id}")
    async def get_export(job_id: str) -> dict[str, Any]:
        return manager.get(job_id).public()

    @app.post("/exports/{job_id}/continue")
    async def continue_export(job_id: str) -> dict[str, Any]:
        job = manager.get(job_id)
        if job.state != "awaiting_login" or not job.interaction:
            raise HTTPException(409, "La exportacion no esta esperando el login.")
        if not job.interaction.browser_is_on_target_profile():
            raise HTTPException(409, "Abre exactamente el perfil solicitado; no login, inicio, explorar, challenge ni una publicacion.")
        job.interaction.login_event.set()
        return job.public()

    @app.post("/exports/{job_id}/selection")
    async def select_export(job_id: str, body: SelectionRequest) -> dict[str, Any]:
        job = manager.get(job_id)
        if job.state != "awaiting_selection" or not job.interaction:
            raise HTTPException(409, "La exportacion no esta esperando una seleccion.")
        if body.count > job.total_found:
            raise HTTPException(422, "La seleccion supera el total encontrado.")
        job.interaction.selection = body.count
        job.interaction.selection_event.set()
        return job.public()

    @app.post("/exports/{job_id}/cancel", status_code=202)
    async def cancel_export(job_id: str) -> dict[str, Any]:
        job = manager.get(job_id)
        await manager.cancel(job)
        return job.public()

    @app.get("/exports/{job_id}/events")
    async def export_events(job_id: str, request: Request, last_event_id: int = 0) -> StreamingResponse:
        job = manager.get(job_id)
        stream = stream_events(
            job,
            request,
            last_event_id=last_event_id,
            terminal_states=TERMINAL_STATES,
            terminal_event_types={"completed", "cancelled", "error"},
        )
        return StreamingResponse(stream, media_type="text/event-stream", headers={"X-Accel-Buffering": "no"})

    @app.post("/destinations/select")
    async def select_destination() -> dict[str, str]:
        selected = await asyncio.to_thread(choose_folder)
        if selected is None:
            raise HTTPException(409, "No se selecciono una carpeta.")
        destination_id, label = manager.register_destination(selected)
        return {"id": destination_id, "label": label}

    @app.post("/credentials/openai", status_code=204)
    async def store_openai_key(body: CredentialRequest) -> Response:
        key_file = ensure_within(paths.root / "openai.key", paths.root)
        key_file.write_text(body.openai_api_key.strip(), encoding="utf-8")
        return Response(status_code=204)

    @app.post("/exports/{job_id}/open-output", status_code=204)
    async def open_output(job_id: str) -> Response:
        job = manager.get(job_id)
        path = Path(job.output_folder).resolve()
        if not path.is_dir():
            raise HTTPException(404, "La carpeta de salida ya no existe.")
        if os.name == "nt":
            os.startfile(path)  # type: ignore[attr-defined]
        return Response(status_code=204)


def create_app(
    *,
    paths: AgentPaths | None = None,
    config: dict[str, Any] | None = None,
    manager: JobManager | None = None,
    music_manager: Any | None = None,
    model_manager: Any | None = None,
    engine_pack_manager: Any | None = None,
) -> FastAPI:
    """Facade compatible; el composition root real vive en local_agent."""
    from local_tools.local_agent.app import create_agent_app

    return create_agent_app(
        paths=paths,
        config=config,
        instagram_manager=manager,
        music_manager=music_manager,
        model_manager=model_manager,
        engine_pack_manager=engine_pack_manager,
    )


def main() -> int:
    """Alias heredado para scripts e instalaciones anteriores."""
    from local_tools.local_agent.main import main as local_agent_main

    return local_agent_main()


if __name__ == "__main__":
    raise SystemExit(main())
