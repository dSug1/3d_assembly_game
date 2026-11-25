/**
 * ⭐⭐⭐ (2026-11-25, `Claude/40_RENDER_SCENE/spec/APPROACH_CAMERA_JITTER.md` §7.3 D-J4 — A3-p, packet 2a) THE FOLLOWER PARKED IN ITS OWN CONVENTION
 * (`followParkOwn` 1): while latched the follower is parked on the turntable's ψ — the CAMERA's heading drawn — while its state is a DIRECTION the owner's
 * camera offsets turn when drawn (`followPose`): its pose drawn off the picture by ≈ atan(sin yaw / cos el), 5.31° at its 60° cap (1.65 – 6.44° at the
 * latches of his records, §7.2). At the unlatch that false gap was paid twice: the follower's spring by time toward its far reading, the hand-over's
 * offset by the way out's share — the drawn heading up with the spring and back with the share (packet 1's 4 of 10 unlatches over 2°). Now the parked
 * heading is the direction's whose pose drawn has the turntable's heading (`followParkHeading`): at the unlatch the follower starts where the picture is.
 * The frames below are `09fv_r01`'s first unlatch (f1906) in numbers: the picture latched at 85.02°, 67.12° (the band's elevation at the latch), the asked
 * direction at 82.1° (capped 60°), the far reading 91.46° before and after, the owner's offsets 2.5° / 2°; his finger 0.25 mm a frame, the way out's share
 * slow (his finger stops, then the lift by time).
 * Red first (each recorded in the study's §7.4): today's park (the camera's heading fed as the direction's); the elevation read at the picture's drawn
 * elevation instead of the parked direction's; the offset added instead of taken off; the switch ignored by the wiring.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dirAtHeading, followFarStep, followParkHeading, followPose, followStart, followTopTarget, type FollowState, type FollowTop, type FollowTopKnobs } from "../src/input/camera_follow";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { meridianUp, PICTURE_CONE_DEG, PICTURE_REST, pictureStep, type PicturePose, type PictureState } from "../src/input/picture";

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => mul(a, 1 / len(a));
const viewOf = (p: { readonly eye: Vec3; readonly look: Vec3 }): Vec3 => unit(sub(p.eye, p.look));
const head = (v: Vec3): number => Math.atan2(v[0], v[2]) / DEG;
const elv = (v: Vec3): number => Math.asin(Math.max(-1, Math.min(1, v[1]))) / DEG;
const wrapD = (a: number): number => ((((a + 540) % 360) + 360) % 360) - 180;
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
const POLE = 30;
const BAND = 10;
const FAR = 91.46 * DEG;
const ASK_IN = dirAtHeading(70 * DEG, 82.1 * DEG); // the asked direction latched and at the unlatch's frame
const ASK_OUT = dirAtHeading(80 * DEG, 65.2 * DEG); // from the frame after (the calm released at the tilt-off)
const US = dirAtHeading(70 * DEG, 83.7 * DEG);
const VG = dirAtHeading(85.02 * DEG, 67.12 * DEG);
const G: PicturePose = { eye: add(LOOK_G, mul(VG, 1.911)), look: LOOK_G, up: sq(meridianUp(VG, 85.02 * DEG), VG), piece: add(FOOT, mul(US, HANG)) };
const N: Vec3 = [0, 1, 0];
const KN: FollowTopKnobs = { tauMs: 200, poleDeg: POLE, minDeg: 10, rollDegS: 90, paceShare: 1, degPerMm: 0.5, maxDegS: 520, leashPace: true };
const DT = 7;

/** the follower's pose drawn at a direction (its own rule: the offsets turned there) — its view's heading (deg) */
const drawnHeading = (d: Vec3): number => head(viewOf(followPose(d, LOOK_F, FOOT, HANG, GAP, OY, OP)));

/** the parked heading as the wiring parks it (`picture_wiring.ts`): the turntable's ψ through `followParkHeading` at 1, as is at 0 */
const parked = (own: boolean, psiTt: number, ask: Vec3): number => (own ? followParkHeading(psiTt, ask, POLE, OY, OP) : psiTt);

interface Row {
  readonly latched: boolean;
  readonly pose: PicturePose;
  readonly s: PictureState;
  /** the follower's own pose drawn this frame (not latched) and its direction's heading */
  readonly fHead: number | null;
}

/**
 * The latch then the way out, as the wiring runs them: latched, the follower parked each frame from last frame's turntable (`followPark`: at rest on its
 * target at the parked heading, the asked height capped); not latched, its far step from there (`followFarStep`: the unlatch's own frame no far reading —
 * carried —, then 91.46°) and the picture's step on its pose (the band held: `pictureBandWayIn` 1, w 0; the whole pose: `pictureHandWhole` 1). `share`: the
 * way out's share each frame after the unlatch (`null`: his mm).
 */
