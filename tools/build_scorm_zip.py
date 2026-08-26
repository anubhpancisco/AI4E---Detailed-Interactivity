#!/usr/bin/env python3
"""Build leadership-social-influence-scorm.zip for LMS upload."""

from __future__ import annotations

import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE_NAME = "leadership-social-influence-scorm.zip"

INCLUDE = [
    "imsmanifest.xml",
    "metadata.xml",
    "index.html",
    "scripts/scorm-api-wrapper.js",
    "scripts/scorm-bridge.js",
]


TEXT_EXTENSIONS = {".html", ".js", ".xml"}


def add_to_zip(zf: zipfile.ZipFile, path: Path, arcname: str) -> None:
    if path.suffix.lower() in TEXT_EXTENSIONS:
        with open(path, "r", encoding="utf-8") as f:
            zf.writestr(arcname, f.read())
    else:
        zf.write(path, arcname)


def ensure_index() -> None:
    index = ROOT / "index.html"
    if index.is_file():
        return

    source = ROOT / "source" / "activity.html"
    if not source.is_file():
        raise SystemExit(
            "Missing index.html. Place HTML at source/activity.html and run "
            "python tools/inject_scorm.py first."
        )

    subprocess.run(
        [sys.executable, str(ROOT / "tools" / "inject_scorm.py")],
        check=True,
        cwd=ROOT,
    )


def build_zip() -> Path:
    ensure_index()
    out = ROOT / PACKAGE_NAME

    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for rel in INCLUDE:
            path = ROOT / rel
            if not path.is_file():
                raise SystemExit(f"Missing required file: {rel}")
            add_to_zip(zf, path, rel.replace("\\", "/"))

    return out


def main() -> int:
    out = build_zip()
    print(f"Created {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
