/**
 * ⭐⭐⭐ prototype — **THE ORBITED PIECE'S SOLVER** (`COLLISION.md` §12; the owner, 2026-10-13: *"Audit what we have built since commit b37be04 …
 * propose a way to re-build everything with a clean logic and robust coding"* → *"1- ok [a fixed ~1 mm gap] 2- the gizmo is on the face hit by
 * raycast. It cannot be inside a part 3- i have no opinion. Do what you recommend. Build"*).
 *
 * ONE AUTHORITY, ONE RULE, ONE SOLVER — pure, engine-free, every input given (the scene reaches it through `SolverEnv`):
 * - **the state** is the piece's place on its ring, `q = (yaw, v)` (its orientation apart); its world pose is a function of `q` — there is no
 *   pose off the ring.
 * - **the rule** is a CLEARANCE, not a penetration: a pose is admissible iff the piece's surface gap to every obstacle is at least half the gap
 *   kept; the solver RESTS at the gap kept (`gapM`, the owner's ~1 mm). Admissibility reads the pose alone — never where the piece came from —
 *   so a free path is free backwards, and a step that opens the gap is always taken: **reversible by construction**. ⛔ No depth, no "may only
 *   get shallower", no unlock, no skin following the camera (the parts keep their own rule, `D136`).
 * - **the solver** advances the input step along the ARC of the ring (the piece only translates on it) by CONSERVATIVE ADVANCEMENT (Mirtich
 *   1996): never further than the measured gap minus the gap kept; at the gap kept, the rest of the step is PROJECTED onto the contacts in the
 *   ring's own coordinates (`projectExact`: the least change in the ring's metric, every contact honoured — an exact active set, corners too) and
 *   it slides on; nothing left to project: BLOCKED. A cap on the work (the gap queries) budgets it: what is left unsolved is reported
 *   (`deferred`), never dropped.
 * - **stuck** is asked of the SAME solver (`stuckProbe`), a TURN of the piece of the same rule (`turnSweep`), and a piece the ring moved into
 *   a part (the gizmo moved, a part moved) is put back on the nearest free place of its ring (`nearestFree`).
 */
import type { Vec3 } from "../core/vec";
import type { World } from "../core/object_model";

/** ⭐ The piece's place on its ring: the yaw, the ring parameter (0 … 1), the zoom (fixed for the piece). */
export interface OrbitQ {
  readonly yaw: number;
  readonly v: number;
  readonly zoom: number;
}
/** ⭐ A step in the ring's two coordinates: [yaw, v]. */
export type QStep = readonly [number, number];

/** ⭐ What the solver may ask of the scene. */
export interface SolverEnv {
  /** the piece's anchor (its resting face's centre) at `q`, world metres — the path's length, the ring's Jacobian */
  anchor(q: OrbitQ): Vec3;
  /** the piece's least surface gap to any obstacle at `q` (m): 0 touching or in; a large value when nothing is near */
  gap(q: OrbitQ): number;
  /** the contact normal at `q` (unit, from the nearest obstacle toward the piece), `null` with nothing near */
  normal(q: OrbitQ): Vec3 | null;
  /** ⭐ (the third audit) the least gap at `q` to every obstacle OTHER than the nearest (m) — absent: taken as `gap(q)` (no directional gain) */
  secondGap?(q: OrbitQ): number;
  /** ⭐ (2026-11-01) the nearest obstacle's id at `q` (`null`: none near) — what a blocked slide names on the HUD; absent: unnamed */
  blocker?(q: OrbitQ): string | null;
  /** ⭐⭐⭐ (2026-11-12, the slide's rebuild) the piece's gap with its anchor at the point `p` (the piece translated there, off the ring) — a straight move's
   * sweep (`straightFree`); absent: a ring jump is crossed on its landing alone, as before */
  gapAtAnchor?(p: Vec3): number;
}

export interface SolveOptions {
  /** the gap the piece RESTS at (m) — the owner's ~1 mm; a pose is admissible down to half of it */
  readonly gapM: number;
  /** the most gap queries this solve may make — the work cap (the frame's budget) */
  readonly maxQueries: number;
}

export interface SolveResult {
  /** where the piece is after the step */
  readonly q: OrbitQ;
  /** the polyline it travelled (`q0` first, `q` last) — every point admissible */
  readonly path: readonly OrbitQ[];
  /** a contact stopped (part of) the step: what was left pushed into it, discarded */
  readonly blocked: boolean;
  /** a contact was met (slid along, or blocked) */
  readonly touched: boolean;
  /** the work cap ran out with a step left — the caller keeps the rest of its input for the next frame */
  readonly deferred: boolean;
  /** deferred: the step still to go, already PROJECTED onto the contacts met (what pushed in is discarded, as in a whole solve); else zero */
  readonly rest: QStep;
  readonly queries: number;
}

const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dist = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const clampV = (v: number): number => Math.min(1, Math.max(0, v));
const plus = (q: OrbitQ, s: QStep, t = 1): OrbitQ => ({ yaw: q.yaw + s[0] * t, v: clampV(q.v + s[1] * t), zoom: q.zoom });
const tiny = (s: QStep): boolean => Math.abs(s[0]) + Math.abs(s[1]) < 1e-12;
const same = (a: OrbitQ, b: OrbitQ): boolean => Math.abs(a.yaw - b.yaw) + Math.abs(a.v - b.v) < 1e-12;

/** ⭐ The arc's samples: the step's length along the ring is measured on this many chords. */
export const ARC_SAMPLES = 4;

/** ⭐ (2026-10-15) the most chords the arc's length is refined to. */
export const ARC_MAX_SAMPLES = 256;
/** ⭐ (2026-10-15) the arc's length is settled when doubling the chords adds less than this share. */
export const ARC_SETTLE = 0.02;

/**
 * ⭐ The step's length along the ring (the anchor's path) — no point of the piece travels further (it only translates). ⭐⭐ (2026-10-15) the
 * chords doubled until the length settles (a chord is never longer than its arc: too few cut a ring's bend and under-measure it) — anchors
 * only, no collision query.
 */
export function arcLength(env: SolverEnv, q: OrbitQ, s: QStep): number {
  const chords = (n: number): number => {
    let len = 0;
    let prev = env.anchor(q);
    for (let i = 1; i <= n; i++) {
      const a = env.anchor(plus(q, s, i / n));
      len += dist(a, prev);
      prev = a;
    }
    return len;
  };
  let n = ARC_SAMPLES;
  let len = chords(n);
  while (n < ARC_MAX_SAMPLES) {
    n *= 2;
    const finer = chords(n);
    // ⭐⭐ (2026-10-15, the Fable audit) settled within 2 % — sound: every bound it serves keeps ≥ 10 % slack (the 0.9 factors), so the true arc
    // stays ≤ 0.918 of the clearance. ⛔ At 0.1 % a slide along a wall cost 6 719 anchor evaluations a solve (11 ms in Node) — the 24-query cap bounded
    // the gap queries, not the frame
    const settled = finer - len <= ARC_SETTLE * finer + 1e-9;
    len = finer;
    if (settled) break;
  }
  return len;
}

/**
 * ⭐⭐⭐ (2026-10-15, the owner: *"If I do dy instead, the piece goes through the blue part"*) — **A STRIDE MEASURED ON ITS OWN TRAVEL**: the
 * largest share `t' ≤ t` of the step `s` whose own arc is at most `maxM`. ⛔ The stride was the whole step's length SCALED by `t` — but the ring's
 * speed along `v` is not uniform (it changes sharply at a ring: the owner's 2nd and 3rd rings at 0.2 m), so a share of the step could carry the
 * piece several times further than its share of the length: past its clearance, into a part, and — the next step taken whole from inside —
 * through it.
 */
