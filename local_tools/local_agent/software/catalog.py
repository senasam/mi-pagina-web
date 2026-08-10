from __future__ import annotations

from typing import Any

SOFTWARE_CATALOG: dict[str, dict[str, Any]] = {
    "audio-engine-pack": {
        "displayName": "Audio Engine Pack",
        "description": "Dependencias locales de audio para demucs, ffmpeg y el worker.",
        "version": "test-1",
        "url": "bundled:AudioEnginePack.zip",
        "sha256": "",
        "metadata": {"platform": "windows-x64"},
    },
    "felipe-local-agent": {
        "displayName": "Felipe Local Tools Agent",
        "description": "Instalador del agente local para gestionar tareas desde la web.",
        "version": "1.0.0",
        "url": "https://github.com/senasam/mi-pagina-web/releases/latest/download/FelipeLocalTools-Setup.exe",
        "sha256": "",
        "metadata": {"platform": "windows-x64"},
    },
}
