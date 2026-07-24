"""Test exact reproducibility and scoring fidelity with JS v1.1-corrected."""

from __future__ import annotations

import pytest

from magnus_validator import MagnusValidator


INTENT = "Create a user authentication system with JWT"
CODE = """
class AuthService {
    async login(email, password) {
        const token = await this.generateJWT({ email });
        return { token };
    }
    async generateJWT(payload) { return 'jwt'; }
}
"""


def test_reproducible_same_seed_same_result():
    """Same seed must produce identical report and hash."""
    v1 = MagnusValidator(seed="magnus-test-2026")
    v2 = MagnusValidator(seed="magnus-test-2026")

    r1 = v1.generate_report(INTENT, CODE)
    r2 = v2.generate_report(INTENT, CODE)

    assert r1.hash == r2.hash
    assert r1.scores.overall == r2.scores.overall
    assert r1.scores.recognition == r2.scores.recognition
    assert r1.scores.inevitability == r2.scores.inevitability
    assert r1.scores.coherence == r2.scores.coherence


def test_different_seed_different_hash():
    v1 = MagnusValidator(seed="seed-a")
    v2 = MagnusValidator(seed="seed-b")

    r1 = v1.generate_report(INTENT, CODE)
    r2 = v2.generate_report(INTENT, CODE)

    assert r1.hash != r2.hash


def test_scores_match_known_values():
    """Regression values — exact output of the faithful port (matches JS v1.1)."""
    validator = MagnusValidator(seed="regression-seed")
    report = validator.generate_report(INTENT, CODE)

    # Real computed values (verified against original JS logic)
    assert report.scores.recognition == 0
    assert report.scores.inevitability == 94
    assert report.scores.coherence == 73
    assert report.scores.overall == 56
