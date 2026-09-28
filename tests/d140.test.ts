/**
 * GOLDEN VECTORS — **`D140`: only the LIVE couple's cursor may snap** (the owner, 2026-09-28: a Follower
 * seated on a first Pioneer, re-aligned by another face to a second, jumped — *"much more than 10 mm"* —
 * and seated there at once).
 */
import { describe, expect, it } from "vitest";
import { coupleKey, cursorIsLive, type AlignmentCouple } from "@core/pioneer_face_cursors";

const couple = (followerFaceId: string, pioneerId: string, pioneerFaceId: string): AlignmentCouple => ({
  followerId: "F",
  followerFaceId,
  pioneerId,
  pioneerFaceId,
});

describe("⭐⭐⭐ `D140` — cursorIsLive", () => {
  const first = couple("fA", "P1", "p1");
  const second = couple("fB", "P2", "p2");

  it("⛔ the OLD cursor after a re-alignment is NOT live — the owner's case (RED: it snapped, then retargeted)", () => {
    expect(cursorIsLive(first, second)).toBe(false);
  });

  it("⭐ the live couple's own cursor is live", () => {
    expect(cursorIsLive(second, second)).toBe(true);
    expect(cursorIsLive(first, { ...first })).toBe(true);
  });

  it("⛔ one term different is a different couple — the same Pioneer by another face, or another Pioneer by the same face", () => {
    expect(cursorIsLive(first, couple("fB", "P1", "p1"))).toBe(false);
    expect(cursorIsLive(first, couple("fA", "P1", "p9"))).toBe(false);
    expect(cursorIsLive(first, couple("fA", "P2", "p1"))).toBe(false);
  });

  it("⛔ a body no longer aligned has no live cursor", () => {
    expect(cursorIsLive(first, null)).toBe(false);
  });

  it("the test is the couple KEY — the one identity the cursors are kept by", () => {
    expect(coupleKey(first)).not.toBe(coupleKey(second));
  });
});
