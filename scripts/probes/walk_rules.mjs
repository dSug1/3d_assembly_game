// ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §1) THE OWNER'S RULES on a walk recording (`walk_probe.mjs`: cax, pr, secs, solids) — R1 – R8. Usage: node scripts/probes/walk_rules.mjs rec.json [scenario]  (SHOW=n examples per rule)
import { readFileSync } from "node:fs";

const [file, only] = process.argv.slice(2);
const d = JSON.parse(readFileSync(file, "utf8"));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const deg = (r) => (r * 180) / Math.PI;
const ang = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b) || 1)))));
const qAng = (p, q) => (p && q ? deg(2 * Math.acos(Math.min(1, Math.abs(p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3])))) : 0);
const AX = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const axisErr = (v) => Math.min(...AX.map((a) => Math.min(ang(v, a), ang(v, a.map((x) => -x)))));

// where on the heptagon: by the gizmo's place against the solid's planes (the face it is nearest)
function where(g, solids) {
  if (!g) return "-";
  const H = solids.find((s) => s.name === "Heptagon");
  let best = null;
  if (!H) {
    // any scene: the nearest face plane of any part, named by its normal
    for (const so of solids) for (const [nx, ny, nz, e] of so.planes) { const dd = Math.abs(nx * g[0] + ny * g[1] + nz * g[2] - e); if (best === null || dd < best.d) best = { d: dd, n: [nx, ny, nz] }; }
    const n = best.n; const k = [0, 1, 2].reduce((m, i) => (Math.abs(n[i]) > Math.abs(n[m]) ? i : m), 0);
    return (["X", "Y", "Z"][k]) + (n[k] > 0 ? "+" : "-");
  }
  for (const [nx, ny, nz, e] of H.planes) {
    const dd = Math.abs(nx * g[0] + ny * g[1] + nz * g[2] - e);
    if (best === null || dd < best.d) best = { d: dd, n: [nx, ny, nz] };
  }
  const n = best.n;
  if (Math.abs(n[0]) > 0.9) return n[0] > 0 ? "CAP+x" : "CAP-x";
  const phi = Math.round(deg(Math.atan2(-n[2], n[1]))); // 0 up; + toward −z (the user)
  const names = { 26: "TOP-front", "-26": "TOP-back", 77: "SIDE-front", "-77": "SIDE-back", 129: "LOW-front", "-129": "LOW-back", 180: "BOTTOM", "-180": "BOTTOM" };
  return names[phi] ?? `phi${phi}`;
}
// the signed distance of a point to the placed solids (each convex: the largest of its planes; the union: the least)
function sdist(p, solids) {
  let best = Infinity;
  for (const s of solids) {
    let m = -Infinity;
    for (const [nx, ny, nz, e] of s.planes) m = Math.max(m, nx * p[0] + ny * p[1] + nz * p[2] - e);
    best = Math.min(best, m);
  }
  return best;
}
// a plane through points: the smallest eigenvector of the covariance (power iteration on the inverse is overkill: brute-force normals on a sphere grid, refined)
function planeResidual(P) {
  if (P.length < 4) return 0;
  const c = P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length, s[2] + p[2] / P.length], [0, 0, 0]);
  const Q = P.map((p) => sub(p, c));
  const cov = [0, 1, 2].map((i) => [0, 1, 2].map((j) => Q.reduce((s, q) => s + q[i] * q[j], 0)));
  // Jacobi eigen
  let A = cov.map((r) => [...r]);
  let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let it = 0; it < 50; it++) {
    let p = 0, q = 1;
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) if (Math.abs(A[i][j]) > Math.abs(A[p][q])) [p, q] = [i, j];
    if (Math.abs(A[p][q]) < 1e-18) break;
    const th = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]);
    const cs = Math.cos(th), sn = Math.sin(th);
    const J = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    J[p][p] = cs; J[q][q] = cs; J[p][q] = sn; J[q][p] = -sn;
    const mul = (X, Y) => X.map((r, i) => [0, 1, 2].map((j) => r[0] * Y[0][j] + r[1] * Y[1][j] + r[2] * Y[2][j]));
    const T = (X) => [0, 1, 2].map((i) => [0, 1, 2].map((j) => X[j][i]));
    A = mul(mul(T(J), A), J);
    V = mul(V, J);
  }
  const k = [0, 1, 2].reduce((m, i) => (A[i][i] < A[m][m] ? i : m), 0);
  const n = [V[0][k], V[1][k], V[2][k]];
  return { res: Math.max(...Q.map((q) => Math.abs(dot(q, n)))), n };
}

