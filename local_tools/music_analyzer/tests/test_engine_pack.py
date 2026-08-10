import asyncio
import hashlib
import json
import zipfile
from pathlib import Path

import pytest

from local_tools.music_analyzer.engine_pack import EnginePackManager


def create_fake_pack(tmp_path: Path, *, bad_hash=False, with_bom=False) -> Path:
    archive = tmp_path / "AudioEnginePack.zip"
    files = {
        "audio-engine-pack/engine-pack.json": json.dumps({"version": "test-1"}),
        "audio-engine-pack/python/python.exe": "python",
        "audio-engine-pack/ffmpeg/bin/ffmpeg.exe": "ffmpeg",
        "audio-engine-pack/ffmpeg/bin/ffprobe.exe": "ffprobe",
        "audio-engine-pack/local_tools/music_analyzer/worker.py": "# worker",
    }
    with zipfile.ZipFile(archive, "w") as bundle:
        for name, content in files.items():
            bundle.writestr(name, content)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    descriptor = tmp_path / "engine-pack-manifest.json"
    descriptor.write_text(json.dumps({
        "schemaVersion": 1, "version": "test-1", "platform": "windows-x64",
        "size": archive.stat().st_size, "sha256": "0" * 64 if bad_hash else digest,
        "url": "bundled:AudioEnginePack.zip",
    }), encoding="utf-8-sig" if with_bom else "utf-8")
    return descriptor


def test_engine_pack_installs_verified_bundled_archive(tmp_path: Path):
    manager = EnginePackManager(tmp_path / "runtime", descriptor_path=create_fake_pack(tmp_path))
    async def install_pack():
        install = await manager.start_install()
        await install.task
        return install
    install = asyncio.run(install_pack())
    assert install.state == "completed"
    assert manager.status()["available"] is True
    assert manager.worker_command("local_tools.music_analyzer.worker")[0].endswith("python.exe")
    assert "ffmpeg" in manager.worker_environment()["PATH"]


def test_engine_pack_rejects_wrong_hash(tmp_path: Path):
    manager = EnginePackManager(tmp_path / "runtime", descriptor_path=create_fake_pack(tmp_path, bad_hash=True))
    async def install_pack():
        install = await manager.start_install()
        await install.task
        return install
    install = asyncio.run(install_pack())
    assert install.state == "failed"
    assert manager.status()["available"] is False


def test_engine_pack_accepts_powershell_utf8_bom_manifest(tmp_path: Path):
    manager = EnginePackManager(
        tmp_path / "runtime", descriptor_path=create_fake_pack(tmp_path, with_bom=True)
    )
    assert manager.status()["installable"] is True
