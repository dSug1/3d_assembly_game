// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §5, the analysis's note 2) THE CALM HAS NO BRANCH CUT BEHIND THE FACE. RED against `a865d14`: `shownDir`
// scaled α = atan2(…) by the share, so a direction passing straight behind the face's normal flipped the shown direction by 2·sH·180° (far out, the
// cube's seam: the anchor jumped 1406 mm against the 490 of the map).
import { describe, expect, it } from "vitest";
import { shownDir } from "../src/input/orbit_calm";
import type { Vec3 } from "../src/core/vec";

const n: Vec3 = [0, 0, -1];
const h: Vec3 = [1, 0, 0];
const v: Vec3 = [0, 1, 0];
const dir = (deg: number): Vec3 => [Math.sin((deg * Math.PI) / 180), 0, -Math.cos((deg * Math.PI) / 180)]; // deg off n toward h
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("⭐⭐⭐ (2026-11-09) the calm's shown direction is continuous all the way round", () => {
  it("⭐⭐⭐ through straight BEHIND the normal (α = ±180°): no jump (RED: the shown direction flipped across)", () => {
    for (const sH of [0.2, 0.5, 0.9]) expect(dist(shownDir(dir(179.9), n, h, v, sH, 1), shownDir(dir(-179.9), n, h, v, sH, 1))).toBeLessThan(0.01);
  });
  it("⭐⭐ a full turn in 0.5° steps: no step of the shown direction over 0.05 rad (the calm compresses, never tears)", () => {
    let worst = 0;
    for (let a = -180; a < 180; a += 0.5) worst = Math.max(worst, dist(shownDir(dir(a), n, h, v, 0.3, 1), shownDir(dir(a + 0.5), n, h, v, 0.3, 1)));
    expect(worst).toBeLessThan(0.05);
  });
  it("⭐ in front of the face (|α| ≤ 90°) the calm is exactly as before: α × sH", () => {
    for (const a of [-90, -45, -10, 0, 30, 89.9]) {
      const s = shownDir(dir(a), n, h, v, 0.4, 1);
      expect(Math.atan2(s[0], -s[2]) * (180 / Math.PI)).toBeCloseTo(a * 0.4, 9);
    }
  });
});
