"""Pillar 1: Recognition scoring (exact port of JS v1.1-corrected)."""

from __future__ import annotations


def calculate_recognition(intent: str, code: str) -> int:
    """Word overlap between intent and code with 1.2 boost, capped at 100."""
    intent_words = intent.lower().split()
    code_words = code.lower().split()

    matches = sum(1 for word in intent_words if word in code_words)

    if not intent_words:
        return 0

    raw = (matches / len(intent_words)) * 100 * 1.2
    return max(0, min(100, round(raw)))
