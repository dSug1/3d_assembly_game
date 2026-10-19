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
  it("⭐⭐⭐ over a HORIZONTAL face the turn over the top held to the cap (40°/mm) — ⛔ 96°/mm ungoverned; the rest of the travel untouched", () => {
    const fr = curve([0, 1, 0]);
    const free = sweep(fr, null);
    expect(free.peak).toBeGreaterThan(80);
    const held = sweep(fr, 40);
    expect(held.peak).toBeLessThan(42);
    expect(held.mm).toBeGreaterThan(free.mm); // more finger over the top
    expect(held.mm - free.mm).toBeLessThan(5);
    // near ring 4 the camera turns slowly: the governor gives the finger's whole step
    const dv = -0.3 * dvPerMm;
    expect(governedRingStep(fr, 0.95, dv, dvPerMm, 40)).toBeCloseTo(dv, 12);
  });
  it("⭐⭐⭐ on a VERTICAL face the view between rings 2 and 3 slowed to its own cap (10°/mm) — ⛔ 20°/mm ungoverned", () => {
    const fr = curve([Math.cos(yaw), 0, Math.sin(yaw)]);
    expect(sweep(fr, null).peak).toBeGreaterThan(18);
    expect(sweep(fr, 10).peak).toBeLessThan(10.6);
  });
  it("⭐ two sliders in CAMERA › CAMERA ORBIT AROUND CENTER: 40 and 10°/mm by default, 5–300 validated", () => {
    expect(DEFAULT_CONFIG.orbitTurnCapDegMm).toBe(40);
    expect(DEFAULT_CONFIG.orbitTurnCapVerticalDegMm).toBe(10);
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
    expect(p).toContain("const share = dvRaw !== 0 ? governedOrbitDv(st, dvRaw, orbitDvPerMm(st)) / dvRaw : 1;");
    expect(p).toContain("st.orbit.drag(-db.dx * st.cfg.boxGainYaw * g.yaw * st.pieceYawGainDrag, dyPx * share);");
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("st.orbit.nudge(d.dYaw, governedOrbitDv(st, d.dV, orbitDvPerMm(st)));");
    expect(g).toContain("const cap = crossing ? cfg.orbitTurnCapDegMm : cfg.orbitTurnCapVerticalDegMm;");
  });
});
