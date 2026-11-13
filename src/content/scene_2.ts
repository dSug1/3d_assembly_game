/**
 * ⭐ **`Scene_2` — THE ENGINE** (the owner, 2026-11-12: *"create a scene 2 of World 0 in the level menu"*; the plan:
 * `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md`): `Scene_1`'s frozen floor, lights, orbit rig, units and play volume — no pieces of its own, no goal yet.
 * ⭐ Everything is READ from `SCENE_1` (never retyped): a change to the painting's floor or lights reaches this scene too.
 * ⭐⭐ (2026-11-13, W4 — the FINAL STAGE, `SCENE_WORKFLOW.md` §6.4: *"have a look at the scene in its final stage because that's the goal the player
 * has to achieve"*): the engine's `.glb` (W3's export), every part assembled at its goal — to settle the scale, the lights and the background. ⚠ Shown,
 * not played: the boot stage and the playable slice (the plinth, the lower case, the crankshaft, the pulley) follow.
 *
 * ⭐⭐ (2026-11-13) ITS OWN LIGHTING — THE CREAM STUDIO (the owner: *"can you recreate this atmosphere (lights, shadows of the objects and parts,
 * environment) except the shadows coming from the light source"* → *"atmosphere_C_between_floor.png is the setup I want. build that"*): one warm,
 * soft KEY (a directional with soft shadows) high and behind-left of the boot view, a cream studio panorama for the fill and the metal's
 * reflections (`Assets/Environment/studio_cream.hdr`, `scripts/gen_sky_hdr.mjs`), the backdrop's colour behind, ACES tone mapping, contact
 * shadows. ⭐ THE ONE SOURCE: the Blender build MIRRORS this block into the `.blend` (`build_engine.py`, `SCENE_WORKFLOW.md` §6.3 item 1).
 *
 * ⚠ Engine-free data. Nothing here may import the renderer.
 */
import type { SceneDescriptor } from "../core/game_structure";
import { SCENE_1 } from "./scene_1";
// ⭐ The file Vite serves (hashed in the build); fetched only when this level is played.
import ENGINE_GLB from "../../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb?url";
import STUDIO_HDR from "../../Assets/Environment/studio_cream.hdr?url";
import CONTACT_JSON from "../../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine_contact.json?url";
import { SCENE2_BOOT_RULE } from "./scene2_boot";

const FLOOR = SCENE_1.bodies.find((b) => b.id === "Floor" && b.frozen);
if (FLOOR === undefined) throw new Error("Scene_2: Scene_1 has no frozen Floor to copy");

// ⭐ Scene_1 without its pieces and its goals (the play volume, units, boot view and rig carried; the lighting its own, below)
const { bodies: _bodies, final: _final, orbitGoals: _orbitGoals, ...shared } = SCENE_1;

export const SCENE_2: SceneDescriptor = {
  ...shared,
  id: "Scene_2",
  title: "Scene 2 — the engine", // ⭐ (2026-11-12, the owner: "Level 2 - Scene 2 - the engine")
  bodies: [FLOOR],
  final: null,
  lighting: {
    // ⭐ the backdrop as render C shows it (sRGB CAC7C2), then 10 % lower (B6B3AF — the owner: "lower the lights a little so the player can stay
    // in the game longer"), then 5 % up (BFBCB7 — "increase the whole scene light 5%") — the clear colour is not tone-mapped. ⛔ A creamed night
    // blue tried (40 % Scene_1's night blue + 60 % cream, 929C9C) and reverted by the owner.
    background: [0.749, 0.737, 0.719],
    shadowStrength: 0.85,
    // no hemispheric fill: the studio panorama IS the fill (two fills burnt the floor white — the owner: "they are too bright")
    ambient: 0,
    lights: [
      {
        // ⭐ the KEY: from high behind-left of the BOOT view (the camera at −z, yaw −90°; the source toward (−0.666, 0.643, 0.378)), warm, its
        // shadows soft — no gobo. ⛔ (2026-11-13, the owner's first look: the shadow fell AWAY from the camera) it had been placed behind-left of
        // render C's camera, which looks from the other side (+x, +z): turned −136.5° about the vertical onto the boot view.
        // ⭐ 15.7 = 5π first: Babylon's PBR divides by π (Lambert) as Blender does (5 was π too dark). ⭐ Then (the owner: "I find the horizontal
        // light a bit too strong. check with the atmosphere_C_between_floor.png") RAISED 28.8° → 40° above the horizon and 15.7 → 11.8: the floor
        // as lit (11.8 × sin 40° = 15.7 × sin 28.8°), a vertical face a third less (9.0 for 13.8) — the even directional raked harder than C's
        // near area light under Filmic. ⭐ Then (*"yaw this light 15 degrees to the left"* → *"sorry, yaw in the other direction"*): 80.4° → 65.4°
        // left of the boot camera's straight ahead (toward behind the engine) — the yaw 99.6° → 114.6°; then *"yaw 5 degrees toward the left"*
        // (the same way): 60.4°, the yaw 119.6°; then *"reduce the 40° front light intensity by 5%"*, twice: 11.8 → 11.2 → 10.6
        name: "Key_softbox",
        type: "DIRECTIONAL",
        position: [-33.3, 32.1, 18.9],
        eulerDeg: [40, 119.6, 0],
        intensity: 10.6,
        kelvin: 4800,
        filter: [1, 1, 1],
        softnessDeg: 25,
      },
    ],
    environment: STUDIO_HDR,
    // ⭐ exposure 0.85 (1 before): every light and reflection together a little lower — the owner: "so the player can stay in the game longer";
    // then 0.89 ("increase the whole scene light 5%")
    toneMapping: { exposure: 0.89, contrast: 1.1 },
    // ⭐ (2026-11-13) OFF: the contact shadows are BAKED (SSAO cost ≈ 7 ms on the iPhone — `SCENE_SETUP.md` §6.1); the slider can still try it
    ambientOcclusion: false,
  },
  // ⭐ The final stage: every part (no slice yet).
  // ⭐ (2026-11-13) the contact shadows BAKED per part and per pair, switched on when seated (`SCENE_SETUP.md` §6.3) — the SSAO off below
  // ⭐ (2026-11-13) THE BOOT STAGE: the parts in their heaps, DRAWN AT EVERY BOOT from the rule (`scene2_boot.ts` — `SCENE_2_ASSEMBLY.md` §2.5);
  // the LEVEL slider `modelStage` shows the final stage
  // ⭐⭐ the FRONT: the file's +x (Blender's +X — the flywheel's end, as built, lit and set up; the owner's look): the camera boots facing it
  model: { url: ENGINE_GLB, contact: CONTACT_JSON, boot: SCENE2_BOOT_RULE, frontDeg: 0 },
};
