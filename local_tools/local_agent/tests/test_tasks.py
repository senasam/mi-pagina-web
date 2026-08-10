from pathlib import Path
import asyncio

import pytest

from local_tools.local_agent.tasks import (
    EventBus,
    TaskCancelledError,
    TaskConflictError,
    TaskExecutionError,
    TaskManager,
)


def managers(tmp_path: Path):
    bus = EventBus(tmp_path / "events")
    return TaskManager(tmp_path / "tasks", bus), bus


def test_task_manager_validates_lifecycle_and_publishes_common_events(tmp_path):
    manager, bus = managers(tmp_path)
    task = manager.create(
        task_id="task-one",
        capability="instagram-exporter",
        operation="export-account",
        message="Creada",
    )

    manager.update(task.id, status="starting", phase="opening_browser", message="Abriendo")
    manager.update(task.id, status="waiting_for_user", phase="awaiting_login", message="Login")
    manager.update(task.id, status="running", phase="exporting", progress=50)
    manager.update(task.id, status="completed", phase="completed", progress=100, result={"count": 2})

    final = manager.get(task.id)
    assert final.status == "completed"
    assert final.started_at
    assert final.finished_at
    assert final.result == {"count": 2}
    assert [event["type"] for event in bus.history(task.id)] == [
        "task.queued",
        "task.started",
        "task.waiting_for_user",
        "task.progress",
        "task.completed",
    ]
    with pytest.raises(TaskConflictError):
        manager.update(task.id, status="running")


def test_restart_marks_non_terminal_tasks_as_failed_and_preserves_replay(tmp_path):
    manager, _ = managers(tmp_path)
    manager.create(
        task_id="task-restart",
        capability="instagram-exporter",
        operation="export-account",
        message="Creada",
    )
    manager.update("task-restart", status="running", phase="exporting", progress=33)

    recovered_bus = EventBus(tmp_path / "events")
    recovered = TaskManager(tmp_path / "tasks", recovered_bus).get("task-restart")

    assert recovered.status == "failed"
    assert recovered.error["code"] == "AGENT_RESTARTED"
    assert recovered.error["retryable"] is True
    assert [event["type"] for event in recovered_bus.history(recovered.id)][-1] == "task.failed"


def test_launch_owns_execution_boundary_and_persists_handler_result(tmp_path):
    manager, bus = managers(tmp_path)
    task = manager.create(
        task_id="task-launch",
        capability="test",
        operation="run",
        message="Creada",
    )

    async def handler():
        manager.update(task.id, status="running", progress=50, phase="working")
        await asyncio.sleep(0)
        return {"ok": True}

    async def run_task():
        await manager.launch(task.id, handler)

    asyncio.run(run_task())

    assert manager.get(task.id).result == {"ok": True}
    assert [event["type"] for event in bus.history(task.id)] == [
        "task.queued",
        "task.started",
        "task.progress",
        "task.completed",
    ]


def test_launch_maps_typed_handler_outcomes_to_terminal_states(tmp_path):
    manager, _ = managers(tmp_path)

    async def fail():
        raise TaskExecutionError("BROKEN", "No se pudo ejecutar.", retryable=False)

    async def cancel():
        raise TaskCancelledError()

    failed = manager.create(task_id="task-failed", capability="test", operation="run", message="Creada")
    cancelled = manager.create(task_id="task-cancelled", capability="test", operation="run", message="Creada")

    async def run_tasks():
        await manager.launch(failed.id, fail)
        await manager.launch(cancelled.id, cancel)

    asyncio.run(run_tasks())

    assert manager.get(failed.id).status == "failed"
    assert manager.get(failed.id).error == {
        "code": "BROKEN",
        "message": "No se pudo ejecutar.",
        "retryable": False,
    }
    assert manager.get(cancelled.id).status == "cancelled"
