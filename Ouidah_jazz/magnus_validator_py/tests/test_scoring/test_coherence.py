"""Unit tests for Coherence pillar (exact JS v1.1 behavior)."""

from __future__ import annotations

from magnus_validator.scoring.coherence import calculate_coherence


def test_60_percent_match_bonus():
    """First 60% of intent appears as substring in code."""
    intent = "implement secure user authentication now"
    code = "implement secure user auth"
    assert calculate_coherence(intent, code) >= 90


def test_variable_consistency_bonus():
    code_with_vars = "const a = 1; let b = 2;"
    code_without = "x = 42"
    c1 = calculate_coherence("test", code_with_vars)
    c2 = calculate_coherence("test", code_without)
    assert c1 > c2
