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

✅ TypeScript + Babylon + Vite; `npm run verify` = typecheck + **255 golden vectors,
all passing** (37 → 219). ✅ The engine boundary is enforced by a test.
✅ **DEPLOYED**: https://dsug1.github.io/3d_assembly_game/ (`DEP1d`), gated on
`npm run verify`.

### What works, by finger, on a real device

✅ **`IN1` CLOSED** — the recognizer: commit point, provisional motion with rollback,
tap / double-tap / hold, the release-time priority ladder, screen-plane yaw/pitch, and
roll. ✅✅ **`IN9` CLOSED** — both camera rules, pinch zoom and orbit, working by
finger.

⛔ **Nothing yet touches an OBJECT for real.** The rotation in `scene.ts` is a
diagnostic stand-in; `IN3` builds rule 2bis and deletes it.

### ⛔⛔ THE FOUR MISTAKES THIS PROJECT KEEPS MAKING — they bind `IN3`/`IN4`

Seventeen defects have been found **by finger**, and **not one was visible to a green
suite**. They are four shapes, not seventeen problems:

1. **A rate estimated over the shortest available baseline.** Flick lift speed, roll
   direction, roll curvature. ⭐ *State the window, and check the signal clears the
   noise, BEFORE writing the threshold.*
2. **Measuring a DIFFERENT QUANTITY than the one asked for.** The tangent's turning
   instead of the angle about a centre — invisible until a finger reversed. ⭐ *When an
   estimator is hard, ask whether you replaced the quantity rather than improved it.*
   ⛔⛔ **AND THE SHAPE GOT INTO A GUARD WRITTEN TO CATCH IT.** The sagitta criterion
   computed `rollStepDistance² / (8 × rollRadiusMax)` — a fixed 13 mm chord at the
   LARGEST radius — while `roll.ts` sizes its window as `max(rollStepDistance,
   radius × arc)`. It was reading a span the product never fits, at the radius where
   that span never binds: 0.352 mm claimed against ~3.3 mm real, and the binding case
   is the SMALLEST radius, not the largest. ⭐ Quantity *and* direction wrong, for
   eight device passes, inside the check that exists to prevent exactly this.
3. **IDEALISED FIXTURES.** Roll vanished from the deployed page with every vector
   green, because every fixture was a perfect circle. ⭐ *Build the imperfect specimen
   and the negative first.*
4. **A COMPOSITION NOBODY COMPUTED.** Radius and height were each interpolated
   correctly; their `hypot` was never checked, and gave three segments from three
   rings. ⭐ *`METHOD` already says this — ask what the whole chain does, in one
   expression.*

⭐ And **three times** a **device judgement overturned a confident synthetic
measurement**. When they disagree, suspect the metric. ⛔ The third: measuring
`pointerNoiseMm` (0.15 → **0.761 mm**) made the sagitta guard reject a configuration
seven device passes had already accepted. The finger was right and the guard was wrong.

### ⭐⭐ `IN5` is now practical, and mostly unblocked

Tunables override from the **URL** (`?rollAngle=45&rollFilterBeta=0`), and the orbit
rings have an on-screen **tuning menu** that validates and explains refusals — so a
placeholder can be A/B'd by finger without a rebuild.
⭐ Measure **`pointerNoiseMm` FIRST**: the instrument is **built and on the HUD** as of
2026-09-14 (`src/input/noise_meter.ts`, line `noise floor=… now=… n=… cfg=…`). Hold one
finger still for a few seconds and read `floor`. The sagitta criterion and several other
thresholds are only defensible relative to it. ⛔ **Reading it is the owner's step** —
nothing in a suite can hold a finger on glass. ✅ **DONE 2026-09-14: 0.761 mm**, five
times the placeholder. ⚠ A resting-finger floor is not gameplay; it is used for the
sagitta rule only, where over-estimating is the safe direction.
⛔ ⭐ **The meter's own vectors found a hole in the meter's own vectors.** Three of four
naive alternatives failed as designed; the fourth — a window that only ever GROWS —
passed everything, because the minimum is taken while the window is still short. It
would have pinned the answer in the first 0.3 s, so a finger still settling as it lands
could never improve its reading. A fifth vector now covers it. ⚠ Mistake shape 1 again:
a statistic taken over the shortest available baseline.
⛔ `tests/config_debt.test.ts` now refuses any tunable nothing reads — after three
orphans (`moveExitDistance`, `tiltDeadband`, `gainRoll`).

