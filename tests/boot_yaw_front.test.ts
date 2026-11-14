/**
 * ⭐⭐ (2026-11-13) the camera BOOTS FACING the model's front (the owner: "this is the camera viewing the front of the assembly … if anything is not
 * in line, everything has to be yaw rotated so it matches this") — `core/scene_dims.ts` `bootYawForFront`.
 */
import { describe, expect, it } from "vitest";
import { bootYawForFront, ORBIT_START_YAW_RAD } from "../src/core/scene_dims";
import { SCENE_2 } from "../src/content/scene_2";

/** The rig's offset at a yaw `(cos, ·, sin)` in the game's world, read in the MODEL's frame (Babylon's glTF reader mirrors x), as an angle. */
const modelAngle = (yaw: number): number => (((Math.atan2(Math.sin(yaw), -Math.cos(yaw)) * 180) / Math.PI) + 360) % 360;

describe("the boot yaw facing a model's front", () => {
  it("for any front, the camera boots on that side of the model", () => {
    for (const f of [0, 45, 90, 180, 270, 315]) expect(modelAngle(bootYawForFront(f))).toBeCloseTo(f, 9);
  });
  it("⭐ Scene_2's front is the file's +x (Blender's +X, as built): the camera boots at yaw π — the world's −x", () => {
    expect(SCENE_2.model!.frontDeg).toBe(0);
    expect(Math.abs(bootYawForFront(0))).toBeCloseTo(Math.PI, 12);
  });
  it("⛔ the counter-example: the rig's global −90° looks at the model from 270°, a quarter turn off Scene_2's front", () => {
    expect(modelAngle(ORBIT_START_YAW_RAD)).toBeCloseTo(270, 9);
  });
});
