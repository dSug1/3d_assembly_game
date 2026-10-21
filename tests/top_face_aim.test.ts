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
import { elevationGainScale } from "../src/input/orbit";
import { pauseMid, pauseSpan, placeOf } from "../src/input/top_pause";
import type { Vec3 } from "../src/core/vec";

const base = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 };
const D = 180 / Math.PI;
const yaw = 0.4;
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];
const gap = base.cameraRadiusOffsetMm / 1000;

describe("⭐⭐⭐ the camera's centre lifted through the waist (2026-10-22)", () => {
  it("⭐⭐⭐ over a top face the piece HOLDS its height on the screen from ring 3 through the pause to ring 2 — at any ring height (35°–80°): no up, freeze, down (⛔ aimed at the gizmo: up 2.6° at 50°, 3.3° at 35°, in ~5 mm, then back); ⭐ (2026-10-22) and NO KINK anywhere — the camera's height and the piece's place change speed smoothly (⛔ at rings 3 and 2 the camera's height went from ~4°/mm to none: 2.8°/mm of change in a 0.1 mm step)", () => {
    for (const E of [35, 50, 70, 80]) {
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
      // no kink: the largest change of speed between two 0.1 mm steps, the camera's height and the piece's height on the screen
      const mm = cfg.boxGainPitch * cfg.gainOrbitElevation * elevationGainScale(cfg);
      const e: number[] = [];
      const y: number[] = [];
      for (let u = 0; u <= 1 + span + 1e-9; u += 0.1 * mm) {
        const at = { yaw, ...placeOf(u, mid, span) };
        e.push(Math.asin(cameraFrameHeld(cfg, top, top, 1, at, off, null).dir[1]) * D);
        y.push(yOf(u));
      }
      const kink = (a: number[]): number => { let m = 0; for (let i = 2; i < a.length; i++) m = Math.max(m, Math.abs((a[i]! - a[i - 1]!) - (a[i - 1]! - a[i - 2]!)) / 0.1); return m; };
      expect(kink(e)).toBeLessThan(0.15); // °/mm (2.8 at rings 3 and 2 before)
      expect(kink(y)).toBeLessThan(0.03); // 0.003–0.008 at 35°–70°; 0.028 at 80° where the far ease starts (its start speed trimmed so it cannot overshoot)
      // the camera one level through the waist, the pause included (⛔ 36° at the rings lifted to the ring's at the middle)
      for (let u = k.lo + 1e-6; u <= k.hi + span - 1e-6; u += span / 30) expect(Math.asin(cameraFrameHeld(cfg, top, top, 1, { yaw, ...placeOf(u, mid, span) }, off, null).dir[1]) * D).toBeCloseTo(E, 6);
    }
  });
  it("⭐⭐ the lift is 0 outside halfway ring 1 → ring 3 and halfway ring 2 → ring 4 (the camera there as ever), even about the held height through the waist (at 50°: −7.5 cm at rings 3 and 2, +7.6 cm in the pause), mirrored below an underside; none on a vertical face", () => {
    const top = rigTurnFor(base, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
    const k = topFaceKnots(base);
    for (const v of [0.1, k.from, k.to, 0.9]) expect(topFaceAimLift(base, top, top, 1, { yaw, v }, off, gap)).toBe(0);
    const atLo = topFaceAimLift(base, top, top, 1, { yaw, v: k.lo }, off, gap);
    const inPause = topFaceAimLift(base, top, top, 1, { yaw, v: k.mid, pause: 0.5 }, off, gap);
    expect(atLo).toBeCloseTo(-0.0746, 3);
    expect(inPause).toBeCloseTo(0.0756, 3);
    const under = rigTurnFor(base, yaw, 0.99, [0, -1, 0], level(yaw), UNTURNED);
    expect(topFaceAimLift(base, under, under, 1, { yaw, v: k.mid, pause: 0.5 }, off, gap)).toBeCloseTo(-inPause, 6);
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
