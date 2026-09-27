/**
 * GOLDEN VECTORS — **`D112`: the touchpoint episode ledger** — `SCORE.md` §3's exclusions, and the
 * undo pair costing ONE (`D111`).
 */
import { describe, expect, it } from "vitest";
import { EpisodeTally, episodeCounts, formatElapsed, type EpisodeFacts } from "@input/episode_ledger";

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

describe("⭐⭐⭐ `D115` — a two-touch action is ONE episode, counted when its last touch lifts", () => {
  // > *"When an action is triggered by two touch, count the episode only when the last of the two
  // > touches is released (for example alignment of face)"* · *"Make sure these actions also have
  // > one episode count in desktop"* — the owner, 2026-09-27.
  const release = (t: EpisodeTally, o: Partial<EpisodeFacts>) =>
    t.note(episodeCounts(f(o)), (o.heldAtPress ?? 0) > 0);

  it("⭐⭐ the face alignment: the press lifts first, nothing lands; the hold lifts, ONE lands", () => {
    const t = new EpisodeTally();
    release(t, { role: "OBJECT", heldAtPress: 1 }); // the Pioneer press (touch 2) lifts first
    // ⛔ RED against the per-release counter, which showed 1 here — and 2 at the end.
    expect(t.total).toBe(0);
    expect(t.pending).toBe(1);
    release(t, { role: "OBJECT", heldAtPress: 0 }); // the Follower's hold lifts
    expect(t.gestureEnded()).toBe(1);
    expect(t.total).toBe(1);
  });

  it("⭐⭐ each listed action is one: unalign tap, a Pioneer's release, the unsnap", () => {
    for (const second of [
      { role: "OUTSIDE" as const, heldAtPress: 1, unaligned: true },
      { role: "SECOND" as const, heldAtPress: 1, pressedAnotherBody: true },
    ]) {
      const t = new EpisodeTally();
      release(t, { role: "OBJECT", heldAtPress: 0 });
      release(t, second);
      expect(t.gestureEnded()).toBe(1);
    }
  });

  it("⭐ the hold lifting FIRST changes nothing — the order of the two releases is free", () => {
    const t = new EpisodeTally();
    release(t, { role: "OBJECT", heldAtPress: 0 });
    release(t, { role: "OBJECT", heldAtPress: 1 });
    expect(t.gestureEnded()).toBe(1);
  });

  it("⭐ a hold with TWO actions in turn is two; two separate holds are two", () => {
    const a = new EpisodeTally();
    release(a, { role: "OBJECT", heldAtPress: 1 });
    release(a, { role: "OUTSIDE", heldAtPress: 1, unaligned: true });
    release(a, { role: "OBJECT", heldAtPress: 0 });
    expect(a.gestureEnded()).toBe(2);
    const b = new EpisodeTally();
    release(b, { role: "OBJECT", heldAtPress: 0 });
    release(b, { role: "OBJECT", heldAtPress: 0 });
    expect(b.gestureEnded()).toBe(2);
  });

  it("⛔ a free second finger (gravity, roll, toggle) adds nothing", () => {
    const t = new EpisodeTally();
    release(t, { role: "OUTSIDE", heldAtPress: 1 });
    release(t, { role: "OBJECT", heldAtPress: 0 });
    expect(t.gestureEnded()).toBe(1);
  });

  it("⭐ a one-touch gesture lands at its own release, as before", () => {
    const t = new EpisodeTally();
    release(t, { role: "OBJECT", heldAtPress: 0 });
    expect(t.gestureEnded()).toBe(1);
    expect(t.gestureEnded()).toBe(0);
    expect(t.total).toBe(1);
  });
});
