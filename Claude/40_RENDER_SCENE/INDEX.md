# 40 — RENDER & SCENE · the one place the engine appears

> **STATUS** · ⚠ diagnostic scene, real camera rules · **OWNS** · the Babylon scene,
> camera, picking, materials, the on-glass readout and the tuning menu
> **READ IF** · you are drawing something, or wondering why the boundary exists
> **LAST VERIFIED** · 2026-09-14

## The rule this folder exists to protect

⛔⛔ **`src/render/` is the ONLY place `@babylonjs/*` may be imported**, and
[`tests/boundary.test.ts`](../../tests/boundary.test.ts) fails the build otherwise.

It is not tidiness. The predecessor's evidence discipline — 48 suites, replay A/B,
*measure or revert* — rested on the logic being plain code a **headless** harness
could run. Logic reachable only from inside a rendered scene cannot be measured, and
what cannot be measured gets shipped on hope.

⭐ It is also what makes `D9` (Babylon over three.js) **reversible in about a day**.

⭐⭐ **The boundary has paid for itself repeatedly.** Every gesture defect found by
finger — and there have been sixteen — was reproduced *headlessly* before it was
fixed, because the recognizer, the roll estimator, the pinch and the orbit surface are
all plain code. `src/render/` holds only what genuinely needs the engine.

## Where it stands

✅ **Scene**: a camera and **three** objects. ⚠ The third is deliberately **off-axis
and off-plane** — with three collinear objects every barycentre lies on one line, no
ray could distinguish them, and §2 rule 1 would look correct while exercising nothing.

✅ **Camera rules are REAL, not diagnostic.** `src/input/` owns the geometry; this
folder only applies it.
* **Rule 4 — pinch zoom** (`IN9`, ✅ closed on a device look).
* **Rule 1 — orbit** on a three-ring surface (`IN9`, ⚠ not closed).
⭐ They compose through **one shared `zoom` scalar** that scales the whole orbit
surface, rather than both writing `camera.radius` and fighting over it.

⚠ **Everything that touches an OBJECT is still a diagnostic stand-in** — the
rotation in `scene.ts` is not rule 2bis. `IN3` builds the real rules and deletes it.
⭐ It does read the real `gainRotateFree` from the config, so tuning it tunes what
`IN3` inherits.

### ⛔⛔ Two traps this folder exists to remember

**The scene is in METRES, and Babylon's near plane is PER-CAMERA.** `minZ` defaults to
1, which put this whole scene inside the near plane and rendered **a black page with
no error anywhere** — the most expensive failure this project has had. Any future
camera must set it too.
⭐ The value lives in `gestureConfig.ts` as `CAMERA_NEAR_PLANE_M` and is *read* here:
the config **validator** needs it to refuse a zoom range that would clip the scene,
and the camera is the only thing that can apply it. One constant, one place.

**`camera.detachControl()` is deliberate.** Rules 1 and 4 drive the camera through the
gesture layer; letting Babylon's own controls attach as well means two things claim
the same touch and the winner depends on event order.

⭐ Face picking is *why* Babylon is here: rule 2 selects a **face**, not an object, and
`pickResult.faceId` gives it directly. That is also the seam to a mate connector.

## ⭐⭐ The instruments — and why they are not optional

A gesture recognizer is **invisible**. `METHOD` closes a change only on a look at a
real device, and *"the cube moved"* says nothing about whether a gesture committed,
whether a flick rolled the pose back, or which rule won at release.

**`hud.ts`** — phase, motion state, roll angle and sign, the release verdict, the
**measured lift speed against the threshold it was judged by**, the camera state, and
which tunables the URL overrode.
⛔ It prints what the recognizer **reported**, never a recomputation: a readout that
derives its own answer is a second implementation, and it can disagree with the
product while showing green.
⛔ `pointer-events: none` — it must never eat a touch it exists to describe.

**`menu.ts`** — a collapsible panel of sliders for tuning by hand on the glass.
⛔ **Every change is validated on a COPY before it is applied, and refusals are shown.**
`validateGestureConfig` otherwise runs once at startup, so a slider would bypass every
cross-tunable rule — and those are exactly the numbers only meaningful in combination.
⚠ Sliders **and** step buttons: the page sets `touch-action: none` so the browser
cannot claim the gestures, which can stop a native range input dragging. Buttons are
plain taps and always work.

**The orbit-centre marker** — a small emissive sphere at whatever §2 rule 1 chose.
⛔ Tagged **out** of the barycentre candidate set (`metadata.orbitCandidate`): a marker
that became a candidate would move the very centre it is drawn to show.
⭐ It sits at the **CHOSEN** centre, not the blended one, so the camera visibly travels
toward it. ⚠ An instrument is judged against the question it exists to answer — here
*"which barycentre was selected?"* — not against the quantity it happens to be nearest.

⚠ All three are diagnostic. They are listed here because they are the reason defects
get *found*, and deleting them quietly would cost the next device session.

## Queued

`RND1` constraint glyphs (hard vs soft) · `RND2` mate preview ghost + drop line ·
`RND3` anchor ring during two-touchpoint gestures. All three are spec §6's
*constraint visibility* requirement: **the stack must never be invisible state.**
⚠ All three wait on `3D1`, the object model.
