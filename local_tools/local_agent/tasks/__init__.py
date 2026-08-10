"""Tareas persistentes y eventos comunes del Local Agent."""

from .events import EventBus
from .manager import (
    TaskCancelledError,
    TaskConflictError,
    TaskExecutionError,
    TaskManager,
    TaskNotFoundError,
)
from .models import TERMINAL_TASK_STATUSES, TaskRecord

__all__ = [
    "EventBus",
    "TERMINAL_TASK_STATUSES",
    "TaskConflictError",
    "TaskCancelledError",
    "TaskExecutionError",
    "TaskManager",
    "TaskNotFoundError",
    "TaskRecord",
]
