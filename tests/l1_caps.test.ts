/**
 * GOLDEN VECTORS — **L1's CAPS BETWEEN PLACED PARTS, package S11** (2026-11-24, `Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_L1.md` §10.4):
 * `src/input/l1_caps.ts` (the fillers' faces, the acceptance), `src/content/scene_1_caps.json` (written by `scripts/surface/l1_caps.ts`), read through
 * the REAL face map (`buildFaceMap`, the game's options: `DEFAULT_CONFIG`'s merge and share, `CHART_MAP_OPTS`) on `Scene_1`'s placed faces as the page
 * fed them (`tests/fixtures/scene_1_cube_faces.json` — the START set, the model pose, metres) — the game's `placedFaces` at `surfaceL1` 0, and with the
 * filler at 1.
 * * the filler's box READ FROM THE SCENE (its walls' contour faces), its walls, its goal, its anchor;
 * * its faces in the world (the anchor's placement × `unitM`) ON the walls' faces as the page drew them; carried rigidly by its anchor;
 * * the tunnel's inner walls: exposed at 0, no exposed area left at 1; the underside and the back ONE facet group across the slit at 1;
 * * the acceptance: the filler accepted at FINISHED (every face glued or flush) and at START (its front on Piece41's goal volume); mutants refused — a
 *   side snapped to the floor's plane, a filler reaching into a goal volume or a wall, a face neither glued nor flush;
 * * the switch: default 0 (LIVE), 0 / 1 valid; the caps file checked at read; the module imports no engine (`boundary.test.ts`).
 * ⛔ Rule 2: each shown RED before trusted — how, in `ORBIT_SURFACE_BUILD.md` §10's S11 row.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_CAPS } from "../src/content/scene_caps";
import { boxFaces, fillerFaces, fillerVerdict, parseSceneCaps, type CapFiller } from "../src/input/l1_caps";
import { buildFaceMap, CHART_MAP_OPTS, regionReal, type FaceMap, type FilledRegion, type MapFace } from "../src/input/face_map";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { ShellBox } from "../src/input/orbit_shell";
import { qFromAxisAngle, qRotate, type Vec3 } from "../src/core/vec";

const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };
const U = SCENE_1.unitM!;
const caps = SCENE_CAPS.get("Scene_1")!;
const filler = caps.fillers[0]!;
const OPTS = { mergeDeg: DEFAULT_CONFIG.facetMergeDeg, minShare: DEFAULT_CONFIG.facetMinShare, ...CHART_MAP_OPTS };

/** a body's CONTOUR box at its goal (authored units): the goal's position ± (dims / 2 + margin) — every box of the cube stands square */
function goalBox(id: string): { lo: Vec3; hi: Vec3 } {
  const b = SCENE_1.bodies.find((x) => x.id === id)!;
  const g = SCENE_1.final!.bodies.find((x) => x.id === id)!;
  expect(g.orientation).toBe("identity");
  const h = b.dims.map((d) => d / 2 + (b.margin ?? 0));
  return { lo: [g.position[0] - h[0]!, g.position[1] - h[1]!, g.position[2] - h[2]!], hi: [g.position[0] + h[0]!, g.position[1] + h[1]!, g.position[2] + h[2]!] };
}
const metres = (v: Vec3): Vec3 => [v[0] * U, v[1] * U, v[2] * U];
/** the loose pieces (spawn ≠ goal) AT their goals, as faces (metres): Piece41's is the tunnel's front */
const LOOSE = ["Piece1", "Piece2", "Piece17", "Piece23", "Piece41"];
const looseAtGoal: MapFace[] = LOOSE.flatMap((id) => {
  const g = goalBox(id);
  return boxFaces(metres(g.lo), metres(g.hi), id);
});
/** Piece19 where the boot puts it (`render/scene.ts`: position × unitM, identity) — its goal: placed from the start */
const piece19 = SCENE_1.bodies.find((b) => b.id === "Piece19")!;
const anchorAtBoot = { position: metres(piece19.position), orientation: [1, 0, 0, 0] as const };
const fillerWorld = fillerFaces(filler, U, anchorAtBoot);
const boxM = { lo: metres(filler.lo), hi: metres(filler.hi) };

const map0 = buildFaceMap(cube.faces, cube.box, OPTS);
const map1 = buildFaceMap([...cube.faces, ...fillerWorld], cube.box, OPTS);

