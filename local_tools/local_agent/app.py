"""Composition root HTTP neutral de Felipe Local Tools Agent."""

from __future__ import annotations

import os
import shutil
import sys
import asyncio
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from local_tools.instagram_exporter.agent import JobManager
from local_tools.instagram_exporter.capability import InstagramExporterCapability
from local_tools.music_analyzer.capability import MusicAnalyzerCapability
from local_tools.music_analyzer.engine_pack import EnginePackManager
from local_tools.music_analyzer.jobs import MusicJobManager
from local_tools.music_analyzer.model_manager import ModelManager

from .authentication import install_security_middleware
from .artifacts import ArtifactService
from .capabilities import CapabilityContext, CapabilityRegistry
from .config import load_or_create_config, save_config
from .media_sessions import MediaSessionService
from .runtime import AgentPaths
from .security import PairingManager, SessionManager
from .software import SOFTWARE_CATALOG, SoftwareManager
from .tasks import EventBus, TaskManager
from .tasks.api import register_task_routes
from .tasks.manager import TaskConflictError
from .tasks.models import TERMINAL_TASK_STATUSES

AGENT_NAME = "Felipe Local Tools Agent"
AGENT_VERSION = "1.3.0"
PROTOCOL_VERSIONS = ("1",)
SESSION_SCOPES = ["agent:read", "instagram:execute", "music:execute"]


class PairingRequest(BaseModel):
    deviceId: str = Field(pattern=r"^[A-Za-z0-9_-]{16,128}$")
    deviceName: str = Field(min_length=1, max_length=80)


