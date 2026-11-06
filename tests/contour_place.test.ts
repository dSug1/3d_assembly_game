/**
 * ⭐⭐⭐ THE GIZMO'S PLACE — THE CONTOUR ALONE; THE REAL SURFACE SHOWN (2026-11-06, `TILTED_ORBIT_REBUILD_SCOPE.md` §22; the owner: *"build with contour's
 * normal and (a) close in"*). `src/input/face_map.ts` (`contourPlace`, `contourExit`), `src/input/assembly_orbit.ts` (the approach below the contour:
 * `approachRange().floor`, `approachAt`), wired in `render/assembly_wiring.ts`. RED against `2b4643d` (`contourPlace`, `contourExit`, `approachAt`, the
 * floor absent: the gizmo's place read on the real surface per place — the stack's group, the bridged void, the blend's cast — and every step there moved
 * the piece and the camera).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, contourPlace, mapTarget, type FaceMap } from "../src/input/face_map";
import { approachAt, approachDistance, approachRange } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const D = Math.PI / 180;
const opts = { edgeMm: 10, edgeDeg: 10 };
/** `Scene_1`'s painting, 50 × 48 × 3.3 cm */
const THIN = { lo: [-0.25, 0, -0.05] as Vec3, hi: [0.25, 0.48, -0.017] as Vec3 };
/** how far `p` stands outside the contour (its facets' half-spaces): 0 on it, negative inside */
const outside = (m: FaceMap, p: Vec3) => Math.max(...m.facets.map((f) => f.n[0] * p[0] + f.n[1] * p[1] + f.n[2] * p[2] - f.e));

describe("⭐⭐⭐ the gizmo's place — the contour alone (§22)", () => {
  it("⭐⭐⭐ THROUGH EVERY EDGE ON THE CONTOUR'S SURFACE — never inside it (⛔ the chord across an edge cut into the part: the cast onto the real parts fixed it, and read every step of them); continuous: a 0.05° step moves it under 2 mm", () => {
    const m = buildFaceMap([], THIN);
    let worst = 0;
    for (const pitch of [-60, -30, 0, 20, 40, 44.9, 46, 60, 80]) {
      let prev: Vec3 | null = null;
      for (let yaw = 0; yaw < 360; yaw += 0.05) {
        const p = contourPlace(m, yaw * D, pitch * D, opts);
        expect(outside(m, p)).toBeGreaterThan(-1.0001e-4); // within `BLEND_FRONT_M` (0.1 mm) the chord is kept
        expect(outside(m, p)).toBeLessThan(1e-8);
        if (prev !== null) worst = Math.max(worst, Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]));
        prev = p;
      }
    }
    expect(worst).toBeLessThan(0.002);
    // a face's middle: the map's own place
    const t = mapTarget(m, 270 * D, 0, opts);
    expect(contourPlace(m, 270 * D, 0, opts)).toEqual(t.surface);
  });

  it("⭐⭐⭐ (a) THE APPROACH BELOW THE CONTOUR: on in past the contact on the contour (distance 0) to 0.3 m deep, at the last stretch's pace; `approachAt` inverts the distance", () => {
    const cfg = DEFAULT_CONFIG;
    const r = approachRange(cfg);
    expect(r.floor).toBeLessThan(r.min);
    expect(approachDistance(cfg, r.min)).toBe(0);
    expect(approachDistance(cfg, r.floor)).toBeCloseTo(-0.3, 9);
    const pace = (a: number) => (approachDistance(cfg, a + 1e-6) - approachDistance(cfg, a - 1e-6)) / 2e-6;
    expect(pace((r.min + r.floor) / 2)).toBeCloseTo(pace((r.min + r.waist) / 2), 6);
    const dw = approachDistance(cfg, r.waist);
    for (const d of [-0.25, -0.01, 0, 0.004, 0.05, dw / 2]) expect(approachDistance(cfg, approachAt(cfg, d))).toBeCloseTo(d, 9);
    expect(approachAt(cfg, -9)).toBe(r.floor);
    expect(approachAt(cfg, 99)).toBe(r.waist);
  });

  it("⭐⭐⭐ WIRED: what moves reads the contour (the gizmo's place, the piece, the foot, the face); the ring and the lines the real surface (`realOn`); the slide's depth kept at its way out; ⛔ `realAt`, `blendCast`, the bridged void deleted", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return { hit: { point: contourPlace(map, yaw, pitch, o), normal: t.normal, host: null }, t };");
    expect(a).toContain("ring = hit.normal === null ? null : realOn(st, hit.point, hit.normal);");
    expect(a).toContain("const shown = st.asmLocked || ring === null ? target : ring.point;");
    expect(a).toContain("const foot = footOf(st, target, u, d + liftOf(st, u));");
    expect(a).toContain("st.approach = approachAt(st.cfg, approachDistance(st.cfg, st.approach) - depth / cos);");
    expect(a).toContain("const g = st.asmGizmoAt ?? st.asmG; // ⭐⭐⭐ (§22) the ring: on the real surface");
    for (const gone of ["function realAt(", "function blendCast(", "function rawGizmo(", "function frameCast(", "stackDepthAt", "MAP_BRIDGE_FRONT_M"]) expect(a).not.toContain(gone);
    const f = code("input/face_map.ts");
    for (const gone of ["export function stackDepthAt(", "export function closedAlong(", "export function regionReal("]) expect(f).not.toContain(gone);
  });
});
