from local_tools.music_analyzer.engine.separation import parse_demucs_percentage


def test_parse_demucs_percentage_is_tolerant_and_bounded():
    assert parse_demucs_percentage("Separated track 2/4 67%") == 67
    assert parse_demucs_percentage("download 10% | processing 42 %") == 42
    assert parse_demucs_percentage("sin progreso") is None
    assert parse_demucs_percentage("avance 120%") == 100
