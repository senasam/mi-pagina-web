"""API generica de consulta, cancelacion y eventos de tareas."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse

import uuid

from .manager import TaskConflictError, TaskManager, TaskNotFoundError
from .models import TERMINAL_TASK_STATUSES, TASK_STATUSES

# For constructing capability-specific request models when delegating
try:
    from local_tools.instagram_exporter.agent import ExportRequest as InstagramExportRequest
except Exception:  # pragma: no cover - fallback if importing directly fails in some contexts
    InstagramExportRequest = None


def register_task_routes(app: FastAPI, manager: TaskManager) -> None:
    def find(task_id: str):
        try:
            return manager.get(task_id)
        except TaskNotFoundError as error:
            raise HTTPException(404, str(error)) from error

    @app.get("/v1/tasks")
    async def list_tasks(capability: str | None = None, status: str | None = None, limit: int = 50):
        if status and status not in TASK_STATUSES:
            raise HTTPException(422, "Estado de tarea no valido.")
        return {
            "tasks": [
                task.public()
                for task in manager.list(
                    capability=capability,
                    status=status,
                    limit=max(1, min(100, limit)),
                )
            ]
        }

    @app.get("/v1/tasks/{task_id}")
    async def get_task(task_id: str):
        return find(task_id).public()

    @app.post("/v1/tasks/{task_id}/cancel", status_code=202)
    async def cancel_task(task_id: str):
        find(task_id)
        try:
            return (await manager.cancel(task_id)).public()
        except TaskConflictError as error:
            raise HTTPException(409, str(error)) from error

    @app.get("/v1/tasks/{task_id}/events")
    async def task_events(
        task_id: str,
        request: Request,
        last_event_id: int = 0,
    ) -> StreamingResponse:
        task = find(task_id)
        stream = manager.event_bus.stream(
            task_id,
            request,
            last_event_id=last_event_id,
            terminal=task.status in TERMINAL_TASK_STATUSES,
        )
        return StreamingResponse(
            stream,
            media_type="text/event-stream",
            headers={"X-Accel-Buffering": "no"},
        )

    @app.post("/v1/tasks", status_code=202)
    async def create_task(request: Request):
        """Create a Task for a registered capability.

        Expected JSON body:
        {
            "capabilityId": "music-analyzer",
            "operation": "analyze",
            "input": { ... },
            "id": "optional-task-id"
        }

        This route currently supports operations that are handled by the existing
        capability managers (music-analyzer.analyze and instagram-exporter.export-account).
        Other capability operations that do not create tasks will return 501.
        """
        payload = await request.json()
        capability_id = payload.get("capabilityId") or payload.get("capability")
        operation = payload.get("operation")
        input_payload = payload.get("input", {}) or {}
        task_id = payload.get("id")

        if not capability_id or not operation:
            raise HTTPException(422, "capabilityId and operation are required.")

        try:
            registry = getattr(app.state, "capability_registry")
            capability = registry.get(capability_id)
        except Exception as exc:
            raise HTTPException(404, f"Capability not found: {capability_id}") from exc

        # verify operation is declared by the capability
        op_desc = None
        for op in getattr(capability.descriptor, "operations", ()):  # type: ignore[attr-defined]
            if op.id == operation:
                op_desc = op
                break
        if not op_desc:
            raise HTTPException(422, f"Operation not supported by capability: {operation}")

        # Only operations that create tasks are implemented here.
        if not op_desc.creates_task:
            raise HTTPException(501, "Non-task operations must be invoked via capability-specific routes.")

        # Determine manager for known capabilities and delegate to their create API.
        try:
            if capability_id == "music-analyzer" and operation == "analyze":
                music_manager = getattr(app.state, "music_manager")
                # music_manager.create expects the job body already validated; pass raw dict
                job = await music_manager.create(input_payload)
                # the music manager registers a task with the TaskManager internally
                task = app.state.task_manager.get(job.id)
                return {"id": task.id, "task": task.public(), "job": job.public()}

            if capability_id == "instagram-exporter" and operation == "export-account":
                instagram_manager = getattr(app.state, "instagram_manager")
                if InstagramExportRequest is not None:
                    try:
                        request_model = InstagramExportRequest(**input_payload)
                    except Exception as exc:
                        raise HTTPException(422, f"Invalid input for export-account: {exc}") from exc
                    job = await instagram_manager.create(request_model)
                else:
                    # Fallback: pass raw dict — the manager may raise if it requires a typed request
                    job = await instagram_manager.create(input_payload)
                task = app.state.task_manager.get(job.id)
                return {"id": task.id, "task": task.public(), "job": job.public()}

            # Fallback: unsupported capability handler mapping
            raise HTTPException(501, f"Capability operation not wired to Task API: {capability_id}.{operation}")
        except TaskConflictError as exc:
            raise HTTPException(409, str(exc)) from exc
