// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §7) A VOID'S RIM STAYS WHERE ITS FACE ENDS, AND AN OPEN VOID THE HELD PIECE CANNOT ENTER IS SURFACE.
// RED against `7cbc8b4`: (1) the faces' rectangles, grown 1.6 mm to close the 3 mm joints, moved every rim 1.6 mm into its void — on that strip the map read a
// face and the wiring cast the void's floor (the gizmo dived 10 – 60 mm at both rims of every void with a floor: the cube's bottom groove at x 104 and 117);
// (2) an open notch or rebate kept its real depth whatever the piece — along a 13 mm rebate the piece, centred on the gizmo, was blocked at every step.
// The geometry: a 400 × 400 × 120 mm plate of box parts, its voids cut into the top face (`scripts/probes/void_sim.ts`, the study's 9 families).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, pieceEnters, stackDepthAt, voidOpening, type MapFace } from "../src/input/face_map";

type V3 = [number, number, number];
type Box = { lo: V3; hi: V3 };
const M = 0.001;
const PLATE: Box = { lo: [0, 0, 0], hi: [400, 120, 400] };
const voidBox = (x0: number, x1: number, z0: number, z1: number, depth: number): Box => ({ lo: [x0, 120 - depth, z0], hi: [x1, 120, z1] });

/** the plate less the voids, cut on every void bound: each solid cell a part; its faces in metres */
function topFacet(voids: Box[]) {
  const cuts = (k: 0 | 1 | 2) => [...new Set([PLATE.lo[k], PLATE.hi[k], ...voids.flatMap((v) => [v.lo[k], v.hi[k]])])].sort((a, b) => a - b);
  const [cx, cy, cz] = [cuts(0), cuts(1), cuts(2)];
  const parts: Box[] = [];
  for (let i = 0; i < cx.length - 1; i++)
    for (let j = 0; j < cy.length - 1; j++)
      for (let k = 0; k < cz.length - 1; k++) {
        const c: V3 = [(cx[i]! + cx[i + 1]!) / 2, (cy[j]! + cy[j + 1]!) / 2, (cz[k]! + cz[k + 1]!) / 2];
        if (voids.some((v) => c.every((x, a) => x > v.lo[a]! && x < v.hi[a]!))) continue;
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
        const c = [0, 1, 2].map((k) => (q[0]![k]! + q[2]![k]!) / 2) as V3;
        faces.push({ normal: n, centre: c, tris: [[q[0]!, q[1]!, q[2]!], [q[0]!, q[2]!, q[3]!]], part: `p${pi}` });
      }
  });
  const map = buildFaceMap(faces, { lo: [0, 0, 0], hi: [0.4, 0.12, 0.4] });
  const f = map.facets.find((q) => q.n[1] > 0.99)!;
  const at = (x: number, z: number, foot?: readonly [number, number]) => stackDepthAt(f, (x * f.t[0] + z * f.t[2]) * M, (x * f.b[0] + z * f.b[2]) * M, foot);
  return { f, at };
}

describe("⭐⭐⭐ (2026-11-09, §7) a void's rim stays where its face ends", () => {
  it("⭐⭐⭐ a 13 mm groove 60 deep: 1.5 mm out the face, 0.5 mm in the void — its floor with no piece held (2026-11-09: a closed void with a floor keeps its depth), the plane for a 30 mm piece (it cannot enter)", () => {
    const { f, at } = topFacet([voidBox(193.5, 206.5, 0, 400, 60)]);
    for (const x of [194, 206]) {
      const a = at(x, 200)!;
      expect(a.bridged).toBeUndefined();
      expect(a.inside).toBe(true); // in the faces' 1.6 mm grown strip: the plane's region, and the wiring's cast lands on the floor (never bridged)
      expect(at(200, 200)!.depth).toBeCloseTo(f.e - 0.06, 9); // its middle: the floor's own group
      const p = at(x, 200, [0.03, 0.03])!;
      expect(p.bridged).toBe(true);
      expect(p.depth).toBeCloseTo(f.e, 9);
    }
    expect(at(192, 200)!.inside).toBe(true); // 1.5 mm out on the face: the face
    expect(at(192, 200)!.depth).toBeCloseTo(f.e, 9);
  });

  it("⭐⭐ a blind recess 40 × 40 and an L-shaped one: their rims at the true faces — the floor inside for a piece that fits, the plane for one that does not", () => {
    const r = topFacet([voidBox(180, 220, 180, 220, 60)]);
    expect(r.at(180.5, 200, [0.03, 0.03])!.bridged).toBeUndefined();
    expect(r.at(180.5, 200, [0.045, 0.045])!.bridged).toBe(true);
    const l = topFacet([voidBox(150, 250, 150, 190, 40), voidBox(150, 190, 190, 250, 40)]);
    expect(l.at(230, 170, [0.045, 0.045])!.bridged).toBe(true); // the arm 40 mm wide
    expect(l.at(170, 170, [0.045, 0.045])!.bridged).toBeUndefined(); // the L's corner: 100 × 100 open — the piece fits
    expect(l.at(189.5, 230, [0.045, 0.045])!.bridged).toBe(true);
    expect(l.at(189.5, 230)!.bridged).toBeUndefined();
  });
});

