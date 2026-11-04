// ⭐⭐⭐ THE ORBIT PROBE'S ANALYSER (TILTED_ORBIT_REBUILD_SCOPE.md §2) — reads a recording of `orbit_probe.mjs` and checks the six invariants per leg:
//   I1 the section a world plane (constant legs: the gizmo within 3 mm of the leg's plane; the plane's tilt off a world axis)
//   I2 no jump of the piece / the camera (a step > 2.5 × its LARGEST neighbour's — a mean reads an every-other-frame input as a jump); the gizmo's own jumps counted apart
//   I3 no REVERSE on one face, no STUCK (15 frames still while the finger moves) — constant legs
//   I4 the piece on the gizmo's face's side (never behind it)
//   I5 the gizmo's step on the screen the finger's way
//   I6 the camera upright on a wall (the up within 5° of the world's)
// Usage: node scripts/probes/analyse_orbit.mjs <recording.json> [--frames]   (--frames: every flagged frame, else grouped)
import { readFileSync } from "node:fs";

const rec = JSON.parse(readFileSync(process.argv[2], "utf8"));
const rows = rec.rows;
const all = process.argv.includes("--frames");
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null; };
const deg = (x) => (x * 180) / Math.PI;
const snapAxis = (v) => { const i = [0, 1, 2].reduce((m, k) => (Math.abs(v[k]) > Math.abs(v[m]) ? k : m), 0); const r = [0, 0, 0]; r[i] = 1; return r; };
const screen = (r) => { const f = unit(sub(r.t, r.c)); const right = f && unit(cross(r.up, f)); return f && right ? { f, right, up: unit(r.up) } : null; };
const fingerOf = (leg) => {
  const c = /^c\d+([LRUD])$/.exec(leg);
  if (c) return { L: [-1, 0], R: [1, 0], U: [0, 1], D: [0, -1] }[c[1]];
  const r = /\[(-?\d+),(-?\d+)\]$/.exec(leg);
  if (r) { const x = +r[1], y = -+r[2]; const l = Math.hypot(x, y); return l > 0 ? [x / l, y / l] : null; }
  return null;
};
const legs = [...new Set(rows.map((r) => r.leg))].filter((l) => /^(c\d+[LRUD]|r\d+\[|pre\d+\[)/.test(l));
const total = { frames: rows.length, jumpsPiece: 0, jumpsCamera: 0, jumpsGizmo: 0, against: 0, moving: 0, offSection: 0, reverse: 0, stuck: 0, behind: 0, roll: 0 };
const stepOf = (R, k, key) => (k > 0 && R[k][key] && R[k - 1][key] ? len(sub(R[k][key], R[k - 1][key])) : NaN);
console.log(`${process.argv[2]}: ${rows.length} frames, viewport ${rec.viewport}, page errors ${rec.errors}${rec.recorderError ? `, RECORDER ERROR ${rec.recorderError}` : ""}`);
for (const leg of legs) {
  const R = rows.filter((r) => r.leg === leg && r.g && r.p && r.c && r.t && r.up);
  if (R.length < 4) { console.log(`${leg}: ${R.length} frames — skipped`); continue; }
  const finger = fingerOf(leg);
  const constant = /^c\d+[LRUD]$/.test(leg);
  const out = [];
  const flag = (k, s) => out.push(`  ${rows.indexOf(R[k])} ${s} | ${R[k].v}`);
  // I1: the leg's plane from its first 10 mm of motion × the face it started on
  let plane = null;
  if (constant) {
    const first = R.find((r) => len(sub(r.g, R[0].g)) > 0.01);
    const n0 = R[0].gn;
    if (first && n0) {
      const raw = unit(cross(sub(first.g, R[0].g), n0));
      if (raw) { const ax = snapAxis(raw); plane = { ax, held: dot(ax, first.g), tilt: deg(Math.acos(Math.min(1, Math.abs(dot(raw, ax))))) }; }
    }
  }
  let still = 0, stillFrom = 0, lastStep = null;
  const faces = [];
  for (let k = 1; k < R.length; k++) {
    const r = R[k], q = R[k - 1];
    const fk = r.gn ? r.gn.map((x) => Math.round(x)).join(",") : "-";
    if (faces[faces.length - 1] !== fk) faces.push(fk);
    // I2
    for (const [key, name] of [["p", "PIECE"], ["c", "CAMERA"], ["g", "GIZMO"]]) {
      const s = stepOf(R, k, key);
      const nb = [stepOf(R, k - 2, key), stepOf(R, k - 1, key), k + 1 < R.length ? stepOf(R, k + 1, key) : NaN, k + 2 < R.length ? stepOf(R, k + 2, key) : NaN].filter(Number.isFinite);
      const m = Math.max(0, ...nb);
      if (s > (key === "g" ? 0.01 : 0.015) && s > 2.5 * m) {
        if (key === "p") total.jumpsPiece++; else if (key === "c") total.jumpsCamera++; else total.jumpsGizmo++;
        flag(k, `${name} JUMP ${(s * 1000).toFixed(0)} mm vs ≤${(m * 1000).toFixed(0)}`);
      }
    }
    const dg = sub(r.g, q.g);
    const moving = len(dg) > 2e-4;
    // I1
    if (plane) { const off = dot(plane.ax, r.g) - plane.held; if (Math.abs(off) > 0.003) { total.offSection++; flag(k, `OFF-SECTION ${(off * 1000).toFixed(0)} mm (plane ${plane.ax})`); } }
    // I3
    if (constant) {
      if (moving) {
        if (lastStep && lastStep.face === fk && dot(dg, lastStep.d) < -0.5 * len(dg) * len(lastStep.d)) { total.reverse++; flag(k, `REVERSE on face ${fk}`); }
        lastStep = { d: dg, face: fk };
        if (still >= 15) { total.stuck++; flag(stillFrom, `STUCK ${still} frames`); }
        still = 0;
      } else { if (still === 0) stillFrom = k; still++; }
    }
    // I4
    if (r.gn && dot(sub(r.p, r.g), r.gn) < 0) { total.behind++; flag(k, `PIECE BEHIND its gizmo's face ${fk}`); }
    // I5
    const sc = screen(q);
    if (finger && moving && sc) {
      const sx = dot(dg, sc.right), sy = dot(dg, sc.up);
      const l = Math.hypot(sx, sy);
      if (l > 1e-4) { total.moving++; if ((sx * finger[0] + sy * finger[1]) / l < -0.2) { total.against++; flag(k, `AGAINST THE FINGER: screen step (${(sx * 1000).toFixed(1)}, ${(sy * 1000).toFixed(1)}) mm, finger (${finger})`); } }
    }
    // I6
    const s6 = screen(r);
    if (s6 && r.gn && Math.abs(r.gn[1]) < 0.7) {
      const w = unit([-s6.f[0] * s6.f[1], 1 - s6.f[1] * s6.f[1], -s6.f[2] * s6.f[1]]);
      if (w && Math.hypot(s6.f[0], s6.f[2]) > 0.3) { const a = deg(Math.acos(Math.max(-1, Math.min(1, dot(w, s6.up))))); if (a > 5) { total.roll++; flag(k, `ROLL ${a.toFixed(0)}° on a wall`); } }
    }
  }
  if (constant && still >= 15) { total.stuck++; flag(stillFrom, `STUCK to the end (${still} frames)`); }
  const travel = len(sub(R[R.length - 1].g, R[0].g));
  console.log(`${leg}: ${R.length} frames, faces ${faces.join(" → ")}${plane ? `, plane ${plane.ax} at ${plane.held.toFixed(3)} (tilt ${plane.tilt.toFixed(0)}°)` : ""}, gizmo net ${(travel * 1000).toFixed(0)} mm`);
  if (all) out.forEach((l) => console.log(l));
  else {
    let last = "", n = 0;
    for (const l of out) { const key = l.replace(/^\s*\d+ /, "").replace(/-?[\d.]+/g, "#"); if (key === last) { n++; continue; } if (n) console.log(`     … ×${n} more`); n = 0; last = key; console.log(l); }
    if (n) console.log(`     … ×${n} more`);
  }
}
console.log(`TOTAL: jumps piece ${total.jumpsPiece} / camera ${total.jumpsCamera} / gizmo ${total.jumpsGizmo}; off-section ${total.offSection}; reverse ${total.reverse}; stuck ${total.stuck}; piece behind ${total.behind}; against the finger ${total.against} of ${total.moving} moving frames; rolled on a wall ${total.roll}`);
