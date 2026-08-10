"""Rutas FastAPI del analizador musical para el agente local comun."""

from __future__ import annotations

import asyncio
import os
import re
from pathlib import Path
from typing import Annotated, Any, Iterator, Literal

from fastapi import APIRouter, Header, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import Field

from local_tools.local_agent.events import stream_events
from local_tools.local_agent.models import StrictRequest

from .contracts import ALLOWED_SEPARATION_MODELS, TERMINAL_STATES
from .jobs import MusicJobManager
from .engine_pack import EnginePackManager
from .model_manager import ModelManager


class MusicTasksRequest(StrictRequest):
    separate_stems: bool = Field(default=True, alias="separateStems")
    detect_chords: bool = Field(default=True, alias="detectChords")
    detect_stem_chords: bool = Field(default=False, alias="detectStemChords")
    create_zip: bool = Field(default=True, alias="createZip")


class MusicSeparationRequest(StrictRequest):
    provider: Literal["local-demucs"] = "local-demucs"
    model: Literal["htdemucs", "htdemucs_6s"] = "htdemucs"
    device: Literal["auto", "cpu", "cuda"] = "auto"


class MusicAudioRequest(StrictRequest):
    convert_to_wav: bool = Field(default=True, alias="convertToWav")


class MusicJobRequest(StrictRequest):
    source_id: str = Field(alias="sourceId", min_length=20, max_length=64)
    destination_id: str | None = Field(default=None, alias="destinationId", max_length=64)
    tasks: MusicTasksRequest = MusicTasksRequest()
    separation: MusicSeparationRequest = MusicSeparationRequest()
    audio: MusicAudioRequest = MusicAudioRequest()


class ModelPullRequest(StrictRequest):
    engine: Literal["demucs"] = "demucs"
    model_id: Literal["htdemucs", "htdemucs_6s"] = Field(alias="modelId")


def choose_audio_file() -> Path | None:
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    try:
        selected = filedialog.askopenfilename(
            title="Selecciona una cancion",
            filetypes=[("Audio", "*.wav *.mp3 *.flac *.m4a")],
        )
        return Path(selected).resolve() if selected else None
    finally:
        root.destroy()


def choose_music_destination() -> Path | None:
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    try:
        selected = filedialog.askdirectory(
            title="Selecciona la carpeta para el analisis musical", mustexist=True
        )
        return Path(selected).resolve() if selected else None
    finally:
        root.destroy()


