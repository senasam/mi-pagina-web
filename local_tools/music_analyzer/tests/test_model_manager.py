import json
from pathlib import Path

import pytest

from local_tools.music_analyzer.contracts import EngineError, ProgressReporter, SeparationOptions
from local_tools.music_analyzer.engine.separation import LocalDemucsProvider
from local_tools.music_analyzer.model_manager import ModelManager
from local_tools.music_analyzer.model_store import validate_installed_model


def test_model_marker_must_reference_existing_scoped_checkpoint(tmp_path: Path):
    with pytest.raises(EngineError) as caught:
        validate_installed_model(tmp_path, "htdemucs")
    assert caught.value.code == "model_not_installed"

    checkpoint = tmp_path / "hub" / "checkpoints" / "model.th"
    checkpoint.parent.mkdir(parents=True)
    checkpoint.write_bytes(b"weights")
    marker = tmp_path / "htdemucs.installed.json"
    marker.write_text(json.dumps({"modelId": "htdemucs", "checkpoints": [{"path": "hub/checkpoints/model.th", "size": 7}]}))
    assert validate_installed_model(tmp_path, "htdemucs")["modelId"] == "htdemucs"

    marker.write_text(json.dumps({"checkpoints": [{"path": "../../outside.th", "size": 1}]}))
    with pytest.raises(EngineError) as caught:
        validate_installed_model(tmp_path, "htdemucs")
    assert caught.value.code == "model_corrupt"


def test_catalog_and_delete_only_use_manifest_files(tmp_path: Path):
    checkpoint = tmp_path / "model.th"
    checkpoint.write_bytes(b"weights")
    (tmp_path / "htdemucs.installed.json").write_text(json.dumps({"modelId": "htdemucs", "checkpoints": [{"path": "model.th", "size": 7}]}))
    manager = ModelManager(tmp_path)
    assert manager.catalog()[0]["state"] == "installed"
    manager.delete("htdemucs")
    assert not checkpoint.exists()
    assert manager.catalog()[0]["state"] == "not-installed"


def test_demucs_refuses_implicit_model_download(wav_file: Path, tmp_path: Path):
    provider = LocalDemucsProvider(model_cache=tmp_path / "models")
    reporter = ProgressReporter(lambda event: None)
    with pytest.raises(EngineError) as caught:
        provider.separate(wav_file, tmp_path / "out", SeparationOptions(), reporter)
    assert caught.value.code == "model_not_installed"
