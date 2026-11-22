// THE LANDING MAP AGAINST ITS SECOND IMPLEMENTATION — the full comparison (package S1, ORBIT_SURFACE_LANDING_MAP.md §8 item 1). Offline, one process.
// The first implementation: `src/core/landing_map.ts` (the union of the convex pairs' Minkowski sums, cast along the normal). The second: the surface
// study's brute-force P reading (`prismLevels` / `propFar`: the highest level of any part inside the held footprint's prism), as rebuilt in
// `tests/helpers/surface_shapes.ts` — which is FIRST checked to build the study's own parts bit for bit (`scripts/probes/surface_study/shapes.ts`).
// Compared: (1) the library L01 – Q10, every study facet, every travel at 1 mm (the exact `landingAt`) and EVERY sample of a 4 mm map over the travels'
// rectangle, pieces A and B (A, the bar and the bar turned on L53); a sample against `landingAt` at its place, bit for bit; the lookup between samples
// against `landingAt` at seeded off-grid places (its error, §6). (2) the 1596-cell sweep: piece A, its two 1 mm travels (`landingAt`) and the map's
// samples on those travels. Usage (ONE process, one core): npx vite-node scripts/surface/landing_compare.ts   (PART=lib | sweep — one half only).
// Writes its totals to the scratch file named by OUT (default: none) and prints them.
import { writeFileSync } from "node:fs";
import { buildLandingMap, type Landing, type LandingMap } from "../../src/core/landing_map";
import { LIBRARY, sweepCombos } from "../probes/surface_study/shapes";
import { PIECES, PIECE_A, TOP_F, boxHeld, bruteLanding, frameOf, library, placesOf, toConvex, type BoxPiece, type Part, type Study, type V } from "../../tests/helpers/surface_shapes";

const M = 0.001;
const TOL_M = 1e-9; // the design's tolerance (0.000 001 mm)
const t0 = Date.now();
const part = process.env.PART ?? "all";

// ─── 0. the helper's copy of the library builds the study's parts bit for bit ───
{
  const mine = library(), theirs = LIBRARY();
  if (mine.length !== theirs.length) throw new Error(`library size ${mine.length} vs ${theirs.length}`);
  let parts = 0;
  for (let k = 0; k < mine.length; k++) {
    const a = mine[k]!, b = theirs[k]!;
    if (!b.name.startsWith(a.name)) throw new Error(`name ${a.name} vs ${b.name}`);
    if (a.parts.length !== b.parts.length) throw new Error(`${a.name}: ${a.parts.length} parts vs ${b.parts.length}`);
    a.parts.forEach((p, i) => {
      const q = b.parts[i]!;
      const same = p.id === q.id && p.isBox === q.isBox && JSON.stringify(p.verts) === JSON.stringify(q.verts) && JSON.stringify(p.planes) === JSON.stringify(q.planes.map((x) => ({ n: x.n, e: x.e }))) && JSON.stringify(p.edges) === JSON.stringify(q.edges);
      if (!same) throw new Error(`${a.name}: part ${p.id} differs from the study's`);
      parts++;
    });
    if (a.studies.length !== b.studies.length || a.studies.some((s, i) => JSON.stringify(s.n) !== JSON.stringify(b.studies[i]!.n) || JSON.stringify(s.lines.map((l) => [l.a, l.b])) !== JSON.stringify(b.studies[i]!.lines.map((l) => [l.a, l.b]))))
      throw new Error(`${a.name}: the studies differ from the study's`);
    if (JSON.stringify(a.pieces) !== JSON.stringify(b.pieces ?? ["A", "B"])) throw new Error(`${a.name}: pieces differ`);
  }
  console.log(`0. the helper's library = the study's: ${mine.length} shapes, ${parts} parts, bit for bit`);
}

