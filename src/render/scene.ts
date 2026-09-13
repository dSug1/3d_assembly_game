/**
 * THE ONLY FILE THAT IMPORTS BABYLON. Deliberately thin.
 *
 * ⚠ STUB — it stands up a scene with two objects and drives one `IN1` recognizer
 * per touchpoint, so the loop is closed end to end. The gesture RULES are NOT wired
 * yet; that is queue rows `IN2`–`IN4`. What matters today is the BOUNDARY:
 * everything with a rule in it lives in `src/core` or `src/input`, and
 * `tests/boundary.test.ts` fails the build if an engine import creeps into either.
 *
 * ⛔⛔ THE ROTATION BELOW IS A DIAGNOSTIC STAND-IN, NOT RULE 2bis. It exists so the
 * recognizer's PROVISIONAL MOTION AND ROLLBACK have a visible shape on a device --
 * drag and the cube turns, flick and it snaps back to where the press found it.
 * It has no gain from `gestureConfig`, no selection semantics, no constrained
 * variant and no constraint stack. `IN3` builds the real thing and deletes this.
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
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import "@babylonjs/core/Culling/ray";
import {
  DEFAULT_CONFIG,
  Recognizer,
  TapHistory,
  type PosePort,
  type ReleaseVerdict,
  type Sample,
} from "../input";
import { createHud } from "./hud";

/** Metres. The objects are ~8 cm; the camera sits ~60 cm away. */
const OBJECT_SIZE_M = 0.08;
const CAMERA_RADIUS_M = 0.6;

/**
 * ⚠ DIAGNOSTIC ONLY — radians per CSS pixel for the stand-in rotation.
 * ⛔ THIS IS NOT A GESTURE GAIN AND MUST NOT BECOME ONE. The real gains are
 * `gainRotateFree` / `gainRotateConstrained` in `gestureConfig.ts`, they are in
 * millimetres, and they belong to `IN3`. Keeping this number OUT of the config is
 * the point: one constant, one place, and a debug value that leaks into production
 * is exactly the drift `gestureConfig`'s header warns about.
 */
const DIAGNOSTIC_RAD_PER_PX = 0.008;

interface DiagnosticPose {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

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

  // ───────────────────────────────────────────────────────────────────
  // `IN1` — one recognizer per touchpoint, and a readout so the state machine can
  // actually be SEEN on the glass. ⚠ Role latching (§4) is `IN2`, not this.
  const hud = createHud();
  const taps = new TapHistory(DEFAULT_CONFIG);
  const live = new Map<
    number,
    { rec: Recognizer<DiagnosticPose>; mesh: AbstractMesh; base: DiagnosticPose; press: Sample }
  >();
  let lastVerdict = "—";

  const poseOf = (mesh: AbstractMesh): PosePort<DiagnosticPose> => ({
    snapshot: () => ({ x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z }),
    restore: (p) => mesh.rotation.set(p.x, p.y, p.z),
  });

  const describe = (v: ReleaseVerdict): string => {
    const rule = v.rule === "NONE" ? "" : `  → ${v.rule}`;
    const back = v.rolledBack ? "  ROLLED BACK" : "";
    const f = v.flick ? `  ${v.flick.axis}${v.flick.sign > 0 ? "+" : "-"}` : "";
    return `${v.kind}${f}${rule}${back}  ${Math.round(v.durationMs)}ms`;
  };

  const paint = () => {
    const first = live.values().next().value;
    hud.update({
      pointers: live.size,
      // ⛔ Straight off the recognizer that made the decision. Never recomputed here:
      // a readout that derives its own answer is a second implementation, and it can
      // disagree with the product while showing green. See `METHOD`.
      phase: first ? first.rec.currentPhase : "—",
      motion: first ? first.rec.motionState : "—",
      rollDeg: first ? first.rec.rollDeg : 0,
      rollCommitted: first ? first.rec.rollCommitted : false,
      lastVerdict,
    });
  };

  /**
   * ⚠ `performance.now()`, NOT `event.timeStamp`. Their epochs differ by browser
   * (and historically within one), and every threshold in `gestureConfig` is a
   * duration. One clock, chosen here, used for every sample.
   */
  const sampleOf = (e: { clientX: number; clientY: number }): Sample => ({
    x: e.clientX,
    y: e.clientY,
    t: performance.now(),
  });

  scene.onPointerObservable.add((info) => {
    const e = info.event as PointerEvent;
    const s = sampleOf(e);

    if (info.type === PointerEventTypes.POINTERDOWN) {
      const pick = info.pickInfo;
      if (!pick?.hit || !pick.pickedMesh) return; // rule 1's no-hit case is `IN3`
      const mesh = pick.pickedMesh;
      const rec = new Recognizer(DEFAULT_CONFIG, poseOf(mesh), taps);
      rec.press(s);
      live.set(e.pointerId, {
        rec,
        mesh,
        base: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        press: s,
      });
      paint();
      return;
    }

    const held = live.get(e.pointerId);
    if (!held) return;

    if (info.type === PointerEventTypes.POINTERMOVE) {
      if (held.rec.move(s) === "COMMITTED_CONTINUOUS") {
        // The provisional motion — applied LIVE, and undone by the recognizer itself
        // if the flick test passes at release. See the header: stand-in, not 2bis.
        held.mesh.rotation.set(
          held.base.x + (s.y - held.press.y) * DIAGNOSTIC_RAD_PER_PX,
          held.base.y + (s.x - held.press.x) * DIAGNOSTIC_RAD_PER_PX,
          held.base.z,
        );
      }
      paint();
      return;
    }

    if (info.type === PointerEventTypes.POINTERUP) {
      // ⚠ No `ReleaseContext` yet: selection and the two-touchpoint context are
      // `IN2`/`IN3`. So 6quater cannot win here, and the readout will show 2ter /
      // 2quater only. That is a missing INPUT, not a recognizer that ignores it.
      lastVerdict = describe(held.rec.release(s));
      live.delete(e.pointerId);
      paint();
    }
  });

  paint();

  let frames = 0;
  engine.runRenderLoop(() => {
    scene.render();
    frames++;
  });
  window.addEventListener("resize", () => engine.resize());

  return { scene, engine, framesRendered: () => frames };
}
