"""JSON report generation (exact structure as JS v1.1)."""

from __future__ import annotations

import json

from .models import ValidationReport


def to_json(report: ValidationReport, *, indent: int = 2) -> str:
    """Return pretty-printed JSON matching the original JS report shape."""
    return json.dumps(report.to_dict(), indent=indent, ensure_ascii=False)
