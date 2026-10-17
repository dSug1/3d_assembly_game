/**
 * ⭐⭐⭐ The camera's frame, whole (`input/camera_frame.ts`, wired as `render/camera_rig.ts`'s `cameraFrameNow`) — the Fable audit of `1.0.80-`
 * (2026-10-17), A1–A7: each scenario measured through the frame the screen shows, the last frame's up threaded as the render loop threads it.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import type { Vec3 } from "../src/core/vec";
import { blendRig, rigTurnFor, UNTURNED, type RigParams } from "../src/input/orbit_rig";
import { waistRings, waistTurn } from "../src/input/waist_view";
import { cameraFrameNow, retargetGizmo } from "../src/render/camera_rig";
import { ROLL_PER_DIR, ROLL_SETTLE_DEG } from "../src/input/camera_frame";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 }; // the owner's offsets
const D = 180 / Math.PI;
const angle = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;
const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];
const tilted = (yaw: number, deg: number): Vec3 => [Math.cos(deg / D) * Math.cos(yaw), Math.sin(deg / D), Math.cos(deg / D) * Math.sin(yaw)];
// a scene state as far as the camera's frame (and a gizmo's retarget) reads it; `frame` threads the up as the render loop does
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stub = (from: RigParams, to: RigParams, s: number): any => ({
  cfg,
  rigFrom: from,
  rigTo: to,
  rigShare: s,
  cameraPrev: null,
  centreBlend: { centreM: [0, 0, 0], targetM: [0, 0, 0], retarget: () => undefined },
  centreMarker: { position: { set: () => undefined } },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const frame = (st: any, yaw: number, v: number): { dir: Vec3; up: Vec3 } => {
  const f = cameraFrameNow(st, { yaw, v }, off);
  st.cameraPrev = f;
  return f;
};
const { v2, v3 } = waistRings(cfg);
const vMid = (v2 + v3) / 2;
const MM_V = 0.0257; // ring parameter per mm of dy (`Scene_1`)

describe("⭐⭐⭐ the camera's frame through rings 2 and 3 — the Fable audit (2026-10-17)", () => {
  it("⭐⭐⭐ A1: a gizmo change TOP face → vertical face tapped MID-DISTANCE, dy approached as the change goes on: the up's roll bounded by the camera's own turn, upright at the end (⛔ 15°–42° of up per 0.25 mm: the target's up flips passing near the vertical)", () => {
    for (const nf of [0, 20]) {
      for (const v0 of [0.8, 0.75, 0.7, 0.65]) {
        const yaw = 0.4;
        const top = rigTurnFor(cfg, yaw, v0, [0, 1, 0], level(yaw), UNTURNED);
        const st = stub(top, rigTurnFor(cfg, yaw, v0, level(yaw + nf / D), level(yaw), top), 0);
        let prev: { dir: Vec3; up: Vec3 } | null = null;
        for (let mm = 0; v0 - mm * MM_V >= 0.02; mm += 0.25) {
          st.rigShare = smooth(mm / 30); // the change's share by the finger's travel
          const f = frame(st, yaw, v0 - mm * MM_V);
          if (prev !== null) {
            // the up turns no more than the view's own turn carries it, plus a roll of at most twice that turn (+ the settle); the turn stays small
            expect(angle(f.up, prev.up)).toBeLessThanOrEqual((1 + ROLL_PER_DIR) * angle(f.dir, prev.dir) + ROLL_SETTLE_DEG + 1e-6);
            expect(angle(f.dir, prev.dir)).toBeLessThan(10);
          }
          prev = f;
        }
        // …and it ends upright: what the orbit asks for at ring 1
        expect(angle(prev!.up, cameraFrameNow({ ...st, cameraPrev: null }, { yaw, v: v0 - Math.floor((v0 - 0.02) / MM_V / 0.25) * 0.25 * MM_V }, off).up)).toBeLessThan(1);
      }
    }
  });
  it("⭐⭐⭐ a gizmo change from a HORIZONTAL face to a VERTICAL face, dy approached as the change goes on: the camera stays UPRIGHT through rings 2 and 3 — no roll there and back (the owner: *\"there is still this annoying jittery roll twice (at ring 2 and ring 3)\"* — ⛔ the top face's swing pulled the up near ring 2 and again near ring 3 on a curve that no longer passes over the top)", () => {
    const upright = (dir: Vec3): Vec3 => {
      const k = dir[1];
      const u: Vec3 = [-k * dir[0], 1 - k * dir[1], -k * dir[2]];
      const l = Math.hypot(...u);
      return [u[0] / l, u[1] / l, u[2] / l];
    };
    for (const nf of [0, 20, -20]) {
      for (const v0 of [0.99, 0.8]) {
        const yaw = 0.4;
        const top = rigTurnFor(cfg, yaw, v0, [0, 1, 0], level(yaw), UNTURNED);
        const st = stub(top, rigTurnFor(cfg, yaw, v0, level(yaw + nf / D), level(yaw), top), 0);
        for (let mm = 0; v0 - mm * MM_V >= 0.02; mm += 0.25) {
          st.rigShare = smooth(mm / 30);
          const v = v0 - mm * MM_V;
          const f = frame(st, yaw, v);
          // once the change is well under way (its curve peaking ≤ 65°: no crossing left), between and around rings 2 and 3
          if (st.rigShare >= 0.4 && v <= v2 + 0.05 && v >= v3 - 0.05) expect(angle(f.up, upright(f.dir))).toBeLessThan(1);
        }
      }
    }
  });
  it("⭐⭐⭐ A2: a tap on another face with the piece between rings 2 and 3, the hold on: no jump at the first finger move (⛔ the old face swapped for the new one: 8°–18°)", () => {
    for (const dx of [60, 65, 75]) {
      const y0 = 0.4;
      const a = rigTurnFor(cfg, y0, vMid, level(y0), level(y0), UNTURNED);
      const yaw = y0 + dx / D;
      const st = stub(a, a, 1);
      const before = frame(st, yaw, vMid);
      st.rigTo = rigTurnFor(cfg, yaw, vMid, level(y0 + Math.PI / 2), level(yaw), a);
      st.rigShare = 0.02;
      expect(angle(frame(st, yaw, vMid).dir, before.dir)).toBeLessThan(2);
    }
  });
  it("⭐⭐ A3: a face tilted 24°–28°, dx carried round behind it: no flip (⛔ ring 3 on the normal — 27°–110° of camera in one 0.05° of dx)", () => {
    for (const th of [24, 26, 28]) {
      const y0 = 0.4;
      const a = rigTurnFor(cfg, y0, vMid, tilted(y0, th), level(y0), UNTURNED);
      const st = stub(a, a, 1);
      let prev: Vec3 | null = null;
      for (let dx = 165; dx <= 190; dx += 0.05) {
        const d = frame(st, y0 + dx / D, vMid).dir;
        if (prev !== null) expect(angle(d, prev)).toBeLessThan(3);
        prev = d;
      }
    }
  });
  it("⭐⭐ A4: the face nearly edge-on to the view gets the semi-isometric lift (⛔ 20° at 10° off edge-on — the side's band narrowed to ~6°), and still changes smoothly across edge-on", () => {
    const y0 = 0.4;
    const n = level(y0);
    const a = rigTurnFor(cfg, y0, vMid, n, n, UNTURNED);
    const st = stub(a, a, 1);
    const tiltAt = (dx: number): number => {
      const d = frame(st, y0 + dx / D, vMid).dir;
      return Math.asin(d[0] * n[0] + d[1] * n[1] + d[2] * n[2]) * D;
    };
    expect(tiltAt(80)).toBeGreaterThan(30);
    expect(tiltAt(70)).toBeGreaterThan(34);
    let prev: Vec3 | null = null;
    for (let dx = 60; dx <= 120; dx += 0.05) {
      const d = frame(st, y0 + dx / D, vMid).dir;
      if (prev !== null) expect(angle(d, prev)).toBeLessThan(1.5);
      prev = d;
    }
  });
  it("⭐⭐ A5: on a tilted face with a partial hold the UP crosses ring 3 smoothly (⛔ 12.9° in one step: the roll toward upright not faded at the rings)", () => {
    const y0 = 0.4;
    const a = rigTurnFor(cfg, y0, vMid, tilted(y0, 60), level(y0), UNTURNED);
    const st = stub(a, a, 1);
    let prev: Vec3 | null = null;
    for (let v = v2 + 0.02; v >= v3 - 0.02; v -= 0.0005) {
      const u = frame(st, y0 + 120 / D, v).up;
      if (prev !== null) expect(angle(u, prev)).toBeLessThan(3);
      prev = u;
    }
  });
  it("⭐⭐ A6: a tap MID-CHANGE keeps the hold it had (⛔ the caught turn stored faceless — the hold dropped at once)", () => {
    for (const dx of [60, 70]) {
      const y0 = 0.4;
      const a = rigTurnFor(cfg, y0, vMid, level(y0), level(y0), UNTURNED);
      const yaw = y0 + dx / D;
      const b = rigTurnFor(cfg, yaw, vMid, level(y0 + 1.2), level(yaw), a);
      const st = stub(a, b, 0.3);
      st.orbit = { yaw, elevation: vMid };
      st.camera = { position: { x: Math.cos(yaw), y: 0.3, z: Math.sin(yaw) } };
      const before = frame(st, yaw, vMid);
      retargetGizmo(st, [0, 0, 0], level(y0 + 2.4));
      expect(st.rigShare).toBe(0);
      expect(angle(frame(st, yaw, vMid).dir, before.dir)).toBeLessThan(0.05);
    }
    expect(blendRig(rigTurnFor(cfg, 0.4, vMid, level(0.4), level(0.4), UNTURNED), UNTURNED, 0.3).faced).toBe(true); // the nearer end's face
  });
  it("⭐ A7: a ring direction along the normal — the turn passes smoothly, never a switch at share 0.5 (⛔ 90° in one step)", () => {
    let prev: Vec3 | null = null;
    for (let s = 0; s <= 1.0001; s += 0.01) {
      const d = waistTurn([0, 1, 0], [0, 1, 0], [1, 0, 0], s, null);
      if (prev !== null) expect(angle(d, prev)).toBeLessThan(3);
      prev = d;
    }
  });
  it("⭐ wired: `cameraFrameNow` is the pure composition, carried by the last frame's up; the respawn forgets it", () => {
    const c = readFileSync("src/render/camera_rig.ts", "utf8");
    expect(c).toContain("return cameraFrameHeld(st.cfg, st.rigFrom, st.rigTo, st.rigShare, cam, off, st.cameraPrev ?? null);");
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("st.cameraPrev = camFrame;");
    expect(g).toMatch(/st\.rigShare = 1;\r?\n {2}st\.cameraPrev = null;/);
  });
});
