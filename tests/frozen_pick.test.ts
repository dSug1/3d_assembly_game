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
    expect(pressHit(BODY, true, 0)).toBeNull();
  });

  it("⭐⭐ and every LATER touch keeps its hit — that is the press that names a Pioneer", () => {
    expect(pressHit(BODY, true, 1)).toBe(BODY);
    // ⛔ The third and fourth finger too. ⚠ `D77` refused these on the argument that *a hand
    // resting on the plate does not stop resting on it at the third touchpoint*; inverted, they
    // are all presses that can select a Pioneer, and refusing them would put the plate out of
    // reach for any hand already using two fingers.
    expect(pressHit(BODY, true, 2)).toBe(BODY);
    expect(pressHit(BODY, true, 7)).toBe(BODY);
  });

  it("⛔ an unfrozen body is never filtered, at any touchpoint count", () => {
    for (const n of [0, 1, 2, 5]) expect(pressHit(PART, false, n)).toBe(PART);
  });

  it("a miss stays a miss", () => {
    expect(pressHit(null, false, 0)).toBeNull();
    expect(pressHit(null, true, 3)).toBeNull();
  });

  it("⛔ a nonsense count leaves the pick ALONE — dropping one is the change of behaviour", () => {
    expect(pressHit(BODY, true, Number.NaN)).toBe(BODY);
    expect(pressHit(BODY, true, -1)).toBe(BODY);
    // ⚠ RED against the bare `count > 0`, which reads every nonsense count as a first touch and
    // therefore DROPS it — the aggressive direction, and the opposite of what this rule wants.
    expect(pressHit(BODY, true, Number.NEGATIVE_INFINITY)).toBe(BODY);
  });

  it("⭐ the two arguments are independent — neither alone decides", () => {
    // ⚠ Without this, a fixture that only ever varied one of them would pass against an
    // implementation that ignored the other: the frozen flag alone, or the count alone.
    expect(pressHit(BODY, true, 0)).toBeNull();
    expect(pressHit(BODY, false, 0)).toBe(BODY);
    expect(pressHit(BODY, true, 1)).toBe(BODY);
    expect(pressHit(BODY, false, 1)).toBe(BODY);
  });

  it("⛔⛔ THE FUCHSIA EXCEPTION IS DELETED WITH `D89` — the function takes three arguments", () => {
    // ⭐ It existed only to widen the SECOND touch, which is now admitted outright, so keeping it
    // would be a parameter nothing can reach — the dormant-fork shape `D28` and `D40` refused.
    // ⚠ Pinned as an arity, because a stale fourth argument would be silently ignored by JS.
    expect(pressHit.length).toBe(3);
  });
});
