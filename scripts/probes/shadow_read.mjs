// ⭐⭐⭐ (2026-11-18, package FO3 S0 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §13) THE SHADOW READ: per recording (hand_replay.mjs's `rows`, a fast walk's
// OUTJSON, a DUMP of turn_rec.mjs — every frame with `sh`, `st.asmRollShadow`), one line of figures:
//   node scripts/probes/shadow_read.mjs <rec.json> ...            (JSON=1: one JSON object per recording instead)
// * travel — the gizmo's travel (m); fr — frames; held — frames a turn holds the gizmo (`sh.fr` 0)
// * roll/m base — the picture DRAWN today: its roll about the view (pace.mjs's split) summed, per metre of gizmo travel; worst — its largest frame
// * roll/m S1 — the picture S1 would draw ON THIS ROUTE: the shadow's picture (`pi3`) wherever the gizmo is free or the turn would be free (twist at its
//   first frame under 90°, not byMm / out), else the drawn one (a turn that stays: today's)
// * gap — the free gap (`gf`): largest |gap| (°), frames over 45° and 90°; the held gap (`gh`, §12.4 as written: taken only with the gizmo free)
// * twFree — the ghost's twist with the gizmo FREE today (|tw| over 0.5° a frame: frames, largest, sum)
// * outSpit — frames with |gap| over 1° outside a spit (O8: the finger read as it is there), the largest such gap
// * A2 — the largest error of the piece's / the look point's place on the glass, picture against ghost (half-glasses)
// * A3 — the gap at the last frame (0: at rest the ghost), the frames from the ghost's last twist to the gap exactly 0
// * turns — zone turns (asmZoneMix objects): their twist at the first frame under / over 90°, byMm, out
// * A6 — (rows with `fd`, the hand) the angle on the glass between the finger's way and the gizmo's, outside turns (|fd| ≥ 3 px, gizmo ≥ 1 px on the
//   glass): base largest / 95th; and the same against the S1 picture where the gap is over 1° outside a spit (what S2 would turn)
import { readFileSync } from "node:fs";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0]; };
const DEG = 180 / Math.PI;
function frame(c, t, up) {
  const v = unit(sub(t, c)); const k = dot(up, v); const u = unit([up[0] - k * v[0], up[1] - k * v[1], up[2] - k * v[2]]);
  return { v, u, r: cross(u, v), c };
}
function rollAngle(A, B) {
  const ax = cross(A.v, B.v), s = len(ax), c = dot(A.v, B.v);
  let uc = A.u;
  if (s > 1e-12) { const k = unit(ax), th = Math.atan2(s, c), kxu = cross(k, A.u), kd = dot(k, A.u); uc = [0, 1, 2].map((i) => A.u[i] * Math.cos(th) + kxu[i] * Math.sin(th) + k[i] * kd * (1 - Math.cos(th))); }
  return Math.atan2(dot(cross(uc, B.u), B.v), dot(uc, B.u));
}
// a point on the glass (px from the centre, x right, y DOWN as the pointer's) — Babylon's left-handed screen: right = up × view
function glass(F, p, fov, asp, W, H) {
  const d = sub(p, F.c); const z = dot(d, F.v); const t = Math.tan(fov / 2);
  const right = cross(F.u, F.v);
  return [(dot(d, right) / (z * t * asp)) * (W / 2), -(dot(d, F.u) / (z * t)) * (H / 2)];
}
const pct = (xs, p) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

