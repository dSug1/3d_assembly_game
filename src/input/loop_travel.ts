/**
 * ⭐⭐⭐ (2026-11-06, the rebuild — `TILTED_ORBIT_REBUILD_SCOPE.md` §22.2, T1 – T6) **THE TRAVEL ON THE LOOPS** — engine-free; the ONLY mover of the
 * orbit's place (T6: the finger's steps and its coast's, nothing else).
 * * T1 — the place lies on G1 (the faces contour clear of every part, §22.1); through it two cutting planes, each cutting the convex G1 in ONE closed loop
 *   (`plane_cut.ts`, the 1 mm rule).
 * * T2 — a finger component travels a loop: dx the one running along the face's screen RIGHT, dy the one along its UP — the face's own frame (a wall:
 *   gravity's up laid on it; a cap: the wall's up carried over its entry edge), read per face (never from the camera). The PACE: each face crossed in its
 *   share of the turn — the side's slice (the half-dihedrals at its two ends; 90° on a box) at the orbit's degrees per mm of finger, the edge's slow stretch
 *   at both ends (`edgeMap`: the last `edgeMm` over `edgeDeg`) — a 50 cm wall and a 3.3 cm top each take a quarter turn of finger.
 * * T3 — ONE CROSSING EVENT: a step is split at the first face change on its way; there, once and in order: T5, the new face's frame (T2), R4 (T4).
 * * T4 — R4: a finger component whose gizmo motion turns past 120° at a crossing (the new face unfolded onto the old) is HELD until the finger reverses it.
 * * T5 — ⭐⭐⭐ (2026-11-06) THE VIEW HOLDS: a step whose place would show the scene slanted or upside down (the caller's `allowed`) is cut back to the last
 *   place it allows — on any face, a top, a bottom or a slanted one alike. ⛔ A cap's only way out its entry wall (blind to the view's lean on the cap).
 * Under a travel along a loop its plane is kept; the OTHER plane is re-derived through the new place, square to the loop's direction there.
 * ⛔ ENGINE-FREE. Plane cuts, arc lengths, rotations — textbook.
 */
import { cross, dot, normalize, qRotate, shortestArc, type Vec3 } from "../core/vec";
import { edgeMap, edgeUnmap } from "./face_map";
import { cutLoop, insidePlane, loopArc, loopLength, loopPoint, planeThrough, type CutFacet, type CutLoop, type Plane } from "./plane_cut";

/** ⭐ A facet of G1 as the travel reads it: its outward normal and polygon; a cap (a top, a bottom) or a wall. */
export interface TravelFacet extends CutFacet {
  readonly cap: boolean;
}

/** ⭐ A facet is a CAP when its normal is within 45° of the vertical. */
export const isCapNormal = (n: Vec3): boolean => Math.abs(n[1]) > Math.SQRT1_2;

/** ⭐ The travel's knobs: the orbit's pace (degrees of the turn per mm of finger) and the edge's slow stretch (its length, m, over its angle, rad). */
export interface TravelOpts {
  readonly degPerMm: number;
  readonly edgeM: number;
  readonly edgeRad: number;
}

/** ⭐ R4's hold: a finger component held (its sign — the way it was going when held) until the finger reverses it; 0: free. */
export interface Hold {
  readonly x: number;
  readonly y: number;
}
export const HOLD_FREE: Hold = { x: 0, y: 0 };

/** ⭐ THE TRAVEL'S STATE: the place on G1, its facet, the two cutting planes through it; on a cap its carried up (`axis`) and the wall it was entered from. */
export interface Travel {
  readonly p: Vec3;
  readonly facet: number;
  readonly planes: readonly [Plane, Plane];
  readonly axis: Vec3 | null;
  readonly entry: Vec3 | null;
  readonly hold: Hold;
}

