import json
import sys
import time
import wave
from pathlib import Path

from fastapi.testclient import TestClient

from agent import AgentPaths, JobManager, create_app
from local_tools.music_analyzer.jobs import MusicJobManager

TOKEN = "m" * 43
ORIGIN = "https://app.example"
AUTH = {"Authorization": f"Bearer {TOKEN}", "Origin": ORIGIN}


FAKE_WORKER = r'''
import json, pathlib, shutil, sys
request = json.loads(pathlib.Path(sys.argv[1]).read_text())
output = pathlib.Path(request["outputDir"])
source = pathlib.Path(request["sourcePath"])
target = output / "mix.wav"
shutil.copy2(source, target)
print(json.dumps({"type":"job_progress","state":"exporting","percentage":90,"phasePercentage":50,"message":"exportando"}), flush=True)
artifact = {"id":"artifact-test","kind":"source-audio","stem":None,"label":"Audio","mimeType":"audio/wav","size":target.stat().st_size,"downloadable":True,"playable":True}
print(json.dumps({"type":"job_result","artifacts":[artifact],"internalArtifacts":[{"id":"artifact-test","path":str(target)}]}), flush=True)
'''


def make_wav(path: Path) -> Path:
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(8000)
        audio.writeframes(b"\x01\x00" * 800)
    return path


def make_music_client(tmp_path: Path):
    paths = AgentPaths.create(tmp_path / "runtime" / "instagram_exporter")
    music = MusicJobManager(
        tmp_path / "runtime" / "music_analyzer",
        worker_command=[sys.executable, "-c", FAKE_WORKER],
    )
    app = create_app(
        paths=paths,
        config={"token": TOKEN, "allowedOrigins": [ORIGIN]},
        manager=JobManager(paths),
        music_manager=music,
    )
    return TestClient(app), music


def wait_terminal(client: TestClient, job_id: str, timeout=3):
    deadline = time.time() + timeout
    while time.time() < deadline:
        response = client.get(f"/v1/music/jobs/{job_id}", headers=AUTH)
        payload = response.json()
        if payload["state"] in {"completed", "failed", "cancelled"}:
            return payload
        time.sleep(0.02)
    raise AssertionError(f"El trabajo no termino: {payload}")


def test_v1_health_is_authenticated_and_preserves_legacy_health(tmp_path):
    client, _ = make_music_client(tmp_path)
    with client:
        assert client.get("/health").status_code == 200
        assert client.get("/v1/health").status_code == 401
        response = client.get("/v1/health", headers=AUTH)
        assert response.status_code == 200
        assert response.json()["tools"]["musicAnalyzer"]["available"] is True


def test_music_job_artifacts_range_download_and_delete(tmp_path):
    client, manager = make_music_client(tmp_path)
    selected = manager.sources.register(make_wav(tmp_path / "song.wav"))
    with client:
        response = client.post(
            "/v1/music/jobs",
            headers=AUTH,
            json={
                "sourceId": selected.id,
                "tasks": {
                    "separateStems": False,
                    "detectChords": True,
                    "detectStemChords": False,
                    "createZip": False,
                },
                "audio": {"convertToWav": False},
            },
        )
        assert response.status_code == 202, response.text
        job_id = response.json()["id"]
        complete = wait_terminal(client, job_id)
        assert complete["state"] == "completed"
        assert complete["artifacts"][0]["id"] == "artifact-test"

        session = client.post(
            f"/v1/music/jobs/{job_id}/artifacts/artifact-test/media-session", headers=AUTH
        )
        assert session.status_code == 200
        media = client.get(
            session.json()["url"], headers={"Origin": ORIGIN, "Range": "bytes=0-3"}
        )
        assert media.status_code == 206
        assert len(media.content) == 4
        assert media.headers["content-range"].startswith("bytes 0-3/")
        assert client.get(
            f"/v1/music/jobs/{job_id}/artifacts/artifact-test/download", headers=AUTH
        ).status_code == 200

        manifest = manager.jobs_root / job_id / "job.json"
        assert str(selected.path) not in manifest.read_text(encoding="utf-8")
        output = manager.get(job_id).output_dir
        assert client.delete(f"/v1/music/jobs/{job_id}", headers=AUTH).status_code == 204
        assert output and not output.exists()

        task = client.get(f"/v1/tasks/{job_id}", headers=AUTH)
        assert task.status_code == 404


def test_music_api_exposes_music_task(tmp_path):
    client, manager = make_music_client(tmp_path)
    selected = manager.sources.register(make_wav(tmp_path / "song.wav"))
    with client:
        response = client.post(
            "/v1/music/jobs",
            headers=AUTH,
            json={
                "sourceId": selected.id,
                "tasks": {
                    "separateStems": False,
                    "detectChords": True,
                    "detectStemChords": False,
                    "createZip": False,
                },
                "audio": {"convertToWav": False},
            },
        )
        assert response.status_code == 202, response.text
        job_id = response.json()["id"]
        complete = wait_terminal(client, job_id)
        assert complete["state"] == "completed"

        task_response = client.get(f"/v1/tasks/{job_id}", headers=AUTH)
        assert task_response.status_code == 200
        task_payload = task_response.json()
        assert task_payload["id"] == job_id
        assert task_payload["capability"] == "music-analyzer"
        assert task_payload["operation"] == "analyze"
        assert task_payload["status"] == "completed"


def test_music_api_rejects_invalid_task_combination(tmp_path):
    client, manager = make_music_client(tmp_path)
    selected = manager.sources.register(make_wav(tmp_path / "song.wav"))
    with client:
        response = client.post(
            "/v1/music/jobs",
            headers=AUTH,
            json={
                "sourceId": selected.id,
                "tasks": {
                    "separateStems": False,
                    "detectChords": False,
                    "detectStemChords": True,
                },
            },
        )
        assert response.status_code == 422
