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

## Where it stands (2026-09-16)

✅ Green: TypeScript + Babylon + Vite, **547 golden vectors passing**.
✅ Deployed and live: **https://dsug1.github.io/3d_assembly_game/**
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
✅ **DEPTH translation** (`A10`/`D20`, `IN8`): the finger **on the object holds still**, the
finger **outside** supplies the travel. ⛔ No window, no ratio, no tolerance — and the
holder wins every tie, so rule 6 and depth **partition** the two-finger configuration
instead of competing for it. ⭐ Rule 6's second touchpoint may now be outside **or on the
same object** (the first drives), which closes the small-object hole owed since `A5`.
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

⛔⛔ **Thirty-five defects, thirty-four of them BY FINGER, and none visible to a green
suite.** ⭐ The one exception is worth knowing: §1.1's unreachable STATIONARY was found by
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
