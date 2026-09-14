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
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import "@babylonjs/core/Culling/ray";
import {
  DEFAULT_CONFIG,
  parseConfigOverrides,
  PinchTracker,
  clampCameraRadiusM,
  OrbitController,
  orbitCentre,
  Recognizer,
  TapHistory,
  screenPlaneRotation,
  screenRollRotation,
  type PosePort,
  type ReleaseVerdict,
  type Sample,
  type ScreenFrame,
} from "../input";
import type { Quat, Vec3 } from "../core/vec";
import { CAMERA_NEAR_PLANE_M } from "../input/gestureConfig";
import { validateGestureConfig } from "../input/gestureConfig";
import { createHud } from "./hud";
import { createMenu, type MenuSlider } from "./menu";

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

/**
 * ⛔⛔ A QUATERNION, NOT EULER ANGLES. Device-reported 2026-09-13: *"the yaw is in
 * the world coordinates while the pitch is in the object coordinates."* That is what
 * `mesh.rotation` does — Euler components are applied in a FIXED ORDER, so the second
 * angle acts inside the frame the first one just made, and the cube tumbles. The
 * composition now lives in `input/screen_rotate.ts`, where vectors can check it.
 */
type DiagnosticPose = Quat;

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
  // ⛔ ONE CONSTANT, ONE PLACE: the value lives in `gestureConfig.ts` because the
  // config VALIDATOR needs it to refuse a zoom range that would clip the scene.
  camera.minZ = CAMERA_NEAR_PLANE_M;
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
  const make = (name: string, at: Vector3, rgb: [number, number, number]) => {
    const mesh = CreateBox(name, { size: OBJECT_SIZE_M }, scene);
    mesh.position = at;
    // ⛔ Quaternion mode. While `rotationQuaternion` is null Babylon uses the Euler
    // `rotation` instead, which is the frame-mixing defect above.
    mesh.rotationQuaternion = Quaternion.Identity();
    const mat = new StandardMaterial(name + "-mat", scene);
    mat.diffuseColor = new Color3(...rgb);
    mesh.material = mat;
    // ⭐⭐ TAGGED, so §2 rule 1's barycentre sees the OBJECTS and nothing else. The
    // diagnostic marker below is a mesh too, and a marker that became a barycentre
    // candidate would move the very centre it is drawn to show — a readout that
    // changes what it measures, which `METHOD` warns about in those words.
    mesh.metadata = { orbitCandidate: true };
    return mesh;
  };
  make("objectA", new Vector3(-0.07, 0, 0), [0.65, 0.67, 0.72]);
  make("objectB", new Vector3(0.07, 0, 0), [0.45, 0.58, 0.72]);
  // ⭐ A THIRD OBJECT, so the barycentre mechanism has something to choose BETWEEN.
  // ⚠ Deliberately off-axis and off-plane: with three collinear objects every
  // barycentre lies on the same line and the ray could not distinguish them, so the
  // test would look like it passed while exercising nothing. `2^3 − 3 − 1 = 4`
  // candidates — three pairs and the triple.
  make("objectC", new Vector3(0.01, 0.1, -0.09), [0.72, 0.58, 0.45]);

  // ⚠ DIAGNOSTIC ONLY: a small marker at whatever §2 rule 1 chose to orbit around.
  // Without it the barycentre selection is invisible, and "it seems to orbit the right
  // thing" is not an observation. `IN3` deletes this with the rest of the stand-in.
  const centreMarker = CreateSphere("orbit-centre-marker", { diameter: 0.012 }, scene);
  const markerMat = new StandardMaterial("orbit-centre-mat", scene);
  markerMat.emissiveColor = new Color3(1, 0.85, 0.4);
  markerMat.disableLighting = true;
  centreMarker.material = markerMat;
  // ⛔ Not pickable, and not a barycentre candidate: it must not alter the gesture it
  // exists to display.
  centreMarker.isPickable = false;

  // ───────────────────────────────────────────────────────────────────
  // `IN1` — one recognizer per touchpoint, and a readout so the state machine can
  // actually be SEEN on the glass. ⚠ Role latching (§4) is `IN2`, not this.
  const hud = createHud();
  // ⭐⭐ TUNABLES MAY BE OVERRIDDEN FROM THE URL, so a number can be A/B'd ON THE
  // DEVICE without a rebuild — e.g. `?rollFilterBeta=0&rollAngle=45`. Every value
  // here is an `IN5` placeholder, and `IN5` is a device procedure. ⛔ ONE config
  // object results; nothing keeps a second copy. See input/config_override.ts.
  const tuning = parseConfigOverrides(DEFAULT_CONFIG, window.location.search);
  const cfg = tuning.config;
  const taps = new TapHistory(cfg);
  interface Held {
    rec: Recognizer<DiagnosticPose>;
    mesh: AbstractMesh;
    frame: ScreenFrame;
    /** ⚠ The PREVIOUS sample. The rotation is applied as a per-frame INCREMENT. */
    prev: Sample;
    lastRollDeg: number;
  }
  const live = new Map<number, Held>();
  let lastVerdict = "—";

  // ─────────────────────────────────────────────────────────────────
  // §2 RULE 4 — PINCH ZOOM, for touchpoints that hit NOTHING.
  //
  // ⭐ §4: *"Anchor role is latched at press time."* Whether a touchpoint is ON an
  // object or OUTSIDE one is decided once, when it goes down, and never revisited.
  // Without that a user steadying their grip near a part would silently switch
  // between two different mappings mid-gesture.
  const outside = new Map<number, Sample>();
  const pinch = new PinchTracker(cfg);

  // ─────────────────────────────────────────────────────────────────
  // §2 RULE 1 — ORBIT, for ONE touchpoint that hits nothing.
  //
  // ⛔⛔ OWNER'S AMENDMENT: driven by DELTA POSITION, not device tilt. The spec has
  // touch as a clutch for a tilt-orbit and says its delta is unused; the owner
  // changed that deliberately. See `Claude/00_CORE/queue_notes/IN9.md`.
  const orbit = new OrbitController(cfg, -Math.PI / 2, 0.62);
  // ⭐ ONE zoom scalar, shared. Pinch scales the whole orbit SURFACE rather than
  // setting a radius directly, so rule 1 and rule 4 compose instead of fighting over
  // the same number. `1` is the rings as configured.
  let zoom = 1;
  let zoomAtPinchStart = 1;
  /** The last outside touchpoint to move, so the orbit centre follows the finger. */
  let orbitCentreM: Vector3 = Vector3.Zero();

  /**
   * §2 rule 1's orbit centre: the barycentre nearest the touchpoint's ray.
   * ⚠ Only the objects actually ON SCREEN are offered — the spec asks for candidates
   * to be viewport-culled before ranking, and culling needs the projection, which is
   * why it happens here and not in `input/`.
   */
  const recomputeOrbitCentre = (e: { clientX: number; clientY: number }) => {
    const ray = scene.createPickingRay(e.clientX, e.clientY, null, camera);
    const visible = scene.meshes
      .filter((m) => m.isEnabled() && m.isVisible && m.metadata?.orbitCandidate === true)
      .map((m) => [m.position.x, m.position.y, m.position.z] as Vec3);
    const c = orbitCentre(
      visible,
      { origin: [ray.origin.x, ray.origin.y, ray.origin.z], direction: [ray.direction.x, ray.direction.y, ray.direction.z] },
      cfg,
    );
    orbitCentreM = new Vector3(c[0], c[1], c[2]);
    centreMarker.position.copyFrom(orbitCentreM);
  };

  /** Put the camera where the rig surface says, clamped away from the near plane. */
  const applyCamera = () => {
    const pose = orbit.pose(zoom);
    // ⛔ The rig gives a DIRECTION and a distance; the clamp may only shorten it.
    // Clamping the components independently would change the viewing ANGLE, which is
    // not what a near-plane guard is for.
    const wanted = pose.radiusM;
    const allowed = clampCameraRadiusM(wanted, cfg);
    const k = wanted > 1e-9 ? allowed / wanted : 1;
    camera.setPosition(
      orbitCentreM.add(
        new Vector3(pose.offsetM[0] * k, pose.offsetM[1] * k, pose.offsetM[2] * k),
      ),
    );
    camera.setTarget(orbitCentreM);
  };

  // ⚠ Place the camera on the rig surface at startup, so the very first frame is
  // already the pose the orbit will move from — not the ArcRotateCamera constructor's
  // own alpha/beta/radius, which would jump the instant a finger touched the glass.
  applyCamera();

  /** The two outside touchpoints, oldest first, or `null` unless there are exactly two. */
  const pinchPair = (): [Sample, Sample] | null => {
    if (outside.size !== 2 || live.size !== 0) return null;
    const [a, b] = [...outside.values()];
    return [a!, b!];
  };

  const updatePinch = () => {
    const p = pinchPair();
    if (!p) return;
    const factor = pinch.scale(p[0], p[1]);
    if (factor === null) return; // still inside the deadband: leave the camera alone
    zoom = zoomAtPinchStart * factor;
    applyCamera();
  };

  /** Babylon stores `(x, y, z, w)`; `core/vec` uses `[w, x, y, z]`. One conversion. */
  const readPose = (mesh: AbstractMesh): Quat => {
    const q = mesh.rotationQuaternion!;
    return [q.w, q.x, q.y, q.z];
  };
  const writePose = (mesh: AbstractMesh, q: Quat): void => {
    mesh.rotationQuaternion!.set(q[1], q[2], q[3], q[0]);
  };

  const poseOf = (mesh: AbstractMesh): PosePort<DiagnosticPose> => ({
    snapshot: () => readPose(mesh),
    restore: (p) => writePose(mesh, p),
  });

  const asVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z];

  /**
   * The camera's screen axes in WORLD space. ⚠ Latched at press, not recomputed per
   * frame: rule 1's camera orbit must not silently redefine the axes half-way
   * through a gesture. Same lesson as §1.4's `WORLD_AXIS_ALIGN`.
   */
  const screenFrame = (): ScreenFrame => ({
    right: asVec3(camera.getDirection(Vector3.Right())),
    up: asVec3(camera.getDirection(Vector3.Up())),
    viewAxis: asVec3(camera.getDirection(Vector3.Forward())),
  });

  const describe = (v: ReleaseVerdict): string => {
    const rule = v.rule === "NONE" ? "" : `  → ${v.rule}`;
    const back = v.rolledBack ? "  ROLLED BACK" : "";
    const f = v.flick ? `  ${v.flick.axis}${v.flick.sign > 0 ? "+" : "-"}` : "";
    // ⭐ The measured lift speed is printed WHETHER OR NOT it passed, against the
    // threshold it was judged by. "The flick did not fire" is otherwise
    // unfalsifiable on a device: too slow a finger and a broken estimator look the
    // same. That ambiguity is what made the first rollback build feel inconsistent.
    const lift = `lift ${Math.round(v.liftSpeedMmPerS)}/${cfg.flickLiftSpeed}mm/s`;
    return `${v.kind}${f}${rule}${back}  ${Math.round(v.durationMs)}ms  ${lift}`;
  };

  const paint = () => {
    const first = live.values().next().value;
    hud.update({
      pointers: live.size + outside.size,
      // ⛔ Straight off the recognizer that made the decision. Never recomputed here:
      // a readout that derives its own answer is a second implementation, and it can
      // disagree with the product while showing green. See `METHOD`.
      phase: first ? first.rec.currentPhase : "—",
      motion: first ? first.rec.motionState : "—",
      rollDeg: first ? first.rec.rollDeg : 0,
      rollCommitted: first ? first.rec.rollCommitted : false,
      lastVerdict,
      // ⚠ Shown so a session can never be spent testing a value that was not in
      // force — including a typo'd key, which is REPORTED rather than ignored.
      camera:
        `c=(${orbitCentreM.x.toFixed(2)},${orbitCentreM.y.toFixed(2)},${orbitCentreM.z.toFixed(2)}) ` +
        `r=${camera.radius.toFixed(3)}m zoom=${zoom.toFixed(2)} ` +
        `elev=${orbit.elevation.toFixed(2)}${orbit.atLimit ? "⛔LIMIT" : ""}` +
        `${pinch.isZooming ? "  ZOOMING" : ""}`,
      tuning: tuning.applied.length === 0 ? "defaults" : tuning.applied.join(" "),
      tuningRejected: tuning.rejected,
    });
  };

  /**
   * ⚠ `performance.now()`, NOT `event.timeStamp`. Their epochs differ by browser
   * (and historically within one), and every threshold in `gestureConfig` is a
   * duration. One clock, chosen here, used for every sample.
   */
  // ─────────────────────────────────────────────────────────────────
  // THE TUNING MENU. ⭐ Every number it touches is an `IN5` placeholder.

  /**
   * One tunable, bound to the live config.
   *
   * ⛔⛔ THE CHANGE IS TRIED ON A COPY AND VALIDATED BEFORE IT IS KEPT.
   * `validateGestureConfig` normally runs once, in `MotionTracker`'s constructor, so a
   * slider writing straight into the config would bypass every cross-tunable rule
   * there is — and these are exactly the numbers that are only meaningful in
   * combination. Ring heights that stop climbing fold the orbit surface back through
   * itself; a camera radius inside the near plane renders a black page with no error.
   * ⭐ A rejected change is RETURNED so the menu can show why, never dropped in silence.
   */
  const tunable = (
    label: string,
    key: keyof typeof cfg & string,
    min: number,
    max: number,
    step: number,
  ): MenuSlider => ({
    label,
    min,
    max,
    step,
    get: () => cfg[key] as unknown as number,
    set: (value) => {
      const candidate = { ...cfg, [key]: value };
      try {
        validateGestureConfig(candidate);
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
      // ⛔ Mutate the ONE config object everything already holds — no second copy.
      // Carried rule `L1`: a tuning value living in both a debug tool and production
      // silently drifted apart.
      (cfg as unknown as Record<string, number>)[key] = value;
      applyCamera();
      paint();
      return null;
    },
  });

  createMenu([
    {
      title: "CAMERA ORBIT — rings",
      sliders: [
        tunable("top radius (m)", "orbitTopRadiusM", 0, 1.5, 0.01),
        tunable("top height (m)", "orbitTopHeightM", -1.5, 1.5, 0.01),
        tunable("middle radius (m)", "orbitMiddleRadiusM", 0, 1.5, 0.01),
        tunable("middle height (m)", "orbitMiddleHeightM", -1.5, 1.5, 0.01),
        tunable("bottom radius (m)", "orbitBottomRadiusM", 0, 1.5, 0.01),
        tunable("bottom height (m)", "orbitBottomHeightM", -1.5, 1.5, 0.01),
      ],
    },
  ]);

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
      if (!pick?.hit || !pick.pickedMesh) {
        // ⭐ Hit nothing: this touchpoint belongs to the camera rules, and that role
        // is now LATCHED for its lifetime (§4).
        outside.set(e.pointerId, s);
        // ⭐ Rule 1 chooses what to orbit AROUND at press, from the ray of the finger
        // that started it — so the centre cannot wander mid-drag as the ray moves.
        if (outside.size === 1) recomputeOrbitCentre(e);
        const p = pinchPair();
        if (p) {
          pinch.begin(p[0], p[1]);
          // ⚠ Captured HERE, once. The zoom is a ratio against the gesture's start,
          // never an accumulation — so a pinch out and back returns exactly where it
          // began. See input/pinch.ts.
          zoomAtPinchStart = zoom;
        }
        paint();
        return;
      }
      const mesh = pick.pickedMesh;
      const rec = new Recognizer(cfg, poseOf(mesh), taps);
      rec.press(s);
      live.set(e.pointerId, { rec, mesh, frame: screenFrame(), prev: s, lastRollDeg: 0 });
      paint();
      return;
    }

    if (outside.has(e.pointerId)) {
      if (info.type === PointerEventTypes.POINTERMOVE) {
        const prev = outside.get(e.pointerId)!;
        outside.set(e.pointerId, s);
        if (outside.size === 2) {
          updatePinch();
        } else if (outside.size === 1 && live.size === 0) {
          // §2 rule 1: ONE touchpoint, no hit — orbit.
          orbit.drag(s.x - prev.x, s.y - prev.y);
          applyCamera();
        }
      } else if (info.type === PointerEventTypes.POINTERUP) {
        outside.delete(e.pointerId);
        // ⛔ A pinch needs BOTH touchpoints. Lifting one ends it rather than letting
        // the survivor keep scaling against a partner that is gone.
        pinch.end();
      }
      paint();
      return;
    }

    const held = live.get(e.pointerId);
    if (!held) return;

    if (info.type === PointerEventTypes.POINTERMOVE) {
      if (held.rec.move(s) === "COMMITTED_CONTINUOUS") {
        // The provisional motion — applied LIVE, and undone by the recognizer itself
        // if the flick test passes at release. See the header: stand-in, not 2bis.
        //
        // ⭐ APPLIED AS A PER-FRAME INCREMENT onto the pose the object already has,
        // about the screen axes latched at press. Every step is a small world-frame
        // rotation, so the two axes never end up nested inside one another.
        const cur = readPose(held.mesh);
        if (held.rec.rollCommitted) {
          // 2quinte has taken over: roll about the view axis by what the finger has
          // swept since the last frame. ⚠ Roll REPLACES yaw/pitch for the rest of
          // this gesture, which is what "commits to roll" means.
          // ⭐ The 1€-FILTERED angle. The raw channel drives the COMMIT threshold;
          // this drives what the eye sees. See input/one_euro.ts.
          writePose(
            held.mesh,
            screenRollRotation(cur, held.frame, held.rec.rollSmoothedDeg - held.lastRollDeg),
          );
        } else {
          writePose(
            held.mesh,
            screenPlaneRotation(
              cur,
              held.frame,
              s.x - held.prev.x,
              s.y - held.prev.y,
              DIAGNOSTIC_RAD_PER_PX,
            ),
          );
        }
      }
      held.lastRollDeg = held.rec.rollSmoothedDeg;
      held.prev = s;
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
