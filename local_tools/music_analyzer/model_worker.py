"""Subproceso de descarga explicita de un modelo permitido."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from .contracts import ALLOWED_SEPARATION_MODELS


def main(argv: list[str] | None = None) -> int:
    arguments = argv or sys.argv[1:]
    if len(arguments) != 2 or arguments[0] not in ALLOWED_SEPARATION_MODELS:
        return 2
    model_id, root_value = arguments
    root = Path(root_value).resolve()
    root.mkdir(parents=True, exist_ok=True)
    os.environ["TORCH_HOME"] = str(root)
    try:
        before = {path.resolve(): path.stat().st_mtime_ns for path in root.rglob("*.th")}
        from demucs.pretrained import get_model  # type: ignore
        get_model(model_id)
        checkpoints = [
            {"path": path.relative_to(root).as_posix(), "size": path.stat().st_size}
            for path in root.rglob("*.th")
            if path.is_file() and (path.resolve() not in before or path.stat().st_mtime_ns != before[path.resolve()])
        ]
        if not checkpoints:
            return 1
        marker = root / f"{model_id}.installed.json"
        marker.write_text(json.dumps({"modelId": model_id, "checkpoints": checkpoints}, indent=2), encoding="utf-8")
        print(json.dumps({"type": "completed", "modelId": model_id}), flush=True)
        return 0
    except Exception:
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