const facetOf = (m: FaceMap, n: Vec3) => m.facets.find((f) => f.n[0] * n[0] + f.n[1] * n[1] + f.n[2] * n[2] > 0.9999)!;
/** the real (face) area of a region inside the rectangle [x0, x1] × [y0, y1] (m²) */
function realAreaIn(r: FilledRegion, x0: number, x1: number, y0: number, y1: number): number {
  const ny = r.ys.length - 1;
  let a = 0;
  for (let i = 0; i < r.xs.length - 1; i++)
    for (let j = 0; j < ny; j++) {
      if (r.real[i * ny + j] !== 1) continue;
      const w = Math.min(r.xs[i + 1]!, x1) - Math.max(r.xs[i]!, x0);
      const h = Math.min(r.ys[j + 1]!, y1) - Math.max(r.ys[j]!, y0);
      if (w > 0 && h > 0) a += w * h;
    }
  return a;
}
/** the exposed area left on one inner wall of the tunnel (normal `n`, its plane through `p`), over the tunnel's span along it (two 3D corners) */
function wallExposed(m: FaceMap, n: Vec3, p: Vec3, c0: Vec3, c1: Vec3): number {
  const f = facetOf(m, n);
  const depth = p[0] * n[0] + p[1] * n[1] + p[2] * n[2];
  const tb = (v: Vec3) => [v[0] * f.t[0] + v[1] * f.t[1] + v[2] * f.t[2], v[0] * f.b[0] + v[1] * f.b[1] + v[2] * f.b[2]] as const;
  const [a0, b0] = tb(c0), [a1, b1] = tb(c1);
  return f.groups.filter((g) => Math.abs(g.depth - depth) < 1e-6).reduce((s, g) => s + realAreaIn(g.region, Math.min(a0, a1), Math.max(a0, a1), Math.min(b0, b1), Math.max(b0, b1)), 0);
}
/** the groups at the plane of `n` through `p` holding each point (as a face — `regionReal`), by index (−1: none) */
function groupsHolding(m: FaceMap, n: Vec3, p: Vec3, pts: readonly Vec3[]): number[] {
  const f = facetOf(m, n);
  const depth = p[0] * n[0] + p[1] * n[1] + p[2] * n[2];
  const gs = f.groups.map((g, i) => ({ g, i })).filter(({ g }) => Math.abs(g.depth - depth) < 1e-6);
  return pts.map((q) => gs.find(({ g }) => regionReal(g.region, q[0] * f.t[0] + q[1] * f.t[1] + q[2] * f.t[2], q[0] * f.b[0] + q[1] * f.b[1] + q[2] * f.b[2]))?.i ?? -1);
}

describe("S11 — Scene_1's filler, read from the scene", () => {
  it("its box: Piece19's +x and Piece20's −x contour faces, the cube's underside, Piece39's underside, Piece41's goal back, the cube's back", () => {
    const p19 = goalBox("Piece19"), p20 = goalBox("Piece20"), p39 = goalBox("Piece39"), p41 = goalBox("Piece41");
    const want = { lo: [p19.hi[0], p19.lo[1], p41.hi[2]], hi: [p20.lo[0], p39.lo[1], p19.hi[2]] };
    for (let k = 0; k < 3; k++) {
      expect(filler.lo[k]).toBeCloseTo(want.lo[k]!, 9);
      expect(filler.hi[k]).toBeCloseTo(want.hi[k]!, 9);
    }
    // in millimetres (unitM 0.1 m): 13 wide, 58 high, 450 long — behind Piece41's goal (z −50.5 … −17.5)
    const mm = (v: Vec3) => v.map((x) => Math.round(x * U * 1e4) / 10);
    expect(mm(filler.lo)).toEqual([103.5, 15.5, -17.5]);
    expect(mm(filler.hi)).toEqual([116.5, 73.5, 432.5]);
    expect(mm(p41.lo)[2]).toBe(-50.5);
  });
  it("its walls Piece19, Piece20, Piece39 (placed from the start); Piece41 a goal, never a wall; anchored on Piece19's goal pose; one filler, Scene_1 only", () => {
    expect(filler.walls).toEqual(["Piece19", "Piece20", "Piece39"]);
    expect(filler.goals).toEqual(["Piece41"]);
    for (const id of filler.walls) {
      const b = SCENE_1.bodies.find((x) => x.id === id)!;
      expect(b.position).toEqual(SCENE_1.final!.bodies.find((x) => x.id === id)!.position);
    }
    expect(SCENE_1.bodies.find((x) => x.id === "Piece41")!.position).not.toEqual(SCENE_1.final!.bodies.find((x) => x.id === "Piece41")!.position);
    expect(filler.anchor.id).toBe("Piece19");
    expect(filler.anchor.position).toEqual(SCENE_1.final!.bodies.find((x) => x.id === "Piece19")!.position);
    expect(filler.anchor.quat).toEqual([1, 0, 0, 0]);
    expect(caps.fillers.length).toBe(1);
    expect([...SCENE_CAPS.keys()]).toEqual(["Scene_1"]);
  });
});

