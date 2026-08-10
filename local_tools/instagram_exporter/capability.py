"""Adapter de Instagram Exporter para el Capability Registry."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI

from local_tools.local_agent.capabilities import (
    CapabilityContext,
    CapabilityDescriptor,
    OperationDescriptor,
)

from .agent import (
    chrome_available,
    chromium_available,
    ollama_available,
    register_instagram_routes,
)


class InstagramExporterCapability:
    descriptor = CapabilityDescriptor(
        id="instagram-exporter",
        version="1",
        display_name="Instagram Exporter",
        operations=(
            OperationDescriptor("export-account"),
            OperationDescriptor("continue-login", creates_task=False, interactive=True),
            OperationDescriptor("select-count", creates_task=False, interactive=True),
            OperationDescriptor("cancel", creates_task=False),
            OperationDescriptor("open-output", creates_task=False),
        ),
        metadata={"apiVersion": "legacy"},
    )

    def register_routes(self, app: FastAPI, context: CapabilityContext) -> None:
        manager = context.services["instagram_manager"]
        register_instagram_routes(app, paths=context.paths, manager=manager)

    async def health(self, context: CapabilityContext) -> dict[str, Any]:
        del context
        return {
            "available": True,
            "playwright": True,
            "chrome": chrome_available(),
            "chromium": await asyncio.to_thread(chromium_available),
            "ollama": ollama_available(),
        }
