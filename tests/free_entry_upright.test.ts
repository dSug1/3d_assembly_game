// ⭐⭐⭐ (2026-11-17, package LF1 — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §4.2, §9, §10; the owner: *"Agreed to every recommendation.
// Proceed."*) (iv′) THE PICTURE'S UPRIGHT CONTINUED ON A FREE FACE, behind the switch `freeEntryUpright` (0 = the entry edge's layout at once, as at
// commit A; 1 = the default): near the edge the gizmo came in by, the heading shown is the picture's level direction (the view's level part turned by
// the offset the bound face's camera stood at, read once at the entry — `pictureOffset`, `viewLevelTurned`), turned toward the entry edge's layout as
// the gizmo goes deeper, whole at the depth of the face's centre; faded to the layout where the view nears the face's normal (70° – 80° of elevation).
// RED against commit A (the functions absent) and against eleven mutants, one per term (listed in `LEVEL_FACE_ENTRY.md` §10).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { entryBlendHeading, FREE_ENTRY_FADE_FROM_DEG, FREE_ENTRY_FADE_TO_DEG, freeHeadingAngle, pictureLevel, pictureOffset, viewLevelTurned } from "../src/input/free_face";
import { offsetFrame } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const head = (v: Vec3) => Math.atan2(v[2], v[0]);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const at = (h: number): Vec3 => [Math.cos(h), 0, Math.sin(h)];
// Scene_0bis's bottom entered from the lower front rectangle: the layout out of the bottom toward the rectangle (−z), the camera leaning 30° along the
// edge toward +x; the face's centre 94 mm deep
const LAYOUT: Vec3 = [0, 0, -1];
const VIEW: Vec3 = [Math.sin(30 * D) * 0.57, -0.82, -Math.cos(30 * D) * 0.57]; // centre → camera: below, in front, leaning 30° toward +x
const C = 0.094;
const EL = 55 * D;

describe("(iv′) `entryBlendHeading` — the picture's upright continued, the layout by the face's middle", () => {
  it("at the entry edge and on the band past it (depth ≤ 0): the picture's level direction, laid level, ITS SIGN KEPT", () => {
    for (const d of [0, -0.002, -0.01]) {
      const h = entryBlendHeading(VIEW, LAYOUT, d, C, EL);
      expect(h[1]).toBe(0);
      expect(Math.hypot(h[0], h[2])).toBeCloseTo(1, 12);
      expect(wrap(head(h) - head([VIEW[0], 0, VIEW[2]]))).toBeCloseTo(0, 12);
    }
    // ⛔ never turned to the layout's side: a picture level direction 100° off the layout stays where it is (the flip was a jump near a tip)
    const off100 = at(head(LAYOUT) + 100 * D);
    expect(wrap(head(entryBlendHeading(off100, LAYOUT, 0, C, EL)) - head(off100))).toBeCloseTo(0, 12);
    // …and turns toward the layout the short way as the depth grows (100° → 50° half way)
    expect(wrap(head(entryBlendHeading(off100, LAYOUT, C / 2, C, EL)) - head(LAYOUT))).toBeCloseTo(50 * D, 12);
  });

  it("at the centre's depth and beyond: the layout itself", () => {
    for (const d of [C, C + 0.001, 0.3]) expect(entryBlendHeading(VIEW, LAYOUT, d, C, EL)).toBe(LAYOUT);
  });

  it("monotone between: the heading turns from the view's toward the layout as the depth grows, never past it, the short way (a smoothstep)", () => {
    const h0 = head([VIEW[0], 0, VIEW[2]]);
    const hL = head(LAYOUT);
    let prev = Math.abs(wrap(h0 - hL));
    for (let i = 1; i <= 20; i++) {
      const d = (C * i) / 20;
      const now = Math.abs(wrap(head(entryBlendHeading(VIEW, LAYOUT, d, C, EL)) - hL));
      expect(now).toBeLessThanOrEqual(prev + 1e-12);
      prev = now;
    }
    // half way: half the angle (the smoothstep's middle); a quarter of the way: 0.15625 of it
    const full = wrap(hL - h0);
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, C / 2, C, EL)) - h0)).toBeCloseTo(full * 0.5, 12);
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, C / 4, C, EL)) - h0)).toBeCloseTo(full * 0.15625, 12);
  });

  it("faded by the view's elevation: whole up to 70°, the layout from 80° (close in the view is along the face's normal), monotone between", () => {
    expect(FREE_ENTRY_FADE_FROM_DEG).toBe(70);
    expect(FREE_ENTRY_FADE_TO_DEG).toBe(80);
    const h0 = head([VIEW[0], 0, VIEW[2]]);
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, 0, C, 70 * D)) - h0)).toBeCloseTo(0, 12);
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, 0, C, -60 * D)) - h0)).toBeCloseTo(0, 12); // looking down: the same
    for (const e of [80, 85, 90, -88]) expect(entryBlendHeading(VIEW, LAYOUT, 0, C, e * D)).toBe(LAYOUT);
    let prev = 0;
    for (let e = 70; e <= 80; e += 0.5) {
      const off = Math.abs(wrap(head(entryBlendHeading(VIEW, LAYOUT, 0, C, e * D)) - h0));
      expect(off).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = off;
    }
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, 0, C, 75 * D)) - h0)).toBeCloseTo(wrap(head(LAYOUT) - h0) * 0.5, 12);
  });

  it("the switch at 0 (`upright` 0): the layout at every depth and elevation; no level part in the view: the layout", () => {
    for (const d of [-0.01, 0, C / 3, C, 0.2]) for (const e of [0, 55, 75, 90]) expect(entryBlendHeading(VIEW, LAYOUT, d, C, e * D, 0)).toBe(LAYOUT);
    expect(entryBlendHeading([0, -1, 0], LAYOUT, 0, C, 55 * D)).toBe(LAYOUT);
    // any heading of the layout's (a triangle's side, 120° round): the same rule
    const L2 = at(30 * D);
    expect(entryBlendHeading(at(-10 * D), L2, 0, C, EL)[0]).toBeCloseTo(Math.cos(-10 * D), 12);
  });
});

