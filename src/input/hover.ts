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
 * ⭐⭐⭐ (2026-10-14, the owner: *"I am not satisfied with the camera movements when toggling back and forth between hover and orbit. There is too much mismatch between the camera position in hover and the rings and as a consequence when toggling into hover the piece flies away from the press and when toggling into orbit the camera has a very complex move. Disregard the requirement of camera placement during hover. I want to implement a camera position during hover which provides a good isometric view of the piece and sliding surface with minimum movement from the orbit ring (therefore during hover the camera can be on the left or the right of the piece, on the bottom or on the top of the piece) and also which can simply smoothly easily blend back into orbit rings."*) — **THE HOVER VIEW: THE NEAREST ISOMETRIC CORNER**. The hosting face's frame: its normal `n`, `t1` the
 * screen's right laid on the face, `t2 = n × t1`. Its four isometric views `(n ± t1 ± t2)/√3` see the face at 35° and both its axes alike;
 * the one on the side the camera ALREADY is (the signs of `toCam` along `t1` and `t2`) is the nearest of the four — left or right, above or
 * below (toward or away on a top face). A camera square on an axis (within `HOVER_CORNER_TIE`) keeps `prev`'s side (or +). ⛔ It replaced a
 * fixed above-right view at the boot's distance (§12), far from the rings: the toggle swung the camera a long way and the piece left the press.
 */
export const HOVER_CORNER_TIE = 0.02;
export function hoverCornerDirection(n: Vec3, right: Vec3, toCam: Vec3, prev: readonly [number, number] | null = null): { dir: Vec3; signs: [number, number] } | null {
  const k = dot(right, n);
  const t1 = unit([right[0] - n[0] * k, right[1] - n[1] * k, right[2] - n[2] * k]);
  if (t1 === null) return null;
  const t2 = unit(cross(n, t1));
  if (t2 === null) return null;
  const c = unit(toCam) ?? n;
  const side = (x: number, i: 0 | 1): number => (Math.abs(x) <= HOVER_CORNER_TIE ? (prev?.[i] ?? 1) : Math.sign(x));
  const s1 = side(dot(c, t1), 0);
  const s2 = side(dot(c, t2), 1);
  const r = 1 / Math.sqrt(3);
  return { dir: [(n[0] + s1 * t1[0] + s2 * t2[0]) * r, (n[1] + s1 * t1[1] + s2 * t2[1]) * r, (n[2] + s1 * t1[2] + s2 * t2[2]) * r], signs: [s1, s2] };
}

/**
 * ⭐⭐ (*"I am not satisfied with the camera movements when toggling back and forth between hover and orbit. There is too much mismatch between the camera position in hover and the rings and as a consequence when toggling into hover the piece flies away from the press and when toggling into orbit the camera has a very complex move. Disregard the requirement of camera placement during hover. I want to implement a camera position during hover which provides a good isometric view of the piece and sliding surface with minimum movement from the orbit ring (therefore during hover the camera can be on the left or the right of the piece, on the bottom or on the top of the piece) and also which can simply smoothly easily blend back into orbit rings."*) — **THE CAMERA TURNS ON AN ARC** about the hover's target: its direction turned (a great-circle slerp) from where the orbit's camera
 * is toward the corner's, its DISTANCE KEPT (no zoom jump), its look slid from the gizmo to the target — by the blend weight `w`. At `w = 0`
 * exactly the orbit's camera, so the way out ends on the rings. ⛔ The camera's position was blended along a straight line (it cut near the
 * piece when the two views were far apart) toward a view at another distance.
 */
export function hoverCameraSwing(camAt: Vec3, lookAt: Vec3, target: Vec3, dir: Vec3, w: number): { camAt: Vec3; lookAt: Vec3 } {
  if (!(w > 0)) return { camAt, lookAt };
  const k = Math.min(1, w);
  const rel: Vec3 = [camAt[0] - target[0], camAt[1] - target[1], camAt[2] - target[2]];
  const d = Math.hypot(rel[0], rel[1], rel[2]);
  const a = unit(rel) ?? dir;
  const u = slerpDir(a, dir, k);
  return {
    camAt: [target[0] + u[0] * d, target[1] + u[1] * d, target[2] + u[2] * d],
    lookAt: [lookAt[0] + (target[0] - lookAt[0]) * k, lookAt[1] + (target[1] - lookAt[1]) * k, lookAt[2] + (target[2] - lookAt[2]) * k],
  };
}
/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"at the camera end position for sliding mode, gravity direction is aligned with vertical axis of the screen. Therefore,
 * the target isometric view relative to the hosting face will not be exactly isometric. But this is necessary so that the user feels the gravity is
 * always aligned with the screen vertical axis."*) — **THE SLIDE VIEW UPRIGHT**: the camera's up (`up`, the orbit's) rolled about the view (`view`)
 * toward the world's vertical seen from the camera, by the slide view's weight `w` — none at 0, exactly upright at 1 (gravity straight down the
 * screen). The view's direction stays the nearest isometric corner, so the face's two axes no longer read alike on the screen. Looking straight down
 * there is no upright to roll to: the orbit's up.
 */
export function uprightBlend(up: Vec3, view: Vec3, w: number): Vec3 {
  const d = unit(view);
  if (d === null) return up;
  const sq = (u: Vec3): Vec3 | null => {
    const k = dot(u, d);
    return unit([u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]]);
  };
  const a = sq(up) ?? sq([0, 1, 0]);
  if (a === null) return up;
  const b = sq([0, 1, 0]);
  if (b === null || !(w > 0)) return a;
  const phi = Math.atan2(dot(cross(a, b), d), dot(a, b)) * Math.min(1, w);
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const x = cross(d, a);
  return unit([a[0] * c + x[0] * s, a[1] * c + x[1] * s, a[2] * c + x[2] * s]) ?? a;
}

/** ⭐ The great-circle turn from unit `a` toward unit `b` by `t`; opposite directions turn over the world's up (or x). */
export function slerpDir(a: Vec3, b: Vec3, t: number): Vec3 {
  const c = Math.max(-1, Math.min(1, dot(a, b)));
  const th = Math.acos(c);
  if (th < 1e-9) return b;
  const axis = unit(cross(a, b)) ?? unit(cross(a, [0, 1, 0])) ?? unit(cross(a, [1, 0, 0]))!;
  const p = cross(axis, a);
  const s = th * t;
  return unit([a[0] * Math.cos(s) + p[0] * Math.sin(s), a[1] * Math.cos(s) + p[1] * Math.sin(s), a[2] * Math.cos(s) + p[2] * Math.sin(s)]) ?? b;
}

