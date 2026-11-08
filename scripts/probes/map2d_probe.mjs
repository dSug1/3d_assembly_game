// THE OFFLINE PROBE OF THE TWO 2D CANDIDATES (2026-11-07) — Scene_1's exact placed parts (model pose), in every section plane the lines use:
//   H(y) the green, horizontal planes (x, z); X(x) the red on the front / back, planes x = c (z, y); Z(z) the red on the sides, planes z = c (x, y).
// Per plane: the exact cut (each convex part: the hull of its vertex pairs' crossings), rasterised at RES; recesses narrower than the piece (w) bridged by a
// closing (Q1c); the box loop (the shell's cut, a rectangle) travelled by P at 1 mm steps; G by each candidate:
//   STRETCH  each box side <-> its run of the outline (between the outline's supports in the corners' bisectors), by share of length
//   HARMONIC u = 1 on the box loop, 0 on the parts (Laplace, SOR); G = the end of the field line from P (down the gradient)
// Measures per candidate: jumps (|dG| > 10 mm), the largest; waits (the longest P travel with G within 1 mm); coverage (the outline within 2 mm of a G);
// depth travel (STRETCH: G moving along the side's normal — sliding down a step instead of jumping it); islands (more than one piece after the closing).
import { readFileSync } from "node:fs";
const G = JSON.parse(readFileSync(process.argv[2], "utf8"));
const RES = 0.002, W = G.w;
const fs = G.facets;
const ext = (axis, sg) => fs.find((f) => f.n[axis] === sg).es * sg; // the box's bound along an axis
const BOX = [[ext(0, -1), ext(0, 1)], [ext(1, -1), ext(1, 1)], [ext(2, -1), ext(2, 1)]];
const hull = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return [];
  const t = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && t(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-15) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && t(up[up.length - 2], up[up.length - 1], q) <= 1e-15) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const inside = (poly, x, y) => { for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < -1e-12) return false; } return true; };