export function fitStride(env: SolverEnv, q: OrbitQ, s: QStep, t: number, maxM: number): number {
  if (!(maxM > 0)) return 0;
  for (let i = 0; i < 40 && t > 1e-12; i++) {
    const len = arcLength(env, q, [s[0] * t, s[1] * t]);
    if (len <= maxM) return t;
    t *= Math.min(0.9, Math.max(0.05, (maxM / len) * 0.98));
  }
  return 0;
}

/** ⭐⭐⭐ (2026-11-09, R4) A jump of the anchor at least this long (m) between two places of the ring a hair apart is a DISCONTINUITY, not travel. */
export const RING_JUMP_M = 0.005;

/**
 * ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §5 R4) **WHERE THE RING JUMPS**: in the step `s` from `q`, past the share `lo` the stride already fitted, the
 * place where the ANCHOR is discontinuous — bisected on the anchors alone (no gap query): each halving keeps the half whose chord is the longer, until the
 * interval is a hair wide; a chord still ≥ `RING_JUMP_M` there is a jump. The share just past it is returned when the ring up to it fits `maxM` (the part
 * before the jump is travel like any other); else `null` (no jump, or a smooth ring too long for the stride). ⛔ The conservative advancement treated a
 * jump as travel: every stride holding it was longer than the clearance, so the stride shrank below it and the piece CONVERGED onto it, never crossing
 * (the cube's 90° seam: 350 – 2100 frames still, every distance).
 */
export function ringJump(env: SolverEnv, q: OrbitQ, s: QStep, lo: number, maxM: number): number | null {
  const j = jumpIn(env, q, s, lo, 1);
  if (j === null) return null;
  return arcLength(env, q, [s[0] * j.a, s[1] * j.a]) <= maxM ? j.b : null;
}

/** ⭐ The jump of the anchor in the shares (`lo`, `hi`] of the step, bisected to a hair (`ringJump`'s search): its two sides, or `null` (continuous there). */
function jumpIn(env: SolverEnv, q: OrbitQ, s: QStep, lo: number, hi: number): { readonly a: number; readonly b: number } | null {
  let a = lo;
  let b = hi;
  if (!(b > a)) return null;
  let pa = env.anchor(plus(q, s, a));
  let pb = env.anchor(plus(q, s, b));
  for (let i = 0; i < 40 && b - a > 1e-9; i++) {
    const m = (a + b) / 2;
    const pm = env.anchor(plus(q, s, m));
    if (dist(pa, pm) >= dist(pm, pb)) {
      b = m;
      pb = pm;
    } else {
      a = m;
      pa = pm;
    }
  }
  return dist(pa, pb) >= RING_JUMP_M ? { a, b } : null;
}

/** ⭐⭐⭐ (2026-11-12, the slide's rebuild) the most gap queries one straight sweep may make (`straightFree`) — past it the move is not free. */
export const SWEEP_MAX_QUERIES = 4;

/**
 * ⭐⭐⭐ (2026-11-12, the slide's rebuild) **A STRAIGHT MOVE OF THE PIECE IS FREE** — the anchor translated from `a` to `b`, the piece never nearer a part than
 * `hard`: conservative advancement (Mirtich 1996) — from `a` (its gap `g0`) a stride as long as the clearance less `hard` allows (no point of the piece moves
 * further: nothing can be reached), the gap read at the stride's end (`gapAtAnchor`, `spend` charging it), again — free when the stride reaches `b`; not
 * free when a gap falls under `hard` or the sweep needs more than `SWEEP_MAX_QUERIES` (a move along a part at the gap kept: a wall, never a crawl past it).
 * Within the clearance itself: free, no query. ⚠ `gapAtAnchor` absent (an environment without it): free — the landing alone decides, as before.
 */
