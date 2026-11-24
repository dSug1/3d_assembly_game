/**
 * ⭐ (S6 — `30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §7.1 row 10, §9) the proxy rules' TEST PARTS: his three shapes as CLEAN reference parts
 * (a shaft — a hexagon, a face up, over a round render; a hollow case — its pocket capped; a chamfered hull) and the controls' shapes (a box with a
 * pocket or a slot, a prism of any profile — an L, a V —, a solid of cells — a T-slot's undercut). Each a `PartSolids` in mm: its proxy nodes, its
 * render meshes (no collision pieces).
 */
import { convexHull3 } from "../../src/core/hull3";
import { B1_FIT_MM, type PartMesh, type PartSolids } from "../../src/core/part_checks";
import { cross, dot, sub, type Vec3 } from "../../src/core/vec";

/** a planar face from its outline (convex, any winding), turned to face `n` */
export const face = (name: string, pts: Vec3[], n: Vec3): PartMesh => {
  const tris: [number, number, number][] = [];
  for (let k = 1; k + 1 < pts.length; k++) {
    const c = cross(sub(pts[k]!, pts[0]!), sub(pts[k + 1]!, pts[0]!));
    tris.push(dot(c, n) >= 0 ? [0, k, k + 1] : [0, k + 1, k]);
  }
  return { name, points: pts, triangles: tris };
};
/** a mesh of several faces (for a render, or one node of several coplanar faces) */
export const mesh = (name: string, fs: PartMesh[]): PartMesh => {
  const points: Vec3[] = [];
  const triangles: [number, number, number][] = [];
  for (const f of fs) {
    const b = points.length;
    points.push(...f.points);
    for (const [a, c, d] of f.triangles) triangles.push([a + b, c + b, d + b]);
  }
  return { name, points, triangles };
};
export const part = (id: string, proxy: PartMesh[], renders: PartMesh[]): PartSolids => ({ id, frozen: false, fitMm: B1_FIT_MM, pieces: [], proxy, renders });

/** a shaft along x (length L), its proxy an n-gon (vertices at k·360/n — a hexagon: a face UP), its render a round 24-gon of radius R */
export function shaft(n: number, R = 20, L = 200): PartSolids {
  const ring = (m: number, x: number, r: number) => Array.from({ length: m }, (_, k): Vec3 => [x, r * Math.sin((2 * Math.PI * k) / m), r * Math.cos((2 * Math.PI * k) / m)]);
  const sides = (m: number, r: number, tag: string) => Array.from({ length: m }, (_, k) => {
    const a = ring(m, 0, r), b = ring(m, L, r);
    const mid = (2 * Math.PI * (k + 0.5)) / m;
    return face(`${tag}_${k}`, [a[k]!, a[(k + 1) % m]!, b[(k + 1) % m]!, b[k]!], [0, Math.sin(mid), Math.cos(mid)]);
  });
  const proxy = [...sides(n, R, "UFM_S_side"), face("UFM_S_end0", ring(n, 0, R), [-1, 0, 0]), face("UFM_S_end1", ring(n, L, R), [1, 0, 0])];
  const render = mesh("S_render", [...sides(24, R, "r"), face("r0", ring(24, 0, R), [-1, 0, 0]), face("r1", ring(24, L, R), [1, 0, 0])]);
  return part("S", proxy, [render]);
}

/**
 * a box (half sizes X, Z; height Y; its bottom at y 0) with a POCKET in its top (half sizes x, z; `depth` deep) — its proxy: the box's outside with
 * its top a RING round the pocket, and the pocket `"cap"` (a flush cap, lifted by `capLift`), `"follow"` (its walls and floor real faces), or the top
 * one face `"span"` (a real face over the pocket)
 */
