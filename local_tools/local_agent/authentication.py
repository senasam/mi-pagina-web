"""Token Bearer, CORS exacto, PNA y limites del agente loopback."""

from __future__ import annotations

import hmac
from collections.abc import Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from .security import SessionAuthenticationError, SessionManager


def _error(code: str, message: str, status: int) -> JSONResponse:
    return JSONResponse(
        {"error": {"code": code, "message": message, "retryable": False}},
        status_code=status,
    )


def _required_scope(path: str, method: str) -> str:
    if path.startswith("/exports") or path.startswith("/destinations") or path.startswith("/credentials"):
        return "instagram:execute"
    if path.startswith("/v1/music") or path.startswith("/v1/models"):
        return "music:execute"
    if path.startswith("/v1/software") and method != "GET":
        return "software:manage"
    return "agent:read"


def install_security_middleware(
    app: FastAPI,
    *,
    token: str,
    allowed_origins: set[str],
    public_routes: set[tuple[str, str]],
    pairing_routes: set[tuple[str, str]],
    sessions: SessionManager | None = None,
    legacy_auth_enabled: Callable[[], bool] = lambda: True,
    max_body_bytes: int = 16_384,
    public_path_predicate: Callable[[Request], bool] | None = None,
) -> None:
    """Instala una unica politica de seguridad reutilizable en el agente."""

    @app.middleware("http")
    async def local_agent_security(request: Request, call_next: Callable) -> Response:
        origin = request.headers.get("origin", "")
        if origin and origin not in allowed_origins:
            return _error("ORIGIN_FORBIDDEN", "Origen no autorizado.", 403)
        if request.method == "OPTIONS":
            response = Response(status_code=204)
        else:
            length = request.headers.get("content-length")
            try:
                declared_length = int(length) if length else 0
            except ValueError:
                return _error("CONTENT_LENGTH_INVALID", "Content-Length no valido.", 400)
            if declared_length > max_body_bytes:
                return _error("REQUEST_TOO_LARGE", "Solicitud demasiado grande.", 413)
            body = b""
            if request.method in {"POST", "PUT", "PATCH"}:
                body = await request.body()
                if len(body) > max_body_bytes:
                    return _error("REQUEST_TOO_LARGE", "Solicitud demasiado grande.", 413)

            route = (request.method, request.url.path)
            is_public = route in public_routes or bool(
                public_path_predicate and public_path_predicate(request)
            )
            is_origin_pairing = route in pairing_routes and origin in allowed_origins
            if not (is_public or is_origin_pairing):
                authorization = request.headers.get("authorization", "")
                expected = f"Bearer {token}"
                is_legacy = legacy_auth_enabled() and hmac.compare_digest(
                    authorization.encode(), expected.encode()
                )
                if not is_legacy:
                    session_id = request.headers.get("x-agent-session", "")
                    if not session_id and authorization.startswith("Bearer "):
                        session_id = authorization[7:]
                    if not sessions or not session_id:
                        return _error("SESSION_REQUIRED", "Se requiere una sesion emparejada.", 401)
                    query = request.url.query
                    target = request.url.path + (f"?{query}" if query else "")
                    try:
                        session = sessions.authenticate(
                            session_id=session_id,
                            origin=origin,
                            method=request.method,
                            target=target,
                            timestamp=request.headers.get("x-agent-timestamp", ""),
                            nonce=request.headers.get("x-agent-nonce", ""),
                            signature=request.headers.get("x-agent-signature", ""),
                            body=body,
                        )
                    except SessionAuthenticationError as error:
                        return _error(error.code, str(error), 401)
                    required_scope = _required_scope(request.url.path, request.method)
                    if required_scope not in session.get("scopes", []):
                        return _error("SESSION_SCOPE_FORBIDDEN", "La sesion no permite esta operacion.", 403)
                    request.state.agent_session = session
            response = await call_next(request)

        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Headers"] = (
                "Authorization, Content-Type, Last-Event-ID, "
                "X-Agent-Session, X-Agent-Timestamp, X-Agent-Nonce, X-Agent-Signature"
            )
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
            if request.headers.get("access-control-request-private-network") == "true":
                response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response
