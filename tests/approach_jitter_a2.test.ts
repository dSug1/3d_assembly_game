/**
 * ⭐⭐⭐ (2026-11-25, `Claude/40_RENDER_SCENE/spec/APPROACH_CAMERA_JITTER.md` §4.2, §7 D-J2 — A2-a, packet 1) THE BAND, THE WAY IN'S RULE ONLY
 * (`pictureBandWayIn` 1): at the unlatch the hand-over measured its gap against rule 1's pose at w ≈ 1 (the logic's elevation — near the vertical the camera's
 * yaw offset turns its heading ≈ 23°), which the band then moved by PLACE while the offset was closed by the way out's share: two payers of one gap — the view
 * ≈ 14° away and back (`09fv_r01`, §3.2 A2). Now the band's share is held at 0 from the unlatch until the piece is beyond the band's far edge or latches
 * again (`bandHeld`): the follower's own pose the owner, the hand-over reads the TRUE gap, the way out's share its one payer.
 * The frames below are `09fv_r01`'s way out in numbers (the follower's view 79.1°, 64.9°; G's 0.2°, 2.2° from it, 191 mm off; the logic's elevation 83.7°;
 * the camera's offsets 2.5° / 2°), his finger 0.5 mm a frame, the way out's share a smoothstep of his out mm over 12 mm, by time after the lift (C3).
 * Red first (each recorded in the study's §7.1): the hold kept for the unlatch's frame only; re-armed at any w under 1; not cleared at the latch; set on the
 * way in as well; the switch ignored.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dirAtHeading, followPose } from "../src/input/camera_follow";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { bandHeld, bandShare, meridianUp, PICTURE_CONE_DEG, PICTURE_REST, pictureStep, type PicturePose, type PictureState } from "../src/input/picture";

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => mul(a, 1 / len(a));
const viewOf = (p: PicturePose): Vec3 => unit(sub(p.eye, p.look));
const head = (v: Vec3): number => Math.atan2(v[0], v[2]) / DEG;
const elv = (v: Vec3): number => Math.asin(Math.max(-1, Math.min(1, v[1]))) / DEG;
const ang = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) / DEG;
const sq = (u: Vec3, d: Vec3): Vec3 => {
  const k = u[0] * d[0] + u[1] * d[1] + u[2] * d[2];
  return unit([u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]]);
};
const sm = (x: number): number => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

const FOOT: Vec3 = [0.15, 0.545, 0.17];
const LOOK_F: Vec3 = [0.143, 0.541, 0.172];
const LOOK_G: Vec3 = [-0.048, 0.552, 0.167];
const HANG = 0.65;
const GAP = 1.25;
const OY = 2.5 * DEG;
const OP = 2 * DEG;
const BAND = 10;
const US = dirAtHeading(70 * DEG, 83.7 * DEG);
const D_FAR = dirAtHeading(85 * DEG, 63 * DEG);
const F = followPose(D_FAR, LOOK_F, FOOT, HANG, GAP, OY, OP);
const VF = viewOf(F);
const VG = dirAtHeading((head(VF) + 0.2) * DEG, (elv(VF) + 2.2) * DEG);
const G: PicturePose = { eye: add(LOOK_G, mul(VG, 1.911)), look: LOOK_G, up: sq(meridianUp(VG, head(VG) * DEG), VG), piece: add(FOOT, mul(US, HANG)) };

interface Row {
  readonly latched: boolean;
  readonly out: number;
  readonly wPlace: number;
  readonly w: number;
  readonly held: boolean;
  readonly pose: PicturePose;
  readonly s: PictureState;
}

/** The picture through a script of frames — each [latched, his out mm beyond the unlatch, the way out's share (null: none), his mm this frame] — the band
 *  held as the wiring holds it (`bandHeld`: the unlatch read off the hand-over's last owner). `on`: `pictureBandWayIn` 1; `whole`: `pictureHandWhole` 1. */
function play(on: boolean, whole: boolean, script: readonly (readonly [boolean, number, number | null, number])[]): Row[] {
  let s: PictureState = PICTURE_REST;
  let held = false;
  const rows: Row[] = [];
  for (const [latched, out, share, mm] of script) {
    const wPlace = bandShare(out, BAND);
    held = bandHeld(on, held, s.hand !== null && s.hand.latched && !latched, latched, wPlace);
    const w = held ? 0 : wPlace;
    const r = pictureStep(s, {
      w,
      dFar: D_FAR,
      F: latched ? null : F,
      us: US,
      look: LOOK_F,
      foot: FOOT,
      hang: HANG,
      gapM: GAP,
      offYawRad: OY,
      offPitchRad: OP,
      G,
      latched,
      share,
      mm,
      spanMm: BAND,
      coneDeg: PICTURE_CONE_DEG,
      ...(whole ? { whole: true } : {}),
    });
    s = r.state;
    rows.push({ latched, out, wPlace, w, held, pose: r.pose, s });
  }
  return rows;
}