function plane(k, c) {
  const [A, B] = [0, 1, 2].filter((i) => i !== k); // the 2D axes
  const [al, ah] = BOX[A], [bl, bh] = BOX[B];
  const nx = Math.round((ah - al) / RES), ny = Math.round((bh - bl) / RES);
  const solid = new Uint8Array(nx * ny);
  for (const vs of G.parts) {
    const s = vs.map((v) => v[k] - c);
    const pts = [];
    for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) if ((s[i] > 0) !== (s[j] > 0) && Math.abs(s[i] - s[j]) > 1e-12) { const t = s[i] / (s[i] - s[j]); pts.push([vs[i][A] + (vs[j][A] - vs[i][A]) * t, vs[i][B] + (vs[j][B] - vs[i][B]) * t]); }
    const h = hull(pts);
    if (h.length < 3) continue;
    const xs = h.map((q) => q[0]), ys = h.map((q) => q[1]);
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - al) / RES)), i1 = Math.min(nx - 1, Math.ceil((Math.max(...xs) - al) / RES));
    const j0 = Math.max(0, Math.floor((Math.min(...ys) - bl) / RES)), j1 = Math.min(ny - 1, Math.ceil((Math.max(...ys) - bl) / RES));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (inside(h, al + (i + 0.5) * RES, bl + (j + 0.5) * RES)) solid[j * nx + i] = 1;
  }
  return { k, c, A, B, al, ah, bl, bh, nx, ny, solid };
}
// a two-pass chamfer distance (in cells) to the set `mask`
function dist(mask, nx, ny) {
  const d = new Float32Array(nx * ny).fill(1e9);
  for (let i = 0; i < nx * ny; i++) if (mask[i]) d[i] = 0;
  const a = 1, b = Math.SQRT2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const q = j * nx + i; let v = d[q];
    if (i > 0) v = Math.min(v, d[q - 1] + a); if (j > 0) v = Math.min(v, d[q - nx] + a); if (i > 0 && j > 0) v = Math.min(v, d[q - nx - 1] + b); if (i < nx - 1 && j > 0) v = Math.min(v, d[q - nx + 1] + b); d[q] = v; }
  for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const q = j * nx + i; let v = d[q];
    if (i < nx - 1) v = Math.min(v, d[q + 1] + a); if (j < ny - 1) v = Math.min(v, d[q + nx] + a); if (i < nx - 1 && j < ny - 1) v = Math.min(v, d[q + nx + 1] + b); if (i > 0 && j < ny - 1) v = Math.min(v, d[q + nx - 1] + b); d[q] = v; }
  return d;
}
// Q1c — the closing by the piece's half width (gaps and recesses narrower than the piece bridged)
function close(P) {
  const R = W / 2 / RES;
  const d1 = dist(P.solid, P.nx, P.ny);
  const dil = new Uint8Array(P.nx * P.ny);
  for (let i = 0; i < dil.length; i++) dil[i] = d1[i] <= R ? 1 : 0;
  const out = new Uint8Array(P.nx * P.ny);
  for (let i = 0; i < out.length; i++) out[i] = dil[i] ? 0 : 1;
  // the box's border counts as outside (a part at the shell is not grown past it)
  const d2 = dist(out, P.nx, P.ny);
  const cl = new Uint8Array(P.nx * P.ny);
  for (let j = 0; j < P.ny; j++) for (let i = 0; i < P.nx; i++) { const q = j * P.nx + i; const edge = Math.min(i + 0.5, j + 0.5, P.nx - i - 0.5, P.ny - j - 0.5); cl[q] = P.solid[q] || (dil[q] && d2[q] > R && edge > R) ? 1 : 0; }
  return cl;
}
function components(m, nx, ny) {
  const lab = new Int32Array(nx * ny).fill(-1); let n = 0; const sizes = [];
  for (let s = 0; s < nx * ny; s++) { if (!m[s] || lab[s] >= 0) continue; const st = [s]; lab[s] = n; let c = 0;
    while (st.length) { const q = st.pop(); c++; const i = q % nx, j = (q / nx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue; const r = b * nx + a; if (m[r] && lab[r] < 0) { lab[r] = n; st.push(r); } } }
    sizes.push(c); n++; }
  return { lab, sizes };
}
// the outer boundary of the component `want`: its boundary cells (a solid cell with an empty 4-neighbour reachable from the box border), ordered by angle
// round the component — an approximation of the traced outline good for runs and coverage
function outline(m, lab, want, nx, ny) {
  // the empty cells connected to the box border
  const ext = new Uint8Array(nx * ny); const st = [];
  for (let i = 0; i < nx; i++) for (const j of [0, ny - 1]) { const q = j * nx + i; if (!m[q] && !ext[q]) { ext[q] = 1; st.push(q); } }
  for (let j = 0; j < ny; j++) for (const i of [0, nx - 1]) { const q = j * nx + i; if (!m[q] && !ext[q]) { ext[q] = 1; st.push(q); } }
  while (st.length) { const q = st.pop(); const i = q % nx, j = (q / nx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue; const r = b * nx + a; if (!m[r] && !ext[r]) { ext[r] = 1; st.push(r); } } }
  const cells = [];
  for (let q = 0; q < nx * ny; q++) { if (lab[q] !== want) continue; const i = q % nx, j = (q / nx) | 0; let b = i === 0 || j === 0 || i === nx - 1 || j === ny - 1;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, c = j + dj; if (a >= 0 && c >= 0 && a < nx && c < ny && ext[c * nx + a]) b = true; } if (b) cells.push([i + 0.5, j + 0.5]); }
  return { cells, ext };
}
// Moore tracing of the outer boundary of component `want` (ordered, counter-clockwise), in cell units
function trace(m, lab, want, nx, ny) {
  const isS = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && lab[j * nx + i] === want;
  let s = -1;
  for (let j = 0; j < ny && s < 0; j++) for (let i = 0; i < nx; i++) if (isS(i, j)) { s = j * nx + i; break; }
  if (s < 0) return [];
  const N = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  let ci = s % nx, cj = (s / nx) | 0, dir = 6; const out = [[ci + 0.5, cj + 0.5]]; const si = ci, sj = cj;
  for (let it = 0; it < 4 * nx * ny; it++) {
    let found = false;
    for (let k = 0; k < 8; k++) { const d = (dir + 6 + k) % 8; const a = ci + N[d][0], b = cj + N[d][1]; if (isS(a, b)) { ci = a; cj = b; dir = d; found = true; break; } }
    if (!found) break;
    if (ci === si && cj === sj) break;
    out.push([ci + 0.5, cj + 0.5]);
  }
  let ar = 0; for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length]; ar += a[0] * b[1] - b[0] * a[1]; }
  return ar < 0 ? out.reverse() : out;
}
// the box loop, CCW from corner (al, bl), at 1 mm: its points (cell units), its side (0 b-low, 1 a-high, 2 b-high, 3 a-low) and share along the side
function loop(P) {
  const L = [], step = 0.001 / RES, X = P.nx, Y = P.ny;
  const sides = [[[0, 0], [X, 0]], [[X, 0], [X, Y]], [[X, Y], [0, Y]], [[0, Y], [0, 0]]];
  sides.forEach(([a, b], si) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.round(len / step)); for (let k = 0; k < n; k++) { const t = k / n; L.push({ p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], side: si, share: t }); } });
  return L;
}
const NORM = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function stretch(P, tr, L) {
  const cum = [0]; for (let i = 1; i <= tr.length; i++) { const a = tr[i - 1], b = tr[i % tr.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const sup = (d) => { let best = 0, bv = -1e18; tr.forEach((q, i) => { const v = q[0] * d[0] + q[1] * d[1]; if (v > bv) { bv = v; best = i; } }); return best; };
  const cs = [sup([-1, -1]), sup([1, -1]), sup([1, 1]), sup([-1, 1])];
  const total = cum[tr.length];
  const at = (len) => { len = ((len % total) + total) % total; let lo = 0, hi = tr.length; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= len) lo = m; else hi = m; } const a = tr[lo], b = tr[(lo + 1) % tr.length]; const seg = cum[lo + 1] - cum[lo]; const t = seg > 0 ? (len - cum[lo]) / seg : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
  return L.map((q) => { const a = cum[cs[q.side]], b = cum[cs[(q.side + 1) % 4]]; let run = b - a; if (run < 0) run += total; return at(a + run * q.share); });
}
function harmonic(P, m) {
  const nx = P.nx, ny = P.ny; const u = new Float32Array(nx * ny).fill(0.5);
  for (let i = 0; i < u.length; i++) if (m[i]) u[i] = 0;
  const get = (i, j) => (i < 0 || j < 0 || i >= nx || j >= ny ? 1 : u[j * nx + i]);
  for (let it = 0; it < 6000; it++) { let mx = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const q = j * nx + i; if (m[q]) continue; const v = 0.25 * (get(i - 1, j) + get(i + 1, j) + get(i, j - 1) + get(i, j + 1)); const d = v - u[q]; u[q] += 1.9 * d; if (Math.abs(d) > mx) mx = Math.abs(d); }
    if (mx < 2e-6) break; }
  const U = (x, y) => { const i = Math.floor(x - 0.5), j = Math.floor(y - 0.5), fx = x - 0.5 - i, fy = y - 0.5 - j; const a = get(i, j), b = get(i + 1, j), c = get(i, j + 1), d = get(i + 1, j + 1); return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy; };
  const solidAt = (x, y) => { const i = Math.floor(x), j = Math.floor(y); return i >= 0 && j >= 0 && i < nx && j < ny && m[j * nx + i]; };
  return (p0) => { let x = Math.min(nx - 0.01, Math.max(0.01, p0[0])), y = Math.min(ny - 0.01, Math.max(0.01, p0[1]));
    for (let s = 0; s < 20000; s++) { if (solidAt(x, y)) return [x, y]; const h = 0.25; const gx = U(x + h, y) - U(x - h, y), gy = U(x, y + h) - U(x, y - h); const l = Math.hypot(gx, gy);
      if (l < 1e-12) return [x, y]; x -= (gx / l) * 0.3; y -= (gy / l) * 0.3; x = Math.min(nx - 0.01, Math.max(0.01, x)); y = Math.min(ny - 0.01, Math.max(0.01, y)); }
    return [x, y]; };
}
function measure(Gs, L, P, tr) {
  const mm = RES * 1000;
  let jumps = 0, maxJ = 0, maxWait = 0, depth = 0;
  for (let i = 0; i < Gs.length; i++) { const a = Gs[i], b = Gs[(i + 1) % Gs.length]; const d = Math.hypot(b[0] - a[0], b[1] - a[1]) * mm; if (d > 10) jumps++; maxJ = Math.max(maxJ, d);
    const n = NORM[L[i].side]; const along = Math.abs((b[0] - a[0]) * n[0] + (b[1] - a[1]) * n[1]), across = Math.abs((b[0] - a[0]) * n[1] - (b[1] - a[1]) * n[0]); if (along > across && d > 0.05) depth++; }
  // the longest P travel (mm) with G within 1 mm of where it was at the stretch's start
  for (let i = 0; i < Gs.length; ) { let j = i + 1; while (j < Gs.length && Math.hypot(Gs[j][0] - Gs[i][0], Gs[j][1] - Gs[i][1]) * mm < 1) j++; maxWait = Math.max(maxWait, j - i - 1); i = j; }
  // coverage: the traced outline's cells within 2 mm of some G
  let cov = 0; const r = 2 / mm;
  const grid = new Map(); for (const g of Gs) { const k = `${Math.floor(g[0] / r)},${Math.floor(g[1] / r)}`; (grid.get(k) ?? grid.set(k, []).get(k)).push(g); }
  for (const c of tr) { const ci = Math.floor(c[0] / r), cj = Math.floor(c[1] / r); let ok = false; for (let a = -1; a <= 1 && !ok; a++) for (let b = -1; b <= 1 && !ok; b++) for (const g of grid.get(`${ci + a},${cj + b}`) ?? []) if (Math.hypot(g[0] - c[0], g[1] - c[1]) <= r) { ok = true; break; } if (ok) cov++; }
  return { jumps, maxJ, maxWait, cov: tr.length ? cov / tr.length : 0, depth: depth / Gs.length };
}
const fam = [];
for (let y = BOX[1][0] + 0.005; y < BOX[1][1]; y += 0.01) fam.push(["H green y=", 1, y]);
for (let x = BOX[0][0] + 0.005; x < BOX[0][1]; x += 0.01) fam.push(["X red x=", 0, x]);
for (let z = BOX[2][0] + 0.005; z < BOX[2][1]; z += 0.01) fam.push(["Z red z=", 2, z]);
const agg = {};
const rows = [];
for (const [name, k, c] of fam) {
  const P = plane(k, c);
  const raw = components(P.solid, P.nx, P.ny);
  if (raw.sizes.length === 0) { rows.push([name + c.toFixed(3), "EMPTY"]); continue; }
  const m = close(P);
  const comp = components(m, P.nx, P.ny);
  const main = comp.sizes.indexOf(Math.max(...comp.sizes));
  const tr = trace(m, comp.lab, main, P.nx, P.ny);
  const L = loop(P);
  const S = measure(stretch(P, tr, L), L, P, tr);
  const hm = harmonic(P, m);
  const H = measure(L.map((q) => hm(q.p)), L, P, tr);
  const fk = name.split(" ")[0];
  const a = (agg[fk] ??= { planes: 0, islands: 0, S: [], H: [] }); a.planes++; if (comp.sizes.length > 1) a.islands++; a.S.push(S); a.H.push(H);
  rows.push([name + c.toFixed(3), `parts ${raw.sizes.length} → ${comp.sizes.length} after closing`, `STRETCH jumps ${S.jumps} max ${S.maxJ.toFixed(0)} wait ${S.maxWait} cov ${(100 * S.cov).toFixed(0)}% depth ${(100 * S.depth).toFixed(0)}%`, `HARMONIC jumps ${H.jumps} max ${H.maxJ.toFixed(0)} wait ${H.maxWait} cov ${(100 * H.cov).toFixed(0)}%`]);
}
for (const r of rows) console.log(r.join(" | "));
const q = (a, f, p) => { const s = a.map(f).sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
console.log("\n=== BY FAMILY (planes; with islands after the closing)");
for (const [fk, a] of Object.entries(agg)) for (const [c, A] of [["STRETCH", a.S], ["HARMONIC", a.H]])
  console.log(`${fk} ${c}: planes ${a.planes} (islands ${a.islands}) | planes with a jump >10 mm ${A.filter((x) => x.jumps > 0).length}, largest ${Math.max(...A.map((x) => x.maxJ)).toFixed(0)} mm | wait (mm of P) median ${q(A, (x) => x.maxWait, 0.5)} max ${Math.max(...A.map((x) => x.maxWait))} | outline covered median ${(100 * q(A, (x) => x.cov, 0.5)).toFixed(0)}% min ${(100 * Math.min(...A.map((x) => x.cov))).toFixed(0)}% | G sliding in depth median ${(100 * q(A, (x) => x.depth, 0.5)).toFixed(0)}%`);
