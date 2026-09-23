# PROVENANCE — where every gesture in this project comes from

> **STATUS** · ⭐ live · **OWNS** · the prior-art anchor for each gesture rule, and the
> explicit marking of the ones that are NOVEL to this project
> **READ IF** · you are adopting a technique, adding a gesture, or preparing a
> freedom-to-operate review
> **LAST VERIFIED** · 2026-09-16

⭐⭐ **Adopted 2026-09-15 from the owner's `TECHNIQUE_CATALOG.md` §0 and §5** (`D11`).
The discipline is the catalog's, and the reason to take it is the catalog's own:

> *"Publication date is the defence: a technique published in CHI / UIST / I3D /
> SIGGRAPH proceedings is prior art from its publication date and cannot subsequently be
> patented by a third party. Recording the citation costs nothing now and is the only
> cheap moment to do it."*

⛔ **This is not legal advice and this file is not an opinion.** It is a register, so that
a freedom-to-operate review (`SEC4`) has something to review instead of starting from a
codebase. ⚠ It is also load-bearing for `D3`: the game will be commercialised.

---

## The three tags, and why the middle one is the one that matters

| tag | meaning |
|---|---|
| **PRIOR ART** | traceable to a dated publication or to practice so universal it cannot be claimed. Cite it here and the date is the defence |
| ⚠ **NOVEL COMPOSITE** | no publication describes this gesture. It may be perfectly free, but nothing here *proves* it is, and it is what a review must look at |
| **INTERNAL COMPOSITION** | prior-art parts, assembled here in a way that is ours. Between the two above |

⛔⛔ **The exposure is not "two fingers change scale" — that is universal.** The catalog's
caution zone is specific: *multi-finger composite gestures that no prior publication
describes* are the litigated territory (Apple's pinch/scroll family, US 7,844,915 and
relatives). ⭐ **This project's two-touchpoint rules are exactly that shape**, which is why
they are marked below rather than left to be discovered.

---

## The register — §2, one touchpoint

| rule | what it is | tag | anchor |
|---|---|---|---|
| **1** | orbit the camera, touch-clutched | **PRIOR ART** | turntable orbit (azimuth/elevation, persistent world-up) is conventional since the 1980s; Blender's default |
| **1** *(pivot)* | the pivot is the BARYCENTRE with the smallest perpendicular distance to the finger's ray | ⚠ **NOVEL COMPOSITE** | pivot-on-selection is conventional DCC/CAD practice (Maya tumble pivot, SolidWorks rotate-about-selection, pre-1995). **Choosing among barycentres of object subsets by ray distance is ours** |
| **1** *(surface)* | a three-ring orbit surface, radius and height interpolated through three rigs | **INTERNAL COMPOSITION** | parametric interpolation of a camera path is generic geometry; the three-ring shape is the owner's |
| **2** | tap an object → select object + face | **PRIOR ART** | direct picking; Nielson & Olsen, *Direct manipulation techniques for 3D objects using 2D locator devices*, Interactive 3D Graphics 1986 |
| **2bis** | drag → yaw/pitch about the screen axes | **PRIOR ART** | Chen, Mountford & Sellen, *A study in interactive 3-D rotation using 2-D control devices*, SIGGRAPH 1988 — the **virtual sphere**. ⚠ Our per-frame incremental form is the virtual sphere's, not Shoemake's arcball; see `queue_notes/IN11.md` |
| **2ter** | vertical flick → `GRAVITY_ALIGN` | ⚠ **NOVEL COMPOSITE** | a flick is universal. **Flick-to-push-a-constraint is ours.** Nearest published relative: snap-dragging's alignment objects (Bier 1990) |
| **2quater** | horizontal flick → `WORLD_AXIS_ALIGN`, screen-x resolved to world at snap time | ⚠ **NOVEL COMPOSITE** | as 2ter |
| **2quinte** | circular gesture → roll about the view axis | ⚠ **NOVEL COMPOSITE** | rotate-by-circling is widely practised; **committing on signed angle accumulated about a FITTED centre, gated by a radius band, is ours** |
| **2sexte** | drag → rotation about the remaining free DOF only | **INTERNAL COMPOSITION** | constrained-DOF manipulation is Bier, *Snap-dragging in three dimensions*, I3D 1990, and Bukowski & Séquin, *Object associations*, I3D 1995. Binding it to an ordered stack is ours |
| **2septies** | ⭐ **a quick BACK-AND-FORTH** → clear the object's alignments, sparing mates *(owner, 2026-09-15, amendments A1 → A4; it was a double-tap, then briefly a 360° roll)* | ⚠ **NOVEL COMPOSITE** — flagged for `SEC4` | double-tap-to-reset is universal and was the original. ⚠ The nearest widely-known relative to the replacement is iOS's **shake-to-undo** (2009) — but that reads the **accelerometer**, a device motion, not a touch path, so it is a different input and **not a safe prior-art anchor**. ⭐ The metaphor is old; this gesture is not attested anywhere found |

