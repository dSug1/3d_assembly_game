/**
 * ⭐⭐⭐ prototype — **THE YAW AND THE PITCH OF THE ORBITED PIECE** (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"how do you
 * suggest I do to yaw the object so that the next face can be aligned as resting face with a movement similar to the roll to the next axis
 * when the piece is outside the white sphere"* → *"yaw the object around gravity axis"* → *"we need a yaw if the resting face is vertical
 * and a pitch if the resting face is horizontal"* → *"build the yaw and pitch"*).
 *
 * A TUMBLE turns the piece about an axis IN its resting face's plane, so that a NEIGHBOURING face becomes the resting face:
 * 1. **The axes** (`tumbleAxes`) are the resting face's EDGE directions — the piece tips over an edge, as a real one does (⭐⭐ 2026-10-10,
 *    the owner: *"the turquoise piece does not pass through the lateral faces during yaw - pitch"*: the first build turned about the face's
 *    symmetry axes ACROSS ITS FLATS, and on a hexagon the plane across one runs through two opposite CORNERS, meeting the side faces only
 *    along an edge — so the end face alone was reached). On a VERTICAL face the YAW is about the edge direction closest to gravity and the
 *    PITCH about the one most across it; on a HORIZONTAL face there is no yaw (a turn about gravity IS the roll) and the pitch is about the
 *    edge direction most along the screen. A rectangle's edges run along its symmetry axes: the green box turns as before.
 * 2. **The next face** (`nextTumble`) — the SECTION LOOP: the plane through the resting face's centre, perpendicular to the turn axis, cuts
 *    a ring of faces (Blender's *bisect*, rather than its quad *face loop*, which breaks at a pole — a faceted bowl's bottom). Of the faces it
 *    cuts — hull faces only (a piece rests on its convex hull) — the next is the one the turn reaches FIRST in its
 *    sense; the step is the angle between the two normals in that plane. A slanted face's leftover tilt is then taken out, so the new face is
 *    exactly where the old one was (anti-aligned with the pink face).
 * 3. **The couple** (`nearestCouple`) — the new face's edge-to-edge axes put on the pink face's by the SMALLEST spin about its normal, as
 *    the roll keeps them.
 * ⛔ ENGINE-FREE (rule 1). Faces in the piece's own frame; poses, axes and the pink face in the world.
 */
import { cross, dot, normalize, qconj, qFromAxisAngle, qmul, qRotate, scale, shortestArc, sub, type Quat, type Vec3 } from "./vec";

/** ⭐ A face of the piece, its own frame: its model id, its outward normal, its vertices. */
export interface TumbleFace {
  readonly id: string;
  readonly normal: Vec3;
  readonly points: readonly Vec3[];
}

/** ⭐ A resting face at or past 45° from the vertical (\|n · up\| < cos 45°) is VERTICAL — it has a yaw. */
export const VERTICAL_FACE_COS = Math.SQRT1_2;

const flatten = (v: Vec3, n: Vec3): Vec3 | null => normalize(sub(v, scale(n, dot(v, n))));

/** ⭐ A face's EDGE directions, one per line (a rectangle 2, a regular hexagon 3), from its edges (`faceEdges`, the piece's frame). */
export function edgeDirections(edges: readonly (readonly [Vec3, Vec3])[]): Vec3[] {
  const out: Vec3[] = [];
  for (const [a, b] of edges) {
    const d = normalize(sub(b, a));
    if (d !== null && !out.some((o) => Math.abs(dot(o, d)) > 1 - 1e-6)) out.push(d);
  }
  return out;
}

/** ⭐ The resting face's edge directions at the pose `q`, in the world, laid on the face (`restNormal` its normal, the piece's frame). */
function worldDirs(q: Quat, restNormal: Vec3, dirs: readonly Vec3[]): { n: Vec3 | null; axes: Vec3[] } {
  const n = normalize(qRotate(q, restNormal));
  if (n === null) return { n, axes: [] };
  return { n, axes: dirs.map((a) => flatten(qRotate(q, a), n)).filter((a): a is Vec3 => a !== null) };
}

/** ⭐ Of the resting face's edge directions at `q`, the one most PARALLEL (`along` true) or most PERPENDICULAR to `w` (world). */
export function edgeAxisRelative(q: Quat, restNormal: Vec3, dirs: readonly Vec3[], w: Vec3, along: boolean): Vec3 | null {
  const { axes } = worldDirs(q, restNormal, dirs);
  let out: Vec3 | null = null;
  const score = (a: Vec3) => (along ? Math.abs(dot(a, w)) : -Math.abs(dot(a, w)));
  for (const a of axes) if (out === null || score(a) > score(out) + 1e-9) out = a;
  return out;
}

