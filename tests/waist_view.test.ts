/**
 * ⭐⭐⭐ (2026-10-17) THE SLIDE VIEW'S ANGLE BETWEEN RINGS 2 AND 3, THE CAMERA ALWAYS ON THE GIZMO — `src/input/waist_view.ts` and its wiring. The owner:
 * *"camera always aims at the gizmo, position the ring 2 and ring 3 so that the camera ends up in the semi-isometric view during the travel of the piece
 * between ring 2 and ring 3. Avoid S-shape travels of the piece during the whole travel. The key is positioning the ring 2 and ring 3 to match the
 * semi-isometric view during the waist travel."*
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { orbitOffset } from "../src/input/orbit";
import { rigFrameBetween, rigPlace, rigTurnFor, UNTURNED, waistV, type RigParams } from "../src/input/orbit_rig";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angle = (a: Vec3, b: Vec3) => (Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (Math.hypot(...a) * Math.hypot(...b))))) * 180) / Math.PI;
const DEG = 180 / Math.PI;

describe("⭐⭐⭐ the slide view's angle between rings 2 and 3, the camera on the gizmo (2026-10-17)", () => {
  it("⭐⭐⭐ RINGS 2 AND 3 AT THE SLIDE VIEW'S TILT: height r·√2 — the direction to them 54.7° off the face's normal, 35.3° off the face (⛔ ±0.15: 31°)", async () => {
    const { isoWaistHeightM, waistRings } = await import("../src/input/waist_view");
    expect(isoWaistHeightM(0.09)).toBeCloseTo(0.12728, 5);
    expect(cfg.orbitMiddleHeightM).toBeCloseTo(isoWaistHeightM(cfg.orbitMiddleRadiusM), 12);
    expect(cfg.orbitLowerHeightM).toBeCloseTo(-isoWaistHeightM(cfg.orbitLowerRadiusM), 12);
    const { v2, v3 } = waistRings(cfg);
    for (const v of [v2, v3]) {
      const o = orbitOffset(cfg, 0, v, 1).offsetM;
      expect(90 - Math.abs(Math.atan2(o[1], Math.hypot(o[0], o[2])) * DEG)).toBeCloseTo(35.264, 2); // off the face (the radial is the face's normal at the waist)
    }
  });
  it("⭐ the share between the rings: 0 at ring 2, 1 at ring 3, none outside", async () => {
    const { waistShare, waistRings } = await import("../src/input/waist_view");
    const { v2, v3 } = waistRings(cfg);
    expect(waistShare(cfg, v2)).toBe(0);
    expect(waistShare(cfg, v3)).toBe(1);
    expect(waistShare(cfg, v2 + 0.01)).toBeNull();
    expect(waistShare(cfg, v3 - 0.01)).toBeNull();
  });
  it("⭐⭐⭐ THE TURN: exactly the camera's own direction at ring 2 and at ring 3 (continuous — no S), the tilt held, turned about the face's normal the yaw offset's way", async () => {
    const { waistTurn } = await import("../src/input/waist_view");
    const n: Vec3 = [0, 1, 0];
    const t = 35.26 / DEG;
    const d2: Vec3 = [Math.cos(t), Math.sin(t), 0], d3: Vec3 = [-Math.cos(t), Math.sin(t), 0]; // a level face: one side to the other
    for (let i = 0; i < 3; i++) { expect(waistTurn(n, d2, d3, 0, null)[i]).toBeCloseTo(d2[i]!, 12); expect(waistTurn(n, d2, d3, 1, null)[i]).toBeCloseTo(d3[i]!, 12); }
    let prev = d2;
    for (let s = 0.01; s <= 1.0001; s += 0.01) {
      const d = waistTurn(n, d2, d3, s, [0, 0, -1]);
      expect(Math.asin(dot(d, n)) * DEG).toBeCloseTo(35.26, 6); // the tilt held
      expect(angle(d, prev)).toBeLessThan(3);
      prev = d;
    }
    expect(waistTurn(n, d2, d3, 0.5, [0, 0, -1])[2]).toBeLessThan(0); // half a round the way the yaw offset lies
    expect(waistTurn(n, d2, d3, 0.5, [0, 0, 1])[2]).toBeGreaterThan(0);
  });
  it("⭐⭐⭐ ON SCENE_1'S RINGS, the camera aimed at the gizmo: through rings 2 → 3 the piece stays within 4° of the screen's centre — top and side faces (computed 3.3°)", async () => {
    const { waistTurn, waistRings, waistShare } = await import("../src/input/waist_view");
    const { v2, v3 } = waistRings(cfg);
    for (const n of [[0, 1, 0], [0, 0, 1]] as Vec3[]) {
      const p: RigParams = rigTurnFor(cfg, 0.4, 0.8, n, [Math.cos(0.4), 0, Math.sin(0.4)], UNTURNED);
      const off = { yawRad: (cfg.cameraYawOffsetDeg * Math.PI) / 180, pitchRad: (cfg.cameraPitchOffsetDeg * Math.PI) / 180 };
      const d2 = rigFrameBetween(cfg, p, p, 1, { yaw: 0.4, v: v2 }, off).dir;
      const d3 = rigFrameBetween(cfg, p, p, 1, { yaw: 0.4, v: v3 }, off).dir;
      for (let v = v2; v >= v3; v -= (v2 - v3) / 100) {
        const dir = waistTurn(rigPlace(cfg, p, 0.4, waistV(cfg), 1), d2, d3, waistShare(cfg, v)!, [Math.cos(0.4 + p.beta + Math.PI / 2), 0, Math.sin(0.4 + p.beta + Math.PI / 2)]);
        const P = rigPlace(cfg, p, 0.4, v, 1);
        const D = Math.hypot(...P) + 1.25;
        const cam: Vec3 = [dir[0] * D, dir[1] * D, dir[2] * D];
        expect(angle([P[0] - cam[0], P[1] - cam[1], P[2] - cam[2]], [-cam[0], -cam[1], -cam[2]])).toBeLessThan(4);
      }
    }
  });
  it("⭐⭐ kept IN FRONT of the face as tapped: a direction dipping behind it is tilted back to ~10° over it; one in front untouched", async () => {
    const { keepInFront, FRONT_MIN } = await import("../src/input/waist_view");
    const n0: Vec3 = [0, 0, 1];
    const behind: Vec3 = [0.9, 0.3, -0.31];
    const k = keepInFront(behind, n0);
    expect(dot(k, n0)).toBeCloseTo(FRONT_MIN, 9);
    expect(Math.hypot(...k)).toBeCloseTo(1, 9);
    const front: Vec3 = [0.5, 0.5, 0.7071];
    expect(keepInFront(front, n0)).toEqual(front);
  });
  it("⭐⭐ wired: the camera's frame turns between rings 2 and 3 with the gizmo on a face, aimed at the gizmo; the latched slide view, its arc and the keep slider are gone", () => {
    const c = code("render/camera_rig.ts");
    
    
    expect(c).not.toContain("waistViewNow");
    const g = code("render/green_box_wiring.ts");
    expect(g).not.toContain("waistViewNow"); // ⛔ aimed at the piece all along: the assembly off the screen, a jump at max distance
    expect(code("input/gestureConfig.ts")).not.toContain("waistCornerTurn");
    expect(code("input/orbit_rig.ts")).toContain("faced: normal !== null, normal: normal === null ? null : normal");
  });
});

describe("⭐⭐⭐ the semi-isometric hold only beyond a CONE (2026-10-17, the owner: *\"trigger the semi-isometric view during ring 2 and 3 travel only if the normal of the gizmo-supporting face is beyond a certain cone vs. the orientation of the camera view\"* → *\"build\"*)", () => {
  it("⭐⭐⭐ its weight: none while the camera's halfway direction is within the cone of the face's normal (it looks at the face), full 10° past it, smooth between", async () => {
    const { waistConeWeight } = await import("../src/input/waist_view");
    const n0: Vec3 = [0, 0, 1];
    const at = (deg: number): Vec3 => [Math.sin(deg / DEG), 0, Math.cos(deg / DEG)];
    expect(waistConeWeight(at(0), n0, 45)).toBe(0); // face-on: no need
    expect(waistConeWeight(at(45), n0, 45)).toBe(0);
    expect(waistConeWeight(at(55), n0, 45)).toBe(1);
    expect(waistConeWeight(at(90), n0, 45)).toBe(1); // edge-on: the hold
    const mid = waistConeWeight(at(50), n0, 45);
    expect(mid).toBeGreaterThan(0.3);
    expect(mid).toBeLessThan(0.7);
  });
  it("⭐⭐ held, the tilt reaches the slide view's 35.3° against the REAL face halfway between the rings — still exactly the camera's own direction at either ring", async () => {
    const { waistTurn, ISO_TILT_RAD } = await import("../src/input/waist_view");
    const n0: Vec3 = [0, 0, 1];
    const d2: Vec3 = [0.9, 0.42, 0.1], d3: Vec3 = [0.9, -0.42, 0.1]; // nearly edge-on to the real face
    const s0 = waistTurn(n0, d2, d3, 0, null, ISO_TILT_RAD), s1 = waistTurn(n0, d2, d3, 1, null, ISO_TILT_RAD);
    const u = (v: Vec3) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
    for (let i = 0; i < 3; i++) { expect(s0[i]).toBeCloseTo(u(d2)[i]!, 12); expect(s1[i]).toBeCloseTo(u(d3)[i]!, 12); }
    expect(Math.asin(dot(waistTurn(n0, d2, d3, 0.5, null, ISO_TILT_RAD), n0)) * DEG).toBeCloseTo(35.264, 3);
  });
  it("⭐ the cone a slider in CAMERA ORBIT AROUND CENTER, 45° by default, validated; wired on the real face's normal", () => {
    expect(DEFAULT_CONFIG.waistIsoConeDeg).toBe(45);
    const m = code("render/tuning_menu.ts");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    const at = m.indexOf('"waistIsoConeDeg"');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
    const c = code("render/camera_rig.ts");
    expect(c).toContain("const hold = faced * waistConeWeight(nYaw, n0, st.cfg.waistIsoConeDeg);");
  });
});

describe("⭐⭐⭐ a vertical face approached from BEHIND (2026-10-17, the owner: *\"in case the hosting face is vertical, if I orbit dy to approach from behind the face, there are two discontinuities during the travel\"*)", () => {
  const n0: Vec3 = [0, 0, -1]; // the face as tapped
  const swung = (deg: number): Vec3 => [Math.sin(deg / DEG), 0, -Math.cos(deg / DEG)]; // the curve's halfway direction, dx swung `deg` from the normal
  it("⭐⭐ the cone is TWO-SIDED: facing the face's back is like facing its front — no hold; edge-on, the hold", async () => {
    const { waistConeWeight } = await import("../src/input/waist_view");
    expect(waistConeWeight(swung(0), n0, 45)).toBe(0);
    expect(waistConeWeight(swung(180), n0, 45)).toBe(0); // ⛔ from behind it held, and a guard pulled the camera to the front
    expect(waistConeWeight(swung(90), n0, 45)).toBe(1);
    expect(waistConeWeight(swung(115), n0, 45)).toBe(1);
  });
  it("⭐⭐⭐ EXACTLY the camera's own direction at ring 2 and ring 3 whatever the side (⛔ the in-front guard yanked a camera behind the face to the front: 24° and 38° of roll at ring 2)", async () => {
    const { waistHoldDirection } = await import("../src/input/waist_view");
    for (const deg of [60, 90, 115, 150]) {
      const nYaw = swung(deg);
      // the camera behind the piece at rings 2 and 3: 54.7° off the curve's halfway direction, up and down
      const t = 54.74 / DEG;
      const d2: Vec3 = [nYaw[0] * Math.cos(t), Math.sin(t), nYaw[2] * Math.cos(t)];
      const d3: Vec3 = [nYaw[0] * Math.cos(t), -Math.sin(t), nYaw[2] * Math.cos(t)];
      const u = (v: Vec3) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
      const a = waistHoldDirection(nYaw, n0, d2, d3, 0, null), b = waistHoldDirection(nYaw, n0, d2, d3, 1, null);
      for (let i = 0; i < 3; i++) { expect(a[i]).toBeCloseTo(u(d2)[i]!, 9); expect(b[i]).toBeCloseTo(u(d3)[i]!, 9); }
      let prev = a;
      for (let s = 0.01; s <= 1.0001; s += 0.01) { const d = waistHoldDirection(nYaw, n0, d2, d3, s, null); expect(angle(d, prev)).toBeLessThan(4); prev = d; }
      // and on the PIECE's side of the face halfway (behind it when the curve comes from behind)
      const mid = waistHoldDirection(nYaw, n0, d2, d3, 0.5, null);
      expect(Math.sign(dot(mid, n0))).toBe(Math.sign(dot(nYaw, n0)) || Math.sign(dot(mid, n0)));
    }
  });
  it("⭐⭐ dx carrying the curve across the face's plane (edge-on): the hold's direction changes smoothly — the side's switch faded to nothing there", async () => {
    const { waistHoldDirection } = await import("../src/input/waist_view");
    const t = 54.74 / DEG;
    let prev: Vec3 | null = null;
    for (let deg = 70; deg <= 110; deg += 0.25) {
      const nYaw = swung(deg);
      const d2: Vec3 = [nYaw[0] * Math.cos(t), Math.sin(t), nYaw[2] * Math.cos(t)];
      const d3: Vec3 = [nYaw[0] * Math.cos(t), -Math.sin(t), nYaw[2] * Math.cos(t)];
      const d = waistHoldDirection(nYaw, n0, d2, d3, 0.5, null);
      if (prev) expect(angle(d, prev)).toBeLessThan(3);
      prev = d;
    }
  });
  it("⭐ wired: the camera's frame holds through `waistHoldDirection`", () => {
    expect(code("render/camera_rig.ts")).toContain("let dir = waistHoldDirection(nYaw, n0, d2, d3, share,");
  });
});
