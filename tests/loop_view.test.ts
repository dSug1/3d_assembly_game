/**
 * ⭐⭐⭐ THE VIEW — WORLD YAW AND PITCH, NEVER ROLL (2026-11-06, the second rebuild — `TILTED_ORBIT_REBUILD_SCOPE.md` §26.2 – 26.3, `src/input/loop_view.ts`).
 * The owner: *"the lean can be in world pitch, yaw or roll … the purple camera can lean on world pitch (1) to anticipate the dy on bottom face … on world
 * yaw (2) to anticipate the dx on the vertical face to the left. The lean which is not permitted is the (3) which is on the world roll axis"* → *"(i) The
 * heading follows the wall's at the same left/right position"*. RED against `1.0.103-` (the module absent; there the view leaned sideways on a cap and its
 * up was carried inside a 20° cone — the bottom face's stuck gizmo).
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap, type MapFace } from "../src/input/face_map";
import { cameraView, calmProfile, capProfile, sameView, viewAt, viewDir, viewFacets, viewUp, type View, type ViewOpts } from "../src/input/loop_view";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const O: ViewOpts = { shareH: 0.25, shareV: 0.25, edgeRad: 0, edgeM: 0 };
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ang = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b))));

/** an axis-aligned box's six faces (outward normals) */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const q = (n: Vec3, pts: Vec3[]): MapFace => ({ normal: n, centre: [pts.reduce((s, p) => s + p[0], 0) / 4, pts.reduce((s, p) => s + p[1], 0) / 4, pts.reduce((s, p) => s + p[2], 0) / 4], tris: [[pts[0]!, pts[1]!, pts[2]!], [pts[0]!, pts[2]!, pts[3]!]] });
  const faces = [
    q([0, 0, -1], [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]),
    q([0, 0, 1], [[x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1]]),
    q([-1, 0, 0], [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]]),
    q([1, 0, 0], [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]),
    q([0, -1, 0], [[x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0]]),
    q([0, 1, 0], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]),
  ];
  return buildFaceMap(faces, { lo: [x0, y0, z0], hi: [x1, y1, z1] });
}
// `Scene_1`'s painting-like box: 50 × 48 cm, 3.3 cm deep
const MAP = box(-0.25, 0.25, 0, 0.48, -0.05, -0.017);
const VF = viewFacets(MAP.facets);
const idx = (n: Vec3) => VF.findIndex((f) => dot(f.n, n) > 0.999);
const FRONT = idx([0, 0, -1]);
const LEFT = idx([-1, 0, 0]);
const BOTTOM = idx([0, -1, 0]);
const TOP = idx([0, 1, 0]);
const BACK = idx([0, 0, 1]);
const front = (x: number, y: number): Vec3 => [x, y, -0.05];
const bottom = (x: number, z: number): Vec3 => [x, 0, z];
const wrapDeg = (a: number) => Math.atan2(Math.sin(a), Math.cos(a)) / D;

