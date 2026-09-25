/**
 * GOLDEN VECTORS — **THE DISCONTINUITY DETECTOR**, a standing readout rather than an open defect:
 * the report that prompted it (*"one of the objects has made a big jump"*) was **withdrawn** the
 * same day, and its ledger entry deleted with it.
 *
 * ⛔⛔ **AN INSTRUMENT IS A SUSPECT, ALWAYS** — `METHOD`'s most expensive carried lesson, and this
 * file is where it is paid. ⚠ A detector that cries wolf on an ordinary drag would send the next
 * session chasing nothing, and one that stays quiet through a real jump would cost another device
 * pass. Both failure directions are vectored below.
 */
import { describe, expect, it } from "vitest";
import {
  JumpWatch,
  stepDegrees,
  JUMP_FACTOR,
  JUMP_FLOOR_MM,
} from "@input/jump_watch";
import { IDENTITY, qFromAxisAngle, type Quat, type Vec3 } from "@core/vec";

const at = (mm: number): Vec3 => [mm / 1000, 0, 0];
/** ⚠ Feed `n` steady frames of a drag at `mmPerFrame`, and return the watch mid-drag. */
const drag = (w: JumpWatch<string>, n: number, mmPerFrame: number, from = 0) => {
  let x = from;
  for (let i = 0; i < n; i++) {
    x += mmPerFrame;
    w.note("a", at(x), IDENTITY);
  }
  return x;
};

describe("⭐⭐⭐ a jump is a DISCONTINUITY, not a speed", () => {
  it("⛔⛔⛔ A FAST STEADY DRAG IS NEVER A JUMP — 30 mm a frame, forever", () => {
    // ⚠⚠ THE FALSE-ALARM VECTOR, and it is the one that matters most. A drag at 500 mm/s covers
    // 30 mm in a 60 ms frame — well over the absolute floor — and a `FOLLOW` follower is
    // *supposed* to move exactly as far as its Pioneer did. ⛔ A fixed threshold would call all
    // of that a jump, and the readout would be worthless on the first gesture.
    const w = new JumpWatch<string>();
    w.note("a", at(0), IDENTITY);
    for (let i = 1; i <= 60; i++)
      expect(w.note("a", at(i * 30), IDENTITY)).toBeNull();
  });

  it("⭐⭐⭐ AND A REAL DISCONTINUITY IS CAUGHT — a drag that teleports mid-stroke", () => {
    const w = new JumpWatch<string>();
    w.note("a", at(0), IDENTITY);
    const x = drag(w, 20, 4);
    const jump = w.note("a", at(x + 200), IDENTITY);
    expect(jump).not.toBeNull();
    expect(jump!.id).toBe("a");
    expect(jump!.mm).toBeCloseTo(200, 6);
    // ⭐ And it reports what the body HAD been doing, which is the half that makes the readout
    // diagnosable rather than just alarming.
    expect(jump!.usualMm).toBeCloseTo(4, 6);
  });

  it("⛔⛔ A JUMP CANNOT RAISE THE BAR THAT CATCHES IT — nor hide the next one", () => {
    // ⚠⚠ `METHOD`: *a statistic pooled across a region cannot answer a question about it.* The
    // first build measured against a window that already contained the step under test.
    // ⭐ RED against pushing the sample before taking the median.
    const w = new JumpWatch<string>();
    w.note("a", at(0), IDENTITY);
    const x = drag(w, 20, 4);
    expect(w.note("a", at(x + 200), IDENTITY)).not.toBeNull();
    // ⛔ One outlier is now in the window; the MEDIAN is why the next one is still caught.
    expect(w.note("a", at(x + 400), IDENTITY)).not.toBeNull();
  });

  it("⛔ A BODY AT REST TWITCHING BY A MILLIMETRE IS NOT NEWS — the absolute floor", () => {
    // ⚠ Without a floor, `usualMm × factor` is zero for a still body and every wake-up is a jump.
    const w = new JumpWatch<string>();
    for (let i = 0; i < 10; i++) w.note("a", at(0), IDENTITY);
    expect(w.note("a", at(JUMP_FLOOR_MM - 1), IDENTITY)).toBeNull();
    expect(w.note("a", at(JUMP_FLOOR_MM * 3), IDENTITY)).not.toBeNull();
  });

  it("⛔ the FIRST frames of a body say nothing — it has no scale yet", () => {
    // ⚠ Otherwise the first movement of every gesture, from a standing start, is a jump.
    const w = new JumpWatch<string>();
    expect(w.note("a", at(0), IDENTITY)).toBeNull();
    expect(w.note("a", at(3), IDENTITY)).toBeNull();
  });

  it("⭐ the exact factor, either side — and it is the BODY's own scale, not a constant", () => {
    // ⛔ RED against a fixed threshold: the same 30 mm step is ordinary for one body and a jump
    // for another, and which is which depends only on what each had been doing.
    const busy = new JumpWatch<string>();
    busy.note("a", at(0), IDENTITY);
    const bx = drag(busy, 20, 10);
    expect(busy.note("a", at(bx + 10 * (JUMP_FACTOR - 1)), IDENTITY)).toBeNull();
    const calm = new JumpWatch<string>();
    calm.note("a", at(0), IDENTITY);
    const cx = drag(calm, 20, 2);
    expect(calm.note("a", at(cx + 2 * (JUMP_FACTOR + 2)), IDENTITY)).not.toBeNull();
  });
});

