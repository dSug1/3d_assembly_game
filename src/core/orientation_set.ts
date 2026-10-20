/**
 * ⭐⭐⭐ prototype — **THE LEVEL'S SET OF ORIENTATIONS** (⛔ 2026-10-12: the polyhedron drawn from it, `facetPolytope`, is deleted with the window) (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"would it be
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
import { dot, normalize, scale, sub, type Vec3 } from "./vec";

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

/**
 * ⭐ (2026-10-12, the owner: *"the quads size grow with the distance of the piece to the pink gizmo (more than linearly but less than
 * exponentially or quadratically)"*) → *"the max size of the quad shall be the 1.4 you have set"* — the quads' scale against their full size (reached at
 * `dRef` and beyond): (d / dRef)^power, at most 1. ⭐ (2026-10-12, *"change the power 1.5 of the quads scaling to 3, maintain the 1.4 max
 * scale"* → *"create a slider for the power of the scaling distance"*) — the power is the caller's (`quadGrowthPower`, 3).
 * ⭐⭐ (2026-10-12, the owner: *"the minimum dimension of the quad when closest to the gizmo shall be the diameter of the gizmo. fit the power curve
 * to match the 1.4 and this min dimension"* → *"amended: … 0.20 the radius of the piece. fit the power curve to match the 1.4 and 0.20"*) — the
 * ⭐⭐ → *"the 1.4 shall be reached at the maximum distance … There shall be no plateau for the quad scale before shrinking"* → *"the min scale of the
 * quads at the minimum distance shall be 0.1. the curve with the power (i.e. power 3) shall best fit those max and min scales at max and min
 * distances"* — the quads' side (m): `minM` at the nearest distance `dMin`, `maxM` at the farthest `dMax`, held to the range (no plateau inside it).
 * ⭐⭐ (2026-10-12, the owner: *"instead of power 3 for the quad scale, use a logarythm curve so that the quads and resting face grow faster when they are small"*) — a LOGARITHM between them, `t` = (d − dMin) / (dMax − dMin):
 * `minM + (maxM − minM) × ln(1 + k·t) / ln(1 + k)` — steepest at the start (slope k / ln(1 + k) there: ×4.1 a straight line's at k = 9), flattening
 * toward the farthest; `k` its steepness (→ 0: a straight line). ⚠ `minM` above `maxM`: `maxM`. (It was `t^power`, power 3: slowest at the start.)
 */
export function quadSize(d: number, dMin: number, dMax: number, k: number, minM: number, maxM: number): number {
  const lo = Math.min(Math.max(0, minM), maxM);
  if (!(dMax > dMin) || !Number.isFinite(d)) return maxM;
  const t = Math.min(1, Math.max(0, (d - dMin) / (dMax - dMin)));
  const f = k > 1e-9 ? Math.log1p(k * t) / Math.log1p(k) : t;
  return lo + (maxM - lo) * f;
}

/**
 * ⭐ (2026-10-12, the owner: *"click on one side or the other of the quad are differentiated so the piece can turn 180 degrees"*) — the side of a
 * plane (normal `n`) a click at `hit` came from, as seen from `eye`: `n` when the eye is on its side, `−n` else.
 */
export function quadSide(n: Vec3, hit: Vec3, eye: Vec3): Vec3 {
  return dot(n, sub(eye, hit)) >= 0 ? n : scale(n, -1);
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"the scale 0.1 should be reached at half the maximal distance. below this, the quads shall be hidden. fit the power curve accordingly"*) — the quads' nearest shown distance: HALF the farthest; nearer, they are hidden (`quadSize` runs from it).
 */
/** ⭐⭐ (2026-10-15, the owner: *"Currently, the quads are hidden at half the max travel distance. Change to 35 % max travel distance (i.e. quads are hidden when 65 % max travel distance is still remaining)."*) */
export const QUADS_SHOWN_FROM_SHARE = 0.65;
export function quadsShownFromM(dMax: number): number {
  return dMax * QUADS_SHOWN_FROM_SHARE;
}

