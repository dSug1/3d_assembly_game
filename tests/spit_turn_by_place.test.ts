// ⭐⭐⭐ (2026-11-22, `Claude/40_RENDER_SCENE/spec/TOP_BOTTOM_STUDY.md` §10 — D-R1, D-R1.1 as amended) THE ZENITH CROSSING'S TURN BY PLACE: the place `w`
// (the orbit's map pitch toward the pole, `spitPlaceShare`), the spit camera's heading with its side bias weighted by `w` at its ONE source
// (`spitCameraHeading`), a side change silent where `w` is 0 (`spitStep`), behind `spitTurnByPlace` (0 = today's code path). ⭐ RED on the old code
// (`ae0ed63`): `spitPlaceShare` and the tunables do not exist; `spitCameraHeading` ignores a 4th argument, so at `w` 0 the two sides' headings stay apart
// (the half flip at the vertical: 180°); the wiring strings are absent.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spitCameraHeading, spitPlaceShare, spitSide, SPIT_BIAS_FROM_RAD, SPIT_BIAS_FULL_RAD, SPIT_SIDE_BIAS, spitHeading, spitSideRef } from "../src/input/polar_zone";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const wrap = (x: number) => Math.atan2(Math.sin(x), Math.cos(x));
const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
/** one function's source, from its signature to the first closing brace at column 0, whitespace collapsed */
function fnCode(f: string, sig: string): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return s.slice(i, s.indexOf("\n}\n", i) + 3).replace(/\s+/g, " ");
}
const before = (src: string, a: string, b: string) => {
  expect(src.indexOf(a), a).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(b), b).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(a), `${a} before ${b}`).toBeLessThan(src.indexOf(b));
};

/** ⭐ `spitCameraHeading` as it stood at `ae0ed63` (frozen here): the switch 0 must give exactly this */
function oldHeading(u: Vec3, a: Vec3, side: number): number {
  const r = spitSideRef(a);
  const p = Math.asin(Math.min(1, Math.abs(u[1]) / Math.max(1e-12, Math.hypot(u[0], u[1], u[2]))));
  const x = Math.min(1, Math.max(0, (p - SPIT_BIAS_FROM_RAD) / (SPIT_BIAS_FULL_RAD - SPIT_BIAS_FROM_RAD)));
  const b = SPIT_SIDE_BIAS * x * x * (3 - 2 * x);
  const hx = u[0] + side * b * r[0];
  const hz = u[2] + side * b * r[2];
  return Math.hypot(hx, hz) > 1e-9 ? Math.atan2(hz, hx) : spitHeading(a, side);
}

/** the camera's direction in a spit along x (F's vertical the axis): `p` toward the −x tip, `y` round the axis from the top (+z the side +1) */
const dirAt = (pDeg: number, yDeg: number): Vec3 => {
  const p = pDeg * D;
  const y = yDeg * D;
  return [-Math.sin(p), Math.cos(p) * Math.cos(y), Math.cos(p) * Math.sin(y)];
};
const A: Vec3 = [1, 0, 0];

describe("D-R1.1 the place: w = 1 − smoothstep(|map pitch|) between two angles (`spitPlaceShare`)", () => {
  it("1 mid-axis, 0 from the second angle on, the smoothstep between; either sign; NaN → 1; a step when the two meet", () => {
    expect(spitPlaceShare(0, 12, 25)).toBe(1);
    expect(spitPlaceShare(12 * D, 12, 25)).toBe(1);
    expect(spitPlaceShare(-12 * D, 12, 25)).toBe(1);
    expect(spitPlaceShare(18.5 * D, 12, 25)).toBeCloseTo(0.5, 12);
    expect(spitPlaceShare(-18.5 * D, 12, 25)).toBeCloseTo(0.5, 12);
    expect(spitPlaceShare(25 * D, 12, 25)).toBe(0);
    expect(spitPlaceShare(85 * D, 12, 25)).toBe(0);
    expect(spitPlaceShare(Number.NaN, 12, 25)).toBe(1);
    expect(spitPlaceShare(19 * D, 20, 20)).toBe(1);
    expect(spitPlaceShare(20 * D, 20, 20)).toBe(0);
    let prev = 1;
    for (let d = 0; d <= 40; d += 0.5) {
      const w = spitPlaceShare(d * D, 12, 25);
      expect(w).toBeLessThanOrEqual(prev);
      prev = w;
    }
  });
  it("his strokes' crossings (`r6/runs_r6`, the map's pitch): near the left tip close in −28° → 0; mid-body +5° close in, −7 … +9° far → 1", () => {
    expect(spitPlaceShare(-28 * D, 12, 25)).toBe(0);
    for (const d of [5, -7, 9, 1, -3]) expect(spitPlaceShare(d * D, 12, 25)).toBe(1);
  });
});

