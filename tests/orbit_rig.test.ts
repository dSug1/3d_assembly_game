/**
 * ⭐⭐⭐ (2026-10-16) THE RIG TURNED ONTO THE GIZMO'S FACE — `src/input/orbit_rig.ts` and its wiring. The owner: *"The overall 2D curve … is rotated so
 * that between the 2nd and 3rd ring, the camera view is anti-aligned with the normal of the face supporting the gizmo"* → *"build, fix the rotation at
 * the camera's yaw when the gizmo moves, keep the camera offsets as they are right now …"* → (after two looks) *"the axis of each ring is the gravity
 * axis (in such way, the camera is never upside down). dx orbits the piece on the ring it is sitting on."* → *"build only your previous proposal"*.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { orbitOffset } from "../src/input/orbit";
import { cameraOffset } from "../src/input/follow_camera";
import { anglesOf } from "../src/input/piece_orbit";
import { IDENTITY, qRotate, type Vec3 } from "../src/core/vec";
import { UNTURNED, blendAngles, blendPlace, cameraOffsetAt, rigBetaFor, rigCameraAngles, rigPlace, rigRotationFor, rigYawToward, waistV, type RigParams } from "../src/input/orbit_rig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const unit = (v: Vec3): Vec3 => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
};
const angle = (a: Vec3, b: Vec3): number => {
  const u = unit(a), w = unit(b);
  return (Math.acos(Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1] + u[2] * w[2]))) * 180) / Math.PI;
};
const DEG = Math.PI / 180;
const turnFor = (yaw0: number, n: Vec3, cameraSide: Vec3 = [Math.cos(yaw0), 0, Math.sin(yaw0)]): RigParams => {
  const q = rigRotationFor(cfg, yaw0, n);
  return { q, yaw0, beta: rigBetaFor(q, yaw0, cameraSide) };
};

describe("⭐⭐⭐ the rig turned onto the gizmo's face (2026-10-16)", () => {
  it("⭐ halfway between rings 2 and 3: Scene_1's waist at the gizmo's height (its rings ±0.15 m, symmetric); three rings: 0.25", () => {
    const o = orbitOffset(cfg, 0, waistV(cfg), 1).offsetM;
    expect(Math.abs(o[1])).toBeLessThan(1e-9);
    expect(waistV({ ...cfg, orbitLowerRingOn: 0 })).toBe(0.25);
  });
  it("⭐⭐⭐ the turn takes the curve's waist direction at the camera's yaw onto the face's normal — side, slanted, top, bottom, behind", () => {
    for (const yaw of [0, 0.7, -2.1, 3]) {
      for (const n of [[1, 0, 0], [0, 0, -1], [0, 1, 0], [0, -1, 0], [0.3, 0.8, -0.5], [-Math.cos(yaw), 0, -Math.sin(yaw)]] as Vec3[]) {
        const q = rigRotationFor(cfg, yaw, n);
        expect(angle(qRotate(q, orbitOffset(cfg, yaw, waistV(cfg), 1).offsetM), n)).toBeLessThan(1e-4);
      }
    }
    expect(rigRotationFor(cfg, 0.4, null)).toEqual(IDENTITY); // no face (the boot): as today
  });
  it("⭐⭐⭐ UNTURNED it is the rig as it always was: the piece's place `orbitOffset`, the camera `cameraOffset`'s angles — exactly", () => {
    const off = { yawRad: 0.05, pitchRad: 0.03 };
    for (const yaw of [0, 1.2, -2.7]) {
      for (const v of [0, 0.3, 0.5, 0.82, 1]) {
        const a = rigPlace(cfg, UNTURNED, yaw, v, 1.3);
        const b = orbitOffset(cfg, yaw, v, 1.3).offsetM;
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 12);
        const ca = rigCameraAngles(cfg, UNTURNED, { yaw, v }, off);
        const cb = anglesOf(cameraOffset(cfg, { yaw, v }, [0, 0, 0], off, 1));
        expect(Math.cos(ca.az - cb.az)).toBeCloseTo(1, 12);
        expect(ca.el).toBeCloseTo(cb.el, 12);
        const oa = cameraOffsetAt(ca, [0.3, 0.2, 0.1], 0.5);
        const ob = cameraOffset(cfg, { yaw, v }, [0.3, 0.2, 0.1], off, 0.5);
        for (let i = 0; i < 3; i++) expect(oa[i]).toBeCloseTo(ob[i]!, 12);
      }
    }
  });
  it("⭐⭐⭐ EVERY RING IS LEVEL (the owner: *\"the axis of each ring is the gravity axis\"*) and dx carries the piece round it, at the ring's own radius", () => {
    for (const p of [turnFor(0.4, [0, 1, 0]), turnFor(-1, [0.3, 0.8, -0.5]), turnFor(2, [0, 0, 1])]) {
      for (const v of [0.1, 0.5, 0.9]) {
        const pts = [0, 1, 2, 3, 4, 5].map((k) => rigPlace(cfg, p, k, v, 1));
        const o = orbitOffset(cfg, 0, v, 1).offsetM;
        const r = Math.hypot(o[0], o[2]);
        for (const q of pts) expect(q[1]).toBeCloseTo(pts[0]![1], 12); // level
        const c0 = rigPlace(cfg, p, p.yaw0, v, 1);
        const cx = c0[0] - r * Math.cos(p.yaw0 + p.beta);
        const cz = c0[2] - r * Math.sin(p.yaw0 + p.beta);
        for (const q of pts) expect(Math.hypot(q[0] - cx, q[2] - cz)).toBeCloseTo(r, 9); // one circle of the ring's radius
      }
    }
  });
  it("⭐⭐ at the camera's yaw when the gizmo moved, the piece rides the TURNED CURVE (dy): halfway between rings 2 and 3 along the face's normal", () => {
    for (const [yaw0, n] of [[0.4, [0, 1, 0]], [0, [-1, 0, 0]], [1.1, [0.3, 0.8, -0.5]]] as [number, Vec3][]) {
      const p = turnFor(yaw0, n);
      for (const v of [0, 0.4, waistV(cfg), 0.7, 1]) {
        const a = rigPlace(cfg, p, yaw0, v, 1);
        const b = qRotate(p.q, orbitOffset(cfg, yaw0, v, 1).offsetM);
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 12);
      }
      expect(angle(rigPlace(cfg, p, yaw0, waistV(cfg), 1), n)).toBeLessThan(1e-4);
    }
  });
  it("⭐⭐ a SIDE face: the rings are today's (their centres on the gizmo's vertical), turned by a yaw", () => {
    const p = turnFor(0, [0, 0, 1]);
    for (const v of [0.2, 0.5, 0.8]) {
      for (const yaw of [0, 1, 2.5]) {
        const a = rigPlace(cfg, p, yaw, v, 1);
        const o = orbitOffset(cfg, yaw + p.beta, v, 1).offsetM;
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(o[i]!, 9);
      }
    }
  });
  it("⭐⭐⭐ a TOP face: halfway between rings 2 and 3 the piece sits above the face on a 9 cm level ring — dx SLIDES it across the face (the plane movement)", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    const w = waistV(cfg);
    const at = rigPlace(cfg, p, 0.4, w, 1);
    expect(at[1]).toBeCloseTo(0.09, 9); // the ring's radius, along the normal
    const side = rigPlace(cfg, p, 0.4 + 0.5, w, 1);
    expect(side[1]).toBeCloseTo(0.09, 9); // dx: in the face's plane
    expect(Math.hypot(side[0] - at[0], side[2] - at[2])).toBeGreaterThan(0.03); // ⛔ a yaw about the gizmo's vertical spun it in place
  });
  it("⭐⭐⭐ THE CAMERA IS NEVER UPSIDE DOWN (a top face): its heading is dx's alone — the same at every v — its tilt the curve's folded, never past straight down", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    const heads = [0, 0.2, 0.45, waistV(cfg), 0.55, 0.8, 1].map((v) => rigCameraAngles(cfg, p, { yaw: 1.3, v }));
    for (const h of heads) {
      expect(h.az).toBeCloseTo(heads[0]!.az, 12); // ⛔ read off a position, it spun 180° over the gizmo
      expect(h.el).toBeGreaterThanOrEqual(0);
      expect(h.el).toBeLessThanOrEqual(89 * DEG + 1e-12);
    }
    expect(rigCameraAngles(cfg, p, { yaw: 1.3, v: waistV(cfg) }).el).toBeCloseTo(89 * DEG, 9); // straight down at the crossing
  });
  it("⭐ the rings' centres beyond the piece as the camera sees it: unturned 0; a side face the turned radial; a top face the camera's side", () => {
    expect(rigBetaFor(IDENTITY, 0.7, [1, 0, 0])).toBe(0);
    const qs = rigRotationFor(cfg, 0, [0, 0, 1]);
    expect(Math.cos(rigBetaFor(qs, 0, [1, 0, 0]) - Math.PI / 2)).toBeCloseTo(1, 9);
    const qt = rigRotationFor(cfg, 0, [0, 1, 0]);
    expect(Math.cos(rigBetaFor(qt, 0, [0, 0, -1]) + Math.PI / 2)).toBeCloseTo(1, 9);
  });
  it("⭐ the rebase: the yaw whose ring points at the piece — the inverse of the place", () => {
    for (const p of [UNTURNED, turnFor(0.4, [0, 1, 0]), turnFor(-0.6, [0.2, 0.5, 0.8])]) {
      for (const yaw of [0.3, 2.2, -1.4]) {
        const rel = rigPlace(cfg, p, yaw, 0.7, 1);
        expect(Math.cos(rigYawToward(cfg, p, 0.7, 1, rel) - yaw)).toBeCloseTo(1, 9);
      }
    }
  });
  it("⭐ the blend at the gizmo's share: places straight, the camera's azimuth the short way round; at 1 exactly the new", () => {
    expect(blendPlace([0, 0, 0], [1, 2, 3], 1)).toEqual([1, 2, 3]);
    expect(blendPlace([0, 0, 0], [1, 2, 3], 0.5)).toEqual([0.5, 1, 1.5]);
    const m = blendAngles({ az: 3.0, el: 0 }, { az: -3.0, el: 0.4 }, 0.5);
    expect(Math.cos(m.az - Math.PI)).toBeCloseTo(1, 9); // through ±180°, not through 0
    expect(m.el).toBeCloseTo(0.2, 12);
  });
});

describe("⭐⭐⭐ the rig's turn wired (2026-10-16)", () => {
  it("⭐⭐ every world place the rings give is the turned curve's level ring: the piece's anchor (so the solver), the drawn piece, the way in's heading", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const offP = ringPlaceNow(st, o.yaw, o.v, o.zoom);"); // ringAnchorAt
    expect(g).toContain("const boP = ringPlaceNow(st, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);");
    expect(g).toContain("const be = st.pieceEntry === null ? null : ringPlaceNow(st, st.pieceEntry.headingRad, st.boxOrbit.v, st.boxOrbit.zoom);");
  });
  it("⭐⭐⭐ the camera upright: its angles `cameraAnglesNow` (the centre orbit, the way in, the orbit around the piece), its up never turned", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const o = cameraOffsetNow(st, st.cameraLagged,");
    expect(g.split("const ring = cameraAnglesNow(st, st.cameraLagged, off);").length - 1).toBe(2);
    expect(g).not.toContain("upVector"); // ⛔ the rig's up: upside down past the crossing
    expect(g).not.toContain("toRigSpace");
  });
  it("⭐⭐ the gizmo's move sets the new turn from the face's normal at the camera's yaw (both taps: the first touch's, the second's)", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("retargetGizmo(st, to, pc.normal);");
    const h = code("render/hold_wiring.ts");
    expect(h).toContain("retargetGizmo(st, [h.centreAt[0], h.centreAt[1], h.centreAt[2]], h.centreNormal);");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("const q = rigRotationFor(st.cfg, yaw, normal);");
    expect(c).toContain("st.rigTo = { q, yaw0: yaw, beta: rigBetaFor(q, yaw, [cam.x - to[0], 0, cam.z - to[2]]) };");
  });
});
