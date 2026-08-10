import json
import zipfile
from pathlib import Path

import pytest

from local_tools.music_analyzer.contracts import ChordAnalysis, ChordEvent
from local_tools.music_analyzer.engine.exports import create_archive, export_chords


def test_export_chords_json_and_csv(tmp_path: Path):
    analysis = ChordAnalysis("mix", (ChordEvent(0, 1.25, "C", 0.8),), "chroma-template")
    json_path, csv_path = export_chords((analysis,), tmp_path)
    assert json.loads(json_path.read_text(encoding="utf-8"))["tracks"][0]["events"][0]["chord"] == "C"
    assert "mix,0.000,1.250,C,0.800,chroma-template" in csv_path.read_text(encoding="utf-8-sig")


def test_archive_is_scoped_and_sorted(tmp_path: Path):
    result = tmp_path / "result"
    result.mkdir()
    (result / "b.txt").write_text("b")
    (result / "a.txt").write_text("a")
    archive = create_archive([result / "b.txt", result / "a.txt"], result / "out.zip", root=result)
    with zipfile.ZipFile(archive) as zipped:
        assert zipped.namelist() == ["a.txt", "b.txt"]
    outside = tmp_path / "outside.txt"
    outside.write_text("x")
    with pytest.raises(ValueError, match="fuera"):
        create_archive([outside], result / "bad.zip", root=result)
