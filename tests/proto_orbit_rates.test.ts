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
      expect(((pitchOf(cfg, v) - pitchOf(cfg, o.elevation)) * DEG) / mm).toBeCloseTo(r.pitchDegPerMm, 3);
    }
  });

  it("⭐ `Scene_1` today: yaw 5.10°/mm everywhere; pitch fastest at the waist, slowest near the outer rings, and its sign flips past the peak", () => {
    expect(orbitDegPerMm(cfg, 0.5).yawDegPerMm).toBeCloseTo(0.054 * 1.65 * DEG, 9);
    expect(orbitDegPerMm(cfg, 0.5).pitchDegPerMm).toBeGreaterThan(Math.abs(orbitDegPerMm(cfg, 0.9).pitchDegPerMm));
    // ⚠ not monotone: past the pitch's peak near v = 0.75 the sign flips
    expect(orbitDegPerMm(cfg, 0.6).pitchDegPerMm).toBeGreaterThan(0);
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