## The register — §4, two touchpoints ⚠ the section a review should read first

| rule | what it is | tag | anchor |
|---|---|---|---|
| **4** | pinch → zoom | **PRIOR ART** | universal; explicitly outside the catalog's caution zone |
| **5** | two hits → select both objects and both faces | **PRIOR ART** | direct picking, as rule 2 |
| **6** | one finger on the object, one outside → translate in the screen plane | **INTERNAL COMPOSITION** | the translation itself is conventional unprojection ("sticky drag") and our gain is **computed** so 1.0 puts the object under the finger. ⚠ **Using a finger OUTSIDE any object as the mode selector is ours** |
| **6bis** | depth + `AxisFirstOrthogonal` from a drag projected onto `AxisBtwFaces` | ⚠⚠ **NOVEL COMPOSITE** | nearest published relatives are Martinet, Casiez & Grisoni, *Z-technique*, 3DUI 2010, and **DS3**, IEEE TVCG 2012 — both separate depth onto a second finger. **Neither describes an axis between two selected face centres.** ⛔ The closest prior art does something materially different |
| **6ter** | both fingers moving → both objects translate toward each other on `AxisBtwFaces` | ⚠⚠ **NOVEL COMPOSITE** | no published relative found. The spec itself flags it as the hardest case to control |
| **6quater** | flick one object toward the other → push `MATE`, re-solve, unselect | ⚠⚠ **NOVEL COMPOSITE** | the *outcome* is snap-dragging (Bier 1990) and object associations (Bukowski & Séquin 1995), both prior art. **The gesture that triggers it — a direction-pure flick at a second selected object, separated from a drag by terminal lift speed — is ours** |

