/**
 * ⭐⭐⭐ THE TURN GOVERNOR (2026-10-19, the owner: *"Can you smoothen the peak by reducing this angular speed so that the travel of the camera is gentler ?"*
 * → *"build it. add a slider … Also slow the view between rings 2 and 3 on vertical faces: make another slider for that."*) — `input/turn_governor.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { qFromAxisAngle, qRotate, type Vec3 } from "../src/core/vec";
import { rigTurnFor, UNTURNED } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { elevationGainScale } from "../src/input/orbit";
import { frameTurnDeg, governedRingStep } from "../src/input/turn_governor";
import { pauseMid, pauseSpan, placeOf } from "../src/input/top_pause";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const D = 180 / Math.PI;
const off = { yawRad: 2.5 / D, pitchRad: 2 / D };
const dvPerMm = cfg.boxGainPitch * cfg.gainOrbitElevation * elevationGainScale(cfg); // the shipped gains, inside the leash
const yaw = 0.4;
const curve = (n: Vec3) => {
  const r = rigTurnFor(cfg, yaw, 0.99, n, [Math.cos(yaw), 0, Math.sin(yaw)], UNTURNED);
  return (v: number) => cameraFrameHeld(cfg, r, r, 1, { yaw, v }, off, null);
};
// dy swept ring 4 → ring 1 in pointer events of 0.3 mm (a real pointer's), through the governor at `cap` (or none): the peak turn per mm
const sweep = (fr: ReturnType<typeof curve>, cap: number | null) => {
  let v = 0.99;
  let peak = 0;
  let mm = 0;
  let prev = fr(v);
  while (v > 0.01) {
    const dv = -0.3 * dvPerMm;
    v = Math.max(0.01, v + (cap === null ? dv : governedRingStep(fr, v, dv, dvPerMm, cap)));
    mm += 0.3;
    const f = fr(v);
    peak = Math.max(peak, frameTurnDeg(prev, f) / 0.3);
    prev = f;
  }
  return { peak, mm };
};

describe("⭐⭐⭐ the turn governor (2026-10-19)", () => {
  it("⭐ the frame's turn is the rotation carrying one frame onto the other — view and roll together", () => {
    const a = { dir: [0, 0, 1] as Vec3, up: [0, 1, 0] as Vec3 };
    for (const [axis, deg] of [[[0, 0, 1], 30], [[0, 1, 0], 50], [[1, 1, 0], 12]] as [Vec3, number][]) {
      const q = qFromAxisAngle(axis, deg / D);
      expect(frameTurnDeg(a, { dir: qRotate(q, a.dir), up: qRotate(q, a.up) })).toBeCloseTo(deg, 6);
    }
  });
  it("⭐⭐⭐ over a HORIZONTAL face the camera's half round in the TOP FACE PAUSE held to the cap (12.5°/mm) — ⭐ (2026-10-21) ~24°/mm ungoverned (the pause is the vertical waist's 11.1 mm; ⛔ 96°/mm over the top before the ring); the rest of the travel untouched", () => {
    // the TRAVEL (`input/top_pause.ts`), as the drag steps it: ring 4 → the pause → ring 1, governed on the travel
    const r = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], [Math.cos(yaw), 0, Math.sin(yaw)], UNTURNED);
    const span = pauseSpan(cfg), mid = pauseMid(cfg);
    const fu = (u: number) => cameraFrameHeld(cfg, r, r, 1, { yaw, ...placeOf(u, mid, span) }, off, null);
    const sweepU = (cap: number | null) => {
      let u = 0.99 + span, peak = 0, mm = 0, prev = fu(u);
      while (u > 0.01) {
        const du = -0.3 * dvPerMm;
        u = Math.max(0.01, u + (cap === null ? du : governedRingStep(fu, u, du, dvPerMm, cap, 1 + span)));
        mm += 0.3;
        const f = fu(u);
        peak = Math.max(peak, frameTurnDeg(prev, f) / 0.3);
        prev = f;
      }
      return { peak, mm };
    };
    expect(span / dvPerMm).toBeCloseTo(11.11, 1); // the pause: a vertical face's ring 2 → 3 travel
    const free = sweepU(null);
    expect(free.peak).toBeGreaterThan(14); // ⭐ (2026-10-25) the even roll: 180° over the 11.1 mm, ~16.2°/mm (⛔ smoothstep ~24 at its middle)
    expect(free.peak).toBeLessThan(50); // ⭐ (2026-10-25) ~41°/mm: the camera leaving the zenith for the ring at the pause's start (24 with the level ring)
    const held = sweepU(12.5);
    expect(held.peak).toBeLessThan(13.5);
    expect(held.mm).toBeGreaterThan(free.mm); // more finger through the pause
    expect(held.mm - free.mm).toBeLessThan(12); // ⭐ (2026-10-25) 10.5 mm: the pause turns the camera ~187° (down from the zenith, half round, up again — 111° before)
    const fr = curve([0, 1, 0]);
    // near ring 4 the camera turns slowly: the governor gives the finger's whole step
    const dv = -0.3 * dvPerMm;
    expect(governedRingStep(fr, 0.95, dv, dvPerMm, 12.5)).toBeCloseTo(dv, 12);
  });
  it("⭐⭐⭐ on a VERTICAL face the view between rings 2 and 3 slowed to its own cap (10°/mm) — ⛔ 20°/mm ungoverned", () => {
    const fr = curve([Math.cos(yaw), 0, Math.sin(yaw)]);
    expect(sweep(fr, null).peak).toBeGreaterThan(18);
    expect(sweep(fr, 10).peak).toBeLessThan(10.6);
  });
  it("⭐ two sliders in CAMERA › CAMERA ORBIT AROUND CENTER: 12.5 and 12.5°/mm by default, 5–300 validated", () => {
    expect(DEFAULT_CONFIG.orbitTurnCapDegMm).toBe(12.5); // the owner, 2026-10-19 (first 40)
    expect(DEFAULT_CONFIG.orbitTurnCapVerticalDegMm).toBe(12.5); // the owner, 2026-10-19 (first 10)
    for (const k of ["orbitTurnCapDegMm", "orbitTurnCapVerticalDegMm"] as const) {
      expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, [k]: 4 })).toThrow();
      expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, [k]: 301 })).toThrow();
    }
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    for (const k of ['"orbitTurnCapDegMm"', '"orbitTurnCapVerticalDegMm"']) {
      const at = m.indexOf(k);
      expect(at).toBeGreaterThan(sub);
      expect(m.lastIndexOf("title:", at)).toBe(sub);
    }
  });
  it("⭐ wired: the orbit drag's dy and the coast both go through the governor; the cap by the curve (over the gizmo or not)", () => {
    const p = readFileSync("src/render/pointer_wiring.ts", "utf8");
    expect(p).toContain("const travel = dvRaw !== 0 ? orbitTravelStep(st, dvRaw, orbitDvPerMm(st)) : { dv: 0, du: 0 };"); // ⭐ (2026-10-21) on the travel
    expect(p).toContain("const share = dvRaw !== 0 ? travel.dv / dvRaw : 1;");
    expect(p).toContain("st.orbit.drag(shiftTilt ? 0 : pauseYawStep(topPauseOn(st), st.topPause, -db.dx * st.cfg.boxGainYaw * g.yaw * st.pieceYawGainDrag), dyPx * share);"); // ⭐ (2026-10-25) dx held mid-roll
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("const dv = orbitTravelStep(st, d.dV, orbitDvPerMm(st)).dv;"); expect(g).toContain("st.orbit.nudge(pauseYawStep(topPauseOn(st), st.topPause, d.dYaw), dv);"); // ⭐ (2026-10-25) dx held mid-roll
    expect(g).toContain("const cap = crossing ? cfg.orbitTurnCapDegMm : cfg.orbitTurnCapVerticalDegMm;");
  });
});
