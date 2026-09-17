# 40 — RENDER & SCENE · the one place the engine appears

> **STATUS** · ⚠ diagnostic scene, real camera rules · **OWNS** · the Babylon scene,
> camera, picking, materials, the on-glass readout and the tuning menu
> **READ IF** · you are drawing something, or wondering why the boundary exists
> **LAST VERIFIED** · 2026-09-16

## The rule this folder exists to protect

⛔⛔ **`src/render/` is the ONLY place `@babylonjs/*` may be imported**, and
[`tests/boundary.test.ts`](../../tests/boundary.test.ts) fails the build otherwise.

It is not tidiness. The predecessor's evidence discipline — 48 suites, replay A/B,
*measure or revert* — rested on the logic being plain code a **headless** harness
could run. Logic reachable only from inside a rendered scene cannot be measured, and
what cannot be measured gets shipped on hope.

⭐ It is also what makes `D9` (Babylon over three.js) **reversible in about a day**.

⭐⭐ **The boundary has paid for itself repeatedly.** Every gesture defect found by
finger — ⭐ counted, with its ledger, in [`../00_CORE/QUEUE.md`](../00_CORE/QUEUE.md) and
not restated here, because the figure this line used to carry went stale — was reproduced
*headlessly* before it was fixed, because the recognizer, the roll estimator, the pinch and the orbit surface are
all plain code. `src/render/` holds only what genuinely needs the engine.

## Where it stands

✅ **Scene**: a camera and **three** objects. ⚠ The third is deliberately **off-axis
and off-plane** — with three collinear objects every barycentre lies on one line, no
ray could distinguish them, and §2 rule 1 would look correct while exercising nothing.

✅ **Camera rules are REAL, not diagnostic.** `src/input/` owns the geometry; this
folder only applies it.
* **Rule 4 — pinch zoom** (`IN9`, ✅ closed on a device look).
* **Rule 1 — orbit** on a three-ring surface (`IN9`, ✅ closed on a device look).
⭐ They compose through **one shared `zoom` scalar** that scales the whole orbit
surface, rather than both writing `camera.radius` and fighting over it.

✅✅ **THE OBJECT RULES ARE REAL NOW, and the MODEL is authoritative** (`3D1`, closed
2026-09-15). A gesture writes `src/core/object_model.ts`; the render loop reads the model
every frame and draws `displayPose = SWAY ∘ FOLLOW ∘ model`.
⛔⛔ **The defect that taught this, found by finger**: the loop used to draw only the
objects that HAPPENED to have a follower, so a translated object was **LOCKED** until
something else created one — and then **JUMPED** to where it should have been all along.
⭐ *Draw from the model, never from whatever bookkeeping a rule left behind.*

