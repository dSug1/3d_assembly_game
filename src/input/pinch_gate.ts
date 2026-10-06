/**
 * ⭐⭐ prototype — **A PINCH ZOOMS WHILE A FINGER MOVES** (the owner, 2026-10-06 — first *"zoom can be triggered only if both delta positions
 * are outside deadband"*, then, the alignment tap moved onto the piece, *"The zoom can be triggered by only one delta position outside its
 * deadband"*: see `pinchZooms`).
 * Each pinching finger has its OWN motion state — §1.1's `MotionTracker`: MOVING once it passes its deadband (`motionDeadbandMm`, mm on the
 * glass), STATIONARY again only after the rest window (derived from the device's own event interval). ⛔ Not a per-EVENT test: the browser
 * delivers each finger's move as its own event, so at any one event only one finger has just moved — a "both moved this step" test never
 * holds (found headless, 2026-10-06). The zoom applies while a finger is MOVING (`pinchZooms`); with both still the pinch is REBASED (its
 * start where the fingers are now, at the zoom as it is), so a zoom resumed later continues from there — never a jump.
 *
 * ⛔ ENGINE-FREE.
 */
import { MotionTracker, type Sample } from "./motion";
import type { GestureConfig } from "./gestureConfig";

/**
 * ⭐ Does this step zoom? With EITHER finger MOVING (the owner, 2026-10-06: *"The zoom can be triggered by only one delta position outside
 * its deadband (no need for two outside their deadbands as we have removed the uncertainty on the zoom inputs)"* — a second touch OFF the
 * piece is always a pinch now). ⛔ It was BOTH (the same day), while a second touch anywhere could still turn out to be a tap. Both still:
 * no zoom (the pinch rebased — jitter inside the deadbands never zooms).
 */
export function pinchZooms(aMoving: boolean, bMoving: boolean): boolean {
  return aMoving || bMoving;
}

/**
 * ⭐ The pinching fingers' motion states — one `MotionTracker` per finger, fed each finger's OWN samples (a sample already fed is not fed
 * again), and ticked so a finger that has stopped is seen stopped even with no event.
 */
export class PinchMotion {
  private readonly trackers = new Map<number, { tracker: MotionTracker; lastT: number }>();
  constructor(private readonly cfg: GestureConfig) {}

  /** ⭐ A pinch begins: each finger's tracker starts at its sample now. */
  begin(fingers: readonly { readonly id: number; readonly last: Sample }[]): void {
    this.trackers.clear();
    for (const f of fingers) {
      const tracker = new MotionTracker(this.cfg);
      tracker.push(f.last);
      this.trackers.set(f.id, { tracker, lastT: f.last.t });
    }
  }

  /** ⭐ Is each of these fingers MOVING now? — each fed its newest sample (once), then ticked at `nowMs`. */
  moving(fingers: readonly { readonly id: number; readonly last: Sample }[], nowMs: number): boolean[] {
    return fingers.map((f) => {
      let e = this.trackers.get(f.id);
      if (e === undefined) {
        e = { tracker: new MotionTracker(this.cfg), lastT: Number.NEGATIVE_INFINITY };
        this.trackers.set(f.id, e);
      }
      if (f.last.t !== e.lastT) {
        e.tracker.push(f.last);
        e.lastT = f.last.t;
      }
      e.tracker.tick(nowMs);
      return e.tracker.current === "MOVING";
    });
  }
}
