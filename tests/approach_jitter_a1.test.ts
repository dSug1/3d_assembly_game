/**
 * ⭐⭐⭐ (2026-11-25, `Claude/40_RENDER_SCENE/spec/APPROACH_CAMERA_JITTER.md` §4.1, §7 D-J1 — A1-a, packet 1) THE UNLATCH'S HAND-OVER HOLDS THE WHOLE POSE
 * (`pictureHandWhole` 1): his *"jump of the camera when I take out the piece"* — at the unlatch the latched G (its turn pending, drawn ABOUT THE PIECE: the
 * camera rode with it) hands the picture to the follower (its look point the gizmo's, its piece on its own line); the hand-over held the view's angles only,
 * so the look point leapt 35 – 366 mm, the piece 26 – 194 mm, the eye 48 – 193 mm in one frame (§3.2). Now the look point's offset, the piece's and the eye's
 * distance are held too, closed by the same one share — the way out's.
 * Red first (each recorded in the study's §7.1): the old code (`5c918af8`: no places held) — the first frame's look point 191 mm off; the eye moved with the
 * look point only (no distance held) — the eye 4.5 mm off; the unlatch's own frame paid by his mm (the share skipped there removed) — the look point 7.7 mm
 * off; the places held at the latch too — the latch's poses differ; the places closed by his mm instead of the way out's share — the stroke's poses differ.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dirAtHeading, followPose } from "../src/input/camera_follow";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { meridianUp, PICTURE_CONE_DEG, PICTURE_REST, pictureStep, type PictureIn, type PicturePose, type PictureState } from "../src/input/picture";

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const mmOff = (a: Vec3, b: Vec3): number => len(sub(a, b)) * 1000;
const unit = (a: Vec3): Vec3 => mul(a, 1 / len(a));
const viewOf = (p: PicturePose): Vec3 => unit(sub(p.eye, p.look));
const ang = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) / DEG;
const sq = (u: Vec3, d: Vec3): Vec3 => {
  const k = u[0] * d[0] + u[1] * d[1] + u[2] * d[2];
  return unit([u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]]);
};

/* `09fv_r01` f1903 – f1906 in numbers (§3.2): the gizmo's foot, the follower's look point (`asmLook`), G's look point 191 mm off it (it rode with the piece) */
const FOOT: Vec3 = [0.15, 0.545, 0.17];
const LOOK_F: Vec3 = [0.143, 0.541, 0.172];
const LOOK_G: Vec3 = [-0.048, 0.552, 0.167];
const HANG = 0.65;
const GAP = 1.25;
const OFF_YAW = 2.5 * DEG;
const OFF_PITCH = 2 * DEG;
/** the logic's shown direction (the piece from the foot) and G: the view drawn at the unlatch (85.0°, 67.1°), 1.911 m from its look point, the piece at `us` */
const US = dirAtHeading(70 * DEG, 83.7 * DEG);
const VG = dirAtHeading(85 * DEG, 67.1 * DEG);
const G: PicturePose = { eye: add(LOOK_G, mul(VG, 1.911)), look: LOOK_G, up: sq(meridianUp(VG, 85 * DEG), VG), piece: add(FOOT, mul(US, HANG)) };
/** the follower after the unlatch: its own direction (the way out ends there — §4.2: 0.2° / 2.2° off the drawn view) */
const D_FAR = dirAtHeading(84.8 * DEG, 64.9 * DEG);
const F = followPose(D_FAR, LOOK_F, FOOT, HANG, GAP, OFF_YAW, OFF_PITCH);

function inp(o: { latched: boolean; share: number | null; mm: number; whole: boolean; w?: number; Gp?: PicturePose }): PictureIn {
  return {
    w: o.w ?? 0,
    dFar: D_FAR,
    F: o.latched ? null : F,
    us: US,
    look: LOOK_F,
    foot: FOOT,
    hang: HANG,
    gapM: GAP,
    offYawRad: OFF_YAW,
    offPitchRad: OFF_PITCH,
    G: o.Gp ?? G,
    latched: o.latched,
    share: o.share,
    mm: o.mm,
    spanMm: 10,
    coneDeg: PICTURE_CONE_DEG,
    ...(o.whole ? { whole: true } : {}),
  };
}

