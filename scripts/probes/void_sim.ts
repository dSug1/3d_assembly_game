// ⭐⭐⭐ THE VOID STUDY (POLAR_ORBIT_CLEANUP.md §7, 2026-11-09) — synthetic singularities the cube does not have, through the REAL face map
// (`src/input/face_map.ts`): a 400 × 400 × 120 mm plate of box parts, voids cut into its top face (blind recesses, through holes, grooves, slots, a U-slot,
// corner notches, rebates, an L, an undercut), three pieces (30 mm, 80 mm, a 20 × 20 × 100 bar). Along each travel line (1 mm steps) the gizmo's depth per
// rule, and the piece CLOSE IN (its resting face 16 mm over the gizmo, centred on it): its largest depth step, the steps it overlaps a part (blocked), the
// steps an approach straight down to the gizmo clears (enterable). Rules: `built` (the code as it is: `stackDepthAt` with the footprint), and the study's
// references — P1 the rims fixed alone, P2 real depth wherever the piece fits (closed voids too), P3 open + fits (what was built).
// ⚠ Boxes only, the piece centred under the gizmo, a travel on one face (no edge band, no solver).
// Usage: npx vite-node scripts/probes/void_sim.ts   (ONLY=text — the cases whose name holds it)
import { buildFaceMap, closedAlong, stackDepthAt, type MapFace } from "../../src/input/face_map";

type V3 = [number, number, number];
type Box = { lo: V3; hi: V3 };
const M = 0.001;
const PLATE: Box = { lo: [0, 0, 0], hi: [400, 120, 400] }; // mm; the studied face: the TOP (y = 120), t ~ x, b ~ z

/** the plate less the voids, cut on every void bound: each solid cell a part */
function assemble(voids: Box[]): Box[] {
  const cuts = (k: 0 | 1 | 2) => [...new Set([PLATE.lo[k], PLATE.hi[k], ...voids.flatMap((v) => [v.lo[k], v.hi[k]])])].filter((c) => c >= PLATE.lo[k] && c <= PLATE.hi[k]).sort((a, b) => a - b);
  const [cx, cy, cz] = [cuts(0), cuts(1), cuts(2)];
  const out: Box[] = [];
  for (let i = 0; i < cx.length - 1; i++) for (let j = 0; j < cy.length - 1; j++) for (let k = 0; k < cz.length - 1; k++) {
    const c: V3 = [(cx[i]! + cx[i + 1]!) / 2, (cy[j]! + cy[j + 1]!) / 2, (cz[k]! + cz[k + 1]!) / 2];
    if (voids.some((v) => c.every((x, a) => x > v.lo[a]! && x < v.hi[a]!))) continue;
    out.push({ lo: [cx[i]!, cy[j]!, cz[k]!], hi: [cx[i + 1]!, cy[j + 1]!, cz[k + 1]!] });
  }
  return out;
}
function facesOf(parts: Box[]): MapFace[] {
  const fs: MapFace[] = [];
  parts.forEach((b, pi) => {
    for (let a = 0; a < 3; a++) for (const s of [-1, 1]) {
      const n: V3 = [0, 0, 0]; n[a] = s;
      const u = (a + 1) % 3, w = (a + 2) % 3;
      const lv = s > 0 ? b.hi[a]! : b.lo[a]!;
      const P = (pu: number, pw: number): V3 => { const p: V3 = [0, 0, 0]; p[a] = lv * M; p[u] = pu * M; p[w] = pw * M; return p; };
      const q = [P(b.lo[u]!, b.lo[w]!), P(b.hi[u]!, b.lo[w]!), P(b.hi[u]!, b.hi[w]!), P(b.lo[u]!, b.hi[w]!)] as V3[];
      const c: V3 = [0, 1, 2].map((k) => (q[0]![k]! + q[2]![k]!) / 2) as V3;
      fs.push({ normal: n, centre: c, tris: [[q[0]!, q[1]!, q[2]!], [q[0]!, q[2]!, q[3]!]], part: `p${pi}` });
    }
  });
  return fs;
}
/** the first hit straight down (−y) at (x, z) from above: the level (mm), or null */
function castDown(parts: Box[], x: number, z: number): number | null {
  let best: number | null = null;
  for (const b of parts) if (x > b.lo[0] && x < b.hi[0] && z > b.lo[2] && z < b.hi[2]) best = best === null ? b.hi[1] : Math.max(best, b.hi[1]);
  return best;
}
function overlaps(parts: Box[], p: Box, skin = 0.3): boolean {
  return parts.some((b) => [0, 1, 2].every((a) => Math.min(b.hi[a]!, p.hi[a]!) - Math.max(b.lo[a]!, p.lo[a]!) > skin));
}

