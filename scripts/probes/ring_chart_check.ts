// ⭐⭐⭐ THE RINGS PORT'S CHECK (2026-11-15, `ORBIT_CHARTS.md` §7.2 step 1.3) — `src/input/ring_chart.ts` against the prototype (`chart_lib.ts`'s
// `buildChart(contourOf(polys), [0, 1, 0], "normals", true)`, `target`) on the 35 shapes of `SHAPES`, in gravity's frame. The port is built from the
// WORLD face map of the same shape (`shapes_lib.ts`'s `mapOf`): the DEFAULT layout, because the prototype's own `contourOf` reads that map, so the
// contour indices match one for one. The layout does not matter to the rings — they read only the map's real facets: checked below against the map
// built with layout "chart" (scale "normals"), the same faces corner for corner within 1e-9 m (on three shapes in another order), the places within
// 1e-9 m on a 5° grid, on the same face or on an edge of both. Gated: the ends (kind, cap, centre, height), the levels (heights and pitches,
// ≤ 1e-9), and on a 1° grid of (yaw, pitch) the same face (the prototype's contour index through `chartContour`'s `index`) and the point within
// 1e-9 m; the port's round trip place → `ringAngles` → `ringTarget` within 1e-9 m. Not gated, printed: the prototype's way back (`anglesOf`)
// brought to its place by the port — 0.2 µm on the shed (the rim's meridian is about the slanted spine, `anglesOf` reads the azimuth about the cap's
// centre; the port solves it). With the cost per call (µs, the grid's mean over three runs after a warm-up).
// Run: npx vite-node scripts/probes/ring_chart_check.ts
import { buildFaceMap, DEFAULT_FACET_OPTS } from "../../src/input/face_map";
import { chartContour } from "../../src/input/orbit_charts";
import { buildRingChart, ringAngles, ringTarget } from "../../src/input/ring_chart";
import type { Vec3 } from "../../src/core/vec";
import { anglesOf, buildChart, contourOf, SHAPES, target, Y } from "./chart_lib";
import { D, facesOf, mapOf, type V } from "./shapes_lib";

