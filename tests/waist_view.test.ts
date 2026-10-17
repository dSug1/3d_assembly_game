/**
 * ⭐⭐⭐ (2026-10-17) THE SLIDE VIEW BETWEEN RINGS 2 AND 3 — `src/input/waist_view.ts` and its wiring. The owner: *"during the travel between the 2nd ring
 * and the 3rd ring the camera positions itself so that the view is nearly isometric (i.e. same nearest-corner-with-gravity-direction-aligned-with-screen-
 * vertical-direction isometric view as during the slide)"* → *"12 mm outside rings 2–3"*, *"build both and make a slider to select which"*.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { elevationGainScale } from "../src/input/orbit";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ISO = 1 / Math.sqrt(3);

describe("⭐⭐⭐ the slide view between rings 2 and 3 (2026-10-17)", () => {
  it("⭐⭐ its weight: full between rings 2 and 3, none 12 mm of finger outside them (the slide view's own span), smooth and monotone between", async () => {
    const { waistWeight, waistRings } = await import("../src/input/waist_view");
    const { v2, v3 } = waistRings(cfg);
    const span = cfg.pieceOrbitEnterMm * cfg.gainOrbitElevation * elevationGainScale(cfg);
    expect(waistWeight(cfg, (v2 + v3) / 2)).toBe(1);
    expect(waistWeight(cfg, v2)).toBe(1);
    expect(waistWeight(cfg, v3)).toBe(1);
    expect(waistWeight(cfg, v2 + span + 1e-6)).toBe(0);
    expect(waistWeight(cfg, v3 - span - 1e-6)).toBe(0);
    let prev = 1;
    for (let v = v2; v <= Math.min(1, v2 + span); v += span / 50) { const w = waistWeight(cfg, v); expect(w).toBeLessThanOrEqual(prev + 1e-12); expect(prev - w).toBeLessThan(0.05); prev = w; }
  });
  it("⭐⭐⭐ a corner is the SLIDE VIEW's: 35° off the face (equal angles to its normal and both axes), its axes gravity's — a side face's t2 straight up", async () => {
    const { waistFrame, cornerDirection } = await import("../src/input/waist_view");
    const f = waistFrame([0, 0, 1], [1, 0, 0])!;
    expect(f.t2[1]).toBeCloseTo(1, 12); // gravity's axis on a side face
    expect(f.t1[1]).toBeCloseTo(0, 12);
    for (const phi of [Math.PI / 4, (3 * Math.PI) / 4, -Math.PI / 4]) {
      const d = cornerDirection(f, phi);
      expect(Math.hypot(...d)).toBeCloseTo(1, 12);
      expect(dot(d, f.n)).toBeCloseTo(ISO, 12);
      expect(Math.abs(dot(d, f.t1))).toBeCloseTo(ISO, 12);
      expect(Math.abs(dot(d, f.t2))).toBeCloseTo(ISO, 12);
    }
    const top = waistFrame([0, 1, 0], [1, 0, 0])!; // a level face: t1 across the camera's heading
    expect(Math.abs(dot(top.t1, [1, 0, 0]))).toBeLessThan(1e-12);
    // ⭐ continuous as the face turns level (a gizmo change): no jump of t1 anywhere (⛔ a threshold switch jumped the corner)
    let prev = waistFrame([1, 0, 0], [1, 0, 0])!.t1;
    for (let k = 1; k <= 200; k++) { const a = (k / 200) * (Math.PI / 2); const t = waistFrame([Math.cos(a), Math.sin(a), 0], [1, 0, 0])!.t1; expect(Math.acos(Math.min(1, dot(t, prev)))).toBeLessThan(0.05); prev = t; }
  });
  it("⭐⭐⭐ TURNING (slider 1): ring 2's corner at ring 2, ring 3's at ring 3, turned about the face's NORMAL between — always 35° off it, smooth", async () => {
    const { waistFrame, waistDirection, waistRings, cornerDirection } = await import("../src/input/waist_view");
    const { v2, v3 } = waistRings(cfg);
    const f = waistFrame([0, 0, 1], [1, 0, 0])!;
    const a: [number, number] = [1, 1], b: [number, number] = [1, -1]; // above-right, below-right (a side face entered from above)
    const at2 = waistDirection(cfg, f, a, b, v2, true, null);
    const at3 = waistDirection(cfg, f, a, b, v3, true, null);
    const ca = cornerDirection(f, Math.atan2(1, 1)), cb = cornerDirection(f, Math.atan2(-1, 1));
    for (let i = 0; i < 3; i++) { expect(at2[i]).toBeCloseTo(ca[i]!, 12); expect(at3[i]).toBeCloseTo(cb[i]!, 12); }
    let prev = at2;
    for (let v = v2; v >= v3; v -= (v2 - v3) / 100) {
      const d = waistDirection(cfg, f, a, b, v, true, null);
      expect(dot(d, f.n)).toBeCloseTo(ISO, 12);
      expect(Math.acos(Math.min(1, dot(d, prev)))).toBeLessThan(0.05);
      prev = d;
    }
  });
  it("⭐⭐ KEEPING (slider 0): the corner it entered by, all the way between the rings", async () => {
    const { waistFrame, waistDirection, waistRings, cornerDirection } = await import("../src/input/waist_view");
    const { v2, v3 } = waistRings(cfg);
    const f = waistFrame([0, 0, 1], [1, 0, 0])!;
    const ca = cornerDirection(f, Math.atan2(1, 1));
    for (const v of [v2, (v2 + v3) / 2, v3]) { const d = waistDirection(cfg, f, [1, 1], [1, -1], v, false, "A"); for (let i = 0; i < 3; i++) expect(d[i]).toBeCloseTo(ca[i]!, 12); }
  });
  it("⭐ the entry latch: from above ring 2 'A', below ring 3 'B'; kept while the view lasts, dropped once it is gone", async () => {
    const { waistEntryNext } = await import("../src/input/waist_view");
    expect(waistEntryNext(null, 0.2, 0.7, 0.5)).toBe("A");
    expect(waistEntryNext(null, 0.2, 0.3, 0.5)).toBe("B");
    expect(waistEntryNext("A", 1, 0.3, 0.5)).toBe("A"); // kept across the crossing
    expect(waistEntryNext("A", 0, 0.3, 0.5)).toBeNull();
  });
  it("⭐ the slider: in CAMERA ORBIT AROUND CENTER, 1 (turn) by default, validated", () => {
    expect(DEFAULT_CONFIG.waistCornerTurn).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, waistCornerTurn: 2 })).toThrow(/waistCornerTurn/);
    const m = code("render/tuning_menu.ts");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    const at = m.indexOf('"waistCornerTurn"');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
  });
  it("⭐⭐ wired: in the centre orbit, only with the gizmo on a face; looking at the piece; the camera's up upright by the larger of the two views' weights", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const wv = po === null && st.pieceEntry === null && st.centreReturn === null ? waistViewNow(st, pp, camAt, lookAt) : { camAt, lookAt, w: 0 };");
    expect(g).toContain("uprightBlend(camFrame.up, [lookAt[0] - camAt[0], lookAt[1] - camAt[1], lookAt[2] - camAt[2]], Math.max(hb.w, wv.w));");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("const sw = hoverCameraSwing(camAt, lookAt, piece, dir, w);");
    expect(c).toContain("const off = st.cfg.cameraYawOffsetDeg >= 0 ? 0.2 : -0.2;"); // the side across the face from a fixed setting
    expect(code("input/orbit_rig.ts")).toContain("faced: normal !== null");
  });
});
