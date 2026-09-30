/**
 * ⭐⭐⭐ **THE GOAL CHECK — is the level-completed configuration reached?** (`D130`, the owner,
 * 2026-09-28: *"goal completed when parts sit correctly relative to each other … painting can sit
 * anywhere for this Scene_01"*, and *"their respective goal can be achieved by two way: face aligned
 * or opposite face aligned"*). `GM1`'s detector, read from the model. ⛔ Level end is not built.
 *
 * ## ⭐⭐ RELATIVE: the best rigid motion first, then every body against it
 *
 * The goal's centres are carried onto the current centres by the rigid motion that fits them best —
 * **Horn's closed form** (JOSA A 4(4), 1987: the rotation is the top eigenvector of a 4×4 built from
 * the cross-covariance). ⭐ It is fitted on POSITIONS only: a box's centre does not move under its
 * half-turn symmetry, so the fit cannot be fooled by a flipped piece. Then each body is judged against
 * its goal carried by that motion: its centre within `positionM`, its orientation within `angleRad`
 * of ANY of its accepted orientations. ⭐ The fit is refined on the bodies already in place, so the
 * misplaced ones do not drag it (see `goalReport`).
 * ⚠ The motion is a full rotation, not only a yaw: *relative to each other* is read literally.
 *
 * ⛔ ENGINE-FREE.
 */
import { resolveBootOrientation, type FinalConfiguration, type GoalSymmetry } from "./game_structure";
import { add, IDENTITY, length, qAngle, qconj, qFromAxisAngle, qmul, qRotate, scale, sub, type Quat, type Vec3 } from "./vec";

export interface Pose {
  readonly position: Vec3;
  readonly orientation: Quat;
}

export interface GoalTolerance {
  /** World metres a centre may sit from its goal. */
  readonly positionM: number;
  /** Radians an orientation may sit from the nearest accepted one. */
  readonly angleRad: number;
}

export interface GoalReport {
  readonly met: boolean;
  readonly inPlace: number;
  /** ⭐ `D142`: WHICH bodies are in place — `inPlace` is its length. */
  readonly inPlaceIds: readonly string[];
  /**
   * ⭐ `D143`: per body present, the accepted goal orientation NEAREST its own, carried into the world
   * by the fitted motion — what the dissolve's mate turns the spin onto.
   */
  readonly targetOrientations: ReadonlyMap<string, Quat>;
  /** ⭐ `D183`: per body present — its slot, its errors and the exact pose that places it. */
  readonly bodies: ReadonlyMap<string, BodyGoal>;
  readonly total: number;
  /** ⭐ The body furthest out, measured against the tolerances; `null` when none is listed. */
  readonly worstId: string | null;
  readonly worstPositionM: number;
  readonly worstAngleRad: number;
}

/** ⭐ The four half-turns of a box about its own axes — the identity among them. */
const HALF_TURNS: readonly Quat[] = [
  IDENTITY,
  qFromAxisAngle([1, 0, 0], Math.PI),
  qFromAxisAngle([0, 1, 0], Math.PI),
  qFromAxisAngle([0, 0, 1], Math.PI),
];

/** ⭐ Every orientation that looks like `goal` — the symmetry applied in the BODY's frame, first. */
export function acceptedOrientations(goal: Quat, symmetry: GoalSymmetry | undefined): readonly Quat[] {
  return symmetry === "halfTurns" ? HALF_TURNS.map((s) => qmul(goal, s)) : [goal];
}

