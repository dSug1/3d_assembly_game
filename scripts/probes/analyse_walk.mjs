// (copied 2026-11-07 into the repo)
// THE WALK ANALYSER (2026-11-06): around every change of input direction within a press, the 45 frames after it —
//   WRONG    the travel's place (gm) moving against the new finger direction on the screen (frames +3 … +15, ≥ 1 mm, cos < −0.3), held verdicts apart
//   STUCK    the place not moving over 30 frames while the verdict is no hold / no lift-out
//   BF       the place reversing frame to frame (a back-and-forth) ≥ 2 times in the window
//   GJUMP / CJUMP / PJUMP   the ring / camera / piece stepping > 15 / 25 / 25 mm and > 4× the window's median
//   UPJMP    the camera's up turning > 8° in a frame
// each by the change's CONTEXT: what happened in the 12 frames before it (a face change, a hold, a crossing onto a cap, a gap) — or plain.
import { readFileSync, readdirSync } from "node:fs";
const dir = process.argv[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a) => Math.hypot(...a), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const D = 180 / Math.PI;
const K = ["changes", "WRONG", "STUCK", "GSTILL", "BF", "GJUMP", "GJMPlat", "CJUMP", "PJUMP", "UPJMP"];
const tot = {}, byCtx = {}, ex = {};
const note = (k, s) => ((ex[k] ??= []).length < 8 ? ex[k].push(s) : 0);
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  const R = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")).rows;
  const name = f.replace(".json", "");
  const isSeg = (r) => /^r\d+\[(-?\d+),(-?\d+)\]$/.test(r?.leg ?? "");
  for (let i = 1; i < R.length; i++) {
    const r = R[i], q = R[i - 1];
    if (!isSeg(r) || !isSeg(q) || r.leg === q.leg) continue;
    // a change of direction within the press
    let ctx = "plain";
    for (let k = Math.max(1, i - 12); k < i; k++) {
      const a = R[k], b = R[k - 1];
      if (a.lt && b.lt && a.lt[0] !== b.lt[0]) ctx = /cap/.test(String(a.v)) ? "cap" : "face";
      if (/held/.test(String(a.v)) && ctx === "plain") ctx = "held";
      if (/gap|brought/.test(String(a.v)) && ctx === "plain") ctx = "other";
    }
    const m = /^r\d+\[(-?\d+),(-?\d+)\]$/.exec(r.leg);
    const want = unit([+m[1], -+m[2], 0]);
    const c = (byCtx[ctx] ??= Object.fromEntries(K.map((k) => [k, 0])));
    c.changes++;
    const end = Math.min(R.length - 1, i + 45);
    const win = R.slice(i, end + 1).filter((x) => x.leg === r.leg);
    if (win.length < 16) continue;
    const tag = `${name}@${i} ${q.leg}→${r.leg} [${ctx}] ${String(r.v).slice(7, 40)}`;
    // WRONG: the place's screen motion over +3 … +15
    const a = win[3], b = win[15];
    if (a?.gm && b?.gm && a.c && !/held|brought/.test(String(b.v))) {
      const fwd = unit(sub(b.t, b.c)), right = unit(cross(b.up, fwd)), upS = unit(cross(fwd, right));
      const dg = sub(b.gm, a.gm), sx = dot(dg, right), sy = dot(dg, upS), l = Math.hypot(sx, sy);
      if (l > 0.001 && (sx * want[0] + sy * want[1]) / l < -0.3) { c.WRONG++; note("WRONG", `${tag} moved ${(l * 1000).toFixed(0)}mm cos ${((sx * want[0] + sy * want[1]) / l).toFixed(2)}`); }
    }
    // STUCK
    if (win.length >= 31 && win[0].gm && win[30].gm && len(sub(win[30].gm, win[0].gm)) < 0.0005 && !win.slice(0, 31).some((x) => /held|brought/.test(String(x.v)))) { c.STUCK++; note("STUCK", tag); }
    // GSTILL: the ring standing while the place moves on >= 20 mm (the gizmo waiting)
    {
      let moved = 0, best = 0;
      for (let k = 1; k < win.length; k++) {
        const x = win[k], y = win[k - 1];
        if (!x.g || !y.g || !x.gm || !y.gm) continue;
        if (len(sub(x.g, y.g)) < 0.0002) { moved += len(sub(x.gm, y.gm)); best = Math.max(best, moved); } else moved = 0;
      }
      if (best > 0.02) { c.GSTILL++; note("GSTILL", `${tag} place moved ${(best * 1000).toFixed(0)}mm under a still ring`); }
    }
    // BF
    let rev = 0;
    for (let k = 2; k < win.length; k++) {
      const x = win[k], y = win[k - 1], z = win[k - 2];
      if (!x.gm || !y.gm || !z.gm) continue;
      const d1 = sub(y.gm, z.gm), d2 = sub(x.gm, y.gm);
      if (len(d1) > 0.0015 && len(d2) > 0.0015 && dot(d1, d2) < -0.5 * len(d1) * len(d2)) rev++;
    }
    if (rev >= 2) { c.BF++; note("BF", `${tag} reversals ${rev}`); }
    // jumps
    const jump = (fld, minM, key) => {
      const steps = [];
      for (let k = 1; k < win.length; k++) if (win[k][fld] && win[k - 1][fld]) steps.push(len(sub(win[k][fld], win[k - 1][fld])));
      const med = [...steps].sort((x, y) => x - y)[steps.length >> 1] ?? 0;
      const mx = Math.max(0, ...steps);
      if (mx > minM && mx > 4 * med + 0.002) { c[key]++; note(key, `${tag} ${(mx * 1000).toFixed(0)}mm (median ${(med * 1000).toFixed(1)})`); }
    };
    jump("g", 0.015, "GJUMP");
    // the ring's largest step split: along the face's normal (a depth step: a proud part, a deported face) or across it (lateral)
    {
      let mx = 0, at = -1;
      for (let k = 1; k < win.length; k++) if (win[k].g && win[k - 1].g) { const l = len(sub(win[k].g, win[k - 1].g)); if (l > mx) { mx = l; at = k; } }
      if (at > 0 && mx > 0.015 && win[at].gn) {
        const d = sub(win[at].g, win[at - 1].g), along = Math.abs(dot(d, win[at].gn)), lat = Math.sqrt(Math.max(0, mx * mx - along * along));
        if (lat > 0.015) { c.GJMPlat++; note("GJMPlat", `${tag} lateral ${(lat * 1000).toFixed(0)}mm, depth ${(along * 1000).toFixed(0)}mm`); }
      }
    }
    jump("c", 0.025, "CJUMP");
    jump("p", 0.025, "PJUMP");
    for (let k = 1; k < win.length; k++) if (win[k].up && win[k - 1].up && Math.acos(Math.min(1, dot(win[k].up, win[k - 1].up))) * D > 8) { c.UPJMP++; note("UPJMP", tag); break; }
  }
}
console.log("context".padEnd(10) + K.map((k) => k.padStart(9)).join(""));
for (const [ctx, c] of Object.entries(byCtx)) { console.log(ctx.padEnd(10) + K.map((k) => String(c[k]).padStart(9)).join("")); for (const k of K) tot[k] = (tot[k] ?? 0) + c[k]; }
console.log("TOTAL".padEnd(10) + K.map((k) => String(tot[k]).padStart(9)).join(""));
console.log("\nEXAMPLES");
for (const [k, v] of Object.entries(ex)) console.log(k + ":\n  " + v.join("\n  "));