/** latched (pending: the share 0) for 5 frames, then the unlatch with his out mm `mm0` — the poses drawn (the last latched first) and the state */
function unlatch(whole: boolean, mm0: number, w = 0): { last: PicturePose; first: PicturePose; s: PictureState } {
  let s: PictureState = PICTURE_REST;
  let last: PicturePose | null = null;
  for (let i = 0; i < 5; i++) {
    const r = pictureStep(s, inp({ latched: true, share: 0, mm: 0, whole }));
    s = r.state;
    last = r.pose;
  }
  const r = pictureStep(s, inp({ latched: false, share: null, mm: mm0, whole, w }));
  return { last: last!, first: r.pose, s: r.state };
}

describe("⭐⭐⭐ A1-a (D-J1) — the unlatch's first frame draws the pose drawn the frame before (look point, piece, eye)", () => {
  it("G's look point 191 mm off the follower's, his out finger 0.4 mm that frame: the first frame drawn equal to the last within 1 mm — the look point, the piece, the eye", () => {
    for (const w of [0, 1]) {
      const { last, first } = unlatch(true, 0.4, w);
      expect(mmOff(LOOK_G, LOOK_F)).toBeGreaterThan(190);
      expect(mmOff(first.look, last.look)).toBeLessThan(1);
      expect(mmOff(first.piece, last.piece)).toBeLessThan(1);
      expect(mmOff(first.eye, last.eye)).toBeLessThan(1);
      expect(ang(viewOf(first), viewOf(last))).toBeLessThan(0.01);
    }
  });

  it("the switch at 0 (`3b7a479`): the angles only — the look point leaps to the follower's (≈ 191 mm) and the piece onto its line in that frame", () => {
    const { last, first } = unlatch(false, 0.4);
    expect(mmOff(first.look, last.look)).toBeGreaterThan(150);
    expect(mmOff(first.look, LOOK_F)).toBeLessThan(1e-6);
    expect(mmOff(first.piece, last.piece)).toBeGreaterThan(50);
  });
});

describe("⭐⭐⭐ A1-a (D-J1) — the gap then closes by the way out's share ONLY (C3: his out mm, then time after the lift — the share given)", () => {
  /** the way out's frames after the unlatch: its share `k` (0 → 1), his finger's mm `mm` each frame */
  function wayOut(ks: readonly number[], mm: number): { first: PicturePose; poses: PicturePose[] } {
    const u = unlatch(true, 0.4);
    let s = u.s;
    const poses: PicturePose[] = [];
    for (const k of ks) {
      const r = pictureStep(s, inp({ latched: false, share: k, mm, whole: true }));
      s = r.state;
      poses.push(r.pose);
    }
    return { first: u.first, poses };
  }
  const KS = [0, 0.02, 0.1, 0.25, 0.5, 0.75, 0.9, 0.98, 1, 1];

  it("the look point's offset left is (1 − k) of the offset held, frame by frame; the piece and the eye monotonic to the follower's; at k = 1 the follower's pose exactly", () => {
    const { first, poses } = wayOut(KS, 0.4);
    const dl = sub(first.look, LOOK_F);
    let pPiece = Infinity;
    let pEye = Infinity;
    for (let i = 0; i < KS.length; i++) {
      const p = poses[i]!;
      expect(mmOff(p.look, add(LOOK_F, mul(dl, 1 - KS[i]!)))).toBeLessThan(1e-6);
      const dp = mmOff(p.piece, F.piece);
      const de = mmOff(p.eye, F.eye);
      expect(dp).toBeLessThanOrEqual(pPiece + 1e-9);
      expect(de).toBeLessThanOrEqual(pEye + 1e-9);
      pPiece = dp;
      pEye = de;
    }
    const end = poses[poses.length - 1]!;
    expect(mmOff(end.look, F.look)).toBeLessThan(1e-6);
    expect(mmOff(end.piece, F.piece)).toBeLessThan(1e-6);
    expect(mmOff(end.eye, F.eye)).toBeLessThan(1e-6);
  });

  it("his mm do not pay it while the way out's share is given: the same shares with 0.4 mm or 5 mm a frame draw the same poses", () => {
    const a = wayOut(KS, 0.4).poses;
    const b = wayOut(KS, 5).poses;
    for (let i = 0; i < KS.length; i++) {
      expect(mmOff(a[i]!.look, b[i]!.look)).toBeLessThan(1e-9);
      expect(mmOff(a[i]!.piece, b[i]!.piece)).toBeLessThan(1e-9);
      expect(mmOff(a[i]!.eye, b[i]!.eye)).toBeLessThan(1e-9);
    }
  });

  it("the places move no angle: the view's direction with the places held is the angles' own (the switch at 0, the same first frame) on every frame", () => {
    const run = (whole: boolean): PicturePose[] => {
      const u = unlatch(whole, 0);
      let s = u.s;
      const out = [u.first];
      for (const k of KS) {
        const r = pictureStep(s, inp({ latched: false, share: k, mm: 0.4, whole }));
        s = r.state;
        out.push(r.pose);
      }
      return out;
    };
    const a = run(true);
    const b = run(false);
    for (let i = 0; i < a.length; i++) {
      expect(ang(viewOf(a[i]!), viewOf(b[i]!))).toBeLessThan(1e-4); // (deg: `acos` near 1 reads 1e-6° of rounding)
      expect(ang(sq(a[i]!.up, viewOf(a[i]!)), sq(b[i]!.up, viewOf(b[i]!)))).toBeLessThan(1e-4);
    }
  });
});