describe("D-R1.2 the turn by place at its one source (`spitCameraHeading`, its side bias × w)", () => {
  const dirs: Vec3[] = [dirAt(0, 1), dirAt(0, -1), dirAt(5, 3), dirAt(28, -2), dirAt(28, 2), dirAt(60, 30), dirAt(-15, 170), [0.3, -0.9, 0.2], [0, 1, 0]];
  it("w absent: exactly the heading as it stood (`ae0ed63`) — the switch 0's code path; w 1: the same, bit for bit", () => {
    for (const u of dirs)
      for (const s of [1, -1]) {
        expect(spitCameraHeading(u, A, s)).toBe(oldHeading(u, A, s));
        expect(spitCameraHeading(u, A, s, 1)).toBe(oldHeading(u, A, s));
      }
  });
  it("⭐ w 0: no flip across a side change — the two sides' headings one (looking down the side's bias was a half turn); w 1: the half flip as today", () => {
    for (const u of [dirAt(0, 3), dirAt(5, -3), dirAt(28, 2)]) {
      expect(Math.abs(wrap(spitCameraHeading(u, A, 1, 0) - spitCameraHeading(u, A, -1, 0)))).toBeLessThan(1e-12);
    }
    // the vertical's neighbourhood, mid-axis: today's half turn kept at w 1
    const u = dirAt(0, 1);
    expect(Math.abs(wrap(spitCameraHeading(u, A, 1, 1) - spitCameraHeading(u, A, -1, 1)))).toBeGreaterThan(170 * D);
    // partial between: the turn across the change grows with w (3° toward a tip, 1° past the top)
    const v = dirAt(3, 1);
    let prev = -1;
    for (const w of [0, 0.25, 0.5, 0.75, 1]) {
      const t = Math.abs(wrap(spitCameraHeading(v, A, 1, w) - spitCameraHeading(v, A, -1, w)));
      expect(t).toBeGreaterThan(prev);
      prev = t;
    }
  });
  it("⛔ no spin looking down where w is 0 (from 25° toward a pole): a 1° step round the axis over the top turns the heading by under 2.5°", () => {
    for (const p of [25, 28, 40, 60]) {
      let h0 = spitCameraHeading(dirAt(p, -30), A, spitSide(dirAt(p, -30), A, 0), 0);
      let side = spitSide(dirAt(p, -30), A, 0);
      for (let y = -29; y <= 30; y++) {
        const u = dirAt(p, y);
        side = spitSide(u, A, side);
        const h = spitCameraHeading(u, A, side, spitPlaceShare(p * D, 12, 25));
        expect(Math.abs(wrap(h - h0)), `p ${p} y ${y}`).toBeLessThan(2.5 * D);
        h0 = h;
      }
    }
  });
});

describe("D-R1.3 – D-R1.4 the wiring (`render/assembly_wiring.ts`) and the switch", () => {
  const W = "render/assembly_wiring.ts";
  it("w written ONCE a frame, by `spitStep`: none out of a spit; else the place at the map's pitch under the switch — before the free face's return", () => {
    const s = fnCode(W, "export function spitStep(");
    const none = "st.asmSpitW = null;";
    const put = "st.asmSpitW = st.cfg.spitTurnByPlace === 1 && st.asmMapQ !== null ? spitPlaceShare(st.asmMapQ.pitch, st.cfg.spitPlaceFromDeg, st.cfg.spitPlaceToDeg) : null;";
    expect(s).toContain(none);
    expect(s).toContain(put);
    before(s, "if (z === null) {", none);
    before(s, put, "if (st.asmFree !== null) return;");
    // the one writer in the code (the start state aside)
    const src = raw(W);
    expect(src.match(/st\.asmSpitW = /g)?.length).toBe(2);
    expect(raw("render/assembly_wiring.ts")).toMatch(/asmSpitW: null,/);
  });
  it("a side change on a crossing path where w is 0: silent, as round a tip (the edge's hold ended, no turn); between: the one event as today", () => {
    const s = fnCode(W, "export function spitStep(");
    const silent = "if (crossingPitch(u0, u, z.axis) < SPIT_CROSSING_PITCH_RAD || st.asmSpitW === 0) { st.asmEdgeHold = null; return; }";
    expect(s).toContain(silent);
    before(s, silent, "crossTurn(st, { at: null, uWas: null, carry: true, paced: false, hold: hold === null ? 0 : hold.sign });");
  });
  it("every reader of the spit camera's heading reads the SAME weighted one (`st.asmSpitW ?? undefined`): the camera frame, the free face's entry", () => {
    const cf = fnCode(W, "function assemblyCameraFrameRaw(");
    expect(cf).toContain("spitCameraHeading(uW, st.asmZone!.zone.axis, side, st.asmSpitW ?? undefined)");
    const fs = fnCode(W, "function freeShownHeading(");
    expect(fs).toContain("spitCameraHeading(uW, st.asmZone!.zone.axis, side0, st.asmSpitW ?? undefined)");
    const all = [...raw(W).matchAll(/spitCameraHeading\(([^;]*)\)/g)].filter((m) => !m[0].includes("`"));
    for (const m of all) expect(m[0]).toContain("st.asmSpitW ?? undefined");
  });
  it("the switch and its two angles: 1, 12°, 25° by default; 0 or 1; the angles in [0, 90]; three sliders beside it", () => {
    expect(DEFAULT_CONFIG.spitTurnByPlace).toBe(1);
    expect(DEFAULT_CONFIG.spitPlaceFromDeg).toBe(12);
    expect(DEFAULT_CONFIG.spitPlaceToDeg).toBe(25);
    expect(() => validateGestureConfig(DEFAULT_CONFIG)).not.toThrow();
    for (const v of [0.5, 2, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, spitTurnByPlace: v })).toThrow();
    for (const k of ["spitPlaceFromDeg", "spitPlaceToDeg"] as const) {
      for (const v of [0, 45, 90]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, [k]: v })).not.toThrow();
      for (const v of [-1, 91, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, [k]: v })).toThrow();
    }
    const menu = raw("render/tuning_menu.ts");
    expect(menu).toContain('"spitTurnByPlace", 0, 1, 1)');
    expect(menu).toContain('"spitPlaceFromDeg", 0, 90, 1)');
    expect(menu).toContain('"spitPlaceToDeg", 0, 90, 1)');
  });
});