export function straightFree(env: SolverEnv, a: Vec3, b: Vec3, g0: number, hard: number, spend: () => void = () => {}): boolean {
  const L = dist(a, b);
  if (!(L > 1e-12) || (g0 - hard) * 0.9 >= L) return true;
  if (env.gapAtAnchor === undefined) return true;
  let t = 0;
  let g = g0;
  for (let k = 0; k < SWEEP_MAX_QUERIES; k++) {
    const adv = (g - hard) * 0.9;
    if (!(adv > 0)) return false;
    t += adv / L;
    if (t >= 1) return true;
    spend();
    g = env.gapAtAnchor([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    if (g < hard) return false;
  }
  return t + ((g - hard) * 0.9) / L >= 1;
}

/** ⭐ (2026-11-09) the samples the rest of a step is scanned on for the jump BACK out of a void (anchors only, each candidate bisected — `jumpIn`). */
export const VOID_SCAN_SAMPLES = 32;

/**
 * ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §6 (b)) **A NARROW VOID IS TWO JUMPS**: past the jump INTO it (`tj`, its landing refused — the gizmo at a
 * groove's real depth, D3, puts the piece in the groove's lips), the jump BACK out further along the step: its share when the piece's STRAIGHT move from
 * `q` to the place past it fits `maxM` (the clearance's stride — a translation that short cannot reach a part; the piece only translates), else `null`.
 * ⛔ The stride converged onto the refused jump: the cube's bottom groove (x 104 – 117) held the piece still in free air (16.8 mm of gap), `deferred` for
 * ever — I15's mechanism where R4's landing is not admissible.
 */
export function voidCrossing(env: SolverEnv, q: OrbitQ, s: QStep, tj: number, maxM: number): number | null {
  const here = env.anchor(q);
  let t0 = tj;
  let p0 = env.anchor(plus(q, s, t0));
  for (let k = 1; k <= VOID_SCAN_SAMPLES; k++) {
    const t1 = tj + ((1 - tj) * k) / VOID_SCAN_SAMPLES;
    const p1 = env.anchor(plus(q, s, t1));
    if (dist(p0, p1) >= RING_JUMP_M) {
      const j = jumpIn(env, q, s, t0, t1);
      if (j !== null) return dist(here, env.anchor(plus(q, s, j.b))) <= maxM ? j.b : null;
    }
    t0 = t1;
    p0 = p1;
  }
  return null;
}

/** ⭐ The ring's Jacobian at `q`: how far the anchor moves per radian of yaw and per unit of `v` (metres) — finite differences. */
export function ringJacobian(env: SolverEnv, q: OrbitQ): [Vec3, Vec3] {
  const h = 1e-4;
  const a = env.anchor(q);
  const ay = env.anchor({ ...q, yaw: q.yaw + h });
  const dv = q.v + h <= 1 ? h : -h;
  const av = env.anchor({ ...q, v: q.v + dv });
  return [
    [(ay[0] - a[0]) / h, (ay[1] - a[1]) / h, (ay[2] - a[2]) / h],
    [(av[0] - a[0]) / dv, (av[1] - a[1]) / dv, (av[2] - a[2]) / dv],
  ];
}

/**
 * ⭐⭐⭐ **THE SLIDE, EXACT** — the step `dq` with every component into the contacts removed, with the least change in the ring's metric
 * `M = JᵀJ` (the piece moves along the surfaces as far as the ring lets it): minimise `(s − dq)ᵀ M (s − dq)` subject to `(Jᵀnᵢ)·s ≥ 0` for every
 * contact normal `nᵢ` (toward the piece). In two coordinates the optimum is `dq` itself, its projection onto ONE active constraint, or zero (two
 * independent active constraints leave no freedom) — every candidate tried, the feasible one of least cost kept: an exact active set, corners
 * included. (⛔ The sequential projection it replaces could, at a crease, undo one constraint while honouring the next.)
 */
export function projectExact(dq: QStep, J: readonly [Vec3, Vec3], normals: readonly Vec3[]): QStep {
  const m11 = dot3(J[0], J[0]);
  const m12 = dot3(J[0], J[1]);
  const m22 = dot3(J[1], J[1]);
  const A = normals.map((n) => [dot3(n, J[0]), dot3(n, J[1])] as const);
  const speed = (s: QStep) => Math.sqrt(Math.max(0, m11 * s[0] * s[0] + 2 * m12 * s[0] * s[1] + m22 * s[1] * s[1]));
  // ⭐⭐⭐ (2026-11-12, the owner: *"when I am in contact … the pan is not smooth: it looks like there is friction"*) INTO a contact = the anchor's motion
  // ANGLE into it beyond `TANGENT_TOL` (`intoContact`) — ⛔ the product against `1e-12 × |a|`, blind to the step's length: a ring level to 1e-8 (the
  // Jacobian's finite differences) read as pushing into the floor under it, and the projection took the WHOLE yaw away — one way blocked at the kept gap
  // in free air, the other free, by the noise's sign (probed: the channel's floor, 7 mm short of the wall; `projectExact` returned [0, 0])
  const feasible = (s: QStep) => A.every((a) => !intoContact(a, s, speed(s)));
  // ⭐⭐⭐ (2026-10-17, the owner: *"after the sliding is toggled off, the orbit is blocked and I need to go a lot of back and forth to unlock the green
  // piece"*) — a step that pushes into NO contact is the step, whatever the metric: asked FIRST. ⛔ The singular metric was refused before — the way back
  // after a slide has one coordinate (its share), so a way back starting in contact (every slide ends at the kept gap) was blocked on its first step,
  // in 2 queries, though it left the surface (the gap only growing — reproduced on Piece3's top)
  if (feasible(dq)) return dq;
  const det = m11 * m22 - m12 * m12;
  if (!(det > 1e-18)) return [0, 0];
  const i11 = m22 / det;
  const i12 = -m12 / det;
  const i22 = m11 / det;
  const cost = (s: QStep) => {
    const d0 = s[0] - dq[0];
    const d1 = s[1] - dq[1];
    return m11 * d0 * d0 + 2 * m12 * d0 * d1 + m22 * d1 * d1;
  };
  let best: QStep = [0, 0];
  let bestCost = cost(best);
  for (const a of A) {
    const into = a[0] * dq[0] + a[1] * dq[1];
    if (!intoContact(a, dq, speed(dq))) continue;
    const w0 = i11 * a[0] + i12 * a[1];
    const w1 = i12 * a[0] + i22 * a[1];
    const den = a[0] * w0 + a[1] * w1;
    if (!(den > 1e-18)) continue;
    const k = into / den;
    const s: QStep = [dq[0] - k * w0, dq[1] - k * w1];
    if (feasible(s) && cost(s) < bestCost) {
      best = s;
      bestCost = cost(s);
    }
  }
  return best;
}

/**
 * ⭐⭐ **A SLIDE NEVER GOES AGAINST THE FINGER** (2026-10-13, the owner: *"at the moment the piece collides, there is a jittery shake"*) — a
 * coordinate of the slide `s` that runs OPPOSITE to the input step `dq` is dropped (a coordinate the input left at zero may move: a yaw push
 * into a slope still rides up or down it); what is left must still honour every contact, else nothing. ⛔ Without it a finger's own dy wobble
 * pushing down onto a sloped part slid the piece BACK along the yaw it was asked to go, and its next wobble let it forward again: a shake at
 * the event rhythm, measured on a headless drag.
 */
export function keepSense(s: QStep, dq: QStep, J: readonly [Vec3, Vec3], normals: readonly Vec3[]): QStep {
  const k: QStep = [s[0] * dq[0] < 0 ? 0 : s[0], s[1] * dq[1] < 0 ? 0 : s[1]];
  if (k[0] === s[0] && k[1] === s[1]) return s;
  const tv: Vec3 = [J[0][0] * k[0] + J[1][0] * k[1], J[0][1] * k[0] + J[1][1] * k[1], J[0][2] * k[0] + J[1][2] * k[1]];
  const sp = Math.hypot(tv[0], tv[1], tv[2]);
  for (const n of normals) if (intoContact([dot3(n, J[0]), dot3(n, J[1])], k, sp)) return [0, 0];
  return k;
}

/**
 * ⭐⭐⭐ (2026-11-12) The anchor's motion along a contact counts as tangent below this angle into it (rad, its sine): ~0.06°. The landing's gap is checked
 * anyway (≥ half the gap kept), so a slope this small sinks the piece 0.004 mm over a 4 mm sub-step.
 */
export const TANGENT_TOL = 1e-3;

/** ⭐⭐⭐ (2026-11-12) Does the step `s` push INTO the contact whose row is `a` (= n·J, n unit) — its anchor's speed `speed` (= |J s|): an angle beyond `TANGENT_TOL`. */
export function intoContact(a: readonly [number, number], s: QStep, speed: number): boolean {
  return a[0] * s[0] + a[1] * s[1] < -TANGENT_TOL * speed;
}

/**
 * ⭐⭐ (2026-10-13, the fourth audit) **THE PLANE BOUND** — the gap to the nearest convex part under ANY displacement δ of the piece is at least
 * `g + n·δ` (its supporting plane; verified on the real GJK over 2610 random translations, the least slack −7e-16): checked at four points
 * of the sub-step `u` along the ring (the arc bends between them by a fraction of a millimetre), with ANCHORS only — no collision query.
 */
function planeHolds(env: SolverEnv, q: OrbitQ, s: QStep, u: number, n: Vec3, g: number, floor: number): boolean {
  const a0 = env.anchor(q);
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const a = env.anchor(plus(q, s, u * f));
    if (g + n[0] * (a[0] - a0[0]) + n[1] * (a[1] - a0[1]) + n[2] * (a[2] - a0[2]) < floor) return false;
  }
  return true;
}

/** ⭐ A normal added to the solve's contacts — a near-duplicate (≤ ~8°) replaces its old self; three at most. */
function withNormal(ns: readonly Vec3[], n: Vec3): Vec3[] {
  return [n, ...ns.filter((k) => dot3(k, n) < 0.99)].slice(0, 3);
}

/** ⭐ The longest slide sub-step along a contact (m) — the surface's curvature is followed within it. */
export const SLIDE_STEP_M = 0.004;
/** ⭐ (the third audit) the longest DIRECTIONAL stride near a part (m) — the ring's arc departs from the straight line it is judged on. */
export const DIRECTIONAL_MAX_M = 0.05;
/** ⭐ Below this much air to spare (m), the piece is AT the gap kept: the slide takes over from the advancement. */
export const AT_CONTACT_M = 0.0002;

/**
 * ⭐⭐⭐ **ONE INPUT STEP SOLVED** — from `q0`, the step `dq`:
 * (0) inside the admissible margin (the ring moved under it): out by short strides that each OPEN the gap (2026-10-15 — never one whole step);
 * (1) free air: advance along the arc as far as the gap minus `gapM` allows — the whole step when it fits;
 * (2) at the gap kept: project the rest onto the contacts (`projectExact`) and slide by sub-steps of ≤ `SLIDE_STEP_M`, each one checked (the gap
 *     ≥ half the gap kept, halved up to 5 times), a contact the projection did not know of learned and projected again;
 * (3) nothing left to project: BLOCKED. The work cap (`maxQueries`) ends the solve where it got to (`deferred`).
 */
export function solveOrbitStep(q0: OrbitQ, dq: QStep, env: SolverEnv, opt: SolveOptions): SolveResult {
  const hard = opt.gapM / 2;
  let queries = 0;
  // ⭐⭐ (2026-11-04, the audit) THE CAP IS HARD past the first iteration: a query beyond `maxQueries` ABORTS the iteration it is in (`OVER_BUDGET`), which
  // is undone whole — the solve returns where the last complete iteration left it (`deferred`). ⛔ The cap was read only at the loop's head: one
  // iteration of (2) could spend ~10 queries past it. ⚠ The FIRST iteration always completes (the solve must progress, however small the budget).
  let completed = 0;
  const spend = (): void => {
    if (completed > 0 && queries >= opt.maxQueries) throw OVER_BUDGET;
    queries++;
  };
  const gapAt = (q: OrbitQ): number => {
    spend();
    return env.gap(q);
  };
  const normalAt = (q: OrbitQ): Vec3 | null => {
    spend();
    return env.normal(q);
  };
  const path: OrbitQ[] = [q0];
  if (tiny(dq)) return { q: q0, path, blocked: false, touched: false, deferred: false, rest: [0, 0], queries };
  let q = q0;
  let rest: QStep = [dq[0], dq[1]];
  let touched = false;
  let blocked = false;
  let g = gapAt(q);
  let normals: Vec3[] = [];
  for (let guard = 0; guard < 400 && !tiny(rest); guard++, completed++) {
    if (completed > 0 && queries >= opt.maxQueries) return { q, path, blocked, touched, deferred: true, rest, queries };
    const at0 = { q, rest, touched, blocked, n: path.length };
    try {
    const travel = arcLength(env, q, rest);
    // ⭐ (2026-10-29) a step that moves the piece NOWHERE is taken whole — nothing can collide (⛔ dropped: at ±90° around the assembly the yaw moves
    // the place by 0, so the solved yaw never followed the finger and dx was dead on a top face — the gizmo's carrier reads it)
    if (!(travel > 1e-12)) {
      q = plus(q, rest, 1);
      path.push(q);
      rest = [0, 0];
      break;
    }
    // (0) INSIDE the margin: out by short strides, each one OPENING the gap, never further than the other parts allow — ⭐⭐⭐ (2026-10-15, the
    // owner: *"If I do dy instead, the piece goes through the blue part"*) ⛔ one whole step that ended farther out was taken: from inside a part,
    // through it and out of its far side. Deep inside (no stride opens it): held — the ring's nearest free place is `nearestFree`'s job
    if (g < hard) {
      touched = true;
      // ⭐ (2026-10-15, the Fable audit) the stride's own shape, halved while it does not open the gap (5 at most, one query each) — ⛔ the OTHER part's
      // clearance floored it: inside the margin of two parts it was 0, and a step leaving both was blocked. The landing's `ge > g` already refuses a
      // stride that closes the least gap
      let t = fitStride(env, q, rest, 1, SLIDE_STEP_M);
      let ge = t > 0 ? gapAt(plus(q, rest, t)) : g;
      for (let h = 0; h < 5 && t > 0 && !(ge > g); h++) {
        t /= 2;
        ge = gapAt(plus(q, rest, t));
      }
      const end = plus(q, rest, t);
      if (!(t > 0 && ge > g)) {
        blocked = true;
        break;
      }
      q = end;
      path.push(q);
      rest = [rest[0] * (1 - t), rest[1] * (1 - t)];
      g = ge;
      continue;
    }
    const spare = g - opt.gapM;
    // (1) FREE AIR — no point travels further than the air it has
    if (spare >= travel) {
      q = plus(q, rest);
      path.push(q);
      rest = [0, 0];
      break;
    }
    if (spare > AT_CONTACT_M) {
      // the SCALAR stride — safe against everything, whatever the direction
      // ⭐⭐⭐ (2026-10-15) on the stride's OWN travel (`fitStride`)
      const tS = fitStride(env, q, rest, Math.min(1, (spare / travel) * 0.9), spare * 0.9);
      let t = tS;
      let gl: number | null = null;
      // ⭐⭐⭐ (2026-11-09, R4) A RING DISCONTINUITY IS NOT A WALL: the stride fitted less than a quarter of its allowance — a jump of the anchor ahead
      // (`ringJump`, anchors only) is crossed when the ring up to it fits and its LANDING is admissible (one query: admissibility reads the pose alone)
      if (tS < 1 && arcLength(env, q, [rest[0] * tS, rest[1] * tS]) < spare * 0.9 * 0.25) {
        const tj = ringJump(env, q, rest, tS, spare * 0.9);
        if (tj !== null) {
          const gj = gapAt(plus(q, rest, tj));
          // ⭐⭐⭐ (2026-11-12, the slide's rebuild — the owner's teleport) …and the piece's STRAIGHT move there is free (`straightFree`: conservative
          // advancement on the anchors, a few queries) — ⛔ the landing alone: a jump is a move the shown piece makes all the same, straight; across a wall
          // (a gizmo stepping onto a part's top, a channel to the next) it went through it. Not free: the jump is a wall
          if (gj >= opt.gapM && straightFree(env, env.anchor(q), env.anchor(plus(q, rest, tj)), g, hard, spend)) {
            t = tj;
            gl = gj;
          } else {
            // ⭐⭐⭐ (2026-11-09, §6 (b)) the landing refused: a NARROW VOID is crossed whole (`voidCrossing`, one more query); else the jump is a WALL —
            // the stride stops before it, BLOCKED (⛔ it converged onto the jump, `deferred` for ever: a frozen piece in free air)
            const tb = voidCrossing(env, q, rest, tj, spare * 0.9);
            const gb = tb === null ? -1 : gapAt(plus(q, rest, tb));
            if (tb !== null && gb >= opt.gapM) {
              t = tb;
              gl = gb;
            } else {
              q = plus(q, rest, tS);
              path.push(q);
              rest = [rest[0] * (1 - tS), rest[1] * (1 - tS)];
              blocked = true;
              break;
            }
          }
        }
      }
      // ⭐⭐ (2026-10-13, the third audit: *"the orbit slows down when the piece approaches another part"* — it crept PARALLEL to a part, 22 mrad
      // of a 1 rad swipe at 2 mm) the DIRECTIONAL stride: the gap to the NEAREST part along a straight translation is convex, its slope the
      // contact normal's — so it cannot close faster than `approach` per metre; every OTHER part is held to its own gap. Near a part only,
      // ≤ `DIRECTIONAL_MAX_M`, the landing (≥ the gap kept) and the midpoint (≥ half of it) checked — the ring's arc is not a straight line.
      if (gl === null && spare * 0.9 < DIRECTIONAL_MAX_M) {
        const n = normalAt(q);
        if (n !== null) {
          const J = ringJacobian(env, q);
          const tv: Vec3 = [J[0][0] * rest[0] + J[1][0] * rest[1], J[0][1] * rest[0] + J[1][1] * rest[1], J[0][2] * rest[0] + J[1][2] * rest[1]];
          const tl = Math.hypot(tv[0], tv[1], tv[2]);
          if (tl > 1e-12) {
            const approach = -dot3(n, tv) / tl;
            const others = (env.secondGap?.(q) ?? g) - opt.gapM; // (memoised with the gap at `q`: not a query)
            const along = approach > 1e-9 ? spare / approach : Infinity;
            const stride = Math.min(along, others, DIRECTIONAL_MAX_M) * 0.9;
            let tD = fitStride(env, q, rest, Math.min(1, stride / travel), stride);
            // ⭐ only for a real gain; the path by the PLANE BOUND (anchors only — the fourth audit), the landing by one query, two at most
            for (let tries = 0; tries < 2 && tD > 2 * tS; ) {
              if (planeHolds(env, q, rest, tD, n, g, hard)) {
                tries++;
                const end = gapAt(plus(q, rest, tD));
                if (end >= opt.gapM) {
                  t = tD;
                  gl = end;
                  break;
                }
              }
              tD /= 2;
            }
          }
        }
      }
      q = plus(q, rest, t);
      path.push(q);
      rest = [rest[0] * (1 - t), rest[1] * (1 - t)];
      g = gl ?? gapAt(q);
      continue;
    }
    // (2) AT THE GAP KEPT — the rest projected onto the contacts, slid by checked sub-steps
    const n = normalAt(q);
    if (n !== null) normals = withNormal(normals, n);
    const J = ringJacobian(env, q);
    const s = keepSense(projectExact(rest, J, normals), dq, J, normals);
    if (tiny(s)) {
      touched = true;
      blocked = true; // (3)
      break;
    }
    // what pushed in: discarded (a step AWAY from the contact is neither — it leaves)
    if (Math.abs(s[0] - rest[0]) + Math.abs(s[1] - rest[1]) > 1e-12) touched = blocked = true;
    const sLen = arcLength(env, q, s);
    let u = fitStride(env, q, s, Math.min(1, SLIDE_STEP_M / Math.max(1e-12, sLen)), SLIDE_STEP_M);
    let landed = -1; // the gap at the stride's landing, when the clamp's check already read it
    // ⭐ (2026-10-14, the hover) never past the safe distance to every OTHER part: sliding along one contact toward a second, the 4 mm sub-step
    // overshot it and the step stopped up to 4 mm short of it (learning it, then blocked) — now it closes in to the gap kept first
    {
      const others = env.secondGap?.(q);
      if (others !== undefined) {
        const lo = (others - opt.gapM) * 0.9;
        const uo = lo > 0 ? fitStride(env, q, s, Math.min(u, lo / Math.max(1e-12, sLen)), lo) : 0;
        if (uo > 1e-9 && uo < u) {
          // ⭐⭐⭐ (2026-10-17, the owner: *"after the sliding is toggled off, the orbit is blocked and I need to go a lot of back and forth to unlock the
          // green piece"*) — the clamp binds only a step that CLOSES on a part: its landing is read (a query the step makes anyway), and one that stays
          // as clear of every part as it started keeps its whole stride. ⛔ Over two FLUSH tops at the kept gap (Piece3 and Piece30, 1.08 mm both) it
          // allowed 0.07 mm a step — the way back after a slide crawled 0.7 % of its way and the orbit froze, every refused step 1.08 mm clear of both.
          // ⚠ no tunnel: the stride is at most `SLIDE_STEP_M` (4 mm) and its landing must be admissible — the thinnest body (the floor) is 5 mm
          const at = plus(q, s, u);
          const gAt = gapAt(at);
          const oAt = env.secondGap?.(at) ?? gAt;
          if (gAt >= hard && Math.min(gAt, oAt) >= Math.min(g, others) - 1e-7) landed = gAt;
          else u = uo;
        }
      }
    }
    let gn = landed;
    // ⭐⭐ (2026-10-13, the fourth audit: a piece RESTING on a part slid 4 mm a sub-step — 0.048 rad a frame against 0.27 a millimetre higher; the
    // owner's "slows down near a part" in its last form) the LONG slide: as far as the plane bound of the nearest part (anchors only) and the
    // gap to every other allow, ≤ `DIRECTIONAL_MAX_M`, its landing checked once — else the 4 mm sub-step as before
    if (n !== null) {
      const others = (env.secondGap?.(q) ?? g) - hard;
      const lD = Math.min(others * 0.9, DIRECTIONAL_MAX_M);
      let uD = fitStride(env, q, s, Math.min(1, lD / Math.max(1e-12, sLen)), lD);
      for (let tries = 0; tries < 2 && uD > 2 * u; ) {
        if (planeHolds(env, q, s, uD, n, g, hard)) {
          tries++;
          const end = gapAt(plus(q, s, uD));
          if (end >= hard) {
            u = uD;
            gn = end;
            break;
          }
        }
        uD /= 2;
      }
    }
    if (gn < 0) gn = gapAt(plus(q, s, u));
    if (gn < hard) {
      // ⭐ a contact the projection did not know of (a corner): LEARNED, and the step projected again — never crept into by halving
      const nn = normalAt(plus(q, s, u));
      if (nn !== null && !normals.some((k) => dot3(k, nn) >= 0.99)) {
        normals = withNormal(normals, nn);
        rest = s;
        touched = true;
        continue;
      }
      // the same contact, curving away under the slide: a shorter sub-step follows the curve
      for (let halving = 0; halving < 5 && gn < hard; halving++) {
        u /= 2;
        gn = gapAt(plus(q, s, u));
      }
      if (gn < hard) {
        blocked = true;
        break;
      }
    }
    q = plus(q, s, u);
    path.push(q);
    rest = [s[0] * (1 - u), s[1] * (1 - u)];
    g = gn;
    } catch (e) {
      if (e !== OVER_BUDGET) throw e;
      // the iteration undone whole: the solve stands where the last complete one left it
      path.length = at0.n;
      return { q: at0.q, path, blocked: at0.blocked, touched: at0.touched, deferred: true, rest: at0.rest, queries };
    }
  }
  return { q, path, blocked, touched, deferred: false, rest: [0, 0], queries };
}

/**
 * ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §5 RC5, F5) THE MOST GAP QUERIES ONE ITERATION OF `solveOrbitStep` MAY MAKE — its first always completes (the solve
 * must progress), so a frame RESERVES this much for it: the gap at the start (1) and, the worst branch — at the gap kept (2) —, the contact's normal (1),
 * the clamp's landing (1), the long slide's two tries (2), the landing (1), a corner learned (1) or five halvings (5): 1 + 1 + 1 + 2 + 1 + 1 + 5 = 12
 * (free air (1) and inside the margin (0): 7 at most). ⛔ Unreserved: the checks billed ahead of a solve left it ~1 query, its first iteration took 4 – 29
 * — 25 – 38 a frame against the owner's 24 (the walks, both scenes).
 */
export const FIRST_ITERATION_MAX_QUERIES = 12;

/** ⭐ (2026-11-04, the audit) thrown by a query past the cap — caught by `solveOrbitStep` alone. */
const OVER_BUDGET: unique symbol = Symbol("OVER_BUDGET");

/**
 * ⭐⭐ **STUCK, asked of the same solver**: a small step (`probeM` of anchor travel) each way along both ring coordinates — stuck only if not one
 * of them moves the piece a quarter of the probe. (Its turns are asked of `turnSweep` by the caller — the same clearance rule.)
 */
export function stuckProbe(q: OrbitQ, env: SolverEnv, opt: SolveOptions, probeM: number): boolean {
  const a0 = env.anchor(q);
  const J = ringJacobian(env, q);
  const ly = Math.hypot(J[0][0], J[0][1], J[0][2]);
  const lv = Math.hypot(J[1][0], J[1][1], J[1][2]);
  const steps: QStep[] = [];
  if (ly > 1e-9) steps.push([probeM / ly, 0], [-probeM / ly, 0]);
  if (lv > 1e-9) steps.push([0, probeM / lv], [0, -probeM / lv]);
  // ⭐ a move is a quarter of the probe or more — settling within the margin is not a way out
  // ⭐ (the fourth audit) the four solves SHARE the cap — each was given all of it (96 in theory)
  // ⭐ (2026-11-04, the audit) an even share, no floor: each solve's first iteration completes anyway (⛔ `max(4, …)` — 6 each at a cap of 24, each
  // overshooting: ~60 for one check)
  const each = { ...opt, maxQueries: Math.floor(opt.maxQueries / Math.max(1, steps.length)) };
  return steps.every((s) => dist(env.anchor(solveOrbitStep(q, s, env, each).q), a0) < probeM / 4);
}

/**
 * ⭐⭐ **A TURN, by the same rule** — the gap along the turn (`gapAtU(u)`, `u` its fraction), `angleRad` its angle, `reachM` the furthest any
 * point of the piece is from the point it turns about: walked by conservative advancement in angle (no point moves more than `reachM · Δθ`),
 * refused as soon as the gap falls under half the gap kept. Returns the fraction where it was refused, `null` when the whole turn is free.
 * ⚠ Conservative only while the stride is the gap's own; near a part the cap's floor makes it a SAMPLING, refined at a midpoint where a
 * sample reads close (the fifth audit) — a corner may clip an edge between samples for a frame or two; the end pose is always checked.
 * ⭐ (2026-10-13, the second audit) a turn STARTING inside that margin (a piece the ring or a part put there): allowed only if it OPENS the gap
 * (its end farther out than its start) — ⛔ it was "never below the gap it starts with", which a piece deep in a part (the gap 0 everywhere)
 * passed on every turn: no red quad, no pop-up, no respawn. `maxQueries` caps the work (the caller passes the frame's cap).
 */

/**
 * ⭐⭐ (2026-10-13, the sixth audit) **THE TURN SWEEP, BUDGETED** — the sweep above under `budget` gap queries (≤ `maxQueries`, which plans the
 * strides): `"PENDING"` when the budget ran out before the end — the caller keeps its verdict and asks again (the red quad, with what the frame's
 * solve left over).
 * ⭐ FREE AT ONCE when the piece is clear by more than the turn's whole sweep (one query): no point of it travels further than `reachM · angle`.
 * ⭐ Near a part each stride is refined at its midpoint unless the gap's 1-Lipschitz bound CERTIFIES it (`g + g₁ ≥ 2·hard + du·sweep` — between
 * two samples the gap cannot dip lower): ⛔ the fifth audit's refinement read only the END sample (`g₁ < 2·gapM`), so with strides of half the
 * budget a 5–8 mm notch passed as free (104–151 of 217 placements, measured); certified strides are exact, uncertified ones refined once.
 */
export function turnSweep(
  gapAtU: (u: number) => number,
  angleRad: number,
  reachM: number,
  gapM: number,
  maxQueries: number,
  budget: number,
): number | null | "PENDING" {
  const hard = gapM / 2;
  const g0 = gapAtU(0);
  if (g0 < hard) return budget >= 2 ? (gapAtU(1) > g0 ? null : 1) : "PENDING";
  const sweep = Math.abs(angleRad) * reachM; // the furthest any point travels over the whole turn
  if (g0 - hard >= sweep) return null; // ⭐ clear by more than the whole sweep
  // strides planned for HALF the budget: every one can be refined at its midpoint and the end is still reached
  const steps = Math.max(1, Math.floor((Math.max(3, maxQueries) - 1) / 2));
  let used = 1;
  let u = 0;
  let g = g0;
  for (;;) {
    if (used >= budget) return "PENDING";
    const du = Math.max(sweep > 1e-12 ? (g - hard) / sweep : 1, 1 / steps);
    const u0 = u;
    u = Math.min(1, u + du);
    const g1 = gapAtU(u);
    used++;
    if (g1 < hard) return u;
    const span = (u - u0) * sweep;
    if (g + g1 < 2 * hard + span) {
      // not certified by the bound: refined once at the midpoint
      if (used >= budget) return "PENDING";
      const um = (u0 + u) / 2;
      used++;
      if (gapAtU(um) < hard) return um;
    }
    g = g1;
    if (u >= 1) return null;
  }
}

/**
 * ⭐⭐ **BACK ON THE RING'S NEAREST FREE PLACE** — the ring moved under the piece (the gizmo moved — a TAP; a part moved) and its place is inside
 * the margin. ⭐ (2026-10-13, the second audit) FIRST straight out of the contact: the ring's step closest to the contact normal (`J⁺ n`), at
 * 1, 2, 4 … gaps kept up to `stepM` — a part pushed 0.3 mm against the resting piece moves it ~2 mm, not the grid's 1 cm in a fixed order;
 * THEN the places along the ring at growing anchor distances (`stepM`, up to `maxM`), both coordinates and the diagonals. The first with the
 * gap kept wins; `null` when none is free within reach.
 */
export function nearestFree(
  q: OrbitQ,
  env: SolverEnv,
  gapM: number,
  stepM: number,
  maxM: number,
  /** ⭐ (the third audit) the most candidates this call may try — the frame's cap; it was ~280 a frame with nothing free within reach */
  budget = Infinity,
  /** ⭐ the candidate to resume from (a search the cap cut short goes on next frame, not from the start) */
  from = 0,
): { to: OrbitQ | null; next: number | null } {
  const J = ringJacobian(env, q);
  // the candidates in order: straight out of the contact (1, 2, 4 … gaps kept up to `stepM`), then the grid outward
  const out: QStep[] = [];
  const n = from === 0 || budget === Infinity ? env.normal(q) : null;
  let tried = n !== null ? 1 : 0;
  const nOut = Math.floor(Math.log2(Math.max(1, stepM / gapM))) + 1;
  if (n !== null) {
    const m11 = dot3(J[0], J[0]);
    const m12 = dot3(J[0], J[1]);
    const m22 = dot3(J[1], J[1]);
    const det = m11 * m22 - m12 * m12;
    if (det > 1e-18) {
      const b0 = dot3(n, J[0]);
      const b1 = dot3(n, J[1]);
      const d0 = (m22 * b0 - m12 * b1) / det;
      const d1 = (m11 * b1 - m12 * b0) / det;
      const per = Math.hypot(J[0][0] * d0 + J[1][0] * d1, J[0][1] * d0 + J[1][1] * d1, J[0][2] * d0 + J[1][2] * d1);
      if (per > 1e-9) for (let i = 0, d = gapM; i < nOut; i++, d *= 2) out.push([(d0 * d) / per, (d1 * d) / per]);
    }
  }
  const ly = Math.max(1e-9, Math.hypot(J[0][0], J[0][1], J[0][2]));
  const lv = Math.max(1e-9, Math.hypot(J[1][0], J[1][1], J[1][2]));
  const dirs: QStep[] = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [Math.SQRT1_2, Math.SQRT1_2], [-Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, -Math.SQRT1_2], [-Math.SQRT1_2, -Math.SQRT1_2],
  ];
  const strides = Math.floor((maxM + 1e-12) / stepM);
  const total = nOut + strides * dirs.length;
  for (let k = from; k < total; k++) {
    if (tried >= budget) return { to: null, next: k };
    let s: QStep | undefined;
    if (k < nOut) s = out[k];
    else {
      const i = k - nOut;
      const d = (Math.floor(i / dirs.length) + 1) * stepM;
      const [a, b] = dirs[i % dirs.length]!;
      s = [(a * d) / ly, (b * d) / lv];
    }
    if (s === undefined) continue; // no straight-out direction (no normal, a degenerate ring)
    const c = plus(q, s);
    if (same(c, q)) continue; // a ring end: nothing that way
    tried++;
    if (env.gap(c) >= gapM) return { to: c, next: null };
  }
  return { to: null, next: null };
}

