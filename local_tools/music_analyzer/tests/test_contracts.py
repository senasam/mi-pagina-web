from pathlib import Path

import pytest

from local_tools.music_analyzer.contracts import (
    AnalysisOptions,
    EngineError,
    JobCancelled,
    ProgressReporter,
    SeparationOptions,
    TaskSelection,
    sanitize_filename,
)


def test_sanitize_filename_removes_paths_and_reserved_characters():
    assert sanitize_filename('../carpeta/mi cancion<>:"?.mp3') == "mi_cancion.mp3"
    assert sanitize_filename("...", fallback="audio") == "audio"


def test_analysis_options_reject_empty_or_inconsistent_tasks(tmp_path: Path):
    with pytest.raises(EngineError, match="no tiene tareas"):
        AnalysisOptions(
            tmp_path / "a.wav",
            tmp_path / "out",
            tasks=TaskSelection(False, False, False, False),
        )
    with pytest.raises(EngineError, match="requiere activar"):
        AnalysisOptions(
            tmp_path / "a.wav",
            tmp_path / "out",
            tasks=TaskSelection(False, False, True, False),
        )
    with pytest.raises(EngineError, match="no esta permitido"):
        AnalysisOptions(
            tmp_path / "a.wav",
            tmp_path / "out",
            separation=SeparationOptions(model="--evil"),
        )


def test_progress_is_clamped_and_cancelled():
    events = []
    reporter = ProgressReporter(events.append, phase_weights={"validating": 1, "exporting": 1})
    reporter.phase_progress("validating", 150, "ok")
    reporter.phase_progress("exporting", 50, "exportando")
    reporter.complete()
    assert [event.percentage for event in events] == [50.0, 75.0, 100.0]

    cancelled = ProgressReporter(lambda event: None, should_cancel=lambda: True)
    with pytest.raises(JobCancelled):
        cancelled.check_cancelled()
