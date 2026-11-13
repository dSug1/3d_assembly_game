/**
 * ⭐⭐⭐ (2026-11-12, the slide's rebuild, `1.0.126-Slide_removal`; the owner: *"Place a particular attention to the teleport issue: when we orbit in polar
 * orbit and approach the piece onto the bottom of the black channel, the tilted-pole orbit dx can then teleport the piece to the other channel or even climb
 * the piece on top of the top face"*) — **THE RING NEVER MOVES THE PIECE INTO A PART**.
 *
 * The solver moves the piece along its ring by the finger, checked. But the ring itself MOVES BETWEEN FRAMES under the piece's solved angles: the map's angles
 * closing on the orbit's (`mapAnglesStep`), the calm's direction, a gizmo's eased relocation (`asmGOff`: a depth step's glide, a tilt's frame change), the
 * support's eased drop. None of those moves is the solver's, and none was checked: walked (the channel on `Piece22`, the tilted pole, a dx at contact), the
 * map's catch-up moved the piece 2 – 5 mm a frame INTO the wall `Piece31` and out again (an in-and-out jitter), and once a move put the piece inside its
 * margin the frame's relocation (`nearestFree`, then up to 0.4 m along the ring) moved it ELSEWHERE — 35 mm in one frame, across to the other side of the
 * channel; the gizmo then left its face and the tilt's exit leapt again. With the slide, the slide took over at contact first and hid it.
 *
 * ⭐ The rule (a proxy, Zilles & Salisbury 1995 / Ruspini et al. 1997: the shown object stays on the free side while its target goes where it will):
 * * the ring's own move from the place SOLVED last frame (`prev`) to the place the same angles have now (`now`) is TAKEN when it does not close on a part
 *   (its gap at `now` at least the gap kept, or no less than it was);
 * * else the piece STAYS: the move is held in a world offset (`hold`) added to the ring — the solver then works from where the piece really is;
 * * the offset is RELEASED toward the ring's own place by checked steps: each no longer than the clearance at the piece allows (`gap − gap/2`, ≤ 4 mm —
 *   conservative advancement: a straight move that short reaches no part), its landing at least as clear as the gap kept (or as the piece was). Against
 *   a wall the release stops at the wall: the piece never crosses anything to rejoin its ring.
 * ⭐ Not enough queries left this frame to check a move: the move is held (the safe side), its release waits.
 * ⛔ ENGINE-FREE: points and a gap function.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ A ring move below this (m) is no move (rounding). */
export const DRIFT_MIN_M = 1e-5;
/** ⭐ The longest release step (m) — the solver's own sub-step (`SLIDE_STEP_M`). */
export const HOLD_RELEASE_MAX_M = 0.004;
/**
 * ⭐⭐ (2026-11-13) A ring move longer than this in ONE frame (m) onto a FREE place is no drift but a RE-BASE (the orbit put elsewhere: a reset, a
 * respawn) — taken, the hold cleared. ⛔ Held: the piece stayed 430 mm off its gizmo across the heptagon after the orbit was reset to the other cap (the
 * walks). ⭐⭐ (the same day) Onto a part it is held like any drift — ⛔ taken whatever its landing: at a corner the gizmo jumped faces at fixed angles and
 * the ring put the piece 99 mm away INSIDE `Piece37` (`t_corners_cross`), 124 mm inside the loose `Piece1` (`contact_slide_top`).
 */
export const REBASE_M = 0.1;
/** ⭐ An offset below this (m) is none. */
export const HOLD_NONE_M = 1e-6;

export interface RingHoldIn {
  /** the piece's anchor SOLVED last frame (the hold included); `null`: none — nothing to compare */
  readonly prev: Vec3 | null;
  /** the same angles' anchor on THIS frame's ring, the hold included */
  readonly now: Vec3;
  /** the offset held so far (world, m); `null`: none */
  readonly hold: Vec3 | null;
  /** the solver's gap kept (m) */
  readonly gapM: number;
  /** the piece's gap at an anchor (one query) */
  readonly gapAt: (p: Vec3) => number;
  /** the queries the frame has left for this */
  readonly budget: number;
}

export interface RingHoldOut {
  readonly hold: Vec3 | null;
  /** the move refused this frame (the piece stayed) */
  readonly held: boolean;
  readonly queries: number;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** ⭐⭐⭐ ONE FRAME of the hold, before the solve: the ring's own move taken or held, then the offset released by one checked step. */
export function ringHoldStep(i: RingHoldIn): RingHoldOut {
  let queries = 0;
  const take = (p: Vec3): number => {
    queries++;
    return i.gapAt(p);
  };
  let hold = i.hold !== null && len(i.hold) > HOLD_NONE_M ? i.hold : null;
  let gNow: number | null = null;
  if (i.prev !== null) {
    const back = sub(i.prev, i.now);
    if (len(back) > DRIFT_MIN_M) {
      if (i.budget < 2) return { hold: add(hold ?? [0, 0, 0], back), held: true, queries };
      gNow = take(i.now);
      if (len(back) > REBASE_M && gNow >= i.gapM) return { hold: null, held: false, queries };
      if (gNow < i.gapM) {
        const gPrev = take(i.prev);
        if (gNow < gPrev - 1e-7) return { hold: add(hold ?? [0, 0, 0], back), held: true, queries };
      }
    }
  }
  if (hold === null) return { hold: null, held: false, queries };
  // the release: toward the ring's own place, one checked step
  if (i.budget - queries < (gNow === null ? 2 : 1)) return { hold, held: false, queries };
  const gCur = gNow ?? take(i.now);
  const hl = len(hold);
  const s = Math.min(hl, Math.max(0, gCur - i.gapM / 2) * 0.9, HOLD_RELEASE_MAX_M);
  if (!(s > HOLD_NONE_M)) return { hold, held: false, queries };
  const k = s / hl;
  const cand: Vec3 = [i.now[0] - hold[0] * k, i.now[1] - hold[1] * k, i.now[2] - hold[2] * k];
  const gc = take(cand);
  if (gc >= Math.min(i.gapM, gCur)) {
    const next: Vec3 = [hold[0] * (1 - k), hold[1] * (1 - k), hold[2] * (1 - k)];
    hold = len(next) > HOLD_NONE_M && k < 1 ? next : null;
  }
  return { hold, held: false, queries };
}