describe("⭐⭐⭐ the view — world yaw and pitch, never roll (§26.2)", () => {
  it("⭐⭐⭐ V1 – V2: at every yaw and pitch (straight above / below included) the up is square to the direction and the screen's RIGHT is level — no roll", () => {
    for (const h of [-3, -1.2, 0, 0.7, 2.9])
      for (const e of [-90, -89, -60, -20, 0, 35, 80, 90]) {
        const v: View = { h, e: e * D };
        const d = viewDir(v);
        const u = viewUp(v);
        expect(dot(d, u)).toBeCloseTo(0, 12);
        const right = cross([-d[0], -d[1], -d[2]], u);
        expect(right[1]).toBeCloseTo(0, 12); // level: no roll
        if (Math.abs(e) < 90) expect(u[1]).toBeGreaterThan(0); // upright
      }
  });
  it("⭐⭐⭐ V3 — a wall: square in its middle; a YAW lean to the bisector at a side edge, a PITCH lean at its top / bottom edge, both at a corner", () => {
    const at = (x: number, y: number) => viewAt(VF, FRONT, front(x, y), null, O);
    const mid = at(0, 0.24);
    expect(wrapDeg(mid.h)).toBeCloseTo(-90, 9);
    expect(mid.e).toBeCloseTo(0, 12);
    expect(Math.abs(wrapDeg(at(-0.25, 0.24).h - mid.h))).toBeCloseTo(45, 6); // the yaw lean toward the left wall
    expect(at(-0.25, 0.24).e).toBeCloseTo(0, 5); // no pitch from a side edge (the cut runs 1 mm inside: 1e-6 rad)
    expect(at(0, 0).e / D).toBeCloseTo(-45, 6); // the pitch lean toward the bottom
    expect(wrapDeg(at(0, 0).h - mid.h)).toBeCloseTo(0, 2); // no yaw from the bottom edge (the cut runs 1 mm inside: 0.005°)
    const corner = at(-0.25, 0);
    expect(Math.abs(wrapDeg(corner.h - mid.h))).toBeCloseTo(45, 6);
    expect(corner.e / D).toBeCloseTo(-45, 6);
    // the profile: odd, ±1 at the edges, its middle's share the slope there
    expect(calmProfile(1, 0.25)).toBe(1);
    expect(calmProfile(-0.5, 0.25)).toBeCloseTo(-calmProfile(0.5, 0.25), 12);
  });
  it("⭐⭐⭐ V4 — a bottom entered from the front: dx never changes the PITCH (no sideways lean — it would be a roll); the YAW is the front's at the same left / right position (the owner's (i)); straight below at the far edge", () => {
    const entry: Vec3 = [0, 0, -1];
    for (const z of [-0.048, -0.04, -0.03, -0.02]) {
      const es = [-0.24, -0.1, 0, 0.13, 0.24].map((x) => viewAt(VF, BOTTOM, bottom(x, z), entry, O).e);
      for (const e of es) expect(e).toBeCloseTo(es[0]!, 12);
    }
    for (const x of [-0.25, -0.12, 0, 0.2, 0.25]) {
      const wall = viewAt(VF, FRONT, front(x, 0), null, O);
      const cap = viewAt(VF, BOTTOM, bottom(x, -0.04), entry, O);
      expect(wrapDeg(cap.h - wall.h)).toBeCloseTo(0, 9);
    }
    expect(viewAt(VF, BOTTOM, bottom(0, -0.017), entry, O).e / D).toBeCloseTo(-90, 9);
    expect(capProfile(0, 0.25)).toBe(0);
    expect(capProfile(1, 0.25)).toBe(1);
  });
  it("⭐⭐⭐ T5's test — the views MEET at every wall–wall edge and along the whole entry edge of a cap (reachable); they DO NOT at a cap's far edge (the yaw turns over) nor along its side edges (a roll)", () => {
    const entry: Vec3 = [0, 0, -1];
    for (const y of [0.01, 0.1, 0.24, 0.4, 0.47]) expect(sameView(viewAt(VF, FRONT, front(-0.25, y), null, O), viewAt(VF, LEFT, front(-0.25, y), null, O))).toBe(true);
    // (off the exact three-face corners, where every cut through the place degenerates)
    for (const x of [-0.24, -0.2, 0, 0.11, 0.24]) {
      expect(sameView(viewAt(VF, FRONT, front(x, 0), null, O), viewAt(VF, BOTTOM, bottom(x, -0.05), entry, O))).toBe(true);
      expect(sameView(viewAt(VF, FRONT, front(x, 0.48), null, O), viewAt(VF, TOP, [x, 0.48, -0.05], entry, O))).toBe(true);
      // the far edge: the back wall's view is the front's turned over the zenith
      expect(sameView(viewAt(VF, BOTTOM, bottom(x, -0.017), entry, O), viewAt(VF, BACK, [x, 0, -0.017], null, O))).toBe(false);
    }
    for (const z of [-0.04, -0.03, -0.02]) expect(sameView(viewAt(VF, BOTTOM, bottom(-0.25, z), entry, O), viewAt(VF, LEFT, [-0.25, 0, z], null, O))).toBe(false);
  });
  it("⭐⭐ V5 — the camera: the owner's offsets the same angle off the view at every pitch, the pitch never past ±90° (never past the zenith), the right level", () => {
    const off = (e: number) => {
      const v: View = { h: 0.3, e: e * D };
      return ang(cameraView(v, 2.5 * D, 2 * D).dir, viewDir(v)) / D;
    };
    for (const e of [-60, -20, 0, 30, 70]) expect(off(e)).toBeCloseTo(off(0), 6);
    const c = cameraView({ h: 0.3, e: 89.5 * D }, 0, 2 * D);
    expect(c.dir[1]).toBeCloseTo(1, 9); // straight above, not beyond
    const f = cameraView({ h: 1.1, e: 40 * D }, 0, 2 * D);
    expect(cross([-f.dir[0], -f.dir[1], -f.dir[2]], f.up)[1]).toBeCloseTo(0, 12);
  });
});