/**
 * ⭐⭐⭐ (*"I am not satisfied with the camera movements when toggling back and forth between hover and orbit. There is too much mismatch between the camera position in hover and the rings and as a consequence when toggling into hover the piece flies away from the press and when toggling into orbit the camera has a very complex move. Disregard the requirement of camera placement during hover. I want to implement a camera position during hover which provides a good isometric view of the piece and sliding surface with minimum movement from the orbit ring (therefore during hover the camera can be on the left or the right of the piece, on the bottom or on the top of the piece) and also which can simply smoothly easily blend back into orbit rings."*) — **THE PIECE STAYS UNDER THE FINGER**: the finger's RAY meets the hover's plane (through `p0`, normal `n`), read in the plane's
 * coordinates (`e1`, `e2`) — a finger STEP is the distance between two such points, both rays cast from the camera of the moment
 * (`hoverFingerStep`). ⛔ The finger's screen step was solved onto the plane's screen SHADOWS (a linearisation that a foreshortened axis
 * multiplied), and the piece left the press.
 * `null`: the ray grazes the plane (under `minDeg`) or meets it behind the camera — the point would fly.
 */
export const HOVER_RAY_MIN_DEG = 12;
export function rayPlaneCoords(o: Vec3, d: Vec3, p0: Vec3, n: Vec3, e1: Vec3, e2: Vec3, minDeg = HOVER_RAY_MIN_DEG): [number, number] | null {
  const dl = Math.hypot(d[0], d[1], d[2]);
  if (!(dl > 1e-12)) return null;
  if (Math.abs(dot(d, n)) / dl < Math.sin((minDeg * Math.PI) / 180)) return null;
  const t = dot([p0[0] - o[0], p0[1] - o[1], p0[2] - o[2]], n) / dot(d, n);
  if (!(t > 0)) return null;
  const h: Vec3 = [o[0] + d[0] * t - p0[0], o[1] + d[1] * t - p0[1], o[2] + d[2] * t - p0[2]];
  return [dot(h, e1), dot(h, e2)];
}

