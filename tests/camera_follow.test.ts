// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13) THE CAMERA FOLLOWER — its pure rules (`src/input/camera_follow.ts`).
// F1: the calm ASKED (`askedCalm`) — the target before its ease, the whole shares by position folded in as `calmDir` folds the eased ones.
import { describe, expect, it } from "vitest";
import { askedCalm } from "../src/input/camera_follow";
import { calmShown, calmStep } from "../src/input/orbit_calm";

describe("F1 — the calm asked (`askedCalm`)", () => {
  const n: [number, number, number] = [0, 0, 1];

  it("over a cap (no normal): none — the orbit's own direction", () => {
    expect(askedCalm({ n: null, sH: 1, sV: 1 }, 0, 0)).toBeNull();
    const u: [number, number, number] = [0.6, 0, 0.8];
    expect(calmShown(u, askedCalm({ n: null, sH: 0.2, sV: 0.2 }, 0, 0))).toEqual(u);
  });

  it("the target's shares AS GIVEN — never eased (the ease starting from whole would give another share)", () => {
    const a = askedCalm({ n, sH: 0.3, sV: 0.4, wA: 0.5 }, 0, 0)!;
    expect(a.sH).toBeCloseTo(0.3, 12);
    expect(a.sV).toBeCloseTo(0.4, 12);
    expect(a.wA).toBe(0.5);
    expect(a.n).toEqual(n);
    const eased = calmStep(null, { n, sH: 0.3, sV: 0.4 }, 16)!; // the calm's own first step: from whole toward the target
    expect(eased.sH).toBeGreaterThan(0.3 + 1e-3);
  });

  it("the whole shares by position folded as `calmDir` folds them: `kH` on both, the vertical by max(kH, kV)", () => {
    const a = askedCalm({ n, sH: 0.2, sV: 0.2 }, 0.5, 0)!;
    expect(a.sH).toBeCloseTo(0.6, 12);
    expect(a.sV).toBeCloseTo(0.6, 12); // kH reaches the vertical share too
    const b = askedCalm({ n, sH: 0.2, sV: 0.2 }, 0, 0.75)!;
    expect(b.sH).toBeCloseTo(0.2, 12); // kV alone: the horizontal share untouched
    expect(b.sV).toBeCloseTo(0.8, 12);
    const c = askedCalm({ n, sH: 0.2, sV: 0.2 }, -1, -1)!; // a negative share is none
    expect(c.sH).toBeCloseTo(0.2, 12);
    expect(c.sV).toBeCloseTo(0.2, 12);
  });

  it("`poleFade` carried when given, no key when absent; `wA` 0 when absent", () => {
    expect(askedCalm({ n, sH: 0.5, sV: 0.5, poleFade: false }, 0, 0)!.poleFade).toBe(false);
    const a = askedCalm({ n, sH: 0.5, sV: 0.5 }, 0, 0)!;
    expect("poleFade" in a).toBe(false);
    expect(a.wA).toBe(0);
  });
});
