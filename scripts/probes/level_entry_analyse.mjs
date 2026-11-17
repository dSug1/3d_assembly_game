// ⭐⭐⭐ (2026-11-17, package LF1 — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §7, §10) THE LEVEL FACE'S ENTRY GATE, the analysis of the
// recordings of `level_entry_check.mjs` (the study's `events.mjs` and `loopan.mjs` in one file, plus the path of every timed turn — the lesson of
// package A, `BOTTOM_FACE_CIRCLE_REGRESSION.md` §5: a gate on a frame's speed does not see the SHAPE of a turn's path).
//   node scripts/probes/level_entry_analyse.mjs <rec.json> ...       (the runbook: scripts/probes/ORBIT_GATES.md §7)
//   NY (−0.85) the level face: the gizmo's face normal y under NY (INV=1: over NY — a top); TX (mm) the dy's aimed x (the drift's second reading);
//   MIN (2) a turn under MIN° of roll and of view is not listed; ALL=1 lists every turn.
// Per recording:
// * EVENTS — every change of face into (IN) / out of (OUT) the level face: the timed turn round it (frames, its roll on the glass summed — the up's turn
//   about the look —, the view's turn, the largest roll in a frame, the frames the gizmo is held), the roll in the 20 frames BEFORE the edge (sum and
//   largest), the picture's roll off upright on the glass (`rollW`) and the axis x's angle on the glass, 2 frames before / 3 after; the view's elevation.
// * DRIFT — on a walk straight down onto the face (the leg `down-to-bottom`): the gizmo's x at the entry, at the far edge's exit, and after the leg's
//   settle; drift = the settle's x − the entry's (and − TX: the study's reading).
// * TURNS — every timed camera turn (frames with `mix`, contiguous, its share not falling): leg, frames, the roll on the glass (signed), the view's
//   turn, the largest roll in a frame, the LARGEST FRAME (the whole camera frame's turn in one frame), THE ONE ROTATION (the angle of the single
//   rotation from the camera's orientation the frame before the turn to the one at its last frame), THE PATH (the sum of each frame's rotation angle),
//   their ratio; ⚠ PATH when the path is over 1.15 × the one rotation + 5°. Per loop (`loopN-…` legs): turns, |roll| summed, net, frames, gizmo held.
import { readFileSync } from "node:fs";

const NY = +(process.env.NY ?? -0.85);
const INV = process.env.INV === "1";
const TX = process.env.TX === undefined || process.env.TX === "" ? null : +process.env.TX;
const MIN = +(process.env.MIN ?? 2);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const deg = (x) => (x * 180) / Math.PI;
const perp = (v, l) => { const k = dot(v, l); return [v[0] - k * l[0], v[1] - k * l[1], v[2] - k * l[2]]; };
const sog = (from, to, l) => { const a = unit(from), b = unit(to); return deg(Math.atan2(dot(cross(a, b), l), dot(a, b))); };
const ang = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, dot(a, b)))));
const f1 = (x) => (isNaN(x) ? "  - " : x.toFixed(1));

/** the camera's frame: look, up (square to the look), right */
const frame3 = (x) => { const l = unit(sub(x.t, x.c)); const u = unit(perp(x.up, l)); return [l, u, cross(u, l)]; };
/** the angle (deg) of the one rotation taking the frame A to the frame B (trace of B·Aᵀ) */
const relAngle = (A, B) => { let tr = 0; for (let i = 0; i < 3; i++) tr += dot(A[i], B[i]); return deg(Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)))); };