/**
 * ⭐⭐⭐ **ONE FRAME OF THE ORBITED PIECE, DECIDED** (2026-10-13, the second audit: the decision moved out of the render file, which now only
 * applies it — the project's rule, and what makes it testable on BEHAVIOUR rather than on its source text):
 * 1. its place inside the margin (the ring moved under it): to the ring's nearest free place, the orbit's target moved with it;
 * 2. the input's own ring-height change read (`target.v − prevRawV`) — BEFORE any shift, so a relocation moves the height kept ONCE
 *    (⛔ the wiring it replaces shifted it twice);
 * 3. the step solved toward the target; deferred: the target becomes the projected rest; blocked: the target becomes the piece (what pushed in
 *    is discarded), the coast stopped only if nothing moved, a push of the finger's own dy sets the height kept where it stopped;
 * 4. free, with the height kept elsewhere (a slide carried it): back to it only if the WHOLE way is free.
 */
export interface OrbitFrameIn {
  readonly q: OrbitQ;
  /** the orbit's target (the finger, the coast) */
  readonly target: OrbitQ;
  /** the ring height the input set (`null`: not yet) */
  readonly userV: number | null;
  /** the target the last frame ended with (`null`: the first frame) — the input this frame is `target − prevRaw` */
  readonly prevRaw: { readonly yaw: number; readonly v: number } | null;
}
export interface OrbitFrameOut {
  readonly q: OrbitQ;
  /** the orbit's target after the frame (reset to it when it differs from the input's) */
  readonly target: OrbitQ;
  readonly userV: number;
  /** the input pushed into a part (`null`: there was no input) */
  readonly blocked: boolean | null;
  readonly deferred: boolean;
  readonly relocated: boolean;
  /** the coast must stop (a relocation, or a push that moved nothing) */
  readonly stopCoast: boolean;
  /** ⭐ (2026-10-14) the step met a part — slid along it or was stopped (the orbit sway's least angle) */
  readonly touched: boolean;
  readonly queries: number;
  /** ⭐ (the third audit) the relocation's search: the candidate to resume from next frame, `null` when none is pending; `exhausted`: nothing free within reach */
  readonly relocateNext: number | null;
  readonly relocateExhausted: boolean;
}
export function orbitFrame(
  inp: OrbitFrameIn,
  env: SolverEnv,
  opt: SolveOptions,
  /** the relocation's search: its strides, and where to resume (`from` < 0: do not search — exhausted for this place) */
  relocate: { readonly stepM: number; readonly maxM: number; readonly from?: number },
): OrbitFrameOut {
  let extra = 0;
  const counted: SolverEnv = {
    anchor: env.anchor,
    gap: (x) => {
      extra++;
      return env.gap(x);
    },
    normal: (x) => {
      extra++;
      return env.normal(x);
    },
  };
  let q = inp.q;
  let target = inp.target;
  const dyawIn = inp.prevRaw === null ? 0 : target.yaw - inp.prevRaw.yaw;
  const dvIn = inp.prevRaw === null ? 0 : target.v - inp.prevRaw.v;
  // ⭐⭐ (the third audit: after a deferred swipe the finger REVERSING saw the piece go on forward for 4 frames) a coordinate of the input that
  // opposes the backlog the work cap left (the last target ahead of the piece) DROPS that backlog: the finger's reversal takes effect at once
  if (inp.prevRaw !== null) {
    const backYaw = inp.prevRaw.yaw - q.yaw;
    const backV = inp.prevRaw.v - q.v;
    if (dyawIn * backYaw < 0) target = { ...target, yaw: q.yaw + dyawIn };
    if (dvIn * backV < 0) target = { ...target, v: clampV(q.v + dvIn) };
  }
  let userV = clampV((inp.userV ?? target.v) + dvIn);
  let relocated = false;
  let stopCoast = false;
  let relocateNext: number | null = null;
  let relocateExhausted = false;
  if ((relocate.from ?? 0) >= 0 && counted.gap(q) < opt.gapM / 2) {
    // ⭐ (the third audit) under the frame's cap, resumed next frame — never ~280 gap queries a frame
    // ⭐⭐⭐ (2026-11-12, F5) the search leaves the solve its first iteration (`FIRST_ITERATION_MAX_QUERIES`) — none left: resumed next frame (⛔ `max(1, …)`:
    // the search took the frame, the solve's first iteration went past the cap — 29 for the solve alone on `Scene_1`, the walks)
    const room = opt.maxQueries - extra - FIRST_ITERATION_MAX_QUERIES;
    const found = room >= 1 ? nearestFree(q, counted, opt.gapM, relocate.stepM, relocate.maxM, room, relocate.from ?? 0) : { to: null, next: relocate.from ?? 0 };
    relocateNext = found.next;
    relocateExhausted = found.to === null && found.next === null;
    const to = found.to;
    if (to !== null) {
      target = { yaw: target.yaw + (to.yaw - q.yaw), v: clampV(target.v + (to.v - q.v)), zoom: target.zoom };
      userV = clampV(userV + (to.v - q.v));
      q = to;
      relocated = true;
      stopCoast = true;
    }
  }
  const asked = !same(target, q);
  // ⭐ (2026-11-04, the audit) what the cap leaves — no floor: the solve's first iteration completes anyway (⛔ `max(4, …)` spent past the cap)
  const r = solveOrbitStep(q, [target.yaw - q.yaw, target.v - q.v], env, { ...opt, maxQueries: opt.maxQueries - extra });
  let queries = extra + r.queries;
  q = r.q;
  if (r.deferred) {
    // ⭐⭐⭐ (2026-11-09, R4) a deferred solve that made NO progress keeps no backlog beyond this frame's own input — ⛔ the whole rest kept: parked on a
    // ring jump, the target ran hundreds of degrees ahead of the piece and a dy was carried in one vector with that yaw backlog (dead too)
    const moved = !same(r.q, r.path[0]!);
    const cap = (x: number, d: number): number => (moved ? x : Math.sign(x) * Math.min(Math.abs(x), Math.abs(d)));
    target = { yaw: q.yaw + cap(r.rest[0], dyawIn), v: clampV(q.v + cap(r.rest[1], dvIn)), zoom: target.zoom };
  } else if (r.blocked) {
    target = q;
    if (same(r.q, r.path[0]!)) stopCoast = true;
    if (Math.abs(dvIn) > 1e-12) userV = q.v; // the finger's own dy pushed in: the height asked is where it stopped
  } else if (!r.touched && Math.abs(userV - q.v) > 1e-6 && opt.maxQueries - queries >= FIRST_ITERATION_MAX_QUERIES) {
    // ⭐ (2026-11-12, F5) the way back only with a whole iteration left (⛔ `> 0`: its first iteration past the cap)
    // ⭐ (2026-11-04, the audit) the way back only within what the cap leaves (⛔ `max(4, …)`: four more past it, every frame it ran)
    const back = solveOrbitStep(q, [0, userV - q.v], env, { ...opt, maxQueries: opt.maxQueries - queries });
    queries += back.queries;
    if (!back.touched && !back.deferred) {
      q = back.q;
      target = q;
    }
  }
  return { q, target, userV, blocked: asked ? r.blocked : null, deferred: r.deferred, relocated, stopCoast, touched: r.touched, queries, relocateNext, relocateExhausted };
}

