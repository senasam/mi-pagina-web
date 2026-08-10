"""Autorizaciones opacas y de un solo uso para carpetas elegidas localmente."""

from __future__ import annotations

import secrets
from pathlib import Path


def ensure_within(path: Path, root: Path) -> Path:
    resolved = path.expanduser().resolve()
    base = root.expanduser().resolve()
    try:
        resolved.relative_to(base)
    except ValueError as exc:
        raise ValueError("La ruta escapa del runtime autorizado.") from exc
    return resolved


class DestinationRegistry:
    def __init__(self) -> None:
        self._destinations: dict[str, Path] = {}

    def register(self, path: Path) -> tuple[str, str]:
        resolved = path.expanduser().resolve()
        if not resolved.is_dir():
            raise ValueError("Selecciona una carpeta existente.")
        destination_id = secrets.token_urlsafe(24)
        self._destinations[destination_id] = resolved
        return destination_id, resolved.name

    def consume(self, destination_id: str) -> Path | None:
        return self._destinations.pop(destination_id, None)

    def revoke(self, destination_id: str) -> bool:
        return self._destinations.pop(destination_id, None) is not None
