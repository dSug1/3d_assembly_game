/**
 * ⭐⭐ prototype — an orbited piece's LOGICAL faces, read off its mesh (the owner, 2026-10-02: *"compute its number of faces"*).
 * ⛔ Their tracking and the turn it drove were removed, 2026-10-04 (*"Remove all the rotation from the green piece"*).
 */
import { describe, expect, it } from "vitest";
import { faceAreaM2, pieceFaces } from "../src/input/green_box";
import { meshTopology } from "../src/core/mesh_topology";
import type { Vec3 } from "../src/core/vec";


// A 2 × 1 × 3 box, 8 corners, 12 triangles wound outward.
const X = 1, Y = 0.5, Z = 1.5;
const corners: Vec3[] = [
  [-X, -Y, -Z], [X, -Y, -Z], [X, Y, -Z], [-X, Y, -Z],
  [-X, -Y, Z], [X, -Y, Z], [X, Y, Z], [-X, Y, Z],
];
const tris = [
  0, 2, 1, 0, 3, 2, // −z
  4, 5, 6, 4, 6, 7, // +z
  0, 1, 5, 0, 5, 4, // −y
  3, 7, 6, 3, 6, 2, // +y
  0, 4, 7, 0, 7, 3, // −x
  1, 2, 6, 1, 6, 5, // +x
];

describe("⭐⭐ prototype — an orbited piece's logical faces (read when it is created; the tracking went with the rotation, 2026-10-04)", () => {
  it("⭐ the faces are the LOGICAL ones — a box has six, not twelve triangles — with their normals, centres and areas", () => {
    const topo = meshTopology(new Float32Array(corners.flat()), tris);
    const faces = pieceFaces(topo.positions, topo.faces);
    expect(faces).toHaveLength(6);
    const areas = faces.map((f) => f.areaM2).sort((a, b) => a - b);
    expect(areas[0]).toBeCloseTo(2 * X * 2 * Y, 9); // the ±z faces, 2 × 1
    expect(areas[5]).toBeCloseTo(2 * X * 2 * Z, 9); // the ±y faces, 2 × 3
    const top = faces.find((f) => f.normal[1] > 0.99)!;
    expect(top.centre[1]).toBeCloseTo(Y, 9);
    expect(faceAreaM2([[0, 0, 0], [2, 0, 0], [2, 0, 3], [0, 0, 3]], [0, 1, 2, 0, 2, 3])).toBeCloseTo(6, 12);
  });
});
