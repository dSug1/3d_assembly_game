// ⭐⭐⭐ THE WALK PROBE'S ANALYSER (POLAR_ORBIT_CLEANUP.md §4) — reads a `walk_probe.mjs` recording and counts, per scenario:
//   JITTER       the gizmo / the piece reversing (a step > 1 mm against the one before, < −0.5 cos) while the finger moves one way
//   BACK-FORTH   a step > 8 mm that comes back within 6 frames to within 4 mm of where it left (gizmo / piece / camera)
//   BLOCKED      the finger moving, the gizmo AND the piece still ≥ 15 frames (the pitch at ±89.5° counted apart: POLE-STALL)
//   JUMP         a step > 2.5 × its largest neighbour's (piece > 15 mm, camera > 15 mm, gizmo > 10 mm); GIZMO-LEAP a gizmo step > 40 mm in one frame
//   FLY-OFF      the piece's distance to the gizmo off its recent median by > max(40 mm, 30 %) with the approach still; or > 4 m
//   OFF-LINES    the gizmo's ring > 8 mm from the green's or the red's joined segments (shown lines)
//   LINE BREAKS  each break of a drawn line, sub-sampled on the map: FALSE (the map continuous there, sub-step < 10 mm — the line cut for nothing) or
//                MAP-JUMP (the map itself jumps: the gizmo will leap there)
//   AGAINST      the gizmo's screen step against the finger (dx / dy legs only)
//   BEHIND       the piece behind its gizmo's face
//   ROLL         the camera's up > 5° off the world's vertical plane on a wall
// Usage: node scripts/probes/walk_analyse.mjs <recording.json> [--frames] [--only=name]
import { readFileSync } from "node:fs";