/**
 * ⭐⭐⭐ (2026-10-20, the owner: *"there are still too many quads. Just keep the three quads of the frozen object's faces orientations (or gravity and horizontal
 * planes) and the orientation of the face which supports the gizmo. that will be max 4 quads. always put them in the same order (3 frozen object's orientations
 * then gizmo face orientation)."*) — **THE QUADS' FRAMES**: the PLANES of `base` (the biggest frozen body's faces, else `GRAVITY_FRAMES`), the most horizontal
 * first then by heading, three at most; then the gizmo's supporting face's plane (`gizmo`) unless it is one of them (1°). Each plane both senses, its axes the
 * union of both (a tap on either side of its quad). ⛔ (2026-10-19) the gizmo's host part's every face — 6 quads on a box, more on a frustum.
 */
export function quadFrames(base: readonly { readonly normal: Vec3; readonly axes: readonly Vec3[] }[], gizmo: { readonly normal: Vec3; readonly axes: readonly Vec3[] } | null, tolDeg = 1): OrientDirection[] {
  const c = Math.cos((tolDeg * Math.PI) / 180);
  // ⭐ a plane's normal in one sense: up, else toward +x, else +z — the order and the frames never depend on which face came first
  const canon = (n: Vec3): Vec3 => {
    const s = Math.abs(n[1]) > 1e-6 ? n[1] : Math.abs(n[0]) > 1e-6 ? n[0] : n[2];
    return s < 0 ? scale(n, -1) : n;
  };
  const planes: { normal: Vec3; axes: Vec3[] }[] = [];
  const merge = (p: { normal: Vec3; axes: Vec3[] }, axes: readonly Vec3[]): void => {
    for (const a of axes) {
      const u = normalize(sub(a, scale(p.normal, dot(a, p.normal))));
      if (u !== null && !p.axes.some((x) => Math.abs(dot(x, u)) >= c)) p.axes.push(u);
    }
  };
  for (const f of base) {
    const n = normalize(f.normal);
    if (n === null) continue;
    let p = planes.find((q) => Math.abs(dot(q.normal, n)) >= c);
    if (p === undefined) {
      p = { normal: canon(n), axes: [] };
      planes.push(p);
    }
    merge(p, f.axes);
  }
  const heading = (n: Vec3): number => Math.atan2(n[2], n[0]);
  planes.sort((a, b) => Math.abs(b.normal[1]) - Math.abs(a.normal[1]) || heading(a.normal) - heading(b.normal));
  const kept = planes.slice(0, 3);
  const g = gizmo === null ? null : normalize(gizmo.normal);
  if (g !== null && !kept.some((q) => Math.abs(dot(q.normal, g)) >= c)) {
    const p = { normal: canon(g), axes: [] as Vec3[] };
    merge(p, gizmo!.axes);
    if (p.axes.length === 0) {
      // ⭐ no axes given: two square in its plane
      const seed: Vec3 = Math.abs(p.normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const a = normalize(sub(seed, scale(p.normal, dot(seed, p.normal))))!;
      const n = p.normal;
      p.axes.push(a, [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]]);
    }
    kept.push(p);
  }
  return kept.flatMap((p) => [
    { normal: p.normal, axes: p.axes },
    { normal: scale(p.normal, -1), axes: p.axes },
  ]);
}

/** ⭐ (2026-10-19) no frozen body: GRAVITY and the HORIZONTAL plane — up, down and four level directions, the world's axes, each face's axes in it. */
export const GRAVITY_FRAMES: readonly OrientDirection[] = [
  { normal: [0, 1, 0], axes: [[1, 0, 0], [0, 0, 1]] },
  { normal: [0, -1, 0], axes: [[1, 0, 0], [0, 0, 1]] },
  { normal: [1, 0, 0], axes: [[0, 1, 0], [0, 0, 1]] },
  { normal: [-1, 0, 0], axes: [[0, 1, 0], [0, 0, 1]] },
  { normal: [0, 0, 1], axes: [[1, 0, 0], [0, 1, 0]] },
  { normal: [0, 0, -1], axes: [[1, 0, 0], [0, 1, 0]] },
];
