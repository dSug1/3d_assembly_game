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
 * distances"* — the quads' side (m): `minM` at the nearest distance `dMin`, `maxM` at the farthest `dMax`, the power curve through both:
 * `minM + (maxM − minM) × ((d − dMin) / (dMax − dMin))^power`, held to the range (no plateau inside it). ⚠ `minM` above `maxM`: `maxM`.
 */
export function quadSize(d: number, dMin: number, dMax: number, power: number, minM: number, maxM: number): number {
  const lo = Math.min(Math.max(0, minM), maxM);
  if (!(dMax > dMin) || !Number.isFinite(d)) return maxM;
  const t = Math.min(1, Math.max(0, (d - dMin) / (dMax - dMin)));
  return lo + (maxM - lo) * Math.pow(t, power);
}

/**
 * ⭐ (2026-10-12, the owner: *"click on one side or the other of the quad are differentiated so the piece can turn 180 degrees"*) — the side of a
 * plane (normal `n`) a click at `hit` came from, as seen from `eye`: `n` when the eye is on its side, `−n` else.
 */
export function quadSide(n: Vec3, hit: Vec3, eye: Vec3): Vec3 {
  return dot(n, sub(eye, hit)) >= 0 ? n : scale(n, -1);
}
