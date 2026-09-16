/**
 * GOLDEN VECTORS — the `IN3` fork, and why its failure mode differs from `D26`'s.
 *
 * ⛔⛔ `D26`'s flag chose between two readings that differed by ONE INVERSION, so both sides
 * were always live and equally exercised. ⭐ This one is a **GATE**: fork A is the *absence*
 * of a rule set and fork C is *not specified yet*. So the risk is not a subtle disagreement
 * between two live paths — it is **a session believing it tested a fork that did nothing**.
 *
 * ✅ **FORK C IS SPECIFIED SINCE 2026-09-16** (`spec/FORK_C_ANCHOR_RULES.md`) and is no longer
 * inert. ⚠ Its vector here changed with it, and the shape of the file did not: what these
 * assert is that each fork runs **its own** rules and no other's — the failure that matters
 * is still a session judging a rule set it did not think it was judging.
 */
import { describe, expect, it } from "vitest";
import {
  adoptAnchorFork,
  anchorForkLabel,
  anchorForkOf,
  anchorForkPending,
  runsForkC,
  runsIn3,
  selectsFaces,
  type AnchorFork,
} from "@input/anchor_fork";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const A: AnchorFork = "NONE";
const B: AnchorFork = "IN3";
const C: AnchorFork = "FORK_C";

describe("anchorForkOf — the flag reads as a rule set", () => {
  it("⛔⛔ 0 is fork A — and FORK C is the shipped default since 2026-09-16", () => {
    // ⛔⛔ THIS VECTOR ASSERTED THE OPPOSITE, with a reason I still think was sound while it
    // held: *"the default must be today's behaviour — shipping an unbuilt rule set as the
    // default would make every device session judge a moving target."*
    // ⭐ The owner overruled it: *"the game shall start by default to fork C, not fork A."*
    // ⚠ And the reasoning was mine about THEIR loop — fork C is what is being judged now, so
    // reaching it should not require a URL. Fork A stays one flag away.
    expect(anchorForkOf(0)).toBe(A);
    expect(anchorForkOf(DEFAULT_CONFIG.anchorRules)).toBe(C);
  });

  it("1 is fork B — `IN3` — and 2 is fork C, the owner's set", () => {
    expect(anchorForkOf(1)).toBe(B);
    expect(anchorForkOf(2)).toBe(C);
  });

  it("⚠ anything unrecognised reads as fork A — which is WHY the validator exists", () => {
    // ⛔ This function has no error channel and runs per frame, so an out-of-range flag reads
    // as today's behaviour. The guard below is what stops one ever arriving. A pair.
    expect(anchorForkOf(9)).toBe(A);
  });
});

describe("⛔⛔ runsIn3 — the gate, and fork C answers NO", () => {
  it("only fork B runs IN3's rules", () => {
    expect(runsIn3(B)).toBe(true);
    expect(runsIn3(A)).toBe(false);
  });

  it("⛔⛔ FORK C RUNS ITS OWN RULES AND NONE OF `IN3`'s — the two never overlap", () => {
    // ⭐⭐ THE VECTOR THIS FILE EXISTS FOR, in its second form. It used to assert that fork C
    // was **inert** and labelled `inert`; the owner specified it on 2026-09-16, so what has to
    // be true now is that the two rule sets are mutually exclusive.
    // ⛔ They share no rule: fork C has no flick alignment, no `GRAVITY_ALIGN` and no second
    // constraint. A session with both gates open would be judging a set nobody specified.
    expect(runsIn3(C)).toBe(false);
    expect(runsForkC(C)).toBe(true);
    expect(runsForkC(B)).toBe(false);
    expect(runsForkC(A)).toBe(false);
    for (const f of [A, B, C]) expect(runsIn3(f) && runsForkC(f)).toBe(false);
  });

  it("⭐⭐ and BOTH rule sets select faces, while fork A must not", () => {
    // ⛔ `IN3` needs the face a flick will align; fork C needs the Follower and the Pioneer.
    // ⚠ Fork A draws no highlight — a session judging today's shipped behaviour must not see
    // a marker the default does not draw. One spelling of the question, one place.
    expect(selectsFaces(B)).toBe(true);
    expect(selectsFaces(C)).toBe(true);
    expect(selectsFaces(A)).toBe(false);
  });

  it("⭐ each fork is distinguishable on the readout", () => {
    // ⚠ Two of the three create no constraints, so *"nothing happened"* is the expected
    // outcome in both — and indistinguishable from a defect without a name on the glass.
    const labels = [A, B, C].map(anchorForkLabel);
    expect(new Set(labels).size).toBe(3);
    expect(anchorForkLabel(B)).toBe("anchor=IN3");
    // ⛔⛔ AND FORK C'S LABEL NO LONGER SAYS `inert`, because it is not. ⭐ A name that says
    // *to be defined* while the thing runs rules is a lie the compiler cannot catch — which
    // is why the type member was renamed from `OWNER_TBD` at the same time.
    expect(anchorForkLabel(C)).not.toContain("inert");
    expect(anchorForkLabel(C)).toBe("anchor=forkC");
  });
});

describe("⛔ the latch — only while nothing touches the glass", () => {
  it("an empty glass adopts the request", () => {
    expect(adoptAnchorFork(A, B, 0)).toBe(B);
  });

  it("⛔⛔ a finger down refuses it — switching mid-drag changes what the RELEASE does", () => {
    // ⭐⭐ Stronger here than for the movement mode: flipping into `IN3` mid-gesture would
    // change whether the release pushes a constraint, and a pushed constraint is not
    // something the user can un-mean. ⚠ `METHOD`: acting is irreversible.
    expect(adoptAnchorFork(A, B, 1)).toBe(A);
    for (const n of [2, 3, 5]) expect(adoptAnchorFork(A, B, n)).toBe(A);
  });

  it("⭐ a flip made mid-gesture is DEFERRED, not dropped", () => {
    let live: AnchorFork = adoptAnchorFork(A, B, 1);
    expect(live).toBe(A);
    live = adoptAnchorFork(live, B, 0);
    expect(live).toBe(B);
  });

  it("⛔ it is a LATCH, not a toggle — re-adopting the same value cannot flip it", () => {
    expect(adoptAnchorFork(B, B, 0)).toBe(B);
    expect(adoptAnchorFork(B, B, 1)).toBe(B);
  });

  it("the pending gap is reportable", () => {
    expect(anchorForkPending(A, B)).toBe(true);
    expect(anchorForkPending(B, B)).toBe(false);
  });
});

describe("⛔ the validator refuses a half-set flag", () => {
  it("accepts 0, 1 and 2", () => {
    for (const v of [0, 1, 2]) {
      expect(() =>
        validateGestureConfig({ ...DEFAULT_CONFIG, anchorRules: v }),
      ).not.toThrow();
    }
  });

  it("⛔⛔ refuses anything between or beyond — it selects a RULE SET, not a range", () => {
    // ⚠ Reachable for real from a URL, and from a slider whose step is edited. Without this,
    // `0.5` or `3` would LOOK like today's behaviour to someone who believed otherwise.
    for (const v of [0.5, 1.5, 3, -1, Number.NaN]) {
      expect(() =>
        validateGestureConfig({ ...DEFAULT_CONFIG, anchorRules: v }),
      ).toThrow(/anchorRules/);
    }
  });
});
