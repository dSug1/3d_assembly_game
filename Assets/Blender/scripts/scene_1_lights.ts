/**
 * Prints Scene_1's lights as JSON, computed by the game's own `core/lighting.ts` (direction, Kelvin ×
 * filter colour, URP illuminance at the scene's centre = the mean of its bodies, as `render/lighting.ts`).
 * Run: `npx vite-node Assets/Blender/scripts/scene_1_lights.ts > <somewhere>/lights.json`.
 * See `Claude/30_OBJECTS_3D/spec/BLENDER_ASSETS.md`.
 */
import { SCENE_1 } from "../../../src/content/scene_1";
import { illuminanceAt, lightColour, unityForward } from "../../../src/core/lighting";

const L = SCENE_1.lighting!;
const n = SCENE_1.bodies.length;
const target = [0, 1, 2].map((i) => SCENE_1.bodies.reduce((s, b) => s + b.position[i]!, 0) / n);
console.log(
  JSON.stringify({
    target,
    background: L.background,
    ambient: L.ambient,
    shadowStrength: L.shadowStrength,
    lights: L.lights.map((l) => ({
      ...l,
      forward: unityForward(l.eulerDeg),
      colour: lightColour(l),
      illuminance: illuminanceAt(l, target as [number, number, number]),
    })),
  }),
);
