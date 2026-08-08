import asyncio
import subprocess
import sys
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from agent import AgentPaths, ExportCancelled, JobManager, create_app, ensure_within, validate_profile
from instagram_exporter import profile_url_from_browser_url

TOKEN = "t" * 43
ORIGIN = "https://app.example"
AUTH = {"Authorization": f"Bearer {TOKEN}", "Origin": ORIGIN}


class InteractiveEngine:
    def __init__(self, config, interaction, *, on_event, cancel_event, **_):
        self.interaction, self.on_event, self.cancel_event = interaction, on_event, cancel_event

    async def run(self):
        self.interaction.browser_is_on_target_profile = lambda: True
        await self.on_event("state_changed", {"state": "opening_browser", "message": "opening"})
        await self.on_event("browser_opened", {})
        await self.on_event("state_changed", {"state": "awaiting_login", "message": "login"})
        while not self.interaction.login_event.is_set():
            if self.cancel_event.is_set():
                raise ExportCancelled()
            await asyncio.sleep(0.01)
        await self.on_event("state_changed", {"state": "collecting_posts", "message": "counting"})
        await self.on_event("total_found", {"total": 3})
        await self.on_event("state_changed", {"state": "awaiting_selection", "message": "select"})
        while not self.interaction.selection_event.is_set():
            if self.cancel_event.is_set():
                raise ExportCancelled()
            await asyncio.sleep(0.01)
        selected = self.interaction.selection or 3
        await self.on_event("selection_applied", {"selected": selected})
        await self.on_event("state_changed", {"state": "exporting", "message": "exporting"})
        for index in range(1, selected + 1):
            if self.cancel_event.is_set():
                raise ExportCancelled()
            await self.on_event("post_completed", {"index": index, "total": selected, "url": "https://instagram.com/p/x/"})
        return {"processed": selected}


class FailingEngine:
    def __init__(self, *_args, **_kwargs): pass
    async def run(self): raise RuntimeError("fallo simulado")


def make_client(tmp_path: Path, engine=InteractiveEngine):
    paths = AgentPaths.create(tmp_path / "runtime" / "instagram_exporter")
    manager = JobManager(paths, engine_factory=engine)
    app = create_app(paths=paths, config={"token": TOKEN, "allowedOrigins": [ORIGIN]}, manager=manager)
    return TestClient(app), paths


def wait_state(client, job_id, state, timeout=2):
    deadline = time.time() + timeout
    while time.time() < deadline:
        payload = client.get(f"/exports/{job_id}", headers=AUTH).json()
        if payload["state"] == state:
            return payload
        time.sleep(0.02)
    raise AssertionError(f"El trabajo no alcanzo {state}: {payload}")


@pytest.mark.parametrize("value", ["usuario.valido", "@usuario", "https://www.instagram.com/usuario.valido/"])
def test_profile_validation_accepts_profiles(value):
    assert validate_profile(value).startswith("https://www.instagram.com/")


@pytest.mark.parametrize("value", ["", "https://example.com/user", "bad/name", "https://instagram.com/explore/"])
def test_profile_validation_rejects_unsafe_values(value):
    with pytest.raises(ValueError): validate_profile(value)


def test_browser_url_only_accepts_exact_profile():
    assert profile_url_from_browser_url("https://www.instagram.com/alguien/")
    assert not profile_url_from_browser_url("https://www.instagram.com/accounts/login/")
    assert not profile_url_from_browser_url("https://www.instagram.com/p/ABC/")


def test_paths_cannot_escape_runtime(tmp_path):
    root = tmp_path / "runtime"
    assert ensure_within(root / "exports", root) == (root / "exports").resolve()
    with pytest.raises(ValueError): ensure_within(tmp_path / "outside", root)


def test_health_is_public_but_exports_require_token(tmp_path):
    client, _ = make_client(tmp_path)
    with client:
        assert client.get("/health").status_code == 200
        assert client.post("/exports", json={"profile": "usuario"}).status_code == 401
        assert client.post("/exports", json={"profile": "usuario"}, headers={"Authorization": "Bearer no"}).status_code == 401


def test_pairing_is_automatic_only_for_an_allowed_browser_origin(tmp_path):
    client, _ = make_client(tmp_path)
    with client:
        response = client.post("/pairing", headers={"Origin": ORIGIN})
        assert response.status_code == 200
        assert response.json() == {"token": TOKEN}
        assert client.post("/pairing").status_code == 401
        assert client.post("/pairing", headers={"Origin": "https://evil.example"}).status_code == 403


def test_cors_allows_configured_origin_and_rejects_unknown(tmp_path):
    client, _ = make_client(tmp_path)
    with client:
        response = client.options("/exports", headers={"Origin": ORIGIN, "Access-Control-Request-Method": "POST", "Access-Control-Request-Private-Network": "true"})
        assert response.status_code == 204
        assert response.headers["access-control-allow-origin"] == ORIGIN
        assert response.headers["access-control-allow-private-network"] == "true"
        assert client.get("/health", headers={"Origin": "https://evil.example"}).status_code == 403


def test_create_continue_select_and_complete_state_cycle(tmp_path):
    client, paths = make_client(tmp_path)
    with client:
        response = client.post("/exports", json={"profile": "usuario"}, headers=AUTH)
        assert response.status_code == 202
        job_id = response.json()["id"]
        wait_state(client, job_id, "awaiting_login")
        assert client.post(f"/exports/{job_id}/continue", headers=AUTH).status_code == 200
        state = wait_state(client, job_id, "awaiting_selection")
        assert state["totalFound"] == 3
        assert client.post(f"/exports/{job_id}/selection", json={"count": 2}, headers=AUTH).status_code == 200
        complete = wait_state(client, job_id, "completed")
        assert complete["selectedCount"] == 2
        assert complete["currentPost"] == 2
        assert complete["percentage"] == 100
        assert Path(complete["outputFolder"]).is_relative_to(paths.exports)


def test_cancel_is_cooperative_and_keeps_manifest_folder(tmp_path):
    client, _ = make_client(tmp_path)
    with client:
        job_id = client.post("/exports", json={"profile": "usuario"}, headers=AUTH).json()["id"]
        state = wait_state(client, job_id, "awaiting_login")
        output = Path(state["outputFolder"])
        assert client.post(f"/exports/{job_id}/cancel", headers=AUTH).status_code == 202
        assert wait_state(client, job_id, "cancelled")["state"] == "cancelled"
        assert output.is_dir()


def test_errors_are_structured(tmp_path):
    client, _ = make_client(tmp_path, FailingEngine)
    with client:
        job_id = client.post("/exports", json={"profile": "usuario"}, headers=AUTH).json()["id"]
        failed = wait_state(client, job_id, "failed")
        assert failed["error"] == "fallo simulado"


def test_sse_replays_events_and_closes_for_terminal_job(tmp_path):
    client, _ = make_client(tmp_path, FailingEngine)
    with client:
        job_id = client.post("/exports", json={"profile": "usuario"}, headers=AUTH).json()["id"]
        wait_state(client, job_id, "failed")
        response = client.get(f"/exports/{job_id}/events", headers=AUTH)
        assert response.status_code == 200
        assert "event: error" in response.text
        assert "fallo simulado" in response.text


def test_previous_cli_still_starts():
    script = Path(__file__).resolve().parents[1] / "instagram_exporter.py"
    result = subprocess.run([sys.executable, str(script), "--version"], capture_output=True, text=True, timeout=15)
    assert result.returncode == 0
    assert "Instagram Exporter" in result.stdout