describe("⭐⭐ rotation is watched on the same terms", () => {
  const spin = (deg: number): Quat =>
    qFromAxisAngle([0, 1, 0], (deg * Math.PI) / 180);

  it("⭐ stepDegrees is the SHORTEST arc, and it is symmetric", () => {
    expect(stepDegrees(IDENTITY, spin(30))).toBeCloseTo(30, 6);
    expect(stepDegrees(spin(30), IDENTITY)).toBeCloseTo(30, 6);
    // ⛔ 350° one way is 10° the other — a body that turns 10° must not read as a jump because
    // the arithmetic took the long way round.
    expect(stepDegrees(IDENTITY, spin(350))).toBeCloseTo(10, 6);
  });

  it("⛔⛔ A STEADY SPIN IS NOT A JUMP, AND A SNAP-BACK IS", () => {
    // ⚠ The configuration the owner's report is about: a body being turned by a finger, then
    // something writing an ABSOLUTE orientation over it in one frame.
    const w = new JumpWatch<string>();
    w.note("a", [0, 0, 0], IDENTITY);
    for (let i = 1; i <= 20; i++)
      expect(w.note("a", [0, 0, 0], spin(i * 3))).toBeNull();
    const jump = w.note("a", [0, 0, 0], spin(20 * 3 + 90));
    expect(jump).not.toBeNull();
    expect(jump!.deg).toBeCloseTo(90, 5);
    expect(jump!.usualDeg).toBeCloseTo(3, 5);
  });
});

describe("⛔ housekeeping", () => {
  it("a forgotten body starts clean — an id must not inherit a history", () => {
    const w = new JumpWatch<string>();
    w.note("a", at(0), IDENTITY);
    drag(w, 20, 1);
    w.forget("a");
    // ⚠ First sighting again, so no verdict however far it is from where it was.
    expect(w.note("a", at(9999), IDENTITY)).toBeNull();
  });

  it("two bodies keep separate scales", () => {
    const w = new JumpWatch<string>();
    w.note("a", at(0), IDENTITY);
    w.note("b", at(0), IDENTITY);
    for (let i = 1; i <= 20; i++) {
      w.note("a", at(i * 20), IDENTITY);
      w.note("b", at(i * 1), IDENTITY);
    }
    // ⭐ The same 60 mm step: ordinary for the busy body, a jump for the calm one.
    expect(w.note("a", at(20 * 20 + 60), IDENTITY)).toBeNull();
    expect(w.note("b", at(20 * 1 + 60), IDENTITY)).not.toBeNull();
  });

  it("⛔ a non-finite pose is refused rather than propagated", () => {
    const w = new JumpWatch<string>();
    w.note("a", at(0), IDENTITY);
    drag(w, 10, 2);
    expect(w.note("a", [Number.NaN, 0, 0], IDENTITY)).toBeNull();
  });
});