describe("⭐⭐⭐ A1-a (D-J1) — the latch unchanged; the switch at 0 = today", () => {
  it("far → the latch (G's turn from the pose drawn, carried with the piece's step): the poses drawn identical with the switch at 1 and at 0", () => {
    const run = (whole: boolean): PicturePose[] => {
      let s: PictureState = PICTURE_REST;
      const out: PicturePose[] = [];
      for (let i = 0; i < 4; i++) {
        const r = pictureStep(s, inp({ latched: false, share: null, mm: 0.5, whole, w: 1 }));
        s = r.state;
        out.push(r.pose);
      }
      // the latch: G = the pose drawn carried by the piece's own step this frame (80 mm, as `09fv_r01` f1565), its turn pending (share 0)
      const step: Vec3 = [-0.05, -0.062, 0.002];
      const last = out[out.length - 1]!;
      const Gl: PicturePose = { eye: add(last.eye, step), look: add(last.look, step), up: last.up, piece: add(last.piece, step) };
      for (let i = 0; i < 6; i++) {
        const r = pictureStep(s, inp({ latched: true, share: 0, mm: 0.5, whole, Gp: Gl }));
        s = r.state;
        out.push(r.pose);
      }
      return out;
    };
    expect(run(true)).toEqual(run(false));
  });

  it("the switch: `pictureHandWhole`, 1 by default (his word 2026-11-25: default at 1 also in the two other branches, as LIVE `870078b`; 0 = `3b7a479`), 0 or 1 only; the wiring passes `whole` only at 1", () => {
    expect(DEFAULT_CONFIG.pictureHandWhole).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pictureHandWhole: 1 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pictureHandWhole: 2 })).toThrow(/pictureHandWhole/);
    const p = readFileSync(new URL("../src/render/picture_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(p).toContain("...(st.cfg.pictureHandWhole === 1 ? { whole: true } : {}) };");
    expect(p.split("...base,").length).toBe(3); // both drawers' calls read it (the far path's hook, the close path)
  });

  it("at 0 the state keeps no pose drawn and the hand-over no places (today's objects)", () => {
    const { s } = unlatch(false, 0.4);
    expect(s.drawn).toBeUndefined();
    expect(s.hand?.dl).toBeUndefined();
    const t = unlatch(true, 0.4).s;
    expect(t.drawn).toBeDefined();
    expect(t.hand?.dl).toBeDefined();
  });
});
