// ⭐⭐⭐ (2026-11-17, package LF2 — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §11) EVERY TIMED TURN, BASE AGAINST NEW: the frames recorded with
// DUMP (`turn_rec.mjs`) or by `level_entry_check.mjs` (OUTJSON), read in pairs — the same run at the base and now:
//   node scripts/probes/turn_table.mjs <base.json> <new.json> [<base2.json> <new2.json> ...]     (the runbook: scripts/probes/ORBIT_GATES.md §8)
// A TURN: the frames a transition's turn runs (`mix`, its share never falling) — `mm` paced by the finger (the approach's entry), `out` the way out of
// close in (C3), else by time — or, with no transition's turn, the frames the SQUARE CAMERA turns toward its face (`sq`: its share over ½, its normal
// over ½° off its target — the gizmo held, `squareTurning`). A transition's turn with the square camera turning in it is `mix+sq`.
// Per turn: its WHOLE (the clock's angle, the camera's plus the piece's direction's ease, at its last frame; `sq`: the square camera's angle to its
// target at the start), its frames, the frames THE RULE gives that whole at the defaults (`turnDurationMs`: 250 ms least, shrinking under 30°; 333 ms
// longest; 360°/s — a `sq` or `mix+sq` turn: the one speed's, `turnDials`), THE ONE ROTATION (the camera's orientation the frame before the turn → its last frame), THE PATH (the sum of each frame's rotation),
// the ratio, the LARGEST FRAME; base | now; then Δ one, Δ path, THE SHAPE (the largest angle between the base's and the new orientation at the same
// fraction of the path, 10 % … 90 %, slerped between frames) and the START (the two orientations the frame before the turn).
// Flags: ⚠PATH a path over 1.15 × the one rotation + 5° (b: at the base, n: now); RATIO+ the ratio worse than the base's by over 0.02; PACE+ a frame
// over the rule's own pace for that turn + 2° (b / n); the turns are paired by their order within a leg — an unpaired turn is listed on its own.
//   MIN (2) a turn under MIN° (one rotation and path) is not listed; RULE="minMs,maxMs,smallDeg,degS" (250,333,30,360).
import { readFileSync } from "node:fs";

const MIN = +(process.env.MIN ?? 2);
const [R_MIN, R_MAX, R_SMALL, R_DEGS] = (process.env.RULE ?? "250,333,30,360").split(",").map(Number);
const FRAME_MS = 1000 / 60;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const deg = (x) => (x * 180) / Math.PI;
const perp = (v, l) => { const k = dot(v, l); return [v[0] - k * l[0], v[1] - k * l[1], v[2] - k * l[2]]; };

/** the rule (LF2), at the given dials: ms for a turn of `d` degrees */
export function ruleMs(d) {
  const speed = R_DEGS > 0 ? (Math.abs(d) / R_DEGS) * 1000 : 0;
  const least = R_MIN > 0 ? R_MIN * Math.min(1, Math.abs(d) / R_SMALL) : 0;
  const dur = Math.max(speed, least);
  return R_MAX > 0 ? Math.min(dur, R_MAX) : dur;
}

/** the camera's orientation as a unit quaternion [w, x, y, z]: the columns look, up, look × up */
function quat(f) {
  const l = unit(sub(f.t, f.c)), u = unit(perp(f.up, l)), w = cross(l, u);
  const m = [[l[0], u[0], w[0]], [l[1], u[1], w[1]], [l[2], u[2], w[2]]];
  const tr = m[0][0] + m[1][1] + m[2][2];
  let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [0.25 * s, (m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s]; }
  else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [(m[2][1] - m[1][2]) / s, 0.25 * s, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s]; }
  else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[0][2] - m[2][0]) / s, (m[0][1] + m[1][0]) / s, 0.25 * s, (m[1][2] + m[2][1]) / s]; }
  else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[1][0] - m[0][1]) / s, (m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, 0.25 * s]; }
  const n = Math.hypot(...q);
  return q.map((x) => x / n);
}
const qang = (a, b) => deg(2 * Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]))));
function slerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const bb = d < 0 ? b.map((x) => -x) : b; d = Math.abs(d);
  if (d > 0.99999) return a.map((x, i) => x + (bb[i] - x) * t);
  const th = Math.acos(d), s = Math.sin(th);
  return a.map((x, i) => (Math.sin((1 - t) * th) * x + Math.sin(t * th) * bb[i]) / s);
}

const sqTurning = (f) => f.sqq > 0.5 && f.sqn && f.sqt && deg(Math.acos(Math.max(-1, Math.min(1, dot(f.sqn, f.sqt))))) > 0.5;

/** every turn of a recording */
export function turnsOf(C) {
  const Q = C.map(quat);
  const out = [];
  for (let i = 1; i < C.length; i++) {
    const isMix = !!C[i].mix, isSq = !C[i].mix && sqTurning(C[i]);
    if (!isMix && !isSq) continue;
    let e = i;
    if (isMix) while (e + 1 < C.length && C[e + 1].mix && C[e + 1].mix.k >= C[e].mix.k - 1e-9) e++;
    else while (e + 1 < C.length && !C[e + 1].mix && sqTurning(C[e + 1])) e++;
    let path = 0, big = 0, withSq = false;
    const cum = [0];
    for (let j = i; j <= e; j++) { const a = qang(Q[j - 1], Q[j]); path += a; big = Math.max(big, a); cum.push(path); if (isMix && sqTurning(C[j])) withSq = true; }
    const whole = isMix ? deg(C[e].mix.whole ?? C[e].mix.rad) : deg(Math.acos(Math.max(-1, Math.min(1, dot(C[i - 1].sqn ?? C[i].sqn, C[i].sqt)))));
    const m0 = C[i].mix;
    const pace = isMix ? (m0.byMm ? "mm" : m0.out ? "out" : "time") : "time";
    out.push({ s: i, e, leg: C[i].leg, kind: isMix ? (withSq ? "mix+sq" : "mix") : "sq", pace, n: e - i + 1, whole, one: qang(Q[i - 1], Q[e]), path, big, cum, Q: Q.slice(i - 1, e + 1) });
    i = e;
  }
  return out;
}

