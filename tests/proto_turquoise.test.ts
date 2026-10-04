/**
 * ⭐⭐ prototype — THE TURQUOISE PIECE (the owner, 2026-10-04: *"create an hexagone — extrude the hexagone by twice its diameter — height
 * shall be the same as the longest dimension of the green piece. Place it to the right of the green piece, in random quaternion. When
 * importing in scene, compute the faces, etc. as for the green piece"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { bodyNamed, greenPyramidSizeM, pieceFaces, rightOfGreenM, turquoiseSizeM, turquoiseYawOffsetRad, uniformQuat } from "../src/input/green_box";
import { meshTopology } from "../src/core/mesh_topology";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { SCENE_1 } from "../src/content/scene_1";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — the turquoise piece", () => {
  it("⭐ its size on Scene_1: as long as the green piece's longest side (103.5 mm), half that across its corners", () => {
    const green = greenPyramidSizeM(bodyNamed(SCENE_1.bodies, "Piece17")!.dims, SCENE_1.unitM ?? 1);
    const t = turquoiseSizeM(green);
    expect(t.lengthM).toBeCloseTo(0.1035, 9);
    expect(t.lengthM).toBeCloseTo(2 * t.diameterM, 12); // extruded by twice its diameter
    // the longest side whichever axis carries it
    expect(turquoiseSizeM([0.01, 0.3, 0.02]).lengthM).toBe(0.3);
  });

  it("⭐⭐ built flat-shaded, its faces read as the green piece's are: a hexagonal prism has EIGHT logical faces (6 sides, 2 ends)", () => {
    const scene = new Scene(new NullEngine());
    const m = CreateCylinder("t", { height: 0.1035, diameter: 0.05175, tessellation: 6 }, scene);
    m.convertToFlatShadedMesh();
    const t = meshTopology(new Float32Array(m.getVerticesData(VertexBuffer.PositionKind)!), m.getIndices()!);
    const faces = pieceFaces(t.positions, t.faces);
    expect(faces).toHaveLength(8);
    const ends = faces.filter((f) => Math.abs(f.normal[1]) > 0.999);
    expect(ends).toHaveLength(2);
    // the six sides: horizontal normals 60° apart, each the same area (side × length)
    const sides = faces.filter((f) => Math.abs(f.normal[1]) < 1e-6);
    expect(sides).toHaveLength(6);
    for (const s of sides) expect(s.areaM2).toBeCloseTo((0.05175 / 2) * 0.1035, 9);
  });

  it("⭐ the random orientation is a unit quaternion, uniform (not Euler angles): its mean |w| is 4/(3π)", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const q = uniformQuat(rnd(), rnd(), rnd());
      expect(Math.hypot(...q)).toBeCloseTo(1, 12);
      sum += Math.abs(q[0]);
    }
    expect(sum / n).toBeCloseTo(4 / (3 * Math.PI), 2); // E|w| over the unit 3-sphere: ∫w√(1−w²) ÷ ∫√(1−w²) = (1/3) ÷ (π/4)
  });

  it("⭐ placed clear of the green piece whatever both orientations: both half diagonals plus the gap", () => {
    expect(rightOfGreenM([0.3, 0.4, 0], 0.1, 0.02)).toBeCloseTo(0.25 + 0.1 + 0.02, 12);
  });

  it("⭐⭐ it orbits beside the green piece at a constant CHORD: a fixed distance where the ring is wide, half a turn where it is too narrow", () => {
    // chord 0.13 m on a 3 m ring: ~2.5°; on the 0.09 m waist: ~92°; on a ring narrower than half the chord: the far side
    expect(turquoiseYawOffsetRad(0.13, 3)).toBeCloseTo(2 * Math.asin(0.13 / 6), 12);
    const r = 0.09;
    const d = turquoiseYawOffsetRad(0.13, r);
    expect(2 * r * Math.sin(d / 2)).toBeCloseTo(0.13, 12); // the chord kept exactly
    expect(turquoiseYawOffsetRad(0.13, 0.05)).toBeCloseTo(Math.PI, 12);
    expect(turquoiseYawOffsetRad(0.13, 0)).toBe(Math.PI);
  });

  it("⭐⭐ wired: created at boot after the green piece, flat-shaded, random, pickable and orbited (it snap-turns when held); on the rings to the camera's right", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/CreateCylinder\("turquoise-piece", \{ height: lengthM, diameter: diameterM, tessellation: 6 \}, st\.scene\);\s*mesh\.convertToFlatShadedMesh\(\);/);
    expect(w).toMatch(/mesh\.rotationQuaternion = toBabylon\(uniformQuat\(Math\.random\(\), Math\.random\(\), Math\.random\(\)\)\);/);
    expect(w).toMatch(/const faces = topo === null \? \[\] : pieceFaces\(topo\.positions, topo\.faces\);/);
    // ⭐ *"make it snap rotate when pressed upon"*: pickable (a press on it orbits) and orbited (held, it takes the snapped turn)
    expect(w).toMatch(/mesh\.isPickable = true;\s*mesh\.metadata = \{ orbitCandidate: false \};\s*st\.orbitedPieces\.push\(mesh\);/);
    // ⭐ it ORBITS (*"make it orbit like the green piece"*): the green piece's spring (yaw, v, zoom) and its clamp k, every frame
    expect(w).toMatch(/if \(t === null \|\| box === null \|\| st\.boxOrbit === null\) return;/);
    expect(w).toMatch(/const \{ yaw, v, zoom \} = st\.boxOrbit;/);
    expect(w).toMatch(/t\.mesh\.position\.copyFrom\(at\(t\.side \* dPsi\(\)\)\);/);
    // the side: the camera's RIGHT, chosen at the first frame only
    expect(w).toMatch(/if \(!t\.placed\) \{/);
    expect(w).toMatch(/const right = st\.camera\.getDirection\(new Vector3\(1, 0, 0\)\);/);
    expect(w).toMatch(/st\.camera\.setTarget\(c\.clone\(\)\);\s*turquoiseFrame\(st, k\);/);
    expect(code("render/scene.ts")).toMatch(/createGreenBox\(st\);\s*st\.turquoise = null;\s*createTurquoisePiece\(st\);/);
    expect(code("render/hud_paint.ts")).toMatch(/turquoise \$\{st\.turquoise\.faces\.length\} faces/);
  });
});
