"""Data models for Magnus Validator reports (v1.1-corrected)."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Literal


@dataclass(frozen=True, slots=True)
class Scores:
    recognition: int
    inevitability: int
    coherence: int
    overall: int

    def to_dict(self) -> dict[str, int]:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class Metadata:
    version: str
    timestamp: str
    seed: str
    model: str

    @classmethod
    def create(cls, seed: str | None = None, model: str = "default") -> Metadata:
        now = datetime.now(timezone.utc)
        return cls(
            version="1.1-corrected",
            timestamp=now.isoformat(),
            seed=seed or str(int(now.timestamp() * 1000)),
            model=model,
        )


@dataclass(frozen=True, slots=True)
class ValidationReport:
    metadata: Metadata
    scores: Scores
    interpretation: str
    hash: str

    def to_dict(self) -> dict:
        return {
            "version": self.metadata.version,
            "timestamp": self.metadata.timestamp,
            "seed": self.metadata.seed,
            "model": self.metadata.model,
            "scores": self.scores.to_dict(),
            "interpretation": self.interpretation,
            "hash": self.hash,
        }


InterpretationLevel = Literal[
    "Excellente convergence - Vision parfaitement matérialisée",
    "Bonne convergence - Solide alignement",
    "Convergence acceptable - Des améliorations possibles",
    "Convergence faible - Revoir l'alignement avec l'intent",
]
