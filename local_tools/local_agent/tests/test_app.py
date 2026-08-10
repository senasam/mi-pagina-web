from pathlib import Path
import hashlib
import hmac
import time
import secrets

from fastapi.testclient import TestClient

from local_tools.instagram_exporter.capability import InstagramExporterCapability
from local_tools.local_agent.app import create_agent_app
from local_tools.local_agent.runtime import AgentPaths
from local_tools.local_agent.security import PairingManager
from local_tools.music_analyzer.capability import MusicAnalyzerCapability

TOKEN = "a" * 43
ORIGIN = "https://app.example"
AUTH = {"Authorization": f"Bearer {TOKEN}", "Origin": ORIGIN}


async def healthy_instagram(self, context):
    return {
        "available": True,
        "playwright": True,
        "chrome": True,
        "chromium": True,
        "ollama": False,
    }


async def healthy_music(self, context):
    return {
        "available": True,
        "engine": {
            "state": "not-installed",
            "available": False,
            "ffmpeg": False,
        },
    }


def make_client(tmp_path: Path, monkeypatch) -> TestClient:
    monkeypatch.setattr(InstagramExporterCapability, "health", healthy_instagram)
    monkeypatch.setattr(MusicAnalyzerCapability, "health", healthy_music)
    paths = AgentPaths.create(tmp_path / "runtime" / "instagram_exporter")
    app = create_agent_app(
        paths=paths,
        config={"token": TOKEN, "allowedOrigins": [ORIGIN]},
    )
    return TestClient(app)


def make_secure_client(
    tmp_path: Path,
    monkeypatch,
    *,
    approved: bool = True,
    legacy_enabled: bool = False,
) -> TestClient:
    monkeypatch.setattr(InstagramExporterCapability, "health", healthy_instagram)
    monkeypatch.setattr(MusicAnalyzerCapability, "health", healthy_music)
    paths = AgentPaths.create(tmp_path / "runtime" / "instagram_exporter")
    app = create_agent_app(
        paths=paths,
        config={
            "token": TOKEN,
            "allowedOrigins": [ORIGIN],
            "securityVersion": 2,
            "legacyAuthEnabled": legacy_enabled,
            "agentDeviceId": "agent-device",
        },
        pairing_manager=PairingManager(lambda _origin, _name, _code: approved),
    )
    return TestClient(app)


def signed_headers(session, method: str, target: str, body: bytes = b"", *, nonce: str | None = None):
    timestamp = str(int(time.time()))
    nonce = nonce or secrets.token_urlsafe(18)
    body_hash = hashlib.sha256(body).hexdigest()
    canonical = f"{method}\n{target}\n{timestamp}\n{nonce}\n{body_hash}".encode()
    signature = hmac.new(session["secret"].encode(), canonical, hashlib.sha256).hexdigest()
    return {
        "Origin": ORIGIN,
        "Authorization": f"Bearer {session['id']}",
        "X-Agent-Session": session["id"],
        "X-Agent-Timestamp": timestamp,
        "X-Agent-Nonce": nonce,
        "X-Agent-Signature": signature,
    }


def test_neutral_agent_discovery_is_authenticated_and_versioned(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        assert client.get("/v1/agent").status_code == 401
        agent = client.get("/v1/agent", headers=AUTH)
        assert agent.status_code == 200
        assert agent.json()["agentVersion"] == "1.3.0"
        assert agent.json()["protocolVersions"] == ["1"]

        response = client.get("/v1/capabilities", headers=AUTH)
        assert response.status_code == 200
        capabilities = response.json()["capabilities"]
        assert [item["id"] for item in capabilities] == [
            "instagram-exporter",
            "music-analyzer",
        ]
        assert capabilities[0]["operations"][0]["id"] == "export-account"
        assert capabilities[1]["operations"][0]["id"] == "analyze"


def test_legacy_routes_remain_available(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        assert client.get("/health").status_code == 200
        assert client.post("/exports", json={"profile": "usuario"}).status_code == 401
        assert client.get("/v1/music/engine", headers=AUTH).status_code == 200
        assert client.get("/docs", headers=AUTH).status_code == 404


def test_explicit_pairing_creates_a_scoped_device_session(tmp_path, monkeypatch):
    client = make_secure_client(tmp_path, monkeypatch)
    with client:
        assert client.get("/health", headers={"Origin": ORIGIN}).json()["pairing"] == "explicit"
        assert client.get("/v1/agent", headers=AUTH).status_code == 401
        paired = client.post(
            "/v1/pairing/requests",
            headers={"Origin": ORIGIN},
            json={"deviceId": "browser-device-123456", "deviceName": "Chrome Windows"},
        )
        assert paired.status_code == 201
        session = paired.json()["session"]
        assert session["scopes"] == ["agent:read", "instagram:execute", "music:execute"]

        response = client.get("/v1/agent", headers=signed_headers(session, "GET", "/v1/agent"))
        assert response.status_code == 200
        assert response.json()["securityVersion"] == 2


def test_pairing_requires_local_approval(tmp_path, monkeypatch):
    client = make_secure_client(tmp_path, monkeypatch, approved=False)
    with client:
        response = client.post(
            "/v1/pairing/requests",
            headers={"Origin": ORIGIN},
            json={"deviceId": "browser-device-123456", "deviceName": "Chrome"},
        )
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "PAIRING_REJECTED"


def test_signed_sessions_reject_replay_tampering_and_revocation(tmp_path, monkeypatch):
    client = make_secure_client(tmp_path, monkeypatch)
    with client:
        session = client.post(
            "/v1/pairing/requests",
            headers={"Origin": ORIGIN},
            json={"deviceId": "browser-device-123456", "deviceName": "Chrome"},
        ).json()["session"]

        replay_headers = signed_headers(session, "GET", "/v1/agent")
        assert client.get("/v1/agent", headers=replay_headers).status_code == 200
        replay = client.get("/v1/agent", headers=replay_headers)
        assert replay.status_code == 401
        assert replay.json()["error"]["code"] == "SESSION_REPLAY"

        signed_body = b'{"profile":"safe"}'
        altered_body = b'{"profile":"altered"}'
        altered = client.post(
            "/exports",
            content=altered_body,
            headers={
                **signed_headers(session, "POST", "/exports", signed_body),
                "Content-Type": "application/json",
            },
        )
        assert altered.status_code == 401
        assert altered.json()["error"]["code"] == "SESSION_SIGNATURE_INVALID"

        revoke = client.post(
            "/v1/session/revoke",
            headers=signed_headers(session, "POST", "/v1/session/revoke"),
        )
        assert revoke.status_code == 204
        rejected = client.get(
            "/v1/agent",
            headers=signed_headers(session, "GET", "/v1/agent"),
        )
        assert rejected.status_code == 401
        assert rejected.json()["error"]["code"] == "SESSION_INVALID"


def test_first_explicit_pairing_disables_the_legacy_master_token(tmp_path, monkeypatch):
    client = make_secure_client(tmp_path, monkeypatch, legacy_enabled=True)
    with client:
        assert client.get("/v1/agent", headers=AUTH).status_code == 200
        assert client.post("/pairing", headers={"Origin": ORIGIN}).status_code == 200

        paired = client.post(
            "/v1/pairing/requests",
            headers={"Origin": ORIGIN},
            json={"deviceId": "browser-device-123456", "deviceName": "Chrome"},
        )
        assert paired.status_code == 201
        assert client.get("/v1/agent", headers=AUTH).status_code == 401
        assert client.post("/pairing", headers={"Origin": ORIGIN}).status_code == 410
