"""Agente loopback autenticado para Instagram Exporter."""

from __future__ import annotations

import argparse
import asyncio
import hmac
import json
import logging
import os
import secrets
import shutil
import socket
import subprocess
import sys
import time
import uuid
from collections import deque
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, AsyncIterator, Callable
from urllib.parse import urlparse

from fastapi import FastAPI, Header, HTTPException, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from instagram_exporter import (
    ExportCancelled,
    ExportConfig,
    InstagramExportEngine,
    profile_url,
    profile_url_from_browser_url,
)

AGENT_VERSION = "1.0.0"
DEFAULT_PORT = 8765
TERMINAL_STATES = {"completed", "cancelled", "failed"}
ALLOWED_STATES = {
    "created", "opening_browser", "awaiting_login", "collecting_posts",
    "awaiting_selection", "exporting", "organizing", "completed",
    "cancelling", "cancelled", "failed",
}


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


def project_runtime() -> Path:
    override = os.environ.get("INSTAGRAM_AGENT_RUNTIME", "").strip()
    if override:
        return Path(override).expanduser().resolve()
    source = Path(__file__).resolve()
    if not getattr(sys, "frozen", False):
        return (source.parents[2] / "runtime" / "instagram_exporter").resolve()
    local = Path(os.environ.get("LOCALAPPDATA", source.parent))
    return (local / "FelipeMasanes" / "InstagramExporter" / "runtime" / "instagram_exporter").resolve()


def ensure_within(path: Path, root: Path) -> Path:
    resolved = path.expanduser().resolve()
    base = root.expanduser().resolve()
    try:
        resolved.relative_to(base)
    except ValueError as exc:
        raise ValueError("La ruta escapa del runtime autorizado.") from exc
    return resolved


@dataclass
class AgentPaths:
    root: Path
    session: Path
    exports: Path
    logs: Path
    config: Path

    @classmethod
    def create(cls, root: Path | None = None) -> "AgentPaths":
        base = (root or project_runtime()).resolve()
        paths = cls(
            root=base,
            session=base / "session",
            exports=base / "exports",
            logs=base / "logs",
            config=base / "agent-config.json",
        )
        for item in (paths.session, paths.exports, paths.logs):
            ensure_within(item, base).mkdir(parents=True, exist_ok=True)
        return paths


def load_or_create_config(paths: AgentPaths) -> dict[str, Any]:
    if paths.config.exists():
        data = json.loads(paths.config.read_text(encoding="utf-8"))
        if isinstance(data.get("token"), str) and len(data["token"]) >= 43:
            return data
    data = {
        "token": secrets.token_urlsafe(32),
        "port": int(os.environ.get("INSTAGRAM_AGENT_PORT", DEFAULT_PORT)),
        "allowedOrigins": [
            item.strip() for item in os.environ.get(
                "INSTAGRAM_AGENT_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,https://masanes.cl,https://www.masanes.cl",
            ).split(",") if item.strip()
        ],
        "createdAt": utc_now(),
    }
    paths.config.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data


def validate_profile(value: str) -> str:
    if not value or len(value) > 200:
        raise ValueError("Escribe un usuario o URL de Instagram valido.")
    return profile_url(value)


class ExportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
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


class SelectionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    count: int = Field(ge=0, le=100_000)


class CredentialRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
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
        self.event_sequence += 1
        event = {"id": self.event_sequence, "type": event_type, "at": utc_now(), **data}
        self.events.append(event)
        for queue in tuple(self.subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                pass


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
    def __init__(self, paths: AgentPaths, *, max_history: int = 50, engine_factory: Callable[..., Any] = InstagramExportEngine) -> None:
        self.paths = paths
        self.max_history = max_history
        self.engine_factory = engine_factory
        self.jobs: dict[str, Job] = {}
        self.order: deque[str] = deque()
        self.destinations: dict[str, Path] = {}
        self._lock = asyncio.Lock()

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
                parent = self.destinations.pop(request.destination_id, None)  # one-time authorization
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
        await job.publish(event_type, **data, job=job.public())

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
            await job.publish("completed", result=result, job=job.public())
        except ExportCancelled:
            job.state = "cancelled"
            job.message = "Exportacion cancelada; se conservaron los archivos procesados."
            await job.publish("cancelled", job=job.public())
        except Exception as exc:  # noqa: BLE001
            organization_failed = job.state == "organizing"
            job.state = "failed"
            job.error = str(exc)
            job.message = (
                "La exportacion se conservo, pero la organizacion con IA fallo."
                if organization_failed else "La exportacion fallo."
            )
            await job.publish("error", message=str(exc), job=job.public())

    async def _organize(self, job: Job, output: Path) -> None:
        job.state = "organizing"
        job.message = "Organizando archivos con IA..."
        await job.publish("state_changed", state="organizing", job=job.public())
        await job.publish("organization_started", provider=job.ai_provider, model=job.model)
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
                await job.publish("model_download_started", provider="ollama", model=job.model)
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
                await job.publish("organization_progress", message=text[:500])
        code = await process.wait()
        if code:
            raise RuntimeError(f"La exportacion se completo, pero la organizacion con IA fallo (codigo {code}).")
        if model_was_missing:
            await job.publish("model_download_completed", provider="ollama", model=job.model)
        await job.publish("organization_completed", provider=job.ai_provider, model=job.model)

    async def cancel(self, job: Job) -> None:
        if job.state in TERMINAL_STATES:
            return
        job.state = "cancelling"
        job.message = "Cancelando y cerrando Chrome..."
        job.cancel_event.set()
        await job.publish("state_changed", state="cancelling", job=job.public())
        await job.publish("cancellation_requested")

    def register_destination(self, path: Path) -> tuple[str, str]:
        resolved = path.expanduser().resolve()
        if not resolved.is_dir():
            raise ValueError("Selecciona una carpeta existente.")
        destination_id = secrets.token_urlsafe(24)
        self.destinations[destination_id] = resolved
        return destination_id, resolved.name


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


def create_app(*, paths: AgentPaths | None = None, config: dict[str, Any] | None = None, manager: JobManager | None = None) -> FastAPI:
    paths = paths or AgentPaths.create()
    config = config or load_or_create_config(paths)
    manager = manager or JobManager(paths)
    token = str(config["token"])
    allowed_origins = set(config.get("allowedOrigins", []))
    app = FastAPI(title="Instagram Exporter Local Agent", version=AGENT_VERSION, docs_url=None, redoc_url=None)
    app.state.paths, app.state.config, app.state.manager = paths, config, manager

    @app.middleware("http")
    async def security_middleware(request: Request, call_next: Callable) -> Response:
        origin = request.headers.get("origin")
        if origin and origin not in allowed_origins:
            return JSONResponse({"detail": "Origen no autorizado."}, status_code=403)
        if request.method == "OPTIONS":
            response = Response(status_code=204)
        else:
            length = request.headers.get("content-length")
            try:
                declared_length = int(length) if length else 0
            except ValueError:
                return JSONResponse({"detail": "Content-Length no valido."}, status_code=400)
            if declared_length > 16_384:
                return JSONResponse({"detail": "Solicitud demasiado grande."}, status_code=413)
            if request.method in {"POST", "PUT", "PATCH"}:
                body = await request.body()
                if len(body) > 16_384:
                    return JSONResponse({"detail": "Solicitud demasiado grande."}, status_code=413)
            is_public_health = request.url.path == "/health" and request.method == "GET"
            is_origin_pairing = (
                request.url.path == "/pairing"
                and request.method == "POST"
                and origin in allowed_origins
            )
            if not (is_public_health or is_origin_pairing):
                authorization = request.headers.get("authorization", "")
                expected = f"Bearer {token}"
                if not hmac.compare_digest(authorization.encode(), expected.encode()):
                    return JSONResponse({"detail": "Token de emparejamiento no valido."}, status_code=401)
            response = await call_next(request)
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Last-Event-ID"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            if request.headers.get("access-control-request-private-network") == "true":
                response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.get("/health")
    async def health() -> dict[str, Any]:
        chromium = await asyncio.to_thread(chromium_available)
        return {
            "status": "ok", "version": AGENT_VERSION,
            "playwright": True, "chrome": chrome_available(),
            "chromium": chromium, "ollama": ollama_available(),
            "pairing": "automatic",
        }

    @app.post("/pairing")
    async def pair_browser() -> dict[str, str]:
        return {"token": token}

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

        async def stream() -> AsyncIterator[str]:
            queue: asyncio.Queue = asyncio.Queue(maxsize=100)
            job.subscribers.add(queue)
            try:
                for event in job.events:
                    if int(event["id"]) > last_event_id:
                        yield f"id: {event['id']}\nevent: {event['type']}\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"
                if job.state in TERMINAL_STATES:
                    return
                while not await request.is_disconnected():
                    try:
                        event = await asyncio.wait_for(queue.get(), timeout=15)
                        yield f"id: {event['id']}\nevent: {event['type']}\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"
                        if event.get("type") in {"completed", "cancelled", "error"}:
                            return
                    except TimeoutError:
                        yield ": heartbeat\n\n"
            finally:
                job.subscribers.discard(queue)

        return StreamingResponse(stream(), media_type="text/event-stream", headers={"X-Accel-Buffering": "no"})

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

    return app


def main() -> int:
    parser = argparse.ArgumentParser(description="Agente local de Instagram Exporter")
    parser.add_argument("--port", type=int, default=0)
    parser.add_argument("--show-token", action="store_true")
    parser.add_argument("--initialize", action="store_true")
    parser.add_argument("--organize-worker", action="store_true")
    args, worker_args = parser.parse_known_args()
    if args.organize_worker:
        sys.argv = ["organizar_multimedia.py", *worker_args]
        import organizar_multimedia
        return organizar_multimedia.main()
    paths = AgentPaths.create()
    config = load_or_create_config(paths)
    if args.initialize:
        return 0
    if args.show_token:
        print(config["token"])
        return 0
    if getattr(sys, "frozen", False) and os.name == "nt":
        try:
            import ctypes
            console = ctypes.windll.kernel32.GetConsoleWindow()
            if console:
                ctypes.windll.user32.ShowWindow(console, 0)
        except Exception:  # noqa: BLE001
            pass
    port = args.port or int(config.get("port", DEFAULT_PORT))
    if not 1024 <= port <= 65535:
        raise SystemExit("Puerto fuera de rango.")
    import uvicorn
    logging.basicConfig(
        filename=paths.logs / "agent.log", level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    uvicorn.run(
        create_app(paths=paths, config=config), host="127.0.0.1", port=port,
        log_level="info", access_log=False, log_config=None,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