/**
 * ⭐⭐ The NEXT edge direction after `w` (world), going round the resting face's normal (2026-10-10, the owner: *"make each swap move on to
 * the next edge direction and generalize that in case of a more complex geometry"*): of its edge directions at `q`, laid on the face, the
 * one at the smallest angle past `w` (`sense` −1: before it — the order mirrored when the input is reversed; an edge direction being a
 * line: modulo a half turn, never `w` itself) — a rectangle's other one (90°),
 * a hexagon's three in turn (60°), any polygon's all in turn. `null` with none other.
 */
export function nextEdgeAxis(q: Quat, restNormal: Vec3, dirs: readonly Vec3[], w: Vec3, sense: 1 | -1 = 1): Vec3 | null {
  const { n, axes } = worldDirs(q, restNormal, dirs);
  const w0 = n === null ? null : flatten(w, n);
  if (n === null || w0 === null) return null;
  let best: { a: Vec3; phi: number } | null = null;
  for (const a of axes) {
    let phi = Math.atan2(dot(n, cross(w0, a)), dot(w0, a));
    phi = ((phi % Math.PI) + Math.PI) % Math.PI;
    if (phi < 1e-6 || Math.PI - phi < 1e-6) continue; // `w` itself
    if (sense < 0) phi = Math.PI - phi; // ⭐ the input reversed: the edge directions taken the other way round
    if (best === null || phi < best.phi - 1e-9) best = { a, phi };
  }
  return best === null ? null : best.a;
}

/**
 * ⭐ The two turn axes of the resting face (`restNormal`, `dirs` — its EDGE directions, `edgeDirections` — in the piece's frame) at the
 * pose `q`: `vertical` when the face is (`VERTICAL_FACE_COS`); then `yaw` the edge direction closest to gravity (`up`) and `pitch` the
 * one most across it; else `yaw` null and `pitch` the one most along the screen's right (`screenRight`). With none, gravity / the
 * screen's right laid on the face. World directions, unsigned (the caller gives the sense).
 */
export function tumbleAxes(
  q: Quat,
  restNormal: Vec3,
  dirs: readonly Vec3[],
  up: Vec3,
  screenRight: Vec3,
): { readonly vertical: boolean; readonly yaw: Vec3 | null; readonly pitch: Vec3 | null } {
  const { n, axes } = worldDirs(q, restNormal, dirs);
  if (n === null) return { vertical: false, yaw: null, pitch: null };
  const best = (score: (a: Vec3) => number): Vec3 | null => {
    let out: Vec3 | null = null;
    for (const a of axes) if (out === null || score(a) > score(out) + 1e-9) out = a;
    return out;
  };
  const vertical = Math.abs(dot(n, up)) < VERTICAL_FACE_COS;
  if (vertical) {
    const yaw = best((a) => Math.abs(dot(a, up))) ?? flatten(up, n);
    // ⭐ the edge direction most across the yaw's (a rectangle: at right angles; a hexagon: 60°)
    const pitch = yaw === null ? null : (best((a) => -Math.abs(dot(a, yaw))) ?? normalize(cross(n, yaw)));
    return { vertical, yaw, pitch: pitch !== null && yaw !== null && Math.abs(dot(pitch, yaw)) > 1 - 1e-6 ? normalize(cross(n, yaw)) : pitch };
  }
  return { vertical, yaw: null, pitch: best((a) => Math.abs(dot(a, screenRight))) ?? flatten(screenRight, n) };
}

/**
 * ⭐⭐ The next face of a tumble (the section loop, above): the piece at `q`, its faces and every vertex (`positions`, for the hull test),
 * the resting face (its face ids, its normal and its centre, the piece's frame), the turn axis `axis` (world, signed: the piece turns
 * positively about it) and a length tolerance. The new pose — the turn, then the leftover tilt taken out so the new face's normal is
 * exactly where the old one's was — the face reached, and the angle turned. `null` when the plane cuts no other face.
 */
