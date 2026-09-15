# LESSONS CARRIED — what the predecessor project paid for

> **STATUS** · live · **OWNS** · the transplanted experience, and why each rule exists
> **READ IF** · you are new to this project. ⭐ **It will save you a week.**
> **SOURCED FROM** · `vision_pipeline_python/Hand_detection/Claude/` — nine months of
> a webcam hand-tracking game, abandoned at the input layer 2026-09-13. The
> *manipulation, assembly, architecture and evidence* work is what survives.
> **LAST VERIFIED** · 2026-09-13

⚠ **What was deliberately NOT carried**: hand detection, MediaPipe, the estimator
layer, the gesture pipeline, the 415-take landmark corpus, and the hand-based input
system. That work is closed. Everything below is what proved to be *about building
software carefully*, not about hands.

---

## 1. ⭐⭐⭐ DECIDE THE PLATFORM FIRST. It is the most expensive lesson.

The predecessor deferred its platform decision for months. Four queue rows — real 3D
import, per-device calibration, world-referenced rotation — and **the entire game
layer** sat behind it, and its router still reads: *"THE PLATFORM DECISION IS DUE AND
IT IS THE OWNER'S … no amount of building advances it."*

⭐ The reason it kept being deferrable is the trap: there was always defensible
non-renderer work to do, so the decision never became urgent, and every week of it
accrued more work that might have to be thrown away.

✅ **This project made the choice on day one** (TypeScript + Babylon, `D1`). If you
find yourself deferring a decision because there is other work available, that is the
signal, not the excuse.

## 2. ⭐⭐⭐ A CONTRACT NOTHING CHECKS IS A WISH

The predecessor's estimator layer was "stdlib-only and numpy-free **by contract**",
stated in its constraints doc and relied on by the whole port plan. It was **false**:
three dead modules sat in that folder for a month, one importing numpy, and nobody
noticed because nothing looked.

✅ Here the equivalent claim is a test — [`tests/boundary.test.ts`](../../tests/boundary.test.ts).
⭐ And the guard carries its own counter-example, because a guard that cannot fail is
not a guard: its first version matched the WORD "three" in a comment and fired on the
prose "rotation has three DOF".

## 3. ⭐⭐⭐ THE INSTRUMENT IS A SUSPECT, ALWAYS

In one night, **four harnesses reported CLEAN on takes the owner had just watched
fail.** Every time the instrument was wrong. The full rule set is in
[`METHOD.md`](METHOD.md); the shape to internalise:

* a harness that **recomputes** what the product computed is a second implementation
  that can silently disagree — record what the product actually used;
* **a sign is not tested by any amount of testing the magnitude**;
* **an invariant tested on one axis is not tested** — a suite once checked the one
  axis that never had the problem and certified the two that did;
* **a skipped check must be announced** — one suite fed wrong-shaped data to a
  loader, got nothing, skipped, and printed ALL CHECKS PASSED;
* **a fixture must be a specimen the product would accept** — an idealised synthetic
  input the real code rightly refuses exercises a case that cannot occur.

⚠ On the final day of that project a review found **seven defects in code that was
already green**, two of them re-introductions of defects fixed months earlier. Green
suites are necessary and not sufficient.

## 4. ⭐⭐⭐ A LIVE LOOK CLOSES A CHANGE. NOTHING ELSE DOES.

Repeatedly: 40+ automated checks passing, replay clean, parity clean — and the owner
ran it and said *"the feel is very bad."* Three estimators died that way, each after
scoring **better** on the metric it was built for.

⭐⭐ The reusable form: **the metric you optimised is usually not the one the user
feels.** One replacement improved the median and tripled the p95 — smoother most of
the time, occasionally much worse — and *the tail decides the feel every time*.

⛔ For this project: **touch gestures cannot be honestly tested with a mouse.** One
pointer, no DPI, no tilt, no haptics. ⭐ The loop is **`npm run dev:usb` + `adb reverse
tcp:5173 tcp:5173`**, which serves on `127.0.0.1` only and still reaches the tablet as
`localhost` — so it is a SECURE CONTEXT and sensors work. ⛔ Not `--host`: that publishes
the dev server to the LAN, which is `DEP1b` and has its own firewall procedure. See
[`../50_BUILD_DEPLOY/DEVICE_TESTING_USB.md`](../50_BUILD_DEPLOY/DEVICE_TESTING_USB.md).

## 5. ⭐⭐ MEASURE THE COMPOSITION, NOT THE LAYERS

The predecessor's rotation stack ended up being a **reflection** — geometrically
impossible for a rigid mapping. Every layer was locally defensible; nobody had ever
written down what the whole chain did. It cost a from-scratch rebuild.

⭐ Ask what the entire chain does **in one expression** and check a property of it
(determinant, round trip, closure). For assembly the equivalent is: what does
grab → constrain → mate → release do, composed, and does it return?

## 6. ⭐⭐ SUPPRESS, DO NOT GUESS — and refuse what you cannot vouch for

Where a quantity is ill-conditioned, the right behaviour is to **stop using it**, not
to substitute a plausible value. Guessing produced state-inheritance bugs that took
three sessions to separate because they shared one appearance.

⭐ Related, and it bit twice: **a degenerate input must return `null`, never a
default.** `normalize()` here returns `null` for a zero vector for that reason.

## 7. ⚠ THE COST OF DEFERRED CLEANUP IS PAID BY THE NEXT READER

1.3 MB of documentation, accumulated by appending to front doors, had to be
reorganised into the tiered structure this project starts with. The three rules that
keep it from re-bloating are in [`../README.md`](../README.md), and they are cheap to
follow from day one and expensive to retrofit.

---

## What was carried across as CODE

⭐ **The mate-connector geometry** (`src/core/mate_connector.ts`) — transliterated
from a shipped, live-confirmed Python implementation that was deliberately written
dependency-free so it could move. Four rules came with it, each of which cost a live
session:

| | |
|---|---|
| ⛔⛔ | A connector stores the **TRUE OUTWARD NORMAL**, so a mate is **ANTI-PARALLEL** — the opposite of the first natural wording |
| ⛔⛔ | Break on the **RESIDUAL of the unconstrained desires**, never the observed gap, which is zero by construction and makes the mate unbreakable |
| ⭐⭐ | **Parent ≠ root.** The parent stores the transform; the root is whoever is *held*, re-rooted every frame. Conflating them means grabbing a child moves nothing |
| ⭐ | **`roll_order` is what makes a mate FASTENED rather than REVOLUTE** — normals alone leave the roll free |

⭐ **One scene camera, never one per object.** Two projections for one scene drew
coincident faces 18.4 px apart.

⭐ **Un-snapping needs two hands** was the predecessor's rule; the touchscreen
equivalent is an owner decision and is recorded as open in [`DECISIONS.md`](DECISIONS.md).

## What is genuinely new here, and therefore unproven

⚠ Everything about **touch**: the recognizer, the flick test, the constraint stack,
the millimetre thresholds. None of it is inherited and none of it is measured. The
config defaults exist so the build runs. ⛔ Do not quote them as if derived.

⭐ Already, on day one, the discipline paid: writing the first golden vectors found
that the spec's §1.1 *"accumulated travel"* rule is unusable as written — path length
for a resting finger is a random walk and grows without bound, so **every stationary
touchpoint eventually reads MOVING**. Measured: a ±0.5 px jitter crossed the
threshold in under half a second. The build uses **net displacement from an anchor**
instead. See [`../10_INPUT_TOUCH/INDEX.md`](../10_INPUT_TOUCH/INDEX.md).
