/**
 * ⭐⭐⭐ THE CAMERA'S CENTRE LIFTED THROUGH THE WAIST (2026-10-22, the owner: *"the movement of the piece in screen view between ring 2 and ring 3 is not nice: it
 * looks like the piece goes up between ring 2 and zenith above gizmo, then freeze, then goes down between zenith and ring 3. All the more if top face camera
 * ring is low (35 degrees min slider). Modify the 2D curve of the camera and the top face camera ring so that there is no such jump back and forth of the piece
 * in the screen view around the waist of the dy travel."*) — `topFaceAimLift`, `pieceScreenY` (`input/orbit_rig.ts`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { pieceScreenY, rigPlace, rigTurnFor, topFaceAimLift, topFaceKnots, UNTURNED } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { pauseMid, pauseSpan, placeOf } from "../src/input/top_pause";
import type { Vec3 } from "../src/core/vec";

const base = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 };
const D = 180 / Math.PI;
const yaw = 0.4;
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];
const gap = base.cameraRadiusOffsetMm / 1000;

describe("⭐⭐⭐ the camera's centre lifted through the waist (2026-10-22)", () => {
  it("⭐⭐⭐ over a top face the piece HOLDS its height on the screen from ring 3 through the pause to ring 2 — at any ring height (35°–85°): no up, freeze, down (⛔ aimed at the gizmo: up 2.6° at 50°, 3.3° at 35°, in ~5 mm, then back)", () => {
    for (const E of [35, 50, 70, 85]) {
      const cfg = { ...base, topFaceCameraRingDeg: E };
      const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
      const k = topFaceKnots(cfg);
      const span = pauseSpan(cfg), mid = pauseMid(cfg);
      const yOf = (u: number): number => {
        const at = { yaw, ...placeOf(u, mid, span) };
        return pieceScreenY(rigPlace(cfg, top, yaw, at.v, 1), cameraFrameHeld(cfg, top, top, 1, at, off, null).dir, gap, topFaceAimLift(cfg, top, top, 1, at, off, gap)) * D;
      };
      const atRing3 = yOf(k.lo);
      for (let u = k.lo; u <= k.hi + span + 1e-12; u += span / 60) expect(Math.abs(yOf(u) - atRing3)).toBeLessThan(0.05);
      // and no reversal of its vertical motion from ring 1 to the middle of the pause
      let dir = 0;
      let rev = 0;
      let prev = yOf(0);
      for (let u = 0.0025; u <= mid + span / 2; u += 0.0025) {
        const y = yOf(u);
        if (Math.abs(y - prev) > 1e-3) {
          const s = Math.sign(y - prev);
          if (dir !== 0 && s !== dir) rev++;
          dir = s;
        }
        prev = y;
      }
      expect(rev).toBe(0);
    }
  });
  it("⭐⭐ the lift is 0 at rings 3 and 2 and outside the waist (the camera there as ever), the piece's own height above the gizmo in the pause (~9 cm), below an underside; none on a vertical face", () => {
    const top = rigTurnFor(base, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
    const k = topFaceKnots(base);
    for (const v of [0.1, 0.3, k.lo, k.hi, 0.8]) expect(topFaceAimLift(base, top, top, 1, { yaw, v }, off, gap)).toBe(0);
    const inPause = topFaceAimLift(base, top, top, 1, { yaw, v: k.mid, pause: 0.5 }, off, gap);
    expect(inPause).toBeGreaterThan(0.08);
    expect(inPause).toBeLessThan(0.12);
    const under = rigTurnFor(base, yaw, 0.99, [0, -1, 0], level(yaw), UNTURNED);
    expect(topFaceAimLift(base, under, under, 1, { yaw, v: k.mid, pause: 0.5 }, off, gap)).toBeLessThan(-0.08);
    const side = rigTurnFor(base, yaw, 0.99, level(yaw), level(yaw), UNTURNED);
    for (const v of [k.lo + 0.01, k.mid, k.hi - 0.01]) expect(topFaceAimLift(base, side, side, 1, { yaw, v }, off, gap)).toBe(0);
  });
  it("⭐ wired: the orbit camera placed and aimed about the lifted centre, read with the drawn pause share and the zoom's gap", () => {
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("const lift = topFaceAimLift(st.cfg, st.rigFrom, st.rigTo, st.rigShare, { ...st.cameraLagged, pause: st.topPauseShown }, off, gapFull, placeAt);");
    expect(g).toContain("const q = ringPlaceNow(st, st.cameraLagged!.yaw, v, st.boxOrbit!.zoom);"); // the piece as drawn: the orbit's zoom, its distance clamped
    expect(g).toContain("camAt = [c.x + o[0], c.y + lift + o[1], c.z + o[2]];");
    expect(g).toContain("lookAt = [c.x, c.y + lift, c.z];");
  });
});
