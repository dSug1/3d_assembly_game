/**
 * ⭐⭐⭐ THE TOP FACE CURVE, TURNED (2026-10-25, the owner: *"let's start again from the beginning: for the case when the gizmo hosting face is horizontal:
 * copy the 2D curve of when the gizmo hosting face is vertical, and rotate it 90 degrees. Modify it so that during ring 1 and ring 4 the camera offset is the
 * same in world coordinates as the camera offset when gizmo hosting face is vertical."*) — `rigPlace`, `topFaceFrame` (`input/orbit_rig.ts`).
 * ⛔ 2026-10-22 → 25: the low approach (`topFaceApproach`), deleted.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { rigPlace, rigTurnFor, UNTURNED } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { orbitOffset } from "../src/input/orbit";
import { qRotate, type Vec3 } from "../src/core/vec";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 };
const D = 180 / Math.PI;
const yaw = 0.4;
const lv: Vec3 = [Math.cos(yaw), 0, Math.sin(yaw)];
const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], lv, UNTURNED);
const side = rigTurnFor(cfg, yaw, 0.99, lv, lv, UNTURNED);
const az = (d: Vec3): number => Math.atan2(d[2], d[0]);
const el = (d: Vec3): number => Math.asin(d[1] / Math.hypot(...d));
const wrap = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
// the camera's offset from the piece's direction, in the WORLD: about the vertical (yaw) and in elevation (pitch), °
const worldOffset = (rig: typeof top, v: number): [number, number] => {
  const p = rigPlace(cfg, rig, yaw, v, 1);
  const d = cameraFrameHeld(cfg, rig, rig, 1, { yaw, v, pause: v < 0.5 ? 0 : 1 }, off, null).dir;
  return [Math.abs(wrap(az(d) - az(p))) * D, Math.abs(el(d) - el(p)) * D];
};

describe("⭐⭐⭐ the top face curve, turned (2026-10-25)", () => {
  it("⭐⭐⭐ the vertical face's 2D curve turned 90°: the piece on it at every place (⛔ brought down to 31.7° on the outer stretches)", () => {
    for (let v = 0; v <= 1; v += 0.05) {
      const a = rigPlace(cfg, top, yaw, v, 1);
      const b = qRotate(top.q, orbitOffset(cfg, top.yaw0, v, 1).offsetM);
      for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 12);
    }
  });
  it("⭐⭐⭐ at rings 1 and 4 the camera's offset from the piece is the vertical face's IN THE WORLD — 2.5° about the vertical, 2° in elevation", () => {
    for (const v of [0, 0.05, 0.95, 1]) {
      const t = worldOffset(top, v), s = worldOffset(side, v);
      expect(t[0]).toBeCloseTo(s[0], 1);
      expect(t[1]).toBeCloseTo(s[1], 1);
      expect(t[0]).toBeCloseTo(2.5, 1);
      expect(t[1]).toBeCloseTo(2, 1);
    }
  });
});
