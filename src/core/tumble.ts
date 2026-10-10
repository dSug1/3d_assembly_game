/**
 * ⭐⭐⭐ prototype — **THE YAW AND THE PITCH OF THE ORBITED PIECE** (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"how do you
 * suggest I do to yaw the object so that the next face can be aligned as resting face with a movement similar to the roll to the next axis
 * when the piece is outside the white sphere"* → *"yaw the object around gravity axis"* → *"we need a yaw if the resting face is vertical
 * and a pitch if the resting face is horizontal"* → *"build the yaw and pitch"*).
 *
 * A TUMBLE turns the piece about an axis IN its resting face's plane, so that a NEIGHBOURING face becomes the resting face:
 * 1. **The axes** (`tumbleAxes`) come from the resting face's own edge-to-edge symmetry axes (the couple the roll lines up with the pink
 *    face): on a VERTICAL face the YAW is about the one closest to gravity (the vertical itself when the couple is upright) and the PITCH
 *    about the in-plane direction across it; on a HORIZONTAL face there is no yaw (a turn about gravity IS the roll) and the pitch is about
 *    the axis most horizontal on the screen.
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

/**
 * ⭐ The two turn axes of the resting face (`restNormal`, `restAxes` — its edge-to-edge axes — in the piece's frame) at the pose `q`:
 * `vertical` when the face is (`VERTICAL_FACE_COS`); then `yaw` the axis closest to gravity (`up`) and `pitch` the in-plane direction
 * across it; else `yaw` null and `pitch` the axis most along the screen's right (`screenRight`). With no axis, gravity / the screen's right
 * laid on the face. World directions, unsigned (the caller gives the sense).
 */
export function tumbleAxes(
  q: Quat,
  restNormal: Vec3,
  restAxes: readonly Vec3[],
  up: Vec3,
  screenRight: Vec3,
): { readonly vertical: boolean; readonly yaw: Vec3 | null; readonly pitch: Vec3 | null } {
  const n = normalize(qRotate(q, restNormal));
  if (n === null) return { vertical: false, yaw: null, pitch: null };
  const axes = restAxes.map((a) => flatten(qRotate(q, a), n)).filter((a): a is Vec3 => a !== null);
  const best = (score: (a: Vec3) => number): Vec3 | null => {
    let out: Vec3 | null = null;
    for (const a of axes) if (out === null || score(a) > score(out) + 1e-9) out = a;
    return out;
  };
  const vertical = Math.abs(dot(n, up)) < VERTICAL_FACE_COS;
  if (vertical) {
    const yaw = best((a) => Math.abs(dot(a, up))) ?? flatten(up, n);
    return { vertical, yaw, pitch: yaw === null ? null : normalize(cross(n, yaw)) };
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