for (const file of process.argv.slice(2)) {
  const J = JSON.parse(readFileSync(file, "utf8"));
  const rows = Array.isArray(J) ? J : J.rows ?? J.frames;
  const name = file.split(/[\\/]/).pop().replace(/\.json$/, "");
  let travel = 0, rollB = 0, rollS = 0, worstB = 0, worstS = 0, held = 0, g45 = 0, g90 = 0, gMax = 0, ghMax = 0, twN = 0, twMax = 0, twSum = 0, osN = 0, osMax = 0, a2 = 0, lastTw = -1, zeroAt = -1;
  const turns = new Map();
  const a6b = [], a6s = [];
  let prev = null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], s = r.sh;
    if (!s || !r.c) { prev = null; continue; }
    const Fd = frame(r.c, r.t, r.up);
    const mixFree = r.mix && !s.stays;
    const useShadow = s.fr === 1 || mixFree;
    const Fs = useShadow ? frame(s.pi3[0], s.pi3[1], s.pi3[2]) : Fd;
    if (!s.fr) held++;
    const gf = Math.abs(s.gf) * DEG, gh = Math.abs(s.gh) * DEG;
    gMax = Math.max(gMax, gf); ghMax = Math.max(ghMax, gh); if (gf > 45) g45++; if (gf > 90) g90++;
    if (s.fr && Math.abs(s.tw) * DEG > 0.5) { twN++; twMax = Math.max(twMax, Math.abs(s.tw) * DEG); twSum += Math.abs(s.tw) * DEG; }
    if (Math.abs(s.tw) > 0) lastTw = i;
    if (gf > 1 && !s.sp) { osN++; osMax = Math.max(osMax, gf); }
    a2 = Math.max(a2, s.a2);
    if (r.mix && !turns.has(r.mix.id)) turns.set(r.mix.id, { ttw: Math.abs(s.ttw) * DEG, byMm: !!r.mix.byMm, out: !!r.mix.out });
    if (prev) {
      if (r.g && prev.r.g) travel += len(sub(r.g, prev.r.g));
      const rb = Math.abs(rollAngle(prev.Fd, Fd)) * DEG, rs = Math.abs(rollAngle(prev.Fs, Fs)) * DEG;
      rollB += rb; rollS += rs; worstB = Math.max(worstB, rb); worstS = Math.max(worstS, rs);
      // A6: the finger's way against the gizmo's on the glass (rows with fd: the hand at its glass)
      if (r.fd && r.g && prev.r.g && !r.mix && Math.hypot(r.fd[0], r.fd[1]) >= 3) {
        const W = 1536, H = 742;
        const gb = sub2(glass(Fd, r.g, s.fov, s.asp, W, H), glass(Fd, prev.r.g, s.fov, s.asp, W, H));
        if (Math.hypot(gb[0], gb[1]) >= 1) a6b.push(ang(r.fd, gb));
        if (gf > 1 && !s.sp) {
          const gs = sub2(glass(Fs, r.g, s.fov, s.asp, W, H), glass(Fs, prev.r.g, s.fov, s.asp, W, H));
          if (Math.hypot(gs[0], gs[1]) >= 1) a6s.push(ang(r.fd, gs));
        }
      }
    }
    prev = { r, Fd, Fs };
  }
  for (let i = rows.length - 1; i >= 0; i--) { if (rows[i].sh && rows[i].sh.gf !== 0) { zeroAt = i + 1; break; } }
  const last = rows[rows.length - 1]?.sh;
  const tv = [...turns.values()];
  const out = { name, frames: rows.length, travelM: +travel.toFixed(3), held, rollPerM_base: +(rollB / Math.max(travel, 1e-9)).toFixed(1), worstBase: +worstB.toFixed(2),
    rollPerM_S1: +(rollS / Math.max(travel, 1e-9)).toFixed(1), worstS1: +worstS.toFixed(2), gapMax: +gMax.toFixed(1), gapOver45: g45, gapOver90: g90, heldGapMax: +ghMax.toFixed(1),
    twFree: { n: twN, max: +twMax.toFixed(1), sum: +twSum.toFixed(0) }, outSpit: { n: osN, max: +osMax.toFixed(1) }, a2: a2, lastGap: last ? last.gf : null,
    restAfterLastTwist: zeroAt < 0 ? 0 : lastTw < 0 ? null : zeroAt - lastTw,
    turns: { n: tv.length, under90: tv.filter((t) => !t.byMm && !t.out && t.ttw < 90).length, over90: tv.filter((t) => !t.byMm && !t.out && t.ttw >= 90).length, byMm: tv.filter((t) => t.byMm).length, out: tv.filter((t) => t.out).length, ttwMax: +Math.max(0, ...tv.map((t) => t.ttw)).toFixed(1) },
    a6: { base: a6b.length ? [+Math.max(...a6b).toFixed(1), +pct(a6b, 0.95).toFixed(1), a6b.length] : null, s1Gap: a6s.length ? [+Math.max(...a6s).toFixed(1), +pct(a6s, 0.95).toFixed(1), a6s.length] : null } };
  if (process.env.JSON) console.log(JSON.stringify(out));
  else console.log(`${name}: ${out.frames} fr, ${f1(travel)} m, held ${held} | roll/m base ${out.rollPerM_base} (worst ${f1(worstB)}) S1 ${out.rollPerM_S1} (worst ${f1(worstS)}) | gap max ${out.gapMax} >45 ${g45} >90 ${g90} held-gap ${out.heldGapMax} | twFree ${twN}/${out.twFree.max}/${out.twFree.sum} | outSpit ${osN}/${out.outSpit.max} | A2 ${a2.toExponential(1)} | last gap ${out.lastGap} rest ${out.restAfterLastTwist} | turns ${out.turns.n} <90 ${out.turns.under90} >=90 ${out.turns.over90} byMm ${out.turns.byMm} out ${out.turns.out} (max ${out.turns.ttwMax}) | A6 base ${JSON.stringify(out.a6.base)} S1 ${JSON.stringify(out.a6.s1Gap)}`);
}
function sub2(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function ang(a, b) { const c = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1])); return Math.acos(Math.max(-1, Math.min(1, c))) * DEG; }
