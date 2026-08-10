"""Modelos y utilidades comunes sin conocimiento de una herramienta concreta."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class StrictRequest(BaseModel):
    """Base para contratos HTTP que rechazan campos desconocidos."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)