describe("S11 — its faces in the world, on the walls' faces as the page drew them", () => {
  const wall = (part: string, n: Vec3) => cube.faces.find((f) => f.part === part && f.normal[0] * n[0] + f.normal[1] * n[1] + f.normal[2] * n[2] > 0.9999)!;
  const side = (n: Vec3) => fillerWorld.find((f) => f.normal[0] * n[0] + f.normal[1] * n[1] + f.normal[2] * n[2] > 0.9999)!;
  const ext = (f: MapFace, k: 0 | 1 | 2) => [Math.min(...f.tris.flatMap((t) => t.map((v) => v[k]))), Math.max(...f.tris.flatMap((t) => t.map((v) => v[k])))];
  it.each([
    ["−x on Piece19's +x", [-1, 0, 0], "Piece19", [1, 0, 0], 0],
    ["+x on Piece20's −x", [1, 0, 0], "Piece20", [-1, 0, 0], 0],
    ["+y on Piece39's −y", [0, 1, 0], "Piece39", [0, -1, 0], 1],
  ] as const)("%s: the same plane (1e-6 m), opposite normals, within the wall's face", (_l, n, part, wn, k) => {
    const f = side(n), w = wall(part, wn);
    expect(f.part).toBe(filler.id);
    expect(Math.abs(f.centre[k] - w.centre[k])).toBeLessThan(1e-6);
    for (const d of ([0, 1, 2] as const).filter((d) => d !== k)) {
      expect(ext(f, d)[0]!).toBeGreaterThanOrEqual(ext(w, d)[0]! - 1e-6);
      expect(ext(f, d)[1]!).toBeLessThanOrEqual(ext(w, d)[1]! + 1e-6);
    }
  });
  it("−y and +z: on the cube's underside and back (Piece19's −y, +z planes, the same way out)", () => {
    expect(Math.abs(side([0, -1, 0]).centre[1] - wall("Piece19", [0, -1, 0]).centre[1])).toBeLessThan(1e-6);
    expect(Math.abs(side([0, 0, 1]).centre[2] - wall("Piece19", [0, 0, 1]).centre[2])).toBeLessThan(1e-6);
  });
  it("carried rigidly by its anchor: moved 10 mm along x, turned 90° about y — every corner keeps its place against Piece19", () => {
    const q = qFromAxisAngle([0, 1, 0], Math.PI / 2);
    const moved = fillerFaces(filler, U, { position: [anchorAtBoot.position[0] + 0.01, anchorAtBoot.position[1], anchorAtBoot.position[2]], orientation: q });
    moved.forEach((f, i) =>
      f.tris.forEach((t, j) =>
        t.forEach((v, c) => {
          const r = qRotate(q, [fillerWorld[i]!.tris[j]![c]![0] - anchorAtBoot.position[0], fillerWorld[i]!.tris[j]![c]![1] - anchorAtBoot.position[1], fillerWorld[i]!.tris[j]![c]![2] - anchorAtBoot.position[2]]);
          for (let d = 0; d < 3; d++) expect(v[d]).toBeCloseTo(anchorAtBoot.position[d]! + (d === 0 ? 0.01 : 0) + r[d]!, 12);
        }),
      ),
    );
  });
});

