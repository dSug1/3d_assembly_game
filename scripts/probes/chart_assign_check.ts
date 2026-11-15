// ⭐⭐⭐ THE ASSIGNMENT PORT'S CHECK (2026-11-15, `ORBIT_CHARTS.md` §7.2 step 1.2) — `src/input/orbit_charts.ts` against the prototype
// (`chart_lib.ts`'s `contourOf`, `buildChart`, `assignCharts`) on the 35 shapes of `SHAPES`. Exactly equal in structure, within 1e-9 in numbers:
// the contour (the faces in order, their corners), the candidate frames (in order), every face's kind in gravity's chart and in EVERY candidate frame
// (and the charts' ends), every face's home (rings or not, the frame, the mode) and its kind there, the frames taken (order, axis, mode, the faces as a
// set), every cap's layouts (order, frame, mode), the count gravity breaks. With the time one port assignment takes (contour + assignment; the median of
// five runs after one warm-up).
// Run: npx vite-node scripts/probes/chart_assign_check.ts
import { assignCharts as portAssign, chartContour } from "../../src/input/orbit_charts";
import type { Vec3 } from "../../src/core/vec";
import { assignCharts, contourOf, SHAPES, type Chart } from "./chart_lib";
import { mapOf, type V } from "./shapes_lib";

