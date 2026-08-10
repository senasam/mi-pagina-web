"""Worker de un solo uso. Lee una solicitud JSON y emite eventos JSONL."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .contracts import (
    AnalysisOptions,
    AudioOptions,
    EngineError,
    JobCancelled,
    SeparationOptions,
    TaskSelection,
)
from .engine.pipeline import analyze


def options_from_payload(payload: dict) -> AnalysisOptions:
    tasks = payload.get("tasks") or {}
    separation = payload.get("separation") or {}
    audio = payload.get("audio") or {}
    return AnalysisOptions(
        source_path=Path(payload["sourcePath"]),
        output_dir=Path(payload["outputDir"]),
        tasks=TaskSelection(
            separate_stems=bool(tasks.get("separateStems", True)),
            detect_chords=bool(tasks.get("detectChords", True)),
            detect_stem_chords=bool(tasks.get("detectStemChords", False)),
            create_zip=bool(tasks.get("createZip", True)),
        ),
        separation=SeparationOptions(
            provider=str(separation.get("provider", "local-demucs")),
            model=str(separation.get("model", "htdemucs")),
            device=str(separation.get("device", "auto")),
        ),
        audio=AudioOptions(convert_to_wav=bool(audio.get("convertToWav", True))),
    )


def _emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Worker aislado del analizador musical")
    parser.add_argument("request", type=Path, help="Archivo JSON interno creado por el agente")
    args = parser.parse_args(argv)
    try:
        payload = json.loads(args.request.read_text(encoding="utf-8"))
        job_id = str(payload.get("jobId", "worker-job"))
        result = analyze(
            options_from_payload(payload),
            progress_callback=lambda event: _emit(event.to_dict(job_id)),
        )
        _emit(
            {
                "type": "job_result",
                "jobId": job_id,
                "artifacts": [artifact.to_dict() for artifact in result.artifacts],
                "internalArtifacts": [
                    {"id": artifact.id, "path": str(artifact.path)}
                    for artifact in result.artifacts
                ],
            }
        )
        return 0
    except JobCancelled:
        _emit({"type": "job_error", "code": "cancelled", "message": "Trabajo cancelado"})
        return 2
    except EngineError as exc:
        _emit({"type": "job_error", "code": exc.code, "message": exc.message})
        return 1
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        _emit(
            {
                "type": "job_error",
                "code": "invalid_worker_request",
                "message": "La solicitud interna del worker no es valida.",
            }
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