type Frame = readonly [boolean, number, number | null, number];
/** latched (pending) 5 frames; the unlatch (out 0.5 mm, no way out's share yet); out at 0.5 mm a frame to `stop`; still pressed 6 frames; the lift (the share by time, 0.12 a frame) */
function wayOut(stop: number): Frame[] {
  const f: Frame[] = [];
  for (let i = 0; i < 5; i++) f.push([true, -1, 0, 0]);
  let out = 0.5;
  f.push([false, out, null, 0.5]);
  while (out < stop - 1e-9) {
    out += 0.5;
    f.push([false, out, sm((out - 1) / 12), 0.5]);
  }
  let k = sm((out - 1) / 12);
  for (let i = 0; i < 6; i++) f.push([false, out, k, 0]);
  while (k < 1) {
    k = Math.min(1, k + 0.12);
    f.push([false, out, k, 0]);
  }
  for (let i = 0; i < 4; i++) f.push([false, out, null, 0]);
  return f;
}
/** the largest swing of the drawn heading outside the span from its value at the unlatch to its value at the end (deg) */
function excursion(rows: readonly Row[], from: number): number {
  const h = rows.slice(from).map((r) => head(viewOf(r.pose)));
  const lo = Math.min(h[0]!, h[h.length - 1]!);
  const hi = Math.max(h[0]!, h[h.length - 1]!);
  return Math.max(...h.map((x) => Math.max(0, lo - x, x - hi)));
}
const UNLATCH = 5;

describe("⭐⭐⭐ A2-a (D-J2) — `bandHeld`: set at the unlatch, kept until beyond the band's far edge or a latch, never on the way in, nothing at 0", () => {
  it("the table", () => {
    expect(bandHeld(true, false, true, false, 0.99)).toBe(true); // the unlatch
    expect(bandHeld(true, true, false, false, 0.5)).toBe(true); // in the band after it
    expect(bandHeld(true, true, false, false, 1)).toBe(true); // back between the unlatch and the latch
    expect(bandHeld(true, true, false, false, 0)).toBe(false); // (a) beyond the far edge: re-armed
    expect(bandHeld(true, true, false, true, 1)).toBe(false); // (b) latched again
    expect(bandHeld(true, false, false, false, 0.5)).toBe(false); // the way in from far
    expect(bandHeld(false, true, true, false, 0.5)).toBe(false); // the switch at 0
  });
});

describe("⭐⭐⭐ A2-a (D-J2) — through the way out the band pays nothing: one payer, the view monotonic", () => {
  it("from the unlatch the band's share 0 while the piece is in it; the hand-over reads the TRUE gap (0.2°, 2.2° — today 23.7°, −17.8°)", () => {
    const a = play(true, false, wayOut(5));
    const b = play(false, false, wayOut(5));
    for (const r of a.slice(UNLATCH)) {
      expect(r.wPlace).toBeGreaterThan(0);
      expect(r.w).toBe(0);
    }
    expect(Math.abs(a[UNLATCH]!.s.hand!.dh! / DEG)).toBeLessThan(0.5);
    expect(Math.abs(a[UNLATCH]!.s.hand!.de! / DEG)).toBeLessThan(2.5);
    expect(Math.abs(b[UNLATCH]!.s.hand!.dh! / DEG)).toBeGreaterThan(20);
  });

  it("the drawn heading monotonic toward its end — no excursion over 2° (today 13°); after the lift no step over 1° (today 2.8°)", () => {
    for (const stop of [5, 14]) {
      const a = play(true, false, wayOut(stop));
      const b = play(false, false, wayOut(stop));
      expect(excursion(a, UNLATCH)).toBeLessThan(2);
      expect(excursion(b, UNLATCH)).toBeGreaterThan(10);
      for (let i = UNLATCH + 1; i < a.length; i++) expect(ang(viewOf(a[i - 1]!.pose), viewOf(a[i]!.pose))).toBeLessThan(1);
    }
    const b = play(false, false, wayOut(5));
    expect(Math.max(...b.slice(UNLATCH + 1).map((r, i) => ang(viewOf(b[UNLATCH + i]!.pose), viewOf(r.pose))))).toBeGreaterThan(2);
  });

  it("with A1-a too (both switches): the unlatch's first frame the last drawn within 1 mm, then monotonic", () => {
    const a = play(true, true, wayOut(5));
    const l = a[UNLATCH - 1]!.pose;
    const f = a[UNLATCH]!.pose;
    expect(len(sub(f.look, l.look)) * 1000).toBeLessThan(1);
    expect(len(sub(f.piece, l.piece)) * 1000).toBeLessThan(1);
    expect(len(sub(f.eye, l.eye)) * 1000).toBeLessThan(1);
    expect(excursion(a, UNLATCH)).toBeLessThan(2);
  });
});

