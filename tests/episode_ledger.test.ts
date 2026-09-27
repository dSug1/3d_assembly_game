/**
 * GOLDEN VECTORS — **`D112`: the touchpoint episode ledger** — `SCORE.md` §3's exclusions, and the
 * undo pair costing ONE (`D111`).
 */
import { describe, expect, it } from "vitest";
import { episodeCounts, formatElapsed, type EpisodeFacts } from "@input/episode_ledger";

const f = (o: Partial<EpisodeFacts>): EpisodeFacts => ({
  role: "OBJECT",
  heldAtPress: 0,
  unaligned: false,
  undoSecondTap: false,
  pressedAnotherBody: false,
  ...o,
});

describe("⭐⭐⭐ what costs an episode", () => {
  it("⭐ a touchpoint that held a body counts — a hold, a drag, an align press", () => {
    expect(episodeCounts(f({ role: "OBJECT" }))).toBe(true);
    expect(episodeCounts(f({ role: "OBJECT", heldAtPress: 1 }))).toBe(true);
  });

  it("⛔ the camera is free: empty space with nothing held (orbit, pinch, reset)", () => {
    expect(episodeCounts(f({ role: "OUTSIDE", heldAtPress: 0 }))).toBe(false);
  });

  it("⛔ steering a hold is free: the axis finger and the mode-toggle tap", () => {
    expect(episodeCounts(f({ role: "OUTSIDE", heldAtPress: 1 }))).toBe(false);
    expect(episodeCounts(f({ role: "SECOND" }))).toBe(false);
  });

  it("⭐ …unless the tap UNALIGNED — that is assembly", () => {
    expect(episodeCounts(f({ role: "OUTSIDE", heldAtPress: 1, unaligned: true }))).toBe(true);
    // ⚠ And nothing held cannot have unaligned anything.
    expect(episodeCounts(f({ role: "OUTSIDE", heldAtPress: 0, unaligned: true }))).toBe(false);
  });

  it("⭐⭐ the unsnap's second touch counts — it lands on ANOTHER body, redirected to the root", () => {
    expect(episodeCounts(f({ role: "SECOND", pressedAnotherBody: true }))).toBe(true);
  });

  it("⛔ an ignored third finger and a cursor grab (Free Flow) are free", () => {
    expect(episodeCounts(f({ role: "IGNORED" }))).toBe(false);
    expect(episodeCounts(f({ role: null }))).toBe(false);
  });

  it("⭐⭐ the undo double tap costs ONE: its first tap counts, its second does not", () => {
    // > *"Count as one episode (includes both the double-tap and the scene reset)"* — the owner.
    expect(episodeCounts(f({ role: "OBJECT" }))).toBe(true);
    expect(episodeCounts(f({ role: "OBJECT", undoSecondTap: true }))).toBe(false);
  });
});

describe("the timer", () => {
  it("mm:ss, zero-padded", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(61_999)).toBe("01:01");
    expect(formatElapsed(3_600_000)).toBe("60:00");
  });

  it("⛔ never negative, never NaN", () => {
    expect(formatElapsed(-5)).toBe("00:00");
    expect(formatElapsed(NaN)).toBe("00:00");
  });
});
