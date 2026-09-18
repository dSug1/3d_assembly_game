/**
 * GOLDEN VECTORS — the recognizer state machine (§1.3), `IN1`.
 *
 * ⭐⭐ THE VECTOR THAT MATTERS MOST IS THE ROLLBACK ONE. §1.3 exists because every
 * drag ends in a release, so before it every drag could satisfy a flick rule and the
 * two competed for the same gesture. The proof that they are now separable is that
 * a flick RESTORES the press snapshot and a drag does not — asserted on the pose
 * port itself, not inferred from the verdict string.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import type { Sample } from "../src/input/motion";
import { type Flick } from "../src/input/flick";
import {
  NO_RELEASE_CONTEXT,
  Recognizer,
  TapHistory,
  resolveDiscreteRule,
  type PosePort,
  type ReleaseContext,
} from "../src/input/recognizer";
import { mmToPx } from "../src/core/units";

const cfg = DEFAULT_CONFIG;

/**
 * A recording pose port. ⭐ It records what the RECOGNIZER actually did to the pose,
 * rather than a second implementation recomputing what it should have done —
 * `METHOD`: record the value the product actually used.
 */
function recordingPose() {
  let pose = 0;
  const restored: number[] = [];
  // ⭐ Counted as well as recorded: since the flick rollback was retired (2026-09-16) the
  // snapshot's only remaining owner is `IN6`'s undo, and *that it is still TAKEN* is now a
  // claim a vector has to make — a mechanism nothing exercises is the next thing deleted.
  let snapshots = 0;
  const port: PosePort<number> = {
    snapshot: () => {
      snapshots++;
      return pose;
    },
    restore: (p) => {
      pose = p;
      restored.push(p);
    },
  };
  return {
    port,
    restored,
    get snapshots() {
      return snapshots;
    },
    /** Stand-in for a continuous rule moving the object provisionally. */
    moveProvisionally: (to: number) => {
      pose = to;
    },
    current: () => pose,
  };
}

/** A straight run at a constant speed in mm/s, along +x unless `vertical`. */
function run(opts: {
  speedMmPerS: number;
  ms: number;
  x0?: number;
  y0?: number;
  t0?: number;
  stepMs?: number;
  vertical?: boolean;
}): Sample[] {
  const { speedMmPerS, ms } = opts;
  const x0 = opts.x0 ?? 100;
  const y0 = opts.y0 ?? 100;
  const t0 = opts.t0 ?? 0;
  const stepMs = opts.stepMs ?? 10;
  const out: Sample[] = [];
  for (let t = 0; t <= ms; t += stepMs) {
    const d = mmToPx((speedMmPerS * t) / 1000);
    out.push({ x: x0 + (opts.vertical ? 0 : d), y: y0 + (opts.vertical ? d : 0), t: t0 + t });
  }
  return out;
}

/** Press, feed every sample but the last as moves, release on the last. */
function gesture(
  rec: Recognizer<number>,
  samples: readonly Sample[],
  ctx: ReleaseContext = NO_RELEASE_CONTEXT,
) {
  rec.press(samples[0]!);
  for (let i = 1; i < samples.length - 1; i++) rec.move(samples[i]!);
  return rec.release(samples[samples.length - 1]!, ctx);
}

function fresh() {
  const pose = recordingPose();
  const taps = new TapHistory(cfg);
  return { pose, taps, rec: new Recognizer(cfg, pose.port, taps) };
}

