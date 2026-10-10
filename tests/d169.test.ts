/**
 * GOLDEN VECTORS — **`D169`: `Scene_1` moved so its floor's TOP CENTRE is the origin, the floor 2.000 m × 5 mm ×
 * 2.000 m** (the owner, 2026-09-29: *"modify the dimensions of the floor to 2.000 m x 5 mm x 2.000 m"*, *"translate
 * all the objects of the scene (floor, pieces, lights, camera orbit rings in Scene_1, etc.) so that the center of
 * the top face of the floor is at (0,0,0) coordinates"*).
 *
 * ⭐ A TRANSLATION changes no relation: the painting stands as high above the floor as before, the lights sit where
 * they did relative to it, and the camera boots at the same offset from the orbit centre — so the view is unchanged.
 */
import { describe, expect, it } from "vitest";
import { SCENE_1, SCENE_1_SHIFT_Y } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";
import { parseSceneDescriptor, serializeSceneDescriptor } from "@core/game_structure";
import { bootOrbitCentre } from "@input/scene_rig";

const floor = SCENE_1.bodies.find((b) => b.id === "Floor")!;
const pieces = SCENE_1.final!.bodies.map((f) => ({ ...f, dims: SCENE_1.bodies.find((b) => b.id === f.id)!.dims }));

describe("⭐⭐ `D169` — Scene_1's floor top centre is the origin", () => {
  it("⭐ the floor's top face is centred on (0, 0, 0)", () => {
    expect([floor.position[0], floor.position[1] + floor.dims[1] / 2, floor.position[2]]).toEqual([0, 0, 0]);
  });

  it("⭐ the painting stands where it stood relative to the floor: its lowest core 0.17 units (17 mm) above the top", () => {
    const low = Math.min(...pieces.map((p) => p.position[1] - p.dims[1] / 2));
    expect(low - (floor.position[1] + floor.dims[1] / 2)).toBeCloseTo(-2.13 - -2.3, 9);
  });

  it("⭐ the lights moved WITH it: the owner's Unity heights plus the one shift, x and z untouched", () => {
    const L = SCENE_1.lighting!.lights;
    expect(L.map((l) => +(l.position[1] - SCENE_1_SHIFT_Y).toFixed(6))).toEqual([17.67, 15.78, 32.27]);
    expect(L.map((l) => [l.position[0], l.position[2]])).toEqual([[-39.9, -24.6], [55.0, 33.0], [0.5, -8.2]]);
  });

  it("⭐⭐ the orbit rings moved with it: the boot centre is the old origin, 0.23 m up — so the boot view is the same", () => {
    expect(SCENE_1_SHIFT_Y * SCENE_1.unitM!).toBeCloseTo(0.23, 12);
    expect(bootOrbitCentre(SCENE_1.orbit, [0, 0, 0])).toEqual([0, SCENE_1_SHIFT_Y * SCENE_1.unitM!, 0]);
  });

  it("⛔ a scene without a centre keeps the fallback — Scene_0 boots about the origin as before", () => {
    expect(bootOrbitCentre(SCENE_0.orbit, [0, 0, 0])).toEqual([0, 0, 0]);
    expect(bootOrbitCentre(undefined, [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("⭐ the centre survives the JSON seam, and a bad one is refused", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).orbit?.centreM).toEqual(SCENE_1.orbit!.centreM);
    const bad = JSON.parse(serializeSceneDescriptor(SCENE_1));
    bad.orbit.centreM = [0, "up", 0];
    expect(() => parseSceneDescriptor(JSON.stringify(bad))).toThrow(/orbit.centreM/);
  });
});
