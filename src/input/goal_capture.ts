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
