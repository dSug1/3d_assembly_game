/**
 * ⭐⭐ prototype (green box) — an orbited piece's faces are tracked while it is outside the guide sphere (the owner, 2026-10-02:
 * *"when a piece goes outside the white sphere, compute its number of faces and track them. This is valid for the green piece or
 * any other piece which will later be orbited"* — *"also at boot, if any piece is outside the white sphere"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { faceAreaM2, faceTracking, pieceFaces } from "../src/input/green_box";
import { meshTopology } from "../src/core/mesh_topology";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

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

describe("⭐⭐ prototype — an orbited piece's faces, tracked outside the guide sphere", () => {
  it("⭐ the decision per frame: START on the outward crossing AND outside at the first frame (the boot); KEEP; STOP; NONE", () => {
    expect(faceTracking(null, true)).toBe("START"); // ⭐ at boot, already outside
    expect(faceTracking(false, true)).toBe("START"); // the crossing outward
    expect(faceTracking(true, true)).toBe("KEEP");
    expect(faceTracking(true, false)).toBe("STOP");
    expect(faceTracking(false, false)).toBe("NONE");
    expect(faceTracking(null, false)).toBe("NONE");
  });

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

  it("⭐ wired: the green piece is the first orbited piece; each frame after the sphere; faces placed WITHOUT a second scale; on the HUD", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.greenBox = box;\s*\/\/[^\n]*\n\s*st\.orbitedPieces\.push\(box\);/);
    expect(w).toMatch(/guideSphereFrame\(st\);\s*trackOrbitedFaces\(st, now\);/);
    expect(w).toMatch(/const step = faceTracking\(prev === undefined \? null : prev\.outside, out\);/);
    expect(w).toMatch(/faces = topo === null \? \[\] : pieceFaces\(topo\.positions, topo\.faces\);/);
    // ⚠ `topologyFromMesh` already carries the mesh's scale: rotation + position only, never the world matrix's scale again
    expect(w).toMatch(/normal: qRotate\(q, f\.normal\), centre: add\(\[p\.x, p\.y, p\.z\], qRotate\(q, f\.centre\)\)/);
    expect(w).not.toMatch(/TransformCoordinates/);
    expect(code("render/hud_paint.ts")).toMatch(/`faces \$\{tr\.length\} tracked, /);
  });
});
