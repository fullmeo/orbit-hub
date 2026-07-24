"""Pillar 3: Coherence scoring (exact port of JS v1.1-corrected)."""

from __future__ import annotations

import re


_VAR_DECLARATION = re.compile(r"\b(?:const|let|var)\s+([a-zA-Z0-9_]+)")


def _check_variable_consistency(code: str) -> float:
    """Heuristic ported exactly: <2 vars → 0.8, else 0.9."""
    matches = _VAR_DECLARATION.findall(code)
    return 0.8 if len(matches) < 2 else 0.9


def calculate_coherence(intent: str, code: str) -> int:
    """Intent substring match (60%) + variable naming consistency."""
    coherence = 65
    intent_lower = intent.lower()
    code_lower = code.lower()

    prefix_len = int(len(intent_lower) * 0.6)
    intent_prefix = intent_lower[:prefix_len]

    if intent_prefix and intent_prefix in code_lower:
        coherence += 25

    consistency = _check_variable_consistency(code)
    coherence += consistency * 10

    return min(100, round(coherence))
