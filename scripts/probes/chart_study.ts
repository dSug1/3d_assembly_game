// ⭐⭐⭐ THE CHART STUDY's RUNNER (2026-11-15) — the prototype (chart_lib.ts: the model, the rules, the 35 shapes) measured and printed: per shape the
// built map's defects, the assignment, each chart's defects on its own faces, the seams; the prototype against the built map on the three scenes.
// Usage: npx vite-node scripts/probes/chart_study.ts      (ONLY=text — the shapes whose name holds it; VERBOSE=1 — every face's chart;
//        EXPORT=file.json — the charts of the shapes that carry a key, for a viewer)
import { writeFileSync } from "node:fs";
import { mapTarget } from "../../src/input/face_map";
import * as L from "./shapes_lib";
import { type V, D, dot } from "./shapes_lib";
import { type Chart, type Mode, H, OPTS, Y, SEAM_OK, TOL_H, SHAPES, assignCharts, anglesOf, buildChart, contourOf, costOn, dist, scan, seamTurn, shareEdge, target } from "./chart_lib";

interface Row { name: string; faces: number; builtLeaps: number; builtStall: number; builtMax: number; brokenW: number; frames: string; rings: number; leaps: number; stall: number; maxMm: number; cover: string; roll: number; glass: number; half: number; quarter: number; sqMax: number; caps: string }
const rows: Row[] = [];
const exported: unknown[] = [];

