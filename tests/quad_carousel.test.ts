/**
 * ⭐⭐⭐ THE YELLOW QUAD BY YAW (2026-10-19, the owner: *"each quad is highlighted at least once in a 360 yaw orbit"* → *"build it anchored. face alignment
 * menu."*) — and (2026-10-20) *"always put them in the same order (3 frozen object's orientations then gizmo face orientation). Same quad switch speed as
 * current."* — `input/quad_carousel.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { anchoredSlices, carouselQuad, fixedCarousel, QUAD_SLICE_HYSTERESIS_RAD } from "../src/input/quad_carousel";

const D = 180 / Math.PI;

describe("⭐⭐⭐ the yellow quad by yaw", () => {
  it("⭐ ANCHORED: the fewest slices of at most the maximum that are a whole multiple of the quads", () => {
    expect(anchoredSlices(4, 30)).toBe(12);
    expect(anchoredSlices(3, 30)).toBe(12);
    expect(anchoredSlices(6, 40)).toBe(12); // the 2026-10-19 speed: 30°
    expect(anchoredSlices(9, 40)).toBe(9);
    expect(anchoredSlices(4, 40)).toBe(12);
  });
  it("⭐⭐⭐ the SAME ORDER every lap: 0, 1, 2, 3, 0, … (the frozen body's three, then the gizmo face's) — a switch every 30° as before, with 3 quads or 4", () => {
    for (const n of [3, 4]) {
      const c = fixedCarousel(n, DEFAULT_CONFIG.quadSliceMaxDeg);
      expect(c.sliceRad * D).toBeCloseTo(30, 9);
      const seq: number[] = [];
      let prev = -1;
      for (let a = 0; a < 720; a += 0.5) {
        const tag = carouselQuad(c, a / D, prev);
        if (tag !== prev) seq.push(tag);
        prev = tag;
      }
      seq.forEach((t, i) => expect(t).toBe(i % n)); // round in order, never skipping, never back
      expect(seq.length).toBe(24); // two laps of 12 slices
    }
  });
  it("⭐ no flicker on an edge: the yellow kept within the hysteresis of the edge it came across", () => {
    const c = fixedCarousel(4, 30);
    const edge = c.offsetRad + c.sliceRad;
    const before = carouselQuad(c, edge - 0.01, -1);
    const after = carouselQuad(c, edge + 0.01, -1);
    expect(after).not.toBe(before);
    expect(carouselQuad(c, edge + QUAD_SLICE_HYSTERESIS_RAD / 2, before)).toBe(before);
    expect(carouselQuad(c, edge + QUAD_SLICE_HYSTERESIS_RAD * 2, before)).toBe(after);
  });
  it("⭐ the slider in FACE ALIGNMENT, 30° by default, 10–180 validated; wired over the quads' planes, the yellow's sense on the camera's side", () => {
    expect(DEFAULT_CONFIG.quadSliceMaxDeg).toBe(30);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, quadSliceMaxDeg: 9 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, quadSliceMaxDeg: 181 })).toThrow();
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "FACE ALIGNMENT"');
    const at = m.indexOf('"quadSliceMaxDeg"');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
    const o = readFileSync("src/render/orient_cube.ts", "utf8");
    expect(o).toContain("st.orientCarousel = { key: loopKey, c: fixedCarousel(planes.length, st.cfg.quadSliceMaxDeg) };");
    expect(o).toContain("const cand = k < 0 || at === null ? -1 : dirIndex(st, quadSide(planes[k]!, at, [cam.x, cam.y, cam.z]));");
  });
});
