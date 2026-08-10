"""Proveedor reemplazable de separacion y adaptador local de Demucs."""

from __future__ import annotations

import os
import queue
import re
import subprocess
import sys
import threading
from pathlib import Path
from typing import Protocol

from ..contracts import (
    ALLOWED_SEPARATION_MODELS,
    EngineError,
    ProgressReporter,
    SeparationOptions,
)
from ..model_store import validate_installed_model

_PERCENT_RE = re.compile(r"(?<!\d)(\d{1,3})\s*%")


class SeparationProvider(Protocol):
    def separate(
        self,
        audio_path: Path,
        output_dir: Path,
        options: SeparationOptions,
        reporter: ProgressReporter,
    ) -> dict[str, Path]: ...


def parse_demucs_percentage(line: str) -> float | None:
    """Extrae de forma tolerante el ultimo porcentaje mostrado por Demucs."""
    matches = _PERCENT_RE.findall(line)
    if not matches:
        return None
    return min(100.0, float(matches[-1]))


class LocalDemucsProvider:
    def __init__(self, *, model_cache: Path | None = None, python_executable: str | None = None):
        configured_root = model_cache or os.environ.get("FELIPE_MUSIC_MODEL_ROOT")
        if configured_root:
            self.model_cache = Path(configured_root).resolve()
        else:
            local = Path(os.environ.get("LOCALAPPDATA", Path(__file__).resolve().parents[3]))
            self.model_cache = (local / "FelipeMasanes" / "LocalTools" / "models" / "demucs").resolve()
        self.python_executable = python_executable or sys.executable

    def separate(
        self,
        audio_path: Path,
        output_dir: Path,
        options: SeparationOptions,
        reporter: ProgressReporter,
    ) -> dict[str, Path]:
        if options.model not in ALLOWED_SEPARATION_MODELS:
            raise EngineError("invalid_model", "El modelo Demucs no esta permitido.")
        validate_installed_model(self.model_cache, options.model)
        output_dir.mkdir(parents=True, exist_ok=True)
        device = "cuda" if options.device == "cuda" else "cpu" if options.device == "cpu" else None
        command = [
            self.python_executable,
            "-m",
            "demucs",
            "--name",
            options.model,
            "--out",
            str(output_dir),
        ]
        if device:
            command.extend(["--device", device])
        command.append(str(Path(audio_path).resolve()))
        environment = os.environ.copy()
        self.model_cache.mkdir(parents=True, exist_ok=True)
        environment["TORCH_HOME"] = str(self.model_cache)

        reporter.phase_progress("separating", 0, f"Separando pistas con {options.model}")
        try:
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                errors="replace",
                env=environment,
            )
        except OSError as exc:
            raise EngineError("demucs_unavailable", "No se pudo iniciar Demucs.") from exc

        tail: list[str] = []
        assert process.stdout is not None
        lines: queue.Queue[str | None] = queue.Queue()

        def read_output() -> None:
            try:
                for output_line in process.stdout:
                    lines.put(output_line)
            finally:
                lines.put(None)

        threading.Thread(target=read_output, daemon=True).start()
        try:
            while True:
                reporter.check_cancelled()
                try:
                    line = lines.get(timeout=0.1)
                except queue.Empty:
                    if process.poll() is not None:
                        break
                    continue
                if line is None:
                    if process.poll() is not None:
                        break
                    continue
                if line:
                    clean = line.strip()
                    if clean:
                        tail.append(clean)
                        tail = tail[-8:]
                    percentage = parse_demucs_percentage(line)
                    if percentage is not None:
                        reporter.phase_progress(
                            "separating", percentage, f"Separando pistas con {options.model}"
                        )
        except Exception:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            raise

        if process.returncode != 0:
            if "No module named demucs" in " ".join(tail):
                raise EngineError("demucs_missing", "Demucs no esta instalado en el motor de audio.")
            raise EngineError("separation_failed", "Demucs no pudo separar el audio seleccionado.")

        stem_dir = output_dir / options.model / Path(audio_path).stem
        stems = {path.stem.lower(): path.resolve() for path in stem_dir.glob("*.wav") if path.is_file()}
        if not stems:
            raise EngineError("separation_output_missing", "Demucs termino sin producir pistas.")
        reporter.phase_progress("separating", 100, "Separacion de pistas completada")
        return stems


def separate_stems(
    audio_path: Path,
    output_dir: Path,
    options: SeparationOptions,
    reporter: ProgressReporter,
    *,
    provider: SeparationProvider | None = None,
) -> dict[str, Path]:
    return (provider or LocalDemucsProvider()).separate(audio_path, output_dir, options, reporter)