export function pocketBox(o: { id?: string; X?: number; Y?: number; Z?: number; x?: number; z?: number; depth?: number; proxy?: "cap" | "follow" | "span"; capLift?: number } = {}): PartSolids {
  const { id = "C", X = 50, Y = 60, Z = 40, x = 30, z = 20, depth = 50, proxy = "cap", capLift = 0 } = o;
  const up: Vec3 = [0, 1, 0], F = Y - depth;
  const ring = [
    face(`UFM_${id}_top_f`, [[-X, Y, -Z], [X, Y, -Z], [x, Y, -z], [-x, Y, -z]], up), face(`UFM_${id}_top_b`, [[-X, Y, Z], [X, Y, Z], [x, Y, z], [-x, Y, z]], up),
    face(`UFM_${id}_top_l`, [[-X, Y, -Z], [-x, Y, -z], [-x, Y, z], [-X, Y, Z]], up), face(`UFM_${id}_top_r`, [[X, Y, -Z], [x, Y, -z], [x, Y, z], [X, Y, Z]], up),
  ];
  const outer = [
    face(`UFM_${id}_bottom`, [[-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [-X, 0, Z]], [0, -1, 0]),
    face(`UFM_${id}_front`, [[-X, 0, -Z], [X, 0, -Z], [X, Y, -Z], [-X, Y, -Z]], [0, 0, -1]), face(`UFM_${id}_back`, [[-X, 0, Z], [X, 0, Z], [X, Y, Z], [-X, Y, Z]], [0, 0, 1]),
    face(`UFM_${id}_left`, [[-X, 0, -Z], [-X, 0, Z], [-X, Y, Z], [-X, Y, -Z]], [-1, 0, 0]), face(`UFM_${id}_right`, [[X, 0, -Z], [X, 0, Z], [X, Y, Z], [X, Y, -Z]], [1, 0, 0]),
  ];
  const pocket = (tag: string) => [
    face(`${tag}_floor`, [[-x, F, -z], [x, F, -z], [x, F, z], [-x, F, z]], up),
    face(`${tag}_wf`, [[-x, F, -z], [x, F, -z], [x, Y, -z], [-x, Y, -z]], [0, 0, 1]), face(`${tag}_wb`, [[-x, F, z], [x, F, z], [x, Y, z], [-x, Y, z]], [0, 0, -1]),
    face(`${tag}_wl`, [[-x, F, -z], [-x, F, z], [-x, Y, z], [-x, Y, -z]], [1, 0, 0]), face(`${tag}_wr`, [[x, F, -z], [x, F, z], [x, Y, z], [x, Y, -z]], [-1, 0, 0]),
  ];
  const top = mesh(`UFM_${id}_top`, ring);
  const cap = face(`UFM_${id}_cap`, [[-x, Y + capLift, -z], [x, Y + capLift, -z], [x, Y + capLift, z], [-x, Y + capLift, z]], up);
  const px =
    proxy === "cap" ? [...outer, top, cap]
    : proxy === "follow" ? [...outer, top, ...pocket(`UFM_${id}_p`)]
    : [...outer, face(`UFM_${id}_top`, [[-X, Y, -Z], [X, Y, -Z], [X, Y, Z], [-X, Y, Z]], up)];
  return part(id, px, [mesh(`${id}_render`, [...outer, ...ring, ...pocket("p")])]);
}
/** ⭐ his hollow case: a 100 × 60 × 80 box, a pocket 60 × 40 in x, z, 50 deep from its top — its proxy the box with its top a RING and the pocket CAPPED */
export const hollowCase = (capLift = 0): PartSolids => pocketBox({ capLift });

/** ⭐ his chamfered hull: a 200 × 80 × 120 body, its top edges along x chamfered at 60° of elevation (`rise` mm) — its proxy its hull's faces, one node each */
export function hull(rise = 20, topLift = 0): PartSolids {
  const run = rise / Math.tan(Math.PI / 6);
  const pts: Vec3[] = [];
  for (const x of [-100, 100]) for (const zz of [-60, 60]) pts.push([x, 0, zz], [x, 80 - rise, zz], [x, 80, zz - Math.sign(zz) * run]);
  const h = convexHull3(pts)!;
  const groups = new Map<string, [number, number, number][]>();
  for (const t of h.triangles) {
    const [a, b, c] = t.map((i) => h.points[i]!) as [Vec3, Vec3, Vec3];
    const n = cross(sub(b, a), sub(c, a));
    const l = Math.hypot(n[0], n[1], n[2]);
    const k = n.map((v) => (v / l).toFixed(3)).join(",");
    groups.set(k, [...(groups.get(k) ?? []), [t[0], t[1], t[2]]]);
  }
  const proxy = [...groups.entries()].map(([k, tris], i): PartMesh => {
    const lift = k === "0.000,1.000,0.000" ? topLift : 0;
    return { name: `UFM_H_${i}`, points: h.points.map((p): Vec3 => [p[0], p[1] + (p[1] > 79.999 ? lift : 0), p[2]]), triangles: tris };
  });
  return part("H", proxy, [{ name: "H_render", points: h.points, triangles: h.triangles.map((t) => [t[0], t[1], t[2]]) }]);
}

/** a simple polygon (x, y; counter-clockwise) cut into triangles — ear clipping */
function earClip(P: readonly [number, number][]): [number, number, number][] {
  const idx = P.map((_, i) => i);
  const out: [number, number, number][] = [];
  const crs = (a: [number, number], b: [number, number], c: [number, number]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let guard = 0;
  while (idx.length > 3 && guard++ < 10000) {
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length]!, i1 = idx[k]!, i2 = idx[(k + 1) % idx.length]!;
      if (crs(P[i0]!, P[i1]!, P[i2]!) <= 1e-12) continue;
      const inside = idx.some((j) => j !== i0 && j !== i1 && j !== i2 && crs(P[i0]!, P[i1]!, P[j]!) > 0 && crs(P[i1]!, P[i2]!, P[j]!) > 0 && crs(P[i2]!, P[i0]!, P[j]!) > 0);
      if (inside) continue;
      out.push([i0, i1, i2]);
      idx.splice(k, 1);
      break;
    }
  }
  out.push([idx[0]!, idx[1]!, idx[2]!]);
  return out;
}
/** a PRISM: a profile (x, y; counter-clockwise) swept along z over ±Z — each side its own face, each end one face; `tag` names the proxy's nodes */
export function prismFaces(profile: readonly [number, number][], Z: number, tag: string): PartMesh[] {
  const m = profile.length;
  const sides = profile.map(([x0, y0], k) => {
    const [x1, y1] = profile[(k + 1) % m]!;
    const n: Vec3 = [y1 - y0, -(x1 - x0), 0];
    return face(`${tag}_s${k}`, [[x0, y0, -Z], [x1, y1, -Z], [x1, y1, Z], [x0, y0, Z]], n);
  });
  const tris = earClip(profile);
  const end = (z: number, s: number, nm: string): PartMesh => ({ name: nm, points: profile.map(([x, y]): Vec3 => [x, y, z]), triangles: tris.map(([a, b, c]) => (s > 0 ? [a, b, c] : [a, c, b])) });
  return [...sides, end(Z, 1, `${tag}_e1`), end(-Z, -1, `${tag}_e0`)];
}
/** a prism part: its render and its proxy the same faces (the proxy follows the part, one node a face) */
export const prismPart = (id: string, profile: readonly [number, number][], Z = 40): PartSolids =>
  part(id, prismFaces(profile, Z, `UFM_${id}`), [mesh(`${id}_render`, prismFaces(profile, Z, "r"))]);

