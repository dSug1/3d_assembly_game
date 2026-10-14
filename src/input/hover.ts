/**
 * ⭐⭐⭐ prototype — **THE HOVER** (2026-10-14, the owner: *"Now we need to define the hover for the fine edge-to-edge alignment of the piece and
 * assembly. I am enclined to build the hover with a translation of the piece or even the yellow gizmo on the collision surface, possibly for a
 * limited amplitude, with a toggle back to orbit possible at any time"* → *"I agree with all your recommendations …"*; `HOVER.md`).
 *
 * A drag that STARTS ON the orbited piece slides it — and, by default, the yellow gizmo with it — in the plane of the part face its resting face
 * lies against; a drag from anywhere else orbits. Lifting the finger is the way back to the orbit (a quasimode: no toggle, no hidden mode).
 * Allowed only while the resting face and that face are ANTI-PARALLEL and IN CONTACT (`hoverContact`); every step is solved by the orbit's own
 * clearance rule, so the other faces stop and slide it. Pure: the scene reaches it through numbers.
 */
import type { Vec3 } from "../core/vec";
import type { OrbitQ } from "./piece_orbit_solver";
import type { GestureConfig } from "./gestureConfig";
import { cameraOffset, type CameraAngleOffset, type OrbitAt } from "./follow_camera";
import { cameraGapM } from "./green_box";

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 | null => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};

/** ⭐ (2026-10-14, the hover's audit) Two faces whose planes lie within this of each other (m) are COPLANAR for the contact's choice — the in-plane distance decides. */
export const HOVER_TIE_M = 1e-4;

/** ⭐ The resting face and the part's face count as aligned within this angle (°): the quads align exactly — this is numerical room. */
export const HOVER_ALIGN_DEG = 2;

/**
 * ⭐⭐ **IN CONTACT, FROM THE GAME'S OWN GEOMETRY** — the piece RESTS at the gap kept (\`gapM\`, 1 mm) and a pose is admissible down to half of it;
 * conservative advancement stops within \`atContactM\` (0.2 mm) above the gap kept, and a slide's sub-step may land anywhere above half of it. So
 * a piece pushed onto a face sits between \`gapM / 2\` and \`gapM + atContactM\` from it: CONTACT is a gap up to \`gapM + max(atContactM, gapM / 2)\`
 * — 1.5 mm at the shipped 1 mm (the parts' own skin, 0.3 mm on the glass, and the deadbands play no part: the piece's rule is in the world).
 */
export function hoverContactM(gapM: number, atContactM: number): number {
  return gapM + Math.max(atContactM, gapM / 2);
}

/** ⭐ The hover plane's two axes: the screen's right laid on the plane (\`e1\`), and \`n × e1\` (\`e2\`) — \`null\` with the plane edge-on to the right. */
export function hoverPlane(n: Vec3, right: Vec3): { e1: Vec3; e2: Vec3 } | null {
  const k = dot(right, n);
  const e1 = unit([right[0] - n[0] * k, right[1] - n[1] * k, right[2] - n[2] * k]);
  if (e1 === null) return null;
  const e2 = unit(cross(n, e1));
  return e2 === null ? null : { e1, e2 };
}

/**
 * ⭐⭐ **THE FINGER ON THE PLANE** (the method of \`D76\`): \`a1\`, \`a2\` the screen shadows of one metre along \`e1\` and \`e2\` (px), the finger's
 * step solved onto both so the piece follows it exactly — × \`gain\` (1: under the finger). Edge-on (the shadows nearly parallel), each axis
 * takes its projection.
 */
export function planeStepFromScreen(dxPx: number, dyPx: number, a1: readonly [number, number], a2: readonly [number, number], gain: number): [number, number] {
  const det = a1[0] * a2[1] - a1[1] * a2[0];
  const n1 = Math.hypot(a1[0], a1[1]);
  const n2 = Math.hypot(a2[0], a2[1]);
  if (Math.abs(det) > 0.05 * n1 * n2 && n1 > 1e-9 && n2 > 1e-9) {
    return [((dxPx * a2[1] - dyPx * a2[0]) / det) * gain, ((a1[0] * dyPx - a1[1] * dxPx) / det) * gain];
  }
  const u = n1 > 1e-9 ? (dxPx * a1[0] + dyPx * a1[1]) / (n1 * n1) : 0;
  const v = n2 > 1e-9 ? (dxPx * a2[0] + dyPx * a2[1]) / (n2 * n2) : 0;
  return [u * gain, v * gain];
}