type Policy = "built" | "P1 rims" | "P2 fit" | "P3 open+fit";
const POLICIES: Policy[] = ["built", "P1 rims", "P2 fit", "P3 open+fit"];
type Piece = { name: string; w: number; d: number; h: number }; // footprint w × d on the face, h along the normal

function study(name: string, voids: Box[], lines: { label: string; from: [number, number]; to: [number, number] }[], pieces: Piece[]) {
  const parts = assemble(voids);
  const map = buildFaceMap(facesOf(parts), { lo: PLATE.lo.map((v) => v * M) as V3, hi: PLATE.hi.map((v) => v * M) as V3 });
  const f = map.facets.find((q) => q.n[1] > 0.99)!;
  const tOf = (x: number, z: number) => (x * f.t[0] + z * f.t[2]) * M;
  const bOf = (x: number, z: number) => (x * f.b[0] + z * f.b[2]) * M;
  const E = f.e / M;
  const mine = f.groups.filter((g) => Math.abs(g.depth - f.e) <= 5e-4);
  const isVoid = (x: number, z: number) => { const h = castDown(parts, x, z); return h === null || h < E - 0.5; };
  /** the void's opening through (x, z): its run along x and along z at the face's level (to a face, or out past the plate: open) */
  const runs = (x: number, z: number): [number, number] => {
    const run = (dx: number, dz: number) => { let L = 0; for (let s = 1; s < 500; s++) { const X = x + dx * s, Z = z + dz * s; if (X < 0 || X > 400 || Z < 0 || Z > 400) break; if (!isVoid(X, Z)) break; L = s; } return L; };
    return [run(1, 0) + run(-1, 0) + 1, run(0, 1) + run(0, -1) + 1];
  };
  const gizmo = (pol: Policy, x: number, z: number, pc: Piece): number => {
    const h = castDown(parts, x, z);
    if (pol === "built") {
      const at = stackDepthAt(f, tOf(x, z), bOf(x, z), [Math.min(pc.w, pc.d) * M, Math.max(pc.w, pc.d) * M]);
      if (at === null) return E;
      const d = at.depth / M;
      if ((at.inside || at.bridged) && h !== null && (!at.bridged || h > d + 0.5)) return h;
      return d;
    }
    if (h !== null && h >= E - 0.5) return h; // a face (or a part proud of it) under the gizmo
    // a void at the face's level
    const c = closedAlong(mine.map((g) => g.region), tOf(x, z), bOf(x, z));
    const closed = c.x || c.y;
    const [rx, rz] = runs(x, z);
    const open = [Math.min(rx, rz), Math.max(rx, rz)];
    const foot = [Math.min(pc.w, pc.d), Math.max(pc.w, pc.d)];
    const fits = foot[0]! <= open[0]! + 0.5 && foot[1]! <= open[1]! + 0.5;
    const deep = h === null ? E : h; // no floor: the mouth
    if (pol === "P1 rims") return closed ? E : deep;
    if (pol === "P2 fit") return fits ? deep : E;
    return !closed && fits ? deep : E; // P3
  };
  console.log(`\n=== ${name}  (parts ${parts.length}, the face at y ${E.toFixed(1)})`);
  for (const L of lines) for (const pc of pieces) {
    const cells: string[] = [];
    for (const pol of POLICIES) {
      let maxStep = 0, blocked = 0, n = 0, deepN = 0, enter = 0, prev: number | null = null;
      const prof: string[] = [];
      const len = Math.hypot(L.to[0] - L.from[0], L.to[1] - L.from[1]);
      for (let s = 0; s <= len; s += 1) {
        const x = L.from[0] + ((L.to[0] - L.from[0]) * s) / len, z = L.from[1] + ((L.to[1] - L.from[1]) * s) / len;
        const g = gizmo(pol, x, z, pc);
        if (prev !== null) maxStep = Math.max(maxStep, Math.abs(g - prev));
        prev = g; n++;
        if (g < E - 0.5) deepN++;
        // close in: the piece's resting face 16 mm over the gizmo, centred on it
        const piece: Box = { lo: [x - pc.w / 2, g + 16, z - pc.d / 2], hi: [x + pc.w / 2, g + 16 + pc.h, z + pc.d / 2] };
        if (overlaps(parts, piece)) blocked++;
        // the approach in from there: down to the gizmo, clear all the way?
        if (g < E - 0.5) { let ok = true; for (let y = g + 16; y >= g; y -= 1) if (overlaps(parts, { lo: [x - pc.w / 2, y, z - pc.d / 2], hi: [x + pc.w / 2, y + pc.h, z + pc.d / 2] })) { ok = false; break; } if (ok) enter++; }
        if (s % Math.max(1, Math.round(len / 40)) === 0) prof.push((E - g) < 0.5 ? "_" : (E - g) < 20 ? "a" : (E - g) < 60 ? "b" : "c");
      }
      cells.push(`${pol.split(' ')[0]} ${String(maxStep.toFixed(0)).padStart(3)}mm ${String(blocked).padStart(3)}/${n} in${String(enter).padStart(4)} ${prof.join('')}`);
    }
    console.log(`  ${L.label} · ${pc.name}\n    ${cells.join("\n    ")}`);
  }
}

