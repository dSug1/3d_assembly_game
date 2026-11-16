// ⭐⭐⭐ THE SURFACE STUDY — PART 2: THE PARAMETRIC SWEEP over ORBIT_SURFACE.md §3.0's grid, so that the study does not rest on hand-picked cases:
// sign (void, protrusion) × footprint (island, strip open at one end, at both, ring, array) × profile (straight, stepped, widening, right through) × width
// against piece A's 41.3 (0.5, 0.9, 1.1, 2) × depth / height (0.3, 1, 6, 40 mm) × position (inside, on an edge, on a corner, under the pole) — the
// meaningful cells (no "through" protrusion, no widening under 6 mm, no corner for a strip open at both ends). Per cell, piece A on two 1 mm travels
// through the feature (along t and along b), both readings: landing, continuity, a function of the place, close in; the far regime against the bare
// block (a reduced grid of angles); the reading at the feature's centre (for the sensitivity across the width ruler, `report.ts`).
// Usage (ONE process, one core, under 3 minutes): npx vite-node scripts/probes/surface_study/run_sweep.ts   (EVERY=k — one cell in k, for timing).
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { V } from "./geom";
import { FAR_GRID_SMALL, PIECE_A, buildCtx, facetFor, heldFoot, propFar, todayAt } from "./readings";
import { farRegime, placesOf, r1, readLine } from "./checks";
import { TOP, base, sweepCombos } from "./shapes";
import { selfCheck } from "./selfcheck";

const t0 = Date.now();
console.log(`self-checks: ${selfCheck()} passed`);
const every = Number(process.env.EVERY ?? 1);
const twin = buildCtx(base());
const combos = sweepCombos();
const out: unknown[] = [];
let k = 0;
for (const c of combos) {
  if (k++ % every !== 0) continue;
  const ctx = buildCtx(c.parts());
  const fi = facetFor(ctx.map, [0, 1, 0]);
  if (fi < 0) { out.push({ id: c.id, err: "no top facet" }); continue; }
  const f = ctx.map!.facets[fi]!;
  const [cx, cz] = c.centre, [hx, hz] = c.ext;
  const y = f.e * 1000;
  const lines = [
    { label: "t", a: [Math.max(-239.5, cx - hx - 60), y, cz] as V, b: [Math.min(239.5, cx + hx + 60), y, cz] as V },
    { label: "b", a: [cx, y, Math.max(-239.5, cz - hz - 60)] as V, b: [cx, y, Math.min(239.5, cz + hz + 60)] as V },
  ];
  const agg = { T: { e: 0, em: 0, a: 0, am: 0, u: 0, um: 0, g: 0, gm: 0, p: 0, h: 0, cr: 0, ct: 0, cd: 0, n: 0 }, P: { e: 0, em: 0, a: 0, am: 0, u: 0, um: 0, g: 0, gm: 0, p: 0, h: 0, cr: 0, ct: 0, cd: 0, n: 0 } };
  let samples = 0;
  for (const ln of lines) {
    const r = readLine(ctx, f, placesOf(f, { label: ln.label, a: ln.a, b: ln.b }, 1), PIECE_A);
    samples += r.n;
    for (const R of ["T", "P"] as const) {
      const x = r[R], a = agg[R];
      a.e += x.land.enter; a.em = Math.max(a.em, x.land.enterMax); a.a += x.land.air; a.am = Math.max(a.am, x.land.airMax);
      a.u += x.cont.unnamed; a.um = Math.max(a.um, x.cont.unnamedMax); a.g += x.cont.glides; a.gm = Math.max(a.gm, x.cont.glideMax); a.p += x.path;
      a.cr += x.close.reach / lines.length; a.ct += x.close.trapped; a.cd += x.close.drops;
      if (R === "T") a.h += r.T.held; else a.n += r.P.land.nothing;
    }
  }
  for (const R of ["T", "P"] as const) for (const kk of ["em", "am", "um", "gm"] as const) agg[R][kk] = r1(agg[R][kk]);
  const far = farRegime(ctx, twin, FAR_GRID_SMALL);
  const L = cx * f.t[0] + cz * f.t[2], s = cx * f.b[0] + cz * f.b[2];
  const tc = todayAt(ctx, f, L, s, heldFoot(PIECE_A)), pc = propFar(ctx, f, L, s, PIECE_A);
  out.push({
    id: c.id, sign: c.sign, foot: c.foot, prof: c.prof, wf: c.wf, w: c.w, dh: c.dh, pos: c.pos, parts: ctx.parts.length, samples,
    T: agg.T, P: agg.P, far: { T: far.T.footMax, P: far.P.footMax, nT: far.T.nDeg, box: far.boxMm, cu: far.contour.unmatched, cd: far.contour.dMax, top: r1(y - TOP) },
    centre: { T: r1(tc.level), Tk: tc.kind, P: r1(pc.level), Pk: pc.nothing ? "nothing" : "contact" },
    cap: ctx.map!.facets[ctx.map!.top]!.real, // the top cap a REAL facet (D5 kept it), or a virtual one at the box
  });
}
const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, "sweep.json"), JSON.stringify(out));
console.log(`sweep: ${out.length} of ${combos.length} cells in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