describe("(iv′) `pictureLevel` — the bound face's picture continued EXACTLY on the free face", () => {
  it("the free face's camera with the heading `pictureLevel` gives back the bound camera's own heading (any heading, not only upright; looking up and down)", () => {
    for (const e of [-65, -50, -35, 35, 50, 65])
      for (const yu of [-150, -90, -20, 40, 120])
        for (const dh of [-25, -8, 0, 6, 30]) {
          const u: Vec3 = [Math.cos(e * D) * Math.cos(yu * D), Math.sin(e * D), Math.cos(e * D) * Math.sin(yu * D)];
          const hB = (yu + dh) * D; // the bound camera's heading: upright (dh 0) or off it (the spit's side bias)
          const T = pictureLevel(u, offsetFrame(u, hB, 0, 0).up);
          expect(T[1]).toBe(0);
          expect(Math.abs(wrap(freeHeadingAngle(T, u) - hB))).toBeLessThan(1e-9);
        }
  });
  it("an upright camera: the view's own level part (the prototype's reading) — off upright they part (the offsets' and the bias's 3° – 4°)", () => {
    const nu = Math.hypot(0.3, 0.8, 0.52);
    const u: Vec3 = [0.3 / nu, -0.8 / nu, -0.52 / nu]; // a unit view 53° below level
    const lv = head([u[0], 0, u[2]]);
    const line = (a: number) => Math.abs(Math.sin(a)); // the same LINE (either sign: `entryBlendHeading` turns it to the layout's side)
    expect(line(head(pictureLevel(u, offsetFrame(u, lv, 0, 0).up)) - lv)).toBeLessThan(1e-12);
    expect(line(head(pictureLevel(u, offsetFrame(u, lv + 3 * D, 0, 0).up)) - lv)).toBeGreaterThan(Math.sin(1 * D)); // 1.1° here for 3° of heading off upright
  });
});

