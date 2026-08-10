"""Publicacion, replay y streaming SSE comun para trabajos locales."""

from __future__ import annotations

import asyncio
import json
from typing import Any, AsyncIterator

from fastapi import Request

from .models import utc_now


async def publish_event(target: Any, event_type: str, **data: Any) -> None:
    target.event_sequence += 1
    event = {"id": target.event_sequence, "type": event_type, "at": utc_now(), **data}
    target.events.append(event)
    for subscriber in tuple(target.subscribers):
        try:
            subscriber.put_nowait(event)
        except asyncio.QueueFull:
            pass


def format_sse(event: dict[str, Any]) -> str:
    return (
        f"id: {event['id']}\n"
        f"event: {event['type']}\n"
        f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    )


async def stream_events(
    target: Any,
    request: Request,
    *,
    last_event_id: int,
    terminal_states: set[str],
    terminal_event_types: set[str],
) -> AsyncIterator[str]:
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    target.subscribers.add(queue)
    try:
        for event in target.events:
            if int(event["id"]) > last_event_id:
                yield format_sse(event)
        if target.state in terminal_states:
            return
        while not await request.is_disconnected():
            try:
                event = await asyncio.wait_for(queue.get(), timeout=15)
                yield format_sse(event)
                if event.get("type") in terminal_event_types:
                    return
            except TimeoutError:
                yield ": heartbeat\n\n"
    finally:
        target.subscribers.discard(queue)
