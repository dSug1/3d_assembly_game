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

describe("⭐⭐⭐ `D158` — a gesture that LANDS NOTHING costs nothing", () => {
  // > *"an action which does not land into anything (for example: space pressed with no further action,
  // > left or right click and unclick on an object, touch and release on an object) should count as zero
  // > episode"* — the owner, 2026-09-29 (absorbing `D157`'s double tap that does not land)
  it("⭐⭐ a press and release on a body that changed nothing: ZERO", () => {
    const t = new EpisodeTally();
    t.note(true, false);
    // ⛔ RED against the tally before: a hold counted whether or not it did anything.
    expect(t.gestureEnded(false)).toBe(0);
    expect(t.total).toBe(0);
  });

  it("⭐ a gesture that changed the model lands its cost, as before — a two-touch action still ONE", () => {
    const t = new EpisodeTally();
    t.note(true, false);
    t.note(true, true);
    expect(t.gestureEnded(true)).toBe(1);
    expect(t.total).toBe(1);
  });

  it("⭐⭐ the undo double tap costs ONE, a double tap that does not land ZERO — by the same rule", () => {
    const undo = new EpisodeTally();
    undo.note(true, false); // first tap
    undo.gestureEnded(false); // changed nothing
    undo.note(true, false); // second tap
    undo.gestureEnded(true); // the undo landed
    expect(undo.total).toBe(1);
    const refused = new EpisodeTally();
    refused.note(true, false);
    refused.gestureEnded(false);
    refused.note(true, false);
    refused.gestureEnded(false); // refused, or nothing to undo
    expect(refused.total).toBe(0);
  });

  it("⚠ with no answer given, a gesture lands its cost — the rule before `D158`", () => {
    const t = new EpisodeTally();
    t.note(true, false);
    expect(t.gestureEnded()).toBe(1);
  });
});

describe("⭐⭐ `D159` — a Space freeze and the action it becomes land ONE episode", () => {
  // > *"clicking space key shall not count immediately as an episode: the episode shall be counted once at
  // > the end of the action which follows … if the action which follows is Esc being pressed, if the object
  // > has moved (translation or rotation), the count shall be one."* — the owner, 2026-09-29
  it("⭐ the latched HitFace that continues the drag's hold adds nothing", () => {
    const hold = { role: "OBJECT" as const, heldAtPress: 0, unaligned: false, pressedAnotherBody: false };
    // ⛔ RED against `D158`: every OBJECT touch was a hold of its own.
    expect(episodeCounts({ ...hold, continuesAnother: true })).toBe(false);
    expect(episodeCounts(hold)).toBe(true);
  });

  it("⭐⭐ one gesture — drag hold + continued HitFace + the align tap: ONE if anything changed, ZERO if not", () => {
    const moved = new EpisodeTally();
    moved.note(true, false); // the drag's touch, released by the freeze (the gesture is CARRIED)
    moved.note(false, false); // the continued HitFace
    moved.note(false, true); // the align tap (an alignment tap is not itself counted)
    expect(moved.gestureEnded(true)).toBe(1);
    const esc = new EpisodeTally();
    esc.note(true, false);
    esc.note(false, false); // Esc lifts the HitFace
    expect(esc.gestureEnded(false)).toBe(0); // a press held still, then Esc: nothing changed
  });
});
