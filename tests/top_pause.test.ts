/**
 * ⭐⭐⭐ THE TOP FACE PAUSE (2026-10-21, the owner: *"when hosting face is horizontal, on a dy travel, the piece travel is paused when it crosses the gizmo
 * (when it is exactly midway between ring 2 and ring 3), the camera does the half round turn around the gizmo while the piece travel is paused … If the dy
 * reverse at any time, the travel of the camera or piece is reversed."* → *"what is the mm between ring 2 and ring 3 in case the hosting face is vertical ?
 * use that for the pause length. build"*) — `input/top_pause.ts`, wired through `orbitTravelStep`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { elevationGainScale } from "../src/input/orbit";
import { rigPlace, rigTurnFor, topFacePauseParts, UNTURNED } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { waistRings } from "../src/input/waist_view";
import { pauseMid, pauseSpan, placeOf, settledPause, travelOf } from "../src/input/top_pause";
import type { Vec3 } from "../src/core/vec";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 };
const D = 180 / Math.PI;
const yaw = 0.4;
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];
const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
const span = pauseSpan(cfg);
const mid = pauseMid(cfg);
const dvPerMm = cfg.boxGainPitch * cfg.gainOrbitElevation * elevationGainScale(cfg);
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ the top face pause (2026-10-21)", () => {
  it("⭐⭐ the pause is the waist's span — a vertical face's ring 2 → ring 3 travel (`Scene_1`: 11.1 mm of dy), at the middle (the piece straight above the gizmo)", () => {
    const { v2, v3 } = waistRings(cfg);
    expect(span).toBeCloseTo(Math.abs(v2 - v3), 12);
    expect(span / dvPerMm).toBeCloseTo(11.11, 1);
    expect(mid).toBeCloseTo(0.5, 9);
    expect(Math.hypot(...rigPlace(cfg, top, yaw, mid, 1))).toBeCloseTo(0.09, 6); // 9 cm from the gizmo
    expect(rigPlace(cfg, top, yaw, mid, 1)[1]).toBeCloseTo(0.09, 6); // straight above
  });
  it("⭐⭐⭐ ONE TRAVEL: off the pause it is the ring parameter (shifted past it); through it the ring holds at the middle and the share goes 0 → 1; place ↔ travel both ways; held to its ends", () => {
    for (const u of [0, 0.2, mid - 1e-6, mid, mid + span * 0.3, mid + span * 0.75, mid + span, mid + span + 1e-6, 0.9 + span, 1 + span]) {
      const p = placeOf(u, mid, span);
      expect(travelOf(p.v, p.pause, mid, span)).toBeCloseTo(u, 12);
      if (u <= mid) expect(p).toEqual({ v: u, pause: 0 });
      else if (u >= mid + span) expect(p.pause).toBe(1);
      else { expect(p.v).toBe(mid); expect(p.pause).toBeCloseTo((u - mid) / span, 12); }
    }
    expect(placeOf(-0.3, mid, span)).toEqual({ v: 0, pause: 0 });
    expect(placeOf(1 + span + 0.4, mid, span)).toEqual({ v: 1, pause: 1 });
    expect(placeOf(0.7, mid, 0)).toEqual({ v: 0.7, pause: 1 }); // no pause: the travel is the ring
    expect(settledPause(0.3, 0.6, mid)).toBe(0);
    expect(settledPause(0.8, 0.2, mid)).toBe(1);
    expect(settledPause(mid, 0.42, mid)).toBe(0.42);
  });
  it("⭐⭐⭐ over a top face: the piece WAITS through the pause while the camera goes HALF ROUND (behind the piece before, on the far side after); dy reversed anywhere retraces it", () => {
    const at = (u: number) => placeOf(u, mid, span);
    const piece = (u: number) => rigPlace(cfg, top, yaw, at(u).v, 1);
    const cam = (u: number) => cameraFrameHeld(cfg, top, top, 1, { yaw, ...at(u) }, off, null).dir;
    const az = (d: Vec3) => Math.atan2(d[2], d[0]);
    const p0 = piece(mid);
    for (let u = mid; u <= mid + span + 1e-12; u += span / 40) {
      const p = piece(u);
      expect(Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2])).toBeLessThan(1e-12); // the piece does not move
      // ⭐ (2026-10-25) the camera on the ring through the pause's middle part (its half round); down from / up to the zenith in the first and last
      const [pa, pb] = topFacePauseParts(cfg);
      const share = (u - mid) / span;
      if (share >= pa && share <= pa + pb) expect(Math.asin(cam(u)[1]) * D).toBeCloseTo(cfg.topFaceCameraRingDeg, 6);
    }
    let turned = az(cam(mid + span)) - az(cam(mid));
    turned -= 2 * Math.PI * Math.round(turned / (2 * Math.PI));
    expect(Math.abs(Math.abs(turned) - Math.PI)).toBeLessThan(0.02); // half round
    // before the pause the camera does not go round (its azimuth fixed, behind the piece); after it, nor
    const { v2, v3 } = waistRings(cfg);
    const lo = Math.min(v2, v3), hi = Math.max(v2, v3);
    // ⭐ (2026-10-25) behind the piece up to the zenith: only the yaw offset's fade as the camera climbs (≤ 2.5°)
    for (let u = lo; u <= mid; u += 0.005) expect(Math.abs(Math.sin(az(cam(u)) - az(cam(lo))))).toBeLessThan(Math.sin((3 * Math.PI) / 180));
    for (let u = mid + span; u <= hi + span; u += 0.005) expect(Math.abs(Math.sin(az(cam(u)) - az(cam(hi + span))))).toBeLessThan(Math.sin((3 * Math.PI) / 180));
    // the same frames driven back and forth: a function of the travel alone
    for (const u of [0.3, mid + span * 0.37, mid + span * 0.9, 0.7 + span]) {
      const a = cam(u);
      const b = cam(travelOf(at(u).v, at(u).pause, mid, span));
      expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1e-12);
    }
    // a vertical face: no pause — its frames read nothing of the share
    const side = rigTurnFor(cfg, yaw, 0.99, level(yaw), level(yaw), UNTURNED);
    for (const v of [0.45, 0.5, 0.55]) {
      const a = cameraFrameHeld(cfg, side, side, 1, { yaw, v, pause: 0 }, off, null).dir;
      const b = cameraFrameHeld(cfg, side, side, 1, { yaw, v, pause: 1 }, off, null).dir;
      expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBe(0);
    }
  });
  it("⭐⭐ wired: the drag and the coast step the travel (`orbitTravelStep`, governed on it, the coast's record the travel taken); the share settled to the piece's side each frame and drawn eased; the camera reads the drawn share; a respawn settles it at once", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const got = du === 0 ? 0 : governedRingStep((u) => frame({ yaw, ...placeOf(u, mid, span) }), u0, du, dvPerMm, cap, 1 + span);");
    expect(g).toContain("st.topPause = to.pause; return { dv: to.v - v, du: got };");
    expect(g).toContain("return horizontalShare(st.cfg, st.rigTo) >= 1;");
    expect(g).toContain("if (topPauseOn(st)) st.topPause = settledPause(st.orbit.elevation, st.topPause, pauseMid(st.cfg));");
    expect(g).toContain("topPauseFrame(st, dtSec * 1000);");
    expect(g).toContain("st.topPause = settledPause(st.orbit.elevation, 0, pauseMid(st.cfg));");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("st.orbitInertia.record(s.t, st.orbit.yaw - yaw0, travel.du);");
    expect(code("render/camera_rig.ts")).toContain("cam.pause === undefined ? { ...cam, pause: st.topPauseShown } : cam");
  });
});
