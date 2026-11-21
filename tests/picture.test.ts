/**
 * ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.1 – §4.3 — packet R3a) THE ONE PICTURE, pure (`src/input/picture.ts`).
 * Mutants run (each red): no blend (w forced 0); the picture's state dropped at the far resume (the follower restarted); the up from the view's residue
 * (ψ not carried); w by time instead of place. Red on the old code: the module did not exist.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { approachDistance } from "../src/input/assembly_orbit";
import { dirAtHeading, followPose, followTopTarget } from "../src/input/camera_follow";
import { approachOutMm, bandShare, meridianUp, PICTURE_CONE_DEG, PICTURE_REST, pictureStep, turntableUp, WORLD_UP, type PictureIn, type PictureState } from "../src/input/picture";

const DEG = Math.PI / 180;
const ang = (a: Vec3, b: Vec3): number => {
  const la = Math.hypot(...a);
  const lb = Math.hypot(...b);
  return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb)))) / DEG;
};
const sq = (u: Vec3, d: Vec3): Vec3 => {
  const k = u[0] * d[0] + u[1] * d[1] + u[2] * d[2];
  const p: Vec3 = [u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]];
  const l = Math.hypot(...p);
  return [p[0] / l, p[1] / l, p[2] / l];
};
const ZERO: Vec3 = [0, 0, 0];
const GAP = 0.6;

/** One frame's readings in the fixture's geometry: the look point at the gizmo's foot (the origin), no offsets. */
function frame(_far: boolean, w: number, dFar: Vec3, us: Vec3, hang: number, G: { eye: Vec3; up: Vec3 }, latched: boolean, share: number | null, mm: number): PictureIn {
  return { w, dFar, F: null, us, look: ZERO, foot: ZERO, hang, gapM: GAP, offYawRad: 0, offPitchRad: 0, G: { eye: G.eye, look: ZERO, up: G.up, piece: [us[0] * hang, us[1] * hang, us[2] * hang] }, latched, share, mm, spanMm: 10, coneDeg: PICTURE_CONE_DEG };
}

describe("R3a — the band: w by the approach's PLACE (D-P3 (a))", () => {
  it("w 1 at and inside the unlatch, 0 exactly from 10 mm beyond it, a smoothstep between — a function of place", () => {
    expect(bandShare(0, 10)).toBe(1);
    expect(bandShare(-5, 10)).toBe(1);
    expect(bandShare(10, 10)).toBe(0);
    expect(bandShare(25, 10)).toBe(0);
    expect(bandShare(5, 10)).toBeCloseTo(0.5, 12);
    expect(bandShare(2, 10)).toBeGreaterThan(bandShare(3, 10));
    expect(bandShare(5, 0)).toBe(0);
  });

  it("his approach finger's mm beyond 0.65 m: 0 inside, linear in the coordinate beyond (da = mm × dv), none with no latch", () => {
    const cfg = DEFAULT_CONFIG;
    const dv = 0.004;
    // the coordinate where the distance is 0.65 m (the approach's distance rises with the coordinate)
    let a0 = 0;
    for (let a = 0; a <= 1; a += 1e-4) if (approachDistance(cfg, a) <= cfg.tiltAutoM + 0.05) a0 = a;
    expect(approachDistance(cfg, 1)).toBeGreaterThan(cfg.tiltAutoM + 0.05);
    expect(approachOutMm(cfg, a0 - 0.01, dv)).toBe(0);
    expect(approachOutMm(cfg, a0 + 0.02, dv)).toBeCloseTo(0.02 / dv, 0);
    expect(approachOutMm(cfg, a0 + 0.04, dv) - approachOutMm(cfg, a0 + 0.02, dv)).toBeCloseTo(0.02 / dv, 6);
    expect(approachOutMm({ ...cfg, tiltAutoM: 0 }, a0 + 0.04, dv)).toBe(Infinity);
  });
});

