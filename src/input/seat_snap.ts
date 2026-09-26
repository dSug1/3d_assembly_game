/**
 * ⭐⭐ **THE SEAT'S POSITION LERP** — the owner, 2026-09-26: *"all the movements to be lerp and
 * slerp."* The orientation half of a snap is `AlignSnaps`' slerp, already built; this is the
 * position half: the FollowerFace centre travelling onto the PioneerFaceCursor.
 *
 * ⭐ Same shape as `AlignSnaps` — one flight per body, replaced by a newer one, cancelled by a
 * release, landed EXACTLY on `to` — and the same clock and duration, so the two halves of one
 * snap arrive together. ⛔ It carries no parent: the caller seats the body when `done` comes back.
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

export interface SeatSnap {
  readonly from: Vec3;
  readonly to: Vec3;
  readonly t0: number;
}

export interface SeatStep<Id> {
  readonly id: Id;
  readonly position: Vec3;
  readonly done: boolean;
}

export class SeatSnaps<Id> {
  private readonly live = new Map<Id, SeatSnap>();

  start(id: Id, from: Vec3, to: Vec3, t0: number): void {
    this.live.set(id, { from, to, t0 });
  }

  cancel(id: Id): void {
    this.live.delete(id);
  }

  has(id: Id): boolean {
    return this.live.has(id);
  }

  get size(): number {
    return this.live.size;
  }

  /** ⭐ Move a flight's END — the cursor or the Pioneer moved while the body was travelling. */
  retarget(id: Id, to: Vec3): void {
    const s = this.live.get(id);
    if (s !== undefined) this.live.set(id, { ...s, to });
  }

  advance(
    nowMs: number,
    durationMs: number,
    ease: (u: number) => number,
    isAlive: (id: Id) => boolean = () => true,
  ): SeatStep<Id>[] {
    const out: SeatStep<Id>[] = [];
    for (const id of [...this.live.keys()]) {
      const s = this.live.get(id);
      if (s === undefined) continue;
      if (!isAlive(id)) {
        this.live.delete(id);
        continue;
      }
      const u = durationMs > 0 ? (nowMs - s.t0) / durationMs : 1;
      if (u >= 1) {
        // ⛔ LAND EXACTLY on the cursor — the seat is then true by construction, not to a frame.
        this.live.delete(id);
        out.push({ id, position: s.to, done: true });
      } else {
        const k = Math.min(1, Math.max(0, ease(u)));
        out.push({
          id,
          position: [
            s.from[0] + (s.to[0] - s.from[0]) * k,
            s.from[1] + (s.to[1] - s.from[1]) * k,
            s.from[2] + (s.to[2] - s.from[2]) * k,
          ],
          done: false,
        });
      }
    }
    return out;
  }
}