export function nextTumble(
  q: Quat,
  faces: readonly TumbleFace[],
  positions: readonly Vec3[],
  restFaceIds: readonly string[],
  restNormal: Vec3,
  restCentre: Vec3,
  axis: Vec3,
  tol: number,
): { readonly faceId: string; readonly q: Quat; readonly angleRad: number } | null {
  const a = normalize(axis);
  const nL = normalize(restNormal);
  if (a === null || nL === null) return null;
  const aL = normalize(qRotate(qconj(q), a))!; // the axis in the piece's frame
  const nP = flatten(nL, aL);
  if (nP === null) return null; // the axis along the normal: that is a roll, not a tumble
  let best: { faceId: string; normal: Vec3; angleRad: number } | null = null;
  for (const f of faces) {
    if (restFaceIds.includes(f.id) || f.points.length === 0) continue;
    const nf = normalize(f.normal);
    if (nf === null) continue;
    // ⭐ a HULL face — every vertex on its inner side (a piece rests on its convex hull)
    const p0 = f.points[0]!;
    if (positions.some((p) => dot(sub(p, p0), nf) > tol)) continue;
    // ⭐ CUT by the section plane — vertices on both sides of it (a face wholly on one side is off the loop)
    const d = f.points.map((p) => dot(sub(p, restCentre), aL));
    if (!(Math.min(...d) < -tol && Math.max(...d) > tol)) continue;
    // ⚠ no separate graze test: a flat face whose normal lies along the axis is parallel to the plane, so the cut above already refuses it
    const fn = normalize(sub(nf, scale(aL, dot(nf, aL))));
    if (fn === null) continue;
    // the turn about +aL that carries this face's normal onto the resting one's, in (0, 2π)
    let phi = Math.atan2(dot(aL, cross(fn, nP)), dot(fn, nP));
    if (phi <= 1e-6) phi += 2 * Math.PI;
    if (phi >= 2 * Math.PI - 1e-6) continue; // the same direction as the resting face (a coplanar twin): not a step
    if (best === null || phi < best.angleRad - 1e-9) best = { faceId: f.id, normal: nf, angleRad: phi };
  }
  if (best === null) return null;
  const q1 = qmul(qFromAxisAngle(a, best.angleRad), q);
  // ⭐ the leftover tilt of a slanted face taken out: its normal onto the resting face's, the smallest turn
  const q2 = qmul(shortestArc(qRotate(q1, best.normal), qRotate(q, nL)), q1);
  return { faceId: best.faceId, q: q2, angleRad: best.angleRad };
}

/**
 * ⭐ The resting face's couple put back on the pink face's (`RESTING_FACE_ALIGNMENT.md` §12): the SMALLEST spin about its normal (either
 * sense, 0 when already there) that makes one of its edge-to-edge axes (`restAxes`, the piece's frame) parallel to one of the pink face's
 * (`pinkAxes`, world). An axis is a line: every half turn. The pose unchanged, `couple` null, with no axis on either side.
 */
export function nearestCouple(
  q: Quat,
  restNormal: Vec3,
  restAxes: readonly Vec3[],
  pinkAxes: readonly Vec3[],
): { readonly q: Quat; readonly couple: readonly [number, number] | null; readonly angleRad: number } {
  const n = normalize(qRotate(q, restNormal));
  if (n === null) return { q, couple: null, angleRad: 0 };
  let best: { rest: number; pink: number; angleRad: number } | null = null;
  restAxes.forEach((r0, i) => {
    const s = flatten(qRotate(q, r0), n);
    if (s === null) return;
    pinkAxes.forEach((p0, j) => {
      const r = flatten(p0, n);
      if (r === null) return;
      let phi = Math.atan2(dot(n, cross(s, r)), dot(s, r));
      // a line: into (−π/2, π/2]
      if (phi > Math.PI / 2) phi -= Math.PI;
      if (phi <= -Math.PI / 2) phi += Math.PI;
      if (best === null || Math.abs(phi) < Math.abs(best.angleRad) - 1e-9) best = { rest: i, pink: j, angleRad: phi };
    });
  });
  if (best === null) return { q, couple: null, angleRad: 0 };
  const b: { rest: number; pink: number; angleRad: number } = best;
  return { q: qmul(qFromAxisAngle(n, b.angleRad), q), couple: [b.rest, b.pink], angleRad: b.angleRad };
}

/**
 * ⭐ The sense of a tumble on the screen, as a signed world axis: YAW — the finger RIGHT moves the piece's NEAR side right (a turntable seen
 * from the camera); PITCH — the finger UP tips its TOP away (`D184`'s *up = away*). `axis` unsigned, `sense` +1 for right / up; the camera's
 * `view` (toward the scene), `right` and `upScreen` in the world. ⚠ Decided on world vectors only, so the scene's handedness plays no part.
 */
export function tumbleAxisSigned(turn: "YAW" | "PITCH", axis: Vec3, sense: 1 | -1, view: Vec3, right: Vec3, upScreen: Vec3): Vec3 {
  // a point's motion under a small positive turn about `axis` is `axis × r`
  const moves = turn === "YAW" ? dot(cross(axis, scale(view, -1)), right) : dot(cross(axis, upScreen), view);
  return scale(axis, (moves < 0 ? -1 : 1) * sense);
}
