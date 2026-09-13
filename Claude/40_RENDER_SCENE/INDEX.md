# 40 — RENDER & SCENE · the one place the engine appears

> **STATUS** · ⚠ stub · **OWNS** · the Babylon scene, camera, picking, materials, HUD
> **READ IF** · you are drawing something, or wondering why the boundary exists
> **LAST VERIFIED** · 2026-09-13

## The rule this folder exists to protect

⛔⛔ **`src/render/` is the ONLY place `@babylonjs/*` may be imported**, and
[`tests/boundary.test.ts`](../../tests/boundary.test.ts) fails the build otherwise.

It is not tidiness. The predecessor's evidence discipline — 48 suites, replay A/B,
*measure or revert* — rested on the logic being plain code a **headless** harness
could run. Logic reachable only from inside a rendered scene cannot be measured, and
what cannot be measured gets shipped on hope.

⭐ It is also what makes `D9` (Babylon over three.js) **reversible in about a day**.

## Where it stands

✅ `RND0`: a scene with a camera, two boxes and pointer picking that logs
`pickedMesh` + `faceId`. **Diagnostic only** — it is the seam `IN2` replaces.

⚠ `camera.detachControl()` is deliberate. Rules 1 and 4 drive the orbit through the
gesture layer; letting Babylon's own controls attach as well means two things claim
the same touch and the winner depends on event order.

⭐ Face picking is *why* Babylon is here: rule 2 selects a **face**, not an object,
and `pickResult.faceId` gives it directly. That is also the seam to a mate connector.

## Queued

`RND1` constraint glyphs (hard vs soft) · `RND2` mate preview ghost + drop line ·
`RND3` anchor ring during two-touchpoint gestures. All three are spec §6's
*constraint visibility* requirement: **the stack must never be invisible state.**
