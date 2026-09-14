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

describe("IN2 — IN8: two touchpoints on the SAME object", () => {
  it("⭐⭐ the second hit on an already-held object is IGNORED", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    const second = r.press(2, at(110, 110), CUBE);
    expect(second.role).toBe("IGNORED");
  });

  it("⛔⛔ an IGNORED pointer does not CARRY the object it landed on", () => {
    // ⚠ So no rule can reach the object through it and act anyway. A null here is the
    // difference between a decision and a comment about a decision.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    expect(r.press(2, at(110, 110), CUBE).object).toBeNull();
    expect(r.objects()).toHaveLength(1);
  });

  it("⛔⛔ a press on a DIFFERENT object is NOT ignored — 6bis must stay reachable", () => {
    // ⛔ THE NEGATIVE THAT STOPS THE DECISION BEING OVER-APPLIED. "Ignore the second
    // hit" is not "ignore the second finger": two fingers on two objects is the whole
    // of rules 6bis/6ter, and an over-eager read here would delete them silently.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    expect(r.press(2, at(300, 300), CONE).role).toBe("OBJECT");
    expect(r.press(3, at(500, 500), BALL).role).toBe("OBJECT");
    expect(r.objects()).toHaveLength(3);
  });

  it("⛔⛔ IGNORED is latched for LIFE — it does not take over when the holder lifts", () => {
    // ⚠ VISIBLE ON THE DEVICE, AND IT MAY FEEL WRONG: the part stops responding while
    // a finger is still on it. That is the honest consequence of "ignore the second
    // hit", it is the simplest thing that is well defined, and it is what to look at
    // before IN4 builds on it. Recorded as a vector so it cannot change by accident.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    r.release(1);
    expect(r.get(2)!.role).toBe("IGNORED");
    expect(r.objects()).toHaveLength(0); // ⛔ nothing is held, though a finger is down
  });

  it("⛔ an IGNORED pointer stays ignored wherever it slides", () => {
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    r.move(2, at(900, 900, 300), null); // out over empty space
    expect(r.get(2)!.role).toBe("IGNORED");
  });

  it("⛔⛔ releasing an IGNORED pointer reports wasActive=false", () => {
    // ⭐ The caller reads this to decide whether to run the §1.3 release verdict, the
    // flick test and the tap history. An ignored finger never began a gesture, so
    // lifting it must not end one — a stray TAP here would evict a constraint (§1.4).
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    expect(r.release(2)!.wasActive).toBe(false);
    expect(r.release(1)!.wasActive).toBe(true);
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
  it("⛔⛔ activeCount EXCLUDES ignored touchpoints", () => {
    // ⛔ The §4 rule table is written against this number. An ignored finger must not
    // turn a one-touchpoint rule into a two-touchpoint one — which is precisely what a
    // plain `pointers.size` does, and it is the most likely way IN8 gets undone.
    const r = new PointerRouter<typeof CUBE>();
    r.press(1, at(100, 100), CUBE);
    r.press(2, at(110, 110), CUBE);
    expect(r.activeCount).toBe(1);
    expect(r.size).toBe(2); // ⚠ the READOUT still sees both — it must not lie either
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