/**
 * ⭐⭐ **A TURN IN FLIGHT HELD** (2026-10-13, the second audit: the alignment's 125 ms slerp was checked once, at the tap, while the orbit kept
 * moving the piece) — the next increment of the turn, at the piece's CURRENT place, is held when it would take the gap under half the gap kept
 * AND closer than it is: the slerp waits (never aborts — the resting face would be left misaligned) and resumes when the orbit opens the way.
 */
export function turnStepHeld(gapNext: number, gapNow: number, gapM: number): boolean {
  return gapNext < gapM / 2 && gapNext < gapNow;
}

/**
 * ⭐⭐ **THE STUCK CHECK, SCHEDULED** (2026-10-13, the second audit: it ran every frame for ever once an input was blocked — ~60–90 gap queries a
 * frame at rest, outside the cap and the HUD's timer). One check every `everyMs`, in turn (0 the position, then each turn); a round that
 * ends — a check found free, or every check blocked — is the VERDICT for that `key` (the piece's place, its turn, the gizmo, the parts), and
 * nothing runs again until the key changes.
 */
export interface StuckState {
  readonly key: string;
  readonly idx: number;
  readonly position: boolean;
  readonly turns: boolean;
  readonly done: boolean;
  readonly at: number;
  /** ⭐ (the fourth audit) the one quick recheck an ARMED verdict gets on a key change is spent */
  readonly fast: boolean;
  /** ⭐ (the fifth audit) where the solved anchor was when the verdict armed (`stuckKeep`) */
  readonly anchor: Vec3 | null;
}
export const STUCK_FRESH: StuckState = { key: "", idx: 0, position: false, turns: false, done: false, at: -Infinity, fast: false, anchor: null };
export function stuckNext(s: StuckState, key: string, now: number, everyMs: number): { s: StuckState; check: number | null } {
  // ⭐ (the third audit) a CHANGED key restarts the round but keeps the PACE (`at`) and the last verdict, provisional until a check disagrees —
  // a churning key (a turn playing, a part dragged, the sway) re-ran check 0 every frame and blinked the pop-up off for ≥ 600 ms
  // ⭐ (the fourth audit) …but an ARMED verdict (the pop-up up) gets ONE check at once on its first key change — a freed piece hides it within a
  // frame, not after the pace; once, so a churning key does not check every frame
  const armedFast = s.key !== key && s.position && s.turns && !s.fast;
  const cur = s.key === key ? s : { ...s, key, idx: 0, done: false, ...(armedFast ? { at: -Infinity, fast: true } : {}) };
  if (cur.done || now - cur.at < everyMs) return { s: cur, check: null };
  return { s: { ...cur, at: now }, check: cur.idx };
}
export function stuckRecord(s: StuckState, check: number, blocked: boolean, total: number): StuckState {
  if (!blocked) return { ...s, idx: 0, position: check === 0 ? false : s.position, turns: false, done: true, fast: false };
  const idx = check + 1;
  const position = check === 0 ? true : s.position;
  // ⭐ (the fifth audit) a completed stuck round re-arms its one quick check — each new burst of key changes gets one
  return idx >= total ? { ...s, idx: 0, position, turns: true, done: true, fast: false } : { ...s, idx, position };
}