function report(name: string, polys: V[][], key?: string): void {
  const faces = contourOf(polys);
  const N = faces.length;
  // 1. as built: the world's face map
  const map = L.mapOf(polys);
  const built = (() => {
    const st = 0.5 * D;
    let n = 0, stall = 0, leap = 0, mx = 0;
    const P = (iy: number, ip: number): V => mapTarget(map, iy * st, -H + ip * st, OPTS).surface as V;
    for (let ip = 0; ip <= 360; ip++) { let prev = P(0, ip); for (let iy = 1; iy <= 720; iy++) { const q = P(iy % 720, ip); if (ip > 0 && ip < 360) { const d = dist(prev, q); n++; if (d < 1e-6) stall++; if (d > 0.012) leap++; if (d > mx) mx = d; } prev = q; } }
    for (let iy = 0; iy < 720; iy += 2) { let prev = P(iy, 0); for (let ip = 1; ip <= 360; ip++) { const q = P(iy, ip); const d = dist(prev, q); n++; if (d < 1e-6) stall++; if (d > 0.012) leap++; if (d > mx) mx = d; prev = q; } }
    return { stallPct: (100 * stall) / n, leap, maxMm: mx * 1000 };
  })();
  // 2 – 5. the assignment (chart_lib.ts)
  const { adj, W, R, home, used, charts, capHomes, capNote, brokenW } = assignCharts(faces);
  const ringsOf = (): number[] => faces.map((_, i) => i).filter((i) => home.get(i)!.c === R);
  // 6. the measures on each chart's own faces
  const servedBy = (c: Chart): number[] => faces.map((_, i) => i).filter((i) => home.get(i)!.c === c);
  const stats: { label: string; s: ReturnType<typeof scan>; faces: number[] }[] = [];
  for (const c of [W, ...used.map((u) => u.h.c), ...(ringsOf().length ? [R] : [])]) { const fs = servedBy(c); if (fs.length) stats.push({ label: c.name, s: scan(c, (f) => fs.includes(f)), faces: fs }); }
  const capStats: ReturnType<typeof scan>[] = [];
  const exits = { none: 0, quarter: 0, half: 0, layouts: 0 };
  for (const [i, list] of capHomes) {
    const seen = new Set<Chart>();
    for (const h of list) {
      if (!seen.has(h.c)) { seen.add(h.c); capStats.push(scan(h.c, (f) => f === i)); }
      exits.layouts++;
      for (const [x, g] of adj) if (x === i) { const t = seamTurn(faces[i]!, h, faces[g]!, home.get(g)!); if (t > 135) exits.half++; else if (t > SEAM_OK) exits.quarter++; else exits.none++; }
    }
  }
  // 7. the seams
  let half = 0, quarter = 0, small = 0;
  const count = (t: number): void => { if (t > 135) half++; else if (t > SEAM_OK) quarter++; else if (t > 1) small++; };
  for (const [i, j] of adj) {
    if (i > j) continue;
    const hi = home.get(i)!;
    const hj = home.get(j)!;
    if (hi.c.type[i] === "CAP" || hj.c.type[j] === "CAP") continue;
    let t = seamTurn(faces[i]!, hi, faces[j]!, hj);
    // over the top / under the bottom of one upright chart: a pole held by an edge, crossed — the half turn
    const over = hi.mode === "WORLD" && hj.mode === "WORLD" ? W : hi.c === hj.c && hi.mode === hj.mode ? hi.c : null;
    if (over !== null) { const e = shareEdge(faces[i]!, faces[j]!)!.map(over.toF); const end = [over.top, over.bottom].find((x) => x.kind === "EDGE" && Math.abs(e[0]![1] - x.y) < TOL_H && Math.abs(e[1]![1] - x.y) < TOL_H); if (end !== undefined) t = 180; }
    count(t);
  }
  const rollMax = Math.max(0, ...faces.map((f, i) => (home.get(i)!.mode === "WORLD" ? 0 : costOn(f, home.get(i)!))));
  const glassMax = Math.max(0, ...faces.map((f, i) => (home.get(i)!.mode === "WORLD" && home.get(i)!.c !== W && home.get(i)!.c !== R ? costOn(f, home.get(i)!) : 0)));
  const all = [...stats.map((x) => x.s), ...capStats];
  const row: Row = {
    name, faces: N, builtLeaps: built.leap, builtStall: built.stallPct, builtMax: built.maxMm, brokenW,
    frames: used.map((u) => `${u.h.mode === "WORLD" ? "WORLD" : "AXIS"} [${u.h.c.a.map((x) => (Math.abs(x) < 5e-3 ? 0 : x).toFixed(2)).join(",")}] × ${u.f.length}`).join("; ") || "—",
    rings: ringsOf().length, leaps: all.reduce((s, x) => s + x.leap, 0), stall: Math.max(0, ...all.map((x) => x.stallPct)), maxMm: Math.max(0, ...all.map((x) => x.maxMm)),
    cover: `${Math.min(...stats.map((x) => x.s.coverLo)).toFixed(2)}–${Math.max(...stats.map((x) => x.s.coverHi)).toFixed(2)}`, roll: rollMax, glass: glassMax, half, quarter, sqMax: Math.max(0, ...stats.map((x) => x.s.sqMax)), caps: capNote.join(", ") || "—",
  };
  rows.push(row);
  const kinds = (c: Chart, fs: number[]): string => { const k = new Map<string, number>(); for (const i of fs) k.set(c.type[i]!, (k.get(c.type[i]!) ?? 0) + 1); return [...k.entries()].map(([x, y]) => `${y} ${x}`).join(", "); };
  console.log(`\n=== ${name}`);
  console.log(`  ${N} faces; top ${W.top.kind}, bottom ${W.bottom.kind}; pitch levels [${W.lv.p.map((p) => (p / D).toFixed(0)).join(", ")}]°; ${charts.length} candidate frames`);
  console.log(`  as built (the world's map, every face): steps moving nothing ${built.stallPct.toFixed(1)} %, leaps ${built.leap}, largest step ${built.maxMm.toFixed(0)} mm`);
  console.log(`  gravity's chart: ${kinds(W, faces.map((_, i) => i))}`);
  for (const x of stats) console.log(`  ${x.label}: ${x.faces.length} faces (${kinds(home.get(x.faces[0]!)!.c, x.faces)}) — steps moving nothing ${x.s.stallPct.toFixed(2)} %, leaps ${x.s.leap}, largest step ${x.s.maxMm.toFixed(1)} mm, cover ${x.s.coverLo.toFixed(2)}–${x.s.coverHi.toFixed(2)}, off square ${x.s.sqMean.toFixed(1)}° mean ${x.s.sqMax.toFixed(0)}° max, round trip ${x.s.rtMm.toFixed(3)} mm`);
  for (const u of used) console.log(`    frame ${u.h.c.name} held ${u.h.mode}: ${u.h.mode === "WORLD" ? "sections turned on the glass" : "camera roll"} ≤ ${Math.max(...u.f.map((i) => costOn(faces[i]!, u.h))).toFixed(0)}°, top ${u.h.c.top.kind}, bottom ${u.h.c.bottom.kind}, levels [${u.h.c.lv.p.map((p) => (p / D).toFixed(0)).join(", ")}]°`);
  if (capNote.length) console.log(`  caps' square layouts: ${capNote.join("; ")}${capStats.length ? ` — on them: leaps ${capStats.reduce((s, x) => s + x.leap, 0)}, steps moving nothing ≤ ${Math.max(...capStats.map((x) => x.stallPct)).toFixed(2)} %, off square ≤ ${Math.max(...capStats.map((x) => x.sqMax)).toFixed(0)}°; per layout the exits: ${(exits.none / exits.layouts).toFixed(1)} with no turn, ${(exits.quarter / exits.layouts).toFixed(1)} a turn, ${(exits.half / exits.layouts).toFixed(1)} a half turn` : ""}`);
  console.log(`  seams between faces (caps apart): half turns ${half}, turns over ${SEAM_OK}° ${quarter}, small turns ${small}; the camera's constant roll ≤ ${rollMax.toFixed(0)}°, the sections turned on the glass ≤ ${glassMax.toFixed(0)}°`);
  if (process.env.EXPORT && key) {
    const list: Chart[] = [];
    const idx = (c: Chart): number => { let k = list.indexOf(c); if (k < 0) { list.push(c); k = list.length - 1; } return k; };
    const facesOut = faces.map((f, i) => ({ p: f.pts, n: f.n, home: idx(home.get(i)!.c), mode: home.get(i)!.mode, kind: home.get(i)!.c.type[i] }));
    const caps: Record<string, { chart: number; mode: Mode }[]> = {};
    for (const [i, l] of capHomes) if (l.length) caps[String(i)] = l.map((h) => ({ chart: idx(h.c), mode: h.mode }));
    const chartsOut = list.map((c) => ({ label: c.name, rings: c.rings, a: c.a, ex: c.ex, ez: c.ez, sides: c.sides.map((x) => ({ i: x.i, n: x.n, t: x.t, b: x.b, e: x.e, tb: x.tb, tLo: x.tLo, tHi: x.tHi, bLo: x.bLo, bHi: x.bHi, rect: x.rect, yLo: x.yLo, yHi: x.yHi, pts: x.pts })), sideOf: c.sideOf, colOf: c.colOf, cols: c.cols, lv: c.lv, top: c.top, bottom: c.bottom, type: c.type }));
    const check = list.flatMap((c, ci) => [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const yaw = (20 + 47 * k) * D; const pitch = (-70 + 19 * k) * D; const t = target(c, yaw, pitch); const q = anglesOf(c, t.f, t.p); return { c: ci, yaw, pitch, f: t.f, p: t.p, back: q }; }));
    exported.push({ key, name, faces: facesOut, charts: chartsOut, caps, built, check });
  }
  if (process.env.VERBOSE) faces.forEach((f, i) => console.log(`    face ${i}: ${f.pts.length}-gon, elev ${(Math.asin(f.n[1]) / D).toFixed(0)}°, W ${W.type[i]} → ${home.get(i)!.c.name} ${home.get(i)!.mode} (${home.get(i)!.c.type[i]})`));
}

