/**
 * ⭐⭐⭐ (2026-11-25, `Claude/40_RENDER_SCENE/spec/APPROACH_CAMERA_JITTER.md` §7.3 D-J5, packet 2a) THE WAY OUT'S END REACHES THE PICTURE (`pictureHandWhole` 1):
 * the way out's turn (`asmZoneMix.out`) is nulled by the logic on the frame its progress reaches 1 (`seamOutFrame`: its share written 1, then nulled),
 * before the camera's stage reads it — so the last share the picture read was ≈ 0.986, and ≈ 1.4 % of the hand-over stayed held until his finger next
 * moved (then closed over his mm; under A1-a ≈ 2.8 mm of the look point). Now the picture keeps the turn it read (`outTurn`) and on the frame it is gone with
 * its own progress whole reads its end, 1, once (`wayOutShare`): one owner, the turn's own end.
 * Red first (each recorded in the study's §7.4): today's read (the end unread); the end read on any turn gone (a turn replaced short of whole); the switch
 * ignored.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dirAtHeading, followPose } from "../src/input/camera_follow";
import { meridianUp, PICTURE_CONE_DEG, PICTURE_REST, pictureStep, wayOutShare, type PicturePose, type PictureState, type WayOutTurn } from "../src/input/picture";
import { seamOutShare } from "../src/input/seam_turn";

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => mul(a, 1 / len(a));
const viewOf = (p: PicturePose): Vec3 => unit(sub(p.eye, p.look));
const ang = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) / DEG;
const sq = (u: Vec3, d: Vec3): Vec3 => {
  const k = u[0] * d[0] + u[1] * d[1] + u[2] * d[2];
  return unit([u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]]);
};

const FOOT: Vec3 = [0.15, 0.545, 0.17];
const LOOK_F: Vec3 = [0.143, 0.541, 0.172];
const LOOK_G: Vec3 = [-0.048, 0.552, 0.167];
const HANG = 0.65;
const GAP = 1.25;
const OY = 2.5 * DEG;
const OP = 2 * DEG;
const US = dirAtHeading(70 * DEG, 83.7 * DEG);
const D_FAR = dirAtHeading(91.46 * DEG, 60 * DEG);
const F = followPose(D_FAR, LOOK_F, FOOT, HANG, GAP, OY, OP);
const VG = dirAtHeading(85.02 * DEG, 67.12 * DEG);
const G: PicturePose = { eye: add(LOOK_G, mul(VG, 1.911)), look: LOOK_G, up: sq(meridianUp(VG, 85.02 * DEG), VG), piece: add(FOOT, mul(US, HANG)) };

/** the way out's progress each frame of its turn: 0.0775 a frame (the one speed after the lift), the last read 0.93 (share 0.986), then whole */
const P_STEPS = Array.from({ length: 13 }, (_, i) => Math.min(1, 0.0775 * (i + 1)));

interface Row {
  readonly pose: PicturePose;
  readonly s: PictureState;
  readonly share: number | null;
}

/**
 * Latched 3 frames, the unlatch (its way out's turn born the frame after), the turn's frames (its object mutated by the logic as `seamOutFrame` does — the
 * share written, then nulled at progress 1), then `after` frames with his finger still. The picture reads the share as the wiring does (`wayOutShare` on
 * the turn alive and the one kept from last frame — kept only while alive). `end`: `pictureHandWhole` 1 (the end read).
 */
function play(end: boolean, after: number, replaceAt = -1): Row[] {
  let s: PictureState = PICTURE_REST;
  const rows: Row[] = [];
  const base = { w: 0, dFar: D_FAR, us: US, look: LOOK_F, foot: FOOT, hang: HANG, gapM: GAP, offYawRad: OY, offPitchRad: OP, spanMm: 10, coneDeg: PICTURE_CONE_DEG, whole: true } as const;
  for (let i = 0; i < 3; i++) {
    const r = pictureStep(s, { ...base, F: null, G, latched: true, share: 0, mm: 0 });
    s = r.state;
    rows.push({ pose: r.pose, s, share: 0 });
  }
  let kept: WayOutTurn | undefined;
  const frame = (now: WayOutTurn | null, mm: number): void => {
    const share = wayOutShare(now, kept, end);
    const r = pictureStep(s, { ...base, F, G, latched: false, share, mm });
    s = r.state;
    rows.push({ pose: r.pose, s, share });
    kept = end && now !== null && now.out !== undefined ? now : undefined;
  };
  frame(null, 0.5); // the unlatch
  const turn: { k: number; out: { p: number } } = { k: 0, out: { p: 0 } };
  for (let i = 0; i < P_STEPS.length; i++) {
    turn.out.p = P_STEPS[i]!;
    turn.k = seamOutShare(turn.out.p);
    if (i === replaceAt) {
      frame({ k: 0.2 }, 0); // the turn REPLACED short of whole by another (not a way out): nothing read from the old one
      for (let j = 0; j < after; j++) frame(null, 0);
      return rows;
    }
    frame(turn.out.p >= 1 ? null : turn, 0);
  }
  for (let j = 0; j < after; j++) frame(null, 0);
  return rows;
}
const END = 3 + 1 + P_STEPS.length - 1; // the frame the turn ends (gone, its progress whole)

