// T1 (throwaway): does a square bipyramid with a thin band, laid on a triangle face, go to RINGS? (the nearest BodySpec makes to an octahedron on a face)
import { assignCharts, chartContour } from "../../src/input/orbit_charts";
import { hullPolys, mapOf, floored, type V } from "./shapes_lib";
const s = 0.35, band = +(process.env.BAND ?? 0.005), t = s / Math.SQRT2;
const raw: V[] = [];
for (const [x, y] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) for (const z of [-band / 2, band / 2]) raw.push([(x * s) / 2, (y * s) / 2, z]);
raw.push([0, 0, band / 2 + t], [0, 0, -band / 2 - t]);
const a = (180 - (Math.atan2(1, Math.SQRT2) * 180) / Math.PI) * Math.PI / 180;
const rx = (v: V): V => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
const pts = floored(raw.map(rx));
const m = mapOf(hullPolys(pts));
const c = chartContour(m);
const as = assignCharts(c);
console.log(`band ${band}: contour ${c.length} faces; broken by gravity ${as.brokenByGravity}; homes: ${as.home.map((h, i) => `${i}:${h.rings ? "RINGS" : h.frame < 0 ? "grav" : "f" + h.frame}/${as.kind[i]}/ny${c[i]!.n[1].toFixed(2)}`).join(" ")}`);
console.log(`frames used ${as.used.length}; caps with layouts ${[...as.layouts.keys()].join(",")}`);
for (const p of hullPolys(pts)) { const u = [p[1]![0] - p[0]![0], p[1]![1] - p[0]![1], p[1]![2] - p[0]![2]], w = [p[2]![0] - p[0]![0], p[2]![1] - p[0]![1], p[2]![2] - p[0]![2]]; const n = [u[1]! * w[2]! - u[2]! * w[1]!, u[2]! * w[0]! - u[0]! * w[2]!, u[0]! * w[1]! - u[1]! * w[0]!]; const l = Math.hypot(...n); if (process.env.DBG) console.log(n.map((x) => (x / l).toFixed(3)).join(",")); }
console.log(m.facets.map((f) => `${f.real ? "R" : "v"} n ${f.n.map((x) => x.toFixed(2)).join(",")}`).join(" | "));
