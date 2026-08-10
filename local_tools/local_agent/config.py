"""Configuracion persistente y compatible del Local Agent."""

from __future__ import annotations

import json
import os
import secrets
from typing import Any

from .models import utc_now
from .runtime import AgentPaths

DEFAULT_PORT = 8765
DEFAULT_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "https://masanes.cl,https://www.masanes.cl"
)


def load_or_create_config(paths: AgentPaths) -> dict[str, Any]:
    if paths.config.exists():
        data = json.loads(paths.config.read_text(encoding="utf-8"))
        if isinstance(data.get("token"), str) and len(data["token"]) >= 43:
            changed = False
            if data.get("securityVersion") != 2:
                data["securityVersion"] = 2
                changed = True
            if not data.get("agentDeviceId"):
                data["agentDeviceId"] = secrets.token_urlsafe(18)
                changed = True
            if "legacyAuthEnabled" not in data:
                data["legacyAuthEnabled"] = True
                changed = True
            if changed:
                save_config(paths, data)
            return data
    origins = (
        os.environ.get("LOCAL_AGENT_ORIGINS", "").strip()
        or os.environ.get("INSTAGRAM_AGENT_ORIGINS", DEFAULT_ORIGINS)
    )
    data = {
        "token": secrets.token_urlsafe(32),
        "port": int(
            os.environ.get("LOCAL_AGENT_PORT", "").strip()
            or os.environ.get("INSTAGRAM_AGENT_PORT", DEFAULT_PORT)
        ),
        "allowedOrigins": [item.strip() for item in origins.split(",") if item.strip()],
        "securityVersion": 2,
        "agentDeviceId": secrets.token_urlsafe(18),
        "legacyAuthEnabled": False,
        "createdAt": utc_now(),
    }
    save_config(paths, data)
    return data


def save_config(paths: AgentPaths, data: dict[str, Any]) -> None:
    temporary = paths.config.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2), encoding="utf-8")
    try:
        temporary.chmod(0o600)
    except OSError:
        pass
    temporary.replace(paths.config)
