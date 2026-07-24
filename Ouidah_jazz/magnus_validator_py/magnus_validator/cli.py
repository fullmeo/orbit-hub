"""CLI complète et améliorée pour Magnus Validator v1.1-corrected.

Fonctionnalités :
- Entrées multiples (arguments, fichiers, stdin, batch JSONL)
- Formats de sortie : text (joli), json, markdown, all
- Sauvegarde dans fichiers / répertoires
- Seed pour reproductibilité
- Mode batch pour plusieurs validations
- Messages en français
- Zéro dépendance externe
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from magnus_validator import MagnusValidator, __version__, to_json, to_markdown, validate


# =============================================================================
# FORMATAGE TEXTE (joli, sans dépendance)
# =============================================================================

def _color(text: str, code: str) -> str:
    """Ajoute une couleur ANSI si le terminal le supporte."""
    if sys.stdout.isatty():
        return f"\033[{code}m{text}\033[0m"
    return text


def format_text_report(report: Any) -> str:
    """Rapport texte humain agréable."""
    m = report.metadata
    s = report.scores

    lines = [
        _color(f"=== MAGNUS VALIDATOR v{m.version} ===", "1;36"),
        f"Timestamp : {m.timestamp}",
        f"Seed      : {_color(m.seed, '33')}",
        f"Model     : {m.model}",
        "",
        _color("Scores :", "1"),
        f"  Recognition   : {_color(str(s.recognition), '32')}/100",
        f"  Inevitability : {_color(str(s.inevitability), '32')}/100",
        f"  Coherence     : {_color(str(s.coherence), '32')}/100",
        f"  Overall       : {_color(str(s.overall), '1;32')}/100",
        "",
        _color("Interprétation :", "1"),
        f"  {report.interpretation}",
        "",
        f"Hash : {_color(report.hash, '2')}",
    ]
    return "\n".join(lines)


# =============================================================================
# GESTION DES ENTRÉES
# =============================================================================

def read_text(path_or_stdin: str | Path) -> str:
    """Lit un fichier ou stdin si '-' est passé."""
    if str(path_or_stdin) == "-":
        return sys.stdin.read()
    return Path(path_or_stdin).read_text(encoding="utf-8")


def load_batch(path: Path) -> list[dict[str, str]]:
    """Charge un fichier JSONL : une ligne = {"intent": "...", "code_path": "..."}"""
    items = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        data = json.loads(line)
        if "intent" not in data or "code_path" not in data:
            raise ValueError(f"Ligne batch invalide : {line}")
        items.append(data)
    return items


# =============================================================================
# SORTIE
# =============================================================================

def write_output(content: str, output_path: Path | None) -> None:
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        print(f"OK: Ecrit : {output_path}", file=sys.stderr)
    else:
        print(content)


def generate_outputs(report: Any, formats: list[str], output_path: Path | None) -> None:
    """Génère les sorties demandées."""
    if "json" in formats:
        write_output(to_json(report), output_path.with_suffix(".json") if output_path else None)

    if "md" in formats or "markdown" in formats:
        write_output(to_markdown(report), output_path.with_suffix(".md") if output_path else None)

    if "text" in formats or "txt" in formats:
        write_output(format_text_report(report), output_path.with_suffix(".txt") if output_path else None)

    if "all" in formats:
        base = output_path or Path("report")
        write_output(to_json(report), base.with_suffix(".json"))
        write_output(to_markdown(report), base.with_suffix(".md"))
        write_output(format_text_report(report), base.with_suffix(".txt"))


# =============================================================================
# COMMANDES PRINCIPALES
# =============================================================================

def cmd_single(args: argparse.Namespace) -> int:
    """Validation simple d'un intent + code."""
    try:
        intent = args.intent or read_text(args.intent_file)
        code = read_text(args.code_file)

        validator = MagnusValidator(seed=args.seed, model=args.model)
        report = validator.generate_report(intent, code)

        formats = args.format.split(",") if args.format else ["text"]
        out_path = Path(args.output) if args.output else None

        generate_outputs(report, formats, out_path)

        if not args.output and "text" not in formats and "all" not in formats:
            # Par défaut on affiche en texte si rien n'est demandé en fichier
            print(format_text_report(report))

        return 0
    except Exception as e:
        print(f"Erreur : {e}", file=sys.stderr)
        return 1


