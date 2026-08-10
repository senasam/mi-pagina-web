from __future__ import annotations

import shutil
from pathlib import Path

from local_tools.music_analyzer.contracts import (
    AnalysisOptions,
    AudioOptions,
    ChordAnalysis,
    ChordEvent,
    TaskSelection,
)
from local_tools.music_analyzer.engine.pipeline import analyze


class FakeSeparator:
    def separate(self, audio_path, output_dir, options, reporter):
        output_dir.mkdir(parents=True, exist_ok=True)
        reporter.phase_progress("separating", 50, "mitad")
        vocals = output_dir / "vocals.wav"
        shutil.copy2(audio_path, vocals)
        reporter.phase_progress("separating", 100, "listo")
        return {"vocals": vocals}


def fake_chords(path, *, track, reporter, state):
    reporter.phase_progress(state, 100, f"acordes {track}")
    return ChordAnalysis(track, (ChordEvent(0, 1, "C", 0.9),), "fake")


def test_pipeline_runs_without_demucs_or_librosa(wav_file: Path, tmp_path: Path):
    events = []
    result = analyze(
        AnalysisOptions(
            source_path=wav_file,
            output_dir=tmp_path / "output",
            tasks=TaskSelection(True, True, True, True),
            audio=AudioOptions(convert_to_wav=False),
        ),
        progress_callback=events.append,
        separation_provider=FakeSeparator(),
        chord_detector=fake_chords,
    )
    kinds = {artifact.kind for artifact in result.artifacts}
    assert {"source-audio", "audio-stem", "chords-json", "chords-csv", "archive", "log"} <= kinds
    assert [analysis.track for analysis in result.chords] == ["mix", "vocals"]
    assert events[-1].state == "completed"
    assert events[-1].percentage == 100