for (const r of d.results) {
  if (only && r.name !== only) continue;
  const rows = r.rows;
  const solids = r.solids;
  console.log(`\n=== ${r.name}: ${rows.length} frames${r.recorderError ? " REC-ERROR " + r.recorderError : ""}`);
  const ev = {};
  const add = (k, i, info) => ((ev[k] ??= []).push({ i, info }));
  // ---- the sections (per snapshot): on the surface (the rope), a plane
  for (const s of r.secs) {
    const row = rows[s.frame];
    if (!row || row.hv) continue;
    const ds = s.pts.map((p) => sdist(p, solids));
    const out = ds.map((x, i) => [x, i]).filter(([x]) => x > 0.004);
    const inn = ds.filter((x) => x < -0.004).length;
    if (out.length > 0) {
      const worst = out.reduce((m, q) => (q[0] > m[0] ? q : m));
      add(`ROPE-VOID-${s.line}`, s.frame, `${out.length}/${s.pts.length} pts off the surface, worst ${(worst[0] * 1000).toFixed(0)} mm at ${s.pts[worst[1]].map((x) => x.toFixed(3))} (gizmo on ${where(row.g, solids)}, ${row.tl ? "tilted" : "polar"})`);
    }
    if (inn > 0) add(`ROPE-INSIDE-${s.line}`, s.frame, `${inn}/${s.pts.length} pts inside a part (gizmo on ${where(row.g, solids)})`);
    const pr = planeResidual(s.pts);
    if (pr.res > 0.003) add(`NOT-PLANE-${s.line}`, s.frame, `off its best plane by ${(pr.res * 1000).toFixed(0)} mm (gizmo on ${where(row.g, solids)}, ${row.tl ? "tilted" : "polar"})`);
  }
  // ---- per frame
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (b.hv || a.hv || !b.g || !a.g || !b.cax || !a.cax) continue;
    const moving = Array.isArray(b.fd) && b.fd[0] !== "A";
    const tilted = b.tl != null;
    const loc = `${where(b.g, solids)} ${tilted ? "tilted" : "polar"} d=${b.p ? (len(sub(b.p, b.g)) * 1000).toFixed(0) : "?"}mm leg ${b.leg}`;
    // gizmo at the sections' intersection
    if (b.show && b.gl && b.rl && ((b.gl[1] ?? 0) > 3 || (b.rl[1] ?? 0) > 3)) add("GIZMO-OFF-SECTIONS", i, `green ${b.gl[1]} mm, red ${b.rl[1]} mm — ${loc}`);
    // camera upside down: its up against the world's up, the view not near vertical
    const [R, U, F] = b.cax;
    if (Math.abs(F[1]) < 0.8 && U[1] < -0.1) add("CAMERA-UPSIDE-DOWN", i, `up·Y ${U[1].toFixed(2)} — ${loc}`);
    // tilted: the camera's axes against the world's
    if (tilted) {
      const e = Math.min(axisErr(R), axisErr(U));
      if (e > 5) add("TILTED-NOT-WORLD-ALIGNED", i, `${e.toFixed(1)}° (right ${R.map((x) => x.toFixed(2))}, up ${U.map((x) => x.toFixed(2))}) — ${loc}`);
    }
    // jumps (per frame)
    const sg = len(sub(b.g, a.g)) * 1000, sp = a.p && b.p ? len(sub(b.p, a.p)) * 1000 : 0, sc = len(sub(b.c, a.c)) * 1000, sf = ang(a.cax[2], b.cax[2]);
    if (sg > 30) add("GIZMO-JUMP", i, `${sg.toFixed(0)} mm — ${loc}`);
    if (sp > 40) add("PIECE-JUMP", i, `${sp.toFixed(0)} mm — ${loc}`);
    if (sc > 60 || sf > 6) add("CAMERA-JUMP", i, `${sc.toFixed(0)} mm / ${sf.toFixed(1)}° — ${loc}`);
    // camera roll steps (the screen's right against the horizon, the view not vertical) and the piece's own turn
    if (Math.abs(F[1]) < 0.9 && Math.abs(a.cax[2][1]) < 0.9) {
      const r0 = deg(Math.asin(a.cax[0][1])), r1 = deg(Math.asin(R[1]));
      if (Math.abs(r1 - r0) > 2) add("CAMERA-ROLL-STEP", i, `${(r1 - r0).toFixed(1)}° (roll ${r1.toFixed(1)}°) — ${loc}`);
    }
    const pt = qAng(a.pr, b.pr);
    if (pt > 1) add("PIECE-TURN", i, `${pt.toFixed(1)}° — ${loc}`);
  }
  // blocked: the finger moving, the gizmo and the piece still for 15 frames
  let run = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    const moving = Array.isArray(b.fd) && b.fd[0] !== "A";
    const still = b.g && a.g && len(sub(b.g, a.g)) < 1e-4 && (!b.p || !a.p || len(sub(b.p, a.p)) < 1e-4);
    run = moving && still ? run + 1 : 0;
    if (run === 15) add("BLOCKED", i, `finger ${JSON.stringify(b.fd)} — ${where(b.g, solids)} ${b.tl ? "tilted" : "polar"} leg ${b.leg} ov ${b.ov.map((x) => x.toFixed(3))} v: ${b.v.slice(0, 70)}`);
  }
  // merge consecutive frames per kind; print counts and the first few
  for (const [k, list] of Object.entries(ev).sort()) {
    const merged = [];
    for (const e of list) if (merged.length && e.i - merged.at(-1).last <= 3) merged.at(-1).last = e.i; else merged.push({ ...e, last: e.i });
    console.log(`  ${k}: ${merged.length} events (${list.length} frames)`);
    for (const m of merged.slice(0, Number(process.env.SHOW ?? 4))) console.log(`     @${m.i}${m.last > m.i ? "-" + m.last : ""} ${m.info}`);
  }
}
