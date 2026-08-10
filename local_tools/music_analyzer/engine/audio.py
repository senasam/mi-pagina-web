"""Preparacion y conversion de audio mediante FFmpeg."""

from __future__ import annotations

import shutil
import subprocess
import time
from pathlib import Path

from ..contracts import EngineError, ProgressReporter, SourceInfo


def prepare_audio(
    source: SourceInfo,
    output_dir: Path,
    *,
    convert_to_wav: bool,
    reporter: ProgressReporter,
) -> Path:
    if not convert_to_wav or source.extension == ".wav":
        reporter.phase_progress("converting", 100, "El audio ya esta listo")
        return source.path

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise EngineError("ffmpeg_missing", "FFmpeg no esta instalado en el motor de audio.")
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"{source.path.stem}_prepared.wav"
    command = [
        ffmpeg,
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(source.path),
        "-vn",
        "-acodec",
        "pcm_s16le",
        str(target),
    ]
    reporter.phase_progress("converting", 5, "Convirtiendo audio a WAV")
    process = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    while process.poll() is None:
        try:
            reporter.check_cancelled()
        except Exception:
            process.terminate()
            try:
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                process.kill()
            target.unlink(missing_ok=True)
            raise
        time.sleep(0.1)
    if process.returncode != 0 or not target.is_file():
        target.unlink(missing_ok=True)
        raise EngineError("conversion_failed", "FFmpeg no pudo convertir el audio seleccionado.")
    reporter.phase_progress("converting", 100, "Audio convertido a WAV")
    return target