| **A5** *(new)* | two touchpoints on the SAME object → **horizontal depth pinch** on that object (the view axis flattened onto the ground plane, so height is preserved) | ⚠⚠ **NOVEL COMPOSITE** — ⛔ flagged for `SEC4` | ⛔ **The nearest this project comes to the catalogue's caution zone**, which names Apple's pinch/scroll family. A pinch that moves an object in DEPTH is not that claim, and the nearest published relatives — Z-technique (3DUI 2010), DS3 (TVCG 2012) — separate depth onto a *second finger's relative motion*, not a pinch. ⭐ Tagged at the moment of adoption, which is the whole point of the discipline |
| **A6** *(new, supersedes A5's trigger)* | one touchpoint on the object + one **anywhere**, both travelling in `y` together → **depth**. The first DRIVES, the second only VALIDATES by following within a percentage ratio | ⚠⚠ **NOVEL COMPOSITE** — ⛔ flagged for `SEC4` | ⭐ It is nearer published prior art than A5 was: **Z-technique** (Martinet, Casiez & Grisoni, 3DUI 2010) and **DS3** (TVCG 2012) both put depth on a *second finger's* motion, which is the same family. ⚠ **What is ours is the DISCRIMINATOR**: the same two-finger configuration serves rule 6 and depth, and they are told apart by **common mode versus differential mode**, with hold windows at a reversal and at a late start. No publication found describing that separation |
| **A7** *(new)* | every object gesture is expressed in a **GRAVITY FRAME** — yaw about the world vertical, pitch about the horizontal, roll and depth about the view direction flattened onto the ground | **INTERNAL COMPOSITION** | ⭐ The parts are universal: a world-up-locked yaw is the standard turntable convention (any DCC package, pre-1995), and projecting a view vector onto a ground plane is elementary. ⚠ **What is ours is applying ONE such frame to rotation AND translation AND depth at once**, on the argument that *the axis you push along is the axis you can turn about*. Low exposure: no gesture is claimed, only a choice of basis |
| **A8** *(new)* | a roll **rebases** the object to the pose it held when the circle's evidence began | **PRIOR ART** | provisional-motion-with-rollback is the owner's own §1.3, and deferred-commit with undo is universal in recognizer design (any gesture toolkit). ⭐ Rebasing to the FIT WINDOW's start rather than to the press is a detail of *this* recognizer, not a technique |
| **A9** *(queued, `IN12`)* | a **deadband** on the per-axis pointer delta, with the residual carried forward | **PRIOR ART** | dead zones on an analogue input are universal and undatable — joystick and game-controller practice long predates touch, and every pointer stack ships one. ⛔ **Nothing here is claimable**, and the residual-accumulator form is textbook quantiser-with-memory |

| **A15** *(new)* | when the second touchpoint lifts, a **raycast under the holder**: if its object is no longer there, the selection is dropped **at the next input event** and the configuration re-resolves | **INTERNAL COMPOSITION** | ⭐ Each half is ordinary practice with no plausible claim over it: **picking under a pointer** is the same raycast rule 2 already does (direct picking, universal), and **dropping a selection whose target is gone** is defensive state hygiene of the kind any direct-manipulation editor performs. ⚠ What is ours is the COMPOSITION and its timing — keying it on the lift of the *other* touchpoint, and deferring the consequence to the next input. ⛔ It is recorded as a composition rather than PRIOR ART because no publication is cited for that timing; it is deliberately NOT marked novel composite, since it adds no multi-finger gesture — it **removes** a stale binding, which is the opposite of the catalog's caution zone |

| **A16** *(new, fork C)* | **any single TAP** toggles the movement behaviour — a second touchpoint's, or one touchpoint's with nothing carried — while a **PRESS** keeps its existing meanings | **PRIOR ART** | ⭐ A **tap to switch the active tool or mode** is one of the oldest interactions there is and is not claimable: it is the whole of a tool palette, and on touch specifically it is the *tap-to-cycle* pattern in shipped editors long before this project. ⚠ What could have been distinctive — keying it on a SECOND touchpoint while a first is mid-gesture — is a **modifier chord**, equally universal (shift-drag). ⛔ So it is tagged prior art rather than composition, and deliberately NOT novel composite: it adds **no multi-finger gesture** and consumes **no DOF**; it selects between two gestures this project already had |

## The register — behaviours with no clause in the spec

| behaviour | tag | anchor |
|---|---|---|
| double-tap flies the camera home | **PRIOR ART** | reset-view is universal. ⚠ Easing the ORBIT PARAMETERS rather than the transform is an implementation choice, not a claimable gesture |
| the sympathetic sway | **NOVEL**, and **not an input gesture** | it reads no input and consumes no DOF — it is decoration driven by the held object's motion. Recorded for completeness; outside the caution zone |

---

## Adopted techniques, with their citations

⛔ **Every technique adopted from the catalog keeps its citation HERE, at the moment of
adoption.** That is the discipline; a citation added later is a reconstruction.

| adopted | from | citation | where it landed |
|---|---|---|---|
| **Snap priority and screen-space pointing tolerance** | catalog §4.1 | Bier, *Snap-dragging in three dimensions*, I3D 1990; Bier & Stone, *Snap-dragging*, SIGGRAPH 1986 | spec, *ADOPTED FROM THE TECHNIQUE CATALOG*; binds `3D2` |
| **Single-vs-double tap discrimination by the INTER-TAP DELAY** | checked at the owner's instruction, 2026-09-16 | Unity Input System **1.12 docs**: `MultiTapInteraction` (`tapTime` ← `defaultTapTime`, `tapDelay` ← 2 × tapTime, `tapCount` 2) and `InputSettings` (`defaultTapTime` **0.2 s**, `multiTapDelayTime` **0.75 s**, `tapRadius` **5 px**) | `input/assignment.ts` — `pendingAfterTap` / `toggleDue`, and fork C's toggle. ⛔ **Parameters and shape only, read from documentation — no Unity code**, which matters for the same reason as the Cinemachine note below: Unity's code ships under the Unity Companion License and is usable only in Unity-engine applications. ⭐ The deferral itself is NOT Unity's — its `Tap` fires immediately and does not wait, which is the defect this fixed; holding a single action for the multi-tap delay is the universal single-vs-double-click answer, prior art since the desktop double-click |
| **Provenance discipline and the IP register** | catalog §0, §5 | the catalog itself | this file; `CONSTRAINTS` §10; `D11`; `SEC4` |

## Candidates recorded but NOT adopted

⭐ Recorded so that a later session does not re-derive the assessment.

| candidate | verdict | why |
|---|---|---|
| §2.3 frame snapshot, §2.2 turntable, §3.1 sticky drag | **already built** | shipped in `IN1`/`IN9`/`IN4` before the catalog was read. The catalog confirms them independently |
| §3.3 tBox, §3.4 axis-handle gizmo | **declined** | both interpose a WIDGET between finger and object, against `D4` (direct, kinematic manipulation) and against rule 2, which selects a face by touching that face |
| §2.4 raycast orbit pivot | **queued** — `IN10` | real for large assemblies; premature while the scene holds three small objects whose barycentre IS the thing being worked on |
| §1.2 Halo / Wedge | **queued** — `RND4` | needed once 6ter/6quater can have an off-screen partner |
| §3.2 Z-technique / DS3 | ⛔ **DECLINED 2026-09-15, by a hand** — the device pass reached for a **pinch on the object** instead, which was not one of the outcomes the watch item offered. ⚠ **And the pinch did not survive either**: `A6` replaced its trigger with a common vertical drag, which lands **closer to DS3's family than the pinch was** — depth on a second finger — while keeping its own discriminator. ⭐ So the verdict stands but the reason narrowed: what was declined is DS3's *mapping*, not the idea of a second finger carrying depth. ⭐ *A watch item is worth more than an A/B: an A/B can only return one of the options you thought of.* Previously: | rule 6 is two DOF and its anchor finger carries no information; DS3 would give it depth. ⛔ But a free orbit already solves depth. ⭐ Decided by watching the first assembly attempt: [`../00_CORE/queue_notes/3D1.md`](../00_CORE/queue_notes/3D1.md), cross-referenced from [`../00_CORE/queue_notes/IN4.md`](../00_CORE/queue_notes/IN4.md). ⚠ The catalog's depth-vs-pinch ambiguity **cannot occur here** — pinch requires nothing held, and §4 latches roles at press |
| §1.1 Z-targeting lock-on | **declined** | its core substitution (lateral input becomes tangential) is what rule 1 already does, and its framing anchor is what the barycentre already does |
| §2.1 Arcball as the default orbit | **moot** | 2bis is a gesture on an object, not a trackball. ⚠ But its path-dependence warning **does** apply to 2bis — `IN11` |

---

## ⚠ A correction to the catalog, recorded before it is relied on

**Catalog §2.1 merges two techniques and assigns one's flaw to both.** It lists Chen et
al.'s virtual sphere (1988) and Shoemake's ARCBALL (1992) under one entry and calls the
result path-dependent. The literature separates them: **the virtual sphere is
path-dependent; Shoemake's arcball is path-INdependent** — its rotation is a pure function
of the start and current projected points, which was the point of it. The paper that sorts
them out is Henriksen, Sporring & Hornbæk, *Virtual Trackballs Revisited*, IEEE TVCG 2004.

⛔ As written, the entry disqualifies as a default exactly the variant whose property an
assembly task wants. ⚠ **Verify against the paper before relying on either reading** — this
note is a flag, not a finding.

---

## ⭐⭐⭐ ROTATION INCREMENTS — registered 2026-09-22 (`D73`), at the moment of adoption

⚠ The owner asked for the check in those words: *"Check state-of-the-art which does not need
license."* ⛔ This is a register, not an opinion, and **nothing here is legal advice**; it is the
input `SEC4` reads instead of a codebase.

| the part | verdict | the citation, or the gap |
|---|---|---|
| **Snapping a rotation to fixed angular increments** | ✅ **PRIOR ART, and old** | Standard in every CAD and DCC package for decades — AutoCAD polar/snap angle, 3ds Max *Angle Snap Toggle*, and Blender's rotation snapping with the same presets this slider offers (1°/5°/15°/30°/45°/90°). Blender's own implementation is open and its increment work is public: [docs](https://docs.blender.org/manual/en/latest/editors/3dview/controls/snapping.html), [PR 118760](https://projects.blender.org/blender/blender/pulls/118760) |
| **The idea that a snap has a *strength* / a capture field** | ✅ **PRIOR ART** | Bier & Stone, *Snap-dragging* (SIGGRAPH 1986) and *Snap-dragging in three dimensions* (I3D 1990) — the gravity function. [ACM](https://dl.acm.org/doi/10.1145/91394.91446) |
| **Reducing the COST of a snap rather than its strength** | ✅ **PRIOR ART** | Baudisch, Cutrell, Hinckley & Eversole, *Snap-and-go: helping users align objects without the modality of traditional snapping*, CHI 2005. [PDF](https://cutrell.org/papers/CHI05-SnapAndGo.pdf) |
| **A detent as a mechanism that holds a position until deliberately left** | ✅ **PRIOR ART** | Mechanical, and far older than any of this. [Detent](https://en.wikipedia.org/wiki/Detent) |
| ⚠⚠ ~~Truncating to the increment when the INPUT SPEED falls below a threshold, with that threshold PROPORTIONAL TO the increment~~ | ✅ **RETIRED THE SAME DAY — the exposure is gone** | Searched 2026-09-22 across the snapping and snap-strength literature and the CAD/DCC documentation above. Angle snapping is everywhere and is applied **continuously** or at the commit of a transform; making it fire on *the finger slowing down*, and scaling that threshold with the detent, is a composition I could not find described. ⚠ **This is the entry `SEC4` must look at.** ⭐ Its exposure is reduced by the fact that the scaling is a **unit conversion, not an invention**: one increment of rotation IS a fixed amount of finger travel (`increment / gain`), so the threshold is §1.1's existing rest question asked in the detent's own units |

⭐⭐ **AND THE SEARCH'S NEGATIVE RESULT IS RECORDED ON PURPOSE.** `METHOD`: *a negative result
that cannot be re-run is an assertion, not a finding* — so the queries and the date are here, and
a later reviewer can re-run them rather than take this on trust. ⛔ Absence of a found
publication is not absence of prior art, and this note does not claim otherwise.

### ✅✅ **AND THE NOVEL COMPOSITE WAS DESIGNED OUT, hours after it was registered**

⛔⛔ The rule above never shipped. The owner rejected the behaviour it produced — *"the object
rotates then rotates back in the reverse direction"* — and the replacement does not have a speed
threshold at all: **the body's rotation is quantised at every instant**, so it advances a whole
increment when the demand crosses a boundary and otherwise holds. A weak input crosses nothing.

⭐⭐⭐ **THAT IS ORDINARY ANGLE SNAPPING, AND ORDINARY ANGLE SNAPPING IS DECADES OF PRIOR ART.**
Blender, 3ds Max and AutoCAD all quantise a rotation continuously while the transform is being
dragged; this is the same technique with the same presets, applied to a touch drag instead of a
mouse one. ⚠ The novelty that `SEC4` was going to have to weigh **is no longer in the product**,
and this entry is kept so the review can see that it was considered and removed rather than
overlooked.

⭐ `METHOD`: *retractions are kept on purpose.* ⚠ And the more useful lesson is that the
formulation a hand preferred turned out to be the one with **less** exposure, not more — the
novelty had been bought to solve a problem the fourth formulation simply does not have.


## ⭐⭐⭐ THE OBJECT AXES AND THE AXIS PROJECTION — registered 2026-09-22 (`D74`/`D75`)

⚠ Registered **at the moment of adoption**, per `CONSTRAINTS` §10, and before a hand has judged
any of it. ⛔ A register, not an opinion, and nothing here is legal advice.

| the part | verdict | the citation, or the gap |
|---|---|---|
| **Translating along a body's own axes rather than the screen plane** | ✅ **PRIOR ART, and universal** | Every CAD and DCC package: Blender's `G X/Y/Z` with *Global / Local / View* transform orientations, Maya's object-vs-world move handles, AutoCAD's UCS. Decades old. [Blender manual](https://docs.blender.org/manual/en/latest/scene_layout/object/editing/transform/control/orientations.html) |
| **Projecting a pointer delta onto an axis's SCREEN projection to drive motion along it** | ✅ **PRIOR ART** | This is how an axis-constrained drag has always been mapped in a 2D-input 3D editor; Blender's `transform` module does exactly this, and its source is public (GPL — read, never copied). ⭐ Ours is written from the geometry, as the three-ring orbit was |
| **A 3-axis gizmo drawn at a point on the body** | ✅ **PRIOR ART** | The transform manipulator, conventional since the 1990s; Conner et al., *Three-dimensional widgets*, I3D 1992. [ACM](https://dl.acm.org/doi/10.1145/147156.147199) |
| **Freezing the reference frame at scene boot (`WorldAxisB`)** | ✅ **PRIOR ART** | A world/global transform orientation is the DEFAULT in every package above. ⚠ What is unusual here is only that the "world" is defined by the boot camera rather than by the scene's axes — a choice of basis, not a technique |
| ⚠ **Choosing the axis basis from the face the body is ADVANCING ON, and swapping it on entering a proximity zone** | ⚠ **INTERNAL COMPOSITION, and the entry a review should look at** | Searched 2026-09-22 across the transform-orientation and snapping literature. Face-normal orientations exist (Blender's *Normal* orientation, snapping to face normals since 2.8) and proximity-triggered docking aids exist (`D46`'s own anchors); **a basis that switches automatically at a capture threshold, built from the exit face of a motion ray**, is a composition I could not find described. ⛔ Its parts are each prior art; the assembly is ours |

⭐⭐ **THE NEGATIVE RESULT IS RECORDED WITH ITS DATE ON PURPOSE** — `METHOD`: *a negative result
that cannot be re-run is an assertion, not a finding*. ⚠ Absence of a found publication is not
absence of prior art. ⭐ Note also what this change **removed** from the exposure surface: the
rejected Blender-exact normalisation would have needed a cutoff rule of our own, and the chosen
form has none.

