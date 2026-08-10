"""Normalizacion y compactacion de acordes detectados."""

from __future__ import annotations

from ..contracts import ChordEvent


def merge_adjacent(events: list[ChordEvent], *, minimum_duration: float = 0.0) -> tuple[ChordEvent, ...]:
    merged: list[ChordEvent] = []
    for event in events:
        if event.end <= event.start:
            continue
        if merged and merged[-1].chord == event.chord and abs(merged[-1].end - event.start) < 0.05:
            previous = merged.pop()
            total = previous.end - previous.start + event.end - event.start
            confidence = (
                previous.confidence * (previous.end - previous.start)
                + event.confidence * (event.end - event.start)
            ) / total
            merged.append(
                ChordEvent(previous.start, event.end, event.chord, confidence, event.method)
            )
        else:
            merged.append(event)
    if minimum_duration <= 0 or len(merged) < 2:
        return tuple(merged)

    compacted: list[ChordEvent] = []
    for event in merged:
        if event.end - event.start >= minimum_duration or not compacted:
            compacted.append(event)
            continue
        previous = compacted.pop()
        compacted.append(
            ChordEvent(previous.start, event.end, previous.chord, previous.confidence, previous.method)
        )
    return tuple(compacted)
