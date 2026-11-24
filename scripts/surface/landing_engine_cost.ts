// ⭐⭐ P2'S TWO ENGINES, OFFLINE — the sums (`landing_map.ts`, LIVE) against the cast (`landing_cast.ts`, S14 — ORBIT_SURFACE_LANDING_CAST.md §6
// items 3 – 4): (1) THE AGREEMENT on the study's protocol (§4: `Scene_1`'s placed boxes × the green piece, `Scene_2`'s stages 3, 9, 13, 16 — the
// part placed next held as held; 8 face directions, the six axes and two slanted; N queries a direction, a quarter ON a pair's rectangle edge (flush,
// ± 10 nm, ± 1 µm), half read from F — through the stack, then the drive's case: 0 – 20 mm above the landing): kinds, parts, the largest depth
// difference, `top` and the refused bit for bit — and a third pass with the held pieces TURNED (the cast's hulls re-read by index, `like`); (2) THE COST per engine on this PC: a turn frame (the sums: `heldSumsOn`; the cast: the held hulls and
// the held pieces on one direction), a new direction (`landingFor`; `castPlacedOn`), a query (the median, the drive's case).
// INFORMATION (exit 0); exit 1 when a kind or a part differs, or a depth by more than TOUCH (0.1 µm) — never tuned away: the cast's answer is today's.
// Usage:  npx vite-node scripts/surface/landing_engine_cost.ts -- [<scene_2.glb>]   (N=400 by default; env N, STAGES="2,8,12,15" — 0-based)
import { readFileSync } from "node:fs";
import { SCENE_1, SCENE_1_FINAL } from "../../src/content/scene_1";
import { apply, glbBin, partGeometry } from "../../src/core/glb_geometry";
import { CAST_COUNT, castHeldHulls, castHeldOn, castPlacedOn, landingCast } from "../../src/core/landing_cast";
import { heldSumsOn, landingFor, preparePlaced, TOUCH_M, type ConvexPiece, type Landing, type LandingAxes } from "../../src/core/landing_map";
import { glbJson, readModelCatalog } from "../../src/core/model_catalog";
import type { Vec3 } from "../../src/core/vec";

const file = process.argv.slice(2).find((a) => a.endsWith(".glb")) ?? "Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb";
const bytes = new Uint8Array(readFileSync(file));
const j = glbJson(bytes);
if (!("json" in j)) throw new Error(`NOT READ: ${j.refusal}`);
const { catalog } = readModelCatalog(j.json);
if (catalog === null) throw new Error("REFUSED by the game's reader");
const N = Number(process.env["N"] ?? 400);

// ── the sets (the study's, `cost_when.ts`): Scene_1's placed boxes × the green piece; Scene_2's stages
const unit = SCENE_1.unitM!;
const goal = new Map(SCENE_1_FINAL.bodies.map((b) => [b.id, b.position]));
const ref: ConvexPiece[] = SCENE_1.bodies
  .filter((b) => !b.frozen && b.topScale === 1 && b.prismSides === undefined && b.orientation === "identity" && JSON.stringify(goal.get(b.id)) === JSON.stringify(b.position))
  .map((b) => {
    const h = b.dims.map((d) => (d / 2 + (b.margin ?? 0)) * unit);
    const c = b.position.map((x) => x * unit);
    const pts: Vec3[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push([c[0]! + sx * h[0]!, c[1]! + sy * h[1]!, c[2]! + sz * h[2]!]);
    return { id: b.id, points: pts };
  });
const green: Vec3[][] = [[]];
for (const x of [-20.65, 20.65]) for (const y of [0, 48]) for (const z of [-22.5, 22.5]) green[0]!.push([x / 1000, y / 1000, z / 1000]);
const sets: { name: string; placed: ConvexPiece[]; held: Vec3[][] }[] = [{ name: "Scene_1", placed: ref, held: green }];
const geo = partGeometry(j.json, glbBin(bytes), catalog);
const at = new Map(geo.map((g) => [g.id, g.pieces.map((pts): ConvexPiece => ({ id: g.id, points: pts.map((p) => { const w = apply(g.goal, p); return [w[0] * catalog.unitM, w[1] * catalog.unitM, w[2] * catalog.unitM] as Vec3; }) }))] as const));
const own = new Map(geo.map((g) => [g.id, g.pieces.map((pts) => pts.map((p) => [p[0] * catalog.unitM, p[1] * catalog.unitM, p[2] * catalog.unitM] as Vec3))] as const));
const order = [...catalog.parts.filter((p) => p.frozen), ...catalog.parts.filter((p) => !p.frozen)].map((p) => p.id);
for (const s of (process.env["STAGES"] ?? "2,8,12,15").split(",").map(Number))
  if (s < order.length) sets.push({ name: `Scene_2 stage ${s + 1} (${order[s]} held)`, placed: order.slice(0, s).flatMap((id) => at.get(id)!), held: own.get(order[s]!)! });

// ── the directions: the six axes (exact frames) and two slanted
const norm = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
const crs = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const slanted = (n: Vec3): LandingAxes => {
  const a: Vec3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(crs(a, n));
  return { origin: [0, 0, 0], u, v: crs(n, u), n };
};
const frames: LandingAxes[] = [
  { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 0, -1], n: [0, 1, 0] },
  { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] },
  { origin: [0, 0, 0], u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0] },
  { origin: [0, 0, 0], u: [0, 1, 0], v: [0, 0, -1], n: [-1, 0, 0] },
  { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] },
  { origin: [0, 0, 0], u: [1, 0, 0], v: [0, -1, 0], n: [0, 0, -1] },
  slanted(norm([1, 1, 0])),
  slanted(norm([0.3, 0.9, 0.3])),
];
/** a rigid turn: 0.7 rad about (1, 2, 3)/√14 (Rodrigues) */
const rot = (p: Vec3): Vec3 => {
  const k = [1 / Math.sqrt(14), 2 / Math.sqrt(14), 3 / Math.sqrt(14)] as const, ca = Math.cos(0.7), sa = Math.sin(0.7);
  const d = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
  const c = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]] as const;
  return [p[0] * ca + c[0] * sa + k[0] * d * (1 - ca), p[1] * ca + c[1] * sa + k[1] * d * (1 - ca), p[2] * ca + c[2] * sa + k[2] * d * (1 - ca)];
};
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const timeOf = (f: () => void, n: number): number => {
  const ts: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    f();
    ts.push(performance.now() - t0);
  }
  return median(ts);
};

