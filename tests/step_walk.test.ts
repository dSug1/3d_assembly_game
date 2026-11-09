// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — F8 → I10) THE GIZMO WALKS A STEP. RED against `f82bfbe`: `stepWalk` absent — the gizmo's depth cast along
// the facet's normal never landed on a face parallel to it, so it JUMPED across every step (the cube: Piece44's four sides 0 landings in a 1° × 0.5° sweep,
// the red up the −x side 52 – 97 mm jumps at both notches; the walks' map reversals 79 of 80 there — I14's jitter), and `closedAlong` read a void closed
// by the faces' 1.6 mm GROWTH (the strip along an open edge bridged: the walk found no step at its foot). The assemblies: box parts cut on every bound
// (`void_rims_fit.test.ts`'s), through the real face map; the depth the wiring's cast reads computed exactly from the parts.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, closedAlong, stepWalk, MAP_COPLANAR_M, type Facet, type MapFace } from "../src/input/face_map";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

type V3 = [number, number, number];
type Box = { lo: V3; hi: V3 };
const M = 0.001;
const dot = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

/** the solids less the voids, cut on every bound — each cell a part (mm); the face map of its faces (m) */
function assembly(solids: Box[], voids: Box[] = []) {
  const all = [...solids, ...voids];
  const cuts = (k: 0 | 1 | 2) => [...new Set(all.flatMap((v) => [v.lo[k], v.hi[k]]))].sort((a, b) => a - b);
  const [cx, cy, cz] = [cuts(0), cuts(1), cuts(2)];
  const parts: Box[] = [];
  for (let i = 0; i < cx.length - 1; i++)
    for (let j = 0; j < cy.length - 1; j++)
      for (let k = 0; k < cz.length - 1; k++) {
        const c: V3 = [(cx[i]! + cx[i + 1]!) / 2, (cy[j]! + cy[j + 1]!) / 2, (cz[k]! + cz[k + 1]!) / 2];
        const inside = (b: Box) => c.every((x, a) => x > b.lo[a]! && x < b.hi[a]!);
        if (!solids.some(inside) || voids.some(inside)) continue;
        parts.push({ lo: [cx[i]!, cy[j]!, cz[k]!], hi: [cx[i + 1]!, cy[j + 1]!, cz[k + 1]!] });
      }
  const faces: MapFace[] = [];
  parts.forEach((b, pi) => {
    for (let a = 0; a < 3; a++)
      for (const s of [-1, 1]) {
        const n: V3 = [0, 0, 0];
        n[a] = s;
        const u = (a + 1) % 3;
        const w = (a + 2) % 3;
        const lv = s > 0 ? b.hi[a]! : b.lo[a]!;
        const P = (pu: number, pw: number): V3 => {
          const p: V3 = [0, 0, 0];
          p[a] = lv * M;
          p[u] = pu * M;
          p[w] = pw * M;
          return p;
        };
        const q = [P(b.lo[u]!, b.lo[w]!), P(b.hi[u]!, b.lo[w]!), P(b.hi[u]!, b.hi[w]!), P(b.lo[u]!, b.hi[w]!)];
        faces.push({ normal: n, centre: [0, 1, 2].map((k) => (q[0]![k]! + q[2]![k]!) / 2) as V3, tris: [[q[0]!, q[1]!, q[2]!], [q[0]!, q[2]!, q[3]!]], part: `p${pi}` });
      }
  });
  const lo = [0, 1, 2].map((k) => Math.min(...parts.map((p) => p.lo[k]!)) * M) as V3;
  const hi = [0, 1, 2].map((k) => Math.max(...parts.map((p) => p.hi[k]!)) * M) as V3;
  const map = buildFaceMap(faces, { lo, hi });
  /** the depth along facet `f`'s normal at (`x`, `y`) on its frame: the frontmost part's face there (the wiring's cast), `null`: none */
  const depth = (f: Facet, x: number, y: number): number | null => {
    let best: number | null = null;
    for (const b of parts) {
      const cs = [0, 1].flatMap((i) => [0, 1].flatMap((j) => [0, 1].map((k) => [i ? b.hi[0] : b.lo[0], j ? b.hi[1] : b.lo[1], k ? b.hi[2] : b.lo[2]].map((v) => v * M))));
      const ts = cs.map((c) => dot(c, f.t));
      const bs = cs.map((c) => dot(c, f.b));
      if (!(x > Math.min(...ts) + 1e-9 && x < Math.max(...ts) - 1e-9 && y > Math.min(...bs) + 1e-9 && y < Math.max(...bs) - 1e-9)) continue;
      const lv = Math.max(...cs.map((c) => dot(c, f.n)));
      if (best === null || lv > best) best = lv;
    }
    return best;
  };
  /** the gizmo at (`x`, `y`) on facet `f` as the wiring builds it: the place's depth, walked (`share`); its 3D point (mm) and whether on a step's face */
  const gizmo = (f: Facet, x: number, y: number, share = 1): { p: V3; step: readonly [number, number] | null; turn: number } | null => {
    const d0 = depth(f, x, y);
    if (d0 === null) return null;
    const w = stepWalk(f, x, y, d0, (a, b) => depth(f, a, b), share);
    const X = w?.x ?? x;
    const Y = w?.y ?? y;
    const d = w === null ? d0 : w.depth ?? depth(f, X, Y);
    if (d === null) return null;
    return { p: [0, 1, 2].map((k) => (f.t[k]! * X + f.b[k]! * Y + f.n[k]! * d) / M) as V3, step: w?.step ?? null, turn: w?.turn ?? 0 };
  };
  const facet = (n: V3) => map.facets.find((f) => dot(f.n, n) > 0.999)!;
  return { map, facet, gizmo, depth };
}

