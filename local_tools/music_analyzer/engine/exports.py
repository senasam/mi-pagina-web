"""Publicacion de JSON, CSV, ZIP y metadatos de artefactos."""

from __future__ import annotations

import csv
import json
import zipfile
from pathlib import Path

from ..contracts import Artifact, ChordAnalysis, mime_type_for, new_id


def artifact_for(
    path: Path,
    *,
    kind: str,
    label: str,
    stem: str | None = None,
    playable: bool = False,
) -> Artifact:
    resolved = Path(path).resolve()
    return Artifact(
        id=new_id("artifact"),
        kind=kind,
        label=label,
        path=resolved,
        mime_type=mime_type_for(resolved),
        size_bytes=resolved.stat().st_size,
        stem=stem,
        playable=playable,
    )


def export_chords(analyses: tuple[ChordAnalysis, ...], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "chords.json"
    csv_path = output_dir / "chords.csv"
    payload = {
        "version": 1,
        "tracks": [
            {
                "track": analysis.track,
                "method": analysis.method,
                "events": [event.to_dict() for event in analysis.events],
            }
            for analysis in analyses
        ],
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.writer(handle)
        writer.writerow(("track", "start", "end", "chord", "confidence", "method"))
        for analysis in analyses:
            for event in analysis.events:
                writer.writerow(
                    (
                        analysis.track,
                        f"{event.start:.3f}",
                        f"{event.end:.3f}",
                        event.chord,
                        f"{event.confidence:.3f}",
                        event.method,
                    )
                )
    return json_path, csv_path


def create_archive(paths: list[Path], archive_path: Path, *, root: Path) -> Path:
    """Crea un ZIP determinista y rechaza archivos fuera del resultado."""
    root = root.resolve()
    archive_path = archive_path.resolve()
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    unique: dict[str, Path] = {}
    for candidate in paths:
        resolved = candidate.resolve()
        try:
            relative = resolved.relative_to(root)
        except ValueError as exc:
            raise ValueError("No se puede archivar un archivo fuera del resultado.") from exc
        if resolved.is_file() and resolved != archive_path:
            unique[relative.as_posix()] = resolved
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for relative in sorted(unique):
            archive.write(unique[relative], relative)
    return archive_path