describe("⭐⭐⭐ A2-a (D-J2) — after a way out: stopped inside the band, re-armed beyond it, a re-latch", () => {
  it("stopped inside the band (5 mm out) and the way out over: no step, the follower's own pose stays (today rule 1's at w 0.5: 75.2°, 75.1°)", () => {
    const f = wayOut(5);
    for (let i = 0; i < 20; i++) f.push([false, 5, null, 0]);
    const a = play(true, false, f);
    const end = a.slice(a.length - 24);
    for (const r of end) {
      expect(r.held).toBe(true);
      expect(ang(viewOf(r.pose), VF)).toBeLessThan(1e-4);
      expect(len(sub(r.pose.look, F.look))).toBeLessThan(1e-9);
    }
    const b = play(false, false, f);
    expect(ang(viewOf(b[b.length - 1]!.pose), VF)).toBeGreaterThan(5);
  });

  it("on out past the far edge: the band re-armed there (its share 0 by place) with no step; the next way in from far identical to today's", () => {
    const f = wayOut(5);
    for (let out = 5.5; out <= 14 + 1e-9; out += 0.5) f.push([false, out, null, 0.5]);
    const n = f.length;
    for (let out = 13.5; out >= 0.5 - 1e-9; out -= 0.5) f.push([false, out, null, 0.5]);
    for (let i = 0; i < 4; i++) f.push([true, -1, 0, 0.5]);
    const a = play(true, false, f);
    const b = play(false, false, f);
    const re = a.findIndex((r, i) => i > UNLATCH && !r.held);
    expect(a[re]!.out).toBeGreaterThanOrEqual(BAND);
    expect(ang(viewOf(a[re - 1]!.pose), viewOf(a[re]!.pose))).toBeLessThan(1e-6);
    for (let i = n; i < f.length; i++) {
      expect(a[i]!.w).toBe(b[i]!.w);
      expect(a[i]!.pose).toEqual(b[i]!.pose);
    }
  });

  it("back in without leaving the band: no band (the follower's elevation) until the latch; the latch clears the hold and the next unlatch sets it again", () => {
    const f = wayOut(5);
    for (let out = 4.5; out >= 0.5 - 1e-9; out -= 0.5) f.push([false, out, null, 0.5]);
    const m = f.length;
    for (let i = 0; i < 3; i++) f.push([true, -1, 0, 0]);
    f.push([false, 0.5, null, 0.5], [false, 1, 0, 0.5]);
    const a = play(true, false, f);
    for (let i = UNLATCH; i < m; i++) {
      expect(a[i]!.held).toBe(true);
      expect(a[i]!.w).toBe(0);
    }
    expect(ang(viewOf(a[m - 1]!.pose), VF)).toBeLessThan(1e-4);
    for (let i = m; i < m + 3; i++) expect(a[i]!.held).toBe(false);
    expect(a[m + 3]!.held).toBe(true);
    expect(a[m + 4]!.held).toBe(true);
  });
});

describe("⭐⭐⭐ A2-a (D-J2) — the way in unchanged; the switch at 0 = today", () => {
  it("the way in from far (15 mm beyond the unlatch to the latch, never latched before): identical with the switch at 1 and at 0", () => {
    const f: Frame[] = [];
    for (let out = 15; out >= 0.5 - 1e-9; out -= 0.5) f.push([false, out, null, 0.5]);
    for (let i = 0; i < 4; i++) f.push([true, -1, 0, 0.5]);
    const a = play(true, false, f);
    const b = play(false, false, f);
    expect(a.map((r) => r.pose)).toEqual(b.map((r) => r.pose));
    expect(a.some((r) => r.held)).toBe(false);
  });

  it("the switch: `pictureBandWayIn`, 0 by default (= `3b7a479`), 0 or 1 only; the wiring holds the band only at 1, the hold read off the hand-over's last owner", () => {
    expect(DEFAULT_CONFIG.pictureBandWayIn).toBe(0);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pictureBandWayIn: 1 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pictureBandWayIn: 2 })).toThrow(/pictureBandWayIn/);
    const p = readFileSync(new URL("../src/render/picture_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(p).toContain("const wPlace = approachBand(st); const bandOff = bandHeld(st.cfg.pictureBandWayIn === 1, was?.bandHeld === true, s0.hand !== null && s0.hand.latched && !st.asmTiltAuto, st.asmTiltAuto, wPlace); const w = bandOff ? 0 : wPlace;");
    expect(p.split("...(bandOff ? { bandHeld: true } : {}) };").length).toBe(3); // both drawers' records
    // the logic's own rule for a way out born in the band (`zoneMixPose`: about the piece) reads the band by place, untouched
    expect(readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8")).toContain("st.asmTiltAuto || approachBand(st) > 0);");
  });
});