def cmd_batch(args: argparse.Namespace) -> int:
    """Validation en lot depuis un fichier JSONL."""
    try:
        batch_file = Path(args.batch)
        items = load_batch(batch_file)

        output_dir = Path(args.output_dir) if args.output_dir else Path("magnus_reports")
        output_dir.mkdir(parents=True, exist_ok=True)

        formats = args.format.split(",") if args.format else ["json", "md"]

        for i, item in enumerate(items, 1):
            intent = item["intent"]
            code_path = item["code_path"]
            code = read_text(code_path)

            validator = MagnusValidator(seed=args.seed, model=args.model)
            report = validator.generate_report(intent, code)

            base_name = f"{i:03d}_{Path(code_path).stem}"
            base_path = output_dir / base_name

            generate_outputs(report, formats, base_path)
            print(f"[{i}/{len(items)}] {intent[:50]}... -> {base_name}", file=sys.stderr)

        print(f"\nOK: {len(items)} rapports generes dans {output_dir}", file=sys.stderr)
        return 0
    except Exception as e:
        print(f"Erreur batch : {e}", file=sys.stderr)
        return 1


# =============================================================================
# ARGUMENT PARSER (CLI complète)
# =============================================================================

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="magnus-validator",
        description="Magnus Validator v1.1-corrected — Analyse d'alignement Intent / Code",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  magnus-validator "Créer auth JWT" src/auth.js
  magnus-validator --intent "Auth" --code-file - --format json
  magnus-validator --batch batch.jsonl --output-dir rapports --format all --seed 20260524
  cat code.js | magnus-validator --intent-file intent.txt --code-file - --format md
        """,
    )

    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")

    # === Mode commun ===
    parser.add_argument("--seed", default=None, help="Seed pour reproductibilité (ex: 20260524)")
    parser.add_argument("--model", default="default", help="Nom du modèle (défaut: default)")
    parser.add_argument(
        "--format",
        default="text",
        help="Formats de sortie: text,json,md,all (séparés par virgule)",
    )

    # === Mode simple (par défaut) ===
    parser.add_argument("intent", nargs="?", help="Texte de l'intent (ou utilisez --intent)")
    parser.add_argument("code_file", nargs="?", help="Fichier code ou '-' pour stdin")
    parser.add_argument("--intent", dest="intent_flag", help="Intent via flag (prioritaire sur positionnel)")
    parser.add_argument("--intent-file", help="Fichier contenant l'intent")
    parser.add_argument("--code-file", dest="code_file_flag", help="Fichier code (prioritaire)")
    parser.add_argument("--output", "-o", help="Fichier de sortie (sans extension)")

    # === Mode batch ===
    parser.add_argument("--batch", help="Fichier JSONL pour validation en lot")
    parser.add_argument("--output-dir", help="Répertoire de sortie pour le mode batch")

    parser.set_defaults(func=cmd_single)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    # Détection du mode batch
    if args.batch:
        args.func = cmd_batch
        exit_code = cmd_batch(args)
    else:
        # Résolution des entrées (priorité claire)
        if args.intent_flag:
            args.intent = args.intent_flag
        elif args.intent_file:
            args.intent = read_text(args.intent_file)

        if args.code_file_flag:
            args.code_file = args.code_file_flag

        if not args.intent:
            parser.error("intent requis : positionnel, --intent ou --intent-file")

        if not args.code_file:
            parser.error("code_file requis : positionnel, --code-file ou '-' pour stdin")

        exit_code = cmd_single(args)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