/** ⭐ The amplitude slider's top (mm): there the limit is OFF — the hover is unlimited. */
export const HOVER_UNLIMITED_MM = 500;

/** ⭐ The hover offset held in its disc (\`maxMm\`, from where the hover began); at \`HOVER_UNLIMITED_MM\` or above, unlimited. */
export function clampDisc(u: number, v: number, maxMm: number): [number, number] {
  if (maxMm >= HOVER_UNLIMITED_MM) return [u, v];
  const r = Math.hypot(u, v);
  const m = maxMm / 1000;
  return r <= m || r < 1e-12 ? [u, v] : [(u * m) / r, (v * m) / r];
}

/**
 * ⭐⭐⭐ (2026-10-14, the owner: *"modify the offset and distance of the camera during hover so that it's view direction projects equally to the three orthogonal planes horizontal, gravity and the third orthogonal and the cyan highlight can be viewed from top right towards bottom left. Distance of camera to object equals the distance of camera to object at boot with same zoom."*) — **THE HOVER VIEW IS ISOMETRIC**: the camera looks along a direction that projects EQUALLY onto the three
 * orthogonal planes — the HORIZONTAL one, the GRAVITY (vertical) one of the hosting face, and the third, orthogonal to both — so its three
 * components are equal: `(up + a + b) / √3` (35.26° above the horizontal). The camera sits ABOVE and to the RIGHT of the hosted face, looking
 * down-left at it:
 * * a SIDE face (`|n_y| ≤ 0.7`): `a` its normal laid flat (the piece's side), `b` the horizontal across it toward the screen's `right`;
 * * a TOP face (an underside: `up` downward): `a` the screen's `right` laid flat, `b` the horizontal across it toward where the camera is
 *   (`toCam`), so the view does not swing round to the other side.
 * ⛔ It replaced the face-on view turned by the CAMERA OFFSET's angles (a vertical face was watched head-on, its contact seen edge-on).
 */
export function hoverIsoDirection(n: Vec3, right: Vec3, toCam: Vec3): Vec3 {
  const flat = (x: Vec3): Vec3 | null => unit([x[0], 0, x[2]]);
  const up: Vec3 = [0, 1, 0];
  let a: Vec3, b: Vec3, sy: number;
  if (Math.abs(n[1]) <= 0.7) {
    a = flat(n) ?? [1, 0, 0];
    b = [-a[2], 0, a[0]];
    if (dot(b, right) < 0) b = [-b[0], 0, -b[2]];
    sy = 1;
  } else {
    a = flat(right) ?? [1, 0, 0];
    b = [-a[2], 0, a[0]];
    if (dot(b, toCam) < 0) b = [-b[0], 0, -b[2]];
    sy = Math.sign(n[1]);
  }
  const k = 1 / Math.sqrt(3);
  return [(a[0] + b[0] + up[0] * sy) * k, (a[1] + b[1] + up[1] * sy) * k, (a[2] + b[2] + up[2] * sy) * k];
}

/**
 * ⭐⭐ **THE WAY IN AND OUT OF THE HOVER VIEW, BY THE FINGER'S TRAVEL** (the owner: *"Use a camera movement similar to way in or way out to smooth
 * the view, controlled by delta position. Make a slider for the gain"*) — the share of the hover view, raised by a hover drag's travel and
 * lowered by an orbit drag's, \`gainPerMm\` per millimetre of finger; the blend weight eases in and out (smoothstep).
 */
export function hoverViewProgress(progress: number, travelMm: number, gainPerMm: number, toward: boolean): number {
  const d = Math.max(0, travelMm) * Math.max(0, gainPerMm);
  return Math.min(1, Math.max(0, progress + (toward ? d : -d)));
}
export function hoverViewWeight(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return p * p * (3 - 2 * p);
}

/** ⭐ The hover's second coordinate in the orbit solver's \`v\` (kept in 0 … 1 there): \`v = 0.5 + metres / HOVER_SPAN_M\`. */
export const HOVER_SPAN_M = 20;

