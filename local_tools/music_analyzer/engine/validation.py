"""Validacion de audio sin confiar unicamente en la extension."""

from __future__ import annotations

import json
import shutil
import subprocess
import wave
from pathlib import Path

from ..contracts import ALLOWED_AUDIO_EXTENSIONS, EngineError, SourceInfo, sanitize_filename


def _matches_signature(path: Path, extension: str) -> bool:
    with path.open("rb") as handle:
        header = handle.read(16)
    if extension == ".wav":
        return len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WAVE"
    if extension == ".flac":
        return header.startswith(b"fLaC")
    if extension == ".mp3":
        return header.startswith(b"ID3") or (
            len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0
        )
    if extension == ".m4a":
        return len(header) >= 12 and header[4:8] == b"ftyp"
    return False


def _wav_metadata(path: Path) -> tuple[float, int, int]:
    try:
        with wave.open(str(path), "rb") as audio:
            rate = audio.getframerate()
            duration = audio.getnframes() / rate if rate else 0.0
            return duration, rate, audio.getnchannels()
    except (wave.Error, EOFError) as exc:
        raise EngineError("invalid_audio", "El archivo WAV esta danado o incompleto.") from exc


def _ffprobe_metadata(path: Path) -> tuple[float | None, int | None, int | None]:
    executable = shutil.which("ffprobe")
    if not executable:
        return None, None, None
    command = [
        executable,
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        "stream=sample_rate,channels:format=duration",
        "-of",
        "json",
        str(path),
    ]
    try:
        completed = subprocess.run(command, capture_output=True, text=True, timeout=30, check=True)
        payload = json.loads(completed.stdout)
        stream = (payload.get("streams") or [{}])[0]
        duration_value = (payload.get("format") or {}).get("duration")
        return (
            float(duration_value) if duration_value is not None else None,
            int(stream["sample_rate"]) if stream.get("sample_rate") else None,
            int(stream["channels"]) if stream.get("channels") else None,
        )
    except (subprocess.SubprocessError, ValueError, KeyError, json.JSONDecodeError):
        return None, None, None


def validate_source(
    source_path: Path,
    *,
    max_file_bytes: int,
    max_duration_seconds: float,
) -> SourceInfo:
    """Valida existencia, tamano, firma y duracion de una fuente autorizada."""
    path = Path(source_path).resolve()
    if not path.is_file():
        raise EngineError("source_not_found", "No se encontro el audio seleccionado.")
    extension = path.suffix.lower()
    if extension not in ALLOWED_AUDIO_EXTENSIONS:
        raise EngineError("unsupported_format", "El formato debe ser WAV, MP3, FLAC o M4A.")
    size = path.stat().st_size
    if size <= 0:
        raise EngineError("empty_source", "El archivo de audio esta vacio.")
    if size > max_file_bytes:
        raise EngineError("source_too_large", "El audio supera el limite de tamano permitido.")
    if not _matches_signature(path, extension):
        raise EngineError("signature_mismatch", "El contenido no coincide con el formato del archivo.")

    if extension == ".wav":
        duration, sample_rate, channels = _wav_metadata(path)
    else:
        duration, sample_rate, channels = _ffprobe_metadata(path)
    if duration is not None and duration > max_duration_seconds:
        raise EngineError("source_too_long", "El audio supera la duracion maxima permitida.")
    return SourceInfo(
        path=path,
        name=sanitize_filename(path.name),
        extension=extension,
        size_bytes=size,
        duration_seconds=duration,
        sample_rate=sample_rate,
        channels=channels,
    )
