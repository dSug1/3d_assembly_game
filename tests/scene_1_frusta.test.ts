/**
 * ⭐⭐ (2026-10-18, the owner: *"Add and seat a part with the same geometry as the green piece to the right face of piece 5 … This will allow me to place
 * the gizmo on faces which have tilted orientation"* → *"also, add a similar part on the bottom face of piece 19 and seat it with its longest face
 * snapped and aligned with the bottom face of piece 19"*) — the two SEATED FRUSTA of `Scene_1` (`content/scene_1.ts`).
 */
import { describe, expect, it } from "vitest";
import { SCENE_1, SCENE_1_CONTOUR_MARGIN, SCENE_1_FRUSTUM_IDS, SCENE_1_OVERHANG_IDS, SCENE_1_FRUSTUM_SIZE, SCENE_1_TABLE } from "../src/content/scene_1";
import { greenPyramidSizeM } from "../src/input/green_box";
import { OBJECT_TOP_SCALE } from "../src/core/scene_dims";
import { goalReport } from "../src/core/goal";
import { qFromAxisAngle, qmul, qRotate, type Quat, type Vec3 } from "../src/core/vec";
import type { BodySpec } from "../src/core/game_structure";

const D = 180 / Math.PI;
const body = (id: string): BodySpec => SCENE_1.bodies.find((b) => b.id === id)!;
const quatOf = (b: Pick<BodySpec, "orientation">): Quat => {
  const o = b.orientation;
  return typeof o === "object" && "quat" in o ? o.quat : [1, 0, 0, 0];
};
const near = (a: Vec3, b: Vec3, eps = 1e-9): boolean => Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps && Math.abs(a[2] - b[2]) < eps;

describe("⭐⭐ the seated frusta of Scene_1 (2026-10-18)", () => {
  it("⭐⭐ two parts with the green piece's geometry EXACTLY — movable (a frozen body hosts no gizmo), white", () => {
    expect(SCENE_1_FRUSTUM_IDS).toEqual(["Piece42", "Piece43"]);
    const green = greenPyramidSizeM(body("Piece17").dims, 1); // authored units (unitM 1)
    for (const id of SCENE_1_FRUSTUM_IDS) {
      const b = body(id);
      expect(b.frozen).toBe(false);
      expect(b.topScale).toBe(OBJECT_TOP_SCALE);
      for (let i = 0; i < 3; i++) expect(b.dims[i]).toBeCloseTo(green[i]!, 9);
      expect(b.margin ?? 0).toBe(0);
      expect(b.colour).toEqual(body("Piece5").colour); // white — ⚠ not yellow: the green piece is sized from the yellow ones
    }
    // the demo plays the table alone
    expect(SCENE_1_TABLE.bodies.some((b) => SCENE_1_FRUSTUM_IDS.includes(b.id))).toBe(false);
    expect(SCENE_1_TABLE.bodies.some((b) => SCENE_1_OVERHANG_IDS.includes(b.id))).toBe(false);
    expect(SCENE_1_TABLE.bodies.length).toBe(SCENE_1.bodies.length - 4); // ⭐ (2026-10-29) and the two overhangs
  });
  it("⭐⭐ Piece42 on Piece5's RIGHT face: its wide face flush on Piece5's contour, facing it; its long axis vertical; the taper pointing right", () => {
    const b = body("Piece42");
    const host = body("Piece5");
    const q = quatOf(b);
    expect(near(qRotate(q, [0, -1, 0]), [-1, 0, 0])).toBe(true); // the wide face (body −y) faces −x: onto Piece5
    expect(Math.abs(qRotate(q, [1, 0, 0])[1])).toBeCloseTo(1, 9); // the long axis (body x) vertical
    const hostRight = host.position[0] + host.dims[0] / 2 + SCENE_1_CONTOUR_MARGIN;
    expect(b.position[0] - b.dims[1] / 2).toBeCloseTo(hostRight, 9); // flush: the wide face ON the contour (touching, no gap, no overlap)
    expect(b.position[1]).toBeCloseTo(host.position[1], 9);
    expect(b.position[2]).toBeCloseTo(host.position[2], 9);
  });
  it("⭐⭐ Piece43 under Piece19's BOTTOM face: its wide face (its longest) flush on Piece19's contour, facing it; its long axis along Piece19's; ⚠ sunk into the floor (the owner's choice)", () => {
    const b = body("Piece43");
    const host = body("Piece19");
    const q = quatOf(b);
    expect(near(qRotate(q, [0, -1, 0]), [0, 1, 0])).toBe(true); // the wide face faces up: onto Piece19
    expect(Math.abs(qRotate(q, [1, 0, 0])[0])).toBeCloseTo(1, 9); // the long axis along x — Piece19's long side (0.93)
    expect(host.dims[0]).toBeGreaterThan(host.dims[1]);
    const hostBottom = host.position[1] - host.dims[1] / 2 - SCENE_1_CONTOUR_MARGIN;
    expect(b.position[1] + b.dims[1] / 2).toBeCloseTo(hostBottom, 9);
    // ⚠ "Sink into the floor": its apex 0.26 units below the sand's top (y 0)
    expect(b.position[1] - b.dims[1] / 2).toBeCloseTo(-0.2575, 9);
  });
  it("⭐⭐ their slanted sides are TILTED faces: ~32° and ~15° off the host face's normal — none square to the world's axes", () => {
    const [w, h, d] = body("Piece42").dims;
    const s = OBJECT_TOP_SCALE;
    // the body's slanted side normals (the taper along +y): across the long side, and across the short side
    const tiltLong = Math.atan2((w / 2) * (1 - s), h) * D;
    const tiltShort = Math.atan2((d / 2) * (1 - s), h) * D;
    expect(tiltLong).toBeCloseTo(32.1, 1);
    expect(tiltShort).toBeCloseTo(15.3, 1);
    for (const id of SCENE_1_FRUSTUM_IDS) {
      const q = quatOf(body(id));
      for (const [nx, ny, nz] of [[Math.cos(tiltLong / D), Math.sin(tiltLong / D), 0], [0, Math.sin(tiltShort / D), Math.cos(tiltShort / D)]] as Vec3[]) {
        const n = qRotate(q, [nx, ny, nz]);
        expect(Math.max(Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2]))).toBeLessThan(0.99); // tilted in the world
      }
    }
  });
  it("⭐ part of the goal where they sit — a frustum the same only turned half a round about its taper axis; the level met at the table with all 45 (⭐ the overhangs too, 2026-10-29)", () => {
    const final = SCENE_1.final!;
    for (const id of [...SCENE_1_FRUSTUM_IDS, ...SCENE_1_OVERHANG_IDS]) {
      const f = final.bodies.find((x) => x.id === id)!;
      expect(f.symmetry).toBe("yawHalfTurns");
      expect(f.position).toEqual(body(id).position);
    }
    const U = SCENE_1.unitM!;
    const R = qmul(qFromAxisAngle([0, 1, 0], 0.7), qFromAxisAngle([1, 0, 0], 0.2));
    const t: Vec3 = [0.4, 0.1, -0.3];
    const pose = (id: string) => {
      const f = final.bodies.find((x) => x.id === id);
      if (!f) return null;
      const p = qRotate(R, [f.position[0] * U, f.position[1] * U, f.position[2] * U]);
      return { position: [p[0] + t[0], p[1] + t[1], p[2] + t[2]] as Vec3, orientation: qmul(R, quatOf(f)) };
    };
    const r = goalReport(final, U, pose, { positionM: 0.005, angleRad: 5 / D });
    expect(r).toMatchObject({ met: true, total: 45, inPlace: 45 });
    // turned a QUARTER about its taper axis, a frustum is out
    const turned = (id: string) => {
      const p = pose(id)!;
      return id === "Piece42" ? { ...p, orientation: qmul(p.orientation, qFromAxisAngle([0, 1, 0], Math.PI / 2)) } : p;
    };
    expect(goalReport(final, U, turned, { positionM: 0.005, angleRad: 5 / D }).met).toBe(false);
  });
});