/**
 * ⭐ (2026-10-14, the owner: *"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value (i don't know what this value shall be) when hover translation"*) — THE HOVER'S SWAY: a hover is a slide along a part, so the other parts swing at the orbit sway's SLIDING
 * angle — its least, `ORBIT_SWAY_MIN_DEG` (0.1°) — whatever the slider; 0 when the slider is 0 (no sway).
 */
export function hoverSwayDeg(sliderDeg: number, minDeg: number): number {
  return sliderDeg > 0 ? Math.min(minDeg, sliderDeg) : 0;
}

/**
 * ⭐⭐⭐ (2026-10-14, the owner: *"I can't hover translate in the attached configuration. Make sure the threshold distance is between resting face and collision face. Or check what else is bugging. The green piece should hover translate on the blue part's vertical face."*) — **THE CONTACT, FACE TO FACE**: the distance is measured between the RESTING FACE and the part's FACE
 * themselves — the resting face's centre above the plane of each face of each part within reach — and that face must be ANTI-PARALLEL to the
 * resting face (`alignDeg`); the part's body within `maxGapM` too (the faces overlap). ⛔ It compared the resting face with the normal of the
 * two bodies' CLOSEST POINTS, which tilts the moment those fall on an edge (the piece reaching past the face, a neighbour touched) — a piece
 * lying flat on a face could be refused. The face's own normal is the hover plane's. `nearest`: the best candidate seen, for the verdict.
 */
export interface HoverFaceCandidate {
  readonly id: string;
  readonly bodyGapM: number;
  readonly faces: readonly {
    readonly faceId?: string;
    readonly centre: Vec3;
    readonly normal: Vec3;
    /** ⭐ (2026-10-14, the hover's second audit) the face's triangles in the world — given, the resting face's centre must lie OVER them (`HOVER_OVER_FACE_M`) */
    readonly triangles?: readonly (readonly [Vec3, Vec3, Vec3])[];
  }[];
}

/**
 * ⭐⭐ (2026-10-14, the hover's second audit) — **THE FACES OVERLAP**: the resting face's centre, laid on the face's plane, within this of the face's own triangles (m). The
 * coloured face lies 1.5 mm inside its contour (`SCENE_1_CONTOUR_MARGIN`), so 2 mm. ⛔ It was a BODY test only: a piece BESIDE a box,
 * 10 mm above the plane of its top, turned cyan, and the settle took it 9 mm down into the air.
 */
export const HOVER_OVER_FACE_M = 0.002;

