/**
 * ⭐ (2026-11-23 — `SCENE_WORKFLOW.md` §11.2 item 4) the rules' constants as JSON for the Blender side (`Assets/Blender/scripts/rules_constants.json`,
 * written by `scripts/surface/export_rules_constants.ts`) — STALE fails: the file must equal the table its one home builds (`rulesConstants`).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { rulesConstants } from "../src/core/rules_constants";

describe("⭐ the rules' constants for the Blender side — never retyped, never stale", () => {
  it("Assets/Blender/scripts/rules_constants.json equals rulesConstants() (rerun export_rules_constants.ts after a change)", () => {
    const file = JSON.parse(readFileSync(new URL("../Assets/Blender/scripts/rules_constants.json", import.meta.url), "utf8"));
    expect(file).toEqual(JSON.parse(JSON.stringify(rulesConstants())));
  });
  it("every constant has a unit, a rule and a home; ρ is 3.5 mm and w 10 mm (his decisions, 2026-11-23)", () => {
    const t = rulesConstants();
    for (const [k, c] of Object.entries(t)) expect([k, Number.isFinite(c.value), c.rule.length > 0, c.home.startsWith("src/core/")]).toEqual([k, true, true, true]);
    expect([t["PROXY_PROBE_MM"]!.value, t["PROXY_FACE_MIN_MM"]!.value]).toEqual([3.5, 10]);
  });
});