describe("S11 — the face map at 0 and at 1 (Scene_1's placed faces, the game's options)", () => {
  // the tunnel's span: x 103.5 … 116.5, y 15.5 … 73.5, z −17.5 … 432.5 mm
  const [x0, y0, z0] = boxM.lo, [x1, y1, z1] = boxM.hi;
  const walls = [
    ["Piece19's +x (its left wall)", [1, 0, 0], [x0, y0, z0], [x0, y1, z1], 0.058 * 0.45],
    ["Piece20's −x (its right wall)", [-1, 0, 0], [x1, y0, z0], [x1, y1, z1], 0.058 * 0.45],
    ["Piece39's −y (its ceiling)", [0, -1, 0], [x0, y1, z0], [x1, y1, z1], 0.013 * 0.45],
  ] as const;
  it.each(walls)("%s: exposed at 0 (the whole wall), NO exposed area left at 1", (_l, n, c0, c1, whole) => {
    expect(wallExposed(map0, n, c0, c0, c1) * 1e6).toBeCloseTo(whole * 1e6, 2); // mm² (the page's float32: 1e-3 mm²)
    expect(wallExposed(map1, n, c0, c0, c1)).toBe(0);
  });
  it("the underside: at 0 the slit is no face and its two sides two groups; at 1 ONE group holds both sides and the slit (z 0, 100, 300, 420 mm)", () => {
    for (const z of [0, 0.1, 0.3, 0.42]) {
      const pts: Vec3[] = [[0.095, y0, z], [0.11, y0, z], [0.125, y0, z]];
      const g0 = groupsHolding(map0, [0, -1, 0], pts[0]!, pts);
      const g1 = groupsHolding(map1, [0, -1, 0], pts[0]!, pts);
      expect(g0[1]).toBe(-1);
      expect(g0[0]).not.toBe(g0[2]);
      expect(g1[1]).toBeGreaterThanOrEqual(0);
      expect(new Set(g1).size).toBe(1);
    }
    // the face it gains: the slit 13 × 450 mm less Piece43's top under it (x 103.5 … 107.25, z 168.5 … 213.5 — glued both ways)
    const at = (m: FaceMap) => facetOf(m, [0, -1, 0]).groups.filter((g) => Math.abs(g.depth + y0) < 1e-6).reduce((s, g) => s + realAreaIn(g.region, -1, 1, -1, 1), 0);
    expect((at(map1) - at(map0)) * 1e6).toBeCloseTo(13 * 450 - 3.75 * 45, 1);
  });
  it("the back: at 0 the tunnel's end is no face; at 1 one group holds both sides and the end (y 20, 45, 70 mm)", () => {
    for (const y of [0.02, 0.045, 0.07]) {
      const pts: Vec3[] = [[0.095, y, z1], [0.11, y, z1], [0.125, y, z1]];
      expect(groupsHolding(map0, [0, 0, 1], pts[0]!, pts)[1]).toBe(-1);
      const g1 = groupsHolding(map1, [0, 0, 1], pts[0]!, pts);
      expect(g1[1]).toBeGreaterThanOrEqual(0);
      expect(new Set(g1).size).toBe(1);
    }
  });
  it("the contour stays: the six facets' planes and polygons, the columns, the levels — the stacks change, the bottom's share now the whole underside", () => {
    expect(map1.facets.length).toBe(map0.facets.length);
    map0.facets.forEach((a, i) => {
      const b = map1.facets[i]!;
      expect([b.kind, b.n, b.e, b.poly]).toEqual([a.kind, a.n, a.e, a.poly]);
    });
    expect([map1.columns, map1.levels, map1.core]).toEqual([map0.columns, map0.levels, map0.core]);
    // ⭐ the main group under the cube: one half of it at 0 (the slit cut it in two), the whole underside at 1; the back's share a little up
    const share = (m: FaceMap, n: Vec3) => facetOf(m, n).share;
    expect([share(map0, [0, -1, 0]), share(map1, [0, -1, 0])].map((x) => x.toFixed(4))).toEqual(["0.5046", "0.8167"]);
    expect([share(map0, [0, 0, 1]), share(map1, [0, 0, 1])].map((x) => x.toFixed(4))).toEqual(["0.9525", "0.9550"]);
  });
});

