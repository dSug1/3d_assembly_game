// ⭐⭐⭐ (2026-11-18, `Claude/40_RENDER_SCENE/spec/UPRIGHT_PICTURE.md` §2 step 6, §3 — law U) GRAVITY ON THE GLASS, read off any recording with the camera
// drawn per frame (`c`, `t`, `up`; the gizmo `g`): turn_rec.mjs's DUMP, fast_walk_check / level_entry_check / hold_walk_check's OUTJSON, hand_replay.mjs,
// the seeded replays (replay_probe.mjs). From the design study's `m.mjs` (the kit `_saved_patches/orbit_chain_2026-11-18/fo3/upright`).
//   node scripts/probes/gravity_read.mjs <rec.json> ...        CUT=10 (deg from the vertical where gravity has no direction on the glass: not counted)
//   JSON=1: one object a recording.
// Per recording: the frames counted (the view CUT or more off the vertical) / all; gravity's tilt on the glass (world-down projected on the glass against
// the glass's down) — the share of the counted frames over 20°, 45°, 90°, its largest; GRAVITY'S ROLL per metre of gizmo travel (|Δtilt| a frame × the
// sine of the view's angle from the vertical — how visible the arrow is) and its largest frame; the gizmo's travel (m); the frames held by a turn (`sh.fr`
// 0) per metre; with law U's record (`sh.uw`, `sh.uf`): the frames held by a change whose frame before had w = 1 — none of the kinds that stay (U-G6), the largest |φ| (°).
import { readFileSync } from "node:fs";
const D = 180 / Math.PI;
const CUT = +(process.env.CUT ?? 10);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function frame(c, t, up) { const f = nrm(sub(t, c)); const u = nrm(sub(up, mul(f, dot(up, f)))); return { f, u, r: cross(f, u) }; }
/** gravity's tilt on the glass (rad) and the view's angle from the vertical (deg); tilt null within CUT of the vertical */
function tilt(F) {
  const vert = Math.acos(Math.min(1, Math.abs(F.f[1]))) * D;
  if (vert < CUT) return { vert, a: null };
  const d = [0, -1, 0];
  const dp = sub(d, mul(F.f, dot(d, F.f)));
  return { vert, a: Math.atan2(dot(dp, F.r), -dot(dp, F.u)) };
}
function rowsOf(file) { const J = JSON.parse(readFileSync(file, "utf8")); return Array.isArray(J) ? J : (J.rows || J.frames || []); }
export function readGravity(file) {
  const rows = rowsOf(file);
  let travel = 0, n = 0, def = 0, o20 = 0, o45 = 0, o90 = 0, max = 0, roll = 0, rollMax = 0, held = 0, heldW1 = 0, phiMax = 0, prevA = null, prevG = null;
  let turnW1 = null, prevUw = null; // the turn under way: whether the frame before its first had w = 1
  const seen = new Map();
  for (const r of rows) {
    if (!r.c || !r.t || !r.up) { prevA = null; continue; }
    n++;
    if (r.g && prevG) travel += Math.hypot(...sub(r.g, prevG));
    if (r.g) prevG = r.g;
    const M = tilt(frame(r.c, r.t, r.up));
    if (M.a !== null) {
      def++;
      const a = Math.abs(M.a) * D;
      if (a > 20) o20++;
      if (a > 45) o45++;
      if (a > 90) o90++;
      max = Math.max(max, a);
      if (prevA !== null) { const d = Math.abs(wrap(M.a - prevA)) * D * Math.sin(M.vert / D); roll += d; rollMax = Math.max(rollMax, d); }
    }
    prevA = M.a;
    const s = r.sh;
    if (s) {
      if (s.fr === 0) held++;
      if (typeof s.uf === "number") phiMax = Math.max(phiMax, Math.abs(s.uf) * D);
      if (r.mix && typeof r.mix.id === "number") {
        if (!seen.has(r.mix.id)) seen.set(r.mix.id, typeof prevUw === "number" ? prevUw >= 1 : null);
        turnW1 = seen.get(r.mix.id);
        if (s.fr === 0 && turnW1 === true && !r.mix.byMm && !r.mix.out && !r.tilt && !(r.sqq > 0)) heldW1++;
      }
      prevUw = typeof s.uw === "number" ? s.uw : null;
    } else prevUw = null;
  }
  const pc = (k) => +((100 * k) / Math.max(1, def)).toFixed(1);
  return {
    name: file.split(/[\\/]/).slice(-1)[0], frames: n, counted: def, travelM: +travel.toFixed(3),
    over20: pc(o20), over45: pc(o45), over90: pc(o90), maxDeg: +max.toFixed(1),
    rollPerM: +(roll / Math.max(travel, 1e-9)).toFixed(1), rollMaxDeg: +rollMax.toFixed(2),
    held, heldPerM: +(held / Math.max(travel, 1e-9)).toFixed(1), heldW1, phiMaxDeg: +phiMax.toFixed(1),
  };
}
if (process.argv[1] && process.argv[1].split(/[\\/]/).pop() === "gravity_read.mjs") {
  for (const f of process.argv.slice(2)) {
    const o = readGravity(f);
    if (process.env.JSON) console.log(JSON.stringify(o));
    else console.log(`${o.name}: ${o.frames} fr (${o.counted} counted), ${o.travelM} m | tilt >20 ${o.over20}% >45 ${o.over45}% >90 ${o.over90}% max ${o.maxDeg} | roll ${o.rollPerM}°/m worst ${o.rollMaxDeg}° | held ${o.held} (${o.heldPerM}/m, w1 ${o.heldW1}) | phi max ${o.phiMaxDeg}`);
  }
}