/** Largest-eigenvalue eigenvector of a symmetric 4×4, by cyclic Jacobi. */
function topEigenvector(a: number[][]): number[] {
  const n = 4;
  const m = a.map((r) => r.slice());
  const v: number[][] = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += m[p]![q]! ** 2;
    if (off < 1e-24) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(m[p]![q]!) < 1e-300) continue;
        const theta = (m[q]![q]! - m[p]![p]!) / (2 * m[p]![q]!);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const mkp = m[k]![p]!;
          const mkq = m[k]![q]!;
          m[k]![p] = c * mkp - s * mkq;
          m[k]![q] = s * mkp + c * mkq;
        }
        for (let k = 0; k < n; k++) {
          const mpk = m[p]![k]!;
          const mqk = m[q]![k]!;
          m[p]![k] = c * mpk - s * mqk;
          m[q]![k] = s * mpk + c * mqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k]![p]!;
          const vkq = v[k]![q]!;
          v[k]![p] = c * vkp - s * vkq;
          v[k]![q] = s * vkp + c * vkq;
        }
      }
  }
  let best = 0;
  for (let i = 1; i < n; i++) if (m[i]![i]! > m[best]![best]!) best = i;
  return [0, 1, 2, 3].map((k) => v[k]![best]!);
}

/**
 * ⭐ The rigid motion carrying `from` onto `to` best, in least squares (Horn 1987).
 * ⛔ `null` for fewer than three points or points on one line — the rotation is then undetermined.
 */
export function bestRigidFit(from: readonly Vec3[], to: readonly Vec3[]): { rotation: Quat; translation: Vec3 } | null {
  const n = from.length;
  if (n < 3 || to.length !== n) return null;
  const cf = scale(from.reduce(add, [0, 0, 0] as Vec3), 1 / n);
  const ct = scale(to.reduce(add, [0, 0, 0] as Vec3), 1 / n);
  const S = [0, 1, 2].map(() => [0, 0, 0]);
  for (let i = 0; i < n; i++) {
    const a = sub(from[i]!, cf);
    const b = sub(to[i]!, ct);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) S[r]![c]! += a[r]! * b[c]!;
  }
  const [[xx, xy, xz], [yx, yy, yz], [zx, zy, zz]] = S as [number[], number[], number[]];
  const N = [
    [xx! + yy! + zz!, yz! - zy!, zx! - xz!, xy! - yx!],
    [yz! - zy!, xx! - yy! - zz!, xy! + yx!, zx! + xz!],
    [zx! - xz!, xy! + yx!, -xx! + yy! - zz!, yz! + zy!],
    [xy! - yx!, zx! + xz!, yz! + zy!, -xx! - yy! + zz!],
  ];
  // ⛔ Collinear (or coincident) points: the cross-covariance has rank ≤ 1 and a turn about that
  // line is free. Measured by the spread of `from` off its principal line.
  const spread = from.map((p) => sub(p, cf));
  const far = spread.reduce((b, p) => (length(p) > length(b) ? p : b), [0, 0, 0] as Vec3);
  const L = length(far);
  if (!(L > 1e-12)) return null;
  const u = scale(far, 1 / L);
  const off = Math.max(...spread.map((p) => length(sub(p, scale(u, p[0] * u[0] + p[1] * u[1] + p[2] * u[2])))));
  if (!(off > 1e-9 * Math.max(1, L))) return null;
  const e = topEigenvector(N);
  const norm = Math.hypot(...e);
  const rotation: Quat = [e[0]! / norm, e[1]! / norm, e[2]! / norm, e[3]! / norm];
  return { rotation, translation: sub(ct, qRotate(rotation, cf)) };
}

interface Slot {
  readonly id: string;
  readonly kind: string;
  readonly at: Vec3;
  readonly accepted: readonly Quat[];
}

interface Frame {
  readonly rotation: Quat;
  readonly translation: Vec3;
}

/** ⭐ One body judged against one slot under a frame: its centre's distance, its angle to the nearest accepted turn. */
function judge(slot: Slot, now: Pose, frame: Frame): { p: number; a: number; target: Pose } {
  const expected = add(qRotate(frame.rotation, slot.at), frame.translation);
  let a = Infinity;
  let orientation: Quat = qmul(frame.rotation, slot.accepted[0]!);
  for (const q of slot.accepted) {
    const world = qmul(frame.rotation, q);
    const d = qAngle(qmul(now.orientation, qconj(world)));
    if (d < a) {
      a = d;
      orientation = world;
    }
  }
  return { p: length(sub(now.position, expected)), a, target: { position: expected, orientation } };
}

