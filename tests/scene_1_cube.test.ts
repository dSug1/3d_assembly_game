/**
 * GOLDEN VECTORS — **`Scene_1` THE CUBE** (the owner, 2026-11-08: *"increase the scale of all the seated parts in the z depth world axis so that the
 * assembly is a cube instead of a thin painting. Move the non seated parts which would interfere so they maintain their same distances from the cube's
 * back face"*). Each was RED on `22cfb16` (the painting, 0.3 deep).
 */
import { describe, expect, it } from "vitest";
import { contourDims, type BodySpec } from "@core/game_structure";
import { SCENE_1, SCENE_1_BACK_SHIFT, SCENE_1_DEPTH, SCENE_1_FRUSTUM_IDS, SCENE_1_OVERHANG_IDS, SCENE_1_TABLE } from "../src/content/scene_1";

const LOOSE = ["Piece1", "Piece2", "Piece17", "Piece23", "Piece41"];
const frustum = (id: string) => SCENE_1_FRUSTUM_IDS.includes(id) || SCENE_1_OVERHANG_IDS.includes(id);
const seatedBoxes = SCENE_1.bodies.filter((b) => !b.frozen && !LOOSE.includes(b.id) && !frustum(b.id));

/** A box body's contour box (axis-aligned; a yawed loose piece by its yaw's bound). */
function boxOf(b: BodySpec): { lo: number[]; hi: number[] } {
  const d = contourDims(b);
  const yaw = typeof b.orientation === "object" && "yawDeg" in b.orientation ? (b.orientation.yawDeg * Math.PI) / 180 : 0;
  const hx = (Math.abs(Math.cos(yaw)) * d[0] + Math.abs(Math.sin(yaw)) * d[2]) / 2;
  const hz = (Math.abs(Math.sin(yaw)) * d[0] + Math.abs(Math.cos(yaw)) * d[2]) / 2;
  const p = b.position;
  return { lo: [p[0] - hx, p[1] - d[1] / 2, p[2] - hz], hi: [p[0] + hx, p[1] + d[1] / 2, p[2] + hz] };
}
function union(bs: readonly BodySpec[]): { lo: number[]; hi: number[] } {
  const r = { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] };
  for (const b of bs) { const x = boxOf(b); for (let k = 0; k < 3; k++) { r.lo[k] = Math.min(r.lo[k]!, x.lo[k]!); r.hi[k] = Math.max(r.hi[k]!, x.hi[k]!); } }
  return r;
}
const overlaps = (a: { lo: number[]; hi: number[] }, b: { lo: number[]; hi: number[] }) => [0, 1, 2].every((k) => a.lo[k]! < b.hi[k]! && b.lo[k]! < a.hi[k]!);

describe("⭐⭐⭐ Scene_1 — the assembly a cube (2026-11-08)", () => {
  const cube = union(seatedBoxes);
  const painting = union(SCENE_1_TABLE.bodies.filter((b) => !b.frozen && !LOOSE.includes(b.id)));

  it("⭐⭐ the seated boxes' box is a cube: its depth its height, its width within 2 % (RED: 0.33 deep)", () => {
    const [w, h, d] = [0, 1, 2].map((k) => cube.hi[k]! - cube.lo[k]!);
    expect(d).toBeCloseTo(h!, 9);
    expect(Math.abs(w! - d!) / d!).toBeLessThan(0.02);
    expect(SCENE_1_DEPTH).toBe(4.8);
  });

  it("⭐ the FRONT face (the boot's, −z) stays where the painting's was; the depth grows toward +z by the back's shift", () => {
    expect(cube.lo[2]).toBeCloseTo(painting.lo[2]!, 9);
    expect(cube.hi[2]! - painting.hi[2]!).toBeCloseTo(SCENE_1_BACK_SHIFT, 9);
    expect(SCENE_1_BACK_SHIFT).toBeCloseTo(4.5, 9);
  });

  it("⭐⭐ no loose piece stands in the cube — and Piece1 where it booted would (RED: the painting's box never reached it)", () => {
    for (const id of LOOSE) expect(overlaps(boxOf(SCENE_1.bodies.find((b) => b.id === id)!), cube), id).toBe(false);
    expect(overlaps(boxOf(SCENE_1_TABLE.bodies.find((b) => b.id === "Piece1")!), cube)).toBe(true);
    for (const id of LOOSE.filter((i) => i !== "Piece1")) expect(overlaps(boxOf(SCENE_1_TABLE.bodies.find((b) => b.id === id)!), cube), id).toBe(false);
  });

  it("⭐⭐ Piece1, behind it, keeps its distance from the back face; the loose pieces the cube does not reach are not moved, nor resized", () => {
    const at = (s: typeof SCENE_1, id: string) => s.bodies.find((b) => b.id === id)!;
    expect(boxOf(at(SCENE_1, "Piece1")).lo[2]! - cube.hi[2]!).toBeCloseTo(boxOf(at(SCENE_1_TABLE, "Piece1")).lo[2]! - painting.hi[2]!, 9);
    expect(boxOf(at(SCENE_1, "Piece1")).lo[2]! - cube.hi[2]!).toBeGreaterThan(0);
    for (const id of LOOSE) {
      expect(at(SCENE_1, id).dims, id).toEqual(at(SCENE_1_TABLE, id).dims);
      if (id !== "Piece1") expect(at(SCENE_1, id).position, id).toEqual(at(SCENE_1_TABLE, id).position);
    }
  });

  it("⭐ the goal is the cube: each seated box's slot 4.8 deep; a loose piece's slot flush with the front face", () => {
    const fin = new Map(SCENE_1.final!.bodies.map((f) => [f.id, f]));
    for (const b of seatedBoxes) expect(fin.get(b.id)!.kind, b.id).toMatch(/×4\.8$/);
    for (const id of LOOSE) {
      const f = fin.get(id)!;
      expect(f.kind, id).toMatch(/×0\.3$/);
      expect(f.position[2] - 0.15).toBeCloseTo(cube.lo[2]! + 0.015, 9); // its core's front on the cube's core front
    }
  });

  it("⭐ the demo keeps the painting: its table 0.3 deep (its move plan is generated from it)", () => {
    for (const b of SCENE_1_TABLE.bodies) if (!b.frozen) expect(b.dims[2], b.id).toBe(0.3);
    expect(SCENE_1_TABLE.bodies.some((b) => frustum(b.id))).toBe(false);
  });
});