const GATE = 1e-9;
const dist = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
let fail = 0;
const worst = { pt: 0, lv: 0, rt: 0, ref: 0 };
for (const sh of SHAPES) {
  const polys = sh.polys();
  const errs: string[] = [];
  const err = (s: string): void => {
    if (errs.length < 6) errs.push(s);
  };
  const map = mapOf(polys);
  const contour = chartContour(map);
  const C = buildRingChart(map, contour);
  const R = buildChart(contourOf(polys), Y, "normals", true);
  // the ends
  for (const [pe, re, nm] of [[C.top, R.top, "top"], [C.bottom, R.bottom, "bottom"]] as const) {
    if (pe.kind !== re.kind || pe.cap !== re.cap) err(`${nm}: ${pe.kind} ${pe.cap} vs ${re.kind} ${re.cap}`);
    if (!(dist(pe.centre, R.fromF(re.centre)) <= GATE)) err(`${nm} centre`);
    if (!(Math.abs(pe.y - re.y) <= GATE)) err(`${nm} height`);
  }
  let worstRef = 0;
  // the levels
  let lvGap = 0;
  if (C.levels.y.length !== R.lv.y.length) err(`levels: ${C.levels.y.length} vs ${R.lv.y.length}`);
  else
    for (let k = 0; k < C.levels.y.length; k++) {
      lvGap = Math.max(lvGap, Math.abs(C.levels.y[k]! - R.lv.y[k]!), Math.abs(C.levels.p[k]! - R.lv.p[k]!));
    }
  if (!(lvGap <= GATE)) err(`levels gap ${lvGap}`);
  // the grid
  let ptGap = 0;
  let rtGap = 0;
  let faceBad = 0;
  let none = 0;
  let firstBad = "";
  for (let iy = 0; iy < 360; iy++)
    for (let ip = -90; ip <= 90; ip++) {
      const yaw = iy * D;
      const pitch = ip * D;
      const r = target(R, yaw, pitch);
      const t = ringTarget(C, yaw, pitch);
      const rf = r.f >= 0 ? contour[r.f]!.index : -1;
      if (rf !== t.stack) {
        faceBad++;
        if (firstBad === "") firstBad = `yaw ${iy}° pitch ${ip}°: facet ${t.stack} vs ${rf}`;
      }
      ptGap = Math.max(ptGap, dist(t.surface, R.fromF(r.p as Vec3)));
      if (t.stack < 0) {
        none++;
        continue;
      }
      const a = ringAngles(C, t.surface, t.stack);
      rtGap = Math.max(rtGap, dist(ringTarget(C, a.yaw, a.pitch).surface, t.surface));
    }
  if (faceBad > 0) err(`${faceBad} places on another face (first: ${firstBad})`);
  if (!(ptGap <= GATE)) err(`point gap ${ptGap.toExponential(2)} m`);
  if (!(rtGap <= GATE)) err(`round trip ${rtGap.toExponential(2)} m`);
  // the layout does not matter: the contour of the map built with layout "chart" (scale "normals") is the same, and so are the places
  const { faces, box } = facesOf(polys);
  const mapC = buildFaceMap(faces, { lo: box.lo as Vec3, hi: box.hi as Vec3 }, { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" });
  const contourC = chartContour(mapC);
  // (the same faces, in another order: matched by their corners as sets, within the gate: the clip in another order rounds otherwise)
  const sameFace = (f: { pts: readonly Vec3[] }, g: { pts: readonly Vec3[] }): boolean => f.pts.length === g.pts.length && f.pts.every((p) => g.pts.some((q) => dist(p, q) <= GATE));
  const match = contour.map((f) => contourC.findIndex((g) => sameFace(f, g)));
  if (contourC.length !== contour.length || match.some((j) => j < 0) || new Set(match).size !== match.length) err(`the contour differs with layout "chart"`);
  else {
    const CC = buildRingChart(mapC, contourC);
    let worstC = 0;
    for (let iy = 0; iy < 360; iy += 5)
      for (let ip = -90; ip <= 90; ip += 5) {
        const a = ringTarget(C, iy * D, ip * D);
        const b = ringTarget(CC, iy * D, ip * D);
        worstC = Math.max(worstC, dist(a.surface, b.surface));
        const ja = a.stack >= 0 ? match[C.contourIndex[a.stack]!]! : -1;
        const jb = b.stack >= 0 ? CC.contourIndex[b.stack]! : -1;
        // another face only where the place is on both (an edge between them)
        const onBoth = ja >= 0 && jb >= 0 && Math.abs(contourC[jb]!.n.reduce((s, x, k) => s + x * (a.surface[k]! - contourC[jb]!.pts[0]![k]!), 0)) <= GATE;
        if (ja !== jb && !onBoth) err(`layout "chart": another face at yaw ${iy}°, pitch ${ip}°`);
      }
    if (!(worstC <= GATE)) err(`layout "chart": a place ${worstC.toExponential(2)} m away`);
  }
  // not gated: the port's way back against the prototype's (`anglesOf`), each brought to its place by the port
  for (let iy = 0; iy < 360; iy += 3)
    for (let ip = -90; ip <= 90; ip += 3) {
      const t = ringTarget(C, iy * D, ip * D);
      if (t.stack < 0) continue;
      const q = anglesOf(R, C.contourIndex[t.stack]!, R.toF(t.surface as V));
      worstRef = Math.max(worstRef, dist(ringTarget(C, q.yaw, q.pitch).surface, t.surface));
    }
  // the cost per call
  const runs: number[] = [];
  const runsBack: number[] = [];
  let sink = 0;
  for (let r = 0; r < 4; r++) {
    const t0 = performance.now();
    for (let iy = 0; iy < 360; iy++) for (let ip = -90; ip <= 90; ip++) sink += ringTarget(C, iy * D, ip * D).surface[1];
    const t1 = performance.now();
    if (r > 0) runs.push(((t1 - t0) * 1000) / (360 * 181));
  }
  const back = [];
  for (let iy = 0; iy < 360; iy += 3) for (let ip = -90; ip <= 90; ip += 3) back.push(ringTarget(C, iy * D, ip * D));
  for (let r = 0; r < 4; r++) {
    const t0 = performance.now();
    for (const t of back) sink += ringAngles(C, t.surface, t.stack).pitch;
    const t1 = performance.now();
    if (r > 0) runsBack.push(((t1 - t0) * 1000) / back.length);
  }
  const us = runs.reduce((s, x) => s + x, 0) / runs.length;
  const usBack = runsBack.reduce((s, x) => s + x, 0) / runsBack.length;
  void sink;
  worst.pt = Math.max(worst.pt, ptGap);
  worst.lv = Math.max(worst.lv, lvGap);
  worst.rt = Math.max(worst.rt, rtGap);
  worst.ref = Math.max(worst.ref, worstRef);
  const line = `${sh.name}: ${contour.length} faces, ${C.levels.y.length} levels, ends ${C.bottom.kind}/${C.top.kind}; point ${ptGap.toExponential(1)} m, levels ${lvGap.toExponential(1)}, round trip ${rtGap.toExponential(1)} m (the prototype's way back ${worstRef.toExponential(1)} m)${none ? `, ${none} places on no face` : ""} — ${us.toFixed(2)} µs a place, ${usBack.toFixed(2)} µs the way back`;
  if (errs.length > 0) {
    fail++;
    console.log(`FAIL ${line}\n     ${errs.join("\n     ")}`);
  } else console.log(`ok   ${line}`);
}
console.log(`the worst gaps: point ${worst.pt.toExponential(2)} m, levels ${worst.lv.toExponential(2)}, round trip ${worst.rt.toExponential(2)} m (gate ${GATE}); not gated — the prototype's way back, its place by the port: ${worst.ref.toExponential(2)} m`);
console.log(fail === 0 ? "PASS" : `FAIL (${fail} shape(s))`);