/**
 * ⭐⭐ THE FRAME. `ABSOLUTE`: the identity. `RELATIVE`: the bodies in place define it — a plain least-squares fit is
 * dragged toward the misplaced ones (at `Scene_1`'s boot, five pieces 10–20 cm out shift it ~12 mm and every piece in
 * place would read as out). ⭐ So: fit, keep the bodies within twice the median residual (or `FIT_INLIER_M`), refit on
 * those — until the kept set no longer changes, never fewer than three bodies.
 * ⛔⛔ `D190`: *until the kept set no longer changes* — it stopped when the kept COUNT matched, so a round that swapped
 * misplaced pieces out for placed ones (same count, other members) was never refitted: two pieces a metre away left the
 * frame tilted 10.6°, the painting's top row read 40–57 mm off, and nine pieces nobody touched counted as un-placed —
 * one move later they all "reached their goal" in one pop-up (the owner's report, found by a fuzz of random moves).
 */
function fitFrame(kind: FinalConfiguration["frame"], pairs: readonly { at: Vec3; now: Vec3 }[]): Frame {
  if (kind !== "RELATIVE") return { rotation: IDENTITY, translation: [0, 0, 0] };
  let set = pairs;
  let fit = bestRigidFit(set.map((g) => g.at), set.map((g) => g.now));
  for (let round = 0; round < FIT_ROUNDS && fit; round++) {
    const f = fit;
    const res = pairs.map((g) => length(sub(g.now, add(qRotate(f.rotation, g.at), f.translation))));
    const median = [...res].sort((a, b) => a - b)[Math.floor(res.length / 2)]!;
    const keep = pairs.filter((_, i) => res[i]! <= Math.max(2 * median, FIT_INLIER_M));
    if (keep.length < 3 || (keep.length === set.length && keep.every((g, i) => g === set[i]))) break;
    set = keep;
    fit = bestRigidFit(set.map((g) => g.at), set.map((g) => g.now)) ?? fit;
  }
  // ⭐⭐ `D190`: then the EXACT core — the pieces within `FIT_INLIER_M` — defines the frame, whenever three of them fit.
  // ⛔ Loosely placed pieces (inside the margins, not exact) had a vote: with many of them the median cut let them in, so
  // moving one ELSEWHERE shifted the frame by millimetres and flipped an untouched piece sitting at its margin's edge.
  // The exact ones are the boot's and every piece a goal pull landed — so the frame no longer moves when a loose or far
  // piece does.
  for (let round = 0; round < FIT_ROUNDS && fit; round++) {
    const f = fit;
    const core = pairs.filter((g) => length(sub(g.now, add(qRotate(f.rotation, g.at), f.translation))) <= FIT_INLIER_M);
    if (core.length < 3 || (core.length === set.length && core.every((g, i) => g === set[i]))) break;
    const refit = bestRigidFit(core.map((g) => g.at), core.map((g) => g.now));
    if (!refit) break;
    set = core;
    fit = refit;
  }
  if (fit) return fit;
  // ⚠ Fewer than three bodies, or all on a line: the turn is undetermined, so only the offset is fitted.
  if (pairs.length === 0) return { rotation: IDENTITY, translation: [0, 0, 0] };
  return {
    rotation: IDENTITY,
    translation: scale(pairs.reduce((s, g) => add(s, sub(g.now, g.at)), [0, 0, 0] as Vec3), 1 / pairs.length),
  };
}

/**
 * ⛔⛔ `D183`: the fit's OWN inlier floor, never the placement margin — with the snap's margins (~40 mm at the boot
 * camera) a piece being captured sat inside the cut and bent the frame it was judged against: it landed 4.7 mm and 0.7°
 * off the table (found in the real app).
 */
const FIT_INLIER_M = 0.002;

/** ⭐ `D190`: how many refits the frame may take to settle — each round only drops or restores pieces. */
const FIT_ROUNDS = 12;

