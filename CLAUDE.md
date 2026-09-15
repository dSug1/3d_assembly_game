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

## Where it stands (2026-09-14)

✅ Green: TypeScript + Babylon + Vite, **409 golden vectors passing**.
✅ Deployed and live: **https://dsug1.github.io/3d_assembly_game/**
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
the rotation. ⛔ It has **no inertia**: that was built and rejected on the device. See `QUEUE.md`'s YOU-ARE-HERE
block before rebuilding either that or `targetVelocity`.

⛔⛔ **Nineteen defects have been found BY FINGER and none was visible to a green
suite.** They are four repeating shapes — a rate estimated over too short a baseline, a
substituted quantity, idealised fixtures, and a composition nobody computed. ⭐ They
are spelled out in [`Claude/00_CORE/QUEUE.md`](Claude/00_CORE/QUEUE.md)'s YOU-ARE-HERE
block, and they bind every row still to come.

⭐⭐ **Tunables can be A/B'd by finger without a rebuild** — `?rollAngle=45` on the URL,
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

✅ **`3D1` IS BUILT (2026-09-15)** — `src/core/object_model.ts`, 42 vectors, engine-free:
placement, faces, connectors, the assembly tree, and the constraint stack attached to an
object. ⭐⭐ The vectors were written FIRST and then **falsified on purpose** — breaking the
composition turns 14 of 42 red, which is why the green means something. ⭐ `reroot`
implements **parent ≠ root** and moves nothing.
⛔⛔ **BUILT is NOT CLOSED**: it has no visible behaviour, so no finger can judge it. It
closes when **`IN3`** wires it — and `IN3` is NEXT.
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
