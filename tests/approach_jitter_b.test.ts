/**
 * ⭐⭐⭐ (2026-11-25, `Claude/40_RENDER_SCENE/spec/APPROACH_CAMERA_JITTER.md` §4.4 B-a, §7.6 — packet 2b) THE FRAMED LINE'S DEGENERATE CASE READ ON THE GLASS
 * (`framedLineGlass` 1): the carried up rolls the picture about the framed line (the piece → the look point, `framedLine`). At a side face's floor the two
 * are 5 – 60 mm apart at 1.26 m — one place on his glass (≈ 1 – 11 mm) — and the line through them is millimetre residues 50 – 85° off the view, flipping
 * as it crosses square to it: a roll about it swings the eye on a 1.26 m arm (his records `n2b8_r03`, `09fv_r02`, `09fv_r04`: 4 – 11° a frame, the
 * logic's pose still). O4's fallback was decided by 3 WORLD mm. Now by their separation ON THE GLASS at the pose's distance (screen mm, rule 3): within
 * 5 mm the view's own direction, from 15 mm the line through both (today's, the same arithmetic), blended between with no flip possible.
 * The frames below are his records' (`JT_n3` f13993, `JT_r02d` f7020 / f9085, `JT_P1_r03_00` f13389) and FAST_ORBIT-like spit frames; his window 742 CSS px
 * high, the camera's 0.8 rad field.
 * Red first (each recorded in the study's §7.6): today's rule (the glass ignored); the separation read as the PROJECTED offset on the glass (the piece
 * in front of the look point at mid distance is ~1 mm off there); the band in pixels; the blend of the oriented line without its signed weight (a flip
 * inside the band); the switch ignored by the wiring.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { FRAMED_LINE_FULL_MM, FRAMED_LINE_VIEW_MM, framedLine, framedLineShare, poseRolled, separationOnGlassMm, type Glass } from "../src/input/roll_follow";
import type { CamPose } from "../src/input/orbit_tilt";

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => mul(a, 1 / len(a));
const ang = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b))))) / DEG;

/** his window: 742 CSS px high, the camera's default field */
const HIS: Glass = { fovY: 0.8, heightPx: 742 };
/** a pose 1.26 m from its look point, looking along +z */
const P0: CamPose = { eye: [0, 0, 0], look: [0, 0, 1.26], up: [0, 1, 0] };
const VIEW: Vec3 = [0, 0, 1];
/** the world gap (m) that reads `mm` on his glass at 1.26 m */
const gapFor = (mm: number): number => ((mm * 96) / 25.4) * ((2 * 1.26 * Math.tan(0.4)) / 742);
/** the piece `gap` m from the look point, `offDeg` off the view (in the x–z plane) */
const pieceAt = (gap: number, offDeg: number): Vec3 => add(P0.look, mul([Math.sin(offDeg * DEG), 0, Math.cos(offDeg * DEG)], gap));

// his records, frame by frame (the logic's pose G = the ghost `sh.gh3`, the piece `sh.pp`)
const N3_F13993 = {
  G: { eye: [-0.13958191771983766, -0.2367375953179662, -1.2950604026732055], look: [-0.09983304969207228, 0.08477103976618497, -0.08162622285959263], up: [-0.0214520497633784, 0.9665963109894694, -0.2554043483233961] } as CamPose,
  piece: [-0.10372685591426813, 0.0892426909822365, -0.08186138559250916] as Vec3,
};
const R02D_F7020 = {
  G: { eye: [-1.2642497098829226, 1.4308562887421836, 0.2568819545820172], look: [-0.24853944761952765, 0.5113524898656756, 0.2584032702529669], up: [0.67069667840798, 0.7408096090342938, -0.03697416307314362] } as CamPose,
  piece: [-0.3358172966201906, 0.5930596885075775, 0.26976196168128724] as Vec3,
};

