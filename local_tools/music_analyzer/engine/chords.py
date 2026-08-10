"""Deteccion de acordes basada en chroma y plantillas mayor/menor."""

from __future__ import annotations

from pathlib import Path
from typing import Sequence

from ..contracts import ChordAnalysis, ChordEvent, EngineError, ProgressReporter
from .chord_formatting import merge_adjacent

NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


def classify_chroma(values: Sequence[float]) -> tuple[str, float]:
    """Clasifica un vector chroma de 12 notas sin depender de NumPy."""
    if len(values) != 12:
        raise ValueError("Un vector chroma debe contener 12 valores.")
    energy = sum(max(0.0, float(value)) for value in values)
    if energy <= 1e-9:
        return "N", 0.0
    normalized = [max(0.0, float(value)) / energy for value in values]
    best_label = "N"
    best_score = -1.0
    for root in range(12):
        for suffix, intervals in (("", (0, 4, 7)), ("m", (0, 3, 7))):
            chord_energy = sum(normalized[(root + interval) % 12] for interval in intervals)
            root_bonus = normalized[root] * 0.15
            score = min(1.0, chord_energy + root_bonus)
            if score > best_score:
                best_score = score
                best_label = f"{NOTE_NAMES[root]}{suffix}"
    return best_label, best_score


def events_from_chroma(
    chroma_frames: Sequence[Sequence[float]],
    frame_times: Sequence[float],
    *,
    track_end: float,
) -> tuple[ChordEvent, ...]:
    if len(chroma_frames) != len(frame_times):
        raise ValueError("Los frames chroma y sus tiempos no coinciden.")
    raw: list[ChordEvent] = []
    for index, values in enumerate(chroma_frames):
        start = float(frame_times[index])
        end = float(frame_times[index + 1]) if index + 1 < len(frame_times) else float(track_end)
        chord, confidence = classify_chroma(values)
        raw.append(ChordEvent(start, max(start, end), chord, confidence))
    return merge_adjacent(raw, minimum_duration=0.15)


def detect_chords(
    audio_path: Path,
    *,
    track: str,
    reporter: ProgressReporter,
    state: str = "detecting_chords",
) -> ChordAnalysis:
    """Carga el audio bajo demanda; librosa nunca se importa en el agente HTTP."""
    reporter.phase_progress(state, 0, f"Detectando acordes en {track}")
    try:
        import librosa  # type: ignore
        import numpy as np  # type: ignore
    except ImportError as exc:
        raise EngineError(
            "chord_engine_missing", "Librosa y NumPy no estan instalados en el motor de audio."
        ) from exc
    try:
        samples, sample_rate = librosa.load(str(audio_path), sr=22050, mono=True)
        reporter.check_cancelled()
        harmonic = librosa.effects.harmonic(samples)
        chroma = librosa.feature.chroma_cqt(y=harmonic, sr=sample_rate)
        # Medianas de ~0.5 s reducen cambios espurios sin ocultar el pulso armonico.
        frames_per_segment = max(1, int(round(0.5 * sample_rate / 512)))
        vectors: list[list[float]] = []
        frame_indexes: list[int] = []
        for start in range(0, chroma.shape[1], frames_per_segment):
            reporter.check_cancelled()
            vectors.append(np.median(chroma[:, start : start + frames_per_segment], axis=1).tolist())
            frame_indexes.append(start)
            reporter.phase_progress(
                state,
                min(95, (start + frames_per_segment) / max(1, chroma.shape[1]) * 100),
                f"Detectando acordes en {track}",
            )
        times = librosa.frames_to_time(frame_indexes, sr=sample_rate, hop_length=512).tolist()
        duration = float(librosa.get_duration(y=samples, sr=sample_rate))
        events = events_from_chroma(vectors, times, track_end=duration)
    except EngineError:
        raise
    except Exception as exc:
        raise EngineError("chord_detection_failed", "No se pudieron detectar los acordes.") from exc
    reporter.phase_progress(state, 100, f"Acordes detectados en {track}")
    return ChordAnalysis(track=track, events=events, method="chroma-template")