/**
 * ⭐⭐ **A TAP ON THE ORBITED PIECE** (the third audit: the first tap of a double tap on a face other than the resting one CHANGED the resting face
 * — the stuck verdict was dropped, and the second tap found the respawn unarmed). A DOUBLE tap while armed RESPAWNS; while the red pop-up is
 * SHOWN, a single tap is CONSUMED (it changes nothing, so the double tap can land); else a tap selects the face.
 */
export function pieceTapAction(tapped: boolean, double: boolean, armed: boolean, popupShown: boolean): "RESPAWN" | "CONSUME" | "FACE" | "NONE" {
  if (!tapped) return "NONE";
  if (double && armed) return "RESPAWN";
  if (popupShown) return "CONSUME";
  return "FACE";
}

/**
 * ⭐⭐ (the third and fourth audits) THE SCENE AS THE COLLISION SEES IT — every body's position (0.1 mm) and orientation (1e-4), hashed (FNV-1a),
 * the ORBITED pieces left out (their pose eases every frame; the keys carry the solved place and the turn): the stuck check's, the red
 * quad's and the relocation's verdicts are re-judged when it changes.
 */
export function worldSignature(world: World): string {
  let h = 0x811c9dc5;
  const mix = (x: number) => {
    h ^= Math.round(x) | 0;
    h = Math.imul(h, 0x01000193);
  };
  for (const [id, o] of world.objects) {
    if (o.orbited === true) continue;
    for (let i = 0; i < id.length; i++) mix(id.charCodeAt(i));
    for (const x of o.local.position) mix(x * 1e4);
    for (const x of o.local.orientation) mix(x * 1e4);
  }
  return (h >>> 0).toString(36);
}

