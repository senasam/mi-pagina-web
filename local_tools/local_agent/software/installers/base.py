from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from local_tools.local_agent.software.models import SoftwareInstall


class InstallerProvider(ABC):
    @abstractmethod
    def id(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def install_plan(self, software_id: str, descriptor: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def run_install(self, software_id: str, install: SoftwareInstall, descriptor: dict[str, Any], staging_root: Path) -> None:
        raise NotImplementedError
