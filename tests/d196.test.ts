/**
 * ⭐⭐ `D196` — A FROZEN BODY HIDDEN FROM BELOW SHOWS ITS TOP FACE'S CONTOUR (the owner, 2026-10-02: *"when the camera is below
 * the floor, show the contour of the top face of the floor in sand yellow (just show the contour, but the contour can't
 * interact with nothing)"*). `core/underside.ts`'s `topFaceOutline`; wired in `render/render_loop.ts`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { topFaceOutline } from "../src/core/underside";
import { IDENTITY, qFromAxisAngle, type Vec3 } from "../src/core/vec";
import { SCENE_1, SCENE_1_PALETTE } from "../src/content/scene_1";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

/** A box's corners as a mesh gives them — every corner THREE times (24 split vertices). */
const boxPoints = (w: number, h: number, d: number): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [-w / 2, w / 2]) for (const y of [-h / 2, h / 2]) for (const z of [-d / 2, d / 2]) out.push([x, y, z], [x, y, z], [x, y, z]);
  return out;
};

describe("⭐⭐ `D196` — the top face's contour", () => {
  it("⭐ a box: its four TOP corners, one each, in order round the face, closed", () => {
    const ring = topFaceOutline(boxPoints(2, 0.05, 1), { position: [0, -0.025, 0], orientation: IDENTITY })!;
    expect(ring).toHaveLength(5); // 4 corners + the first again
    expect(ring[0]).toEqual(ring[4]);
    for (const p of ring) expect(p[1]).toBeCloseTo(0, 12); // the TOP face, not the bottom
    // in order round the face: the loop's length is the perimeter, never a diagonal
    let len = 0;
    for (let i = 0; i < 4; i++) len += Math.hypot(ring[i + 1]![0] - ring[i]![0], ring[i + 1]![2] - ring[i]![2]);
    expect(len).toBeCloseTo(2 * (2 + 1), 9);
  });

  it("⭐ turned about the vertical, it follows the body", () => {
    const ring = topFaceOutline(boxPoints(2, 0.05, 1), { position: [0, 0, 0], orientation: qFromAxisAngle([0, 1, 0], Math.PI / 6) })!;
    expect(ring).toHaveLength(5);
    const xs = ring.map((p) => p[0]);
    expect(Math.max(...xs)).toBeGreaterThan(1); // the corners have swung off the axes
  });

  it("⛔ a body resting on an EDGE has no top face — no contour", () => {
    expect(topFaceOutline(boxPoints(1, 1, 1), { position: [0, 0, 0], orientation: qFromAxisAngle([0, 0, 1], Math.PI / 4) })).toBeNull();
    expect(topFaceOutline([], { position: [0, 0, 0], orientation: IDENTITY })).toBeNull();
  });

  it("⭐ Scene_1's floor: its top at the origin's height, ±1 m, and it is sand yellow", () => {
    const floor = SCENE_1.bodies.find((b) => b.id === "Floor")!;
    expect(floor.frozen).toBe(true);
    expect(floor.colour).toEqual(SCENE_1_PALETTE.MAT_F); // sand yellow
    const u = SCENE_1.unitM!;
    const [w, h, d] = [floor.dims[0] * u, floor.dims[1] * u, floor.dims[2] * u];
    const p = floor.position as Vec3;
    const ring = topFaceOutline(boxPoints(w, h, d), { position: [p[0] * u, p[1] * u, p[2] * u], orientation: IDENTITY })!;
    for (const q of ring) {
      expect(q[1]).toBeCloseTo(0, 9);
      expect(Math.abs(q[0])).toBeCloseTo(1, 9);
      expect(Math.abs(q[2])).toBeCloseTo(1, 9);
    }
  });

  it("⭐ wired: shown exactly when the body is hidden from below, in its own colour, and it can touch nothing", () => {
    const loop = code("render/render_loop.ts");
    expect(loop).toMatch(/const outline = topOutlineFor\(st, fid, mesh\);/);
    expect(loop).toMatch(/if \(outline !== null && outline\.isVisible === want\) outline\.isVisible = !want;/);
    expect(loop).toMatch(/lines\.isPickable = false;/);
    expect(loop).toMatch(/lines\.metadata = \{ orbitCandidate: false \};/);
    expect(loop).toMatch(/st\.sceneSpec\.bodies\.find\(\(b\) => b\.id === id\)\?\.colour/);
  });
});