// ⭐ the brute force's own convention: its footprint is SHRUNK by 1e-4 mm (`OPEN`, "touching is not over"), so on a slope of gradient g it reads LOWER
// by g × 1e-4 mm; the map's open test is on the obstacle's sides (0.1 µm). A difference of that sign within the library's steepest gradient (85/15,
// the knife) × 1e-4 mm is that convention, counted apart (`openShrink`); anything else is a disagreement (`beyondTol`).
const OPEN_SHRINK_M = (85 / 15) * 1e-4 * M + TOL_M;
interface Tally { places: number; nothingBoth: number; kindDiff: number; openShrink: number; beyondTol: number; maxDiffM: number; worst: string }
const tally = (): Tally => ({ places: 0, nothingBoth: 0, kindDiff: 0, openShrink: 0, beyondTol: 0, maxDiffM: 0, worst: "" });
/** one place: the landing (from outside) against the brute force, mm in, metres compared */
function judge(T: Tally, l: Landing, parts: Part[], st: { n: V; t: V; b: V }, Lmm: number, Smm: number, pc: BoxPiece, where: string): void {
  T.places++;
  const br = bruteLanding(parts, st.n, st.t, st.b, Lmm, Smm, pc);
  if (br.nothing || l.kind !== "land") {
    if (br.nothing && l.kind === "nothing") T.nothingBoth++;
    else { T.kindDiff++; if (T.kindDiff <= 5) console.log(`   KIND ${where} (${Lmm.toFixed(3)}, ${Smm.toFixed(3)}): map ${l.kind}, brute ${br.nothing ? "nothing" : br.level}`); }
    return;
  }
  const sd = l.depth - br.level * M, d = Math.abs(sd);
  if (d > T.maxDiffM) (T.maxDiffM = d, T.worst = `${where} (${Lmm.toFixed(3)}, ${Smm.toFixed(3)}) map ${(l.depth / M).toFixed(6)} brute ${br.level.toFixed(6)}`);
  if (d <= TOL_M) return;
  if (sd > 0 && sd <= OPEN_SHRINK_M) { T.openShrink++; return; }
  T.beyondTol++;
  if (T.beyondTol <= 5) console.log(`   DIFF ${where} (${Lmm}, ${Smm}): map ${l.depth / M} mm, brute ${br.level} mm`);
}
const sameLanding = (a: Landing, b: Landing) => JSON.stringify(a) === JSON.stringify(b);

