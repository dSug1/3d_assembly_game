// ⭐⭐⭐ THE SURFACE STUDY — PART 1: THE NAMED LIBRARY (ORBIT_SURFACE.md, 2026-11-16; the owner: "I suggest you complement this set of rules by doing like
// you did for the orbit charts: you elaborate some basic geometries or topologies with surface singularities and you consolidate the rules you have
// drafted, or amend them, or add rules which are missing to cover cases we did not consider" — "Make sure you manage the load on my computer").
// Each shape read TODAY (the game's pure functions, `readings.ts`) and PROPOSED (the principles as written), and checked: landing, continuity, a function
// of the place, close in (P5), the far regime (S17 / P1), exposure (S22), coverage (S24), the goal (S21), determinism, sensitivity.
// Usage (ONE process, one core, under 3 minutes): npx vite-node scripts/probes/surface_study/run_library.ts   (ONLY=text — the shapes whose name holds it;
// SELF=1 — the self-checks alone). Writes library.json beside it.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { add, movePart } from "./geom";
import { type Piece, FAR_GRID, PIECE_A, PIECE_B, PIECE_BAR, PIECE_BAR_T, buildCtx, facetFor, todayAt, heldFoot, propFar } from "./readings";
import { coverage, determinism, exposure, farRegime, goalCheck, placesOf, r1, readLine, sensitivity, moveShape, type LineResult } from "./checks";
import { LIBRARY } from "./shapes";
import { selfCheck } from "./selfcheck";

const t0 = Date.now();
const nSelf = selfCheck();
console.log(`self-checks: ${nSelf} passed`);
if (process.env.SELF) process.exit(0);
const PIECES: Record<string, Piece> = { A: PIECE_A, B: PIECE_B, bar: PIECE_BAR, barT: PIECE_BAR_T };
const out: unknown[] = [];
for (const sh of LIBRARY()) {
  if (process.env.ONLY && !sh.name.includes(process.env.ONLY)) continue;
  const ts = Date.now();
  const ctx = buildCtx(sh.parts);
  const twin = buildCtx(sh.twin);
  const rec: Record<string, unknown> = { name: sh.name, classes: sh.classes, sketch: sh.sketch, parts: sh.parts.length, expect: sh.expect, pair: sh.pair === true };
  if (ctx.map === null) {
    rec.empty = { box: ctx.box, map: null, note: "no placed part: shellBox null, no face map — the gizmo held or at the boot centre (assembly_wiring.ts:94-96); no rule says" };
    out.push(rec);
    console.log(`${sh.name}: EMPTY (no map)`);
    continue;
  }
  rec.contour = ctx.map.facets.map((f) => ({ n: f.n.map((v) => r1(v * 1000) / 1000), e: r1(f.e * 1000), kind: f.kind, real: f.real, share: r1(f.share * 100) / 100, groups: f.groups.length }));
  // the travels
  const lines: Record<string, Record<string, LineResult>> = {};
  for (const st of sh.studies) {
    const fi = facetFor(ctx.map, st.n);
    if (fi < 0) { lines[`(no facet facing ${st.n.join(",")})`] = {}; continue; }
    const f = ctx.map.facets[fi]!;
    for (const ln of st.lines) {
      const pts = placesOf(f, ln, 1);
      lines[ln.label] = {};
      for (const pk of sh.pieces ?? ["A", "B"]) lines[ln.label]![pk] = readLine(ctx, f, pts, PIECES[pk]!, true);
    }
  }
  rec.lines = lines;
  // the far regime against the twin
  if (twin.map !== null) rec.far = farRegime(ctx, twin, FAR_GRID);
  else rec.far = { note: "the twin is empty: no comparison" };
  // exposure (S22) and coverage (S24)
  const ex = exposure(sh.parts);
  rec.exposure = { today: ex.today, s22: ex.s22, buried: ex.buried, sealed: ex.sealed, glued: ex.glued };
  rec.coverage = coverage(ctx, ex.samples);
  // the goal (S21)
  if (sh.goal) rec.goal = goalCheck(buildCtx(sh.parts.some((p) => p.id === sh.goal!.part.id) ? sh.parts : [...sh.parts, sh.goal.part]), sh.goal);
  // the stages (C46): the gizmo at the stage's places before / after, today's map keeping what S22 removes
  if (sh.stages) {
    const st = sh.stages.map((ps) => {
      const c = buildCtx(ps);
      const fi = facetFor(c.map, [0, 1, 0]);
      const f = c.map!.facets[fi]!;
      const e = exposure(ps);
      const lidTop = Math.max(...ps.map((p) => p.hi[1]));
      return { parts: ps.length, todayAt0: r1(todayAt(c, f, 0, 0, heldFoot(PIECE_A)).level), propAt0: r1(propFar(c, f, 0, 0, PIECE_A).level), exposure: { today: e.today, s22: e.s22, sealed: e.sealed }, topGroupsBelow: f.groups.filter((g) => g.depth * 1000 < lidTop - 0.5).length };
    });
    rec.stages = st;
  }
  // determinism
  // the travels moved 0.37 mm off the walls' exact places (a point read EXACTLY over a wall is a tie: its level either side, by the rounding of the turn);
  // the ties kept apart (`detTie`: the travels as drawn)
  const off = sh.studies.map((x) => ({ n: x.n, lines: x.lines.map((l) => ({ ...l, a: add(l.a, [0.37, 0, 0.37]), b: add(l.b, [0.37, 0, 0.37]) })) }));
  rec.det = determinism(sh.parts, off, PIECE_A, (p) => moveShape(p, movePart));
  rec.detTie = determinism(sh.parts, sh.studies, PIECE_A, (p) => moveShape(p, movePart));
  rec.capReal = ctx.map.facets[ctx.map.top]!.real;
  // sensitivity
  if (sh.sens) rec.sens = sh.sens.map((s) => ({ label: s.label, ruler: s.ruler, delta: s.delta, ...sensitivity(s.build, s.ruler, s.delta, s.at, s.n, PIECES[s.piece]!) }));
  rec.ms = Date.now() - ts;
  out.push(rec);
  console.log(`${sh.name}: ${rec.ms} ms`);
}
const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, "library.json"), JSON.stringify(out));
console.log(`\nlibrary: ${out.length} shapes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
