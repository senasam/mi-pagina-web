"""Frontera minima entre el Core y una capability local."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol

from fastapi import FastAPI

from ..runtime import AgentPaths


@dataclass(frozen=True)
class OperationDescriptor:
    id: str
    creates_task: bool = True
    interactive: bool = False

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "createsTask": self.creates_task,
            "interactive": self.interactive,
        }


@dataclass(frozen=True)
class CapabilityDescriptor:
    id: str
    version: str
    display_name: str
    operations: tuple[OperationDescriptor, ...] = ()
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "capabilityVersion": self.version,
            "displayName": self.display_name,
            "operations": [operation.public() for operation in self.operations],
            **dict(self.metadata),
        }


@dataclass
class CapabilityContext:
    paths: AgentPaths
    config: dict[str, Any]
    services: dict[str, Any] = field(default_factory=dict)


class Capability(Protocol):
    descriptor: CapabilityDescriptor

    def register_routes(self, app: FastAPI, context: CapabilityContext) -> None: ...

    async def health(self, context: CapabilityContext) -> dict[str, Any]: ...
