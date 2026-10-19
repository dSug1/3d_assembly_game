/**
 * ⭐⭐⭐ (2026-10-17) THE SLIDE VIEW'S ANGLE BETWEEN RINGS 2 AND 3, THE CAMERA ALWAYS ON THE GIZMO — `src/input/waist_view.ts` and its wiring. The owner:
 * *"camera always aims at the gizmo, position the ring 2 and ring 3 so that the camera ends up in the semi-isometric view during the travel of the piece
 * between ring 2 and ring 3. Avoid S-shape travels of the piece during the whole travel. The key is positioning the ring 2 and ring 3 to match the
 * semi-isometric view during the waist travel."*
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { orbitOffset } from "../src/input/orbit";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const DEG = 180 / Math.PI;

describe("⭐⭐⭐ the slide view's angle between rings 2 and 3, the camera on the gizmo (2026-10-17)", () => {
  it("⭐⭐⭐ RINGS 2 AND 3 AT THE SLIDE VIEW'S TILT: height r·√2 — the direction to them 54.7° off the face's normal, 35.3° off the face (⛔ ±0.15: 31°)", async () => {
    const { isoWaistHeightM, waistRings } = await import("../src/input/waist_view");
    expect(isoWaistHeightM(0.09)).toBeCloseTo(0.12728, 5);
    expect(cfg.orbitMiddleHeightM).toBeCloseTo(isoWaistHeightM(cfg.orbitMiddleRadiusM), 12);
    expect(cfg.orbitLowerHeightM).toBeCloseTo(-isoWaistHeightM(cfg.orbitLowerRadiusM), 12);
    const { v2, v3 } = waistRings(cfg);
    for (const v of [v2, v3]) {
      const o = orbitOffset(cfg, 0, v, 1).offsetM;
      expect(90 - Math.abs(Math.atan2(o[1], Math.hypot(o[0], o[2])) * DEG)).toBeCloseTo(35.264, 2); // off the face (the radial is the face's normal at the waist)
    }
  });
  it("⛔ (2026-10-19, the owner: *\"remove the semi-isometric function as well as its slider entirely\"*) the hold between rings 2 and 3 and its cone slider are gone; the rings keep their height", () => {
    const w = readFileSync(new URL("../src/input/waist_view.ts", import.meta.url), "utf8");
    for (const gone of ["export function waistHoldDirection", "export function waistTurn", "export function waistConeWeight", "export function keepInFront"]) expect(w).not.toContain(gone);
    expect(code("input/camera_frame.ts")).not.toContain("waistHoldDirection");
    expect(code("render/tuning_menu.ts")).not.toContain("waistIsoConeDeg");
    expect("waistIsoConeDeg" in DEFAULT_CONFIG).toBe(false);
  });
});