⛔⛔ **NEXT IS `3D1`** — the object model. Rule 6 (screen-plane translate) was built on
2026-09-14 and is awaiting a device look; everything else in `IN3`/`IN4` needs `3D1`.

### ⭐⭐ THE ORDER, and why `3D1` is not next after all

**`IN2` → rule 6 translate → `3D1` → 6bis onward.**

⭐ **`IN4`'s dependency on `3D1` IS NOT UNIFORM, and that is what reorders the queue.**
Rule 6 (screen-plane translate) is defined on *the selected object* plus a screen
frame — no faces, no connectors, no assembly tree. Rules **6bis / 6ter / 6quater** are
defined on `AxisBtwFaces`, *the axis between the centres of the two selected FACES*,
and a face centre is exactly what `3D1` owns. ⭐ Same reason `IN9` shipped ahead of
`3D1`: ask what a rule actually reads, not which phase it is filed under.
⛔ So translation goes as far as rule 6 **and must stop there**.

⛔⛔ **AND RULE 6 IS A COMPOSITION — mistake shape 4's exact territory.** §1.2 scales
translation gains by `cameraDistance / referenceCameraDistance`, so rule 6 is
`translate × zoom × orbit`: one millimetre of finger means a different world
displacement at every camera distance, and the orbit surface now makes that distance
**asymmetric** (1.14 m at the top ring against 0.71 m at the bottom).
⭐ **Compute what ONE MILLIMETRE of finger does at both zoom extremes BEFORE writing
the gain.** Not after a device session is spent disliking it — and not as a check
bolted on afterwards, which is how the orbit surface got three segments from three
rings.

⚠ `3D1` remains the last thing between here and actual assembly, and it is where
mistake shape 4 is most likely to recur: an assembly tree composes transforms through
parent-child chains, which is what cost the predecessor a week. ⭐ Write the composite
check BEFORE the code, not after.

## Phase IN — the touch input system

