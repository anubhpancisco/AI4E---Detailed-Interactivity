# Leadership & Social Influence · Skill Application

SCORM **2004 3rd Edition** package for the interactive leadership skill application activity. The same files can be uploaded to an LMS **or** hosted as a static site on GitHub Pages.

## Package contents

| File | Purpose |
|------|---------|
| `imsmanifest.xml` | SCORM manifest (launch file, organization, resource) |
| `metadata.xml` | LOM metadata referenced by the manifest |
| `index.html` | Launch page (activity + SCORM integration) |
| `scripts/scorm-api-wrapper.js` | SCORM 2004 API (`API_1484_11`) adapter |
| `scripts/scorm-bridge.js` | Suspend data, progress, completion, session time |
| `leadership-social-influence-scorm.zip` | Ready-to-upload LMS package |

## LMS upload

1. Upload `leadership-social-influence-scorm.zip` to your LMS as a SCORM 2004 (3rd Edition) package.
2. Launch the activity from the course. The LMS should expose `API_1484_11`.
3. Learner progress is stored in `cmi.suspend_data` and restored on re-entry.
4. Completion is reported when the learner reaches the **Results** stage and completes the reflection step (`cmi.completion_status = completed`, `cmi.success_status = passed`).

### SCORM data model used

- `cmi.completion_status` — `incomplete` → `completed`
- `cmi.success_status` — `unknown` → `passed`
- `cmi.progress_measure` — 0–1 based on stage (16 sections)
- `cmi.location` — current stage index
- `cmi.suspend_data` — full activity state JSON (`trustLedger_v5`)
- `cmi.session_time` — ISO 8601 duration per session
- `cmi.exit` — `suspend` on page unload

## GitHub Pages hosting

This repo is structured so GitHub Pages can serve the activity directly (no LMS required).

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to deploy from the `main` branch (root `/`).
4. Open the published URL — it loads `index.html` automatically.

Without an LMS, SCORM calls are no-ops; progress is saved in the browser via `localStorage` only.

Optional: add a `.nojekyll` file (already included) so GitHub Pages serves all paths correctly.

## Rebuild from source

If you edit `source/activity.html` (plain HTML without SCORM tags):

```bash
python tools/inject_scorm.py
python tools/build_scorm_zip.py
```

This regenerates `index.html` and `leadership-social-influence-scorm.zip`.

## Local preview

Serve the folder with any static HTTP server (SCORM API will not be present, but the activity runs normally):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080/index.html`.

## Notes

- Estimated runtime: ~20 minutes.
- Requires network access for Google Fonts (`fonts.googleapis.com`).
- For offline LMS deployment, consider self-hosting the Inter font and removing the `@import` in CSS.
