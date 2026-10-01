/**
 * GOLDEN VECTOR — **`D170`: the plan is data, and the data is the generator's** → `Claude/20_GAME_RULES/spec/DEMO_SCENE.md`.
 *
 * ⭐ The slowest vector of the suite (a full 150-move generation), in a file of its OWN so the runner overlaps it with
 * every other file instead of running it after the rest of `d170.test.ts` (2026-10-01: the deploy had grown to ~10 min).
 * ⛔ Unchanged otherwise — moved, not weakened.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE1_DEMO_OPTIONS } from "../src/content/scene1_demo";
import { formatDemoPlan } from "../src/content/demo_plan_format";
import { DEMO_DEFAULTS, generateDemoPlan } from "@core/demo_plan";

describe("⭐⭐⭐ `D170` — the plan is data, and the data is the generator's", () => {
  // ⚠ `D191`: the heaps' settling made the generation ~2 minutes (was ~45 s) — the timeout grew with it.
  it("⭐ the committed `scene1_demo_plan.ts` is exactly what the generator writes today (seed 1)", { timeout: 600_000 }, () => {
    const committed = readFileSync(new URL("../src/content/scene1_demo_plan.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n");
    expect(committed).toBe(formatDemoPlan(generateDemoPlan(SCENE_1, { ...SCENE1_DEMO_OPTIONS, seed: DEMO_DEFAULTS.seed })));
  });
});
