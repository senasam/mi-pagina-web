"""Pairing y sesiones autenticadas del Local Agent."""

from .pairing import PairingManager, confirm_pairing_locally
from .sessions import SessionAuthenticationError, SessionManager

__all__ = [
    "PairingManager",
    "SessionAuthenticationError",
    "SessionManager",
    "confirm_pairing_locally",
]
