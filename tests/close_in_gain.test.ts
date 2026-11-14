/**
 * GOLDEN VECTORS — **THE CLOSE-IN GAIN** (2026-11-12, `CLOSE_IN_CONTACT.md` step 3; the owner: *"1b"* — the orbit's degrees per mm scaled down continuously
 * as the approach's distance shrinks): full from `orbitGainFullM` out, linear to the contact, where the gizmo travels `orbitContactMmPerMm` on the surface per
 * mm of finger. ⛔ Unscaled, close in a mm of finger moved the gizmo ~24 mm (probed: 30 px → 186 mm on the cube's top).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { closeInGain } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
// the probed case: 28.8° for 30 px (7.94 mm of finger) → 3.63 °/mm; the gizmo 186 mm → ~0.37 m of radius
const DEG_PER_MM = 28.78 / (30 / (96 / 25.4));
const R = 0.37;

describe("⭐⭐⭐ the close-in gain — full far out, the contact's 1 : 1 at the gizmo, linear between", () => {
  it("⭐⭐⭐ at the contact the gizmo moves `contactMmPerMm` per mm of finger: the full gain (~23 mm/mm) brought to 1", () => {
    const full = ((DEG_PER_MM * Math.PI) / 180) * R * 1000;
    expect(full).toBeGreaterThan(20); // ⛔ the old close-in gain: ~23 mm of gizmo per mm of finger
    const k0 = closeInGain(0, 0.6, 1, DEG_PER_MM, R);
    expect(k0 * full).toBeCloseTo(1, 9);
    expect(closeInGain(0, 0.6, 2.5, DEG_PER_MM, R) * full).toBeCloseTo(2.5, 9);
  });
  it("⭐⭐ full (1) from `fullM` out — the far orbit unchanged; linear between, never above 1; a contact gain above the full one: 1", () => {
    expect(closeInGain(0.6, 0.6, 1, DEG_PER_MM, R)).toBe(1);
    expect(closeInGain(6, 0.6, 1, DEG_PER_MM, R)).toBe(1);
    const k0 = closeInGain(0, 0.6, 1, DEG_PER_MM, R);
    expect(closeInGain(0.3, 0.6, 1, DEG_PER_MM, R)).toBeCloseTo((k0 + 1) / 2, 12);
    let prev = 0;
    for (let d = 0; d <= 0.7; d += 0.01) {
      const k = closeInGain(d, 0.6, 1, DEG_PER_MM, R);
      expect(k).toBeGreaterThanOrEqual(prev - 1e-12);
      expect(k).toBeLessThanOrEqual(1);
      prev = k;
    }
    expect(closeInGain(0, 0.6, 100, DEG_PER_MM, R)).toBe(1);
  });
  it("⭐ degenerate: no radius, no gain, no range — 1 (the orbit as it was)", () => {
    expect(closeInGain(0, 0.6, 1, DEG_PER_MM, 0)).toBe(1);
    expect(closeInGain(0, 0.6, 1, 0, R)).toBe(1);
    expect(closeInGain(0, 0, 1, DEG_PER_MM, R)).toBe(1);
  });
});

describe("⭐⭐⭐ wired: around the assembly the finger's yaw AND pitch scaled by it; two sliders, validated", () => {
  it("⭐⭐⭐ the drag's dx and dy × `kd`, read at the approach's distance; the coast records the scaled steps", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const kd = asmOn ? closeInGain(approachDistance(st.cfg, st.approach), st.cfg.orbitGainFullM, st.cfg.orbitContactMmPerMm, orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm, st.asm?.radius ?? 0) : 1;"); // ⛔ (2026-11-13) × the leash's gain deleted (1)
    expect(p).toContain("-fdx * st.cfg.boxGainYaw * st.pieceYawGainDrag * kd), dyPx * share * kd);");
    expect(p.indexOf("const kd = asmOn")).toBeLessThan(p.indexOf("st.orbitInertia.record(s.t, st.orbit.yaw - yaw0, travel.du);"));
  });
  it("⭐ the tunables: 0.6 m and 4 mm/mm by default (the owner on the device, 2026-11-12), validated, their sliders", () => {
    expect(DEFAULT_CONFIG.orbitGainFullM).toBe(0.6);
    expect(DEFAULT_CONFIG.orbitContactMmPerMm).toBe(4);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitGainFullM: 0 })).toThrow(/orbitGainFullM/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitContactMmPerMm: 0 })).toThrow(/orbitContactMmPerMm/);
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"orbitGainFullM", 0.05, 3, 0.05)');
    expect(m).toContain('"orbitContactMmPerMm", 0.1, 10, 0.1)');
  });
});
