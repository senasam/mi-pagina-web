"""Bus unico con replay persistente y streaming SSE por tarea."""

from __future__ import annotations

import asyncio
import json
import threading
from collections import defaultdict, deque
from pathlib import Path
from typing import Any, AsyncIterator

from fastapi import Request

from local_tools.local_agent.events import format_sse
from local_tools.local_agent.models import utc_now


class EventBus:
    def __init__(self, root: Path, *, max_events: int = 500) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        self.max_events = max_events
        self._events: dict[str, deque[dict[str, Any]]] = {}
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)
        self._lock = threading.RLock()

    def _path(self, task_id: str) -> Path:
        if not task_id or any(character not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_" for character in task_id):
            raise ValueError("Identificador de tarea no valido.")
        return self.root / f"{task_id}.jsonl"

    def history(self, task_id: str) -> deque[dict[str, Any]]:
        with self._lock:
            if task_id not in self._events:
                events: deque[dict[str, Any]] = deque(maxlen=self.max_events)
                path = self._path(task_id)
                if path.exists():
                    for line in path.read_text(encoding="utf-8").splitlines()[-self.max_events :]:
                        try:
                            value = json.loads(line)
                            if isinstance(value, dict):
                                events.append(value)
                        except ValueError:
                            continue
                self._events[task_id] = events
            return self._events[task_id]

    def publish(
        self,
        task_id: str,
        event_type: str,
        *,
        capability: str,
        data: dict[str, Any],
    ) -> dict[str, Any]:
        with self._lock:
            events = self.history(task_id)
            sequence = int(events[-1]["id"]) + 1 if events else 1
            event = {
                "id": sequence,
                "type": event_type,
                "at": utc_now(),
                "taskId": task_id,
                "capability": capability,
                "data": data,
            }
            events.append(event)
            with self._path(task_id).open("a", encoding="utf-8") as journal:
                journal.write(json.dumps(event, ensure_ascii=False) + "\n")
            for subscriber in tuple(self._subscribers.get(task_id, ())):
                try:
                    subscriber.put_nowait(event)
                except asyncio.QueueFull:
                    pass
            return event

    async def stream(
        self,
        task_id: str,
        request: Request,
        *,
        last_event_id: int = 0,
        terminal: bool = False,
    ) -> AsyncIterator[str]:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers[task_id].add(queue)
        try:
            for event in tuple(self.history(task_id)):
                if int(event["id"]) > last_event_id:
                    yield format_sse(event)
            if terminal:
                return
            while not await request.is_disconnected():
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                    yield format_sse(event)
                    if event["type"] in {"task.completed", "task.failed", "task.cancelled"}:
                        return
                except TimeoutError:
                    yield ": heartbeat\n\n"
        finally:
            self._subscribers[task_id].discard(queue)
