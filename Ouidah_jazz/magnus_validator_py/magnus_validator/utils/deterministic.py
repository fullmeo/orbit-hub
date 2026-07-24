"""Deterministic hashing utilities (exact match with Node crypto.createHash('sha256'))."""

from __future__ import annotations

import hashlib


def deterministic_sha256(seed: str, data: str) -> str:
    """Reproduces JS behavior: sha256(seed + input)."""
    payload = (seed + data).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()