describe("⭐⭐⭐ D-J5 — `wayOutShare`: the turn's own share while it lives, its end (1) once, else none", () => {
  const alive: WayOutTurn = { k: 0.4, out: { p: 0.5 } };
  const whole: WayOutTurn = { k: 1, out: { p: 1 } };
  const short: WayOutTurn = { k: 0.6, out: { p: 0.55 } };
  const other: WayOutTurn = { k: 0.3 };
  it("the table", () => {
    expect(wayOutShare(alive, undefined, true)).toBe(0.4);
    expect(wayOutShare(alive, whole, true)).toBe(0.4); // a new way out alive: its own share
    expect(wayOutShare(null, whole, true)).toBe(1); // the frame it ends: its end
    expect(wayOutShare(other, whole, true)).toBe(1); // ended, another kind of turn begun the same frame: the end still read
    expect(wayOutShare(null, short, true)).toBeNull(); // gone short of whole (replaced, cancelled): none — his mm
    expect(wayOutShare(null, other, true)).toBeNull();
    expect(wayOutShare(null, undefined, true)).toBeNull();
    expect(wayOutShare(null, whole, false)).toBeNull(); // the switch at 0
  });

  it("at 0 exactly today's read (the turn alive's share, else none) for every turn alive and kept", () => {
    const turns: (WayOutTurn | null)[] = [null, alive, whole, short, other];
    for (const now of turns) for (const was of [...turns, undefined]) expect(wayOutShare(now, was, false)).toBe(now !== null && now.out !== undefined ? now.k : null);
  });
});

describe("⭐⭐⭐ D-J5 — the way out's end reaches the picture on the frame its turn ends", () => {
  it("the last share read 0.986; on the end frame the hand-over's share left 0 — the pose drawn the follower's own (today 0.014 held: the look point 2.8 mm off)", () => {
    const a = play(true, 6);
    const b = play(false, 6);
    expect(a[END - 1]!.share).toBeCloseTo(0.986, 3);
    expect(a[END]!.share).toBe(1);
    expect(a[END]!.s.hand!.r).toBe(0);
    expect(len(sub(a[END]!.pose.look, F.look))).toBeLessThan(1e-12);
    expect(len(sub(a[END]!.pose.piece, F.piece))).toBeLessThan(1e-12);
    expect(ang(viewOf(a[END]!.pose), viewOf(F))).toBeLessThan(1e-4); // acos at 1: its noise
    // today: the end unread, his finger still — the 1.4 % held on every frame after
    expect(b[END]!.share).toBeNull();
    for (const r of b.slice(END)) {
      expect(r.s.hand!.r).toBeCloseTo(1 - 0.986, 3);
      expect(len(sub(r.pose.look, F.look)) * 1000).toBeGreaterThan(2.5);
    }
  });

  it("read once: the frames after the end read none (his mm), the hand-over stays closed", () => {
    const a = play(true, 6);
    for (const r of a.slice(END + 1)) {
      expect(r.share).toBeNull();
      expect(r.s.hand!.r).toBe(0);
    }
  });

  it("a turn replaced short of whole: nothing read from it (today's read)", () => {
    const a = play(true, 3, 6);
    const b = play(false, 3, 6);
    expect(a.map((r) => r.share)).toEqual(b.map((r) => r.share));
    expect(a.map((r) => r.pose)).toEqual(b.map((r) => r.pose));
  });

  it("the end frame's step is the turn's own last step (1.4 % of the hand-over): under 1° and 3 mm", () => {
    const a = play(true, 2);
    expect(ang(viewOf(a[END - 1]!.pose), viewOf(a[END]!.pose))).toBeLessThan(1);
    expect(len(sub(a[END]!.pose.look, a[END - 1]!.pose.look)) * 1000).toBeLessThan(3);
  });
});

describe("⭐⭐⭐ D-J5 — the wiring (source)", () => {
  const raw = (f: string): string => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
  it("both drawers read the share through `wayOutShare` under `pictureHandWhole`; the turn kept only while alive, only at 1; the logic writes its end before nulling it", () => {
    const p = raw("render/picture_wiring.ts");
    expect(p).toContain("const share = wayOutShare(zmO, was?.outTurn, st.cfg.pictureHandWhole === 1);");
    expect(p).toContain(": wayOutShare(zm, was?.outTurn, st.cfg.pictureHandWhole === 1);");
    expect(p).toContain("(st.cfg.pictureHandWhole === 1 && z !== null && z.out !== undefined ? { outTurn: z } : {});");
    expect(p).toContain("...outKept(zmO), ...(bandOff ? { bandHeld: true } : {}) };");
    expect(p).toContain("...outKept(zm), ...(bandOff ? { bandHeld: true } : {}) };");
    const w = raw("render/assembly_wiring.ts");
    expect(w).toContain("zm.k = seamOutShare(o.p); zm.done = zm.k * whole; if (o.p >= 1) st.asmZoneMix = null;");
    expect(seamOutShare(1)).toBe(1);
  });
});
