/**
 * ⭐⭐ `Scene_2`'s BOOT STAGE, DRAWN AT EVERY BOOT (`SCENE_2_ASSEMBLY.md` §2.5; `core/boot_heaps.ts`): the demo's rules checked on SEVERAL SEEDS of
 * the real `.glb`'s collision pieces — each rule shown to fire on its counter-example; the same seed the same layout, other seeds other layouts.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { apply, glbBin, partGeometry, type Placement } from "../src/core/glb_geometry";
import { gapBetween } from "../src/core/collision_shape";
import { bootFromModel, type BootLayout } from "../src/core/boot_heaps";
import { SCENE2_BOOT_RULE, SCENE2_HEAPS } from "../src/content/scene2_boot";
import type { Vec3 } from "../src/core/vec";

const bytes = new Uint8Array(readFileSync(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url)));
const json = (glbJson(bytes) as { json: unknown }).json;
const cat = readModelCatalog(json).catalog!;
const geo = new Map(partGeometry(json, glbBin(bytes), cat).map((g) => [g.id, g]));
const stepOf = (id: string) => cat.parts.find((p) => p.id === id)!.step;

type Poses = Record<string, { position: readonly number[]; rotation: readonly number[]; heap: string; level: number; on: readonly string[] }>;
const placed = (P: Poses, id: string): Vec3[][] => {
  const g = geo.get(id)!;
  const t: Placement = P[id] ? { position: P[id]!.position as Vec3, rotation: P[id]!.rotation as unknown as Placement["rotation"] } : g.goal;
  return g.pieces.map((pc) => pc.map((p) => apply(t, p)));
};
const overlaps = (P: Poses): string[] => {
  const ids = [...SCENE2_BOOT_RULE.anchors, ...Object.keys(P)];
  const out: string[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const a = placed(P, ids[i]!), b = placed(P, ids[j]!);
      // ⚠ GJK reads touching AND overlapping as 0: an overlap is a gap of exactly 0 (the generator keeps ≥ 1e-4)
      if (a.some((pa) => b.some((pb) => (gapBetween(pa, pb) ?? 0) === 0))) out.push(`${ids[i]} × ${ids[j]}`);
    }
  return out;
};

const SEEDS = [1, 7, 42, 20261113];
/** ⭐ each seed with its own YAW ORIGIN (the direction toward the boot camera): the four sides */
const ORIGIN: Record<number, number> = { 1: 270, 7: 0, 42: 90, 20261113: 180 };
const layouts = new Map<number, { L: BootLayout; ms: number }>();
const layout = (seed: number) => {
  if (!layouts.has(seed)) {
    const t0 = performance.now();
    const L = bootFromModel(bytes, json, cat, SCENE2_BOOT_RULE, seed, ORIGIN[seed]!);
    layouts.set(seed, { L, ms: performance.now() - t0 });
  }
  return layouts.get(seed)!;
};
/** A part's centre (its pieces' mean) along the yaw origin's direction: > 0 = the front half. */
const frontness = (P: Poses, id: string, originDeg: number): number => {
  const pts = placed(P, id).flat();
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[2], 0) / pts.length;
  const t = (originDeg * Math.PI) / 180;
  return cx * Math.cos(t) + cz * Math.sin(t);
};

