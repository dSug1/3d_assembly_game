/**
 * THE ONLY FILE THAT IMPORTS BABYLON. Deliberately thin.
 *
 * ⚠ STUB — it stands up a scene with two objects and reports what the pointer hits,
 * so the loop is closed end to end. The gesture rules are NOT wired yet; that is
 * queue rows `IN1`–`IN4`. What matters today is the BOUNDARY: everything with a
 * rule in it lives in `src/core` or `src/input`, and `tests/boundary.test.ts`
 * fails the build if an engine import creeps into either.
 *
 * ⭐ Face picking is why Babylon is here: rule 2 selects a FACE, not an object, and
 * `pickResult.faceId` gives it directly. That is also the seam to a mate connector.
 */
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Scene } from "@babylonjs/core/scene";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import "@babylonjs/core/Culling/ray";

export async function createScene(canvas: HTMLCanvasElement): Promise<Scene> {
  const engine = new Engine(canvas, true, { stencil: true }, true);
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3,
    0.6,
    Vector3.Zero(),
    scene,
  );
  // ⛔ The camera does NOT take the pointer. Rules 1 and 4 drive the orbit through
  // the gesture layer; letting Babylon's own controls attach as well means two
  // things claim the same touch and the winner depends on event order.
  camera.detachControl();

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  const a = CreateBox("objectA", { size: 0.08 }, scene);
  a.position = new Vector3(-0.07, 0, 0);
  const b = CreateBox("objectB", { size: 0.08 }, scene);
  b.position = new Vector3(0.07, 0, 0);

  // ⚠ Diagnostic only, and it is the seam the input layer will replace.
  scene.onPointerObservable.add((info) => {
    if (info.type !== PointerEventTypes.POINTERDOWN) return;
    const pick = info.pickInfo;
    if (!pick?.hit || !pick.pickedMesh) return;
    // eslint-disable-next-line no-console
    console.log("hit", pick.pickedMesh.name, "faceId", pick.faceId);
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
  return scene;
}
