// ⭐⭐⭐ (2026-11-22 evening, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §20.8, D-H24 — what D-H23 uncovered) THE TAUT LEASH AT HIS FINGER'S
// PACE. With the waits gone the far follower's leash goes taut at his pace, and as built (R5, D-H14) it moved the camera at the READING's pace — its spikes
// copied: at 60 frames a second at his mean pace (his finger 12.2° a frame of orbit, 729°/s) the reading at an edge moves 31°, 24°, 18° in three frames (the
// share's ramp) and the camera stepped 23.9° in one frame (the kit's `runs_gx60_1/x_p9`, f205 – f207). D-H14 as decided: *"taut it moves at his finger's
// pace, after he stops it settles at most at his clamp"*; his founding words (§0): *"smooth (so it shall filter out the gizmo jumps …)"*.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirAtHeading, followFarStep, type FollowFarIn, type FollowState, type FollowTop, type FollowTopKnobs } from "../src/input/camera_follow";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const D = Math.PI / 180;
const DT = 1000 / 60;
const BASE: FollowTopKnobs = { tauMs: 200, poleDeg: 30, minDeg: 10, rollDegS: 360, paceShare: 1, degPerMm: 5, maxDegS: 520 };
const PACED: FollowTopKnobs = { ...BASE, leashPace: true };
const EL = 0.3;
const N: readonly [number, number, number] = [0, 0, 1];
const wrapDeg = (a: number): number => ((((a + 180) % 360) + 360) % 360) - 180;

const inp = (psiDeg: number, mm: number): FollowFarIn => ({
  ask: dirAtHeading(wrapDeg(psiDeg) * D, EL),
  orbit: dirAtHeading(wrapDeg(psiDeg) * D, EL),
  psiL: wrapDeg(psiDeg) * D,
  nW: N,
  upShown: null,
  dySign: 0,
  fingerMm: mm,
  jumpAt: [],
});

/** 30 frames at rest; a stroke of `n` frames, the reading `perFrame`° a frame (his finger `perFrame / 5` mm a frame: `perFrame` × 60 °/s of orbit), the
 *  reading's own extra spike at stroke frames 20 – 22 (`spikes`); then he stops — 150 frames. The camera's step a frame (deg), in the stroke and after. */
function run(k: FollowTopKnobs, perFrame: number, n: number, spikes: readonly number[]): { inStroke: number[]; after: number[]; last: number; reading: number } {
  let s: FollowState | null = null;
  let top: FollowTop | null = null;
  let reading = 0;
  const step = (mm: number): number => {
    const was = s === null ? 0 : s.psi / D;
    const r = followFarStep(s, top, inp(reading, mm), DT, k);
    s = r.s;
    top = r.top;
    return wrapDeg(r.s.psi / D - was);
  };
  for (let i = 0; i < 30; i++) step(0);
  const inStroke: number[] = [];
  for (let i = 0; i < n; i++) {
    reading += perFrame + (i >= 20 && i < 20 + spikes.length ? spikes[i - 20]! - perFrame : 0);
    inStroke.push(step(perFrame / 5));
  }
  const after: number[] = [];
  for (let i = 0; i < 150; i++) after.push(step(0));
  return { inStroke, after, last: s === null ? 0 : (s as FollowState).psi / D, reading };
}

describe("⭐⭐⭐ D-H24 — the taut leash at his finger's pace (CAMERA_FOLLOWS_GIZMO.md §20.8)", () => {
  it("his mean pace at 60 fps (12.2° a frame), the reading spiking 31 / 24 / 18° at an edge: no camera step over his finger's pace, never back, settled on the reading", () => {
    const r = run(PACED, 12.2, 40, [31, 24, 18]);
    // ⛔ at the reading's pace (as built): 23.9° in one frame — the next vector
    expect(Math.max(...r.inStroke)).toBeLessThanOrEqual(12.2 + 0.05);
    for (const d of [...r.inStroke, ...r.after]) expect(d).toBeGreaterThanOrEqual(-1e-9);
    // after he stops: his pace as the follower measures it (`pace`: a peak decaying over `followMs`, H2's) for its first ~70 ms — never over it — then at most
    // his clamp (520°/s: 8.67° a frame at 60) from 100 ms on
    expect(Math.max(...r.after)).toBeLessThanOrEqual(12.2 + 0.05);
    expect(Math.max(...r.after.slice(6))).toBeLessThanOrEqual(520 / 60 + 0.05);
    expect(Math.abs(wrapDeg(r.last - r.reading))).toBeLessThan(0.5);
  });

  it("⛔ as built (the taut leash at the READING's pace): the spike copied — a step over 20° in one frame", () => {
    const r = run(BASE, 12.2, 40, [31, 24, 18]);
    expect(Math.max(...r.inStroke)).toBeGreaterThan(20);
  });

  it("under the leash nothing changes: a stroke at 3° a frame (180°/s) — frame for frame as built", () => {
    const a = run(PACED, 3, 40, [4, 5, 4]);
    const b = run(BASE, 3, 40, [4, 5, 4]);
    expect(a.inStroke).toEqual(b.inStroke);
    expect(a.after).toEqual(b.after);
  });

  it("a spin faster than his clamp with no spike (his finger 12.2° a frame, the reading with it): the camera at his finger's pace once taut — the leash still bounds the lag", () => {
    const r = run(PACED, 12.2, 60, []);
    const late = r.inStroke.slice(40);
    for (const d of late) expect(d).toBeCloseTo(12.2, 1);
  });

  it("the switch `followLeashPace` is 1 by default, handed to the far follower's knobs", () => {
    expect(DEFAULT_CONFIG.followLeashPace).toBe(1);
    const w = readFileSync(new URL("../src/render/camera_follow_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(w).toContain("maxDegS: st.cfg.followTurnMaxDegS, leashPace: st.cfg.followLeashPace === 1 };");
  });
});
