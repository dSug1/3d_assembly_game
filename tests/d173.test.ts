/**
 * GOLDEN VECTORS — **`D173`: the demo's move plan loads ONLY in the demo scene** (the owner, 2026-09-29: *"load the
 * demo's move plan only in the demo scene"*) → `DEMO_SCENE.md` §5.
 *
 * ⭐ The plan (37 KB, ~7 KB compressed) was bundled into every page load through a static import. Now it is its own
 * file, fetched by the demo level alone. ⛔ The guarantee is a property of the IMPORT GRAPH, so a vector reads the
 * sources: one static import anywhere and the plan is back in the main bundle, with every other test still green.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SCENE1_DEMO } from "../src/content/scene1_demo";
import { SCENE1_DEMO_PLAN as PLAN } from "../src/content/scene1_demo_plan";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneAt, sceneReady } from "../src/content/scenes";
import { GAME_CONTENT } from "../src/content/worlds";
import { withDemoPlan } from "@core/demo_plan";
import { levelsOf } from "@core/game_route";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith(".ts") ? [p] : [];
  });

describe("⭐⭐⭐ `D173` — the demo plan is loaded only by the demo level", () => {
  it("⛔ nothing in src/ imports `scene1_demo_plan` statically — only a dynamic `import()` may name it", () => {
    const offenders = files(join(__dirname, "../src"))
      .filter((f) => /(^|\n)\s*(import|export)\b[^;(]*from\s+["'][^"']*scene1_demo_plan["']/.test(readFileSync(f, "utf8")))
      .map((f) => f.replace(/.*src[\/]/, "src/"));
    expect(offenders).toEqual([]);
    expect(readFileSync(join(__dirname, "../src/content/scene1_demo.ts"), "utf8")).toMatch(/import\("\.\/scene1_demo_plan"\)/);
  });

  it("⭐ the SHELL carries no plan: every piece at its final pose", () => {
    expect(SCENE1_DEMO.demo).toBeUndefined();
    for (const b of SCENE1_DEMO.bodies.filter((x) => !x.frozen))
      expect(b.position).toEqual(SCENE_1.final!.bodies.find((f) => f.id === b.id)!.position);
  });

  it("⭐ the demo level carries the loader; the other levels none", () => {
    expect(levelsOf(GAME_CONTENT).map((l) => l.demoPlan !== undefined)).toEqual([false, false, true]);
  });

  it("⭐⭐ `sceneReady(2)` fetches the plan and boots the pieces at its start poses", async () => {
    const s = await sceneReady(2);
    expect(s.demo).toBe(PLAN);
    for (const [id, p] of Object.entries(PLAN.start))
      expect(s.bodies.find((b) => b.id === id)).toMatchObject({ position: p.position, orientation: { quat: p.orientation } });
    expect(s).toEqual(withDemoPlan(SCENE1_DEMO, PLAN));
  });

  it("⭐ every other level is ready at once, unchanged — and an index out of range still falls back to the first", async () => {
    expect(await sceneReady(0)).toBe(sceneAt(0));
    expect(await sceneReady(1)).toBe(sceneAt(1));
    expect(await sceneReady(7)).toBe(sceneAt(0));
  });

  it("⭐ `withDemoPlan` moves only the pieces the plan names, never a frozen one", () => {
    const s = withDemoPlan(SCENE1_DEMO, PLAN);
    const moved = s.bodies.filter((b, i) => b !== SCENE1_DEMO.bodies[i]).map((b) => b.id).sort();
    expect(moved).toEqual(Object.keys(PLAN.start).sort());
    expect(s.bodies.find((b) => b.frozen)).toBe(SCENE1_DEMO.bodies.find((b) => b.frozen));
  });
});