def _file_chunks(path: Path, start: int, length: int, chunk_size: int = 64 * 1024) -> Iterator[bytes]:
    remaining = length
    with path.open("rb") as handle:
        handle.seek(start)
        while remaining > 0:
            chunk = handle.read(min(chunk_size, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


def ranged_audio_response(path: Path, mime_type: str, range_header: str | None) -> Response:
    size = path.stat().st_size
    headers = {"Accept-Ranges": "bytes"}
    if not range_header:
        return StreamingResponse(
            _file_chunks(path, 0, size),
            media_type=mime_type,
            headers={**headers, "Content-Length": str(size)},
        )
    match = re.fullmatch(r"bytes=(\d*)-(\d*)", range_header.strip())
    if not match or (not match.group(1) and not match.group(2)):
        raise HTTPException(416, "Rango de audio no valido.", headers={"Content-Range": f"bytes */{size}"})
    if match.group(1):
        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else size - 1
    else:
        suffix = int(match.group(2))
        start, end = max(0, size - suffix), size - 1
    if start >= size or end < start:
        raise HTTPException(416, "Rango de audio no valido.", headers={"Content-Range": f"bytes */{size}"})
    end = min(end, size - 1)
    length = end - start + 1
    return StreamingResponse(
        _file_chunks(path, start, length),
        status_code=206,
        media_type=mime_type,
        headers={
            **headers,
            "Content-Length": str(length),
            "Content-Range": f"bytes {start}-{end}/{size}",
        },
    )


def create_music_router(manager: MusicJobManager, model_manager: ModelManager, engine_pack: EnginePackManager) -> APIRouter:
    router = APIRouter()

    @router.post("/v1/music/sources/select")
    async def select_source() -> dict[str, Any]:
        selected = await asyncio.to_thread(choose_audio_file)
        if selected is None:
            raise HTTPException(409, "No se selecciono un audio.")
        try:
            return manager.sources.register(selected).public()
        except Exception as exc:
            if hasattr(exc, "message"):
                raise HTTPException(422, str(exc)) from exc
            raise

    @router.delete("/v1/music/sources/{source_id}", status_code=204)
    async def revoke_source(source_id: str) -> Response:
        if not manager.sources.revoke(source_id):
            raise HTTPException(404, "Seleccion de audio no encontrada.")
        return Response(status_code=204)

    @router.post("/v1/music/destinations/select")
    async def select_destination() -> dict[str, str]:
        selected = await asyncio.to_thread(choose_music_destination)
        if selected is None:
            raise HTTPException(409, "No se selecciono una carpeta.")
        destination_id, label = manager.destinations.register(selected)
        return {"destinationId": destination_id, "label": label}

    @router.post("/v1/music/jobs", status_code=202)
    async def create_job(body: MusicJobRequest) -> dict[str, Any]:
        payload = body.model_dump(by_alias=True)
        if not any(
            (
                body.tasks.separate_stems,
                body.tasks.detect_chords,
                body.tasks.detect_stem_chords,
            )
        ):
            raise HTTPException(422, "Activa al menos una tarea de analisis.")
        if body.tasks.detect_stem_chords and not body.tasks.separate_stems:
            raise HTTPException(422, "Los acordes por pista requieren separacion.")
        job = await manager.create(payload)
        return {"id": job.id, "job": job.public()}

    @router.get("/v1/music/jobs/{job_id}")
    async def get_job(job_id: str) -> dict[str, Any]:
        return manager.get(job_id).public()

    @router.get("/v1/music/jobs/{job_id}/events")
    async def job_events(job_id: str, request: Request, last_event_id: int = 0) -> StreamingResponse:
        job = manager.get(job_id)
        stream = stream_events(
            job,
            request,
            last_event_id=last_event_id,
            terminal_states=set(TERMINAL_STATES),
            terminal_event_types={"completed", "cancelled", "error"},
        )
        return StreamingResponse(stream, media_type="text/event-stream", headers={"X-Accel-Buffering": "no"})

    @router.post("/v1/music/jobs/{job_id}/cancel", status_code=202)
    async def cancel_job(job_id: str) -> dict[str, Any]:
        job = manager.get(job_id)
        await manager.cancel(job)
        return job.public()

    @router.delete("/v1/music/jobs/{job_id}", status_code=204)
    async def delete_job(job_id: str) -> Response:
        manager.delete(manager.get(job_id))
        return Response(status_code=204)

    @router.get("/v1/music/jobs/{job_id}/artifacts")
    async def list_artifacts(job_id: str) -> dict[str, Any]:
        job = manager.get(job_id)
        return {"jobId": job.id, "artifacts": job.artifacts}

    @router.post("/v1/music/jobs/{job_id}/artifacts/{artifact_id}/media-session")
    async def media_session(job_id: str, artifact_id: str, request: Request) -> dict[str, Any]:
        origin = request.headers.get("origin", "")
        if not origin:
            raise HTTPException(400, "La reproduccion requiere un origen web.")
        session = manager.create_media_session(manager.get(job_id), artifact_id, origin)
        return {"url": f"/v1/media/{session.id}", "expiresIn": 300}

    @router.get("/v1/media/{session_id}")
    async def stream_media(
        session_id: str,
        request: Request,
        range_value: Annotated[str | None, Header(alias="Range")] = None,
    ) -> Response:
        session = manager.get_media_session(session_id, request.headers.get("origin", ""))
        metadata, path = manager.artifact(manager.get(session.job_id), session.artifact_id)
        return ranged_audio_response(path, str(metadata["mimeType"]), range_value)

    @router.get("/v1/music/jobs/{job_id}/artifacts/{artifact_id}/download")
    async def download_artifact(job_id: str, artifact_id: str) -> FileResponse:
        metadata, path = manager.artifact(manager.get(job_id), artifact_id)
        return FileResponse(path, media_type=metadata["mimeType"], filename=path.name)

    @router.post("/v1/music/jobs/{job_id}/open-output", status_code=204)
    async def open_output(job_id: str) -> Response:
        job = manager.get(job_id)
        if not job.output_dir or not job.output_dir.is_dir():
            raise HTTPException(404, "La carpeta de salida ya no existe.")
        if os.name == "nt":
            os.startfile(job.output_dir)  # type: ignore[attr-defined]
        return Response(status_code=204)

    @router.get("/v1/models")
    async def models() -> dict[str, Any]:
        return {"models": model_manager.catalog()}

    @router.get("/v1/music/engine")
    async def engine_status() -> dict[str, Any]:
        return engine_pack.status()

    @router.post("/v1/music/engine/installs", status_code=202)
    async def install_engine() -> dict[str, Any]:
        install = await engine_pack.start_install()
        return {"id": install.id, "install": install.public()}

    @router.get("/v1/music/engine/installs/{install_id}")
    async def get_engine_install(install_id: str) -> dict[str, Any]:
        return engine_pack.get_install(install_id).public()

    @router.get("/v1/music/engine/installs/{install_id}/events")
    async def engine_install_events(install_id: str, request: Request, last_event_id: int = 0) -> StreamingResponse:
        install = engine_pack.get_install(install_id)
        stream = stream_events(
            install, request, last_event_id=last_event_id,
            terminal_states={"completed", "cancelled", "failed"},
            terminal_event_types={"completed", "cancelled", "error"},
        )
        return StreamingResponse(stream, media_type="text/event-stream", headers={"X-Accel-Buffering": "no"})

    @router.post("/v1/music/engine/installs/{install_id}/cancel", status_code=202)
    async def cancel_engine_install(install_id: str) -> dict[str, Any]:
        install = engine_pack.get_install(install_id)
        await engine_pack.cancel(install)
        return install.public()

    @router.post("/v1/models/pulls", status_code=202)
    async def pull_model(body: ModelPullRequest) -> dict[str, Any]:
        pull = await model_manager.start_pull(body.model_id)
        return {"id": pull.id, "pull": pull.public()}

    @router.get("/v1/models/pulls/{pull_id}")
    async def get_model_pull(pull_id: str) -> dict[str, Any]:
        return model_manager.get_pull(pull_id).public()

    @router.get("/v1/models/pulls/{pull_id}/events")
    async def model_pull_events(pull_id: str, request: Request, last_event_id: int = 0) -> StreamingResponse:
        pull = model_manager.get_pull(pull_id)
        stream = stream_events(
            pull, request, last_event_id=last_event_id,
            terminal_states={"completed", "cancelled", "failed"},
            terminal_event_types={"completed", "cancelled", "error"},
        )
        return StreamingResponse(stream, media_type="text/event-stream", headers={"X-Accel-Buffering": "no"})

    @router.post("/v1/models/pulls/{pull_id}/cancel", status_code=202)
    async def cancel_model_pull(pull_id: str) -> dict[str, Any]:
        pull = model_manager.get_pull(pull_id)
        await model_manager.cancel(pull)
        return pull.public()

    @router.delete("/v1/models/{engine}/{model_id}", status_code=204)
    async def delete_model(engine: str, model_id: str) -> Response:
        if engine != "demucs":
            raise HTTPException(404, "Motor no encontrado.")
        model_manager.delete(model_id)
        return Response(status_code=204)

    return router
