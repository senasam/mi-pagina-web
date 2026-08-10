from dataclasses import dataclass

import pytest

from local_tools.local_agent.capabilities import (
    CapabilityDescriptor,
    CapabilityRegistry,
)


@dataclass
class FakeCapability:
    descriptor: CapabilityDescriptor

    def register_routes(self, app, context):
        return None

    async def health(self, context):
        return {"available": True}


def capability(capability_id: str) -> FakeCapability:
    return FakeCapability(CapabilityDescriptor(capability_id, "1", capability_id))


def test_registry_is_explicit_sorted_and_rejects_duplicates():
    registry = CapabilityRegistry()
    registry.register(capability("music-analyzer"))
    registry.register(capability("instagram-exporter"))

    assert [item.descriptor.id for item in registry.list()] == [
        "instagram-exporter",
        "music-analyzer",
    ]
    assert registry.get("music-analyzer").descriptor.version == "1"
    with pytest.raises(ValueError):
        registry.register(capability("music-analyzer"))
    with pytest.raises(KeyError):
        registry.get("unknown")
