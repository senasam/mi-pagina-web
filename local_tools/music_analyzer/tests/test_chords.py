import pytest

from local_tools.music_analyzer.engine.chords import classify_chroma, events_from_chroma


def chroma(*notes):
    values = [0.0] * 12
    for note in notes:
        values[note] = 1.0
    return values


def test_classify_major_minor_and_silence():
    assert classify_chroma(chroma(0, 4, 7))[0] == "C"
    assert classify_chroma(chroma(9, 0, 4))[0] == "Am"
    assert classify_chroma([0] * 12) == ("N", 0.0)
    with pytest.raises(ValueError):
        classify_chroma([1, 2])


def test_events_merge_adjacent_equal_chords():
    events = events_from_chroma(
        [chroma(0, 4, 7), chroma(0, 4, 7), chroma(7, 11, 2)],
        [0.0, 0.5, 1.0],
        track_end=1.5,
    )
    assert [(event.chord, event.start, event.end) for event in events] == [
        ("C", 0.0, 1.0),
        ("G", 1.0, 1.5),
    ]
