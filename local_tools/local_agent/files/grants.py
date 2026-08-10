from __future__ import annotations

import secrets
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from local_tools.local_agent.models import utc_now


SourceValidator = Callable[[Path], Any]


@dataclass(frozen=True)
class SelectedSource:
    id: str
    path: Path = field(repr=False)
    name: str = ""
    extension: str = ""
    size: int = 0
    duration: float | None = None

    def public(self) -> dict[str, Any]:
        return {
            "sourceId": self.id,
            "name": self.name,
            "extension": self.extension,
            "size": self.size,
            "duration": self.duration,
        }


class SourceRegistry:
    def __init__(self, validator: SourceValidator | None = None, *, max_sources: int = 20):
        self.validator = validator
        self.max_sources = max_sources
        self._sources: dict[str, SelectedSource] = {}
        self._order: deque[str] = deque()

    def register(self, path: Path) -> SelectedSource:
        resolved = path.expanduser().resolve()
        if not resolved.is_file():
            raise ValueError("Selecciona un archivo de audio existente.")
        metadata = None
        if self.validator:
            metadata = self.validator(resolved)
        source_id = secrets.token_urlsafe(24)
        source = SelectedSource(
            id=source_id,
            path=resolved,
            name=getattr(metadata, "name", resolved.name),
            extension=getattr(metadata, "extension", resolved.suffix.lstrip(".").lower()),
            size=getattr(metadata, "size", resolved.stat().st_size),
            duration=getattr(metadata, "duration", None),
        )
        while len(self._order) >= self.max_sources:
            self._sources.pop(self._order.popleft(), None)
        self._sources[source_id] = source
        self._order.append(source_id)
        return source

    def get(self, source_id: str) -> SelectedSource:
        source = self._sources.get(source_id)
        if not source:
            raise KeyError("Seleccion de audio no encontrada.")
        return source

    def revoke(self, source_id: str) -> bool:
        removed = self._sources.pop(source_id, None) is not None
        if removed:
            try:
                self._order.remove(source_id)
            except ValueError:
                pass
        return removed


class FileGrantService:
    """Servicio unificado de grants de archivos: fuentes (read) y destinos (write).

    Este wrapper mantiene compatibilidad con SourceRegistry y DestinationRegistry
    pero centraliza la gestión para permitir TTL, auditoría y políticas comunes.
    """

    def __init__(self, validator: SourceValidator | None = None, *, max_sources: int = 20):
        self.source_registry = SourceRegistry(validator, max_sources=max_sources)
        from local_tools.local_agent.destinations import DestinationRegistry

        self.destination_registry = DestinationRegistry()

    # Source-facing API (compatibility)
    def register(self, path: Path) -> SelectedSource:
        return self.source_registry.register(path)

    def get(self, source_id: str) -> SelectedSource:
        return self.source_registry.get(source_id)

    def revoke(self, source_id: str) -> bool:
        return self.source_registry.revoke(source_id)

    # Destination-facing API
    def register_destination(self, path: Path) -> tuple[str, str]:
        return self.destination_registry.register(path)

    def consume_destination(self, destination_id: str) -> Path | None:
        return self.destination_registry.consume(destination_id)

    def revoke_destination(self, destination_id: str) -> bool:
        return self.destination_registry.revoke(destination_id)
