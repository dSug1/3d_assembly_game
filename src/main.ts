/**
 * Entry point. ⛔ Deliberately thin: it wires the engine-agnostic core to the
 * renderer and does nothing else. Anything with a rule in it belongs in
 * `src/core` or `src/input`, where a headless test can reach it.
 */
import { createScene } from "@render/scene";

const canvas = document.getElementById("app") as HTMLCanvasElement | null;
if (!canvas) throw new Error("no #app canvas");

void createScene(canvas);
