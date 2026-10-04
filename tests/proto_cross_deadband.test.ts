/**
 * ⭐⭐ prototype (green box) — outside the guide sphere, one orbit axis moving widens the other's deadband (the owner, 2026-10-03:
 * *"when dx is outside the deadband, increase the deadband for dy. Revert back when dx is inside the deadband. When dy is outside the
 * deadband, increase the deadband for dx …"* — *"make a toggle slider and a slider for this increase of deadband from 100 % (current) to
 * 1000 %"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { crossDeadbandScales } from "../src/input/green_box";
import { MotionTracker } from "../src/input/motion";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { mmToPx } from "../src/core/units";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — one orbit axis moving widens the other's deadband, outside the guide sphere", () => {
  it("⭐ the rule: dx MOVING → dy's band × factor; dy MOVING → dx's; back to 1 when the other rests; nothing unless active", () => {
    expect(crossDeadbandScales(true, false, true, 3)).toEqual({ x: 1, y: 3 });
    expect(crossDeadbandScales(false, true, true, 3)).toEqual({ x: 3, y: 1 });
    expect(crossDeadbandScales(false, false, true, 3)).toEqual({ x: 1, y: 1 }); // both at rest: reverted
    expect(crossDeadbandScales(true, true, true, 3)).toEqual({ x: 3, y: 3 });
    expect(crossDeadbandScales(true, false, false, 3)).toEqual({ x: 1, y: 1 }); // inside the sphere, or switched off
    expect(crossDeadbandScales(true, false, true, 1)).toEqual({ x: 1, y: 1 }); // 100 %: today's band
  });

  it("⭐⭐ a YAW drag that drifts up 6 mm: at 100 % the drift leaks into the pitch, at 300 % it does not — the yaw itself unchanged", () => {
    const run = (factor: number) => {
      const t = new MotionTracker(DEFAULT_CONFIG);
      let sumDx = 0;
      let sumDy = 0;
      // 60 mm right over 600 ms, drifting 6 mm up — a sideways swipe that is not quite level
      for (let i = 0; i <= 60; i++) {
        const before = t.axes;
        t.push({ x: mmToPx(i), y: mmToPx(-0.1 * i), t: i * 10 }, crossDeadbandScales(before.x === "MOVING", before.y === "MOVING", true, factor));
        sumDx += t.step.dx;
        sumDy += t.step.dy;
      }
      return { dxMm: sumDx / mmToPx(1), dyMm: sumDy / mmToPx(1) };
    };
    const narrow = run(1);
    const wide = run(3);
    expect(Math.abs(narrow.dyMm)).toBeGreaterThan(2); // 6 mm − one 3.5 mm band
    expect(wide.dyMm).toBe(0); // inside 3 × 3.5 = 10.5 mm
    expect(wide.dxMm).toBeCloseTo(narrow.dxMm, 9);
  });

  it("⭐ wired: outside + on, the tracker is pushed FIRST with the scales and the orbit reads its DEADBANDED travel; sliders; on, 300 %", () => {
    const p = code("render/pointer_wiring.ts");
    // ⭐ since 2026-10-04: while the snapped rotation is ON (`greenSnapsOn`; held for orbit 2026-10-03)
    // ⭐ step 2: the frame's `snapsActive` (COARSE, above the minimum distance, `w` below the snap-off)
    // ⭐ the owner, 2026-10-04: *"This shall apply for coarse and commit"* — not only while the snaps are on
    expect(p).toMatch(/const cross = st\.cfg\.orbitCrossDeadbandOn === 1 && \(st\.greenCoarseEnabled \|\| st\.greenCommitMode !== "COARSE"\);/);
    expect(p).toMatch(/st\.orbitMotion\.tracker\.push\(s, crossDeadbandScales\(before\.x === "MOVING", before\.y === "MOVING", cross, st\.cfg\.orbitCrossDeadbandFactor\)\);\s*if \(cross\) \{\s*dx = st\.orbitMotion\.tracker\.step\.dx;\s*dy = st\.orbitMotion\.tracker\.step\.dy;/);
    // the push comes BEFORE the orbit is driven
    expect(p.indexOf("tracker.push(s, crossDeadbandScales(")).toBeLessThan(p.indexOf("st.orbit.drag(-dx * st.cfg.boxGainYaw * g.yaw"));
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"orbitCrossDeadbandOn", 0, 1, 1)');
    expect(menu).toContain('"orbitCrossDeadbandFactor", 1, 10, 0.25)');
    expect(DEFAULT_CONFIG.orbitCrossDeadbandOn).toBe(1);
    expect(DEFAULT_CONFIG.orbitCrossDeadbandFactor).toBe(3);
  });
});