const GATE = 1e-9;
const gap = (a: V, b: V): number => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
let fail = 0;
let worstMs = 0;
let worstName = "";
let worstNum = 0;
for (const sh of SHAPES) {
  const polys = sh.polys();
  const errs: string[] = [];
  const err = (s: string): void => {
    if (errs.length < 6) errs.push(s);
  };
  const num = (a: number, b: number, what: string): void => {
    const g = Math.abs(a - b);
    if (!(g <= GATE)) err(`${what}: ${a} vs ${b}`);
    else worstNum = Math.max(worstNum, g);
  };
  const vec = (a: V, b: V, what: string): void => {
    const g = gap(a, b);
    if (!(g <= GATE)) err(`${what}: [${a.join(", ")}] vs [${b.join(", ")}]`);
    else worstNum = Math.max(worstNum, g);
  };
  // the contour
  const map = mapOf(polys);
  const pc = chartContour(map);
  const rc = contourOf(polys);
  if (pc.length !== rc.length) err(`contour: ${pc.length} faces vs ${rc.length}`);
  else
    pc.forEach((f, i) => {
      const r = rc[i]!;
      if (f.pts.length !== r.pts.length) err(`contour face ${i}: ${f.pts.length} corners vs ${r.pts.length}`);
      else f.pts.forEach((p, k) => vec(p, r.pts[k]!, `contour face ${i} corner ${k}`));
      vec(f.n, r.n, `contour face ${i} normal`);
      num(f.area, r.area, `contour face ${i} area`);
      vec(f.c, r.c, `contour face ${i} centroid`);
    });
  // the facet indices: the map's real facets with a polygon of three, kept when the cleaned polygon keeps three
  const idx = map.facets.map((f, k) => ({ f, k })).filter(({ f }) => f.real && f.poly.length >= 3).map(({ k }) => k);
  if (!pc.every((f) => idx.includes(f.index)) || new Set(pc.map((f) => f.index)).size !== pc.length) err("contour: facet indices");
  // the assignment, timed
  portAssign(chartContour(map));
  const ts: number[] = [];
  for (let r = 0; r < 5; r++) {
    const t0 = performance.now();
    portAssign(chartContour(map));
    ts.push(performance.now() - t0);
  }
  ts.sort((a, b) => a - b);
  const ms = ts[2]!;
  if (ms > worstMs) {
    worstMs = ms;
    worstName = sh.name;
  }
  if (errs.length === 0) {
    const P = portAssign(pc);
    const A = assignCharts(rc);
    // the charts' kinds and ends
    const sameChart = (c: Chart, k: { axis: Vec3; kinds: readonly string[]; top: { kind: string; cap: number; centre: Vec3; y: number }; bottom: { kind: string; cap: number; centre: Vec3; y: number } }, what: string): void => {
      vec(k.axis, c.a, `${what} axis`);
      if (k.kinds.length !== c.type.length || k.kinds.some((x, i) => x !== c.type[i])) err(`${what} kinds: ${k.kinds.join(",")} vs ${c.type.join(",")}`);
      for (const [pe, re, nm] of [[k.top, c.top, "top"], [k.bottom, c.bottom, "bottom"]] as const) {
        if (pe.kind !== re.kind || pe.cap !== re.cap) err(`${what} ${nm}: ${pe.kind} ${pe.cap} vs ${re.kind} ${re.cap}`);
        vec(pe.centre, c.fromF(re.centre), `${what} ${nm} centre`);
        num(pe.y, re.y, `${what} ${nm} height`);
      }
    };
    sameChart(A.W, P.gravity, "gravity");
    if (P.frames.length !== A.charts.length) err(`candidates: ${P.frames.length} vs ${A.charts.length}`);
    else P.frames.forEach((f, k) => sameChart(A.charts[k]!, f, `frame ${k}`));
    // the homes and their kinds
    const refHome = (c: Chart): { frame: number; rings: boolean } => (c === A.W ? { frame: -1, rings: false } : c === A.R ? { frame: -1, rings: true } : { frame: A.charts.indexOf(c), rings: false });
    rc.forEach((_, i) => {
      const h = A.home.get(i)!;
      const r = refHome(h.c);
      const p = P.home[i]!;
      if (p.frame !== r.frame || p.rings !== r.rings || p.mode !== h.mode) err(`face ${i} home: ${p.frame}/${p.rings}/${p.mode} vs ${r.frame}/${r.rings}/${h.mode}`);
      vec(p.axis, h.c.a, `face ${i} home axis`);
      if (P.kind[i] !== h.c.type[i]) err(`face ${i} kind at home: ${P.kind[i]} vs ${h.c.type[i]}`);
    });
    // the frames taken
    if (P.used.length !== A.used.length) err(`frames taken: ${P.used.length} vs ${A.used.length}`);
    else
      P.used.forEach((u, k) => {
        const r = A.used[k]!;
        const rh = refHome(r.h.c);
        if (u.home.frame !== rh.frame || u.home.rings || u.home.mode !== r.h.mode) err(`frame taken ${k}: ${u.home.frame}/${u.home.mode} vs ${rh.frame}/${r.h.mode}`);
        const a = [...u.faces].sort((x, y) => x - y).join(",");
        const b = [...r.f].sort((x, y) => x - y).join(",");
        if (a !== b) err(`frame taken ${k} faces: ${a} vs ${b}`);
      });
    // the caps' layouts
    const pk = [...P.layouts.keys()];
    const rk = [...A.capHomes.keys()];
    if (pk.join(",") !== rk.join(",")) err(`cap faces: ${pk.join(",")} vs ${rk.join(",")}`);
    else
      for (const i of pk) {
        const pl = P.layouts.get(i)!;
        const rl = A.capHomes.get(i)!;
        if (pl.length !== rl.length) err(`cap ${i}: ${pl.length} layouts vs ${rl.length}`);
        else
          pl.forEach((h, k) => {
            const r = rl[k]!;
            if (h.frame !== A.charts.indexOf(r.c) || h.mode !== r.mode) err(`cap ${i} layout ${k}: ${h.frame}/${h.mode} vs ${A.charts.indexOf(r.c)}/${r.mode}`);
          });
      }
    if (P.brokenByGravity !== A.brokenW) err(`broken by gravity: ${P.brokenByGravity} vs ${A.brokenW}`);
    if (errs.length === 0)
      console.log(
        `ok   ${sh.name}: ${pc.length} faces, ${P.frames.length} candidates, ${P.brokenByGravity} broken by gravity, ${P.used.length} frame(s) taken, ${P.home.filter((h) => h.rings).length} on the rings, ${P.layouts.size} cap(s) — ${ms.toFixed(2)} ms`,
      );
  }
  if (errs.length > 0) {
    fail++;
    console.log(`FAIL ${sh.name} — ${ms.toFixed(2)} ms\n     ${errs.join("\n     ")}`);
  }
}
console.log(`the largest numeric gap ${worstNum.toExponential(2)} (gate ${GATE}); the worst time ${worstMs.toFixed(2)} ms (${worstName})`);
console.log(fail === 0 ? "PASS" : `FAIL (${fail} shape(s))`);