/**
 * ⭐⭐ **THE WAY IN AND OUT OF THE HOVER VIEW, BY THE FINGER'S TRAVEL** (the owner: *"Use a camera movement similar to way in or way out to smooth
 * the view, controlled by delta position. Make a slider for the gain"*) — the share of the hover view, raised by a hover drag's travel and
 * lowered by an orbit drag's, \`gainPerMm\` per millimetre of finger; the blend weight eases in and out (smoothstep). ⭐ (2026-10-14) the gain is
 * the way in's own: \`1 / pieceOrbitEnterMm\` (the \`hoverCameraGain\` slider deleted).
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
/** ⭐ (2026-10-15) how far BEHIND a face's plane the resting face's centre may be and still latch (m) — contact rounding only: a resting face hosts IN FRONT of the face. */
export const HOVER_BEHIND_M = 0.001;

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
  /** ⭐⭐ (2026-10-14) the resting face's outline in the world — given, ANY overlap with the face's triangles counts (`overlapsTriangles`) */
  restingPoly: readonly Vec3[] | null = null,
): { contact: { id: string; faceId: string | null; normal: Vec3; centre: Vec3; gapM: number } | null; nearest: { id: string; planeGapM: number; angleDeg: number; bodyGapM: number; overFace: boolean } | null } {
  const cosMin = Math.cos((alignDeg * Math.PI) / 180);
  let contact: { id: string; faceId: string | null; normal: Vec3; centre: Vec3; gapM: number; inPlaneM: number; overM: number } | null = null;
  let nearest: { id: string; planeGapM: number; angleDeg: number; bodyGapM: number; overFace: boolean } | null = null;
  for (const c of candidates) {
    for (const f of c.faces) {
      const cos = -dot(restingNormalW, f.normal); // 1: the resting face looks straight at the face
      const d = dot(f.normal, [restingCentreW[0] - f.centre[0], restingCentreW[1] - f.centre[1], restingCentreW[2] - f.centre[2]]);
      // ⭐⭐⭐ (2026-10-15, the owner: *"the green piece approaches from underneath … the slanted face allows the resting face to be close enough to the hosting
      // face. as a result, the sliding is odd"*) — a face looking away, or one the resting face is BEHIND (beyond `HOVER_BEHIND_M`, contact rounding):
      // ⛔ it was allowed the whole reach (20 mm) behind the plane — a slanted piece tucked beside / under a part latched onto a face it was behind,
      // the hover ran on that plane and the parts "behind" it (the host among them) were exempt from its checks
      if (cos <= 0 || d < -HOVER_BEHIND_M) continue;
      const angleDeg = (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
      const onPlane: Vec3 = [restingCentreW[0] - f.normal[0] * d, restingCentreW[1] - f.normal[1] * d, restingCentreW[2] - f.normal[2] * d];
      const overM = f.triangles === undefined ? 0 : distanceToTriangles(onPlane, f.normal, f.triangles);
      // ⭐⭐⭐ (2026-10-14, the owner: *"Most of the times, I achieve collision with the dy input of the orbit by reaching close to the gizmo with resting face and hosting faces aligned. The collision block further dy orbit move. However, the green highlight for hover latch does not appear and I need to input a slight dx orbit to latch the hover. Why is that? It is more user friendly if the latch is possible from the initial dy orbit collision."*) — ANY PORTION of the resting face over the face: ⛔ its CENTRE had to be, and the orbit keeps the
      // resting face's centre on the ring at least its least radius from the gizmo — at a dy collision near the gizmo on a narrow face the centre
      // stood past the face's edge with much of the resting face over it, and only a dx (swinging the centre over the face) latched the hover
      const overFace = restingPoly !== null && f.triangles !== undefined ? overlapsTriangles(restingPoly, f.normal, f.triangles) : overM <= HOVER_OVER_FACE_M;
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
/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"After a slide, when the press is released, the slide and highlights shall immediately stop. The next press then drives the
 * orbit."*) — **IS A HOVER OFFERED?** Not right after a slide (`slid`): no readiness highlight, no latch, until the orbit has moved the piece. ⛔ The piece,
 * still in contact, was ready again at once — its highlights stayed and a press on it slid again instead of orbiting.
 */
/**
 * ⭐⭐ (2026-10-16, the owner: *"can you also add some friction ? (different from inertia)"* → *"Kinetic (drag)"*) — the KINETIC FRICTION of the slide:
 * the finger's step on the plane is scaled by `speed / (speed + friction)` (both mm/s on the glass): a slow move is held back most, a fast one goes
 * nearly 1:1, and the piece is never stuck (⛔ that would be static friction, not asked). `friction ≤ 0` is off.
 */
export function hoverFrictionScale(speedMmS: number, frictionMmS: number): number {
  if (!(frictionMmS > 0)) return 1;
  if (!(speedMmS > 0)) return 0;
  return speedMmS / (speedMmS + frictionMmS);
}

/** ⭐ (2026-10-16) the time constant of the finger's glass speed the friction reads (s) — a frame's dispatch jitter smoothed out. */
export const HOVER_FRICTION_SPEED_TAU_S = 0.05;

export function hoverOffered(slid: boolean): boolean {
  return !slid;
}

/**
 * ⛔⛔ (2026-10-16, the owner: *"It is not working: if I release the press on sliding, the sliding stay. If I press on empty afterwards, the sliding stays"*) —
 * the spent slide after a LOOK for a contact: it stays spent while the piece is still against a face (⛔ the orbit's first step cleared it, and the piece,
 * still in contact, re-latched at once), and clears once the piece is out of every contact, so a later approach lights as ever. A press on the piece
 * clears it at once (`hoverPressNote`).
 */
export function hoverSlidAfterLook(slid: boolean, contactFound: boolean): boolean {
  return slid && contactFound;
}

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
// ⭐⭐⭐ (2026-10-15, the owner: *"in desktop mode, the sliding movement is jittery. It is ok in mobile mode"*) — the lag kept WHOLE while it is behind; only
// its part AHEAD along the last step (past the solved place) is dropped. ⛔ It was projected onto the last step's direction, its part ACROSS dropped:
// a mouse's integer-pixel steps through the per-axis band alternate axis from frame to frame (125 Hz against 143 fps), so the drawn piece swung
// across by the lag on every switch — 5.6 mm a frame against a 0.7 mm step, in the vector
// ⭐⭐⭐ (2026-10-16, the owner: *"Add some inertia when sliding the green – turquoise piece"* → *"build the inertia"*) — the part ahead is kept up to `aheadMaxM`
// (`HOVER_OVERSHOOT_M`): the part translation's follower overshoots a little where the finger stops, and a clip of it was the stick-slip of 10-14
/** ⭐ (2026-10-16) the most the drawn piece may run AHEAD of its solved place along the slide (m) — the inertia's overshoot, a few millimetres. */
export const HOVER_OVERSHOOT_M = 0.003;
export function hoverDrawLag(lagU: number, lagV: number, dirU: number, dirV: number, aheadMaxM = 0): [number, number] {
  const l = Math.hypot(dirU, dirV);
  if (!(l > 1e-12)) return [0, 0];
  const ahead = Math.max(0, (lagU * dirU + lagV * dirV) / l);
  const cut = ahead - Math.min(ahead, Math.max(0, aheadMaxM));
  return [lagU - (cut * dirU) / l, lagV - (cut * dirV) / l];
}

/**
 * ⭐⭐ (2026-10-14, the hover's audit) — **WHAT ENDS A HOVER BESIDES THE LIFT**: a second touch HELD (its own gesture takes over — ⛔ the hover went on, the centre pinned
 * under it) or the piece CAPTURED onto its goal (the pull owns it — ⛔ the hover went on writing the gizmo).
 */
export function hoverEndsOn(holdActive: boolean, placed: boolean, slideMode = false): boolean {
  // ⭐⭐⭐ (2026-11-01) in the SLIDE MODE a held second touch is the approach: it takes the finger off the slide, the mode stays on (`slideExits` ends it)
  return placed || (holdActive && !slideMode);
}

/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"sliding is entered directly if the contours highlight (no need to press the piece). A + dy or double finger continues to drive the approach so that the user can exit the sliding mode by moving away the piece"*) — **THE SLIDE MODE** (around the assembly, `orbitMode` 0): the slide LATCHES by itself the moment the
 * contours light (the resting face within `hoverApproachMm` of an anti-parallel part's face, over it — `hoverFaceContact`), the piece settled onto the face,
 * no press; it stays on when a finger lifts (every one-finger drag slides); it is left only by the APPROACH taking the piece away — its resting face more
 * than the reach from the face's plane. ⭐ Re-latched only once ARMED again — an approach step INWARD or an orbit step — so the approach's coast outward,
 * hovering at the reach, cannot latch and unlatch it frame after frame.
 */
export function slideLatches(ready: boolean, armed: boolean, placed: boolean, on: boolean): boolean {
  return ready && armed && !placed && !on;
}
/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"once, the contour highlight never latched although the faces were aligned"*, *"I can drive away the piece just with dy
 * and the dx and dy slide never engages although the contour are highlighted"*) — **THE LIT CONTOURS STOP THE ORBIT**: the latch waits for the piece AT
 * REST, so a finger still dragging (or the orbit's coast) carried the piece through the lit contours and away; now, while the latch may happen, the
 * orbit is held where the piece is (the finger's steps dropped, the coast stopped) until it latches — unless the latch is REFUSED (or has waited
 * `SLIDE_WAIT_MAX_MS`: the orbit free again), or A is down (A + drag is the approach).
 */
export function slideHoldsOrbit(ready: boolean, armed: boolean, placed: boolean, on: boolean, refused: boolean, approachKey: boolean): boolean {
  return slideLatches(ready, armed, placed, on) && !refused && !approachKey;
}
/** ⭐ (2026-11-01) the longest the held orbit waits for the piece to come to rest before the latch counts as refused (ms) — at the least. */
export const SLIDE_WAIT_MAX_MS = 800;
/**
 * ⭐⭐ (2026-11-02, the third audit's B3) THE WAIT FROM THE EYE'S SPRING: the drawn piece rests (`pieceShownAtRest`) only after some 12–16 of its time
 * constants (`boxSmoothMs / 2`) — at the shipped 60 ms ~400 ms, at 120 ms ~900 ms, at the slider's 300 ms ~2.3 s. ⛔ A fixed 800 ms ran out first above
 * 120 ms: the lit contours let the orbit go before the latch and the moving finger carried the piece through (`HOVER.md` item 31's hole, back).
 */
export function slideWaitMaxMs(boxSmoothMs: number): number {
  return Math.max(SLIDE_WAIT_MAX_MS, 18 * (Math.max(0, boxSmoothMs) / 2));
}
/** ⭐ (2026-11-01) The latch counts as refused: `hoverStart` said no, or it has been waiting (`waitedMs`) past `maxMs` (`slideWaitMaxMs`). */
export function slideRefusedAfter(result: boolean | "wait", waitedMs: number, maxMs: number = SLIDE_WAIT_MAX_MS): boolean {
  return result === false || (result === "wait" && waitedMs > maxMs);
}
/** ⭐ (2026-11-01) The slide mode left: the resting face's distance to the hosting face's plane (m) beyond the reach (m) — the contours' own test. */
export function slideExits(planeGapM: number, reachM: number): boolean {
  return planeGapM > reachM;
}
/** ⭐ (2026-11-01) Armed again (after the slide mode was left): an approach step inward (`approachTaken` < 0: down is in) or an orbit drag's travel. */
export function slideArmedAfter(armed: boolean, approachTaken: number, orbitTravelMm: number): boolean {
  return armed || approachTaken < 0 || orbitTravelMm > 0;
}
/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"blend the camera movements at entering or exiting the sliding mode - approach mode"*) — the slide view's share by TIME in
 * the slide mode (the latch has no finger travel to read): toward 1 while it is on, back to 0 once it is off, whole over `SLIDE_VIEW_BLEND_MS`, shown
 * eased (`hoverViewWeight`). ⛔ (10-14) by the slide drag's travel in and the orbit's out.
 */
export const SLIDE_VIEW_BLEND_MS = 500;
export function slideViewProgress(progress: number, dtMs: number, on: boolean): number {
  return hoverViewProgress(progress, dtMs, 1 / SLIDE_VIEW_BLEND_MS, on);
}

/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"When I slide, i want to remove the translation sway of the assembly and the camera position freeze and replace that
 * with a limited orbit of the camera as shown in attachment: the camera orbits gradually with the delta position until it reaches the clamped position
 * (which corresponds to the current semi-isometric view the camera is adopting when the sliding mode is on)"*) — **THE SLIDE'S LIMITED ORBIT**: the
 * camera's direction from the slide's target read as two angles off the face's normal `n` — `a[0]` toward `t1` (the screen's right laid on the face),
 * `a[1]` toward `t2 = n × t1` — the direction `(n + tan a0·t1 + tan a1·t2)` normalised. The slide turns them THE WAY THE PIECE GOES (slid right, the
 * camera goes round to the right; up, it rises — the owner's sketch), each clamped at `SLIDE_ORBIT_CLAMP_RAD` (45°: both there, exactly the
 * isometric corner the slide view was frozen on). Begun where the camera is (no jump), brought within the clamp (`slideOrbitStart`, 2026-11-01).
 * ⭐ (2026-11-02, the third audit's B7) off a horizontal face the limits are the clamp, always — the "start beyond the clamp tightened inward" rule
 * went with the start's clamp; only a top's pitch ceiling still tightens.
 */
export const SLIDE_ORBIT_CLAMP_RAD = Math.PI / 4;
export interface SlideOrbit {
  readonly a: readonly [number, number];
  readonly lim: readonly [number, number];
  /** ⭐ (2026-11-01) a horizontal hosting face: the angles are a YAW and a PITCH (`SlideTop`); absent, the two angles off the normal */
  readonly top?: SlideTop | null;
}
/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"when the piece is sliding on horizontal surface, the delta position can send the scene spinning a lot"* → *"option A"*) —
 * **OVER A HORIZONTAL FACE, THE ORBIT'S OWN YAW AND PITCH**: a hosting face within 45° of level (`SLIDE_TOP_COS`, gravity's snap — a top or a bottom) turns
 * the limited orbit as the orbit does: `a[0]` a YAW about the face's normal from the heading the camera had at the latch (`h0`, toward the camera, laid
 * on the face; `s0` its right), clamped at `SLIDE_ORBIT_CLAMP_RAD` each way; `a[1]` the PITCH over the face, between the isometric corner's height
 * (`SLIDE_TOP_CORNER_RAD`, 35.26°) and the orbit's ceiling (`SLIDE_TOP_MAX_RAD`, 85°) — a start outside brought inside them (2026-11-01: an edge-on view never slid).
 * ⛔ The two angles off the normal: begun near straight above (the orbit's 85° pitch), the slide carried the camera over or round the top, where the
 * upright up (`uprightBlend`) has no direction to hold — a few millimetres turned the picture up to half a turn. Now the picture turns only by the yaw.
 */
export const SLIDE_TOP_COS = Math.SQRT1_2;
export const SLIDE_TOP_CORNER_RAD = Math.asin(1 / Math.sqrt(3));
export const SLIDE_TOP_MAX_RAD = (85 * Math.PI) / 180;
export interface SlideTop {
  readonly h0: Vec3;
  readonly s0: Vec3;
  readonly lo: number;
  readonly hi: number;
}
/**
 * ⭐ The limited orbit begun where the camera is (`toCam`, from the target), in the face's frame (`n`, `t1`, `t2`); a horizontal face (`up` the world's): by yaw and pitch.
 * ⭐⭐⭐ (2026-11-01, the owner: *"in the attached configuration, although the slide contours are highlighted, the slide is blocked. fix it."*) — but never
 * further off the face's normal than the isometric corner: each angle within the 45° clamp (a top: the pitch at least the corner's 35.26°), the view
 * turning there over the latch's blend. ⛔ A camera seeing the face nearly EDGE-ON kept its own angle: every finger ray grazed the face (under
 * `HOVER_RAY_MIN_DEG`), so no drag slid the piece — and the view turns only with a slide: stuck for good.
 */
export function slideOrbitStart(n: Vec3, t1: Vec3, t2: Vec3, toCam: Vec3, up: Vec3 = [0, 1, 0]): SlideOrbit {
  const c = unit(toCam) ?? n;
  if (Math.abs(dot(n, up)) >= SLIDE_TOP_COS) {
    const k = dot(c, n);
    const hc: Vec3 = [c[0] - k * n[0], c[1] - k * n[1], c[2] - k * n[2]];
    // straight above: the heading toward the screen's bottom laid on the face (t2 over a top, −t2 under a bottom)
    const sg = dot(n, up) > 0 ? 1 : -1;
    const h0 = unit(hc) ?? ([t2[0] * sg, t2[1] * sg, t2[2] * sg] as Vec3);
    const kt = dot(t1, h0);
    const s0 = unit([t1[0] - kt * h0[0], t1[1] - kt * h0[1], t1[2] - kt * h0[2]]) ?? unit(cross(h0, n)) ?? t1;
    const p = Math.atan2(k, Math.hypot(hc[0], hc[1], hc[2]));
    const p1 = Math.max(SLIDE_TOP_CORNER_RAD, p);
    return { a: [0, p1], lim: [SLIDE_ORBIT_CLAMP_RAD, SLIDE_ORBIT_CLAMP_RAD], top: { h0, s0, lo: SLIDE_TOP_CORNER_RAD, hi: Math.max(SLIDE_TOP_MAX_RAD, p1) } };
  }
  const cn = Math.max(1e-3, dot(c, n));
  const cl = (x: number): number => Math.min(SLIDE_ORBIT_CLAMP_RAD, Math.max(-SLIDE_ORBIT_CLAMP_RAD, x));
  const a: [number, number] = [cl(Math.atan2(dot(c, t1), cn)), cl(Math.atan2(dot(c, t2), cn))];
  return { a, lim: [SLIDE_ORBIT_CLAMP_RAD, SLIDE_ORBIT_CLAMP_RAD] };
}
/** ⭐ One slide step: the angles turned by `d` (rad, along `t1` and `t2`), each held in its limit (the clamp). */
export function slideOrbitStep(o: SlideOrbit, d: readonly [number, number]): SlideOrbit {
  const one = (i: 0 | 1): [number, number] => {
    const lim = o.lim[i];
    return [Math.min(lim, Math.max(-lim, o.a[i] + d[i])), lim];
  };
  const [a0, l0] = one(0);
  const t = o.top ?? null;
  if (t !== null) {
    // ⭐ the pitch between its two limits, each tightened toward the corner / the ceiling as it turns in
    const p = Math.min(t.hi, Math.max(t.lo, o.a[1] + d[1]));
    return { a: [a0, p], lim: [l0, o.lim[1]], top: { ...t, lo: Math.min(SLIDE_TOP_CORNER_RAD, Math.max(t.lo, p)), hi: Math.max(SLIDE_TOP_MAX_RAD, Math.min(t.hi, p)) } };
  }
  const [a1, l1] = one(1);
  return { a: [a0, a1], lim: [l0, l1] };
}
/** ⭐ The camera's direction from the target for these angles. */
export function slideOrbitDir(n: Vec3, t1: Vec3, t2: Vec3, a: readonly [number, number]): Vec3 {
  const x = Math.tan(a[0]);
  const y = Math.tan(a[1]);
  return unit([n[0] + x * t1[0] + y * t2[0], n[1] + x * t1[1] + y * t2[1], n[2] + x * t1[2] + y * t2[2]]) ?? n;
}
/** ⭐ The turn (rad, along `t1` and `t2`) for a slide step `moved` (world) and `travelMm` of finger, at `degPerMm`: the way the piece went. */
export function slideOrbitTurn(moved: Vec3, t1: Vec3, t2: Vec3, travelMm: number, degPerMm: number): [number, number] {
  const m = unit(moved);
  if (m === null || !(travelMm > 0)) return [0, 0];
  const k = (travelMm * degPerMm * Math.PI) / 180;
  return [k * dot(m, t1), k * dot(m, t2)];
}
/** ⭐ (2026-11-01) The heading at yaw `y` over a horizontal face (toward the camera, laid on the face) and its right. */
function topHeading(t: SlideTop, y: number): { h: Vec3; s: Vec3 } {
  const c = Math.cos(y);
  const si = Math.sin(y);
  return {
    h: [c * t.h0[0] + si * t.s0[0], c * t.h0[1] + si * t.s0[1], c * t.h0[2] + si * t.s0[2]],
    s: [c * t.s0[0] - si * t.h0[0], c * t.s0[1] - si * t.h0[1], c * t.s0[2] - si * t.h0[2]],
  };
}
/** ⭐ The camera's direction from the target for the orbit's angles `a` — by yaw and pitch over a horizontal face (`o.top`), else `slideOrbitDir`. */
export function slideOrbitDirOf(o: SlideOrbit, n: Vec3, t1: Vec3, t2: Vec3, a: readonly [number, number]): Vec3 {
  const t = o.top ?? null;
  if (t === null) return slideOrbitDir(n, t1, t2, a);
  const { h } = topHeading(t, a[0]);
  const cp = Math.cos(a[1]);
  const sp = Math.sin(a[1]);
  return unit([sp * n[0] + cp * h[0], sp * n[1] + cp * h[1], sp * n[2] + cp * h[2]]) ?? n;
}
/**
 * ⭐ The turn for a slide step (`slideOrbitTurn`'s) — over a horizontal face in the camera's frame of the moment, as the orbit's: slid along the heading's
 * right, the yaw round that way; slid toward the camera, the pitch DOWN (the camera goes the way the piece went, lower toward the corner); away, up.
 */
export function slideOrbitTurnOf(o: SlideOrbit, moved: Vec3, t1: Vec3, t2: Vec3, travelMm: number, degPerMm: number): [number, number] {
  const t = o.top ?? null;
  if (t === null) return slideOrbitTurn(moved, t1, t2, travelMm, degPerMm);
  const m = unit(moved);
  if (m === null || !(travelMm > 0)) return [0, 0];
  const k = (travelMm * degPerMm * Math.PI) / 180;
  const { h, s } = topHeading(t, o.a[0]);
  return [k * dot(m, s), -k * dot(m, h)];
}

// ⭐⭐⭐ (2026-11-01) the way out's orbit — the one whose CAMERA stands where the slide's is — is `orbitForCameraDir` (`input/assembly_orbit.ts`; ⛔ `slideWayOutQ`, the piece's direction on the slide's, deleted: the camera then swung to its offsets)
/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"I can see a succession of very rapid and small jumps when I slide with my mouse. I don't seem to be able to smooth by
 * changing the sliders in piece sliding menu"*) — **THE SLIDE CAMERA RIDES THE PIECE AS DRAWN**: the shift of the whole camera rig (its place, its look,
 * the slide view's target) by the drawn piece's lag behind its solved place (`draw`), while the slide rides the gizmo; none else. ⛔ The camera rode the
 * SOLVED slide — a mouse's events beat against the frames (125 Hz against the display's rate), so the solved place advanced 1.7 then 4.0 mm on alternate
 * frames (measured) and the camera with it: the piece drawn smoothly, the assembly behind it stuttering 0.7 / 1.8 px — out of the sliders' reach (they
 * shape the piece's follower only).
 */
export function slideCameraShift(slideMode: boolean, gizmoRides: boolean, draw: Vec3 | null): Vec3 {
  return slideMode && gizmoRides && draw !== null ? draw : [0, 0, 0];
}
/**
 * ⭐⭐⭐ (2026-11-01, the owner: *"A + left click and delta position dy to approach the piece until slide latches - left click remains pressed, A is released,
 * the piece is slided with delta position - left click remains pressed, A is pressed again: the piece flies away"*) — **A MOVE THE SLIDE TOOK SPENDS THE
 * ORBIT'S BAND FOR THAT POINTER**: dropped, the orbit starts its band again from where the pointer is when it gets the drag back. ⛔ Kept, the band's
 * anchor stayed where the orbit last read the pointer — before the slide — and the first A + drag step after it was the WHOLE slide's travel: the
 * approach took it at once, the piece flew out. (Released and pressed again, the band was new: no flight.)
 */
export function orbitBandSpent(tookBySlide: boolean, bandPointer: number | null, pointerId: number): boolean {
  return tookBySlide && bandPointer === pointerId;
}
/** ⭐ The way out's re-base is due when the orbit's direction is more than this off the slide view's (rad) — under it, already there. */
export const SLIDE_WAY_OUT_MIN_RAD = (0.5 * Math.PI) / 180;

/**
 * ⭐⭐ (2026-11-01, the owner: *"sometimes, the slide is stuck: the contours are highlighted but delta position does not slide the piece"* → *"a to c"*) —
 * **c. A BLOCKED SLIDE GOES ALONG WHAT BLOCKS IT**: the slide step asked (`ask`, the plane's coordinates) pushing into the contact (its normal in the
 * plane, `nIn`) keeps its part ALONG it — `null` when it pushes nowhere into it, or squarely (the part along it under `SLIDE_ALONG_MIN` of the step).
 * ⛔ The solver keeps a coordinate's sense (no shake on the orbit's ring), so a drag into a part's CORNER slanted to both coordinates moved nothing
 * (measured: a corner normal (−0.6, −0.6) in the plane, the step (+4.9, +6.0) mm — 0 mm).
 */
export const SLIDE_ALONG_MIN = 0.1;
export function slideAlong(ask: readonly [number, number], nIn: readonly [number, number]): [number, number] | null {
  const nl = Math.hypot(nIn[0], nIn[1]);
  const al = Math.hypot(ask[0], ask[1]);
  if (!(nl > 1e-9) || !(al > 1e-12)) return null;
  const nx = nIn[0] / nl;
  const ny = nIn[1] / nl;
  const into = ask[0] * nx + ask[1] * ny;
  if (!(into < 0)) return null;
  const t: [number, number] = [ask[0] - into * nx, ask[1] - into * ny];
  return Math.hypot(t[0], t[1]) >= SLIDE_ALONG_MIN * al ? t : null;
}
/** ⭐⭐ (2026-11-01, b) **THE BLOCKED SLIDE SAYS WHY** on the HUD's `last` line — the part it pushes into (⛔ the press's own line stood: nothing said it was blocked). */
export function slideBlockedVerdict(who: string | null): string {
  return `slide: blocked by ${who ?? "a part"} — drag along it or away from it`;
}

/**
 * ⭐⭐ (2026-11-01, the owner: *"hide the gizmo when contours are highlighted and during sliding: the gizmo shall reappear when the piece is taken away from
 * the hosting face"*) — the yellow gizmo HIDDEN while the contours are lit (`ready`) or the slide is on (`on`); it comes back with the contours' going out
 * (the piece beyond the reach of a face).
 */
export function gizmoHiddenBySlide(ready: boolean, on: boolean): boolean {
  return ready || on;
}

/**
 * ⭐⭐ (2026-10-14, the hover's audit) — **THE HOVER VIEW FOLLOWS A NEW FACE**: a hover begun on a face turned from the view's own (more than ~2.6°) RETARGETS the view
 * — ⛔ it stayed on the first face, so a hover on a side face after one on a top face was watched from above. Eased from the view it leaves
 * over `HOVER_VIEW_RETARGET_MS`.
 */
export const HOVER_VIEW_RETARGET_MS = 250;
/** ⭐ (2026-10-15, the Fable audit) a new hover's start this far from the view's target (m) retargets it, even on a face of the same normal. */
export const HOVER_RETARGET_M = 0.005;
export function hoverViewRetargets(prevN: Vec3, n: Vec3, prevTarget: Vec3, target: Vec3, retargetM = HOVER_RETARGET_M): boolean {
  // ⛔ (2026-10-15) the normal alone: a second hover on a face of the same normal (hovered 20 cm along a top, lifted, pressed again) kept the
  // first hover's target, the camera arcing about a point behind the piece
  return dot(prevN, n) <= 0.999 || Math.hypot(target[0] - prevTarget[0], target[1] - prevTarget[1], target[2] - prevTarget[2]) > retargetM;
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
 * ⭐⭐⭐ (2026-10-14, the owner: *"After a hover which has moved the piece, the orbit shall way in smoothly (same as the previous way in way out of the piece orbit) so the piece does not jump. The gizmo position shall not be changed by a toggle from hover to orbit."*) — **AFTER A HOVER, THE ORBIT WAYS IN**: the piece's hover offset (`hoverGizmoMove` 0 — the gizmo never
 * moved) goes back to the piece's ring place over the next ORBIT drag's finger travel, exactly as the way in round a piece: the travel read
 * on the orbit's spring (`smoothTravel`), the share left `1 − smoothstep(travel / pieceOrbitEnterMm)` (`entryProgress`'s). ⛔ It eased out
 * in ~0.1 s whatever the finger did (τ = `boxSmoothMs` / 2): the piece jumped back to where it was before the hover as the orbit began.
 */
