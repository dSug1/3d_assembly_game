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

## ⭐⭐⭐ YOU ARE HERE (2026-09-14) — `IN1` closed, camera rules nearly there

✅ TypeScript + Babylon + Vite; `npm run verify` = typecheck + **217 golden vectors,
all passing** (37 → 217). ✅ The engine boundary is enforced by a test.
✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/ (`DEP1d`), gated on
`npm run verify`.

### What works, by finger, on a real device

✅ **`IN1` CLOSED** — the recognizer: commit point, provisional motion with rollback,
tap / double-tap / hold, the release-time priority ladder, screen-plane yaw/pitch, and
roll. ✅ **`IN9` rule 4 CLOSED** — pinch zoom. ⚠ **`IN9` rule 1** — orbit on a
three-ring surface: built, green, **not closed**.

⛔ **Nothing yet touches an OBJECT for real.** The rotation in `scene.ts` is a
diagnostic stand-in; `IN3` builds rule 2bis and deletes it.

### ⛔⛔ THE FOUR MISTAKES THIS PROJECT KEEPS MAKING — they bind `IN3`/`IN4`

Sixteen defects have been found **by finger**, and **not one was visible to a green
suite**. They are four shapes, not sixteen problems:

1. **A rate estimated over the shortest available baseline.** Flick lift speed, roll
   direction, roll curvature. ⭐ *State the window, and check the signal clears the
   noise, BEFORE writing the threshold.*
2. **Measuring a DIFFERENT QUANTITY than the one asked for.** The tangent's turning
   instead of the angle about a centre — invisible until a finger reversed. ⭐ *When an
   estimator is hard, ask whether you replaced the quantity rather than improved it.*
3. **IDEALISED FIXTURES.** Roll vanished from the deployed page with every vector
   green, because every fixture was a perfect circle. ⭐ *Build the imperfect specimen
   and the negative first.*
4. **A COMPOSITION NOBODY COMPUTED.** Radius and height were each interpolated
   correctly; their `hypot` was never checked, and gave three segments from three
   rings. ⭐ *`METHOD` already says this — ask what the whole chain does, in one
   expression.*

⭐ And twice, a **device judgement overturned a confident synthetic measurement**.
When they disagree, suspect the metric.

### ⭐⭐ `IN5` is now practical, and mostly unblocked

Tunables override from the **URL** (`?rollAngle=45&rollFilterBeta=0`), and the orbit
rings have an on-screen **tuning menu** that validates and explains refusals — so a
placeholder can be A/B'd by finger without a rebuild.
⭐ Measure **`pointerNoiseMm` FIRST**: hold a finger still and read the spread. The
sagitta criterion and several other thresholds are only defensible relative to it.
⛔ `tests/config_debt.test.ts` now refuses any tunable nothing reads — after three
orphans (`moveExitDistance`, `tiltDeadband`, `gainRoll`).

⛔ **NEXT**: close `IN9` rule 1 on a device, then **`3D1`** — the object model, which
`IN3`, `IN4`, `RND1` and `RND2` are all waiting on, and the last thing between here and
actual assembly.

## Phase IN — the touch input system

Design of record: [`../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| IN0 | Units, motion states, flick test | IN | feature | ✅ **built 2026-09-13**, 37 vectors. ⚠ §1.1's "accumulated travel" replaced by net displacement — see the dossier. ✅ its `moveExitDistance` debt closed by `IN1` | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ✅ **CLOSED 2026-09-14.** 109 new vectors. **7 device passes, 14 defects none of which a green suite could see.** ⚠ It also carries rule **2quinte**'s roll detector, built early and hardened — `IN3` inherits it. → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | queued | IN1 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | queued | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | queued | IN2, 3D1 |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued. ⭐⭐ **Now practical: tunables override from the URL** (`?rollAngle=45&rollFilterBeta=0`), so a value can be A/B'd by finger without a rebuild — `src/input/config_override.ts`. ⭐⭐ **`pointerNoiseMm` FIRST** — hold a finger still and read the spread; the sagitta criterion and several thresholds are only defensible relative to it. ⚠ Then the 1€ pair by the paper's procedure (`beta`=0, lower `minCutoff` until slow jitter is acceptable, then raise `beta` until fast motion stops lagging). ⚠ `IN1` added four more (`tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`, and a moved `stillTime`) and found `stillSpeed`/`stillTime`/`moveExitDistance` are **not independent** — measure them together | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued. ⭐ `IN1`'s rollback snapshot is the same object — `PosePort<P>` in `recognizer.ts` is the seam | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — currently undefined and reachable (§5) | IN | decision | **open — owner's call** | IN2 |
| IN9 | ⭐ **CAMERA-ONLY rules: 4 (pinch zoom) and 1 (orbit)** — ⛔ needs NO object model | IN | feature | ✅ **rule 4 CLOSED** (5/5 device checks). ⚠ **rule 1 BUILT + GREEN, NOT CLOSED** — 36 vectors. First device look found three monotone segments where three rings allow two (`METHOD`: *a composition is a thing to measure*); now **monotone Fritsch–Carlson in (distance, angle)**. ⭐ A **tuning menu** (6 ring sliders, validated) and a **third object** + visible orbit-centre marker. ✅ `tiltDeadband` deleted, and a **config-debt guard** now refuses any tunable nothing reads. → [`queue_notes/IN9.md`](queue_notes/IN9.md) | IN1 |

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
