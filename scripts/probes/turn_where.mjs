// ⭐⭐⭐ (2026-11-18, package FO1 fix round 2 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §9) WHERE THE PICTURE'S WORST FRAME FALLS: per recording
// (a fast walk `fast_walk_check.mjs`, or a replay's DUMP `turn_rec.mjs` — both carry `c`, `t`, `up`, `mix` and the readout `pose` {to, drawn}):
//   node scripts/probes/turn_where.mjs <rec.json> ...
// the picture's largest one-frame turn inside a turn that does NOT hold the gizmo (`free`), inside a turn that holds (`held`), and with no turn
// (`none`), each with the TARGET's own turn on that frame (the camera stage's pose `pose.to`, frame to frame); the largest gap drawn ↔ target in a free
// turn; and the target's own turn on the frames of a free turn that are not its first (a turn's first frame is the change of frame's jump):
// median / 90th percentile / largest. A recording with no readout (`pose` null: a build without `probeCamPose`): the target columns read `-`.
import { readFileSync } from "node:fs";

const D = 180 / Math.PI;
const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const frame = (eye, look, up) => {
  const d = unit([eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]]);
  const r = unit(cross(up, d));
  return [r, cross(d, r), d];
};
// the one rotation between two frames (°)
const turn = (A, B) => {
  let tr = 0;
  for (let i = 0; i < 3; i++) tr += A[i][0] * B[i][0] + A[i][1] * B[i][1] + A[i][2] * B[i][2];
  return Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))) * D;
};
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : "-");

for (const file of process.argv.slice(2)) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const C = Array.isArray(raw) ? raw : Object.values(raw);
  const worst = { free: [0, -1, NaN], held: [0, -1, NaN], none: [0, -1, NaN] };
  let gapMax = 0;
  const own = [];
  for (let i = 1; i < C.length; i++) {
    const x = C[i];
    const p = C[i - 1];
    const pic = turn(frame(p.c, p.t, p.up), frame(x.c, x.t, x.up));
    const tgt = x.pose && p.pose ? turn(frame(...p.pose.to), frame(...x.pose.to)) : NaN;
    const kind = x.mix ? (x.mix.hold === false ? "free" : "held") : "none";
    if (pic > worst[kind][0]) worst[kind] = [pic, i, tgt];
    if (kind === "free" && x.pose) gapMax = Math.max(gapMax, turn(frame(...x.pose.to), frame(...x.pose.drawn)));
    if (kind === "free" && p.mix && p.mix.id === x.mix.id && Number.isFinite(tgt)) own.push(tgt);
  }
  own.sort((a, b) => a - b);
  const q = (t) => (own.length ? own[Math.min(own.length - 1, Math.floor(t * own.length))] : NaN);
  const w = (k) => `${k} ${f1(worst[k][0])}° @f${worst[k][1]} (target ${f1(worst[k][2])}°)`;
  console.log(`${file.split(/[\\/]/).pop()}: ${w("free")} | ${w("held")} | ${w("none")} | the largest gap in a free turn ${f1(gapMax)}°`);
  console.log(`   the target's own turn in a free turn (not its first frame), ${own.length} frames: median ${f1(q(0.5))}°, 90th ${f1(q(0.9))}°, largest ${f1(q(1))}°`);
}
