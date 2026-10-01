/**
 * GOLDEN VECTOR — **`D171`: every piece is truly CLEAR where its APPROACH starts**, on a FRESH 100-move plan (the committed
 * plan's own check stays in `d170.test.ts`) → `Claude/20_GAME_RULES/spec/DEMO_SCENE.md`.
 *
 * ⭐ In a file of its OWN so the runner overlaps this generation with every other file (2026-10-01: the deploy had grown to
 * ~10 min). ⛔ Unchanged otherwise — moved, not weakened.
 */
import { describe, expect, it } from "vitest";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE1_DEMO_OPTIONS } from "../src/content/scene1_demo";
import { DEMO_DEFAULTS, generateDemoPlan } from "@core/demo_plan";
import { leastApproachClearance } from "./helpers/demo_clearance";

describe("⭐⭐⭐ played forwards, the moves chain from the start configuration to the goal — and collide with nothing", () => {
  it("⭐ `D171`: on a fresh 100-move plan too — where the rule before `D171` pulled four pieces sideways INSIDE the painting", { timeout: 600_000 }, () => {
    expect(leastApproachClearance(generateDemoPlan(SCENE_1, { ...SCENE1_DEMO_OPTIONS, moveCount: 100 }))).toBeGreaterThanOrEqual(DEMO_DEFAULTS.clearance - 1e-5);
  });
});
