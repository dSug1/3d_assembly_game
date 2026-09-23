# 3d_assembly_game — start here

A touchscreen 3D game in which objects are picked up, oriented and **assembled** by
joining **mate connectors**.

⭐⭐⭐ **THE DOCUMENTATION ENTRY POINT IS [`Claude/README.md`](Claude/README.md), and
it is a ROUTER.** It carries load recipes — which folder to read for which kind of
work — so a session does not pull the whole tree. Read it before anything else.

⭐ **New to the project? Read [`Claude/00_CORE/LESSONS_CARRIED.md`](Claude/00_CORE/LESSONS_CARRIED.md).**
It is the distilled experience of the predecessor project (`vision_pipeline_python`,
nine months, abandoned at its input layer 2026-09-13) and it will save you a week.

---

## The five rules that bind every change

1. ⛔ **`src/core` and `src/input` import no engine.** Enforced by
   `tests/boundary.test.ts`, not by prose. The predecessor made the same claim in a
   document and it silently became false.
2. ⛔ **Golden vectors land with the code**, in the same change — and a new vector
   must be shown to **FAIL against the old code** before it is trusted.
3. ⛔ **Thresholds are millimetres on the physical screen, never pixels**
   (`src/core/units.ts`). One constant lives in exactly one place.
4. ⛔ **A mate is ANTI-PARALLEL, and breaking reads the RESIDUAL, never the observed
   gap** — the gap is zero by construction. See `Claude/30_OBJECTS_3D/INDEX.md`.
5. ⛔ **A look on a REAL DEVICE closes a change. Nothing else does.** Green suites
   are necessary and not sufficient, and touch cannot be tested with a mouse.

⛔ **The build queue is `Claude/00_CORE/QUEUE.md` and nowhere else.** Never start a
second list. A row's status changes in the queue **and** its `queue_notes/<ID>.md`
dossier, or neither.

⚠ **Preserve the tiered doc architecture** (`Claude/README.md`, bottom): state in
`INDEX.md`, narrative in `history/`, never append to a front door, never edit inside
`VERBATIM` markers.

## Commands

```bash
npm run verify      # ⭐ typecheck + golden vectors. The gate before any commit
npm run dev:usb     # dev server on 127.0.0.1 for USB port forwarding
npm run dev:lan     # dev server on the LAN (⚠ read 50_BUILD_DEPLOY first)
npm run build       # production bundle into dist/
```

## Where it stands (2026-09-22)

✅ Green: TypeScript + Babylon + Vite, **1097 golden vectors passing** — ⚠ MEASURED 2026-09-23; the
count's one home is [`Claude/00_CORE/QUEUE.md`](Claude/00_CORE/QUEUE.md), and **974** then **978**
both went stale standing here. (974 + 43 for `D71`–`D73`, the frustum and the increments; 861 + 113 — ⭐ the
2026-09-19 pass: `D55`–`D62`, the tablet MIRROR and the **approach-swing trial**; before that
773 + 83 for `D49`'s surface gap and its shell, 656 + 117 for the ⭐⭐ **2026-09-17 AUDIT**, the
first pass to find defects by READING the source rather than by a finger, and 619 − 51 when forks
A and B were deleted with their vectors).
⛔⛔⛔ **THE 2026-09-19 PASS ENDED WITH SEVEN DEVICE REPORTS AND ONE REPEATING CAUSE** — read
[`Claude/10_INPUT_TOUCH/spec/APPROACH_SWING_TRIAL.md`](Claude/10_INPUT_TOUCH/spec/APPROACH_SWING_TRIAL.md)
before touching the swing. ⭐⭐ The cause is one sentence: **a rule written in `scene.ts` is a rule
nothing can interrogate**, and it cost seven separate mutants that survived the whole suite — a
TDZ crash at boot, a swing computed every frame and never applied, a Pioneer capture lookup that
reinstated a reported bug, a freeze and a re-base, an absorb, and two selector guards. ⚠ Each was
found by a HAND or by a screenshot, never by the 974. ⭐ **Write the decision in `src/input/`; let
`scene.ts` hold only the state and the call.**
⚠⚠ **AND TWO OF MY OWN INSTRUMENTS LIED THIS DAY** — a synthesised drag with CDP round-trips
between moves is not a regular drag, and a filter's ripple measured over the whole series reads
its TRANSIENT (8.9%) instead of its ripple (1.1%). ⛔ Both nearly set a tunable wrong. *A settling
filter has to be allowed to settle before it is judged.*
⛔⛔⛔ **READ [`Claude/00_CORE/queue_notes/AUDIT_2026-09-17.md`](Claude/00_CORE/queue_notes/AUDIT_2026-09-17.md)
BEFORE TOUCHING THE ALIGNMENT LAYER, §1.1, THE CONSTRAINT STACK, THE URL OVERRIDES OR THE TREE
OPERATIONS.** ⭐ Its largest single finding is **ten vectors that could not fail** — among them
the cascade's composition ORDER, `towardGravity`'s sign, `bestTwist` (a sign flip AND
`return IDENTITY` both survived) and `worldPose`'s tangent, which nothing caught. ⚠ One shape
runs through all of them: *a fixture chosen because it is easy to reason about is usually chosen
from the set where the quantity under test is ZERO.*
⛔ **What it did NOT fix, deliberately**: "millimetres" are CSS-reference mm and **not physical**
(so rule 3 is not what is being computed — it needs an owner calibration, and numbers tuned on
one device will not transfer to another density); the roll's direction flips at full rate across
square to the alignment axis (feel, a hand decides); and the `4L` capture radius is
centre-to-centre, so at boot the base plate is **312.4 mm** from two parts against a 320 mm
radius — the scene's claim that *"at 5L nothing is in range"* was false.
⛔⛔ **A DEVICE LOOK IS OWED ON THE WHOLE PASS.** Rule 5 is not suspended because the findings
came from a read: the boot mode, the twist and roll channels, the deadband's emission and the
render order all changed.
✅ Deployed and live: **https://dsug1.github.io/3d_assembly_game/**

