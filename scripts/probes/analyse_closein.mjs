// ⭐⭐⭐ THE CLOSE-IN ANALYSER (2026-11-08, scope §32): every recording in <dir> (orbit_probe.mjs MODE=walk APPROACHES=1 LAND_EVERY=…), frame by frame.
//   JUMP     the gizmo stepping > 15 mm and > 3x the place's step + 5 mm between two frames of ONE chart (a new chart is an appearance, not a jump)
//   AGAINST  the gizmo moving > 1 mm against the place's own step (the finger's way) within one chart
//   STILL    the gizmo standing while the place moves on >= 20 mm (a wait)
//   BLOCK    frames under the close-in area's stop (the HUD's verdict), and whether the place moved under it
//   LINES    each drawn line's planarity (its smallest extent, mm — ⛔ > 0.6) and the gizmo's distance to each (mm — the lift is 2)
//   PIECE / CAMERA  a step > 40 mm and > 3x the place's step + 15 mm in one frame while close in (a jump of the piece or the camera)
//   LAND     the simulated A + dy landing: the piece's anchor across the gizmo's normal (lat, mm) and along it (along, mm)
//   FAR      frames far out with a gizmo shown (⛔ must be 0)
import { readFileSync, readdirSync, existsSync } from "node:fs";
const dir = process.argv[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a) => Math.hypot(...a), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const pct = (xs, p) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] : null);
const C = { frames: 0, closeIn: 0, gizmoOn: 0, far: 0, charts: 0, jump: 0, against: 0, still: 0, block: 0, blockMoved: 0, piece: 0, camera: 0, errors: 0, planeBad: 0 };
const ex = { jump: [], against: [], still: [], piece: [], camera: [], far: [], planeBad: [] };
const push = (k, s) => { if (ex[k].length < 8) ex[k].push(s); };
const lp = [[], []], ld = [[], []], lat = [], along = [], miss = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith("_land.json")).sort()) {
  const D = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  C.errors += D.errors ?? 0;
  const R = D.rows;
  const name = f.replace(".json", "");
  let chartKey = null, still = 0, stillMoved = 0;
  for (let i = 1; i < R.length; i++) {
    const r = R[i], q = R[i - 1];
    C.frames++;
    const ci = r.ci;
    if (!ci) continue;
    if (ci[0]) C.closeIn++;
    if (ci[6]) C.gizmoOn++;
    if (!ci[0] && ci[6]) { C.far++; push("far", `${name}@${i} ${r.leg}`); }
    const key = ci[1] >= 0 ? `${ci[1]}|${ci[2]}|${ci[3]}` : null;
    if (key !== null && key !== chartKey) C.charts++;
    const same = key !== null && key === chartKey && q.ci && q.ci[6] && ci[6];
    chartKey = key;
    if (/close-in area/.test(String(r.v))) { C.block++; if (r.gm && q.gm && len(sub(r.gm, q.gm)) > 0.0005) C.blockMoved++; }
    // a piece / camera step > 3x the place's own step + 15 mm (and > 40 mm): not the orbit's pace — a jump
    const pm = r.gm && q.gm ? len(sub(r.gm, q.gm)) : 0;
    if (ci[0] && r.p && q.p && len(sub(r.p, q.p)) > Math.max(0.04, 3 * pm + 0.015)) { C.piece++; push("piece", `${name}@${i} ${r.leg} ${(len(sub(r.p, q.p)) * 1000).toFixed(0)} mm, place ${(pm * 1000).toFixed(0)} mm`); }
    if (ci[0] && r.c && q.c && len(sub(r.c, q.c)) > Math.max(0.04, 3 * pm + 0.015)) { C.camera++; push("camera", `${name}@${i} ${r.leg} ${(len(sub(r.c, q.c)) * 1000).toFixed(0)} mm, place ${(pm * 1000).toFixed(0)} mm`); }
    if (r.lp && ci[6]) for (let k = 0; k < 2; k++) if (r.lp[k]) { lp[k].push(r.lp[k][0]); if (r.lp[k][0] > 0.6) { C.planeBad++; push("planeBad", `${name}@${i} line ${k} ${r.lp[k][0]} mm`); } }
    if (r.ld && ci[6]) for (let k = 0; k < 2; k++) if (r.ld[k] < 1) ld[k].push(r.ld[k] * 1000);
    if (!same || !r.g || !q.g || !r.gm || !q.gm) { still = 0; stillMoved = 0; continue; }
    const dg = sub(r.g, q.g), dm = sub(r.gm, q.gm);
    const lg = len(dg), lm = len(dm);
    if (lg > 0.015 && lg > 3 * lm + 0.005) { C.jump++; push("jump", `${name}@${i} ${r.leg} gizmo ${(lg * 1000).toFixed(0)} mm, place ${(lm * 1000).toFixed(1)} mm`); }
    if (lg > 0.001 && lm > 0.0005 && dot(dg, dm) < 0) { C.against++; push("against", `${name}@${i} ${r.leg} gizmo ${(lg * 1000).toFixed(1)} mm against the place's ${(lm * 1000).toFixed(1)}`); }
    if (lg < 0.0002) { still++; stillMoved += lm; } else { if (stillMoved > 0.02) { C.still++; push("still", `${name}@${i} ${r.leg} place ${(stillMoved * 1000).toFixed(0)} mm under a still gizmo (${still} frames)`); } still = 0; stillMoved = 0; }
  }
  const lf = `${dir}/${name}_land.json`;
  if (existsSync(lf)) for (const l of JSON.parse(readFileSync(lf, "utf8"))) { lat.push(l.lat); along.push(l.along); miss.push(l.miss); }
}
console.log(JSON.stringify(C));
const q = (xs) => (xs.length ? `n ${xs.length} median ${pct(xs, 0.5).toFixed(2)} p95 ${pct(xs, 0.95).toFixed(2)} max ${Math.max(...xs).toFixed(2)}` : "none");
console.log("LINES planarity (mm) green:", q(lp[0]), "| red:", q(lp[1]));
console.log("LINES gizmo distance (mm) green:", q(ld[0]), "| red:", q(ld[1]));
console.log("LAND lat (mm):", q(lat), "| along (mm):", q(along));
for (const [k, v] of Object.entries(ex)) if (v.length) console.log(`${k}:\n  ${v.join("\n  ")}`);