Design of record: [`../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| IN0 | Units, motion states, flick test | IN | feature | ✅ **built 2026-09-13**, 37 vectors. ⚠ §1.1's "accumulated travel" replaced by net displacement — see the dossier. ✅ its `moveExitDistance` debt closed by `IN1` | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ✅ **CLOSED 2026-09-14.** 109 new vectors. **7 device passes, 14 defects none of which a green suite could see.** ⚠ It also carries rule **2quinte**'s roll detector, built early and hardened — `IN3` inherits it. → [`queue_notes/IN1.md`](queue_notes/IN1.md) | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | ✅✅ **CLOSED 2026-09-14**, 22 vectors, confirmed by finger — `src/input/router.ts`, engine-free and generic over an opaque object handle. Three roles: `OBJECT` / `OUTSIDE` / `IGNORED` (`IN8`), each latched at press for the touchpoint's lifetime; §0 order-independence keyed by pointer id, both release orders as vectors. ✅ **Device look done**: the `IN8` consequence — lift the holding finger with a second finger still on the same part and **the part stops responding** — was judged on the glass and accepted, which makes reading 1 an accepted BEHAVIOUR and not merely an accepted decision. ⭐ Pinch and orbit were re-checked too, since the plumbing was replaced underneath them. ⭐ A vector pass found **two vectors that could not fail** and fixed them → [`queue_notes/IN2.md`](queue_notes/IN2.md) | IN1, IN8 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | queued | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | ⭐ **RULE 6 BUILT 2026-09-14**, 8 vectors, ⛔ awaiting a device look — `src/input/translate.ts`. ⭐⭐ **The gain was COMPUTED before it was written**: the honest value spans **20x across the zoom clamp** and another 1.6x across screen sizes, so it is a MULTIPLIER on a computed tracking factor and **1.0 means the object sits exactly under the finger** — the first gain on this project with a correct value rather than a preferred one. ⚠ It **supersedes §1.2's `referenceCameraDistance` ratio** for this rule, and §1.2's stated rationale is backwards (scaling by distance holds the SCREEN displacement constant, not the world one). ⚠ Rule 6's `STATIONARY` clause is honoured as an ENTRY condition and then LATCHED, or a twitching thumb would flip the object between translating and rotating → [`queue_notes/IN4.md`](queue_notes/IN4.md). Rule 4 ✅ via `IN9`. 6bis onward wait on `3D1`. ⭐⭐ **THE `3D1` DEPENDENCY IS NOT UNIFORM — rule 6 did NOT need it**, which is why it shipped first: rule 6 reads *the selected object* and a screen frame, while 6bis/6ter/6quater are defined on `AxisBtwFaces`, the axis between two selected FACE centres — exactly what `3D1` owns. ✅ The composition was computed BEFORE the gain, as this row demanded. | IN2, 3D1 (6bis onward only) |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued. ⛔⛔ **A GUESSED GAIN IS RELIABLY TOO SLOW — THREE FOR THREE**: every gain a hand has set was raised from my guess, by ×3.4, ×2.3 and ×2 (`gainRotateFree`, `gainOrbitYaw`, `gainOrbitElevation` — the last one on 2026-09-14, and its row had already *predicted* it was slow without that being worth anything until a finger moved the slider). `IN3`/`IN4` add seven more — **give each a slider when it is wired**, not after a session is spent disliking it. ⭐⭐ **Now practical: tunables override from the URL** (`?rollAngle=45&rollFilterBeta=0`), so a value can be A/B'd by finger without a rebuild — `src/input/config_override.ts`. ⭐⭐ **`pointerNoiseMm` FIRST** — ⭐ **instrument BUILT 2026-09-14** (`src/input/noise_meter.ts`, on the HUD as `noise floor=…`): hold one finger still and read `floor`; the sagitta criterion and several thresholds are only defensible relative to it. ✅ **READ 2026-09-14: 0.761 mm**, five times the placeholder — and measuring it exposed a defect in the sagitta guard (see the YOU-ARE-HERE block). ⚠ Then the 1€ pair by the paper's procedure (`beta`=0, lower `minCutoff` until slow jitter is acceptable, then raise `beta` until fast motion stops lagging). ⚠ `IN1` added four more (`tapMaxDuration`, `doubleTapWindow`, `doubleTapSlop`, and a moved `stillTime`) and found `stillSpeed`/`stillTime`/`moveExitDistance` are **not independent** — measure them together | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued. ⭐ `IN1`'s rollback snapshot is the same object — `PosePort<P>` in `recognizer.ts` is the seam | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued. ⛔⛔ **iOS Safari has NO Vibration API** — on iOS this needs the native Capacitor Haptics plugin, so §6's haptic requirement is not deliverable on web-iOS at all | IN1, DEP2 |
| IN8 | ⚠ Two touchpoints on the SAME object — was undefined and reachable (§5) | IN | decision | ✅ **DECIDED 2026-09-14: IGNORE THE SECOND HIT**, for the moment (reading 2, a rotation axis between the fingers, is deferred not rejected). ⛔ **`IN2` is unblocked.** It binds `IN2`'s role latch: *ignored* becomes a THIRD latched outcome beside on-object and outside, and lifting an ignored touchpoint must NOT run the release verdict, flick test or tap history → [`queue_notes/IN8.md`](queue_notes/IN8.md) | IN2 |
| IN9 | ⭐ **CAMERA-ONLY rules: 4 (pinch zoom) and 1 (orbit)** — ⛔ needed NO object model, so it did not wait on `3D1` | IN | feature | ✅✅ **CLOSED 2026-09-14**, both rules working by finger. 56 vectors. Rule 1 cost **three** defects no green suite could see — including a **composition nobody had computed** (three rings gave three monotone segments) and a scheme **reversed on measurement** when the owner's ring shape overshot. ⭐ *"Three rigs, therefore two transitions"* is now enforced by `validateGestureConfig`. → [`queue_notes/IN9.md`](queue_notes/IN9.md) | IN1 |

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
