/**
 * ⭐⭐ **`Scene1_demo` — `Scene_1` assembling itself** (`D170`/`D171`, the owner, 2026-09-29: *"create a Scene_demo in
 * World 0 based on the application of the specification to Scene_1"*, renamed *"Scene1_demo"*)
 * → `Claude/20_GAME_RULES/spec/DEMO_SCENE.md`.
 *
 * ⭐⭐ `D173` (the owner: *"load the demo's move plan only in the demo scene"*): this is the SHELL — `Scene_1`'s floor,
 * lights, rig and final configuration, every piece at its FINAL pose. The 37 KB plan is a separate file, fetched only
 * when this level is played (`loadScene1DemoPlan`), and `withDemoPlan` then moves the pieces to their start poses.
 * ⛔ Nothing may import `scene1_demo_plan` statically — `tests/d173.test.ts` reads the sources to hold that.
 */
import type { SceneDescriptor } from "../core/game_structure";
import type { DemoPlan } from "../core/demo_plan";
import { SCENE_1 } from "./scene_1";

const finalOf = (id: string) => SCENE_1.final!.bodies.find((f) => f.id === id);

export const SCENE1_DEMO: SceneDescriptor = {
  ...SCENE_1,
  id: "Scene1_demo",
  title: "Demo — the painting",
  bodies: SCENE_1.bodies.map((b) => {
    if (b.frozen) return b;
    const f = finalOf(b.id)!;
    return { ...b, position: f.position, orientation: f.orientation };
  }),
};

/** ⭐ `D173`: the plan, as its own file — the browser fetches it only here. */
export const loadScene1DemoPlan = (): Promise<DemoPlan> => import("./scene1_demo_plan").then((m) => m.SCENE1_DEMO_PLAN);
