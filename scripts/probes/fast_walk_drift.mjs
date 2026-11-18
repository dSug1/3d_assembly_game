// ⭐⭐⭐ (2026-11-18, package FO1 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §4, gate G4) NO DRIFT: a fast walk (`fast_walk_check.mjs`, REC set) against
// its replay (REPLAY: the same events at the same frames, the orbit's angles and the approach set as recorded before each frame, every turn whole at
// once — `&tiltRollDegS=0`):
//   node scripts/probes/fast_walk_drift.mjs <walk.json> <replay.json>
// (i) in the walk, on every frame with no turn running, the pose the camera's stage built (`probeCamPose.to`) and the pose drawn (`.drawn`) equal to the
//     last bit (a build without the field: "not recorded");
// (ii) frame by frame, the state that must not read the fade — the zone (and its id), the tilt, the free face and its carried heading, the spit's side,
//     the map's angles — equal to the last bit; on every frame where NEITHER run has a turn running, the camera's transform (position, target, up) equal
//     to the last bit; and the walk's last frame's camera equal to the replay's.
import { readFileSync } from "node:fs";

const [fa, fb] = process.argv.slice(2);
const A = JSON.parse(readFileSync(fa, "utf8"));
const B = JSON.parse(readFileSync(fb, "utf8"));
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
// (i)
let poseN = 0, poseBad = 0, poseFirst = -1, poseRec = 0;
for (let i = 0; i < A.length; i++) {
  const p = A[i].pose;
  if (!p) continue;
  poseRec++;
  if (A[i].mix) continue;
  poseN++;
  if (!eq(p.to, p.drawn)) { poseBad++; if (poseFirst < 0) poseFirst = i; }
}
console.log(poseRec === 0 ? "(i) the target pose: not recorded (a build without `probeCamPose`)" : `(i) frames with no turn running: ${poseN}; the pose drawn ≠ the target: ${poseBad}${poseBad ? ` (first f${poseFirst})` : ""}`);
// (ii)
const n = Math.min(A.length, B.length);
console.log(`(ii) frames: walk ${A.length}, replay ${B.length}${A.length !== B.length ? " ⚠ NOT THE SAME LENGTH" : ""}`);
const FIELDS = ["zone", "tilt", "free", "spit", "mq"];
// the largest numeric difference between two values of the same shape (Infinity: not the same shape — a discrete difference)
const diff = (x, y) => {
  if (typeof x === "number" && typeof y === "number") return Math.abs(x - y);
  if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) return Math.max(0, ...x.map((v, k) => diff(v, y[k])));
  return eq(x, y) ? 0 : Infinity;
};
let worst = 0;
for (const f of FIELDS) {
  let bad = 0, first = -1, big = 0;
  for (let i = 0; i < n; i++) if (!eq(A[i][f], B[i][f])) { bad++; if (first < 0) first = i; big = Math.max(big, diff(A[i][f], B[i][f])); }
  worst = Math.max(worst, big);
  console.log(`   ${f.padEnd(5)} differs on ${bad} frames${bad ? ` (first f${first} ${A[first].leg}: ${JSON.stringify(A[first][f])} vs ${JSON.stringify(B[first][f])}; the largest difference ${big === Infinity ? "DISCRETE" : big.toExponential(2)})` : ""}`);
}
let camN = 0, camBad = 0, camFirst = -1, camMax = 0;
for (let i = 0; i < n; i++) {
  if (A[i].mix || B[i].mix) continue;
  camN++;
  const a = [...A[i].c, ...A[i].t, ...A[i].up], b = [...B[i].c, ...B[i].t, ...B[i].up];
  if (!eq(a, b)) { camBad++; if (camFirst < 0) camFirst = i; camMax = Math.max(camMax, ...a.map((x, k) => Math.abs(x - b[k]))); }
}
console.log(`   camera: frames with no turn in either ${camN}; differing ${camBad}${camBad ? ` (first f${camFirst} ${A[camFirst].leg}, the largest difference ${camMax.toExponential(2)})` : ""}`);
const la = A[A.length - 1], lb = B[B.length - 1];
const lastD = diff([la.c, la.t, la.up], [lb.c, lb.t, lb.up]);
console.log(`   the last frame's camera: ${lastD === 0 ? "IDENTICAL" : `DIFFERENT by ${lastD.toExponential(2)}`} (walk turn running: ${!!la.mix}, replay: ${!!lb.mix})`);
worst = Math.max(worst, camMax, lastD);
console.log(`   VERDICT: ${worst === 0 ? "identical to the last bit" : worst <= 3e-9 ? `identical but in the last digits (≤ ${worst.toExponential(1)}: the replays' noise, ORBIT_GATES.md §0)` : `DRIFT (${worst === Infinity ? "a discrete state differs" : worst.toExponential(2)})`}`);