⛔⛔⛔ **THE OBJECT AXES CAME BACK FROM THE GLASS WITH THREE REPORTS, AND ALL THREE WERE ONE
ARITHMETIC** (`D76`, 2026-09-23): the mapping multiplied each input **by** its axis's screen
foreshortening — *"the input seems very weak"*, *"the input axis and movements axis seem inverted"*,
*"the holder's dy is dead at a level camera"*. ⭐⭐ **BLENDER ANSWERS ALL THREE AND SAYS *NO* TO THE
PAIRING**: it never binds screen-x to a world axis — a free move follows the mouse in the view plane,
a constrained one maps the WHOLE delta onto the axis the USER chose and still **tracks** it, with no
cosine loss. ✅ Now the finger's delta is **solved onto both horizontal axes** so the body follows it
exactly (`translatePairing=1`; `0` is the dictated channels, also tracking now), all three channels
share one gain, and **Blender's own 5° cone** hands the edge-on case to `depthTranslate`'s judged
fixed rate instead of letting it die. ⚠⚠ **AND THE SOLVE MAKES `D74`'s IN-ZONE BASIS INERT** — an
orthogonalised face basis spans the same horizontal plane, so nothing changes at the zone edge.
⛔ **That is an owner decision**, and the choices are in
[`Claude/00_CORE/queue_notes/IN4.md`](Claude/00_CORE/queue_notes/IN4.md).
⛔⛔⛔ **AND THE ZONE'S APPROACH AXIS WAS ON THE WRONG CHANNEL** (defect 59, 2026-09-23): the dictation reads *"LeadingFace normal direction, gravity direction and direction orthogonal"* — three directions in the order `(x, gravity, depth)`, so **x is the normal**, and I had built the reverse. ⭐⭐⭐ **IT WAS UNOBSERVABLE UNTIL THE `dy` SWAP**: while the holder owned `{x, depth}`, the whole horizontal plane, the 2×2 solve mixed the two axes and nothing could tell the assignments apart — the swap split the plane, `x` became the only horizontal channel, and it was the one that approaches nothing. ⛔ A one-finger drag in the zone could not close the gap: *"the translation is blocked"*. ⭐⭐ `METHOD`: *a rule that COMPOSES two things cannot see a mistake about WHICH of them is which* — which is the whole answer to *"why has a simple swap created so many issues"*. It created almost none; it **separated** two axes that had been travelling together. ⚠ Two more came out of the same audit: the gizmo hid itself whenever the second finger drove (defect 60 — `"DEPTH"` is a translation, the THIRD time, now a set in `src/input/grip_mode.ts`), and ⛔⛔ **the HUD's `build` line LIES on the USB loop** (defect 61): it is stamped once when the dev server starts, so it names a commit the running code is not — it now reads **`dev-server`**, and a build keeps its sha.
⛔⛔⛔ **AND THE SOLVE CAME BACK WITH A CLIFF** (defect 56, 2026-09-23): *"blocking at white highlight and erratic movement"* are **two sides of one number** — the solve's rate is `1/|det|`, so at the adopted 5° cone the body ran **11.5× the finger** just outside it and **≈0** just inside, and the white contour is where `D74` **switches the basis**, which is where that boundary is crossed. ⭐⭐ The degenerate branch no longer answers *inside* the plane — and its FIRST answer, tracking the finger by spending the travel on **depth**, was retracted the same day (defect 58, *"back and forth with dx translates in depth"*): ⭐⭐⭐ **an input keeps its dictated axis**, tracking where the axis is presented well enough and a fixed rate where it is not, because the owner's report 3 had already said a channel pointing at the camera should *"translate the object towards or away from the camera"*. ⚠ Cost, stated: in that pose the body no longer stays under the finger. ⛔ And defect 57 came out of the same look — *"the second touch is losing its input"*, a channel **square to its own input** returning exactly zero with a full-length shadow and every guard green: *guard the quantity that is actually DIVIDED, not the one that is easy to name.* ⭐ The cone is **5° → 20°** and is now read as a **leverage bound** (`1/sin`, 2.9×) — ⛔⛔ 5° was *Blender's* number and carried Blender's QUESTION with it: theirs guards a division from `NaN`, this one guards a hand. ⚠⚠ **And I had ASSERTED the conditioning instead of measuring it** — *"a vertical plane faces the camera at every ordinary pose"* is false once `worldAxisB` freezes the axes at boot. *A claim about conditioning is a measurement.*