for (const file of process.argv.slice(2)) {
  const C = JSON.parse(readFileSync(file, "utf8"));
  const fr = C.map((x) => { const l = unit(sub(x.t, x.c)); return { l, u: unit(perp(x.up, l)) }; });
  const F3 = C.map(frame3);
  const rollPart = (i) => { const a = fr[i - 1], b = fr[i]; const ax = cross(a.l, b.l), sn = len(ax), cs = dot(a.l, b.l); let u0 = a.u;
    if (sn > 1e-12) { const k = unit(ax), kxu = cross(k, u0), kd = dot(k, u0); u0 = [0, 1, 2].map((j) => u0[j] * cs + kxu[j] * sn + k[j] * kd * (1 - cs)); }
    return sog(unit(u0), b.u, b.l); };
  const rollW = (i) => { const f = fr[i]; const Y = perp([0, 1, 0], f.l); return len(Y) > 0.05 ? sog(f.u, Y, f.l) : NaN; };
  const axis = (i) => { const f = fr[i]; const X = perp([1, 0, 0], f.l); return len(X) > 0.05 ? sog(f.u, X, f.l) : NaN; };
  const gstep = (i) => (C[i].g && C[i - 1].g ? len(sub(C[i].g, C[i - 1].g)) * 1000 : NaN);
  console.log(`# ${file.split(/[\\/]/).pop()}  (${C.length} frames)`);

  // ---- EVENTS
  let last = -100;
  const ev = [];
  for (let i = 1; i < C.length; i++) {
    const n0 = C[i - 1].n, n1 = C[i].n; if (!n0 || !n1) continue;
    const a = INV ? n0[1] > NY : n0[1] < NY, b = INV ? n1[1] > NY : n1[1] < NY; if (a === b || i - last < 6) continue;
    last = i;
    const kind = b ? "IN " : "OUT";
    let s = -1; for (let j = Math.max(1, i - 15); j <= Math.min(C.length - 1, i + 30); j++) if (C[j].mix) { s = j; break; }
    let e = s; if (s >= 0) while (e + 1 < C.length && C[e + 1].mix && e - s < 120) e++;
    let roll = 0, turn = 0, maxR = 0, held = 0;
    if (s >= 0) for (let j = s; j <= e; j++) { const r = rollPart(j); roll += r; turn += ang(fr[j - 1].l, fr[j].l); maxR = Math.max(maxR, Math.abs(r)); if (gstep(j) < 0.5) held++; }
    let maxB = 0, sumB = 0; const i0 = s >= 0 ? Math.min(s, i) : i; for (let j = Math.max(1, i0 - 20); j < i0; j++) { const r = rollPart(j); sumB += r; if (Math.abs(r) > Math.abs(maxB)) maxB = r; }
    let maxA = 0; for (let j = i; j <= Math.min(C.length - 1, i + 40); j++) { const r = rollPart(j); if (Math.abs(r) > Math.abs(maxA)) maxA = r; }
    const bi = Math.max(1, (s >= 0 ? Math.min(s, i) : i) - 2), ai = Math.min(C.length - 1, (s >= 0 ? e : i) + 3);
    const g = C[i].g;
    ev.push({ kind, i, x: g ? g[0] : NaN });
    console.log(`  ${kind} f${i} ${C[i].leg.padEnd(18).slice(0, 18)} gizmo x ${g ? (g[0] * 1000).toFixed(0).padStart(4) : "  - "} z ${g ? (g[2] * 1000).toFixed(0).padStart(4) : "  - "} | turn ${s < 0 ? "none" : `${e - s + 1} fr, roll ${roll.toFixed(1)}°, view ${turn.toFixed(1)}°, max ${maxR.toFixed(1)}°/fr, gizmo held ${held} fr`} | before edge: roll ${sumB.toFixed(1)}° in 20 fr (max ${maxB.toFixed(1)}) | after: max ${maxA.toFixed(1)}°/fr | rollW ${f1(rollW(bi))} -> ${f1(rollW(ai))}, axis ${f1(axis(bi))} -> ${f1(axis(ai))}, vEl ${deg(Math.asin(fr[ai].l[1])).toFixed(0)}, sqq ${C[ai].sqq.toFixed(2)}, hold ${C[ai].eh}`);
  }

  // ---- DRIFT (a straight dy onto the face: the leg `down-to-bottom`)
  const inEv = ev.find((x) => x.kind === "IN " && C[x.i].leg === "down-to-bottom");
  if (inEv !== undefined) {
    const outEv = ev.find((x) => x.kind === "OUT" && x.i > inEv.i && C[x.i].leg === "down-to-bottom");
    let set = -1; for (let i = C.length - 1; i >= 0; i--) if (C[i].leg === "down-to-bottom-settle") { set = i; break; }
    const xs = set >= 0 && C[set].g ? C[set].g[0] : NaN;
    console.log(`  DRIFT the dy's gizmo x: at the entry ${(inEv.x * 1000).toFixed(0)} mm, at the far edge's exit ${outEv ? (outEv.x * 1000).toFixed(0) : "-"} mm, after the settle ${(xs * 1000).toFixed(0)} mm — drift from the entry ${((xs - inEv.x) * 1000).toFixed(0)} mm${TX !== null ? `, from TX ${TX}: ${(xs * 1000 - TX).toFixed(0)} mm` : ""}`);
  }

  // ---- TURNS (and their paths)
  const turns = [];
  for (let i = 1; i < C.length; i++) {
    if (!C[i].mix) continue;
    let e = i; while (e + 1 < C.length && C[e + 1].mix && C[e + 1].mix.k >= C[e].mix.k - 1e-9) e++;
    let roll = 0, view = 0, held = 0, mx = 0, path = 0, big = 0;
    for (let j = i; j <= e; j++) {
      const r = rollPart(j); roll += r; view += ang(fr[j - 1].l, fr[j].l); mx = Math.max(mx, Math.abs(r));
      const g0 = C[j - 1].g, g1 = C[j].g; if (g0 && g1 && len(sub(g0, g1)) * 1000 < 0.5) held++;
      const a = relAngle(F3[j - 1], F3[j]); path += a; big = Math.max(big, a);
    }
    const one = relAngle(F3[i - 1], F3[e]);
    turns.push({ s: i, e, leg: C[i].leg, roll, view, held, mx, one, path, big, by: C[i].mix.byMm ? "mm" : C[i].mix.out ? "out" : "" });
    i = e;
  }
  const loops = new Map();
  let nPath = 0;
  for (const t of turns) {
    const listed = Math.abs(t.roll) >= MIN || t.view >= MIN || t.one >= MIN;
    const bad = t.path > 1.15 * t.one + 5;
    if (bad) nPath++;
    if (process.env.ALL || listed || bad) {
      console.log(`  TURN f${t.s} ${t.leg.padEnd(16).slice(0, 16)} ${String(t.e - t.s + 1).padStart(3)} fr  roll ${t.roll.toFixed(1).padStart(7)}°  view ${t.view.toFixed(1).padStart(6)}°  max roll ${t.mx.toFixed(1)}°/fr  largest frame ${t.big.toFixed(1)}°  one rotation ${t.one.toFixed(1)}°  path ${t.path.toFixed(1)}°  ratio ${(t.one > 1e-6 ? t.path / t.one : NaN).toFixed(2)}  held ${t.held} ${t.by}${bad ? "  ⚠ PATH" : ""}`);
    }
    const m = /^loop(\d+)/.exec(t.leg); if (!m || !listed) continue;
    const L = loops.get(m[1]) ?? { n: 0, abs: 0, net: 0, fr: 0, held: 0, small: 0 }; L.n++; L.abs += Math.abs(t.roll); L.net += t.roll; L.fr += t.e - t.s + 1; L.held += t.held; if (Math.abs(t.roll) < 30) L.small++; loops.set(m[1], L);
  }
  for (const [k, L] of loops) console.log(`  LOOP ${k}: ${L.n} turns (${L.small} under 30°), |roll| ${L.abs.toFixed(0)}°, net ${L.net.toFixed(0)}°, ${L.fr} frames, gizmo held ${L.held}`);
  console.log(`  TURNS ${turns.length} (${turns.filter((t) => Math.abs(t.roll) >= MIN || t.view >= MIN || t.one >= MIN).length} listed), path over 1.15 × one + 5°: ${nPath}`);
}