/** the prototype against the built map, where both must agree: the same places, to the rounding */
function agree(name: string, polys: V[][], a: V): void {
  const faces = contourOf(polys);
  const c = buildChart(faces, a, "built");
  // the built map in the same frame: the faces turned into it
  const turnedPolys = polys.map((p) => p.map(c.toF));
  const map = L.mapOf(turnedPolys);
  let mx = 0;
  for (let iy = 0; iy < 720; iy++) for (let ip = 0; ip <= 360; ip++) { const yaw = iy * 0.5 * D; const pitch = -H + ip * 0.5 * D; const d = dist(c.toF(target(c, yaw, pitch).p), mapTarget(map, yaw, pitch, OPTS).surface as V); if (d > mx) mx = d; }
  console.log(`  ${name}: the prototype (the built scale) against the built map, 260 000 angles: ${(mx * 1000).toExponential(1)} mm apart at most`);
}

const only = process.env.ONLY;
const run = (name: string, polys: () => V[][], key?: string): void => { if (process.env.EXPORT ? key !== undefined : !only || name.includes(only)) report(name, polys(), key); };

console.log("THE PROTOTYPE AGAINST THE BUILT MAP");
if (!only && !process.env.EXPORT) {
  agree("cube (Scene_1's box)", L.hullPolys(L.boxPts(0.483, 0.483, 0.483)), Y);
  agree("heptagon lying, flat ends (Scene_0)", L.tippedPolys(7, 0), Y);
  agree("heptagon lying with tips (Scene_0bis), in its zone's frame", L.tippedPolys(7, 0.12), [1, 0, 0]);
}

for (const s of SHAPES) run(s.name, s.polys, s.key);

console.log("\n\nSUMMARY — as built → with the charts (on each chart's own faces)");
console.log("shape | faces | built: leaps · stalls % · largest mm | broken under gravity | frames added | faces on rings | charts: leaps · stalls % · largest mm · cover | off square max | roll · on the glass | half turns · turns | caps");
for (const r of rows) console.log(`${r.name} | ${r.faces} | ${r.builtLeaps} · ${r.builtStall.toFixed(1)} · ${r.builtMax.toFixed(0)} | ${r.brokenW} | ${r.frames} | ${r.rings} | ${r.leaps} · ${r.stall.toFixed(2)} · ${r.maxMm.toFixed(0)} · ${r.cover} | ${r.sqMax.toFixed(0)}° | ${r.roll.toFixed(0)}° · ${r.glass.toFixed(0)}° | ${r.half} · ${r.quarter} | ${r.caps}`);
if (process.env.EXPORT) { writeFileSync(process.env.EXPORT, JSON.stringify(exported)); console.log(`exported ${exported.length} shapes to ${process.env.EXPORT}`); }