/**
 * ⭐⭐ (2026-10-13, the fifth audit) **A NUDGE KEEPS THE STUCK VERDICT** — the verdict was wiped whenever the shown piece was not at rest, so a
 * wiggling finger in a pocket kept the pop-up off and the double tap unarmed. It is kept unless the SOLVED anchor moved a quarter of the probe
 * (`probeM`) since the verdict — the probe's own measure of "moved".
 */
export function stuckKeep(verdictAnchor: Vec3 | null, anchor: Vec3, probeM: number): boolean {
  return verdictAnchor === null || dist(verdictAnchor, anchor) < probeM / 4;
}

/**
 * ⭐⭐ (2026-10-13, the sixth audit) **THE STUCK GATE** — whether this frame RESETS the stuck verdict or goes on to CHECK it. ⛔ The wiring reset it
 * whenever the last input step was free, and in a pocket at the gap kept half a wiggle's steps ARE free (one moves away from a wall): the pop-up
 * blinked and the double tap disarmed while the piece was still stuck — the rule sat in the render file, beside `stuckKeep`, and disagreed with
 * it. Now: RESET only when the input was free, the piece is not inside the margin, AND there is no armed verdict or its solved anchor really
 * moved (a quarter of the probe).
 */
export function stuckGate(moveBlocked: boolean, inside: boolean, armed: boolean, verdictAnchor: Vec3 | null, anchor: Vec3, probeM: number): "RESET" | "CHECK" {
  if (moveBlocked || inside) return "CHECK";
  if (armed && stuckKeep(verdictAnchor, anchor, probeM)) return "CHECK";
  return "RESET";
}

