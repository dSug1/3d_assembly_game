/**
 * ⭐⭐⭐ prototype — **THE LEVEL'S SET OF ORIENTATIONS, AS A POLYHEDRON** (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"would it be
 * possible to provide the pink face - resting face alignment function by the resting face replicating the orientation of something on the
 * screen … Another faceted gizmo on UI overlay?"* → *"Start with 2, sit against this face … Make sure that the cube gets updated to the proper
 * polyhedron with the distinct face directions in the scene (therefore at boot of the scene and also each time a part is seated)"*).
 *
 * A pink face gives the alignment ONLY a direction (its outward normal) and its edges' directions (the roll's axes) — never a position. So
 * the scene's distinct face directions are the whole alphabet of pink faces, and one polyhedron shows them all: one FACET per distinct
 * direction, cut from a bounding box by the plane `n · x = 1` of each. In `Scene_1` (every goal pose square to the world) it is a cube.
 * A direction set with no opposite (a level with only the floor's +y, say) leaves some of the bounding box's faces: tag `-1`, not a direction.
 * ⛔ No engine, no scene.
 */
import { add, cross, dot, length, normalize, scale, sub, type Vec3 } from "./vec";

/** ⭐ One distinct direction of the scene: its outward normal, and every edge-to-edge axis of the faces that share it (the roll's). */
export interface OrientDirection {
  readonly normal: Vec3;
  readonly axes: readonly Vec3[];
}

/**
 * ⭐ The DISTINCT directions of a set of face frames: normals within `tolDeg` are one direction; its axes the union of theirs, laid in its
 * plane, deduplicated up to sign (an axis has no sense).
 */
export function distinctDirections(
  frames: readonly { readonly normal: Vec3; readonly axes: readonly Vec3[] }[],
  tolDeg = 1,
): OrientDirection[] {
  const c = Math.cos((tolDeg * Math.PI) / 180);
  const out: { normal: Vec3; axes: Vec3[] }[] = [];
  for (const f of frames) {
    const n = normalize(f.normal);
    if (n === null) continue;
    let d = out.find((o) => dot(o.normal, n) >= c);
    if (d === undefined) {
      d = { normal: n, axes: [] };
      out.push(d);
    }
    const dn = d.normal;
    for (const a of f.axes) {
      const u = normalize(sub(a, scale(dn, dot(a, dn))));
      if (u === null) continue;
      if (!d.axes.some((x) => Math.abs(dot(x, u)) >= c)) d.axes.push(u);
    }
  }
  return out;
}

/** ⭐ A facet of the polyhedron: the direction it stands for (`tag`, its index; `-1` — the bounding box), its normal, its vertices in order. */
export interface Facet {
  readonly tag: number;
  readonly normal: Vec3;
  readonly vertices: readonly Vec3[];
}

const EPS = 1e-9;

/** ⭐ The polygon `v` kept where `n · x ≤ h`; the points it leaves ON the plane go to `cap`. */
function clip(v: readonly Vec3[], n: Vec3, h: number, cap: Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < v.length; i++) {
    const a = v[i]!;
    const b = v[(i + 1) % v.length]!;
    const da = dot(n, a) - h;
    const db = dot(n, b) - h;
    if (da <= EPS) {
      out.push(a);
      if (Math.abs(da) <= EPS) cap.push(a);
    }
    if ((da < -EPS && db > EPS) || (da > EPS && db < -EPS)) {
      const p = add(a, scale(sub(b, a), da / (da - db)));
      out.push(p);
      cap.push(p);
    }
  }
  return out;
}

/** ⭐ Points about their centroid, counter-clockwise seen from the side `n` points to. */
function ordered(pts: readonly Vec3[], n: Vec3): Vec3[] {
  const c = scale(pts.reduce<Vec3>((s, p) => add(s, p), [0, 0, 0]), 1 / pts.length);
  const seed: Vec3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = normalize(cross(seed, n))!;
  const w = cross(n, u);
  const ang = (p: Vec3) => Math.atan2(dot(sub(p, c), w), dot(sub(p, c), u));
  return [...pts].sort((a, b) => ang(a) - ang(b));
}

function unique(pts: readonly Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (const p of pts) if (!out.some((q) => length(sub(p, q)) < 1e-7)) out.push(p);
  return out;
}

/** ⭐ The bounding box `[-b, b]³`, its six faces counter-clockwise seen from outside. */
function box(b: number): { tag: number; normal: Vec3; v: Vec3[] }[] {
  const faces: { tag: number; normal: Vec3; v: Vec3[] }[] = [];
  for (let k = 0; k < 3; k++) {
    for (const s of [1, -1]) {
      const n: [number, number, number] = [0, 0, 0];
      n[k] = s;
      const i = (k + 1) % 3;
      const j = (k + 2) % 3;
      const corner = (a: number, c: number): Vec3 => {
        const p: [number, number, number] = [0, 0, 0];
        p[k] = s * b;
        p[i] = a * b;
        p[j] = c * b;
        return p;
      };
      faces.push({ tag: -1, normal: n, v: ordered([corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)], n) });
    }
  }
  return faces;
}

/**
 * ⭐⭐ The polyhedron of `normals`: the bounding box `[-bound, bound]³` cut by the plane `n · x = offsets[i]` of each (1 without `offsets`) —
 * so each direction is a facet (tag = its index); what is left of the box (tag `-1`) only where the set does not close the shape.
 * ⭐ (2026-10-12) `offsets`: the planes' distances (the orientation window puts them all at the part's radius, around its centre).
 */
export function facetPolytope(normals: readonly Vec3[], bound = 1.6, offsets?: readonly number[]): Facet[] {
  let faces = box(bound);
  normals.forEach((n0, tag) => {
    const n = normalize(n0);
    if (n === null) return;
    const cap: Vec3[] = [];
    const next: { tag: number; normal: Vec3; v: Vec3[] }[] = [];
    const h = offsets?.[tag] ?? 1;
    for (const f of faces) {
      const v = unique(clip(f.v, n, h, cap));
      if (v.length >= 3) next.push({ ...f, v });
    }
    const pts = unique(cap);
    if (pts.length >= 3) next.push({ tag, normal: n, v: ordered(pts, n) });
    faces = next;
  });
  return faces.map((f) => ({ tag: f.tag, normal: f.normal, vertices: f.v }));
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"at the center of the resting face, create quads which match with the orientations of the faces of the
 * polyhedron"*) — the distinct PLANES among the directions: opposite normals (n and −n, within `tolDeg`) are one plane; its normal the first
 * met. A cube's six directions: three planes.
 */
export function distinctPlanes(normals: readonly Vec3[], tolDeg = 1): Vec3[] {
  const c = Math.cos((tolDeg * Math.PI) / 180);
  const out: Vec3[] = [];
  for (const n0 of normals) {
    const n = normalize(n0);
    if (n === null) continue;
    if (!out.some((m) => Math.abs(dot(m, n)) >= c)) out.push(n);
  }
  return out;
}