describe("R3a — pictureStep: the ends are today's follower and G exactly", () => {
  const dFar = dirAtHeading(0, 60 * DEG);
  const us = dirAtHeading(100 * DEG, 87 * DEG);
  const F = followPose(dFar, ZERO, ZERO, 0.8, GAP, 0, 0);

  it("w 0, far, nothing held: the follower's own pose OBJECTS and the world's up (far out bit for bit)", () => {
    const inp = { ...frame(true, 0, dFar, us, 0.8, { eye: [1, 2, 3], up: [0, 1, 0] }, false, null, 0), F };
    const r = pictureStep(PICTURE_REST, inp);
    expect(r.pose.eye).toBe(F.eye);
    expect(r.pose.look).toBe(F.look);
    expect(r.pose.piece).toBe(F.piece);
    expect(r.pose.up).toBe(WORLD_UP);
    expect(r.pose.up).toEqual(F.up);
    expect(r.state.hand?.r).toBe(0);
  });

  it("w 1, far: G's eye, look and piece exactly (the latch then draws nothing new); close: G itself, its up when nothing is held", () => {
    const G = { eye: [0.1, 1.3, 0.05] as Vec3, up: [0, 0, -1] as Vec3 };
    const inp = frame(true, 1, dFar, us, 0.8, G, false, null, 0);
    const a = pictureStep(PICTURE_REST, inp);
    const inG = inp.G;
    expect(a.pose.eye).toBe(inG.eye);
    expect(a.pose.look).toBe(inG.look);
    expect(a.pose.piece).toBe(inG.piece);
    const c = pictureStep({ ...PICTURE_REST, hand: { latched: true, phi0: 0, r: 0 } }, frame(false, 1, dFar, us, 0.8, G, true, 1, 0));
    expect(c.pose.up).toBe(G.up);
    expect(c.pose.eye).toBe(G.eye);
  });

  it("the turntable's up: outside the cone the world's (its literal); inside the carried ψ, whole in its inner half — never the view's residue", () => {
    expect(turntableUp(dirAtHeading(1, 60 * DEG), null, PICTURE_CONE_DEG).up).toBe(WORLD_UP);
    const s = { psi: 0, psiV: 0, inCone: true };
    const c = dirAtHeading(100 * DEG, 87 * DEG);
    const t = turntableUp(c, s, PICTURE_CONE_DEG);
    expect(ang(sq(t.up, c), sq(meridianUp(c, 0), c))).toBeLessThan(1e-9);
    expect(ang(sq(t.up, c), sq(meridianUp(c, 100 * DEG), c))).toBeGreaterThan(90);
  });
});

/**
 * THE APPROACH CYCLE (the gate's run, in the pure function): on a level face the follower at its 60° cap (heading 0), the logic square at 87° (its residue's
 * heading 100°), his approach finger in past the latch (0.6 m) and out past the unlatch (0.65 m) at `p` mm a frame; latched G held (the tilt pending: no orbit
 * mm — R2's 0.0°); the way out G's own, its share by his out mm (with his orbit's: over 4 mm), so the follower resumes INSIDE the band, near the vertical;
 * then the follower parked on its target at the carried heading.
 */
