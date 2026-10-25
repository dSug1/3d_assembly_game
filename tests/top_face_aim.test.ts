/**
 * ⭐⭐⭐ THE TOP FACE CAMERA, HELD — THE PAUSE ONE MOVEMENT (2026-10-25, the owner: *"there are too many camera movements between the ring 2 and 3 … I don't need
 * the camera to rise up towards the vertical"* → *"I want the camera to reach the top face camera ring and half turn rotate in the same time"* → *"and this
 * should be done when the piece pauses, so there is no relative movement of the piece and camera"*) — `topFaceFrame`, `topFaceAimLift`
 * (`input/orbit_rig.ts`). ⛔ The same day: the camera climbed with the piece to straight above, then down to the ring, round, up and down again.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { pieceScreenY, rigPlace, rigTurnFor, topFaceAimLift, topFaceKnots, UNTURNED } from "../src/input/orbit_rig";
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
const angle = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;
const elev = (d: Vec3): number => Math.asin(d[1]) * D;

describe("⭐⭐⭐ the top face camera held, the pause one movement (2026-10-25)", () => {
  it("⭐⭐⭐ the camera does NOT MOVE while the piece climbs from ring 3 to the zenith (nor while it comes down to ring 2): it is ring 3's (ring 2's) curve camera, held (⛔ it climbed with the piece to ~89° straight above)", () => {
    for (const E of [35, 52, 80]) {
      const cfg = { ...base, topFaceCameraRingDeg: E };
      const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
      const k = topFaceKnots(cfg);
      const atRing3 = cameraFrameHeld(cfg, top, top, 1, { yaw, v: k.lo }, off, null).dir;
      for (let v = k.lo + 0.002; v <= k.mid; v += 0.004) expect(angle(cameraFrameHeld(cfg, top, top, 1, { yaw, v, pause: 0 }, off, null).dir, atRing3)).toBeLessThan(1e-6);
      expect(angle(cameraFrameHeld(cfg, top, top, 1, { yaw, v: k.mid, pause: 0 }, off, null).dir, atRing3)).toBeLessThan(1e-6);
      const atRing2 = cameraFrameHeld(cfg, top, top, 1, { yaw, v: k.hi }, off, null).dir;
      for (let v = k.mid; v <= k.hi - 0.002; v += 0.004) expect(angle(cameraFrameHeld(cfg, top, top, 1, { yaw, v, pause: 1 }, off, null).dir, atRing2)).toBeLessThan(1e-6);
      expect(elev(atRing3)).toBeLessThan(40); // ~37°, never toward straight above
    }
  });
  it("⭐⭐⭐ in the PAUSE, ONE movement: half round the gizmo and, at the same time, up to the ring's height at the middle of the turn and back; no jump along the whole travel", () => {
    for (const E of [35, 52, 80]) {
      const cfg = { ...base, topFaceCameraRingDeg: E };
      const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
      const mid = pauseMid(cfg), span = pauseSpan(cfg);
      expect(elev(cameraFrameHeld(cfg, top, top, 1, { yaw, v: mid, pause: 0.5 }, off, null).dir)).toBeCloseTo(E, 1); // the ring at the middle of the turn
      const az = (p: number): number => { const d = cameraFrameHeld(cfg, top, top, 1, { yaw, v: mid, pause: p }, off, null).dir; return Math.atan2(d[2], d[0]); };
      let turned = 0;
      for (let p = 0.01; p <= 1 + 1e-9; p += 0.01) { let d = az(p) - az(p - 0.01); d -= 2 * Math.PI * Math.round(d / (2 * Math.PI)); turned += d; }
      expect(Math.abs(Math.abs(turned) - Math.PI)).toBeLessThan(0.02); // half round
      expect(Math.abs(az(0.5) - az(0)) * D).toBeGreaterThan(60); // turning while it rises (⛔ first down to the ring, then round)
      const mm = cfg.boxGainPitch * cfg.gainOrbitElevation * elevationGainScale(cfg);
      let prev: { dir: Vec3; up: Vec3 } | null = null;
      for (let u = 0; u <= 1 + span + 1e-9; u += 0.1 * mm) {
        const f = cameraFrameHeld(cfg, top, top, 1, { yaw, ...placeOf(u, mid, span) }, off, null);
        if (prev !== null) {
          expect(angle(f.dir, prev.dir)).toBeLessThan(3); // ° a 0.1 mm step, ungoverned (the turn governor holds it to 12.5°/mm)
          expect(angle(f.up, prev.up)).toBeLessThan(3);
        }
        prev = f;
      }
    }
  });
  it("⭐⭐ the piece KEEPS ITS PLACE on the screen — where the camera behind it would show it — while the camera is held and goes round: the camera's centre lifted (0 at rings 3 and 2, its height above the gizmo in the pause)", () => {
    for (const E of [35, 52, 80]) {
      const cfg = { ...base, topFaceCameraRingDeg: E };
      const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
      const k = topFaceKnots(cfg), span = pauseSpan(cfg), mid = pauseMid(cfg);
      const yOf = (u: number): number => {
        const at = { yaw, ...placeOf(u, mid, span) };
        return pieceScreenY(rigPlace(cfg, top, yaw, at.v, 1), cameraFrameHeld(cfg, top, top, 1, at, off, null).dir, gap, topFaceAimLift(cfg, top, top, 1, at, off, gap)) * D;
      };
      for (let u = k.lo; u <= k.hi + span + 1e-12; u += span / 50) expect(Math.abs(yOf(u))).toBeLessThan(0.6); // near the centre all the way
      for (let u = mid + 1e-6; u <= mid + span - 1e-6; u += span / 40) expect(Math.abs(yOf(u) - yOf(mid + span / 2))).toBeLessThan(0.1); // still through the pause
      expect(topFaceAimLift(cfg, top, top, 1, { yaw, v: k.lo }, off, gap)).toBe(0);
      expect(topFaceAimLift(cfg, top, top, 1, { yaw, v: k.hi }, off, gap)).toBe(0);
      expect(topFaceAimLift(cfg, top, top, 1, { yaw, v: mid, pause: 0.5 }, off, gap)).toBeGreaterThan(0.07);
    }
    const under = rigTurnFor(base, yaw, 0.99, [0, -1, 0], level(yaw), UNTURNED);
    expect(topFaceAimLift(base, under, under, 1, { yaw, v: pauseMid(base), pause: 0.5 }, off, gap)).toBeLessThan(-0.07);
    const side = rigTurnFor(base, yaw, 0.99, level(yaw), level(yaw), UNTURNED);
    expect(topFaceAimLift(base, side, side, 1, { yaw, v: pauseMid(base), pause: 0.5 }, off, gap)).toBe(0);
  });
  it("⭐ wired: the orbit camera placed and aimed about the lifted centre, read with the drawn pause share and the piece as drawn", () => {
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("const lift = topFaceAimLift(st.cfg, st.rigFrom, st.rigTo, st.rigShare, { ...st.cameraLagged, pause: st.topPauseShown }, off, gapFull, placeAt);");
    expect(g).toContain("camAt = [c.x + o[0], c.y + lift + o[1], c.z + o[2]];");
    expect(g).toContain("lookAt = [c.x, c.y + lift, c.z];");
  });
});
