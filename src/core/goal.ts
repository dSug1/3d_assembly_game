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

/**
 * ⭐⭐ THE CHECK. `unitM` scales the goal's authored positions to the model's metres; `poseOf` is
 * each body's world pose NOW (`worldPlacementOf`), `null` for a body the world lacks.
 */
export function goalReport(
  final: FinalConfiguration,
  unitM: number,
  poseOf: (id: string) => Pose | null,
  tol: GoalTolerance,
): GoalReport {
  const goals = final.bodies.map((b) => ({
    id: b.id,
    at: scale(b.position as Vec3, unitM),
    accepted: acceptedOrientations(resolveBootOrientation(b.orientation, []) ?? IDENTITY, b.symmetry),
    now: poseOf(b.id),
  }));
  const total = goals.length;
  if (total === 0) return { met: false, inPlace: 0, inPlaceIds: [], total, worstId: null, worstPositionM: 0, worstAngleRad: 0 };
  let rotation: Quat = IDENTITY;
  let translation: Vec3 = [0, 0, 0];
  const present = goals.filter((g) => g.now !== null);
  if (final.frame === "RELATIVE") {
    // ⭐⭐ THE BODIES IN PLACE DEFINE THE FRAME. A plain least-squares fit is dragged toward the
    // misplaced ones — at `Scene_1`'s boot, five pieces 10–20 cm out shift it ~12 mm and every piece
    // in place would read as out. ⭐ So: fit, keep the bodies within twice the median residual (or
    // within tolerance), refit on those — a few rounds, never fewer than three bodies.
    let set = present;
    let fit = bestRigidFit(set.map((g) => g.at), set.map((g) => g.now!.position));
    for (let round = 0; round < 5 && fit; round++) {
      const f = fit;
      const res = present.map((g) => length(sub(g.now!.position, add(qRotate(f.rotation, g.at), f.translation))));
      const median = [...res].sort((a, b) => a - b)[Math.floor(res.length / 2)]!;
      const keep = present.filter((_, i) => res[i]! <= Math.max(2 * median, tol.positionM));
      if (keep.length < 3 || keep.length === set.length) break;
      set = keep;
      fit = bestRigidFit(set.map((g) => g.at), set.map((g) => g.now!.position)) ?? fit;
    }
    if (fit) ({ rotation, translation } = fit);
    // ⚠ Fewer than three bodies, or all on a line: the turn is undetermined, so only the offset is fitted.
    else if (present.length > 0)
      translation = scale(
        present.reduce((s, g) => add(s, sub(g.now!.position, g.at)), [0, 0, 0] as Vec3),
        1 / present.length,
      );
  }
  const inPlaceIds: string[] = [];
  let worst: { id: string; p: number; a: number; score: number } | null = null;
  for (const g of goals) {
    if (!g.now) {
      if (!worst || worst.score < Infinity) worst = { id: g.id, p: Infinity, a: Infinity, score: Infinity };
      continue;
    }
    const expected = add(qRotate(rotation, g.at), translation);
    const p = length(sub(g.now.position, expected));
    const a = Math.min(...g.accepted.map((q) => qAngle(qmul(g.now!.orientation, qconj(qmul(rotation, q))))));
    if (p <= tol.positionM && a <= tol.angleRad) inPlaceIds.push(g.id);
    const score = Math.max(p / Math.max(tol.positionM, 1e-12), a / Math.max(tol.angleRad, 1e-12));
    if (!worst || score > worst.score) worst = { id: g.id, p, a, score };
  }
  return {
    met: inPlaceIds.length === total,
    inPlace: inPlaceIds.length,
    inPlaceIds,
    total,
    worstId: worst?.id ?? null,
    worstPositionM: worst?.p ?? 0,
    worstAngleRad: worst?.a ?? 0,
  };
}
