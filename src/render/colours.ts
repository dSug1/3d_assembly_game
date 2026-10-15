/**
 * ⭐ Shared colours of the render layer — a LEAF module: it imports nothing from `src/render/`. ⛔ (2026-10-15) `green_box_wiring.ts` and
 * `hover_wiring.ts` import each other; a colour exported by one and read at the top level of the other was read before it was initialised — the
 * page crashed at boot (`Cannot access … before initialization`), found by a headless boot, not by the suite.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";

/** ⭐⭐ (2026-10-15, the owner: *"When the quads are shown, make the highlight of the resting face green (same as the highlight when sliding) instead of yellow."*) — the slide's #D8FDD2 (216, 253, 210). */
export const RESTING_FACE_COLOUR = Color3.FromInts(216, 253, 210);
