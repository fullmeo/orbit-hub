"""MagnusValidator core — exact faithful port of JS v1.1-corrected."""

from __future__ import annotations

from .reporting.models import Metadata, Scores, ValidationReport
from .scoring import (
    calculate_recognition,
    calculate_inevitability,
    calculate_coherence,
)
from .utils.deterministic import deterministic_sha256


INTERPRETATIONS = {
    90: "Excellente convergence - Vision parfaitement matérialisée",
    75: "Bonne convergence - Solide alignement",
    60: "Convergence acceptable - Des améliorations possibles",
}


class MagnusValidator:
    """Python port of Magnus Validator v1.1-corrected."""

    version = "1.1-corrected"

    def __init__(self, seed: str | None = None, model: str = "default") -> None:
        self.metadata = Metadata.create(seed=seed, model=model)

    def _get_interpretation(self, overall: int) -> str:
        if overall >= 90:
            return INTERPRETATIONS[90]
        if overall >= 75:
            return INTERPRETATIONS[75]
        if overall >= 60:
            return INTERPRETATIONS[60]
        return "Convergence faible - Revoir l'alignement avec l'intent"

    def generate_report(self, intent: str, code: str) -> ValidationReport:
        recognition = calculate_recognition(intent, code)
        inevitability = calculate_inevitability(intent, code)
        coherence = calculate_coherence(intent, code)

        overall = round(
            (recognition * 0.35) + (inevitability * 0.40) + (coherence * 0.25)
        )

        report_hash = deterministic_sha256(
            self.metadata.seed, intent + code
        )

        scores = Scores(
            recognition=recognition,
            inevitability=inevitability,
            coherence=coherence,
            overall=overall,
        )

        interpretation = self._get_interpretation(overall)

        return ValidationReport(
            metadata=self.metadata,
            scores=scores,
            interpretation=interpretation,
            hash=report_hash,
        )


def validate(intent: str, code: str, seed: str | None = None) -> ValidationReport:
    """Convenience function for one-shot validation."""
    validator = MagnusValidator(seed=seed)
    return validator.generate_report(intent, code)