describe("⭐⭐ the overhangs of Scene_1 (2026-10-29)", () => {
  const h = SCENE_1_FRUSTUM_SIZE[1] / 2;
  it("⭐⭐ (*\"small face on top of the horizontal top face, to create an overhang on the top horizontal face\"*) Piece44 on Piece4's TOP: its SMALL face flush on the contour, its long axis along the depth — the wide top hanging 35 mm over the front and the back", () => {
    expect(SCENE_1_OVERHANG_IDS).toEqual(["Piece44", "Piece45"]);
    const b = body("Piece44");
    const host = body("Piece4");
    const q = quatOf(b);
    expect(near(qRotate(q, [0, 1, 0]), [0, -1, 0])).toBe(true); // the small face (body +y) down, onto Piece4
    expect(Math.abs(qRotate(q, [1, 0, 0])[2])).toBeCloseTo(1, 9); // the long axis along the depth
    expect(b.position[1] - h).toBeCloseTo(host.position[1] + host.dims[1] / 2 + SCENE_1_CONTOUR_MARGIN, 9); // flush on the contour
    expect(b.position[2]).toBeCloseTo(host.position[2], 9);
    const hostDepth = host.dims[2] + 2 * SCENE_1_CONTOUR_MARGIN;
    expect(((b.dims[0] - hostDepth) / 2) * 0.1 * 1000).toBeCloseTo(35.25, 6); // the overhang, mm (the wide face over the host's depth)
    expect(b.dims[0] * OBJECT_TOP_SCALE).toBeGreaterThan(hostDepth); // the small face already over both edges
    // 6.75 mm clear of the orbited pieces' goal on the same top (the green piece: 1.035 long along x, centred at 1.04)
    expect((1.04 - 1.035 / 2 - (b.position[0] + b.dims[2] / 2)) * 0.1 * 1000).toBeCloseTo(6.75, 6);
  });
  it("⭐⭐ (*\"small face adhered to a vertical face to create an overhand on a vertical face\"*) Piece45 on Piece10's FRONT face (−z, the boot's): its SMALL face flush on the contour, its long axis vertical — the wide face 26 mm over the small one above and below", () => {
    const b = body("Piece45");
    const host = body("Piece10");
    const q = quatOf(b);
    expect(near(qRotate(q, [0, 1, 0]), [0, 0, 1])).toBe(true); // the small face toward +z: onto the front face
    expect(Math.abs(qRotate(q, [1, 0, 0])[1])).toBeCloseTo(1, 9); // the long axis vertical
    expect(b.position[2] + h).toBeCloseTo(host.position[2] - host.dims[2] / 2 - SCENE_1_CONTOUR_MARGIN, 9);
    // on Piece10's face, whole
    expect(b.position[1] - (b.dims[0] * OBJECT_TOP_SCALE) / 2).toBeGreaterThan(host.position[1] - host.dims[1] / 2);
    expect(b.position[0] - (b.dims[2] * OBJECT_TOP_SCALE) / 2).toBeGreaterThan(host.position[0] - host.dims[0] / 2);
    expect(((b.dims[0] * (1 - OBJECT_TOP_SCALE)) / 2) * 0.1 * 1000).toBeCloseTo(25.875, 6);
    // both at the assembly's centre in x, as the boot's yaw plane cuts it
    expect(b.position[0]).toBe(body("Piece44").position[0]);
  });
});
