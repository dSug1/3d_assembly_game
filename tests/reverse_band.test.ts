// ⭐⭐⭐ (2026-11-08, scope §32.13) GOLDEN VECTORS — THE REVERSE BAND (`input/reverse_band.ts`): the finger's tremble on its own axis taken out of the
// orbit around the assembly, wired in `render/pointer_wiring.ts`. RED against `d957613` (no module; the finger's step passed raw to `loopFinger`).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { reverseBand, reverseBandStep } from "../src/input/reverse_band";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const run = (steps: number[], w = 2.3) => {
  const b = reverseBand();
  return steps.map((m) => reverseBandStep(b, m, w));
};
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

describe("⭐⭐⭐ §32.13 the reverse band — a step back absorbed up to the band, the excess passed once", () => {
  it("⭐⭐ a fresh drag passes its first step whole, and a steady drag passes everything", () => {
    expect(run([1.5, 1, 0.5])).toEqual([1.5, 1, 0.5]);
    expect(run([-0.7, -0.7])).toEqual([-0.7, -0.7]);
  });
  it("⭐⭐⭐ a tremble on the drag's own axis (back by less than the band) moves NOTHING back — and the way on takes up the slack first", () => {
    const out = run([1, 1, -0.6, 0.8, -1, 1.2, 1]);
    expect(out.every((x) => x >= 0)).toBe(true); // never a step back
    expect(out[2]).toBe(0);
    expect(out[3]).toBeCloseTo(0.2, 12); // 0.6 of slack taken up, 0.2 on
    expect(out[4]).toBe(0);
    expect(out[5]).toBeCloseTo(0.2, 12);
    expect(sum(out)).toBeCloseTo(1 + 1 - 0.6 + 0.8 - 1 + 1.2 + 1, 12); // exact: no finger lost once the way goes on
  });
  it("⭐⭐⭐ a real reversal: the band paid ONCE, then the finger followed exactly the other way", () => {
    const out = run([2, 2, -1, -1, -1, -1]);
    expect(out.slice(2)).toEqual([0, 0, expect.closeTo(-0.7, 12), -1]);
    expect(sum(out)).toBeCloseTo(4 - 4 + 2.3, 12);
    // …and back again: the band again
    const b = reverseBand();
    for (const m of [2, -3]) reverseBandStep(b, m, 2.3);
    expect(reverseBandStep(b, 2, 2.3)).toBe(0);
    expect(reverseBandStep(b, 1, 2.3)).toBeCloseTo(0.7, 12);
  });
  it("⭐ a zero band passes everything raw; a zero or non-finite step passes nothing", () => {
    expect(run([1, -0.5, 0.25], 0)).toEqual([1, -0.5, 0.25]);
    expect(run([0, Number.NaN])).toEqual([0, 0]);
  });
  it("⭐⭐⭐ wired: the orbit around the assembly's finger (dx and dy, per drag) through the band of `orbitDeadbandMm`, the coast recording what passed", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("rev: { x: reverseBand(), y: reverseBand() } };");
    expect(p).toContain("const fx = reverseBandStep(rv.x, db.dx / mmToPx(1), st.cfg.orbitDeadbandMm);");
    expect(p).toContain("const fy = dxOnly ? 0 : reverseBandStep(rv.y, -db.dy / mmToPx(1), st.cfg.orbitDeadbandMm);");
    expect(p).toContain("loopFinger(st, fx, fy); st.orbitInertia.record(s.t, fx, fy);");
  });
});
