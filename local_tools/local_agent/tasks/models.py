"""Contrato neutral de una operacion local de larga duracion."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from local_tools.local_agent.models import utc_now

TASK_STATUSES = {
    "queued",
    "starting",
    "running",
    "waiting_for_user",
    "completed",
    "failed",
    "cancelled",
}
TERMINAL_TASK_STATUSES = {"completed", "failed", "cancelled"}


@dataclass
class TaskRecord:
    id: str
    capability: str
    operation: str
    status: str = "queued"
    progress: float = 0.0
    message: str = "Tarea en cola."
    phase: str = "queued"
    created_at: str = field(default_factory=utc_now)
    started_at: str | None = None
    finished_at: str | None = None
    updated_at: str = field(default_factory=utc_now)
    result: dict[str, Any] | None = None
    error: dict[str, Any] | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    revision: int = 1

    def __post_init__(self) -> None:
        if self.status not in TASK_STATUSES:
            raise ValueError(f"Estado de tarea no valido: {self.status}")

    def public(self) -> dict[str, Any]:
        data = asdict(self)
        return {
            "id": data["id"],
            "capability": data["capability"],
            "operation": data["operation"],
            "status": data["status"],
            "progress": round(float(data["progress"]), 2),
            "message": data["message"],
            "phase": data["phase"],
            "createdAt": data["created_at"],
            "startedAt": data["started_at"],
            "finishedAt": data["finished_at"],
            "updatedAt": data["updated_at"],
            "result": data["result"],
            "error": data["error"],
            "metadata": data["metadata"],
            "revision": data["revision"],
        }

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "TaskRecord":
        aliases = {
            "createdAt": "created_at",
            "startedAt": "started_at",
            "finishedAt": "finished_at",
            "updatedAt": "updated_at",
        }
        normalized = {aliases.get(key, key): value for key, value in data.items()}
        return cls(**normalized)
