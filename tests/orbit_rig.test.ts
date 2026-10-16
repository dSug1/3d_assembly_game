/**
 * ⭐⭐⭐ (2026-10-16) THE RIG TURNED ONTO THE GIZMO'S FACE — `src/input/orbit_rig.ts` and its wiring. The owner: *"The overall 2D curve … is rotated so
 * that between the 2nd and 3rd ring, the camera view is anti-aligned with the normal of the face supporting the gizmo"* → *"build, fix the rotation at
 * the camera's yaw when the gizmo moves, keep the camera offsets as they are right now … top faces: build what you recommend (I want the principle of a
 * plane movement halfway between rings 2 and 3 to be conserved)"*.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { orbitOffset } from "../src/input/orbit";
import { IDENTITY, qRotate, type Vec3 } from "../src/core/vec";

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

describe("⭐⭐⭐ the rig turned onto the gizmo's face (2026-10-16)", () => {
  it("⭐ halfway between rings 2 and 3: Scene_1's waist at the gizmo's height (its rings ±0.15 m, symmetric); three rings: 0.25", async () => {
    const { waistV } = await import("../src/input/orbit_rig");
    const o = orbitOffset(cfg, 0, waistV(cfg), 1).offsetM;
    expect(Math.abs(o[1])).toBeLessThan(1e-9); // the gizmo's height: the plane movement
    expect(waistV({ ...cfg, orbitLowerRingOn: 0 })).toBe(0.25);
  });
  it("⭐⭐⭐ after the turn, the rig's waist direction at the camera's yaw IS the face's normal — side, slanted, top, bottom, behind", async () => {
    const { rigRotationFor, waistV } = await import("../src/input/orbit_rig");
    for (const yaw of [0, 0.7, -2.1, 3]) {
      for (const n of [[1, 0, 0], [0, 0, -1], [0, 1, 0], [0, -1, 0], [0.3, 0.8, -0.5], [-Math.cos(yaw), 0, -Math.sin(yaw)]] as Vec3[]) {
        const q = rigRotationFor(cfg, yaw, n);
        expect(angle(qRotate(q, orbitOffset(cfg, yaw, waistV(cfg), 1).offsetM), n)).toBeLessThan(1e-4);
      }
    }
  });
  it("⭐⭐ a SIDE face (and one behind the camera): the turn is about the VERTICAL — the rings stay level; a TOP face: tilted 90° — the rings stand up", async () => {
    const { rigRotationFor } = await import("../src/input/orbit_rig");
    const up: Vec3 = [0, 1, 0];
    for (const n of [[0, 0, 1], [-1, 0, 0]] as Vec3[]) expect(angle(qRotate(rigRotationFor(cfg, 0, n), up), up)).toBeLessThan(1e-6); // ⛔ never flipped over the top
    expect(angle(qRotate(rigRotationFor(cfg, 0, up), up), up)).toBeCloseTo(90, 6);
    expect(rigRotationFor(cfg, 0.4, null)).toEqual(IDENTITY); // no face (the boot): as today
  });
  it("⭐ a turn keeps every ring's radius and height in the rig's frame: every distance from the gizmo unchanged", async () => {
    const { rigRotationFor, rigOffset } = await import("../src/input/orbit_rig");
    const q = rigRotationFor(cfg, 0.3, [0.2, 0.9, 0.1]);
    for (const v of [0, 0.2, 0.5, 0.8, 1]) {
      const o = orbitOffset(cfg, 1.1, v, 1);
      const w = rigOffset(q, o.offsetM);
      expect(Math.hypot(w[0], w[1], w[2])).toBeCloseTo(o.radiusM, 9);
    }
  });
  it("⭐ yawTurn adds to the orbit's yaw: orbitOffset(yaw + δ) = yawTurn(δ) · orbitOffset(yaw)", async () => {
    const { yawTurn } = await import("../src/input/orbit_rig");
    for (const [y, d] of [[0.3, 0.9], [-2, 2.5]]) {
      const a = orbitOffset(cfg, y! + d!, 0.7, 1).offsetM;
      const b = qRotate(yawTurn(d!), orbitOffset(cfg, y!, 0.7, 1).offsetM);
      for (let i = 0; i < 3; i++) expect(b[i]).toBeCloseTo(a[i]!, 12);
    }
  });
  it("⭐⭐⭐ dx YAWS ABOUT THE WORLD VERTICAL (the owner: *\"Always yaw about vertical\"*): a ring point at yaw y is the turned curve at the fixed yaw, swung by y − y0 round the vertical; unturned: today's rig exactly", async () => {
    const { rigAtYaw, rigRotationFor, yawTurn } = await import("../src/input/orbit_rig");
    const y0 = 0.4;
    const R = rigRotationFor(cfg, y0, [0, 1, 0]);
    for (const y of [y0, 1.3, -1.9]) {
      for (const v of [0.2, 0.5, 0.9]) {
        const a = qRotate(rigAtYaw(R, y0, y), orbitOffset(cfg, y, v, 1).offsetM);
        const b = qRotate(yawTurn(y - y0), qRotate(R, orbitOffset(cfg, y0, v, 1).offsetM));
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 9);
      }
      const id = rigAtYaw(IDENTITY, y0, y);
      expect(angle(qRotate(id, [1, 0.3, -0.2]), [1, 0.3, -0.2])).toBeLessThan(1e-6); // ⛔ no turn, no change
    }
  });
  it("⭐⭐⭐ a TOP face: halfway between rings 2 and 3 the piece stays straight above the gizmo at EVERY dx (⛔ the rig's own axis wheeled it over the top)", async () => {
    const { rigAtYaw, rigRotationFor, waistV } = await import("../src/input/orbit_rig");
    const R = rigRotationFor(cfg, 0.4, [0, 1, 0]);
    for (const y of [0.4, 1.0, 2.5, -1.2]) expect(angle(qRotate(rigAtYaw(R, 0.4, y), orbitOffset(cfg, y, waistV(cfg), 1).offsetM), [0, 1, 0])).toBeLessThan(1e-4);
  });
  it("⭐ the blend: from the old rotation to the new by the gizmo's share; at 1 exactly the new", async () => {
    const { rigAt, rigRotationFor } = await import("../src/input/orbit_rig");
    const to = rigRotationFor(cfg, 0, [0, 1, 0]);
    expect(rigAt(IDENTITY, to, 1)).toEqual(to);
    expect(rigAt(IDENTITY, to, 0)).toEqual(IDENTITY);
    const mid = qRotate(rigAt(IDENTITY, to, 0.5), [0, 1, 0]);
    expect(angle(mid, [0, 1, 0])).toBeCloseTo(45, 6);
  });
});

describe("⭐⭐⭐ the rig's turn wired (2026-10-16)", () => {
  it("⭐⭐ the rings' world places read the turned rig: the piece's anchor, the camera, the ring angles of the way in and out", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const off = rigOffset(rigQAt(st, o.yaw), orbitOffset(st.cfg, o.yaw, o.v, o.zoom).offsetM);"); // ringAnchorAt
    expect(g).toContain("const rigQ = rigQAt(st, st.boxOrbit.yaw); const boW = rigOffset(rigQ, bo.offsetM);"); // the drawn piece
  });
  it("⭐⭐⭐ the CAMERA IN THE RIG'S FRAME (the owner: *\"I want the same as when the camera orbit between rings 2 and 3 when the face is vertical\"*): the piece carried in, the answer carried out, the camera's up turned — ⛔ the world's up flipped the picture over the gizmo", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const qc = rigQAt(st, st.cameraLagged.yaw); const ppW = pp; { const pp = toRigSpace(st, qc, ppW);");
    expect(g).toContain("camAt = fromRigSpace(st, qc, camAt); lookAt = fromRigSpace(st, qc, lookAt); const upW = qRotate(qc, [0, 1, 0]);");
    expect(g).toContain("st.camera.upVector = new Vector3(upW[0], upW[1], upW[2]);");
    expect(g).not.toContain("rigCameraOffset"); // ⛔ the offsets added in the world: undefined straight over the gizmo

  });
  it("⭐⭐ the gizmo's move sets the rig's new turn from the face's normal at the camera's yaw (both taps: the first touch's, the second's)", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("retargetGizmo(st, to, pc.normal);");
    const h = code("render/hold_wiring.ts");
    expect(h).toContain("retargetGizmo(st, [h.centreAt[0], h.centreAt[1], h.centreAt[2]], h.centreNormal);");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("st.rigFrom = rigQAt(st, yaw);");
    expect(c).toContain("st.rigTo = rigRotationFor(st.cfg, yaw, normal); st.rigYaw0 = yaw;");
  });
});
