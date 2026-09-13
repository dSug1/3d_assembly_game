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

## ⭐⭐⭐ YOU ARE HERE (2026-09-13) — day one, scaffolding green

✅ TypeScript + Babylon + Vite up; `npm run verify` = typecheck + **37 golden
vectors, all passing**. ✅ The engine boundary is enforced by a test. ✅ The
mate-connector geometry and the constraint-stack solver are in and covered.
⛔ **NEXT: `IN1`** — the gesture recognizer state machine. It is the spine every
input rule hangs off, and §1.3 of the spec calls it *"the central change"*.
⛔ **OWED: a look on a real device.** Nothing here has been touched by a finger.

---

## Phase IN — the touch input system

Design of record: [`../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md).

| # | Item | Sub | Kind | Status | Dep |
|---|---|---|---|---|---|
| IN0 | Units, motion states, flick test | IN | feature | ✅ **built 2026-09-13**, 37 vectors. ⚠ §1.1's "accumulated travel" replaced by net displacement — see the dossier | — |
| IN1 | ⭐⭐ The recognizer state machine — PRESSED / COMMITTED_CONTINUOUS / TAP, provisional motion + rollback, release-time priority | IN | feature | ⛔ **NEXT** | IN0 |
| IN2 | Pointer plumbing: two touchpoints, roles latched at press (§4) | IN | feature | queued | IN1 |
| IN3 | Rules 1–3 (one touchpoint): select, free rotate, flick-to-align, roll, constrained rotate | IN | feature | queued | IN1, 3D1 |
| IN4 | Rules 4–6 (two touchpoints): zoom, translate, mutual approach, mate flick | IN | feature | queued | IN2, 3D1 |
| IN5 | ⚠ **MEASURE every config default on a real device.** None is derived | IN | measurement | queued | IN3 |
| IN6 | Undo: pose snapshot stack per object (§6) | IN | feature | queued | IN1 |
| IN7 | Haptics: lock / mate / rejected patterns (§6) | IN | feature | queued | IN1 |
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
| DEP1 | ⛔ **Device testing loop** — `--host`, phone on the LAN. Nothing is closable without it | DEP | infra | ⛔ **do this before IN1** | DEP0 |
| DEP2 | Capacitor shells for iOS/Android | DEP | platform | queued | DEP1 |
| DEP3 | Desktop shell (Tauri) | DEP | platform | queued | DEP2 |
| DEP4 | CI: typecheck + vectors on every push | DEP | infra | queued | DEP0 |

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