def create_agent_app(
    *,
    paths: AgentPaths | None = None,
    config: dict[str, Any] | None = None,
    instagram_manager: JobManager | None = None,
    music_manager: MusicJobManager | None = None,
    model_manager: ModelManager | None = None,
    engine_pack_manager: EnginePackManager | None = None,
    registry: CapabilityRegistry | None = None,
    pairing_manager: PairingManager | None = None,
    session_manager: SessionManager | None = None,
    event_bus: EventBus | None = None,
    task_manager: TaskManager | None = None,
) -> FastAPI:
    paths = paths or AgentPaths.create()
    config = config or load_or_create_config(paths)
    event_bus = event_bus or EventBus(paths.task_events_root)
    task_manager = task_manager or TaskManager(paths.tasks_root, event_bus)
    instagram_manager = instagram_manager or JobManager(paths, task_manager=task_manager)
    instagram_manager.attach_task_manager(task_manager)

    music_runtime = paths.capability_root("music-analyzer")
    engine_pack_manager = engine_pack_manager or EnginePackManager(
        music_runtime / "engine-packs"
    )
    music_worker_command = (
        [sys.executable, "--music-worker"] if getattr(sys, "frozen", False) else None
    )
    model_worker_command = (
        [sys.executable, "--model-worker"] if getattr(sys, "frozen", False) else None
    )
    artifact_service = ArtifactService()
    media_session_service = MediaSessionService()
    # Central FileGrantService to manage sources and destinations across capabilities
    from .files import FileGrantService

    file_grants = FileGrantService()

    if music_manager is None:
        music_manager = MusicJobManager(
            music_runtime,
            worker_command=music_worker_command,
            engine_pack=engine_pack_manager if getattr(sys, "frozen", False) else None,
            task_manager=task_manager,
            artifact_service=artifact_service,
            media_session_service=media_session_service,
        )
    else:
        if getattr(music_manager, "task_manager", None) is None:
            music_manager.task_manager = task_manager
        if getattr(music_manager, "artifact_service", None) is None:
            music_manager.artifact_service = artifact_service
        if getattr(music_manager, "media_session_service", None) is None:
            music_manager.media_session_service = media_session_service

    # Override per-manager registries to use the centralized service
    music_manager.sources = file_grants.source_registry
    music_manager.destinations = file_grants.destination_registry
    instagram_manager.destinations = file_grants.destination_registry
    model_manager = model_manager or ModelManager(
        music_manager.model_root,
        worker_command=model_worker_command,
        engine_pack=engine_pack_manager if getattr(sys, "frozen", False) else None,
    )

    software_manager = SoftwareManager(
        paths.runtime_root / "software",
        registry=SOFTWARE_CATALOG,
        task_manager=task_manager,
    )

    services = {
        "instagram_manager": instagram_manager,
        "music_manager": music_manager,
        "model_manager": model_manager,
        "engine_pack_manager": engine_pack_manager,
        "software_manager": software_manager,
        "task_manager": task_manager,
        "event_bus": event_bus,
    }
    context = CapabilityContext(paths=paths, config=config, services=services)
    registry = registry or CapabilityRegistry()
    if not registry.list():
        registry.register(InstagramExporterCapability())
        registry.register(MusicAnalyzerCapability())

    token = str(config["token"])
    allowed_origins = set(config.get("allowedOrigins", []))
    security_version = int(config.get("securityVersion", 1))
    pairing_manager = pairing_manager or PairingManager()
    session_manager = session_manager or SessionManager(paths.security_state)
    app = FastAPI(
        title=AGENT_NAME,
        version=AGENT_VERSION,
        docs_url=None,
        redoc_url=None,
    )
    app.state.paths = paths
    app.state.config = config
    app.state.manager = instagram_manager  # compatibilidad de tests/integraciones
    app.state.music_manager = music_manager
    app.state.model_manager = model_manager
    app.state.engine_pack_manager = engine_pack_manager
    app.state.software_manager = software_manager
    app.state.capability_registry = registry
    app.state.capability_context = context
    app.state.pairing_manager = pairing_manager
    app.state.session_manager = session_manager
    app.state.task_manager = task_manager
    app.state.event_bus = event_bus

    install_security_middleware(
        app,
        token=token,
        allowed_origins=allowed_origins,
        public_routes={("GET", "/health")},
        pairing_routes={("POST", "/pairing"), ("POST", "/v1/pairing/requests")},
        sessions=session_manager,
        legacy_auth_enabled=lambda: bool(config.get("legacyAuthEnabled", security_version < 2)),
        public_path_predicate=lambda request: (
            request.method == "GET" and request.url.path.startswith("/v1/media/")
        ),
    )
    for capability in registry.list():
        capability.register_routes(app, context)
    register_task_routes(app, task_manager)

    @app.get("/health")
    async def legacy_health() -> dict[str, Any]:
        instagram = await registry.get("instagram-exporter").health(context)
        return {
            "status": "ok",
            "version": AGENT_VERSION,
            "playwright": instagram["playwright"],
            "chrome": instagram["chrome"],
            "chromium": instagram["chromium"],
            "ollama": instagram["ollama"],
            "pairing": "explicit" if security_version >= 2 else "automatic",
            "agentDeviceId": config.get("agentDeviceId", "legacy"),
        }

    @app.post("/pairing")
    async def legacy_pair_browser() -> dict[str, str]:
        if security_version >= 2 and not config.get("legacyAuthEnabled"):
            return JSONResponse(
                {
                    "error": {
                        "code": "PAIRING_UPGRADE_REQUIRED",
                        "message": "Este agente requiere emparejamiento explicito.",
                    }
                },
                status_code=410,
            )
        return {"token": token}

    @app.post("/v1/pairing/requests")
    async def pair_browser(payload: PairingRequest, request: Request) -> Response:
        origin = request.headers.get("origin", "")
        approved = await asyncio.to_thread(
            pairing_manager.confirm,
            origin,
            payload.deviceName,
        )
        if not approved:
            return JSONResponse(
                {
                    "error": {
                        "code": "PAIRING_REJECTED",
                        "message": "El emparejamiento fue rechazado o excedio el limite de intentos.",
                    }
                },
                status_code=403,
            )
        session = session_manager.create(
            device_id=payload.deviceId,
            device_name=payload.deviceName,
            origin=origin,
            scopes=SESSION_SCOPES,
        )
        if config.get("legacyAuthEnabled"):
            config["legacyAuthEnabled"] = False
            save_config(paths, config)
        return JSONResponse({"session": session}, status_code=201)

    @app.get("/v1/agent")
    async def agent_info() -> dict[str, Any]:
        return {
            "name": AGENT_NAME,
            "agentVersion": AGENT_VERSION,
            "protocolVersions": list(PROTOCOL_VERSIONS),
            "activeProtocolVersion": PROTOCOL_VERSIONS[-1],
            "securityVersion": security_version,
        }

    @app.get("/v1/session")
    async def current_session(request: Request) -> dict[str, Any]:
        session = getattr(request.state, "agent_session", None)
        if not session:
            return {"type": "legacy", "expiresAt": None}
        return {"type": "device", **(session_manager.current_public(session["id"]) or {})}

    @app.post("/v1/session/revoke", status_code=204)
    async def revoke_current_session(request: Request) -> Response:
        session = getattr(request.state, "agent_session", None)
        if session:
            session_manager.revoke(session["id"])
        return Response(status_code=204)

    @app.get("/v1/capabilities")
    async def capability_catalog() -> dict[str, Any]:
        capabilities = []
        for capability in registry.list():
            capabilities.append(
                {**capability.descriptor.public(), "health": await capability.health(context)}
            )
        return {"capabilities": capabilities}

    @app.get("/v1/software")
    async def list_software() -> dict[str, Any]:
        return {"software": software_manager.list_software()}

    @app.get("/v1/software/{software_id}")
    async def get_software(software_id: str) -> dict[str, Any]:
        try:
            return software_manager.get_software(software_id).public()
        except KeyError as exc:
            raise HTTPException(404, str(exc)) from exc

    @app.post("/v1/software/{software_id}/actions/{action}", status_code=202)
    async def software_action(software_id: str, action: str) -> dict[str, Any]:
        install, task = await software_manager.create_install_task(software_id, action)
        return {"id": install.id, "install": install.public(), "task": task.public()}

    @app.post("/v1/software/installs/{install_id}/cancel", status_code=202)
    async def cancel_software_install(install_id: str) -> dict[str, Any]:
        install = software_manager.get_install(install_id)
        try:
            task = await task_manager.cancel(install_id)
        except TaskConflictError as exc:
            raise HTTPException(409, str(exc)) from exc
        return {"install": install.public(), "task": task.public()}

    @app.get("/v1/software/installs/{install_id}/events")
    async def get_install_events(install_id: str, request: Request, last_event_id: int = 0) -> StreamingResponse:
        software_manager.get_install(install_id)
        task = task_manager.get(install_id)
        stream = task_manager.event_bus.stream(
            install_id,
            request,
            last_event_id=last_event_id,
            terminal=task.status in TERMINAL_TASK_STATUSES,
        )
        return StreamingResponse(
            stream,
            media_type="text/event-stream",
            headers={"X-Accel-Buffering": "no"},
        )

    @app.get("/v1/software/installs/{install_id}")
    async def get_install(install_id: str) -> dict[str, Any]:
        return software_manager.get_install(install_id).public()

    @app.get("/v1/health")
    async def legacy_capabilities() -> dict[str, Any]:
        music = await registry.get("music-analyzer").health(context)
        return {
            "status": "ok",
            "version": AGENT_VERSION,
            "name": AGENT_NAME,
            "tools": {
                "instagramExporter": {"available": True, "apiVersion": "legacy"},
                "musicAnalyzer": {
                    "available": True,
                    "apiVersion": "v1",
                    "formats": ["wav", "mp3", "flac", "m4a"],
                    "models": ["htdemucs", "htdemucs_6s"],
                    "engine": music["engine"],
                },
            },
        }

    @app.get("/v1/system/resources")
    async def system_resources() -> dict[str, Any]:
        disk = shutil.disk_usage(music_manager.root)
        return {
            "cpuCount": os.cpu_count(),
            "disk": {"total": disk.total, "free": disk.free},
            "gpu": {"available": shutil.which("nvidia-smi") is not None},
        }

    return app