describe("recognizer — the commit point", () => {
  it("a press that never travels stays PRESSED", () => {
    const { rec } = fresh();
    rec.press({ x: 100, y: 100, t: 0 });
    // Jitter well under moveEnterDistance (1.5 mm).
    for (let t = 10; t <= 200; t += 10) rec.move({ x: 100 + (t % 3) * 0.4, y: 100, t });
    expect(rec.currentPhase).toBe("PRESSED");
  });

  it("crossing moveEnterDistance commits, exactly once, to COMMITTED_CONTINUOUS", () => {
    const { rec } = fresh();
    const samples = run({ speedMmPerS: 40, ms: 200 });
    rec.press(samples[0]!);
    expect(rec.currentPhase).toBe("PRESSED");
    for (const s of samples.slice(1)) rec.move(s);
    expect(rec.currentPhase).toBe("COMMITTED_CONTINUOUS");
  });

  it("⛔ COMMITTED_CONTINUOUS is ONE-WAY: settling mid-drag does not un-commit", () => {
    // The pose has already moved provisionally. A recognizer that fell back to
    // PRESSED would strand it half-applied, with no snapshot restore and no
    // discrete rule — the object simply keeps an edit nobody asked for.
    const { rec } = fresh();
    const moving = run({ speedMmPerS: 40, ms: 200 });
    rec.press(moving[0]!);
    for (const s of moving.slice(1)) rec.move(s);
    expect(rec.currentPhase).toBe("COMMITTED_CONTINUOUS");
    const last = moving[moving.length - 1]!;
    // ⚠ DERIVED, not a literal: how long settling takes is governed by `stillTime` and
    // by the speed window behind it, and A10 re-sized both. A literal 600 ms went stale.
    const restSamples = Math.ceil((4 * cfg.restConfirmMs) / 10);
    for (let i = 1; i <= restSamples; i++) rec.move({ x: last.x, y: last.y, t: last.t + i * 10 });
    expect(rec.motionState).toBe("STATIONARY"); // the FINGER settled...
    expect(rec.currentPhase).toBe("COMMITTED_CONTINUOUS"); // ...the GESTURE did not
  });
});

describe("recognizer — provisional motion and rollback", () => {
  it("⛔⛔⛔ A FLICK KEEPS THE ROTATION IT WAS MADE WITH — the rollback is RETIRED", () => {
    // ⛔⛔ THIS VECTOR ASSERTED THE OPPOSITE UNTIL 2026-09-16, and the retraction is the
    // record: *"a rotation followed by a flick was previously resetting the quaternion of the
    // object: get rid of that if this conflicts with the alignment by flick"* — owner.
    //
    // ⭐⭐ §1.3's rollback was right for the world it was written in, where a drag and a
    // flick were RIVAL READINGS of one gesture and the loser's effect was unwanted. `A16`
    // made rotation a mode a hand chooses — so the drag is deliberate — and `D33` made the
    // flick readable at the END of a drag, so *drag-then-snap* is the normal gesture now.
    // ⭐⭐⭐ **A ROLLBACK IS ONLY HONEST WHEN THE MOTION IT UNDOES WAS PROVISIONAL.**
    // ⚠ `restore` is now called by nothing in the recognizer; the snapshot stays for `IN6`.
    const { rec, pose } = fresh();
    const samples = run({ speedMmPerS: 400, ms: 120 });
    rec.press(samples[0]!);
    for (const s of samples.slice(1, -1)) rec.move(s);
    pose.moveProvisionally(42); // the rotation the hand performed, on purpose
    const v = rec.release(samples[samples.length - 1]!);
    expect(v.kind).toBe("FLICK");
    expect(v.rolledBack).toBe(false);
    expect(pose.restored).toEqual([]);
    expect(pose.current()).toBe(42);
  });

  it("⭐ the press snapshot is still TAKEN — `IN6`'s undo is the other owner", () => {
    // ⛔ A snapshot nobody restores looks like dead code, and the next session would be
    // right to delete it — except §6 pushes an undo entry *before every committed drag*, and
    // this is that entry. ⭐ So the vector states the ownership rather than leaving the
    // mechanism to be rediscovered or removed.
    const { rec, pose } = fresh();
    const samples = run({ speedMmPerS: 400, ms: 120 });
    rec.press(samples[0]!);
    expect(pose.snapshots).toBe(1);
    for (const s of samples.slice(1, -1)) rec.move(s);
    rec.release(samples[samples.length - 1]!);
    expect(pose.snapshots).toBe(1);
    // ⭐ And it is READABLE, which is what keeps it from being deleted as dead: `IN6` will
    // push exactly this value. ⚠ The press pose, not the provisional one.
    expect(rec.pressSnapshot).toBe(0);
  });

  it("⭐⭐ a DRAG that decelerates keeps the provisional motion, untouched", () => {
    const { rec, pose } = fresh();
    const fast = run({ speedMmPerS: 400, ms: 100 });
    const last = fast[fast.length - 1]!;
    const settled: Sample[] = [
      { x: last.x + 0.2, y: last.y, t: last.t + 10 },
      { x: last.x + 0.3, y: last.y, t: last.t + 20 },
      { x: last.x + 0.35, y: last.y, t: last.t + 30 },
    ];
    rec.press(fast[0]!);
    for (const s of [...fast.slice(1), ...settled.slice(0, -1)]) rec.move(s);
    pose.moveProvisionally(42);
    const v = rec.release(settled[settled.length - 1]!);
    expect(v.kind).toBe("CONTINUOUS_KEPT");
    expect(v.rolledBack).toBe(false);
    expect(pose.restored).toEqual([]);
    expect(pose.current()).toBe(42);
  });

  it("a TAP never moved, so there is nothing to restore", () => {
    const { rec, pose } = fresh();
    const v = gesture(rec, [
      { x: 100, y: 100, t: 0 },
      { x: 100.5, y: 100, t: 40 },
      { x: 100, y: 100, t: 90 },
    ]);
    expect(v.kind).toBe("TAP");
    expect(pose.restored).toEqual([]);
  });
});

