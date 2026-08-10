"""Adapter de Music Analyzer para el Capability Registry."""

from __future__ import annotations

import importlib.util
import shutil
import sys
from typing import Any

from fastapi import FastAPI

from local_tools.local_agent.capabilities import (
    CapabilityContext,
    CapabilityDescriptor,
    OperationDescriptor,
)

from .api import create_music_router


class MusicAnalyzerCapability:
    descriptor = CapabilityDescriptor(
        id="music-analyzer",
        version="1",
        display_name="Music Analyzer",
        operations=(
            OperationDescriptor("analyze"),
            OperationDescriptor("cancel", creates_task=False),
            OperationDescriptor("install-engine"),
            OperationDescriptor("manage-model", creates_task=True),
            OperationDescriptor("open-output", creates_task=False),
        ),
        metadata={
            "apiVersion": "v1",
            "formats": ["wav", "mp3", "flac", "m4a"],
            "models": ["htdemucs", "htdemucs_6s"],
        },
    )

    def register_routes(self, app: FastAPI, context: CapabilityContext) -> None:
        app.include_router(
            create_music_router(
                context.services["music_manager"],
                context.services["model_manager"],
                context.services["engine_pack_manager"],
            )
        )

    async def health(self, context: CapabilityContext) -> dict[str, Any]:
        engine_pack = context.services["engine_pack_manager"]
        status = engine_pack.status()
        installed = engine_pack.installed_root()
        development_engine = (
            not getattr(sys, "frozen", False)
            and importlib.util.find_spec("demucs") is not None
            and importlib.util.find_spec("librosa") is not None
        )
        return {
            "available": True,
            "engine": {
                **status,
                "available": bool(status["available"] or development_engine),
                "ffmpeg": bool(installed) or shutil.which("ffmpeg") is not None,
            },
        }