describe("⭐⭐⭐ (2026-11-09, §7) an open void the held piece cannot enter is surface", () => {
  it("⭐⭐⭐ a rebate 13 mm wide along a whole edge, a 30 mm piece: the plane (RED: the rebate's floor, 60 mm down)", () => {
    const { f, at } = topFacet([voidBox(0, 400, 0, 13, 60)]);
    const a = at(200, 6.5, [0.03, 0.03])!;
    expect(a.bridged).toBe(true);
    expect(a.depth).toBeCloseTo(f.e, 9);
  });

  it("⭐⭐ a rebate 50 mm wide: a 30 mm piece (and the cube's held pieces, 41 × 45, 45 × 52) still reads its floor; an 80 mm piece the plane", () => {
    const { f, at } = topFacet([voidBox(0, 400, 0, 50, 60)]);
    for (const foot of [[0.03, 0.03], [0.0413, 0.045], [0.0448, 0.0518]] as [number, number][]) {
      const a = at(200, 25, foot)!;
      expect(a.bridged).toBeUndefined();
      expect(a.depth).toBeCloseTo(f.e - 0.06, 9);
    }
    expect(at(200, 25, [0.08, 0.08])!.bridged).toBe(true);
  });

  it("⭐⭐ a corner notch 13 × 13: surface for a 20 mm bar; without a footprint (no piece held) the floor as before", () => {
    const { f, at } = topFacet([voidBox(0, 13, 0, 13, 60)]);
    expect(at(6.5, 6.5, [0.02, 0.02])!.bridged).toBe(true);
    expect(at(6.5, 6.5)!.depth).toBeCloseTo(f.e - 0.06, 9);
  });

  it("⭐ the opening: a rebate's width and the facet's length; a piece enters either way round, within 0.5 mm", () => {
    const { f } = topFacet([voidBox(0, 400, 0, 13, 60)]);
    const g = f.groups.filter((q) => Math.abs(q.depth - f.e) < 5e-4).map((q) => q.region);
    const o = voidOpening(f, g, 0.2 * f.t[0] + 0.0065 * f.t[2], 0.2 * f.b[0] + 0.0065 * f.b[2]);
    const [lo, hi] = [Math.min(...o), Math.max(...o)];
    expect(lo).toBeCloseTo(0.013, 6);
    expect(hi).toBeGreaterThan(0.39);
    expect(pieceEnters([0.0135, 0.2], [0.4, 0.013])).toBe(true);
    expect(pieceEnters([0.014, 0.2], [0.4, 0.013])).toBe(false);
  });

  it("⭐⭐⭐ (2026-11-09, the owner) a CLOSED void with a floor: its floor where the piece fits (a 40 mm groove, a 30 mm piece), the plane where it does not (a 45 mm piece) — ⛔ bridged whatever the piece (2026-11-05)", () => {
    const { f, at } = topFacet([voidBox(180, 220, 0, 400, 60)]);
    const a = at(200, 200, [0.03, 0.03])!;
    expect(a.bridged).toBeUndefined();
    expect(a.depth).toBeCloseTo(f.e - 0.06, 9);
    const b = at(200, 200, [0.045, 0.045])!;
    expect(b.bridged).toBe(true);
    expect(b.depth).toBeCloseTo(f.e, 9);
  });

  it("⭐⭐⭐ (2026-11-09, the owner: *\"… and has no bottom … is bridged\"*) a closed void with NO floor (a slot through the plate): bridged whatever the piece", () => {
    const { f, at } = topFacet([voidBox(180, 220, 180, 220, 120)]);
    for (const foot of [undefined, [0.03, 0.03] as [number, number]]) {
      const a = at(200, 200, foot)!;
      expect(a.bridged).toBe(true);
      expect(a.depth).toBeCloseTo(f.e, 9);
    }
  });

  it("⭐ WIRED: the gizmo reads the HELD piece's footprint", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("sf[0] * f.b[0] + sf[1] * f.b[1] + sf[2] * f.b[2], heldFoot(st));");
    expect(a).toContain("const m = st.greenBox;");
  });
});