/**
 * ⭐ (2026-10-13, the sixth audit) THE RED QUAD'S CHECK, SCHEDULED: due when its key changed and `everyMs` passed — ⛔ no longer paused while the
 * piece moves more than 3 mm a frame (§11septies): pulling away from a part the square stayed red almost to the far ring — and given only what the
 * frame's solve left of the cap (`null`: not this frame).
 */
export function quadCheckBudget(keyChanged: boolean, sinceMs: number, everyMs: number, cap: number, solveUsed: number): number | null {
  if (!keyChanged || sinceMs < everyMs) return null;
  const left = cap - solveUsed;
  return left >= 2 ? left : null;
}

/**
 * ⭐ (2026-10-13, the fifth audit) the relocation's search key: the piece's solved place, its TURN (⛔ dropped with the orbited pieces from the
 * scene signature — an exhausted search was never retried after a turn in place), the gizmo, the scene.
 */
export function relocationKey(q: OrbitQ, rotation: readonly number[] | null, gizmo: readonly number[], signature: string): string {
  return [q.yaw.toFixed(5), q.v.toFixed(5), rotation === null ? "" : rotation.map((x) => x.toFixed(4)).join(","), gizmo.map((x) => x.toFixed(4)).join(","), signature].join("|");
}

/** ⛔ (2026-11-12, `CLOSE_IN_CONTACT.md`) `slideProbeFree` (a slide along the face as a way out) DELETED with the slide. */

/** ⭐ The red pop-up and the respawn: armed when EVERYTHING is blocked — the position (the solver's probes) AND every turn. */
export function pieceRespawnArmed(positionStuck: boolean, everyTurnBlocked: boolean): boolean {
  return positionStuck && everyTurnBlocked;
}

/**
 * ⭐ (2026-10-13, the owner: *"In such case the piece is blocked, Add a pop up message … “Part is blocked. Double-click the part to restart” in
 * desktop or “Part is blocked. Double-tap the part to restart” in mobile."*) — the words, by the device.
 */
export function blockedMessage(coarsePointer: boolean): string {
  return coarsePointer ? "Part is blocked. Double-tap the part to restart" : "Part is blocked. Double-click the part to restart";
}
