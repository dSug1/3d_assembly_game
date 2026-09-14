# `IN9` — the camera-only rules: 4 (pinch zoom) and 1 (orbit)

> **Dossier.** Full history of this row. Its one-line status is in
> [`../QUEUE.md`](../QUEUE.md) — update **both** when it changes.
>
> **STATUS** · ✅ **rule 4 CLOSED 2026-09-14**; ⚠ **rule 1 BUILT + GREEN, NOT
> CLOSED** — no device look yet · **SUB** · IN · **KIND** · feature

Design of record: [`../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](../../10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md) §2 rules 1 and 4.
⭐ **Neither rule touches an object**, so this row does **not** wait on `3D1` — which
is what makes it buildable now, and it is the owner's reason for scheduling it here.

## ⛔⛔ RULE 1 IS AMENDED BY THE OWNER: DELTA POSITION, NOT DEVICE TILT

§2 rule 1 as written orbits *"by the value of yaw and pitch of the **device tilt**"*,
and states explicitly that *"the touch delta gates this rule but its value is unused:
**touch acts as a clutch for tilt-orbit**."*

⭐ **The owner changed this deliberately, 2026-09-14**: the orbit is driven by the
**delta position** of one touchpoint that hits no object. A drag, not a tilt.

⚠ Consequences, recorded so they are not rediscovered:

* `DeviceOrientation` leaves the critical path for rule 1 — no iOS permission prompt,
  no platform axis conventions, no gimbal behaviour near vertical. That removes the
  single largest unknown in this row.
* `tiltDeadband` becomes **unused by rule 1**. ⛔ Wire it to something or delete it —
  an unused tunable is a lie in the config, exactly as `moveExitDistance` was through
  the whole of `IN0`, where `IN5` would have gone and measured a number that did
  nothing.
* The barycentre selection (§2 rule 1's *"smallest perpendicular distance to the
  touchpoint's ray"*, capped by `maxBarycenterCandidates`) is **unaffected** and still
  applies: it chooses what the camera orbits *around*.

## ⭐ Three orbit radii — the owner's request, and the licence question it raised

The owner asked for three serialised floats so the **top / middle / bottom** orbit
circles can be fine-tuned later, and asked whether that is patented by Unity's
Cinemachine.

✅ **No patent found** on the three-rig orbit. It is a generic parametric idea — orbit
radius as a function of elevation — and no patent claim surfaced.
⛔⛔ **BUT CINEMACHINE'S CODE IS UNDER THE UNITY COMPANION LICENSE**, which permits use
only in applications *dependent on a valid Unity engine licence*. This project is on
Babylon, so **porting or copying that source would breach `N13`** (no
non-commercially-licensed dependency may enter the build; this game will be
commercialised).
⭐ **Writing our own from the geometric idea is clear**, and is what will be done.
⚠ The risk here was never a patent — it was the **code licence**, and it is avoided by
not touching the code.

## 2026-09-14 — rule 4 (pinch zoom) built. 146 → 161 golden vectors

✅ `src/input/pinch.ts`, `tests/pinch.test.ts`, and the two-touchpoint plumbing in
`src/render/scene.ts` that rule 1 will also need.

⭐⭐ **THE MAPPING IS A RATIO OF SEPARATIONS, NOT A RATE — that is the whole design.**
`IN1`'s most expensive recurring defect was estimating a rate over the shortest
available baseline (flick lift speed, roll direction, roll curvature), and every fix
for it cost lag. A pinch needs none of that: the separation between two touchpoints is
an **absolute** distance tens of millimetres wide, three orders of magnitude above
pointer noise, and needs no differentiation at all. ⭐ Measured: ±0.5 px of noise moves
the zoom by **under 2%**, with no filter and no baseline anywhere.

⭐ **Scale-free**, because it is a ratio: a doubling is a doubling whether the hand is
small on a phone or wide on a tablet. The gain is an **exponent**, not a multiplier —
a multiplier would be dimensionally wrong applied to a ratio.

⭐ **Taken from the gesture's start, never accumulated per frame**, so a pinch out and
back returns *exactly* where it began — vectored to 12 decimal places. `IN1`'s roll had
precisely the opposite defect: 200° out and 200° back finished 180° away.

⛔ **The deadband RE-ANCHORS when crossed.** Without it the first live frame scales by
the whole deadband at once — a visible snap starting every gesture. That is the defect
shape `IN1` hit three times (the stale reference, the creeping baseline, the moving
centre): **a change is only meaningful when measured from something current.**

### ⛔⛔ The clamp is the black-page guard, not a nicety

The scene is in **metres** and Babylon's near plane is a **per-camera** property.
`render/scene.ts` sets `minZ` to 0.01 m only because the default of 1 put this whole
scene inside the near plane and rendered **a black page with no error anywhere** —
this project's most expensive failure to date. A zoom able to drive the radius below
the near plane recreates it silently.

✅ `clampCameraRadiusM`, plus a **config validator that refuses a zoom range coming
within 10× the near plane**. ⭐ `CAMERA_NEAR_PLANE_M` is exported from
`gestureConfig.ts` and *read* by `scene.ts`, so the number exists in one place: the
validator needs it, and the camera is the only thing that can apply it.

## ✅ 2026-09-14 — RULE 4 CLOSED. Device look passed, all five checks

Owner: *"Five checks ok."* ⭐ That is what closes a change here; a green suite never is.

| check | verdict |
|---|---|
| 1. fingers apart bring the camera CLOSER | ✅ |
| 2. no snap as the zoom starts (the deadband re-anchor) | ✅ |
| 3. out and back returns to the same zoom | ✅ |
| 4. nothing clips at full zoom-in (the black-page guard) | ✅ |
| 5. the browser's own pinch-zoom stays suppressed | ✅ |

⭐ **Check 5 was the one to worry about and it held.** `index.html`'s
`user-scalable=no` + `touch-action: none` had been in place since day one but had
**never been exercised by two fingers on glass** — an untested claim, now tested.
⭐ **Check 1 passing first time is worth noting**: `IN1` shipped yaw AND pitch
inverted, because an internally consistent sign was never checked against the
gesture. Writing the vector as *"the direction a hand expects"* rather than as the
sign of an internal number is what caught it here before the device did.

⚠ **Still placeholders**: `pinchDeadband`, `gainZoom`, and both radius bounds.
`IN5` measures them, and can now do it by finger — `?pinchDeadband=1&gainZoom=1.5`.

## ⚠ What rule 4 did NOT close, as written before the device look


⛔⛔ **No device look yet.** Green suites are necessary and not sufficient — `IN1`
found 14 defects by finger that no suite could see. What must be checked:

1. **Direction.** Fingers apart must bring the camera CLOSER. ⚠ `IN1` shipped yaw and
   pitch *inverted* because the internal sign was self-consistent and nobody checked
   it against the gesture.
2. **No snap at the start** of a pinch — the deadband re-anchor.
3. **Out and back** returns to the same zoom.
4. **Nothing clips** at full zoom-in — the black-page guard.
5. ⚠ **The browser's own pinch-zoom stays suppressed.** `index.html` carries
   `user-scalable=no` and `touch-action: none` for exactly this, and it has **never
   been tested with two fingers on glass**.

⚠ `pinchDeadband`, `gainZoom` and both radius bounds are placeholders, like every
other number here. ⭐ They can now be A/B'd by finger without a rebuild:
`?pinchDeadband=1&gainZoom=1.5`.

---

## 2026-09-14 — rule 1 (orbit) built. 161 → 185 golden vectors

✅ `src/input/orbit.ts` (the three-ring surface), `src/input/barycentre.ts` (what the
camera orbits around), and the scene wiring. ⛔ **No device look yet.**

### ⭐⭐ The orbit STOPS SHORT by construction, not by a guard

Owner: *"should stop short: we should define height and radius of top and bottom rigs
and not exceed these."*

Three rings — **TOP / MIDDLE / BOTTOM** — each with a **radius** and a **height** about
the orbit centre. Elevation is a parameter `v ∈ [0,1]`, and **`v` is clamped**, so the
camera rides a surface it cannot leave.

⭐ **There is no pole to gimbal at, because the poles are not reachable.** That is the
real prize of stopping short: the classic orbit-camera failure — flipping or spinning
as it passes overhead — cannot occur, rather than being patched where it occurs.

⭐ **The surface passes through all three rings**, via a quadratic in closed form:
`f(v) = a(2v−1)(v−1) + b·4v(1−v) + c·v(2v−1)`.
⚠ **A Bézier would have been the wrong choice** and it is the obvious one: a Bézier
control point is **not on its curve**, so the middle ring would be a *bias* rather than
a ring the camera visits. The owner asked for three rings to tune, not two and a hint.
⭐ Closed form, not a search — a numeric solve introduces a step size, and a step size
is a threshold nobody measured. Same reasoning as `bestTwist` and the circle fit.

⭐ **Zoom scales the whole surface, radius and height together**, so rule 4 and rule 1
**compose instead of fighting over one radius**. Pinch no longer sets `camera.radius`;
it sets a shared `zoom` scalar, and the viewing angle is unchanged by zooming.

⛔ **The near-plane clamp may only SHORTEN the offset, never reshape it.** Clamping the
components independently would change the viewing *angle*, which is not what a
near-plane guard is for.

### ⭐ The barycentre — and the spec's clarification is the load-bearing part

*"with no hit there is no intersection point, so 'closest to the raycast' is
undefined"*, so the distance is to the **RAY**. Implemented with the cases that matter:

* **Fewer than two objects has no barycentre** — the scene centre is substituted,
  rather than a point being fabricated.
* **`2^N − N − 1` is every subset of size ≥ 2** — 1 at N=2, 11 at N=4, 502 at N=10, and
  it does not stop. ⛔ The cap is not tidiness: this runs every frame of a drag.
  ⭐ Subsets are generated **smallest first**, so when the cap bites it keeps the
  **pairs** — what a user is most likely to mean — not an arbitrary slice.
* **A point behind the ray is measured from the ray's ORIGIN**, so a barycentre behind
  the camera cannot win by sitting close to a line running backwards out of the screen.
* **A zero-length direction returns a real number, not `NaN`** — a `NaN` would silently
  *win* every comparison it took part in.
* ⭐ **Ties resolve deterministically**, so the orbit centre cannot flicker between two
  equally-good candidates on successive frames of one drag.

⚠ The centre is chosen **at press**, from the ray of the finger that started the drag,
so it cannot wander mid-gesture as the ray moves.
⚠ **Viewport culling is the caller's job** — it needs the projection, so `scene.ts`
offers only visible meshes. `input/` stays engine-free.

### ⚠ `tiltDeadband` is now orphaned

Rule 1 no longer reads device tilt, so nothing uses it. ⛔ **Wire it or delete it** —
an unused tunable is a lie in the config, exactly as `moveExitDistance` was through the
whole of `IN0`, where `IN5` would have measured a number that did nothing. Left in
place for now because rule 1's device look may yet want a tilt contribution; if it does
not, it goes.

### ⚠ What rule 1 does NOT close — the device checks

1. **Direction.** Drag right/left must yaw the way a hand expects; drag up must raise
   the camera. ⛔ `IN1` shipped yaw AND pitch inverted because the internal sign was
   self-consistent.
2. **The limits.** Drag hard past the top and bottom — the camera must stop, and must
   move again *immediately* on the first drag back, not after paying off a debt.
3. **Composition with zoom.** Pinch, then orbit, then pinch again: the viewing angle
   must survive zooming and the two must not fight.
4. **The orbit centre** should be what you expect with two cubes on screen.
5. **Gains** — `?gainOrbitYaw=0.03&gainOrbitElevation=0.02` to try faster.
