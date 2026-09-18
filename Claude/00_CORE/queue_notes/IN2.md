# `IN2` — pointer plumbing

**Status: ✅ CLOSED 2026-09-14, 22 vectors, confirmed by finger.**
⭐ The owner checked all four cases on the device — the `IN8` consequence below included —
and reported *"all working fine"*. ⚠ That makes `IN8`'s reading 1 an accepted BEHAVIOUR,
not just an accepted decision.
`src/input/router.ts` · `tests/router.test.ts` · wired in `src/render/scene.ts`.
Spec: §0 (tracking), §4 (roles latched at press), §5 → the `IN8` decision.

## What it is

One class, `PointerRouter<O>`, engine-free and generic over an opaque object handle, so
`src/render` passes a Babylon mesh and this file never learns what a mesh is. It owns
**exactly one thing: the ROLE of each live touchpoint.** It runs no rule, moves no
object and never touches the camera.

| role | meaning |
|---|---|
| `OBJECT` | pressed on an object nothing else was holding. Carries that object. |
| `OUTSIDE` | pressed on no object. Camera rules (§2 rules 1 and 4) and rule 6's anchor. |
| `IGNORED` | pressed on an object another touchpoint already holds (`IN8`). Inert. |

## The three properties it exists to guarantee

1. ⛔⛔ **A role is latched at press and never revisited** (§4). Press on a part and
   slide off — still holding it. Press on empty space and slide onto a part — still an
   anchor. ⚠ Without the latch, steadying a grip near the part being moved silently
   switches between two translation mappings, and nothing on screen says so.
2. ⭐⭐ **Order-independence** (§0, in its own words): *"when a touchpoint is released,
   the other touchpoint keeps tracking the other object independently of the order in
   which the touchpoints were being pressed."* Every binding is keyed by **pointer id**,
   never by position in a list. ⚠ An index-based scheme reads identically in the common
   case and hands the wrong object over on **one** of the two release orders — so both
   orders are vectors.
3. ⛔ **`IGNORED` is inert, for life.** No recognizer, no anchor, and on release **no
   release verdict, no flick test, no tap history** (`release()` reports
   `wasActive: false`). ⚠ It is the OPPOSITE of the pinch, where lifting one of two
   fingers ends the gesture — and the two live a few lines apart in `scene.ts`.

## ⚠ THE CONSEQUENCE TO LOOK AT ON THE DEVICE

⛔ **Lift the finger that was holding a part, with a second finger still resting on that
same part, and the part stops responding.** The second touchpoint was ignored at press
and stays ignored until it lifts.

That is the honest consequence of *"ignore the second hit"*: it is the simplest rule
that is well defined, it is recorded as a vector so it cannot change by accident, and it
is **the thing to judge by finger before `IN4` builds on it.** The alternative —
promoting the survivor — means a role that changes without a press, which is the exact
property §4 exists to forbid. ⭐ If it feels wrong on the glass, the fix is to revisit
`IN8` (reading 2 is deferred, not rejected), not to quietly unlatch the role.
✅ **Judged on the device 2026-09-14 and accepted.** It does not feel wrong.

⭐ **It is visible**: the HUD prints every touchpoint in press order with its latched
role, e.g. `#1OBJ #2IGN  active=1`. Without that line, "nothing is happening" and "it is
broken" look identical.

## ⛔⛔ `move()` TAKES THE LIVE HIT AND THROWS IT AWAY — on purpose

`move(id, sample, hitNow?)` accepts what is under the finger **right now** and discards
it. ⚠ It is in the signature so that the latch is a property the vectors can **disprove**:
without it, *"the role does not follow the finger"* would be true only because the
information was never passed in — and **a test that cannot fail is not a test**
(`METHOD`). The caller picks on every move anyway, so handing it over is free, and it
says at the call site that ignoring it is a decision rather than an oversight.

⭐ This was found by running the vectors against a deliberately wrong implementation and
noticing that **two of them could not fail**. The same pass found a second unfalsifiable
vector (a reused pointer id) and replaced it with one that tests the line that actually
guards it: a press for an id that is **already down**.

## What the five wrong implementations did, and which vector caught each

| naive implementation | caught by |
|---|---|
| role recomputed from the live hit on every move | the two latch vectors + "ignored stays ignored wherever it slides" |
| ignore **any** second object hit, not just the same object | "a press on a DIFFERENT object is NOT ignored — 6bis must stay reachable" |
| promote the ignored pointer when the holder lifts | "`IGNORED` is latched for LIFE" |
| `activeCount` counts every finger down | "`activeCount` EXCLUDES ignored touchpoints" |
| a press for an id already down keeps the stale latch | "a press for an id that is ALREADY DOWN replaces it" |

