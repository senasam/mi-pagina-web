"""Validacion del cache de modelos, sin dependencias de FastAPI."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .contracts import ALLOWED_SEPARATION_MODELS, EngineError


def marker_path(model_root: Path, model_id: str) -> Path:
    if model_id not in ALLOWED_SEPARATION_MODELS:
        raise EngineError("invalid_model", "El modelo Demucs no esta permitido.")
    return Path(model_root).resolve() / f"{model_id}.installed.json"


def validate_installed_model(model_root: Path, model_id: str) -> dict[str, Any]:
    marker = marker_path(model_root, model_id)
    if not marker.is_file():
        raise EngineError("model_not_installed", f"Descarga {model_id} antes de iniciar el analisis.")
    try:
        payload = json.loads(marker.read_text(encoding="utf-8"))
        checkpoints = payload["checkpoints"]
        root = Path(model_root).resolve()
        resolved = [(root / item["path"]).resolve() for item in checkpoints]
        if not checkpoints or any(
            not path.is_relative_to(root) or not path.is_file() for path in resolved
        ):
            raise ValueError("checkpoint missing")
        return payload
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise EngineError("model_corrupt", f"Vuelve a descargar el modelo {model_id}.") from exc
