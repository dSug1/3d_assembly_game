# 3D Assembly Game

A touchscreen game in which 3D objects are picked up, oriented and **assembled** by
joining **mate connectors** — Onshape's model, adopted deliberately.

⭐ **Everything a session needs to know is in [`Claude/README.md`](Claude/README.md),
which is a ROUTER.** Start there, not here.

## Quick start

```bash
npm install
npm run dev -- --host      # then open the printed LAN address ON A PHONE
npm run verify             # typecheck + golden vectors
```

⚠ **Touch gestures cannot be honestly tested with a mouse.** `--host` exists so a
real device on the same network can load the dev server; a desktop pointer has one
touchpoint, no DPI story and no tilt.

## Layout

| | |
|---|---|
| `src/core/` | ⛔ **engine-agnostic.** Geometry, mate connectors, the constraint stack. No Babylon import may appear here — a test enforces it |
| `src/input/` | ⛔ **engine-agnostic.** The gesture recognizer and its config. Pure functions over pointer samples |
| `src/render/` | the ONLY place Babylon is imported. Deliberately thin |
| `tests/` | golden vectors. They run headlessly, which is why the two folders above must stay engine-free |
| `Claude/` | the documentation tree — charter, constraints, method, the build queue |

## Why the boundary exists

It is not tidiness. The previous project shipped **48 golden-vector suites** and its
whole evidence discipline rested on the logic being plain code a headless harness
could run. Logic that can only run inside a rendered scene cannot be measured, and
what cannot be measured gets shipped on hope. See
[`Claude/00_CORE/METHOD.md`](Claude/00_CORE/METHOD.md).
