/**
 * GOLDEN VECTORS — **A SECOND TOUCH ON A FROZEN BODY IS A MISS** (the owner, 2026-09-23).
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
  it("⭐⭐ a SECOND touch on a frozen body arrives as a miss", () => {
    expect(pressHit(BODY, true, 1)).toBeNull();
    // ⛔ And the third and fourth finger too — a hand resting on the plate does not stop
    // resting on it at the third touchpoint.
    expect(pressHit(BODY, true, 2)).toBeNull();
    expect(pressHit(BODY, true, 7)).toBeNull();
  });

  it("⛔ the FIRST touch on a frozen body still hits it — a plate can be a Pioneer", () => {
    // ⚠ `D67` makes *hold the plate FIRST* the way to align a part to it, so filtering this
    // one would delete the base plate from the alignment model.
    expect(pressHit(BODY, true, 0)).toBe(BODY);
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
  });

  it("⭐ the two arguments are independent — neither alone decides", () => {
    // ⚠ Without this, a fixture that only ever varied one of them would pass against an
    // implementation that ignored the other: the frozen flag alone, or the count alone.
    expect(pressHit(BODY, true, 1)).toBeNull();
    expect(pressHit(BODY, false, 1)).toBe(BODY);
    expect(pressHit(BODY, true, 0)).toBe(BODY);
    expect(pressHit(BODY, false, 0)).toBe(BODY);
  });
});

/**
 * GOLDEN VECTORS — **AN OFFERED FACE IS PRESSABLE, EVEN ON A FROZEN BODY** (2026-09-24).
 *
 * > *"frozen object fuchsia face is not responsive to touch and nothing happens"* — the owner
 */
describe("⭐⭐⭐ pressHit — the fuchsia exception to `D77`", () => {
  it("⛔⛔⛔ AN OFFERED FACE KEEPS THE PICK, where `D77` alone would drop it", () => {
    // ⭐ THE VECTOR THE FIX EXISTS FOR: frozen body, second touch — a miss under `D77`, a hit
    // when the product is currently highlighting that face as a Pioneer candidate.
    expect(pressHit("plate", true, 1, true)).toBe("plate");
    expect(pressHit("plate", true, 1, false)).toBeNull();
  });

  it("⛔⛔ AND `D77` IS OTHERWISE UNTOUCHED — a finger landing anywhere else still misses", () => {
    // ⚠ RED against *frozen bodies are now pressable*: the exception must be as narrow as the
    // offer, or the owner's *"this second touch could move another object"* is silently deleted.
    expect(pressHit("plate", true, 1)).toBeNull();
    expect(pressHit("plate", true, 3)).toBeNull();
  });

  it("⭐ the FIRST touch on a frozen body is unaffected either way — it always kept its hit", () => {
    expect(pressHit("plate", true, 0, false)).toBe("plate");
    expect(pressHit("plate", true, 0, true)).toBe("plate");
  });

  it("⛔ and an offer cannot conjure a hit out of nothing", () => {
    // ⚠ The flag widens which HITS survive; it must never invent one where the ray found none.
    expect(pressHit(null, true, 1, true)).toBeNull();
    expect(pressHit(null, false, 0, true)).toBeNull();
  });

  it("⭐ a body that is not frozen is unchanged by the flag", () => {
    expect(pressHit("part", false, 2, false)).toBe("part");
    expect(pressHit("part", false, 2, true)).toBe("part");
  });
});
