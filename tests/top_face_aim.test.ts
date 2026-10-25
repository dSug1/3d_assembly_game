/**
 * ⭐⭐⭐ THE TOP FACE CAMERA, BEHIND THE PIECE TO ITS ZENITH (2026-10-25, the owner: *"when the gizmo hosting face is horizontal, modify the 2D curve of the camera
 * so that the camera follows the piece without change (same offset, same behind) until the piece reaches its zenith above the gizmo: at this zenith point, the
 * piece pauses, the camera rises to reach the top face camera ring degrees and does the half turn"*) — `topFaceFrame`, `topFacePauseParts`, `topFaceAimLift`
 * (`input/orbit_rig.ts`). ⛔ 2026-10-22: the camera eased to a level from halfway ring 1 → ring 3, the lift solved around the waist.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { pieceScreenY, rigPlace, rigTurnFor, topFaceAimLift, topFaceKnots, topFacePauseParts, UNTURNED } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { elevationGainScale } from "../src/input/orbit";
import { pauseMid, pauseSpan, placeOf } from "../src/input/top_pause";
import type { Vec3 } from "../src/core/vec";

const base = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 };
const D = 180 / Math.PI;
const yaw = 0.4;
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];
const gap = base.cameraRadiusOffsetMm / 1000;
const unit = (a: Vec3): Vec3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const angle = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;

describe("⭐⭐⭐ the top face camera, behind the piece to its zenith (2026-10-25)", () => {
  it("⭐⭐⭐ between ring 3 and the zenith (and from it to ring 2) the camera is BEHIND THE PIECE — the piece's own direction, the offsets faded only as it climbs — up to ~89° straight above (⛔ eased to the ring's level)", () => {
    for (const E of [35, 52, 80]) {
      const cfg = { ...base, topFaceCameraRingDeg: E };
      const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
      const k = topFaceKnots(cfg);
      for (const [v, pause] of [[k.lo + 0.001, 0], [k.lo + 0.03, 0], [k.mid - 0.01, 0], [k.mid, 0], [k.mid, 1], [k.mid + 0.01, 1], [k.hi - 0.001, 1]] as [number, number][]) {
        const d = cameraFrameHeld(cfg, top, top, 1, { yaw, v, pause }, off, null).dir;
        expect(angle(d, unit(rigPlace(cfg, top, yaw, v, 1)))).toBeLessThan(4);
      }
      expect(Math.asin(cameraFrameHeld(cfg, top, top, 1, { yaw, v: k.mid, pause: 0 }, off, null).dir[1]) * D).toBeGreaterThan(88); // at the zenith, the camera too
    }
  });
  it("⭐⭐⭐ the PAUSE in three parts — down to the ring, half round at it, up again — each its share by the angle it turns (52°: 0.2, 0.6, 0.2); no jump anywhere along the travel, the up continuous straight above", () => {
    const [pa, pb] = topFacePauseParts(base);
    const e = (base.topFaceCameraRingDeg * Math.PI) / 180;
    const all = Math.PI - 2 * e + Math.PI * Math.cos(e);
    expect(pa).toBeCloseTo((Math.PI / 2 - e) / all, 12);
    expect(pb).toBeCloseTo((Math.PI * Math.cos(e)) / all, 12);
    const top = rigTurnFor(base, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
    const span = pauseSpan(base), mid = pauseMid(base);
    const mm = base.boxGainPitch * base.gainOrbitElevation * elevationGainScale(base);
    let prev: { dir: Vec3; up: Vec3 } | null = null;
    for (let u = 0; u <= 1 + span + 1e-9; u += 0.1 * mm) {
      const f = cameraFrameHeld(base, top, top, 1, { yaw, ...placeOf(u, mid, span) }, off, null);
      if (prev !== null) {
        expect(angle(f.dir, prev.dir)).toBeLessThan(4); // ° a 0.1 mm step, ungoverned (the turn governor holds it to 12.5°/mm)
        expect(angle(f.up, prev.up)).toBeLessThan(6);
      }
      prev = f;
    }
  });
  it("⭐⭐ the piece WAITS on the screen through the pause — the camera's centre lifted to it while away from the zenith (0 → its height → 0), so it stays where it is while the camera turns round it", () => {
    for (const E of [35, 52, 80]) {
      const cfg = { ...base, topFaceCameraRingDeg: E };
      const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
      const span = pauseSpan(cfg), mid = pauseMid(cfg);
      const height = rigPlace(cfg, top, yaw, mid, 1)[1];
      expect(topFaceAimLift(cfg, top, top, 1, { yaw, v: mid, pause: 0 }, off, gap)).toBe(0);
      expect(topFaceAimLift(cfg, top, top, 1, { yaw, v: mid, pause: 1 }, off, gap)).toBe(0);
      expect(topFaceAimLift(cfg, top, top, 1, { yaw, v: mid, pause: 0.5 }, off, gap)).toBeCloseTo(height, 9);
      for (let u = mid; u <= mid + span + 1e-12; u += span / 50) {
        const at = { yaw, ...placeOf(u, mid, span) };
        const y = pieceScreenY(rigPlace(cfg, top, yaw, at.v, 1), cameraFrameHeld(cfg, top, top, 1, at, off, null).dir, gap, topFaceAimLift(cfg, top, top, 1, at, off, gap)) * D;
        expect(Math.abs(y)).toBeLessThan(1); // within 1° of the centre all through the pause
      }
    }
    // 0 off the pause; below an underside the other way; none on a vertical face
    const top = rigTurnFor(base, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
    const k = topFaceKnots(base);
    for (const v of [0.1, k.lo, k.mid - 0.01, k.mid + 0.01, k.hi, 0.9]) expect(topFaceAimLift(base, top, top, 1, { yaw, v, pause: v < k.mid ? 0 : 1 }, off, gap)).toBe(0);
    const under = rigTurnFor(base, yaw, 0.99, [0, -1, 0], level(yaw), UNTURNED);
    expect(topFaceAimLift(base, under, under, 1, { yaw, v: k.mid, pause: 0.5 }, off, gap)).toBeLessThan(-0.08);
    const side = rigTurnFor(base, yaw, 0.99, level(yaw), level(yaw), UNTURNED);
    expect(topFaceAimLift(base, side, side, 1, { yaw, v: k.mid, pause: 0.5 }, off, gap)).toBe(0);
  });
  it("⭐ wired: the orbit camera placed and aimed about the lifted centre, read with the drawn pause share and the piece as drawn", () => {
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("const lift = topFaceAimLift(st.cfg, st.rigFrom, st.rigTo, st.rigShare, { ...st.cameraLagged, pause: st.topPauseShown }, off, gapFull, placeAt);");
    expect(g).toContain("camAt = [c.x + o[0], c.y + lift + o[1], c.z + o[2]];");
    expect(g).toContain("lookAt = [c.x, c.y + lift, c.z];");
  });
});