/**
 * a solid of CELLS (`s` mm a side; cell (i, j, k) filled when `filled` says so, over n × n × n) — its boundary quads, facing out; its proxy the same
 * quads (one node each), less those `capOver` hides, plus the caps it names
 */
export function cellPart(id: string, s: number, nn: readonly [number, number, number], filled: (i: number, j: number, k: number) => boolean, caps: PartMesh[] = [], hide: (c: Vec3) => boolean = () => false): PartSolids {
  const quads: PartMesh[] = [];
  const at = (i: number, j: number, k: number) => i >= 0 && j >= 0 && k >= 0 && i < nn[0] && j < nn[1] && k < nn[2] && filled(i, j, k);
  for (let k = 0; k < nn[2]; k++)
    for (let j = 0; j < nn[1]; j++)
      for (let i = 0; i < nn[0]; i++) {
        if (!at(i, j, k)) continue;
        const x0 = i * s, y0 = j * s, z0 = k * s, x1 = x0 + s, y1 = y0 + s, z1 = z0 + s;
        if (!at(i - 1, j, k)) quads.push(face("q", [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0]));
        if (!at(i + 1, j, k)) quads.push(face("q", [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0]));
        if (!at(i, j - 1, k)) quads.push(face("q", [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]));
        if (!at(i, j + 1, k)) quads.push(face("q", [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]));
        if (!at(i, j, k - 1)) quads.push(face("q", [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1]));
        if (!at(i, j, k + 1)) quads.push(face("q", [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]));
      }
  const avg = (q: PartMesh, x: number) => q.points.reduce((a, p) => a + p[x]!, 0) / q.points.length;
  const mid = (q: PartMesh): Vec3 => [avg(q, 0), avg(q, 1), avg(q, 2)];
  const proxy = quads.filter((q) => !hide(mid(q))).map((q, i) => ({ ...q, name: `UFM_${id}_q${i}` }));
  return part(id, [...proxy, ...caps], [mesh(`${id}_render`, quads)]);
}
export const at0 = (id: string) => new Map([[id, { position: [0, 0, 0] as Vec3, rotation: [1, 0, 0, 0] as const }]]);
/** ⭐ (S6 packet 3) a convex collision piece from its points (their hull) */
export const piece = (name: string, pts: Vec3[]): PartMesh => {
  const h = convexHull3(pts)!;
  return { name, points: h.points, triangles: h.triangles.map((t) => [t[0], t[1], t[2]]) };
};
/** an axis-aligned box piece */
export const boxPiece = (name: string, lo: Vec3, hi: Vec3): PartMesh =>
  piece(name, [0, 1, 2, 3, 4, 5, 6, 7].map((m): Vec3 => [m & 1 ? hi[0] : lo[0], m & 2 ? hi[1] : lo[1], m & 4 ? hi[2] : lo[2]]));