describe("Scene_2's boot stage — drawn at every boot, the demo's rules on every seed", () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: every part placed, nothing overlapping, on and inside the floor, one heap per type, ⛔ NO STACKING (on the floor only), the next part on top`, { timeout: 60_000 }, () => {
      const P = layout(seed).L.poses as unknown as Poses;
      expect(Object.keys(P).sort()).toEqual(cat.parts.map((p) => p.id).filter((id) => id !== "E01").sort());
      expect(overlaps(P)).toEqual([]);
      for (const [id, p] of Object.entries(P)) {
        const pts = placed(P, id).flat();
        expect(Math.min(...pts.map((q) => q[1]))).toBeGreaterThanOrEqual(-1e-6);
        // ⭐ inside the floor less its margin
        expect(Math.max(...pts.map((q) => Math.max(Math.abs(q[0]), Math.abs(q[2]))))).toBeLessThanOrEqual(SCENE2_BOOT_RULE.floorHalf - SCENE2_BOOT_RULE.floorMargin);
        expect(p.on.length).toBeGreaterThan(0);
        // ⭐⭐ in the FRONT half, toward the yaw origin (the camera)
        expect(frontness(P, id, ORIGIN[seed]!)).toBeGreaterThan(0);
        // ⭐ never inside the plinth's perimeter (its footprint + the margin)
        const k = layout(seed).L.perimeter!;
        expect(pts.some((q) => q[0] > k.x0 && q[0] < k.x1 && q[2] > k.z0 && q[2] < k.z1)).toBe(false);
        expect(p.heap).toBe(SCENE2_HEAPS[id]);
        // ⛔ the owner, 2026-11-14: "do not allow the pieces to stack at all at boot time" — one high, on the floor only
        expect(p.level).toBe(1);
        expect(p.on).toEqual(["floor"]);
        for (const s of p.on)
          if (s !== "floor") {
            expect(P[s]?.heap).toBe(p.heap); // never another heap's part, never the anchor
            expect(stepOf(id)).toBeLessThanOrEqual(stepOf(s)); // never on a part needed BEFORE it
          }
      }
    });
  }

  it("⭐ a part pushed into its neighbour IS an overlap (the check fires)", { timeout: 60_000 }, () => {
    const P = structuredClone(layout(1).L.poses) as unknown as Poses;
    P["E11"]!.position = [...P["E12"]!.position];
    expect(overlaps(P).length).toBeGreaterThan(0);
  });

  it("⭐ the front-half check fires: the same layout read against the OPPOSITE yaw origin has parts behind", { timeout: 60_000 }, () => {
    const P = layout(1).L.poses as unknown as Poses;
    expect(Object.keys(P).some((id) => frontness(P, id, ORIGIN[1]! + 180) <= 0)).toBe(true);
  });

  it("⭐ the perimeter is the plinth's footprint + 1 unit, and a part moved inside it IS detected", { timeout: 60_000 }, () => {
    const k = layout(1).L.perimeter!;
    const plinth = geo.get("E01")!.pieces.flat().map((p) => apply(geo.get("E01")!.goal, p));
    expect(k.x1 - Math.max(...plinth.map((p) => p[0]))).toBeCloseTo(SCENE2_BOOT_RULE.anchorMargin, 9);
    expect(Math.min(...plinth.map((p) => p[2])) - k.z0).toBeCloseTo(SCENE2_BOOT_RULE.anchorMargin, 9);
    const P = structuredClone(layout(1).L.poses) as unknown as Poses;
    P["E17"]!.position = [k.x1 - 0.2, P["E17"]!.position[1]!, 0];
    expect(placed(P, "E17").flat().some((q) => q[0] > k.x0 && q[0] < k.x1 && q[2] > k.z0 && q[2] < k.z1)).toBe(true);
  });

  it("⭐⭐ the same seed gives the same layout; other seeds give OTHER layouts (not game after game the same)", { timeout: 60_000 }, () => {
    const again = bootFromModel(bytes, json, cat, SCENE2_BOOT_RULE, 7, ORIGIN[7]!);
    expect(again.poses).toEqual(layout(7).L.poses);
    const at = (seed: number) => Object.values(layout(seed).L.poses).map((p) => p.position.map((v) => v.toFixed(3)).join(",")).join("|");
    expect(new Set(SEEDS.map(at)).size).toBe(SEEDS.length);
  });

  it("fast enough to draw at a level's load (each under 3 s here)", () => {
    for (const seed of SEEDS) expect(layout(seed).ms).toBeLessThan(3000);
  });
});
