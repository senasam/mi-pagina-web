"""Orquestacion de fases del motor, independiente de HTTP y de la UI."""

from __future__ import annotations

import shutil
from pathlib import Path

from ..contracts import (
    AnalysisOptions,
    AnalysisResult,
    Artifact,
    ProgressReporter,
    STEM_LABELS,
)
from .audio import prepare_audio
from .chords import detect_chords
from .exports import artifact_for, create_archive, export_chords
from .separation import SeparationProvider, separate_stems
from .validation import validate_source


def _phase_weights(options: AnalysisOptions) -> dict[str, int]:
    weights = {"validating": 2, "converting": 5, "exporting": 8}
    if options.tasks.separate_stems:
        weights["separating"] = 55
    if options.tasks.detect_chords:
        weights["detecting_chords"] = 20
    if options.tasks.detect_stem_chords:
        weights["detecting_stem_chords"] = 10
    return weights


def analyze(
    options: AnalysisOptions,
    *,
    progress_callback=lambda event: None,
    should_cancel=lambda: False,
    separation_provider: SeparationProvider | None = None,
    chord_detector=detect_chords,
) -> AnalysisResult:
    """Ejecuta un analisis completo y devuelve artefactos con rutas internas."""
    reporter = ProgressReporter(progress_callback, should_cancel, _phase_weights(options))
    output_dir = Path(options.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    reporter.phase_progress("validating", 0, "Validando audio")
    source = validate_source(
        options.source_path,
        max_file_bytes=options.max_file_bytes,
        max_duration_seconds=options.max_duration_seconds,
    )
    reporter.phase_progress("validating", 100, "Audio validado")

    prepared = prepare_audio(
        source,
        output_dir,
        convert_to_wav=options.audio.convert_to_wav,
        reporter=reporter,
    )
    artifacts: list[Artifact] = []
    source_copy = output_dir / source.name
    if source.path != source_copy.resolve():
        shutil.copy2(source.path, source_copy)
    else:
        source_copy = source.path
    artifacts.append(
        artifact_for(source_copy, kind="source-audio", label="Audio original", playable=True)
    )
    if prepared.resolve() != source.path:
        artifacts.append(
            artifact_for(prepared, kind="converted-audio", label="Audio convertido", playable=True)
        )

    stems: dict[str, Path] = {}
    if options.tasks.separate_stems:
        stems = separate_stems(
            prepared,
            output_dir / "stems",
            options.separation,
            reporter,
            provider=separation_provider,
        )
        for stem, path in sorted(stems.items()):
            artifacts.append(
                artifact_for(
                    path,
                    kind="audio-stem",
                    label=STEM_LABELS.get(stem, stem.title()),
                    stem=stem,
                    playable=True,
                )
            )

    chord_analyses = []
    if options.tasks.detect_chords:
        chord_analyses.append(
            chord_detector(prepared, track="mix", reporter=reporter, state="detecting_chords")
        )
    if options.tasks.detect_stem_chords:
        total = max(1, len(stems))
        for index, (stem, path) in enumerate(sorted(stems.items())):
            reporter.check_cancelled()
            analysis = chord_detector(
                path,
                track=stem,
                reporter=reporter,
                state="detecting_stem_chords",
            )
            chord_analyses.append(analysis)
            reporter.phase_progress(
                "detecting_stem_chords",
                (index + 1) / total * 100,
                f"Acordes detectados en {index + 1} de {total} pistas",
            )

    reporter.phase_progress("exporting", 5, "Preparando resultados")
    if chord_analyses:
        json_path, csv_path = export_chords(tuple(chord_analyses), output_dir)
        artifacts.extend(
            (
                artifact_for(json_path, kind="chords-json", label="Acordes JSON"),
                artifact_for(csv_path, kind="chords-csv", label="Acordes CSV"),
            )
        )
    log_path = output_dir / "analysis.log"
    log_path.write_text(
        "Motor musical completado\n"
        f"Modelo: {options.separation.model if options.tasks.separate_stems else 'no usado'}\n"
        f"Pistas: {len(stems)}\n",
        encoding="utf-8",
    )
    artifacts.append(artifact_for(log_path, kind="log", label="Registro tecnico"))

    archive_path = None
    if options.tasks.create_zip:
        reporter.phase_progress("exporting", 60, "Creando archivo ZIP")
        archive_path = create_archive(
            [artifact.path for artifact in artifacts], output_dir / "analysis-results.zip", root=output_dir
        )
        artifacts.append(artifact_for(archive_path, kind="archive", label="Resultados ZIP"))
    reporter.phase_progress("exporting", 100, "Resultados preparados")
    reporter.complete()
    return AnalysisResult(
        source=source,
        artifacts=tuple(artifacts),
        chords=tuple(chord_analyses),
        output_dir=output_dir,
        archive_path=archive_path,
        log_path=log_path,
    )
