/**
 * ⭐⭐⭐ (2026-11-23, S6 packet 2 — `30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §3 R1, R1b, R2; §7.1 rows 4, 5, 9; §7.3 Q3 — DECIDED) THE PROXY
 * COVERS ITS PART, IS CLOSED, AND CAPS ITS HOLLOWS — per part ALONE (R1: *"the part alone"*), in its frame, in mm:
 * * **R1 — the OUTER SURFACE**: the render meshes voxelized (a step ≤ ρ / 2 — §7.1 row 9), the part's solid (the outside flooded from the border, the
 *   surface as walls), CLOSED at ρ (a ball of radius ρ rolled from outside: an opening narrower than 2ρ bridged, an inner void filled) — two exact
 *   distance transforms (Felzenszwalb & Huttenlocher, *Distance Transforms of Sampled Functions*, 2012), the voxel-side form of the alpha-wrap (§5).
 * * **R1b — what must be CAPPED**: each point of that surface reads its SKY — the straight directions that leave the part without meeting it (one voxel
 *   ray per direction of a Fibonacci sphere): NONE — an UNDERCUT (mould visibility — Chen, Chou & Woo 1993); the widest cone in it narrower than
 *   `R1B_DEEP_DEG` — a cavity DEEPER than its mouth is wide (a wall's foot sees (90° − atan(depth / width)) / 2: 22.5° when they are equal);
 *   between that and `R1B_AMBER_DEG` (atan ½: the floor's centre when they are equal) — the BORDERLINE, amber, for the author. Each such point must lie
 *   behind a CAP (`…_cap…`): the outside, flooded with the caps as walls, never reaches it.
 * * **R2 the other way — COVERAGE**: every point of the outer surface the outside reaches (the caps as walls) within τ of a proxy face — a curve's
 *   facet: its recorded sagitta (`fidelityOf`'s `dMax`) + τ — read at the REAL surface's point nearest the voxel (exact), or at the voxel where the
 *   surface is bridged (+ the voxel's own error, 1.87 steps).
 * * **R2 — CLOSED**: every edge of the proxy's faces (the real ones and the caps — a resting proxy apart) has a face on its other side, within the
 *   flush (read along the edge every 2 mm: a T-junction is shared).
 * * **R1b — a CAP sits ON its mouth**: its rim on the real proxy's edges, within the flush.
 * Every finding named (the part, where, how much). Pure, engine-free.
 */
import { closestOnTriangle, fidelityOf, isVirtualProxy, pointSegment, pointTriangle, proxyFaceModels, R4_HALF_STEP_DEG, R7_PLANAR_DEG, triGrid, type PartSolids, type ProxyFinding } from "./part_checks";
import { PROXY_CURVE_TOL_MM, PROXY_FLUSH_MM, PROXY_PROBE_MM } from "./units";
import { cross, dot, sub, type Vec3 } from "./vec";

/** ⭐ (R1b) a wall's foot sees its sky through at most this half-width (degrees) when its cavity is as deep as its mouth is wide: (90° − 45°) / 2 */
export const R1B_DEEP_DEG = 22.5;
/** ⭐ (R1b) the amber band's top (degrees): the floor's centre of a cavity as deep as it is wide — atan ½ */
export const R1B_AMBER_DEG = (Math.atan(0.5) * 180) / Math.PI;
/** ⭐ (R1b) the sky's directions (a Fibonacci sphere: ≈ 7° apart — the widest cone read to half that) */
export const R1B_SKY_N = 800;
/** ⭐ (R1b) the refined sky's spacing (degrees) — where the coarse reading straddles a threshold */
export const R1B_FINE_DEG = 2;
/** ⭐ (§7.1 row 9) the voxel step (mm): ρ / 2 */
export const COVER_STEP_MM = PROXY_PROBE_MM / 2;
/** ⭐ (R2, closed) an edge read every this (mm) */
export const CLOSED_STEP_MM = 2;

interface Grid {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
  readonly h: number;
  readonly o: Vec3;
}
type Tri = readonly [Vec3, Vec3, Vec3];
const RAD = Math.PI / 180;

