/**
 * ⭐ prototype (green box) — the degrees of orbit one millimetre of finger gives (the owner, 2026-10-02: *"compute somewhere the delta
 * yaw and pitch orbit degrees that a delta x or delta y position input provides"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { orbitDegPerMm, pitchOf } from "../src/input/follow_camera";
import { OrbitController } from "../src/input/orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { SCENE_1 } from "../src/content/scene_1";
import { mmToPx } from "../src/core/units";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const DEG = 180 / Math.PI;
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);

describe("⭐ prototype — orbit degrees per millimetre of finger", () => {
  it("⭐⭐ matches what the green piece's orbit drag ACTUALLY does with 0.001 mm of finger — yaw anywhere, pitch at each ring position", () => {
    for (const v of [0.05, 0.25, 0.4, 0.5, 0.6, 0.75, 0.95]) {
      const r = orbitDegPerMm(cfg, v);
      // the drag `orbitDragStep` makes: the box gains applied to the finger's pixels, the controller's own mm conversion
      const o = new OrbitController(cfg, 0, v);
      const mm = 0.001;
      o.drag(-mm * mmToPx(1) * cfg.boxGainYaw, -mm * mmToPx(1) * cfg.boxGainPitch);
      expect(Math.abs(o.yaw * DEG) / mm).toBeCloseTo(r.yawDegPerMm, 6);
      // signed: per mm of finger DOWN (`v` up, the box's inverted orbit) — here the drag sent the finger UP, so `v` went down
      // (relative: on the owner's 0.09 m / 0.15 m waist the rate reaches ~13°/mm, where 0.001 mm already bends)
      const measured = ((pitchOf(cfg, v) - pitchOf(cfg, o.elevation)) * DEG) / mm;
      expect(Math.abs(measured - r.pitchDegPerMm)).toBeLessThan(1e-3 * Math.max(1, Math.abs(r.pitchDegPerMm)));
    }
  });

  it("⭐ `Scene_1` today: yaw 5.10°/mm everywhere; pitch fastest just below the waist, slow near the outer rings, its sign flipping past the peak", () => {
    expect(orbitDegPerMm(cfg, 0.5).yawDegPerMm).toBeCloseTo(0.054 * 1.65 * DEG, 9);
    // ⚠ the owner's waist, 2026-10-02: middle ring 0.09 m at +0.15 m and a FOURTH ring 0.09 m at −0.15 m — symmetric: the pitch runs
    // −61° → 0° → +61° through the waist, fastest (~5.3°/mm) at v = 0.4 / 0.6, then back to ±31.7° at the outer rings (the sign
    // flips past ±61°, near v = 0.3 / 0.7). (With the middle ring alone it peaked ~13°/mm at v = 0.45.)
    expect(orbitDegPerMm(cfg, 0.4).pitchDegPerMm).toBeGreaterThan(5);
    expect(orbitDegPerMm(cfg, 0.4).pitchDegPerMm).toBeLessThan(6);
    expect(orbitDegPerMm(cfg, 0.6).pitchDegPerMm).toBeCloseTo(orbitDegPerMm(cfg, 0.4).pitchDegPerMm, 6);
    expect(orbitDegPerMm(cfg, 0.75).pitchDegPerMm).toBeLessThan(0);
    expect(orbitDegPerMm(cfg, 0.25).pitchDegPerMm).toBeLessThan(0);
    expect(orbitDegPerMm(cfg, 0.9).pitchDegPerMm).toBeLessThan(0);
    // inside the leash, the box's gains scale both
    const slow = orbitDegPerMm(cfg, 0.5, { yaw: 0.5, pitch: 0.25 });
    expect(slow.yawDegPerMm).toBeCloseTo(orbitDegPerMm(cfg, 0.5).yawDegPerMm * 0.5, 9);
    expect(slow.pitchDegPerMm).toBeCloseTo(orbitDegPerMm(cfg, 0.5).pitchDegPerMm * 0.25, 9);
  });

  it("⭐ wired: the HUD's `green` line reads it at the rig's ring position, with the leash gains", () => {
    const h = code("render/hud_paint.ts");
    expect(h).toMatch(/const r = orbitDegPerMm\(st\.cfg, st\.orbit\.elevation, g\);/);
    expect(h).toMatch(/orbit \$\{r\.yawDegPerMm\.toFixed\(2\)\}°\/mm dx, \$\{r\.pitchDegPerMm\.toFixed\(2\)\}°\/mm dy/);
  });

});