const rec = JSON.parse(readFileSync(process.argv[2], "utf8"));
const verbose = process.argv.includes("--frames");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null; };
const deg = (x) => (x * 180) / Math.PI;
const mm = (x) => (x * 1000).toFixed(0);
const P = (v) => (v ? `(${v.map(mm).join(",")})` : "-");
const screen = (r) => { const f = unit(sub(r.t, r.c)); const right = f && unit(cross(r.up, f)); return f && right ? { f, right, up: unit(r.up) } : null; };
const b2 = (e) => (e.lo === e.hi ? `${e.lo.toFixed(0)}°` : `${e.lo.toFixed(0)}…${e.hi.toFixed(0)}°`);
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const grand = {};
console.log(`${process.argv[2]}: ${rec.results.length} scenarios, page errors ${rec.errors}`);
for (const sc of rec.results) {
  if (only && sc.name !== only) continue;
  const rows = sc.rows.filter((r) => r.g && r.p && r.c && r.t && r.up && r.leg !== "boot" && !r.leg.startsWith("reset"));
  const T = {};
  const notes = [];
  const bump = (k, n = 1) => { T[k] = (T[k] ?? 0) + n; grand[k] = (grand[k] ?? 0) + n; };
  const where = (r) => `leg ${r.leg} g${P(r.g)} n${r.gn ? r.gn.map((x) => x.toFixed(2)).join(",") : "-"} yaw ${deg(r.ov[0]).toFixed(0)}° v ${r.ov[1].toFixed(3)} ap ${r.ap?.toFixed(3)} band ${r.ms ? r.ms.join("/") : "-"}${r.hv ? " SLIDE" : ""} | ${r.v}`;
  const note = (k, i, s) => { bump(k); notes.push({ k, i, s: `${k} ${s} @${i} ${where(rows[i])}` }); };
  const fingerMoving = (r) => Array.isArray(r.fd) && r.fd[0] !== "A";
  // jumps / leaps
  const step = (i, key) => (i > 0 && i < rows.length ? len(sub(rows[i][key], rows[i - 1][key])) : NaN);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].leg !== rows[i - 1].leg && !rows[i].leg.startsWith(rows[i - 1].leg) && !rows[i - 1].leg.startsWith(rows[i].leg)) continue;
    for (const [key, name, thr] of [["p", "PIECE-JUMP", 0.015], ["c", "CAMERA-JUMP", 0.015], ["g", "GIZMO-JUMP", 0.01]]) {
      const s = step(i, key);
      const nb = [step(i - 2, key), step(i - 1, key), step(i + 1, key), step(i + 2, key)].filter(Number.isFinite);
      const m = Math.max(0, ...nb);
      if (s > thr && s > 2.5 * m) note(name, i, `${mm(s)} mm vs ≤${mm(m)}`);
    }
    const sg = step(i, "g");
    if (sg > 0.04) note("GIZMO-LEAP", i, `${mm(sg)} mm`);
  }
  // back-and-forth
  for (const [key, name] of [["g", "GIZMO-BACKFORTH"], ["p", "PIECE-BACKFORTH"], ["c", "CAMERA-BACKFORTH"]]) {
    for (let i = 1; i < rows.length; i++) {
      if (len(sub(rows[i][key], rows[i - 1][key])) < 0.008) continue;
      const fdk = (r) => (Array.isArray(r.fd) ? r.fd.join(",") : String(r.leg));
      for (let k = i + 1; k <= i + 6 && k < rows.length; k++)
        if (fdk(rows[k]) === fdk(rows[i - 1]) && fdk(rows[i]) === fdk(rows[i - 1]) && rows.slice(i, k + 1).every((r) => fdk(r) === fdk(rows[i - 1])) && len(sub(rows[k][key], rows[i - 1][key])) < 0.004 && len(sub(rows[k][key], rows[i][key])) > 0.0056) { note(name, i, `${mm(len(sub(rows[i][key], rows[i - 1][key])))} mm, back at +${k - i}`); break; }
    }
  }
  // jitter: reversals while the finger goes one way (per segment of a press)
  for (const [key, name] of [["g", "GIZMO-JITTER"], ["p", "PIECE-JITTER"]]) {
    let last = null, lastFd = null, run = [];
    const flush = () => { if (run.length >= 3) note(name, run[0], `${run.length} reversals over ${run[run.length - 1] - run[0] + 1} frames`); run = []; };
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const fd = fingerMoving(r) ? r.fd.join(",") : null;
      if (fd !== lastFd) { flush(); last = null; lastFd = fd; }
      if (fd === null) continue;
      const d = sub(r[key], rows[i - 1][key]);
      if (len(d) < 0.001) continue;
      if (last && dot(d, last) < -0.5 * len(d) * len(last)) { if (run.length && i - run[run.length - 1] > 12) flush(); run.push(i); }
      last = d;
    }
    flush();
  }
  // blocked / pole stall
  {
    let run = 0, from = 0, pole = false;
    const end = () => { if (run >= 15) note(pole ? "POLE-STALL" : "BLOCKED", from, `${run} frames${rows[from].tc ? " (touching)" : ""}`); run = 0; pole = false; };
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const still = len(sub(r.g, rows[i - 1].g)) < 2e-4 && len(sub(r.p, rows[i - 1].p)) < 2e-4;
      if (Array.isArray(r.fd) && still) { if (run === 0) { from = i; pole = false; } run++; if (r.mq && Math.abs(r.mq[1]) > (89.5 * Math.PI) / 180) pole = true; } else end();
    }
    end();
  }
  // fly-off
  {
    const hist = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const d = len(sub(r.p, r.g));
      const apStill = Math.abs((r.ap ?? 0) - (rows[i - 1].ap ?? 0)) < 1e-4 && !r.hv && !rows[i - 1].hv;
      if (hist.length >= 8 && apStill) {
        const m = median(hist.slice(-12));
        if (Math.abs(d - m) > Math.max(0.04, 0.3 * m)) note("FLY-OFF", i, `${mm(d)} mm from the gizmo, recent ${mm(m)} mm`);
      }
      if (apStill) hist.push(d); else hist.length = 0;
    }
  }
  // off-lines
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.show) continue;
    for (const [L, name] of [[r.gl, "green"], [r.rl, "red"]]) if (L && L[1] !== null && L[1] > 8) note("OFF-LINES", i, `${name} ${L[1]} mm`);
  }
  // against the finger / behind / roll
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i], q = rows[i - 1];
    if (r.gn && dot(sub(r.p, r.g), r.gn) < 0) note("BEHIND", i, "");
    const sc0 = screen(q);
    const d = sub(r.g, q.g);
    if (fingerMoving(r) && sc0 && len(d) > 5e-4 && !r.hv) {
      const sx = dot(d, sc0.right), sy = dot(d, sc0.up), l = Math.hypot(sx, sy), f = [r.fd[0], -r.fd[1]], fl = Math.hypot(f[0], f[1]);
      if (l > 5e-4 && fl > 0 && (sx * f[0] + sy * f[1]) / (l * fl) < -0.3) note("AGAINST", i, `screen (${(sx * 1000).toFixed(1)},${(sy * 1000).toFixed(1)}) mm, finger (${f})`);
    }
    const s6 = screen(r);
    if (s6 && r.gn && Math.abs(r.gn[1]) < 0.7 && !r.hv) {
      const w = unit([-s6.f[0] * s6.f[1], 1 - s6.f[1] * s6.f[1], -s6.f[2] * s6.f[1]]);
      if (w && Math.hypot(s6.f[0], s6.f[2]) > 0.3) { const a = deg(Math.acos(Math.max(-1, Math.min(1, dot(w, s6.up))))); if (a > 5) note("ROLL", i, `${a.toFixed(0)}°`); }
    }
  }
  // line breaks, sub-sampled
  const seen = new Set();
  const bins = new Map(); // the break map: line|kind|6° bin of its place → the other angle's range, the worst chord
  for (const b of sc.breaks ?? []) for (const x of b.breaks) {
    { const kind = x.sub < Math.max(6, 0.5 * x.chord) ? "FALSE" : "JUMP"; const bk = `${b.line} ${kind} ${b.line === "red" ? "pitch" : "yaw"} ${(Math.floor(deg(b.line === "red" ? x.x0 - Math.PI / 2 : x.x0) / 6) * 6)}°`;
      const e = bins.get(bk) ?? { lo: Infinity, hi: -Infinity, chord: 0, sub: 0, n: 0 }; e.lo = Math.min(e.lo, deg(b.at)); e.hi = Math.max(e.hi, deg(b.at)); e.chord = Math.max(e.chord, x.chord); e.sub = Math.max(e.sub, x.sub); e.n++; bins.set(bk, e); }
    const k = `${b.line}|${(b.at / 0.05).toFixed(0)}|${x.x0.toFixed(3)}`; // one per place on the line, the other angle in 3° bins
    if (seen.has(k)) continue;
    seen.add(k);
    const kind = x.sub < Math.max(6, 0.5 * x.chord) ? "LINE-FALSE-BREAK" : "LINE-MAP-JUMP";
    bump(kind);
    notes.push({ k: kind, i: b.frame, s: `${kind} ${b.line} at ${b.line === "green" ? "pitch" : "yaw"} ${deg(b.at).toFixed(1)}°, between ${deg(x.x0).toFixed(1)}° and ${deg(x.x1).toFixed(1)}° (${b.line === "red" ? "pitch+90" : "yaw"}): chord ${x.chord} mm, place ${x.place} mm, map sub-step ${x.sub} mm` });
  }
  const binLines = [...bins].sort().map(([k, e]) => `    ${k}+ at ${b2(e)} ×${e.n}: chord ≤${e.chord} mm, map sub-step ≤${e.sub} mm`);
  console.log(`\n=== ${sc.name}: ${rows.length} frames${sc.recorderError ? ` RECORDER ERROR ${sc.recorderError}` : ""} — ${Object.entries(T).map(([k, v]) => `${k} ${v}`).join(", ") || "clean"}`);
  // grouped: per kind, the first few and a count
  // consecutive frames of one kind (within 10 frames) merged into one EVENT, its frame count kept
  const byKind = new Map();
  for (const n of notes) {
    if (!byKind.has(n.k)) byKind.set(n.k, []);
    const L = byKind.get(n.k);
    const e = L[L.length - 1];
    if (e && !n.k.startsWith("LINE") && n.i - e.last <= 10) { e.n++; e.last = n.i; continue; }
    L.push({ ...n, n: 1, last: n.i });
  }
  for (const L of byKind.values()) for (const e of L) if (e.n > 1) e.s += ` [×${e.n} frames to @${e.last}]`;
  if (binLines.length) { console.log("  line-break map (line, kind, where on it, at the other angle):"); binLines.forEach((l) => console.log(l)); }
  console.log(`  events: ${[...byKind].map(([k, L]) => `${k} ${L.length}`).join(", ")}`);
  for (const [k, list] of byKind) {
    if (k.startsWith("LINE")) continue;
    const show = verbose ? list : list.slice(0, 6);
    for (const n of show) console.log(`  ${n.s}`);
    if (list.length > show.length) console.log(`  … ${k} ×${list.length - show.length} more`);
  }
}
console.log(`\nTOTAL: ${Object.entries(grand).map(([k, v]) => `${k} ${v}`).join(", ")}`);
