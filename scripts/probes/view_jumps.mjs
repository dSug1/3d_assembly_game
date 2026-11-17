// The view's turn frame to frame in a replay recording (scripts/probes/replay_probe.mjs): the camera's look direction (target − position) and its
// roll (the up about the look). Usage: node scripts/probes/view_jumps.mjs a.json [b.json …]      (WORST=n lists the n worst frames of each)
import { readFileSync } from "node:fs";
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ang = (a, b) => (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;
const pct = (v, p) => { const s = [...v].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const WORST = +(process.env.WORST ?? 0);
for (const f of process.argv.slice(2)) {
  const F = JSON.parse(readFileSync(f, "utf8")).frames;
  const look = F.map((x) => unit(sub(x.t, x.c)));
  // the up made square to the look (the roll's own direction)
  const up = F.map((x, i) => { const u = x.up, l = look[i]; const k = dot(u, l); return unit([u[0] - k * l[0], u[1] - k * l[1], u[2] - k * l[2]]); });
  const turn = [], roll = [];
  for (let i = 1; i < F.length; i++) {
    turn.push(ang(look[i - 1], look[i]));
    // the roll: the up's turn once the look's own turn is taken out (the previous up carried onto the new look by the least rotation)
    const ax = cross(look[i - 1], look[i]); const s = len(ax); const c = dot(look[i - 1], look[i]);
    let u0 = up[i - 1];
    if (s > 1e-12) { const k = unit(ax); const kxu = cross(k, u0); const kd = dot(k, u0); u0 = [u0[0] * c + kxu[0] * s + k[0] * kd * (1 - c), u0[1] * c + kxu[1] * s + k[1] * kd * (1 - c), u0[2] * c + kxu[2] * s + k[2] * kd * (1 - c)]; }
    roll.push(ang(unit(u0), up[i]));
  }
  const n = (v, x) => v.filter((y) => y > x).length;
  console.log(`${f.split(/[\\/]/).pop()}: view turn °/frame — 99th ${pct(turn, 0.99).toFixed(1)}, largest ${Math.max(...turn).toFixed(1)}, frames over 10°: ${n(turn, 10)}, over 20°: ${n(turn, 20)}, over 45°: ${n(turn, 45)}`);
  console.log(`   roll °/frame — 99th ${pct(roll, 0.99).toFixed(1)}, largest ${Math.max(...roll).toFixed(1)}, frames over 10°: ${n(roll, 10)}, over 20°: ${n(roll, 20)}, over 45°: ${n(roll, 45)}`);
  if (WORST > 0) {
    const idx = turn.map((t, i) => [Math.max(t, roll[i]), i]).sort((a, b) => b[0] - a[0]).slice(0, WORST);
    for (const [, i] of idx) console.log(`     frame ${i + 1} (${F[i + 1].leg}): turn ${turn[i].toFixed(1)}°, roll ${roll[i].toFixed(1)}° | ${String(F[i + 1].v).slice(0, 110)}`);
  }
}
