/**
 * GOLDEN VECTORS — the `IN3` fork, and why its failure mode differs from `D26`'s.
 *
 * ⛔⛔ `D26`'s flag chose between two readings that differed by ONE INVERSION, so both sides
 * were always live and equally exercised. ⭐ This one is a **GATE**: fork A is the *absence*
 * of a rule set and fork C is *not specified yet*. So the risk is not a subtle disagreement
 * between two live paths — it is **a session believing it tested a fork that did nothing**.
 * ⚠ That is what these vectors are shaped around: `OWNER_TBD` must be inert AND
 * distinguishable, never a quiet fallback to fork A.
 */
import { describe, expect, it } from "vitest";
import {
  adoptAnchorFork,
  anchorForkLabel,
  anchorForkOf,
  anchorForkPending,
  runsIn3,
  type AnchorFork,
} from "@input/anchor_fork";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const A: AnchorFork = "NONE";
const B: AnchorFork = "IN3";
const C: AnchorFork = "OWNER_TBD";

describe("anchorForkOf — the flag reads as a rule set", () => {
  it("0 is fork A, and it IS the shipped default", () => {
    // ⭐ The default must be today's behaviour: `IN3` is under construction, and shipping an
    // unbuilt rule set as the default would make every device session judge a moving target.
    expect(anchorForkOf(0)).toBe(A);
    expect(anchorForkOf(DEFAULT_CONFIG.anchorRules)).toBe(A);
  });

  it("1 is fork B — `IN3` — and 2 is the owner's set", () => {
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

  it("⛔⛔ FORK C IS INERT — it must not quietly behave like fork A's rules either", () => {
    // ⭐⭐ THE VECTOR THIS FILE EXISTS FOR. `OWNER_TBD` is a slot for rules that do not exist.
    // If it ran `IN3`, a session would test `IN3` believing it tested something else; if it
    // silently WERE fork A, the owner would have no way to tell "not specified yet" from
    // "specified and doing nothing". ⛔ So: inert, and labelled inert.
    expect(runsIn3(C)).toBe(false);
    expect(anchorForkLabel(C)).toContain("inert");
  });

  it("⭐ each fork is distinguishable on the readout", () => {
    // ⚠ Two of the three create no constraints, so *"nothing happened"* is the expected
    // outcome in both — and indistinguishable from a defect without a name on the glass.
    const labels = [A, B, C].map(anchorForkLabel);
    expect(new Set(labels).size).toBe(3);
    expect(anchorForkLabel(B)).toBe("anchor=IN3");
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