describe("S11 — the acceptance (`fillerVerdict`): every face glued or flush, nothing inside", () => {
  const FINISHED = [...cube.faces, ...looseAtGoal];
  const goalsAtStart = looseAtGoal;
  const verdictOf = (v: ReturnType<typeof fillerVerdict>) => Object.fromEntries(v.faces.map((f) => [f.side, `${f.verdict} ${f.by.join("+")}`]));
  const at = (lo: Vec3, hi: Vec3, set: readonly MapFace[] = FINISHED, goals: readonly MapFace[] = []) => fillerVerdict(lo, hi, set, goals);
  const withLo = (k: number, v: number): Vec3 => boxM.lo.map((x, i) => (i === k ? v : x)) as unknown as Vec3;
  const withHi = (k: number, v: number): Vec3 => boxM.hi.map((x, i) => (i === k ? v : x)) as unknown as Vec3;
  it("FINISHED (every body at its goal): accepted — the sides and the top GLUED, the front glued to Piece41, the underside and the back FLUSH", () => {
    const v = at(boxM.lo, boxM.hi);
    expect(v.ok).toBe(true);
    expect(v.inside).toEqual([]);
    expect(verdictOf(v)).toEqual({ "-x": "GLUED Piece19", "+x": "GLUED Piece20", "-y": "FLUSH Piece19+Piece20+Piece41", "+y": "GLUED Piece39", "-z": "GLUED Piece41", "+z": "FLUSH Piece19+Piece20+Piece39" });
  });
  it("START (Piece41 loose, its goal volume beside): accepted — the front on Piece41's GOAL volume (the ghost bridges the slot)", () => {
    const v = at(boxM.lo, boxM.hi, cube.faces, goalsAtStart);
    expect(v.ok).toBe(true);
    expect(verdictOf(v)["-z"]).toBe("GOAL Piece41");
    expect(verdictOf(v)["-y"]).toBe("FLUSH Piece19+Piece20");
  });
  it("⛔ a side snapped to the FLOOR's plane (y 0 — the floor is not a part): refused, the underside and the sides below the cube open", () => {
    const v = at(withLo(1, 0), boxM.hi);
    expect(v.ok).toBe(false);
    expect(verdictOf(v)["-y"]).toBe("NONE ");
    expect(verdictOf(v)["-x"]).toBe("NONE ");
    expect(verdictOf(v)["+x"]).toBe("NONE ");
  });
  it("⛔ reaching into a GOAL volume (through Piece41's goal to the cube's front, z −50.5 mm): refused at FINISHED and at START", () => {
    const lo = withLo(2, -0.0505);
    expect(at(lo, boxM.hi).inside).toEqual(["Piece41"]);
    expect(at(lo, boxM.hi).ok).toBe(false);
    expect(at(lo, boxM.hi, cube.faces, goalsAtStart).inside).toEqual(["Piece41"]);
    expect(at(lo, boxM.hi, cube.faces, goalsAtStart).ok).toBe(false);
  });
  it("⛔ reaching into a WALL (x 100 mm, into Piece19): refused", () => {
    const v = at(withLo(0, 0.1), boxM.hi);
    expect(v.inside).toEqual(["Piece19"]);
    expect(v.ok).toBe(false);
  });
  it.each([
    ["the back short of the cube's back (z 420 mm)", 2, 0.42, "+z"],
    ["the top short of Piece39 (y 70 mm)", 1, 0.07, "+y"],
  ] as const)("⛔ a face neither glued nor flush — %s: refused", (_l, k, v, s) => {
    const r = at(boxM.lo, withHi(k, v));
    expect(r.ok).toBe(false);
    expect(verdictOf(r)[s]).toBe("NONE ");
  });
});

describe("S11 — the switch and the file", () => {
  it("`surfaceL1`: default 1 (the fillers — his look 2026-11-25, *do what's best for game playability*; 0 = none, before); 0, 1 valid, 2 refused", () => {
    expect(DEFAULT_CONFIG.surfaceL1).toBe(1);
    for (const v of [0, 1]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, surfaceL1: v })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, surfaceL1: 2 })).toThrow(/surfaceL1/);
  });
  it("a malformed caps file is refused at read: an anchor not a wall, lo not under hi, no wall", () => {
    const raw = JSON.parse(readFileSync(new URL("../src/content/scene_1_caps.json", import.meta.url), "utf8")) as { fillers: CapFiller[] };
    const f0 = raw.fillers[0]!;
    expect(() => parseSceneCaps(raw)).not.toThrow();
    expect(() => parseSceneCaps({ ...raw, fillers: [{ ...f0, anchor: { ...f0.anchor, id: "Piece41" } }] })).toThrow(/anchor/);
    expect(() => parseSceneCaps({ ...raw, fillers: [{ ...f0, hi: f0.lo }] })).toThrow(/lo < hi/);
    expect(() => parseSceneCaps({ ...raw, fillers: [{ ...f0, walls: [] }] })).toThrow(/walls/);
  });
});