export interface HoverWayIn {
  /** the offset when the orbit began to take it back (m) */
  readonly pieceOff: Vec3;
  /** the finger's raw travel (mm), what is read of it on the spring, and its rate */
  readonly rawMm: number;
  readonly travelledMm: number;
  readonly velMm: number;
  /** the share of `pieceOff` the piece still carries (solved: a part may hold it) */
  readonly share: number;
  /** ⭐ (2026-10-15, the Fable audit) the travel (mm) at which a part last held it short of its share — not solved again until the travel moves on */
  readonly heldAtMm?: number | null;
}
/** ⭐ (2026-10-15, the Fable audit) is the way in due a solve this frame? Its share is not the one wanted, and a part did not hold it at this very travel. ⛔ It re-solved every idle frame, for ever. */
export function wayInDue(w: HoverWayIn, want: number): boolean {
  if (Math.abs(want - w.share) < 1e-9) return false;
  return w.heldAtMm === undefined || w.heldAtMm === null || w.heldAtMm !== w.travelledMm;
}
export function startHoverWayIn(offset: Vec3): HoverWayIn {
  return { pieceOff: offset, rawMm: 0, travelledMm: 0, velMm: 0, share: 1 };
}
export function hoverWayInLeft(travelledMm: number, enterMm: number): number {
  if (enterMm <= 0) return 0;
  const t = Math.min(1, Math.max(0, travelledMm / enterMm));
  return 1 - t * t * (3 - 2 * t);
}

