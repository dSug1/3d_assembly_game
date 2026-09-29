/**
 * GOLDEN VECTORS — **`D162`**: a pressed aligned part shows its PioneerFace in amber (the owner, 2026-09-29).
 */
import { describe, expect, it } from "vitest";
import { faceKey, hitFaceShown, pressedPioneerFaceKeys } from "@input/pioneer_press";

const links: Record<string, { objectId: string; faceId: string }> = {
  A: { objectId: "B", faceId: "f3" },
  C: { objectId: "B", faceId: "f1" },
};
const pioneerOf = (f: string) => links[f] ?? null;

describe("⭐⭐ `D162` — which Pioneer faces a press fills amber", () => {
  it("⭐ a pressed aligned part names its own Pioneer face — and only that one", () => {
    expect([...pressedPioneerFaceKeys(["A"], pioneerOf)]).toEqual(["B/f3"]);
  });

  it("⛔ nothing pressed, or a pressed part aligned to nothing: no fill — the contour alone, as before", () => {
    expect(pressedPioneerFaceKeys([], pioneerOf).size).toBe(0);
    expect(pressedPioneerFaceKeys(["B", "D"], pioneerOf).size).toBe(0);
  });

  it("⭐ two pressed Followers on one Pioneer: both of its faces; a face named twice appears once", () => {
    expect([...pressedPioneerFaceKeys(["A", "C"], pioneerOf)].sort()).toEqual(["B/f1", "B/f3"]);
    expect([...pressedPioneerFaceKeys(["A", "A"], pioneerOf)]).toEqual(["B/f3"]);
    expect(faceKey("B", "f3")).toBe("B/f3");
  });
});

describe("⭐⭐ `D163` — the HitFace's fuchsia contour on an ALIGNED part, when latched", () => {
  it("⭐ a free part: always shown, latched or pressed — as before", () => {
    expect(hitFaceShown(false, false)).toBe(true);
    expect(hitFaceShown(false, true)).toBe(true);
  });
  it("⭐⭐ an aligned part: shown while LATCHED — ⛔ RED against the build before, which never showed it", () => {
    expect(hitFaceShown(true, true)).toBe(true);
  });
  it("⛔ an aligned part merely pressed: not shown, as before", () => {
    expect(hitFaceShown(true, false)).toBe(false);
  });
});
