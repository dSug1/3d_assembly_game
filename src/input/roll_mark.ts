/**
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.6 F6, the owner: *"do all"*) THE ROLL MARKED ON THE PLACE — the next face the camera is rolled for.
 * KEPT while the travel's place is on the same face (`on`) and within `band` (`cameraRollMm`) of the marked face's polygon (+ `ROLL_MARK_HYST_M`), whatever
 * the input moves it; else SET when the place advanced along the way (`ahead`, read only then) reaches another face AND is within `band` of it — one
 * measure, the place's distance, decides both. Under the slide (`locked`) or with no band: none.
 * ⛔ §21 v2's anticipation read along the last step's direction every frame: a dy brought the place near an edge, a dx then dropped the roll, the roles
 * flipped, and R4 held the dx for good (the 950-frame stalls).
 * ⛔ No engine import (`tests/boundary.test.ts`).
 */
import { dot, type Vec3 } from "../core/vec";

export interface RollMark {
  /** the face the travel is on (world normal) */
  readonly on: Vec3;
  /** the face it is rolled for (world normal) */
  readonly to: Vec3;
}

/** ⭐ The mark's band is left this much past `cameraRollMm` (m): a place on the band's edge does not flicker in and out. */
export const ROLL_MARK_HYST_M = 0.001;

/** ⭐ Two normals of one face. */
const SAME_FACE_COS = 0.999;

export function nextRollMark(
  prev: RollMark | null,
  n: Vec3,
  band: number,
  locked: boolean,
  distTo: (to: Vec3) => number,
  ahead: () => Vec3 | null,
): RollMark | null {
  if (locked || !(band > 0)) return null;
  if (prev !== null && dot(prev.on, n) >= SAME_FACE_COS && distTo(prev.to) <= band + ROLL_MARK_HYST_M) return prev;
  const a = ahead();
  return a !== null && dot(a, n) < SAME_FACE_COS && distTo(a) <= band ? { on: n, to: a } : null;
}
