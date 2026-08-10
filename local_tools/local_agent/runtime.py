"""Rutas del runtime compartido del Local Agent.

La disposicion conserva las carpetas historicas de Instagram para que una
actualizacion no pierda sesiones ni exportaciones. Las nuevas capabilities
deben usar ``capability_root`` en vez de agregar mas campos al Core.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

from .destinations import ensure_within


def project_runtime() -> Path:
    override = (
        os.environ.get("LOCAL_AGENT_RUNTIME", "").strip()
        or os.environ.get("INSTAGRAM_AGENT_RUNTIME", "").strip()
    )
    if override:
        return Path(override).expanduser().resolve()
    source = Path(__file__).resolve()
    if not getattr(sys, "frozen", False):
        return (source.parents[2] / "runtime" / "instagram_exporter").resolve()
    local = Path(os.environ.get("LOCALAPPDATA", source.parent))
    return (
        local
        / "FelipeMasanes"
        / "InstagramExporter"
        / "runtime"
        / "instagram_exporter"
    ).resolve()


@dataclass
class AgentPaths:
    """Paths del agente con aliases heredados de Instagram.

    ``root`` mantiene el valor historico. El runtime neutral completo es su
    padre y las nuevas capabilities se alojan como hermanas mediante
    ``capability_root``.
    """

    root: Path
    session: Path
    exports: Path
    logs: Path
    config: Path

    @property
    def runtime_root(self) -> Path:
        return self.root.parent

    def capability_root(self, capability_id: str) -> Path:
        safe = capability_id.strip().lower().replace("-", "_")
        if not safe or any(character not in "abcdefghijklmnopqrstuvwxyz0123456789_" for character in safe):
            raise ValueError("Identificador de capability no valido.")
        path = ensure_within(self.runtime_root / safe, self.runtime_root)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def security_state(self) -> Path:
        return ensure_within(self.runtime_root / "agent-security.json", self.runtime_root)

    @property
    def tasks_root(self) -> Path:
        path = ensure_within(self.runtime_root / "tasks", self.runtime_root)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def task_events_root(self) -> Path:
        path = ensure_within(self.runtime_root / "task-events", self.runtime_root)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @classmethod
    def create(cls, root: Path | None = None) -> "AgentPaths":
        base = (root or project_runtime()).resolve()
        paths = cls(
            root=base,
            session=base / "session",
            exports=base / "exports",
            logs=base / "logs",
            config=base / "agent-config.json",
        )
        for item in (paths.session, paths.exports, paths.logs):
            ensure_within(item, base).mkdir(parents=True, exist_ok=True)
        return paths