describe("⭐⭐⭐ B-a — the framed line's degenerate case read on the glass (`framedLineGlass`)", () => {
  it("the separation on the glass: 25 mm apart at 1.26 m reads 4.6 mm on his glass (≈ 1°) — the band 5 → 15 mm, linear", () => {
    expect(separationOnGlassMm(P0, pieceAt(0.025, 80), HIS)).toBeCloseTo(4.607, 3);
    expect(separationOnGlassMm(P0, pieceAt(gapFor(10), 33), HIS)).toBeCloseTo(10, 9);
    expect([FRAMED_LINE_VIEW_MM, FRAMED_LINE_FULL_MM]).toEqual([5, 15]);
    expect([framedLineShare(0), framedLineShare(5), framedLineShare(7.5), framedLineShare(10), framedLineShare(15), framedLineShare(80)]).toEqual([0, 0, 0.25, 0.5, 1, 1]);
    expect(separationOnGlassMm(P0, pieceAt(0.025, 80), { fovY: 0.8, heightPx: 0 })).toBe(Infinity); // a glass not laid out: today's line
  });

  it("25 mm apart at 1.26 m, 80° off the view → the view's own direction through the piece (today: the line 80° off)", () => {
    const piece = pieceAt(0.025, 80);
    const l = framedLine(P0, piece, HIS);
    expect(l.dir).toEqual(VIEW);
    expect(l.at).toBe(piece);
    expect(l.throughLook).toBe(false);
    expect(ang(framedLine(P0, piece).dir, VIEW)).toBeCloseTo(80, 9); // today's 3 mm rule: the line through both
  });

  it("his frame `n2b8_r03` f13993 (5.9 mm apart, 82.3° off the view, φ +7.55°, the view drawn turned 11.05°): the view's direction; a 7.55° roll about it moves the eye under 1 mm (today's line: 165 mm)", () => {
    const { G, piece } = N3_F13993;
    expect(separationOnGlassMm(G, piece, HIS)).toBeLessThan(1.2);
    const l = framedLine(G, piece, HIS);
    expect(ang(l.dir, sub(G.look, G.eye))).toBeLessThan(1e-6);
    const today = framedLine(G, piece);
    expect(ang(today.dir, sub(G.look, G.eye))).toBeCloseTo(82.3, 1);
    const eyeMove = (line: typeof l): number => len(sub(poseRolled(G, line, 7.55 * DEG).eye, G.eye)) * 1000;
    expect(eyeMove(l)).toBeLessThan(1);
    expect(eyeMove(today)).toBeGreaterThan(160);
  });

  it("continuous across the band: the piece drawn in from 25 mm to 0 on the glass along a line 60° off the view — no step over 0.6° between 0.05 mm of separation; the view's within 5 mm, today's line (bit for bit) from 15 mm", () => {
    let was: Vec3 | null = null;
    let worst = 0;
    for (let mm = 25; mm >= 0; mm -= 0.05) {
      const piece = pieceAt(gapFor(mm), 60);
      const l = framedLine(P0, piece, HIS);
      if (mm <= 4.999) expect(l.dir).toEqual(VIEW);
      if (mm >= 15.001) expect(l).toEqual(framedLine(P0, piece));
      if (was !== null) worst = Math.max(worst, ang(was, l.dir));
      was = l.dir;
    }
    expect(worst).toBeLessThan(0.6);
    expect(worst).toBeGreaterThan(0.1); // it does turn: 60° over the band
  });

  it("no flip inside the band: the piece 10 mm off on the glass swept across square to the view (75° → 105°) — the direction moves ≤ 0.2° a step, through the view (today's flips 150°+)", () => {
    let was: Vec3 | null = null;
    let wasToday: Vec3 | null = null;
    let worst = 0;
    let worstToday = 0;
    for (let off = 75; off <= 105.0001; off += 0.1) {
      const piece = pieceAt(gapFor(10), off);
      const l = framedLine(P0, piece, HIS);
      const t = framedLine(P0, piece);
      expect(dot(l.dir, VIEW)).toBeGreaterThan(0.95); // within 18° of the view at s = ½
      if (was !== null) worst = Math.max(worst, ang(was, l.dir));
      if (wasToday !== null) worstToday = Math.max(worstToday, ang(wasToday, t.dir));
      was = l.dir;
      wasToday = t.dir;
    }
    expect(worst).toBeLessThan(0.2);
    expect(worstToday).toBeGreaterThan(150);
    expect(framedLine(P0, pieceAt(gapFor(10), 90), HIS).dir).toEqual(VIEW); // square to the view: the view's
  });

  it("beyond the band: FAST_ORBIT-like spit frames (far out, the piece 0.3 – 1.2 m in front of the look point, the line 4 – 23° off the view) — bit for bit today's", () => {
    const far: CamPose = { eye: [0.3, 1.9, -1.7], look: [0, 0.2, 0], up: [0, 1, 0] };
    const v = unit(sub(far.look, far.eye));
    const side = unit([v[2], 0, -v[0]]);
    for (const gap of [0.3, 0.6, 1.2]) {
      for (const offDeg of [4, 9, 15, 23]) {
        const u = add(mul(v, -Math.cos(offDeg * DEG)), mul(side, Math.sin(offDeg * DEG)));
        const piece = add(far.look, mul(u, gap));
        expect(separationOnGlassMm(far, piece, HIS)).toBeGreaterThan(25);
        expect(framedLine(far, piece, HIS)).toEqual(framedLine(far, piece));
      }
    }
  });

  it("beyond the band at mid distance: his `09fv_r02` f7020 (one of the nearest of his close-drawer frames before the floor: 120 mm apart at 1.37 m, 5.6° off — 20.3 mm; the nearest, `09fv_r04` f17747, 19.9 mm) and `09fv_r03` f13389 (666 mm apart, 0.6° off the view: ~1.3 mm off on the glass) — today's", () => {
    const { G, piece } = R02D_F7020;
    expect(separationOnGlassMm(G, piece, HIS)).toBeGreaterThan(20.3);
    expect(framedLine(G, piece, HIS)).toEqual(framedLine(G, piece));
    // the piece right in front of the look point at mid distance (the latch's own geometry): ~1.3 mm off the look point PROJECTED on the glass, 80 mm apart read at the distance
    const mid: CamPose = { eye: [0, 0, 0], look: [0, 0, 1.916], up: [0, 1, 0] };
    const p: Vec3 = add(mid.look, mul([Math.sin(0.6 * DEG), 0, -Math.cos(0.6 * DEG)], 0.666));
    const proj = ((((Math.abs(p[0]) / p[2]) * 371) / Math.tan(0.4)) * 25.4) / 96; // its offset projected on the glass (mm)
    expect(proj).toBeLessThan(1.5);
    expect(separationOnGlassMm(mid, p, HIS)).toBeGreaterThan(75);
    expect(framedLine(mid, p, HIS)).toEqual(framedLine(mid, p));
  });

  it("`framedLineGlass`, 1 by default (his word 2026-11-25: default at 1 also in the two other branches, as LIVE `870078b`; 0 = `3b7a479`), 0 or 1 only; the wiring hands the glass (the camera's field, the canvas's CSS height) at 1 only", () => {
    expect(DEFAULT_CONFIG.framedLineGlass).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, framedLineGlass: 1 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, framedLineGlass: 2 })).toThrow();
    const w = readFileSync(new URL("../src/render/roll_shadow.ts", import.meta.url), "utf8");
    expect(w).toContain("const line = framedLine(G, piece, st.cfg.framedLineGlass === 1 ? { fovY: st.camera.fov, heightPx: st.canvas.clientHeight } : null);");
  });
});
