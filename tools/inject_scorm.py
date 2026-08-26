#!/usr/bin/env python3
"""Inject SCORM script tags into the activity HTML and write index.html."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source" / "activity.html"
OUTPUT = ROOT / "index.html"

SCORM_SCRIPTS = """    <script src="scripts/scorm-api-wrapper.js"></script>
    <script src="scripts/scorm-bridge.js"></script>
"""

MARKER = '    <script>\n        window.onerror=function'


def inject_scorm(html: str) -> str:
    if "scripts/scorm-api-wrapper.js" in html:
        return html

    if MARKER in html:
        return html.replace(MARKER, SCORM_SCRIPTS + "\n" + MARKER, 1)

    return re.sub(
        r"(<script>\s*\n\s*window\.onerror\s*=)",
        SCORM_SCRIPTS + r"\n    \1",
        html,
        count=1,
        flags=re.MULTILINE,
    )


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE

    if not source.is_file():
        print(f"Source HTML not found: {source}", file=sys.stderr)
        return 1

    html = source.read_text(encoding="utf-8")
    OUTPUT.write_text(inject_scorm(html), encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