/** the voxels whose centre lies within `r0` mm of a triangle */
function raster(g: Grid, tris: readonly Tri[], r0: number, m: Uint8Array): void {
  const dims = [g.nx, g.ny, g.nz];
  for (const [a, b, c] of tris) {
    const cr = cross(sub(b, a), sub(c, a));
    const L = Math.hypot(cr[0], cr[1], cr[2]);
    const lo = [0, 1, 2].map((x) => Math.max(0, Math.floor((Math.min(a[x]!, b[x]!, c[x]!) - r0 - g.o[x]!) / g.h)));
    const hi = [0, 1, 2].map((x) => Math.min(dims[x]! - 1, Math.ceil((Math.max(a[x]!, b[x]!, c[x]!) + r0 - g.o[x]!) / g.h)));
    for (let k = lo[2]!; k <= hi[2]!; k++)
      for (let j = lo[1]!; j <= hi[1]!; j++)
        for (let i = lo[0]!; i <= hi[0]!; i++) {
          const p: Vec3 = [g.o[0] + i * g.h, g.o[1] + j * g.h, g.o[2] + k * g.h];
          if (L > 1e-12 && Math.abs((cr[0] * (p[0] - a[0]) + cr[1] * (p[1] - a[1]) + cr[2] * (p[2] - a[2])) / L) > r0) continue;
          if (pointTriangle(p, a, b, c) <= r0) m[i + g.nx * (j + g.ny * k)] = 1;
        }
  }
}
/** the voxels reached from the grid's border through `pass` (6-connected) */
function flood(g: Grid, pass: Uint8Array): Uint8Array {
  const { nx, ny, nz } = g;
  const n = nx * ny * nz;
  const seen = new Uint8Array(n);
  const q = new Int32Array(n);
  let head = 0, tail = 0;
  const push = (x: number) => {
    if (pass[x] && !seen[x]) {
      seen[x] = 1;
      q[tail++] = x;
    }
  };
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) push(i + nx * (j + ny * k));
  while (head < tail) {
    const x = q[head++]!;
    const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
    if (i > 0) push(x - 1);
    if (i < nx - 1) push(x + 1);
    if (j > 0) push(x - nx);
    if (j < ny - 1) push(x + nx);
    if (k > 0) push(x - nx * ny);
    if (k < nz - 1) push(x + nx * ny);
  }
  return seen;
}
/** the squared distance (in steps²) from each voxel to the nearest voxel of `src` — exact (Felzenszwalb & Huttenlocher 2012) */
function edt(g: Grid, src: Uint8Array): Float64Array {
  const { nx, ny, nz } = g;
  const INF = 1e20;
  const D = new Float64Array(nx * ny * nz);
  for (let x = 0; x < D.length; x++) D[x] = src[x] ? 0 : INF;
  const m = Math.max(nx, ny, nz);
  const f = new Float64Array(m), d = new Float64Array(m), z = new Float64Array(m + 1);
  const v = new Int32Array(m);
  const line = (len: number) => {
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
      while (s <= z[k]!) {
        k--;
        s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (z[k + 1]! < q) k++;
      d[q] = (q - v[k]!) * (q - v[k]!) + f[v[k]!]!;
    }
  };
  const pass = (len: number, stride: number, starts: number[]) => {
    for (const s0 of starts) {
      for (let q = 0; q < len; q++) f[q] = D[s0 + q * stride]!;
      line(len);
      for (let q = 0; q < len; q++) D[s0 + q * stride] = d[q]!;
    }
  };
  const sx: number[] = [], sy: number[] = [], sz: number[] = [];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) sx.push(nx * (j + ny * k));
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) sy.push(i + nx * ny * k);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) sz.push(i + nx * j);
  pass(nx, 1, sx);
  pass(ny, nx, sy);
  pass(nz, nx * ny, sz);
  return D;
}

/** the sky's directions and, for each, its neighbours by angle up to `capDeg` (nearest first) */
function sky(n: number, capDeg: number): { dirs: Vec3[]; nb: Int32Array[]; ang: Float64Array[]; half: number } {
  const dirs: Vec3[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y);
    dirs.push([r * Math.cos(ga * i), y, r * Math.sin(ga * i)]);
  }
  const half = Math.sqrt((4 * Math.PI) / n) / 2 / RAD;
  const cosCap = Math.cos(capDeg * RAD);
  const nb: Int32Array[] = [], ang: Float64Array[] = [];
  for (let i = 0; i < n; i++) {
    const l: [number, number][] = [];
    for (let j = 0; j < n; j++) {
      const c = dot(dirs[i]!, dirs[j]!);
      if (j !== i && c >= cosCap) l.push([j, Math.acos(Math.min(1, c)) / RAD]);
    }
    l.sort((a, b) => a[1] - b[1]);
    nb.push(Int32Array.from(l.map((x) => x[0])));
    ang.push(Float64Array.from(l.map((x) => x[1])));
  }
  return { dirs, nb, ang, half };
}
let SKY: ReturnType<typeof sky> | null = null;

/** one finding's place, rounded */
const at = (p: Vec3) => `(${p.map((x) => x.toFixed(0)).join(", ")})`;