/** ⭐ Every injective map of `n` bodies onto `m ≥ n` slots, identity first (so a tie keeps each body on its own slot). */
function* injections(n: number, m: number, used: boolean[] = [], out: number[] = []): Generator<number[]> {
  if (out.length === n) {
    yield out.slice();
    return;
  }
  const own = out.length;
  const order = [own, ...[...Array(m).keys()].filter((k) => k !== own)];
  for (const k of order) {
    if (used[k]) continue;
    used[k] = true;
    out.push(k);
    yield* injections(n, m, used, out);
    out.pop();
    used[k] = false;
  }
}

/** ⚠ Past this many interchangeable bodies the exhaustive search (n!) gives way to a greedy one. */
const EXHAUSTIVE_KIND = 6;

/**
 * ⭐⭐ `D183` — WHICH SLOT EACH BODY FILLS. Bodies of one `kind` are interchangeable: they are matched to their kind's
 * slots at the least total score (a body's position and angle, each against its tolerance). A body with no kind, or
 * alone in it, fills its own slot. ⛔ A missing body takes a slot left over, so a slot is never shared.
 */
function assign(
  slots: readonly Slot[],
  nowOf: ReadonlyMap<string, Pose | null>,
  frame: Frame,
  tol: GoalTolerance,
): Map<string, Slot> {
  const out = new Map<string, Slot>();
  const byKind = new Map<string, Slot[]>();
  for (const s of slots) byKind.set(s.kind, [...(byKind.get(s.kind) ?? []), s]);
  // ⛔⛔ `D190`: the cost is CAPPED outside the margins — one flat price for every slot a piece is not inside. Uncapped, a
  // piece a metre away could STEAL a LOOSELY placed twin's slot: the sum of distances only bounds the swap to within twice
  // the loose twin's offset (measured: Piece31 1.12 m away, Piece30 34 mm off its slot — identity 1222 + 34 mm, swap
  // 1123 + 133 mm: a tie, and Piece30 un-placed by a move it was not part of). Capped, the matching first places as many
  // as it can, then minimises their error; a far piece never competes.
  const OUTSIDE = 3;
  const cost = (body: string, slot: Slot): number => {
    const r = judge(slot, nowOf.get(body)!, frame);
    const p = r.p / Math.max(tol.positionM, 1e-12);
    const a = r.a / Math.max(tol.angleRad, 1e-12);
    return p <= 1 && a <= 1 ? p + a : OUTSIDE;
  };
  for (const group of byKind.values()) {
    const present = group.filter((s) => nowOf.get(s.id));
    if (group.length < 2 || present.length === 0) {
      for (const s of group) out.set(s.id, s);
      continue;
    }
    // ⚠ Ordered so body i's OWN slot is index i — then `injections` tries the identity first.
    const ordered = [...present, ...group.filter((s) => !nowOf.get(s.id))];
    const table = present.map((b) => ordered.map((s) => cost(b.id, s)));
    let best: number[] = present.map((_, i) => i);
    if (present.length <= EXHAUSTIVE_KIND) {
      let bestCost = Infinity;
      for (const perm of injections(present.length, ordered.length)) {
        const c = perm.reduce((sum, k, i) => sum + table[i]![k]!, 0);
        if (c < bestCost - 1e-9) {
          bestCost = c;
          best = perm;
        }
      }
    } else {
      const taken = new Set<number>();
      best = present.map((_, i) => {
        let k = -1;
        for (let j = 0; j < ordered.length; j++) if (!taken.has(j) && (k < 0 || table[i]![j]! < table[i]![k]!)) k = j;
        taken.add(k);
        return k;
      });
    }
    present.forEach((b, i) => out.set(b.id, ordered[best[i]!]!));
    const left = ordered.filter((_, k) => !best.includes(k));
    group.filter((s) => !nowOf.get(s.id)).forEach((s, i) => out.set(s.id, left[i]!));
  }
  return out;
}

