// (copied 2026-11-07 into the repo)
// THE WALK ANALYSER, input-normalised (2026-11-06): every frame of a press (not only around changes), each jump measured against what drives it —
//   RJUMP  the ring (the gizmo) stepping > 15 mm and > 3x the travel's place step + 5 mm in that frame (a gizmo jump not made by the travel)
//          split: LAT (across the face) / DEP (along its normal: a depth step)
//   USPIN  the camera's up turning > 2x its view direction + 5 deg in a frame (the picture spinning, not following the orbit)
//   GSTILL the ring standing while the place moves on >= 20 mm
//   STILLWALL the same on a wall only
// each attributed to what happened in the 12 frames before (a face change, a cap, a hold) and to the frames after a direction change (<= 45) or not.
import { readFileSync, readdirSync } from "node:fs";
const dir = process.argv[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a) => Math.hypot(...a), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const D = 180 / Math.PI;
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) * D;
const isSeg = (r) => /^r\d+\[(-?\d+),(-?\d+)\]$/.test(r?.leg ?? "");
const C = {}, ex = {};
const add = (k, ctx, s) => { (C[k] ??= {})[ctx] = ((C[k] ??= {})[ctx] ?? 0) + 1; if ((ex[k] ??= []).length < 10) ex[k].push(s); };
let frames = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const R = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")).rows;
  const name = f.replace(".json", "");
  let lastChange = -1e9, still = 0, stillMoved = 0;
  for (let i = 1; i < R.length; i++) {
    const r = R[i], q = R[i - 1];
    if (!isSeg(r) || !isSeg(q)) { still = 0; stillMoved = 0; continue; }
    frames++;
    if (r.leg !== q.leg) lastChange = i;
    let ctx = "plain";
    for (let k = Math.max(1, i - 12); k <= i; k++) {
      const a = R[k], b = R[k - 1];
      if (a.lt && b.lt && a.lt[0] !== b.lt[0]) ctx = a.gn && Math.abs(a.gn[1]) > 0.9 ? "onto cap" : "onto wall";
      if (/held/.test(String(a.v)) && ctx === "plain") ctx = "held";
    }
    const after = i - lastChange <= 45 ? "afterChange" : "midSegment";
    const tag = `${name}@${i} ${r.leg} [${ctx}, ${after}] ${String(r.v).slice(7, 40)}`;
    if (r.g && q.g && r.gm && q.gm) {
      const dg = len(sub(r.g, q.g)), dm = len(sub(r.gm, q.gm));
      if (dg > 0.015 && dg > 3 * dm + 0.005) {
        const n = r.gn ?? [0, 0, 0];
        const along = Math.abs(dot(sub(r.g, q.g), n)), lat = Math.sqrt(Math.max(0, dg * dg - along * along));
        add(lat > along ? "RJUMP-LAT" : "RJUMP-DEP", `${ctx}/${after}`, `${tag} ring ${(dg * 1000).toFixed(0)}mm (lat ${(lat * 1000).toFixed(0)}, depth ${(along * 1000).toFixed(0)}), place ${(dm * 1000).toFixed(1)}mm`);
      }
      if (dg < 0.0002) { still++; stillMoved += dm; } else { if (stillMoved > 0.02) add(r.gn && Math.abs(r.gn[1]) > 0.9 ? "GSTILL-cap" : "GSTILL-wall", `${ctx}/${after}`, `${tag} place ${(stillMoved * 1000).toFixed(0)}mm under a still ring (${still} frames)`); still = 0; stillMoved = 0; }
    }
    if (r.up && q.up && r.c && q.c && r.t && q.t) {
      const du = ang(r.up, q.up), dd = ang(sub(r.c, r.t), sub(q.c, q.t));
      if (du > 2 * dd + 5) add("USPIN", `${ctx}/${after}`, `${tag} up ${du.toFixed(0)} deg, view ${dd.toFixed(1)} deg, elev ${r.ov ? r.ov[1].toFixed(2) : "-"}`);
    }
  }
}
console.log("frames in presses:", frames);
for (const [k, m] of Object.entries(C)) console.log(k.padEnd(11), JSON.stringify(m));
console.log("\nEXAMPLES");
for (const [k, v] of Object.entries(ex)) console.log(k + ":\n  " + v.join("\n  "));
