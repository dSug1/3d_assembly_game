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
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔⛔ THE UNITS TRAP THAT COST THE FIRST DEPLOY: **THIS SCENE IS IN METRES, AND
 * BABYLON'S DEFAULT NEAR PLANE IS 1 WORLD UNIT.**
 *
 * The objects are 0.08 m across at a camera radius of 0.6 m — so with `minZ` at its
 * default of `1`, EVERY object sits inside the near plane and is clipped away. The
 * result is a page showing nothing but the clear colour, with **no error anywhere**:
 * the engine is running, the meshes exist, the render loop is turning, and the
 * screen is empty.
 *
 * ⭐ Working in metres is the right choice — the mate geometry, the capture radii
 * and the play volume are all physical — so the near plane moves, not the scale.
 * ⚠ Any future camera must set `minZ` too. It is a per-camera property, not a scene
 * one, which is exactly why this is easy to reintroduce.
 */
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import "@babylonjs/core/Culling/ray";

/** Metres. The objects are ~8 cm; the camera sits ~60 cm away. */
const OBJECT_SIZE_M = 0.08;
const CAMERA_RADIUS_M = 0.6;

export interface SceneHandle {
  readonly scene: Scene;
  readonly engine: Engine;
  /** Set by the render loop; `main.ts` uses it to prove drawing actually happened. */
  framesRendered: () => number;
}

export function createScene(canvas: HTMLCanvasElement): SceneHandle {
  const engine = new Engine(canvas, true, { stencil: true }, true);
  const scene = new Scene(engine);
  // ⚠ Explicit, so "dark page" always means the SCENE, never an unset default.
  scene.clearColor = new Color4(0.078, 0.086, 0.102, 1);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3,
    CAMERA_RADIUS_M,
    Vector3.Zero(),
    scene,
  );
  // ⛔⛔ SEE THE HEADER. Without this the whole scene is inside the near plane.
  camera.minZ = 0.01;
  camera.maxZ = 100;
  // ⛔ The camera does NOT take the pointer. Rules 1 and 4 drive the orbit through
  // the gesture layer; letting Babylon's own controls attach as well means two
  // things claim the same touch and the winner depends on event order.
  camera.detachControl();

  const light = new HemisphericLight("light", new Vector3(0.3, 1, 0.2), scene);
  light.intensity = 0.95;

  // ⚠ EXPLICIT materials rather than the auto-created default: with tree-shaken ES6
  // imports the default material is one more thing that has to have been pulled in,
  // and "the mesh is there but shaded black" is another silent-looking failure.
  const make = (name: string, x: number, rgb: [number, number, number]) => {
    const mesh = CreateBox(name, { size: OBJECT_SIZE_M }, scene);
    mesh.position = new Vector3(x, 0, 0);
    const mat = new StandardMaterial(name + "-mat", scene);
    mat.diffuseColor = new Color3(...rgb);
    mesh.material = mat;
    return mesh;
  };
  make("objectA", -0.07, [0.65, 0.67, 0.72]);
  make("objectB", 0.07, [0.45, 0.58, 0.72]);

  // ⚠ Diagnostic only, and it is the seam the input layer will replace.
  scene.onPointerObservable.add((info) => {
    if (info.type !== PointerEventTypes.POINTERDOWN) return;
    const pick = info.pickInfo;
    if (!pick?.hit || !pick.pickedMesh) return;
    // eslint-disable-next-line no-console
    console.log("hit", pick.pickedMesh.name, "faceId", pick.faceId);
  });

  let frames = 0;
  engine.runRenderLoop(() => {
    scene.render();
    frames++;
  });
  window.addEventListener("resize", () => engine.resize());

  return { scene, engine, framesRendered: () => frames };
}
