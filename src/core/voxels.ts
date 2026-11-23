/**
 * ⭐ (2026-11-23, S6 — moved from `proxy_cover.ts` so that the part checks of packets 1 – 3 share them) THE VOXELS: a grid round a part's render
 * triangles, the surface rasterized, the outside flooded, exact distance transforms; the render CLOSED at ρ (R1's outer surface), the closing's bridged
 * fill, the outside of the render. Pure, engine-free, in mm.
 */
import { pointTriangle, triGrid } from "./tri_geom";
import { PROXY_PROBE_MM } from "./units";
import { cross, sub, type Vec3 } from "./vec";

/** ⭐ (§7.1 row 9) the voxel step (mm): ρ / 2 */
export const COVER_STEP_MM = PROXY_PROBE_MM / 2;

export interface Grid {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
  readonly h: number;
  readonly o: Vec3;
}
type Tri = readonly [Vec3, Vec3, Vec3];

/** the voxels whose centre lies within `r0` mm of a triangle */
export function raster(g: Grid, tris: readonly Tri[], r0: number, m: Uint8Array): void {
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
export function flood(g: Grid, pass: Uint8Array): Uint8Array {
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
export function edt(g: Grid, src: Uint8Array): Float64Array {
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

/**
 * ⭐⭐ (S6 — §7.1 rows 4, 9) THE RENDER CLOSED AT ρ, on a grid of step `h` round the render's triangles (a margin past ρ): `out0` the voxels the outside
 * reaches round the surface (the surface's voxels walls), `C` the CLOSED solid — farther than ρ from every ball's centre, the centres the outside
 * points farther than ρ from the REAL surface (exact: never the voxel surface, thickened by r0 a side — it narrowed every opening by ≈ 2 r0), `D2` the
 * squared distance (steps²) to the nearest centre. Two exact distance transforms (Felzenszwalb & Huttenlocher 2012).
 */
export function renderClosing(rtris: readonly Tri[], h: number = COVER_STEP_MM) {
  const lo = [Infinity, Infinity, Infinity] as [number, number, number], hi = [-Infinity, -Infinity, -Infinity] as [number, number, number];
  for (const t of rtris) for (const p of t) for (let x = 0; x < 3; x++) (lo[x] = Math.min(lo[x]!, p[x]!)), (hi[x] = Math.max(hi[x]!, p[x]!));
  const margin = PROXY_PROBE_MM + 4 * h;
  const o: Vec3 = [lo[0] - margin, lo[1] - margin, lo[2] - margin];
  const g: Grid = { nx: Math.ceil((hi[0] - lo[0] + 2 * margin) / h) + 1, ny: Math.ceil((hi[1] - lo[1] + 2 * margin) / h) + 1, nz: Math.ceil((hi[2] - lo[2] + 2 * margin) / h) + 1, h, o };
  const { nx, ny } = g;
  const n = nx * ny * g.nz;
  const cen = (x: number): Vec3 => [o[0] + (x % nx) * h, o[1] + (Math.floor(x / nx) % ny) * h, o[2] + Math.floor(x / (nx * ny)) * h];
  /** the voxel holding `p`, or −1 outside the grid */
  const vox = (p: Vec3): number => {
    const i = Math.round((p[0] - o[0]) / h), j = Math.round((p[1] - o[1]) / h), k = Math.round((p[2] - o[2]) / h);
    return i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= g.nz ? -1 : i + nx * (j + ny * k);
  };
  const r0 = h * (Math.sqrt(3) / 2);
  const surf = new Uint8Array(n);
  raster(g, rtris, r0, surf);
  const free0 = new Uint8Array(n);
  for (let x = 0; x < n; x++) free0[x] = surf[x] ? 0 : 1;
  const out0 = flood(g, free0);
  const rr = (PROXY_PROBE_MM / h) ** 2;
  const rgrid = triGrid(rtris, 8);
  // ⭐ the ball's centres: outside, farther than ρ from the REAL surface. A voxel whose distance to the surface voxels exceeds (ρ + r0) is farther than
  // ρ from the surface itself.
  const DS = edt(g, surf);
  const far2 = ((PROXY_PROBE_MM + r0) / h) ** 2;
  const pass2 = new Uint8Array(n);
  for (let x = 0; x < n; x++) pass2[x] = !out0[x] ? 0 : DS[x]! > far2 ? 1 : rgrid.nearest(cen(x), PROXY_PROBE_MM) === null ? 1 : 0;
  const out2 = flood(g, pass2);
  const D2 = edt(g, out2);
  const C = new Uint8Array(n);
  for (let x = 0; x < n; x++) C[x] = D2[x]! > rr ? 1 : 0;
  return { g, n, cen, vox, out0, C, D2, rgrid };
}

/**
 * ⭐ (S6 — §7.1 row 4: *"fidelity read against the ρ-closing"*) is a point INSIDE the render closed at ρ (the render's solid, or the closing's fill over
 * an opening under 2ρ, a concave corner's fillet). (The fill alone — closed, outside the render's solid — cannot be told in a slot under 2ρ: the voxel
 * surface, thickened half a voxel's diagonal a side, leaves it no flooded air.)
 */
export function insideClosing(rtris: readonly Tri[], h: number = COVER_STEP_MM): (p: Vec3) => boolean {
  if (rtris.length === 0) return () => false;
  const { vox, C } = renderClosing(rtris, h);
  return (p: Vec3) => {
    const x = vox(p);
    return x >= 0 && C[x] === 1;
  };
}

/**
 * ⭐ (S6 packet 3) is a point OUTSIDE the part's render — the voxels (step `stepMm`) the outside reaches round the render's triangles (a point within
 * half a voxel's diagonal of the surface reads not outside). Built once per part.
 */
export function outsideOfRender(rtris: readonly (readonly [Vec3, Vec3, Vec3])[], stepMm: number = COVER_STEP_MM): (p: Vec3) => boolean {
  if (rtris.length === 0) return () => true;
  const h = stepMm;
  const lo = [Infinity, Infinity, Infinity] as [number, number, number], hi = [-Infinity, -Infinity, -Infinity] as [number, number, number];
  for (const t of rtris) for (const p of t) for (let x = 0; x < 3; x++) (lo[x] = Math.min(lo[x]!, p[x]!)), (hi[x] = Math.max(hi[x]!, p[x]!));
  const margin = 3 * h;
  const o: Vec3 = [lo[0] - margin, lo[1] - margin, lo[2] - margin];
  const g: Grid = { nx: Math.ceil((hi[0] - lo[0] + 2 * margin) / h) + 1, ny: Math.ceil((hi[1] - lo[1] + 2 * margin) / h) + 1, nz: Math.ceil((hi[2] - lo[2] + 2 * margin) / h) + 1, h, o };
  const n = g.nx * g.ny * g.nz;
  const surf = new Uint8Array(n);
  raster(g, rtris, h * (Math.sqrt(3) / 2), surf);
  const free = new Uint8Array(n);
  for (let x = 0; x < n; x++) free[x] = surf[x] ? 0 : 1;
  const out = flood(g, free);
  return (p: Vec3) => {
    const i = Math.round((p[0] - o[0]) / h), j = Math.round((p[1] - o[1]) / h), k = Math.round((p[2] - o[2]) / h);
    if (i < 0 || j < 0 || k < 0 || i >= g.nx || j >= g.ny || k >= g.nz) return true;
    return out[i + g.nx * (j + g.ny * k)] === 1;
  };
}