/** ⭐ Two faces overlap when they share more than this across (m) — touching edges do not count. */
export const HOVER_OVERLAP_EPS_M = 1e-4;

/** ⭐ Two orthonormal axes of the plane of normal `n`. */
export function planeAxes(n: Vec3): [Vec3, Vec3] {
  const seed: Vec3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const k = dot(seed, n);
  const a = unit([seed[0] - n[0] * k, seed[1] - n[1] * k, seed[2] - n[2] * k])!;
  return [a, unit(cross(n, a))!];
}

/** ⭐ A 2-D convex hull (Andrew's monotone chain), counter-clockwise; duplicates dropped. */
export function convexHull2D(pts: readonly (readonly [number, number])[]): [number, number][] {
  const p = [...pts].map((q) => [q[0], q[1]] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, q) <= 1e-18) lo.pop();
    lo.push(q);
  }
  const up: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]!;
    while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, q) <= 1e-18) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** ⭐ Two convex 2-D polygons OVERLAP by more than `eps` across, by separating axes (the edge normals of both). */
export function convexOverlap2D(a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[], eps = HOVER_OVERLAP_EPS_M): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const axes: [number, number][] = [];
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!;
      const q = poly[(i + 1) % poly.length]!;
      const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (l > 1e-12) axes.push([-(q[1] - p[1]) / l, (q[0] - p[0]) / l]);
    }
  for (const ax of axes) {
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const p of a) {
      const t = p[0] * ax[0] + p[1] * ax[1];
      a0 = Math.min(a0, t);
      a1 = Math.max(a1, t);
    }
    for (const p of b) {
      const t = p[0] * ax[0] + p[1] * ax[1];
      b0 = Math.min(b0, t);
      b1 = Math.max(b1, t);
    }
    if (Math.min(a1, b1) - Math.max(a0, b0) <= eps) return false;
  }
  return true;
}