const S: Piece = { name: "piece 30×30", w: 30, d: 30, h: 30 };
const B: Piece = { name: "piece 80×80", w: 80, d: 80, h: 80 };
const R: Piece = { name: "bar 20×20 (100 tall)", w: 20, d: 20, h: 100 };
const P = [S, B, R];
const v = (x0: number, x1: number, z0: number, z1: number, depth: number, y1 = 120): Box => ({ lo: [x0, y1 - depth, z0], hi: [x1, y1, z1] });
const acrossX = (z: number, a = 100, b = 300) => ({ label: `across (x ${a}→${b}, z ${z})`, from: [a, z] as [number, number], to: [b, z] as [number, number] });
const alongZ = (x: number, a = 100, b = 300) => ({ label: `along (z ${a}→${b}, x ${x})`, from: [x, a] as [number, number], to: [x, b] as [number, number] });

const only = process.env.ONLY;
const run = (n: string, ...a: Parameters<typeof study> extends [string, ...infer R] ? R : never) => { if (!only || n.includes(only)) study(n, ...a); };
for (const W of [13, 40, 100]) for (const D of [10, 60]) run(`A blind recess ${W}×${W}, ${D} deep (interior)`, [v(200 - W / 2, 200 + W / 2, 200 - W / 2, 200 + W / 2, D)], [acrossX(200)], P);
for (const W of [13, 40, 100]) run(`B through hole ${W}×${W} (interior)`, [v(200 - W / 2, 200 + W / 2, 200 - W / 2, 200 + W / 2, 120)], [acrossX(200)], P);
for (const W of [13, 40]) for (const D of [10, 60]) run(`C groove ${W} wide, ${D} deep, the whole face long`, [v(200 - W / 2, 200 + W / 2, 0, 400, D)], [acrossX(200), alongZ(200)], P);
for (const W of [13, 40]) run(`D through slot ${W} wide (interior, 200 long)`, [v(200 - W / 2, 200 + W / 2, 100, 300, 120)], [acrossX(200), alongZ(200, 50, 350)], P);
for (const W of [13, 40]) run(`E U-slot ${W} wide, 60 deep, from the edge (z 0 → 200)`, [v(200 - W / 2, 200 + W / 2, 0, 200, 60)], [acrossX(100), alongZ(200, 0, 300)], P);
for (const W of [13, 50]) run(`F corner notch ${W}×${W}, 60 deep`, [v(0, W, 0, W, 60)], [acrossX(W / 2, 0, 150), alongZ(W / 2, 0, 150)], P);
for (const W of [13, 50]) run(`G rebate ${W} wide, 60 deep, along a whole edge`, [v(0, 400, 0, W, 60)], [alongZ(200, 0, 150), acrossX(W / 2)], P);
run(`H L-shaped recess, arms 40 wide, 40 deep`, [v(150, 250, 150, 190, 40), v(150, 190, 190, 250, 40)], [acrossX(170), alongZ(170), alongZ(220)], P);
run(`I undercut: a mouth 20 wide, a cavity 60 wide below (interior)`, [v(190, 210, 150, 250, 20), v(170, 230, 150, 250, 40, 100)], [acrossX(200)], P);
