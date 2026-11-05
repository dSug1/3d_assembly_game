/**
 * ⭐⭐⭐ (2026-11-05, the tilted orbit's rebuild, STEP 6 — `TILTED_ORBIT_REBUILD_SCOPE.md` §4.4, §5, §19) **THE ORBIT'S FRAME, TURNED AT A CROSSING**:
 * the orbit's angles (yaw, pitch) are read in a FRAME — a rotation `q` (world from frame); upright, the world's own. When the orbit passes a column's top
 * (bottom) bound — the edge between a side facet and the top (bottom) cap — the frame TURNS about that edge by the DIHEDRAL between the two facets
 * (`shortestArc`: 90° on a box): the cap is then a facet of the new frame's column at the same heading, orbited as a wall is (a dx along the edge, a dy
 * across toward the far edge — the facet frame's planes: I1, the world's x / z lines on a box). Nothing moves at the turn: the piece's direction is the
 * same vector read in the new frame's angles (`rebaseAngles`).
 * ⭐⭐⭐ (2026-11-05, §21 rebuilt — §21.5 F1) the frame is ONLY the travel's chart; it TURNS at the crossing itself — the finger's step SPLIT at the first
 * face change on its way (`stepToBoundary`), the frame turned exactly AT the bound (no margin: nothing moves at a turn, so a turn back costs nothing), the
 * roles and R4's hold read there (`input_roles.ts`), the rest of the step re-mapped. Its axes snapped onto the world's (`snapFrame`). ⛔ §19 / §20's caps,
 * exits to upright, clamps, roll owed and hold; ⛔ §21's first build's turn at the bound + 3° on the SOLVED place (§21.5 cause 4) — deleted.
 * ⛔ ENGINE-FREE. Rotations, a piecewise test — textbook.
 */
import { qconj, qmul, qRotate, shortestArc, type Quat, type Vec3 } from "../core/vec";
import { columnAt, type FaceMap } from "./face_map";

/** ⭐ The orbit's frame: its rotation (world from frame); the cap turned onto and the facet crossed from (world normals); which way is back. */
export interface OrbitFrame {
  readonly q: Quat;
  /** the cap faced (`null`: upright) */
  readonly cap: "TOP" | "BOTTOM" | null;
  /** the faced cap's world normal, and the side facet's crossed from */
  readonly capN: Vec3 | null;
  readonly fromN: Vec3 | null;
  /** the way back below the cap's band (onto a top), else above it (onto a bottom) */
  readonly backLow: boolean;
  /** a cache key */
  readonly key: string;
}

export const UPRIGHT: OrbitFrame = { q: [1, 0, 0, 0], cap: null, capN: null, fromN: null, backLow: true, key: "U" };


export const toWorld = (f: OrbitFrame, v: Vec3): Vec3 => qRotate(f.q, v);
export const toFrame = (f: OrbitFrame, v: Vec3): Vec3 => qRotate(qconj(f.q), v);

/** ⭐ A direction's angles in its frame's coordinates (the orbit's convention: x = cos, z = sin, pitch up +), the yaw the turn nearest `yawNear`. */
export function anglesOf(u: Vec3, yawNear: number): { readonly yaw: number; readonly pitch: number } {
  const l = Math.hypot(u[0], u[1], u[2]);
  const pitch = l > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, u[1] / l))) : 0;
  let yaw = Math.hypot(u[0], u[2]) > 1e-12 ? Math.atan2(u[2], u[0]) : yawNear;
  yaw += 2 * Math.PI * Math.round((yawNear - yaw) / (2 * Math.PI));
  return { yaw, pitch };
}

/** ⭐ The direction at (`yaw`, `pitch`) in a frame's coordinates. */
export function dirOf(yaw: number, pitch: number): Vec3 {
  return [Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw)];
}

/** ⭐⭐ THE RE-BASE: angles in `from` → the same world direction's angles in `to` (nothing moves). */
export function rebaseAngles(from: OrbitFrame, to: OrbitFrame, yaw: number, pitch: number): { readonly yaw: number; readonly pitch: number } {
  return anglesOf(toFrame(to, toWorld(from, dirOf(yaw, pitch))), yaw);
}

/**
 * ⭐ A frame's rotation SNAPPED: each of its axes within 1e-6 of a world axis put exactly on it (a box's turns are 90° about world axes — many crossings
 * must not drift the sections off the world's planes); else as it is.
 */