⭐⭐ **AND TWO REFINEMENTS ABOUT THE FROZEN PLATE** (`D77`, 2026-09-23), both enforced at a DEFINITION rather than by a guard at the point of use: **no gizmo on a frozen body** — `leadingFace` refuses one, because *the face a body is advancing on* presumes it advances — and **a second touch on a frozen body is handed to the router as a MISS**, so that finger becomes a working `OUTSIDE` touchpoint and can drive another body. ⛔ The FIRST touch is untouched: `D67` makes *hold the plate FIRST* the way to align a part to it.

⛔⛔ **THE OBJECT AXES THEMSELVES** (`D74`/`D75`, 2026-09-22).
A body is translated along **its own axes**: fixed at scene boot from the boot camera and frozen for
the scene (`worldAxisB=1`, **the default, the owner's choice**), or following the live camera at `0`
— and **inside the capture zone** the basis becomes the **LeadingFace normal, gravity and their
orthogonal** instead, re-decided on the zone's **EDGE**. ⛔ The channels moved with it: the holder's
`dx`→**x**, its `dy`→**depth**, the second touchpoint's `dy`→**gravity**. So **one finger slides a
body about its own horizontal plane and a second finger lifts it.** ⭐⭐ Each input is projected onto
its axis's screen shadow and **NOT normalised** (the owner's choice over Blender's division), so a
foreshortened axis **goes quiet** instead of running away and the rule needs no cutoff — ⭐ and the
sign `depthTranslate` needed `awaySign` for **falls out of the projection** instead of being asserted.
⚠⚠ Costs, stated: the holder's `dy` is **dead at a level camera**; `gainTranslateScreen` was tuned for
a screen-plane drag and is unjudged for two horizontal channels; `screenTranslation` and
`depthTranslate` are **unwired debt**; and this **reopens `IN4`'s rule 6, a row closed by a hand**.
⭐ A **LeadingFace** — the exit face along the direction the body ACTUALLY goes — carries a 3-axis
gizmo. ⛔ `cameraOffsetZoneEnterSetupB` gates a method **the owner has not defined yet**: it ships at
`0` and the hook is empty. 32 vectors, three mutants caught, engine-free in `core/leading_face.ts`,
`input/object_axes.ts` and `input/axis_translate.ts` →
[`Claude/00_CORE/queue_notes/IN4.md`](Claude/00_CORE/queue_notes/IN4.md).

⭐⭐⭐ **THE INPUT MODEL IS THE OWNER'S TAP-TO-ALIGN SET** (`D37`–`D40`) — and since
2026-09-17 it is the **only** one: forks A and B are **deleted**, with the flag, the slider
and 41 vectors. Hold an object, **TAP a face on another**, and the held one makes the minimal
turn that points its own face **AT** the tapped one (**anti-parallel** since `D78`, 2026-09-23 —
it reverses `D37`'s parallel *align* sense, and both texts stand). One alignment at a time, replaced by the next; the Follower face is **filled** and
the Pioneer face **outlined** until it breaks; a **shake** or a **second tap on that same
face** breaks it; a **flick** resets the rotation.
⛔⛔ **THE SESSION BOOTS IN `TRANSLATE` — `D71`, 2026-09-22**: *"Set the default to translation
mode at scene boot."* ⚠⚠ It REVERSES the twice-confirmed `ROTATE` start, and both are kept.
⛔⛔ **DO NOT READ IT AS THE 2026-09-17 DEFECT RETURNING.** That defect was a DISAGREEMENT:
`initialBehaviour()` returned `TRANSLATE` while this file, the spec and the call site all said
`ROTATE`, and `git log -S` found no commit that ever returned it — the owner's decision never
reached the code, and the vector asserted the value the function RETURNED rather than the
decision made. ⭐ `METHOD`: *a vector written from the code it tests cannot contradict that
code.* ⭐⭐ **The tell is not the VALUE but whether any human sentence still asks for the other
mode.** None does, and the vector now quotes the instruction.
⭐⭐ **THERE ARE NO FLAGS LEFT.** What a turned **Pioneer** costs the Follower was a flag for
four hours (`D41`) and is now a **GESTURE** (`D42`): a **single tap** makes a `SNAPSHOT` —
turning the Pioneer releases the alignment, the Follower does not move — and a **double tap**
makes a `FOLLOW`, where the Follower takes the Pioneer's rotation and keeps the alignment.
⛔ The **colours** report which: cyan + amber for a snapshot, **both amber** for a
relationship. ⭐ Each gesture is its own toggle, so nothing has to be remembered.
⚠ The case had no rule at all until 2026-09-17, and its absence was invisible — a frozen
world direction stays frozen while the face it came from turns away.
⭐⭐ **THE CAP IS WHY THERE IS NO DEAD END**: one alignment leaves the spin about its normal
free, and a second one cannot be stacked — so zero-DOF, which froze an object in fork B, is
now unreachable **by construction** rather than by a guard.
✅✅ **CLOSED BY A DEVICE LOOK, 2026-09-17** — *"device pass ok, except these modifications"*,
and all five are built (`D43`–`D45`, defects 47–48). ⚠ The corrections themselves have not
been re-judged, except the slerp's speed. ⛔ **NOW ON `1.0.22-`**, and the game still
cannot assemble anything: the alignment now has a **mate's ORIENTATION** (`D78`) but nothing is
seated and nothing pushes a `MATE`. ✅ **BUILT SO FAR — the HIGHLIGHTS ONLY** (`A16`/`A17`,
[`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`](Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md)
§12–§17): white contours on a near pair while it is being TRANSLATED, every aligned body keeping
its FollowerFace and a coloured body outline, a shake on a Pioneer releasing ALL its followers
via a two-way index, a turned Pioneer releasing its cyan followers and rotating its orange ones
**down a chain**, **no cycles**, and a **`frozen`** attribute (enforced at `object_model.ts`'s
two writers) carried by a new base plate. ⛔ The approach, hold-off, snap, mate and break are
**not built**.
⭐ The scene is now a workbench: three parts `5L` apart at seeded random
orientations (`?sceneSeed=N`), a frozen `6L × 0.3L × 9L` plate `3L` below.
⭐⭐ **AND THE RIGHT-HAND BODY IS NO LONGER A BOX** (`D72`, 2026-09-22): `objectB` is a
**trapezoidal pyramid**, `1.5L × 2L × 3L` with its top tapered to half its base — built by
MOVING a Babylon box's vertices (`src/core/frustum.ts`), so the builder's winding survives.
⭐ Everything downstream inherited it for free, because `D49`/`D50` had already made the
collision hull and the logical faces **mesh-derived**: the first non-box body is what proves
those two paid. ⛔⛔ Three consequences worth knowing: the boot clearance between the two parts
moved **320 → 300 mm** (and the fixtures followed the product, which is the point); the boot
Pioneer/Follower pair now aligns on the flat **±y** faces, because a frustum has no exact `+x`
face and the old lookup demanded one; and it is the **first body that can reach GJK's deep
branches**, which `QUEUE.md` records as unreached because every earlier shape was a box.
✅✅ **AND THE CAPTURE IS A SURFACE GAP** (`D49`, 2026-09-18, the owner): white is decided by the
distance between the bodies' **surfaces**, from a convex shape **COMPUTED AT SPAWN**
(`src/core/collision_shape.ts`, a GJK distance) — which is the owner's preferred answer to
*compute it or author a phantom in Blender*, and also the better one: nothing there reads a
normal, so **inverted normals cannot affect it**, glTF has no quads, and a phantom would be a
second source of truth for one fact. ⛔⛔ **Only the DISTANCE moved to surfaces — the approach
DIRECTION must not**, because a face-to-face direction collapses to noise at contact, which is
the whole reason `D46` exists. ⭐⭐ The threshold is **millimetres on the glass**, scaled by
camera distance through rule 6's own tracking factor — so it shrinks as the camera comes in and
keeps a constant APPARENT size, never authored in pixels — and it has a **slider**.
⭐⭐ **AND THE WHITE CONTOUR *IS* THE SHELL** (2026-09-18): the body inflated by **half** the
offset, recomputed every frame — so it moves with the camera and with the slider, and **two white
boxes touching means the pair captures**. ⭐⭐ **A SECOND WHITE** marks the mesh's own **edges**
(Babylon's edge renderer, so it follows real imported geometry rather than a bounding box — ⚠ and
it needs `checkVerticesInsteadOfIndices`, because a box has **24 vertices not 8** and the default
index-based adjacency test drops every corner; **every exported mesh splits vertices too**), and
the three outlines NEST so an aligned body shows all of them: white edges → cyan/amber box → white
shell. ⛔⛔ **AND THE SHAPE IS NOW READ OFF THE MESH** — it was a `Map<name, dims>` keyed by the
four boot bodies, so an **imported** body would have been given a part's dimensions silently;
every outline reads the shape too, including **its centre**, which matters the first time an
export's origin is not at its middle. ⚠ A body whose geometry cannot be read is named on the HUD
(`⛔NOSHAPE`), never given a stand-in. ⛔ Half, not the full offset, or the eye would see them
meet at twice the threshold. ⚠ It was scaled once at adoption before, which is why it changed
with neither.
⚠ `snapRadiusFactor` is deleted: `4L` answered *how far apart may two CENTRES be*, a different
question. ⭐ It also fixes the audit's finding 3, where the plate read **312 mm** by centres
while a part RESTING on it read **228 mm** — an inversion no radius value could repair.
⛔⛔ **AND THE LESSON IS ABOUT THE VECTORS, NOT THE GEOMETRY**: the first 24 were all BOXES, and
the Minkowski difference of two boxes is a box — so GJK converged in ONE step and **three deep
branches were unreached by the whole suite**, each deletable with everything still green.
⭐ Found by running mutants and then **instrumenting the code to report which branch it took**
rather than reasoning about it. *A green suite over the shape the product happens to use today
is not coverage of the algorithm underneath it.*
⛔⛔ **THE EARLIER `TargetPosition` + gizmo + orbit design is SUPERSEDED** — its
finger-to-face-point direction collapses to noise exactly at contact; centre-to-centre cannot.
⚠⚠ **AND THREE LESSONS FROM THIS DAY BIND EVERY ROW STILL TO COME**, each from a device report
no test here could have produced. ⭐ *A fix that lands beside the defect instead of on it leaves
a green suite and a broken product* — I wrote a corrected `faceMarkerExtent`, vectored it, and
left the buggy copy wired. ⭐ *When two readings fit one device report, name both* — I read
*"contours cannot appear if objects are not aligned"* as *require the alignment*, recorded it as
`D48`, and the owner removed it hours later. ⭐⭐ *A second symptom that contradicts your theory
is worth more than a third that confirms it* — a stale highlight produced TWO false reports
(*"the release is not working"*, *"the shake is not working"*) while the rule they accused was
correct and twice-vectored; the shake report is what inverted the diagnosis, and the cause was
using the correct retire-by-membership pattern for one marker pool and the wrong one for
another, in the same edit.
✅✅ **ROTATION INCREMENTS ARE JUDGED AND ACCEPTED** (`D73`, 2026-09-22) — *"the rotation
increments are judged and this is ok"*, which is rule 5 and the only thing that closes a change
here. `rotationIncrementDeg` (0–45, step 5) **ships at 0**, and above zero **the body is always
ON an increment**. It advances a whole increment when the drag crosses a boundary and otherwise holds,
so a weak input simply stops it — there is nothing to correct and nothing to reverse.
⛔⛔ **FOUR FORMULATIONS, THREE REJECTED BY A HAND, AND THE REASONS BIND ANY FIFTH**: quantising
the turn *as it happened* QUEUED the steps and lagged the finger (*"too much lag in the rotation
vs. the finger movement"*); rounding at the RELEASE carried the body FORWARD of where the finger
went; truncating back when the finger RESTED made it *"rotate back in the reverse direction"*.
⭐⭐ All three let the body reach a pose it was not allowed to hold and then argued about the way
back — the fourth never leaves the increment, and **jumps several at once** when a fast drag
crosses several, so a backlog is unrepresentable. ⚠ The cost, inherent and not tunable: the body
advances in visible steps rather than tracking the finger — ✅ judged and accepted
→ `src/input/rotation_increment.ts`. ⚠ **What the look did NOT report on is `dy` no longer
twisting** (defect 49's cost) and which increment should be the DEFAULT, the build still
shipping the trial at **0**.
✅ It also DELETED a novel composite: the speed-threshold version needed one, this does not, so
ordinary angle snapping (Blender/3ds Max/AutoCAD, decades old) is the whole of its prior art.
⛔⛔ **AND THE STEP IS AN EXPONENTIAL APPROACH, NOT A TIMED ARC** (defect 50, 2026-09-22):
*"when I set increment to 45 degree and I rotate by one increment, the sway of other objects
is bigger than if I move by two or more increments. why?"* ⭐⭐ The sway was RIGHT — an
`easeInOut` has zero velocity at both ends and every newly crossed increment restarted it at
`t = 0`, so crossing several detents relaunched the body from a standstill and it never
reached the fast middle. ✅ `slerp(pose, target, 1 − exp(−dt/τ))` has no clock to restart, so
retargeting is free and a farther target is covered proportionally faster.
⛔⛔⛔ **AND DEFECT 49 CAME OUT OF THE SAME PASS**: *"the dx delta position and the yaw rotation
direction are inverted"*. ⭐⭐ **The report named the wrong rule** — the free yaw was swept over
408 camera positions and inverted at NONE; the **twist on an aligned body** inverted at **12 of
24** alignment orientations. ⛔ The cause was the near-side projection `D57` had already deleted
from the second touchpoint and not from the first: *when a rule has two channels, the correction
belongs to the RULE*. ⚠⚠ **Cost, unjudged**: `dy` no longer twists.
⭐ Rules, the conflict check against every earlier rule, the decisions and ⭐⭐ **an ordered
list of what to test next, with what would falsify each** → [`Claude/10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`](Claude/10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md) §9–§10.
⛔⛔ **AND CHECK THE HUD'S `build` LINE BEFORE JUDGING ANY GESTURE ON A DEVICE.** On
2026-09-16 a confirmed fix was reported broken from Pages on a tablet running an **old
bundle**: `index.html` is served `max-age=600` and the assets are content-hashed, so a
cached index loads a superseded hash indefinitely. ✅ The page now checks `version.json`
on boot and replaces itself once (`src/core/build_gate.ts`), and prints its build id.
⭐ `METHOD`: *a device report is evidence about the code the device was running* — the
report was truthful, and the unchecked premise was that both surfaces ran the same code.
✅ **The fast device loop works**: `npm run dev:usb` + `adb reverse tcp:5173 tcp:5173`,
then `http://localhost:5173` on the tablet. See
`Claude/50_BUILD_DEPLOY/DEVICE_TESTING_USB.md`.

✅✅ **`IN1` CLOSED** — the gesture recognizer, validated by finger over seven device
passes. ✅✅ **`IN9` CLOSED** — both camera rules, pinch zoom and orbit on a
three-ring surface, working by finger.
✅✅ **`IN2` CLOSED** — pointer plumbing, three roles latched at press. ✅✅ **RULE 6 CLOSED 2026-09-15**
(screen-plane translate) — tuned by finger over five device passes, then confirmed in
ordinary play. ⛔ `IN4` itself stays partial: 6bis onward wait on `3D1`. It has
mass: a critically/under-damped follower plus a phantom target that leads along the
finger's own motion (`src/input/translate.ts`, `follow.ts`, `lead.ts`).
✅ **Object ROTATION works** — free yaw/pitch and roll, both by finger. ⚠ What it lacks is
rule 2bis's PRECONDITION (*an empty constraint stack*), because §1.4's stack does not
exist yet; `IN3` attaches it to the object model and adds that test, it does not delete
the rotation.
✅✅ **AND IT NOW STANDS ON A GRAVITY FRAME** (`A7`/`D18`, `src/input/gravity_frame.ts`):
yaw about the **world vertical**, pitch about the horizontal screen axis, roll about the
view direction **flattened onto the ground** — and rule 6's `dy` is a true vertical.
⛔⛔ **The argument is ORTHOGONALITY, not tidiness**: about the camera's own axes the view
axis gains a vertical component as it tilts, so roll stops being independent of yaw and no
gain can separate them. ⭐ One basis serves translation AND rotation.
✅ **A roll REBASES to the start of its circle** (`A8`): a circle is not read as a roll until
60° of arc, and the yaw/pitch applied meanwhile is now undone — to the FIT WINDOW's start,
not to the press, so a straight drag that precedes a circle survives.
✅✅ **§1.1 IS NOW A POSITION DEADBAND** (`A11`/`D21`, the owner's model): an anchor trails
the finger at one dead radius — inside it the finger is `STATIONARY` and emits **nothing**;
outside, it emits the **excess only** and the anchor is dragged up. ⭐ Time-free, the
emitted travel is exact (true travel minus one radius, **once**), and a slow drag survives.
⛔ It deleted `stillSpeed`, `stillTime`, `moveEnterDistance`, `moveExitDistance` and a
validator rule, and **absorbed `A9`/`IN12`**: the deadband is applied once, for every rule
at the same time, so nothing consumes a raw delta any more.
⛔⛔ **§1.1 HAS NOW HAD FOUR FORMULATIONS AND THE FIRST THREE ALL BROKE ON A REAL POINTER**
— accumulated travel, instantaneous speed, speed over one sample pair. ⭐ Each fix made the
NUMBER better without making the SHAPE right. `queue_notes/IN0.md` is the most instructive
file in the project.
⚠ **`motionDeadbandMm` is now the most load-bearing number in the input layer** — the commit
threshold, the rest test and the jitter deadband at once. It has a slider and no hand has
judged it.
✅ **DEPTH translation** (`A10`/`D20`, `IN8`) — ⛔⛔ **AND ITS GATE IS DELETED (`D43`,
2026-09-17): EVERYTHING IS SIMULTANEOUS NOW.** Depth used to require the finger **on the
object** to hold still, which made rule 6 and depth a **partition** of the two-finger
configuration rather than an overlap. ⭐ The owner rejected the partition itself: **each finger
owns its own channel** — the holder's x/y, the second finger's single axis — and the two
**SUM**, exactly as the holder's own x and y already do. ⚠ What it trades away: a hand can no
longer move ONE finger and be sure only one rule ran; and **`A11`'s per-axis deadband is now
the only thing** keeping a resting second finger from rolling the object with its jitter.
⭐ Rule 6's second touchpoint may be outside **or on the same object**, which closed the
small-object hole owed since `A5`.
⛔⛔ **Depth took SIX models, five of them rejected by a hand**, and the two lessons are in
`METHOD.md`: **a blend has seams**, and ⭐⭐ **when a rule needs a WINDOW to decide, suspect
the QUESTION** — A6 was implemented correctly and still failed, because *"are these two
travels equal?"* has no answer at a reversal or a late start.
⛔⛔ **AND IT EXPOSED A DEFECT IN §1.1 THAT NOTHING ELSE COULD HAVE FOUND**: the motion
state estimated speed over **one sample pair**, so with the measured 0.761 mm of noise a
resting finger read ~95 mm/s and **STATIONARY was unreachable — for any real finger, since
the day the noise was measured**. ⭐ Fixed to a windowed estimate, with a validator rule and
four §1.1 numbers re-sized. ✅✅ **CLOSED BY A DEVICE LOOK 2026-09-16** — *"everything is working"*, which is rule 5
and the only thing that closes a change here. ⚠ The numbers a hand has now accepted:
`motionDeadbandMm` **3.5 mm**, `restConfirmMs` **30 ms**, `secondTouchGraceMs` **250 ms**,
`gainRollDrag` **2 °/mm** — the last two were never judged on their own, so they are the
first candidates if anything feels wrong later. ⛔ It has **no inertia**: that was built and rejected on the device. See `QUEUE.md`'s YOU-ARE-HERE
block before rebuilding either that or `targetVelocity`.

⛔⛔ **Sixty-one defects, fifty-eight of them BY FINGER, and none visible to a green
suite.** ⚠ The 2026-09-17 audit's findings are a **separate column** and are NOT added to that
total — it means *found by a hand, invisible to a green suite*, and that is the whole of this
project's argument for device passes. ⭐ The two do not compete: **the device finds what is
wrong now; a read finds what is wrong on the day something else changes.** ⭐⭐ Number 40 is the one to read if you read one: `A12` retired the one-touchpoint
roll and left its detector **fed**, and its `ROLL_KEPT` verdict silently vetoed `IN3`'s
flick — *a retired gesture that still owns a verdict is not inert*. ⭐ The one exception is worth knowing: §1.1's unreachable STATIONARY was found by
**composing a measurement with a threshold**, not by a hand — and no hand could have found
it, because nothing shipped depended on the path it broke. They are **five** repeating shapes — a rate estimated over too short a baseline, a
substituted quantity, idealised fixtures, a composition nobody computed, and ⭐ **my own
FIXTURES**, which produce false alarms that look exactly like real defects. ⭐ They
are spelled out in [`Claude/00_CORE/QUEUE.md`](Claude/00_CORE/QUEUE.md)'s YOU-ARE-HERE
block, and they bind every row still to come.

⭐⭐ **Tunables can be A/B'd by finger without a rebuild** — `?motionDeadbandMm=3.5` on the URL,
or the on-screen menu for the orbit rings. That is what makes `IN5` practical.
⚠ Every number in `src/input/gestureConfig.ts` is still a placeholder, except the six
orbit ring values, the four gains and rule 6's four feel numbers, all chosen on the
device — and **`pointerNoiseMm` = 0.761 mm, the first number actually MEASURED**
(2026-09-14, `src/input/noise_meter.ts`). ⛔ Measuring it exposed a defect in the sagitta
guard that had stood through eight device passes: see `Claude/10_INPUT_TOUCH/INDEX.md`.
⛔⛔ **A GUESSED NUMBER HAS BEEN WRONG EVERY SINGLE TIME** — four gains raised ×3.4,
×2.3 and ×2 by a hand, a simulated recommendation halved, and a *computed landmark*
(the lead at which a drag leaves no gap) rejected in favour of a fifteenth of it.
⭐ **A simulation narrows the range; it does not pick the number. Ship the slider WITH
the rule.**

✅✅ **`3D1` IS CLOSED (2026-09-15)** — built, wired, and judged by finger. The pass found
one defect in the wiring (a translated object was LOCKED, then JUMPED: the render loop drew
only objects that happened to have a follower); fixed and confirmed. ⭐ Everything else was
clean, which re-confirms rule 6 after its path was rewired. Built — `src/core/object_model.ts`, 42 vectors, engine-free:
placement, faces, connectors, the assembly tree, and the constraint stack attached to an
object. ⭐⭐ The vectors were written FIRST and then **falsified on purpose** — breaking the
composition turns 14 of 42 red, which is why the green means something. ⭐ `reroot`
implements **parent ≠ root** and moves nothing.
⭐ The model is now exercised by every gesture on the glass. ⛔⛔ **NEXT is `IN3`** — now the only input row with unbuilt work left.
✅ `IN12` (the deadband) was CLOSED by `A11`, which put it in §1.1 itself rather than in
each rule.

✅✅ **ONE INPUT MODEL, AND `IN13` IS CLOSED** (`D28`, 2026-09-16). A held object's drag
**translates or rotates**; **any single tap anywhere** flips between the two, immediately; the
mode is one latch for the **session**; and a second touchpoint pressed while the holder is
still drives **roll by its x or depth by its y** — the mode picks one, never both.
⚠ A double tap flips twice **and** flies the camera home: the owner's accepted trade.
⭐⭐ **It was chosen by comparison, not assertion**: three readings of §2/§4 ran from ONE
build across `1.0.5`–`1.0.7` so a hand could judge them in the same minute on the same scene
— then forks A and B were **deleted**, with the flag, its latch, the slider and 44 vectors.
⛔⛔ And it retired **`A14`** and **`A12`** by construction: the grace existed only because the
mode read second-touchpoint presence, and two-axes-at-once is unreachable once the mode picks
one axis. ⭐ The whole comparison: [`Claude/00_CORE/queue_notes/IN13.md`](Claude/00_CORE/queue_notes/IN13.md).


⛔⛔ **`A15` IS DELETED, AND THE CLOSE IT ONCE HAD IS THE RETRACTION WORTH KEEPING** (`D54`,
2026-09-18): *"Until first touch is released: first touch can continue controlling the object …
and second touchpoint can be pressed again and thus control again the object."* ⭐ **A holder
keeps its object for its touchpoint's lifetime**, so `IN2`'s latch has **no exceptions** again
— `holder_binding.ts`, `relatchOnOrphan` and its 16 vectors are gone.
⚠ **What it used to do**, kept because the reversal is the more useful entry: a holder **no
longer under its object** gave the selection up — depth moves the object along the view axis
*while the holder need not move at all*, so it leaves the finger carrying it, and §4's latch
kept that finger holding it anyway. ⭐ A **raycast at the second touchpoint's lift**; if the
object was not there the selection dropped **at the next input event** and the §4 table
re-resolved, ⛔ **keeping the previous yellow centre** (a gesture that ENDS must not retarget
the camera). ⚠⚠ **It was reported CLOSED by a device look and it was not**: *"everything is
working ok"* was general, and `A15`'s three specific cases were never reported on
individually — ⭐ *a close is only as strong as the phrase that gave it.*
⛔ **The geometry was never the fault.** The owner's verdict is a preference between two
correct behaviours: **keeping control beats re-resolving**. `D25`, reversed by `D54`
→ [`Claude/00_CORE/queue_notes/IN8.md`](Claude/00_CORE/queue_notes/IN8.md).
⭐⭐ **A REPORT THAT DID NOT SURVIVE INVESTIGATION, kept because it is the more useful
entry**: *"you destroyed the rotation around the gravity axis… it came back to the axis of
the screen view plane"* — withdrawn by the owner after `tests/a7_wiring.test.ts` composed
the frame with the rotation and asserted the axis that comes out, at four camera tilts.
⛔ Every part of `A7` already had green vectors and **the composition had none**. That is
mistake shape 4 pointing at a CORRECT piece of work. ⭐ `METHOD`: *a composition is a thing
to MEASURE, not an emergent property* — and measuring it is what told a real defect (the
missing deadband) from an impression.
⭐⭐ Rule 6's gain was **computed, not guessed**: `gainTranslateScreen` is a multiplier on
a tracking factor and **1.0 puts the object exactly under the finger**.
⭐ **The order is `IN2` → rule 6 translate → `3D1` → 6bis onward.** `IN4`'s dependency
on `3D1` is NOT uniform: rule 6 translates *the selected object* in the screen plane and
needs no object model, while 6bis onward are defined on the axis between two selected
FACE centres, which is exactly what `3D1` owns.
⛔ Rule 6 is a **composition** — §1.2 scales translation gains by
`cameraDistance / referenceCameraDistance`, so it is `translate × zoom × orbit`.
**Compute what one millimetre of finger does at BOTH zoom extremes before writing the
gain.** That is mistake shape 4's exact territory.
⚠ `3D1` is still the last thing before actual assembly.

⭐ **What a finger can already do, by touchpoint configuration**: the **BUILD STATUS**
section of [`Claude/10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md`](Claude/10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md)
— the spec now carries its own build inventory.

Full status: [`Claude/00_CORE/QUEUE.md`](Claude/00_CORE/QUEUE.md)'s YOU-ARE-HERE block.
