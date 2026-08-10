"""Registro explicito; no descubre ni carga codigo desde disco."""

from __future__ import annotations

from .base import Capability


class CapabilityRegistry:
    def __init__(self) -> None:
        self._items: dict[str, Capability] = {}

    def register(self, capability: Capability) -> None:
        capability_id = capability.descriptor.id
        if not capability_id or capability_id in self._items:
            raise ValueError(f"Capability duplicada o no valida: {capability_id!r}")
        self._items[capability_id] = capability

    def get(self, capability_id: str) -> Capability:
        try:
            return self._items[capability_id]
        except KeyError as exc:
            raise KeyError(f"Capability no registrada: {capability_id}") from exc

    def list(self) -> tuple[Capability, ...]:
        return tuple(self._items[key] for key in sorted(self._items))
