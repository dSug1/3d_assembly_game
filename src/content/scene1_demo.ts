/**
 * ⭐⭐ **`Scene1_demo` — `Scene_1` assembling itself** (`D170`, the owner, 2026-09-29: *"create a Scene1_demo in
 * World 0 based on the application of the specification to Scene_1"*) → `Claude/20_GAME_RULES/spec/DEMO_SCENE.md`.
 *
 * ⭐ `Scene_1`'s floor, lights, rig and final configuration; every piece starts at its FINAL pose except the
 * ones the plan moves, which start at the plan's start pose (not at `Scene_1`'s own boot).
 */
import type { SceneDescriptor } from "../core/game_structure";
import { SCENE_1 } from "./scene_1";
import { SCENE1_DEMO_PLAN } from "./scene1_demo_plan";

const finalOf = (id: string) => SCENE_1.final!.bodies.find((f) => f.id === id);

export const SCENE1_DEMO: SceneDescriptor = {
  ...SCENE_1,
  id: "Scene1_demo",
  title: "Demo — the painting",
  bodies: SCENE_1.bodies.map((b) => {
    if (b.frozen) return b;
    const start = SCENE1_DEMO_PLAN.start[b.id];
    if (start) return { ...b, position: start.position, orientation: { quat: start.orientation } };
    const f = finalOf(b.id)!;
    return { ...b, position: f.position, orientation: f.orientation };
  }),
  demo: SCENE1_DEMO_PLAN,
};