/**
 * ⭐⭐⭐ (S6, packet 2) COVERAGE, CLOSURE AND CAPS on each part (`readPartSolids`: its proxy nodes, its render meshes) — `stepMm` the voxel step
 * (`COVER_STEP_MM`); a part with no render or no proxy read not. `info` findings: the amber borderline (R1b).
 */
export function checkProxyCover(parts: readonly PartSolids[], stepMm: number = COVER_STEP_MM): ProxyFinding[] {
  const out: ProxyFinding[] = [];
  const h = stepMm;
  const sk = (SKY ??= sky(R1B_SKY_N, R1B_AMBER_DEG + Math.sqrt((4 * Math.PI) / R1B_SKY_N) / 2 / RAD + 1));
  for (const part of parts) {
    const rtris: Tri[] = part.renders.flatMap((r) => r.triangles.map(([a, b, c]) => [r.points[a]!, r.points[b]!, r.points[c]!] as const));
    const faces = proxyFaceModels(part).filter((f) => !/_rest$/.test(f.name)); // a resting proxy: off the part by design (the 11-13 rule)
    if (rtris.length === 0) continue;
    if (faces.filter((f) => !f.cap).length === 0) {
      // ⭐ (§7.1 row 5: every part's proxy CLOSED over its outer surface) a part whose proxy is only virtual (a resting face) covers none of it
      out.push({ rule: "R1", part: part.id, node: "the outer surface", detail: `NOT COVERED: no real proxy face (${part.proxy.length === 0 ? "no proxy" : `its proxy: ${part.proxy.map((x) => x.name).join(", ")} — virtual only`}) — 100 % of its outer surface` });
      continue;
    }
    const capFaces = faces.filter((f) => isVirtualProxy(f.name));
    // ── the grid round the render, a margin past ρ ──
    const lo = [Infinity, Infinity, Infinity] as [number, number, number], hi = [-Infinity, -Infinity, -Infinity] as [number, number, number];
    for (const t of rtris) for (const p of t) for (let x = 0; x < 3; x++) (lo[x] = Math.min(lo[x]!, p[x]!)), (hi[x] = Math.max(hi[x]!, p[x]!));
    const margin = PROXY_PROBE_MM + 4 * h;
    const o: Vec3 = [lo[0] - margin, lo[1] - margin, lo[2] - margin];
    const g: Grid = { nx: Math.ceil((hi[0] - lo[0] + 2 * margin) / h) + 1, ny: Math.ceil((hi[1] - lo[1] + 2 * margin) / h) + 1, nz: Math.ceil((hi[2] - lo[2] + 2 * margin) / h) + 1, h, o };
    const { nx, ny, nz } = g;
    const n = nx * ny * nz;
    const cen = (x: number): Vec3 => [o[0] + (x % nx) * h, o[1] + (Math.floor(x / nx) % ny) * h, o[2] + Math.floor(x / (nx * ny)) * h];
    const r0 = h * (Math.sqrt(3) / 2);
    // ── R1: the solid, closed at ρ ──
    const surf = new Uint8Array(n);
    raster(g, rtris, r0, surf);
    const free0 = new Uint8Array(n);
    for (let x = 0; x < n; x++) free0[x] = surf[x] ? 0 : 1;
    const out0 = flood(g, free0);
    const solid = new Uint8Array(n);
    for (let x = 0; x < n; x++) solid[x] = out0[x] ? 0 : 1;
    const rr = (PROXY_PROBE_MM / h) ** 2;
    const rgrid = triGrid(rtris, 8);
    // ⭐ the ball's centres: outside, farther than ρ from the REAL surface (exact — never from the voxel surface, thickened by r0 a side: it narrowed
    // every opening by ≈ 2 r0). A voxel whose distance to the surface voxels exceeds (ρ + r0) is farther than ρ from the surface itself.
    const DS = edt(g, surf);
    const far2 = ((PROXY_PROBE_MM + r0) / h) ** 2;
    const pass2 = new Uint8Array(n);
    for (let x = 0; x < n; x++) pass2[x] = !out0[x] ? 0 : DS[x]! > far2 ? 1 : rgrid.nearest(cen(x), PROXY_PROBE_MM) === null ? 1 : 0;
    void solid;
    const out2 = flood(g, pass2);
    const D2 = edt(g, out2);
    const C = new Uint8Array(n);
    for (let x = 0; x < n; x++) C[x] = D2[x]! > rr ? 1 : 0;
    // ── the outside with the caps as walls ──
    const capWall = new Uint8Array(n);
    raster(g, capFaces.flatMap((f) => f.tris), r0, capWall);
    const free1 = new Uint8Array(n);
    for (let x = 0; x < n; x++) free1[x] = C[x] || capWall[x] ? 0 : 1;
    const reached = flood(g, free1);
    // ── the shell: outside voxels the outside reaches, beside the closed solid ──
    const shell: number[] = [];
    for (let x = 0; x < n; x++) {
      if (C[x] || !reached[x]) continue;
      const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
      if ((i > 0 && C[x - 1]) || (i < nx - 1 && C[x + 1]) || (j > 0 && C[x - nx]) || (j < ny - 1 && C[x + nx]) || (k > 0 && C[x - nx * ny]) || (k < nz - 1 && C[x + nx * ny])) shell.push(x);
    }
    // the closed solid's box: a ray leaving it has escaped
    let bi0 = nx, bi1 = -1, bj0 = ny, bj1 = -1, bk0 = nz, bk1 = -1;
    for (let x = 0; x < n; x++)
      if (C[x]) {
        const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
        (bi0 = Math.min(bi0, i)), (bi1 = Math.max(bi1, i)), (bj0 = Math.min(bj0, j)), (bj1 = Math.max(bj1, j)), (bk0 = Math.min(bk0, k)), (bk1 = Math.max(bk1, k));
      }
    // ⭐⭐ a ray against the SMOOTH closing, never the voxels' staircase: the closed solid is exactly {its distance to the ball's centres > ρ} — that
    // distance (`F`, exact at the voxels: D2) interpolated at the ray's point. (Tested against the cubes, a ray grazing a rim or a wall lost ≈ 3°: a 40°
    // V's floor, ±23.6° by hand, read ±21° — a false DEEP.) SPHERE-TRACED: a step of the larger of (ρ − F) — the field is 1-Lipschitz — and the
    // distance to the nearest solid voxel less 1.75 steps; a quarter step at the least.
    const F = new Float32Array(n);
    for (let x = 0; x < n; x++) F[x] = Math.sqrt(D2[x]!);
    const DC = edt(g, C);
    const rv = PROXY_PROBE_MM / h;
    const field = (px: number, py: number, pz: number): number => {
      const i = Math.floor(px), j = Math.floor(py), k = Math.floor(pz);
      if (i < 0 || j < 0 || k < 0 || i + 1 >= nx || j + 1 >= ny || k + 1 >= nz) return 0;
      const fx = px - i, fy = py - j, fz = pz - k;
      const b = i + nx * (j + ny * k), sy = nx, sz = nx * ny;
      const c00 = F[b]! * (1 - fx) + F[b + 1]! * fx, c10 = F[b + sy]! * (1 - fx) + F[b + sy + 1]! * fx;
      const c01 = F[b + sz]! * (1 - fx) + F[b + sz + 1]! * fx, c11 = F[b + sy + sz]! * (1 - fx) + F[b + sy + sz + 1]! * fx;
      return (c00 * (1 - fy) + c10 * fy) * (1 - fz) + (c01 * (1 - fy) + c11 * fy) * fz;
    };
    // ⭐ a ray starts ONE STEP OUT along the outward normal: a voxel beside the closed solid sits within the boundary's interpolation band, where
    // grazing directions block at once (the sky read ±17° for ±23.6°)
    let origin: Vec3 = [0, 0, 0];
    const setOrigin = (x0: number, nn: Vec3 | null): void => {
      const i = x0 % nx, j = Math.floor(x0 / nx) % ny, k = Math.floor(x0 / (nx * ny));
      origin = [i, j, k];
      if (nn === null) return;
      if (field(i + nn[0], j + nn[1], k + nn[2]) < rv) origin = [i + nn[0], j + nn[1], k + nn[2]];
    };
    const escapes = (_x0: number, d: Vec3): boolean => {
      let px = origin[0], py = origin[1], pz = origin[2];
      for (;;) {
        const i = Math.round(px), j = Math.round(py), k = Math.round(pz);
        if (i < bi0 || i > bi1 || j < bj0 || j > bj1 || k < bk0 || k > bk1) return true;
        const f = field(px, py, pz);
        if (f > rv) return false;
        const st = Math.max(0.25, rv - f, Math.sqrt(DC[i + nx * (j + ny * k)]!) - 1.75);
        (px += d[0] * st), (py += d[1] * st), (pz += d[2] * st);
      }
    };
    // its outward normal: away from the closed solid round it
    const normalAt = (x: number): Vec3 | null => {
      const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
      let a = 0, b = 0, c = 0;
      for (let dk = -2; dk <= 2; dk++)
        for (let dj = -2; dj <= 2; dj++)
          for (let di = -2; di <= 2; di++) {
            const I = i + di, J = j + dj, K = k + dk;
            if (I < 0 || J < 0 || K < 0 || I >= nx || J >= ny || K >= nz || !C[I + nx * (J + ny * K)]) continue;
            (a -= di), (b -= dj), (c -= dk);
          }
      const l = Math.hypot(a, b, c);
      return l > 1e-9 ? [a / l, b / l, c / l] : null;
    };
    /** the widest cone of the sky at `x` (degrees; 0: no straight way out; ≥ `R1B_AMBER_DEG`: open) — each sample's ray cast once, lazily */
    const memo = new Int8Array(R1B_SKY_N);
    const cos45 = Math.SQRT1_2;
    const skyAt = (x: number): number => {
      memo.fill(0);
      setOrigin(x, normalAt(x));
      const vis = (d: number): boolean => {
        let m = memo[d]!;
        if (m === 0) (m = escapes(x, sk.dirs[d]!) ? 1 : 2), (memo[d] = m);
        return m === 1;
      };
      // α(d): from a visible sample, the angle to its nearest blocked one (Infinity: none within the list — open)
      const alpha = (d: number): number => {
        const l = sk.nb[d]!;
        for (let q = 0; q < l.length; q++) if (!vis(l[q]!)) return sk.ang[d]![q]!;
        return Infinity;
      };
      let best = -1, aBest = -1;
      const nn = normalAt(x);
      if (nn !== null) {
        // the axes within 45° of the outward normal, the nearest first: an open point ends at its first free cone
        const cand: [number, number][] = [];
        for (let d = 0; d < R1B_SKY_N; d++) {
          const c = dot(nn, sk.dirs[d]!);
          if (c >= cos45) cand.push([d, c]);
        }
        cand.sort((a, b) => b[1] - a[1]);
        for (const [d] of cand) {
          if (!vis(d)) continue;
          const a = alpha(d);
          if (a === Infinity) return 90;
          if (a > aBest) (aBest = a), (best = d);
        }
      }
      let any = best >= 0;
      for (let d = 0; d < R1B_SKY_N; d++) {
        if (!vis(d)) continue;
        any = true;
        const a = alpha(d);
        if (a === Infinity) return 90;
        if (a > aBest) (aBest = a), (best = d);
      }
      if (!any) return 0;
      lastBest = best;
      return aBest; // the coarse α*: the true widest cone lies within [α* − 2 half, α* + half]
    };
    let lastBest = -1;
    /** ⭐ the sky refined round `d0`: a spiral of directions every `R1B_FINE_DEG` over a cap past the coarse reading; the widest cone among the axes near `d0` */
    const fineSky = (x: number, d0: Vec3, a0: number): number => {
      setOrigin(x, normalAt(x));
      // a candidate axis c within 2 half of d0 has its nearest blocked direction within (a0 + 2 half) of c — so within (a0 + 4 half) of d0: the cap
      const Rc = (a0 + 4 * sk.half + R1B_FINE_DEG) * RAD, dl = R1B_FINE_DEG * RAD;
      const M = Math.ceil((2 * Math.PI * (1 - Math.cos(Rc))) / (dl * dl));
      const t = Math.abs(d0[0]) < 0.9 ? cross(d0, [1, 0, 0]) : cross(d0, [0, 1, 0]);
      const tl = Math.hypot(t[0], t[1], t[2]);
      const u: Vec3 = [t[0] / tl, t[1] / tl, t[2] / tl], w = cross(d0, u);
      const ga = Math.PI * (3 - Math.sqrt(5));
      const dirs: Vec3[] = [], free: boolean[] = [];
      for (let i = 0; i < M; i++) {
        const ct = 1 - (1 - Math.cos(Rc)) * ((i + 0.5) / M), st = Math.sqrt(Math.max(0, 1 - ct * ct)), ph = ga * i;
        const d: Vec3 = [d0[0] * ct + (u[0] * Math.cos(ph) + w[0] * Math.sin(ph)) * st, d0[1] * ct + (u[1] * Math.cos(ph) + w[1] * Math.sin(ph)) * st, d0[2] * ct + (u[2] * Math.cos(ph) + w[2] * Math.sin(ph)) * st];
        dirs.push(d);
        free.push(escapes(x, d));
      }
      const blocked = dirs.filter((_, i) => !free[i]);
      const near = Math.cos(2 * sk.half * RAD);
      let r = 0;
      for (let i = 0; i < M; i++) {
        if (!free[i] || dot(dirs[i]!, d0) < near) continue;
        let c = -1;
        for (const b of blocked) c = Math.max(c, dot(dirs[i]!, b));
        if (c < 0) return 90; // nothing blocked within the cap: wider than it
        r = Math.max(r, Math.acos(Math.min(1, c)) / RAD - R1B_FINE_DEG / 2);
      }
      return Math.max(0, r);
    };
    // ── R1b: the sky read on a SUB-LATTICE of the shell — samples at least 2 steps apart (a region under w matters to no rule), each shell voxel
    // taking its sample's class ──
    const isShell = new Uint8Array(n);
    for (const x of shell) isShell[x] = 1;
    const sampleOf = new Int32Array(n).fill(-1);
    const samples: number[] = [];
    for (const x of shell) {
      if (sampleOf[x] !== -1) continue;
      samples.push(x);
      const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
      for (let dk = -1; dk <= 1; dk++)
        for (let dj = -1; dj <= 1; dj++)
          for (let di = -1; di <= 1; di++) {
            const I = i + di, J = j + dj, K = k + dk;
            if (I < 0 || J < 0 || K < 0 || I >= nx || J >= ny || K >= nz) continue;
            const y = I + nx * (J + ny * K);
            if (isShell[y] && sampleOf[y] === -1) sampleOf[y] = x;
          }
    }
    const cls = new Int8Array(n); // 0 open, 1 amber, 2 deep, 3 undercut
    const skyOf = new Float32Array(n);
    for (const x of samples) {
      const a = skyAt(x);
      if (a >= 90) (cls[x] = 0), (skyOf[x] = 90);
      else if (a <= 0) (cls[x] = 3), (skyOf[x] = 0);
      else {
        let lo = a - 2 * sk.half, hi = a + sk.half, r = a - sk.half;
        // ⭐ membership refined where the interval straddles the AMBER line (read to ≈ ±1.5° there); a sample FAILS only when SURELY deep (its upper
        // bound under the deep line) — one near the deep line reads amber, the author's choice (a failure is certain, never a reading's error)
        if (lo < R1B_AMBER_DEG && hi >= R1B_AMBER_DEG) (r = fineSky(x, sk.dirs[lastBest]!, a)), (lo = hi = r);
        skyOf[x] = Math.max(0, r);
        cls[x] = hi < R1B_DEEP_DEG ? 2 : lo >= R1B_AMBER_DEG ? 0 : 1;
      }
    }
    for (const x of shell) (cls[x] = cls[sampleOf[x]!]!), (skyOf[x] = skyOf[sampleOf[x]!]!);
    const regions = (mark: (x: number) => boolean): number[][] => {
      const seen = new Uint8Array(n);
      const res: number[][] = [];
      for (const x0 of shell) {
        if (seen[x0] || !mark(x0)) continue;
        const comp: number[] = [];
        const st = [x0];
        seen[x0] = 1;
        while (st.length > 0) {
          const x = st.pop()!;
          comp.push(x);
          const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
          for (let dk = -1; dk <= 1; dk++)
            for (let dj = -1; dj <= 1; dj++)
              for (let di = -1; di <= 1; di++) {
                const I = i + di, J = j + dj, K = k + dk;
                if (I < 0 || J < 0 || K < 0 || I >= nx || J >= ny || K >= nz) continue;
                const y = I + nx * (J + ny * K);
                if (!seen[y] && mark(y)) (seen[y] = 1), st.push(y);
              }
        }
        res.push(comp);
      }
      return res;
    };
    const centre = (c: readonly number[]): Vec3 => {
      const s = [0, 0, 0] as [number, number, number];
      for (const x of c) {
        const p = cen(x);
        (s[0] += p[0]), (s[1] += p[1]), (s[2] += p[2]);
      }
      return [s[0] / c.length, s[1] / c.length, s[2] / c.length];
    };
    const comps = regions((x) => isShell[x] === 1 && cls[x]! > 0).sort((a, b) => b.length - a.length);
    const deepFlag = comps.map((c) => c.some((x) => cls[x]! >= 2));
    const deepC = comps.filter((_, i) => deepFlag[i]), amberC = comps.filter((_, i) => !deepFlag[i]);
    const sum = (cs: number[][]) => cs.reduce((t, c) => t + c.length, 0) * h * h;
    const minSky = (c: number[]) => Math.min(...c.map((x) => skyOf[x]!));
    if (deepC.length > 0) {
      const under = deepC.reduce((t, c) => t + c.filter((x) => cls[x] === 3).length, 0);
      const big = deepC[0]!;
      out.push({ rule: "R1b", part: part.id, node: "its hollows", detail: `${deepC.length} place(s) DEEPER than their mouth is wide${under > 0 ? ` or UNDERCUT (${under} points with no straight way out)` : ""} NOT CAPPED — ≈ ${sum(deepC).toFixed(0)} mm² of the outer surface; the largest ≈ ${(big.length * h * h).toFixed(0)} mm² round ${at(centre(big))}, its narrowest sky ±${minSky(big).toFixed(0)}° (under ±${R1B_DEEP_DEG}°): a flush cap (\`…_cap…\`) over each mouth` });
    }
    if (amberC.length > 0) {
      const big = amberC[0]!;
      out.push({ rule: "R1b", part: part.id, node: "its hollows", detail: `BORDERLINE (amber): ${amberC.length} place(s) about as deep as their mouth is wide (sky ±${R1B_DEEP_DEG}° – ±${R1B_AMBER_DEG.toFixed(1)}°) — ≈ ${sum(amberC).toFixed(0)} mm²; the largest ≈ ${(big.length * h * h).toFixed(0)} mm² round ${at(centre(big))}: capped or followed, the author's choice`, info: true });
    }
    // ── R2 the other way — coverage of the reached outer surface (an uncapped deep cavity reported above, not again) ──
    const rn = rtris.map(([a, b, c]) => {
      const cr = cross(sub(b, a), sub(c, a));
      const l = Math.hypot(cr[0], cr[1], cr[2]);
      return l > 1e-12 ? ([cr[0] / l, cr[1] / l, cr[2] / l] as Vec3) : null;
    });
    const ptris: Tri[] = [];
    const allow: number[] = [];
    for (const f of faces) {
      // ⭐ only a TRUE curve's facet carries its sagitta (one planar face — R7 —, over a curve within ±30° — R2): a node of many faces, or a face over an
      // opening (R2's findings), would carry its whole depth as a tolerance and cover anything near it
      let a = PROXY_CURVE_TOL_MM;
      if (!f.cap && f.n !== null && f.spread <= R7_PLANAR_DEG) {
        const fid = fidelityOf(f, rgrid, rn);
        if (!fid.flat && !fid.lost && fid.span <= R4_HALF_STEP_DEG) a = fid.dMax + PROXY_CURVE_TOL_MM; // a curve's facet: its sagitta recorded, exempt
      }
      for (const t of f.tris) (ptris.push(t), allow.push(a));
    }
    const pgrid = triGrid(ptris, 8);
    const aMax = Math.max(...allow);
    const loose = 1.87 * h;
    const uncovered = new Uint8Array(n);
    let reachedShell = 0;
    for (const x of shell) {
      if (cls[x]! >= 2) continue;
      reachedShell++;
      const c = cen(x);
      const nr = rgrid.nearest(c, 2 * h);
      let ok = false;
      if (nr !== null) {
        const [A, B, D] = rtris[nr.t]!;
        const q = closestOnTriangle(c, A, B, D);
        ok = pgrid.some(q, aMax, (t, d) => d <= allow[t]!);
      } else ok = pgrid.some(c, aMax + loose, (t, d) => d <= allow[t]! + loose);
      if (!ok) uncovered[x] = 1;
    }
    const holes = regions((x) => uncovered[x] === 1).sort((a, b) => b.length - a.length);
    if (holes.length > 0) {
      const total = holes.reduce((s, c) => s + c.length, 0);
      const big = holes[0]!;
      const nn = normalAt(big[Math.floor(big.length / 2)]!);
      out.push({ rule: "R1", part: part.id, node: "the outer surface", detail: `NOT COVERED by the proxy: ≈ ${(total * h * h).toFixed(0)} mm² (${((100 * total) / Math.max(1, reachedShell)).toFixed(1)} % of it) in ${holes.length} region(s) — the largest ≈ ${(big.length * h * h).toFixed(0)} mm² round ${at(centre(big))}${nn === null ? "" : `, facing (${nn.map((v) => v.toFixed(2)).join(", ")})`}` });
    }
    // ── R2 — closed: every edge has a face on its other side (real faces and caps) ──
    const edges: { a: Vec3; b: Vec3; t: number; real: boolean }[] = [];
    const tReal: boolean[] = [];
    for (const f of faces)
      for (const [A, B, D] of f.tris) {
        const t = tReal.length;
        tReal.push(!f.cap);
        for (const [p, q] of [[A, B], [B, D], [D, A]] as const) edges.push({ a: p, b: q, t, real: !f.cap });
      }
    const ec = 8, cells = new Map<string, number[]>();
    const key = (i: number, j: number, k: number) => `${i},${j},${k}`;
    edges.forEach((e, idx) => {
      const l3 = [0, 1, 2].map((x) => Math.floor((Math.min(e.a[x]!, e.b[x]!) - PROXY_FLUSH_MM) / ec)), h3 = [0, 1, 2].map((x) => Math.floor((Math.max(e.a[x]!, e.b[x]!) + PROXY_FLUSH_MM) / ec));
      for (let i = l3[0]!; i <= h3[0]!; i++) for (let j = l3[1]!; j <= h3[1]!; j++) for (let k = l3[2]!; k <= h3[2]!; k++) {
        const kk = key(i, j, k);
        const l = cells.get(kk);
        if (l === undefined) cells.set(kk, [idx]);
        else l.push(idx);
      }
    });
    const nearEdge = (p: Vec3, skipT: number, realOnly: boolean): number => {
      let best = Infinity;
      const l = cells.get(key(Math.floor(p[0] / ec), Math.floor(p[1] / ec), Math.floor(p[2] / ec))) ?? [];
      for (const idx of l) {
        const e = edges[idx]!;
        if (e.t === skipT || (realOnly && !e.real)) continue;
        best = Math.min(best, pointSegment(p, e.a, e.b));
      }
      return best;
    };
    const open: { p: Vec3; len: number }[] = [];
    for (const e of edges) {
      const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1], e.b[2] - e.a[2]);
      if (L < 1e-9) continue;
      const M = Math.max(1, Math.ceil(L / CLOSED_STEP_MM));
      for (let s = 0; s < M; s++) {
        const u = (s + 0.5) / M;
        const p: Vec3 = [e.a[0] + (e.b[0] - e.a[0]) * u, e.a[1] + (e.b[1] - e.a[1]) * u, e.a[2] + (e.b[2] - e.a[2]) * u];
        if (nearEdge(p, e.t, false) > PROXY_FLUSH_MM) open.push({ p, len: L / M });
      }
    }
    if (open.length > 0) {
      // the open samples in places: within 3 steps of each other
      const par = open.map((_, i) => i);
      const find = (i: number): number => (par[i] === i ? i : (par[i] = find(par[i]!)));
      const oc = new Map<string, number[]>();
      const ck = (p: Vec3) => key(Math.floor(p[0] / 6), Math.floor(p[1] / 6), Math.floor(p[2] / 6));
      open.forEach((s, i) => oc.set(ck(s.p), [...(oc.get(ck(s.p)) ?? []), i]));
      open.forEach((s, i) => {
        const c0 = [0, 1, 2].map((x) => Math.floor(s.p[x]! / 6));
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++)
          for (const j of oc.get(key(c0[0]! + a, c0[1]! + b, c0[2]! + c)) ?? []) {
            const q = open[j]!.p;
            if (Math.hypot(q[0] - s.p[0], q[1] - s.p[1], q[2] - s.p[2]) <= 3 * CLOSED_STEP_MM) par[find(i)] = find(j);
          }
      });
      const groups = new Map<number, number[]>();
      open.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]));
      const gs = [...groups.values()].map((ids) => ({ len: ids.reduce((s, i) => s + open[i]!.len, 0), c: centreOf(ids.map((i) => open[i]!.p)) })).sort((a, b) => b.len - a.len);
      const total = gs.reduce((s, x) => s + x.len, 0);
      out.push({ rule: "R2", part: part.id, node: "its proxy", detail: `NOT CLOSED: ≈ ${total.toFixed(0)} mm of its faces' edges with no face on the other side, in ${gs.length} place(s) — the longest ≈ ${gs[0]!.len.toFixed(0)} mm round ${at(gs[0]!.c)}` });
    }
    // ── R1b — a cap ON its mouth: its rim on the real proxy's edges ──
    for (const f of capFaces) {
      let off = 0, all = 0, worst = 0;
      for (const [, e] of f.boundary) {
        const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1], e.b[2] - e.a[2]);
        const M = Math.max(1, Math.ceil(L / CLOSED_STEP_MM));
        for (let s = 0; s < M; s++) {
          const u = (s + 0.5) / M;
          const p: Vec3 = [e.a[0] + (e.b[0] - e.a[0]) * u, e.a[1] + (e.b[1] - e.a[1]) * u, e.a[2] + (e.b[2] - e.a[2]) * u];
          const d = nearEdge(p, -1, true);
          all++;
          if (d > PROXY_FLUSH_MM) (off++, (worst = Math.max(worst, d)));
        }
      }
      if (off > 0) out.push({ rule: "R1b", part: part.id, node: f.name, detail: `the cap's rim OFF the real proxy's edges at ${off} of ${all} samples (${worst === Infinity ? "no real edge near" : `up to ${worst.toFixed(2)} mm`}): a cap sits ON its mouth's rim, flush (${PROXY_FLUSH_MM} mm)` });
    }
  }
  return out;
}
const centreOf = (ps: readonly Vec3[]): Vec3 => {
  const s = [0, 0, 0] as [number, number, number];
  for (const p of ps) (s[0] += p[0]), (s[1] += p[1]), (s[2] += p[2]);
  return [s[0] / ps.length, s[1] / ps.length, s[2] / ps.length];
};
