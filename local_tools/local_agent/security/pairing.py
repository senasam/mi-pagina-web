"""Consentimiento local para asociar un navegador con el agente."""

from __future__ import annotations

import os
import secrets
import threading
import time
from collections import defaultdict, deque
from collections.abc import Callable


def confirm_pairing_locally(origin: str, device_name: str, code: str) -> bool:
    """Muestra una confirmacion fuera del navegador solicitante."""
    message = (
        f"La aplicacion {origin} quiere conectar este navegador ({device_name}) "
        f"con Felipe Local Tools Agent.\n\nCodigo: {code}\n\n"
        "Aprueba solo si acabas de iniciar esta accion."
    )
    if os.name == "nt":
        import ctypes

        result = ctypes.windll.user32.MessageBoxW(
            None,
            message,
            "Emparejar Felipe Local Tools Agent",
            0x00000004 | 0x00000030 | 0x00040000,
        )
        return result == 6
    try:
        from tkinter import messagebox

        return bool(messagebox.askyesno("Emparejar Felipe Local Tools Agent", message))
    except Exception:
        return False


class PairingManager:
    def __init__(
        self,
        confirmer: Callable[[str, str, str], bool] = confirm_pairing_locally,
        *,
        now: Callable[[], float] = time.time,
    ) -> None:
        self.confirmer = confirmer
        self.now = now
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._active_origins: set[str] = set()
        self._lock = threading.Lock()

    def confirm(self, origin: str, device_name: str) -> bool:
        now = self.now()
        with self._lock:
            attempts = self._attempts[origin]
            while attempts and attempts[0] <= now - 60:
                attempts.popleft()
            if len(attempts) >= 3 or origin in self._active_origins:
                return False
            attempts.append(now)
            self._active_origins.add(origin)
        try:
            code = f"{secrets.randbelow(1_000_000):06d}"
            return bool(self.confirmer(origin, device_name, code))
        finally:
            with self._lock:
                self._active_origins.discard(origin)