function play(own: boolean, latchedFrames: number, shares: readonly (number | null)[]): Row[] {
  let s: PictureState = PICTURE_REST;
  let fs: FollowState | null = null;
  let top: FollowTop | null = null;
  const rows: Row[] = [];
  const base = { us: US, look: LOOK_F, foot: FOOT, hang: HANG, gapM: GAP, offYawRad: OY, offPitchRad: OP, spanMm: BAND, coneDeg: PICTURE_CONE_DEG, whole: true } as const;
  for (let i = 0; i < latchedFrames; i++) {
    const psi = s.tt?.psi ?? FAR;
    const L = parked(own, psi, ASK_IN);
    const T = followTopTarget(L, ASK_IN, POLE);
    fs = followStart(T);
    top = { psiT: L, nW: N, turn: null, step: 0, orbitWas: N, pace: 0 };
    const r = pictureStep(s, { ...base, w: 1, dFar: T, F: null, G, latched: true, share: 0, mm: 0, pace: { mm: 0, minMm: 4, degPerMm: 2 } });
    s = r.state;
    rows.push({ latched: true, pose: r.pose, s, fHead: null });
  }
  shares.forEach((share, k) => {
    const f = followFarStep(fs, top, { ask: k === 0 ? ASK_IN : ASK_OUT, orbit: N, psiL: k === 0 ? null : FAR, nW: N, upShown: null, dySign: 0, fingerMm: 0, jumpAt: [] }, DT, KN);
    fs = f.s;
    top = f.top;
    const F = followPose(f.s.dir, LOOK_F, FOOT, HANG, GAP, OY, OP);
    const r = pictureStep(s, { ...base, w: 0, dFar: f.s.dir, F, G, latched: false, share, mm: 0.25 });
    s = r.state;
    rows.push({ latched: false, pose: r.pose, s, fHead: head(viewOf(F)) });
  });
  return rows;
}

/** the way out: the unlatch's own frame (no share yet), his finger out slowly (the share to 0.3), still 30 frames, then the lift (by time, 0.02 a frame) */
function shares(): (number | null)[] {
  const a: (number | null)[] = [null];
  for (let i = 1; i <= 40; i++) a.push(sm(i / 120));
  const k0 = sm(40 / 120);
  for (let i = 0; i < 30; i++) a.push(k0);
  for (let k = k0; k < 1; ) {
    k = Math.min(1, k + 0.02);
    a.push(k);
  }
  for (let i = 0; i < 40; i++) a.push(null);
  return a;
}
const LATCHED = 6;

/** the drawn heading's swing outside [its value at the unlatch, its value at the end] (deg) — `rd_gate_a.cjs`'s excursion */
function excursion(rows: readonly Row[], from: number): number {
  const h = rows.slice(from).map((r) => head(viewOf(r.pose)));
  const h0 = h[0]!;
  const d = h.map((x) => wrapD(x - h0));
  const lo = Math.min(0, d[d.length - 1]!);
  const hi = Math.max(0, d[d.length - 1]!);
  return Math.max(...d.map((x) => Math.max(0, lo - x, x - hi)));
}

describe("⭐⭐⭐ A3-p (D-J4) — `followParkHeading`: the direction whose pose drawn has the camera's heading", () => {
  it("exact at every heading and elevation of the parked direction (the asked height capped at 60°)", () => {
    for (const elAsk of [-82, -60, -48.4, -20, 0, 35, 60, 82.1]) {
      for (const psiC of [-170, -86.24, 0, 85.02, 179]) {
        const ask = dirAtHeading(10 * DEG, elAsk * DEG);
        const T = followTopTarget(followParkHeading(psiC * DEG, ask, POLE, OY, OP), ask, POLE);
        expect(Math.abs(wrapD(drawnHeading(T) - psiC))).toBeLessThan(1e-9);
      }
    }
  });

  it("today's park (the camera's heading as the direction's) is off by the offsets' turn — 5.31° at the 60° cap, 4.71° at −60°, 3.62° at −48.4° (his records)", () => {
    const off = (elAsk: number): number => {
      const ask = dirAtHeading(0, elAsk * DEG);
      return wrapD(drawnHeading(followTopTarget(85.02 * DEG, ask, POLE)) - 85.02);
    };
    expect(off(82.1)).toBeCloseTo(-5.31, 2);
    expect(off(-82)).toBeCloseTo(-4.71, 2);
    expect(off(-48.4)).toBeCloseTo(-3.62, 2);
  });
});

