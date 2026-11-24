/**
 * ⭐⭐ (2026-11-23 — `SCENE_WORKFLOW.md` §11.2 item 4: *"the Blender side reads the game's constants from the game's files, never retyped"*) THE PROXY AND
 * COLLISION RULES' CONSTANTS, AS ONE TABLE — every number a part check reads (`PROXY_AND_COLLISION_RULES.md` §7.3, the checks of §9), from its ONE home,
 * for a generator or a Blender script to read as JSON (`scripts/surface/export_rules_constants.ts` writes
 * `Assets/Blender/scripts/rules_constants.json`; `tests/rules_constants.test.ts` fails when the file is stale). Each with its unit and its home.
 */
import { COLLISION_SAMPLE_MM, RESTING_MIN_SHARE } from "./collision_cover";
import { B1_FIT_MM, B6_APART_DEG, B6_ELEVATION_BAND_DEG, R4_HALF_STEP_DEG, R7_PLANAR_DEG, UCX_MAX_TRIANGLES, UCX_MAX_VERTICES } from "./part_checks";
import { CLOSED_STEP_MM, R1B_AMBER_DEG, R1B_DEEP_DEG } from "./proxy_cover";
import { COLLISION_TOL_MM, PROXY_CURVE_TOL_MM, PROXY_FACE_MIN_MM, PROXY_FLUSH_MM, PROXY_PROBE_MM } from "./units";
import { COVER_STEP_MM } from "./voxels";

/** one constant: its value, its unit, the rule it serves, its home */
export interface RuleConstant {
  readonly value: number;
  readonly unit: "mm" | "deg" | "count" | "share";
  readonly rule: string;
  readonly home: string;
}

/** ⭐ the table — the keys are the constants' names in the game's code */
export function rulesConstants(): Readonly<Record<string, RuleConstant>> {
  return {
    PROXY_PROBE_MM: { value: PROXY_PROBE_MM, unit: "mm", rule: "R0, R1: ρ — the probe; an opening narrower than 2ρ bridged", home: "src/core/units.ts" },
    PROXY_FACE_MIN_MM: { value: PROXY_FACE_MIN_MM, unit: "mm", rule: "R3: w — no face the gizmo travels narrower", home: "src/core/units.ts" },
    PROXY_FLUSH_MM: { value: PROXY_FLUSH_MM, unit: "mm", rule: "R2, R6: a planar proxy face ON its real face", home: "src/core/units.ts" },
    PROXY_CURVE_TOL_MM: { value: PROXY_CURVE_TOL_MM, unit: "mm", rule: "R2, R4: τ — a curve's facet (its sagitta recorded beside it)", home: "src/core/units.ts" },
    COLLISION_TOL_MM: { value: COLLISION_TOL_MM, unit: "mm", rule: "C-R2: τc — the collision pieces true to the part", home: "src/core/units.ts" },
    B1_FIT_MM: { value: B1_FIT_MM, unit: "mm", rule: "B1e, R6, D4: the proxy ON its collision pieces", home: "src/core/part_checks.ts" },
    UCX_MAX_VERTICES: { value: UCX_MAX_VERTICES, unit: "count", rule: "C-R1, B1d: a collision piece's vertices", home: "src/core/part_checks.ts" },
    UCX_MAX_TRIANGLES: { value: UCX_MAX_TRIANGLES, unit: "count", rule: "C-R1, B1d: a collision piece's triangles", home: "src/core/part_checks.ts" },
    R7_PLANAR_DEG: { value: R7_PLANAR_DEG, unit: "deg", rule: "R7: one node one planar face", home: "src/core/part_checks.ts" },
    B6_APART_DEG: { value: B6_APART_DEG, unit: "deg", rule: "R4, B6: neighbouring faces one face or this far apart", home: "src/core/part_checks.ts" },
    B6_ELEVATION_BAND_DEG: { value: B6_ELEVATION_BAND_DEG, unit: "deg", rule: "R4, B6: no face within this of 45° of elevation at its goal", home: "src/core/part_checks.ts" },
    R4_HALF_STEP_DEG: { value: R4_HALF_STEP_DEG, unit: "deg", rule: "R4, C-R3: a curve's facet (a hexagon's half step); a ring's", home: "src/core/part_checks.ts" },
    COVER_STEP_MM: { value: COVER_STEP_MM, unit: "mm", rule: "R1: the voxel step of the ρ-closing (ρ / 2)", home: "src/core/voxels.ts" },
    R1B_DEEP_DEG: { value: R1B_DEEP_DEG, unit: "deg", rule: "R1b: a point's sky under this — deeper than its mouth is wide (capped)", home: "src/core/proxy_cover.ts" },
    R1B_AMBER_DEG: { value: R1B_AMBER_DEG, unit: "deg", rule: "R1b: the amber band's top (atan ½)", home: "src/core/proxy_cover.ts" },
    CLOSED_STEP_MM: { value: CLOSED_STEP_MM, unit: "mm", rule: "R2: an edge read every this (closed)", home: "src/core/proxy_cover.ts" },
    COLLISION_SAMPLE_MM: { value: COLLISION_SAMPLE_MM, unit: "mm", rule: "C-R2: the render sampled at this spacing", home: "src/core/collision_cover.ts" },
    RESTING_MIN_SHARE: { value: RESTING_MIN_SHARE, unit: "share", rule: "decision 5: a resting candidate ≥ this of the largest (decided 2026-11-24)", home: "src/core/collision_cover.ts" },
  };
}