/** a line of places on facet `f` from (x0, y0) to (x1, y1) (m), every `ds` (m): the gizmo's largest step (mm) and the samples */
function sweep(g: ReturnType<typeof assembly>, f: Facet, from: [number, number], to: [number, number], ds = 0.00025, share = 1) {
  const L = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const out: { s: number; p: V3; step: readonly [number, number] | null; turn: number }[] = [];
  let worst = 0;
  for (let s = 0; s <= L + 1e-12; s += ds) {
    const x = from[0] + ((to[0] - from[0]) * s) / L;
    const y = from[1] + ((to[1] - from[1]) * s) / L;
    const q = g.gizmo(f, x, y, share);
    if (q === null) continue;
    if (out.length > 0) worst = Math.max(worst, Math.hypot(...([0, 1, 2].map((k) => q.p[k]! - out[out.length - 1]!.p[k]!) as V3)));
    out.push({ s, ...q });
  }
  return { worst, out };
}

const PLATE: Box = { lo: [0, 0, 0], hi: [400, 120, 400] };

describe("⭐⭐⭐ (2026-11-09, §8) the gizmo walks a step — a face parallel to the cast is a place", () => {
  it("⭐⭐⭐ a block 40 mm proud on a face: across it the gizmo climbs its two sides, never jumps (RED: the walk off — a 40 mm jump at each side)", () => {
    const g = assembly([PLATE, { lo: [180, 120, 180], hi: [220, 160, 220] }]);
    const top = g.facet([0, 1, 0]);
    const line = (share: number) => sweep(g, top, [0.1, 0.2], [0.3, 0.2], 0.00025, share);
    const on = line(1);
    expect(on.worst).toBeLessThan(1.5); // 0.25 mm of place a sample, the window walked at most 2× faster
    expect(line(0).worst).toBeGreaterThan(39.9); // ⛔ as built before: the jump
    // both sides landed: on their faces (x 180 and 220), between the plate's level and the block's top, their normals the sides' own
    for (const [x, nx] of [[180, -1], [220, 1]] as const) {
      const hits = on.out.filter((q) => q.step !== null && Math.abs(q.p[0] - x) < 1 && q.p[1] > 121 && q.p[1] < 159);
      expect(hits.length).toBeGreaterThan(20);
      expect(hits.every((q) => Math.sign(q.step![0]) === nx)).toBe(true);
    }
  });

  it("⭐⭐ on a step's face the normal TURNS over its two edges: none of the face's own at its foot or its top, all of it midway (⛔ the face's own at its top edge: at the pole on Piece44's edge the gizmo faced sideways, the piece straight above — 37 frames behind it in the walks)", () => {
    const g = assembly([PLATE, { lo: [180, 120, 180], hi: [220, 160, 220] }]);
    const on = sweep(g, g.facet([0, 1, 0]), [0.1, 0.2], [0.19, 0.2]).out.filter((q) => q.step !== null);
    const at = (y: number) => on.reduce((b, q) => (Math.abs(q.p[1] - y) < Math.abs(b.p[1] - y) ? q : b)).turn;
    expect(at(120)).toBeLessThan(0.05);
    expect(at(140)).toBeGreaterThan(0.99);
    expect(at(160)).toBeLessThan(0.05);
  });

  it("⭐⭐⭐ a two-step stair: every tread landed on, every riser climbed, no jump", () => {
    const g = assembly([PLATE, { lo: [150, 120, 150], hi: [250, 150, 250] }, { lo: [180, 150, 180], hi: [220, 180, 220] }]);
    const top = g.facet([0, 1, 0]);
    const { worst, out } = sweep(g, top, [0.1, 0.2], [0.3, 0.2]);
    expect(worst).toBeLessThan(1.5);
    for (const [lv, lo, hi] of [[120, 100, 150], [150, 150, 180], [180, 180, 220], [150, 220, 250], [120, 250, 300]] as const)
      expect(out.some((q) => Math.abs(q.p[1] - lv) < 1e-6 && q.p[0] > lo && q.p[0] < hi)).toBe(true); // each tread
    for (const x of [150, 180, 220, 250]) expect(out.some((q) => q.step !== null && Math.abs(q.p[0] - x) < 1)).toBe(true); // each riser
  });

  it("⭐⭐⭐ AN EDGE NOTCH, walked from BOTH its facets, each face once, the two meeting at its inner corner (⛔ each facet walked both faces: the red up the side climbed the tread and the riser, the top took it back down and up again — a fold, probed on the cube)", () => {
    // a rebate 40 × 40 along the plate's top-left edge, its whole length
    const g = assembly([PLATE], [{ lo: [0, 80, 0], hi: [40, 120, 400] }]);
    const top = g.facet([0, 1, 0]);
    const side = g.facet([-1, 0, 0]);
    const z = 0.2;
    // the top, from its rim (x 0) inward: from the inner corner (40, 80) up the riser (x 40) onto the top
    const fromTop = sweep(g, top, [top.tLo, dot([0, 0, z], top.b)], [0.1, dot([0, 0, z], top.b)]);
    expect(fromTop.worst).toBeLessThan(1.5);
    const t0 = fromTop.out[0]!.p;
    expect(Math.abs(t0[0] - 40)).toBeLessThan(1);
    expect(Math.abs(t0[1] - 80)).toBeLessThan(1);
    expect(fromTop.out.filter((q) => q.step !== null).every((q) => Math.abs(q.p[0] - 40) < 1)).toBe(true); // only the riser (x 40) as a step's face
    expect(fromTop.out.some((q) => q.step !== null && q.p[1] > 100)).toBe(true);
    // the side, from its bottom up to its rim (y 120): up the face (x 0), along the tread (y 80) inward, to the inner corner at the rim
    const sideT = dot([0, 0, z], side.t);
    const fromSide = sweep(g, side, [sideT, 0.02], [sideT, side.bHi]);
    expect(fromSide.worst).toBeLessThan(3);
    const s1 = fromSide.out[fromSide.out.length - 1]!.p;
    expect(Math.abs(s1[0] - 40)).toBeLessThan(1);
    expect(Math.abs(s1[1] - 80)).toBeLessThan(1);
    expect(fromSide.out.filter((q) => q.step !== null).every((q) => Math.abs(q.p[1] - 80) < 1)).toBe(true); // only the tread (y 80) as a step's face
    // ⭐ the two facets' gizmos at their shared edge: the same point — the edge blend has nothing to bridge
    expect(Math.hypot(t0[0] - s1[0], t0[1] - s1[1], t0[2] - s1[2])).toBeLessThan(1.5);
  });

  it("⭐⭐ outside every window the place is untouched (`null`): far from a step, on the front surface, and with the share 0", () => {
    const g = assembly([PLATE, { lo: [180, 120, 180], hi: [220, 160, 220] }]);
    const top = g.facet([0, 1, 0]);
    const at = (x: number, z: number, share = 1) => stepWalk(top, x, z, g.depth(top, x, z)!, (a, b) => g.depth(top, a, b), share);
    expect(at(0.1, 0.2)).toBeNull(); // 80 mm from the block, its window 40
    expect(at(0.2, 0.2)).toBeNull(); // on the block
    expect(at(0.17, 0.2, 0)).toBeNull(); // the walk off
    expect(at(0.17, 0.2)).not.toBeNull(); // 10 mm from it: walked
  });

  it("⭐⭐⭐ a void is closed on a travel by REAL faces on both sides — ⛔ the 1.6 mm strip along an OPEN edge read closed by its own face's growth (bridged: the gizmo held on the plane there; RED)", () => {
    const g = assembly([PLATE], [{ lo: [0, 80, 0], hi: [40, 120, 400] }]);
    const top = g.facet([0, 1, 0]);
    const mine = top.groups.filter((q) => Math.abs(q.depth - top.e) <= MAP_COPLANAR_M).map((q) => q.region);
    const z = dot([0, 0, 0.2], top.b);
    expect(closedAlong(mine, 0.0395, z)).toEqual({ x: false, y: false }); // 0.5 mm off the real edge, in the grown strip
    // a groove closed across stays closed (a hole, a joint, a slot: real faces both sides)
    const h = assembly([PLATE], [{ lo: [193.5, 60, 0], hi: [206.5, 120, 400] }]);
    const ht = h.facet([0, 1, 0]);
    const hm = ht.groups.filter((q) => Math.abs(q.depth - ht.e) <= MAP_COPLANAR_M).map((q) => q.region);
    expect(closedAlong(hm, 0.194, dot([0, 0, 0.2], ht.b)).x).toBe(true);
  });

  it("⭐ WIRED: the gizmo walked in `rawGizmo` (the depth at the step's foot the wiring's own cast); its share a slider (0 – 4, default 1; 0 off)", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const w = stepWalk(f, x0, y0, level(here.point), (x, y) => level(core(at(x, y)).point), st.cfg.stepWalkShare);");
    expect(a).toContain("const optKey = `${o.edgeMm}|${o.edgeDeg}|${st.cfg.stepWalkShare}`;"); // the drawn lines follow the slider
    expect(readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8")).toContain('"stepWalkShare", 0, 4, 0.25)');
    expect(DEFAULT_CONFIG.stepWalkShare).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, stepWalkShare: 5 })).toThrow();
  });
});
