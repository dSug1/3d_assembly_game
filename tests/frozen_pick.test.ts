/**
 * GOLDEN VECTORS — **WHICH TOUCH ON A FROZEN BODY IS HANDED OVER AS A MISS.**
 *
 * ⛔⛔⛔ **`D89` (2026-09-25) SWAPS THE TWO TOUCHES, AND EVERY VECTOR BELOW IS THE MIRROR OF ONE
 * THAT STOOD HERE.** `D77` dropped the SECOND touch and spared the FIRST, because `D67` had put
 * the Pioneer on the first. ⭐ `D87` reversed those roles, so the first touch is the useless one
 * now — a held body is the Follower, and a frozen body is refused that role.
 *
 * ⚠ The old vectors are DELETED rather than kept green: a vector whose subject is gone certifies
 * nothing, which is the rule that deleted 41 fork vectors and 16 with `D54`.
 *
 * ⛔ The rule is filtered on the way INTO the router, so these vectors are about one function and
 * the role table is untouched. ⭐ `tests/router.test.ts` already pins what an `OUTSIDE`
 * touchpoint does; this file pins only *what the router is told*.
 */
import { describe, expect, it } from "vitest";
import { pressHit } from "@input/frozen_pick";

const BODY = { id: "plate" };
const PART = { id: "objectA" };

describe("the pick handed to the router", () => {
  it("⛔⛔⛔ `D89` — the FIRST touch on a frozen body arrives as a MISS", () => {
    // ⭐ THE VECTOR THE INVERSION TURNS ON, and it is RED against `D77` as written: holding the
    // plate can no longer align anything (a held body is the FOLLOWER since `D87`, and a frozen
    // body is refused that role), so that finger is handed to the camera instead.
    expect(pressHit(BODY, true)).toBeNull();
  });

  it("⛔⛔⛔ `D119` — and every LATER touch is a MISS too: the second finger steers over the plate", () => {
    // > *"I need to be able to press second touch on top of a frozen object to control the follower
    // > object gravity translation / roll … without triggering a new alignment"* — the owner.
    // ⛔ RED against `D89`, which kept these hits so the plate could be PRESSED as a Pioneer. ⭐ A TAP
    // on it still aligns — resolved at the release, not here.
    expect(pressHit(BODY, true)).toBeNull();
    // ⛔ The third and fourth finger too. ⚠ `D77` refused these on the argument that *a hand
    // resting on the plate does not stop resting on it at the third touchpoint*; inverted, they
    // are all presses that can select a Pioneer, and refusing them would put the plate out of
    // reach for any hand already using two fingers.
    expect(pressHit(BODY, true)).toBeNull();
    expect(pressHit(BODY, true)).toBeNull();
  });

  it("⛔ an unfrozen body is never filtered, at any touchpoint count", () => {
    expect(pressHit(PART, false)).toBe(PART);
  });

  it("a miss stays a miss", () => {
    expect(pressHit(null, false)).toBeNull();
    expect(pressHit(null, true)).toBeNull();
  });

  it("⭐ `D119`: only the frozen flag decides — the count no longer does", () => {
    // ⚠ Without this, a fixture that only ever varied one of them would pass against an
    // implementation that ignored the other: the frozen flag alone, or the count alone.
    expect(pressHit(BODY, true)).toBeNull();
    expect(pressHit(BODY, false)).toBe(BODY);
    expect(pressHit(BODY, true)).toBeNull();
    expect(pressHit(BODY, false)).toBe(BODY);
  });

  it("⛔⛔ THE FUCHSIA EXCEPTION IS DELETED WITH `D89` — the function takes three arguments", () => {
    // ⭐ It existed only to widen the SECOND touch, which is now admitted outright, so keeping it
    // would be a parameter nothing can reach — the dormant-fork shape `D28` and `D40` refused.
    // ⚠ Pinned as an arity, because a stale fourth argument would be silently ignored by JS.
    expect(pressHit.length).toBe(2);
  });
});
