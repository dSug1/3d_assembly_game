// ⭐ (2026-11-08, scope §32) THE CLOSE-IN CHART OFFLINE on Scene_1's dump (scene1_geom.json): the boot pass's cost and accepted depth per facet, then charts
// anchored on a grid of places per facet — the region's size, the fill's casts and time. Run: npx tsx scripts/probes/chart_probe.ts [geom.json]
import { readFileSync } from "node:fs";
import { anchorChart, castHulls, chartFilled, facetAccept, fillChart, hullParts, type ChartFacet } from "../../src/input/close_in_chart";
import { facetFrame } from "../../src/input/face_map";
import { dot, type Vec3 } from "../../src/core/vec";
const g = JSON.parse(readFileSync(process.argv[2] ?? "scripts/probes/scene1_geom.json", "utf8"));
const parts = hullParts(g.parts as Vec3[][], g.ids);
let t0 = performance.now();
const N = 2000; let hits = 0;
for (let k = 0; k < N; k++) { const h = castHulls(parts, [-0.2 + 0.45 * Math.random(), 0.5 * Math.random(), -0.2], [0, 0, 1], 0.5); if (h) hits++; }
console.log(`cast: ${((performance.now() - t0) * 1000 / N).toFixed(2)} µs each (${hits}/${N} hits), ${parts.length} parts, planes ${parts.map((p) => p.planes.length).join(",")}`);
for (const [fi, F] of (g.facets as { n: Vec3; es: number }[]).entries()) {
  const { t, b } = facetFrame(F.n);
  let tLo = Infinity, tHi = -Infinity, bLo = Infinity, bHi = -Infinity;
  for (const p of g.parts as Vec3[][]) for (const v of p) { tLo = Math.min(tLo, dot(v, t)); tHi = Math.max(tHi, dot(v, t)); bLo = Math.min(bLo, dot(v, b)); bHi = Math.max(bHi, dot(v, b)); }
  const f: ChartFacet = { n: F.n, t, b, es: F.es, tLo, tHi, bLo, bHi };
  t0 = performance.now();
  const acc = facetAccept(parts, f);
  const tb = performance.now() - t0;
  const sizes: number[] = []; let casts = 0, fills = 0; const tf0 = performance.now();
  for (let a = 0; a < 5; a++) for (let c = 0; c < 5; c++) {
    const pu = tLo + (tHi - tLo) * (a + 0.5) / 5, pv = bLo + (bHi - bLo) * (c + 0.5) / 5;
    const p: Vec3 = [t[0] * pu + b[0] * pv + F.n[0] * F.es, t[1] * pu + b[1] * pv + F.n[1] * F.es, t[2] * pu + b[2] * pv + F.n[2] * F.es];
    const C = anchorChart(parts, fi, f, acc, p, g.w);
    if (C === null) { sizes.push(-1); continue; }
    while (!chartFilled(C)) { casts += fillChart(C, parts); fills++; }
    sizes.push(Math.round(C.cells.size * 0.0025 * 0.0025 * 1e4)); // cm²
  }
  const tf = performance.now() - tf0;
  console.log(`facet ${fi} n=${F.n} ${((tHi - tLo) * 1000).toFixed(0)}×${((bHi - bLo) * 1000).toFixed(0)} mm: boot ${acc.casts} casts ${tb.toFixed(1)} ms, maxDepth ${(acc.maxDepth * 1000).toFixed(0)} mm, own ${acc.cells.length}; 25 charts: region cm² ${sizes.join(" ")}; ${casts} casts, ${fills} fills, ${tf.toFixed(0)} ms`);
}
