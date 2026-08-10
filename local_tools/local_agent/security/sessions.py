"""Sesiones por dispositivo con firma HMAC y proteccion contra replay."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import secrets
import threading
import time
from pathlib import Path
from typing import Any

NONCE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{16,128}$")
DEFAULT_SESSION_SECONDS = 12 * 60 * 60
MAX_CLOCK_SKEW_SECONDS = 90


class SessionAuthenticationError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def _encode_secret(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _canonical_request(
    method: str,
    target: str,
    timestamp: str,
    nonce: str,
    body: bytes,
) -> bytes:
    body_hash = hashlib.sha256(body).hexdigest()
    return f"{method.upper()}\n{target}\n{timestamp}\n{nonce}\n{body_hash}".encode()


class SessionManager:
    """Persiste dispositivos/sesiones y mantiene nonces solo en memoria."""

    def __init__(self, state_path: Path, *, now: callable = time.time) -> None:
        self.state_path = state_path
        self.now = now
        self._lock = threading.RLock()
        self._nonces: dict[str, dict[str, float]] = {}
        self._state = self._load()

    def _load(self) -> dict[str, Any]:
        if self.state_path.exists():
            try:
                data = json.loads(self.state_path.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    data.setdefault("devices", {})
                    data.setdefault("sessions", {})
                    return data
            except (OSError, ValueError):
                pass
        return {"version": 1, "devices": {}, "sessions": {}}

    def _save(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.state_path.with_suffix(".tmp")
        temporary.write_text(json.dumps(self._state, indent=2), encoding="utf-8")
        try:
            temporary.chmod(0o600)
        except OSError:
            pass
        temporary.replace(self.state_path)

    def create(
        self,
        *,
        device_id: str,
        device_name: str,
        origin: str,
        scopes: list[str],
        lifetime_seconds: int = DEFAULT_SESSION_SECONDS,
    ) -> dict[str, Any]:
        now = self.now()
        session_id = secrets.token_urlsafe(24)
        secret = _encode_secret(secrets.token_bytes(32))
        expires_at = now + lifetime_seconds
        with self._lock:
            for previous_id, previous in self._state["sessions"].items():
                if (
                    previous.get("deviceId") == device_id
                    and previous.get("origin") == origin
                    and not previous.get("revokedAt")
                ):
                    previous["revokedAt"] = now
                    self._nonces.pop(previous_id, None)
            self._state["devices"][device_id] = {
                "id": device_id,
                "name": device_name[:80],
                "origin": origin,
                "pairedAt": now,
                "lastSeenAt": now,
            }
            self._state["sessions"][session_id] = {
                "id": session_id,
                "secret": secret,
                "deviceId": device_id,
                "origin": origin,
                "scopes": sorted(set(scopes)),
                "createdAt": now,
                "expiresAt": expires_at,
                "revokedAt": None,
            }
            self._purge_locked(now)
            self._save()
        return {
            "id": session_id,
            "secret": secret,
            "deviceId": device_id,
            "scopes": sorted(set(scopes)),
            "expiresAt": expires_at,
        }

    def authenticate(
        self,
        *,
        session_id: str,
        origin: str,
        method: str,
        target: str,
        timestamp: str,
        nonce: str,
        signature: str,
        body: bytes,
    ) -> dict[str, Any]:
        try:
            issued_at = int(timestamp)
        except (TypeError, ValueError) as error:
            raise SessionAuthenticationError("SESSION_TIMESTAMP_INVALID", "Timestamp no valido.") from error
        now = self.now()
        if abs(now - issued_at) > MAX_CLOCK_SKEW_SECONDS:
            raise SessionAuthenticationError("SESSION_TIMESTAMP_EXPIRED", "La firma expiro.")
        if not NONCE_PATTERN.fullmatch(nonce or ""):
            raise SessionAuthenticationError("SESSION_NONCE_INVALID", "Nonce no valido.")
        with self._lock:
            session = self._state["sessions"].get(session_id)
            if not session or session.get("revokedAt"):
                raise SessionAuthenticationError("SESSION_INVALID", "Sesion no valida.")
            if float(session.get("expiresAt", 0)) <= now:
                raise SessionAuthenticationError("SESSION_EXPIRED", "La sesion expiro.")
            if not origin or not hmac.compare_digest(str(session.get("origin", "")), origin):
                raise SessionAuthenticationError("SESSION_ORIGIN_INVALID", "Origen de sesion no valido.")
            expected = hmac.new(
                str(session["secret"]).encode(),
                _canonical_request(method, target, timestamp, nonce, body),
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, signature or ""):
                raise SessionAuthenticationError("SESSION_SIGNATURE_INVALID", "Firma no valida.")
            recent = self._nonces.setdefault(session_id, {})
            for value, expiry in tuple(recent.items()):
                if expiry <= now:
                    recent.pop(value, None)
            if nonce in recent:
                raise SessionAuthenticationError("SESSION_REPLAY", "Solicitud repetida.")
            recent[nonce] = now + MAX_CLOCK_SKEW_SECONDS
            device = self._state["devices"].get(session["deviceId"])
            if device:
                device["lastSeenAt"] = now
            return {key: value for key, value in session.items() if key != "secret"}

    def revoke(self, session_id: str) -> None:
        with self._lock:
            session = self._state["sessions"].get(session_id)
            if session and not session.get("revokedAt"):
                session["revokedAt"] = self.now()
                self._nonces.pop(session_id, None)
                self._save()

    def current_public(self, session_id: str) -> dict[str, Any] | None:
        session = self._state["sessions"].get(session_id)
        if not session:
            return None
        device = self._state["devices"].get(session.get("deviceId"), {})
        return {
            "id": session["id"],
            "device": {key: device.get(key) for key in ("id", "name", "pairedAt", "lastSeenAt")},
            "scopes": session.get("scopes", []),
            "expiresAt": session.get("expiresAt"),
        }

    def _purge_locked(self, now: float) -> None:
        expired = [
            session_id
            for session_id, session in self._state["sessions"].items()
            if float(session.get("expiresAt", 0)) <= now
        ]
        for session_id in expired:
            self._state["sessions"].pop(session_id, None)
            self._nonces.pop(session_id, None)