/**
 * ⭐⭐ (2026-10-14, the owner: *"Most of the times, I achieve collision with the dy input of the orbit by reaching close to the gizmo with resting face and hosting faces aligned. The collision block further dy orbit move. However, the green highlight for hover latch does not appear and I need to input a slight dx orbit to latch the hover. Why is that? It is more user friendly if the latch is possible from the initial dy orbit collision."* · *"when there is not any portion of the resting face in contact with a hosting face (i.e. on its full surface, the resting face faces empty) the movement shall default back to orbit even if the press has not been released."*) — **ANY PORTION OF THE RESTING FACE OVER A FACE**: the resting face's outline (`poly`, its convex
 * hull) and the face's triangles, both laid on the plane of `n`, overlap by more than `HOVER_OVERLAP_EPS_M` across.
 */
export function overlapsTriangles(poly: readonly Vec3[], n: Vec3, tris: readonly (readonly [Vec3, Vec3, Vec3])[]): boolean {
  const [a, b] = planeAxes(n);
  const P = (p: Vec3): [number, number] => [dot(p, a), dot(p, b)];
  const hull = convexHull2D(poly.map(P));
  // ⛔ (2026-10-15) the edge margin (`hoverEdgeMarginMm`) is deleted: the latch counts any portion; the slide's bound is the CENTRE's (`insideRects`)
  return tris.some((t) => convexOverlap2D(hull, [P(t[0]), P(t[1]), P(t[2])]));
}

