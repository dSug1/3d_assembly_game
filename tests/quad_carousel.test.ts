/**
 * ⭐⭐⭐ THE YELLOW QUAD BY YAW (2026-10-19, the owner: *"each quad is highlighted at least once in a 360 yaw orbit and the yellow highlight switches from one
 * quad to the other in a progressive way (for example, no switch from one quad to the opposite quad)"* → *"build it anchored. face alignment menu."*) —
 * `input/quad_carousel.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { anchoredSlices, carouselQuad, quadCarousel, quadTour, QUAD_SLICE_HYSTERESIS_RAD } from "../src/input/quad_carousel";
import type { Vec3 } from "../src/core/vec";

const D = 180 / Math.PI;
const unit = (a: Vec3): Vec3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const ang = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;
const BOX: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
// Piece42's six faces in the world (the frustum seated on Piece5's right face, measured in the app)
const PIECE42: Vec3[] = ([[0.26, 0, 0.96], [0.26, 0, -0.96], [0.53, -0.85, 0], [0.53, 0.85, 0], [1, 0, 0], [-1, 0, 0]] as Vec3[]).map(unit);

describe("⭐⭐⭐ the yellow quad by yaw (2026-10-19)", () => {
  it("⭐⭐ the loop steps between NEIGHBOURS: a box's six faces at 90° every step, never to the opposite face", () => {
    for (const set of [BOX, PIECE42]) {
      const t = quadTour(set);
      expect([...t].sort()).toEqual(set.map((_, i) => i));
      for (let i = 0; i < t.length; i++) expect(ang(set[t[i]!]!, set[t[(i + 1) % t.length]!]!)).toBeLessThan(170);
    }
    const t = quadTour(BOX);
    for (let i = 0; i < 6; i++) expect(ang(BOX[t[i]!]!, BOX[t[(i + 1) % 6]!]!)).toBeCloseTo(90, 6);
  });
  it("⭐ ANCHORED: the fewest slices of at most the maximum that are a whole multiple of the quads", () => {
    expect(anchoredSlices(6, 40)).toBe(12); // 30° each, every quad twice a lap
    expect(anchoredSlices(9, 40)).toBe(9); // 40°
    expect(anchoredSlices(10, 40)).toBe(10); // 36°
    expect(anchoredSlices(6, 60)).toBe(6); // 60°
    expect(anchoredSlices(4, 40)).toBe(12); // 30°, three times a lap
  });
  it("⭐⭐⭐ on Piece42's top face a 360° yaw orbit lights EVERY quad, each as often, the same yaws every lap; each switch to a neighbour in the loop (⛔ one quad won 358° of 360°)", () => {
    const c = quadCarousel(PIECE42, 40);
    expect(c.slices).toBe(12);
    const seen = new Map<number, number>();
    let prev = -1;
    const lap: number[] = [];
    for (let a = 0; a < 720; a += 0.5) {
      const tag = carouselQuad(c, a / D, prev);
      if (a < 360) lap.push(tag);
      else expect(tag).toBe(lap[(a - 360) * 2]); // the second lap the same as the first
      if (prev >= 0 && tag !== prev) {
        const i = c.order.indexOf(prev), j = c.order.indexOf(tag);
        const step = Math.min((j - i + 6) % 6, (i - j + 6) % 6);
        expect(step).toBe(1); // a neighbour in the loop
        if (a < 360) seen.set(tag, (seen.get(tag) ?? 0) + 1);
      }
      prev = tag;
    }
    for (let tag = 0; tag < 6; tag++) expect(lap.includes(tag)).toBe(true);
    const counts = [0, 1, 2, 3, 4, 5].map((t) => lap.filter((x) => x === t).length);
    for (const k of counts) expect(Math.abs(k - 720 / 6)).toBeLessThan(15); // each about 120 of 720 samples — twice a lap, 30° each
  });
  it("⭐⭐ the sideways quads lit NEAR the yaw they face — best effort: within two slices (⚠ a loop of neighbours that comes round every 180° cannot put every side quad at its own yaw: its second turn falls where its opposite faces)", () => {
    for (const set of [BOX, PIECE42]) {
      const c = quadCarousel(set, 40);
      set.forEach((n, tag) => {
        if (Math.hypot(n[0], n[2]) < 0.3) return;
        const h = Math.atan2(n[2], n[0]);
        let near = Infinity;
        for (let a = -Math.PI; a < Math.PI; a += 0.5 / D) if (carouselQuad(c, a, -1) === tag) near = Math.min(near, Math.abs(Math.atan2(Math.sin(a - h), Math.cos(a - h))));
        expect(near * D).toBeLessThanOrEqual(2 * c.sliceRad * D + 1); // + the sweep's own 0.5° step
      });
    }
  });
  it("⭐ no flicker on an edge: the yellow kept within the hysteresis of the edge it came across", () => {
    const c = quadCarousel(BOX, 40);
    const edge = c.offsetRad + c.sliceRad; // slice 0 → 1
    const before = carouselQuad(c, edge - 0.01, -1);
    const after = carouselQuad(c, edge + 0.01, -1);
    expect(after).not.toBe(before);
    expect(carouselQuad(c, edge + QUAD_SLICE_HYSTERESIS_RAD / 2, before)).toBe(before);
    expect(carouselQuad(c, edge + QUAD_SLICE_HYSTERESIS_RAD * 2, before)).toBe(after);
  });
  it("⭐ the slider in FACE ALIGNMENT, 40° at most by default, 10–180 validated; wired in the quads' frame", () => {
    expect(DEFAULT_CONFIG.quadSliceMaxDeg).toBe(40);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, quadSliceMaxDeg: 9 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, quadSliceMaxDeg: 181 })).toThrow();
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "FACE ALIGNMENT"');
    const at = m.indexOf('"quadSliceMaxDeg"');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
    const o = readFileSync("src/render/orient_cube.ts", "utf8");
    expect(o).toContain("const cand = at === null ? -1 : carouselQuad(st.orientCarousel.c, Math.atan2(cam.z - g.z, cam.x - g.x), st.orientShown.candidate);");
  });
});