/** a prism piece along x (from 0 to L) of an n-gon of circumradius r (vertices at k·360/n) */
export const ngonPiece = (name: string, n: number, r: number, L = 200): PartMesh =>
  piece(name, Array.from({ length: n }, (_, k) => [0, L].map((x): Vec3 => [x, r * Math.sin((2 * Math.PI * k) / n), r * Math.cos((2 * Math.PI * k) / n)])).flat());
export const withPieces = (p: PartSolids, pieces: PartMesh[]): PartSolids => ({ ...p, pieces });
/**
 * ⭐ (S6 packet 3) a thick TUBE along x (length L): a round 24-gon outside (radius Ro), a round 24-gon BORE (radius Ri) — its render; its proxy the same
 * faces (each its node); its collision pieces a RING of `m` slabs round the bore by the angle rule (each slab: the bore's chord on its inside, the
 * outside circumscribed every 15°)
 */
export function tube(m: number, Ri = 20, Ro = 40, L = 120, pushIn = 0): PartSolids {
  const N = 24;
  const ring = (r: number, x: number, k: number): Vec3 => [x, r * Math.sin((2 * Math.PI * k) / N), r * Math.cos((2 * Math.PI * k) / N)];
  const fs: PartMesh[] = [];
  for (let k = 0; k < N; k++) {
    const mid = (2 * Math.PI * (k + 0.5)) / N, out: Vec3 = [0, Math.sin(mid), Math.cos(mid)];
    fs.push(face(`o${k}`, [ring(Ro, 0, k), ring(Ro, 0, k + 1), ring(Ro, L, k + 1), ring(Ro, L, k)], out));
    fs.push(face(`i${k}`, [ring(Ri, 0, k), ring(Ri, 0, k + 1), ring(Ri, L, k + 1), ring(Ri, L, k)], [0, -out[1], -out[2]]));
    fs.push(face(`a${k}`, [ring(Ri, 0, k), ring(Ri, 0, k + 1), ring(Ro, 0, k + 1), ring(Ro, 0, k)], [-1, 0, 0]));
    fs.push(face(`b${k}`, [ring(Ri, L, k), ring(Ri, L, k + 1), ring(Ro, L, k + 1), ring(Ro, L, k)], [1, 0, 0]));
  }
  const rOut = Ro / Math.cos(Math.PI / 24);
  const slabs = Array.from({ length: m }, (_, s2) => {
    const a0 = (2 * Math.PI * s2) / m, a1 = (2 * Math.PI * (s2 + 1)) / m;
    const pts: Vec3[] = [];
    // (`pushIn`: the first slab's chord moved that far into the bore — a control)
    const ri = s2 === 0 && pushIn > 0 ? (Ri * Math.cos(Math.PI / m) - pushIn) / Math.cos(Math.PI / m) : Ri;
    for (const x of [0, L]) {
      pts.push([x, ri * Math.sin(a0), ri * Math.cos(a0)], [x, ri * Math.sin(a1), ri * Math.cos(a1)]);
      for (let a = a0; a <= a1 + 1e-9; a += Math.PI / 12) pts.push([x, rOut * Math.sin(a), rOut * Math.cos(a)]);
    }
    return piece(`UCX_T_${s2}`, pts);
  });
  return withPieces(part("T", fs.map((f, i) => ({ ...f, name: `UFM_T_${i}` })), [mesh("T_render", fs)]), slabs);
}
