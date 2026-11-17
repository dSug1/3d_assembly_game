// ⭐⭐⭐ (2026-11-18, FO1 fix round 1 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §8) THE CIRCLE'S CHECK, on any recording that carries the pose built and
// drawn (`pose`: a DUMP of turn_rec.mjs, or a fast walk of fast_walk_check.mjs, on a build with `probeCamPose`):
//   node scripts/probes/turn_circle.mjs <rec.json> ...        ALL=1 also lists the turns that hold
// Per turn that does not hold (`hold` false): its frames, REPLACED (the next frame runs another turn), its angle `rad` (min..max: a turn whose start is
// carried keeps its first frame's), the GAP between the picture drawn and the target (their one rotation) at its first frame, the most it GREW from a
// frame to the next (GAP+ over 1°), the sum of its decrements, at its end; its one rotation, its PATH (the drawn picture's rotation summed), the TARGET's
// own path (PATH: the path over 1.15 × the larger of the one rotation and the target's path + 5°); its largest frame. Per recording: the picture's
// largest frame inside a turn and outside; the WORST frame with the target's own turn in that frame; the target's worst frame in the run.
import { readFileSync } from "node:fs";
const D = 180 / Math.PI;
const n = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const fr = (eye, look, up) => { const d = n([eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]]); const r = n(cr(up, d)); const u = cr(d, r); return [r, u, d]; };
const rel = (A, B) => { let tr = 0; for (let i = 0; i < 3; i++) tr += A[i][0] * B[i][0] + A[i][1] * B[i][1] + A[i][2] * B[i][2]; return Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))) * D; };
for (const f of process.argv.slice(2)) {
  const C = JSON.parse(readFileSync(f, "utf8"));
  const drawn = C.map((c) => fr(c.c, c.t, c.up));
  const step = C.map((c, i) => (i ? rel(drawn[i - 1], drawn[i]) : 0));
  let inT = 0, outT = 0, outAt = -1;
  C.forEach((c, i) => { if (c.mix || (i && C[i - 1].mix)) inT = Math.max(inT, step[i]); else if (step[i] > outT) { outT = step[i]; outAt = i; } });
  const turns = new Map();
  C.forEach((c, i) => { if (c.mix) { const id = c.mix.id ?? -1; if (!turns.has(id)) turns.set(id, []); turns.get(id).push(i); } });
  let nFree = 0, nHeld = 0, bad = 0;
  const lines = [];
  for (const [id, fr_] of turns) {
    const i0 = fr_[0], i1 = fr_[fr_.length - 1];
    const m0 = C[i0].mix;
    const free = m0.hold === false || C[i1].mix.hold === false;
    const next = i1 + 1 < C.length ? i1 + 1 : i1; // the frame the turn is over (drawn = target) or replaced
    const replaced = next < C.length && C[next].mix && C[next].mix.id !== id;
    let path = 0; for (let i = i0; i <= next; i++) path += step[i];
    const one = rel(drawn[i0 - 1] ?? drawn[i0], drawn[next]);
    let tpath = 0, gapUp = 0, gap0 = null, decr = 0, radMin = Infinity, radMax = -Infinity, maxFr = 0;
    let prevGap = null;
    const lastOwn = replaced ? i1 : next; // a replacing turn's first frame is its own gap, not this turn's
    for (let i = i0; i <= lastOwn; i++) {
      maxFr = Math.max(maxFr, step[i]);
      const p = C[i].pose;
      if (p) {
        const T = fr(...p.to), Dd = fr(...p.drawn);
        const g = rel(T, Dd);
        if (gap0 === null) gap0 = g;
        if (prevGap !== null) { if (g - prevGap > gapUp) gapUp = g - prevGap; if (g < prevGap) decr += prevGap - g; }
        prevGap = g;
        if (i > i0 && C[i - 1].pose) tpath += rel(fr(...C[i - 1].pose.to), T);
      }
      if (C[i].mix && C[i].mix.id === id && C[i].mix.known) { radMin = Math.min(radMin, C[i].mix.rad * D); radMax = Math.max(radMax, C[i].mix.rad * D); }
    }
    const endGap = replaced ? null : C[next].pose ? rel(fr(...C[next].pose.to), fr(...C[next].pose.drawn)) : null;
    if (free) nFree++; else nHeld++;
    const flags = [];
    if (free && gapUp > 1) flags.push("GAP+");
    if (free && radMax - radMin > 2) flags.push("RAD");
    if (free && path > Math.max(one, tpath) * 1.15 + 5) flags.push("PATH");
    if (flags.length) bad++;
    if (free || process.env.ALL)
      lines.push(`  turn ${id} f${i0}-${i1} ${C[i0].leg} ${free ? "FREE" : "held"} frames ${i1 - i0 + 1}${replaced ? " REPLACED" : ""} | rad ${radMin.toFixed(1)}..${radMax.toFixed(1)} | gap first ${gap0?.toFixed(1)} grew at most ${gapUp.toFixed(2)} decrements ${decr.toFixed(1)} end ${endGap?.toFixed(2)} | one ${one.toFixed(1)} path ${path.toFixed(1)} target's path ${tpath.toFixed(1)} largest ${maxFr.toFixed(1)} ${flags.join(" ")}`);
  }
  console.log(`${f.split(/[\\/]/).pop()}: ${C.length} frames, turns ${nFree} free / ${nHeld} held, flagged ${bad}; the picture's largest frame in a turn ${inT.toFixed(1)}°, outside ${outT.toFixed(1)}° (f${outAt})`);
  {
    let w = 0, wi = 0, tw = 0;
    for (let i = 1; i < C.length; i++) if (step[i] > w) { w = step[i]; wi = i; }
    for (let i = 1; i < C.length; i++) if (C[i].pose && C[i - 1].pose) tw = Math.max(tw, rel(fr(...C[i - 1].pose.to), fr(...C[i].pose.to)));
    const t = C[wi].pose && C[wi - 1].pose ? rel(fr(...C[wi - 1].pose.to), fr(...C[wi].pose.to)) : NaN;
    console.log(`  the worst frame ${w.toFixed(1)}° at f${wi} (${C[wi].mix ? (C[wi].mix.hold === false ? "a free turn" : "a held turn") : "no turn"}): the target's own turn there ${t.toFixed(1)}°; the target's worst frame in the run ${tw.toFixed(1)}°`);
  }
  for (const l of lines) console.log(l);
}
