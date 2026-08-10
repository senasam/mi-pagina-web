from __future__ import annotations

from pathlib import Path
from typing import Any


class ArtifactService:
    def __init__(self) -> None:
        self._artifacts: dict[str, dict[str, tuple[dict[str, Any], Path]]] = {}

    def register(self, job_id: str, artifacts: list[dict[str, Any]], internal_paths: dict[str, Path]) -> None:
        mapping: dict[str, tuple[dict[str, Any], Path]] = {}
        for artifact in artifacts:
            artifact_id = artifact.get("id")
            if not artifact_id:
                continue
            path = internal_paths.get(artifact_id)
            if path is None or not path.is_file():
                continue
            mapping[artifact_id] = (artifact, path)
        self._artifacts[job_id] = mapping

    def list(self, job_id: str) -> list[dict[str, Any]]:
        return [metadata for metadata, _ in self._artifacts.get(job_id, {}).values()]

    def get(self, job_id: str, artifact_id: str) -> tuple[dict[str, Any], Path]:
        entry = self._artifacts.get(job_id, {}).get(artifact_id)
        if not entry:
            raise KeyError("Artefacto no encontrado.")
        return entry

    def delete_job(self, job_id: str) -> None:
        self._artifacts.pop(job_id, None)