describe("(iv′) the picture's offset read ONCE at the entry (`pictureOffset`, `viewLevelTurned`)", () => {
  it("at the entry: the view's level part turned by the offset IS the picture's level direction — through `entryBlendHeading` at depth 0 the bound camera's heading comes back", () => {
    for (const e of [-65, -40, 40, 65])
      for (const yu of [-150, -20, 120])
        for (const dh of [-12, -3, 0, 4, 15]) {
          const u: Vec3 = [Math.cos(e * D) * Math.cos(yu * D), Math.sin(e * D), Math.cos(e * D) * Math.sin(yu * D)];
          const hB = (yu + dh) * D;
          const up = offsetFrame(u, hB, 0, 0).up;
          const P = pictureLevel(u, up);
          const layout = at(head(P) + 35 * D); // a layout 35° off the picture
          const off = pictureOffset(u, up);
          expect(Math.abs(wrap(head(viewLevelTurned(u, off)) - head(P)))).toBeLessThan(1e-9); // the picture's level direction itself, its sign too
          const T = entryBlendHeading(viewLevelTurned(u, off), layout, 0, C, e * D);
          expect(Math.abs(wrap(freeHeadingAngle(T, u) - hB))).toBeLessThan(1e-9);
        }
  });
  it("an upright picture: offset 0; 4° off upright: about 4° / sin(elevation) on the level; no level part: 0", () => {
    const u: Vec3 = [0, -Math.sin(55 * D), -Math.cos(55 * D)];
    expect(pictureOffset(u, offsetFrame(u, head(u), 0, 0).up)).toBeCloseTo(0, 12); // below a face: the up toward the camera's side
    expect(Math.abs(pictureOffset(u, offsetFrame(u, head(u) + 4 * D, 0, 0).up))).toBeGreaterThan(2 * D);
    const above: Vec3 = [0, Math.sin(55 * D), -Math.cos(55 * D)];
    expect(Math.abs(wrap(pictureOffset(above, offsetFrame(above, head(above), 0, 0).up) - Math.PI))).toBeLessThan(1e-9); // above: the up away from it
    expect(pictureOffset([0, -1, 0], [0, 0, 1])).toBe(0);
    expect(viewLevelTurned([1, -1, 0], 90 * D)[2]).toBeCloseTo(1, 12);
  });
});

describe("the switch `freeEntryUpright` (0 or 1, the default 1) — validated as `freeFaceSquare`, a slider in POLAR ZONES, a URL override", () => {
  it("the default 1; 0 and 1 valid; anything else refused", () => {
    expect(DEFAULT_CONFIG.freeEntryUpright).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeEntryUpright: 0 })).not.toThrow();
    for (const v of [0.5, 2, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeEntryUpright: v })).toThrow();
  });

  it("wired: the depth read at the gizmo's place each frame (`freeDepthAt`), the heading SHOWN by the camera's frame from its direction before the offsets (`freeShownHeading` → `entryBlendHeading`); the entry edge only with the switch on and an entry over an edge", () => {
    const src = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8");
    expect(src).toMatch(/const entry = st\.cfg\.freeEntryUpright === 1 \? freeEntryEdge\(at\.contour, ci, from\) : null;/);
    expect(src).toMatch(/if \(fr\.entry !== null\) st\.asmFree = \{ \.\.\.fr, depth: freeDepthAt\(fr\.entry, B, t\) \};/);
    expect(src).toMatch(/const off = fr\.offset \?\? pictureOffset\(uW, offsetFrame\(uW, hBound, 0, 0\)\.up\);/); // read ONCE (the entry frame)
    expect(src).toMatch(/const h = entryBlendHeading\(viewLevelTurned\(uW, off\), fr\.layout, fr\.depth, fr\.entry\.centreDepth, el, st\.cfg\.freeEntryUpright\);/);
    expect(src).toMatch(/if \(st\.asmFree !== null\) return offsetFrame\(uW, freeHeadingAngle\(freeShownHeading\(st, uW, spitCameraHeading\(uW, st\.asmZone!\.zone\.axis, side\)\), uW\), o\.yawRad, o\.pitchRad\);/);
    expect(src).toMatch(/if \(fr\.entry === null\) return fr\.heading;/); // the switch 0 / no edge: the layout carried, as before
    const menu = readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8");
    expect(menu).toContain('"freeEntryUpright", 0, 1, 1)');
  });
});
