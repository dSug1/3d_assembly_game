/**
 * GOLDEN VECTORS — `IN2` pointer plumbing.
 *
 * ⭐ Every vector here is a property nobody can see on a device without knowing to look
 * for it. A role latch that quietly re-decides itself looks like "the app is glitchy";
 * an index-based binding looks correct until the fingers come off in the other order.
 * ⛔ The four negatives are the point: the router is judged on what it REFUSES to do.
 */
import { describe, expect, it } from "vitest";
import { PointerRouter } from "../src/input/router";
import type { Sample } from "../src/input/motion";

const at = (x: number, y: number, t = 0): Sample => ({ x, y, t });

/** Opaque object handles. The router must never look inside one. */
const CUBE = { name: "cube" };
const CONE = { name: "cone" };
const BALL = { name: "ball" };

describe("IN2 — roles are latched at press (§4)", () => {
  it("⛔ a finger that presses ON an object and slides OFF still holds it", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.move(1, at(900, 900, 200), null); // ⭐ told it is over NOTHING, and must not care
    expect(r.get(1)!.role).toBe("OBJECT");
    expect(r.get(1)!.object).toBe(CUBE);
  });

  it("⛔ a finger that presses on NOTHING and slides ONTO an object stays OUTSIDE", () => {
    // ⚠ The anchor case from §4, and the reason the latch exists at all: steadying a
    // grip near the part being moved must not switch the translation mapping.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(10, 10), null);
    r.move(1, at(100, 100, 200), CUBE); // ⭐ told it is over the cube, and must not care
    expect(r.get(1)!.role).toBe("OUTSIDE");
    expect(r.get(1)!.object).toBeNull();
  });

  it("move records position and NOTHING else", () => {
    const r = new PointerRouter<typeof CUBE>();
    const pressed = r.press(1, at(10, 20, 5), CUBE);
    const moved = r.move(1, at(30, 40, 9))!;
    expect(moved.last).toEqual(at(30, 40, 9));
    expect(moved.pressed).toEqual(pressed.pressed); // ⭐ the gesture's origin survives
    expect(moved.role).toBe(pressed.role);
    expect(moved.seq).toBe(pressed.seq);
  });
});

describe("IN2 — §0 order-independence", () => {
  // ⛔⛔ §0, IN ITS OWN WORDS: "when a touchpoint is released, the other touchpoint keeps
  // tracking the other object INDEPENDENTLY OF THE ORDER in which the touchpoints were
  // being pressed." Both orders are vectors because an index-based binding passes one
  // of them — which is exactly how this defect would ship.
  it("⭐⭐ releasing the FIRST leaves the second on its own object", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(300, 300), CONE);
    r.release(1);
    expect(r.objects()).toHaveLength(1);
    expect(r.objects()[0]!.object).toBe(CONE);
    expect(r.objects()[0]!.id).toBe(2);
  });

  it("⭐⭐ releasing the SECOND leaves the first on its own object", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(300, 300), CONE);
    r.release(2);
    expect(r.objects()).toHaveLength(1);
    expect(r.objects()[0]!.object).toBe(CUBE);
    expect(r.objects()[0]!.id).toBe(1);
  });

  it("⭐ press order is explicit, and survives a release in the middle", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(7, at(10, 10), CUBE);
    r.press(3, at(20, 20), null);
    r.press(5, at(30, 30), CONE);
    r.release(3);
    // ⚠ Ids descend and ascend; only `seq` is press order. A `Map`'s insertion order
    // would agree here and disagree the moment an id is reused.
    expect(r.all().map((p) => p.id)).toEqual([7, 5]);
  });
});