/** ⭐ (2026-10-14, the hover's second audit) A point's distance, in a plane (`n`), to a set of triangles lying in it — 0 inside one. */
export function distanceToTriangles(p: Vec3, n: Vec3, tris: readonly (readonly [Vec3, Vec3, Vec3])[]): number {
  let best = Infinity;
  for (const [a, b, c] of tris) {
    const ab = sub(b, a), bc = sub(c, b), ca = sub(a, c);
    const s1 = dot(cross(ab, sub(p, a)), n), s2 = dot(cross(bc, sub(p, b)), n), s3 = dot(cross(ca, sub(p, c)), n);
    if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return 0;
    best = Math.min(best, segDist(p, a, b), segDist(p, b, c), segDist(p, c, a));
  }
  return best;
}
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function segDist(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  const t = l2 > 1e-24 ? Math.min(1, Math.max(0, dot(sub(p, a), ab) / l2)) : 0;
  const d = sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
  return Math.hypot(d[0], d[1], d[2]);
}
export function hoverFaceContact(
  restingCentreW: Vec3,
  restingNormalW: Vec3,
  candidates: readonly HoverFaceCandidate[],
  maxGapM: number,
  alignDeg = HOVER_ALIGN_DEG,
): { contact: { id: string; faceId: string | null; normal: Vec3; centre: Vec3; gapM: number } | null; nearest: { id: string; planeGapM: number; angleDeg: number; bodyGapM: number; overFace: boolean } | null } {
  const cosMin = Math.cos((alignDeg * Math.PI) / 180);
  let contact: { id: string; faceId: string | null; normal: Vec3; centre: Vec3; gapM: number; inPlaneM: number; overM: number } | null = null;
  let nearest: { id: string; planeGapM: number; angleDeg: number; bodyGapM: number; overFace: boolean } | null = null;
  for (const c of candidates) {
    for (const f of c.faces) {
      const cos = -dot(restingNormalW, f.normal); // 1: the resting face looks straight at the face
      const d = dot(f.normal, [restingCentreW[0] - f.centre[0], restingCentreW[1] - f.centre[1], restingCentreW[2] - f.centre[2]]);
      if (cos <= 0 || d < -maxGapM) continue; // a face looking away, or behind the resting face
      const angleDeg = (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
      const onPlane: Vec3 = [restingCentreW[0] - f.normal[0] * d, restingCentreW[1] - f.normal[1] * d, restingCentreW[2] - f.normal[2] * d];
      const overM = f.triangles === undefined ? 0 : distanceToTriangles(onPlane, f.normal, f.triangles);
      const overFace = overM <= HOVER_OVER_FACE_M;
      const score = d + angleDeg * 1e-3 + (overFace ? 0 : 1);
      if (nearest === null || score < nearest.planeGapM + nearest.angleDeg * 1e-3 + (nearest.overFace ? 0 : 1)) nearest = { id: c.id, planeGapM: d, angleDeg, bodyGapM: c.bodyGapM, overFace };
      if (!(cos >= cosMin && d <= maxGapM && c.bodyGapM <= maxGapM && overFace)) continue;
      // ⭐⭐ (2026-10-14, the hover's audit) COPLANAR faces tie on the distance: the one UNDER the resting face's centre hosts (the least in-plane distance to its
      // centre) — ⛔ the first listed won, so a piece over a part's top could hover in the plane of its neighbour's, named after it
      const off: Vec3 = [restingCentreW[0] - f.centre[0] - f.normal[0] * d, restingCentreW[1] - f.centre[1] - f.normal[1] * d, restingCentreW[2] - f.centre[2] - f.normal[2] * d];
      const inPlaneM = Math.hypot(off[0], off[1], off[2]);
      // ⭐ (2026-10-14, the hover's second audit) on a tie, the face CONTAINING the centre first (⛔ by the centres alone, a centre at 0.99 over a face spanning −1 … 1 named
      // its neighbour 1 … 1.1), then the nearer centre
      const tie = contact !== null && Math.abs(d - contact.gapM) <= HOVER_TIE_M;
      const better = contact === null || d < contact.gapM - HOVER_TIE_M || (tie && (overM < contact.overM - 1e-9 || (Math.abs(overM - contact.overM) <= 1e-9 && inPlaneM < contact.inPlaneM)));
      if (better) contact = { id: c.id, faceId: f.faceId ?? null, normal: f.normal, centre: f.centre, gapM: Math.max(0, d), inPlaneM, overM };
    }
  }
  return { contact, nearest };
}

/**
 * ⭐⭐⭐ (2026-10-14, the owner: *"I think the contact check is too strict. It is difficult for the user to judge the contact depending on the camera view. Also, it may be difficult to achieve the contact based only on orbit movement. Propose something to ease the contact and its perception by the user"* → *"Build A&B"*) — **A. THE SETTLE**: a resting face LOOKING AT a part's face within the hover's REACH (`hoverApproachMm`,
 * 20 mm) — not only touching it — may hover: the piece first SETTLES onto that face, a solved move along its normal down to the gap kept (the
 * other parts stop it), eased over `HOVER_SETTLE_MS`, then slides. Contact is the game's to make; the player only brings the piece close and
 * facing. ⭐ Why: a part's collision surface is a transparent contour 1.5 mm outside its coloured face and a pushed piece rests 1 mm off it —
 * "touching" is ~2.5 mm from what the eye sees, which no camera angle lets anyone judge, and the orbit reaches it only where its ring crosses
 * the face.
 */
export const HOVER_SETTLE_MS = 150;
/** ⭐ The settle to make: from the resting face's distance to the face's plane down to the gap kept (0 already there). */
export function settleDepth(planeGapM: number, gapM: number): number {
  return Math.max(0, planeGapM - gapM);
}
/** ⭐ The share of the settle shown `elapsedMs` after it began — eased (smoothstep), whole at `HOVER_SETTLE_MS`. */
export function settleShare(elapsedMs: number): number {
  const u = Math.min(1, Math.max(0, elapsedMs / HOVER_SETTLE_MS));
  return u * u * (3 - 2 * u);
}
/**
 * ⭐⭐ (*"I think the contact check is too strict. It is difficult for the user to judge the contact depending on the camera view. Also, it may be difficult to achieve the contact based only on orbit movement. Propose something to ease the contact and its perception by the user"* → *"Build A&B"*) — **B. THE CONTACT SHADOW**: a point of the resting face's outline laid on the target face's plane (`n` its normal, `c` a point
 * on it) — drawn there, it shows which face and exactly where the piece will land, at any camera angle (the shadow: the classic depth cue).
 */
export function projectOntoPlane(p: Vec3, n: Vec3, c: Vec3): Vec3 {
  const d = n[0] * (p[0] - c[0]) + n[1] * (p[1] - c[1]) + n[2] * (p[2] - c[2]);
  return [p[0] - n[0] * d, p[1] - n[1] * d, p[2] - n[2] * d];
}

/**
 * ⭐⭐⭐ (2026-10-14, the hover's audit) — **THE FOLLOWER IS DRAWN, NEVER SOLVED**: the hover's MODEL is the solved offset; the part translation's follower (`ζ` 0.2
 * and a phantom lead) only DRAWS the piece, its lag kept BEHIND the solved place along the last solved step (`dirU`, `dirV`) — the part
 * of it ahead, or across that step, dropped. ⛔ The followed offset WAS the model: underdamped and led, it overshot a wall by 1.5 mm at
 * 60 fps (2.2 mm at 120) past the 0.5 mm the solver keeps — the next orbit frame found the piece inside, its relocation jumped it ≥ 1 cm
 * along the ring. Returns the drawn lag `(du, dv)` to add to the solved offset; `[0, 0]` before any step.
 */
export function hoverDrawLag(lagU: number, lagV: number, dirU: number, dirV: number): [number, number] {
  const l = Math.hypot(dirU, dirV);
  if (!(l > 1e-12)) return [0, 0];
  const s = Math.min(0, (lagU * dirU + lagV * dirV) / l);
  return [(s * dirU) / l, (s * dirV) / l];
}

/**
 * ⭐⭐ (2026-10-14, the hover's audit) — **WHAT ENDS A HOVER BESIDES THE LIFT**: a second touch HELD (its own gesture takes over — ⛔ the hover went on, the centre pinned
 * under it) or the piece CAPTURED onto its goal (the pull owns it — ⛔ the hover went on writing the gizmo).
 */
export function hoverEndsOn(holdActive: boolean, placed: boolean): boolean {
  return holdActive || placed;
}

/**
 * ⭐⭐ (2026-10-14, the hover's audit) — **THE HOVER VIEW FOLLOWS A NEW FACE**: a hover begun on a face turned from the view's own (more than ~2.6°) RETARGETS the view
 * — ⛔ it stayed on the first face, so a hover on a side face after one on a top face was watched from above. Eased from the view it leaves
 * over `HOVER_VIEW_RETARGET_MS`.
 */
export const HOVER_VIEW_RETARGET_MS = 250;
export function hoverViewRetargets(prevN: Vec3, n: Vec3): boolean {
  return dot(prevN, n) <= 0.999;
}
export function retargetShare(elapsedMs: number): number {
  const u = Math.min(1, Math.max(0, elapsedMs / HOVER_VIEW_RETARGET_MS));
  return u * u * (3 - 2 * u);
}

/**
 * ⭐⭐⭐ (2026-10-14, the hover's second audit) — **THE ORBIT HOLDS STILL UNDER A HOVER**: while a hover is on, the orbit's frame solves nothing — the piece's ring place
 * held (no backlog continued, no return toward the ring height the finger set, no relocation), the target and the height kept being that
 * place. ⛔ The orbit's frame went on under the hover: after a slide had carried the ring height off the one asked, its way back lifted the
 * piece OFF the hover's plane mid-drag while the hover still solved from its start — a step checked at the wrong place, a penetration, a
 * relocation's jump.
 */
export function orbitFrameUnderHover(q: OrbitQ): { q: OrbitQ; target: OrbitQ; userV: number; queries: number } {
  return { q, target: q, userV: q.v, queries: 0 };
}

/**
 * ⭐⭐⭐ (2026-10-14, the hover's second audit) — **ONE SOLVE A FRAME, INSIDE THE FRAME'S BUDGET** (the owner: *"do not increase the ms budget (i am testing on iphone)"*):
 * the finger's deadbanded steps are ADDED to the hover's pending target on each event, and solved once a frame with what the frame's work
 * cap (`pieceSolverQueries`) has left — none left (under `HOVER_MIN_QUERIES`), it waits a frame. ⛔ It solved on every pointer EVENT, 24
 * queries each: a 125–250 Hz mouse made 48–96 a frame.
 */
export const HOVER_MIN_QUERIES = 4;
export function hoverQueryBudget(capQueries: number, usedQueries: number): number {
  const left = capQueries - usedQueries;
  return left >= HOVER_MIN_QUERIES ? left : 0;
}

/**
 * ⭐⭐ (2026-10-14, the hover's second audit) — **THE FINGER'S TRAVEL IS KEPT**: a solve the work cap cut (`deferred`) keeps its target for the next frame — the orbit's own
 * rule; reached, or blocked (a wall), the target is where it stopped. ⛔ The rest was dropped: a 10 mm step along a wall 1.1 mm away moved
 * 6.48 mm at the shipped cap — "gain 1 = under the finger" failed near a second part.
 */
export function hoverPendingAfter(solved: readonly [number, number], deferred: boolean, pending: readonly [number, number]): [number, number] {
  return deferred ? [pending[0], pending[1]] : [solved[0], solved[1]];
}

/**
 * ⭐⭐ (2026-10-14, the hover's second audit) — **WHAT LIES "BEHIND" THE PLANE**: a part rising at most `t` above the hover's plane is never nearer the piece, moving at
 * `planeGapM` above that plane, than `planeGapM − t` — so the parts left out of the hover's checks may rise `planeGapM − hardM` at most
 * (`hardM`, half the gap kept: the least admissible). ⛔ It was half the gap kept whatever the piece's height: a piece hovering at 0.5–1 mm
 * could be carried INTO a neighbour 0.5 mm proud.
 */
/** ⭐ flush tops read as flush whatever the rounding (1 µm) */
export const BEHIND_FLUSH_M = 1e-6;
export function behindToleranceM(planeGapM: number, hardM: number): number {
  return Math.max(BEHIND_FLUSH_M, planeGapM - hardM);
}

/** ⭐ (2026-10-14, the hover's second audit) The drawn lag the MODEL takes off the mesh (`syncOrbitPieceModel`) — none once the piece is captured (the pull owns the mesh). */
export function modelLag(draw: Vec3 | null, placed: boolean): Vec3 {
  return draw !== null && !placed ? draw : [0, 0, 0];
}

/**
 * ⭐⭐ (2026-10-14, the owner: *"modify the offset and distance of the camera during hover so that it's view direction projects equally to the three orthogonal planes horizontal, gravity and the third orthogonal and the cyan highlight can be viewed from top right towards bottom left. Distance of camera to object equals the distance of camera to object at boot with same zoom."*) — **THE HOVER VIEW'S DISTANCE**: the camera's distance to the piece AT BOOT, had the zoom been what it is
 * now — the boot's orbit pose (`cam`), the piece's place on the rings (`box`, from the centre) and the angle offsets, the camera put behind
 * the piece by the gap the zoom makes NOW (`cameraGapM`). So the zoom works in the hover view as it does at boot.
 */
export function hoverViewDistanceM(
  cfg: GestureConfig,
  boot: { readonly cam: OrbitAt; readonly box: Vec3; readonly off: CameraAngleOffset },
  zoom: number,
): number {
  const o = cameraOffset(cfg, boot.cam, boot.box, boot.off, cameraGapM(cfg.cameraRadiusOffsetMm / 1000, zoom));
  return Math.hypot(o[0] - boot.box[0], o[1] - boot.box[1], o[2] - boot.box[2]);
}
