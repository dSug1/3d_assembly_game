# THE BUILD QUEUE — one list, every subsystem

> **STATUS** · live · **OWNS** · what gets built next, for the whole project
> **READ IF** · you are starting any build, or wondering where an item stands
> **LAST VERIFIED** · 2026-09-13

⛔ **THIS IS THE ONLY QUEUE.** Do not start a second list, in a subsystem folder or
anywhere else. Do not reorder it to be helpful.

⭐ Each row's full history goes in `queue_notes/<ID>.md`. The `Notes` column is a
pointer, not the record. **A status changes in BOTH places or neither.**

`Sub`: `IN` = 10_INPUT_TOUCH · `GAME` = 20_GAME_RULES · `3D` = 30_OBJECTS_3D ·
`RND` = 40_RENDER_SCENE · `DEP` = 50_BUILD_DEPLOY · `SEC` = 60_SECURITY_COMPLIANCE ·
`CORE` = cross-cutting.

---

## ⭐⭐⭐ YOU ARE HERE (2026-09-13) — `IN1` built, and **owed a device look**

✅ TypeScript + Babylon + Vite up; `npm run verify` = typecheck + **81 golden
vectors, all passing** (37 → 81 with `IN1`). ✅ The engine boundary is enforced by a
test. ✅ The mate-connector geometry and the constraint-stack solver are in and
covered. ✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/ (`DEP1d`), gated
on `npm run verify`.

✅ **`IN1` IS BUILT HEADLESSLY**: the recognizer state machine, provisional motion
with rollback, roll detection, the release-time priority ladder, and a double-tap
§1.4 could not work without. ⛔⛔ **IT IS NOT CLOSED — no finger has touched it.**
⭐ `src/render/hud.ts` prints the recognizer's own state on the glass, because a
state machine has no visible shape and "the cube moved" tests none of this.
⭐ **The one glance that closes it**: drag rotates the cube, flick snaps it back.

⛔ **NEXT once `IN1` closes: `3D1`** — the object model. `IN3`, `IN4`, `RND1` and
`RND2` are all waiting on it, and `IN2` is blocked behind the `IN8` decision below.
⚠ **Three defects were found in §1.3 while building `IN1`** and they are the
owner's to ratify: no double-tap, no duration bound on `TAP`, and a roll test that
cannot fire as specified. → [`queue_notes/IN1.md`](queue_notes/IN1.md).

✅✅ **THE FAST DEVICE LOOP WORKS** (`DEP1a`, 2026-09-13). `npm run dev:usb` +
`adb reverse tcp:5173 tcp:5173`, and the tablet loads it as `localhost` — a **secure
context**, so sensors and rule 1's tilt are testable. Two cubes confirmed on a Lenovo
TB-X606F. ⭐ Procedure and the three traps:
[`../50_BUILD_DEPLOY/DEVICE_TESTING_USB.md`](../50_BUILD_DEPLOY/DEVICE_TESTING_USB.md).

⭐ **So `IN1` can be closed properly** — built and verified headlessly, then LOOKED AT
on the device, which is the only thing `METHOD` accepts as closing a change.

⭐ **Two defects were already found and fixed on day one**, both recorded: the
spec's §1.1 "accumulated travel" rule (unusable — path length of a resting finger
is an unbounded random walk) and a metre-scale scene clipped by Babylon's
1-world-unit default near plane.

---

## Phase IN — the touch input system

