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
import { rigPlace, rigTurnFor, UNTURNED } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { waistRings } from "../src/input/waist_view";
import { laggedPlace, pauseEndNearer, pauseMid, pauseSpan, pauseTowardEnd, pauseUnderWay, pauseYawStep, placeOf, settledPause, travelOf, PAUSE_FINISH_PER_S } from "../src/input/top_pause";
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
  it("⭐⭐⭐ over a top face: the piece WAITS through the pause while the camera, straight above it, ROLLS half round (⭐ 2026-10-25; ⛔ went half round the gizmo on a ring); behind the piece off the pause; dy reversed anywhere retraces it", () => {
    const at = (u: number) => placeOf(u, mid, span);
    const piece = (u: number) => rigPlace(cfg, top, yaw, at(u).v, 1);
    const cam = (u: number) => cameraFrameHeld(cfg, top, top, 1, { yaw, ...at(u) }, off, null);
    const p0 = piece(mid);
    const d0 = cam(mid).dir;
    for (let u = mid; u <= mid + span + 1e-12; u += span / 40) {
      const p = piece(u);
      expect(Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2])).toBeLessThan(1e-12); // the piece does not move
      const d = cam(u).dir;
      expect(Math.acos(Math.min(1, d[0] * d0[0] + d[1] * d0[1] + d[2] * d0[2])) * D).toBeLessThan(3); // the view hardly moves: a roll about it
    }
    const u0 = cam(mid).up, u1 = cam(mid + span).up;
    expect(u0[0] * u1[0] + u0[1] * u1[1] + u0[2] * u1[2]).toBeLessThan(-0.99); // the up turned half round
    // off the pause the camera is behind the piece: its view within the owner's offsets of the piece's direction
    const { v2, v3 } = waistRings(cfg);
    const lo = Math.min(v2, v3), hi = Math.max(v2, v3);
    for (const u of [lo, (lo + mid) / 2, mid - 1e-6, mid + span + 1e-6, (mid + hi) / 2 + span, hi + span]) {
      const p = piece(u), n = Math.hypot(...p), d = cam(u).dir;
      expect(Math.acos(Math.min(1, (p[0] * d[0] + p[1] * d[1] + p[2] * d[2]) / n)) * D).toBeLessThan(3.5);
    }
    // the same frames driven back and forth: a function of the travel alone
    for (const u of [0.3, mid + span * 0.37, mid + span * 0.9, 0.7 + span]) {
      const a = cam(u).up;
      const b = cam(travelOf(at(u).v, at(u).pause, mid, span)).up;
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
  it("⭐⭐⭐ (2026-10-25, the owner: *\"there seems to be a pause of the camera movement when the camera is at the zenith … it looks like the dy accumulates and then suddenly the roll kicks in and catches up\"*) the roll EVEN through the pause — every twentieth of it ~9° (⛔ smoothstep: 1.2° in the first, the camera standing still for ~1 mm of dy)", () => {
    const up = (p: number) => cameraFrameHeld(cfg, top, top, 1, { yaw, v: mid, pause: p }, off, null).up;
    const ang = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;
    for (let p = 0; p < 1 - 1e-9; p += 0.05) {
      const step = ang(up(p), up(p + 0.05));
      expect(step).toBeGreaterThan(7.5);
      expect(step).toBeLessThan(10.5);
    }
  });
  it("⭐⭐ (2026-10-25) dx HELD while the roll is under way (straight above, a dx turns the picture like a roll); free at its ends and with no pause — the drag and the coast", () => {
    expect(pauseYawStep(true, 0.4, 0.02)).toBe(0);
    expect(pauseYawStep(true, 0, 0.02)).toBe(0.02);
    expect(pauseYawStep(true, 1, -0.02)).toBe(-0.02);
    expect(pauseYawStep(false, 0.4, 0.02)).toBe(0.02);
    expect(pauseUnderWay(true, 0.001)).toBe(true);
    expect(code("render/pointer_wiring.ts")).toContain("st.orbit.drag(shiftTilt ? 0 : pauseYawStep(topPauseOn(st), st.topPause, -db.dx * st.cfg.boxGainYaw * g.yaw * st.pieceYawGainDrag), dyPx * share);");
    expect(code("render/green_box_wiring.ts")).toContain("st.orbit.nudge(pauseYawStep(topPauseOn(st), st.topPause, d.dYaw), dv);");
  });
  it("⭐⭐ (2026-10-25) a gizmo change asked for MID-ROLL waits: the roll finished or unwound to its nearer end at 360°/s, then the change made", () => {
    expect(pauseEndNearer(0.3)).toBe(0);
    expect(pauseEndNearer(0.5)).toBe(1);
    expect(pauseEndNearer(0.8)).toBe(1);
    expect(PAUSE_FINISH_PER_S).toBe(2);
    expect(pauseTowardEnd(0.3, 0, 50)).toBeCloseTo(0.2, 12);
    expect(pauseTowardEnd(0.95, 1, 50)).toBe(1); // lands on it exactly
    expect(pauseTowardEnd(0.05, 0, 50)).toBe(0);
    let p = 0.6, ms = 0;
    while (p < 1) { p = pauseTowardEnd(p, 1, 16); ms += 16; }
    expect(ms).toBeLessThanOrEqual(208); // 0.4 of the half round in ~0.2 s
    const r = code("render/camera_rig.ts");
    expect(r).toContain("if (pauseUnderWay(horizontalShare(st.cfg, st.rigTo) >= 1, st.topPause)) { st.gizmoPending = { to, normal, host, end: pauseEndNearer(st.topPause) }; return; } st.gizmoPending = null;");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (pend !== null && topPauseOn(st)) st.topPause = pauseTowardEnd(st.topPause, pend.end, dtMs);");
    expect(g).toContain("st.gizmoPending = null; retargetGizmo(st, pend.to, pend.normal, pend.host);");
  });
  it("⭐⭐⭐ (2026-10-25) THE CAMERA ON THE TRAVEL: its place is the input's travel less its lag behind it — the roll as soon as the camera's own travel crosses the zenith, never waiting for its creeping `v` to land on the middle exactly (⛔ the share piled up, then landed at once)", () => {
    // the input in the pause, a tenth of the roll done; the camera's v a hair short of the middle (the spring, the leash)
    const a = laggedPlace(mid, 0.1, mid - 1e-6, mid, span);
    expect(a.v).toBe(mid);
    expect(a.pause).toBeCloseTo(0.1 - 1e-6 / span, 9); // rolling with it (⛔ 0: held until v landed)
    // off the pause: exactly the camera's own v
    expect(laggedPlace(0.3, 0, 0.29, mid, span)).toEqual({ v: 0.29, pause: 0 });
    expect(laggedPlace(0.8, 1, 0.81, mid, span).v).toBeCloseTo(0.81, 12);
    // a camera lagging further than the roll done: still before the zenith
    const b = laggedPlace(mid, 0.05, mid - 0.2 * span, mid, span);
    expect(b.pause).toBe(0);
    expect(b.v).toBeCloseTo(mid - 0.15 * span, 12);
    // the input past the pause, the camera still behind it: mid-roll
    const c = laggedPlace(mid + 0.1 * span, 1, mid - 0.2 * span, mid, span);
    expect(c.v).toBe(mid);
    expect(c.pause).toBeCloseTo(0.8, 9); // 1.1 spans of travel past the middle, less 0.3 of lag
    // wired: the camera's frame and its carried up read that place, from the input's ring place
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const p = laggedPlace(st.orbit.elevation, st.topPauseShown, c.v, pauseMid(st.cfg), pauseSpan(st.cfg));");
    expect(g).toContain("const camFrame = cameraFrameNow(st, camPlace, off, dtSec * 1000); st.cameraPrev = { dir: camFrame.dir, up: camFrame.up, cam: camPlace };");
  });
});
