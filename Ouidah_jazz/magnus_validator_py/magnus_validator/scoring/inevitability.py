"""Pillar 2: Inevitability scoring (exact port of JS v1.1-corrected)."""

from __future__ import annotations


STRUCTURAL_MARKERS = ("class", "function", "const", "let", "return", "if", "for", "while")


def calculate_inevitability(intent: str, code: str) -> int:
    """Structural completeness + async bonus + length bonus."""
    score = 60

    for marker in STRUCTURAL_MARKERS:
        if marker in code:
            score += 8

    if len(code) > 300:
        score += 15
    if "async" in code or "await" in code:
        score += 10

    return min(100, round(score))
