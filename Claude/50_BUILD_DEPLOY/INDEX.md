# 50 — BUILD & DEPLOY · web, iOS, Android, desktop

> **STATUS** · ⭐ active · **OWNS** · the toolchain and every shipping target
> **READ IF** · you are changing the build, or adding a platform
> **LAST VERIFIED** · 2026-09-13

## The decision, made on day one

`D1`: **TypeScript + Babylon.js + Vite, web-first, Capacitor for the stores.** One
codebase for web → iOS/Android → desktop.

⭐⭐ **It was made immediately and on purpose.** The predecessor deferred the
equivalent decision for months; it blocked four queue rows and the whole game layer,
and its router still reads *"no amount of building advances it."* See
[`../00_CORE/LESSONS_CARRIED.md`](../00_CORE/LESSONS_CARRIED.md) §1.

## Commands

| | |
|---|---|
| `npm run dev -- --host` | dev server, reachable from a phone on the LAN |
| `npm run verify` | typecheck + golden vectors. ⭐ **The gate before any commit** |
| `npm run build` | typechecks, then bundles to `dist/` |
| `npm run cap:sync` | build + push into the native shells (once `DEP2` lands) |

⚠ `base: "./"` in `vite.config.ts` is load-bearing: a build must work from a
`file://` path and inside a Capacitor webview, not only from a web-server root.

## ⛔⛔ `DEP1` — the device loop comes BEFORE the next feature

**Touch gestures cannot be honestly tested with a mouse.** One pointer, no DPI story,
no tilt, no haptics. `METHOD` closes a change with a look on a real device and
nothing else, so until a phone can load the dev server, **nothing built here can be
closed** — it can only be written.

⭐ Do it before `IN1`. The predecessor's most repeated failure was a build that
passed every automated check and felt wrong the first time a human used it.

## Queued

`DEP2` Capacitor shells (⚠ `/android/` and `/ios/` are git-ignored; `npx cap add`
regenerates them) · `DEP3` Tauri desktop · `DEP4` CI running `npm run verify`.