const OUT_MM = 4;
function cycle(p: number, mut: { noBlend?: boolean; dropAtResume?: boolean; wByTime?: boolean } = {}) {
  const us = dirAtHeading(100 * DEG, 87 * DEG);
  const logicUp = sq(meridianUp(us, 40 * DEG), us);
  const dist = (mm: number): number => 0.65 + 0.004 * mm;
  let s: PictureState = PICTURE_REST;
  let latched = false;
  let held: Vec3 | null = null;
  let outK: number | null = null;
  let outMm = 0;
  let wT = 0;
  let psiPark: number | null = null;
  const rows: { mm: number; eye: Vec3; up: Vec3; far: boolean; latched: boolean }[] = [];
  const path: number[] = [];
  for (let m = 20; m >= -20; m -= p) path.push(m);
  for (let m = -20; m <= 25; m += p) path.push(m);
  let resumed = false;
  for (let i = 0; i < path.length; i++) {
    const mm = path[i]!;
    const d = dist(mm);
    const latchWas = latched;
    latched = latched ? d <= 0.65 : d <= 0.6;
    if (latchWas && !latched) {
      outK = 0;
      outMm = 0;
    }
    const out = i > 0 && mm > path[i - 1]! ? mm - path[i - 1]! : 0;
    if (outK !== null) {
      outMm += out;
      outK = outMm >= OUT_MM ? null : 1 - bandShare(outMm, OUT_MM);
    }
    let w = bandShare(mm, 10);
    if (mut.wByTime) {
      wT = mm < 10 ? Math.min(1, wT + 0.1) : 0;
      w = wT;
    }
    if (mut.noBlend) w = 0;
    const hang = d;
    const far = !latched && outK === null;
    // the follower: on the way in converged on its own target (heading 0, the 60° cap); after a latch parked on its target at the heading carried
    const dFar = psiPark === null ? dirAtHeading(0, 60 * DEG) : followTopTarget(psiPark, us, 30);
    if (far && !resumed && rows.length > 0 && !rows[rows.length - 1]!.far && mut.dropAtResume) s = PICTURE_REST;
    if (far && rows.length > 0 && !rows[rows.length - 1]!.far) resumed = true;
    const eyeU: Vec3 = [us[0] * (hang + GAP), us[1] * (hang + GAP), us[2] * (hang + GAP)];
    if (latched && !latchWas) held = s.up;
    const Gup = latched ? held! : logicUp;
    const r = pictureStep(s, frame(far, w, dFar, us, hang, { eye: eyeU, up: Gup }, latched, latched ? 0 : outK, out));
    s = r.state;
    if (latched) psiPark = s.tt!.psi;
    const v: Vec3 = [r.pose.look[0] - r.pose.eye[0], r.pose.look[1] - r.pose.eye[1], r.pose.look[2] - r.pose.eye[2]];
    rows.push({ mm, eye: v, up: sq(r.pose.up, [v[0] / Math.hypot(...v), v[1] / Math.hypot(...v), v[2] / Math.hypot(...v)]), far, latched });
  }
  let view = 0;
  let up = 0;
  for (let i = 1; i < rows.length; i++) {
    view = Math.max(view, ang(rows[i - 1]!.eye, rows[i]!.eye));
    up = Math.max(up, ang(rows[i - 1]!.up, rows[i]!.up));
  }
  return { rows, view, up };
}

describe("R3a — the approach cycle: no frame's view or up step over 3° (today 23°, 94° up, the 22° drift)", () => {
  it("at 0.5 mm of approach finger a frame (the band's 27° over 10 mm: ≤ 3° a frame needs ≤ 0.74 mm a frame — at his 1.3 – 2.5 mm the band's figure is the limit)", () => {
    const r = cycle(0.5);
    expect(r.rows.some((x) => x.latched)).toBe(true);
    expect(r.rows[r.rows.length - 1]!.far).toBe(true);
    expect(r.view).toBeLessThan(3);
    expect(r.up).toBeLessThan(3);
  });

  it("mutant — no blend (w 0): the latch jumps the view (the cap's gap in one frame)", () => {
    expect(cycle(0.5, { noBlend: true }).view).toBeGreaterThan(20);
  });

  it("mutant — the picture's state dropped at the far resume (the follower restarted): the up spins from the view's residue", () => {
    expect(cycle(0.5, { dropAtResume: true }).up).toBeGreaterThan(3);
  });

  it("the same place either way → the same picture (into the band and back, its two ends held); mutant — w by time: not the same", () => {
    const run = (byTime: boolean): number => {
      const dFar = dirAtHeading(0, 60 * DEG);
      const us = dirAtHeading(100 * DEG, 87 * DEG);
      const eyeU: Vec3 = [us[0] * 1.3, us[1] * 1.3, us[2] * 1.3];
      let s: PictureState = PICTURE_REST;
      let wT = 0;
      const seen = new Map<number, Vec3>();
      let e = 0;
      const path = [...Array.from({ length: 27 }, (_, i) => 15 - 0.5 * i), ...Array.from({ length: 27 }, (_, i) => 2 + 0.5 * i)];
      for (const mm of path) {
        wT = mm < 10 ? Math.min(1, wT + 0.1) : 0;
        const r = pictureStep(s, frame(true, byTime ? wT : bandShare(mm, 10), dFar, us, 0.7, { eye: eyeU, up: [0, 1, 0] }, false, null, 0));
        s = r.state;
        const k = Math.round(mm * 10);
        const b = seen.get(k);
        if (b !== undefined) e = Math.max(e, ang(b, r.pose.eye));
        else seen.set(k, r.pose.eye);
      }
      return e;
    };
    expect(run(false)).toBeLessThan(1e-4);
    expect(run(true)).toBeGreaterThan(1);
  });
});