describe("recognizer — taps, and the double-tap §1.4 needs", () => {
  it("a short press with no travel is a TAP", () => {
    const { rec } = fresh();
    const v = gesture(rec, [
      { x: 100, y: 100, t: 0 },
      { x: 100, y: 100, t: 100 },
    ]);
    expect(v.kind).toBe("TAP");
    expect(v.rule).toBe("NONE"); // selection is rule 2, on press; a tap fires nothing
  });

  it("⛔ a LONG press with no travel is a HOLD, not a TAP", () => {
    // §1.3 bounds TAP only by distance. Without a duration bound, a finger resting
    // for ten seconds and lifting is a tap — and two of those clear a constraint
    // stack the user spent a gesture building.
    const { rec } = fresh();
    const v = gesture(rec, [
      { x: 100, y: 100, t: 0 },
      { x: 100, y: 100, t: 400 },
    ]);
    expect(v.kind).toBe("HOLD");
    expect(v.rule).toBe("NONE");
  });

  it("⭐ two taps on TWO DIFFERENT touchpoints are a DOUBLE_TAP → rule 2septies", () => {
    // ⛔ THE REASON TapHistory IS NOT IN THE RECOGNIZER: two taps are two pointer
    // ids, so the recognizer that saw the first is gone when the second presses.
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const first = new Recognizer(cfg, pose.port, taps);
    const second = new Recognizer(cfg, pose.port, taps);
    expect(
      gesture(first, [
        { x: 100, y: 100, t: 0 },
        { x: 100, y: 100, t: 80 },
      ]).kind,
    ).toBe("TAP");
    const v = gesture(second, [
      { x: 100, y: 100, t: 300 },
      { x: 100, y: 100, t: 380 },
    ]);
    expect(v.kind).toBe("DOUBLE_TAP");
    expect(v.rule).toBe("2septies");
  });

  it("⛔ a third tap is a fresh TAP, not a second DOUBLE_TAP", () => {
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const tap = (t: number) =>
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t },
        { x: 100, y: 100, t: t + 60 },
      ]).kind;
    expect(tap(0)).toBe("TAP");
    expect(tap(200)).toBe("DOUBLE_TAP");
    expect(tap(400)).toBe("TAP");
  });

  it("⛔ two taps too far apart in TIME are two TAPs", () => {
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const tap = (t: number) =>
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t },
        { x: 100, y: 100, t: t + 60 },
      ]).kind;
    expect(tap(0)).toBe("TAP");
    expect(tap(600)).toBe("TAP"); // 540 ms after the first release
  });

  it("⛔ two taps too far apart in SPACE are two TAPs", () => {
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const tap = (t: number, x: number) =>
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x, y: 100, t },
        { x, y: 100, t: t + 60 },
      ]).kind;
    expect(tap(0, 100)).toBe("TAP");
    expect(tap(200, 100 + mmToPx(12))).toBe("TAP"); // 12 mm > doubleTapSlop (8 mm)
  });

  it("⛔ a DRAG between two taps breaks the chain", () => {
    // ⛔⛔⛔ **THIS VECTOR COULD NOT FAIL UNTIL 2026-09-17.** It is repaired in place rather
    // than replaced, because the trap is the more useful record.
    //
    // ⚠ THE OLD FIXTURE: first tap released at t = 60, second tap pressed at t = **400** —
    // 340 ms later, against a `doubleTapWindow` of **300 ms**. So the second press was
    // outside the window and `TapHistory` would have called it a TAP *whatever the drag
    // did*. ⭐ Deleting `this.taps.reset()` from the commit point in `recognizer.ts` left
    // this vector, and the whole file, green — the assertion was true for a reason that had
    // nothing to do with its name.
    // ⭐⭐ `METHOD`: *a vector whose fixture sits outside the threshold it is testing is
    // measuring the threshold, not the rule.* The drag was decoration.
    //
    // ⭐ THE REPAIR PUTS THE SECOND PRESS **INSIDE** THE WINDOW — 240 ms after the first
    // release — so the ONLY thing that can stop it being a DOUBLE_TAP is the drag having
    // broken the chain. ⚠ And the drag is asserted to have COMMITTED, because a "drag" that
    // never crossed `motionDeadbandMm` would restore the same false pass by another route.
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    expect(
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t: 0 },
        { x: 100, y: 100, t: 60 },
      ]).kind,
    ).toBe("TAP");
    // A real drag, pressed and released between the two taps: 200 mm/s for 120 ms = 24 mm,
    // far past the 3.5 mm deadband. ⛔ It must land as a COMMITTED gesture, never as a tap.
    const dragged = gesture(
      new Recognizer(cfg, pose.port, taps),
      run({ speedMmPerS: 200, ms: 120, t0: 80 }),
    );
    expect(["CONTINUOUS_KEPT", "FLICK"]).toContain(dragged.kind);
    // ⭐ 300 − 60 = 240 ms after the first tap's release, and on the same point: inside BOTH
    // `doubleTapWindow` (300 ms) and `doubleTapSlop` (8 mm). Without the chain break this is
    // a DOUBLE_TAP, and `resolveDiscreteRule` maps that to **2septies** — an eviction fired
    // by a hand that merely tapped, dragged, and tapped again.
    const third = gesture(new Recognizer(cfg, pose.port, taps), [
      { x: 100, y: 100, t: 300 },
      { x: 100, y: 100, t: 360 },
    ]);
    expect(third.kind).toBe("TAP");
    expect(third.rule).toBe("NONE");
  });

  it("⭐⭐ a HOLD breaks the chain too — and the harm is 2septies, not a wrong label", () => {
    // ⛔⛔ NOTHING TESTED THIS BEFORE 2026-09-17: deleting `if (kind === "HOLD")
    // this.taps.reset();` from `release` left every vector in this file green. ⚠ The
    // mechanism was described in three comments and asserted by none — which is exactly the
    // predecessor's failure mode, a claim living in prose instead of in a test.
    //
    // ⭐ THE RULE: a touchpoint that went down, stayed down and fired nothing is not half of
    // a double tap. Without the reset, a tap, a pause, and a tap become a DOUBLE_TAP as
    // though the pause had not happened — and a DOUBLE_TAP is **eviction**.
    // ⛔ THE FIXTURE IS TIMED SO THAT THE RESET IS THE ONLY DEFENCE: the last press lands
    // 140 ms after the FIRST tap's release, well inside `doubleTapWindow`, on the same point.
    // ⚠ Both ways of becoming a HOLD are covered, because they are different code paths:
    // a press held past `tapMaxDuration`, and a press ANOTHER RULE consumed (A10's depth).
    for (const holdVia of ["LONG_PRESS", "CONSUMED"] as const) {
      const pose = recordingPose();
      const taps = new TapHistory(cfg);
      const mk = () => new Recognizer(cfg, pose.port, taps);
      expect(
        gesture(mk(), [
          { x: 100, y: 100, t: 0 },
          { x: 100, y: 100, t: 60 },
        ]).kind,
        holdVia,
      ).toBe("TAP");

      const held = mk();
      if (holdVia === "CONSUMED") {
        held.press({ x: 300, y: 300, t: 100 });
        held.consumeAsMotion();
        expect(held.release({ x: 300, y: 300, t: 140 }).kind, holdVia).toBe("HOLD");
      } else {
        expect(
          gesture(held, [
            { x: 300, y: 300, t: 100 },
            { x: 300, y: 300, t: 500 }, // 400 ms > tapMaxDuration (250 ms)
          ]).kind,
          holdVia,
        ).toBe("HOLD");
      }

      const after = gesture(mk(), [
        { x: 100, y: 100, t: 200 },
        { x: 100, y: 100, t: 260 },
      ]);
      expect(after.kind, holdVia).toBe("TAP");
      expect(after.rule, holdVia).toBe("NONE");
    }
  });

  it("⭐⭐ the double-tap window is measured RELEASE-to-PRESS, never release-to-release", () => {
    // ⛔⛔ `TapHistory.record` stores the first tap's RELEASE time and compares it against the
    // second tap's PRESS time. ⚠ That choice was documented in a `@param` note and pinned by
    // nothing: swapping `press.t` for `releaseT` in the comparison left every vector green,
    // because every fixture in this file used 60 ms taps, where the two readings differ by
    // less than the slack in the window.
    //
    // ⭐⭐⭐ WHY IT IS THE RIGHT CHOICE, which is what makes the vector worth having: the
    // window bounds *how long the user waited between taps*, and the wait ends when the
    // second finger lands. ⛔ Release-to-release adds the SECOND TAP'S OWN DURATION to the
    // measurement, so a deliberate double tap whose second press is slow to lift — a
    // heavier finger, a thicker glove, a tablet under load — silently stops evicting. ⭐ The
    // user's gesture would be correct and the product would simply not answer, which is the
    // hardest kind of defect to report from a device.
    //
    // ⭐ THE FIXTURE SPLITS THE TWO READINGS ON PURPOSE: press at 300 (240 ms after the
    // first release — inside the 300 ms window) and release at 500, so release-to-release is
    // **440 ms** and outside it. ⚠ 200 ms of press is still inside `tapMaxDuration` (250 ms),
    // so the second gesture is genuinely a tap and not a HOLD.
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    expect(
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t: 0 },
        { x: 100, y: 100, t: 60 },
      ]).kind,
    ).toBe("TAP");
    const second = gesture(new Recognizer(cfg, pose.port, taps), [
      { x: 100, y: 100, t: 300 },
      { x: 100, y: 100, t: 500 },
    ]);
    expect(second.kind).toBe("DOUBLE_TAP");
    expect(second.rule).toBe("2septies");
  });
});

