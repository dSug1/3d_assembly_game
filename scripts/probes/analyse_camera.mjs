// THE CAMERA, compared between two series (2026-11-07): every frame of a press —
//   UPSIDE   the camera's up below the horizon (up.y < 0) — the owner's F4
//   ROLL     the screen's right off the horizontal by > 2° (V2: no roll)
//   DIRSTEP  the view direction's turn in a frame (deg): p50 / p99 / max, and frames > 5° (a jump)
//   UPSTEP   the up's turn in a frame beyond the direction's + 2° (a spin)
//   POSSTEP  the camera's step in a frame against the window's median (> 25 mm and > 4×): a camera jump
//   DIST     the camera's distance to its target: p50
import { readFileSync, readdirSync } from "node:fs";
const D = 180 / Math.PI;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a) => Math.hypot(...a), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b))))) * D;
const isSeg = (r) => /^r\d+\[(-?\d+),(-?\d+)\]$/.test(r?.leg ?? "");
for (const dir of process.argv.slice(2)) {
  let n = 0, upside = 0, roll = 0, dirJump = 0, upSpin = 0, posJump = 0;
  const steps = [], dists = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    let R;
    try { R = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")).rows; } catch { continue; }
    if (!Array.isArray(R)) continue;
    const pos = [];
    for (let i = 1; i < R.length; i++) {
      const r = R[i], q = R[i - 1];
      if (!isSeg(r) || !isSeg(q) || !r.c || !r.t || !r.up || !q.c || !q.t || !q.up) continue;
      n++;
      const d = sub(r.t, r.c), dq = sub(q.t, q.c);
      if (r.up[1] < -1e-6) upside++;
      const right = unit(cross(d, r.up));
      if (Math.abs(Math.asin(Math.max(-1, Math.min(1, right[1])))) * D > 2) roll++;
      const s = ang(d, dq);
      steps.push(s);
      if (s > 5) dirJump++;
      if (ang(r.up, q.up) > s + 2) upSpin++;
      pos.push(len(sub(r.c, q.c)));
      dists.push(len(d));
    }
    for (let i = 0; i < pos.length; i++) {
      const w = pos.slice(Math.max(0, i - 15), i + 16).sort((a, b) => a - b);
      const med = w[w.length >> 1];
      if (pos[i] > 0.025 && pos[i] > 4 * med) posJump++;
    }
  }
  steps.sort((a, b) => a - b);
  dists.sort((a, b) => a - b);
  const q = (a, p) => a[Math.floor(p * (a.length - 1))] ?? 0;
  const pc = (k) => `${k} (${((100 * k) / Math.max(1, n)).toFixed(2)} %)`;
  console.log(`${dir}: ${n} frames | UPSIDE ${pc(upside)} | ROLL>2° ${pc(roll)} | DIRSTEP p50 ${q(steps, 0.5).toFixed(2)}° p99 ${q(steps, 0.99).toFixed(2)}° max ${q(steps, 1).toFixed(1)}° >5° ${pc(dirJump)} | UPSPIN ${pc(upSpin)} | CAMJUMP ${pc(posJump)} | DIST p50 ${q(dists, 0.5).toFixed(2)} m`);
}