describe("R3a — a restart at a near-vertical view (the f480 case): the up from ψ, never the view's residue — no spin", () => {
  it("latched at 86.6° (residue heading 0°) with G's up 94° off the residue's meridian, then the way out: the up drawn turns under 3° in all", () => {
    const c = dirAtHeading(0, 86.6 * DEG);
    const Gup = sq(meridianUp(c, 94 * DEG), c);
    const eye: Vec3 = [c[0] * 2, c[1] * 2, c[2] * 2];
    let s: PictureState = PICTURE_REST;
    const ups: Vec3[] = [];
    for (let i = 0; i < 5; i++) {
      const r = pictureStep(s, frame(false, 1, c, c, 0.65, { eye, up: Gup }, true, 1, 0));
      s = r.state;
      ups.push(r.state.up!);
    }
    for (let k = 0; k <= 1.0001; k += 0.1) {
      const r = pictureStep(s, frame(false, 1, c, c, 0.65, { eye, up: Gup }, false, Math.min(1, k), 0.5));
      s = r.state;
      ups.push(r.state.up!);
    }
    for (let i = 0; i < 10; i++) {
      const r = pictureStep(s, frame(true, 1, c, c, 0.65, { eye, up: Gup }, false, null, 0.5));
      s = r.state;
      ups.push(r.state.up!);
    }
    expect(ang(ups[0]!, ups[ups.length - 1]!)).toBeLessThan(3);
    for (let i = 1; i < ups.length; i++) expect(ang(ups[i - 1]!, ups[i]!)).toBeLessThan(3);
  });
});

describe("R3a — the wiring (source)", () => {
  const raw = (f: string): string => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
  it("the camera's stage: the one picture under `pictureOne` 1 with the follower; today's line exactly otherwise", () => {
    const g = raw("render/green_box_wiring.ts");
    expect(g).toContain("const zp = pictureOn(st) ? pictureFrame(st, pp, [c0.x, c0.y, c0.z], camAt, lookAt, camFrame.up, gapFull, off, dtSec * 1000, orbitDvPerMm(st)) : (followFrame(st, pp, [c0.x, c0.y, c0.z], camAt, lookAt, camFrame.up, gapFull, off, dtSec * 1000) ?? rollPictureFrame(st, pp, camAt, lookAt, camFrame.up, dtSec * 1000));");
    expect(raw("render/picture_wiring.ts")).toContain("return st.cfg.pictureOne === 1 && st.cfg.cameraFollower === 1;");
  });

  it("far: the follower's own step and pose, then the picture (the same functions, the same order); its state never dropped under the picture", () => {
    const w = raw("render/camera_follow_wiring.ts");
    expect(w).toContain("const P0 = followPose(s.dir, look, foot, hang, gapM, off.yawRad, off.pitchRad);");
    expect(w).toContain("const P = pic === undefined ? P0 : pic(P0, s.dir, hang,");
    expect(w).toContain("if (pic === undefined) st.asmFollow = was === null ? null : { state: null, piece: null, rec: { on: 0 } }; return null;");
    const p = raw("render/picture_wiring.ts");
    expect(p).toContain("const G = rollPictureFrame(st, pp, eye, look, up, dtMs);");
    expect(p).toContain("const dFar = followPark(st, psiPark) ?? us;");
    expect(p).toContain("const psiPark = latched ? (s0.tt?.psi ?? was?.psiPark ?? null) : (was?.psiPark ?? s0.tt?.psi ?? null);");
    expect(p).not.toMatch(/followStart\(\s*us|followStart\(hang/);
  });

  it("the way out born in the band (w > 0) turned about the piece, with the switch and the follower on only", () => {
    expect(raw("render/assembly_wiring.ts")).toContain("st.asmTiltAuto || (st.cfg.pictureOne === 1 && st.cfg.cameraFollower === 1 && approachBand(st) > 0)");
  });
});