// a seeded generator (the lookup's places)
let seed = 20261117;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const out: Record<string, unknown> = {};
if (part === "all" || part === "lib") {
  const T = tally(), Tg = tally();
  let sampleVsAt = 0, sampleVsAtBad = 0, maps = 0, samples = 0;
  const look = { places: 0, same: 0, higher: 0, lower: 0, kindDiff: 0, maxHigherMm: 0, maxLowerMm: 0, lowerWorst: "" };
  for (const sh of library()) {
    if (sh.parts.length === 0) continue;
    const placed = toConvex(sh.parts);
    for (const st of sh.studies) {
      const pls = st.lines.flatMap((ln) => placesOf(st, ln, 1));
      const Ls = pls.map((p) => p[0]), Ss = pls.map((p) => p[1]);
      const [uMin, uMax, vMin, vMax] = [Math.min(...Ls), Math.max(...Ls), Math.min(...Ss), Math.max(...Ss)];
      for (const pk of sh.pieces) {
        const pc = PIECES[pk]!;
        const map: LandingMap = buildLandingMap(placed, [boxHeld(pc, st)], frameOf(st, uMin, uMax, vMin, vMax));
        maps++;
        const where = `${sh.name} n${st.n.join(",")} ${pk}`;
        // (a) every place of every travel, the exact evaluation
        for (const [L, s] of pls) judge(T, map.landingAt(L * M, s * M), sh.parts, st, L, s, pc, where);
        // (b) every sample of the map; and the sample against the exact evaluation at its place, bit for bit
        for (let i = 0; i < map.nu; i++) for (let j = 0; j < map.nv; j++) {
          const U = map.uAt(i), Vv = map.vAt(j);
          const ls = map.landingSample(i, j);
          judge(Tg, ls, sh.parts, st, U / M, Vv / M, pc, where + " grid");
          sampleVsAt++;
          if (!sameLanding(ls, map.landingAt(U, Vv))) sampleVsAtBad++;
          samples++;
        }
        // (c) the lookup between samples against the exact evaluation, at 200 seeded places of the region
        for (let k = 0; k < 200; k++) {
          const U = (uMin + rnd() * (uMax - uMin)) * M, Vv = (vMin + rnd() * (vMax - vMin)) * M;
          const a = map.landing(U, Vv), e = map.landingAt(U, Vv);
          if (a.kind === "uncovered") continue;
          look.places++;
          if (a.kind === "land" && e.kind === "land") {
            const d = (a.depth - e.depth) / M;
            if (Math.abs(d) <= 1e-6) look.same++;
            else if (d > 0) (look.higher++, look.maxHigherMm = Math.max(look.maxHigherMm, d));
            else {
              look.lower++;
              if (-d > look.maxLowerMm) (look.maxLowerMm = -d, look.lowerWorst = `${where} (${(U / M).toFixed(2)}, ${(Vv / M).toFixed(2)})`);
            }
          } else if (a.kind === e.kind) look.same++;
          else look.kindDiff++;
        }
      }
    }
  }
  out.library = { travels: T, grid: Tg, maps, samples, sampleVsAt, sampleVsAtBad, lookup: look, seconds: (Date.now() - t0) / 1000 };
  console.log(`1. LIBRARY: ${maps} maps, ${samples} samples; travels ${JSON.stringify(T)}`);
  console.log(`   grid ${JSON.stringify(Tg)}`);
  console.log(`   sample = landingAt bit for bit: ${sampleVsAt - sampleVsAtBad} / ${sampleVsAt}`);
  console.log(`   lookup vs exact: ${JSON.stringify(look)}`);
  console.log(`   ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

if (part === "all" || part === "sweep") {
  const t1 = Date.now();
  const T = tally(), Tg = tally();
  let cells = 0;
  const step = 4;
  for (const c of sweepCombos()) {
    const parts = c.parts() as unknown as Part[];
    const placed = toConvex(parts);
    const [cx, cz] = c.centre, [hx, hz] = c.ext;
    const st: Study = { ...TOP_F, lines: [] };
    // the two travels of the study (`run_sweep.ts`): along t through cz, along b through cx, at the top's plane
    const tl = { a: [Math.max(-239.5, cx - hx - 60), 240, cz] as V, b: [Math.min(239.5, cx + hx + 60), 240, cz] as V };
    const bl = { a: [cx, 240, Math.max(-239.5, cz - hz - 60)] as V, b: [cx, 240, Math.min(239.5, cz + hz + 60)] as V };
    // the map's region: whole steps from (cx, cz), so the two travels lie on a grid row and a grid column
    const ku = Math.ceil((hx + 60) / step), kv = Math.ceil((hz + 60) / step);
    const map = buildLandingMap(placed, [boxHeld(PIECE_A, st)], frameOf(st, cx - ku * step, cx + ku * step, cz - kv * step, cz + kv * step), step);
    for (const ln of [tl, bl]) for (const [L, s] of placesOf(st, ln, 1)) judge(T, map.landingAt(L * M, s * M), parts, st, L, s, PIECE_A, c.id);
    for (let i = 0; i < map.nu; i++) judge(Tg, map.landingSample(i, kv), parts, st, map.uAt(i) / M, map.vAt(kv) / M, PIECE_A, c.id + " grid row");
    for (let j = 0; j < map.nv; j++) judge(Tg, map.landingSample(ku, j), parts, st, map.uAt(ku) / M, map.vAt(j) / M, PIECE_A, c.id + " grid col");
    cells++;
  }
  out.sweep = { cells, travels: T, grid: Tg, seconds: (Date.now() - t1) / 1000 };
  console.log(`2. SWEEP: ${cells} cells; travels ${JSON.stringify(T)}`);
  console.log(`   grid ${JSON.stringify(Tg)}`);
  console.log(`   ${((Date.now() - t1) / 1000).toFixed(1)} s`);
}
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)} s`);
