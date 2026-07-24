# Magnus Validator — Python Port (v1.1-corrected)

Exact 1:1 port of the original JavaScript Magnus Validator (May 2026).

## Features

- Three pillars with identical formulas:
  - **Recognition** (35%)
  - **Inevitability** (40%)
  - **Coherence** (25%)
- Fully deterministic via seed + SHA-256
- JSON + Markdown report generation
- Modern Python 3.11+ with dataclasses and type hints
- Zero external runtime dependencies

## Installation (dev)

```bash
cd magnus_validator_py
pip install -e ".[dev]"
```

## Usage

```python
from magnus_validator import MagnusValidator, validate, to_json, to_markdown

# One-shot
report = validate("Implement user authentication", source_code)

# Reproducible with fixed seed
validator = MagnusValidator(seed="20260524-fixed-seed")
report = validator.generate_report(intent, code)

print(to_json(report))
print(to_markdown(report))
```

## Reproducibility

Same seed + same (intent + code) → identical hash and scores.

## Running tests

```bash
pytest -q
```

## License

Ported from original JS v1.1-corrected under same terms.
