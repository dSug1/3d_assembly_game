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
 * ⛔⛔ THE SECOND HIT ON A HELD OBJECT IS `PINCH`, NOT `IGNORED` — amendment **A5**
 * (`D16`, 2026-09-15), which SUPERSEDES `D10`. Two touchpoints on the same object were
 * *undefined and reachable* (§5); the owner first chose **ignore the second hit**
 * (2026-09-14) and then, after a device pass, gave the configuration a meaning: the two
 * fingers are a **horizontal DEPTH PINCH** on that object.
 * ⚠ *Some other touchpoint* — a press on a DIFFERENT object is rule 6bis/6ter and must
 * stay reachable. This is about a second finger on the SAME object.
 *
 * ⭐ IT REMOVED A DEAD END. Under `D10` the part stopped responding while a finger was
 * still on it — the honest consequence of ignoring the second hit, judged on the glass and
 * accepted as the least-bad option. Now lifting one of the two simply returns to
 * one-touchpoint rotation.
 *
 * ⛔⛔ `IGNORED` SURVIVES, WITH ITS TRIGGER MOVED TO THE **THIRD** TOUCHPOINT. A third
 * finger on the same object has no meaning and must not turn a two-touchpoint rule into a
 * three-touchpoint one. ⚠ `IGNORED` is still latched for life, including across the
 * holder's release: it was ignored at press and stays ignored until it lifts.
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
 * * `PINCH` — it hit an object ONE other touchpoint already holds. Together they are
 *   amendment A5's depth pinch, so it CARRIES that object — unlike `IGNORED`.
 * * `IGNORED` — a THIRD or later touchpoint on an object already held and already
 *   pinched. Inert, and deliberately does not carry the object.
 */
export type PointerRole = "OBJECT" | "OUTSIDE" | "PINCH" | "IGNORED";

export interface RoutedPointer<O> {
  readonly id: number;
  /** ⛔ Latched at press. Never recomputed — see the header. */
  readonly role: PointerRole;
  /**
   * The object this touchpoint holds, or `null`. ⛔ Also latched: it is the object hit
   * AT PRESS, not whatever is under the finger now.
   * ⚠ Non-null for `OBJECT` and `PINCH` — A5's rule needs to find the pair. ⛔ An
   * `IGNORED` pointer deliberately does NOT carry the object it landed on, so no rule can
   * reach it through this and quietly act anyway.
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
   * ⛔ `false` for `IGNORED` **and for `PINCH`**. The caller must not run the §1.3
   * release verdict, the flick test or the tap history for either — neither began a
   * gesture of its own to end.
   * ⚠ A `PINCH` release still MATTERS: it ends the pinch, exactly as lifting one of two
   * fingers ends the camera pinch. It simply is not a §1.3 gesture, and conflating "it
   * did something" with "it ran a recognizer" is how a stray flick gets attributed to a
   * finger that never held anything.
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
    } else if (!this.isHeld(hit)) {
      role = "OBJECT";
      object = hit;
    } else if (!this.isPinched(hit)) {
      // ⭐ A5: the SECOND hit on a held object. It joins the holder as a depth pinch and
      // carries the object, because the rule has to find the pair.
      role = "PINCH";
      object = hit;
    } else {
      // ⛔ A THIRD finger on the same object. No meaning, and it must not turn a
      // two-touchpoint rule into a three-touchpoint one.
      role = "IGNORED";
      object = null;
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
    return { pointer: p, wasActive: p.role === "OBJECT" || p.role === "OUTSIDE" };
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

  /** Second-finger touchpoints pinching an object (A5), in press order. */
  pinches(): readonly RoutedPointer<O>[] {
    return this.withRole("PINCH");
  }

  /**
   * ⭐ A5's question: is some touchpoint pinching `o` alongside its holder?
   * ⛔ Returns the PARTNER, not a boolean, because the rule needs its samples — and a
   * boolean would send the caller back to `all()` to find it, which is where an
   * index-based lookup would creep back in.
   */
  pinchPartner(o: O): RoutedPointer<O> | null {
    for (const p of this.all()) if (p.role === "PINCH" && p.object === o) return p;
    return null;
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

  /** Is some LIVE touchpoint already holding this object? */
  private isHeld(o: O): boolean {
    for (const p of this.pointers.values()) {
      if (p.role === "OBJECT" && p.object === o) return true;
    }
    return false;
  }

  /** Does this object already have its ONE pinch partner? A5 allows exactly one. */
  private isPinched(o: O): boolean {
    for (const p of this.pointers.values()) {
      if (p.role === "PINCH" && p.object === o) return true;
    }
    return false;
  }
}