/** ⭐ `D183`: one body against its goal — how far, how turned, and the exact pose that would place it. */
export interface BodyGoal {
  /** The slot it fills — its own id unless an identical body's slot fits it better (`kind`). */
  readonly slotId: string;
  readonly positionM: number;
  readonly angleRad: number;
  /** ⭐ The pose on its slot: the centre exactly there, the nearest accepted orientation — what a capture pulls it to. */
  readonly target: Pose;
}

/**
 * ⭐⭐ THE CHECK. `unitM` scales the goal's authored positions to the model's metres; `poseOf` is
 * each body's world pose NOW (`worldPlacementOf`), `null` for a body the world lacks.
 */
export function goalReport(
  final: FinalConfiguration,
  unitM: number,
  poseOf: (id: string) => Pose | null,
  tol: GoalTolerance,
  /**
   * ⭐ `D183`: the tolerance each body is JUDGED against — a piece never grabbed is held to a stricter one. Absent:
   * `tol` for all. ⚠ `tol` alone fits the frame and matches the kinds.
   */
  tolOf: (id: string) => GoalTolerance = () => tol,
): GoalReport {
  const slots: Slot[] = final.bodies.map((b) => ({
    id: b.id,
    kind: b.kind ?? `#${b.id}`,
    at: scale(b.position as Vec3, unitM),
    accepted: acceptedOrientations(resolveBootOrientation(b.orientation, []) ?? IDENTITY, b.symmetry),
  }));
  const total = slots.length;
  if (total === 0)
    return { met: false, inPlace: 0, inPlaceIds: [], targetOrientations: new Map(), bodies: new Map(), total, worstId: null, worstPositionM: 0, worstAngleRad: 0 };
  const nowOf = new Map(slots.map((s) => [s.id, poseOf(s.id)] as const));
  const present = slots.filter((s) => nowOf.get(s.id));
  // ⭐ Each body on its own slot first; then the kinds are re-matched under the frame and the frame refitted on the
  // match, until it holds (a swapped pair of twins would otherwise read as two outliers of the fit).
  let slotOf = new Map(slots.map((s) => [s.id, s] as const));
  const pairs = () => present.map((s) => ({ at: slotOf.get(s.id)!.at, now: nowOf.get(s.id)!.position }));
  let frame = fitFrame(final.frame, pairs());
  for (let round = 0; round < 3; round++) {
    const next = assign(slots, nowOf, frame, tol);
    if (slots.every((s) => next.get(s.id) === slotOf.get(s.id))) break;
    slotOf = next;
    frame = fitFrame(final.frame, pairs());
  }
  const inPlaceIds: string[] = [];
  const targetOrientations = new Map<string, Quat>();
  const bodies = new Map<string, BodyGoal>();
  let worst: { id: string; p: number; a: number; score: number } | null = null;
  for (const s of slots) {
    const now = nowOf.get(s.id);
    if (!now) {
      if (!worst || worst.score < Infinity) worst = { id: s.id, p: Infinity, a: Infinity, score: Infinity };
      continue;
    }
    const slot = slotOf.get(s.id)!;
    const { p, a, target } = judge(slot, now, frame);
    targetOrientations.set(s.id, target.orientation);
    bodies.set(s.id, { slotId: slot.id, positionM: p, angleRad: a, target });
    const t = tolOf(s.id);
    if (p <= t.positionM && a <= t.angleRad) inPlaceIds.push(s.id);
    const score = Math.max(p / Math.max(t.positionM, 1e-12), a / Math.max(t.angleRad, 1e-12));
    if (!worst || score > worst.score) worst = { id: s.id, p, a, score };
  }
  return {
    met: inPlaceIds.length === total,
    inPlace: inPlaceIds.length,
    inPlaceIds,
    targetOrientations,
    bodies,
    total,
    worstId: worst?.id ?? null,
    worstPositionM: worst?.p ?? 0,
    worstAngleRad: worst?.a ?? 0,
  };
}
