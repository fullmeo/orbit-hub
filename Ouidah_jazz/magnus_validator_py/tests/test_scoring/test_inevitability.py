"""Unit tests for Inevitability pillar (exact JS v1.1 behavior)."""

from __future__ import annotations

from magnus_validator.scoring.inevitability import calculate_inevitability


def test_base_score():
    """Only 'function' and 'return' are present → 60 + 16 = 76."""
    code = "function x() { return 1; }"
    assert calculate_inevitability("", code) == 76


def test_long_code_bonus():
    long_code = "x" * 301
    assert calculate_inevitability("", long_code) == 75


def test_async_bonus():
    """function + return + async/await bonus → 60 + 16 + 10 = 86."""
    code = "async function foo() { await bar(); return 1; }"
    assert calculate_inevitability("", code) == 86
