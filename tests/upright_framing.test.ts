// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/UPRIGHT_CARRIED_UP.md` §8 — packet J) THE FRAMING CARRIED FROM THE POSE SHOWN, the pure parts: a change
// applied at once draws from the pose shown, the piece and the aim carried straight on the glass to where the logic frames them, over the change's own
// time at the half turn's pace (`framingStep`, `framingShare`, `framedPose`). Each vector shown red on a mutant (the kit's `rebuild_e/j/mut_j.json`).
import { describe, expect, it } from "vitest";
import { framedPose, framingShare, framingStep, type FramingTurn } from "../src/input/upright";
import type { CamPose } from "../src/input/orbit_tilt";
import type { Vec3 } from "../src/core/vec";

const PACE = 520; // deg a second
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
/** a point's place on the glass (tangent units: right / forward, up / forward) */
const onGlass = (p: CamPose, q: Vec3): [number, number] => {
  const f = unit(sub(p.look, p.eye));
  const k = dot(p.up, f);
  const u = unit(sub(p.up, [f[0] * k, f[1] * k, f[2] * k]));
  const r = cross(f, u);
  const v = sub(q, p.eye);
  const z = dot(v, f);
  return [dot(v, r) / z, dot(v, u) / z];
};
// far out: the look point at the origin, the piece 1.2 m in front of the eye, framed below the centre; the logic's new pose frames it above (its offsets
// turned with the heading — the snap)
const PIECE: Vec3 = [0.4, 0.3, 6.2];
const A: CamPose = { eye: [0, 1.5, 7.3], look: [0, 0, 0], up: [0, 1, 0], piece: PIECE };
const B: CamPose = { eye: [0.8, -0.6, 7.3], look: [0, 0, 0], up: [0, 1, 0] };

describe("the framing carried from the pose shown — its clock (`framingStep`)", () => {
  it("a change applied at once opens it from the pose shown; its whole the larger of the change's angle and the half turn's, at the pace", () => {
    const f = framingStep(null, true, A, 0.4, Math.PI, 7, PACE, 1);
    expect(f).not.toBeNull();
    expect(f!.from).toBe(A);
    expect(f!.wholeMs).toBeCloseTo((Math.PI / ((PACE * Math.PI) / 180)) * 1000, 6); // 346 ms: the half turn's
    expect(f!.doneMs).toBe(7);
    const g = framingStep(null, true, A, 1.2, 0, 7, PACE, 1);
    expect(g!.wholeMs).toBeCloseTo((1.2 / ((PACE * Math.PI) / 180)) * 1000, 6); // no half turn: the change's own angle
  });
  it("it runs on by the frame's time and ends at its whole — never before", () => {
    let f: FramingTurn | null = framingStep(null, true, A, 0, Math.PI, 7, PACE, 1);
    let n = 1;
    while (f !== null && n < 1000) {
      f = framingStep(f, false, null, 0, 0, 7, PACE, 1);
      if (f !== null) n++;
    }
    expect(n).toBe(Math.ceil(((Math.PI / ((PACE * Math.PI) / 180)) * 1000) / 7) - 1); // 346.15 ms: 49 frames of 7 ms under way
  });
  it("a change while one runs opens it again from the pose shown then (the chatter in / out / in: every change from the picture drawn)", () => {
    const f = framingStep(null, true, A, 0, Math.PI, 7, PACE, 1)!;
    const g = framingStep({ ...f, doneMs: 200 }, true, B, 0.5, 0, 7, PACE, 1);
    expect(g!.from).toBe(B);
    expect(g!.doneMs).toBe(7);
    expect(g!.keep).toBeNull();
    expect(g!.rule).toBe(0);
  });
  it("none close in (the square camera owns the pose), at a pace of 0 (at once), or for a turn shorter than the frame", () => {
    expect(framingStep(null, true, A, 1, Math.PI, 7, PACE, 0.5)).toBeNull();
    expect(framingStep(null, true, A, 1, Math.PI, 7, 0, 1)).toBeNull();
    expect(framingStep(null, true, A, 0.001, 0, 7, PACE, 1)).toBeNull();
    const f = framingStep(null, true, A, 0, Math.PI, 7, PACE, 1)!;
    expect(framingStep(f, false, null, 0, 0, 7, PACE, 0.5)).toBeNull();
  });
});

describe("the framing carried from the pose shown — the pose drawn (`framingShare`, `framedPose`)", () => {
  const f0: FramingTurn = { from: A, doneMs: 0, wholeMs: 300, keep: null, rule: 0, axis: null };
  it("its share is the smoothstep of its time done", () => {
    expect(framingShare({ ...f0, doneMs: 150 })).toBeCloseTo(0.5, 12);
    expect(framingShare({ ...f0, doneMs: 75 })).toBeCloseTo(0.15625, 12);
    expect(framingShare(f0)).toBe(0);
  });
  it("at its start the pose shown — the piece where it was on the glass; at its end the logic's — the piece where the logic frames it", () => {
    const a = onGlass(A, PIECE);
    const b = onGlass(B, PIECE);
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(0.1); // the snap there is to carry
    const p0 = framedPose(f0, B, PIECE).pose;
    const g0 = onGlass(p0, PIECE);
    expect(Math.hypot(g0[0] - a[0], g0[1] - a[1])).toBeLessThan(1e-9);
    const p1 = framedPose({ ...f0, doneMs: 300 }, B, PIECE).pose;
    const g1 = onGlass(p1, PIECE);
    expect(Math.hypot(g1[0] - b[0], g1[1] - b[1])).toBeLessThan(1e-9);
  });
  it("on the way the piece is carried STRAIGHT on the glass (no swing round the centre), a share at a time", () => {
    const a = onGlass(A, PIECE);
    const b = onGlass(B, PIECE);
    let f: FramingTurn = f0;
    for (const t of [60, 120, 180, 240]) {
      const r = framedPose({ ...f, doneMs: t }, B, PIECE);
      f = r.turn;
      const g = onGlass(r.pose, PIECE);
      const k = framingShare({ ...f0, doneMs: t });
      expect(Math.hypot(g[0] - (a[0] + (b[0] - a[0]) * k), g[1] - (a[1] + (b[1] - a[1]) * k))).toBeLessThan(1e-6);
    }
    expect(f.rule).toBe(1);
  });
});