⚠ **What is still a stand-in is narrower than it was**: rule 2bis runs without its
PRECONDITION (§1.4's empty constraint stack), which `IN3` adds. The gesture, its axes and
its gain are real.

⭐⭐ **`requireGestureFrame()` THROWS rather than guessing.** Every object gesture stands
on a gravity frame (`A7`), and that frame is undefined when the camera looks exactly along
gravity. ⛔ The scene refuses to build one there instead of substituting an arbitrary
basis — a silent fallback would turn *"the axes are wrong at the pole"* into a defect a
hand has to find. ⚠ The three-ring orbit surface means the pole is not reachable, so the
throw is a guard on an invariant, not a live failure mode.

⚠ **The HUD carries depth's verdict and its ceiling** (`depth=… [min–max] ⛔MAX`), because
*"I can't see the object hitting any wall"* — a claim a device cannot check is an
assertion, not a finding.

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

**`hud.ts`** — phase, motion state, the release verdict, the camera state and depth
readout, the latched roles, the live noise floor, **which tunables the URL overrode**, and
⭐⭐ **the BUILD ID this bundle IS** (`build b1ce845+dirty  2026-09-16 04:52Z`).
⛔⛔ **TWO OF THOSE WERE MISSING UNTIL 2026-09-16, AND THE FIRST ONE NEVER EXISTED.**
`scene.ts` has always computed `tuning` and `tuningRejected` and handed them over; the HUD
**never rendered them**, for the whole life of the file, while this very line told a reader
that it did. ⭐ An absent readout cannot be caught by looking at the screen — there is no
wrong number to notice — so audit a readout against the **questions** it is documented to
answer, not the lines it prints (`METHOD`).
⚠ The cost it was heading for: an `IN5` session measuring a default while believing it was
measuring an override, with a typo'd key reported to nobody.
⭐⭐ **The live FORK is printed by name** (`one-finger-translate`), a pending flip with it, and — in fork C — **the toggle's current state** (`[TRANSLATE]`) plus `→PENDING` while a tap is still waiting to be judged single or double. ⛔⛔ That last one is not optional: in fork C **no finger position reveals the mode**, so it is the only way to tell *"the toggle did not fire"* from *"I toggled twice"*. ⛔ `1.0.5` runs two rule tables from one build, so a device report that does not name the fork is **unattributable** — the morning's lesson aimed one layer up, at the rule table rather than the build. ⚠ Deliberately NOT on the `build` line: that identifies an immutable artefact, this changes at runtime.
⭐ **`A15`'s ORPHANED binding is printed too** (`⛔ORPHANED(next input unselects)`) — a state in which everything looks normal and the very next input does something different, so without it *"it deselected by itself"* and *"the selection was already dead"* are indistinguishable on the glass.
⭐ **And the build stamp answers the question that cost a morning**: *which code did I just
judge?* ⛔ `+dirty` is load-bearing — it is what distinguishes the USB dev loop from the
same sha deployed, which is exactly the comparison that went wrong.
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
⛔⛔ **And one control in it is not a tunable at all**: `⭐ FORK (1.0.5 A/B)` selects which of **three** rule tables is in force (`D26`, `D27`) — every other slider changes a number. ⭐ A 0/1/2 slider, because the menu has no other kind of control, and `validateGestureConfig` refuses anything between so a half-set flag cannot masquerade as the default. ⚠ It takes effect only once nothing is touching the glass; the HUD says `⛔PENDING(lift all fingers)` until then.
⭐ **Each section collapses, and the panel remembers what was open across a reload**
(`localStorage`, keys `menu.open` and `menu.section.<title>`). A device pass is a long
sequence of reloads — a panel that reopens fully expanded every time buries the two
sliders actually being tuned. ⚠ Every `localStorage` access is wrapped: it throws
outright in some private-browsing modes, and a tuning panel must not take the scene
down with it.

**The staleness gate** (`src/core/build_gate.ts` + the boot check in `src/main.ts`, ✅✅ closed
by a device look 2026-09-16) —
⛔ **not an instrument, a correction.** The page asks the origin for `version.json` with
`cache: "no-store"` and **replaces itself once** if the served build id is not the one
compiled in. ⭐ It is why the plain URL
**https://dsug1.github.io/3d_assembly_game/** can be trusted for a device pass without a
hand-typed cache-buster.
⛔ Every branch fails **safe** — towards *carry on with what is loaded*: an absent or
unparseable `version.json` (`file://`, a Capacitor webview, offline, a 404 in dev) is *no
information*, never a mismatch, because the alternative to a stale page is a page that
reloads for ever. ⭐ The one attempt is keyed on the **served** id, so a URL pinned to an
old build still refreshes instead of being stranded. 16 vectors, and the two guards were
falsified on purpose.
⚠ The decision is in `src/core` and not in the wiring on purpose: `D23` recorded what it
costs to leave one in `scene.ts`, where no vector can reach it.

**`noise_meter.ts`** (in `src/input`, engine-free) — the `pointerNoiseMm` instrument,
reported on the HUD. ⛔ Fed by **one** touchpoint, the first down, and reset when that
hold begins: interleaving two fingers would measure the distance *between* them.
⚠ Fed only from `POINTERDOWN`/`POINTERMOVE` — Babylon also emits `POINTERPICK` and
`POINTERTAP` carrying the *same* event, and a duplicated sample pulls the RMS down.
An instrument that flatters itself is worse than none.

**The orbit-centre marker** — a small emissive sphere at whatever §2 rule 1 chose.
⛔ Tagged **out** of the barycentre candidate set (`metadata.orbitCandidate`): a marker
that became a candidate would move the very centre it is drawn to show.
⭐ It sits at the **CHOSEN** centre, not the blended one, so the camera visibly travels
toward it. ⚠ An instrument is judged against the question it exists to answer — here
*"which barycentre was selected?"* — not against the quantity it happens to be nearest.

⚠ All three are diagnostic. They are listed here because they are the reason defects
get *found*, and deleting them quietly would cost the next device session.

## ⭐⭐ FORK C's WIRING — what `scene.ts` owns of `D37` (2026-09-16)

⚠ Here because **`IN3`'s last three defects were all in this layer**, where no vector reaches.

* **`forkCAlign`** — the alignment, reached from a **second holder's `TAP`**. ⛔ Not a press,
  and not the `SECOND` role: a finger on ANOTHER object is routed `OBJECT`, so *"tap on second
  object's hit face"* arrives as that grip's own tap and the Follower is the OTHER grip.
  ⭐ Exactly one other holder or it refuses — with two, which one is the Follower has no
  trustworthy answer.
* **`Held.pressFace`** — per grip: the trigger names **two** faces on two objects at once,
  which one `selectedFace` cannot express. **`Held.alignmentTouched`** — *made during THIS
  gesture?*, which no look at the state can answer.
* ⛔⛔ **THE MARKERS ARE PARENTED TO THE OBJECT** (defect 46, 2026-09-17). They used to be
  positioned from `mesh.getWorldMatrix()` — Babylon's **cached** matrix, recomputed inside
  `scene.render()`, i.e. AFTER the block that read it — so every marker drew the pose its
  object had last frame. ⭐ Parenting makes the lag **unreachable** rather than corrected;
  `computeWorldMatrix(true)` would have fixed this frame and left the trap for the next
  writer. ⚠ It also moves *the marker turns with its face* out of reach of any vector.
* The highlight is raised **at the alignment**, not at the press (`D35`), and ⛔ **every
  refusal is printed**: this gesture's failure mode is *nothing visibly happened*.
* **TWO markers since `D39`** — a filled quad on the Follower (what moved) and a **line
  contour** on the Pioneer (what it was aimed at), both through **one** `placeFaceMarker`:
  a second copy of that geometry is a second implementation that can silently disagree.
  ⛔ The pair is **atomic** — the contour may not outlive the fill, or it claims a
  relationship that is gone. ⚠ `CreateLines` is one pixel wide by WebGL's rule, not by
  choice; if a hand finds it faint the answer is `GreasedLine`, not a thicker hack.

## Queued

`RND1` constraint glyphs (hard vs soft) · `RND2` mate preview ghost + drop line ·
`RND3` anchor ring during two-touchpoint gestures. All three are spec §6's
*constraint visibility* requirement: **the stack must never be invisible state.**
✅ **All three are UNBLOCKED** — `3D1` is built and closed, so the constraint stack they
must draw exists. · `RND4` Halo/Wedge for an off-screen partner, queued behind 6ter.


---

## ⭐ The sway and the camera guards — the full text

⚠ Both describe **built scene behaviour**: the sympathetic sway (the scene reacting to the
held object) and the guards on the camera. ⛔ They came here from `QUEUE.md` when it hit its
cap, and moved on to `history/` when THIS file hit its own — unrewritten both times.
⭐ [`history/2026-09-16_sway_and_camera_guards.md`](history/2026-09-16_sway_and_camera_guards.md).
