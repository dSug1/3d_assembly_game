/**
 * GOLDEN VECTORS — **`Scene_1`, the painting** (the owner, 2026-09-27): the data as given, the
 * renaming, the lights' conventions checked against the owner's own words, and the scene switch.
 */
import { describe, expect, it } from "vitest";
import { SCENE_1, SCENE_1_SLOTS } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";
import { SCENES, sceneAt } from "../src/content/scenes";
import { parseSceneDescriptor, serializeSceneDescriptor } from "@core/game_structure";
import { illuminanceAt, kelvinToRgb, unityForward, type LightSpec } from "@core/lighting";
import { levelElevation, orbitOffset } from "@input/orbit";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const pieces = SCENE_1.bodies.filter((b) => b.id !== "Floor");

describe("⭐⭐⭐ the painting, as the owner's table gives it", () => {
  it("41 pieces and a frozen floor", () => {
    expect(pieces.length).toBe(41);
    expect(SCENE_1.bodies.find((b) => b.id === "Floor")?.frozen).toBe(true);
    expect(pieces.every((b) => !b.frozen)).toBe(true);
  });

  it("⭐ every name Piece1..Piece41 is taken exactly once", () => {
    const ids = new Set(pieces.map((b) => b.id));
    expect([...ids].sort()).toEqual(Array.from({ length: 41 }, (_, i) => `Piece${i + 1}`).sort());
  });

  it("⭐ the owner's stated bounds: x ≈ −2.41 → 2.46, gravity ≈ −2.13 → 2.67", () => {
    const lo = [Infinity, Infinity];
    const hi = [-Infinity, -Infinity];
    for (const b of pieces)
      for (const i of [0, 1]) {
        lo[i] = Math.min(lo[i]!, b.position[i]! - b.dims[i]! / 2);
        hi[i] = Math.max(hi[i]!, b.position[i]! + b.dims[i]! / 2);
      }
    expect(lo[0]).toBeCloseTo(-2.41, 1);
    expect(hi[0]).toBeCloseTo(2.46, 1);
    expect(lo[1]).toBeCloseTo(-2.13, 1);
    expect(hi[1]).toBeCloseTo(2.67, 1);
  });

  it("every piece stands in one plane, 0.3 deep, unrotated", () => {
    for (const b of pieces) {
      expect(b.position[2]).toBe(-0.34);
      expect(b.dims[2]).toBe(0.3);
      expect(b.orientation).toBe("identity");
    }
  });

  it("⭐ the second layout's slots: 13 white, 20 black, 3 yellow, 4 red, 1 blue", () => {
    const n = (s: string) => Object.values(SCENE_1_SLOTS).filter((v) => v === s).length;
    expect([n("MAT_A"), n("MAT_B"), n("MAT_C"), n("MAT_D"), n("MAT_E")]).toEqual([13, 20, 3, 4, 1]);
    expect(SCENE_1_SLOTS.Piece10).toBe("MAT_E");
    expect(SCENE_1_SLOTS.Piece2).toBe("MAT_D");
    expect(SCENE_1_SLOTS.Piece6).toBe("MAT_C");
  });

  it("⭐ the second layout: no two pieces overlap in the picture plane — the first table's bars crossed", () => {
    const hit: string[] = [];
    for (let i = 0; i < pieces.length; i++)
      for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i]!;
        const b = pieces[j]!;
        const ox = (a.dims[0]! + b.dims[0]!) / 2 - Math.abs(a.position[0]! - b.position[0]!);
        const oy = (a.dims[1]! + b.dims[1]!) / 2 - Math.abs(a.position[1]! - b.position[1]!);
        if (ox > 1e-9 && oy > 1e-9) hit.push(`${a.id}/${b.id}`);
      }
    expect(hit).toEqual([]);
  });

  it("⭐ the second layout's pieces are where the owner put them", () => {
    const at = (id: string) => pieces.find((b) => b.id === id)!;
    expect(at("Piece1").position).toEqual([-0.7, 2.525, -0.34]);
    expect(at("Piece1").dims).toEqual([1.26, 0.29, 0.3]);
    expect(at("Piece30").dims).toEqual([0.1, 4.8, 0.3]);
    expect(at("Piece41").position).toEqual([1.1, -1.855, -0.34]);
  });

  it("⭐ it survives the JSON seam (`GM8`) unchanged", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1))).toEqual(SCENE_1);
  });
});

