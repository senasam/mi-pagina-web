from __future__ import annotations

import wave
from pathlib import Path

import pytest


@pytest.fixture
def wav_file(tmp_path: Path) -> Path:
    path = tmp_path / "cancion corta.wav"
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(8000)
        audio.writeframes(b"\x00\x00" * 8000)
    return path