describe("⭐⭐⭐ A3-p (D-J4) — the latch and the unlatch (`09fv_r01` f1906 in numbers)", () => {
  it("while latched the drawn picture is unchanged (the parked follower is not drawn: latched `pictureStep` draws G whatever the follower's direction)", () => {
    const a = play(true, LATCHED, []);
    const b = play(false, LATCHED, []);
    expect(a.map((r) => r.pose)).toEqual(b.map((r) => r.pose));
    expect(a.map((r) => r.s)).toEqual(b.map((r) => r.s));
    expect(head(viewOf(a[LATCHED - 1]!.pose))).toBeCloseTo(85.02, 6);
    expect(a[LATCHED - 1]!.s.tt!.psi / DEG).toBeCloseTo(85.02, 6);
  });

  it("at the unlatch the follower's first drawn heading IS the picture's (today 5.31° off); the hand-over's heading held ≈ 0 (today 5.31°)", () => {
    const a = play(true, LATCHED, shares());
    const b = play(false, LATCHED, shares());
    const pic = a[LATCHED - 1]!.s.dir!.psi / DEG;
    expect(Math.abs(wrapD(a[LATCHED]!.fHead! - pic))).toBeLessThan(0.01);
    expect(Math.abs(a[LATCHED]!.s.hand!.dh! / DEG)).toBeLessThan(0.01);
    expect(Math.abs(wrapD(b[LATCHED]!.fHead! - pic))).toBeGreaterThan(5);
    expect(Math.abs(b[LATCHED]!.s.hand!.dh! / DEG)).toBeGreaterThan(5);
    // the true gap left to the hand-over: the elevation (the picture at the band's 67.12°, the follower at its 60° cap drawn 61.9°)
    expect(a[LATCHED]!.s.hand!.de! / DEG).toBeGreaterThan(4);
    // the unlatch's own frame draws the pose held whole (A1-a): the last frame drawn
    expect(len(sub(a[LATCHED]!.pose.eye, a[LATCHED - 1]!.pose.eye)) * 1000).toBeLessThan(1e-6);
  });

  it("through the way out the drawn heading monotonic toward its end — no excursion over 2° (today 3.7°: up with the spring, back with the share)", () => {
    const a = play(true, LATCHED, shares());
    const b = play(false, LATCHED, shares());
    expect(excursion(a, LATCHED)).toBeLessThan(0.05);
    expect(excursion(b, LATCHED)).toBeGreaterThan(2);
    // both end where the follower rests: its far reading drawn (86.15°, 61.9°)
    const ea = viewOf(a[a.length - 1]!.pose);
    const eb = viewOf(b[b.length - 1]!.pose);
    expect(head(ea)).toBeCloseTo(86.15, 1);
    expect(head(eb)).toBeCloseTo(86.15, 1);
    expect(elv(ea)).toBeCloseTo(elv(eb), 6);
  });

  it("no frame of the way out turns the view over 1° (at the lift neither)", () => {
    const a = play(true, LATCHED, shares());
    for (let i = LATCHED + 1; i < a.length; i++) {
      const t = Math.acos(Math.max(-1, Math.min(1, viewOf(a[i - 1]!.pose).reduce((x, v, j) => x + v * viewOf(a[i]!.pose)[j]!, 0)))) / DEG;
      expect(t).toBeLessThan(1);
    }
  });
});

describe("⭐⭐⭐ A3-p (D-J4) — the switch", () => {
  it("`followParkOwn`, 1 by default (his word 2026-11-25: default at 1 also in the two other branches, as LIVE `870078b`; 0 = `3b7a479`), 0 or 1 only; the wiring parks through `parkOwn` at the read and the record, the turntable's ψ as is at 0", () => {
    expect(DEFAULT_CONFIG.followParkOwn).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, followParkOwn: 1 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, followParkOwn: 2 })).toThrow(/followParkOwn/);
    const p = readFileSync(new URL("../src/render/picture_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(p).toContain("const parkAsk = st.cfg.followParkOwn === 1 ? st.asmAsk : null;");
    expect(p).toContain("parkAsk !== null ? followParkHeading(psi, parkAsk, st.cfg.followPoleDeg, off.yawRad, off.pitchRad) : psi);");
    expect(p).toContain("const psiPark = latched ? (parkOwn(s0.tt?.psi) ?? was?.psiPark ?? null) : (was?.psiPark ?? parkOwn(s0.tt?.psi) ?? null);");
    expect(p).toContain("psiPark: latched ? (parkOwn(r.state.tt?.psi) ?? psiPark) : psiPark");
    // the far path's record unchanged: the follower's own heading (its convention already)
    expect(p).toContain("const psiPark = fs?.top?.psiT ?? (fs?.state ? headingOf(fs.state.d) : null) ?? was?.psiPark ?? null;");
  });
});
