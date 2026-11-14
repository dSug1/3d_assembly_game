/**
 * GOLDEN VECTORS — **THE SLIDE'S REMOVAL, REBUILT** (2026-11-12, branch `1.0.126-Slide_removal`; the owner: *"Re-build the removal of the slide … Make sure the
 * issues we faced on 1.0.122- are not repeated … Place a particular attention to the teleport issue: when we orbit in polar orbit and approach the piece onto
 * the bottom of the black channel, the tilted-pole orbit dx can then teleport the piece to the other channel or even climb the piece on top of the top face"*).
 * Walked headless (`walk_probe.mjs`, `walk_teleport.ts`, the channel on `Piece22`): the trial's code put the piece INSIDE the channel's floor, then moved it
 * 35 mm in one frame. Three roots, three rules:
 * 1. the ring MOVES between frames under the piece's solved angles (the map's catch-up, the calm, a glide) — nothing checked it → `input/ring_hold.ts`;
 * 2. close in the piece hangs at a fixed approach along a direction that turns: its lift shrank and it sank onto the face it was over → `restRaise`;
 * 3. a ring jump was crossed on its landing alone — the shown piece goes there straight, through whatever is between → `straightFree`.
 * RED on the trial's code (`473fe76` replayed): the modules / exports absent, the wiring absent.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";

const code = (f: string): string => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ 1. the ring never moves the piece into a part (`ringHoldStep`)", async () => {
  const { ringHoldStep, HOLD_RELEASE_MAX_M } = await import("../src/input/ring_hold");
  // a floor at y = 0: the piece's gap is its anchor's height (the piece a point here)
  const gapAt = (p: Vec3): number => Math.max(0, p[1]);
  const gapM = 0.001;
  it("⭐⭐⭐ a ring move that closes on the floor below the gap kept is HELD: the piece stays where it was solved (⛔ taken: the piece sank into it)", () => {
    const r = ringHoldStep({ prev: [0, 0.0012, 0], now: [0.002, 0.0002, 0], hold: null, gapM, gapAt, budget: 10 });
    expect(r.held).toBe(true);
    expect(r.hold![0]).toBeCloseTo(-0.002, 12);
    expect(r.hold![1]).toBeCloseTo(0.001, 12);
  });
  it("⭐⭐ a ring move that stays clear (or opens the gap) is taken whole — no hold", () => {
    expect(ringHoldStep({ prev: [0, 0.01, 0], now: [0.005, 0.009, 0], hold: null, gapM, gapAt, budget: 10 })).toMatchObject({ hold: null, held: false });
    // along the floor at the gap kept: not closer than it was
    expect(ringHoldStep({ prev: [0, 0.0008, 0], now: [0.003, 0.0008, 0], hold: null, gapM, gapAt, budget: 10 })).toMatchObject({ hold: null, held: false });
  });
  it("⭐⭐ the hold is RELEASED by checked steps, each within the clearance (conservative advancement), ≤ 4 mm", () => {
    // held 10 mm up: the ring's own place is 10 mm lower, still 5 mm above the floor — free: released step by step
    let hold: Vec3 | null = [0, 0.01, 0];
    let now: Vec3 = [0, 0.015, 0];
    let steps = 0;
    while (hold !== null && steps < 20) {
      const r = ringHoldStep({ prev: now, now, hold, gapM, gapAt, budget: 10 });
      const moved = Math.hypot(...(r.hold ?? [0, 0, 0]).map((x, k) => x - hold![k]!));
      expect(moved).toBeLessThanOrEqual(HOLD_RELEASE_MAX_M + 1e-12);
      now = [now[0], now[1] - moved, now[2]];
      hold = r.hold;
      steps++;
    }
    expect(hold).toBeNull();
    expect(now[1]).toBeCloseTo(0.005, 9);
  });
  it("⭐⭐⭐ a release INTO a part stops at it: the piece never crosses anything to rejoin its ring", () => {
    // the ring's own place 20 mm BELOW the floor (a wall between): the piece at the gap kept stays
    let hold: Vec3 | null = [0, 0.021, 0];
    let now: Vec3 = [0, 0.001, 0];
    for (let k = 0; k < 30; k++) {
      const r = ringHoldStep({ prev: now, now, hold, gapM, gapAt, budget: 10 });
      const d = (r.hold ?? [0, 0, 0])[1] - hold![1];
      now = [0, now[1] + d, 0];
      hold = r.hold;
      expect(now[1]).toBeGreaterThanOrEqual(gapM / 2);
    }
    expect(hold).not.toBeNull();
  });
  it("⭐⭐ a ring move over `REBASE_M` in one frame is a RE-BASE (the orbit put elsewhere): taken, the hold cleared (⛔ held: the piece 430 mm off its gizmo)", async () => {
    const { REBASE_M } = await import("../src/input/ring_hold");
    expect(REBASE_M).toBe(0.1);
    // far and FREE: taken — the piece goes where the orbit was put, the hold cleared
    expect(ringHoldStep({ prev: [0, 0.3, 0], now: [0.5, 0.2, 0], hold: [0, 0.01, 0], gapM, gapAt, budget: 10 })).toMatchObject({ hold: null, held: false, queries: 1 });
    // ⭐⭐ far and INTO a part (the gizmo jumping faces at a corner at fixed angles): HELD like any drift — ⛔ taken: 99 mm, inside `Piece37`
    const r = ringHoldStep({ prev: [0, 0.3, 0], now: [0.5, 0.0002, 0], hold: null, gapM, gapAt, budget: 10 });
    expect(r.held).toBe(true);
    expect(r.hold![0]).toBeCloseTo(-0.5, 12);
  });
  it("⭐ no queries left to check a move: it is held (the safe side)", () => {
    expect(ringHoldStep({ prev: [0, 0.5, 0], now: [0.01, 0.5, 0], hold: null, gapM, gapAt, budget: 1 })).toMatchObject({ held: true, queries: 0 });
  });
});

describe("⭐⭐⭐ 2. the piece rests on its support (`restRaise`)", async () => {
  const { restRaise, REST_SPARE_M } = await import("../src/input/footprint");
  const level = { n: [0, 1, 0] as Vec3, h: 0.4665 };
  it("⭐⭐⭐ the direction turned, the lift gone: the foot raised so the piece's lowest point keeps the gap above the level (⛔ it sank onto it)", () => {
    // the piece's lowest point 0 past its resting face's centre (square), the anchor 0 above the foot: its bottom AT the level — raised by the gap
    const k = restRaise(level, [0, 0.4665, 0], [0, 1, 0], 0, 0, 0.001 + REST_SPARE_M);
    expect(k).toBeCloseTo(0.001 + REST_SPARE_M, 12);
    // an edge down (its hull 15 mm past the face's centre along −n), the direction 30° off: the same rule, on the piece's own lowest point
    const u: Vec3 = [Math.sin(Math.PI / 6), Math.cos(Math.PI / 6), 0];
    const k2 = restRaise(level, [0, 0.4665, 0], u, 0.01, 0.015, 0.001);
    expect(k2).toBeGreaterThan(0);
    expect(0.4665 + k2 + Math.cos(Math.PI / 6) * 0.01 - 0.015).toBeCloseTo(0.4665 + 0.001, 12);
  });
  it("⭐ above the level: no raise (continuous: a max with 0); no support: none", () => {
    expect(restRaise(level, [0, 0.5, 0], [0, 1, 0], 0.03, 0.02, 0.001)).toBe(0);
    expect(restRaise(null, [0, 0, 0], [0, 1, 0], 0, 0, 0.001)).toBe(0);
  });
});

describe("⭐⭐⭐ 3. a ring jump is crossed only where the piece's STRAIGHT move is free (`straightFree`)", async () => {
  const { solveOrbitStep, straightFree, SWEEP_MAX_QUERIES } = await import("../src/input/piece_orbit_solver");
  const opt = { gapM: 0.001, maxQueries: 24 };
  // the R4 ring (a jump of 0.5 at yaw 1) with a thin WALL between its two sides (x 1.2 – 1.25): both sides free, the straight move through it
  const slab = (x: number): number => Math.min(0.3, x < 1.2 ? 1.2 - x : x > 1.25 ? x - 1.25 : 0);
  const anchor = (q: { yaw: number; v: number }): Vec3 => [q.yaw + (q.yaw >= 1 ? 0.5 : 0), q.v, 0];
  const env = { anchor, gap: (q: { yaw: number; v: number }) => slab(anchor(q)[0]), normal: () => null, gapAtAnchor: (p: Vec3) => slab(p[0]) };
  it("⭐⭐⭐ the landing free, the wall between: NOT crossed — the piece stops before the jump (⛔ crossed: through the wall, the teleport)", () => {
    const r = solveOrbitStep({ yaw: 0.99, v: 0.5, zoom: 1 }, [0.05, 0], env, opt);
    expect(r.q.yaw).toBeLessThan(1);
    // the same ring without the sweep (an environment that cannot ask it): crossed, as R4 does
    const { gapAtAnchor: _, ...old } = env;
    expect(solveOrbitStep({ yaw: 0.99, v: 0.5, zoom: 1 }, [0.05, 0], old, opt).q.yaw).toBeCloseTo(1.04, 9);
  });
  it("⭐⭐ free air both sides and between (R4's own case): crossed, in a few queries", () => {
    const free = { ...env, gap: () => 0.3, gapAtAnchor: () => 0.3 };
    const r = solveOrbitStep({ yaw: 0.99, v: 0.5, zoom: 1 }, [0.05, 0], free, opt);
    expect(r.q.yaw).toBeCloseTo(1.04, 9);
    expect(r.queries).toBeLessThanOrEqual(6 + SWEEP_MAX_QUERIES);
  });
  it("⭐ `straightFree`: within the clearance no query; a crawl at the gap kept is not free; through a wall not free", () => {
    let n = 0;
    expect(straightFree(env, [0, 0, 0], [0.1, 0, 0], 0.3, 0.0005, () => n++)).toBe(true);
    expect(n).toBe(0);
    expect(straightFree({ ...env, gapAtAnchor: () => 0.001 }, [0, 0, 0], [0.1, 0, 0], 0.001, 0.0005)).toBe(false);
    expect(straightFree(env, [0.99, 0, 0], [1.54, 0, 0], slab(0.99), 0.0005)).toBe(false);
  });
});

describe("⭐⭐ the wiring", () => {
  it("⭐⭐⭐ the ring carries the hold; the hold is stepped BEFORE the solve and read against where the piece was solved", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const h = st.pieceHold; return h === null ?");
    expect(g).toContain("const hr = ringHoldStep({ prev: sameApproach ? prevH!.anchor : null, now: ringAnchorAt(st, st.pieceQ),");
    expect(g.indexOf("const hr = ringHoldStep(")).toBeLessThan(g.indexOf("const fr = orbitFrame("));
    expect(g).toContain("st.pieceHoldPrev = { anchor: ringAnchorAt(st, fr.q), approach: st.approach };");
    // the drawn piece too
    expect(g).toContain("(st.pieceHold?.[0] ?? 0)");
    // the relocation a last resort next to the piece (⛔ 0.4 m)
    expect(g).toContain("const RELOCATE_MAX_M = 0.03;");
    // the sweep's queries in the real environment
    expect(g).toContain("gapAtAnchor: (p) => {");
  });
  it("⭐⭐ a support's drop waits for the DRAWN piece too (it never raises by it) and eases on at most 33 ms a frame", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("if (target !== null && lv !== null && same && target < lv.h) {");
    expect(a).toContain("if (j !== null) target = Math.min(lv.h, Math.max(target, supportTop(parts.parts[j]!, u)));");
    expect(a).toContain("supportLevelStep(lv!.h, target, Math.min(dtMs, SUPPORT_EASE_DT_MAX_MS))");
    expect(a).toContain("const SUPPORT_EASE_DT_MAX_MS = 33;");
  });
  it("⭐⭐⭐ a support's level applies on the face it was read on only; another face's taken at once (⛔ the front's level kept in the notch: 524 mm in a frame)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const lv = levelOn(st.asmSupportLevel, st.gizmoNormal ?? null); const r = levelRaise(lv, g);");
    expect(a).toContain("return lv !== null && n !== null && lv.n[0] * n[0] + lv.n[1] * n[1] + lv.n[2] * n[2] > 0.999 ? lv : null;");
    expect(a).toContain("if (lv !== null && same && (next === null || next.h < lv.h) && st.pieceQ !== null) {");
  });
  it("⭐⭐⭐ the DRAWN piece rests on its support too (⛔ it hung along the spring's lagging direction: into the slanted face, the solved place 2.8 mm clear)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const k = restRaise(lv, pp, lv.n, 0, liftOf(st, lv.n), pieceSolveOptions(st).gapM + REST_SPARE_M);");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (assemblyOn(st)) pp = restDrawn(st, pp);");
    expect(g.indexOf("pp = restDrawn(st, pp);")).toBeLessThan(g.indexOf("st.pieceAnchor = pp;"));
  });
  it("⭐⭐ the foot carries the rest; the approach's own check reads the piece without it", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const k = restRaise(lv, f, u, d, liftOf(st, lv.n), pieceSolveOptions(st).gapM + REST_SPARE_M);");
    expect(a).toContain("st.asmRestOff = true; const p = ringAnchorAt(st, qq); st.asmRestOff = restWas;");
  });
});