export function snapFrame(q: Quat): Quat {
  const ax = [qRotate(q, [1, 0, 0]), qRotate(q, [0, 1, 0]), qRotate(q, [0, 0, 1])];
  const snapped = ax.map((v) => {
    const k = [0, 1, 2].reduce((m, j) => (Math.abs(v[j]!) > Math.abs(v[m]!) ? j : m), 0);
    if (Math.abs(Math.abs(v[k]!) - 1) > 1e-6) return null;
    const r: [number, number, number] = [0, 0, 0];
    r[k] = v[k]! > 0 ? 1 : -1;
    return r as Vec3;
  });
  if (snapped.some((v) => v === null)) return q;
  const [X, Y, Z] = snapped as Vec3[];
  // the rotation matrix's columns X, Y, Z → a quaternion (Shepperd)
  const m00 = X![0], m10 = X![1], m20 = X![2], m01 = Y![0], m11 = Y![1], m21 = Y![2], m02 = Z![0], m12 = Z![1], m22 = Z![2];
  const tr = m00 + m11 + m22;
  let w: number, x: number, y: number, z: number;
  if (tr > 0) {
    const S = Math.sqrt(tr + 1) * 2;
    w = 0.25 * S; x = (m21 - m12) / S; y = (m02 - m20) / S; z = (m10 - m01) / S;
  } else if (m00 > m11 && m00 > m22) {
    const S = Math.sqrt(1 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / S; x = 0.25 * S; y = (m01 + m10) / S; z = (m02 + m20) / S;
  } else if (m11 > m22) {
    const S = Math.sqrt(1 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / S; x = (m01 + m10) / S; y = 0.25 * S; z = (m12 + m21) / S;
  } else {
    const S = Math.sqrt(1 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / S; x = (m02 + m20) / S; y = (m12 + m21) / S; z = 0.25 * S;
  }
  return w < 0 ? [-w, -x, -y, -z] : [w, x, y, z];
}

/**
 * ⭐⭐⭐ THE FRAME'S STEP (§21 — every crossing turns, the frame never resets): the orbit's place (`yaw`, `pitch`, in frame `f`, its face map `map` built
 * in it) PAST its column's top / bottom bound — the frame TURNED about the edge between the column's facet and the facet beyond (the frame's cap there) by
 * their dihedral (`shortestArc`: 90° on a box), whatever frame it is in. A dx never turns it: every facet square to the frame's up is one of its columns
 * (the green loop, a world plane on a box). `null`: stay.
 */
export function frameStep(f: OrbitFrame, map: FaceMap, yaw: number, pitch: number): OrbitFrame | null {
  const col = map.columns[columnAt(map, yaw).k];
  if (col === undefined) return null;
  const B = col.bounds;
  const up = pitch > B[B.length - 1]!;
  const down = pitch < B[0]!;
  if (!up && !down) return null;
  const side = map.facets[up ? col.facets[col.facets.length - 1]! : col.facets[0]!]!;
  const cap = map.facets[up ? map.top : map.bottom]!;
  const fromN = toWorld(f, side.n);
  const capN = toWorld(f, cap.n);
  const q = snapFrame(qmul(shortestArc(fromN, capN), f.q));
  return { q, cap: up ? "TOP" : "BOTTOM", capN, fromN, backLow: up, key: q.map((x) => x.toFixed(6)).join(",") };
}

/** ⭐ How far past a face change a split step lands (rad) — on the next face, by a hair. */
export const CROSS_EPS_RAD = 1e-7;

/**
 * ⭐⭐⭐ (§21.5 F1) THE STEP'S FIRST FACE CHANGE: the share `t` (0 … 1] of the step (`dYaw`, `dPitch`) from (`yaw`, `pitch`) that reaches the first
 * boundary on its way — the column's yaw edges (`mid ± hw`), its stacked facets' pitch bounds (`bounds`, the top and bottom ones the frame's turn) — plus
 * `CROSS_EPS_RAD` past it; 1: none within the step. `crossing`: a boundary is met.
 */
export function stepToBoundary(map: FaceMap, yaw: number, pitch: number, dYaw: number, dPitch: number): { readonly t: number; readonly crossing: boolean } {
  const col = map.columns[columnAt(map, yaw).k];
  if (col === undefined) return { t: 1, crossing: false };
  let t = Infinity;
  if (dYaw !== 0) {
    const off = Math.atan2(Math.sin(yaw - col.mid), Math.cos(yaw - col.mid));
    const to = Math.sign(dYaw) * col.hw - off; // the yaw left to the edge it moves toward
    if (to >= 0) t = Math.min(t, (Math.abs(to) + CROSS_EPS_RAD) / Math.abs(dYaw));
  }
  if (dPitch !== 0) {
    const B = col.bounds;
    const next = dPitch > 0 ? B.find((b) => b > pitch) : [...B].reverse().find((b) => b < pitch);
    if (next !== undefined) t = Math.min(t, (Math.abs(next - pitch) + CROSS_EPS_RAD) / Math.abs(dPitch));
  }
  return t < 1 ? { t, crossing: true } : { t: 1, crossing: false };
}
