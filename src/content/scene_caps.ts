/**
 * ⭐⭐⭐ (2026-11-24, S11 — `Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_L1.md` §10) **THE SCENES' CAPS** — L1's fillers, written offline with each scene
 * by `scripts/surface/l1_caps.ts` (`<scene>_caps.json`, never edited by hand) and read once here, CHECKED (`parseSceneCaps`: a malformed file throws at
 * import). A scene with no deep place between its parts has no file and no entry. Read by the face map behind `surfaceL1`
 * (`render/assembly_wiring.ts` `placedFaces`).
 */
import { parseSceneCaps, type SceneCaps } from "../input/l1_caps";
import scene1Caps from "./scene_1_caps.json";

/** ⭐ The caps by scene id. */
export const SCENE_CAPS: ReadonlyMap<string, SceneCaps> = new Map([parseSceneCaps(scene1Caps)].map((c) => [c.scene, c]));
