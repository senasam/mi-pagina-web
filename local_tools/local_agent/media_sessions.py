from __future__ import annotations

import secrets
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class MediaSession:
    id: str
    job_id: str
    artifact_id: str
    path: Path = field(repr=False)
    origin: str
    expires_at: float

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "jobId": self.job_id,
            "artifactId": self.artifact_id,
            "origin": self.origin,
            "expiresAt": self.expires_at,
        }


class MediaSessionService:
    def __init__(self) -> None:
        self._sessions: dict[str, MediaSession] = {}

    def create(self, job_id: str, artifact_id: str, path: Path, origin: str, ttl: int = 300) -> MediaSession:
        now = time.time()
        session_id = secrets.token_urlsafe(32)
        session = MediaSession(
            id=session_id,
            job_id=job_id,
            artifact_id=artifact_id,
            path=path,
            origin=origin,
            expires_at=now + ttl,
        )
        self._sessions[session_id] = session
        self._cleanup(now)
        return session

    def get(self, session_id: str, origin: str) -> MediaSession:
        self._cleanup(time.time())
        session = self._sessions.get(session_id)
        if not session or session.origin != origin or session.expires_at <= time.time():
            self._sessions.pop(session_id, None)
            raise KeyError("Sesion de reproduccion expirada o invalida.")
        return session

    def revoke_job_sessions(self, job_id: str) -> None:
        for session_id, session in tuple(self._sessions.items()):
            if session.job_id == job_id:
                self._sessions.pop(session_id, None)

    def _cleanup(self, now: float) -> None:
        for session_id, session in tuple(self._sessions.items()):
            if session.expires_at <= now:
                self._sessions.pop(session_id, None)
