/**
 * ⭐⭐⭐ **THE GOAL CAPTURE** (`D183`, the owner, 2026-09-30: *"piece2 should be able to reach its goal also even if
 * unaligned or aligned with other objects provided that its transform meets the goal transform within the same position
 * and roll margins as for the snap"*). A piece that MOVES INTO its goal margins — its centre within the capture radius
 * of its slot, its orientation within the snap cone of the nearest accepted one — is pulled onto its exact goal pose, as
 * the snap pulls a Follower onto its seat. ⭐ The goal wins over the snap.
 *
 * ⛔⛔ **ENTRY, NOT PRESENCE.** A piece already inside its margins — at boot, after a capture, after an undo — must LEAVE
 * them before it can be captured again, or the first millimetre of any drag off the goal would pull it back and a placed
 * piece could never be moved (`GoalCapture`). ⭐ A capture whose flight is blocked stays PENDING while the piece stays
 * inside, and fires once the flight is clear (`D182`'s rule for the snap).
 *
 * ⛔ ENGINE-FREE. The margins and the flight's path check are the caller's; this holds the arming and the animation.
 */
import { qSlerp, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { resolveMove, type CollisionSetup } from "../core/collision";
import type { ObjectId, World } from "../core/object_model";
import type { Placed } from "../core/mate_connector";
import { trackingMetresPerPx } from "./translate";
import type { Pose } from "../core/goal";

/** One piece this frame: is it inside its margins, and did it move since the last frame? */
export interface GoalSighting {
  readonly id: string;
  readonly inside: boolean;
  readonly moved: boolean;
}

/**
 * ⭐⭐ Per piece: ARMED once it has been seen OUTSIDE its margins; a MOVE that finds it inside while armed makes it
 * PENDING; a pending piece is offered to the pull every frame until it is captured or leaves.
 * ⚠ The first sighting decides: a piece first seen inside is disarmed (the boot, and the frame after `forget`).
 */
export class GoalCapture {
  private readonly armed = new Map<string, boolean>();
  private readonly pending = new Set<string>();

  /** ⭐ `true` until the first sighting — the caller must look at every piece once. */
  needsSight(): boolean {
    return this.armed.size === 0;
  }

  hasPending(): boolean {
    return this.pending.size > 0;
  }

  /** ⭐ The pieces whose pull should be tried THIS frame. */
  frame(seen: readonly GoalSighting[]): string[] {
    const out: string[] = [];
    for (const s of seen) {
      if (!this.armed.has(s.id)) this.armed.set(s.id, !s.inside);
      if (!s.inside) {
        this.armed.set(s.id, true);
        this.pending.delete(s.id);
        continue;
      }
      if (this.armed.get(s.id) === true && s.moved) this.pending.add(s.id);
      if (this.pending.has(s.id)) out.push(s.id);
    }
    return out;
  }

  /** ⭐ Its pull has started: disarmed until it leaves its margins again. */
  captured(id: string): void {
    this.armed.set(id, false);
    this.pending.delete(id);
  }

  /** ⭐ A pull cancelled in flight: pending again, re-offered while the piece stays inside. */
  retry(id: string): void {
    this.armed.set(id, true);
    this.pending.add(id);
  }

  /** ⭐ After an undo: every piece is re-sighted, so one restored onto its goal is not captured again. */
  forget(): void {
    this.armed.clear();
    this.pending.clear();
  }
}

interface Pull {
  readonly from: Pose;
  readonly to: Pose;
  readonly t0: number;
}

export interface PullStep {
  readonly id: string;
  readonly pose: Pose;
  readonly done: boolean;
}

/**
 * ⭐ The pulls in flight — position lerped, orientation slerped, on the snap's own clock and easing, LANDING EXACTLY on
 * the goal pose (as `SeatSnaps` lands exactly on the cursor).
 */
export class GoalPulls {
  private readonly live = new Map<string, Pull>();

  start(id: string, from: Pose, to: Pose, t0: number): void {
    this.live.set(id, { from, to, t0 });
  }

  cancel(id: string): void {
    this.live.delete(id);
  }

  has(id: string): boolean {
    return this.live.has(id);
  }

  get size(): number {
    return this.live.size;
  }

  advance(nowMs: number, durationMs: number, ease: (u: number) => number): PullStep[] {
    const out: PullStep[] = [];
    for (const [id, p] of [...this.live]) {
      const u = durationMs > 0 ? (nowMs - p.t0) / durationMs : 1;
      if (u >= 1) {
        this.live.delete(id);
        out.push({ id, pose: p.to, done: true });
        continue;
      }
      const k = Math.min(1, Math.max(0, ease(u)));
      const position: Vec3 = [
        p.from.position[0] + (p.to.position[0] - p.from.position[0]) * k,
        p.from.position[1] + (p.to.position[1] - p.from.position[1]) * k,
        p.from.position[2] + (p.to.position[2] - p.from.position[2]) * k,
      ];
      out.push({ id, pose: { position, orientation: qSlerp(p.from.orientation, p.to.orientation, k) }, done: false });
    }
    return out;
  }
}

/**
 * ⛔ (2026-11-02) moved here from `input/highlight.ts`, deleted with the parts' translation, rotation and alignment (commit `d8134eb`).
 *
 * ⭐⭐⭐ **THE CAPTURE OFFSET IN WORLD METRES, FROM A DISTANCE ON THE GLASS** (`D49`, the owner:
 * *"the offset distance shall depend on the camera position and focus … or more or less the
 * same in pixels although I do not want to use pixel since this may vary depending on device
 * screens"*).
 *
 * ⭐⭐ **THAT REQUEST HAS AN EXACT ANSWER ALREADY IN THIS CODEBASE.** `trackingMetresPerPx` is
 * the world displacement that keeps an object under a moving finger — computed from the
 * camera's field of view, its distance and the viewport height. ⛔ Composing it with `mmToPx`
 * turns *millimetres of finger travel* into *metres of world*, which is precisely
 * *"the same apparent size at every zoom, authored in millimetres and never in pixels"*:
 *
 * * **close camera ⇒ a smaller world offset**, far camera ⇒ larger, proportionally;
 * * **device-independent**, because the viewport height and field of view are in the formula —
 *   which is the half of the request raw pixels could not satisfy;
 * * ⭐ **no new constant.** `referenceCameraDistance`'s ratio form was deliberately superseded
 *   for rule 6 by this same computation (`translate.ts`), and the sway already scales this way
 *   so it looks the same size at every zoom. Three rules, one factor.
 *
 * ⚠⚠ **THE DISTANCE IS THE CAMERA'S TO ITS FOCUS, NOT TO EACH BODY** — which is what the owner
 * asked for (*"camera and focus"*) and is one number for the whole scene. ⛔ A per-body distance
 * would make two bodies at different depths capture at different world gaps, so a pair could be
 * *in range* measured from one and *out of range* measured from the other — a rule with two
 * answers. ⭐ Stated because it is a modelling choice, not an approximation.
 *
 * ⭐ Its reader today is the goal capture (`D183`: the snap's margins).
 * ⛔ Returns 0 for a degenerate viewport or camera, which reads as *nothing captures* — the
 * safe direction, and the same convention `trackingMetresPerPx` already uses.
 */
export function captureOffsetM(
  offsetMm: number,
  cameraDistanceM: number,
  fovRad: number,
  viewportHeightPx: number,
): number {
  if (!(offsetMm > 0)) return 0;
  return mmToPx(offsetMm) * trackingMetresPerPx(cameraDistanceM, fovRad, viewportHeightPx);
}

/**
 * ⛔ (2026-11-02) moved here from `input/snap.ts`, deleted with the parts' translation, rotation and alignment (commit `d8134eb`).
 *
 * ⭐⭐⭐ `D182` — **A SNAP STARTS ONLY IF ITS FLIGHT IS CLEAR** (the owner, 2026-09-30: *"Build the fix"*, after the
 * reproduction). Which body — or wall — would stop the follower's straight flight to its seat, or `null` when the path is
 * free, judged by the one collision rule (`resolveMove`: along the path, the couple exempt through `setup`).
 * ⛔ The cause it removes: a snap started from beside a zero-clearance slot flew into a neighbour, was CANCELLED, and the
 * cancel HELD the couple off until it left the capture radius — so a piece slid in horizontally, sitting on its Pioneer,
 * never snapped (measured on `Scene_1`'s Piece1/Piece22: 28 steps held; a lift re-armed it). ⭐ Now a blocked flight is
 * never started, and nothing is held: the snap fires on the first frame its path is clear, from any direction.
 */
export function snapPathBlockedBy(world: World, followerId: ObjectId, seat: Placed, setup: CollisionSetup): ObjectId | null {
  return resolveMove(world, followerId, seat, setup).blockedBy;
}
