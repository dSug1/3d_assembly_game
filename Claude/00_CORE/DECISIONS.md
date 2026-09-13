# DECISIONS — taken, and still open

> **STATUS** · live · **OWNS** · owner decisions and their consequences
> **READ IF** · you are about to re-open something, or need to know whose call it is
> **LAST VERIFIED** · 2026-09-13

⚠ A decision here is **not** a rejected experiment. Things tried and measured out
belong in a `REJECTED.md` — start one the first time something is measured out.

## Taken and binding

| # | decision | date | consequence |
|---|---|---|---|
| `D1` | ⭐⭐⭐ **TypeScript + Babylon.js, web-first, Capacitor for stores** | 2026-09-13 | Made on **day one**, deliberately, because the predecessor's deferred platform decision blocked four rows and the whole game layer. One codebase for web + iOS + Android + desktop |
| `D2` | ⛔⛔ **Audience is ALL PUBLIC, INCLUDING YOUTH** | 2026-09-13 | Carried from the predecessor. COPPA / GDPR-K live → no analytics or ads SDKs; local-only is load-bearing; Play Families + Apple Kids rules apply |
| `D3` | **The game will be commercialised** | carried | `N13` binding: no non-commercially-licensed dependency |
| `D4` | ⭐ **Manipulation is direct and kinematic, not physics-driven** | carried | The transform is driven straight from input. Never regretted in the predecessor |
| `D5` | ⭐⭐ **Assembly is by MATE CONNECTORS** (Onshape's model) | carried | `src/core/mate_connector.ts`, and the four rules in `LESSONS_CARRIED.md` |
| `D6` | ⛔ **`src/core` and `src/input` import no engine**, and a test enforces it | 2026-09-13 | The predecessor stated the same contract in prose and it silently became false |
| `D7` | **Thresholds in millimetres, never pixels** | 2026-09-13 | `src/core/units.ts`; every threshold converts at runtime |
| `D8` | ⭐ **The constraint stack replaces the three booleans** | 2026-09-13 | Owner's revision-5 spec §1.4, adopted as the design of record |
| `D9` | ⭐ **Babylon over three.js** | 2026-09-13 | `pickResult.faceId` gives face picking directly, which rule 2 needs; multi-pointer handling is built in. ⚠ Apache-2.0, so the NOTICE must ship. ⭐ Reversible in about a day *because* of `D6` — that is what the boundary buys |

## ⚠ Still the owner's to make

| | what is blocked on it |
|---|---|
| ⭐ **`IN8` — two touchpoints on the SAME object** | undefined and *reachable* today. Either ignore the second hit, or use the segment between fingers as a rotation axis. Spec §5 flags it; it needs deciding before `IN2` ships |
| **Un-snap: what breaks a mate on a touchscreen?** | the predecessor settled on *"un-snapping needs two hands"*. The touch equivalent is not obvious and `3D3` waits on it |
| **`axisMappingMode`: `rotated` vs `direct`** (§6bis) | build both, A/B on a device. The spec asks for the comparison rather than assuming |
| **`matePriorityOverAnchor`** (§1.4) | default is anchor-wins. The opposite reading exists as a flag for A/B |
| **Landmark registration, contact search, longest-axis alignment** | spec §5 lists them as deliberately deferred, so the gaps are explicit rather than implicit |

## ⛔ Owed, and not closed by anything above

⛔⛔ **A LOOK ON A REAL DEVICE.** Nothing in this repository has been touched by a
finger. Every number in `gestureConfig.ts` is a placeholder, the recognizer does not
exist yet, and `METHOD` closes a change with a device look and nothing else.
