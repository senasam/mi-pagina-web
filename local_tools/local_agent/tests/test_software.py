from hashlib import sha256
import json
import time
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient

from local_tools.local_agent.app import create_agent_app
from local_tools.local_agent.runtime import AgentPaths
from local_tools.local_agent.software.catalog import SOFTWARE_CATALOG


test_catalog = {
    "audio-engine-pack": {
        "displayName": "Audio Engine Pack",
        "description": "Test package.",
        "version": "test-1",
        "url": "bundled:AudioEnginePack.zip",
        "sha256": "0" * 64,
        "metadata": {"platform": "windows-x64"},
    }
}


def make_client(tmp_path: Path) -> TestClient:
    paths = AgentPaths.create(tmp_path / "runtime" / "instagram_exporter")
    app = create_agent_app(
        paths=paths,
        config={"token": "m" * 43, "allowedOrigins": ["https://app.example"]},
    )
    return TestClient(app)


def test_software_list_endpoint(tmp_path: Path):
    client = make_client(tmp_path)
    with client:
        response = client.get(
            "/v1/software",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert response.status_code == 200
        assert "software" in response.json()


def test_software_install_action_creates_task(tmp_path: Path, monkeypatch):
    archive_path = tmp_path / "AudioEnginePack.zip"
    with zipfile.ZipFile(archive_path, "w") as bundle:
        bundle.writestr("audio-engine-pack/engine-pack.json", json.dumps({"version": "test-1"}))
    digest = sha256(archive_path.read_bytes()).hexdigest()

    monkeypatch.setitem(
        SOFTWARE_CATALOG,
        "audio-engine-pack",
        {
            "displayName": "Audio Engine Pack",
            "description": "Test package.",
            "version": "test-1",
            "url": "bundled:AudioEnginePack.zip",
            "sha256": digest,
            "metadata": {"platform": "windows-x64"},
        },
    )

    client = make_client(tmp_path)
    client.app.state.software_manager.providers["portable-zip"].base_dir = tmp_path

    with client:
        response = client.post(
            "/v1/software/audio-engine-pack/actions/install",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert response.status_code == 202
        payload = response.json()
        assert payload["id"] == payload["task"]["id"]
        assert payload["task"]["operation"] == "install"
        assert payload["task"]["status"] in {
            "queued",
            "starting",
            "running",
            "completed",
            "failed",
        }
        assert payload["install"]["phase"] in {"queued", "download", "installing", "completed", "failed", "cancelled"}


def test_software_install_status_includes_phase(tmp_path: Path, monkeypatch):
    archive_path = tmp_path / "AudioEnginePack.zip"
    with zipfile.ZipFile(archive_path, "w") as bundle:
        bundle.writestr("audio-engine-pack/engine-pack.json", json.dumps({"version": "test-1"}))
    digest = sha256(archive_path.read_bytes()).hexdigest()

    monkeypatch.setitem(
        SOFTWARE_CATALOG,
        "audio-engine-pack",
        {
            "displayName": "Audio Engine Pack",
            "description": "Test package.",
            "version": "test-1",
            "url": "bundled:AudioEnginePack.zip",
            "sha256": digest,
            "metadata": {"platform": "windows-x64"},
        },
    )

    client = make_client(tmp_path)
    client.app.state.software_manager.providers["portable-zip"].base_dir = tmp_path

    with client:
        create_response = client.post(
            "/v1/software/audio-engine-pack/actions/install",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert create_response.status_code == 202
        install_id = create_response.json()["id"]

        status_response = client.get(
            f"/v1/software/installs/{install_id}",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert status_response.status_code == 200
        payload = status_response.json()
        assert payload["phase"] in {"queued", "download", "installing", "completed", "failed", "cancelled"}
        assert "message" in payload


def test_software_install_events_stream_replay(tmp_path: Path, monkeypatch):
    archive_path = tmp_path / "AudioEnginePack.zip"
    with zipfile.ZipFile(archive_path, "w") as bundle:
        bundle.writestr("audio-engine-pack/engine-pack.json", json.dumps({"version": "test-1"}))
    digest = sha256(archive_path.read_bytes()).hexdigest()

    monkeypatch.setitem(
        SOFTWARE_CATALOG,
        "audio-engine-pack",
        {
            "displayName": "Audio Engine Pack",
            "description": "Test package.",
            "version": "test-1",
            "url": "bundled:AudioEnginePack.zip",
            "sha256": digest,
            "metadata": {"platform": "windows-x64"},
        },
    )

    client = make_client(tmp_path)
    client.app.state.software_manager.providers["portable-zip"].base_dir = tmp_path

    with client:
        create_response = client.post(
            "/v1/software/audio-engine-pack/actions/install",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert create_response.status_code == 202
        install_id = create_response.json()["id"]

        events_response = client.get(
            f"/v1/software/installs/{install_id}/events",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert events_response.status_code == 200
        assert "event: task.queued" in events_response.text
        assert "event: task.completed" in events_response.text


def test_software_install_cancel_endpoint(tmp_path: Path, monkeypatch):
    archive_path = tmp_path / "AudioEnginePack.zip"
    with zipfile.ZipFile(archive_path, "w") as bundle:
        bundle.writestr("audio-engine-pack/engine-pack.json", json.dumps({"version": "test-1"}))
    digest = sha256(archive_path.read_bytes()).hexdigest()

    monkeypatch.setitem(
        SOFTWARE_CATALOG,
        "audio-engine-pack",
        {
            "displayName": "Audio Engine Pack",
            "description": "Test package.",
            "version": "test-1",
            "url": "bundled:AudioEnginePack.zip",
            "sha256": digest,
            "metadata": {"platform": "windows-x64"},
        },
    )

    def slow_install(self, install):
        import time

        for _ in range(30):
            if install.cancel_event.is_set():
                raise RuntimeError("cancelled")
            time.sleep(0.01)

    monkeypatch.setattr(
        "local_tools.local_agent.software.manager.SoftwareManager.run_install",
        slow_install,
    )

    client = make_client(tmp_path)
    client.app.state.software_manager.providers["portable-zip"].base_dir = tmp_path

    with client:
        create_response = client.post(
            "/v1/software/audio-engine-pack/actions/install",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert create_response.status_code == 202
        install_id = create_response.json()["id"]

        cancel_response = client.post(
            f"/v1/software/installs/{install_id}/cancel",
            headers={"Authorization": f"Bearer {'m' * 43}", "Origin": "https://app.example"},
        )
        assert cancel_response.status_code == 202
        assert cancel_response.json()["task"]["status"] == "cancelled"
        assert cancel_response.json()["install"]["state"] in {"cancelling", "queued", "cancelled"}
