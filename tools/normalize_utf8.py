#!/usr/bin/env python3
"""Normalize HTML/JS/XML files to UTF-8 without BOM; repair common mojibake."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {".html", ".js", ".xml"}
UTF8_BOM = b"\xef\xbb\xbf"


def has_mojibake(text: str) -> bool:
    markers = ("Â", "â", "Ã", "ð")
    return any(marker in text for marker in markers)


def repair_mojibake(text: str) -> str:
    """Fix UTF-8 bytes that were misread as Latin-1/Windows-1252."""
    try:
        return text.encode("latin-1").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text


def normalize_file(path: Path) -> bool:
    raw = path.read_bytes()
    if raw.startswith(UTF8_BOM):
        raw = raw[len(UTF8_BOM) :]

    for encoding in ("utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        print(f"SKIP (undecodable): {path}", file=sys.stderr)
        return False

    if has_mojibake(text):
        text = repair_mojibake(text)

    path.write_text(text, encoding="utf-8", newline="\n")
    return True


def main() -> int:
    targets = [
        path
        for path in ROOT.rglob("*")
        if path.suffix.lower() in EXTENSIONS and path.is_file()
    ]

    changed = 0
    for path in sorted(targets):
        before = path.read_bytes()
        if normalize_file(path):
            after = path.read_bytes()
            if before != after:
                changed += 1
                print(f"Normalized: {path.relative_to(ROOT)}")

    print(f"Done. Updated {changed} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