describe("⚠ RETIRED BY A12 — roll (2quinte) as a ONE-TOUCHPOINT circular gesture", () => {
  // ⛔⛔ A12 MOVED ROLL TO THE SECOND TOUCHPOINT'S x, so none of this is on the gesture
  // path any more. ⭐ The block is KEPT, and kept GREEN, because the machinery is correct
  // and vectored and the owner may want the circular roll back — `METHOD`: retractions are
  // kept on purpose. ⚠ It no longer proves anything about what the product DOES.
  /** A circular sweep, clockwise on screen, at 15 mm radius. */
  function circle(steps: number, clockwise: boolean, t0 = 0): Sample[] {
    const r = mmToPx(15);
    const dir = clockwise ? 1 : -1;
    const out: Sample[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = ((dir * 5 * i) * Math.PI) / 180;
      out.push({ x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a), t: t0 + i * 10 });
    }
    return out;
  }

  // ⛔⛔ EVERY VECTOR IN THIS SUITE WAS REPLACED ON 2026-09-16, AND THE REASON IS A DEFECT
  // THEY WERE PROTECTING.
  //
  // They asserted that a swept circle commits the roll detector, that `release` then reports
  // `ROLL_KEPT` and **skips the flick test**, and that the provisional yaw/pitch is rebased —
  // §1.3's rules while roll was a one-touchpoint gesture.
  //
  // ⚠ `A12` moved roll to the second touchpoint. The detector was left running and described
  // in the code as *"unused"*: it was not. The veto still fired, so once `IN3`'s 2ter/2quater
  // went live a rotation flick pushed **nothing** whenever the drag had curved enough to
  // commit it — device-reported as *"the face does not point up at rotation flick"* and *"no
  // DOF reduction at the first flick"*, intermittently, because it depended on how curved the
  // drag happened to be.
  //
  // ⭐⭐ A RETIRED GESTURE THAT STILL OWNS A VERDICT IS NOT INERT — the third instance of
  // that shape in one day, and the only one that vetoed a live rule rather than merely
  // misinforming.
  // ⛔ So the detector is no longer fed, `ROLL_KEPT` no longer exists, and these vectors'
  // SUBJECT is gone. They are deleted rather than adjusted: a vector whose subject no longer
  // exists is a liability. What replaced them is the behaviour that now holds.

  it("⭐ A CURVED DRAG IS JUDGED BY THE FLICK TEST LIKE ANY OTHER", () => {
    // ⛔ It used to be exempt by rule. Now a swept circle that ends without a flick keeps its
    // motion, exactly as a straight slow drag does — no special case in either direction.
    const { rec, pose } = fresh();
    const samples = circle(70, true);
    rec.press(samples[0]!);
    for (const s of samples.slice(1, -1)) rec.move(s);
    pose.moveProvisionally(42);
    const v = rec.release(samples[samples.length - 1]!);
    expect(v.kind).toBe("CONTINUOUS_KEPT");
    expect(v.rolledBack).toBe(false);
    expect(pose.current()).toBe(42);
  });

  it("⛔⛔ A SWEEP FOLLOWED BY A FAST STRAIGHT RUN **IS** A FLICK — and that is deliberate", () => {
    // ⭐⭐⭐ THIS VECTOR HAS BEEN TRUE BOTH WAYS IN ONE DAY, AND THE HISTORY IS THE POINT.
    //
    // ⛔ §1.3 once SKIPPED the flick test after a committed roll, with a comment saying a
    // circular path *"fails the purity ratio anyway"* and that the explicit skip existed
    // *"rather than relying on that happening to hold"*. `D31` deleted the roll, so the skip
    // went with it, and this vector then recorded that the purity ratio happened to reject
    // one measured curve — stating plainly that it proved nothing about curves in general.
    //
    // ⭐ It did not hold for long: the device asked for *"the flick should be triggerable
    // during an ongoing rotation"*, which is the SAME QUESTION from the other side. A flick
    // is now read over the longest TAIL that passes rather than over the whole window, so a
    // curve that ends in a fast straight run does flick — by design, because that is what a
    // hand rotating an object and then flicking a face looks like.
    //
    // ⚠⚠ WHAT PROTECTS AN ALIGNMENT FROM AN ACCIDENT IS NOW THREE THINGS, none of them the
    // purity ratio: the tail's MINIMUM SPAN (`flickLiftWindow`), `ShakeDetector.suppressesFlick`
    // from the first reversal, and eviction as the escape (`D32`). ⭐ That is a better answer
    // than a skip — each is a separate, testable statement — and it is the owner's report
    // that forced it rather than my reasoning.
    const { rec } = fresh();
    const swept = circle(70, true);
    rec.press(swept[0]!);
    for (const s of swept.slice(1)) rec.move(s);
    const last = swept[swept.length - 1]!;
    for (let k = 1; k <= 5; k++) {
      rec.move({ x: last.x, y: last.y - 8 * k, t: last.t + 8 * k });
    }
    const v = rec.release({ x: last.x, y: last.y - 48, t: last.t + 48 });
    expect(v.kind).toBe("FLICK");
    expect(v.flick?.axis).toBe("VERTICAL");

    // ⛔ AND THE CURVE ALONE STILL IS NOT ONE — without the straight exit, the same sweep
    // keeps its motion. ⭐ The tail scan did not make everything a flick; it made the TAIL
    // the subject, and a tail that is still curving fails the purity ratio exactly as before.
    const { rec: rec2 } = fresh();
    rec2.press(swept[0]!);
    for (const s of swept.slice(1, -1)) rec2.move(s);
    expect(rec2.release(swept[swept.length - 1]!).kind).toBe("CONTINUOUS_KEPT");
  });

  it("⛔⛔ THE ROLL MACHINERY IS GONE FROM THE RECOGNIZER'S SURFACE, not merely unfed", () => {
    // ⭐⭐ First the detector stopped being fed; then the owner said *"clean the roll also
    // for fork A"* and it was DELETED — `roll.ts`, `one_euro.ts`, the four getters, the
    // rebase, the pose history and six tunables with them.
    // ⛔ So the guard is on the SURFACE: a later session cannot wire a dormant detector back
    // believing it was intended, because there is nothing to wire. ⚠ `D28`'s rule, applied
    // again — deleted, not disabled.
    const { rec } = fresh();
    const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(rec));
    for (const gone of [
      "rollDeg",
      "rollCommitted",
      "rollSmoothedDeg",
      "rollAppliedDeg",
      "rebaseOnRollCommit",
      "rollRebased",
    ]) {
      expect(surface).not.toContain(gone);
    }
  });

});