describe("IN2 — two touchpoints on the SAME object: the SECOND role", () => {
  // ⭐⭐ THIS BLOCK WAS WRITTEN AGAINST `D10` ("ignore the second hit") AND IS NOW WRITTEN
  // AGAINST `D16`. The owner reversed the decision after a device pass, and the vectors
  // follow the decision — that is the point of keeping them small and explicit.
  // ⚠ The ROLE was briefly called `PINCH`, after A5's depth pinch. **A6 replaced that
  // gesture** and the role was renamed for what it IS rather than for what consumed it: a
  // name borrowed from a consumer goes stale the moment the consumer changes.
  // ⚠ The negatives survive unchanged, because they were never about which role the second
  // finger takes: a press on a DIFFERENT object must stay reachable either way.

  it("⭐⭐ the second hit on an already-held object is a SECOND, not ignored", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    const second = r.press(2, at(110, 110), CUBE);
    expect(second.role).toBe("SECOND");
  });

  it("⭐ a SECOND pointer DOES carry the object — a rule has to find the pair", () => {
    // ⛔ The opposite of IGNORED, deliberately, and the difference is load-bearing:
    // A5 needs both samples and the object; an ignored finger must be unreachable.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    expect(r.press(2, at(110, 110), CUBE).object).toBe(CUBE);
    expect(r.secondTouchOn(CUBE)!.id).toBe(2);
  });

  it("⛔ …but it is NOT in objects() — that list means DISTINCT held objects", () => {
    // ⛔⛔ THE TRAP THIS VECTOR EXISTS FOR. If the second finger had been given the role
    // OBJECT, `objects()` would report two entries for ONE object — and rules 5, 6bis and
    // 6ter all read that list as "two DIFFERENT objects". They would fire on a single
    // pinched part, silently.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    expect(r.objects()).toHaveLength(1);
    expect(r.seconds()).toHaveLength(1);
  });

  it("⛔⛔ the THIRD finger on the same object IS ignored — exactly one second is allowed", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    const third = r.press(3, at(120, 120), CUBE);
    expect(third.role).toBe("IGNORED");
    expect(third.object).toBeNull();
    expect(r.seconds()).toHaveLength(1);
  });

  it("⛔⛔ a press on a DIFFERENT object takes OBJECT — 6bis/6ter stay reachable", () => {
    // ⛔ THE NEGATIVE THAT STOPS THE DECISION BEING OVER-APPLIED. A5 is about a second
    // finger on the SAME object: two fingers on two objects is the whole of rules
    // 6bis/6ter, and an over-eager read here would delete them silently.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    expect(r.press(2, at(300, 300), CONE).role).toBe("OBJECT");
    expect(r.press(3, at(500, 500), BALL).role).toBe("OBJECT");
    expect(r.objects()).toHaveLength(3);
    expect(r.seconds()).toHaveLength(0);
  });

  it("⭐⭐ lifting the HOLDER does not promote the second — the role is latched for life", () => {
    // ⚠ Under `D10` this was the accepted-but-disliked behaviour: the part stopped
    // responding while a finger was still on it. The role is still latched for life — a
    // PINCH does not get promoted to OBJECT — but the configuration now has a meaning
    // while both fingers are down, which is what removed the dead end.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    r.release(1);
    expect(r.get(2)!.role).toBe("SECOND");
    expect(r.objects()).toHaveLength(0);
  });

  it("⛔ a SECOND pointer stays a SECOND wherever it slides", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    r.move(2, at(900, 900, 300), null); // out over empty space
    expect(r.get(2)!.role).toBe("SECOND");
  });

  it("⛔⛔ releasing a SECOND reports wasActive=false — it ran no gesture of its own", () => {
    // ⭐ The caller reads this to decide whether to run the §1.3 release verdict, the
    // flick test and the tap history. A pinch partner never began one, so lifting it must
    // not end one — a stray TAP here would evict a constraint (§1.4).
    // ⚠ It does NOT mean the release is uninteresting: it ends the pinch, exactly as
    // lifting one of two fingers ends the camera pinch.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    expect(r.release(2)!.wasActive).toBe(false);
    expect(r.release(1)!.wasActive).toBe(true);
  });

  it("⛔ releasing an IGNORED third finger also reports wasActive=false", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    r.press(3, at(120, 120), CUBE);
    expect(r.release(3)!.wasActive).toBe(false);
  });

  it("⭐ once the holder is gone, a NEW press on that object holds it", () => {
    // The latch is per touchpoint, not a lock on the object.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.release(1);
    expect(r.press(2, at(100, 100), CUBE).role).toBe("OBJECT");
  });
});

