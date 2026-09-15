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
  holderDrive,
  secondTouchHeld,
  rollDragDeg,
  secondFingerDrive,
  gravityFrame,
  type GravityFrame,
  depthLimits,
  depthTranslate,
  displayPose,
  exponentialSmooth,
  phantomTarget,
  neutralLeadSec,
  impulseForPeak,
  trackingMetresPerPx,
  SwayWatcher,
  swayScale,
  swayWorldDirection,
  SpinSwayWatcher,
  CameraResetAnimation,
  type CameraPose,
  type SwayKick,
  type SpinSwayKick,
  type FollowState,
  Recognizer,
  TapHistory,
  screenPlaneRotation,
  screenRollRotation,
  type PosePort,
  type ReleaseVerdict,
  type Sample,
  MotionTracker,
  type MotionState,
  type ScreenFrame,
} from "../input";
// ⭐ The quaternion arithmetic left this file with the composition it belonged to —
// `input/display_pose.ts`, where it can be vectored. What stays is the plain types.
import type { Quat, Vec3 } from "../core/vec";
import {
  makeWorld,
  setWorldPlacement,
  worldPlacementOf,
  type Face,
  WORLD_DOWN,
  type ObjectId,
  type World,
} from "../core/object_model";
import type { Placed } from "../core/mate_connector";
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

  // ─────────────────────────────────────────────────────────────────────────
  // ⭐⭐ `3D1` — THE OBJECT MODEL IS NOW AUTHORITATIVE, AND THE MESHES ARE A VIEW OF IT.
  //
  // ⛔ Until this point the object's real state was `(follower.target, follower.qHome)`
  // — an implicit pair living inside a display filter. A finger wrote the filter, and
  // the filter WAS the truth. That is exactly backwards: rule 6's inertia is FEEL, and
  // feel must not be where meaning is stored.
  //
  // ⭐ So the chain is now `SWAY ∘ FOLLOW ∘ worldPlacementOf(world, id)` for real, and
  // the render loop re-reads the model every frame. Nothing downstream of `displayPose`
  // can be read back as state, and anything that MEANS something reads the model.
  //
  // ⚠ The parent chain is unexercised here — three loose boxes, no assembly yet — but
  // it is the SAME call, so `3D2` parenting a part changes nothing in this file.
  const idOf = new Map<AbstractMesh, ObjectId>();
  const meshOf = new Map<ObjectId, AbstractMesh>();
  const half = OBJECT_SIZE_M / 2;
  // ⭐ Six faces, outward normals, LOCAL frame — the same convention `MateConnector`
  // uses, so a face and a connector never disagree about which way "out" is.
  // ⚠ Their ids are geometric ("+x"), not indices: a triangle index is an engine detail
  // and `3D1` is explicit that a face is not a triangle.
  const boxFaces: Face[] = [
    { id: "+x", centre: [half, 0, 0], normal: [1, 0, 0] },
    { id: "-x", centre: [-half, 0, 0], normal: [-1, 0, 0] },
    { id: "+y", centre: [0, half, 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -half, 0], normal: [0, -1, 0] },
    { id: "+z", centre: [0, 0, half], normal: [0, 0, 1] },
    { id: "-z", centre: [0, 0, -half], normal: [0, 0, -1] },
  ];
  let world: World = makeWorld(
    scene.meshes
      .filter((m) => m.metadata?.orbitCandidate === true)
      .map((m) => {
        idOf.set(m, m.name);
        meshOf.set(m.name, m);
        return {
          id: m.name,
          local: {
            position: [m.position.x, m.position.y, m.position.z] as Vec3,
            orientation: [1, 0, 0, 0] as Quat,
          },
          parent: null,
          faces: boxFaces,
          connectors: [],
          // §0's Start condition: every object begins with an EMPTY stack.
          constraints: [],
        };
      }),
  );

  /** The object's TRUE placement, through its parent chain. `null` for a non-object. */
  const modelPose = (mesh: AbstractMesh) => {
    const id = idOf.get(mesh);
    return id === undefined ? null : worldPlacementOf(world, id);
  };

  /** Write the model. ⛔ The only way an object's real pose ever changes. */
  const setModelPose = (mesh: AbstractMesh, placed: Placed): void => {
    const id = idOf.get(mesh);
    if (id === undefined) return;
    world = setWorldPlacement(world, id, placed);
  };

  // ⚠ DIAGNOSTIC ONLY: a small marker at whatever §2 rule 1 chose to orbit around.
  // Without it the barycentre selection is invisible, and "it seems to orbit the right
  // thing" is not an observation. `IN3` deletes this along with the three placeholder
  // boxes. ⚠ It does NOT delete the rotation — see below.
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
  /**
   * ⭐⭐ ONE history for EVERY touchpoint, on an object or not.
   * ⛔ It was briefly two, so that a tap on a part and a tap beside it could not fuse.
   * The owner overruled it: *"no discrimination inside or outside any object"* — and the
   * case that settles it is the one that motivated the reset in the first place. When
   * the camera is stuck close in, an object FILLS THE SCREEN: there is nowhere left to
   * tap that is outside one, so a camera reset that only listened outside would be
   * unreachable exactly when it is needed. ⚠ With one history a double-tap that straddles
   * an object's edge still counts, which is what a hand meant by it.
   */
  const taps = new TapHistory(cfg);
  interface Held {
    rec: Recognizer<DiagnosticPose>;
    mesh: AbstractMesh;
    /**
     * ⭐⭐ AMENDMENT A7 — the GRAVITY frame, latched at press. Yaw about the world
     * vertical, pitch about the camera's (always horizontal) right, roll and depth about
     * the view direction flattened onto the ground.
     * ⛔ NOT the camera's own axes: with a tilted camera the view axis has a vertical
     * component, so rolling about it partly duplicates yawing and the two gestures
     * interfere. ⚠ `screenFrame()` still exists for A3's handover, which needs the TRUE
     * view axis — two frames, two purposes.
     */
    frame: GravityFrame;
    /** ⚠ The PREVIOUS sample. The rotation is applied as a per-frame INCREMENT. */
    prev: Sample;
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
    mode: "ROTATE" | "TRANSLATE" | "DEPTH" | null;
    /**
     * ⭐⭐ A10's gate needs the ANCHOR's motion state, and the anchor has no recognizer of
     * its own — only a role. ⛔ One tracker per participating touchpoint, keyed by pointer
     * id, because `MotionTracker` is stateful and hysteretic: sharing one between two
     * fingers would mix their histories and answer about neither.
     * ⚠ Rebuilt when a touchpoint goes down, never reused across a release.
     */
    /**
     * ⛔⛔ KEYED BY THE ROUTER'S `seq` — PRESS ORDER — AND NEVER BY THE POINTER ID.
     *
     * ⚠⚠ Device-reported, 2026-09-16: release the second touchpoint from its object,
     * press it down outside any object, and the first object *"continues translation and
     * then switches to rotation"* instead of rotating at once.
     *
     * ⭐⭐ THE CAUSE: a `MotionTracker` keeps an ANCHOR POSITION, and **browsers reuse
     * pointer ids after a release**. A new finger landing on a reused id inherited the old
     * finger's tracker, measured its displacement from an anchor somewhere else entirely,
     * and read `MOVING` at once — so A13 judged the second finger to be moving and the
     * holder kept translating until the new finger settled.
     *
     * ⭐ `seq` is monotone for the life of the router and never reused. `router.ts` already
     * says why it exists: *"the ONLY ordering anyone gets... `Map` iteration order would
     * LOOK like press order right up until an id is reused."* ⛔ The same trap, one layer
     * up — this project has now hit it twice, so the fix is structural rather than a
     * cleanup somebody has to remember.
     * ⚠ Entries are ALSO dropped on release, so the map cannot grow without bound.
     */
    anchorMotion: Map<number, MotionTracker>;
    /**
     * ⭐⭐⭐ A14 — when a second touchpoint last LIFTED, so a lift-and-replace reads as ONE
     * gesture. ⛔ `null` until one ever has. See `secondTouchHeld`.
     */
    secondLiftedAtMs: number | null;
    /** A6's sympathetic sway, on the same trigger and the same four tunables as the drag. */
    depthSway: SwayWatcher;

    /**
     * ⭐ Whether the finger was ALREADY moving last frame. ⛔ The sway fires on the
     * TRANSITION to moving — *"initiates or resumes"* — not on every frame of a drag,
     * which would be a continuous shove rather than a reaction.
     * ⚠ It reads `Recognizer.motionState`, which is `IN0`'s hysteretic still/moving test
     * with its own measured thresholds. A speed comparison invented here would be a
     * SECOND definition of "moving", free to disagree with the one the rules use.
     */
    /**
     * ⭐ Decides WHEN the scene reacts — see `input/sway.ts`. It owns the direction and
     * speed estimate over a stated window, so this file does not invent a second one.
     */
    sway: SwayWatcher;
    /** The same, for ROTATION — see `input/sway.ts`'s `SpinSwayWatcher`. */
    spinSway: SpinSwayWatcher;
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
    /**
     * ⭐ THE SYMPATHETIC SWAY — an OFFSET from wherever this object otherwise is, sprung
     * back to zero. ⛔ An offset and not a position: the object's real place is never
     * touched, so a barycentre, a raycast or a future mate reads the same coordinates
     * whether or not the scene happens to be swaying at that instant.
     */
    swayX: FollowState;
    swayY: FollowState;
    swayZ: FollowState;
    /**
     * ⭐ THE ROTATIONAL SWAY, as a rotation VECTOR sprung back to zero — three scalar
     * springs on its components. ⛔ A vector and not an angle-about-a-fixed-axis: two
     * kicks on different axes then superpose correctly, which they cannot if the state
     * is one angle and the axis gets overwritten. ⚠ Superposition is exact only for
     * small rotations, which these are by construction.
     */
    swayRotX: FollowState;
    swayRotY: FollowState;
    swayRotZ: FollowState;
    /** What the block swings AROUND: the held object's centre, captured at the kick. */
    swayPivot: Vector3;
    /**
     * The orientation this object would have with no sway at all. ⛔ Kept because the
     * sway is applied ON TOP every frame; reading the mesh back would compound it.
     */
    qHome: Quat;
  }
  const followers = new Map<AbstractMesh, Follow>();

  const followerFor = (mesh: AbstractMesh): Follow => {
    let f = followers.get(mesh);
    if (!f) {
      // ⭐ Seeded from the MODEL where there is one. The mesh is a view, and seeding a
      // filter from its own output is how a system acquires a memory nobody declared.
      const mp = modelPose(mesh);
      const p = mp ? new Vector3(mp.position[0], mp.position[1], mp.position[2]) : mesh.position;
      f = {
        target: p.clone(),
        vTarget: Vector3.Zero(),
        lastTarget: p.clone(),
        x: { x: p.x, v: 0 },
        y: { x: p.y, v: 0 },
        z: { x: p.z, v: 0 },
        swayX: { x: 0, v: 0 },
        swayY: { x: 0, v: 0 },
        swayZ: { x: 0, v: 0 },
        swayRotX: { x: 0, v: 0 },
        swayRotY: { x: 0, v: 0 },
        swayRotZ: { x: 0, v: 0 },
        swayPivot: p.clone(),
        qHome: mp ? mp.orientation : readPose(mesh),
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

  /**
   * An orbit centre chosen but NOT YET COMMITTED — see `orbitCentreGraceMs`.
   * ⛔ Resolved in the RENDER LOOP rather than by a timer: the loop is already running,
   * a frame is the granularity anything visible happens at, and there is no callback to
   * cancel, leak, or fire after the scene is gone.
   */
  let pendingCentre: { x: number; y: number; at: number } | null = null;

  /**
   * The double-tap reset in flight, or `null`.
   * ⛔ CANCELLED BY THE NEXT TOUCH. An animation that kept running while a finger dragged
   * would fight the hand for the camera, and the hand would lose — the reset writes the
   * whole pose every frame.
   */
  let cameraReset: CameraResetAnimation | null = null;

  // ─────────────────────────────────────────────────────────────────
  // §2 RULE 1 — ORBIT, for ONE touchpoint that hits nothing.
  //
  // ⛔⛔ OWNER'S AMENDMENT: driven by DELTA POSITION, not device tilt. The spec has
  // touch as a clutch for a tilt-orbit and says its delta is unused; the owner
  // changed that deliberately. See `Claude/00_CORE/queue_notes/IN9.md`.
  /**
   * ⭐ WHERE THE CAMERA LAUNCHES, and therefore what a double-tap outside any object
   * resets it to. ⛔ Named once and used twice — a reset that drifted from the start
   * state would be the same defect as a debug constant living in two places (`L1`).
   */
  const ORBIT_START_YAW_RAD = -Math.PI / 2;
  const ORBIT_START_ELEVATION = 0.62;
  const ORBIT_START_CENTRE_M: Vec3 = [0, 0, 0];
  const orbit = new OrbitController(cfg, ORBIT_START_YAW_RAD, ORBIT_START_ELEVATION);
  // ⭐ ONE zoom scalar, shared. Pinch scales the whole orbit SURFACE rather than
  // setting a radius directly, so rule 1 and rule 4 compose instead of fighting over
  // the same number. `1` is the rings as configured.
  let zoom = 1;
  let zoomAtPinchStart = 1;
  // ⛔⛔ THE CENTRE MIGRATES, IT DOES NOT TELEPORT. Rule 1 re-chooses a barycentre on
  // every press, so aiming at a different pair of objects used to JUMP the camera.
  // See input/orbit.ts — progress is finger travel in mm, not wall-clock.
  const centreBlend = new OrbitCentreBlend(cfg, ORBIT_START_CENTRE_M);
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
      // ⛔⛔ THE HOME POSITION, WITH THE SWAY TAKEN BACK OFF. The sympathetic sway is a
      // decoration: it must not move what the scene MEANS. Reading `mesh.position`
      // directly would let the barycentre — and so where the camera orbits — depend on
      // whether the objects happened to be mid-wobble when the finger landed.
      // ⚠ `METHOD`: an instrument must not be moved by the thing it is measuring.
      // ⭐⭐ NOW IT READS THE MODEL, so there is no sway to subtract: the decoration
      // never enters the object's real placement in the first place. The subtraction this
      // replaces was correct but defensive — it undid a contamination that can no longer
      // happen. `display_pose.meaningfulPose` is the statement of that rule.
      .map((m) => {
        const mp = modelPose(m);
        return mp ? mp.position : ([m.position.x, m.position.y, m.position.z] as Vec3);
      });
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
  /**
   * §1.3's DOUBLE-TAP outside any object: put the camera back where it launched.
   * ⛔ Everything that defines the view — yaw, elevation, zoom AND the orbit centre.
   * Resetting the angles but leaving the centre where a barycentre had moved it would
   * give a "default" view of somewhere the camera has never been.
   */
  const resetCamera = () => {
    // ⚠ Any centre still waiting out its grace is dropped: it was chosen for a gesture
    // that has turned out to be a reset.
    pendingCentre = null;

    // ⭐⭐ HOME IS THE LAST YELLOW TARGET, NOT THE ORIGIN. The marker shows the barycentre
    // §2 rule 1 last CHOSE, and that is the thing the user has been orbiting — sending
    // the camera back to the world origin instead would reset it to a place it may never
    // have looked at. ⚠ Only the ANGLES and the zoom go back to their launch values.
    const home: CameraPose = {
      yawRad: ORBIT_START_YAW_RAD,
      elevation: ORBIT_START_ELEVATION,
      zoom: 1,
      centreM: centreBlend.targetM,
    };
    const now: CameraPose = {
      yawRad: orbit.yaw,
      elevation: orbit.elevation,
      zoom,
      centreM: centreBlend.centreM,
    };

    if (cfg.cameraResetMs > 0) {
      // ⛔ A blend in flight is ABANDONED to the animation: two things easing the same
      // centre on two different clocks would fight, and the finger-travel one cannot
      // even advance — a double-tap supplies no travel.
      centreBlend.snapTo(now.centreM);
      cameraReset = new CameraResetAnimation(now, home, cfg.cameraResetMs);
      return;
    }

    cameraReset = null;
    applyCameraPose(home);
  };

  /** Put the camera exactly at a pose. Shared by the reset's every frame and its end. */
  const applyCameraPose = (p: CameraPose): void => {
    orbit.reset(p.yawRad, p.elevation);
    zoom = p.zoom;
    zoomAtPinchStart = p.zoom;
    centreBlend.snapTo(p.centreM);
    syncCentre();
    applyCamera();
  };

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

  /**
   * ⭐ §1.3's provisional-motion rollback, on the MODEL. ⛔ Snapshotting the mesh would
   * capture whatever the sway happened to be doing, and restoring it would write a
   * decoration back into the object's real pose — permanently.
   */
  /**
   * ⛔⛔ THERE IS NO FALLBACK TO THE MESH, DELIBERATELY. Every pickable object is in the
   * model by construction, so a miss here is a programming error — and the tempting
   * `?? readPose(mesh)` would answer it by silently writing the object's real pose into
   * a display transform instead, where the next frame overwrites it. The object would
   * stop responding for reasons nothing could explain.
   * ⭐ `METHOD`: *a guard that turns a broken state into silence is worse than a failure*,
   * and `validateGestureConfig` and `testMate` both throw for the same reason.
   */
  const requirePose = (mesh: AbstractMesh): Placed => {
    const mp = modelPose(mesh);
    if (!mp) {
      throw new Error(
        `"${mesh.name}" is being manipulated but is not in the object model. Every ` +
          "pickable object must be registered in the world model — see 3D1.",
      );
    }
    return mp;
  };

  /**
   * ⭐ §1.3's provisional-motion rollback, on the MODEL. ⛔ Snapshotting the mesh would
   * capture whatever the sway happened to be doing, and restoring it would write a
   * decoration back into the object's real pose — permanently.
   */
  const poseOf = (mesh: AbstractMesh): PosePort<DiagnosticPose> => ({
    snapshot: () => requirePose(mesh).orientation,
    restore: (q) => setModelPose(mesh, { position: requirePose(mesh).position, orientation: q }),
  });

  /** The model's orientation for a held object. ⚠ Never the mesh's — that carries sway. */
  const modelOrientation = (mesh: AbstractMesh): Quat => requirePose(mesh).orientation;

  const setModelOrientation = (mesh: AbstractMesh, q: Quat): void => {
    setModelPose(mesh, { position: requirePose(mesh).position, orientation: q });
  };

  const asVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z];

  /**
   * The camera's screen axes in WORLD space. ⚠ Latched at press, not recomputed per
   * frame: rule 1's camera orbit must not silently redefine the axes half-way
   * through a gesture. Same lesson as §1.4's `WORLD_AXIS_ALIGN`.
   */
  /**
   * The gesture basis (A7). ⛔ Throws rather than guessing if the camera ever looks exactly
   * along gravity: there is no horizontal heading to call "depth" there, and every
   * direction across the screen would be equally entitled to the name.
   * ⭐ Unreachable by construction — §2 rule 1's orbit surface clamps the elevation to its
   * rings and never reaches a pole — and `requirePose`'s reasoning applies: a guard that
   * turns a broken state into silence is worse than a failure.
   */
  const requireGestureFrame = (): GravityFrame => {
    const g = gravityFrame(screenFrame().viewAxis, WORLD_DOWN);
    if (!g) {
      throw new Error(
        "the camera is looking exactly along gravity, so there is no gesture frame. " +
          "The orbit surface is supposed to make this unreachable — see A7.",
      );
    }
    return g;
  };

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

  /**
   * How deep the pinched object is, against the bounds A5 derives.
   *
   * ⭐⭐ PRINTED BECAUSE A CLAIM A DEVICE CANNOT CHECK IS AN ASSERTION, NOT A FINDING.
   * The owner looked for the ceiling and could not see it; rather than argue about whether
   * it binds, the number and its limits go on the glass and say so themselves. ⛔ If it
   * never reaches `⛔MAX`, the note warning about a tight ceiling is the thing to correct.
   * ⚠ Empty when nothing is being pinched — a readout that invents a number is worse than
   * a blank one.
   */
  const depthReadout = (): string => {
    for (const grip of held.values()) {
      const push = grip.frame.depth;
      const mp = modelPose(grip.mesh);
      if (!mp) continue;
      const c = asVec3(camera.position);
      const r: Vec3 = [mp.position[0] - c[0], mp.position[1] - c[1], mp.position[2] - c[2]];
      const d = r[0] * push[0] + r[1] * push[1] + r[2] * push[2];
      const { minM, maxM } = depthLimits(cfg);
      const at = d <= minM + 1e-4 ? "  ⛔MIN" : d >= maxM - 1e-4 ? "  ⛔MAX" : "";
      // ⭐⭐ A10'S GATE, ON THE GLASS. The rule is invisible otherwise: a hand that gets
      // no depth cannot tell whether the holder was judged to be moving or whether the
      // anchor was. ⛔ It prints what the gate DECIDED, never a recomputation.
      // ⭐⭐⭐ A12 ON THE GLASS: which of the second finger's two corridors is open.
      // ⛔ The rule is invisible otherwise — a hand that gets no roll cannot tell whether
      // the holder was judged to be moving or whether its own x had not left the band.
      const second = [...grip.anchorMotion.values()][0];
      const corridor = second
        ? `${second.axes.x === "MOVING" ? "X→roll " : ""}${second.axes.y === "MOVING" ? "Y→depth" : ""}` || "—"
        : "no 2nd";
      // ⭐⭐ AND THE MODE ITSELF, with the counts behind it. ⛔ Three device reports on this
      // rule were diagnosed by reasoning about code because the HUD could not answer *"what
      // does the build think is down right now?"* — an instrument is judged against the
      // question it exists to answer.
      const held2 = secondFingerOf(grip);
      const graceLeft =
        grip.secondLiftedAtMs === null
          ? 0
          : Math.max(0, cfg.secondTouchGraceMs - (performance.now() - grip.secondLiftedAtMs));
      const mode =
        `${grip.mode ?? "—"} obj=${router.objects().length} out=${router.outside().length}` +
        `${held2.present ? " 2nd" : graceLeft > 0 ? ` 2nd~${graceLeft.toFixed(0)}ms` : ""}` +
        `${grip.rec.motionState === "STATIONARY" ? ` ready ${corridor}` : ""}`;
      return `  depth=${d.toFixed(2)}m [${minM.toFixed(2)}–${maxM.toFixed(1)}]${at} ${mode}`;
    }
    return "";
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
      // ⚠ A12 RETIRED the circular roll, so this is always false and is kept only because
      // the HUD type carries it. ⭐ A12's roll state is in the depth readout instead.
      rollCommitted: false,
      lastVerdict,
      // ⚠ Shown so a session can never be spent testing a value that was not in
      // force — including a typo'd key, which is REPORTED rather than ignored.
      camera:
        `c=(${orbitCentreM.x.toFixed(2)},${orbitCentreM.y.toFixed(2)},${orbitCentreM.z.toFixed(2)}) ` +
        `${centreBlend.isBlending ? `→${(centreBlend.progress * 100).toFixed(0)}% ` : ""}` +
        `r=${camera.radius.toFixed(3)}m zoom=${zoom.toFixed(2)} ` +
        `elev=${orbit.elevation.toFixed(2)}${orbit.atLimit ? "⛔LIMIT" : ""}` +
        `${pinch.isZooming ? "  ZOOMING" : ""}` +
        depthReadout(),
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
        // ⚠ §2bis's own gain, in radians per MILLIMETRE of finger travel, chosen on the
        // device. `IN3` inherits it — the rotation is real, only its plumbing is not.
        tunable("yaw/pitch gain (rad/mm)", "gainRotateFree", 0.005, 0.15, 0.005),
        // ⭐ 1 is direct manipulation — the cube turns as far as the finger swept.
        tunable("roll gain (x swept)", "gainRoll", 0.1, 3, 0.05),
        // ⭐ The sympathetic swing: the rest of the scene turns as a block about this
        // object's centre when it starts turning or turns the other way.
        tunable("sway of others (deg)", "rotateSwayDeg", 0, 8, 0.1),
        tunable("sway softness (ms)", "rotateSwayTauMs", 40, 600, 20),
        tunable("sway re-trigger turn (deg)", "rotateSwayTurnDeg", 15, 170, 5),
        tunable("sway reference turn (deg/s)", "rotateSwayReferenceDegPerS", 20, 400, 10),
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
        // ⭐ The sympathetic sway: how far the OTHER objects drift when this one sets
        // off, and how lazily they spring back. ⛔ 0 mm disables it exactly.
        // ⭐⭐ AMENDMENT A6 — DEPTH TRANSLATION. 1.0 moves the object as far INTO the
        // scene as rule 6 moves it ACROSS, for the same finger travel: one gain, one
        // computed tracking factor, two directions. ⛔ Not a metres-per-millimetre
        // constant — rule 6 proved that cannot serve both ends of a 20x zoom clamp.
        // ⛔⛔ THE DEFAULT IS 3.0, NOT THE COMPUTED 1.0 — set by a hand on 2026-09-15.
        // Depth is visually foreshortened, so equal WORLD motion is not equal PERCEIVED
        // motion, and the eye is what is being served. ⚠ The range was widened to 0.5–5
        // in the same breath, which is itself a reading: the owner wanted room ABOVE the
        // old ceiling of 3, so 3 may not be the end of the movement either.
        tunable("depth gain (1 = as far as a drag)", "gainTranslateDepth", 0.5, 5, 0.05),
        // ⭐ How parallel the two fingers must be to read as ONE common drag, and over
        // what baseline. ⛔ The tolerance is on the DIFFERENCE of the two travels: it is
        // what separates A6 from rule 6, whose anchor is deliberately still.
        // ⭐⭐ A10 MADE THESE FOUR LOAD-BEARING FOR A MODE, not only for a flick test:
        // the depth gate IS the holder's §1.1 motion state. ⛔ They were re-sized against
        // the measured noise floor when A10 landed, and a hand has not judged the new set.
        // ⭐⭐⭐ ONE RADIUS, and it is now the commit threshold, the rest test AND the
        // jitter deadband at once (A11). ⛔ The most load-bearing number in the input
        // layer, and nobody has judged it by finger yet.
        // ⭐⭐⭐ A12: the second touchpoint's x rolls the object. Nobody has judged this
        // by finger, and every gain a hand has set was raised from my guess.
        tunable("roll drag gain (deg/mm)", "gainRollDrag", 0.25, 12, 0.25),
        tunable("motion DEADBAND (mm)", "motionDeadbandMm", 0.5, 8, 0.1),
        tunable("rest confirm (ms)", "restConfirmMs", 0, 400, 10),
        // ⭐⭐⭐ A14: how long a lift-and-replace of the second touchpoint stays ONE
        // gesture. ⛔ 0 restores the old behaviour exactly, which is how to A/B it.
        tunable("second touch grace (ms)", "secondTouchGraceMs", 0, 600, 25),
        tunable("sway of others (mm)", "translateSwayMm", 0, 8, 0.1),
        tunable("sway softness (ms)", "translateSwayTauMs", 40, 600, 20),
        // ⭐ How far the drag must swing before the scene reacts again, and the drag
        // speed at which the amplitude above is what you get.
        tunable("sway re-trigger turn (deg)", "swayTurnDeg", 15, 150, 5),
        tunable("sway reference speed (mm/s)", "swayReferenceSpeedMmPerS", 30, 400, 10),
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
        // ⭐ How long rule 1 waits to see whether a second finger is landing — i.e.
        // whether this is an orbit or the start of a pinch. 0 commits immediately.
        tunable("centre grace (ms)", "orbitCentreGraceMs", 0, 400, 10),
        // ⭐ How long the double-tap reset takes to fly home. 0 snaps.
        tunable("reset time (ms)", "cameraResetMs", 0, 2000, 50),
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

  /**
   * Kick every OTHER object along the direction the held one has just set off in.
   *
   * ⛔ THE AMPLITUDE IS IN SCREEN MILLIMETRES, converted through the same tracking factor
   * rule 6 uses — so the sway looks the same size at every zoom. A world-metre amplitude
   * would disappear zoomed out and swamp the scene zoomed in.
   * ⚠ The direction comes from the finger's travel since the last sample, mapped through
   * the axes LATCHED AT PRESS — the same frame the translation itself uses, so the scene
   * cannot lean one way while the object goes another.
   */
  /**
   * ⭐ The sympathetic sway, given a WORLD direction the held object set off in.
   *
   * ⛔ Split out of `nudgeOthers` when amendment A5's depth pinch needed the same
   * reaction. The pinch already knows its world direction and has no screen heading to
   * convert, so the conversion moved OUT and the reaction stayed put. ⚠ One
   * implementation: a second copy would let the scene lean one way for a drag and another
   * for a pinch, which is the drift `CONSTRAINTS` §4 exists to stop.
   * ⭐ It reads the SAME four tunables the drag's sway does — amplitude, softness,
   * re-trigger and reference speed — so no new slider appears for a second cause.
   */
  const nudgeOthersWorld = (heldMesh: AbstractMesh, dir: Vec3, speedMmPerS: number): void => {
    const perPx = trackingMetresPerPx(camera.radius, camera.fov, canvas.clientHeight);
    // ⭐ Amplitude × how fast the object set off. Slow, small and slow; fast, bigger AND
    // quicker — it still peaks at the same time constant, so a larger excursion covers
    // that ground faster. See `swayScale`, which clamps the ratio.
    const scale = swayScale(speedMmPerS, cfg.swayReferenceSpeedMmPerS);
    const peakM = mmToPx(cfg.translateSwayMm) * perPx * scale;
    const impulse = impulseForPeak(peakM, cfg.translateSwayTauMs / 1000);
    if (!(impulse > 0)) return;

    for (const mesh of scene.meshes) {
      // ⛔ The SAME tag §2 rule 1 filters barycentre candidates by, so the diagnostic
      // marker cannot sway — a readout that moved with the scene would be describing
      // itself. And the held object is excluded: it is already going that way.
      if (mesh.metadata?.orbitCandidate !== true) continue;
      if (mesh === heldMesh) continue;
      const f = followerFor(mesh);
      f.swayX = { x: f.swayX.x, v: f.swayX.v + dir[0] * impulse };
      f.swayY = { x: f.swayY.x, v: f.swayY.v + dir[1] * impulse };
      f.swayZ = { x: f.swayZ.x, v: f.swayZ.v + dir[2] * impulse };
    }
  };

  /**
   * Rule 6's drag: convert the screen heading to a world one and hand it over.
   * ⚠ Through the axes LATCHED AT PRESS, the same frame the translation itself uses, so
   * the scene cannot lean one way while the object goes another.
   */
  const nudgeOthers = (grip: Held, kick: SwayKick): void => {
    nudgeOthersWorld(
      grip.mesh,
      swayWorldDirection(grip.frame, kick.dirX, kick.dirY),
      kick.speedMmPerS,
    );
  };

  /**
   * Swing every OTHER object as a BLOCK about the held object's centre, on the axis it
   * has just started turning about.
   *
   * ⛔ Every object gets the SAME pivot and the SAME impulse, which is what makes it a
   * block rather than a crowd: each one orbits the held object's centre and spins by the
   * same angle, so their relative geometry is preserved through the whole swing.
   * ⚠ Their own distance from the pivot is what makes it read as rotation — an object
   * far from the pivot travels further, exactly as a rigid body does.
   */
  const spinOthers = (grip: Held, kick: SpinSwayKick): void => {
    const scale = swayScale(kick.degPerS, cfg.rotateSwayReferenceDegPerS);
    const peakRad = (cfg.rotateSwayDeg * Math.PI) / 180 * scale;
    const impulse = impulseForPeak(peakRad, cfg.rotateSwayTauMs / 1000);
    if (!(impulse > 0)) return;

    const pivot = grip.mesh.position;
    for (const mesh of scene.meshes) {
      if (mesh.metadata?.orbitCandidate !== true) continue;
      if (mesh === grip.mesh) continue;
      const f = followerFor(mesh);
      // ⚠ The pivot is captured per kick and shared by the block. A kick arriving while
      // an older one is still decaying moves the pivot; for the sub-degree swings this
      // produces, the difference is second-order and invisible.
      f.swayPivot.copyFrom(pivot);
      f.swayRotX = { x: f.swayRotX.x, v: f.swayRotX.v + kick.axis[0] * impulse };
      f.swayRotY = { x: f.swayRotY.x, v: f.swayRotY.v + kick.axis[1] * impulse };
      f.swayRotZ = { x: f.swayRotZ.x, v: f.swayRotZ.v + kick.axis[2] * impulse };
    }
  };

  /**
   * ⭐⭐ AMENDMENT A6 — DEPTH TRANSLATION BY A COMMON VERTICAL DRAG.
   *
   * One touchpoint on the object, one touchpoint beside it, and **both travelling in y by
   * the same amount** — the object goes deeper into the scene or comes back.
   *
   * ⛔⛔ IT SHARES A CONFIGURATION WITH RULE 6, so the discriminator is the whole design:
   * **common mode is depth, differential mode is rule 6.** The anchor sitting still is what
   * makes a gesture rule 6; both fingers travelling together is what makes it A6.
   *
   * ⭐ A6 replaced A5's pinch because a hand found the hole: two fingers will not fit on a
   * SMALL object, and pushing a part away shrinks it — so the pinch destroyed its own
   * affordance as it succeeded. The anchor can now be anywhere.
   */
  /**
   * Move the held object in depth by ONE touchpoint's share of this frame's travel.
   *
   * ⛔⛔ HALF, AND THAT IS ARITHMETIC RATHER THAN CAUTION. The common travel is the AVERAGE
   * of the two fingers', and each finger delivers its own move event — so applying half of
   * each event's delta sums to exactly the common travel. Applying the whole of each would
   * move the object TWICE as far as the hand asked.
   */
  /**
   * Move the held object in depth by the DRIVER's own travel.
   *
   * ⛔⛔ THE DRIVER IS THE FINGER TOUCHING THE OBJECT, AND IT SUPPLIES ALL THE MOTION. The
   * second finger contributes none — it authorises the depth reading by following. ⚠ Three
   * earlier versions of this blended the two fingers' travel (a mean, a minimum, a faded
   * mean) and a hand felt every one of them: a blend has seams.
   */
  const applyDepthStep = (grip: Held, dyPx: number): void => {
    const mp = requirePose(grip.mesh);
    const { minM, maxM } = depthLimits(cfg);
    setModelPose(grip.mesh, {
      position: depthTranslate(
        asVec3(camera.position),
        mp.position,
        // ⭐ Both latched at press with the rest of the frame. `towardGravity` is what
        // says whether "away" rises or sinks on screen — it is +1 looking down on the
        // scene and −1 looking up at it, and assuming +1 made the gesture backwards on the
        // bottom ring.
        grip.frame.depth,
        Math.sign(grip.frame.towardGravity),
        dyPx,
        // ⭐ RULE 6's COMPUTED FACTOR, redirected: a given finger travel moves the object
        // as far INTO the scene as it would move it ACROSS. One hand's-worth of motion
        // means the same amount of movement whichever way it is going.
        trackingMetresPerPx(camera.radius, camera.fov, canvas.clientHeight),
        cfg.gainTranslateDepth,
        minM,
        maxM,
      ),
      orientation: mp.orientation,
    });
  };

  /**
   * Feed the gate and, if this is a common drag, move the object. ⭐ Called from BOTH
   * touchpoints' move handlers — the anchor has no recognizer, so without its own call its
   * travel would be invisible and the gesture would work only while the object finger moved.
   *
   * @returns true when A6 owns this object right now, so the caller skips its own rule.
   */
  /**
   * ⭐⭐ AMENDMENT A10 — the ANCHOR drives depth, while the finger on the object is STILL.
   *
   * ⛔⛔ THE GATE IS THE HOLDER'S MOTION STATE AND NOTHING ELSE. No window, no ratio, no
   * tolerance: A6 had all three and the owner rejected the result on the glass, because
   * *"are these two travels equal?"* has no answer at a reversal or at a late start, and
   * both happen in every gesture.
   *
   * @param anchor  the touchpoint OUTSIDE every object — the one supplying the motion.
   * @param anchorDyPx its travel THIS FRAME.
   * @returns whether depth consumed the event, so the caller stops.
   */
  /**
   * ⭐⭐ THE SECOND TOUCHPOINT AND ITS LIVE MOTION STATE, for A13's mode choice.
   *
   * ⛔ Presence and state, re-read every frame — never latched. ⚠ `null` state means the
   * finger has gone down and NEVER MOVED, so it has no tracker yet: the strongest form of
   * idle there is, not a missing answer.
   * ⚠ A touchpoint on a DIFFERENT object is deliberately not one of these — that is §4
   * rule 5 / 6bis / 6ter's configuration and must stay reachable.
   */
  const secondFingerOf = (
    grip: Held,
  ): { present: boolean; state: MotionState | null } => {
    for (const q of router.all()) {
      const isSecond =
        q.role === "OUTSIDE" || (q.role === "SECOND" && q.object === grip.mesh);
      if (!isSecond) continue;
      return { present: true, state: grip.anchorMotion.get(q.seq)?.current ?? null };
    }
    return { present: false, state: null };
  };

  /**
   * ⛔ Forget a released touchpoint's motion tracker, everywhere.
   *
   * ⚠ Keyed by `seq`, so a reused pointer id can no longer inherit it — this is belt to
   * that structural brace, and it is what stops the map growing for the life of a gesture.
   */
  const forgetAnchor = (seq: number, at: number): void => {
    for (const grip of held.values()) {
      grip.anchorMotion.delete(seq);
      // ⭐⭐⭐ A14 — AND REMEMBER THAT A TOUCHPOINT JUST LIFTED. From every OTHER grip's
      // point of view this was its second touchpoint, whatever role it held: outside every
      // object, on the same object, or on a different one (which is the owner's case 3).
      // ⛔ A lift-and-replace is ONE gesture, and without this the interval between them
      // has a single touchpoint down and `A13` translates through the middle of it.
      // ⚠ Setting it on the releasing grip itself is harmless: it is deleted immediately.
      grip.secondLiftedAtMs = at;
    }
  };

  const applyDepthDrag = (grip: Held, anchorSeq: number, anchorSample: Sample) => {
    // ⭐ The anchor gets a tracker of its own — the SAME §1.1 machine every other rule
    // reads, never a speed invented here. A second definition of "moving" would be free
    // to disagree with the one the holder is judged by.
    // ⛔ Keyed by PRESS ORDER, never by pointer id. See `Held.anchorMotion`.
    let tracker = grip.anchorMotion.get(anchorSeq);
    if (!tracker) {
      tracker = new MotionTracker(cfg);
      grip.anchorMotion.set(anchorSeq, tracker);
    }
    // ⭐⭐ ASK THE CLOCK RIGHT HERE TOO, not only in the render loop. This is the one
    // moment the holder's stillness actually decides something, and an anchor event can
    // arrive between frames — or after a dropped one. ⛔ Belt and braces on the exact
    // defect that made this gesture *"sometimes blocked"*.
    grip.rec.tick(anchorSample.t);
    tracker.push(anchorSample);

    // ⭐⭐⭐ AMENDMENT A12 — the second finger's TWO AXES drive TWO RULES: x is ROLL, y is
    // DEPTH, and A11's per-axis bands keep them independent. ⛔ The travel is the
    // DEADBANDED travel, exactly as rule 6 and 2bis take the holder's.
    const drive = secondFingerDrive(grip.rec.motionState, tracker.axes, tracker.step);
    if (drive.rollDxPx === 0 && drive.depthDyPx === 0) return false;

    if (drive.depthDyPx !== 0) {
      applyDepthStep(grip, drive.depthDyPx);
      grip.mode = "DEPTH";
    }
    if (drive.rollDxPx !== 0) {
      // ⭐⭐ ROLL AS AN INCREMENT, about the gravity frame's horizontal depth axis (A7).
      // ⚠ No baseline, no commit threshold, no circle fit, no rebase — the jump those
      // produced is gone with them. A12 replaced the gesture rather than the arithmetic.
      setModelOrientation(
        grip.mesh,
        screenRollRotation(
          modelOrientation(grip.mesh),
          grip.frame,
          rollDragDeg(drive.rollDxPx, cfg.gainRollDrag),
        ),
      );
      grip.mode = "ROTATE";
      // ⭐ The rotational sway answers a driven roll too — same watcher, same tunables.
      const home = modelOrientation(grip.mesh);
      followerFor(grip.mesh).qHome = home;
      const spin = grip.spinSway.push(home, anchorSample.t, true);
      if (spin && cfg.rotateSwayDeg > 0) spinOthers(grip, spin);
    }
    // ⛔⛔ AND THE HOLDER'S GESTURE IS NO LONGER A TAP. It is being held STILL on the
    // object, which is a tap's exact shape — and a DOUBLE_TAP resolves to 2septies
    // eviction. See `Recognizer.consumeAsMotion`.
    grip.rec.consumeAsMotion();

    // ⭐ THE SCENE REACTS TO A PUSH TOO — the same sway, the same four tunables.
    // ⚠ SIGN: fingers moving UP (negative screen y) push the object AWAY, which is +push.
    const kick = grip.depthSway.push({ x: 0, y: anchorSample.y, t: anchorSample.t }, true, true);
    if (kick) {
      const push = grip.frame.depth;
      {
        const away = kick.dirY < 0 ? 1 : -1;
        nudgeOthersWorld(grip.mesh, [push[0] * away, push[1] * away, push[2] * away], kick.speedMmPerS);
      }
    }
    return true;
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
      // ⛔ A NEW TOUCH CANCELS A RESET IN FLIGHT. The animation writes the whole camera
      // pose every frame, so a drag during one would be overwritten as fast as it was
      // applied — the hand would appear to have no effect at all.
      cameraReset = null;
      const pick = info.pickInfo;
      const hit = pick?.hit && pick.pickedMesh ? pick.pickedMesh : null;
      // ⭐⭐ THE ONE PLACE A ROLE IS DECIDED, and it is decided by `IN2`, once.
      const routed = router.press(e.pointerId, s, hit);

      if (routed.role === "IGNORED") {
        // ⛔ A THIRD touchpoint on an object already held AND already pinched (A5 allows
        // exactly one partner). It starts no recognizer, takes no anchor and moves
        // nothing. ⚠ It is still COUNTED on the readout, so "why is nothing happening"
        // has a visible answer.
        paint();
        return;
      }

      if (routed.role === "SECOND") {
        // ⭐ A second finger on an object another touchpoint already holds. It runs NO
        // recognizer — it never begins a §1.3 gesture of its own — it is one of A6's two
        // travelling fingers. ⛔ Creating a `Held` here would give one mesh two recognizers.
        // ⚠ A6's anchor may equally be a finger OUTSIDE every object; this branch is the
        // case where the hand happened to put it back on the part.
        paint();
        return;
      }

      if (routed.role === "OUTSIDE") {
        // ⭐ Rule 1 chooses what to orbit AROUND at press, from the ray of the finger
        // that started it — so the centre cannot wander mid-drag as the ray moves.
        // ⛔⛔ AND ONLY IF NOTHING IS BEING HELD. A touchpoint outside an object while a
        // finger is already ON one is rule 6's ANCHOR, not an orbit — §2 rule 1 requires
        // ONE touchpoint and no hit. Choosing a barycentre for it would move the marker
        // and retarget the camera for a gesture that will never orbit at all.
        if (router.outside().length === 1 && router.objects().length === 0) {
          // ⭐⭐ DEFERRED, NOT IMMEDIATE. A second touchpoint outside any object turns
          // this into a PINCH (rule 4), and the two never land in the same instant — so
          // committing a new orbit centre on the first one moves the marker and
          // retargets the camera for a gesture the user meant as a zoom.
          // ⚠ The PRESS coordinates are kept, not re-read later: rule 1 chooses what to
          // orbit around from the ray of the finger that STARTED it, and a finger that
          // has drifted 120 ms' worth would choose a different barycentre.
          pendingCentre =
            cfg.orbitCentreGraceMs > 0 ? { x: e.clientX, y: e.clientY, at: s.t } : null;
          if (!pendingCentre) recomputeOrbitCentre(e);
        } else {
          // ⛔ A SECOND ONE ARRIVED: this is a pinch. Drop the pending retarget entirely
          // — the camera keeps orbiting whatever it was already orbiting.
          pendingCentre = null;
        }
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
        frame: requireGestureFrame(),
        prev: s,
        mode: null,
        sway: new SwayWatcher(cfg.swayTurnDeg, cfg.pointerNoiseMm),
        anchorMotion: new Map(),
        secondLiftedAtMs: null,
        depthSway: new SwayWatcher(cfg.swayTurnDeg, cfg.pointerNoiseMm),
        // ⛔ THE FLOOR IS DERIVED FROM THE MEASURED NOISE, not chosen: pointer jitter
        // reaches the pose multiplied by the rotation gain, so 0.761 mm becomes ~3.05°
        // of orientation noise per sample. Measured over 10 s of a still finger that is
        // still reported MOVING: ×1 → 377 false kicks, ×1.5 → 135, ×2 → 14, **×3 → 0**.
        // ⚠ The cost is the slowest turn that can still register — 92°/s at ×3, which is
        // a quarter turn a second, an ordinary rotation.
        spinSway: new SpinSwayWatcher(
          cfg.rotateSwayTurnDeg,
          3 * cfg.gainRotateFree * cfg.pointerNoiseMm * (180 / Math.PI),
        ),
      });
      paint();
      return;
    }

    // ⛔ Everything past here is a MOVE or an UP for a touchpoint already latched. The
    // role decides which rule sees it — never a second look at what is under the finger.
    const routed = router.get(e.pointerId);
    if (!routed) return;

    if (routed.role === "SECOND") {
      if (info.type === PointerEventTypes.POINTERUP) {
        forgetAnchor(routed.seq, s.t);
        router.release(e.pointerId);
        lastVerdict = "second touchpoint released";
      } else {
        router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
        // ⭐⭐⭐ A12: A SECOND FINGER ON THE SAME OBJECT DRIVES IT, exactly as one outside
        // does — the owner: *"second touchpoint INSIDE OR OUTSIDE any object"*. Its x is
        // roll and its y is depth, while the finger on the object is held still.
        // ⚠ A touchpoint on a DIFFERENT object is deliberately excluded: that is §4 rule 5
        // / 6bis / 6ter's configuration and must stay reachable.
        const holder2 = router.objects().find((q) => q.object === routed.object);
        const grip2 = holder2 ? held.get(holder2.id) : undefined;
        if (grip2) applyDepthDrag(grip2, routed.seq, s);
      }
      paint();
      return;
    }

    if (routed.role === "IGNORED") {
      // ⛔⛔ AN IGNORED TOUCHPOINT RUNS NOTHING, INCLUDING ON RELEASE — no release
      // verdict, no flick test, no tap history. ⚠ The OPPOSITE of the pinch three
      // branches below, where lifting one of two fingers ends the gesture. A stray TAP
      // from here would evict a constraint (§1.4) that the user never asked to lose.
      if (info.type === PointerEventTypes.POINTERUP) {
        forgetAnchor(routed.seq, s.t);
        router.release(e.pointerId);
      } else router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
      paint();
      return;
    }

    if (routed.role === "OUTSIDE") {
      if (info.type === PointerEventTypes.POINTERMOVE) {
        const prev = routed.last;
        // ⚠ The live hit is handed over and DISCARDED by the router: this finger may
        // now be over a part, and it is still an anchor. See router.ts's `hitNow`.
        router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
        // ⭐⭐ A10: THIS IS THE FINGER THAT DRIVES DEPTH, and this branch is the only
        // place depth is applied. ⛔ The gate opens only while the finger ON the object is
        // STILL — so an anchor moving during an ordinary rule 6 drag does nothing at all,
        // and the two rules partition the configuration instead of competing for it.
        const holder = router.objects()[0];
        const grip = holder ? held.get(holder.id) : undefined;
        if (grip && applyDepthDrag(grip, routed.seq, s)) {
          paint();
          return;
        }
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
        // ⭐⭐ DOUBLE-TAP OUTSIDE ANY OBJECT RESETS THE CAMERA. ⛔ Judged BEFORE the
        // release, while the router still knows where this touchpoint pressed: §1.3
        // measures a tap by its own press, not by whatever the last event happened to be.
        // ⚠ The SAME two thresholds §1.3 uses for an object — a tap is a tap whatever it
        // lands on, and a second definition here could disagree with the first.
        const wasTap =
          s.t - routed.pressed.t <= cfg.tapMaxDuration &&
          Math.hypot(s.x - routed.pressed.x, s.y - routed.pressed.y) <=
            mmToPx(cfg.doubleTapSlop);
        forgetAnchor(routed.seq, s.t);
        router.release(e.pointerId);
        // ⛔ A pinch needs BOTH touchpoints. Lifting one ends it rather than letting
        // the survivor keep scaling against a partner that is gone.
        pinch.end();
        if (wasTap && taps.record(routed.pressed, s.t) === "DOUBLE_TAP") {
          resetCamera();
          lastVerdict = "DOUBLE_TAP → camera reset";
        }
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
        // ⭐⭐⭐ A13 SWAPPED THE ASSIGNMENT: **one touchpoint TRANSLATES, and a second
        // one held STILL turns the same drag into a ROTATION.** The second finger
        // contributes no motion — holding it still is the whole of the input.
        // ⛔ Presence AND state, re-read every frame, never latched. ⚠ Both fingers moving
        // resolves to TRANSLATE: the holder wins every tie, which is the one cell the
        // owner's four rules did not name.
        // ⚠⚠ `IN4` records a device verdict that LOOKS like this and is not — a
        // STATIONARY latch taken at press, overturned by a hand first try. This reads it
        // live, off a position deadband rather than a speed test, but a device pass should
        // look for mode flicker directly.
        // ⛔⛔⛔ PRESENCE ALONE, AND THE DEVICE SAID SO TWICE. I first keyed this on the
        // second finger's MOTION STATE, and a hand overturned it: *"if I transition quickly
        // there is a translation then a rotation, if I transition slowly there is directly
        // a rotation."* ⭐ A finger PLACED QUICKLY skids as it lands — the centroid slides
        // while the contact area grows — so it read MOVING for as long as the landing took,
        // and the mode followed it. Nothing about the GESTURE differed; only the landing.
        // ⛔⛔ `IN4` recorded the same verdict on 2026-09-14. See `holderDrive`.
        // ⭐⭐⭐ A14: A LIFT-AND-REPLACE IS ONE GESTURE. Between the lift and the press
        // there is genuinely one touchpoint down, so without the grace A13 translates
        // through the middle of a swap — and a swap is 150-300 ms of hand, which is very
        // visible if the holder happens to be moving at the time. ⚠ That is exactly why the
        // owner's cases 2 and 3 *"differ by timing of the input"*.
        const second = secondFingerOf(grip);
        const secondHolds = secondTouchHeld(
          second.present,
          grip.secondLiftedAtMs === null ? null : s.t - grip.secondLiftedAtMs,
          cfg.secondTouchGraceMs,
        );
        grip.mode =
          router.objects().length === 1 ? holderDrive(secondHolds) : "TRANSLATE";
      }
      // ⭐⭐ THE SYMPATHETIC SWAY. Three triggers, all of them a CHANGE OF INTENT: the
      // finger starts or resumes moving, the gesture becomes a translation mid-rotation,
      // or the drag turns by more than `swayTurnDeg`. ⛔ Never per frame — that would be
      // a continuous shove, and the scene would drift rather than react.
      const kick = grip.sway.push(
        s,
        grip.rec.motionState === "MOVING",
        grip.mode === "TRANSLATE",
      );
      if (kick && cfg.translateSwayMm > 0) nudgeOthers(grip, kick);

      // ⛔⛔ A10: THE HOLDER MOVING IS RULE 6, ALWAYS. There is nothing to test here and
      // nothing to wait for — this event is proof the holder is not still, which is the
      // only question A10 asks. ⭐ A6 used to attempt a depth classification on this very
      // line and withhold the vertical until it had one; that hesitation at each end of
      // every drag is exactly what the owner rejected.

      if (grip.mode === "TRANSLATE") {
        // §4 RULE 6 — the object translates in the screen view plane.
        // ⛔ The gain is a MULTIPLIER on a COMPUTED tracking factor, not a number: at
        // 1.0 the object stays exactly under the finger at every camera distance. The
        // whole derivation, and the 20× spread that forced it, is in input/translate.ts.
        // ⚠ `clientHeight` — CSS pixels, matching pointer coordinates. The render height
        // is device pixels and would be wrong by `devicePixelRatio`.
        // ⭐⭐ A10 GAVE THE VERTICAL BACK, WHOLE. A6 had to WITHHOLD it while its
        // detector said PENDING — the two rules shared a configuration and took a window
        // to tell apart — and the cost was that the first window of every drag's vertical
        // travel was DISCARDED. ⛔ There is no undecided state any more: this event exists
        // because the holder moved, and a moving holder is rule 6 by definition.
        // ⭐⭐ THE DEADBANDED TRAVEL (A11), never the raw delta. The dead radius is
        // applied once in §1.1 and every rule reads the same side of it — so a still
        // finger moves nothing, and a drag leaves rest continuously rather than stepping
        // by the radius. ⛔ This is also amendment A9, met at the source.
        const t = screenTranslation(
          grip.rec.step.dx,
          grip.rec.step.dy,
          camera.radius,
          camera.fov,
          canvas.clientHeight,
          cfg.gainTranslateScreen,
        );
        // ⭐ The screen axes LATCHED AT PRESS, exactly as the rotation uses — so an
        // orbit that happens mid-drag cannot redefine which way "right" is.
        // ⛔ THE FINGER MOVES THE TARGET, NOT THE MESH. The mesh chases it in the render
        // loop. With `translateInertiaMs` at 0 the two are the same thing.
        // ⛔ THE FINGER MOVES THE MODEL. The follower's target is re-read from it every
        // frame, so the inertia stays exactly what it was — a filter on the way to the
        // screen, and no longer the place the object's position is kept.
        const mp = requirePose(grip.mesh);
        const r = grip.frame.right;
        const u = grip.frame.up;
        setModelPose(grip.mesh, {
          position: [
            mp.position[0] + r[0] * t.rightM + u[0] * t.upM,
            mp.position[1] + r[1] * t.rightM + u[1] * t.upM,
            mp.position[2] + r[2] * t.rightM + u[2] * t.upM,
          ],
          orientation: mp.orientation,
        });
      } else if (grip.mode === "ROTATE") {
        // The provisional motion — applied LIVE, and undone by the recognizer itself
        // if the flick test passes at release.
        //
        // ⚠⚠ THIS IS RULE 2bis MINUS ITS PRECONDITION, not a placeholder for it. The
        // gesture, the world-frame axes latched at press and the gain are all real and
        // vectored. What is missing is the clause *"with an empty constraint stack"*:
        // §1.4's stack does not exist yet (no object model), so the rule cannot ask and
        // proceeds as though it always were empty. ⛔ The day constraints exist, an
        // anchored object would rotate freely and silently break its own anchor unless
        // `IN3` adds that test. It also drives a MESH rather than a modelled placement.
        //
        // ⭐ APPLIED AS A PER-FRAME INCREMENT onto the pose the object already has,
        // about the screen axes latched at press. Every step is a small world-frame
        // rotation, so the two axes never end up nested inside one another.
        const cur = modelOrientation(grip.mesh);
        // ⭐⭐⭐ A12: ONE TOUCHPOINT IS ALWAYS YAW/PITCH. There is nothing left to decide
        // here. Roll moved to the SECOND touchpoint's x, so the two gestures are no longer
        // the same hand shape — and everything that existed to tell them apart is gone:
        // 2quinte's circle fit, the `rollAngle` commit threshold, the provisional
        // yaw/pitch, A8's rebase to the circle's start, and the jump all of it produced.
        // ⚠ `roll.ts` still exists with its 40 vectors and is no longer on the gesture
        // path — the same status as `shake.ts` and `anchor_rotate.ts`.
        setModelOrientation(
          grip.mesh,
          screenPlaneRotation(
            cur,
            grip.frame,
            // ⭐⭐ Deadbanded (A11) — the raw delta is what made a held object turn
            // while the hand was still.
            grip.rec.step.dx,
            grip.rec.step.dy,
            // ⭐ THE REAL GAIN, from the config, in radians per MILLIMETRE.
            // ⛔ A hard-coded `DIAGNOSTIC_RAD_PER_PX` used to live in this file,
            // deliberately kept OUT of the config so a debug value could not leak
            // into production. Carried rule `L1`: a tuning value living in both a debug
            // tool and production silently drifted.
            cfg.gainRotateFree / mmToPx(1),
          ),
        );
      }
      // ⭐⭐ THE ROTATIONAL SWAY. Same shape as the translational one: it fires when the
      // object STARTS turning and whenever the turn AXIS swings by more than
      // `rotateSwayTurnDeg` — a reversal being a 180° axis change.
      if (grip.mode === "ROTATE") {
        const home = modelOrientation(grip.mesh);
        // ⛔ The held object's own pose is the truth here, so its follower's `qHome` has
        // to track it — otherwise the render loop would fight the rotation rule.
        followerFor(grip.mesh).qHome = home;
        const spin = grip.spinSway.push(home, s.t, true);
        if (spin && cfg.rotateSwayDeg > 0) spinOthers(grip, spin);
      } else {
        grip.spinSway.push(modelOrientation(grip.mesh), s.t, false);
      }

      grip.prev = s;
      paint();
      return;
    }

    if (info.type === PointerEventTypes.POINTERUP) {
      // ⚠ No `ReleaseContext` yet: selection and the two-touchpoint context are
      // `IN2`/`IN3`. So 6quater cannot win here, and the readout will show 2ter /
      // 2quater only. That is a missing INPUT, not a recognizer that ignores it.
      const verdict = grip.rec.release(s);
      lastVerdict = describe(verdict);
      // ⭐⭐ A DOUBLE-TAP ON AN OBJECT RESETS THE CAMERA TOO. ⛔ The reason is reachability:
      // orbit can get stuck close in with an object filling the view, and then every tap
      // lands ON something — a reset that only listened to empty space would be
      // unreachable precisely when it is wanted.
      // ⚠⚠ THIS COLLIDES WITH §1.4, and the collision is real rather than hypothetical:
      // the spec makes a double-tap the ONLY way a constraint is ever evicted, and that
      // is `IN3`'s job. When `IN3` lands, one of the two has to give — either the same
      // double-tap does both, or the reset moves to a gesture of its own. Recorded here
      // and in `queue_notes/IN3.md` so it is decided rather than discovered.
      if (verdict.kind === "DOUBLE_TAP") {
        resetCamera();
        lastVerdict = "DOUBLE_TAP → camera reset";
      }
      forgetAnchor(routed.seq, s.t);
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

    // ⛔⛔⛔ ADVANCE THE MOTION CLOCK FOR EVERY LIVE TOUCHPOINT, EVERY FRAME.
    //
    // A still finger emits NO `pointermove`, and `MotionTracker` is otherwise driven only
    // by those events — so without this line a finger held deliberately still stays
    // `MOVING` for ever, and A10's depth gate never opens. ⚠ Reported from the device three
    // times before it was found: *"passing from x/y translation to depth translation
    // (sometimes, it is blocked) while passing from depth translation to x/y translation is
    // smooth and instantaneous."*
    //
    // ⭐ The asymmetry was structural: `MOVING` is entered by an event that necessarily
    // exists, `STATIONARY` by one that by definition may not arrive. ⭐⭐ Elapsed time with
    // no sample is the strongest evidence of stillness there is — it simply has to be asked
    // for, and the render loop is the clock everything visible already runs on.
    for (const grip of held.values()) {
      grip.rec.tick(now);
      for (const tracker of grip.anchorMotion.values()) tracker.tick(now);
    }

    // ⭐ Advance every follower, whether or not a finger is still down — the tail of the
    // deceleration is the part that makes it feel like mass. The step is unconditionally
    // stable, so a stalled frame simply arrives rather than exploding.
    // ⭐ The double-tap reset, flying home. ⛔ Advanced here and not on a timer: the loop
    // is the clock everything visible already runs on, and there is no callback to leak.
    if (cameraReset !== null) {
      applyCameraPose(cameraReset.advance(dtSec * 1000));
      if (cameraReset.done) cameraReset = null;
    }

    // ⭐ The deferred orbit centre, committed once its grace has passed with no second
    // touchpoint outside. ⚠ `router.outside().length` is re-checked here and not only at
    // press: a finger could have arrived and left again within the window.
    if (pendingCentre !== null && now - pendingCentre.at >= cfg.orbitCentreGraceMs) {
      const p = pendingCentre;
      pendingCentre = null;
      // ⚠ BOTH conditions re-checked at commit time, not only at press: within the grace
      // a second finger could have arrived and left, or a finger could have landed on an
      // object and turned the whole gesture into a translation.
      if (router.outside().length === 1 && router.objects().length === 0) {
        recomputeOrbitCentre({ clientX: p.x, clientY: p.y });
      }
    }

    const tauSec = cfg.translateInertiaMs / 1000;
    // ⛔⛔ ITERATE THE **MODEL**, NOT THE FOLLOWER MAP — and this line is a defect fix, not
    // a tidy-up. The loop used to walk `followers`, a map populated lazily by whoever
    // happened to need one: the sway (for the OTHER objects) and the rotation rule (for the
    // held one). While the follower WAS the object's state that was self-consistent — a
    // thing with no follower had no state to draw.
    //
    // ⚠ The moment the MODEL became authoritative it stopped being true, and it broke
    // translation, found by finger 2026-09-15: drag an object at page load and nothing
    // moves, because the model updates and nothing draws it. Then drag a SECOND object and
    // the first JUMPS — the sway finally creates its follower, the sync pulls everything
    // that had accumulated, and it snaps there in one frame.
    //
    // ⭐ Rotation hid it: the rotation rule creates the follower as a side effect of
    // storing `qHome`, so only translation was affected — which is why a device pass that
    // exercised rotation first saw nothing wrong.
    //
    // ⭐⭐ The lesson is the shape, not the line: **an implicit invariant died when the
    // authority moved.** "Everything that needs drawing has a follower" was true by
    // construction and became false silently, because nothing stated it.
    for (const mesh of meshOf.values()) {
      const f = followerFor(mesh);
      // ⭐⭐ THE MODEL IS RE-READ EVERY FRAME — this is what makes it authoritative rather
      // than merely present. Whatever the rules wrote this frame is what the follower now
      // chases and what the sway is applied on top of.
      const mp = modelPose(mesh);
      if (mp) {
        f.target.set(mp.position[0], mp.position[1], mp.position[2]);
        f.qHome = mp.orientation;
      }
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
      // ⭐ The sway springs home on its own clock — slower and softer than the object's
      // own inertia, and CRITICALLY damped so it returns without wobbling about.
      const swayTau = cfg.translateSwayTauMs / 1000;
      f.swayX = advanceFollow(f.swayX, 0, swayTau, 1, dtSec);
      f.swayY = advanceFollow(f.swayY, 0, swayTau, 1, dtSec);
      f.swayZ = advanceFollow(f.swayZ, 0, swayTau, 1, dtSec);
      f.swayRotX = advanceFollow(f.swayRotX, 0, swayTau, 1, dtSec);
      f.swayRotY = advanceFollow(f.swayRotY, 0, swayTau, 1, dtSec);
      f.swayRotZ = advanceFollow(f.swayRotZ, 0, swayTau, 1, dtSec);

      // ⭐ The block's swing, as a rotation about the pivot. ⛔ RIGID: the object both
      // ⭐⭐ THE WHOLE CHAIN, IN ONE EXPRESSION, AND IT LIVES OUTSIDE THIS FILE.
      // `displayPose` is `SWAY ∘ FOLLOW ∘ model` — engine-free, pure, and vectored in
      // `tests/display_pose.test.ts`, including the RIGIDITY property this loop used to
      // claim in a comment and test nowhere: the block both ORBITS the pivot and SPINS by
      // the same angle, because orbiting alone shears the group and spinning alone leaves
      // it turning on the spot. ⛔ `QUEUE.md` names *a composition nobody computed* as the
      // mistake this project keeps making; three writers meeting in a render loop is
      // exactly that shape, so the composition was moved somewhere it could be checked.
      const pose = displayPose([f.x.x, f.y.x, f.z.x], f.qHome, {
        translation: [f.swayX.x, f.swayY.x, f.swayZ.x],
        rotationVector: [f.swayRotX.x, f.swayRotY.x, f.swayRotZ.x],
        pivot: [f.swayPivot.x, f.swayPivot.y, f.swayPivot.z],
      });

      // ⭐ ONE WRITER. The held-mesh exception is gone with the model: the rotation rule
      // used to write the mesh directly, so this loop had to skip a held object or it
      // would overwrite it. Now every rule writes the MODEL and this is the only place a
      // mesh transform is set at all — which is what a "view" means, and one special case
      // fewer to be wrong about.
      writePose(mesh, pose.orientation);
      mesh.position.set(pose.position[0], pose.position[1], pose.position[2]);
    }

    scene.render();
    frames++;
  });
  window.addEventListener("resize", () => engine.resize());

  return { scene, engine, framesRendered: () => frames };
}
