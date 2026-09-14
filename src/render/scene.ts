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
  OrbitCentreBlend,
  orbitCentre,
  PointerNoiseMeter,
  PointerRouter,
  screenTranslation,
  advanceFollow,
  exponentialSmooth,
  phantomTarget,
  neutralLeadSec,
  type FollowState,
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
import { mmToPx } from "../core/units";
import { validateGestureConfig } from "../input/gestureConfig";
import { createHud } from "./hud";
import { createMenu, type MenuSlider } from "./menu";

/** Metres. The objects are ~8 cm; the camera sits ~60 cm away. */
const OBJECT_SIZE_M = 0.08;
const CAMERA_RADIUS_M = 0.6;


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
    /**
     * ⭐⭐ WHAT THIS GESTURE IS DOING — read from PRESENCE, every frame, not latched.
     *
     * ⛔⛔ THE OWNER OVERTURNED THE LATCH, 2026-09-14, and was right. I first gated rule 6
     * on the anchor being `STATIONARY` at the moment the drag committed, and latched the
     * answer — reasoning from §4 that a mode must not flip mid-gesture. On the device
     * that produced a plain bug: move the second finger, let it settle, and the object
     * ROTATED as though the finger were not there.
     * ⭐ THE LESSON IS THE DISTINCTION BETWEEN THE TWO SIGNALS. §4 latches roles because
     * `MOVING`/`STATIONARY` is a NOISY, CONTINUOUS reading — a resting thumb crosses the
     * threshold by itself, so a rule keyed to it would flicker. Whether a finger is DOWN
     * is neither: it is discrete and deliberate, it changes only when a person decides
     * it does, and it is the one thing they can see. Latching it hides state instead of
     * protecting it. ⚠ Do not generalise "latch at press" to every input.
     * ⚠ `null` only before the gesture commits.
     */
    mode: "ROTATE" | "TRANSLATE" | null;
  }
  /**
   * ⭐⭐ `IN2`: THE ROLES LIVE IN `src/input/router.ts`, NOT HERE. This file used to keep
   * a `live` map and an `outside` map and decide membership by which one an id was in —
   * which worked, and had no way to express the `IN8` decision, no explicit press order,
   * and no vectors. The router is engine-free and tested; `held` below is only the
   * per-gesture state a role cannot carry.
   */
  const router = new PointerRouter<AbstractMesh>();
  const held = new Map<number, Held>();

  /**
   * RULE 6's INERTIA. ⭐ The finger drives a TARGET; the mesh follows it under a
   * critically damped law (`input/follow.ts`), so it accelerates out of rest and
   * decelerates into place instead of being pinned to the fingertip.
   *
   * ⛔⛔ KEYED BY MESH, NOT BY TOUCHPOINT, AND IT OUTLIVES THE RELEASE — that is the
   * whole of the deceleration. A follower torn down with the gesture would stop the
   * object dead the instant the finger left, which is exactly the teleporting feel the
   * inertia exists to remove.
   * ⛔ ADVANCED IN THE RENDER LOOP, not on pointer events: pointer events stop arriving
   * the moment the finger stops, and a system with momentum has to keep integrating
   * after its input goes quiet.
   */
  interface Follow {
    /** Where the finger has put it. */
    readonly target: Vector3;
    /**
     * ⭐ The target's own SMOOTHED velocity, m/s, per axis — what the phantom is
     * projected along. ⛔ Smoothed, never a two-sample difference: it gets multiplied by
     * the lead and written straight into where the object is drawn. See `lead.ts`.
     */
    readonly vTarget: Vector3;
    /** The previous frame's target, for that velocity. */
    readonly lastTarget: Vector3;
    x: FollowState;
    y: FollowState;
    z: FollowState;
  }
  const followers = new Map<AbstractMesh, Follow>();

  const followerFor = (mesh: AbstractMesh): Follow => {
    let f = followers.get(mesh);
    if (!f) {
      const p = mesh.position;
      f = {
        target: p.clone(),
        vTarget: Vector3.Zero(),
        lastTarget: p.clone(),
        x: { x: p.x, v: 0 },
        y: { x: p.y, v: 0 },
        z: { x: p.z, v: 0 },
      };
      followers.set(mesh, f);
    }
    return f;
  };
  let lastVerdict = "—";

  // ─────────────────────────────────────────────────────────────────
  // §2 RULE 4 — PINCH ZOOM, for touchpoints that hit NOTHING.
  //
  // ⭐ §4: *"Anchor role is latched at press time."* Whether a touchpoint is ON an
  // object or OUTSIDE one is decided once, when it goes down, and never revisited.
  // Without that a user steadying their grip near a part would silently switch
  // between two different mappings mid-gesture. ⭐ `IN2` now owns that latch.
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
  // ⛔⛔ THE CENTRE MIGRATES, IT DOES NOT TELEPORT. Rule 1 re-chooses a barycentre on
  // every press, so aiming at a different pair of objects used to JUMP the camera.
  // See input/orbit.ts — progress is finger travel in mm, not wall-clock.
  const centreBlend = new OrbitCentreBlend(cfg, [0, 0, 0]);
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
    // ⚠ RETARGET, never assign. The blend starts from wherever the centre actually is,
    // so interrupting a half-finished migration does not put the jump back.
    centreBlend.retarget(c);
    syncCentre();
  };

  /** Read the blended centre into the scene, and show the chosen target. */
  const syncCentre = () => {
    const c = centreBlend.centreM;
    orbitCentreM = new Vector3(c[0], c[1], c[2]);
    // ⭐⭐ THE MARKER JUMPS TO THE CHOSEN BARYCENTRE IMMEDIATELY, while the camera
    // migrates to it. Owner's instruction, and it is the right reading of what the
    // marker is FOR: it exists to show which barycentre rule 1 SELECTED, so a marker
    // that crawls along with the camera makes the selection harder to read rather
    // than easier. ⚠ The migration is still visible — as the gap between the camera
    // and a marker that is already where it is going.
    const t = centreBlend.targetM;
    centreMarker.position.set(t[0], t[1], t[2]);
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

  /**
   * The two outside touchpoints, OLDEST FIRST, or `null` unless there are exactly two
   * and nothing is being held. ⭐ Press order is the router's `seq`, not a `Map`'s
   * insertion order — the two agree until an id is reused.
   */
  const pinchPair = (): [Sample, Sample] | null => {
    const out = router.outside();
    if (out.length !== 2 || router.objects().length !== 0) return null;
    return [out[0]!.last, out[1]!.last];
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
    const first = held.get(router.objects()[0]?.id ?? -1);
    hud.update({
      // ⚠ EVERY finger down, ignored ones included — the readout must not lie about
      // what is on the glass. The rules read `activeCount`, which excludes them.
      pointers: router.size,
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
        `${centreBlend.isBlending ? `→${(centreBlend.progress * 100).toFixed(0)}% ` : ""}` +
        `r=${camera.radius.toFixed(3)}m zoom=${zoom.toFixed(2)} ` +
        `elev=${orbit.elevation.toFixed(2)}${orbit.atLimit ? "⛔LIMIT" : ""}` +
        `${pinch.isZooming ? "  ZOOMING" : ""}`,
      tuning: tuning.applied.length === 0 ? "defaults" : tuning.applied.join(" "),
      tuningRejected: tuning.rejected,
      // ⭐ Each touchpoint in PRESS order with its latched role, e.g. `#1OBJ #2IGN`.
      // ⛔ `IGN` is the one that matters: it is the visible form of the IN8 decision.
      roles:
        router.size === 0
          ? "—"
          : router
              .all()
              .map((p) => `#${p.id}${p.role.slice(0, 3)}`)
              .join(" ") +
            `  active=${router.activeCount}` +
            // ⭐ The LATCHED mode of the gesture in progress — rule 6 vs the 2bis
            // stand-in. ⛔ Printed because it is decided once and cannot be inferred
            // from what the fingers are doing now, which is the whole point of a latch.
            (first?.mode ? `  ${first.mode}` : "") +
            // ⭐ The lead at which a steady drag leaves NO gap, for the sliders as they
            // stand. ⛔ Printed rather than left in a doc: it moves whenever either of
            // the other two sliders moves, so a written-down number would go stale the
            // first time the owner touched them.
            `  lead ${cfg.translateLeadMs}/${(
              neutralLeadSec(cfg.translateInertiaMs / 1000, cfg.translateDampingRatio) * 1000
            ).toFixed(1)}ms`,
      noise: noiseLine(),
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
      title: "OBJECT ROTATION",
      sliders: [
        // ⚠ §2bis's own gain, in radians per MILLIMETRE of finger travel. The
        // diagnostic stand-in reads it, so tuning here tunes what `IN3` will inherit.
        tunable("yaw/pitch gain (rad/mm)", "gainRotateFree", 0.005, 0.15, 0.005),
        // ⭐ 1 is direct manipulation — the cube turns as far as the finger swept.
        tunable("roll gain (x swept)", "gainRoll", 0.1, 3, 0.05),
      ],
    },
    {
      title: "OBJECT TRANSLATION",
      sliders: [
        // ⭐⭐ 1.0 IS THE CORRECT VALUE, NOT A PREFERRED ONE — the object sits exactly
        // under the finger at every camera distance. The slider exists so that claim
        // can be DISPROVED by finger, and so the owner can judge whether direct
        // manipulation actually feels best; it is not there because the number is
        // unknown. ⚠ Every other gain on this project was guessed too slow; this is the
        // first one that was computed. See input/translate.ts.
        tunable("screen-plane gain (1 = under finger)", "gainTranslateScreen", 0.1, 3, 0.05),
        // ⭐ 0 pins the object to the fingertip — the behaviour before inertia existed,
        // and the only setting that can be checked against the tracking factor.
        // ⚠ 1–20 ms in steps of 0.2, and 0.1–0.5 for the ratio: the owner's ranges after
        // two device passes, zoomed hard into the corner that worked. ⛔ Three reference
        // settings are now OFF the sliders — `translateInertiaMs = 0` (exact tracking,
        // the only setting checkable against rule 6's tracking factor), `ζ = 1`
        // (critical damping, what every overshoot vector is written against), and the
        // neutral lead. All three remain reachable from the URL, e.g.
        // `?translateInertiaMs=0&translateDampingRatio=1`. ⚠ A slider that cannot reach
        // a reference is fine; a reference nobody can reach at all is not.
        tunable("inertia (ms)", "translateInertiaMs", 1, 20, 0.2),
        // ⭐ BELOW 1 IS THE CATCH-UP. 1 = critically damped, never overshoots; lower
        // accelerates through the gap and overshoots a little; far lower rings.
        // ⚠ It does nothing perceptible unless the inertia above is large enough to
        // give it something to act on.
        tunable("damping ratio (<1 = catch-up)", "translateDampingRatio", 0.1, 0.5, 0.05),
        // ⭐ The phantom target's lead. The HUD prints the NEUTRAL value (2·ζ·τ) for
        // whatever the two sliders above are set to, so this one has a landmark rather
        // than a range of equally arbitrary numbers.
        tunable("phantom lead (ms)", "translateLeadMs", 0, 1.5, 0.1),
      ],
    },
    {
      title: "CAMERA ORBIT",
      sliders: [
        tunable("top radius (m)", "orbitTopRadiusM", 0, 1.5, 0.01),
        tunable("top height (m)", "orbitTopHeightM", -1.5, 1.5, 0.01),
        tunable("middle radius (m)", "orbitMiddleRadiusM", 0, 1.5, 0.01),
        tunable("middle height (m)", "orbitMiddleHeightM", -1.5, 1.5, 0.01),
        tunable("bottom radius (m)", "orbitBottomRadiusM", 0, 1.5, 0.01),
        tunable("bottom height (m)", "orbitBottomHeightM", -1.5, 1.5, 0.01),
        // ⚠ 0 reproduces the old teleporting centre, for an A/B by finger.
        tunable("centre blend (mm)", "orbitBlendDistanceMm", 0, 200, 5),
        // ⛔ Radians (and elevation-parameter) per MILLIMETRE of finger travel, never
        // per pixel — a pixel means something different on a phone and a tablet.
        tunable("yaw gain ←→ (rad/mm)", "gainOrbitYaw", 0.002, 0.06, 0.002),
        tunable("elevation gain ↑↓ (/mm)", "gainOrbitElevation", 0.002, 0.05, 0.002),
      ],
    },
  ]);

  /**
   * THE `pointerNoiseMm` INSTRUMENT (`IN5`). See `src/input/noise_meter.ts`.
   *
   * ⛔ ONE touchpoint feeds it — the first one down — and it is RESET when that hold
   * begins. Interleaving two fingers into one window would measure the distance
   * BETWEEN them, which is a different quantity entirely and a large one; the same
   * shape of mistake as measuring a rate over the shortest available baseline.
   *
   * ⚠ The reading survives the lift on purpose: a person cannot read a number off the
   * glass while their finger is covering it.
   */
  const noise = new PointerNoiseMeter();
  let noisePointer: number | null = null;

  const noiseLine = (): string => {
    const floor = noise.floorMm;
    if (Number.isNaN(floor)) return `— (n=${noise.samples}, hold one finger still)`;
    // ⭐ Printed against the value currently IN FORCE, because the reading is only
    // ever interesting as a comparison — and a config the sagitta rule is judged by
    // must not be compared against a half-remembered number.
    return `floor=${floor.toFixed(3)}mm now=${noise.rmsMm.toFixed(3)} n=${noise.samples} cfg=${cfg.pointerNoiseMm}`;
  };

  const sampleOf = (e: { clientX: number; clientY: number }): Sample => ({
    x: e.clientX,
    y: e.clientY,
    t: performance.now(),
  });

  scene.onPointerObservable.add((info) => {
    const e = info.event as PointerEvent;
    const s = sampleOf(e);

    // ⭐ The noise meter runs BEFORE the recognizer and independently of it: it must
    // see the raw stream whatever rule the touchpoint turns out to belong to, and it
    // must not be able to change what that rule does.
    if (info.type === PointerEventTypes.POINTERDOWN && noisePointer === null) {
      noisePointer = e.pointerId;
      noise.reset();
    }
    if (e.pointerId === noisePointer) {
      // ⚠ DOWN and MOVE only, named explicitly. Babylon also emits `POINTERPICK`,
      // `POINTERTAP` and `POINTERDOUBLETAP` carrying the SAME underlying event, and a
      // duplicated sample would pull the RMS down — an instrument that flatters
      // itself is worse than none. `METHOD`: the instrument is a suspect.
      if (info.type === PointerEventTypes.POINTERUP) noisePointer = null;
      else if (
        info.type === PointerEventTypes.POINTERDOWN ||
        info.type === PointerEventTypes.POINTERMOVE
      ) {
        noise.push(s);
      }
    }

    if (info.type === PointerEventTypes.POINTERDOWN) {
      const pick = info.pickInfo;
      const hit = pick?.hit && pick.pickedMesh ? pick.pickedMesh : null;
      // ⭐⭐ THE ONE PLACE A ROLE IS DECIDED, and it is decided by `IN2`, once.
      const routed = router.press(e.pointerId, s, hit);

      if (routed.role === "IGNORED") {
        // ⛔ `IN8`: a second touchpoint on an object something else already holds.
        // It starts no recognizer, takes no anchor and moves nothing. ⚠ It is still
        // COUNTED on the readout, so "why is nothing happening" has a visible answer.
        paint();
        return;
      }

      if (routed.role === "OUTSIDE") {
        // ⭐ Rule 1 chooses what to orbit AROUND at press, from the ray of the finger
        // that started it — so the centre cannot wander mid-drag as the ray moves.
        if (router.outside().length === 1) recomputeOrbitCentre(e);
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

      const mesh = routed.object!;
      const rec = new Recognizer(cfg, poseOf(mesh), taps);
      rec.press(s);
      held.set(e.pointerId, {
        rec,
        mesh,
        frame: screenFrame(),
        prev: s,
        lastRollDeg: 0,
        mode: null,
      });
      paint();
      return;
    }

    // ⛔ Everything past here is a MOVE or an UP for a touchpoint already latched. The
    // role decides which rule sees it — never a second look at what is under the finger.
    const routed = router.get(e.pointerId);
    if (!routed) return;

    if (routed.role === "IGNORED") {
      // ⛔⛔ AN IGNORED TOUCHPOINT RUNS NOTHING, INCLUDING ON RELEASE — no release
      // verdict, no flick test, no tap history. ⚠ The OPPOSITE of the pinch three
      // branches below, where lifting one of two fingers ends the gesture. A stray TAP
      // from here would evict a constraint (§1.4) that the user never asked to lose.
      if (info.type === PointerEventTypes.POINTERUP) router.release(e.pointerId);
      else router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
      paint();
      return;
    }

    if (routed.role === "OUTSIDE") {
      if (info.type === PointerEventTypes.POINTERMOVE) {
        const prev = routed.last;
        // ⚠ The live hit is handed over and DISCARDED by the router: this finger may
        // now be over a part, and it is still an anchor. See router.ts's `hitNow`.
        router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
        if (router.outside().length === 2) {
          updatePinch();
        } else if (router.outside().length === 1 && router.objects().length === 0) {
          // §2 rule 1: ONE touchpoint, no hit — orbit.
          const dx = s.x - prev.x;
          const dy = s.y - prev.y;
          orbit.drag(dx, dy);
          // ⭐ The centre migrates by the SAME finger travel that drives the orbit, so
          // the camera arrives as the gesture progresses rather than on a timer.
          centreBlend.advance(Math.hypot(dx, dy) / mmToPx(1));
          syncCentre();
          applyCamera();
        }
      } else if (info.type === PointerEventTypes.POINTERUP) {
        router.release(e.pointerId);
        // ⛔ A pinch needs BOTH touchpoints. Lifting one ends it rather than letting
        // the survivor keep scaling against a partner that is gone.
        pinch.end();
      }
      paint();
      return;
    }

    const grip = held.get(e.pointerId);
    if (!grip) return;

    if (info.type === PointerEventTypes.POINTERMOVE) {
      // ⚠ Handed the live hit, which the router discards: a finger that presses on a
      // part and slides off is still holding it (§4).
      router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
      if (grip.rec.move(s) === "COMMITTED_CONTINUOUS") {
        // ⭐⭐ PRESENCE, RE-READ EVERY FRAME. A second finger outside any object — no
        // matter what it has done since it went down — means rule 6. Lift it and the
        // gesture goes back to rotating, which is a deliberate act and a visible one.
        // ⚠ `>= 1`: two anchors and one object is not in §4's table, and translating is
        // the answer that surprises nobody. Pinch and orbit both require NOTHING held,
        // so neither can be running at the same time.
        grip.mode =
          router.objects().length === 1 && router.outside().length >= 1
            ? "TRANSLATE"
            : "ROTATE";
      }
      if (grip.mode === "TRANSLATE") {
        // §4 RULE 6 — the object translates in the screen view plane.
        // ⛔ The gain is a MULTIPLIER on a COMPUTED tracking factor, not a number: at
        // 1.0 the object stays exactly under the finger at every camera distance. The
        // whole derivation, and the 20× spread that forced it, is in input/translate.ts.
        // ⚠ `clientHeight` — CSS pixels, matching pointer coordinates. The render height
        // is device pixels and would be wrong by `devicePixelRatio`.
        const t = screenTranslation(
          s.x - grip.prev.x,
          s.y - grip.prev.y,
          camera.radius,
          camera.fov,
          canvas.clientHeight,
          cfg.gainTranslateScreen,
        );
        // ⭐ The screen axes LATCHED AT PRESS, exactly as the rotation uses — so an
        // orbit that happens mid-drag cannot redefine which way "right" is.
        // ⛔ THE FINGER MOVES THE TARGET, NOT THE MESH. The mesh chases it in the render
        // loop. With `translateInertiaMs` at 0 the two are the same thing.
        const f = followerFor(grip.mesh);
        f.target.addInPlace(new Vector3(...grip.frame.right).scale(t.rightM));
        f.target.addInPlace(new Vector3(...grip.frame.up).scale(t.upM));
      } else if (grip.mode === "ROTATE") {
        // The provisional motion — applied LIVE, and undone by the recognizer itself
        // if the flick test passes at release. See the header: stand-in, not 2bis.
        //
        // ⭐ APPLIED AS A PER-FRAME INCREMENT onto the pose the object already has,
        // about the screen axes latched at press. Every step is a small world-frame
        // rotation, so the two axes never end up nested inside one another.
        const cur = readPose(grip.mesh);
        if (grip.rec.rollCommitted) {
          // 2quinte has taken over: roll about the view axis by what the finger has
          // swept since the last frame. ⚠ Roll REPLACES yaw/pitch for the rest of
          // this gesture, which is what "commits to roll" means.
          // ⭐ The 1€-FILTERED angle. The raw channel drives the COMMIT threshold;
          // this drives what the eye sees. See input/one_euro.ts.
          writePose(
            grip.mesh,
            screenRollRotation(cur, grip.frame, grip.rec.rollAppliedDeg - grip.lastRollDeg),
          );
        } else {
          writePose(
            grip.mesh,
            screenPlaneRotation(
              cur,
              grip.frame,
              s.x - grip.prev.x,
              s.y - grip.prev.y,
              // ⭐ THE REAL GAIN, from the config, in radians per MILLIMETRE.
              // ⛔ A hard-coded `DIAGNOSTIC_RAD_PER_PX` used to live in this file,
              // deliberately kept OUT of the config so a debug value could not leak
              // into production. The owner now wants to tune it by hand, and the
              // config already had the properly-named field for it — so the duplicate
              // is gone rather than a second one added. Carried rule `L1`: a tuning
              // value living in both a debug tool and production silently drifted.
              cfg.gainRotateFree / mmToPx(1),
            ),
          );
        }
      }
      grip.lastRollDeg = grip.rec.rollAppliedDeg;
      grip.prev = s;
      paint();
      return;
    }

    if (info.type === PointerEventTypes.POINTERUP) {
      // ⚠ No `ReleaseContext` yet: selection and the two-touchpoint context are
      // `IN2`/`IN3`. So 6quater cannot win here, and the readout will show 2ter /
      // 2quater only. That is a missing INPUT, not a recognizer that ignores it.
      lastVerdict = describe(grip.rec.release(s));
      router.release(e.pointerId);
      held.delete(e.pointerId);
      paint();
    }
  });

  paint();

  let frames = 0;
  /** ⚠ One clock, `performance.now()`, as everywhere else in this file. */
  let lastFrameMs: number | null = null;
  engine.runRenderLoop(() => {
    const now = performance.now();
    const dtSec = lastFrameMs === null ? 0 : (now - lastFrameMs) / 1000;
    lastFrameMs = now;

    // ⭐ Advance every follower, whether or not a finger is still down — the tail of the
    // deceleration is the part that makes it feel like mass. The step is unconditionally
    // stable, so a stalled frame simply arrives rather than exploding.
    const tauSec = cfg.translateInertiaMs / 1000;
    for (const [mesh, f] of followers) {
      const zeta = cfg.translateDampingRatio;
      const leadSec = cfg.translateLeadMs / 1000;
      // ⭐ The finger's smoothed velocity, then the phantom projected along it. ⛔ The
      // smoother uses the object's OWN time constant: the lead is estimated at the only
      // timescale that can matter to it, and it costs no second slider.
      if (dtSec > 0) {
        f.vTarget.set(
          exponentialSmooth(f.vTarget.x, (f.target.x - f.lastTarget.x) / dtSec, tauSec, dtSec),
          exponentialSmooth(f.vTarget.y, (f.target.y - f.lastTarget.y) / dtSec, tauSec, dtSec),
          exponentialSmooth(f.vTarget.z, (f.target.z - f.lastTarget.z) / dtSec, tauSec, dtSec),
        );
        f.lastTarget.copyFrom(f.target);
      }
      f.x = advanceFollow(f.x, phantomTarget(f.target.x, f.vTarget.x, leadSec), tauSec, zeta, dtSec);
      f.y = advanceFollow(f.y, phantomTarget(f.target.y, f.vTarget.y, leadSec), tauSec, zeta, dtSec);
      f.z = advanceFollow(f.z, phantomTarget(f.target.z, f.vTarget.z, leadSec), tauSec, zeta, dtSec);
      mesh.position.set(f.x.x, f.y.x, f.z.x);
    }

    scene.render();
    frames++;
  });
  window.addEventListener("resize", () => engine.resize());

  return { scene, engine, framesRendered: () => frames };
}
