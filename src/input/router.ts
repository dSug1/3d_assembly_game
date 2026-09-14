/**
 * `IN2` — POINTER PLUMBING. Which touchpoint is doing what, and for how long.
 *
 * ⭐⭐ IT OWNS EXACTLY ONE THING: the ROLE of each live touchpoint. It does not run a
 * rule, move an object or touch the camera. Rules read the roles it publishes.
 *
 * ⛔⛔ A ROLE IS LATCHED AT PRESS AND NEVER REVISITED (§4).
 * *"When the second touchpoint goes down, its role is fixed for the lifetime of the
 * gesture."* A finger that presses on a part and slides off is still holding that part;
 * a finger that presses on empty space and slides onto a part is still an anchor.
 * ⚠ Without the latch a user steadying their grip near the part they are moving would
 * silently switch between two different translation mappings mid-gesture — which is
 * unfixable from the user's side, because nothing on screen says it happened.
 *
 * ⛔⛔ THE THIRD ROLE IS `IGNORED`, and it is the `IN8` decision (§5).
 * Two touchpoints on the SAME object was *undefined and reachable*; the owner chose
 * **ignore the second hit** on 2026-09-14. So a press landing on an object some other
 * touchpoint is already holding takes the role `IGNORED` and never does anything.
 * ⚠ *Some other touchpoint* — a press on a DIFFERENT object is rule 6bis and must stay
 * reachable. "Ignore the second hit" is not "ignore the second finger".
 *
 * ⛔ AND `IGNORED` IS LATCHED LIKE THE OTHERS — including across the holder's release.
 * Lift the finger that was holding the part and the ignored one does NOT take over: it
 * was ignored at press, and it stays ignored until it lifts. ⚠ THIS IS VISIBLE AND MAY
 * FEEL WRONG — the part stops responding while a finger is still on it. It is the
 * honest consequence of the decision, it is the simplest thing that is well defined,
 * and it is the thing to look at on the device before `IN4` builds on it.
 *
 * ⛔ RELEASING AN IGNORED TOUCHPOINT RUNS NOTHING — no release verdict, no flick test,
 * no tap history. ⚠ It is the OPPOSITE of the pinch, where lifting one of two fingers
 * ends the gesture, and the two live three lines apart in the caller.
 *
 * ⭐ ORDER-INDEPENDENCE IS §0's REQUIREMENT, IN ITS OWN WORDS: *"when a touchpoint is
 * released, the other touchpoint keeps tracking the other object independently of the
 * order in which the touchpoints were being pressed."* Every binding here is keyed by
 * POINTER ID, never by position in a list — an index-based scheme reads identically in
 * the common case and hands the wrong object over on one of the two release orders.
 *
 * ⛔ ENGINE-FREE. It is generic over an opaque object handle `O`, so `src/render` can
 * pass a mesh without this file knowing what a mesh is. `tests/boundary.test.ts`.
 */
import type { Sample } from "./motion";

/**
 * What a touchpoint is for, decided once at press.
 *
 * * `OBJECT` — it hit an object nothing else was holding. It carries that object.
 * * `OUTSIDE` — it hit no object. Camera rules (§2 rule 1, rule 4) and the anchor of
 *   rule 6.
 * * `IGNORED` — it hit an object another touchpoint already holds (`IN8`). Inert.
 */
export type PointerRole = "OBJECT" | "OUTSIDE" | "IGNORED";

export interface RoutedPointer<O> {
  readonly id: number;
  /** ⛔ Latched at press. Never recomputed — see the header. */
  readonly role: PointerRole;
  /**
   * The object this touchpoint holds, or `null`. ⛔ Also latched: it is the object hit
   * AT PRESS, not whatever is under the finger now.
   * ⚠ Non-null ONLY for `OBJECT`. An `IGNORED` pointer deliberately does not carry the
   * object it landed on, so no rule can reach it through this and quietly act anyway.
   */
  readonly object: O | null;
  /** The press sample, kept so a rule can measure against the start of the gesture. */
  readonly pressed: Sample;
  /** The most recent sample. */
  readonly last: Sample;
  /**
   * Press order, monotone for the life of the router. ⭐ The ONLY ordering anyone gets,
   * and it is explicit: `Map` iteration order is insertion order and would *look* like
   * press order right up until an id is reused.
   */
  readonly seq: number;
}

/** What `release` reports, so the caller knows whether to run a release verdict. */
export interface ReleasedPointer<O> {
  readonly pointer: RoutedPointer<O>;
  /**
   * ⛔ `false` for `IGNORED`. The caller must not run the §1.3 release verdict, the
   * flick test or the tap history for it — it never began a gesture to end.
   */
  readonly wasActive: boolean;
}