describe("release-time priority (§1.3)", () => {
  const flick = (axis: "HORIZONTAL" | "VERTICAL"): Flick => ({
    axis,
    sign: 1,
    travelMm: 20,
    liftSpeedMmPerS: 400,
    purity: 9,
  });
  const ctx = (o: Partial<ReleaseContext>): ReleaseContext => ({
    ...NO_RELEASE_CONTEXT,
    ...o,
  });

  it("a DOUBLE_TAP fires 2septies", () => {
    expect(resolveDiscreteRule("DOUBLE_TAP", null, ctx({}), cfg)).toBe("2septies");
  });

  it("a VERTICAL flick on one object fires 2ter (gravity)", () => {
    const r = resolveDiscreteRule("FLICK", flick("VERTICAL"), ctx({ singleObjectSelected: true }), cfg);
    expect(r).toBe("2ter");
  });

  it("a HORIZONTAL flick on one object fires 2quater (world axis)", () => {
    const r = resolveDiscreteRule("FLICK", flick("HORIZONTAL"), ctx({ singleObjectSelected: true }), cfg);
    expect(r).toBe("2quater");
  });

  it("⭐ 6quater OUTRANKS 2ter when the mate context holds and the flick is directed", () => {
    const r = resolveDiscreteRule(
      "FLICK",
      flick("VERTICAL"),
      ctx({
        singleObjectSelected: true, // 2ter would otherwise fire
        mateContextAvailable: true,
        mateDirectionPurity: cfg.mateDirectionPurity + 1,
      }),
      cfg,
    );
    expect(r).toBe("6quater");
  });

  it("⚠ an UNDIRECTED flick in a mate context falls THROUGH to 2ter", () => {
    // It must not swallow the gesture: a user with two objects selected would then
    // have no way to set a gravity anchor at all.
    const r = resolveDiscreteRule(
      "FLICK",
      flick("VERTICAL"),
      ctx({
        singleObjectSelected: true,
        mateContextAvailable: true,
        mateDirectionPurity: cfg.mateDirectionPurity - 0.5,
      }),
      cfg,
    );
    expect(r).toBe("2ter");
  });

  it("a flick with nothing selected fires nothing", () => {
    expect(resolveDiscreteRule("FLICK", flick("VERTICAL"), ctx({}), cfg)).toBe("NONE");
  });

  it("⛔ EXACTLY ONE rule can come back — the kinds that keep motion fire none", () => {
    for (const kind of ["CONTINUOUS_KEPT", "TAP", "HOLD"] as const) {
      expect(
        resolveDiscreteRule(
          kind,
          flick("VERTICAL"),
          ctx({ singleObjectSelected: true, mateContextAvailable: true, mateDirectionPurity: 9 }),
          cfg,
        ),
      ).toBe("NONE");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⛔⛔ A10: A DEPTH PUSH HOLDS THE FINGER STILL ON THE OBJECT — WHICH IS A TAP'S SHAPE
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ a gesture ANOTHER RULE consumed is never a tap", () => {
  /**
   * ⭐ Why this exists, stated as a consequence rather than as a rule: A10 says depth runs
   * while the finger on the object is STILL. §1.3 says a touchpoint that never committed
   * and lifts inside `tapMaxDuration` is a TAP, and two of those are a DOUBLE_TAP — which
   * `resolveDiscreteRule` maps to **2septies**, eviction. ⛔ So without this, a quick depth
   * nudge, twice, would clear constraints the user never touched.
   */
  const pressAndLift = (rec: ReturnType<typeof fresh>["rec"], t0: number, consumed: boolean) => {
    rec.press({ x: 300, y: 300, t: t0 });
    if (consumed) rec.consumeAsMotion();
    return rec.release({ x: 300, y: 300, t: t0 + 40 });
  };

  it("⛔ a consumed press releases as HOLD, not TAP", () => {
    const { rec } = fresh();
    expect(pressAndLift(rec, 0, true).kind).toBe("HOLD");
  });

  it("⭐ COUNTER-EXAMPLE: the identical press, NOT consumed, is a TAP", () => {
    // ⚠ Without this the vector above would pass for a recognizer that had simply
    // stopped producing taps at all.
    const { rec } = fresh();
    expect(pressAndLift(rec, 0, false).kind).toBe("TAP");
  });

  it("⛔⛔ two consumed pushes are NOT a DOUBLE_TAP — so they cannot evict", () => {
    // ⛔⛔⛔ **THIS VECTOR TESTED NOTHING UNTIL 2026-09-17, AND THE REASON IS ONE WORD.** It
    // is repaired in place; the trap is the record.
    //
    // ⚠ IT CALLED `fresh()` TWICE — and `fresh()` builds a recognizer **and its own
    // `TapHistory`**. So the second push was asked whether it was the second half of a
    // double tap using a history that had never seen the first one. ⛔⛔ THE SUBJECT OF THIS
    // VECTOR IS THE SHARED HISTORY: `TapHistory` exists precisely because two taps are two
    // pointer ids, and handing each push a private one removes the only thing under test.
    // ⭐ It could not have gone red for any change to the tap chain, because there was no
    // chain — a second-half assertion against an empty history is `expect(true)`.
    //
    // ⭐⭐ `METHOD`: *a fixture that isolates the component also isolates the bug.* This is
    // mistake shape 5 — my own fixtures — in its quietest form: nothing about the code was
    // idealised, the WIRING was.
    //
    // ⭐ REPAIRED: ONE history, three recognizers, exactly as the product wires them — one
    // `TapHistory` shared across every touchpoint. ⚠ And `rule` is asserted as well as
    // `kind`, because the harm is not a mislabelled verdict, it is **2septies eviction**:
    // a hand that nudged an object closer twice would lose the alignments it just built.
    //
    // ⭐⭐ A GENUINE TAP OPENS THE SEQUENCE AND A GENUINE TAP CLOSES IT, which is what gives
    // the shared history something to carry. ⛔ Two depth pushes cannot evict *by
    // themselves*; the case that bites is the one where a real tap is already on the chain
    // when the pushes happen, and the tap that follows them inherits it. With the histories
    // private that sequence was unrepresentable. Deleting `if (kind === "HOLD")
    // this.taps.reset();` now turns this red.
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const mk = () => new Recognizer(cfg, pose.port, taps);
    expect(
      gesture(mk(), [
        { x: 100, y: 100, t: 0 },
        { x: 100, y: 100, t: 60 },
      ]).kind,
    ).toBe("TAP");
    expect(pressAndLift(mk(), 100, true).kind).toBe("HOLD");
    const second = pressAndLift(mk(), 200, true);
    expect(second.kind).toBe("HOLD");
    expect(second.rule).toBe("NONE");
    // ⭐ ...and the chain the two pushes passed through is BROKEN, so the next real tap is a
    // first tap. ⚠ 300 − 60 = 240 ms: inside `doubleTapWindow`, on the same point, so only
    // the reset stands between this and an eviction nobody asked for.
    const later = gesture(mk(), [
      { x: 100, y: 100, t: 300 },
      { x: 100, y: 100, t: 360 },
    ]);
    expect(later.kind).toBe("TAP");
    expect(later.rule).toBe("NONE");
  });

  it("⭐ it does NOT commit the gesture — the finger may still drag afterwards", () => {
    // ⚠ Consuming says "someone else supplied motion", not "this gesture is over".
    const { rec } = fresh();
    const moving = run({ speedMmPerS: 40, ms: 200 });
    rec.press(moving[0]!);
    rec.consumeAsMotion();
    for (const s of moving.slice(1)) rec.move(s);
    expect(rec.currentPhase).toBe("COMMITTED_CONTINUOUS");
  });
});
