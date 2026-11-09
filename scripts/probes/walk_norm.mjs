// ⭐⭐ THE WALKS, NORMALISED BY THE INPUT (POLAR_ORBIT_CLEANUP.md §6) — headless input is bursty (an event every 2 – 3 frames) and a tremble steps the angles
// back and forth, so a raw jump / back-and-forth count measures the INPUT as much as the orbit. Here each frame's motion is set against the map angles'
// own change (`mq`, what the gizmo is a function of):
//   MAP-STEP      the gizmo stepped > 15 mm at more than `RATE` mm per degree of the map's angles — a discontinuity of the map, not the input's size
//   MAP-REVERSAL  the gizmo reversed (> 4 mm back within 6 frames) while the map's angles went ONE way — the map folding back (I14's mechanism), not a tremble
//   SOLVE-REVERSAL the solved angles (`pq`) reversed while the orbit's target (`ov`) went one way — the solver's own back-and-forth
//   PIECE-STEP    the piece stepped > 15 mm at more than 3 × its ring's own rate (its distance to the gizmo × the angle) — a jump of the piece's place
// Usage: node scripts/probes/walk_norm.mjs a.json,b.json,… [c.json,…]   (two sets: before / after, side by side)
import { readFileSync } from "node:fs";

const RATE = 25; // mm per degree: the cube's faces run 5.4 – 6.7 mm/°, an edge band less
const sets = process.argv.slice(2).filter((a) => !a.startsWith("--")).map((arg) => arg.split(",").flatMap((f) => JSON.parse(readFileSync(f, "utf8")).results));
const len = (a) => Math.hypot(...a);
const sub = (a, b) => a.map((x, k) => x - b[k]);
const dot = (a, b) => a.reduce((s, x, k) => s + x * b[k], 0);
const D = 180 / Math.PI;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function analyse(sc) {
  const R = sc.rows.filter((r) => r.g && r.p && r.mq && r.pq && r.leg !== "boot" && !r.leg.startsWith("reset"));
  const out = { MAP_STEP: 0, MAP_REVERSAL: 0, SOLVE_REVERSAL: 0, PIECE_STEP: 0, where: [] };
  const ang = (a, b) => Math.hypot(wrap(b.mq[0] - a.mq[0]) * Math.cos(a.mq[1]), b.mq[1] - a.mq[1]) * D; // the map's angle change (deg, on the sphere)
  for (let i = 1; i < R.length; i++) {
    const a = R[i - 1], b = R[i];
    if (a.leg !== b.leg) continue;
    const s = len(sub(b.g, a.g)) * 1000;
    const da = ang(a, b);
    if (s > 15 && s > RATE * Math.max(da, 1e-6)) { out.MAP_STEP++; if (out.where.length < 30) out.where.push(`MAP-STEP ${s.toFixed(0)} mm for ${da.toFixed(2)}° at g(${b.g.map((x) => (x * 1000).toFixed(0))}) mq(${(b.mq[0] * D).toFixed(1)}, ${(b.mq[1] * D).toFixed(1)})`); }
    const dp = len(sub(b.p, a.p)) * 1000;
    const arm = len(sub(a.p, a.g)) * 1000;
    const dq = Math.hypot(wrap(b.pq[0] - a.pq[0]), (b.pq[1] - a.pq[1]) * Math.PI) * D;
    if (dp > 15 && dp > 3 * arm * (dq / D) + 5) out.PIECE_STEP++;
  }
  // reversals: a step of the gizmo, then within 6 frames back past 4 mm of where it left, the map's angles monotone over the window
  for (let i = 1; i < R.length - 1; i++) {
    const d0 = sub(R[i].g, R[i - 1].g);
    if (len(d0) < 0.004) continue;
    for (let k = i + 1; k <= i + 6 && k < R.length; k++) {
      if (R[k].leg !== R[i].leg) break;
      const back = sub(R[k].g, R[i].g);
      if (dot(back, d0) < -0.7 * len(back) * len(d0) && len(back) > 0.004) {
        const y = R.slice(i - 1, k + 1).map((r) => r.mq[0]), p = R.slice(i - 1, k + 1).map((r) => r.mq[1]);
        const mono = (xs) => { let up = 0, dn = 0; for (let j = 1; j < xs.length; j++) { const d = wrap(xs[j] - xs[j - 1]); if (d > 1e-9) up++; if (d < -1e-9) dn++; } return up === 0 || dn === 0; };
        if (mono(y) && mono(p)) { out.MAP_REVERSAL++; if (out.where.length < 30) out.where.push(`MAP-REVERSAL ${(len(d0) * 1000).toFixed(0)} mm at g(${R[i].g.map((x) => (x * 1000).toFixed(0))}) mq(${(R[i].mq[0] * D).toFixed(1)}, ${(R[i].mq[1] * D).toFixed(1)})`); }
        break;
      }
    }
  }
  for (let i = 2; i < R.length; i++) {
    if (R[i].leg !== R[i - 2].leg || !Array.isArray(R[i].fd)) continue;
    const t1 = wrap(R[i - 1].ov[0] - R[i - 2].ov[0]), t2 = wrap(R[i].ov[0] - R[i - 1].ov[0]);
    const q1 = wrap(R[i - 1].pq[0] - R[i - 2].pq[0]), q2 = wrap(R[i].pq[0] - R[i - 1].pq[0]);
    // the target moving ONE way over both steps (⛔ a zero first step let a tremble's own reversal through)
    if (t1 * t2 > 0 && q1 * q2 < 0 && Math.abs(q1) > 1e-3 && Math.abs(q2) > 1e-3) out.SOLVE_REVERSAL++;
  }
  return out;
}
const names = [...new Set(sets.flat().map((s) => s.name))];
const tot = sets.map(() => ({ MAP_STEP: 0, MAP_REVERSAL: 0, SOLVE_REVERSAL: 0, PIECE_STEP: 0 }));
for (const name of names) {
  const cols = sets.map((set, k) => {
    const sc = set.find((s) => s.name === name);
    if (!sc) return "—";
    const o = analyse(sc);
    for (const key of Object.keys(tot[k])) tot[k][key] += o[key];
    return `map-step ${o.MAP_STEP} map-rev ${o.MAP_REVERSAL} solve-rev ${o.SOLVE_REVERSAL} piece-step ${o.PIECE_STEP}${process.argv.includes("--where") ? "\n      " + o.where.join("\n      ") : ""}`;
  });
  console.log(`${name.padEnd(22)} ${cols.join("  ||  ")}`);
}
console.log(`TOTAL ${tot.map((t) => JSON.stringify(t)).join("  →  ")}`);
