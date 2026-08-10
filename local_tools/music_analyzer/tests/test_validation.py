from pathlib import Path

import pytest

from local_tools.music_analyzer.contracts import EngineError
from local_tools.music_analyzer.engine.validation import validate_source


def test_validate_wav_reads_metadata(wav_file: Path):
    source = validate_source(wav_file, max_file_bytes=1_000_000, max_duration_seconds=5)
    assert source.extension == ".wav"
    assert source.duration_seconds == pytest.approx(1.0)
    assert source.sample_rate == 8000
    assert source.channels == 1
    assert source.name == "cancion_corta.wav"


def test_validate_rejects_fake_extension(tmp_path: Path):
    fake = tmp_path / "fake.mp3"
    fake.write_bytes(b"this is not an mp3")
    with pytest.raises(EngineError) as caught:
        validate_source(fake, max_file_bytes=1000, max_duration_seconds=5)
    assert caught.value.code == "signature_mismatch"


def test_validate_rejects_size_and_duration(wav_file: Path):
    with pytest.raises(EngineError) as caught:
        validate_source(wav_file, max_file_bytes=10, max_duration_seconds=5)
    assert caught.value.code == "source_too_large"
    with pytest.raises(EngineError) as caught:
        validate_source(wav_file, max_file_bytes=1_000_000, max_duration_seconds=0.5)
    assert caught.value.code == "source_too_long"