/**
 * ⭐⭐ (2026-10-14, the owner: *"Display also a green highlight over the biggest boundary of coplanar hosting faces so the user can visually couple it with the green highlight of the resting face (similar to yellow highlight for resting face and quad)."*) — **THE OUTLINE OF THE COPLANAR HOSTING FACES**: rectangles in the plane (each face's extent), each grown by
 * `growM` (so faces a joint apart — 3 mm between the coloured cores — read as one), the ones joined to rectangle `seed` (overlapping or touching,
 * step by step), their UNION's boundary as segments. Exact for faces square to the plane's axes (every `Scene_1` part); others are taken by their
 * extent.
 */
export interface Rect2 {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}
/** ⭐ (2026-10-15) the rectangles joined to `seed` (overlapping or touching, step by step), each grown by `growM` — the drawn outline's region (`rectsBoundary`) and the slide's bound (`insideRects`). */
export function rectComponent(rects: readonly Rect2[], seed: number, growM: number): Rect2[] {
  if (seed < 0 || seed >= rects.length) return [];
  const g = rects.map((r) => ({ x0: r.x0 - growM, y0: r.y0 - growM, x1: r.x1 + growM, y1: r.y1 + growM }));
  const touch = (a: Rect2, b: Rect2) => a.x0 <= b.x1 + 1e-9 && b.x0 <= a.x1 + 1e-9 && a.y0 <= b.y1 + 1e-9 && b.y0 <= a.y1 + 1e-9;
  const inSet = new Set<number>([seed]);
  const stack = [seed];
  while (stack.length > 0) {
    const i = stack.pop()!;
    g.forEach((r, j) => {
      if (!inSet.has(j) && touch(g[i]!, r)) {
        inSet.add(j);
        stack.push(j);
      }
    });
  }
  return [...inSet].sort((x, y) => x - y).map((i) => g[i]!);
}