let failed = false;
let total = 0;
console.log(`P2's two engines on ${file} — ${N} queries a direction × ${frames.length} directions × 3 (F through the stack; F near the landing; the held pieces TURNED, the cast's hulls re-read by index) per set`);
for (const set of sets) {
  const pp = preparePlaced(set.placed);
  const hh0 = castHeldHulls(set.held);
  // ⭐ a TURN: the held pieces turned (0.7 rad about (1, 2, 3)/√14) — the cast re-reads its hulls by index (`like`), the sums are built afresh
  const turned = set.held.map((pts) => pts.map(rot));
  const passes = [
    { near: false, held: set.held, sums: heldSumsOn(pp, set.held), hh: hh0 },
    { near: true, held: set.held, sums: heldSumsOn(pp, set.held), hh: hh0 },
    { near: false, held: turned, sums: heldSumsOn(pp, turned), hh: castHeldHulls(turned, hh0) },
  ];
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const cat = { n: 0, kind: 0, part: 0, over: 0, maxD: 0, maxAxes: 0, top: 0, refused: 0 };
  const kinds: Record<string, number> = {};
  let worst = "";
  const qOld: number[] = [], qNew: number[] = [];
  const c0 = { ...CAST_COUNT };
  for (const { near, sums, hh } of passes)
    for (const f of frames) {
      const old = landingFor(sums, f);
      const pl = castPlacedOn(pp, f);
      const hd = castHeldOn(hh, f);
      const cast = landingCast(pl, hh, hd);
      if (cast.top !== old.top) cat.top++;
      if (JSON.stringify(cast.refused) !== JSON.stringify(old.refused)) cat.refused++;
      let uL = Infinity, uH = -Infinity, vL = Infinity, vH = -Infinity, nL = Infinity, nH = -Infinity;
      for (const p of pl.pieces) (uL = Math.min(uL, p.box[0]!)), (vL = Math.min(vL, p.box[1]!)), (nL = Math.min(nL, p.box[2]!)), (uH = Math.max(uH, p.box[3]!)), (vH = Math.max(vH, p.box[4]!)), (nH = Math.max(nH, p.box[5]!));
      for (let q = 0; q < N; q++) {
        let U = uL - 0.03 + rnd() * (uH - uL + 0.06), V = vL - 0.03 + rnd() * (vH - vL + 0.06);
        if (q % 4 === 0) {
          // ON an edge of some pair's rectangle (the alignment's flush cases): exactly, ± 10 nm, ± 1 µm
          const pb = pl.pieces[Math.floor(rnd() * pl.pieces.length)]!.box, hb = hd.pieces[Math.floor(rnd() * hd.pieces.length)]!.box;
          const jit = [0, 1e-8, -1e-8, 1e-6, -1e-6][Math.floor(rnd() * 5)]!;
          if (rnd() < 0.5) U = (rnd() < 0.5 ? pb[0]! - hb[3]! : pb[3]! - hb[0]!) + jit;
          else V = (rnd() < 0.5 ? pb[1]! - hb[4]! : pb[4]! - hb[1]!) + jit;
        }
        let from = q % 2 === 0 ? undefined : nL - 0.01 + rnd() * (nH - nL + 0.02);
        if (from !== undefined && near) {
          const o = old.landingAt(U, V);
          from = o.kind === "land" ? o.depth + rnd() * 0.02 : nH + 0.01;
        }
        let t0 = performance.now();
        const a: Landing = old.landingAt(U, V, from);
        const ta = performance.now() - t0;
        t0 = performance.now();
        const b: Landing = cast.landingAt(U, V, from);
        const tb = performance.now() - t0;
        if (near) qOld.push(ta), qNew.push(tb);
        cat.n++;
        kinds[a.kind] = (kinds[a.kind] ?? 0) + 1;
        const bad0 = cat.kind + cat.part + cat.over;
        if (a.kind !== b.kind) cat.kind++;
        else if ((a.kind === "land" || a.kind === "inside") && a.part !== (b as { part: string }).part) cat.part++;
        else if (a.kind === "land" && b.kind === "land") {
          const d = Math.abs(a.depth - b.depth);
          if (frames.indexOf(f) < 6) cat.maxAxes = Math.max(cat.maxAxes, d);
          if (d > cat.maxD) (cat.maxD = d), (worst = `n=${f.n.map((x) => x.toFixed(2))} U=${U} V=${V} from=${from} sums=${a.depth} cast=${b.depth}`);
          if (d > TOUCH_M) cat.over++;
        }
        if (cat.kind + cat.part + cat.over > bad0 && bad0 < 3) console.log(`   ✗ n=${f.n.map((x) => x.toFixed(2))} U=${U} V=${V} from=${from} sums=${JSON.stringify(a)} cast=${JSON.stringify(b)}`);
      }
    }
  total += cat.n;
  const casts = CAST_COUNT.casts - c0.casts;
  if (cat.kind + cat.part + cat.over + cat.top + cat.refused > 0) failed = true;
  console.log(`${set.name}: ${set.placed.length} placed × ${set.held.length} held — ${cat.n} queries ${JSON.stringify(kinds)}: kinds different ${cat.kind}, parts different ${cat.part}, depth > TOUCH ${cat.over}, largest |Δdepth| ${cat.maxD.toExponential(2)} m (the six axes: ${cat.maxAxes.toExponential(2)} m); top different ${cat.top}, refused different ${cat.refused}; GJK ${((CAST_COUNT.steps - c0.steps) / Math.max(1, casts)).toFixed(1)} steps a cast, capped ${CAST_COUNT.capped - c0.capped} of ${casts}, stopped still ${CAST_COUNT.still - c0.still}, hits advanced to their facet's plane ${CAST_COUNT.refined - c0.refined}`);
  // ── the cost, one direction (the top's — `cost_when.ts`'s)
  const axes = frames[0]!;
  const sums = passes[0]!.sums;
  const turnOld = timeOf(() => heldSumsOn(pp, set.held), 3);
  const dirOld = timeOf(() => landingFor(sums, axes), 3);
  const pl = castPlacedOn(pp, axes);
  // a turn frame: the same pieces' hulls re-read by index, put on the direction (the game's path at a turn); a pick-up: the hulls computed
  const turnNew = timeOf(() => { const h = castHeldHulls(turned, hh0); landingCast(pl, h, castHeldOn(h, axes)); }, 21);
  const pickNew = timeOf(() => castHeldHulls(set.held), 5);
  const dirNew = timeOf(() => castPlacedOn(pp, axes), 11);
  console.log(`   the largest depth difference: ${worst}`);
  console.log(`   cost — the sums: turn frame ${turnOld.toFixed(2)} ms, new direction ${dirOld.toFixed(2)} ms, query ${(1000 * median(qOld)).toFixed(1)} µs | the cast: turn frame ${turnNew.toFixed(3)} ms, new direction ${dirNew.toFixed(3)} ms, query ${(1000 * median(qNew)).toFixed(1)} µs (a pick-up's hulls ${pickNew.toFixed(2)} ms)`);
}
console.log(`VERDICT: ${failed ? "DIFFERENT — read the lines above (never tune the cast to hide it)" : "THE SAME"} on ${total} queries`);
process.exit(failed ? 1 : 0);
