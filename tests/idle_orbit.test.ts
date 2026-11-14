/**
 * ⭐⭐ THE IDLE ORBIT (`core/idle_orbit.ts`; `40_RENDER_SCENE/spec/ANIMATION.md` §4): a small ellipse round the game angles, faded in from exactly
 * 0, a closed loop; the catch back by the finger's travel (or in time without a delta), monotone, landing exactly on the game position; the
 * wiring a LAYER (on for the draw, off after it) — each rule with its counter-example.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catchProgress, caughtOffset, IDLE_ORBIT_DEFAULT, idleOffset } from "../src/core/idle_orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const cfg = IDLE_ORBIT_DEFAULT;
const deg = (r: number) => (r * 180) / Math.PI;

describe("the orbit", () => {
  it("starts at EXACTLY the game position and grows smoothly (no jump: slow in)", () => {
    expect(idleOffset(0, cfg)).toEqual({ yaw: 0, pitch: 0 });
    const a = idleOffset(0.02, cfg);
    expect(Math.abs(deg(a.yaw))).toBeLessThan(0.01);
    expect(Math.abs(deg(a.pitch))).toBeLessThan(0.01);
  });
  it("small: never past the swing (1.2° yaw, 0.5° pitch each side)", () => {
    for (let t = 0; t < 30; t += 0.01) {
      const o = idleOffset(t, cfg);
      expect(Math.abs(deg(o.yaw))).toBeLessThanOrEqual(1.2 + 1e-9);
      expect(Math.abs(deg(o.pitch))).toBeLessThanOrEqual(0.5 + 1e-9);
    }
  });
  it("a CLOSED loop once faded in (the video's 6.8 s): one loop later, the same offset", () => {
    for (const t of [3, 4.1, 7.7]) {
      const a = idleOffset(t, cfg), b = idleOffset(t + cfg.periodS, cfg);
      expect(b.yaw).toBeCloseTo(a.yaw, 12);
      expect(b.pitch).toBeCloseTo(a.pitch, 12);
    }
  });
  it("an ELLIPSE round the game angles: both sides of it in yaw and in pitch", () => {
    const ys = [], ps = [];
    for (let t = 3; t < 3 + cfg.periodS; t += 0.05) {
      const o = idleOffset(t, cfg);
      ys.push(o.yaw);
      ps.push(o.pitch);
    }
    expect(Math.min(...ys)).toBeLessThan(0);
    expect(Math.max(...ys)).toBeGreaterThan(0);
    expect(Math.min(...ps)).toBeLessThan(0);
    expect(Math.max(...ps)).toBeGreaterThan(0);
  });
});

describe("the catch back", () => {
  const held = { yaw: 0.02, pitch: -0.008 };
  it("by the finger's travel, PROPORTIONAL: 6 mm of 12 = half; 12 mm = home exactly", () => {
    expect(catchProgress(0, 6, 9999, cfg)).toBeCloseTo(0.5, 12);
    expect(caughtOffset(held, catchProgress(0, 12, 0, cfg))).toEqual({ yaw: 0, pitch: -0 });
  });
  it("⛔ once the finger moved, time does not drive it (a still finger mid-drag: the camera waits)", () => {
    expect(catchProgress(0.25, 3, 5000, cfg)).toBeCloseTo(0.25, 12);
  });
  it("an input WITHOUT a delta (a tap, a press held still, a wheel): in time, 300 ms", () => {
    expect(catchProgress(0, 0, 150, cfg)).toBeCloseTo(0.5, 12);
    expect(catchProgress(0, 0, 300, cfg)).toBe(1);
  });
  it("never goes back (monotone)", () => {
    expect(catchProgress(0.8, 1, 0, cfg)).toBe(0.8);
  });
});

describe("the wiring: a LAYER, on for the draw only; scene inputs only; a MODULE", () => {
  const w = readFileSync(new URL("../src/render/idle_orbit_wiring.ts", import.meta.url), "utf8");
  it("added before the draw, taken off after it, the view rebuilt", () => {
    expect(w).toMatch(/onBeforeRenderObservable\.add[\s\S]*cam\.alpha \+= current\.yaw/);
    expect(w).toMatch(/onAfterRenderObservable\.add[\s\S]*st\.camera\.alpha -= saved\.dAlpha;[\s\S]*st\.camera\.getViewMatrix\(true\)/);
  });
  it("the canvas only (⛔ the menu and the UI are not inputs); a hovering mouse is not one", () => {
    expect(w).toMatch(/canvas\.addEventListener\("pointerdown"/);
    expect(w).not.toMatch(/window\.addEventListener|document\.addEventListener/);
    expect(w).toMatch(/if \(p === undefined\) return; \/\/ ⛔ a mouse hovering is not an input/);
  });
  it("one marked line wires it", () => {
    const s = readFileSync(new URL("../src/render/scene.ts", import.meta.url), "utf8");
    expect(s.match(/ANIMATION MODULE: idle/g)?.length).toBe(2);
  });
  it("the defaults: after 4 s (the owner: \"from 10s to 5s\", then \"from 5 s to 4 s\"), the video's loop", () => {
    expect(DEFAULT_CONFIG.idleOrbitAfterS).toBe(4);
    expect(DEFAULT_CONFIG.idleOrbitPeriodS).toBe(6.8);
  });
});