export class PointerRouter<O> {
  private readonly pointers = new Map<number, RoutedPointer<O>>();
  private nextSeq = 0;

  /**
   * Latch a role for a new touchpoint.
   *
   * @param hit the object under the finger at press, or `null` for a miss. ⚠ The
   *   caller raycasts; this file has no idea what a ray is.
   */
  press(id: number, s: Sample, hit: O | null): RoutedPointer<O> {
    // ⛔ An id already down is a bug in the caller, not a second gesture. Browsers do
    // reuse ids, but only AFTER a release — so treat this as a fresh press and drop the
    // stale latch rather than keeping two records under one id.
    this.pointers.delete(id);

    let role: PointerRole;
    let object: O | null;
    if (hit === null) {
      role = "OUTSIDE";
      object = null;
    } else if (this.isHeld(hit)) {
      // ⭐ `IN8`: the second hit on an object that is already held. Ignored, and it does
      // NOT carry the object — see `RoutedPointer.object`.
      role = "IGNORED";
      object = null;
    } else {
      role = "OBJECT";
      object = hit;
    }

    const p: RoutedPointer<O> = {
      id,
      role,
      object,
      pressed: s,
      last: s,
      seq: this.nextSeq++,
    };
    this.pointers.set(id, p);
    return p;
  }

  /**
   * Record movement. ⛔ It updates `last` and NOTHING ELSE.
   *
   * @param hitNow what is under the finger RIGHT NOW — ⛔⛔ ACCEPTED AND DELIBERATELY
   *   DISCARDED. It is in the signature precisely so that the latch is a property the
   *   vectors can DISPROVE: without it, "the role does not follow the finger" would be
   *   true only because the information was never passed in, and a test that cannot
   *   fail is not a test. The caller already has this value — it picks on every move —
   *   so handing it over and watching it be ignored is free, and it says at the call
   *   site that ignoring it is a decision rather than an oversight.
   * @returns the pointer, or `null` if the id is not down (a move for a released or
   *   never-pressed id is ignored rather than throwing: the browser can deliver one).
   */
  move(id: number, s: Sample, hitNow?: O | null): RoutedPointer<O> | null {
    void hitNow; // ⛔ READ AND THROWN AWAY, ON PURPOSE. See the parameter's doc.
    const p = this.pointers.get(id);
    if (!p) return null;
    const next: RoutedPointer<O> = { ...p, last: s };
    this.pointers.set(id, next);
    return next;
  }

  /**
   * Take a touchpoint down. ⚠ Returns `null` for an unknown id rather than throwing —
   * a stray `pointerup` (a cancel, a lost capture) must not take the scene down.
   */
  release(id: number): ReleasedPointer<O> | null {
    const p = this.pointers.get(id);
    if (!p) return null;
    this.pointers.delete(id);
    return { pointer: p, wasActive: p.role !== "IGNORED" };
  }

  /** ⚠ Everything goes. For a pointercancel storm, or a scene reset. */
  clear(): void {
    this.pointers.clear();
  }

  get(id: number): RoutedPointer<O> | undefined {
    return this.pointers.get(id);
  }

  /** Every live touchpoint, `IGNORED` included, in PRESS order. */
  all(): readonly RoutedPointer<O>[] {
    return [...this.pointers.values()].sort((a, b) => a.seq - b.seq);
  }

  /** Live touchpoints with this role, in PRESS order. */
  withRole(role: PointerRole): readonly RoutedPointer<O>[] {
    return this.all().filter((p) => p.role === role);
  }

  /**
   * Touchpoints holding an object, in press order. ⭐ §0's tracking requirement reads
   * off this: each entry carries its OWN object, so releasing one cannot re-point the
   * other, in either release order.
   */
  objects(): readonly RoutedPointer<O>[] {
    return this.withRole("OBJECT");
  }

  /** Touchpoints that hit nothing, in press order. Camera rules and rule 6's anchor. */
  outside(): readonly RoutedPointer<O>[] {
    return this.withRole("OUTSIDE");
  }

  /**
   * ⭐ How many touchpoints a RULE can see — `IGNORED` excluded.
   * ⛔ The count the §4 rule table is written against. An ignored finger must not turn
   * a one-touchpoint rule into a two-touchpoint one, which is exactly what a plain
   * `pointers.size` would do.
   */
  get activeCount(): number {
    return this.all().filter((p) => p.role !== "IGNORED").length;
  }

  /** Every live touchpoint, ignored ones included. For the readout, not for rules. */
  get size(): number {
    return this.pointers.size;
  }

  /** Is some LIVE touchpoint already holding this object? `IN8`'s question. */
  private isHeld(o: O): boolean {
    for (const p of this.pointers.values()) {
      if (p.role === "OBJECT" && p.object === o) return true;
    }
    return false;
  }
}