const neg = (a: Vec3): Vec3 => [-a[0], -a[1], -a[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const onPlane = (v: Vec3, n: Vec3): Vec3 | null => {
  const k = dot(v, n);
  return normalize([v[0] - k * n[0], v[1] - k * n[1], v[2] - k * n[2]]);
};

/** ⭐ A wall's own up: gravity laid in its plane (a horizontal facet: none — +z). */
export function wallUp(n: Vec3): Vec3 {
  return onPlane([0, 1, 0], n) ?? [0, 0, 1];
}

/** ⭐ The up a cap (normal `capN`) carries when entered from the wall `wallN`: the wall's up turned over their edge (§20.1 (b)). */
export function capAxis(capN: Vec3, wallN: Vec3): Vec3 {
  return onPlane(qRotate(shortestArc(wallN, capN), wallUp(wallN)), capN) ?? onPlane([0, 0, 1], capN) ?? [1, 0, 0];
}

/** ⭐⭐ T2 — THE FACE'S FRAME at a facet (normal `n`): its up (a wall's gravity, a cap's carried `axis`) and its screen right seen from outside. */
export function faceFrame(n: Vec3, cap: boolean, axis: Vec3 | null): { readonly up: Vec3; readonly right: Vec3 } {
  const up = cap && axis !== null ? axis : wallUp(n);
  return { up, right: normalize(cross(up, neg(n))) ?? [1, 0, 0] };
}

/** ⭐ The loop a plane cuts in G1 (the 1 mm rule). */
export function loopOf(facets: readonly TravelFacet[], plane: Plane): CutLoop | null {
  return cutLoop(facets, insidePlane(plane, facets));
}

/** ⭐ The two planes through `p` on a facet's frame: the dx plane (containing the face's right — its normal the face's up) and the dy plane. */
export function framePlanes(p: Vec3, frame: { readonly up: Vec3; readonly right: Vec3 }): readonly [Plane, Plane] {
  return [planeThrough(p, frame.up), planeThrough(p, frame.right)];
}

/** ⭐ The boot: the place `p` on facet `fi` (a wall), its two planes from the face's frame. */
export function travelAt(facets: readonly TravelFacet[], p: Vec3, fi: number): Travel {
  const f = facets[fi]!;
  const axis = f.cap ? capAxis(f.n, [0, 0, -1]) : null;
  return { p, facet: fi, planes: framePlanes(p, faceFrame(f.n, f.cap, axis)), axis, entry: f.cap ? [0, 0, -1] : null, hold: HOLD_FREE };
}

/** ⭐ The half-dihedral (rad) between two facets' normals. */
const halfBetween = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / 2;

/** ⭐ A loop's side `i`: its ends, its length, its facet, and the half-dihedrals at its two ends (with the sides before and after). */
function sideOf(facets: readonly TravelFacet[], L: CutLoop, i: number) {
  const n = L.pts.length;
  const a = L.pts[i]!;
  const b = L.pts[(i + 1) % n]!;
  const f = L.facet[i]!;
  const fPrev = L.facet[(i - 1 + n) % n]!;
  const fNext = L.facet[(i + 1) % n]!;
  return { a, b, len: len(sub(b, a)), f, hA: halfBetween(facets[f]!.n, facets[fPrev]!.n), hB: halfBetween(facets[f]!.n, facets[fNext]!.n) };
}

/**
 * ⭐⭐ T2's PACE on one side: the distance `x` (0 … length) from its start `a` ↔ the TURN `ang` (0 … hA + hB) — the slice's middle linear, its last `edgeM`
 * at each end over `edgeRad` (`edgeMap`), centred so the face's middle is the slice's middle.
 */
function sideAngle(x: number, s: ReturnType<typeof sideOf>, o: TravelOpts): number {
  const A = s.hA + s.hB;
  const half = s.len / 2;
  const band = A > 1e-12 ? Math.min(0.5, Math.max(0, o.edgeRad / (A / 2))) : 0;
  return (A / 2) * (1 + edgeUnmap(x - half, band, half, o.edgeM));
}
function sideDistance(ang: number, s: ReturnType<typeof sideOf>, o: TravelOpts): number {
  const A = s.hA + s.hB;
  const half = s.len / 2;
  const band = A > 1e-12 ? Math.min(0.5, Math.max(0, o.edgeRad / (A / 2))) : 0;
  return half + edgeMap(A > 1e-12 ? ang / (A / 2) - 1 : 0, band, half, o.edgeM);
}

/** ⭐ The result of a step: the travel after it, whether a hold stopped it (T5 or R4), and the faces crossed. */
export interface StepResult {
  readonly travel: Travel;
  readonly held: "VIEW" | "R4" | null;
  readonly crossed: number;
}

/**
 * ⭐⭐⭐ ONE FINGER COMPONENT'S STEP (T2 – T5): `mm` of finger (+ right / + up) for `comp` ("x" dx, "y" dy). The component's loop is the plane through the
 * place whose normal is the face's up (dx) or right (dy); the place moves along it the way the face's right (up) points, by the pace (T2), side after side.
 * At each face change, once: the new face's frame, R4 (the component's motion past 120° from its way on the face before, unfolded: held at the edge).
 * ⭐⭐⭐ (2026-11-06, §22.2 T5 rewritten) `allowed`: the VIEW's rule (`loop_camera.ts` `viewAllowed` through the wiring's view at a place) — a step whose
 * place it refuses is cut back to the last place it allows (⛔ a cap's only way out its entry wall: a rule on faces, blind to the view's lean on the cap). After the step the OTHER plane is re-derived through the place, square to the loop.
 */
export function travelStep(facets: readonly TravelFacet[], tr: Travel, comp: "x" | "y", mm: number, o: TravelOpts, allowed?: (t: Travel) => boolean): StepResult {
  const r = travelRaw(facets, tr, comp, mm, o);
  // every place a step ends on is the view's to allow — R4's stop included (⛔ returned unchecked: the hexagons reached a view slanted 66–72°)
  if (allowed === undefined || allowed(r.travel)) return r;
  // ⭐⭐⭐ T5 — THE VIEW HOLDS: the step cut back to the last share of it whose place the view allows (halving), the rest dropped
  let lo = 0;
  let hi = 1;
  let best: StepResult = { travel: tr, held: "VIEW", crossed: 0 };
  for (let k = 0; k < 14; k++) {
    const m = (lo + hi) / 2;
    const t = travelRaw(facets, tr, comp, mm * m, o);
    if (allowed(t.travel)) {
      lo = m;
      best = { travel: t.travel, held: "VIEW", crossed: t.crossed };
    } else hi = m;
  }
  return best;
}

function travelRaw(facets: readonly TravelFacet[], tr: Travel, comp: "x" | "y", mm: number, o: TravelOpts): StepResult {
  const held0 = comp === "x" ? tr.hold.x : tr.hold.y;
  if (mm === 0) return { travel: tr, held: null, crossed: 0 };
  // R4's hold lifts only when the finger reverses
  if (held0 !== 0 && Math.sign(mm) === held0) return { travel: tr, held: "R4", crossed: 0 };
  let hold: Hold = comp === "x" ? { x: 0, y: tr.hold.y } : { x: tr.hold.x, y: 0 };
  const f0 = facets[tr.facet]!;
  const frame0 = faceFrame(f0.n, f0.cap, tr.axis);
  const want = comp === "x" ? frame0.right : frame0.up; // the way +mm goes on the face
  // T2: the component's loop is the plane through the place that runs along its way on THIS face (its normal the most square to it)
  const pi = Math.abs(dot(tr.planes[0].n, want)) <= Math.abs(dot(tr.planes[1].n, want)) ? 0 : 1;
  const plane = tr.planes[pi]!;
  const L = loopOf(facets, plane);
  if (L === null) return { travel: tr, held: null, crossed: 0 };
  const n = L.pts.length;
  // the loop's orientation at the place: +1 the way its sides run
  const s0 = loopArc(L, tr.p);
  const ahead = loopPoint(L, s0 + 1e-6).p;
  const dirSign = Math.sign(dot(sub(ahead, tr.p), want)) * Math.sign(mm) || Math.sign(mm);
  let side = loopPoint(L, s0).side;
  let x = s0 - arcAt(L, side); // distance along the side from its start
  let turn = (Math.abs(mm) * o.degPerMm * Math.PI) / 180; // the turn this step buys (rad)
  let facet = L.facet[side]!;
  let axis = tr.axis;
  let entry = tr.entry;
  let crossed = 0;
  let held: StepResult["held"] = null;
  for (let k = 0; k < 4 * n && turn > 0; k++) {
    const sd = sideOf(facets, L, side);
    const ang = sideAngle(x, sd, o);
    const A = sd.hA + sd.hB;
    const room = dirSign > 0 ? A - ang : ang; // the turn left to this side's end
    if (turn <= room) {
      x = sideDistance(dirSign > 0 ? ang + turn : ang - turn, sd, o);
      turn = 0;
      break;
    }
    // ⭐⭐⭐ T3 — the face change: T5, the new face's frame, R4 — once, in this order
    const nextSide = dirSign > 0 ? (side + 1) % n : (side - 1 + n) % n;
    const nf = L.facet[nextSide]!;
    const here = facets[facet]!;
    const there = facets[nf]!;
    let nAxis = axis;
    let nEntry = entry;
    if (nf !== facet) {
      if (there.cap && !here.cap) {
        nAxis = capAxis(there.n, here.n);
        nEntry = here.n;
      } else if (!there.cap) {
        nAxis = null;
        nEntry = null;
      }
      // R4: the component's way on the new face, unfolded onto the old, against its way before
      const fr = faceFrame(there.n, there.cap, nAxis);
      const wantNew = comp === "x" ? fr.right : fr.up;
      const unfolded = qRotate(shortestArc(there.n, here.n), wantNew);
      const before = normalize(sub(sd.b, sd.a));
      const goingBefore: Vec3 = before === null ? want : dirSign > 0 ? before : neg(before);
      const goingNew = Math.sign(mm) > 0 ? unfolded : neg(unfolded);
      if (dot(goingBefore, goingNew) < -0.5) {
        x = dirSign > 0 ? Math.max(0, sd.len - 1e-6) : Math.min(sd.len, 1e-6);
        hold = comp === "x" ? { x: Math.sign(mm), y: hold.y } : { x: hold.x, y: Math.sign(mm) };
        held = "R4";
        break;
      }
      crossed++;
    }
    turn -= room;
    side = nextSide;
    facet = nf;
    axis = nAxis;
    entry = nEntry;
    const ns = sideOf(facets, L, side);
    x = dirSign > 0 ? 0 : ns.len;
  }
  const at = loopPoint(L, arcAt(L, side) + Math.min(Math.max(0, x), sideOf(facets, L, side).len - 1e-9));
  const p = at.p;
  const fNow = facets[facet]!;
  // the other plane through the new place, square to the loop's direction there
  const t = normalize(sub(loopPoint(L, loopArc(L, p) + 1e-6).p, p)) ?? (comp === "x" ? frame0.right : frame0.up);
  const other = planeThrough(p, t);
  // stored [dx's, dy's] by the face the place is on now: the dx plane contains its right (its normal the most along its up)
  const fr = faceFrame(fNow.n, fNow.cap, axis);
  const planes: readonly [Plane, Plane] = Math.abs(dot(plane.n, fr.up)) >= Math.abs(dot(other.n, fr.up)) ? [plane, other] : [other, plane];
  return { travel: { p, facet, planes, axis, entry, hold }, held, crossed };
}

/** ⭐ The arc length at the start of side `i`. */
function arcAt(L: CutLoop, i: number): number {
  let s = 0;
  for (let k = 0; k < i; k++) s += len(sub(L.pts[(k + 1) % L.pts.length]!, L.pts[k]!));
  return s;
}

/** ⭐ The loops through the travel's place (the drawn path of each component — the green the dx's, the red the dy's). */
export function travelLoops(facets: readonly TravelFacet[], tr: Travel): { readonly green: CutLoop | null; readonly red: CutLoop | null } {
  return { green: loopOf(facets, tr.planes[0]), red: loopOf(facets, tr.planes[1]) };
}

export { loopLength };
