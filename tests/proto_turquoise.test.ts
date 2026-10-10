/**
 * ⭐⭐ prototype — THE TURQUOISE PIECE, AND THE SWITCH BETWEEN IT AND THE GREEN ONE (the owner, 2026-10-04: *"Create the turquoise hexagonal
 * piece as previous. Set the same transform as the green piece (quaternion =(1,2,3,4) and position) at boot. Create a slider in scene menu
 * to choose between the green piece or the turquoise piece. When toggled, the piece shall be spawn as per boot."*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { bodyNamed, greenPyramidSizeM, hexPrismVolumeM3, pieceFaces, turquoiseSizeM } from "../src/input/green_box";
import { meshTopology } from "../src/core/mesh_topology";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — the turquoise piece", () => {
  it("⭐ its size on Scene_1: as long as the green piece's longest side (103.5 mm), half that across its corners", () => {
    const green = greenPyramidSizeM(bodyNamed(SCENE_1.bodies, "Piece17")!.dims, SCENE_1.unitM ?? 1);
    const t = turquoiseSizeM(green);
    expect(t.lengthM).toBeCloseTo(0.1035, 9);
    expect(t.lengthM).toBeCloseTo(2 * t.diameterM, 12); // extruded by twice its diameter
    expect(turquoiseSizeM([0.01, 0.3, 0.02]).lengthM).toBe(0.3); // the longest side, whichever axis carries it
  });

  it("⭐ its volume (the orbit's inertia reads it): the regular hexagon's area × its length", () => {
    // circumradius 1 → area 3√3/2; × length 2
    expect(hexPrismVolumeM3(2, 2)).toBeCloseTo(3 * Math.sqrt(3), 12);
  });

  it("⭐⭐ built flat-shaded, its faces read as the green piece's are: EIGHT logical faces (6 sides, 2 ends)", () => {
    const scene = new Scene(new NullEngine());
    const m = CreateCylinder("t", { height: 0.1035, diameter: 0.05175, tessellation: 6 }, scene);
    m.convertToFlatShadedMesh();
    const t = meshTopology(new Float32Array(m.getVerticesData(VertexBuffer.PositionKind)!), m.getIndices()!);
    const faces = pieceFaces(t.positions, t.faces);
    expect(faces).toHaveLength(8);
    expect(faces.filter((f) => Math.abs(f.normal[1]) > 0.999)).toHaveLength(2);
    const sides = faces.filter((f) => Math.abs(f.normal[1]) < 1e-6);
    expect(sides).toHaveLength(6);
    for (const s of sides) expect(s.areaM2).toBeCloseTo((0.05175 / 2) * 0.1035, 9);
  });

  it("⭐⭐ the switch: a slider in SCENE, green by default, 0 or 1 only", () => {
    expect(DEFAULT_CONFIG.orbitPieceKind).toBe(0);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitPieceKind: 2 })).toThrow();
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('tunable(st, "orbited piece (0 = green, 1 = turquoise)", "orbitPieceKind", 0, 1, 1)');
    // in the SCENE section
    expect(menu.indexOf('"orbitPieceKind"')).toBeGreaterThan(menu.indexOf('title: "SCENE"'));
    expect(menu.indexOf('"orbitPieceKind"')).toBeLessThan(menu.indexOf('title: "CAMERA"'));
  });

  it("⭐⭐ wired: both pieces built at boot, the turquoise flat-shaded; the one in use SPAWNED as at boot — the boot quaternion, the rig's boot pose", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/CreateCylinder\("turquoise-piece", \{ height: ts\.lengthM, diameter: ts\.diameterM, tessellation: 6 \}, st\.scene\);\s*hex\.convertToFlatShadedMesh\(\);/);
    expect(w).toMatch(/const ts = turquoiseSizeM\(\[w, h, d\]\);/);
    expect(w).toMatch(/spawnOrbitPiece\(st, st\.cfg\.orbitPieceKind, true\);/);
    // the switch moved: spawned again, first thing in the frame
    expect(w).toMatch(/if \(st\.cfg\.orbitPieceKind !== st\.orbitPieceKind\) spawnOrbitPiece\(st, st\.cfg\.orbitPieceKind, false\);\s*const now = performance\.now\(\);/);
    // the spawn: only that piece shown, it is the orbited one, at the boot quaternion; on a switch the rig back at its boot pose
    expect(w).toMatch(/for \(const o of st\.orbitPieces\) o\.mesh\.setEnabled\(o === p\);\s*st\.greenBox = p\.mesh;/);
    expect(w).toMatch(/p\.mesh\.rotationQuaternion = toBabylon\(greenBootOrientation\(st\.sceneSpec\.id\)\);/);
    expect(w).toMatch(/if \(!atBoot\) \{\s*st\.orbit = new OrbitController\(st\.cfg, ORBIT_START_YAW_RAD, st\.bootElevation\);\s*st\.zoom = st\.orbitStartZoom;/);
    expect(w).toMatch(/st\.boxSpring = null;\s*st\.cameraOrbit = null;\s*st\.cameraLagged = null;/);
    expect(code("render/hud_paint.ts")).toMatch(/st\.orbitPieceKind === 1 \? "turquoise" : "green"\}, \$\{st\.orbitPieceFaces\} faces/);
  });

  it("⭐⭐ the orbited piece's orientation: the boot one, the alignment, and the counter-yaw — nothing of the old rotation", () => {
    const w = code("render/green_box_wiring.ts");
    // the boot one; its depth clone's LOCAL identity; the resting-face ALIGNMENT (`restAlignFrame`); and since 2026-10-05 the yaw AGAINST
    // the orbit (`counterYawFrame`) — ⛔ *"the piece shall not move during its orbit"* (2026-10-04) is superseded by it
    expect(w.match(/rotationQuaternion\s*=/g)).toHaveLength(4);
    expect(w).toMatch(/box\.rotationQuaternion = new Quaternion\(q\[1\], q\[2\], q\[3\], q\[0\]\);/);
    expect(w).toMatch(/depth\.rotationQuaternion = Quaternion\.Identity\(\);/);
    expect(w).toMatch(/st\.greenBox\.rotationQuaternion = new Quaternion\(q\[1\], q\[2\], q\[3\], q\[0\]\);/);
    expect(w).not.toMatch(/trackOrbitedFaces|pieceTurns|freeTurns|greenHeldForOrbit/);
    const p = code("render/pointer_wiring.ts");
    expect(p).not.toMatch(/greenOrbitPointer|crossDeadbandScales|pinkFaceNormal/);
  });
});