describe("⭐⭐⭐ the lights — Unity's conventions, checked against the owner's own words", () => {
  const L = SCENE_1.lighting!.lights;
  const aimMiss = (l: LightSpec, p: [number, number, number]) => {
    const f = unityForward(l.eulerDeg);
    const d = [p[0] - l.position[0], p[1] - l.position[1], p[2] - l.position[2]];
    const t = d[0]! * f[0] + d[1]! * f[1] + d[2]! * f[2];
    return Math.hypot(d[0]! - t * f[0], d[1]! - t * f[1], d[2]! - t * f[2]);
  };

  it("⭐⭐ both spots are aimed at the painting, around (0, 2.5, 0) — within a unit", () => {
    // ⛔ RED under any other Euler reading (a right-handed flip, or Y before X): the rays miss by metres.
    for (const name of ["Light_spot_left", "Light_spot_rear"]) {
      const l = L.find((x) => x.name === name)!;
      expect(aimMiss(l, [0, 2.5, 0])).toBeLessThan(1);
    }
  });

  it("the directional light shines DOWN and toward +z; the left spot is front-left, the rear behind-right", () => {
    const d = unityForward(L.find((x) => x.type === "DIRECTIONAL")!.eulerDeg);
    expect(d[1]).toBeLessThan(0);
    expect(d[2]).toBeGreaterThan(0);
    const left = L.find((x) => x.name === "Light_spot_left")!;
    const rear = L.find((x) => x.name === "Light_spot_rear")!;
    expect(left.position[0]).toBeLessThan(0);
    expect(left.position[2]).toBeLessThan(0);
    expect(rear.position[0]).toBeGreaterThan(0);
    expect(rear.position[2]).toBeGreaterThan(0);
  });

  it("⭐ URP's falloff: a spot delivers I / d² windowed by its range; a directional light, I", () => {
    const l = L.find((x) => x.name === "Light_spot_left")!;
    const p: [number, number, number] = [0, 2.5, 0];
    const d2 = (p[0] - l.position[0]) ** 2 + (p[1] - l.position[1]) ** 2 + (p[2] - l.position[2]) ** 2;
    const win = (1 - (d2 / l.range! ** 2) ** 2) ** 2;
    expect(illuminanceAt(l, p)).toBeCloseTo((l.intensity / d2) * win, 9);
    expect(illuminanceAt(L.find((x) => x.type === "DIRECTIONAL")!, p)).toBe(1);
    // ⛔ outside the cone, and beyond the range: nothing
    expect(illuminanceAt(l, [l.position[0] - 10, l.position[1], l.position[2]])).toBe(0);
    expect(illuminanceAt(l, [200, 0, 0])).toBe(0);
  });

  it("colour temperature: ~6600 K is white; lower is warmer (blue falls first)", () => {
    for (const c of kelvinToRgb(6600)) expect(c).toBeGreaterThan(0.95);
    const warm = kelvinToRgb(5250);
    expect(warm[0]).toBe(1);
    expect(warm[2]).toBeLessThan(warm[1]);
    expect(warm[1]).toBeLessThan(1);
  });
});

describe("⭐⭐ the switch and the view", () => {
  it("⭐ the registry: 0 is Scene_0, 1 is Scene_1; out of range falls back to Scene_0", () => {
    expect(SCENES.map((s) => s.id)).toEqual(["Scene_0", "Scene_1"]);
    expect(sceneAt(0)).toBe(SCENE_0);
    expect(sceneAt(1)).toBe(SCENE_1);
    expect(sceneAt(7)).toBe(SCENE_0);
    expect(sceneAt(0.5)).toBe(SCENE_0);
  });

  it("⭐ sceneIndex is a whole number ≥ 0 — a typo is refused, not booted", () => {
    expect(DEFAULT_CONFIG.sceneIndex).toBe(0);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, sceneIndex: 1.5 })).toThrow(/sceneIndex/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, sceneIndex: -1 })).toThrow(/sceneIndex/);
  });

  it("⭐ the LEVEL view puts the camera at the centre's height — the camera looks along depth", () => {
    const v = levelElevation(DEFAULT_CONFIG);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
    expect(orbitOffset(DEFAULT_CONFIG, 0, v, 1).offsetM[1]).toBeCloseTo(0, 9);
  });

  it("⭐ Scene_0 is untouched: no unitM, no lighting, the rig's own view", () => {
    expect(SCENE_0.unitM).toBeUndefined();
    expect(SCENE_0.lighting).toBeUndefined();
    expect(SCENE_0.bootView).toBeUndefined();
  });
});
