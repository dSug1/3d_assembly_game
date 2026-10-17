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
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ISO = 1 / Math.sqrt(3);

describe("⭐⭐⭐ the slide view between rings 2 and 3 (2026-10-17)", () => {
  it("⭐⭐⭐ LATCHED ALL ALONG THE CURVE (the owner: *\"I would prefer the way in and way out of the semi-isometric view latch since the beginning of the travel so that there is no S-shape travel\"* → *\"build 1 following my suggestion\"*): the weight is the gizmo's being on a face — eased by its own change — never the ring parameter", async () => {
    const { waistLatchWeight } = await import("../src/input/waist_view");
    expect(waistLatchWeight(false, true, 1)).toBe(1);
    expect(waistLatchWeight(false, true, 0)).toBe(0);
    expect(waistLatchWeight(false, true, 0.3)).toBeCloseTo(0.3, 12); // in with the gizmo's change
    expect(waistLatchWeight(true, true, 0.3)).toBe(1); // face to face: held
    expect(waistLatchWeight(true, false, 1)).toBe(0); // no face: none
    expect(code("render/camera_rig.ts")).not.toContain("waistWeight("); // ⛔ a ramp by v: the S-shape on rings 1 and 4
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
  it("⭐ the corner ENTERED by (slider 0): re-read whenever the piece is outside rings 2–3 (above ring 2 'A', below ring 3 'B'), kept across them", async () => {
    const { waistEntryNext } = await import("../src/input/waist_view");
    expect(waistEntryNext(null, 0.7, 0.57, 0.43)).toBe("A");
    expect(waistEntryNext("A", 0.3, 0.57, 0.43)).toBe("B"); // out below ring 3: re-read (⛔ latched once along a whole curve, it froze)
    expect(waistEntryNext("A", 0.5, 0.57, 0.43)).toBe("A"); // across the rings: kept
    expect(waistEntryNext(null, 0.5, 0.57, 0.43)).toBe("A"); // first seen inside: the nearer ring's
  });
  it("⭐⭐⭐ IN FRONT OF THE REAL FACE (the owner: *\"if the hosting face is vertical and the travel starts with a camera view close to the edge of the hosting face, the semi-isometric view can push the camera on the other side of the hosting face from the piece\"*): the side across it the one in front of the tapped face's normal; a corner dipping behind it tilted back", async () => {
    const { waistFrame, cornerDirection, frontSide, keepInFront, FRONT_MIN } = await import("../src/input/waist_view");
    const n0: Vec3 = [0, 0, 1]; // the face as tapped
    const d = (60 * Math.PI) / 180; // dx swung the curve's halfway direction 60° toward the face's edge
    const f = waistFrame([Math.sin(d), 0, Math.cos(d)], [Math.sin(d), 0, Math.cos(d)])!;
    const s1 = frontSide(f, n0, 1);
    const front = cornerDirection(f, Math.atan2(1, s1)), back = cornerDirection(f, Math.atan2(1, -s1));
    expect(dot(front, n0)).toBeGreaterThan(0.4); // in front
    expect(dot(back, n0)).toBeLessThan(0); // ⛔ the other side (the yaw offset's could pick it): behind the face
    const kept = keepInFront(back, n0);
    expect(dot(kept, n0)).toBeCloseTo(FRONT_MIN, 9); // tilted back in front
    expect(Math.hypot(...kept)).toBeCloseTo(1, 12);
    expect(keepInFront(front, n0)).toEqual(front); // a corner in front untouched
    expect(frontSide(waistFrame([0, 1, 0], [1, 0, 0])!, [0, 1, 0], -1)).toBe(-1); // a level face: across it nothing to choose — the fallback
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
    expect(code("render/camera_rig.ts")).toContain("const w = waistLatchWeight(!!st.rigFrom.faced, !!st.rigTo.faced, st.rigShare);");
    expect(code("input/orbit_rig.ts")).toContain("normal: normal === null ? null : normal");
    expect(g).toContain("uprightBlend(camFrame.up, [lookAt[0] - camAt[0], lookAt[1] - camAt[1], lookAt[2] - camAt[2]], Math.max(hb.w, wv.w));");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("const sw = hoverCameraSwing(camAt, lookAt, piece, dir, w);");
    expect(c).toContain("const off = st.cfg.cameraYawOffsetDeg >= 0 ? 0.2 : -0.2;"); // the side across the face from a fixed setting
    expect(code("input/orbit_rig.ts")).toContain("faced: normal !== null");
  });
});
