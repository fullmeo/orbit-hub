"""Unit tests for Recognition pillar (exact JS v1.1 behavior)."""

from __future__ import annotations

from magnus_validator.scoring.recognition import calculate_recognition


def test_no_match_camelcase():
    """CamelCase is not split → no word match (faithful to original)."""
    assert calculate_recognition("user login", "function userLogin() {}") == 0


def test_no_match():
    assert calculate_recognition("authentication", "console.log('hello')") == 0


def test_full_word_match():
    """Exact space-separated words present in code (partial due to extra tokens)."""
    assert calculate_recognition("user login", "function user login() {}") == 60
