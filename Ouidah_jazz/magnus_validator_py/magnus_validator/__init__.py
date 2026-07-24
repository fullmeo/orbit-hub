"""Magnus Validator v1.1-corrected — Python port.

Exact faithful implementation of the 3-pillar scoring:
Recognition | Inevitability | Coherence
"""

from __future__ import annotations

from .core import MagnusValidator, validate
from .reporting import ValidationReport, to_json, to_markdown

__version__ = "1.1-corrected"

__all__ = [
    "MagnusValidator",
    "validate",
    "ValidationReport",
    "to_json",
    "to_markdown",
]