/** ⭐ (2026-10-15) the BOUNDARY of a union of rectangles, as segments — what the hover's green outline draws. */
export function rectsBoundary(comp: readonly Rect2[]): [[number, number], [number, number]][] {
  const xs = [...new Set(comp.flatMap((r) => [r.x0, r.x1]))].sort((a, b) => a - b);
  const ys = [...new Set(comp.flatMap((r) => [r.y0, r.y1]))].sort((a, b) => a - b);
  const covered = (i: number, j: number): boolean => {
    if (i < 0 || j < 0 || i >= xs.length - 1 || j >= ys.length - 1) return false;
    const cx = (xs[i]! + xs[i + 1]!) / 2;
    const cy = (ys[j]! + ys[j + 1]!) / 2;
    return comp.some((r) => cx > r.x0 && cx < r.x1 && cy > r.y0 && cy < r.y1);
  };
  const segs: [[number, number], [number, number]][] = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++) {
      if (!covered(i, j)) continue;
      const x0 = xs[i]!, x1 = xs[i + 1]!, y0 = ys[j]!, y1 = ys[j + 1]!;
      if (!covered(i - 1, j)) segs.push([[x0, y0], [x0, y1]]);
      if (!covered(i + 1, j)) segs.push([[x1, y0], [x1, y1]]);
      if (!covered(i, j - 1)) segs.push([[x0, y0], [x1, y0]]);
      if (!covered(i, j + 1)) segs.push([[x0, y1], [x1, y1]]);
    }
  return segs;
}

/**
 * ⭐⭐⭐ (2026-10-15, the owner: *"No bridging. The boundary is drawn when sliding is allowed. Clamp the sliding so that the center of the resting face
 * remains within the boundary."* → *"a rapid delta position can throw the piece outside the boundary"*) — **THE DISTANCE TO THE DRAWN BOUNDARY**: of a point
 * (the resting face's centre, on the plane's axes) to the nearest of its rectangles (`rectComponent`) — 0 inside or on it, `Infinity` with none. The
 * clamp keeps it from GROWING (`boundStep`, `holdOffBound`).
 */
export function rectsDistance(comp: readonly Rect2[], x: number, y: number): number {
  let best = Infinity;
  for (const r of comp) {
    const dx = Math.max(r.x0 - x, 0, x - r.x1);
    const dy = Math.max(r.y0 - y, 0, y - r.y1);
    best = Math.min(best, dx <= 1e-12 && dy <= 1e-12 ? 0 : Math.hypot(dx, dy));
  }
  return best;
}

/**
 * ⭐⭐⭐ (2026-10-14, the owner: *"modify: when there is not any portion of the resting face in contact with a hosting face (i.e. on its full surface, the resting face faces empty) the hover translation shall stop and be bounded by the hosting face contour and the user shall be able to bring back the hovering piece inside the boundary by reversing the delta position input. No more automatic transition to orbit."*) — **THE HOVER BOUNDED BY THE HOSTING FACES**: a step from `from` toward `to` (plane coordinates) kept
 * where `inside` holds (the resting face over some coplanar hosting face): the whole step if it does; else the step along ONE axis that does
 * (sliding along the boundary), the longer of the two; else the furthest point of the step that does (`iters` halvings). `from` is inside.
 */
/**
 * ⭐⭐⭐ (2026-10-15, the Fable audit) — **THE SOLVED STEP HELD OFF THE BOUND**: the solver's slide may carry the centre past where `boundStep` let it
 * aim; held at `from` only when the step went from INSIDE the boundary to outside. ⛔ It was held whenever the solved place was outside — a hover
 * starting with the centre outside (the latch is any portion of the resting face, §15) was put back at its start every frame: the piece froze.
 */
export function holdOffBound(from: readonly [number, number], solved: readonly [number, number], dist: (u: number, v: number) => number): [number, number] {
  // ⭐⭐⭐ (2026-10-15, *"a rapid delta position can throw the piece outside the boundary"*) — held whenever it ends FARTHER from the boundary than it
  // started (from inside: off it; from outside: away from it)
  return dist(solved[0], solved[1]) > dist(from[0], from[1]) + 1e-12 ? [from[0], from[1]] : [solved[0], solved[1]];
}

export function boundStep(from: readonly [number, number], to: readonly [number, number], dist: (u: number, v: number) => number, iters = 12): [number, number] {
  // ⭐⭐⭐ (2026-10-15, the owner: *"a rapid delta position can throw the piece outside the boundary and when the orbit restart, the piece is not reachable
  // any longer and does not follow the orbit"*) — ONE RULE: a step may never take the centre FARTHER from the drawn boundary than it is (`dist`, 0
  // inside). Inside, it cannot leave; outside (the latch is any portion of the resting face, §15), it moves toward it or along it, never away.
  // ⛔ (2026-10-14, the §17 freeze) a hover starting outside was FREE until inside — one fast drag away threw the piece metres off
  const d0 = dist(from[0], from[1]);
  const inside = (u: number, v: number): boolean => dist(u, v) <= d0 + 1e-12;
  if (inside(to[0], to[1])) return [to[0], to[1]];
  const du = to[0] - from[0];
  const dv = to[1] - from[1];
  const a = inside(to[0], from[1]);
  const b = inside(from[0], to[1]);
  // ⭐⭐ (2026-10-15) a slide along an axis the step does not move on is no slide: ⛔ a step along u alone found its v-"slide" inside (it is `from`)
  // and stopped where it stood, short of the edge — the halving below takes it up to the edge
  const slideU = a && Math.abs(du) > 0;
  const slideV = b && Math.abs(dv) > 0;
  if (slideU && (!slideV || Math.abs(du) >= Math.abs(dv))) return [to[0], from[1]];
  if (slideV) return [from[0], to[1]];
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < iters; i++) {
    const m = (lo + hi) / 2;
    if (inside(from[0] + du * m, from[1] + dv * m)) lo = m;
    else hi = m;
  }
  return [from[0] + du * lo, from[1] + dv * lo];
}

/**
 * ⭐⭐⭐ (2026-10-14, the owner: *"regression: I cannot grab any longer the piece to hover when the green highlight appears. the scene freezes."*) — **WHEN THE HOVER VIEW ENDS**: once the orbit has taken it back (its asked share 0) AND its shown share
 * is back to 0, and only with NO hover on. ⛔ A new view (both shares 0 at the press) was deleted the very next frame: the camera never turned
 * toward the corner — and a face seen nearly edge-on (a finger's ray grazing it moves nothing, waiting for that turn) froze the hover.
 */
export function hoverViewEnds(progress: number, shown: number, hoverOn: boolean): boolean {
  return !hoverOn && progress <= 0 && shown < 1e-3;
}