Design of record: [`../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| IN0 | Units, motion states, flick test | IN | feature | ✅ **built 2026-09-13**, 37 vectors. ⚠ §1.1's "accumulated travel" replaced by net displacement — see the dossier. ✅ its `moveExitDistance` debt closed by `IN1` | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ⚠ **BUILT + GREEN 2026-09-13, NOT CLOSED** — 44 new vectors, and 3 defects found in §1.3 (no double-tap, unbounded `TAP`, roll-about-centroid cannot fire). ⛔ **Owed: the device look.** → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | queued | IN1 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | queued | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | queued | IN2, 3D1 |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued. ⚠ `IN1` added four more (`tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`, and a moved `stillTime`) and found `stillSpeed`/`stillTime`/`moveExitDistance` are **not independent** — measure them together | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued. ⭐ `IN1`'s rollback snapshot is the same object — `PosePort<P>` in `recognizer.ts` is the seam | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — currently undefined and reachable (§5) | IN | decision | **open — owner's call** | IN2 |

## Phase 3D — objects and assembly

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| 3D0 | Mate connectors + residual; constraint stack + solver | 3D | feature | ✅ **built 2026-09-13**, carried and covered | — |
| 3D1 | The object model: id, placement, connectors, assembly tree (parent ≠ root) | 3D | feature | ⛔ needed by IN3/IN4 | 3D0 |
| 3D2 | Snap transform + capture radius + seat | 3D | feature | queued | 3D1 |
| 3D3 | Break on residual, and re-arm on exit | 3D | feature | queued | 3D2 |
| 3D4 | Real 3D file import (glTF) | 3D | feature | queued | 3D1 |
| 3D5 | ⚠ The tree has never held more than two objects | 3D | risk | carried, unclosed | 3D1 |

## Phase RND — scene and rendering

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| RND0 | Scene stub: camera, two boxes, face picking | RND | feature | ✅ built 2026-09-13 — diagnostic only | — |
| RND1 | Constraint visibility: per-entry glyphs, hard vs soft (§6) | RND | render | queued | 3D1 |
| RND2 | Mate preview: ghost + drop line | RND | render | queued | 3D2 |
| RND3 | Anchor ring during two-touchpoint gestures (§4) | RND | render | queued | IN2 |

## Phase DEP — build and deployment

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| DEP0 | Vite + TS + vitest, `npm run verify` | DEP | infra | ✅ built 2026-09-13 | — |
| DEP1a | ⭐⭐ **Device loop over USB (Android)** — `adb reverse`. No network exposure AND `localhost` is a SECURE CONTEXT, so tilt + sensors work | DEP | infra | ✅✅ **WORKING 2026-09-13** on the Lenovo TB-X606F — two cubes confirmed on the device. ⭐ `adb reverse`, NOT Chrome port forwarding; the fix for the stuck handshake was the REAL `adb`. Procedure + 3 traps: `50_BUILD_DEPLOY/DEVICE_TESTING_USB.md` | DEP0 |
| DEP1b | Device loop over LAN — for iOS, or a second device. ⚠ needs a Private network + a scoped firewall rule (`scripts/allow-lan-dev.ps1`) | DEP | infra | queued | DEP0 |
| DEP1c | ⭐ **HTTPS on the LAN** (`@vitejs/plugin-basic-ssl`) — the only way to get a secure context on iOS over Wi-Fi | DEP | infra | queued — needed before rule 1 (tilt) can be tested on iPhone | DEP1b |
| DEP1d | GitHub Pages via Actions — real HTTPS anywhere, ⚠ slow loop | DEP | infra | ✅ **LIVE 2026-09-13** — https://dsug1.github.io/3d_assembly_game/ . Procedure: `50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md` | DEP0 |
| DEP2 | Capacitor shells for iOS/Android | DEP | platform | queued | DEP1 |
| DEP3 | Desktop shell (Tauri) | DEP | platform | queued | DEP2 |
| DEP4 | CI: typecheck + vectors on every push | DEP | infra | ✅ **rides in `pages.yml`** — the deploy is gated on `npm run verify` | DEP1d |

## Phase SEC — privacy, stores, compliance

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| SEC0 | THIRD_PARTY_NOTICES seeded, ships with the binary | SEC | governance | ✅ 2026-09-13 | — |
| SEC1 | Privacy policy + store disclosures for a youth audience | SEC | governance | open — before any submission | — |
| SEC2 | Shipping-build hygiene: compile-time-disable any capture | SEC | shipping | open — at package time | DEP2 |
| SEC3 | Dependency tree pinned by hash | SEC | infra | queued | DEP4 |

## Phase GAME — the game proper

Nothing scheduled. ⭐ When it starts, rows go **here** with the right `Sub` tag —
never in a second queue in that folder.
