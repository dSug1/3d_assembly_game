/**
 * GOLDEN VECTORS — **`Scene_0`, THE HEPTAGON** (the owner, 2026-11-12: *"an heptagon extruded horizontally. One face on the floor, the opposite edge at
 * the zenith. Dimensions: overall the same as the cube of the assembly of scene 1. Grey color"*, *"a green piece (same as the green piece of scene 1)"*,
 * *"the goal of the green piece shall be the center of the topmost slanted face towards the user at boot, the green piece resting face being oriented
 * longitudinally and being the largest face of the green piece"*, *"the camera orbit center shall be the center of the heptagon"*).
 * ⛔ RED before: `core/prism.ts` absent, `Scene_0` the workbench.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { apexAtTop, apexTurn, boxFit, prismOutline } from "@core/prism";
import { resolveBootOrientation } from "@core/game_structure";
import { qRotate, type Quat, type Vec3 } from "@core/vec";
import { SCENE_0, SCENE_0_ANCHOR_DIMS, SCENE_0_ANCHOR_POSITION, SCENE_0_ANCHOR_SHIFT, SCENE_0_HEPTAGON_DIMS, SCENE_0_HEPTAGON_POSITION, SCENE_0_ORBIT_GOALS, heptagonGoalFace } from "../src/content/scene_0";
import { SCENE_1 } from "../src/content/scene_1";
import { greenPyramidSizeM } from "@input/green_box";

const code = (p: string): string => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const close = (a: readonly number[], b: readonly number[], eps = 1e-9) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, -Math.log10(eps)));

describe("⭐ core/prism.ts — a right prism on a regular polygon, its bottom edge flat", () => {
  it("⭐ the heptagon's outline: 7 vertices, its box exactly w × h centred, ONE flat bottom edge, ONE vertex at the zenith", () => {
    const pts = prismOutline(7, 4.83, 4.83)!;
    expect(pts).toHaveLength(7);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(4.83, 12);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(4.83, 12);
    expect(Math.max(...xs) + Math.min(...xs)).toBeCloseTo(0, 12);
    expect(Math.max(...ys) + Math.min(...ys)).toBeCloseTo(0, 12);
    expect(ys.filter((y) => Math.abs(y + 4.83 / 2) < 1e-12)).toHaveLength(2); // a face on the floor
    const top = pts.filter((p) => Math.abs(p[1] - 4.83 / 2) < 1e-12);
    expect(top).toHaveLength(1); // the opposite EDGE … at the zenith: a vertex, the heptagon being odd
    expect(top[0]![0]).toBeCloseTo(0, 12);
  });

  it("⭐ an even polygon has a flat top as well; degenerate inputs are null", () => {
    const hex = prismOutline(6, 2, 1)!;
    expect(hex.map((p) => p[1]).filter((y) => Math.abs(y - 0.5) < 1e-12)).toHaveLength(2);
    expect(prismOutline(2, 1, 1)).toBeNull();
    expect(prismOutline(7.5, 1, 1)).toBeNull();
    expect(prismOutline(7, 0, 1)).toBeNull();
  });

  it("⭐ the mesh's fit: the turn that brings a ring vertex to the top, the check, the stretch onto the box", () => {
    // a ring of 7 on the z axis, starting at +x (as Babylon's cylinder builds it)
    const ring: number[] = [];
    for (let k = 0; k < 7; k++) ring.push(Math.cos((k * 2 * Math.PI) / 7), Math.sin((k * 2 * Math.PI) / 7), 1, Math.cos((k * 2 * Math.PI) / 7), Math.sin((k * 2 * Math.PI) / 7), -1);
    expect(apexAtTop(ring)).toBe(false);
    const t = apexTurn(ring, 7)!;
    const turned = [...ring];
    for (let i = 0; i < turned.length; i += 3) {
      const [x, y] = [ring[i]!, ring[i + 1]!];
      turned[i] = x * Math.cos(t) - y * Math.sin(t);
      turned[i + 1] = x * Math.sin(t) + y * Math.cos(t);
    }
    expect(apexAtTop(turned)).toBe(true);
    const fit = boxFit(turned, [4.83, 4.83, 4.9])!;
    expect(fit.scale[2]).toBeCloseTo(4.9 / 2, 12);
    expect(boxFit([0, 0, 0, 1, 0, 1], [1, 1, 1])).toBeNull(); // flat on y
    expect(apexTurn([0, 0, 1, 0, 0, -1], 7)).toBeNull(); // nothing off the axis
  });

  it("⭐ wired: a body's prismSides builds the prism (Babylon's cylinder, turned, stretched, flat shaded)", () => {
    expect(code("render/scene.ts")).toContain("      b.prismSides,\n    );");
    const b = code("render/bodies.ts");
    expect(b).toContain("const mesh = prismSides !== undefined ? prismMesh(st, name, prismSides, dims) : CreateBox(");
    expect(b).toContain("m.convertToFlatShadedMesh();");
  });
});

describe("⭐⭐ Scene_0 — the heptagon, the green piece, its goal, the orbit's centre", () => {
  const hep = SCENE_0.bodies.find((b) => b.id === "Heptagon")!;
  const q = resolveBootOrientation(hep.orientation, []) as Quat;

  it("⭐ the cube's overall size (4.9 × 4.83 × 4.83 units in the world), extruded along x, standing on the floor, grey, a PLACED part", () => {
    // its own dims turned a quarter about the vertical: the extrusion (own z) along world x, the polygon across world z
    const world = [0, 1, 2].map((k) => Math.abs(qRotate(q, [k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0])[0]));
    expect(world[2]).toBeCloseTo(1, 12); // own z → world x
    expect([SCENE_0_HEPTAGON_DIMS[2], SCENE_0_HEPTAGON_DIMS[1], SCENE_0_HEPTAGON_DIMS[0]]).toEqual([4.9, 4.83, 4.83]);
    expect(SCENE_0_HEPTAGON_POSITION[1] - SCENE_0_HEPTAGON_DIMS[1] / 2).toBeCloseTo(0, 12); // its bottom face on the floor's top
    expect(hep.frozen).toBe(false);
    expect(SCENE_0.final?.frame).toBe("ABSOLUTE");
    expect(SCENE_0.final?.bodies[0]).toEqual({ id: "Heptagon", position: hep.position, orientation: hep.orientation });
  });

  it("⭐ the goal face: a TOP slanted face (adjacent to the zenith), on the user's side (−z, the boot camera's)", () => {
    const f = heptagonGoalFace();
    expect(f.normal[0]).toBeCloseTo(0, 12);
    expect(f.normal[1]).toBeGreaterThan(0.5); // a top face
    expect(f.normal[1]).toBeLessThan(0.99); // slanted
    expect(f.normal[2]).toBeLessThan(0); // toward the user
    expect(f.centre[0]).toBeCloseTo(hep.position[0], 12); // centred along the length
    expect(f.centre[1]).toBeGreaterThan(hep.position[1]);
  });

  it("⭐ the green piece's goal: its WIDE BASE (its largest face) flush and centred on that face, its long side along the heptagon's length", () => {
    const f = heptagonGoalFace();
    const g = SCENE_0_ORBIT_GOALS.find((x) => x.id === "green-box")!;
    const gq = (g.orientation as { quat: Quat }).quat;
    const [w, h, d] = greenPyramidSizeM(SCENE_1.bodies.find((b) => b.id === "Piece17")!.dims, 1);
    expect(w * d).toBeGreaterThan(w * h); // the base (w × d) is the largest face
    expect(w).toBeGreaterThan(d);
    close(qRotate(gq, [0, 1, 0]), f.normal); // its own up on the face's normal: its base (−y) against the face
    close(qRotate(gq, [1, 0, 0]), [1, 0, 0]); // its long side along x
    const base: Vec3 = [g.position[0] - f.normal[0] * (h / 2), g.position[1] - f.normal[1] * (h / 2), g.position[2] - f.normal[2] * (h / 2)];
    close(base, f.centre); // the base's centre on the face's centre
  });

  it("⭐⭐ (2026-11-12, the owner: *\"add a protruding part on the left of the topmost slanted face of the heptagon to give a visual anchor to the player\"*) THE ANCHOR: proud of the goal face, its base flush on it, on the boot camera's LEFT (−x), clear of the green piece's goal, a PLACED part", () => {
    const f = heptagonGoalFace();
    const a = SCENE_0.bodies.find((b) => b.id === "Anchor")!;
    expect(a).toBeDefined();
    expect(a.frozen).toBe(false);
    expect(a.position).toEqual(SCENE_0_ANCHOR_POSITION);
    const aq = (a.orientation as { quat: Quat }).quat;
    close(qRotate(aq, [0, 1, 0]), f.normal); // standing on the face (its own up the face's normal)
    const h = SCENE_0_ANCHOR_DIMS[1];
    const base: Vec3 = [a.position[0] - f.normal[0] * (h / 2), a.position[1] - f.normal[1] * (h / 2), a.position[2] - f.normal[2] * (h / 2)];
    close(base, [f.centre[0] + SCENE_0_ANCHOR_SHIFT, f.centre[1], f.centre[2]]); // its base flush on the face, across its slope's middle
    expect(SCENE_0_ANCHOR_SHIFT).toBeLessThan(0); // the left: −x (the boot camera at −z looking at +z; probed headless: its view x −0.16 against the heptagon's 0)
    // clear of the green piece's goal along x, and within the heptagon's length
    const [w] = greenPyramidSizeM(SCENE_1.bodies.find((b) => b.id === "Piece17")!.dims, 1);
    const g = SCENE_0_ORBIT_GOALS.find((x) => x.id === "green-box")!;
    expect(g.position[0] - w / 2 - (a.position[0] + SCENE_0_ANCHOR_DIMS[0] / 2)).toBeGreaterThan(0.5);
    expect(a.position[0] - SCENE_0_ANCHOR_DIMS[0] / 2).toBeGreaterThan(hep.position[0] - SCENE_0_HEPTAGON_DIMS[2] / 2);
    // a placed part: its goal where it boots
    expect(SCENE_0.final?.bodies.find((b) => b.id === "Anchor")).toEqual({ id: "Anchor", position: a.position, orientation: a.orientation });
  });

  it("⭐ the orbit's boot centre is the heptagon's centre; the green piece sized from Scene_1's Piece17", () => {
    close(SCENE_0.orbit!.centreM!, hep.position.map((v) => v * SCENE_0.unitM!));
    expect(SCENE_0.orbitPieceRefDims).toEqual([0.92, 0.55, 0.3]);
  });
});
