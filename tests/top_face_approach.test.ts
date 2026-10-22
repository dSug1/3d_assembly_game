/**
 * ⭐⭐⭐ THE TOP FACE APPROACH, LOW (2026-10-22, the owner: *"the piece seems to follow the 2D curve in blue … Can we modify the 2D curve to follow the black ?"*
 * → *"at the max distance, why the offset and angle of the camera is not the same if the gizmo hosting face is horizontal or vertical ? I want the same as for
 * vertical hosting face."* → *"Same in the world"* → *"build it"*) — `topFaceApproach` in `rigPlace` (`input/orbit_rig.ts`).
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { rigPlace, rigTurnFor, topFaceKnots, UNTURNED } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { orbitOffset } from "../src/input/orbit";
import { qRotate, type Vec3 } from "../src/core/vec";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 };
const D = 180 / Math.PI;
const gap = cfg.cameraRadiusOffsetMm / 1000;
const yaw = 0.4;
const lv: Vec3 = [Math.cos(yaw), 0, Math.sin(yaw)];
const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], lv, UNTURNED);
const side = rigTurnFor(cfg, yaw, 0.99, lv, lv, UNTURNED);
// a point on the screen (deg) seen by an upright camera at direction `d` from the gizmo, at distance `rr`, aimed at the gizmo
const onScreen = (q0: Vec3, d: Vec3, rr: number): [number, number] => {
  const q: Vec3 = [q0[0] - d[0] * rr, q0[1] - d[1] * rr, q0[2] - d[2] * rr];
  const up0: Vec3 = [-d[1] * d[0], 1 - d[1] * d[1], -d[1] * d[2]];
  const ul = Math.hypot(...up0);
  const up: Vec3 = [up0[0] / ul, up0[1] / ul, up0[2] / ul];
  const fw: Vec3 = [-d[0], -d[1], -d[2]];
  const right: Vec3 = [fw[1] * up[2] - fw[2] * up[1], fw[2] * up[0] - fw[0] * up[2], fw[0] * up[1] - fw[1] * up[0]];
  const z = q[0] * fw[0] + q[1] * fw[1] + q[2] * fw[2];
  return [Math.atan2(q[0] * right[0] + q[1] * right[1] + q[2] * right[2], z) * D, Math.atan2(q[0] * up[0] + q[1] * up[1] + q[2] * up[2], z) * D];
};
// the piece's apparent height above its face on the screen: the piece against the point of the face straight under it (normal `n`)
const apparent = (rig: typeof top, n: Vec3, v: number): number => {
  const p = rigPlace(cfg, rig, yaw, v, 1);
  const d = cameraFrameHeld(cfg, rig, rig, 1, { yaw, v, pause: 0 }, off, null).dir;
  const h = p[0] * n[0] + p[1] * n[1] + p[2] * n[2];
  const rr = Math.hypot(...p) + gap;
  const a = onScreen(p, d, rr);
  const b = onScreen([p[0] - n[0] * h, p[1] - n[1] * h, p[2] - n[2] * h], d, rr);
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
};

describe("⭐⭐⭐ the top face approach, low (2026-10-22)", () => {
  it("⭐⭐⭐ at MAX DISTANCE the piece and the camera stand where they do over a VERTICAL face: the piece 31.7° up, the camera 33.7°, the piece at the same place on the screen (⛔ 58° / ~60°)", () => {
    const pt = rigPlace(cfg, top, yaw, 1, 1), pv = rigPlace(cfg, side, yaw, 1, 1);
    const dt = cameraFrameHeld(cfg, top, top, 1, { yaw, v: 1 }, off, null).dir, dv = cameraFrameHeld(cfg, side, side, 1, { yaw, v: 1 }, off, null).dir;
    expect(Math.asin(pt[1] / Math.hypot(...pt)) * D).toBeCloseTo(Math.asin(pv[1] / Math.hypot(...pv)) * D, 6);
    expect(Math.asin(dt[1]) * D).toBeCloseTo(Math.asin(dv[1]) * D, 6);
    expect(Math.asin(dt[1]) * D).toBeCloseTo(33.7, 1);
    const st = onScreen(pt, dt, Math.hypot(...pt) + gap), sv = onScreen(pv, dv, Math.hypot(...pv) + gap);
    expect(st[0]).toBeCloseTo(sv[0], 6);
    expect(st[1]).toBeCloseTo(sv[1], 6);
    // ring 4 too (v 0): above the face, at the same angle
    const p4 = rigPlace(cfg, top, yaw, 0, 1);
    expect(Math.asin(p4[1] / Math.hypot(...p4)) * D).toBeCloseTo(Math.atan2(Math.abs(cfg.orbitBottomHeightM), cfg.orbitBottomRadiusM) * D, 6);
  });
  it("⭐⭐⭐ the descent SEEN EVENLY — the piece's apparent height above the face falls steadily from ring 4 (34° at max distance) and is well under way by halfway to ring 3 (⛔ held at 17°–18° for 20 mm, then 2.5° in 12 mm)", () => {
    const k = topFaceKnots(cfg);
    let prev = Infinity;
    for (let v = 0; v <= k.from; v += 0.005) {
      const a = apparent(top, [0, 1, 0], v);
      expect(a).toBeLessThan(prev + 1e-9); // falling from the start (⛔ rising 17.0° → 18.1°)
      prev = a;
    }
    expect(apparent(top, [0, 1, 0], 0)).toBeGreaterThan(30); // 34.4° at max distance (⛔ 17°)
    expect(apparent(top, [0, 1, 0], k.from)).toBeLessThan(0.8 * apparent(top, [0, 1, 0], 0)); // well under way by halfway to ring 3 (⛔ it had RISEN: 17.0° → 17.8°)
  });
  it("⭐ the waist and the distances unchanged: rings 3 and 2, the pause's place, the distance to the gizmo at every place", () => {
    const k = topFaceKnots(cfg);
    for (const v of [k.lo + 1e-6, k.mid, k.hi - 1e-6]) {
      const a = rigPlace(cfg, top, yaw, v, 1);
      const b = qRotate(top.q, orbitOffset(cfg, top.yaw0, v, 1).offsetM);
      for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 9);
    }
    for (let v = 0; v <= 1; v += 0.05) expect(Math.hypot(...rigPlace(cfg, top, yaw, v, 1))).toBeCloseTo(orbitOffset(cfg, 0, v, 1).radiusM, 9);
  });
});
