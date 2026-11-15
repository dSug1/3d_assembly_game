// ⭐⭐⭐ THE CHART PORT'S CHECK (2026-11-15, `ORBIT_CHARTS.md` §7.2 step 1.1) — `buildFaceMap`'s layout "chart" (both scales) against the prototype
// (`chart_lib.ts`'s `buildChart` / `target`), on the 35 shapes of `SHAPES`, in gravity's frame and in every frame `assignCharts` uses there (its `used`
// frames and the caps' square layouts). On a 1° grid of (yaw, pitch), wherever the prototype's place is on a face its chart does not break: the port's
// place, brought back to the world, within 1e-9 m of the prototype's; and the port's own round trip (`mapAngles` → `mapTarget`) within 1e-9 m.
// ⚠ The box in a frame is the bounds of the prototype's CONTOUR turned into it (its facets' polygons), not `tiltBox` (the world box's turned corners) nor
// the turned faces' own bounds: D5's greedy test reads every candidate's polygon in the box — a box looser than the shape (a frame at 45° to it) drops
// the first candidate and then every one, the map all virtual (the heptagon at 45°, the crossed heptagons: no real facet with `tiltBox`); and the
// contour reaches past the faces where the clustering merged a face's plane into another facet (the crossed heptagons: 38 facets for the hull's 42
// planes, the contour 0.65 mm lower than the faces in the frame [-0.71, 0, 0.71]) — the faces' bounds cut it there (a 2.75 mm gap).
// Run: npx vite-node scripts/probes/chart_port_check.ts
import { buildFaceMap, DEFAULT_FACET_OPTS, mapAngles, mapTarget } from "../../src/input/face_map";
import { zoneFrame } from "../../src/input/polar_zone";
import { mulM, mulT, tiltFaces } from "../../src/input/orbit_tilt";
import type { Vec3 } from "../../src/core/vec";
import { assignCharts, buildChart, contourOf, OPTS, SHAPES, target, Y } from "./chart_lib";
import { facesOf, D, type V } from "./shapes_lib";

const GATE = 1e-9;
let fail = 0;
let worstAll = 0;
let bestWorst = Infinity;
for (const sh of SHAPES) {
  const polys = sh.polys();
  const contour = contourOf(polys);
  const A = assignCharts(contour);
  const axes: V[] = [Y];
  const addAxis = (a: V): void => {
    if (!axes.some((b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-12)) axes.push(a);
  };
  for (const u of A.used) addAxis(u.h.c.a);
  for (const hs of A.capHomes.values()) for (const h of hs) addAxis(h.c.a);
  const { faces } = facesOf(polys);
  let worst = 0;
  let worstRt = 0;
  let n = 0;
  let where = "";
  for (const axis of axes)
    for (const scale of ["built", "normals"] as const) {
      const ref = buildChart(contour, axis, scale);
      const R = zoneFrame(axis as Vec3);
      const inF = tiltFaces(faces, R);
      const vs = contour.flatMap((f) => f.pts.map((p) => mulT(R, p as Vec3)));
      const lo: Vec3 = [Math.min(...vs.map((v) => v[0])), Math.min(...vs.map((v) => v[1])), Math.min(...vs.map((v) => v[2]))];
      const hi: Vec3 = [Math.max(...vs.map((v) => v[0])), Math.max(...vs.map((v) => v[1])), Math.max(...vs.map((v) => v[2]))];
      const map = buildFaceMap(inF, { lo, hi }, { ...DEFAULT_FACET_OPTS, layout: "chart", scale });
      for (let iy = 0; iy < 360; iy++)
        for (let ip = -90; ip <= 90; ip++) {
          const yaw = iy * D;
          const pitch = ip * D;
          const t = target(ref, yaw, pitch);
          if (t.f < 0 || ref.type[t.f] === "BROKEN") continue;
          n++;
          const m = mapTarget(map, yaw, pitch, OPTS);
          const w = mulM(R, m.surface);
          const g = Math.hypot(w[0] - t.p[0], w[1] - t.p[1], w[2] - t.p[2]);
          if (!(g <= worst)) {
            worst = Number.isNaN(g) ? Infinity : g;
            where = `${ref.name} ${scale} yaw ${iy} pitch ${ip} (face ${t.f} ${ref.type[t.f]}, port facet ${m.stack})`;
          }
          const back = mapAngles(map, m.surface, m.stack, OPTS);
          const r = mapTarget(map, back.yaw, back.pitch, OPTS).surface;
          const gr = Math.hypot(r[0] - m.surface[0], r[1] - m.surface[1], r[2] - m.surface[2]);
          if (!(gr <= worstRt)) worstRt = Number.isNaN(gr) ? Infinity : gr;
        }
    }
  // a shape every frame breaks whole (no place served) has nothing to compare: noted, not failed
  const bad = worst > GATE || worstRt > GATE;
  if (bad) fail++;
  worstAll = Math.max(worstAll, worst, worstRt);
  bestWorst = Math.min(bestWorst, Math.max(worst, worstRt));
  console.log(`${bad ? "FAIL" : n === 0 ? "none" : "ok  "} ${sh.name}: ${axes.length} frame(s), ${n} places, worst ${worst.toExponential(2)} m, round trip ${worstRt.toExponential(2)} m${bad ? ` — at ${where}` : ""}`);
}
console.log(`worst gaps per shape: min ${bestWorst.toExponential(2)} m, max ${worstAll.toExponential(2)} m (gate ${GATE} m)`);
console.log(fail === 0 ? "PASS" : `FAIL (${fail} shape(s))`);
