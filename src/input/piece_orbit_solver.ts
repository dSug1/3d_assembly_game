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
 * - **stuck** is asked of the SAME solver (`stuckProbe`), a TURN of the piece of the same rule (`turnSweepFree`), and a piece the ring moved into
 *   a part (the gizmo moved, a part moved) is put back on the nearest free place of its ring (`nearestFree`).
 */
import type { Vec3 } from "../core/vec";

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

/** ⭐ The step's length along the ring (the anchor's path) — no point of the piece travels further (it only translates). */
export function arcLength(env: SolverEnv, q: OrbitQ, s: QStep): number {
  let len = 0;
  let prev = env.anchor(q);
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    const a = env.anchor(plus(q, s, i / ARC_SAMPLES));
    len += dist(a, prev);
    prev = a;
  }
  return len;
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
  const det = m11 * m22 - m12 * m12;
  if (!(det > 1e-18)) return [0, 0];
  const i11 = m22 / det;
  const i12 = -m12 / det;
  const i22 = m11 / det;
  const A = normals.map((n) => [dot3(n, J[0]), dot3(n, J[1])] as const);
  const feasible = (s: QStep) => A.every((a) => a[0] * s[0] + a[1] * s[1] >= -1e-12 * (Math.abs(a[0]) + Math.abs(a[1])));
  const cost = (s: QStep) => {
    const d0 = s[0] - dq[0];
    const d1 = s[1] - dq[1];
    return m11 * d0 * d0 + 2 * m12 * d0 * d1 + m22 * d1 * d1;
  };
  if (feasible(dq)) return dq;
  let best: QStep = [0, 0];
  let bestCost = cost(best);
  for (const a of A) {
    const into = a[0] * dq[0] + a[1] * dq[1];
    if (!(into < 0)) continue;
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
  for (const n of normals) {
    const a0 = dot3(n, J[0]);
    const a1 = dot3(n, J[1]);
    if (a0 * k[0] + a1 * k[1] < -1e-12 * (Math.abs(a0) + Math.abs(a1))) return [0, 0];
  }
  return k;
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
 * (0) `q0` inside the admissible margin (the ring moved under it): only a step that OPENS the gap is taken, whole;
 * (1) free air: advance along the arc as far as the gap minus `gapM` allows — the whole step when it fits;
 * (2) at the gap kept: project the rest onto the contacts (`projectExact`) and slide by sub-steps of ≤ `SLIDE_STEP_M`, each one checked (the gap
 *     ≥ half the gap kept, halved up to 5 times), a contact the projection did not know of learned and projected again;
 * (3) nothing left to project: BLOCKED. The work cap (`maxQueries`) ends the solve where it got to (`deferred`).
 */
export function solveOrbitStep(q0: OrbitQ, dq: QStep, env: SolverEnv, opt: SolveOptions): SolveResult {
  const hard = opt.gapM / 2;
  let queries = 0;
  const gapAt = (q: OrbitQ): number => {
    queries++;
    return env.gap(q);
  };
  const normalAt = (q: OrbitQ): Vec3 | null => {
    queries++;
    return env.normal(q);
  };
  const path: OrbitQ[] = [q0];
  if (tiny(dq)) return { q: q0, path, blocked: false, touched: false, deferred: false, rest: [0, 0], queries };
  let q = q0;
  let rest: QStep = [dq[0], dq[1]];
  let touched = false;
  let blocked = false;
  let g = gapAt(q);
  // (0) STARTED INSIDE the margin: only a step that opens it
  if (g < hard) {
    const end = plus(q, rest);
    if (gapAt(end) > g) return { q: end, path: [q0, end], blocked: false, touched: true, deferred: false, rest: [0, 0], queries };
    return { q, path, blocked: true, touched: true, deferred: false, rest: [0, 0], queries };
  }
  let normals: Vec3[] = [];
  for (let guard = 0; guard < 400 && !tiny(rest); guard++) {
    if (queries >= opt.maxQueries) return { q, path, blocked, touched, deferred: true, rest, queries };
    const travel = arcLength(env, q, rest);
    if (!(travel > 1e-12)) break;
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
      const tS = Math.min(1, (spare / travel) * 0.9);
      let t = tS;
      let gl: number | null = null;
      // ⭐⭐ (2026-10-13, the third audit: *"the orbit slows down when the piece approaches another part"* — it crept PARALLEL to a part, 22 mrad
      // of a 1 rad swipe at 2 mm) the DIRECTIONAL stride: the gap to the NEAREST part along a straight translation is convex, its slope the
      // contact normal's — so it cannot close faster than `approach` per metre; every OTHER part is held to its own gap. Near a part only,
      // ≤ `DIRECTIONAL_MAX_M`, the landing (≥ the gap kept) and the midpoint (≥ half of it) checked — the ring's arc is not a straight line.
      if (spare * 0.9 < DIRECTIONAL_MAX_M) {
        const n = normalAt(q);
        if (n !== null) {
          const J = ringJacobian(env, q);
          const tv: Vec3 = [J[0][0] * rest[0] + J[1][0] * rest[1], J[0][1] * rest[0] + J[1][1] * rest[1], J[0][2] * rest[0] + J[1][2] * rest[1]];
          const tl = Math.hypot(tv[0], tv[1], tv[2]);
          if (tl > 1e-12) {
            const approach = -dot3(n, tv) / tl;
            queries++;
            const others = (env.secondGap?.(q) ?? g) - opt.gapM;
            const along = approach > 1e-9 ? spare / approach : Infinity;
            const stride = Math.min(along, others, DIRECTIONAL_MAX_M) * 0.9;
            let tD = Math.min(1, stride / travel);
            // ⭐ two tries at most, and only for a real gain — a curved part refused the long stride over and over, each try 2 queries
            for (let tries = 0; tries < 2 && tD > 2 * tS; tries++) {
              const end = gapAt(plus(q, rest, tD));
              if (end >= opt.gapM && gapAt(plus(q, rest, tD / 2)) >= hard) {
                t = tD;
                gl = end;
                break;
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
    let u = Math.min(1, SLIDE_STEP_M / Math.max(1e-12, sLen));
    let gn = gapAt(plus(q, s, u));
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
  }
  return { q, path, blocked, touched, deferred: false, rest: [0, 0], queries };
}

/**
 * ⭐⭐ **STUCK, asked of the same solver**: a small step (`probeM` of anchor travel) each way along both ring coordinates — stuck only if not one
 * of them moves the piece a quarter of the probe. (Its turns are asked of `turnSweepFree` by the caller — the same clearance rule.)
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
  return steps.every((s) => dist(env.anchor(solveOrbitStep(q, s, env, opt).q), a0) < probeM / 4);
}

/**
 * ⭐⭐ **A TURN, by the same rule** — the gap along the turn (`gapAtU(u)`, `u` its fraction), `angleRad` its angle, `reachM` the furthest any
 * point of the piece is from the point it turns about: walked by conservative advancement in angle (no point moves more than `reachM · Δθ`),
 * refused as soon as the gap falls under half the gap kept. Returns the fraction where it was refused, `null` when the whole turn is free.
 * ⭐ (2026-10-13, the second audit) a turn STARTING inside that margin (a piece the ring or a part put there): allowed only if it OPENS the gap
 * (its end farther out than its start) — ⛔ it was "never below the gap it starts with", which a piece deep in a part (the gap 0 everywhere)
 * passed on every turn: no red quad, no pop-up, no respawn. `maxQueries` caps the work (the caller passes the frame's cap).
 */
export function turnSweepFree(gapAtU: (u: number) => number, angleRad: number, reachM: number, gapM: number, maxQueries = 24): number | null {
  const hard = gapM / 2;
  const g0 = gapAtU(0);
  if (g0 < hard) return gapAtU(1) > g0 ? null : 1;
  const sweep = Math.abs(angleRad) * reachM; // the furthest any point travels over the whole turn
  const steps = Math.max(2, maxQueries) - 1;
  let u = 0;
  let g = g0;
  for (let i = 0; i < steps; i++) {
    const du = sweep > 1e-12 ? Math.max((g - hard) / sweep, 1 / steps) : 1; // the floor: the end reached within the queries
    u = Math.min(1, u + du);
    g = gapAtU(u);
    if (g < hard) return u;
    if (u >= 1) return null;
  }
  return null;
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
    const found = nearestFree(q, counted, opt.gapM, relocate.stepM, relocate.maxM, Math.max(1, opt.maxQueries - extra), relocate.from ?? 0);
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
  const r = solveOrbitStep(q, [target.yaw - q.yaw, target.v - q.v], env, { ...opt, maxQueries: Math.max(4, opt.maxQueries - extra) });
  let queries = extra + r.queries;
  q = r.q;
  if (r.deferred) {
    target = { yaw: q.yaw + r.rest[0], v: clampV(q.v + r.rest[1]), zoom: target.zoom };
  } else if (r.blocked) {
    target = q;
    if (same(r.q, r.path[0]!)) stopCoast = true;
    if (Math.abs(dvIn) > 1e-12) userV = q.v; // the finger's own dy pushed in: the height asked is where it stopped
  } else if (!r.touched && Math.abs(userV - q.v) > 1e-6) {
    const back = solveOrbitStep(q, [0, userV - q.v], env, { ...opt, maxQueries: Math.max(4, opt.maxQueries - queries) });
    queries += back.queries;
    if (!back.touched && !back.deferred) {
      q = back.q;
      target = q;
    }
  }
  return { q, target, userV, blocked: asked ? r.blocked : null, deferred: r.deferred, relocated, stopCoast, queries, relocateNext, relocateExhausted };
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
}
export const STUCK_FRESH: StuckState = { key: "", idx: 0, position: false, turns: false, done: false, at: -Infinity };
export function stuckNext(s: StuckState, key: string, now: number, everyMs: number): { s: StuckState; check: number | null } {
  // ⭐ (the third audit) a CHANGED key restarts the round but keeps the PACE (`at`) and the last verdict, provisional until a check disagrees —
  // a churning key (a turn playing, a part dragged, the sway) re-ran check 0 every frame and blinked the pop-up off for ≥ 600 ms
  const cur = s.key === key ? s : { ...s, key, idx: 0, done: false };
  if (cur.done || now - cur.at < everyMs) return { s: cur, check: null };
  return { s: { ...cur, at: now }, check: cur.idx };
}
export function stuckRecord(s: StuckState, check: number, blocked: boolean, total: number): StuckState {
  if (!blocked) return { ...s, idx: 0, position: check === 0 ? false : s.position, turns: false, done: true };
  const idx = check + 1;
  const position = check === 0 ? true : s.position;
  return idx >= total ? { ...s, idx: 0, position, turns: true, done: true } : { ...s, idx, position };
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