⛔ `activeCount` is the count the §4 rule table is written against. A plain
`pointers.size` would let an ignored finger turn a one-touchpoint rule into a
two-touchpoint one — **the most likely way the `IN8` decision gets silently undone.**

## What it replaced

`scene.ts` kept a `live` map and an `outside` map and decided membership by which map an
id was in. It worked. It had no way to express `IN8`, no explicit press order (a `Map`'s
insertion order agrees with press order right up until an id is reused), and no vectors —
the roles were only ever exercised by finger.

## Next

⭐ **Rule 6 (screen-plane translate)** is what this unblocks, and it needs no object
model — see the `IN4` row. ⛔ Rule 6 carries §1.2's distance-scaled gain
(`cameraDistance / referenceCameraDistance`), so it is `translate × zoom × orbit`:
**compute what one millimetre of finger does at both zoom extremes BEFORE writing the
gain.** Mistake shape 4's exact territory.

---

## ⛔⛔⛔ OPEN — A STALE GRIP DISABLES BOTH CAMERA RULES AT ONCE (observed 2026-09-18)

> *"I am in a situation where neither the camera orbit nor the camera zoom work."* — the owner

⚠ **NOT FIXED. Captured so that a recurrence is a KNOWN shape rather than a fresh hunt.**

### What was actually on the glass

⭐ Read live off the tablet (see the CDP technique in
[`../../50_BUILD_DEPLOY/DEVICE_TESTING_USB.md`](../../50_BUILD_DEPLOY/DEVICE_TESTING_USB.md)),
with no finger on the screen:

```
pointers  1
phase     —          motion    —
last      second touchpoint released
roles     #149OBJ  active=1  [ROTATE]
```

⛔ **One touchpoint still latched as `OBJ`, with a blank phase and motion** — a grip whose
pointer is gone. The previous verdict was *"second touchpoint released"*, so the hand had two
fingers down, the second lifted, and the **first one's release never ran**.

### ⭐⭐⭐ ONE PHANTOM HOLDER KILLS BOTH RULES, BY TWO DIFFERENT ROUTES

⚠ This is why it reads as *two* broken features and is *one* fault. Neither route is a bug on
its own — each is a correct rule reading a router that is lying to it:

| rule | why it dies |
|---|---|
| **orbit** (§2 rule 1) | its branch needs `outside().length === 1 && objects().length === 0`, and `objects().length` is 1 |
| **pinch zoom** (§4 rule 4) | it never gets that far — the `OUTSIDE` move handler takes `router.objects()[0]`, feeds the finger to `applyDepthDrag` and **returns before `updatePinch()`**, so the pinch is consumed as a depth/roll drive for a body nobody is holding |

⭐ **The tell, for next time**: *two camera rules dead at once, with `active=` non-zero and no
finger down.* ⛔ Chasing either rule separately is the wrong end — both are downstream of the
router's count.

### ⚠ WHAT WAS **NOT** ESTABLISHED

⛔ Why `#149`'s `POINTERUP` never reached the handler. The release path is unconditional
(`forgetAnchor` then `router.release`), so the event most likely never arrived.
⚠ Two circumstances were present and neither was ruled out: **two tabs of the app were open**
(one left by an assistant cache-buster reload), so the page could have been hidden mid-gesture;
and a `pointercancel` would deliver no `POINTERUP` at all.

### ⭐⭐ THE TWO IMPROVEMENT OPTIONS, IF IT RECURS

1. ⭐⭐⭐ **MAKE IT SELF-HEALING — a grip whose pointer is no longer down is reaped.** Babylon
   exposes `POINTERCANCEL`, and a grip can be checked against the live pointer set on the next
   event. ⛔ This is a **robustness gap independent of the cause**: `IN2`'s latch is *for the
   touchpoint's lifetime*, and nothing today bounds that lifetime by the pointer actually
   existing. ⚠ It must not become a per-frame role recomputation — that is exactly what the
   latch exists to prevent (`METHOD`: *a mode may be keyed on PRESENCE, never on MOTION*). A
   pointer that the browser says is gone is a **discrete** fact, which is the admissible kind,
   and `A15`'s `relatchOnOrphan` is the precedent for the one legal exception.
2. ⭐ **MAKE A LOST RELEASE VISIBLE.** The HUD prints latched roles; it does not say whether
   each one still has a live pointer. ⛔ *An absent readout cannot be caught by looking at the
   screen* — a grip with a dead pointer should SAY so, or the next occurrence costs another
   session to find. ⚠ Cheap: the router already knows its pointer ids.

⭐ **The immediate unblock is a reload**, which is why this can sit unfixed — but it is not a
diagnosis, and a hand that does not know the shape will spend the session on the camera.
