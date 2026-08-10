from __future__ import annotations

import threading
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from local_tools.local_agent.models import utc_now


@dataclass
class SoftwareDescriptor:
    id: str
    display_name: str
    description: str
    installed_version: str | None = None
    available_version: str | None = None
    state: str = "not-installed"
    phase: str = "queued"
    installable: bool = False
    update_available: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "displayName": self.display_name,
            "description": self.description,
            "state": self.state,
            "phase": self.phase,
            "installedVersion": self.installed_version,
            "availableVersion": self.available_version,
            "installable": self.installable,
            "updateAvailable": self.update_available,
            "metadata": self.metadata,
        }


@dataclass
class SoftwareInstall:
    id: str
    software_id: str
    action: str
    state: str = "queued"
    phase: str = "queued"
    percentage: float = 0.0
    message: str = "Pending."
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    cancel_event: threading.Event = field(default_factory=threading.Event)
    event_sequence: int = 0
    events: list[dict[str, Any]] = field(default_factory=list)

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "softwareId": self.software_id,
            "action": self.action,
            "state": self.state,
            "phase": self.phase,
            "percentage": self.percentage,
            "message": self.message,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
