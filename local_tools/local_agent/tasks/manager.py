"""TaskManager neutral con transiciones validadas y snapshots atomicos."""

from __future__ import annotations

import inspect
import json
import threading
import asyncio
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from local_tools.local_agent.models import utc_now

from .events import EventBus
from .models import TERMINAL_TASK_STATUSES, TaskRecord

ALLOWED_TRANSITIONS = {
    "queued": {"starting", "running", "waiting_for_user", "completed", "failed", "cancelled"},
    "starting": {"running", "waiting_for_user", "completed", "failed", "cancelled"},
    "running": {"waiting_for_user", "completed", "failed", "cancelled"},
    "waiting_for_user": {"starting", "running", "completed", "failed", "cancelled"},
    "completed": set(),
    "failed": set(),
    "cancelled": set(),
}


class TaskNotFoundError(LookupError):
    pass


class TaskConflictError(RuntimeError):
    pass


class TaskCancelledError(Exception):
    pass


class TaskExecutionError(Exception):
    def __init__(self, code: str, message: str, *, retryable: bool = True) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


class TaskManager:
    def __init__(self, root: Path, event_bus: EventBus) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        self.event_bus = event_bus
        self.tasks: dict[str, TaskRecord] = {}
        self._cancel_handlers: dict[str, Callable[[], Awaitable[None]]] = {}
        self._running_tasks: dict[str, asyncio.Task[Any]] = {}
        self._lock = threading.RLock()
        self._load()

    def _path(self, task_id: str) -> Path:
        return self.root / f"{task_id}.json"

    def _load(self) -> None:
        for path in self.root.glob("*.json"):
            try:
                task = TaskRecord.from_json(json.loads(path.read_text(encoding="utf-8")))
            except (OSError, TypeError, ValueError):
                continue
            if task.status not in TERMINAL_TASK_STATUSES:
                task.status = "failed"
                task.phase = "agent_restarted"
                task.message = "La tarea fue interrumpida por el reinicio del agente."
                task.error = {
                    "code": "AGENT_RESTARTED",
                    "message": task.message,
                    "retryable": True,
                }
                task.finished_at = utc_now()
                task.updated_at = task.finished_at
                task.revision += 1
                self._save(task)
                self.event_bus.publish(
                    task.id,
                    "task.failed",
                    capability=task.capability,
                    data={"task": task.public(), "recovered": True},
                )
            self.tasks[task.id] = task

    def _save(self, task: TaskRecord) -> None:
        temporary = self._path(task.id).with_suffix(".tmp")
        temporary.write_text(json.dumps(task.public(), indent=2), encoding="utf-8")
        temporary.replace(self._path(task.id))

    def create(
        self,
        *,
        task_id: str,
        capability: str,
        operation: str,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> TaskRecord:
        with self._lock:
            if task_id in self.tasks:
                raise TaskConflictError("La tarea ya existe.")
            task = TaskRecord(
                id=task_id,
                capability=capability,
                operation=operation,
                message=message,
                metadata=metadata or {},
            )
            self.tasks[task.id] = task
            self._save(task)
            self.event_bus.publish(
                task.id,
                "task.queued",
                capability=task.capability,
                data={"task": task.public()},
            )
            return task

    def get(self, task_id: str) -> TaskRecord:
        task = self.tasks.get(task_id)
        if not task:
            raise TaskNotFoundError("Tarea no encontrada.")
        return task

    def list(
        self,
        *,
        capability: str | None = None,
        status: str | None = None,
        limit: int = 50,
    ) -> list[TaskRecord]:
        tasks = list(self.tasks.values())
        if capability:
            tasks = [task for task in tasks if task.capability == capability]
        if status:
            tasks = [task for task in tasks if task.status == status]
        return sorted(tasks, key=lambda task: task.created_at, reverse=True)[:limit]

    def update(
        self,
        task_id: str,
        *,
        status: str | None = None,
        progress: float | None = None,
        message: str | None = None,
        phase: str | None = None,
        result: dict[str, Any] | None = None,
        error: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
        source_event: str | None = None,
    ) -> TaskRecord:
        with self._lock:
            task = self.get(task_id)
            previous = task.status
            next_status = status or previous
            if next_status != previous and next_status not in ALLOWED_TRANSITIONS[previous]:
                raise TaskConflictError(f"Transicion no valida: {previous} -> {next_status}")
            now = utc_now()
            task.status = next_status
            if progress is not None:
                task.progress = max(0.0, min(100.0, float(progress)))
            if message is not None:
                task.message = message
            if phase is not None:
                task.phase = phase
            if metadata:
                task.metadata = {**task.metadata, **metadata}
            if result is not None:
                task.result = result
            if error is not None:
                task.error = error
            if not task.started_at and next_status in {"starting", "running", "waiting_for_user"}:
                task.started_at = now
            if next_status in TERMINAL_TASK_STATUSES:
                task.finished_at = now
            task.updated_at = now
            task.revision += 1
            self._save(task)
            event_type = self._event_type(previous, next_status)
            self.event_bus.publish(
                task.id,
                event_type,
                capability=task.capability,
                data={"task": task.public(), "sourceEvent": source_event},
            )
            return task

    @staticmethod
    def _event_type(previous: str, current: str) -> str:
        if current == "completed":
            return "task.completed"
        if current == "failed":
            return "task.failed"
        if current == "cancelled":
            return "task.cancelled"
        if current == "waiting_for_user":
            return "task.waiting_for_user"
        if previous == "queued" and current in {"starting", "running"}:
            return "task.started"
        return "task.progress"

    def attach_cancel_handler(self, task_id: str, handler: Callable[[], Awaitable[None]]) -> None:
        self._cancel_handlers[task_id] = handler

    def finalize(
        self,
        task_id: str,
        *,
        status: str,
        result: dict[str, Any] | None = None,
        error: dict[str, Any] | None = None,
        message: str | None = None,
        phase: str = "completed",
    ) -> TaskRecord:
        if status not in TERMINAL_TASK_STATUSES:
            raise TaskConflictError("Solo se pueden finalizar tareas con un estado terminal.")
        return self.update(
            task_id,
            status=status,
            progress=100 if status == "completed" else None,
            message=message,
            phase=phase,
            result=result,
            error=error,
        )

    def launch(
        self,
        task_id: str,
        handler: Callable[[], Awaitable[None]],
    ) -> asyncio.Task[Any]:
        """Launch a task through the common executor boundary."""
        if task_id in self._running_tasks:
            raise TaskConflictError("La tarea ya esta en ejecucion.")

        async def execute() -> None:
            try:
                self.update(task_id, status="starting", phase="starting")
                result = await handler()
                task = self.get(task_id)
                if task.status not in TERMINAL_TASK_STATUSES:
                    self.update(
                        task_id,
                        status="completed",
                        progress=100,
                        phase="completed",
                        result=result if isinstance(result, dict) else None,
                    )
            except TaskCancelledError:
                task = self.get(task_id)
                if task.status not in TERMINAL_TASK_STATUSES:
                    self.update(
                        task_id,
                        status="cancelled",
                        phase="cancelled",
                        message="Tarea cancelada.",
                    )
                return
            except asyncio.CancelledError:
                task = self.get(task_id)
                if task.status not in TERMINAL_TASK_STATUSES:
                    self.update(
                        task_id,
                        status="cancelled",
                        phase="cancelled",
                        message="Tarea cancelada.",
                    )
                raise
            except TaskExecutionError as error:
                task = self.get(task_id)
                if task.status not in TERMINAL_TASK_STATUSES:
                    self.update(
                        task_id,
                        status="failed",
                        phase="failed",
                        message=error.message,
                        error={
                            "code": error.code,
                            "message": error.message,
                            "retryable": error.retryable,
                        },
                    )
            except Exception as error:
                task = self.get(task_id)
                if task.status not in TERMINAL_TASK_STATUSES:
                    self.update(
                        task_id,
                        status="failed",
                        phase="failed",
                        message="La tarea finalizo inesperadamente.",
                        error={
                            "code": "TASK_HANDLER_FAILED",
                            "message": str(error),
                            "retryable": True,
                        },
                    )
                raise
            finally:
                self._running_tasks.pop(task_id, None)

        running = asyncio.create_task(execute(), name=f"task-{task_id}")
        self._running_tasks[task_id] = running
        return running

    def delete(self, task_id: str) -> None:
        with self._lock:
            task = self.tasks.pop(task_id, None)
            if not task:
                raise TaskNotFoundError("Tarea no encontrada.")
            task_file = self._path(task_id)
            if task_file.exists():
                task_file.unlink()

    async def cancel(self, task_id: str) -> TaskRecord:
        task = self.get(task_id)
        if task.status in TERMINAL_TASK_STATUSES:
            return task
        handler = self._cancel_handlers.get(task_id)
        if not handler:
            raise TaskConflictError("La tarea ya no tiene un proceso activo que cancelar.")
        result = handler()
        if inspect.isawaitable(result):
            await result
        return self.get(task_id)
