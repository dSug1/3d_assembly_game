import { describe, expect, it } from "vitest";
import { CSS_PX_PER_INCH, MM_PER_INCH, mmToPx, pxToMm } from "../src/core/units";

describe("units", () => {
  it("one inch is 96 CSS px and 25.4 mm", () => {
    expect(mmToPx(MM_PER_INCH)).toBeCloseTo(CSS_PX_PER_INCH, 10);
  });

  it("round-trips", () => {
    for (const mm of [0, 0.5, 1.5, 8, 100]) {
      expect(pxToMm(mmToPx(mm))).toBeCloseTo(mm, 10);
    }
  });

  // ⛔ The number that matters: a 1.5 mm deadband must be a small pixel count, not
  // a number someone would plausibly have typed as a pixel threshold.
  it("a 1.5 mm deadband is ~5.7 CSS px", () => {
    expect(mmToPx(1.5)).toBeCloseTo(5.669, 3);
  });
});