describe("IN2 — what the rules are allowed to count", () => {
  it("⛔⛔ activeCount EXCLUDES ignored touchpoints but COUNTS a second touchpoint", () => {
    // ⛔ The §4 rule table is written against this number, and `D16` changed what belongs
    // in it: a SECOND touchpoint is one a RULE CAN SEE, so it counts. A third finger on the
    // same object cannot be seen by any rule, so it does not.
    // ⚠ This is what keeps the eviction shake (A4) off while a two-finger rule is running —
    // it is gated on `activeCount === 1`.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    expect(r.activeCount).toBe(2);
    r.press(3, at(120, 120), CUBE); // ignored
    expect(r.activeCount).toBe(2);
    expect(r.size).toBe(3); // ⚠ the READOUT still sees all three — it must not lie either
  });

  it("outside() and objects() are disjoint and ordered by press", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(4, at(10, 10), null);
    r.press(1, at(20, 20), CUBE);
    r.press(9, at(30, 30), null);
    expect(r.outside().map((p) => p.id)).toEqual([4, 9]);
    expect(r.objects().map((p) => p.id)).toEqual([1]);
  });
});

describe("IN2 — the stray events a browser really sends", () => {
  it("⛔ a move for an unknown id is ignored, not a throw", () => {
    const r = new PointerRouter<typeof CUBE>();
    expect(r.move(99, at(1, 1))).toBeNull();
  });

  it("⛔ a release for an unknown id is ignored, not a throw", () => {
    // ⚠ Happens for real: a cancel, a lost capture, a pointerup after the page is
    // re-entered. It must not take the scene down.
    const r = new PointerRouter<typeof CUBE>();
    expect(r.release(99)).toBeNull();
  });

  it("⛔⛔ a REUSED pointer id does not inherit the old latch", () => {
    // ⚠ Browsers recycle pointer ids aggressively. If the stale record survived, the
    // new finger would hold an object it never touched — and `seq` would be wrong, so
    // press order would silently rot too.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.release(1);
    const reused = r.press(1, at(10, 10), null);
    expect(reused.role).toBe("OUTSIDE");
    expect(reused.object).toBeNull();
    expect(reused.seq).toBeGreaterThan(0);
    expect(r.size).toBe(1);
  });

  it("⛔⛔ a press for an id that is ALREADY DOWN replaces it, never stacks", () => {
    // ⚠ Without this the stale latch survives under the same id and the router holds
    // two records for one finger — the second of which nothing will ever release.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    const again = r.press(1, at(10, 10), null); // no intervening release
    expect(again.role).toBe("OUTSIDE");
    expect(again.object).toBeNull();
    expect(r.size).toBe(1);
    expect(r.objects()).toHaveLength(0);
  });

  it("clear() drops everything", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(1, 1), CUBE);
    r.press(2, at(2, 2), null);
    r.clear();
    expect(r.size).toBe(0);
    expect(r.activeCount).toBe(0);
  });
});

/**
 * ⛔⛔ **THE `relatchOnOrphan` VECTORS ARE DELETED WITH THE RULE (`D54`, 2026-09-18).**
 *
 * ⚠ They pinned `IN2`'s **only** exception to the latch: `A15` dropped a holder whose object
 * had slid off its finger, and `relatchOnOrphan` re-resolved that pointer's role on the spot.
 * ⭐ The owner retired the unselect — *"first touch can continue controlling the object"* — so
 * there is no orphan, nothing to re-latch, and §4's *a role is latched at press for the
 * touchpoint's lifetime* holds without qualification again.
 * ⛔ A vector whose subject is gone passes while describing the wrong product, which is why
 * these went rather than being kept green.
 */