/** the orientation at the fraction `f` of a turn's path */
function at(t, f) {
  const target = f * t.path;
  for (let j = 1; j < t.cum.length; j++) if (t.cum[j] >= target - 1e-12) { const d = t.cum[j] - t.cum[j - 1]; return slerp(t.Q[j - 1], t.Q[j], d > 1e-12 ? (target - t.cum[j - 1]) / d : 1); }
  return t.Q[t.Q.length - 1];
}

const f1 = (x) => (x === undefined || Number.isNaN(x) ? "-" : x.toFixed(1));
const listed = (t) => t.one >= MIN || t.path >= MIN;
const bad = (t) => t.path > 1.15 * t.one + 5;
// ⭐ a turn the square camera runs beside (`sq`, `mix+sq`) keeps the one speed (LF2, `turnDials`): its own frames are the speed's
const ruleFr = (t) => (t.kind === "mix" ? ruleMs(t.whole) : R_DEGS > 0 ? (t.whole / R_DEGS) * 1000 : 0) / FRAME_MS;
const paceOver = (t) => { const rf = ruleFr(t); return rf > 0 && t.big > t.whole / Math.max(1, rf) + 2; };

const args = process.argv.slice(2);
for (let p = 0; p + 1 < args.length; p += 2) {
  const B = turnsOf(JSON.parse(readFileSync(args[p], "utf8")));
  const N = turnsOf(JSON.parse(readFileSync(args[p + 1], "utf8")));
  console.log(`# ${args[p].split(/[\\/]/).pop()}  →  ${args[p + 1].split(/[\\/]/).pop()}   (turns: base ${B.length}, now ${N.length}; listed ≥ ${MIN}°)`);
  console.log("  leg              kind    pace whole° base→now | fr base→now (rule) | one° base→now | path° base→now | ratio base→now | big° base→now | shape° start° | flags");
  const legs = [...new Set([...B, ...N].map((t) => t.leg))];
  const stats = { n: 0, shape: 0, dOne: 0, dPath: 0, flags: 0 };
  for (const leg of legs) {
    const b = B.filter((t) => t.leg === leg && listed(t)), n = N.filter((t) => t.leg === leg && listed(t));
    for (let k = 0; k < Math.max(b.length, n.length); k++) {
      const x = b[k], y = n[k];
      const t = y ?? x;
      let shape = NaN, start = NaN;
      if (x && y) {
        shape = 0; for (let f = 0.1; f < 0.95; f += 0.1) shape = Math.max(shape, qang(at(x, f), at(y, f)));
        start = qang(x.Q[0], y.Q[0]);
        stats.n++; stats.shape = Math.max(stats.shape, shape); stats.dOne = Math.max(stats.dOne, Math.abs(x.one - y.one)); stats.dPath = Math.max(stats.dPath, Math.abs(x.path - y.path));
      }
      const fl = [];
      if (x && bad(x)) fl.push("⚠PATH b"); if (y && bad(y)) fl.push("⚠PATH n");
      if (x && y && y.path / Math.max(1e-9, y.one) > x.path / Math.max(1e-9, x.one) + 0.02 && y.one > 1) fl.push("RATIO+");
      if (x && paceOver(x)) fl.push("PACE+ b"); if (y && paceOver(y)) fl.push("PACE+ n");
      if (!x) fl.push("NEW ONLY"); if (!y) fl.push("BASE ONLY");
      if (fl.some((s) => s !== "PACE+ b" && s !== "⚠PATH b")) stats.flags++;
      console.log(`  ${leg.padEnd(16).slice(0, 16)} ${t.kind.padEnd(7)} ${t.pace.padEnd(4)} ${f1(x?.whole)}→${f1(y?.whole)} | ${String(x ? x.n : "-").padStart(3)}→${String(y ? y.n : "-").padEnd(3)} (${f1(ruleFr(t))}) | ${f1(x?.one)}→${f1(y?.one)} | ${f1(x?.path)}→${f1(y?.path)} | ${x ? (x.path / Math.max(1e-9, x.one)).toFixed(2) : "-"}→${y ? (y.path / Math.max(1e-9, y.one)).toFixed(2) : "-"} | ${f1(x?.big)}→${f1(y?.big)} | ${f1(shape)} ${f1(start)} | ${fl.join(" ")}  [f${x ? x.s : "-"}/f${y ? y.s : "-"}]`);
    }
  }
  console.log(`  PAIRED ${stats.n}: the largest |Δ one| ${stats.dOne.toFixed(2)}°, |Δ path| ${stats.dPath.toFixed(2)}°, shape ${stats.shape.toFixed(2)}°; turns flagged (now, or unpaired) ${stats.flags}`);
}
