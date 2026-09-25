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
import {
  CreateLines,
  CreateLineSystem,
} from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
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
  pairBarycentre,
  PointerNoiseMeter,
  PointerRouter,
  advanceFollow,
  rollDragDeg,
  secondFingerDrive,
  gravityFrame,
  type GravityFrame,
  depthLimits,
  initialBehaviour,
  isTapRelease,
  tapReleaseToggles,
  pairPressRevertsToggle,
  toggleBehaviour,
  type Behaviour,
  faceAlignConstraint,
  type AlignMode,
  retargetAlignment,
  tapMeaning,
  pressMeaning,
  outsideTapReleases,
  flickResetPlan,
  type TapContext,
  ShakeDetector,
  shakeParamsFrom,
  flatTwistAngle,
  rollSignFor,
  rotateAboutAxis,
  displayPose,
  exponentialSmooth,
  phantomTarget,
  neutralLeadSec,
  impulseForPeak,
  trackingMetresPerPx,
  SwayWatcher,
  swayScale,
  receivesSway,
  swayWorldDirection,
  SpinSwayWatcher,
  CameraResetAnimation,
  easeInOut,
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
  type ScreenFrame,
} from "../input";
// ⭐ The quaternion arithmetic left this file with the composition it belonged to —
// `input/display_pose.ts`, where it can be vectored. What stays is the plain types.
import type { Quat, Vec3 } from "../core/vec";
import {
  makeWorld,
  setWorldPlacement,
  worldPlacementOf,
  WORLD_DOWN,
  type ObjectId,
  type World,
} from "../core/object_model";
import type { Placed } from "../core/mate_connector";
import { CAMERA_NEAR_PLANE_M } from "../input/gestureConfig";
import { mmToPx } from "../core/units";
import {
  RotationFollower,
  RotationTally,
  incrementRadians,
} from "../input/rotation_increment";
import { taperTop } from "../core/frustum";
import {
  OBJECT_DIMS_M,
  OBJECT_SIZE_M,
  OBJECT_TOP_SCALE,
  PLATE_DIMS_M,
  PYRAMID_DIMS_M,
  bootTilt,
} from "../core/scene_dims";
import { alignedFaceOf, faceFromPickedNormal } from "../core/face_pick";
import { mateCandidateFaces, type FaceRef } from "../core/face_candidates";

import {
  hasAlignment,
  rotationChannel,
  singleAlignment,
  solve,
} from "../core/constraint_stack";
import {
  clearObjectConstraints,
  evictObjectConstraints,
  faceWorld,
  pushObjectConstraint,
} from "../core/object_model";
import { IDENTITY, dot, qmul } from "../core/vec";
import { seededRotations } from "../core/random_pose";
import { AlignmentLinks } from "../core/alignment_links";
import { AlignSnaps } from "../input/align_snap";
import {
  followerLinksFrom,
  followerMoveLinksFrom,
  resolvePioneerMoves,
  resolvePioneerTurns,
} from "../input/pioneer_cascade";
// ⭐⭐ `A16`. ⛔ Both are ENGINE-FREE and answer questions; nothing in them moves or draws.
import { surfaceGap } from "../core/proximity";
import { shapeFromVertices, type ConvexShape } from "../core/collision_shape";
import {
  meshTopology,
  offsetPositions,
  type MeshTopology,
} from "../core/mesh_topology";
import {
  captureOffsetM,
  highlightedPair,
  translatesOnDrag,
  type HighlightVerdict,
} from "../input/highlight";
import {
  pinnedPair,
  pinnedSecondDrive,
  secondTouchDrive,
} from "../input/pinned_pioneer";
import { pressHit } from "../input/frozen_pick";
// ⭐⭐⭐ **THE OBJECT AXES AND THE PROJECTION ONTO THEM** (the owner, 2026-09-22). ⛔ Every
// DECISION is in `src/input`; this file holds the state and the call. That is the 2026-09-19
// lesson, and it cost seven surviving mutants to learn: *a rule written in `scene.ts` is a rule
// nothing can interrogate*.
import {
  axesFromFrame,
  updatedObjectAxes,
  rotationFrame,
  zoneEdge,
  type ObjectAxes,
} from "../input/object_axes";
import { JumpWatch, type Jump } from "../input/jump_watch";
import {
  axisDisplacement,
  axisTravel,
  clampDepthRange,
  displayedAxes,
  soleGizmoBody,
  type GizmoChannels,
  type AxisTravel,
} from "../input/axis_translate";
import { isTranslatingMode } from "../input/grip_mode";
import {
  pitchOffsetV,
  freezeProgress,
  rebaseTriggerGap,
  smoothAmplitude,
  swingDriverIndex,
  endApproach,
  acquireSwingSign,
  approachSpeedMmPerS,
  swingAmplitudeRad,
  swingProgress,
  swingSignFor,
  swingYawRad,
  type SwingLatch,
  pitchAngleFor,
} from "../input/approach_swing";
import { validateGestureConfig } from "../input/gestureConfig";
import { createHud } from "./hud";
// ⛔ THE DESKTOP SECOND TOUCH IS THIS IMPORT AND ONE CALL, AND NOTHING ELSE. Delete both and the
// touch build is byte-identical — `mouse_adapter.ts` says why that is the whole point.
import { attachMouseSecondTouch } from "./mouse_adapter";
import { wheelZoom } from "../input/mouse_wheel_zoom";
import {
  hitFaceAllowed,
  secondTouchAlwaysAvailable,
} from "../input/mouse_second_touch";
import { createMenu, type MenuSlider } from "./menu";

/**
 * ⭐ How far a face marker floats off the surface it marks, in METRES. ⛔ Enough to beat
 * z-fighting and small enough not to read as a gap — and a named constant because it is used
 * in the parent's frame now, where a bare `0.0015` would look like a UV or an alpha.
 */
const MARKER_LIFT_M = 0.0015;

/**
 * ⭐⭐ **THE ALIGNMENT SNAP RUNS AT A THIRD OF THE CAMERA RESET'S TIME** — owner, 2026-09-17:
 * *"too slow: make it twice faster"*, then *"1/3rd of camera reset time"*, then *"2/7th"*.
 * ⭐⭐ THREE JUDGEMENTS IN A FEW MINUTES IS A HAND CONVERGING ON A FEEL, which is exactly what
 * this project ships sliders for — and each round trip through a build and a deploy costs
 * minutes that a slider or a `?` override costs nothing. ⚠ It stays a ratio because the owner
 * asked for no new sliders; if the sweeping continues, the cheap fix is a config FIELD (URL
 * override, no menu space) rather than another edit here.
 *
 * ⛔ A RATIO RATHER THAN A SECOND TUNABLE, because the instruction that introduced the
 * sharing still stands: *"use the available sliders so we do not inflate the numbers of tuning
 * parameters sliders."* ⭐ One slider still governs both animations; what differs is a
 * constant a hand cannot reach — and if the two ever want independent times, this is the line
 * that becomes a field.
 * ⚠ At 450 ms of camera reset the snap takes **≈129 ms**.
 */
const ALIGN_SNAP_FRACTION = 2 / 7;

/** ⭐ The two marker colours, named once: cyan marks what MOVED, amber what it was aimed at. */
const FOLLOWER_COLOUR = new Color3(0.2, 0.9, 1);
const PIONEER_COLOUR = new Color3(1, 0.62, 0.1);
/**
 * ⭐⭐⭐ **FUCHSIA — A FACE THE HELD BODY IS NEARLY READY TO MATE WITH** (the owner, 2026-09-24).
 * ⛔ A third colour and not a shade of the other two: cyan and amber say *this pair IS aligned*,
 * and this one says *this pair COULD be* — an offer, not a state.
 */
const CANDIDATE_COLOUR = new Color3(1, 0.1, 0.8);
/**
 * ⭐⭐ `A16`'s **WHITE** — the capture contour, on BOTH bodies of the pair.
 *
 * ⛔ ONE WHITE FOR BOTH, by the owner's decision: *"make the white contours not differ for the
 * moment, capture it for possible future improvement."*
 */
const CAPTURE_COLOUR = new Color3(1, 1, 1);

// ⛔⛔⛔ **THE BOOT SCENE'S DIMENSIONS LIVE IN `core/scene_dims.ts`**, not here. ⚠ They were
// declared in this file and MIRRORED in two test files, so scaling the pyramid on 2026-09-25 left
// 1125 vectors green against the old body — including the one guarding the boot clearance.
// ⭐ *A fixture that mirrors a constant is a second implementation of it, and it disagrees exactly
// when the constant is the thing being changed.*

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

  // ⛔⛔ **PARSED HERE, FIRST, BECAUSE THE BOOT SCENE ITSELF NOW DEPENDS ON IT.** It used to sit
  // three hundred lines below, next to the gesture state that reads it — fine while only
  // gestures were tunable. ⚠ `sceneSeed` chooses the bodies' boot orientations, so the config
  // has to exist before the first `make()` call. ⭐ Moved rather than duplicated: a second
  // URL read would bypass `parseConfigOverrides`' validation and its rejected-key reporting,
  // and a typo'd key would then silently do nothing instead of being named on the HUD.
  const tuning = parseConfigOverrides(DEFAULT_CONFIG, window.location.search);
  const cfg = tuning.config;
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
  /**
   * ⭐⭐ **EVERY BODY'S OWN DIMENSIONS.**
   *
   * ⛔⛔ THEY USED TO BE ONE SHARED CONSTANT, and the base plate is what broke that: at
   * `6L × 0.3L × 9L` it shares nothing with the `L × 2L × 3L` parts. ⚠ Five things read a
   * body's size — the mesh, its faces, the white capture contour, the alignment contour and
   * the face-marker extents — and a single constant would have drawn all five of them at the
   * parts' size on a plate seventy times their volume.
   */
  const dimsOf = new Map<ObjectId, readonly [number, number, number]>();

  /**
   * ⭐⭐ **TURN A BUILT BOX INTO A TRUNCATED PYRAMID BY MOVING ITS VERTICES.**
   *
   * ⛔⛔ **THE POINT IS THAT BABYLON'S OWN WINDING AND INDEX LIST SURVIVE.** Authoring a mesh
   * by hand means authoring a winding, and `mesh_topology.ts`'s header records what a wrong
   * winding assumption cost: every normal in the scene inverted. ⭐ Moving the points the box
   * builder already produced changes where the body is and nothing about how it is described.
   *
   * ⚠ **THREE THINGS MUST FOLLOW THE POSITIONS, AND THE THIRD IS THE ONE THAT HIDES.**
   * Normals are recomputed (the sides are no longer axis-aligned, so lighting would be wrong);
   * and `refreshBoundingInfo` is not optional — Babylon cached the BOX's bounds at build time
   * and picking tests them first, so a stale bound would make the pyramid pickable in the air
   * above its own slope while the face under the finger reported correctly. ⛔ That is a
   * defect a hand would read as *"the tap is offset"*, never as *"the bounds are stale"*.
   *
   * ⛔ Returns false rather than throwing: this file's own rule is that a body which cannot be
   * built is NAMED on the readout, because scene construction that half-succeeds is worse than
   * one that says what it could not do.
   */
  const taperMesh = (m: Mesh, topScale: number): boolean => {
    const pos = m.getVerticesData(VertexBuffer.PositionKind);
    const idx = m.getIndices();
    if (pos === null || idx === null) return false;
    const tapered = taperTop(pos, topScale);
    if (tapered === null) return false;
    m.setVerticesData(VertexBuffer.PositionKind, tapered);
    const normals: number[] = [];
    VertexData.ComputeNormals(tapered, idx, normals);
    m.setVerticesData(VertexBuffer.NormalKind, normals);
    m.refreshBoundingInfo();
    return true;
  };
  /** ⚠ Bodies whose taper was refused — reported on the HUD, never silently a box. */
  const untaperedBodies: string[] = [];

  const make = (
    name: string,
    at: Vector3,
    rgb: [number, number, number],
    /** ⭐ The body's orientation at boot. ⚠ `core/vec` order `[w, x, y, z]`. */
    boot?: Quat,
    /** ⚠ Full extents along the body's own `x`, `y`, `z`. Defaults to the standard part. */
    dims: readonly [number, number, number] = OBJECT_DIMS_M,
    /**
     * ⭐⭐ **FROZEN** — the transform cannot be modified and the body cannot be a follower
     * (the owner, 2026-09-17). ⛔ Enforced in `core/object_model.ts` at the two WRITERS, not
     * here: this only records the intent.
     */
    frozen = false,
    /**
     * ⭐ The fraction of the base the TOP face keeps — `1` leaves the body a box. ⚠ The
     * body's own local `y` is the taper axis, which for a part booting square is world up.
     */
    topScale = 1,
  ) => {
    dimsOf.set(name, dims);
    // ⚠ `width/height/depth`, not `size` — the objects are no longer cubes.
    const mesh = CreateBox(
      name,
      { width: dims[0], height: dims[1], depth: dims[2] },
      scene,
    );
    // ⛔ BEFORE the collision hull and the topology are read off it, which both happen later
    // and both read the mesh rather than any table (`D49`, `D50`) — so they inherit the
    // tapered geometry by doing nothing at all.
    if (topScale !== 1 && !taperMesh(mesh, topScale)) untaperedBodies.push(name);
    mesh.position = at;
    // ⛔ Quaternion mode. While `rotationQuaternion` is null Babylon uses the Euler
    // `rotation` instead, which is the frame-mixing defect above.
    mesh.rotationQuaternion = Quaternion.Identity();
    // ⚠ Babylon stores `(x, y, z, w)`; `core/vec` uses `[w, x, y, z]`. One conversion, here.
    if (boot !== undefined)
      mesh.rotationQuaternion.set(boot[1], boot[2], boot[3], boot[0]);
    const mat = new StandardMaterial(name + "-mat", scene);
    mat.diffuseColor = new Color3(...rgb);
    mesh.material = mat;
    // ⭐⭐ TAGGED, so §2 rule 1's barycentre sees the OBJECTS and nothing else. The
    // diagnostic marker below is a mesh too, and a marker that became a barycentre
    // candidate would move the very centre it is drawn to show — a readout that
    // changes what it measures, which `METHOD` warns about in those words.
    // ⭐⭐ **`frozen` RIDES ON THE MESH UNTIL THE MODEL EXISTS**, and is read exactly once, to
    // build it. ⛔ It used to live in a module-scope set that outlived its purpose — a second
    // place a body's frozen-ness was written down, and this project's own scar is that *a shadow
    // copy is free to disagree with the thing it copies*. ⚠ Nothing may read this after
    // `makeWorld`: `world.objects.get(id)?.frozen` is the one answer from then on.
    mesh.metadata = { orbitCandidate: true, frozen };
    return mesh;
  };
  // ⭐⭐⭐ **THE BOOT LAYOUT — `5L` APART, PAIRWISE, AT THREE RANDOM ORIENTATIONS.**
  //
  // The owner, 2026-09-17: *"set the cube three lengths apart at the scene boot"*, then
  // *"increase their distances between each other by 2L"* (3L → **5L** = 400 mm), *"move the
  // brown cube by two lengths away from the camera"* (**+2L in z**; the camera boots at yaw
  // `-π/2`, which puts it on the **−z** side looking back toward `+z`), and *"rotate the three
  // rectangles so they have three random rotations at scene boot"*.
  //
  // ⚠ EXACTLY 400 mm for all three pairs, not approximately: A↔B is the baseline and
  // `objectC`'s height is DERIVED so A↔C and B↔C come out at 400 mm too —
  // √((5L)² − (2.5L)² − (2L)²) = 0.307246. ⛔ A guessed y would leave the three distances
  // unequal, and *"increase their distances"* would then be true of one pair and not the others.
  //
  // ⛔⛔⛔ **THIS COMMENT SAID *"AND AT 5L NOTHING IS IN RANGE AT REST, WHICH IS THE POINT"*
  // AND IT WAS FALSE — corrected by audit, 2026-09-17.**
  //
  // ⭐ The reasoning held for the three PARTS: 400 mm apart against a `4L` = 320 mm capture
  // radius, so no pair of parts is in range at rest and `A16`'s distance condition finally does
  // something on the glass. ⚠ **The base plate arrived afterwards and nobody re-ran the
  // arithmetic.** It sits `3L` below the parts' centres, which puts its CENTRE
  // √((2.5L)² + (3L)²) = **312.4 mm** from `objectA` and `objectB` — inside the radius. So
  // dragging either of them at boot raises the white capture pair on the plate at once, which
  // is the opposite of what this comment promised a device pass would see.
  // ⚠ `objectD` is clear: 570 mm to the plate, 400 mm to each part.
  //
  // ⛔⛔ **AND IT IS NOT A NUMBER TO NUDGE.** The radius is centre-to-centre
  // (`CENTRES-FOR-NOW`) and the plate is `6L × 9L`, so a part resting ON the plate near its
  // edge is FURTHER from its centre than one hovering high above the middle: any radius is
  // wrong for a body of that shape. ⭐ The fix is the face-distance rule the owner has already
  // named (*"later we will use distances between faces"*), which `3D2` owes.
  // ⭐⭐ `METHOD`: *a claim about a composition expires when any part of it changes* — the
  // spacing was re-derived when it moved, and the claim ABOUT the spacing was not.
  // The vector that states it: `tests/highlight.test.ts`, *"AT BOOT THE PARTS ARE CLEAR OF
  // EACH OTHER AND NOT CLEAR OF THE PLATE"*.
  //
  // ⛔⛔ THE ROTATIONS ARE **SEEDED**, not per-boot random — `core/random_pose.ts` argues why,
  // and `?sceneSeed=N` rolls a new scene. ⚠ Three arbitrary orientations mean **no two bodies
  // start aligned**, which is correct: `A16`'s highlight should be something a hand earns.
  const bootRotations = seededRotations(cfg.sceneSeed, 3);
  // ⭐⭐⭐ **THE TWO PARTS BOOT SQUARE AND UNALIGNED** — the owner, 2026-09-25: *"boot the scene
  // with no aligned object, translation mode. Use current rectangles transforms as displayed on
  // the usb tablet to boot the scene as default."*
  //
  // ⭐⭐ **AND THE SECOND SENTENCE IS WHY `bootRotations[0]` AND `[1]` STAY UNUSED.** The revert
  // note that stood here said to pass them back when the trial was discarded — and that would
  // have changed what the glass shows, which is precisely what the owner ruled out. ⛔ The boot
  // alignment was **satisfied at identity** (`A`'s bottom is `−y`, `B`'s top is `+y`, and the
  // alignment is anti-parallel), so it never rotated anything: deleting it changes the scene's
  // STATE and not one pixel of its pose. ⭐ Square is the current transform.
  //
  // ⚠ `seededRotations` is still asked for three so the plate's unused slot keeps its index —
  // the same reason the comment below already gives for `bootRotations[2]`.
  //
  // ⛔⛔ **WHAT IT COSTS IS `D63`'s JIG.** The approach-swing trial booted with a **pre-aligned**
  // pair so the swing had something to act on the moment the page loaded. ⚠ A hand must now make
  // that alignment first, and the trial's earlier device verdicts are not comparable with any
  // taken after this — *a jig that silently changed shape* is the thing `D78`'s note warned
  // about, and this change makes it loudly instead.
  // ⭐ `+30°` roll and `+30°` pitch about the BOOT CAMERA's axes (`z` and `x`) — the owner,
  // 2026-09-25. ⛔ The pyramid takes `−30°`: *"same for the pyramid, in opposite senses."*
  make("objectA", new Vector3(-0.2, 0, 0), [0.65, 0.67, 0.72], bootTilt(1));
  // ⭐⭐⭐ **THE RIGHT-HAND BODY IS THE TRAPEZOIDAL PYRAMID** — *"modify the rectangle on the
  // right to be a trapezoidal pyramid"* (the owner, 2026-09-22). ⚠ `objectB` is the one on the
  // right: it sits at `+x`, and it is the FOLLOWER of the boot pair a few hundred lines below.
  make(
    "objectB",
    new Vector3(0.2, 0, 0),
    [0.45, 0.58, 0.72],
    bootTilt(-1),
    PYRAMID_DIMS_M,
    false,
    OBJECT_TOP_SCALE,
  );
  // ⭐ A THIRD OBJECT, so the barycentre mechanism has something to choose BETWEEN.
  // ⚠ Deliberately off-axis and off-plane: with three collinear objects every barycentre lies
  // on the same line and the ray could not distinguish them, so the test would look like it
  // passed while exercising nothing. `2^3 − 3 − 1 = 4` candidates — three pairs and the triple.
  // ⭐⭐⭐ **THE BASE PLATE** — *"position it 3L below the two other rectangles"*.
  //
  // ⛔ NO RANDOM ORIENTATION: the owner asked for its dimensions to lie ALONG the world axes,
  // which a random rotation would immediately destroy. ⚠ So `bootRotations[2]` is deliberately
  // unused — `seededRotations` still asks for three so the first two do not change when this
  // body's role does.
  // ⚠ `3L` below the parts' CENTRES (they sit at `y = 0`), so the plate's own centre is at
  // `−3L`. ⛔ Its top face is therefore at `−3L + 0.15L`, about `2.85L` under them — it is a
  // landmark to fly down to, not a floor they are resting on.
  // ⭐⭐ **AND IT IS FROZEN** — *"the object transform cannot be modified and the object cannot
  // be a follower"*. ⛔ A base plate that could be dragged, rotated or aligned to something
  // would not be a base plate; it is the fixed thing everything else is placed against.
  make(
    "objectC",
    new Vector3(0, -OBJECT_SIZE_M * 3, 0),
    [0.72, 0.58, 0.45],
    undefined,
    PLATE_DIMS_M,
    true,
  );
  // ⭐⭐ **A FOURTH PART, PINK** — *"a fourth pink rectangle replicate of the blue rectangle and
  // place it where the orange rectangle previously was"*. ⭐ *Replicate* is about the SIZE: the
  // same `L × 2L × 3L` as the other parts, which is why it takes the default dims.
  //
  // ⛔⛔ **IT WAS A BEVELLED HOLLOW CYLINDER FOR AN HOUR, AND THE OWNER REMOVED IT** (`D92`,
  // reversed 2026-09-25). ⚠ `core/ring.ts` and its 10 vectors are **deleted, not parked** —
  // `D28`'s and `D40`'s rule, *a dormant fork is a trap*. ⭐ What the hour is worth keeping for is
  // defect 68: the mesh was correct and the body still looked like a doughnut, because the rim
  // vertices are shared and `ComputeNormals` blends across them. *A vector suite that reads the
  // geometry cannot see the shading, and the shading is what a hand judges.*
  //
  // ⚠ Its POSE is the third seeded rotation — the one the base plate stopped using when it was
  // told to sit square with the world. ⛔ That keeps `seededRotations(seed, 3)` answering for
  // exactly three parts, so objectA's and objectB's orientations do not shift.
  //
  // ⚠ `(0, 0.307246, 0.16)` is where the orange body sat when all three parts formed a 5L
  // triangle — so the three PARTS are still 5L apart pairwise, and the plate is the only body
  // that left that arrangement.
  make(
    "objectD",
    new Vector3(0, 0.307246, 0.16),
    [0.92, 0.5, 0.72],
    bootRotations[2],
  );

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
  /** Babylon `(x, y, z, w)` → `core/vec` `[w, x, y, z]`. ⚠ Identity if the mesh has no quaternion. */
  const quatOf = (m: AbstractMesh): Quat => {
    const q = m.rotationQuaternion;
    return q === null ? ([1, 0, 0, 0] as Quat) : ([q.w, q.x, q.y, q.z] as Quat);
  };

  const idOf = new Map<AbstractMesh, ObjectId>();
  /**
   * ⭐ The MODEL's record for a mesh, or `null` for a mesh the model does not know — a
   * marker, a contour, a highlight. ⚠ It reads `world` live, so a rule asking it cannot be
   * looking at a body that has since changed.
   */
  const bodyOf = (
    mesh: AbstractMesh,
  ): { readonly id: ObjectId; readonly frozen?: boolean } | null => {
    const id = idOf.get(mesh);
    return id === undefined ? null : (world.objects.get(id) ?? null);
  };
  const meshOf = new Map<ObjectId, AbstractMesh>();
  /**
   * ⛔ PER-AXIS half-extents, and now per BODY. ⚠ A single `half` was a cube's privilege; a
   * single set of three was the equal-parts privilege, and the base plate ended that too.
   */
  // ⛔⛔ **`facesFor` IS DELETED** (`D50`, 2026-09-18). It built six axis-aligned faces from
  // a dimensions table, which is right for a cuboid and meaningless for an imported part.
  // ⭐ `meshTopology` replaces it: coplanar adjacent triangles are grouped into LOGICAL
  // faces, so the same code yields six for a box and whatever a bracket actually has.
  // ⚠ Face ids are now `f0`…`fN` in construction order rather than `"+x"`, because an
  // imported face has no axis to be named after.

  // ⛔⛔⛔ **A LOCAL `faceExtent` LIVED HERE AND IT WAS THE 90° BUG — DEVICE-REPORTED
  // 2026-09-17**: *"the contour highlight quad does not match the faces of the rectangles in
  // rotation (90degree offset)"*.
  //
  // ⚠⚠ **THE FAILURE WAS NOT THE ARITHMETIC. IT WAS THAT I FIXED IT IN THE WRONG FILE.** I
  // wrote the buggy version here (*"the two axes that are not the normal, in ascending order"*),
  // realised it was wrong, wrote the CORRECT one as `faceMarkerExtent` in `core/face_pick.ts`,
  // gave it three golden vectors — **and left this one wired.** ⛔ So the suite went green on the
  // fix while the product kept the defect, and no test in this repository could have noticed:
  // the vectors exercised the function nobody called.
  //
  // ⭐⭐ `METHOD`, and it is a NEW shape worth carrying: *a fix that lands beside the defect
  // instead of on it leaves a green suite and a broken product.* ⚠ The old code must be
  // DELETED in the same change, not left for later — which is the same lesson as defect 40
  // (`A12`'s retired roll detector, still fed, still holding a verdict).
  // ✅ The rule now lives in exactly one place, and this file calls it.

  /**
   * ⭐⭐⭐ **A BODY'S COLLISION SHAPE, READ OFF ITS OWN MESH** (`D49`, and the owner on
   * 2026-09-18: *"make sure the offset is automatically computed when a new object is imported
   * into the scene"*).
   *
   * ⛔⛔ **THIS REPLACED A LOOKUP AN IMPORTED BODY WOULD HAVE MISSED, SILENTLY.** The shape
   * used to be `boxShape(dimsOf.get(name) ?? OBJECT_DIMS_M)` — a table keyed by the names of the
   * four bodies this file happens to build. ⚠ An imported mesh is in no such table, so it would
   * have fallen through to `OBJECT_DIMS_M` and been given **a part's dimensions**: a capture
   * volume with no relation to the body under it, and nothing on the glass to say so.
   * ⭐ Reading the vertices removes the question — there is no table to forget, and an import
   * path inherits a correct shape by doing nothing at all.
   *
   * ⚠ **SCALING IS APPLIED.** `getVerticesData` returns positions BEFORE `mesh.scaling`. The
   * boot boxes bake their size into the geometry and scale 1, so this is invisible today — and a
   * glTF node carrying its size as a scale instead would otherwise get a shape of the wrong
   * size, which is the same silent failure one layer along.
   *
   * ⛔ A mesh with no position data yields `null`, and the caller REFUSES out loud rather than
   * substituting a stand-in that would capture at the wrong distance while looking normal.
   */
  const shapeFromMesh = (m: AbstractMesh): ConvexShape | null => {
    const raw = m.getVerticesData(VertexBuffer.PositionKind);
    if (raw === null || raw.length < 3) return null;
    const scaled = new Float32Array(raw.length);
    for (let i = 0; i + 2 < raw.length; i += 3) {
      scaled[i] = (raw[i] as number) * m.scaling.x;
      scaled[i + 1] = (raw[i + 1] as number) * m.scaling.y;
      scaled[i + 2] = (raw[i + 2] as number) * m.scaling.z;
    }
    const shape = shapeFromVertices(scaled);
    return shape.points.length === 0 ? null : shape;
  };

  /**
   * ⚠ Bodies whose geometry could not be read — reported on the HUD, never thrown. ⛔ A throw
   * in scene construction takes the page down; *this body never captures* is survivable, and an
   * INVISIBLE failure is not. This project has been burned twice by a readout that was absent.
   */
  const shapelessBodies: string[] = [];
  /**
   * ⛔⛔ **A THROW INSIDE THE DRAW PATH USED TO BE INVISIBLE, AND THAT COST A DEVICE PASS.**
   *
   * ⚠ Babylon swallows an exception thrown from a render observer — the frame simply stops
   * where it threw. ⭐ So everything BEFORE the failure is drawn and everything after it is not,
   * which on the glass reads as *"the outlines are gone"* rather than as *"something threw"*.
   * ⛔ The first message is latched and printed on the HUD; later ones are counted, because a
   * throw in a render loop repeats sixty times a second and a scrolling readout is unreadable.
   */
  let drawFault: string | null = null;
  let drawFaultCount = 0;
  const guardDraw = (where: string, fn: () => void): void => {
    try {
      fn();
    } catch (err) {
      drawFaultCount++;
      if (drawFault === null) {
        drawFault = `${where}: ${err instanceof Error ? err.message : String(err)}`;
        // ⚠ Console too — the HUD has no room for a stack, and over the USB loop a tablet's
        // console is reachable through `chrome://inspect`.
        console.error("[draw]", where, err);
      }
    }
  };

  /**
   * ⭐⭐⭐ **EVERY BODY'S TOPOLOGY, COMPUTED ONCE WHEN IT ENTERS THE SCENE** (`D50`, the owner:
   * *"the outlines shall be calculated from meshes at the time the object is imported"*).
   *
   * ⛔⛔ **IT REPLACES A BOUNDING BOX EVERYWHERE, AND THAT WAS THE REQUIREMENT ALL ALONG.**
   * Every outline in this file used to be a unit box outline scaled to a dimensions table — the
   * two whites, the alignment contour and the face markers. ⚠ For the boot cuboids a box and the
   * mesh coincide, which is exactly why the substitution survived two device passes; for a real
   * Blender part it is simply the wrong shape.
   * ⭐ `meshTopology` welds the split vertices, groups coplanar triangles into LOGICAL faces and
   * hands back each face's boundary loop and area centroid, plus the body's hard edges. Every
   * outline below is drawn from that, so an imported part is outlined correctly by construction.
   *
   * ⚠ Built here, at spawn, and never per frame: it is pure geometry in the body's LOCAL frame,
   * so the body's own transform carries it.
   */
  const topoOf = new Map<ObjectId, MeshTopology>();
  const topologyFromMesh = (m: AbstractMesh): MeshTopology | null => {
    const raw = m.getVerticesData(VertexBuffer.PositionKind);
    const idx = m.getIndices();
    if (raw === null || idx === null || raw.length < 9) return null;
    const scaled = new Float32Array(raw.length);
    for (let i = 0; i + 2 < raw.length; i += 3) {
      scaled[i] = (raw[i] as number) * m.scaling.x;
      scaled[i + 1] = (raw[i + 1] as number) * m.scaling.y;
      scaled[i + 2] = (raw[i + 2] as number) * m.scaling.z;
    }
    const t = meshTopology(scaled, idx);
    return t.faces.length === 0 ? null : t;
  };
  const topologyOfBody = (m: AbstractMesh): MeshTopology => {
    const t = topologyFromMesh(m);
    if (t !== null) {
      topoOf.set(m.name, t);
      return t;
    }
    // ⛔ Named on the HUD, never substituted: a body with no topology has no outlines and no
    // logical faces, and an invisible failure is the one this project has been burned by.
    if (!shapelessBodies.includes(m.name)) shapelessBodies.push(m.name);
    const empty: MeshTopology = {
      positions: [],
      faces: [],
      edges: [],
      vertexPlanes: [],
    };
    topoOf.set(m.name, empty);
    return empty;
  };

  const shapeOfBody = (m: AbstractMesh): ConvexShape => {
    const s = shapeFromMesh(m);
    if (s !== null) return s;
    shapelessBodies.push(m.name);
    return { points: [] };
  };

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
            // ⛔⛔ READ FROM THE MESH, NOT ASSUMED IDENTITY. This line said `[1, 0, 0, 0]`,
            // which was true only for as long as every body booted square. ⚠ The moment the
            // owner asked for a rolled and a yawed body, a hard-coded identity would have put
            // the MODEL and the MESH in disagreement at frame zero — the model is authoritative
            // (`3D1`), so every face normal, every alignment and every capture test would have
            // been computed for an orientation the screen never showed.
            orientation: quatOf(m),
          },
          parent: null,
          // ⭐⭐⭐ **FROM THE MESH, NOT FROM A TABLE** (`D50`). ⛔ *A face is not a triangle*
          // (`3D1`) — and `meshTopology` is where that stops being a blocker: it groups coplanar
          // adjacent triangles into logical faces, so a cuboid yields six and a bracket yields
          // whatever it has. ⚠ `facesFor` and its dimensions table are **deleted**.
          faces: topologyOfBody(m).faces.map((f) => ({
            id: f.id,
            centre: f.centre,
            normal: f.normal,
          })),
          // ⭐⭐⭐ **THE COLLISION SHAPE, FROM THE MESH ITSELF** (`D49`) — no table, no name
          // lookup, nothing for an import path to remember. ⚠ For a box it is EXACT: its
          // corners ARE its hull.
          shape: shapeOfBody(m),
          frozen: m.metadata?.frozen === true,
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
    // ⛔⛔⛔ **A FROZEN BODY REFUSES *AUDIBLY*** — audit fix, 2026-09-17.
    //
    // ⚠ `setWorldPlacement` returns the world unchanged for a frozen body, which is the right
    // INVARIANT and, on its own, a silent one: a finger dragging the base plate got no motion
    // and no message. ⛔ *"Dragging the plate does nothing"* is precisely the shape this file
    // has been burned by — the alignment path already says *"is FROZEN — it cannot be a
    // follower"* out loud, and the placement path said nothing at all.
    // ⭐ The model still refuses in `object_model.ts`; this only makes the refusal VISIBLE.
    // The readout is not the enforcement, and must never become it.
    if (world.objects.get(id)?.frozen === true) {
      lastVerdict = `${id} is FROZEN — its transform cannot be modified`;
      hudDirty = true;
      return;
    }
    world = setWorldPlacement(world, id, placed);
  };

  /**
   * ⭐⭐⭐ **THE ROTATIONAL SWAY, FOR EVERY PATH THAT TURNS A HELD OBJECT.**
   *
   * ⛔⛔ DEVICE-REPORTED 2026-09-17: *"when the object is aligned and rotates, you lost the
   * sway in the other objects."* ⭐ Exactly right, and the cause was an early `return`: the
   * aligned twist (2sexte) applied its rotation and returned from the handler, so the sway
   * block at the END of the rotate branch never ran. The free rotation kept its sway, which
   * is why only ALIGNED objects lost it.
   *
   * ⚠⚠ THE SHAPE, AND IT IS WHY THIS IS A FUNCTION AND NOT A FIX IN TWO PLACES: a rule
   * added later took a shortcut past a consequence that an earlier rule reached by falling
   * through. ⛔ Three paths now turn a held object — free rotation, the aligned twist, and the
   * second finger's roll — and a fourth is likely. Each calls this; none can forget it.
   *
   * ⭐ It also keeps the held object's follower `qHome` in step, which the render loop needs
   * or it would fight the rotation rule.
   */
  const noteSpin = (grip: Held, t: number): void => {
    const home = modelOrientation(grip.mesh);
    followerFor(grip.mesh).qHome = home;
    const spin = grip.spinSway.push(home, t, true);
    if (spin && cfg.rotateSwayDeg > 0) spinOthers(grip, spin);
  };

  /**
   * ⭐⭐⭐ Put a marker ON a face — **by PARENTING it to the object**, not by positioning it.
   *
   * ⛔⛔ **DEVICE-REPORTED 2026-09-17: *"the highlighted quads always lag the movements of the
   * faces they highlight."*** ⭐ Exactly one frame of lag, every frame, and the cause was not
   * the arithmetic: this ran AFTER the meshes were written but read `mesh.getWorldMatrix()`,
   * which is Babylon's **cached** matrix — recomputed during `scene.render()`, i.e. after this
   * block. So every marker was placed from the pose the object had **last** frame, while its
   * orientation came from `rotationQuaternion` and was current: the two disagreed, which is
   * why it read as a slide rather than as a delay.
   *
   * ⭐⭐ **PARENTING MAKES IT UNREACHABLE RATHER THAN FIXED.** A child's world transform is
   * composed from its parent's at render time, so there is no stale matrix to read and no
   * ordering to get right — the marker is *on* the face in the same sense a decal is.
   * ⛔ `computeWorldMatrix(true)` here would also have worked, and would have left the next
   * writer one reordering away from the same bug. `METHOD`: prefer the structure that cannot
   * express the defect.
   *
   * ⚠⚠ **AND IT MOVES A GUARANTEE OUT OF REACH OF A VECTOR, WHICH IS WORTH SAYING**: that the
   * marker turns WITH its face is now the scene graph's doing, and no golden vector reaches
   * `src/render`. `face_pick.test.ts` still pins the composition that the graph performs —
   * the constant offset under the object's orientation — which is the closest a test can get.
   *
   * ⚠ The local face centre and normal come from the MODEL, which is where faces live; the
   * sway and the follower reach the marker through the parent, so what the eye sees still
   * agrees by construction.
   *
   * @returns false when the object or face no longer exists — the caller hides the marker.
   */
  /**
   * ⭐⭐⭐ **A FACE MARKER IS BUILT FROM THE FACE'S OWN TRIANGLES AND ITS OWN BOUNDARY** (`D50`).
   *
   * ⛔⛔ **IT WAS A UNIT RECTANGLE SCALED BY A DIMENSIONS TABLE**, oriented to the face normal.
   * ⚠ That is right for an axis-aligned cuboid and meaningless for anything else: a triangular
   * end would have worn a rectangle, and an L-shaped face a rectangle covering the notch.
   * ⭐ Now the fill IS the face's triangles and the contour IS its boundary loop, so a face of
   * any shape marks itself correctly — including a face nobody wrote a table entry for.
   *
   * ⚠ Built once per body-and-face and cached: pure local geometry, carried by the body's own
   * transform. ⛔ PARENTED, never positioned per frame — defect 46's lesson.
   * ⚠ Lifted along the face normal by a hair, or it z-fights the surface it marks.
   */
  interface FaceMarker {
    readonly fill: Mesh;
    readonly mat: StandardMaterial;
    readonly loop: LinesMesh;
    /**
     * ⭐⭐ **THE X-RAY TWIN** — the same triangles, drawn in rendering group 1 so that nothing in
     * the scene can occlude it (the owner, 2026-09-23). ⛔ A SECOND MESH rather than a change to
     * the first: the marker you can already see stays opaque and exactly as it was, and this
     * only adds what the body was hiding.
     */
    readonly xray: Mesh;
    readonly xrayMat: StandardMaterial;
  }
  const faceMarkers = new Map<string, FaceMarker>();
  const faceMarkerFor = (
    objectId: ObjectId,
    faceId: string,
  ): FaceMarker | null => {
    const key = `${objectId}/${faceId}`;
    const hit = faceMarkers.get(key);
    if (hit !== undefined) return hit;
    const body = meshOf.get(objectId);
    const topo = topoOf.get(objectId);
    const face = topo?.faces.find((f) => f.id === faceId);
    if (!body || !topo || !face) return null;

    const lift = (v: number, i: number): number =>
      v + (face.normal[i] as number) * MARKER_LIFT_M;
    // ⭐ A local index space for this face only, so the fill carries just its own vertices.
    const local = new Map<number, number>();
    const positions: number[] = [];
    const indices: number[] = [];
    for (const vi of face.triangles) {
      let li = local.get(vi);
      if (li === undefined) {
        li = local.size;
        local.set(vi, li);
        const p = topo.positions[vi] as Vec3;
        positions.push(lift(p[0], 0), lift(p[1], 1), lift(p[2], 2));
      }
      indices.push(li);
    }
    const fill = new Mesh(`follower-face-${key}`, scene);
    const data = new VertexData();
    data.positions = positions;
    // ⚠ DOUBLE-SIDED by duplicating the winding: a face marker must read from either side,
    // because an aligned body is routinely seen from behind the face that carries the alignment.
    data.indices = [...indices, ...indices.slice().reverse()];
    data.applyToMesh(fill, false);
    const mat = new StandardMaterial(`follower-face-${key}-mat`, scene);
    mat.emissiveColor = FOLLOWER_COLOUR.clone();
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    fill.material = mat;
    fill.parent = body;
    fill.isPickable = false;
    fill.isVisible = false;

    const loopPts = face.boundary.map((vi) => {
      const p = topo.positions[vi] as Vec3;
      return new Vector3(lift(p[0], 0), lift(p[1], 1), lift(p[2], 2));
    });
    // ⛔ CLOSED by repeating the first point — an open loop leaves one edge of the face
    // unmarked, which reads as a defect in the pick rather than in the drawing.
    if (loopPts.length > 0) loopPts.push(loopPts[0] as Vector3);
    const loop = CreateLines(`face-loop-${key}`, { points: loopPts }, scene);
    loop.color = PIONEER_COLOUR.clone();
    loop.parent = body;
    loop.isPickable = false;
    loop.isVisible = false;

    // ⭐⭐⭐ **THE X-RAY TWIN.** Same vertex data, drawn LAST and with the depth buffer cleared
    // before it — Babylon's rendering groups do that by default — so no geometry can hide it.
    // ⚠ `renderingGroupId = 1` and not a depth-function trick: the group boundary is a property
    // of the scene's draw order, where a per-material `ALWAYS` would still lose to anything
    // drawn after it in the same group. ⛔ One mechanism, not two that can disagree.
    const xray = new Mesh(`follower-face-xray-${key}`, scene);
    const xrayData = new VertexData();
    xrayData.positions = positions;
    xrayData.indices = [...indices, ...indices.slice().reverse()];
    xrayData.applyToMesh(xray, false);
    const xrayMat = new StandardMaterial(
      `follower-face-xray-${key}-mat`,
      scene,
    );
    xrayMat.emissiveColor = FOLLOWER_COLOUR.clone();
    xrayMat.disableLighting = true;
    xrayMat.backFaceCulling = false;
    xray.material = xrayMat;
    xray.renderingGroupId = 1;
    // ⛔ PARENTED, exactly as the fill is — defect 46: a marker positioned from Babylon's cached
    // world matrix draws the pose its object had LAST frame.
    xray.parent = body;
    xray.isPickable = false;
    xray.isVisible = false;

    const made: FaceMarker = { fill, mat, loop, xray, xrayMat };
    faceMarkers.set(key, made);
    return made;
  };

  /**
   * ⭐⭐⭐ **THE ALIGNMENT** — *"first object minimally rotates ... so that FollowerFace
   * normal aligns with PioneerFace normal"*.
   *
   * ⭐⭐ THE TRIGGER IS A **TAP BY A SECOND HOLDER**, which is why this is reached from a
   * release verdict and not from a press: a second touchpoint landing on ANOTHER object is
   * routed `OBJECT` — a second holder with its own recogniser — and `SECOND` is reserved for
   * a finger on an object someone else is already holding. ⚠ So *"tap on second object's hit
   * face"* arrives as **that grip's own `TAP`**, and the Follower is the OTHER grip.
   *
   * ⛔ Every refusal is REPORTED. The whole gesture is *"nothing visibly happened"* when it
   * fails, and a hand cannot tell a refused alignment from an unrecognised tap without the
   * readout — `METHOD`: *a skipped check must be announced.*
   *
   * @returns true when an alignment was applied — the caller then skips the mode toggle,
   *   because the alignment's own mode switch replaces it.
   */
  // ⭐⭐⭐ **`D67` — THE PRESSING FINGER IS THE FOLLOWER NOW, AND THE HELD ONE IS THE PIONEER.**
  // ⛔ The owner, 2026-09-21: *"First the Pioneer & PioneerFace, second the Follower & the
  // FollowerFace."* ⚠ Only the two SIDES swap: every refusal below, the solver, the snap and the
  // link are unchanged, which is why this is a re-point rather than a rewrite.
  /**
   * ⭐⭐⭐ **THE HITFACE — the face the FIRST touch's raycast hit at press.**
   *
   * > *"in rotation mode, when object is not aligned: track the object's face which first touch
   * > raycast hit at press = HitFace."* — the owner, 2026-09-24
   *
   * ⛔ Three preconditions, all read live rather than latched: the session is in `ROTATE`, a first
   * touch is holding a body, and that body is **not aligned**. ⚠ An aligned body already has a
   * FollowerFace and its own highlight; offering it a second one would put two meanings on one
   * body. ⭐ `grip.pressFace` is the raycast's own answer, resolved once at the press — never
   * recomputed here, because a second opinion about *which face* would be free to disagree.
   */
  const hitFaceNow = (): FaceRef | null => {
    // ⛔⛔ **THE `ROTATE` PRECONDITION IS DELETED** — the owner, 2026-09-25: *"no need to be in
    // ROTATE for hitFaceNow()."* ⚠ It was MINE, not his: the first dictation opened *"in rotation
    // mode, when object is not aligned"*, and I read the mode as a condition of the RULE rather
    // than as the setting he happened to be describing it in. ⭐ The offer is about geometry —
    // this face against those faces — and a body being TRANSLATED into place wants it as much.
    const holder = router.objects()[0];
    const grip = holder === undefined ? undefined : held.get(holder.id);
    if (grip === undefined || grip.pressFace === null) return null;
    // ⭐ On a mouse only the RIGHT button sets a HitFace (`hitFaceAllowed`, the owner 2026-09-25).
    if (!hitFaceAllowed(grip.pointerType)) return null;
    const objectId = idOf.get(grip.mesh);
    if (objectId === undefined) return null;
    if (alignedFaceOf(world, objectId) !== null) return null;
    return { objectId, faceId: grip.pressFace.faceId };
  };

  /**
   * ⭐⭐ The white ring that marks a fuchsia face's centre, one per candidate face.
   *
   * ⛔⛔ **PARENTED TO THE BODY AND PLACED IN ITS LOCAL FRAME** — defect 46's lesson, the same one
   * the face markers rest on: *a marker positioned from Babylon's cached world matrix draws the
   * pose its object had LAST frame*, which is exactly the lag the owner asked us to avoid here.
   * ⚠ Only the SCALE is written per frame, to hold a constant apparent size.
   */
  const candidateRings = new Map<string, LinesMesh>();
  const candidateRingFor = (
    objectId: ObjectId,
    faceId: string,
  ): LinesMesh | null => {
    const key = `${objectId}/${faceId}`;
    const hit = candidateRings.get(key);
    if (hit !== undefined) return hit;
    const body = meshOf.get(objectId);
    const face = world.objects
      .get(objectId)
      ?.faces.find((f) => f.id === faceId);
    if (!body || !face) return null;
    const m = CreateLines(
      `candidate-ring-${key}`,
      { points: RING_POINTS },
      scene,
    );
    m.color = new Color3(1, 1, 1);
    m.isPickable = false;
    // ⭐ Above the body and above the face marker it sits on, for the same reason the gizmo is:
    // an instrument that says *here is the offer* must not be occluded by the thing it marks.
    m.renderingGroupId = 2;
    m.billboardMode = Mesh.BILLBOARDMODE_ALL;
    m.isVisible = false;
    m.metadata = { orbitCandidate: false };
    m.parent = body;
    // ⚠ Lifted off the surface by the same hair the face marker uses, or it z-fights the fill.
    m.position.set(
      face.centre[0] + face.normal[0] * MARKER_LIFT_M * 2,
      face.centre[1] + face.normal[1] * MARKER_LIFT_M * 2,
      face.centre[2] + face.normal[2] * MARKER_LIFT_M * 2,
    );
    candidateRings.set(key, m);
    return m;
  };

  /**
   * ⭐ The fuchsia set, as the PRESS path needs it. ⛔ Computed from the model on demand rather
   * than read off a variable the render loop happens to have left behind: a press and a frame are
   * different moments, and a set cached by the draw would answer for the wrong one.
   */
  /**
   * ⭐⭐⭐ **THE OFFER — and the ONE place `pioneerCandidates` switches it off.**
   *
   * > *"create a toggle slider to enable or disable the above rules"* — the owner, 2026-09-25,
   * naming exactly two: the fuchsia highlight of OTHER bodies' faces, and the press on one.
   *
   * ⛔⛔ **THE HITFACE IS NOT GATED HERE, AND THAT IS THE POINT.** It and its fuchsia contour are a
   * separate instruction and stay live at `0` — the owner: *"I did not tell to disable the
   * hitFaceNow."* ⚠ I gated the source first and took both with it; the switch belongs on the
   * ACTIONS the offer drives, not on the fact it is computed from.
   */
  const candidateFacesNow = (): FaceRef[] => {
    if (cfg.pioneerCandidates !== 1) return [];
    const hit = hitFaceNow();
    if (hit === null) return [];
    return mateCandidateFaces(world, hit, cfg.pioneerCandidateConeDeg);
  };

  /** ⭐ The same offer as keys, as the PRESS path needs it (the frozen-face exception). */

  const alignFollowerToPioneer = (
    followerPointerId: number,
    followerGrip: Held,
    mode: AlignMode,
    /**
     * ⭐⭐⭐ **THE FINGER THAT IS ABOUT TO GO AWAY**, named by the caller because only the caller
     * knows. ⛔ Its `pressFace` is wiped at the end; the other grip's is left alone.
     *
     * ⚠⚠ It was `followerGrip`, hard-coded, and that was true only of `D67`'s press path. The two
     * call sites disagree about which finger is transient — on a PRESS the Pioneer's touch is the
     * new one, on a RELEASE the follower's is the one lifting — so a fixed answer is wrong for one
     * of them whichever way it points. ⭐ `METHOD`: *when two callers disagree about a fact, the
     * fact is an argument, not a constant.*
     */
    transientGrip: Held,
  ): boolean => {
    const followerId = idOf.get(followerGrip.mesh);
    if (followerId === undefined || followerGrip.pressFace === null) {
      lastVerdict = "align: press resolved no face — toggled instead";
      return false;
    }
    // ⛔⛔ EXACTLY ONE OTHER HOLDER. The rule names a *first* and a *second* object; with
    // two other objects held, *which* one is the Follower has no answer worth trusting, and
    // guessing would align an object the hand did not mean to move. ⭐ Same discipline as
    // `A15`'s *"every remaining holder is evaluated, not a guessed pairing"*.
    const others = [...held.entries()].filter(
      ([pid]) => pid !== followerPointerId,
    );
    if (others.length !== 1) {
      lastVerdict =
        others.length === 0
          ? "align: nothing held — the tap toggled the mode"
          : `align: ${others.length} objects held — no Pioneer can be chosen, toggled instead`;
      return false;
    }
    const pioneerGrip = others[0]![1];
    const pioneerId = idOf.get(pioneerGrip.mesh);
    if (pioneerId === undefined || pioneerGrip.pressFace === null) {
      // ⚠ `D67`: the held body IS the Pioneer, so this is *the first touch never resolved a
      // PioneerFace* — the one thing the whole gesture stands on.
      lastVerdict =
        "align: the held object has no resolved PioneerFace — toggled instead";
      return false;
    }

    // ⭐⭐ **A FROZEN BODY CANNOT BE A FOLLOWER** — refused here only so the HUD can SAY so.
    // ⛔⛔ THE GUARANTEE ITSELF IS IN `core/object_model.ts`: `pushObjectConstraint` refuses a
    // frozen body, so even if this check were deleted the plate could not be aligned. ⚠ What
    // would be lost is the EXPLANATION — the tap would silently do nothing, and *"tapping the
    // plate does nothing"* is precisely the shape this file has been burned by twice today.
    // ⭐ A frozen body remains a perfectly good PIONEER; only the Follower role is refused.
    if (world.objects.get(followerId)?.frozen === true) {
      lastVerdict = `align: ${followerId} is FROZEN — it cannot be a follower`;
      // ⚠ `false`: the tap was NOT consumed, so it still falls through to the mode toggle.
      // ⛔ Unlike the cycle case there is nothing to undo here, and a tap that did absolutely
      // nothing would be the readout-that-lies shape again.
      return false;
    }

    // ⭐⭐⭐ **A LOOP IS SEVERED AND THE ALIGNMENT IS THEN MADE — `D90`, THE SWAP.**
    //
    // > *"a follower cannot become the pioneer of its own pioneer. in such case, the tap
    // > triggering this configuration shall instead break the initial alignment"* — the owner,
    // > 2026-09-17, and it said BREAK and stop
    //
    // > *"I first press the pioneer and second press the follower … why is there no swap between
    // > the pioneer and the follower? This conflicts with the rule I set."* — the owner,
    // > 2026-09-25, choosing break **and re-make**
    //
    // ⛔⛔ **BOTH TEXTS STAND, AND THE SECOND IS IN FORCE.** The first was written under `D67`,
    // where the held body was the PIONEER, so *hold B, press A* named the relation that already
    // existed; inverted, the same fingers name the OPPOSITE one, which is a swap the hand asked
    // for explicitly. ⭐ `METHOD`: *a ruling is made about a gesture, and an inversion changes
    // what the gesture says — so the ruling has to be asked again, not carried.*
    //
    // ⭐⭐ **ONE RELEASE ALWAYS SUFFICES**, and that is why this is not a loop: a body has at most
    // one Pioneer, so the chain leaving the prospective Pioneer is unique and cutting its first
    // edge severs every cycle through it. ⚠ `F → P1 → P2` then making `P2` follow `F` drops
    // `F → P1`, exactly as the two-body case drops `A → B`.
    //
    // ⛔ A cycle is not cosmetic — `resolvePioneerTurns` is a fixed point over these links, so a
    // ring of orange bodies would take each other's rotation for ever. ⭐ Severing first makes the
    // state unrepresentable rather than capped.
    // ⭐⭐ THE DECISION IS `cycleBreaker`'s, in `core/alignment_links.ts`, where a vector reaches
    // it. ⛔ This file holds the CALL and nothing else — the 2026-09-19 lesson, which cost seven
    // mutants that survived the whole suite.
    const swapped = links.cycleBreaker(followerId, pioneerId);
    if (swapped !== null) {
      // ⛔⛔ **AND THEN IT FALLS THROUGH.** ⚠ It used to `return true` here, which is the *break
      // only* reading — the owner's 2026-09-17 sentence — and it left the hand repeating the
      // gesture to get the relation it had just asked for.
      releaseAlignmentOf(swapped);
    }

    // ⭐ The Pioneer normal is read in WORLD **now** and then frozen — §1.4's doctrine, and
    // the owner's own *"the PioneerFace resets as null"*. There is no live relationship
    // afterwards: moving the other object later does not drag this alignment with it.
    const pioneerWorld = faceWorld(
      world,
      pioneerId,
      pioneerGrip.pressFace.faceId,
    )?.normal;
    const followerLocal = world.objects
      .get(followerId)
      ?.faces.find((f) => f.id === followerGrip.pressFace!.faceId)?.normal;
    if (!pioneerWorld || !followerLocal) {
      lastVerdict = "align: face lookup failed — toggled instead";
      return false;
    }

    const capped = singleAlignment(
      world.objects.get(followerId)?.constraints ?? [],
      faceAlignConstraint(followerLocal, pioneerWorld),
    );
    if (capped.refused) {
      // ⛔ A `MATE` holds the stack. Unreachable today (§4's `6quater` is the only rule that
      // pushes one and fork C has no flick), and reported rather than silently overridden.
      lastVerdict = "align: REFUSED — a MATE holds the stack";
      return false;
    }
    // ⚠ `clear` then `push` IS the setter, and it is safe *because* of the refusal above:
    // with no mate on the stack there is nothing `clear` can destroy that the cap would have
    // kept. ⛔ Written as two calls rather than a new core API, so the object model gains no
    // surface for one caller.
    world = clearObjectConstraints(world, followerId);
    world = pushObjectConstraint(world, followerId, capped.stack[0]!, false);

    const before = modelOrientation(followerGrip.mesh);
    const solved = solve(capped.stack, before, {
      evictOnOverflow: cfg.evictOnOverflow,
    });
    if (solved.rejected) {
      lastVerdict = "align: solver refused the alignment";
      return false;
    }
    // ⭐ ONE alignment, so this is §1.4's entry 1: the MINIMAL swing — *"rotation on the
    // minimum number of axis"* — and the spin about the aligned normal stays free.
    // ⭐⭐ PLAYED AS A SLERP over `cameraResetMs`, not applied in one frame (owner, 2026-09-17).
    // ⛔⛔ **THE DURATION IS THE CAMERA RESET'S, ON PURPOSE**: *"use the available sliders so we
    // do not inflate the numbers of tuning parameters sliders."* ⭐ They are the same KIND of
    // number — how long a discrete, hand-requested snap takes — and the camera's is the only
    // one in the config. ⚠ Moving that slider moves both, which is the cost of not adding a
    // knob; splitting them later is one field and one line.
    // ⚠ At `0` the slider means *no animation*, exactly as it does for the camera.
    const target = qmul(solved.rotation, before);
    const snapMs = cfg.cameraResetMs * ALIGN_SNAP_FRACTION;
    if (snapMs > 0) {
      alignSnaps.start(followerId, before, target, performance.now());
    } else {
      setModelOrientation(followerGrip.mesh, target);
      alignSnaps.cancel(followerId);
    }
    if (swapped !== null) {
      lastVerdict = `align: SWAP — released ${swapped}'s own alignment, ${followerId}→${pioneerId}`;
    }
    followerGrip.alignmentTouched = true;
    // ⭐⭐ THE HIGHLIGHT IS THE ALIGNMENT'S STATE, not the press's: it appears HERE and dies
    // with the constraint (`D35`, and the owner's *"until un-highlight occurs"*).
    // ⚠ Captured BEFORE the grip's face is cleared below — the readout names the face this
    // alignment was actually made on, and reading it back off a cleared grip is how a verdict
    // line starts lying.
    const followerFaceId = followerGrip.pressFace.faceId;
    selectedFace = {
      objectId: followerId,
      faceId: followerFaceId,
      cos: followerGrip.pressFace.cos,
    };
    // ⛔⛔ *"THEN THE PIONEERFACE RESETS AS NULL"* WAS AMENDED THE SAME DAY. The owner now
    // wants its **contour highlighted until the alignment is broken**, and a re-tap on that
    // same face to break it — so the face's identity is REMEMBERED where it can be drawn and
    // compared. ⭐ What *is* still discarded is the grip's own `pressFace`: a Pioneer's grip
    // is being released, and a stale face on a dead grip is the kind of thing a later rule
    // picks up by accident.
    const pioneerFaceId = pioneerGrip.pressFace.faceId;
    // ⛔⛔⛔ **THE FACE CLEARED IS THE *TRANSIENT* GRIP'S — AND `D87` MOVED WHICH FINGER THAT IS.**
    //
    // ⭐ The rule has never changed: *a transient grip must not leave a stale face behind.* ⛔ Under
    // `D67` the transient finger was the FOLLOWER's second touch, so this line cleared
    // `followerGrip`. Inverted, the transient finger is the **PIONEER's** — and the line went on
    // clearing the follower, which is now the finger that must KEEP its face for the whole hold.
    //
    // ⚠⚠ **IT COST THE UNDO** (the owner, 2026-09-25: *"if I press again a followerFace and its
    // pioneerface, the follower simply rotates"*). With the held grip's face wiped, `pressMeaning`
    // read `heldPressFace = null` against a live `alignedFaceOfHeld`, so *this body already
    // follows this face* could never be true and `D39`'s re-press never undid anything — and the
    // NEXT press on the same hold died at `align: press resolved no face` instead.
    //
    // ⭐⭐ `METHOD`: **the comment right above this line already warned about it, aimed the other
    // way** — *"clearing the held grip's face instead would make the second Follower fail"*. An
    // inversion does not have to touch a line to break it; it only has to change which finger the
    // line names. ⛔ Nothing here can go red, which is why it reached the glass.
    transientGrip.pressFace = null;
    // ⚠ KEYED BY OBJECT, so it survives the fingers moving on — `alignMode` alone is the
    // ACTIVE alignment's mode and would recolour an older object's highlight.
    alignModeOf.set(followerId, mode);
    // ⛔ And WHO it was aligned to, which the constraint itself does not record.
    // ⚠ `link` MOVES an existing link rather than adding a second — a body has one alignment,
    // so re-aligning it must remove it from its previous Pioneer's set.
    // ⛔⛔⛔ **THE BASELINE IS A *WORLD* ORIENTATION — AUDIT FIX, 2026-09-17.**
    //
    // ⚠⚠ It stored `local.orientation` and the cascade compares it against
    // `worldPlacementOf(…).orientation`. ⭐ The two are IDENTICAL while every body has
    // `parent === null`, which is the whole scene today — so the mismatch is invisible and
    // waits for `3D2`. ⛔ The first PARENTED Pioneer then reads as *turned* on frame one, by
    // its parent's entire orientation: every `SNAPSHOT` follower releases itself and every
    // `FOLLOW` follower spins, with nothing having moved.
    // ⭐⭐ `METHOD`: *a quantity measured in someone else's frame is a different quantity.*
    // The parameter now says which frame it wants, in `AlignmentLinks` as well as here.
    // ⚠ `link` now REFUSES a cycle itself (audit, 2026-09-17), so the verdict is checked
    // rather than discarded. ⛔ It cannot fire here — `wouldCycle` was asked above and acted on
    // with the owner's *"break the initial alignment instead"* policy — which is exactly why a
    // silent `false` would be the worst outcome: the constraint would be pushed and the body
    // would have no link, so nothing would ever release it and `prune` would not know.
    const linked = links.link(
      followerId,
      pioneerId,
      pioneerFaceId,
      worldPlacementOf(world, pioneerId)?.orientation ?? IDENTITY,
      // ⭐ `D69` — the move cascade's baseline, read at the same instant as the orientation so
      // the two halves of the link describe ONE moment.
      worldPlacementOf(world, pioneerId)?.position ?? [0, 0, 0],
    );
    if (!linked) {
      lastVerdict = `align: REFUSED — ${followerId}→${pioneerId} would close a cycle`;
      hudDirty = true;
    }
    paintHighlightColours();
    // ⛔⛔⛔ **THE MODE NO LONGER SWITCHES — the owner removed that clause, 2026-09-16:**
    //
    // > *"the mode shall not switch automatically to translation mode after an alignment in
    // > rotation mode. It makes the game too complicated. Ignore this rule... This will also
    // > allow me to test the flick after an alignment."*
    //
    // ⭐⭐ AND IT COSTS ME AN ARGUMENT I HAD LIKED: the tap's two meanings *coincided* while
    // the alignment ended in `TRANSLATE`, because that was the same flip `D28`'s toggle would
    // have made — so both rules could own the gesture without a hand seeing a contradiction.
    // ⛔ They no longer coincide: **the alignment CONSUMES the tap** and the mode stays
    // `ROTATE`. That is a real override of `D28`, not a coincidence, and it is the owner's.
    // ⚠ Nothing is trapped by it: a tap on empty space or on the held object still toggles,
    // so `TRANSLATE` is one tap away — and staying in `ROTATE` is what makes the rotation
    // reset testable straight after an alignment.
    lastVerdict =
      `align: ${mode} ${followerId}/${followerFaceId} → ` +
      `${pioneerId}/${pioneerFaceId} · ${solved.freeDof} DOF free · stays ${behaviour}`;
    return true;
  };

  /**
   * ⭐⭐⭐ THE SELECTED FACE, DRAWN — `IN3` rule 2's only visible effect.
   *
   * ⛔⛔ WITHOUT IT, RULE 2 IS UNJUDGEABLE. Selecting a face changes nothing a user can see
   * until 2ter or 2quater exist, so *"did it pick the face I aimed at?"* has no answer on the
   * glass — and every rule built on top would inherit that doubt. ⭐ The HUD prints the face
   * id and the pick's cosine; this is the same answer where the hand is looking.
   *
   * ⚠ A thin quad, not a material change: a per-face material needs submeshes, which is a
   * mesh-authoring decision `3D4` has not made yet. ⛔ `DOUBLESIDE` on purpose — Babylon's
   * plane winding faces one way and which way is exactly the sort of engine detail that
   * would make the highlight invisible from one side only, found late and on a device.
   */
  /**
   * ⭐⭐⭐ **ONE FOLLOWER QUAD PER ALIGNED OBJECT, NOT ONE IN TOTAL** (the owner, 2026-09-17:
   * *"when an object is aligned, always maintain its FollowerFace highlighted (even if the
   * touchpoints later select other objects) until its alignment is broken"*).
   *
   * ⛔⛔ **THE OLD DESIGN COULD NOT EXPRESS THE STATE THE OWNER WANTS TO SEE.** There was a
   * single quad driven by a single `selectedFace` record, so aligning a SECOND object silently
   * wiped the FIRST object's highlight — defeating the exact purpose: *"this will help keep
   * track of which objects are aligned"*, plural.
   *
   * ⭐⭐ **AND THE POOL IS DRIVEN ENTIRELY BY THE MODEL.** Each frame every object is asked
   * `alignedFaceOf(world, id)`; a non-null answer gets a quad on that face and nothing else
   * does. ⛔ So there is no lifetime to manage and no cleanup path to forget: the instant a
   * shake, a re-tap or a rotation reset evicts the constraint, the highlight has nothing to
   * draw. ⚠ A remembered per-object record would be a second source of truth for a fact the
   * constraint stack already holds, free to disagree after any eviction.
   */
  /**
   * ⭐⭐⭐ **THE ALIGNED BODY'S FULL CONTOUR, IN THE ALIGNMENT'S COLOUR** (the owner,
   * 2026-09-17: *"when an object is aligned, on top of the blue or orange face, highlight the
   * full contour with blue or orange"*).
   *
   * ⭐ So an aligned body is now readable two ways at once: the FACE says *which face carries
   * the alignment*, and the BODY outline says *this whole thing is aligned* — visible from any
   * angle, including one where the aligned face is turned away from the camera. ⚠ That is the
   * case the face quad alone could not cover, and with `L × 2L × 3L` bodies at arbitrary
   * orientations it happens constantly.
   *
   * ⛔⛔ **IT IS DRAWN AT A LARGER SCALE THAN `A16`'s WHITE CAPTURE CONTOUR, ON PURPOSE.** Both
   * are box outlines on the same body and a body can be **aligned AND captured at the same
   * time** — which is in fact the normal state while docking, since `A16` requires an
   * alignment. ⚠ At equal scale the two would z-fight into a dashed mess and neither colour
   * would be legible. ⭐ 1.06 for this one against 1.02 for the white: they nest, and both read.
   */

  /**
   * ⚠⚠ **THE ONE THING THAT STILL HAS TO BE REMEMBERED: THE MODE.**
   *
   * ⛔ `SNAPSHOT` vs `FOLLOW` is not in the constraint — the stack records *which face onto
   * which world direction*, not *by which gesture*. ⭐ So the FACE is derived and only the
   * COLOUR is remembered, keyed by object. ⚠ Entries are PRUNED every frame against
   * `alignedFaceOf`, so a stale one cannot outlive its alignment even though it is state.
   */
  const alignModeOf = new Map<ObjectId, AlignMode>();

  /**
   * ⭐⭐⭐ **WHO IS ALIGNED TO WHOM** — `core/alignment_links.ts`, a two-way index.
   *
   * The owner, 2026-09-17: *"for each aligned object, track its pioneer object. If the said
   * pioneer object is later shaken, the alignment of the aligned object shall be released …
   * when I shake the pioneer object it shall release all the follower objects"*, then *"make
   * sure the tracking of pioneer and follower objects can be later scaled when there are
   * several objects in the scene"*.
   *
   * ⛔⛔ **IT IS REMEMBERED BECAUSE IT CANNOT BE DERIVED.** A `FACE_ALIGN` stores a frozen world
   * DIRECTION, not a reference to another body — that is what lets an alignment survive the
   * Pioneer moving away or being deleted. ⚠ So *"which body did this come from"* is genuinely
   * absent from the model.
   *
   * ⭐⭐ **AND IT IS RECONCILED AGAINST THE MODEL EVERY FRAME** (`links.prune`), so the one
   * remembered fact cannot outlive the constraint that justifies it. ⛔ That is what removes
   * the need for every release path — shake, re-tap, rotation reset, eviction — to remember to
   * call `unlink`.
   */
  const links = new AlignmentLinks();

  // ⛔⛔⛔ **`bootAlignment` STOOD HERE AND IS DELETED** — the owner, 2026-09-25: *"boot the scene
  // with no aligned object."* ⚠ It pushed a `FACE_ALIGN` on `objectB` toward `objectA`'s bottom
  // face and linked the pair as `SNAPSHOT`, so the scene opened with a cyan/amber pair already on
  // the glass. ⭐ Deleted, not disabled (`D28`/`D40`: *a dormant fork is a trap*).
  //
  // ⭐⭐ **IT NEVER MOVED ANYTHING**, which is what makes this a state change and not a visual one:
  // both parts boot square, `A`'s bottom is `−y`, `B`'s top is `+y`, and the alignment is
  // anti-parallel — so the constraint was satisfied the instant it was pushed.


  const releaseAlignmentOf = (followerId: ObjectId): void => {
    // ⚠ A release can be decided by the render loop (a turned Pioneer, a prune), where no
    // pointer event follows to repaint the HUD. See `hudDirty`.
    hudDirty = true;
    const ev = evictObjectConstraints(world, followerId);
    world = ev.world;
    cancelAlignAnim(followerId);
    links.unlink(followerId);
    alignModeOf.delete(followerId);
    // ⚠ The ACTIVE-alignment records are cleared only if this body is the one they name: the
    // tap, shake and flick rules read them, and wiping them for an unrelated body would make
    // the next gesture on the ACTIVE follower behave as though nothing were aligned.
    if (selectedFace?.objectId === followerId) {
      selectedFace = null;
    }
  };

  /**
   * ⭐⭐⭐ **THE PIONEER's CONTOUR** — *"the PioneerFace contour shall be highlighted"*.
   *
   * ⛔⛔ A CONTOUR AND NOT A FILL, BECAUSE THE TWO FACES ARE NOT THE SAME KIND OF THING. The
   * Follower is what MOVED and carries the constraint; the Pioneer is only what it was aimed
   * at, and its object is untouched. ⭐ One filled quad and one outline say that without a
   * legend — and the owner asked for exactly that distinction.
   *
   * ⚠ A closed square of LINES, unit-sized and scaled: `CreateLines` gives a `color` and no
   * material to tune, and its one-pixel width is a WebGL limit rather than a choice. ⛔ If a
   * hand finds it too faint the answer is `GreasedLine`, not a thicker hack — recorded so the
   * next session does not rediscover the limit.
   * ⚠ `isPickable = false` and NOT `orbitCandidate`, for the same two reasons the fill has:
   * an instrument must not intercept the picks it describes, nor move the barycentre it is
   * drawn near.
   */
  /**
   * ⭐⭐⭐ **THE COLOURS ARE THE READOUT FOR THE MODE** — the owner's instruction, and the only
   * way a hand can see which of the two an alignment is.
   *
   * ⛔ `SNAPSHOT` (single tap): the Follower is **cyan** and the Pioneer **amber** — two
   * colours, because the two faces are related only by the instant the tap happened.
   * ⛔ `FOLLOW` (double tap): the Follower takes the Pioneer's **amber** — one colour, because
   * they now move as one thing.
   * ⚠⚠ **THIS COMMENT SAID *"never per frame"* AND THE RENDER LOOP HAS DONE EXACTLY THAT
   * SINCE `A18`** — corrected by audit, 2026-09-17. The per-frame pass covers every aligned
   * body and writes only on CHANGE, so it is not a second unguarded writer; but *never per
   * frame* was simply false, and a reader trusting it would conclude this function is the only
   * thing keeping the colours right.
   * ⭐ What it is actually FOR: making a `SWITCH` visible in the same event that caused it,
   * rather than one frame later. ⚠ The two agree by construction because they compute `want`
   * the same way, from `alignModeOf`.
   */
  const paintHighlightColours = (): void => {
    // ⚠ EVERY aligned object, not just the active one: a body aligned in `FOLLOW` earlier must
    // keep reporting `FOLLOW` after the fingers move on, or the colour would describe the most
    // recent gesture instead of the relationship it names.
    for (const [key, q] of faceMarkers) {
      const id = key.slice(0, key.indexOf("/"));
      const mode = alignModeOf.get(id);
      const want = mode === "FOLLOW" ? PIONEER_COLOUR : FOLLOWER_COLOUR;
      q.mat.emissiveColor.copyFrom(want);
      const o = outlines.get(id);
      if (o !== undefined) o.align.color.copyFrom(want);
    }
  };
  /**
   * ⭐⭐⭐ **EVERY OUTLINE A BODY CAN WEAR, BUILT FROM ITS OWN MESH EDGES** (`D50`).
   *
   * ⛔⛔ **ALL THREE USED TO BE A UNIT BOX SCALED TO A DIMENSIONS TABLE.** For the boot
   * cuboids that is indistinguishable from the mesh, which is exactly why it survived two device
   * passes — and for an imported part it is simply the wrong shape. ⭐ Each is now the body's
   * own hard edges, offset outward by a different amount so the three nest and stay tellable
   * apart.
   *
   * | outline | offset | means |
   * |---|---|---|
   * | white **body** | a hair | *this body is in a capturable pair* |
   * | cyan/amber **alignment** | a little more | *this body is aligned*, and in which mode |
   * | white **shell** | **half the capture offset** | *another surface this near will capture* |
   *
   * ⚠ The two small offsets are fractions of the body's own span, so a plate and a part both
   * get outlines that read — one absolute lift would vanish on the plate and swamp a part.
   */
  /**
   * ⭐⭐⭐ **AN OUTLINE BUILT FROM A BODY'S HARD EDGES** — real mesh edges, as a LINE LIST.
   *
   * ⛔⛔ **A LINE LIST, NOT A POLYLINE, AND NOT THE EDGE RENDERER.** Babylon's edge renderer
   * notches at every corner: `createLine` emits one quad per edge and `line.vertex` widens each
   * quad in screen space, so the wedge where two edges meet is empty — which is exactly what a
   * hand reported as *"the faces are outlined but the corners are left out"*. ⭐ GL lines have
   * no width expansion at all, so corners close by construction.
   * ⚠ The price is that the width is not adjustable, which is why the width slider went with it.
   *
   * ⭐ `instance` reuses the buffers when the vertex count is unchanged — always true for one
   * body — so rebuilding the shell every frame allocates nothing.
   */
  const edgeLines = (
    name: string,
    topo: MeshTopology,
    points: readonly Vec3[],
    colour: Color3,
    existing: LinesMesh | null,
  ): LinesMesh => {
    const lines = topo.edges.map(([a, b]) => {
      const pa = points[a] ?? ([0, 0, 0] as Vec3);
      const pb = points[b] ?? ([0, 0, 0] as Vec3);
      return [
        new Vector3(pa[0], pa[1], pa[2]),
        new Vector3(pb[0], pb[1], pb[2]),
      ];
    });
    if (lines.length === 0) lines.push([Vector3.Zero(), Vector3.Zero()]);
    const m = CreateLineSystem(
      name,
      existing === null
        ? { lines, updatable: true }
        : { lines, updatable: true, instance: existing },
      scene,
    );
    m.color = colour.clone();
    m.isPickable = false;
    return m;
  };

  const BODY_OUTLINE_FRACTION = 0.005;
  const ALIGN_OUTLINE_FRACTION = 0.02;
  interface BodyOutlines {
    readonly body: LinesMesh;
    readonly align: LinesMesh;
    shell: LinesMesh;
  }
  const outlines = new Map<ObjectId, BodyOutlines>();
  const spanOf = (t: MeshTopology): number => {
    let span = 0;
    for (const p of t.positions) {
      span = Math.max(span, Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]));
    }
    return span > 0 ? span : 1;
  };
  const outlinesFor = (id: ObjectId): BodyOutlines | null => {
    const hit = outlines.get(id);
    if (hit !== undefined) return hit;
    const topo = topoOf.get(id);
    const body = meshOf.get(id);
    if (!topo || !body || topo.edges.length === 0) return null;
    const sp = spanOf(topo);
    const mk = (name: string, h: number, colour: Color3): LinesMesh => {
      const m = edgeLines(name, topo, offsetPositions(topo, h), colour, null);
      m.parent = body;
      m.isVisible = false;
      return m;
    };
    const made: BodyOutlines = {
      body: mk(
        `body-outline-${id}`,
        sp * BODY_OUTLINE_FRACTION,
        CAPTURE_COLOUR,
      ),
      align: mk(
        `align-outline-${id}`,
        sp * ALIGN_OUTLINE_FRACTION,
        FOLLOWER_COLOUR,
      ),
      shell: mk(
        `shell-outline-${id}`,
        sp * BODY_OUTLINE_FRACTION,
        CAPTURE_COLOUR,
      ),
    };
    outlines.set(id, made);
    return made;
  };

  /**
   * ⭐⭐ **THE SHELL IS REBUILT EVERY FRAME, BECAUSE THE OFFSET MOVES EVERY FRAME.**
   *
   * ⛔ It is a true mesh OFFSET, not a scale: every face plane moves out by the same distance,
   * which is what a capture threshold means. ⚠ A scale moves a far face further than a near one
   * and a thin axis less than a thick one, and the base plate is `0.3L` on one axis and `9L` on
   * another. ⭐ `edgeLines` reuses the existing buffers, so this allocates nothing per frame.
   */
  const showCaptureOutlines = (
    pair: readonly (ObjectId | null)[],
    offsetM: number,
  ): void => {
    const wanted = new Set<ObjectId>();
    for (const id of pair) if (id !== null) wanted.add(id);
    for (const id of wanted) {
      const o = outlinesFor(id);
      const topo = topoOf.get(id);
      if (!o || !topo) continue;
      o.shell = edgeLines(
        `shell-outline-${id}`,
        topo,
        offsetPositions(topo, offsetM / 2),
        CAPTURE_COLOUR,
        o.shell,
      );
      o.body.isVisible = true;
      o.shell.isVisible = true;
    }
    // ⚠ Retired by SET MEMBERSHIP, whatever stopped wanting them — the stale-highlight bug of
    // 2026-09-17 was the other pattern, and it produced two false defect reports.
    for (const [id, o] of outlines) {
      if (wanted.has(id)) continue;
      o.body.isVisible = false;
      o.shell.isVisible = false;
    }
  };

  /**
   * ⭐⭐⭐ **`A16`, EVALUATED ONCE PER FRAME.**
   *
   * ⛔⛔ **DERIVED, NEVER REMEMBERED.** The only value carried across a frame is the previous
   * target id, and only so a distance tie resolves in favour of the body already outlined —
   * hysteresis by memory rather than by a second threshold, which costs no tunable.
   *
   * ⚠ IN THE RENDER LOOP AND NOT IN THE POINTER HANDLER: a pair can come into or out of range
   * because the OTHER body moved (a sway nudge, an animation) with no pointer event at all, and
   * a highlight that only updated on input would then describe a stale scene.
   */
  let highlighted: HighlightVerdict = {
    pair: null,
    translating: false,
    inRange: false,
    gapM: null,
    offsetM: 0,
  };

  /**
   * ⭐⭐⭐ **THE OBJECT AXES — STATE ONLY. THE RULE IS `input/object_axes.ts`.**
   *
   * The owner, 2026-09-22: *"at scene boot, all object axis are updated based on camera
   * quaternion at scene boot"*, and thereafter they are re-decided **on a zone edge**.
   *
   * ⛔⛔ **WHY A MAP HERE AND NOT A FIELD ON `SceneObject`**: the axes are an INPUT-layer
   * concept — which way a finger pushes a body — and the model is the geometry every rule
   * agrees on. ⚠ Putting them on the model would give `frozen`, `attach` and the placement
   * writers a fourth thing to carry, for a quantity none of them reads.
   *
   * ⭐ A body with no entry uses the BOOT axes, which is the dictation's own default rather
   * than a stand-in: *all* object axes are the boot camera's until something moves them.
   */
  let bootObjectAxes: ObjectAxes | null = null;
  /**
   * ⭐ The gravity frame at scene boot — what a FREE body is turned about while `worldAxisB` is on.
   * ⚠ Filled beside `bootObjectAxes`, at the very bottom of this file, for the same reason.
   */
  let bootGestureFrame: GravityFrame | null = null;
  /** ⭐ The decision is `rotationFrame`'s, in `src/input`; this only supplies the two candidates. */
  const rotationFrameOf = (live: GravityFrame): GravityFrame =>
    rotationFrame({
      worldAxisB: cfg.worldAxisB === 1,
      bootFrame: bootGestureFrame,
      liveFrame: live,
    });

  // ⚠ `WORLD_UP` stood here and had exactly one reader: the in-zone basis, which `D82` deleted.
  /**
   * ⛔ `bootObjectAxes` is filled at boot, below the last `const` this file declares — a
   * lazily built one would capture *the camera at first drag*, which is not what was asked
   * for. ⚠ The final fallback exists only so a call before that point cannot read `null`;
   * `METHOD` — a guard that turns a broken state into silence is worse than a failure, and
   * this one at least returns a real basis.
   */
  // ⛔⛔ **ONE BASIS FOR EVERY BODY, INSIDE THE CAPTURE ZONE AND OUTSIDE IT** — `D82`, the
  // owner: *"Inside shall be the same as outside."* ⚠ There used to be a `Map<ObjectId,
  // ObjectAxes>` here, written only at the zone's edges; with the in-zone basis deleted nothing
  // writes it, so it is gone rather than left to look like state.
  // ⭐ The decision stays in `input/object_axes.ts` — this asks it, per call, so `worldAxisA` now
  // follows the live camera every frame instead of only at a crossing.
  const axesOf = (): ObjectAxes =>
    updatedObjectAxes({
      worldAxisB: cfg.worldAxisB === 1,
      bootAxes: bootObjectAxes ?? axesFromFrame(requireGestureFrame()),
      liveFrame: gravityFrame(screenFrame().viewAxis, WORLD_DOWN),
      previous: bootObjectAxes ?? axesFromFrame(requireGestureFrame()),
    });
  // ⚠ `lastTravelDir` stood here — the direction a body last ACTUALLY went. ⛔ The ray is aimed by
  // the INPUT now (the owner, 2026-09-23), so what persists between frames is the SHOWN axes and
  // their senses, which is state the aim is derived from rather than the aim itself.
  /**
   * ⭐⭐⭐ **WHAT THE CHANNELS ASKED FOR THIS FRAME**, per body — the direction the LeadingFace ray
   * is fired along. ⛔ The owner, 2026-09-23: *"You can lag the travel, but the input itself has
   * no lag. The gizmo repositioning should match the input, not the travel and its lag."*
   * ⚠ So it is the axis of the channel pushed HARDEST this frame — not a sum, which only reaches
   * the top face inside 29.4° of vertical on `objectB`, and not a memory of where the body has
   * been. ⛔ Consumed every frame.
   */
  /**
   * ⭐⭐ **WHICH AXES THE GIZMO IS SHOWING** — the owner, 2026-09-23: *"the direction is shown only
   * if the delta position triggers a translation in this direction."* ⛔ The decision is
   * `displayedAxes`'s; this only remembers its answer, so a pause does not blank the gizmo.
   */
  const gizmoAxes = new Map<ObjectId, GizmoChannels>();
  /**
   * ⭐ ONE place both `axisTravel` call sites report to — the holder's drag and the second
   * touchpoint's push. ⛔ The owner, 2026-09-23: *"make sure the delta position on the second
   * touch triggers the gizmo in the same way as the delta positions of the first touch."*
   */
  /** ⚠ WHICH CHANNELS pushed this body THIS FRAME, over both fingers. Consumed by the gizmo. */
  const frameAxisDriven = new Map<ObjectId, [boolean, boolean, boolean]>();
  /**
   * ⭐⭐⭐ **THE THREE TURN CHANNELS**, in the gizmo's own order after the translation axes:
   * `ROLL` grey, `YAW` purple, `PITCH` maroon.
   */
  const TURN_ROLL = 0;
  const TURN_YAW = 1;
  const TURN_PITCH = 2;
  type TurnAxes = [Vec3 | null, Vec3 | null, Vec3 | null];
  /**
   * ⭐⭐ **THE AXES THE BODY IS BEING TURNED ABOUT**, world, this frame, one slot per turn channel.
   *
   * ⛔⛔ **RECORDED WHERE THE TURN IS APPLIED, NEVER RE-DERIVED HERE.** An aligned body twists
   * about its constraint axis, a free one rolls about the gravity frame's depth and yaws and
   * pitches about that frame's up and right — four rules in three places. ⚠ A second opinion
   * computed at the gizmo would be free to draw a line the body is **not** turning about, which is
   * exactly the class of defect `scene.ts`-resident rules keep producing.
   */
  const frameTurnAxes = new Map<ObjectId, TurnAxes>();
  /** ⭐ The last axis each channel turned about — kept so a pause does not blank its line. */
  const gizmoTurnAxes = new Map<ObjectId, TurnAxes>();
  const noteTurnAxis = (
    id: ObjectId | undefined,
    kind: 0 | 1 | 2,
    axis: Vec3,
  ): void => {
    if (id === undefined) return;
    const cur = frameTurnAxes.get(id) ?? ([null, null, null] as TurnAxes);
    cur[kind] = axis;
    frameTurnAxes.set(id, cur);
  };
  const noteAxisTravel = (id: ObjectId | undefined, t: AxisTravel): void => {
    if (id === undefined) return;
    const p = frameAxisDriven.get(id) ?? [false, false, false];
    frameAxisDriven.set(id, [
      p[0] || t.driven[0],
      p[1] || t.driven[1],
      p[2] || t.driven[2],
    ]);
  };
  /**
   * ⭐⭐ WHAT THE LAST TRANSLATION ACTUALLY BOUGHT — reported by the rule, never recomputed
   * here. ⛔ `1.0` means the body is exactly under the finger; a large number means the plane is
   * nearly edge-on and a small push is going a long way; `EDGE-ON` means the exact mapping was
   * abandoned for the fixed-rate push. ⚠ Without these, *"it went much too far"* and *"it barely
   * moved"* are one symptom with two causes, and the camera pose is what separates them.
   */
  let lastTrackGain = 0;
  let lastEdgeOn = false;

  /**
   * ⛔⛔ **`CameraOffsetZoneEnter` — DECLARED, CALLED, AND EMPTY BY INSTRUCTION.**
   *
   * > *"if CameraOffsetZoneEnterSetupB is toggled on - launch the CameraOffsetZoneEnter
   * > method (we will define it later on)."* — the owner, 2026-09-22
   *
   * ⚠ It is here so that the behaviour lands in ONE named place when it is dictated, and so
   * the flag that gates it is genuinely read rather than declared debt. ⛔ It does nothing
   * today and the HUD says so — an empty method that pretended to act would be the dead
   * instrument shape this project met three times on 2026-09-16 alone.
   */
  /** ⚠ Last frame's range verdict — the EDGE is what fires the hook, never the level. */
  let zoneWas = false;
  /**
   * ⛔ The pair that was in range when the zone was ENTERED, so the EXIT edge can reach the
   * same two bodies. ⚠ At the exit `highlighted.pair` is already `null` — the verdict that
   * tells you a body has left is the one that no longer names it.
   */
  let zonePair: readonly ObjectId[] = [];
  let zoneEnterCalls = 0;
  const cameraOffsetZoneEnter = (): void => {
    zoneEnterCalls += 1;
  };

  /**
   * ⭐⭐⭐ **THE LEADING-FACE GIZMO** — *"Add a 3-axis gizmo on the center of the LeadingFace.
   * Update the gizmo position to follow the object translation. Update the gizmo directions to
   * align with object axis directions."* (the owner, 2026-09-22).
   *
   * ⛔⛔ **POSITIONED FROM THE MODEL, NOT FROM THE MESH, AND NOT PARENTED.** Two traps meet
   * here and they pull opposite ways:
   *
   *  * reading `mesh.getWorldMatrix()` gives Babylon's CACHED matrix, recomputed inside
   *    `scene.render()` — i.e. AFTER this — so every marker drew its object's PREVIOUS pose
   *    (defect 46, found by a hand);
   *  * parenting to the body fixes that for a POSITION, and would be wrong here for the
   *    DIRECTIONS: the object axes are WORLD directions, and a parented gizmo would turn with
   *    the body and stop pointing along them.
   *
   * ⭐ Reading the face centre out of the model (`object_model.ts` → `faceWorld`) escapes
   * both: the model is what every rule wrote this frame, and the axes are applied in world
   * space with no parent to rotate them.
   *
   * ⚠ **THREE SEPARATE LINE MESHES, ONE PER AXIS**, because `CreateLines` carries ONE colour —
   * and the colours are the channels: x, gravity, depth, in that order.
   */
  const GIZMO_AXIS_COLOURS = [
    new Color3(1, 0.35, 0.35),
    new Color3(0.4, 1, 0.45),
    new Color3(0.45, 0.6, 1),
    // ⭐⭐ **GREY, PURPLE, MAROON — THE THREE TURN AXES** (the owner, 2026-09-23): grey for the
    // ROLL (the second touchpoint's `dx`, or the first touchpoint's twist on an aligned body),
    // purple for the free YAW and maroon for the free PITCH.
    // ⛔ Deliberately NOT three more shades of the first family: those are DIRECTIONS the body is
    // being moved along and these are axes it is being TURNED about, which is a different kind of
    // fact and should not read as a fourth, fifth and sixth direction.
    new Color3(0.72, 0.72, 0.72),
    new Color3(0.72, 0.42, 1),
    new Color3(0.6, 0.22, 0.14),
  ] as const;
  interface AxisGizmo {
    readonly lines: readonly [
      LinesMesh,
      LinesMesh,
      LinesMesh,
      LinesMesh,
      LinesMesh,
      LinesMesh,
    ];
  }
  const axisGizmos = new Map<ObjectId, AxisGizmo>();
  /**
   * ⭐⭐ **THE WHITE CIRCLE AT THE GIZMO'S CENTRE** — the owner, 2026-09-23: *"add a white circle
   * at the gizmo center so I can identify the leadingface easily."*
   *
   * ⛔ A SPHERE rather than a disc, so it reads as a circle from every camera without being
   * billboarded, and it is sized in PIXELS through rule 6's own tracking factor — the same way the
   * capture offset is — so it keeps a constant apparent size as the camera comes in.
   * ⚠ Unlit and in the gizmo's own rendering group, because a marker that says *"this is the face
   * you are advancing on"* must not be shaded or occluded by the body it is describing.
   */
  const GIZMO_RING_PX = 11;
  /** ⭐ The MOVE ring: white, on the FollowerFace, shown while a translation channel is lit. */
  const GIZMO_RING_MOVE_COLOUR = new Color3(1, 1, 1);
  /**
   * ⭐ The TURN ring: grey, matching the roll axis's own colour, at the body's centre — the point
   * the turn is actually applied about (the owner, 2026-09-23).
   */
  const GIZMO_RING_TURN_COLOUR = new Color3(0.72, 0.72, 0.72);
  /**
   * ⭐⭐⭐ **HOW LONG A TURN AXIS IS, AS A FRACTION OF THE SHORTER SCREEN EDGE.**
   *
   * > *"for the gizmo axis of rotation (grey, purple, marron), make the axis length one third of
   * > the smallest of screen width or height, instead of full screen length."* — the owner,
   * > 2026-09-23
   *
   * ⛔⛔ **AND THE ASYMMETRY WITH THE TRANSLATION LINES IS THE POINT.** A translation line says
   * *the body will travel along here*, and a track has no end — full screen is the honest length.
   * A turn line says *the body is spinning about this*, which is a local fact about the body, and
   * a full-screen version of it reads as a direction of travel. ⚠ So the two families differ in
   * LENGTH as well as in colour, and either one alone identifies which kind of line is which.
   *
   * ⭐ The SHORTER edge, so the length is the same in portrait and in landscape.
   */
  const GIZMO_TURN_SCREEN_FRACTION = 1 / 3;
  /**
   * ⛔⛔ **A CIRCLE, NOT A DISC** — the owner, 2026-09-23: *"I asked you to insert a white circle
   * at the center of the gizmo, not a white disc."* ⚠ The first build was a small SPHERE, which
   * reads as a filled disc from every angle; this is an OUTLINE of 48 segments.
   *
   * ⭐⭐ **BILLBOARDED**, so it is a circle from every camera rather than an ellipse: a ring drawn
   * in a fixed plane would foreshorten to a line edge-on, which is exactly the pose a hand is in
   * when it is judging an approach. ⛔ Sized in PIXELS through rule 6's tracking factor, like the
   * capture offset, so it keeps a constant apparent size as the camera comes in — and in the
   * gizmo's own rendering group, because a marker that says *"this is the face you are advancing
   * on"* must not be occluded by the body it is describing.
   */
  const RING_POINTS: Vector3[] = Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return new Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
  });
  /**
   * ⭐⭐⭐ **TWO RINGS, ONE PER FAMILY** — the owner, 2026-09-23: *"there can be a grey ring for the
   * rotation and a white ring for the vertical translation if both are driven on an aligned
   * object."*
   *
   * ⛔⛔⛔ **AND THAT CORRECTS A PREMISE OF MINE THAT WAS SIMPLY FALSE.** I had built ONE ring that
   * switched colour, on the argument that a body is either being moved or being turned. It is not:
   * `pinnedSecondDrive` hands the second touchpoint **BOTH** of its axes when the held body is an
   * aligned follower (`heldIsAlignedFollower` → `"BOTH"` in `pinned_pioneer.ts`), so its `dx` rolls
   * and its `dy` lifts in the SAME frame — which is the exact configuration the owner named.
   * ⭐ `METHOD`: *a premise about what the product can do is a thing to READ OUT OF THE CODE, not
   * to infer from the rule you happen to be editing.*
   *
   * ⚠ The two anchors coincide on an UNALIGNED body, so the grey ring can sit exactly on the white
   * one there. That is honest — one pivot, drawn twice — and the alternative, hiding one, would
   * have made the marker's meaning depend on the alignment state.
   */
  const gizmoRings = new Map<ObjectId, LinesMesh>();
  const gizmoTurnRings = new Map<ObjectId, LinesMesh>();
  /**
   * ⭐⭐⭐ **THE TURN FAMILY DRAWS ABOVE THE MOVE FAMILY** — the owner, 2026-09-23: *"if the grey
   * rotation axis and the green rotation axis are aligned, make sure the grey axis is shown on top
   * of the green axis so the user can see both."*
   *
   * ⛔⛔ **AND IT HAS TO BE THE GROUP BOUNDARY, NOT A DEPTH TRICK.** The two lines are EXACTLY
   * collinear when the roll axis is vertical — same pixels, same depth — so which one wins is
   * decided by z-fighting, which is to say by nothing. ⭐ Babylon clears the depth buffer between
   * rendering groups, so group 3 draws over group 2 *by construction*: the same argument the x-ray
   * twin already rests on at the 1 → 2 boundary.
   * ⚠ Grey on top rather than green, because the grey line is a THIRD of the screen and the green
   * one crosses the whole of it — the short line is the one that vanishes inside the long one.
   * ⛔ 3 is Babylon's last group (`MAX_RENDERINGGROUPS` is 4). There is no room above it, so
   * anything that must outrank the gizmo later needs a different mechanism.
   */
  const GIZMO_MOVE_GROUP = 2;
  const GIZMO_TURN_GROUP = 3;
  const ringFrom = (
    pool: Map<ObjectId, LinesMesh>,
    id: ObjectId,
    colour: Color3,
    tag: string,
    group: number,
  ): LinesMesh => {
    const existing = pool.get(id);
    if (existing) return existing;
    const m = CreateLines(
      `gizmo-ring-${tag}-${id}`,
      { points: RING_POINTS },
      scene,
    );
    m.color = colour.clone();
    m.isPickable = false;
    m.renderingGroupId = group;
    m.billboardMode = Mesh.BILLBOARDMODE_ALL;
    m.isVisible = false;
    pool.set(id, m);
    return m;
  };
  const gizmoRingFor = (id: ObjectId): LinesMesh =>
    ringFrom(gizmoRings, id, GIZMO_RING_MOVE_COLOUR, "move", GIZMO_MOVE_GROUP);
  // ⚠ The grey ring rides with the grey line, or the two halves of one instrument would sit on
  // opposite sides of the boundary and the ring would vanish under a translation line.
  const gizmoTurnRingFor = (id: ObjectId): LinesMesh =>
    ringFrom(
      gizmoTurnRings,
      id,
      GIZMO_RING_TURN_COLOUR,
      "turn",
      GIZMO_TURN_GROUP,
    );

  const gizmoFor = (id: ObjectId): AxisGizmo => {
    const existing = axisGizmos.get(id);
    if (existing) return existing;
    const mk = (i: number): LinesMesh => {
      // ⚠ Two points, updatable: the geometry is rewritten every frame rather than the mesh
      // being disposed and rebuilt, which would churn a buffer per axis per frame.
      const m = CreateLines(
        `axis-gizmo-${id}-${i}`,
        { points: [Vector3.Zero(), Vector3.Zero()], updatable: true },
        scene,
      );
      m.color = GIZMO_AXIS_COLOURS[i]!.clone();
      // ⛔⛔⛔ **DEVICE-REPORTED, 2026-09-23**: *"when the follower is translating and followerface
      // is the leadingface, the gizmo does not show."* ⚠ Both are drawn on the SAME face, and the
      // face marker floats `MARKER_LIFT_M` (1.5 mm) ABOVE the surface while the gizmo starts ON
      // it — so the marker's filled quad covered it, and the two in-plane axes are exactly the
      // ones that vanish. ⛔ The x-ray twin made it certain rather than likely: group 1 draws
      // over everything in group 0 by construction.
      // ⭐⭐ **SO THE GIZMO GOES ABOVE BOTH, IN GROUP 2.** An instrument that says which way a
      // push will go must not be occludable by the thing it is describing — the same argument
      // the HUD rests on, and the CAD convention for a transform gizmo.
      // ⚠ The axis lengths are `1.5 ×` the body's own reach to that face, so a gizmo that sat
      // inside a large face was hidden ENTIRELY, which is why the report says *does not show*
      // rather than *is partly hidden*.
      // ⭐⭐⭐ **AND THE TURN LINES GO ONE GROUP HIGHER STILL** — the owner, 2026-09-23: *"if the
      // grey rotation axis and the green rotation axis are aligned, make sure the grey axis is
      // shown on top of the green axis so the user can see both."* ⛔ Exactly collinear means
      // exactly co-depth, and z-fighting decides nothing; the group boundary decides it.
      m.renderingGroupId = i < 3 ? GIZMO_MOVE_GROUP : GIZMO_TURN_GROUP;
      m.isPickable = false;
      m.isVisible = false;
      // ⛔ OUT of the barycentre candidate set, exactly as the orbit marker is: an instrument
      // that became a candidate would move the very centre it is drawn to describe.
      m.metadata = { orbitCandidate: false };
      return m;
    };
    const made: AxisGizmo = {
      lines: [mk(0), mk(1), mk(2), mk(3), mk(4), mk(5)],
    };
    axisGizmos.set(id, made);
    return made;
  };

  /**
   * Redraw every live gizmo, and hide the rest.
   *
   * ⛔ **WHILE THE DELTA POSITION IS NOT ZERO** is the owner's condition, and `A11`'s deadband
   * is what answers it: `step` is the travel that SURVIVED the dead radius, so a resting finger
   * emits nothing and the gizmo simply stops updating. ⚠ It is not hidden on a still frame —
   * a gizmo that blinked out whenever the hand paused would be unreadable.
   */
  const refreshAxisGizmo = (): void => {
    const live = new Set<ObjectId>();
    // ⛔⛔⛔ **ONE GIZMO ON THE SCREEN, NEVER TWO** — the owner, 2026-09-23: *"the gizmo shall not
    // be applied to a second object (pioneer object for example) as this confuses the reading on
    // the screen."* ⚠ The translation lines are FULL-SCREEN, so a second set crosses the first
    // everywhere and neither can be read back to its body. ⭐ Which body wins is `soleGizmoBody`'s, in
    // `src/input` — and the gizmo follows the finger that is actually pushing.
    const candidates: { id: ObjectId; driven: boolean }[] = [];
    for (const grip of held.values()) {
      const id = idOf.get(grip.mesh);
      if (id === undefined) continue;
      // ⛔⛔⛔ **NO GIZMO ON A FROZEN BODY — `D77`, AND IT HAD SILENTLY LAPSED.** The owner made
      // that a rule on 2026-09-23, enforced at a DEFINITION: `leadingFace` refused a frozen body,
      // because *the face a body is advancing on* presumes it advances. ⚠ `core/leading_face.ts`
      // was deleted the same day at his request, and the guarantee went with it — with **nothing
      // going red**, because the enforcement lived in the deleted file rather than in a test.
      // ⛔ The plate can still be HELD by a first touch (`D67`), so the gizmo was drawing a full
      // set of axes for a body whose transform `setWorldPlacement` refuses to change.
      // ⭐ `METHOD`: *deleting the file a rule lived in deletes the rule* — a definition-site
      // guarantee is only as durable as the definition.
      if (world.objects.get(id)?.frozen === true) continue;
      if (!isTranslatingMode(grip.mode) && !frameTurnAxes.has(id)) continue;
      if (candidates.some((c) => c.id === id)) continue;
      candidates.push({
        // ⚠ DRIVEN means a channel moved it this frame, not merely that a rule ran: the
        // translation path records a set every frame a finger is down, zeros included.
        id,
        driven:
          (frameAxisDriven.get(id)?.some(Boolean) ?? false) ||
          frameTurnAxes.has(id),
      });
    }
    const owner = soleGizmoBody(candidates);
    for (const grip of held.values()) {
      // ⛔⛔ **THE SECOND TOUCHPOINT'S MODE IS A TRANSLATION, AND THIS ASKED BY NAME** — the
      // owner, 2026-09-23: *"sometimes the gizmo does not show when the second touch is driving
      // the translation."* ⭐ The set lives in `input/grip_mode.ts`, and the mode itself is no
      // longer named after an axis.
      const id = idOf.get(grip.mesh);
      if (id === undefined) continue;
      // ⛔⛔ **A ROTATION SHOWS THE GIZMO TOO** — the owner, 2026-09-23: *"the gizmo does not exist
      // in rotation mode on aligned follower object. It may need to be created."* ⚠ Every turn
      // gesture happens in ROTATE mode, where the translating-mode gate hid the gizmo entirely and
      // the turn lines with it.
      if (!isTranslatingMode(grip.mode) && !frameTurnAxes.has(id)) continue;
      // ⛔ Every other eligible body is skipped here rather than hidden later: `live` then holds
      // one id at most, and the sweep below blanks all the rest with nothing added for it.
      if (id !== owner) continue;
      // ⭐⭐⭐ **WHICH DIRECTIONS TO SHOW** — the owner: *"the direction is shown only if the delta
      // position triggers a translation in this direction."* ⛔ The rule is `displayedAxes`'s, in
      // `src/input`, and it keeps the last non-empty answer so a pause does not blank the gizmo.
      const turning = frameTurnAxes.get(id) ?? null;
      // ⚠ Remembered PER CHANNEL: a body that yawed and then rolled keeps both lines aimed the way
      // each gesture actually turned it, and a pause blanks neither.
      const remembered =
        gizmoTurnAxes.get(id) ?? ([null, null, null] as TurnAxes);
      if (turning) {
        for (let k = 0; k < 3; k++)
          remembered[k] = turning[k] ?? remembered[k] ?? null;
        gizmoTurnAxes.set(id, remembered);
      }
      const channels = frameAxisDriven.get(id) ?? [false, false, false];
      const shown = displayedAxes(gizmoAxes.get(id) ?? null, [
        channels[0],
        channels[1],
        channels[2],
        turning?.[TURN_ROLL] != null,
        turning?.[TURN_YAW] != null,
        turning?.[TURN_PITCH] != null,
      ]);
      if (shown === null) continue;
      gizmoAxes.set(id, shown);
      // ⭐⭐⭐ **WHERE THE GIZMO SITS — THE FOLLOWERFACE'S CENTRE, ELSE THE BODY'S OWN** — the
      // owner, 2026-09-23: *"Remove the rule of the raycast of the delta position direction from
      // the object center to identify the leadingface, and keep the gizmo always positioned at the
      // center of the object by default, or the center of the followerface if there is one."*
      //
      // ⛔⛔⛔ **AND THE DELETED RULE IS THE LESSON.** A leading face computed from the travel
      // direction produced SEVEN device reports in one evening — it flared, it lagged, it jittered,
      // it sat on the wrong face — and every fix moved the trouble rather than removing it,
      // because the position was a function of a noisy per-frame quantity. ⭐ An anchor that does
      // not depend on the input **cannot** do any of those things. `METHOD`: *when a marker's
      // POSITION is derived from the input, every property of the input becomes a property of the
      // marker.*
      // ⚠ The FollowerFace is preferred because it is the face the body is being assembled BY, so
      // the axes are drawn where a hand is already looking.
      const followerFaceId = alignedFaceOf(world, id);
      const centre = worldPlacementOf(world, id)?.position ?? null;
      const anchor =
        (followerFaceId === null
          ? null
          : faceWorld(world, id, followerFaceId)?.centre) ?? centre;
      // ⛔ NO STAND-IN. A body the model cannot place shows no gizmo, exactly as `⛔NOSHAPE` shows
      // no capture shell — suppress rather than substitute.
      if (!anchor) continue;
      // ⭐⭐⭐ **THE TURN AXES GO THROUGH THE BODY'S CENTRE, ALWAYS** — the owner, 2026-09-23: *"the
      // gizmo axis for rotation shall pass through the object center, not the aligned face even if
      // there is one."*
      //
      // ⭐⭐ **AND IT IS THE GEOMETRY THAT ASKS FOR IT, NOT A PREFERENCE.** A turn is applied about
      // the body's own centre — `setModelOrientation` rotates the placement, it does not orbit the
      // FollowerFace — so an axis drawn through the face would have been a line the body is
      // demonstrably NOT spinning about, and the eye would have read the wrong pivot.
      // ⚠ The translation lines keep the FollowerFace: a TRAVEL direction is the same line
      // wherever it is drawn, so putting it where the assembly is happening costs nothing.
      const turnAnchor = centre ?? anchor;
      live.add(id);
      const axes = axesOf();
      // ⭐⭐⭐ **FULL-SCREEN LINES** — the owner: *"the blue, green and red lines shall extend the
      // full screen when they are shown."* ⛔ Drawn BOTH ways from the anchor, so each axis is a
      // line across the glass rather than a ray out of the body, and sized from the CAMERA so its
      // length is never a function of the body or of where it is going.
      const camDistTo = (p: Vec3): number =>
        Math.max(
          Vector3.Distance(camera.position, new Vector3(p[0], p[1], p[2])),
          0.05,
        );
      const span = camDistTo(anchor) * 20;
      // ⭐⭐⭐ **THE TURN AXES ARE A THIRD OF THE SHORTER SCREEN EDGE** (the owner, 2026-09-23), so
      // they are sized in PIXELS and keep a constant apparent length as the camera comes in —
      // rule 3's shape, and the same conversion the white ring and the capture shell already use.
      // ⛔ `camDist` rather than `camera.radius`: the orbit radius is the distance to the ORBIT
      // CENTRE, and a body away from that centre would have drawn a line of the wrong length.
      // ⚠ HALVED, because the line runs BOTH ways from the anchor and the owner named the whole
      // axis's length, not each arm's.
      const turnSpan =
        (trackingMetresPerPx(
          camDistTo(turnAnchor),
          camera.fov,
          canvas.clientHeight,
        ) *
          Math.min(canvas.clientWidth, canvas.clientHeight) *
          GIZMO_TURN_SCREEN_FRACTION) /
        2;
      // ⭐⭐⭐ **THE RING MARKS WHERE THE AXES MEET, AND IT FOLLOWS WHICHEVER FAMILY IS SHOWING** —
      // the owner, 2026-09-23: *"the ring of the rotation on aligned body shall be at the center of
      // the object. make it grey."*
      //
      // ⛔⛔ **ONE RING, NOT TWO**, because the two families are never drawn at the same time: the
      // translation channels only fire in a translating mode and the turn channels only in
      // `ROTATE`, and `displayedAxes` replaces a non-empty set wholesale. ⚠ So *which* it is
      // reading is never ambiguous, and a second ring would have been a permanent second dot on an
      // unaligned body — where the two anchors are the SAME point.
      // ⭐ White at the FollowerFace for a translation, grey at the body's centre for a turn: the
      // ring's colour says which family, and its position says which pivot.
      // ⭐ Each ring appears with ITS OWN family, at ITS OWN pivot — so an aligned body being
      // rolled and lifted at once shows both, and each says where the rule it belongs to acts.
      const placeRing = (ring: LinesMesh, at: Vec3, on: boolean): void => {
        ring.isVisible = on;
        if (!on) return;
        const m =
          trackingMetresPerPx(camDistTo(at), camera.fov, canvas.clientHeight) *
          GIZMO_RING_PX;
        ring.scaling.set(m, m, m);
        ring.position.set(at[0], at[1], at[2]);
      };
      placeRing(gizmoRingFor(id), anchor, shown[0] || shown[1] || shown[2]);
      placeRing(
        gizmoTurnRingFor(id),
        turnAnchor,
        shown[3] || shown[4] || shown[5],
      );
      const g = gizmoFor(id);
      // ⭐ The last three directions are the axes the body is being TURNED about, not ones it is
      // being moved along. ⚠ `null` until that channel has turned it, and a `null` hides its line
      // however the channel set reads — a line needs a direction, and there is no stand-in.
      const dirs = [
        axes.x,
        axes.gravity,
        axes.depth,
        remembered[TURN_ROLL],
        remembered[TURN_YAW],
        remembered[TURN_PITCH],
      ] as const;
      for (let i = 0; i < 6; i++) {
        const a = dirs[i];
        if (!shown[i] || !a) {
          g.lines[i]!.isVisible = false;
          continue;
        }
        // ⭐ The first three channels are directions of TRAVEL: full screen, through the
        // FollowerFace. The last three are axes of ROTATION: a third of the shorter edge, through
        // the body's centre — the point they actually turn it about.
        const travel = i < 3;
        const reach = travel ? span : turnSpan;
        const base = travel ? anchor : turnAnchor;
        const line = CreateLines(
          `axis-gizmo-${id}-${i}`,
          {
            points: [
              new Vector3(
                base[0] - a[0] * reach,
                base[1] - a[1] * reach,
                base[2] - a[2] * reach,
              ),
              new Vector3(
                base[0] + a[0] * reach,
                base[1] + a[1] * reach,
                base[2] + a[2] * reach,
              ),
            ],
            instance: g.lines[i]!,
          },
          scene,
        );
        line.isVisible = true;
      }
    }
    for (const [id, g] of axisGizmos) {
      if (live.has(id)) continue;
      for (const line of g.lines) line.isVisible = false;
    }
    // ⚠ The circles go with them: two readings of one state must appear and vanish together.
    for (const [id, r] of gizmoRings) if (!live.has(id)) r.isVisible = false;
    for (const [id, r] of gizmoTurnRings)
      if (!live.has(id)) r.isVisible = false;
    // ⛔ CONSUMED HERE, every frame: the gizmo must read the channels of THIS frame.
    frameAxisDriven.clear();
    frameTurnAxes.clear();
  };

  const refreshHighlight = (): void => {
    // ⭐ Held bodies in PRESS ORDER, de-duplicated — `router.objects()` is ordered by press, and
    // press order is the only ordering a hand controls. ⚠ Two fingers on the SAME body collapse
    // to one entry, which is right: that is a holder plus a `SECOND`, not a pair.
    const ids: ObjectId[] = [];
    for (const p of router.objects()) {
      const g = held.get(p.id);
      const id = g === undefined ? undefined : idOf.get(g.mesh);
      if (id !== undefined && !ids.includes(id)) ids.push(id);
    }
    // ⛔⛔ `D60` — THE HIGHLIGHT MUST SEE IT TOO, or the white contours would say the pair is
    // not being translated while the finger is translating it. ⚠ That is the readout-that-lies
    // shape, and the comment below is the reason it is passed rather than recomputed.
    // ⭐ Only meaningful with ONE held body: with two, `translatesOnDrag`'s first line already
    // fires and this adds nothing.
    const soleGrip = ids.length === 1 ? gripOfObject(ids[0]!) : undefined;
    highlighted = highlightedPair(
      world,
      ids,
      // ⛔ CONDITION 2, from the SAME function `grip.mode` is assigned from — one rule, one place.
      translatesOnDrag(
        ids.length,
        behaviour,
        soleGrip !== undefined && secondTouchOwnsRollAndDepth(soleGrip),
      ),
      {
        // ⭐⭐⭐ **RECOMPUTED EVERY FRAME FROM THE CAMERA** (`D49`, the owner: the offset *"shall
        // depend on the camera position and focus"*). ⛔ Not a constant and deliberately not
        // cached: a pinch changes `camera.radius` with no pointer event on any body, and an
        // offset that only updated on input would describe the zoom the hand had a moment ago.
        // ⚠ `camera.radius` is the distance to the orbit FOCUS, which is what was asked for.
        // ⛔⛔ **UNLESS AN APPROACH IS LIVE, IN WHICH CASE IT IS FROZEN** — the pitch half of the
        // swing moves the camera nearer or further (the ring surface has a different radius at
        // every elevation), so an offset that kept tracking would be decided by the swing it is
        // deciding. ⚠ Measured on the tablet: `172mm → 345mm` mid-approach before this.
        // ⭐ `approach_swing.ts` argues the feedback loop this prevents.
        captureOffsetM:
          swing?.offsetAtTriggerM ??
          captureOffsetM(
            cfg.captureOffsetMm,
            camera.radius,
            camera.fov,
            canvas.clientHeight,
          ),
        alignMatchRad: (cfg.alignMatchDeg * Math.PI) / 180,
      },
      highlighted.pair?.target ?? null,
      // ⛔ SURFACE TO SURFACE. ⚠ It reads the MODEL, not the display pose — the sway is
      // decoration and a highlight must not flicker with an animation nobody asked it to track.
      (a, b) => surfaceGap(world, a, b),
      // ⛔⛔⛔ `D62` — **A BODY MAY APPROACH ITS ALIGNMENT PARTNERS AND NOTHING ELSE.**
      //
      // > *"I want to do the same with Pioneer: currently, when I second touch an object which
      // > becomes Pioneer, it can white highlight if the Pioneer is close to a third object
      // > (which could be not the Follower): this should not happen. the white highlight should
      // > be reserved only for Pioneer-Follower duo."* — the owner, 2026-09-19
      //
      // ⚠ The first build restricted only the FOLLOWER, because that is the side the owner
      // named first — and a Pioneer has no Pioneer of its own, so it fell through to *the whole
      // scene* and lit up against any third body. ⭐ Both directions now, from the same two-way
      // index: **a Follower's partner is its Pioneer; a Pioneer's are its Followers.**
      //
      // ⛔ A body in neither role answers **empty**, which captures nothing — the owner's
      // *"reserved only for Pioneer-Follower duo"* taken at its word.
      // ⚠ The alignment index lives here, in the render layer, so the lookup is handed over
      // rather than reached for: `highlight.ts` stays engine-free and link-free.
      // ⛔ THE RULE IS `AlignmentLinks.partnersOf`, NOT A LAMBDA HERE. ⚠ It WAS a lambda, and a
      // mutant that reinstated the reported bug left all 944 vectors green — because a rule in a
      // render file is a rule nothing can interrogate.
      (id) => links.partnersOf(id),
    );
    // ⭐⭐⭐ **THE OFFSET RADIUS ZONE'S OWN EDGE — WHERE THE OBJECT AXES ARE RE-DECIDED.**
    //
    // > *"If the object has entered or exited an offset radius zone, Update the object axis
    // > directions as per below method and — if CameraOffsetZoneEnterSetupB is toggled on —
    // > launch the CameraOffsetZoneEnter method"* — the owner, 2026-09-22
    //
    // ⛔⛔ **IT IS THE SAME VERDICT THE WHITE CONTOURS ARE DRAWN FROM.** A second proximity
    // test of its own would be free to disagree with the contours a hand is looking at —
    // `D62`'s readout lesson, and the swing three lines below already obeys it.
    //
    // ⭐⭐ **ON AN EDGE, NEVER ON THE LEVEL, AND THAT IS WHAT BREAKS A CIRCULARITY**: in the
    // zone the basis comes from the leading face, the leading face comes from the travel
    // direction, and the travel direction comes from the basis. ⚠ Latching at the crossing
    // resolves it, and `object_axes.ts` argues why that is also the right feel — a basis
    // re-derived every frame would swing through 90° mid-push as the drag crossed a face.
    {
      const edge = zoneEdge(zoneWas, highlighted.inRange);
      zoneWas = highlighted.inRange;
      // ⛔⛔ **THE ZONE IS ENTERED BY PROXIMITY; THE DUO IS NAMEABLE ONLY WHILE A DRAG
      // TRANSLATES.** `inRange` is a distance and `pair` additionally requires condition 2, so a
      // hand can drift into range in ROTATE mode — the crossing happens, and there is nobody to
      // apply it to. ⚠ Without this the body would then be dragged on the OUTSIDE basis while
      // sitting inside the zone, and the edge that would have fixed it is already spent.
      // ⭐ So the pair is latched the moment it becomes nameable, and that counts as the entry.
      const named =
        highlighted.pair === null
          ? null
          : [highlighted.pair.subject, highlighted.pair.target];
      const becameNameable =
        highlighted.inRange && named !== null && zonePair.length === 0;
      if (named !== null && (edge === "ENTER" || becameNameable))
        zonePair = named;
      if (edge !== null || becameNameable) {
        // ⛔⛔⛔ **THE BASIS NO LONGER MOVES HERE** — `D82`, 2026-09-23, the owner: *"eliminate
        // this rule: Inside the offset radius the axes are the LeadingFace normal, gravity, and
        // their orthogonal. Inside shall be the same as outside."* ⭐ What remains on the edge is
        // the pair's identity, for the readout, and the owner's own hook.
        // ⛔ The HOOK fires on the CROSSING only, never on the late naming: the owner's trigger is
        // *"has entered … an offset radius zone"*, and a body that was already inside has not.
        if (edge === "ENTER" && cfg.cameraOffsetZoneEnterSetupB === 1)
          cameraOffsetZoneEnter();
        lastVerdict =
          `zone ${edge ?? "IN(named)"} — ${zonePair.length} body pair, axes UNCHANGED (D82)` +
          (edge === "ENTER" && cfg.cameraOffsetZoneEnterSetupB === 1
            ? `, CameraOffsetZoneEnter #${zoneEnterCalls} (no behaviour yet)`
            : "");
        // ⚠ Cleared AFTER the readout, or the line would report zero bodies on every exit.
        if (edge === "EXIT") zonePair = [];
      }
    }

    // ⭐⭐⭐ **THE APPROACH SWING ARMS AND DISARMS ON THE CAPTURE'S OWN EDGES** — the trial on
    // branch `1.0.18-`. ⛔ The owner's trigger is *"when the offset radius is crossed (= white
    // highlights toggle on)"*, so it is THIS verdict and not a second proximity test: a rule
    // keyed on its own copy of *near enough* would be free to disagree with the contours a hand
    // is looking at, and `D62`'s readout lesson is one line old.
    //
    // ⚠⚠ **THE TRIGGER GAP IS LATCHED, AND THAT IS LOAD-BEARING.** `captureOffsetM` is
    // recomputed every frame from the camera distance (`D49`) — and the swing is about to move
    // the camera. ⛔ A live offset would make the progress depend on the swing the progress is
    // driving. ⭐ A yaw-only lean keeps the orbit RADIUS constant so it would not in fact drift
    // today, but the latch means that stays true if the swing ever gains a radial component.
    if (highlighted.inRange && swing === null && highlighted.gapM !== null) {
      // ⭐⭐⭐ **CASE 2 — THE YELLOW TARGET SWITCHES TO THE PAIR'S BARYCENTRE** (the owner,
      // 2026-09-19), on the capture's rising edge and once only.
      // ⛔ *"same as if the switch of barycenter was triggered by the user input"* — so it goes
      // through `centreBlend.retarget` + `syncCentre`, exactly the two calls
      // `recomputeOrbitCentre` makes. ⚠ The camera therefore MIGRATES and the marker jumps at
      // once, which is rule 1's own behaviour; assigning the centre directly would put back the
      // jump that blend exists to remove.
      // ⚠⚠ It reads the MODEL, never the display pose — the sway is decoration, and an orbit
      // centre that moved with a wobble would make the camera chase an animation.
      if (cfg.approachRetargetsOrbit === 1 && highlighted.pair !== null) {
        const a = worldPlacementOf(world, highlighted.pair.subject)?.position;
        const b = worldPlacementOf(world, highlighted.pair.target)?.position;
        // ⚠ A body without a placement is refused rather than substituted: a barycentre computed
        // from one of the two would name a point neither body is at.
        if (a && b) {
          centreBlend.retarget(pairBarycentre(a, b));
          syncCentre();
        }
      }
      swing = {
        gapAtTriggerM: highlighted.gapM,
        // ⚠ The threshold this capture was judged against, frozen with it — they are one fact.
        offsetAtTriggerM: highlighted.offsetM,
        // ⛔ *"opposite to the dx movement"* — `approach_swing.ts` owns that negation, so the
        // one place the word OPPOSITE becomes arithmetic is a function with a vector on it.
        // ⛔⛔⛔ **AND IT IS THE TRAVEL OF *THIS* FRAME** — device-reported, 2026-09-20:
        // *"sometimes the yaw is to the left bottom, sometimes it is to the right up for the
        // same delta position x."* ⚠ The threshold can be crossed with no travel at all (a
        // press inside the band, a rotation moving the closest points, a pinch rescaling
        // `D49`'s offset), and then this is **zero** — which `swingSignFor` answers with
        // `null`, and a `null` sign is a swing of zero. ⛔ The old code answered `+1`.
        sign: swingSignFor(
          frameTravelRightM,
          frameTravelUpM,
          frameTravelDepthM,
        ),
        armTravelM: frameTravelRightM,
        armTravelUpM: frameTravelUpM,
      };
    } else if (!highlighted.inRange && swing !== null) {
      // ⚠ Pulling apart past the offset ends the approach. ⛔ Nothing has to be restored: the
      // progress is already back at 0 by the time the capture drops, so dropping the latch is
      // continuous rather than a jump. That is the whole argument for an additive offset.
      // ⭐⭐⭐ **ABSORB THE LEAN BEFORE DROPPING THE LATCH** — device-reported, 2026-09-19:
      // *"the camera shall not jump back … instead the camera shall keep its current
      // transform."* ⛔ The capture verdict is computed from the HELD bodies, so releasing the
      // Follower empties it and the latch drops — and the offset the camera was leaning on
      // vanished in one frame. ⭐ Absorbing makes the pose IDENTICAL, so there is nothing to
      // vanish and no special case for *which kind of ending this was*.
      // ⚠ At contact and on a clean separation the offset is already zero, so this is a no-op
      // there; doing it unconditionally is what keeps that from being a decision.
      //
      // ⭐⭐⭐ **AND THE ENDING ALSO HANDS EVERY LIVE GRIP A NEW BASIS** — the owner,
      // 2026-09-20: *"the delta position axis ends up being quite off vs the camera axis and
      // therefore the user feels a disconnect between the touch input axis and the follower
      // translation axis."* ⛔ `A7`'s frame is latched at the press against the **HAND's**
      // orbit, which is deliberate. The swing is the **GAME's** orbit, and `absorb` is the
      // instant that displacement becomes permanent — so it is also the instant the latch
      // stops protecting anything and starts lying. `approach_swing.ts` owns the decision.
      // ⚠ It moves nothing: a basis decides where the NEXT travel goes.
      const rings = orbit.ringElevationRad();
      const ending = endApproach(appliedSwingYaw, rings.bottom, rings.top);
      orbit.absorb(ending.yawRad, ending.vOffset);
      if (ending.rebaseFrames) rebaseGestureFrames();
      appliedSwingYaw = 0;
      swing = null;
      // ⚠ Forgotten with the approach, so the next one starts from its own first reading.
      swingAmp = null;
      swingFrozenProgress = null;
    }
    // ⛔⛔⛔ **CONSUMED HERE, EVERY FRAME, WHETHER OR NOT ANYTHING ARMED.** This one line is what
    // keeps the swing's direction a property of the approach: the arming edge above can only
    // ever see travel applied since the previous frame. ⚠ Zeroing it anywhere else — on a
    // press, on a release, at the end of the render loop — would leave a window in which a
    // stale direction is readable, which is the defect of 2026-09-20 in a smaller form.
    // ⭐⭐⭐ **A SWING THAT ARMED WITHOUT A DIRECTION TAKES THE FIRST ONE THAT ARRIVES** (defect
    // 65). ⛔ It must run BEFORE the accumulators are consumed below, and it reads the same travel
    // the arming edge would have read had it landed on this frame.
    if (swing !== null && swing.sign === null && highlighted.gapM !== null) {
      const signed = acquireSwingSign(
        swing,
        frameTravelRightM,
        frameTravelUpM,
        highlighted.gapM,
        frameTravelDepthM,
      );
      if (signed !== null) swing = signed;
    }
    frameTravelRightM = 0;
    frameTravelUpM = 0;
    frameTravelDepthM = 0;
    // ⛔ The contours ARE the state, drawn. They have no lifetime of their own, so they are
    // synced here and nowhere else.
    // ⚠ The SAME offset the rule just compared against — taken off the verdict rather than
    // recomputed here, so the contour and the threshold cannot disagree.
    // ⭐⭐ BOTH WHITES, ON ONE VERDICT AND ONE MACHINERY — the body's own edges at a hair, and
    // the same edges offset by HALF the capture distance. ⛔ They appear and vanish together:
    // two readings of ONE state, and a pair where only one showed would invent a state the rule
    // has not got.
    guardDraw("captureOutlines", () =>
      showCaptureOutlines(
        [highlighted.pair?.subject ?? null, highlighted.pair?.target ?? null],
        highlighted.offsetM,
      ),
    );
  };

  // ⚠ DIAGNOSTIC ONLY: a small marker at whatever §2 rule 1 chose to orbit around.
  // Without it the barycentre selection is invisible, and "it seems to orbit the right
  // thing" is not an observation. `IN3` deletes this along with the three placeholder
  // boxes. ⚠ It does NOT delete the rotation — see below.
  const centreMarker = CreateSphere(
    "orbit-centre-marker",
    { diameter: 0.012 },
    scene,
  );
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
  // ⭐⭐⭐ **THE RIGHT MOUSE BUTTON IS THE SECOND TOUCH** (the owner, 2026-09-25). ⛔ One call, at
  // Babylon's own pre-pointer seam: no DOM event is stopped or created, only `pointerType ===
  // "mouse"` is looked at, and the scene's gesture code below is untouched.
  attachMouseSecondTouch(canvas, scene, (notches) => {
    // ⭐⭐ THE WHEEL WRITES THE SAME `zoom` THE PINCH WRITES, through the same `applyCamera()` —
    // one zoom, not two. ⛔ Clamped on the multiplier, so scrolling past a limit cannot store zoom
    // the camera will never show (`input/mouse_wheel_zoom.ts`).
    const base = orbit.pose(1).radiusM;
    if (!(base > 1e-9)) return;
    zoom = wheelZoom(
      zoom,
      notches,
      cfg.cameraRadiusMinM / base,
      cfg.cameraRadiusMaxM / base,
    );
    zoomAtPinchStart = zoom;
    applyCamera();
  });
  // ⭐⭐ TUNABLES MAY BE OVERRIDDEN FROM THE URL, so a number can be A/B'd ON THE
  // DEVICE without a rebuild — e.g. `?rollFilterBeta=0&rollAngle=45`. Every value
  // here is an `IN5` placeholder, and `IN5` is a device procedure. ⛔ ONE config
  // object results; nothing keeps a second copy. See input/config_override.ts.
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
     * ⭐⭐⭐ **`D67` — DID THIS GRIP'S OWN PRESS COMPLETE A DOUBLE TAP?** The owner's route to
     * orange: *"the first touch shall be double tap without final release [on] the pioneer
     * object."* ⛔ Latched at the press, because `TapHistory` answers *would this pair* about the
     * instant the finger landed, and by the time a Follower is chosen the answer has moved on.
     * ⚠ It is a property of THE PIONEER'S grip; a Follower's own flag is never read.
     */
    pressWasDoubleTap: boolean;
    /**
     * ⭐ The pointer type that PRESSED this grip. ⛔ Read by one rule only —
     * `secondTouchOwnsRollAndDepth` — to learn that a mouse holder's second touch is always one
     * Shift away (`secondTouchAlwaysAvailable`).
     */
    pointerType: string;
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
    /**
     * ⭐⭐⭐ **`"TRANSLATE_2ND"` WAS `"DEPTH"` UNTIL 2026-09-23**, and the rename is the owner's:
     * *"the second finger should not set mode to depth since it is driving the translation along
     * gravity axis, not depth"* … *"or the name of the mode 'depth' is ill chosen."*
     *
     * ⛔⛔ It was named in `A10`, when that finger DID drive depth. `D75` moved it to **gravity**
     * and the name stayed — so the mode has been announcing the wrong axis ever since, on the HUD
     * and in every rule that read it. ⭐ The new name says what the mode IS (a translation, driven
     * by the second touchpoint) rather than which axis it happened to drive on the day it was
     * written, so it cannot go stale the next time the channels move.
     * ⚠ That staleness is not cosmetic: it cost **defect 55** (the swing hunting for
     * `"TRANSLATE"`) and the gizmo vanishing under the finger that was moving the body.
     */
    mode: "ROTATE" | "TRANSLATE" | "TRANSLATE_2ND" | null;
    /**
     * ⭐⭐ **FORK C** — the face THIS touchpoint's press landed on, in the object it carries.
     *
     * ⛔⛔ PER GRIP, NOT ONE GLOBAL, and that is forced by the rule: *"one touchpoint on first
     * object's hit face (FollowerFace) && tap on second object's hit face (PioneerFace)"*.
     * Two faces on two objects are live at the same instant, so a single `selectedFace` —
     * which is all `IN3` ever needs — cannot express the trigger. ⭐ The Follower is the OTHER
     * grip's face; the Pioneer is the tapping grip's own.
     * ⚠ `null` in fork A, and whenever the pick resolved no face.
     */
    pressFace: { faceId: string; cos: number } | null;
    /**
     * ⭐⭐⭐ **FORK C** — was an alignment pushed or replaced on this object DURING this
     * gesture? The owner's scoping of the rotation reset, and it cannot be answered by looking
     * at the state:
     *
     * > *"If the object was already aligned when the rotation was started, reset to the
     * > beginning of the rotation (therefore the alignment is conserved). If the alignment
     * > occurred during the rotation, reset the rotation (therefore this looses the
     * > alignment)."*
     *
     * ⭐ With the alignment older than the press, the recogniser's snapshot already satisfies
     * it, so restoring costs nothing. With the alignment made mid-gesture, the snapshot
     * predates it and restoring would leave the object disagreeing with its own constraint.
     */
    alignmentTouched: boolean;
    /**
     * ⭐⭐⭐ `D55` — **DID THIS TOUCHPOINT'S OWN *PRESS* MAKE AN ALIGNMENT?**
     *
     * ⛔⛔ WITHOUT IT THE GESTURE WOULD UNDO ITSELF. The alignment now fires on the way
     * DOWN, and the matching release is a `TAP` on the face that alignment names — which
     * `tapMeaning` reads, correctly and unchanged, as `UNALIGN`. ⚠ So a single tap would
     * align on the press and break it on the release, ~80 ms apart, and the glass would
     * show nothing at all having happened.
     *
     * ⭐ It also consumes `D28`'s movement-mode toggle, for the reason the tap path has
     * always consumed it: **one gesture, one consequence.**
     *
     * ⚠ Distinct from `alignmentTouched`, which lives on the **Follower's** grip and
     * answers the flick reset's *"was an alignment made during this gesture?"*. This one
     * lives on the **Pioneer's** grip and answers *"has this release already been spent?"*.
     * ⛔ Two questions, two fields — collapsing them would be the substituted-quantity
     * shape this file has been burned by twice.
     */
    pressActed: boolean;
    /**
     * ⭐⭐⭐ `A4`/`D13` — THE EVICTION SHAKE, ONE PER GESTURE, and it is the ESCAPE from
     * defect 41. ⛔ One per gesture because the detector carries the AXIS its first leg
     * established, and a fresh press is a fresh axis — `shake.ts` says so in its own header.
     */
    shake: ShakeDetector;
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
     * ⭐⭐⭐ `D57` — **WHICH WAY A SECOND TOUCHPOINT'S `dx` ROLLS THIS BODY, LATCHED AT THE
     * FIRST ROLL OF THE GESTURE**, keyed by anchor press order exactly as `anchorMotion` is.
     *
     * ⛔⛔ THE RATE IS NOW CONSTANT AND THE DIRECTION IS NOT COMPUTED PER FRAME. The owner's
     * rule is *"dx drives the roll, dy the depth, **whatever the orientation** — remove the
     * cos/sin projections"*, and the projection carried BOTH. ⚠ Only the rate could be made
     * orientation-free: a handedness has to be relative to something, and the constraint axis
     * can point toward the camera or away from it.
     *
     * ⭐⭐ **LATCHED, BECAUSE THE ONLY STABLE MOMENT IS THE PRESS.** Recomputed per frame the
     * sign would flip mid-drag as the axis swung through horizontal-on-screen — turning the
     * dead control the owner reported into an unpredictable one, which is worse. ⛔ `IN2`
     * latches every role at press and `A15` allows exceptions only on DISCRETE events; this is
     * the same doctrine one rule over: *a mode may be keyed on PRESENCE, never on MOTION.*
     */
    anchorRollSign: Map<number, 1 | -1>;
    /**
     * ⭐⭐ **WHICH WAY `dx` TWISTS AN ALIGNED BODY -- latched once per grip** (2026-09-22).
     * ⛔ The same doctrine as `anchorRollSign` one channel over: recomputed per frame the sign
     * flips mid-drag as the alignment axis swings through horizontal-on-screen.
     */
    twistSign?: 1 | -1;
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
      const p = mp
        ? new Vector3(mp.position[0], mp.position[1], mp.position[2])
        : mesh.position;
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

  /**
   * ⭐⭐ **SOMETHING THE RENDER LOOP DECIDED NEEDS TO REACH THE READOUT.**
   *
   * ⛔ Set by `markHudDirty`, which every writer of `lastVerdict` goes through, and consumed
   * once at the end of the frame. ⚠ It exists because the loop is a rule-runner as well as a
   * renderer — the cascade, the prune and the snaps all reach verdicts with no pointer event
   * behind them, and before 2026-09-17 those verdicts waited for the next touch to be shown.
   */
  let hudDirty = false;

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
  const orbit = new OrbitController(
    cfg,
    ORBIT_START_YAW_RAD,
    ORBIT_START_ELEVATION,
  );
  // ⭐ ONE zoom scalar, shared. Pinch scales the whole orbit SURFACE rather than
  // setting a radius directly, so rule 1 and rule 4 compose instead of fighting over
  // the same number. `1` is the rings as configured.
  /**
   * ⭐⭐⭐ **THE BOOT ZOOM — HALF THE MAXIMUM ZOOM-OUT** (the owner, 2026-09-17: *"zoom out the
   * camera at scene boot to place it at half its maximum zoom out so I can see the
   * rectangles"*).
   *
   * ⛔⛔ **DERIVED, NOT A MAGIC NUMBER.** *"Maximum zoom out"* is not a zoom value at all — it
   * is `cameraRadiusMaxM`, the clamp in `pinch.ts` that stops the camera leaving the scene. So
   * half of it is **`cameraRadiusMaxM / 2` metres of camera radius**, and the zoom that produces
   * it depends on the rig surface at the boot elevation. ⭐ `orbitOffset`'s radius and height both
   * scale linearly with zoom, so `radiusM(z) = z × radiusM(1)` and the zoom follows by division.
   * ⚠ A hard-coded 2.5 or whatever would silently stop meaning *half* the moment anyone touched
   * `cameraRadiusMaxM`, the rig rings, or `ORBIT_START_ELEVATION`.
   *
   * ⚠ Clamped to at least 1: the boot view may be pushed OUT but never pulled in closer than
   * the rig's own surface, which is what the orbit was designed around.
   */
  const ORBIT_START_ZOOM = (() => {
    const base = orbit.pose(1).radiusM;
    if (!(base > 1e-9)) return 1;
    return Math.max(1, cfg.cameraRadiusMaxM / 2 / base);
  })();

  let zoom = ORBIT_START_ZOOM;
  let zoomAtPinchStart = ORBIT_START_ZOOM;
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
      .filter(
        (m) =>
          m.isEnabled() && m.isVisible && m.metadata?.orbitCandidate === true,
      )
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
        return mp
          ? mp.position
          : ([m.position.x, m.position.y, m.position.z] as Vec3);
      });
    const c = orbitCentre(
      visible,
      {
        origin: [ray.origin.x, ray.origin.y, ray.origin.z],
        direction: [ray.direction.x, ray.direction.y, ray.direction.z],
      },
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
      // ⚠ THE BOOT ZOOM, NOT 1. ⛔ *"Home"* has to be the view the session opened with, or a
      // double tap would fly the camera somewhere the user has never seen — the same argument
      // this function already makes about the orbit CENTRE, applied to the zoom.
      zoom: ORBIT_START_ZOOM,
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

  /**
   * ⭐⭐⭐ **THE APPROACH SWING'S LATCH** — the trial on branch `1.0.18-`, `null` when the
   * capture is not live. ⛔ Armed on the RISING EDGE of the capture and dropped on the falling
   * one, so it is a property of the approach rather than of any gesture.
   * ⚠ It holds only what must NOT be re-read: the gap at the trigger, and which way to lean.
   */
  let swing: SwingLatch | null = null;
  /**
   * ⭐⭐⭐ **THE SCREEN-RIGHT TRAVEL APPLIED SINCE THE LAST FRAME**, in metres — and it is
   * **CONSUMED AND ZEROED BY `refreshHighlight` EVERY FRAME**, which is the whole fix for the
   * 2026-09-20 report (*"sometimes the yaw is to the left bottom, sometimes it is to the right
   * up for the same delta position x"*).
   *
   * ⛔⛔ It used to be `lastTranslateRightPx`: *the last non-zero travel ever applied*, reset by
   * **nothing** — not a lift, not a mode flip, not a new gesture. ⚠ And the capture's rising
   * edge needs no motion to fire, so an approach could arm on a press, a rotation or a pinch and
   * inherit a direction from a drag that had ended minutes earlier. ⭐ Zeroed every frame, the
   * only thing the arming edge can read is **the travel that crossed the threshold**.
   *
   * ⚠ It sums every translating grip's travel, not just the captured pair's: with two fingers on
   * two bodies the approach is whatever the pair's gap does, and singling one out would be a
   * rule this file is not allowed to own.
   */
  let frameTravelRightM = 0;
  /**
   * ⭐⭐ **THE VERTICAL HALF OF THE SAME FRAME'S TRAVEL** — device-reported, 2026-09-21:
   * *"when the follower enters the offset radius by a vertical translation (delta position dy)
   * the camera orbit swing is not triggered."*
   * ⛔ It is not there to AIM the swing — a yaw is symmetric about a vertical approach — but to
   * answer *was this crossing driven by a translation at all*, which is the question that
   * separates a vertical drag from a press, a rotation or a pinch.
   */
  let frameTravelUpM = 0;
  /** ⭐⭐ The ALONG-VIEW component of the body's travel — invisible on screen, and still travel. */
  let frameTravelDepthM = 0;
  /**
   * ⛔⛔ **THE SWING YAW THAT IS ACTUALLY ON THE CAMERA** — and the reason this exists is a
   * device report: *"not working. the camera does not orbit."*
   *
   * ⚠⚠ `applyCamera()` is called ONLY by camera events — the reset, startup, a pinch, a
   * slider and the orbit drag. **Nothing calls it while a finger is translating an object**,
   * which is precisely the whole duration of an approach. ⭐ So the swing was computed
   * correctly every frame and never reached the glass: the law was right and the WIRING was
   * missing, with a green suite either way because `scene.ts` has no vectors.
   *
   * ⭐⭐ Comparing against the last APPLIED value rather than re-applying unconditionally keeps
   * the render loop from writing the camera on frames where nothing about it changed — and
   * makes the return to zero a single write rather than a state nobody notices.
   */
  let appliedSwingYaw = 0;
  /**
   * ⭐⭐ `D63` — the SMOOTHED swing amplitude, and the clock it was last advanced on.
   * ⛔ `null` means *no approach*, so the next one starts from its own first reading rather
   * than from whatever the last approach happened to end on.
   */
  let swingAmp: { rad: number; atMs: number } | null = null;
  /**
   * ⛔⛔ The progress the swing was showing when a translation STOPPED driving it, captured
   * once. ⚠ It must be remembered rather than recomputed: `rebaseTriggerGap(gap, p)` with `p`
   * read from the LIVE gap is algebraically the identity — `gap/(1−(g0−gap)/g0) = g0` — so it
   * would do nothing at all, which is how the first version of this fix failed.
   */
  let swingFrozenProgress: number | null = null;

  /**
   * ⭐⭐ How far the camera is currently leaning out of its own orbit, in radians.
   * ⛔ `0` whenever there is no live approach — and `0` at both ENDS of a live one, which is
   * what makes *"back to its original position"* a fact rather than a restore that has to run.
   */
  /**
   * ⭐⭐ The swing's angle this frame, in radians — **one number, spent twice**.
   * ⛔ `0` whenever there is no live approach, and `0` at both ENDS of a live one.
   */
  const swingAngleNow = (): number => {
    if (swing === null) return 0;
    // ⭐⭐⭐ **DIVIDED BY THE FINGER'S SPEED** (the owner, 2026-09-19) — which cancels the
    // `dp/dt` in the lean's derivative and makes the camera sweep at the same rate whatever the
    // hand does. `approach_swing.ts` carries the derivation.
    // ⛔ THE SPEED IS THE RECOGNIZER'S OWN WINDOWED ESTIMATE, never a per-frame delta: §1.1
    // estimated a rate over one sample pair and made `STATIONARY` unreachable for every real
    // finger, silently, for weeks. ⚠ One definition of *how fast*, shared with the flick.
    // ⚠ With no holder the speed is unknown — `0` reads as *stopped*, which gives the maximum
    // swing and is what a hand that has let go should see: the widest look at the join.
    // ⭐⭐⭐ **THE SWING IS DRIVEN BY A TRANSLATION, AND BY NOTHING ELSE** — device-reported,
    // 2026-09-19: *"a rotation of the pioneer controls the rotation of the follower (which is
    // normal) but also controls the camera to orbit which is not wanted."*
    //
    // ⛔⛔ `p` is a function of the SURFACE GAP, and turning two boxes moves their closest
    // points — so `gapBetween` changes and the swing advanced although nothing approached.
    // ⚠ In `FOLLOW` both bodies turn, which is why the report names orange. ⭐ The owner's spec
    // is explicit: the swing accompanies *"the translation of the Follower"*.
    //
    // ⛔ So: no translating grip, no advance. The camera holds exactly where it is — it does not
    // spring home either, because springing home is also a motion the hand did not ask for.
    // ⛔ THE DECISION IS `swingDriverIndex`'s, not this file's — deleting the mode test here
    // reinstates the reported defect, and a mutant that did exactly that left the whole suite
    // green while it lived in a `.find()`.
    const grips = [...held.values()];
    const driver = swingDriverIndex(grips.map((g) => g.mode));
    const translating = driver >= 0 ? grips[driver] : undefined;
    if (translating === undefined) {
      // ⭐⭐ **AND THE TRIGGER GAP IS RE-BASED WHILE FROZEN**, so that whatever a rotation does to
      // the geometry the swing resumes at the angle it is already showing. ⛔ Without it the
      // first frame of the resumed drag would JUMP the camera to whatever the new gap implies —
      // trading a continuous unwanted orbit for a discontinuous one.
      // ⚠ The progress is captured ONCE, on the frame the translation stopped. Recomputing it
      // from the live gap is the IDENTITY and the fix would silently do nothing.
      swingFrozenProgress = freezeProgress(
        swingFrozenProgress,
        swingProgress(highlighted.gapM ?? 0, swing),
        false,
      );
      const rebased = rebaseTriggerGap(
        highlighted.gapM ?? 0,
        swingFrozenProgress ?? 0,
      );
      if (rebased !== null) swing = { ...swing, gapAtTriggerM: rebased };
      return appliedSwingYaw;
    }
    swingFrozenProgress = freezeProgress(swingFrozenProgress, 0, true);
    // ⛔⛔ **EVERY FINGER DRIVING THIS BODY, AS OF NOW** (defects 64 and 70). The holder's own
    // recognizer was the only speed consulted, so a second-finger push read `0` — which the
    // amplitude law answers with the WIDEST swing, bypassing both tuned dials. ⚠ And the window
    // used to end at each finger's last event, so a push that had already finished kept answering
    // *"fast"*. ⭐ The choice is `approach_swing.ts`'s, not this file's.
    const nowSpeedMs = performance.now();
    const speed = approachSpeedMmPerS([
      translating.rec.speedMmPerSAt(nowSpeedMs),
      ...[...translating.anchorMotion.values()].map((t) =>
        t.speedMmPerSAt(nowSpeedMs),
      ),
    ]);
    const target = swingAmplitudeRad(
      (cfg.approachSwingDeg * Math.PI) / 180,
      speed,
      cfg.approachSwingSpeedGain,
      cfg.approachSwingSpeedExponent,
    );
    // ⭐⭐⭐ **SMOOTHED — device-reported, 2026-09-19**: *"the orbit of the camera becomes
    // jittery … especially the swing speed exponent"*, and *"although the delta position movement
    // is quite regular"*. ⛔ That second sentence is the diagnosis: a steady hand with a stepping
    // camera means the STEPS ARE IN THE ESTIMATOR, not the input. `approach_swing.ts` carries
    // the arithmetic — the exponent multiplies the estimator's relative wobble.
    // ⚠ Smoothing `A` and never the speed: three other rules read that number, and there is one
    // definition of *how fast is this finger*.
    const now = performance.now();
    swingAmp =
      swingAmp === null
        ? { rad: target, atMs: now }
        : {
            rad: smoothAmplitude(swingAmp.rad, target, now - swingAmp.atMs),
            atMs: now,
          };
    return swingYawRad(
      swingProgress(highlighted.gapM ?? 0, swing),
      swingAmp.rad,
      swing.sign,
    );
  };

  /**
   * ⭐⭐⭐ **THE SWING IS NOW YAW *AND* PITCH** — the owner, 2026-09-19: *"also add a pitch
   * swing of the same value … the swing of the camera helps the user visualize the alignment in
   * the directions orthogonal to the translation approach."*
   *
   * ⛔ **ONE ANGLE, APPLIED ON TWO AXES.** *"The same value"* is taken literally: both halves
   * are the same `sin(π p)`, so the camera leaves on a diagonal and comes back along it — one
   * motion rather than two that happen to coincide. ⚠ They also therefore reach zero together,
   * which is what keeps *"back to its original position"* true for both.
   *
   * ⭐⭐ **AND THE SAME SIGN.** A dx approach is horizontal, so the two orthogonal directions it
   * cannot show are DEPTH (which the yaw reveals) and HEIGHT (the pitch). ⚠ Giving them opposite
   * signs would sweep the camera along the other diagonal — equally defensible, and a hand
   * decides. This is the one line to try if the motion reads oddly.
   */
  const applyCamera = () => {
    const a = swingAngleNow();
    const rings = orbit.ringElevationRad();
    // ⛔ THE PITCH TAKES THE MAGNITUDE, NOT THE SIGNED ANGLE — `pitchAngleFor` argues why: the
    // owner's expectation names ONE vertical direction for both drag directions.
    const pose = orbit.pose(
      zoom,
      a,
      pitchOffsetV(pitchAngleFor(a), rings.bottom, rings.top),
    );
    // ⛔ The rig gives a DIRECTION and a distance; the clamp may only shorten it.
    // Clamping the components independently would change the viewing ANGLE, which is
    // not what a near-plane guard is for.
    const wanted = pose.radiusM;
    const allowed = clampCameraRadiusM(wanted, cfg);
    const k = wanted > 1e-9 ? allowed / wanted : 1;
    camera.setPosition(
      orbitCentreM.add(
        new Vector3(
          pose.offsetM[0] * k,
          pose.offsetM[1] * k,
          pose.offsetM[2] * k,
        ),
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
    restore: (q) =>
      setModelPose(mesh, {
        position: requirePose(mesh).position,
        orientation: q,
      }),
  });

  /** The model's orientation for a held object. ⚠ Never the mesh's — that carries sway. */
  const modelOrientation = (mesh: AbstractMesh): Quat =>
    requirePose(mesh).orientation;

  const setModelOrientation = (mesh: AbstractMesh, q: Quat): void => {
    setModelPose(mesh, {
      position: requirePose(mesh).position,
      orientation: q,
    });
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

  /**
   * ⭐⭐⭐ **HAND EVERY LIVE GRIP THE BASIS THE CAMERA IS ACTUALLY AT NOW.**
   *
   * ⛔ Called on ONE event: the end of an approach that left the camera somewhere new
   * (`endApproach().rebaseFrames`). ⚠ Not on a timer, not while the swing is live — the
   * dictation is explicit that the approach axis *"is not updated by the camera orbit"*, and
   * during the lean the displacement is temporary and returns to zero on its own.
   *
   * ⛔⛔ **IT DOES NOT THROW, AND `requireGestureFrame` DOES.** That one is called from a PRESS,
   * where a refusal is the honest answer and lands on the gesture that asked. This runs inside
   * the render loop, where a throw would take the whole frame down for a camera the orbit rings
   * make unreachable anyway. ⭐ So a frame that cannot be built leaves the grip with the basis
   * it has — the previous behaviour, which is a real answer rather than an improvised one.
   */
  const rebaseGestureFrames = (): void => {
    const g = gravityFrame(screenFrame().viewAxis, WORLD_DOWN);
    if (!g) return;
    for (const grip of held.values()) grip.frame = g;
  };

  const screenFrame = (): ScreenFrame => ({
    right: asVec3(camera.getDirection(Vector3.Right())),
    up: asVec3(camera.getDirection(Vector3.Up())),
    viewAxis: asVec3(camera.getDirection(Vector3.Forward())),
  });

  const describe = (v: ReleaseVerdict): string => {
    const rule = v.rule === "NONE" ? "" : `  → ${v.rule}`;
    // ⛔⛔ THE `ROLLED BACK` READOUT IS GONE WITH THE ROLLBACK (owner, 2026-09-16).
    // ⭐⭐ It could no longer fire — `rolledBack` is a permanent `false` — and a HUD line
    // that cannot fire is the DEAD INSTRUMENT shape this project met three times on
    // 2026-09-16 alone: a retired quantity printed as though it were live, a slider that
    // changed nothing, and a detector that still vetoed. ⚠ The field stays on the verdict
    // (one consumer could exist tomorrow); the LINE goes, because the line makes a claim.
    const f = v.flick ? `  ${v.flick.axis}${v.flick.sign > 0 ? "+" : "-"}` : "";
    // ⭐ The measured lift speed is printed WHETHER OR NOT it passed, against the
    // threshold it was judged by. "The flick did not fire" is otherwise
    // unfalsifiable on a device: too slow a finger and a broken estimator look the
    // same. That ambiguity is what made the first rollback build feel inconsistent.
    const lift = `lift ${Math.round(v.liftSpeedMmPerS)}/${cfg.flickLiftSpeed}mm/s`;
    return `${v.kind}${f}${rule}  ${Math.round(v.durationMs)}ms  ${lift}`;
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
      const r: Vec3 = [
        mp.position[0] - c[0],
        mp.position[1] - c[1],
        mp.position[2] - c[2],
      ];
      const d = r[0] * push[0] + r[1] * push[1] + r[2] * push[2];
      const { minM, maxM } = depthLimits(cfg);
      const at =
        d <= minM + 1e-4 ? "  ⛔MIN" : d >= maxM - 1e-4 ? "  ⛔MAX" : "";
      // ⭐⭐ A10'S GATE, ON THE GLASS. The rule is invisible otherwise: a hand that gets
      // no depth cannot tell whether the holder was judged to be moving or whether the
      // anchor was. ⛔ It prints what the gate DECIDED, never a recomputation.
      // ⭐⭐⭐ A12 ON THE GLASS: which of the second finger's two corridors is open.
      // ⛔ The rule is invisible otherwise — a hand that gets no roll cannot tell whether
      // the holder was judged to be moving or whether its own x had not left the band.
      const second = [...grip.anchorMotion.values()][0];
      const corridor = second
        ? `${second.axes.x === "MOVING" ? "X→roll " : ""}${second.axes.y === "MOVING" ? "Y→depth" : ""}` ||
          "—"
        : "no 2nd";
      // ⭐⭐ AND THE MODE ITSELF, with the counts behind it. ⛔ Three device reports on this
      // rule were diagnosed by reasoning about code because the HUD could not answer *"what
      // does the build think is down right now?"* — an instrument is judged against the
      // question it exists to answer.
      // ⚠ A14's grace countdown was printed here and is gone with the grace itself
      // (`D28`): the mode no longer reads second-touchpoint presence, so there was nothing
      // left for it to protect — and a readout of a quantity the product no longer acts on
      // is the trap the retired roll line already cost us.
      const mode =
        `${grip.mode ?? "—"} obj=${router.objects().length} out=${router.outside().length}` +
        `${secondFingerOf(grip).present ? " 2nd" : ""}` +
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
      // ⚠ A12 RETIRED the circular roll, so this is always false and is kept only because
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
      tuning:
        tuning.applied.length === 0 ? "defaults" : tuning.applied.join(" "),
      tuningRejected: tuning.rejected,
      // ⭐ Each touchpoint in PRESS order with its latched role, e.g. `#1OBJ #2IGN`.
      // ⛔ `IGN` is the one that matters: it is the visible form of the IN8 decision.
      jump:
        lastJump === null
          ? "—"
          : `${lastJump.id} ${lastJump.mm.toFixed(0)}mm/${lastJump.deg.toFixed(0)}° ` +
            `(usual ${lastJump.usualMm.toFixed(1)}mm/${lastJump.usualDeg.toFixed(1)}°) ` +
            `${((performance.now() - lastJumpAt) / 1000).toFixed(0)}s ago — ${lastJumpVerdict}`,
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
            // ⭐⭐⭐ THE MOVEMENT MODE, and it is the least guessable state on the glass:
            // nothing VISIBLE says whether the next drag translates or rotates, because
            // presence does not decide it — a tap does. ⛔ So the readout is the only way a
            // device pass can tell *"the toggle did not fire"* from *"I toggled twice"*.
            // ⚠ Shown even with nothing held: the mode is the state the next press inherits.
            `  [${behaviour}]` +
            // ⭐ The lead at which a steady drag leaves NO gap, for the sliders as they
            // stand. ⛔ Printed rather than left in a doc: it moves whenever either of
            // the other two sliders moves, so a written-down number would go stale the
            // first time the owner touched them.
            `  lead ${cfg.translateLeadMs}/${(
              neutralLeadSec(
                cfg.translateInertiaMs / 1000,
                cfg.translateDampingRatio,
              ) * 1000
            ).toFixed(1)}ms` +
            // ⭐⭐⭐ **`A16`'s STATE — AND IT PRINTS WHICH CONDITION IS FAILING, NOT JUST THE
            // VERDICT.** ⛔⛔ Three conditions AND together, and on the glass a missing highlight
            // looks identical whichever one is false. ⚠ So *"I forgot to align"*, *"I am in
            // rotation mode"* and *"they are too far apart"* would be one symptom with three
            // causes — and this project has spent whole device passes on exactly that kind of
            // ambiguity. ⭐ Each condition gets a letter: **A**ligned, **T**ranslating,
            // **R**ange; upper case means satisfied, lower case means not.
            // ⚠ STRAIGHT FROM THE VERDICT — nothing recomputed here. `highlight.ts` returns its
            // reasons precisely so this line cannot become a second implementation.
            // ⛔ TWO FLAGS NOW, NOT THREE: the `A` for *aligned* is gone because the alignment
            // is no longer part of the approach. ⚠ Leaving it would have implied it still
            // gated the contour — the readout-that-lies shape, one letter wide.
            `  ${highlighted.pair === null ? "◇" : "◆"}` +
            `${highlighted.translating ? "T" : "t"}` +
            `${highlighted.inRange ? "R" : "r"}` +
            (highlighted.pair === null
              ? ""
              : ` ${highlighted.pair.subject}↔${highlighted.pair.target}`) +
            // ⭐⭐⭐ **THE GAP AND THE THRESHOLD IT WAS COMPARED AGAINST, BOTH IN MILLIMETRES.**
            //
            // ⛔⛔ **THE `R` FLAG ALONE STOPPED BEING ENOUGH THE MOMENT THE THRESHOLD BECAME
            // CAMERA-DEPENDENT** (`D49`). ⚠ *"Too far"* now has two causes that look identical
            // on the glass — the bodies really are apart, or the camera is close and the offset
            // has shrunk with it — and this project has spent whole device passes on one symptom
            // with two causes. ⭐ With both numbers printed, moving the camera and watching the
            // threshold move is a one-look confirmation that the rule is doing what was asked.
            // ⛔ STRAIGHT FROM THE VERDICT. A HUD that measured the gap itself would be a second
            // implementation, free to disagree with the product while both showed green — which
            // is the trap `highlight.ts` returns its reasons to avoid.
            (highlighted.gapM === null
              ? ""
              : ` gap=${(highlighted.gapM * 1000).toFixed(0)}/${(
                  highlighted.offsetM * 1000
                ).toFixed(0)}mm`) +
            // ⛔⛔ **A BODY WHOSE GEOMETRY COULD NOT BE READ, NAMED.** It has no shape, so it can
            // never capture and never be outlined — and every one of those is a SILENCE. ⚠ An
            // absent readout cannot be caught by looking at the screen (`METHOD`), and *this part
            // never highlights* would otherwise be indistinguishable from *I am holding it wrong*.
            // ⭐ Empty in every normal run, so it costs nothing until it matters.
            (shapelessBodies.length === 0
              ? ""
              : `  ⛔NOSHAPE(${shapelessBodies.join(",")})`) +
            // ⛔⛔ **A BODY WHOSE TAPER WAS REFUSED, NAMED, for the same reason one sentence up.**
            // `taperTop` returns null rather than substituting a shape (`LESSONS_CARRIED` §6), so
            // the body is still on the glass — as a BOX. ⚠ *The pyramid is a rectangle again* is
            // a thing a hand would notice and have no way to explain, and a silent fallback is
            // exactly the class this readout exists to close.
            (untaperedBodies.length === 0
              ? ""
              : `  ⛔NOTAPER(${untaperedBodies.join(",")})`) +
            // ⭐⭐⭐ **THE OBJECT AXES, ON THEIR OWN LINE** (2026-09-22). ⛔ Three things a hand
            // cannot see and would otherwise have to infer from how the body moved:
            //
            //  * **which rule is in force** — `WorldAxisB` frozen at boot, or the live camera;
            //  * **whether this body is in the zone**, because the basis SWAPS there and *the
            //    controls changed direction* is exactly what that feels like;
            //  * **which face is leading**, since the in-zone basis is built from its normal.
            //
            // ⚠ `METHOD`: an absent readout cannot be caught by looking at the screen — and this
            // rule's whole failure mode is *the body went somewhere I did not expect*, which no
            // amount of watching the body can attribute.
            `
axes      ${cfg.worldAxisB === 1 ? "WorldAxisB(fixed@boot: move+turn)" : "WorldAxisA(live camera: move+turn)"}` +
            ` ${cfg.translatePairing === 1 ? "PLANE" : "CHANNELS"}` +
            ` track=${lastTrackGain.toFixed(2)}×${lastEdgeOn ? " ⛔EDGE-ON" : ""}` +
            ` zone=${highlighted.inRange ? "IN" : "out"}` +
            (zonePair.length === 0 ? "" : `(${zonePair.join("↔")})`) +
            (cfg.cameraOffsetZoneEnterSetupB === 1
              ? ` enterHook=${zoneEnterCalls}(no-op)`
              : "") +
            // ⛔ Per HELD body, because that is the one whose axes are being used right now.
            [...held.values()]
              .map((g) => idOf.get(g.mesh))
              .filter((id): id is ObjectId => id !== undefined)
              .map((id) => {
                const a = axesOf();
                // ⚠ `lead=` stood here and named the face the body was advancing on. ⛔ There is no
                // such face any more: the gizmo sits on the FollowerFace, or on the body's centre.
                const ff = alignedFaceOf(world, id);
                const v = (x: readonly number[]): string =>
                  `${x[0]!.toFixed(2)},${x[1]!.toFixed(2)},${x[2]!.toFixed(2)}`;
                return (
                  `  ${id} x=(${v(a.x)}) g=(${v(a.gravity)}) d=(${v(a.depth)})` +
                  ` gizmo@${ff ?? "centre"}`
                );
              })
              .join("") +
            // ⭐⭐⭐ **THE HITFACE AND ITS OFFERS, ON THE GLASS** (the owner, 2026-09-24). ⛔ The
            // rule is invisible otherwise: a hand that sees no fuchsia cannot tell whether the
            // cone is too tight, the body is aligned already, or the mode is wrong.
            (() => {
              const hf = hitFaceNow();
              if (hf === null)
                return `  hit=— (needs an UNALIGNED held body with a resolved face)`;
              const n = candidateFacesNow().length;
              return cfg.pioneerCandidates !== 1
                ? `  hit=${hf.objectId}/${hf.faceId} fuchsia=OFF`
                : `  hit=${hf.objectId}/${hf.faceId} cone=${cfg.pioneerCandidateConeDeg}° fuchsia=${n}`;
            })() +
            // ⭐⭐⭐ **WHERE THE OUTLINE PIPELINE STOPS** — added 2026-09-18 after a device report
            // of *"no outline of any sort"*, which four different failures produce identically:
            // no topology, no outline meshes built, no face markers, or a throw in the draw path.
            // ⛔ `METHOD`: *an absent readout cannot be caught by looking at the screen* — so this
            // prints each stage's count rather than leaving one symptom with four causes.
            // ⛔⛔ **ON ITS OWN LINE, AND THE FIRST VERSION WAS NOT — which is why a hand
            // reported *"there is no such line"*.** The HUD box is `white-space: pre` with no
            // wrapping, so everything appended to this already-enormous line is simply CLIPPED at
            // the panel's right edge. ⚠ It was rendered the whole time and unreadable, which is
            // the *absent readout* failure wearing a different hat: the check I added to answer a
            // question could not be read, so it answered nothing.
            `
topo      ${[...topoOf.values()]
              .map((t) => `${t.faces.length}/${t.edges.length}`)
              .join(" ")}  mk=${faceMarkers.size}` +
            // ⛔⛔ **`outl=` REPORTED THE CACHE SIZE, WHICH IS NOT THE QUESTION** — a hand read it
            // as a bug (*"it goes to 2, not to zero"*) and was right to: a number that only ever
            // grows cannot describe what is on the screen. ⭐ `METHOD`: *audit an instrument
            // against the QUESTION it is supposed to answer.* The question is **why is nothing
            // drawn**, so this prints, per body, whether each outline is visible and **how many
            // vertices it actually has** — an empty buffer and a hidden mesh look identical.
            `
outl      ${
              outlines.size === 0
                ? "(none built)"
                : [...outlines.entries()]
                    .map(([id, o]) => {
                      const v = (m: LinesMesh): string =>
                        `${m.isVisible ? "V" : "-"}${m.getTotalVertices()}`;
                      return `${id}:${v(o.body)}/${v(o.align)}/${v(o.shell)}`;
                    })
                    .join(" ")
            }` +
            // ⭐⭐⭐ **THE SWING, ON THE READOUT** — a trial rule with three latched quantities and
            // an invented SIGN is exactly the kind a hand cannot debug from the outside.
            // ⛔ *A dead control must say so*, and so must a control that is alive and going the
            // wrong way: the sign, the progress and the angle are the three numbers a device
            // report about direction needs, and without them the only evidence is an impression.
            (swing === null
              ? ""
              : `
swing     sign${
                  // ⛔ `?` is *no direction was available at the threshold*, which is a swing of
                  // ZERO and not a swing going the wrong way — the 2026-09-20 report could not
                  // distinguish those two from outside, and this is what tells them apart.
                  swing.sign === null ? "⛔?" : swing.sign > 0 ? "+" : "−"
                } p=${swingProgress(highlighted.gapM ?? 0, swing).toFixed(2)}` +
                ` yaw=${((appliedSwingYaw * 180) / Math.PI).toFixed(1)}°` +
                ` g0=${(swing.gapAtTriggerM * 1000).toFixed(0)}mm` +
                // ⚠ The travel the ARMING FRAME saw, not a live one — *"what did the sign come
                // from"* is the question a direction report asks, and `0.0000` here is the whole
                // explanation of a `⛔?`.
                ` arm=(${(swing.armTravelM * 1000).toFixed(1)},${(swing.armTravelUpM * 1000).toFixed(1)})mm` +
                ` ${swingFrozenProgress === null ? "driven" : "FROZEN"}`) +
            (drawFault === null
              ? ""
              : `
DRAWFAULT x${drawFaultCount} ${drawFault}`) +
            // ⭐⭐⭐ **THE ALIGNMENT LINKS, PRINTED — AND THIS LINE IS OWED TO A DEVICE REPORT.**
            //
            // ⛔⛔ A hand reported *"the release of the cyan follower objects by the rotation of
            // the pioneer is not working"* and there was **nothing on the glass to narrow it
            // with**: an alignment that never linked, a link pruned too eagerly, a mode read as
            // `FOLLOW`, and a turn below the epsilon all look identical — nothing happens.
            // ⭐ Now each link prints as `follower>pioneer/face:C` or `:F` for cyan/FOLLOW, so
            // *the rule did not fire* and *the link was never there* stop being the same
            // observation. ⚠ Straight from the index; nothing is recomputed here.
            (links.size === 0
              ? ""
              : "  ⚭" +
                links
                  .alignedObjects()
                  .map((f) => {
                    const r = links.pioneerFor(f);
                    const m = alignModeOf.get(f) === "FOLLOW" ? "F" : "C";
                    return r === null
                      ? f
                      : `${f}>${r.objectId}/${r.faceId}:${m}`;
                  })
                  .join(" ")),
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
    // ⚠ **SECTION ORDER IS THE OWNER'S, 2026-09-18** — camera, translation, rotation,
    // eviction, capture. ⛔ It is a reading order, not a grouping: the camera frames what the
    // other four act on, and the two destructive ones sit last. ⭐ The panel remembers which
    // sections are open by TITLE (`localStorage`), so reordering costs a hand nothing.
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
        tunable(
          "elevation gain ↑↓ (/mm)",
          "gainOrbitElevation",
          0.002,
          0.05,
          0.002,
        ),
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
        tunable(
          "screen-plane gain (1 = under finger)",
          "gainTranslateScreen",
          0.1,
          3,
          0.05,
        ),
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
        tunable(
          "damping ratio (<1 = catch-up)",
          "translateDampingRatio",
          0.1,
          0.5,
          0.05,
        ),
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
        tunable(
          "depth gain (1 = as far as a drag)",
          "gainTranslateDepth",
          0.5,
          5,
          0.05,
        ),
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
        tunable("rest floor (ms)", "restConfirmMs", 0, 400, 10),
        // ⭐ How many of a pointer's own event intervals of silence mean it has stopped.
        tunable("rest = N x event gap", "restGapFactor", 2, 6, 0.5),
        // ⭐⭐⭐ A14: how long a lift-and-replace of the second touchpoint stays ONE
        // gesture. ⛔ 0 restores the old behaviour exactly, which is how to A/B it.
        tunable("sway of others (mm)", "translateSwayMm", 0, 8, 0.1),
        tunable("sway softness (ms)", "translateSwayTauMs", 40, 600, 20),
        // ⭐ How far the drag must swing before the scene reacts again, and the drag
        // speed at which the amplitude above is what you get.
        tunable("sway re-trigger turn (deg)", "swayTurnDeg", 15, 150, 5),
        tunable(
          "sway reference speed (mm/s)",
          "swayReferenceSpeedMmPerS",
          30,
          400,
          10,
        ),
      ],
    },
    {
      title: "OBJECT ROTATION",
      sliders: [
        // ⚠ §2bis's own gain, in radians per MILLIMETRE of finger travel, chosen on the
        // device. `IN3` inherits it — the rotation is real, only its plumbing is not.
        tunable(
          "yaw/pitch gain (rad/mm)",
          "gainRotateFree",
          0.005,
          0.15,
          0.005,
        ),
        // ⭐⭐ 2sexte's twist about a constraint axis (`D34`). ⚠ Defaulted EQUAL to the free
        // gain so one DOF does not feel like a different control from three — a guess, and
        // the range is the same as the free gain's so a hand can compare them directly.
        tunable(
          "anchored twist gain (rad/mm)",
          "gainRotateConstrained",
          0.005,
          0.15,
          0.005,
        ),
        // ⭐⭐⭐ **THE ROTATION INCREMENT (trial, 2026-09-22)** — a turn ENDS on a multiple of
        // this, slerped into place. ⛔ **`0` is the current build, no change.** ⚠ Only the END
        // is quantised: the drag itself keeps every gain, deadband and smoothing it has now,
        // because the earlier formulation that quantised the turn as it happened was rejected
        // on the device for lagging the finger.
        tunable(
          "rotation increment (deg, 0=off)",
          "rotationIncrementDeg",
          0,
          45,
          5,
        ),
        // ⭐ The sympathetic swing: the rest of the scene turns as a block about this
        // object's centre when it starts turning or turns the other way.
        tunable("sway of others (deg)", "rotateSwayDeg", 0, 8, 0.1),
        tunable("sway softness (ms)", "rotateSwayTauMs", 40, 600, 20),
        tunable("sway re-trigger turn (deg)", "rotateSwayTurnDeg", 15, 170, 5),
        tunable(
          "sway reference turn (deg/s)",
          "rotateSwayReferenceDegPerS",
          20,
          400,
          10,
        ),
      ],
    },
    {
      // ⭐⭐⭐ SHIPPED WITH THE RULE, NOT AFTER IT — `QUEUE`'s standing lesson: *a guessed
      // number has been wrong every single time*, and all four of these are guesses.
      // ⛔⛔ AND THE JUDGEMENT IS A SAFETY ONE, not a feel one: the whole question is the gap
      // between a shake and a **corrective nudge** during fine positioning, because eviction
      // destroys alignments the user set deliberately. ⚠ `evictShakeLegMm` has a validator
      // rule under it (3× the measured noise), so the slider cannot reach a value where a
      // reversal could be jitter.
      title: "⭐ EVICTION SHAKE (A4)",
      sliders: [
        tunable("reversals to evict", "evictShakeReversals", 2, 5, 1),
        tunable("window (ms)", "evictShakeWindowMs", 200, 1200, 50),
        tunable("leg / hysteresis (mm)", "evictShakeLegMm", 3, 25, 1),
        tunable(
          "straightness (0=strict, 1=any)",
          "evictShakeStraightness",
          0.1,
          0.9,
          0.05,
        ),
      ],
    },
    {
      // ⭐⭐ THE OWNER ASKED FOR THIS SLIDER BY NAME (`D49`): *"I want the offset distance to be
      // manually adjustable by slider."* ⛔ The standing *do not inflate the tuning menu* rule
      // is set aside where a hand says it wants to tune something — the same exception §8 of the
      // spec grants `BreakThreshold`.
      // ⚠⚠ IT IS MILLIMETRES ON THE GLASS, NOT IN THE WORLD. The world gap it authorises grows
      // with the camera distance, so the same slider value means the same APPARENT clearance at
      // every zoom — which is what the owner asked for and what the HUD's `gap=…/…mm` shows.
      title: "⭐ CAPTURE (D49)",
      sliders: [
        // ⚠ 1–40 mm: below ~2 mm two bodies must essentially touch before white appears, and
        // above ~40 mm the whole scene captures at the boot zoom. ⛔ A range chosen to make both
        // ends visibly WRONG on the glass, because a slider whose every value looks plausible
        // teaches a hand nothing.
        tunable("capture offset (mm on glass)", "captureOffsetMm", 1, 40, 0.5),
        // ⭐⭐⭐ **THE APPROACH SWING (trial, branch `1.0.18-`)** — how far the camera leans out
        // at HALF the trigger gap, and back to zero at contact.
        // ⛔ **`0` TURNS THE WHOLE MECHANISM OFF**, which is what makes it A/B-able by finger
        // in the same minute on the same scene — the comparison that settled `D28` and `IN13`.
        // ⚠ The default 25° is a GUESS, and a guessed number has been wrong every single time
        // in this project. Judge it here, not in the source.
        tunable(
          "approach swing (° of camera yaw)",
          "approachSwingDeg",
          0,
          90,
          1,
        ),
        // ⭐⭐ **THE SPEED DIVISOR, `gain × speed^exponent`** — the owner's fine-tuning pair.
        // ⛔ Damping starts where the divisor passes 1, at `(1/gain)^(1/exponent)` mm/s: the
        // default 0.0083 puts that knee at **120 mm/s**. ⚠ A small range with a fine step,
        // because the useful values are all near the bottom of it.
        tunable("swing speed gain", "approachSwingSpeedGain", 0, 0.05, 0.0005),
        // ⛔ **`0` REMOVES THE SPEED DEPENDENCE ENTIRELY**, which is how to A/B the idea by
        // finger; `1` makes the camera's angular rate independent of hand speed; above 1 the
        // camera slows as the hand speeds up.
        tunable(
          "swing speed exponent",
          "approachSwingSpeedExponent",
          0,
          3,
          0.1,
        ),
        // ⭐⭐⭐ **A RULE SELECTOR, NOT A NUMBER** — `0` is the current build; `1` switches the
        // yellow orbit target to the Pioneer–Follower barycentre the moment they capture.
        tunable(
          "orbit retargets on capture (0/1)",
          "approachRetargetsOrbit",
          0,
          1,
          1,
        ),
        // ⭐⭐⭐ **`D51` — NOT A TUNABLE, A RULE SELECTOR.** Every other control here changes a
        // NUMBER; this one changes what two fingers on a Pioneer and its Follower DO.
        // ⛔ `1` = today (both translate). `0` = the Pioneer is pinned: it cannot translate, and
        // its finger drives the Follower's roll AND depth together.
        // ⚠ A 0/1 slider because the menu has no other kind of control — the fork selector took
        // the same shape (`D26`) — and `validateGestureConfig` refuses anything between, so a
        // half-set flag cannot masquerade as the default.
        tunable("PIONEER translates (0=pinned)", "pioneerTranslates", 0, 1, 1),
        // ⭐⭐⭐ **THE OWNER'S FLAG OF 2026-09-22 — `WorldAxisA` / `WorldAxisB`.** `1` (the
        // default) fixes the object axes to the BOOT camera for the whole scene; `0` lets them
        // follow the camera, which is the build before this. ⛔ It does NOT select the channel
        // remap — `dy` drives depth and the second finger drives gravity either way.
        tunable("WorldAxisB: axes fixed at boot (0/1)", "worldAxisB", 0, 1, 1),
        // ⚠ Gates a method THAT DOES NOT EXIST YET (*"we will define it later on"*), so it
        // ships at 0 and turning it on changes only what the HUD reports.
        tunable(
          "zone ENTER calls CameraOffsetZoneEnter (0/1)",
          "cameraOffsetZoneEnterSetupB",
          0,
          1,
          1,
        ),
        // ⭐⭐ 1 = the body follows the finger in its own horizontal plane; 0 = the dictated
        // dx→x / dy→depth channels. ⛔ A RULE, not a number — the device report of 2026-09-23.
        tunable("translate: 1=plane, 0=channels", "translatePairing", 0, 1, 1),
        // ⚠ Blender's 5°. Below it the exact mapping is abandoned for the fixed-rate push; at 0
        // there is no fallback and a level camera sends the body a very long way.
        tunable("axis tracking cone (deg)", "axisTrackingConeDeg", 0, 30, 1),
        // ⭐⭐⭐ THE FEATURE'S OWN SWITCH, directly above its cone — the owner, 2026-09-25.
        // ⚠ `0` also retires the exception that lets a press reach a FROZEN body's offered face.
        tunable("fuchsia offer on/off", "pioneerCandidates", 0, 1, 1),
        // ⭐⭐ How close to MATING a face must be before it lights fuchsia. ⛔ `0` is the honest
        // OFF for the cone: only an exactly opposed face. The owner asked for 0–45 in steps of 5.
        tunable("fuchsia cone (deg)", "pioneerCandidateConeDeg", 0, 45, 5),
        // ⭐⭐ See the FollowerFace THROUGH its own body. ⛔ `0` is off and is the build before
        // the flag; anything above draws an x-ray twin at that opacity.
        tunable(
          "FollowerFace x-ray opacity (0=off)",
          "followerFaceXrayAlpha",
          0,
          1,
          0.05,
        ),
        // ⛔⛔ **THE `mesh contour width` SLIDER IS DELETED**, with the edge renderer it
        // controlled. ⚠ The second white is a `CreateLines` polyline now, which WebGL pins at
        // one pixel — so a width tunable would be a slider that does nothing, which is the
        // shape `config_debt.test.ts` exists to refuse. ⭐ *Deleted, not disabled.*
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
  /** ⚠ Per pointer id: the last event's clock, and every inter-event gap in the last second. */
  const eventGaps = new Map<
    number,
    { last: number; gaps: { t: number; ms: number }[] }
  >();
  const noise = new PointerNoiseMeter();
  let noisePointer: number | null = null;

  const noiseLine = (): string => {
    const floor = noise.floorMm;
    if (Number.isNaN(floor))
      return `— (n=${noise.samples}, hold one finger still)`;
    // ⭐ Printed against the value currently IN FORCE, because the reading is only
    // ever interesting as a comparison — and a config the sagitta rule is judged by
    // must not be compared against a half-remembered number.
    // ⭐⭐ AND THE EVENT GAPS, against the threshold they have to beat. ⛔ A `!` marks a pointer
    // whose worst gap EXCEEDS `restConfirmMs` — the flicker's precondition, as a measured fact.
    const gaps = [...eventGaps.entries()]
      .map(([pid, v]) => {
        const worst = v.gaps.reduce((m, g) => Math.max(m, g.ms), 0);
        return `p${pid}:${worst.toFixed(0)}${worst > cfg.restConfirmMs ? "!" : ""}`;
      })
      .join(" ");
    // ⭐⭐⭐ **THE ADAPTIVE REST WINDOW, ON THE GLASS.** ⛔ A threshold that MOVES and cannot be
    // seen is the instrument this project has been burned by most. ⚠ `rest` is what each held
    // pointer's tracker actually derived, beside the raw gaps it derived it from.
    const rests = [...held.values()]
      .map(
        (g) =>
          `${g.rec.restMs.toFixed(0)}(med ${g.rec.gapMedianMs.toFixed(0)})`,
      )
      .join(" ");
    return (
      `floor=${floor.toFixed(3)}mm n=${noise.samples}` +
      ` | rest ${rests || `${cfg.restConfirmMs}(seed)`}` +
      ` x${cfg.restGapFactor} | gaps ${gaps || "—"}`
    );
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
  /**
   * ⭐⭐ **IS A TOUCHPOINT PRESSED ON THIS BODY?** — `D53`'s sway exclusion.
   *
   * ⛔ Read from `held`, which is keyed by pointer id, so it answers *is a finger on it right
   * now* rather than *did something move it*. ⚠ `A15`'s ORPHANED grip still counts: the finger
   * is down and the user believes they are holding the part, which is exactly whose placement
   * the sway must not disturb.
   */
  const isGrasped = (id: ObjectId): boolean => {
    for (const g of held.values()) if (idOf.get(g.mesh) === id) return true;
    return false;
  };

  const nudgeOthersWorld = (
    heldMesh: AbstractMesh,
    dir: Vec3,
    speedMmPerS: number,
  ): void => {
    const perPx = trackingMetresPerPx(
      camera.radius,
      camera.fov,
      canvas.clientHeight,
    );
    // ⭐ Amplitude × how fast the object set off. Slow, small and slow; fast, bigger AND
    // quicker — it still peaks at the same time constant, so a larger excursion covers
    // that ground faster. See `swayScale`, which clamps the ratio.
    const scale = swayScale(speedMmPerS, cfg.swayReferenceSpeedMmPerS);
    const peakM = mmToPx(cfg.translateSwayMm) * perPx * scale;
    const impulse = impulseForPeak(peakM, cfg.translateSwayTauMs / 1000);
    if (!(impulse > 0)) return;

    const heldId = idOf.get(heldMesh) ?? null;
    for (const mesh of scene.meshes) {
      // ⛔ The SAME tag §2 rule 1 filters barycentre candidates by, so the diagnostic
      // marker cannot sway — a readout that moved with the scene would be describing
      // itself. And the held object is excluded: it is already going that way.
      if (mesh.metadata?.orbitCandidate !== true) continue;
      if (mesh === heldMesh) continue;
      // ⛔⛔ **AND A FROZEN BODY DOES NOT WOBBLE** — the owner, 2026-09-17. ⚠ The model was
      // frozen and the PICTURE was not: the sway is a display offset added after the model is
      // read, so the base plate rocked while its placement could not change. ⭐ One predicate,
      // shared with `spinOthers` and vectored in `tests/sway.test.ts`.
      if (!receivesSway(bodyOf(mesh), heldId, isGrasped)) continue;
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
    const peakRad = ((cfg.rotateSwayDeg * Math.PI) / 180) * scale;
    const impulse = impulseForPeak(peakRad, cfg.rotateSwayTauMs / 1000);
    if (!(impulse > 0)) return;

    const pivot = grip.mesh.position;
    const heldId = idOf.get(grip.mesh) ?? null;
    for (const mesh of scene.meshes) {
      if (mesh.metadata?.orbitCandidate !== true) continue;
      if (mesh === grip.mesh) continue;
      // ⛔⛔ A frozen body does not swing about the held one either — the same rule, the same
      // predicate. ⚠ This is the writer that made the base plate SWING rather than rock, which
      // is the more obvious of the two on the glass.
      if (!receivesSway(bodyOf(mesh), heldId, isGrasped)) continue;
      const f = followerFor(mesh);
      // ⚠ The pivot is captured per kick and shared by the block. A kick arriving while
      // an older one is still decaying moves the pivot; for the sub-degree swings this
      // produces, the difference is second-order and invisible.
      f.swayPivot.copyFrom(pivot);
      f.swayRotX = {
        x: f.swayRotX.x,
        v: f.swayRotX.v + kick.axis[0] * impulse,
      };
      f.swayRotY = {
        x: f.swayRotY.x,
        v: f.swayRotY.v + kick.axis[1] * impulse,
      };
      f.swayRotZ = {
        x: f.swayRotZ.x,
        v: f.swayRotZ.v + kick.axis[2] * impulse,
      };
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
  /**
   * ⭐⭐⭐ **THE SECOND TOUCHPOINT'S `dy` NOW DRIVES THE BODY'S *GRAVITY* AXIS** (the owner,
   * 2026-09-22) — it drove the depth axis until then, and the holder's own `dy` has taken
   * that over. ⛔ The channel moved; the plumbing did not. `secondFingerDrive` still decides
   * WHETHER this finger is translating, `gainTranslateDepth` is still the gain, and the name
   * of that tunable is deliberately unchanged: it is *the second finger's translate gain*,
   * and renaming a number a hand has tuned is how a device session loses its baseline.
   *
   * ⚠⚠ **`depthTranslate` IS NOT CALLED ANY MORE**, and it is declared as such in
   * `tests/unwired_debt.test.ts` rather than deleted: six models and five device passes are
   * behind it, and rule 5 has not judged the remap that replaced it.
   */
  /**
   * ⭐⭐⭐ **APPLY A WORLD TRANSLATION STEP — the ONE place a translation lands on a body.**
   *
   * ⛔⛔⛔ **DEVICE-REPORTED, 2026-09-23**: *"the swing of camera [is] missing at offset radius
   * zone enter sometimes when the follower approaches the pioneer from the gravity axis
   * direction."* ⚠ The swing takes its direction from `frameTravel*`, and **only the holder's
   * branch fed it** — the second touchpoint's channel, which is the GRAVITY axis, applied its
   * displacement and recorded nothing. ⭐ So an approach along gravity armed with
   * `swingSignFor(0, 0)`, which is `null`, and the swing never started. *"Sometimes"* is exactly
   * the frames where the holder happened to be moving too.
   *
   * ⭐⭐ **IT IS THE `D68` SHAPE IN ANOTHER FILE: one fact, two writers, one of which forgot.**
   * ⛔ So the fix is not the missing line — it is that applying a step and recording what it did
   * are now the same function, and a third channel cannot be added without both.
   */
  const applyWorldStep = (grip: Held, step: Vec3): void => {
    // ⚠ The LeadingFace ray is NOT aimed from here any more — it follows what the channels asked
    // for (`frameAskedM`), which has no lag, rather than what the body did. See `noteAxisTravel`.
    // ⚠ The swing reads SCREEN travel (*"opposite to the dx movement"*), so the applied
    // displacement is projected back onto the gravity frame rather than recomputed from a pointer
    // delta that `A11`'s deadband may have swallowed. ⛔⛔ ACCUMULATED, NOT LATCHED:
    // `refreshHighlight` zeroes it every frame, so the arming edge reads only the travel that
    // crossed the threshold.
    frameTravelRightM += dot(step, grip.frame.right);
    frameTravelUpM += dot(step, grip.frame.up);
    // ⛔⛔ **AND THE ALONG-VIEW COMPONENT.** `right` and `up` span the SCREEN, so a body pushed
    // along the gravity frame's own depth leaves no trace in either — which is what the holder's
    // `dy` does at a LEVEL camera, where its plane is edge-on and the judged fixed rate drives.
    // ⚠ Without it the swing has no direction to find there, however long it waits.
    frameTravelDepthM += dot(step, grip.frame.depth);
    const mp = requirePose(grip.mesh);
    // ⛔⛔ THE DEPTH RANGE STILL BINDS — `A5`'s derived bounds: twice the near plane, and the
    // camera's own maximum orbit radius. A body through the near plane renders *a black page with
    // no error at all*, and one past the ceiling cannot be brought back by any zoom.
    const limits = depthLimits(cfg);
    setModelPose(grip.mesh, {
      position: clampDepthRange(
        asVec3(camera.position),
        [
          mp.position[0] + step[0],
          mp.position[1] + step[1],
          mp.position[2] + step[2],
        ],
        grip.frame.depth,
        limits.minM,
        limits.maxM,
      ),
      orientation: mp.orientation,
    });
  };

  const applyDepthStep = (grip: Held, dyPx: number): void => {
    const gid = idOf.get(grip.mesh);
    const axes =
      gid === undefined
        ? (bootObjectAxes ?? axesFromFrame(grip.frame))
        : axesOf();
    const travel = axisTravel(
      { holderDxPx: 0, holderDyPx: 0, secondDyPx: dyPx },
      screenFrame(),
      axes,
      // ⭐ RULE 6's COMPUTED FACTOR, redirected: a given finger travel moves the object as far
      // along this axis as it would move it across the screen.
      trackingMetresPerPx(camera.radius, camera.fov, canvas.clientHeight),
      cfg.gainTranslateScreen,
      cfg.gainTranslateDepth,
      cfg.translatePairing === 1 ? "PLANE" : "CHANNELS",
      cfg.axisTrackingConeDeg,
      grip.frame.towardGravity,
    );
    // ⭐ The gizmo hears this finger exactly as it hears the holder's — same function, same frame.
    noteAxisTravel(gid, travel);
    // ⭐ ONE writer, so this channel now feeds the swing exactly as the holder's does.
    applyWorldStep(grip, axisDisplacement(travel, axes));
  };

  // ⛔⛔ **THE OLD DEPTH RULE STOOD HERE UNTIL 2026-09-22.** `depthTranslate` moved the body
  // along `GravityFrame.depth` with an `awaySign` of its own; the second touchpoint now drives
  // the body's GRAVITY axis instead, and the projection supplies that sign. ⭐ Deleted from the
  // call path rather than parked here: *a dormant fork is a trap* (`D28`), and the module itself
  // survives with its vectors, declared in `tests/unwired_debt.test.ts` until rule 5 judges the
  // remap that replaced it.

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
  const secondFingerOf = (grip: Held): { present: boolean } => {
    for (const q of router.all()) {
      const isSecond =
        q.role === "OUTSIDE" || (q.role === "SECOND" && q.object === grip.mesh);
      if (!isSecond) continue;
      return { present: true };
    }
    return { present: false };
  };

  /**
   * ⛔ Forget a released touchpoint's motion tracker, everywhere.
   *
   * ⚠ Keyed by `seq`, so a reused pointer id can no longer inherit it — this is belt to
   * that structural brace, and it is what stops the map growing for the life of a gesture.
   */
  const forgetAnchor = (seq: number): void => {
    for (const grip of held.values()) {
      grip.anchorMotion.delete(seq);
      grip.anchorRollSign.delete(seq);
    }
  };

  /**
   * @param bothAxes ⭐⭐ `D51`'s PINNED PIONEER: the driving finger gives roll AND depth at
   *   once, instead of the movement mode picking one. ⛔ Reachable only from the pinned
   *   configuration — two touchpoints on a Pioneer and its Follower, with the flag off.
   *   ⚠ The owner named the difference from `A16` himself; `pinned_pioneer.ts` argues it.
   */
  /**
   * ⭐⭐⭐ **`D51` — ARE THE TWO HELD BODIES A PIONEER AND ITS FOLLOWER, WITH THE FLAG OFF?**
   *
   * ⛔ `null` whenever the flag is on, so the default path is byte-for-byte what it was and a
   * device close of the old behaviour still means something.
   * ⚠ Press order is irrelevant — the hand chooses which body to align, not which to grab
   * first — so the rule asks the alignment index both ways.
   */
  const pinnedNow = (): { follower: ObjectId; pioneer: ObjectId } | null => {
    if (cfg.pioneerTranslates !== 0) return null;
    const ids: ObjectId[] = [];
    for (const q of router.objects()) {
      const g = held.get(q.id);
      const id = g === undefined ? undefined : idOf.get(g.mesh);
      if (id !== undefined && !ids.includes(id)) ids.push(id);
    }
    return pinnedPair(ids, (f) => links.pioneerFor(f)?.objectId ?? null);
  };

  /**
   * ⭐ `D59` — is the body this grip carries an **aligned Follower**? ⛔ The alignment index is
   * the one record of that; `alignModeOf` says what an alignment MEANS, never whether one exists.
   */
  const gripIsAlignedFollower = (grip: Held): boolean => {
    const id = idOf.get(grip.mesh);
    return id !== undefined && links.pioneerFor(id) !== null;
  };

  /**
   * ⭐⭐⭐ `D59`/`D60` — **is a second touchpoint currently owning this body's roll AND depth?**
   *
   * ⛔ ONE HELPER, READ BY BOTH HALVES OF THE RULE: it decides what that second finger drives
   * (`D59`) and, because of that, what the FIRST touch does (`D60`). ⚠ Two copies of this
   * question would be free to disagree, and the pair would then either fight over one DOF or
   * leave one unreachable — with nothing to catch it.
   *
   * ⚠ `router.outside()` is the OUTSIDE case only. The Pioneer case needs no test here: two
   * held objects already translate on a drag by `translatesOnDrag`'s own first line, which is
   * exactly why the owner saw the wanted behaviour there and nowhere else.
   */
  // ⭐⭐ A MOUSE HOLDER'S SECOND TOUCH IS ALWAYS AVAILABLE (`secondTouchAlwaysAvailable`, the
  // owner 2026-09-25): an aligned body under the left button translates at once, whatever the mode,
  // exactly as it does on the glass once a second finger is down. ⛔ The desktop fact lives in the
  // desktop module; this rule only reads it.
  const secondTouchOwnsRollAndDepth = (grip: Held): boolean =>
    (router.outside().length >= 1 || secondTouchAlwaysAvailable(grip.pointerType)) &&
    secondTouchDrive("OUTSIDE", gripIsAlignedFollower(grip)) === "BOTH";

  const gripOfObject = (id: ObjectId): Held | undefined => {
    for (const g of held.values()) if (idOf.get(g.mesh) === id) return g;
    return undefined;
  };

  const applyDepthDrag = (
    grip: Held,
    anchorSeq: number,
    anchorSample: Sample,
    bothAxes = false,
  ) => {
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

    // ⭐⭐⭐ A12 + A16 — the second finger drives ONE of two rules: **roll** by its x or
    // **depth** by its y, and the MODE picks which. ⚠ A12 gave it both at once, kept
    // independent by A11's per-axis bands; A16 narrowed it to one, and with the forks gone
    // (`D28`) that narrowing is all there is. ⛔ The travel is the DEADBANDED travel, exactly
    // as rule 6 and 2bis take the holder's.
    // ⛔ The live mode is handed over so the choice is made inside the vectored rule, not
    // here — `D23`: breaking a decision left in `scene.ts` reddens nothing.
    const drive = bothAxes
      ? pinnedSecondDrive(tracker.axes, tracker.step)
      : secondFingerDrive(tracker.axes, tracker.step, behaviour);
    if (drive.rollDxPx === 0 && drive.depthDyPx === 0) return false;

    if (drive.depthDyPx !== 0) {
      applyDepthStep(grip, drive.depthDyPx);
      grip.mode = "TRANSLATE_2ND";
    }
    if (drive.rollDxPx !== 0) {
      // ⭐⭐ ROLL AS AN INCREMENT, about the gravity frame's horizontal depth axis (A7).
      // ⚠ No baseline, no commit threshold, no circle fit, no rebase — the jump those
      // produced is gone with them. A12 replaced the gesture rather than the arithmetic.
      //
      // ⭐⭐⭐ AND ON AN ANCHORED OBJECT IT IS `A3`'s **OTHER CHART** OVER THE SAME ONE DOF.
      // ⛔ A free roll would swing the anchored face straight off its target — revision 5
      // forbade roll on a constrained object for exactly that reason, and `D14` corrected it
      // by keeping the gesture and changing its AXIS: the twist goes about the constraint,
      // never about the view. ⭐ This is the chart that works where the drag degenerates
      // (camera looking along the axis), which is why `A12`'s channel split answers `A3`
      // without a handover constant — see the 2sexte block in the ROTATE branch.
      // ⚠ `constrainedRollAngle` returns `null` square to the axis, where a roll has no
      // component to give: nothing happens, and the drag chart is the one that works there.
      const rollId = idOf.get(grip.mesh);
      const rollStack =
        rollId === undefined
          ? []
          : (world.objects.get(rollId)?.constraints ?? []);
      // ⛔⛔ The same audit fix as the one-finger twist, at the second finger's channel: a
      // COUNT stood in for *"is this body aligned?"* and sent a mated body to free roll.
      const rollChannel = rotationChannel(rollStack);
      if (rollChannel.kind === "REFUSED") {
        // ⛔ Same as the one-finger twist: a refusal that fell through to the free roll below
        // would break the mate while the HUD reported that it had not.
        lastVerdict = `align: roll refused — ${rollChannel.why}`;
      } else if (rollChannel.kind === "TWIST") {
        const axis = rollChannel.axis;
        // ⭐ The grey line's axis, recorded where the turn is applied (the owner, 2026-09-23).
        noteTurnAxis(rollId, TURN_ROLL, axis);
        // ⭐⭐⭐ **`D52` — THE SECOND TOUCHPOINT ROLLS THE FOLLOWER THE SAME WAY THE FIRST
        // DOES.** Device-reported, 2026-09-18: *"the Follower object roll controlled by the
        // second touchpoint is inverted vs. the roll controlled by the first touchpoint … the
        // second should be the same as the first touchpoint roll."*
        //
        // ⛔⛔ **IT WAS NOT A SIGN, IT WAS A DIFFERENT CHART — measured before changing
        // anything.** The two channels agreed for some constraint axes and opposed for others:
        // `constrainedDragAngle` projects the finger's travel onto the **near-side direction**,
        // while `constrainedRollAngle` mapped a screen roll through `sign(axis·view)`. ⚠ A
        // blanket sign flip would have fixed the axes that opposed and broken the ones that
        // agreed — the trap this project names as *a sign is not tested by any amount of
        // testing the magnitude*, one level up: the two SIGNS were each defensible and their
        // COMPOSITION was never computed.
        //
        // ✅ So the second touchpoint now uses the **same chart**, with its own gain converted
        // to radians. Measured over two camera frames and six axes, both drag directions: every
        // case agrees, and two that the roll chart could not serve at all now do.
        // ⚠⚠ **WHAT IT COSTS — AND THE FIRST STATEMENT OF IT HERE WAS WRONG.** It said the
        // price was *"the axis square to the view"*. ⛔ Measured 2026-09-19, after the owner
        // reported *"for some PioneerFaces I lose the roll control of the Follower by the
        // second touch"*: that is not where this dies, and the real dead zone is far commoner.
        //
        // ⛔⛔⛔ **THE ROLL FADES WITH THE AXIS'S *SCREEN ORIENTATION*, NOT WITH ITS ANGLE TO
        // THE CAMERA.** The near side travels along `axis × (−view)`, which is **perpendicular
        // to the axis's screen projection** — so the direction the object wants the finger to
        // go SPINS as the alignment axis does. ⚠ This channel supplies `dx` only (`A16`: *its x
        // is roll, its y is depth*), so the authority is `dir.x`, and it falls off as a cosine:
        //
        //   axis VERTICAL on screen → near side moves horizontally → authority 1.00 (20°/10 mm)
        //   45°                     →                             → authority 0.71 (14°)
        //   axis HORIZONTAL          → near side moves VERTICALLY   → authority 0.00 (**dead**)
        //
        // ⭐ The first touchpoint never loses it, because it passes `dx` AND `dy` and can always
        // drag along the near-side direction whatever its screen orientation.
        // ⛔⛔ AND `constrainedRollAngle` IS NOT A FALLBACK HERE, which is worth stating so the
        // next session does not try it: an axis horizontal on screen is **square to the view**,
        // which is exactly where that chart returns `null` too. Both charts are dead in the
        // same configuration; only the missing `dy` could have served it.
        // ⭐⭐⭐ **`D57` — CONSTANT RATE. THE PROJECTION IS GONE, AS THE OWNER REQUIRED.**
        //
        // > *"for the second touchpoint on the Pioneer, the dx on the screen shall drive the
        // > roll of the Follower, the dy on the screen shall drive the depth translation of the
        // > Follower, whatever the orientation of the Pioneer-Follower duo. If there are cos or
        // > sin projections on axis based on orientation, remove those projections."*
        // > — the owner, 2026-09-19, answering the dead-control report
        //
        // ⛔⛔ **WHAT THE PROJECTION WAS DOING, AND WHY ONLY HALF OF IT COULD GO.** It carried
        // the RATE *and* the DIRECTION. The rate was the defect — `|dir.x|`, a cosine in the
        // axis's screen orientation, reaching **zero** for any alignment whose axis lies
        // horizontally across the glass. ✅ That is deleted: the rate is now flat.
        // ⚠ The direction has **no orientation-free definition**: a handedness must be relative
        // to something, and the constraint axis can point at the camera or away from it. A raw
        // `+dx` would therefore roll *opposite to the first touchpoint* for every alignment with
        // `dir.x < 0` — measured at **−1.000** for an axis vertical on screen, i.e. the common
        // case — which is `D52`'s device report returning.
        //
        // ⭐⭐ **SO THE SIGN IS TAKEN FROM THE GEOMETRY ONCE AND LATCHED FOR THE GESTURE.**
        // ⛔ Per frame it would flip mid-drag as the axis swung through horizontal-on-screen,
        // at full rate — trading a dead control for an unpredictable one. ⚠ At that crossing the
        // latched sign is arbitrary, and that is the honest residue of the owner's rule: there
        // is nothing there to be consistent WITH. It is at least **stable for the whole drag**.
        // ⛔ THE RULE IS IN `anchor_rotate.ts`, NOT HERE — `pioneer_cascade.ts`'s standing rule:
        // *a RULE in a render file is a rule nothing can interrogate.* ⚠ Only the LATCH is here,
        // because only this file knows when a gesture began.
        let rollSign = grip.anchorRollSign.get(anchorSeq);
        if (rollSign === undefined) {
          rollSign = rollSignFor(screenFrame(), axis);
          grip.anchorRollSign.set(anchorSeq, rollSign);
        }
        // ⭐ `gainRollDrag` keeps its meaning exactly: degrees per millimetre of finger — which
        // is what it always claimed to be, and only now always is.
        const twist = flatTwistAngle(
          drive.rollDxPx,
          rollSign,
          (cfg.gainRollDrag * Math.PI) / 180,
        );
        // ⚠ NO `null` BRANCH ANY MORE, and that is the point: this channel had one because
        // the projection could fail, and `D57` removed the projection. ⛔ A `twist !== null`
        // guard left here would be a dead condition implying a refusal that cannot happen.
        {
          // ⛔⛔ **WITH INCREMENTS ON, THE POSE IS NOT WRITTEN HERE.** The demand is tallied and
          // the body is advanced a whole increment at a time in the render loop — which is what
          // stops it ever sitting between two and having to come back.
          if (
            incrementRadians(cfg.rotationIncrementDeg) !== null &&
            rollId !== undefined
          ) {
            rotationTally.add(rollId, "roll", axis, twist);
          } else {
            setModelOrientation(
              grip.mesh,
              rotateAboutAxis(modelOrientation(grip.mesh), axis, twist),
            );
          }
          // ⛔⛔⛔ **AND IT RIDES THE SNAP — AUDIT FIX, 2026-09-17.** The one-finger twist has
          // composed onto both ends of a travelling snap since `D45`; this channel never did.
          // ⚠ So a roll made during the 129 ms snap was written to the model and then
          // **overwritten** by the slerp on the very next frame: the body landed on `to` and
          // the hand movement vanished. ⭐ Exactly the shape of the device report that bought
          // the ride-along in the first place (*"there is no slerp during rotation"*), one
          // channel over — a fix that landed on one path and not on its twin.
          // ⛔ `METHOD`: *when a rule has two channels, the correction belongs to the RULE.*
          if (rollId !== undefined) {
            alignSnaps.ride(rollId, rotateAboutAxis(IDENTITY, axis, twist));
          }
        }
      } else {
        // ⭐ `FREE`: no constraint at all, so the roll is the screen-plane one.
        // ⚠⚠ **THIS COMMENT USED TO SAY THERE WAS NO REFUSAL BRANCH**, on the argument that the
        // cap of one makes *"the stack is full"* unreachable. ⛔ That was true of two
        // ALIGNMENTS and said nothing about a **MATE**, which is the second entry `3D2` adds —
        // so the `else` silently covered a case nobody had considered. ⭐ `rotationChannel`
        // now names all three outcomes, and the refusal is the branch above.
        {
          // ⭐ A FREE body rolls about the gravity frame's own depth — `screenRollRotation`'s axis,
          // stated here so the grey line cannot disagree with the turn it describes.
          // ⛔⛔ **AND *WHICH* GRAVITY FRAME IS `worldAxisB`'s ANSWER SINCE 2026-09-23** — the boot
          // camera's while it is on. ⚠ Taken ONCE and handed to all three readers below (the grey
          // line, the turn, the tally), because two of them restate the other's axis and sign.
          const rollFrame = rotationFrameOf(grip.frame);
          noteTurnAxis(rollId, TURN_ROLL, rollFrame.depth);
          const rollDeg = rollDragDeg(drive.rollDxPx, cfg.gainRollDrag);
          const incOn =
            incrementRadians(cfg.rotationIncrementDeg) !== null &&
            rollId !== undefined;
          if (!incOn) {
            setModelOrientation(
              grip.mesh,
              screenRollRotation(
                modelOrientation(grip.mesh),
                rollFrame,
                rollDeg,
              ),
            );
          }
          // ⚠ `screenRollRotation` turns by MINUS deg about `frame.depth`; the tally states the
          // SAME axis and sign, or the settle would correct a turn it had mis-measured.
          // ⛔ *A sign is not tested by any amount of testing the magnitude.*
          // ⚠ `screenRollRotation` turns by MINUS deg about `frame.depth`; the tally states the
          // SAME axis and sign, or the detents would be counted on a quantity the body is not
          // turning. ⛔ *A sign is not tested by any amount of testing the magnitude.*
          if (rollId !== undefined) {
            rotationTally.add(
              rollId,
              "roll",
              rollFrame.depth,
              (-rollDeg * Math.PI) / 180,
            );
          }
        }
      }
      grip.mode = "ROTATE";
      // ⭐ The rotational sway answers a driven roll too — same watcher, same tunables.
      noteSpin(grip, anchorSample.t);
    }
    // ⛔⛔ AND THE HOLDER'S GESTURE IS NO LONGER A TAP. It is being held STILL on the
    // object, which is a tap's exact shape — and a DOUBLE_TAP resolves to 2septies
    // eviction. See `Recognizer.consumeAsMotion`.
    grip.rec.consumeAsMotion();

    // ⛔⛔ THE DEPTH SWAY ANSWERS A **DEPTH** PUSH, NOT ANY DRIVE. A12 gave this function a
    // second job — roll on the anchor's x — and the sway below was left firing on either.
    // ⚠ It is fed the anchor's `y`, so a pure ROLL drag (x only, y still) would push the
    // other objects along `frame.depth` on the strength of a coordinate that is not moving.
    // ⭐ Harmless today only because a still `y` produces no kick; the guard makes it
    // correct rather than lucky. The ROTATIONAL sway already fires in the roll branch above.
    if (drive.depthDyPx === 0) return true;

    // ⭐ THE SCENE REACTS TO A PUSH TOO — the same sway, the same four tunables.
    // ⚠ SIGN: fingers moving UP (negative screen y) push the object AWAY, which is +push.
    const kick = grip.depthSway.push(
      { x: 0, y: anchorSample.y, t: anchorSample.t },
      true,
      true,
    );
    if (kick) {
      const push = grip.frame.depth;
      {
        const away = kick.dirY < 0 ? 1 : -1;
        nudgeOthersWorld(
          grip.mesh,
          [push[0] * away, push[1] * away, push[2] * away],
          kick.speedMmPerS,
        );
      }
    }
    return true;
  };

  // ⛔⛔ **`objectUnder` IS DELETED WITH `D54`.** It raycast at a holder's last position to
  // ask *is the object still under this finger?* — `A15`'s only question, and nothing else
  // ever asked it. ⭐ *Deleted, not disabled*: a raycast helper kept "in case" is the shape
  // `config_debt` and `unwired_debt` both exist to refuse.

  /**
   * ⭐⭐⭐ A15 — THE RAYCAST AT A SECOND TOUCHPOINT'S LIFT.
   *
   * ⛔⛔ Fired on EVERY second-touchpoint release while something is still held, not only
   * after a depth drag. ⭐ The raycast is the whole test, and for every other two-finger
   * rule it simply answers `BOUND`: roll does not translate the object, and rule 6 keeps it
   * under the finger by construction. ⚠ A *"was that a depth gesture?"* flag would be a
   * second, weaker way of asking the same question — `METHOD`'s no-heuristic-pile-up, and
   * a flag can be wrong where a ray cannot.
   *
   * ⭐ EVERY remaining holder is evaluated, not a guessed pairing. With two objects held,
   * *"which holder was that finger the partner of?"* has no answer worth trusting, while
   * *"is THIS holder still on its object?"* is well posed for each of them.
   */
  /**
   * ⛔⛔⛔ **`D54` — `A15`'s ORPHAN UNSELECT IS DELETED (2026-09-18, the owner).**
   *
   * > *"Until first touch is released: first touch can continue controlling the object
   * > (rotation or translation), and second touchpoint can be pressed again and thus control
   * > again the object."*
   *
   * ⭐⭐ **SO `IN2`'s LATCH IS PURE AGAIN.** §4 latches a role at press *for the touchpoint's
   * lifetime*, and `A15` was its single exception: a raycast at the second touchpoint's lift
   * asked whether the object was still under the holder, and dropped the selection at the next
   * input event if it was not. ⛔ `evaluateBindings`, `collectOrphans`, `HolderBinding`,
   * `router.relatchOnOrphan` and the HUD's `⛔ORPHANED` line are all gone with it.
   *
   * ⚠⚠ **WHAT IS BEING REVERSED, STATED PLAINLY.** `A15` existed because depth pushes an
   * object along the view axis while the holder need not move, so the object leaves the finger
   * — the owner's words then: *"the previously selected object is no longer under the finger
   * which used to control it."* ⛔ That geometry has not changed. What changed is the verdict
   * on what should follow: **keeping control beats re-resolving**, because a hand that pushed a
   * part away still means to be holding it.
   *
   * ⭐ Requirement 1b needed no code: with nothing deleting the grip, a second touchpoint
   * pressed again finds `router.objects()[0]` and drives the same body, exactly as before.
   *
   * ⭐⭐ **AND IT CLOSES A HOLE RATHER THAN LEAVING ONE.** `queue_notes/IN8.md` recorded that
   * `D51`'s pinned Pioneer could slide the Follower off its holder through a release path
   * `A15` never watched. ⛔ With no unselect anywhere, that hole is unreachable **by
   * construction** — the durable fix the note asked for, arriving from the other direction.
   */

  /**
   * ⭐⭐⭐ THE MOVEMENT MODE — one latch for the session, not one per gesture.
   *
   * ⛔⛔ Device-corrected 2026-09-16: *"when the first touchpoint is released and pressed
   * again, the movement automatically resets to translation. I would expect the movement
   * resumes the behavior as it was prior to release."* ⚠ I had put this on the grip, reading
   * *"for one single ongoing touchpoint"* as *dies with the gesture*. It is a MODE: it
   * persists until tapped again, and every new grip adopts it.
   * ⭐ Which also retired the cost I had stated against this model — rotation no longer
   * costs a tap every time, only when switching.
   */
  // ⭐⭐ **THE SESSION BOOTS IN `TRANSLATE`** (`D71`, 2026-09-22: *"set the default to translation
  // mode at scene boot"*, and re-confirmed 2026-09-25 with the boot alignment's removal).
  // ⛔⛔ **THIS COMMENT SAID `initialBehaviour()` RETURNS `ROTATE` UNTIL 2026-09-25, AND IT HAD
  // BEEN FALSE SINCE `D71`.** ⚠ That is the exact shape the 2026-09-17 audit found and named: a
  // DISAGREEMENT between a human sentence and the code, where the tell is *whether any instruction
  // still asks for the other mode*. ⭐ None does — so the comment was the thing that was wrong,
  // and it is the comment that moved.
  let behaviour: Behaviour = initialBehaviour();

  /**
   * ⭐⭐⭐ `IN3`'s SELECTED FACE — §2 rule 2's other half, and the input every remaining
   * `IN3` rule reads: 2ter anchors it to gravity, 2quater to a world axis, `MATE` joins two.
   *
   * ⛔ `null` in forks A and C, always. ⚠ It carries the pick's COSINE because a later rule
   * may want to refuse a grazing pick — and nothing refuses one yet, so the number is
   * evidence on the readout rather than a hidden threshold.
   */
  let selectedFace: { objectId: string; faceId: string; cos: number } | null =
    null;

  /**
   * ⭐⭐⭐ **FORK C's PIONEER, REMEMBERED** — the face whose tap created the live alignment.
   *
   * ⛔⛔ THE OWNER'S FIRST DICTATION SAID *"the PioneerFace resets as null"*, AND THE
   * AMENDMENT OF THE SAME DAY KEPT IT: *"when an object is aligned, the FollowerFace shall be
   * highlighted and the PioneerFace contour shall be highlighted, until the alignment is
   * broken"*, and *"the alignment can be toggled off by taping another time to the same
   * PioneerFace."* ⭐ Both rules need to know which face it was, so the reference survives
   * the gesture that made it.
   *
   * ⚠ IT CHANGES NOTHING ABOUT THE CONSTRAINT, which still stores a **frozen world
   * direction** (§1.4): moving the Pioneer's object afterwards does not drag the alignment
   * with it. What is remembered is the face's IDENTITY, for drawing and for the undo.
   * ⛔ ONE pair is visualised, so two objects aligned at once show only the latest — stated
   * rather than hidden, and a device question (`ALIGNMENT_RULES.md` §7).
   */
  // ⛔⛔⛔ **`pioneerFace` AND `alignMode` WERE DELETED HERE, 2026-09-17 — AND DELETED, NOT
  // LEFT.** They were the ACTIVE alignment's Pioneer face and its mode: one of each, for the
  // whole scene. ⚠ The per-body truth has lived in `links` and `alignModeOf` since `A18`, and
  // an audit found the tap rule still reading these — so re-tapping the FIRST of two aligned
  // bodies was read as a fresh alignment and could never release it.
  // ⭐ Once the tap read the body instead, TypeScript reported both as written-but-never-read,
  // which is the whole argument: a scene-wide record that nothing consumes is exactly defect
  // 40's shape (`A12`'s retired roll detector, still fed, still holding a veto).
  // ⚠ `selectedFace` survives because the follower HIGHLIGHT still has one active record,
  // which is a stated device question (`ALIGNMENT_RULES.md` §7).

  /**
   * ⛔⛔⛔ **`pioneerOrientation` WAS DELETED HERE, 2026-09-17 — AND DELETED, NOT LEFT.**
   *
   * ⭐ It held ONE baseline: the pose of the ACTIVE alignment's Pioneer as of the last frame.
   * ⚠ That is why a chain was invisible — *"if the pioneer object is rotated because it is
   * aligned with another object"* could not be seen for any alignment but the current one.
   * ✅ The baseline is now **per link**, inside `AlignmentLinks`, so every follower watches its
   * own Pioneer.
   *
   * ⛔ Removed the same hour the replacement landed, because this file has already paid for the
   * other choice twice: defect 40 (`A12`'s retired roll detector, still fed, still holding a
   * veto) and the `faceExtent` bug earlier today (a corrected function written beside the
   * broken one, which stayed wired). ⭐ *Deleted, not disabled.*
   */

  /**
   * ⭐⭐⭐ **WHAT THE LIVE ALIGNMENT MEANS** — `SNAPSHOT` (a single tap made it) or `FOLLOW`
   * (a double tap did). ⛔ It was `?pioneerTurnRule` for a few hours on 2026-09-17 and the
   * owner replaced the flag with the GESTURE: *"one single tap … the logic is as fork C1; one
   * double tap … as fork C2"*. ⭐ So it is per-alignment state rather than a session setting,
   * and the highlight COLOURS report it — two colours for a snapshot, one for a relationship.
   * ⚠ `null` exactly when nothing is aligned.
   */

  /**
   * ⭐⭐⭐ **THE ALIGNMENT'S SNAP, ANIMATED** — owner, 2026-09-17: *"make the rotation a slerp
   * instead of instantaneous."*
   *
   * ⛔⛔ NOT A RESURRECTION OF THE REJECTED ROTATION INERTIA. That was a follower on
   * CONTINUOUS rotation — a drag with mass — and a hand rejected it on the device
   * (`THIRD_PARTY_NOTICES.md`). ⭐ This is a **discrete** pose change played over time, the
   * same kind of thing as the camera's fly-home, and the distinction is why one was wrong and
   * this is right: a gesture in flight must answer the finger instantly; a snap that the hand
   * has already asked for may take a moment to arrive.
   *
   * ⚠ THE CONSTRAINT IS PUSHED IMMEDIATELY while the pose travels, so for a few frames the
   * object does not yet satisfy its own alignment. ⛔ Deliberate: the stack is what every other
   * rule reads, and a stack that lags the gesture would make the twist, the readout and the
   * re-tap all briefly wrong. The pose catches up and lands EXACTLY on the solved orientation.
   */
  // ⛔⛔⛔ **ONE SNAP PER BODY — IT WAS A SINGLE GLOBAL SLOT UNTIL 2026-09-17.** An audit
  // found that a second alignment on ANY body overwrote the slot and abandoned the first body
  // **mid-arc**, keeping its constraint, its marker and its outline while its face was not on
  // the target and nothing would ever re-solve it. ⚠ The window is 129 ms at the shipped
  // numbers and 571 ms at the slider maximum, and two-handed play is the owner own model for
  // the fine approach — so a tap inside another body snap is the intended posture.
  // ⭐⭐ The bookkeeping moved to `input/align_snap.ts` so it can be INTERROGATED: the
  // ride-along, the cancel and the landing were three scattered statements in this frame
  // handler, and `pioneer_cascade.ts` already paid for that lesson.
  const alignSnaps = new AlignSnaps<ObjectId>();
  // ⚠ LATCHED, not per-frame: a jump is over in one frame and a hand cannot look up in time.
  // ⭐ The verdict in force when it happened is captured with it — that is the half that says
  // WHICH rule was running, which is what the owner could not see.
  const jumpWatch = new JumpWatch<ObjectId>();
  let lastJump: Jump<ObjectId> | null = null;
  let lastJumpVerdict = "";
  let lastJumpAt = 0;
  /**
   * ⭐⭐⭐ **THE ROTATION INCREMENT (trial, 2026-09-22)** — what this gesture has demanded per
   * axis, and the slerp that lands it on a multiple when the gesture ends.
   *
   * ⛔⛔ **THE RULES ARE IN `input/rotation_increment.ts`, NOT HERE.** This file holds the
   * state and the call — 2026-09-19's binding lesson: *a rule written in `scene.ts` is a rule
   * nothing can interrogate*, which cost seven mutants in one day.
   *
   * ⚠ **A SEPARATE `AlignSnaps` FROM THE ALIGNMENT'S**, deliberately. They are two animations
   * with different owners, and sharing one instance is the single-slot defect `align_snap.ts`
   * was written to fix: a settle would silently overwrite a travelling alignment and leave that
   * body stranded mid-arc with its constraint still claiming it had landed.
   */
  const rotationTally = new RotationTally<ObjectId>();
  /**
   * ⭐⭐⭐ **THE CHASE TOWARD THE CURRENT DETENT — an exponential approach, not a timed arc.**
   *
   * ⛔⛔ **IT REPLACED AN `AlignSnaps` FLIGHT ON 2026-09-22, AND THE REASON WAS A DEVICE
   * REPORT ABOUT THE SWAY**: *"when I set increment to 45 degree and I rotate by one increment,
   * the sway of other objects is bigger than if I move by two or more increments."* ⚠ The sway
   * was right. An `easeInOut` over a fixed window has ZERO velocity at both ends, and every
   * newly crossed increment restarted it at `t = 0` — so crossing several detents relaunched the
   * body from a standstill again and again. ⭐ An exponential has no clock to restart.
   */
  const rotationFollower = new RotationFollower<ObjectId>();

  /**
   * ⭐⭐⭐ **ADVANCE THE BODY TO THE INCREMENT THE FINGER IS IN NOW.**
   *
   * The owner, 2026-09-22: *"I want the object to stop to an increment and not rotate further
   * if the delta position input becomes too weak."*
   *
   * ⛔⛔ **IT NEVER REVERSES, BECAUSE IT NEVER OVERSHOOTS.** The target is the last boundary
   * the demand has CROSSED, so the step is always in the direction of travel and the body is
   * always on an increment. ⚠ The three formulations before this one all let the body reach a
   * pose it was not allowed to hold and then argued about how to bring it back; the owner's
   * objection to the last of them — *"the object rotates then rotates back in the reverse
   * direction"* — is an objection to that whole family, not to one correction.
   *
   * ⭐⭐ **AND WEAK INPUT NEEDS NO RULE OF ITS OWN.** A demand that crosses no boundary advances
   * nothing, so the body simply stops where it is. ⛔ That is why the rest-speed detector this
   * function used to consult is **deleted** rather than retuned: it was answering a question
   * that only existed because the body was allowed to drift off the increment.
   *
   * ⚠ **THE ANIMATION RETARGETS, IT DOES NOT QUEUE**, and since 2026-09-22 retargeting is
   * free: the follower is an exponential approach with no start time, so moving the target
   * neither restarts a curve nor throws away the body's speed. ⛔ A backlog is unrepresentable,
   * which is exactly what formulation 1 could not say.
   *
   * ⛔ A body whose ALIGNMENT is travelling is skipped: the alignment is landing a constraint
   * the user asked for and must win, and two animations writing one orientation is the fight.
   */
  const advanceRotation = (id: ObjectId | undefined): void => {
    if (id === undefined) return;
    const inc = incrementRadians(cfg.rotationIncrementDeg);
    if (inc === null || alignSnaps.has(id)) return;
    const step = rotationTally.advance(id, inc);
    const mesh = meshOf.get(id);
    if (step === null || !mesh) return;
    // ⭐ The target simply moves. There is no clock to restart, so a body already chasing a
    // detent keeps every bit of the speed it had — which is the whole point of the change.
    rotationFollower.push(id, step, modelOrientation(mesh));
  };

  /**
   * ⭐⭐ **DROP IT WHERE IT IS** — for every rule that RELEASES the alignment.
   *
   * ⛔⛔ THE DISTINCTION FROM `settleAlignAnim` IS THE WHOLE POINT, and it is the owner's own
   * rule: releasing an alignment *"does not rotate the first object"*. ⭐ So a shake, a re-tap
   * or a turned Pioneer that arrives mid-flight must **stop** the snap, not finish it —
   * finishing would be the alignment still acting after it was let go, which is the one thing
   * a release is supposed to guarantee against.
   * ⚠ The object keeps whatever orientation the snap had reached. That is a partial rotation
   * the hand can see and undo, which is honest; a jump back to the press pose would not be.
   */
  const cancelAlignAnim = (objectId: ObjectId): void => {
    alignSnaps.cancel(objectId);
  };

  // ⛔⛔ **`settleAlignAnim` WAS DELETED HERE, 2026-09-17, AND ITS ABSENCE IS THE FIX.** It
  // landed an in-flight snap so a rule could write the orientation itself — and the twist
  // called it, which is why a hand saw no slerp at all in `ROTATE`: the first movement past the
  // deadband ended the animation. ⭐ Every path now does one of two honest things instead:
  // **rides along** (the twist, C2's follow — compose the world rotation onto both ends) or
  // **cancels** (every release, and the rotation reset, which writes its own pose). ⚠ Nothing
  // needs to land a snap early any more, so the function that did is gone rather than kept for
  // a caller that might return.

  /**
   * ⭐⭐ Judge one release as a tap, keep §1.3's history, and toggle the mode **immediately**.
   *
   * ⛔⛔ IMMEDIATELY, device-corrected the same day: *"there is a lag when the second
   * touchpoint is tapped and the behavior change. It shall be immediate."* ⭐ The owner's
   * accepted worst case is explicit — *"a double tap occurs and the behavior and movement can
   * be reverted back while the camera orbit resets"* — so a double tap toggles twice, back to
   * where it began, and the camera reset fires as in every other fork. ⚠ That is Unity's own
   * behaviour (`Tap` does not wait for a second tap), chosen here deliberately.
   *
   * @returns the verdict, or `null` if the release was not a tap at all — a PRESS, which
   *   keeps every meaning it already has.
   */
  /**
   * ⭐⭐ `D58` — touchpoints whose **press** already flipped the movement mode, so their
   * release must not flip it again. ⛔ Keyed by pointer id and emptied on release; a tap is a
   * press plus a lift, and without this every tap would toggle twice and change nothing.
   */
  /**
   * ⭐⭐ `D68` — **did the last tap RELEASE actually toggle the mode?** ⛔ Not *was there a tap*:
   * a tap consumed by an alignment toggled nothing, and undoing it would flip the mode the hand
   * had. ⚠ Written at every tap release, both paths, so it cannot describe an older gesture.
   */
  let lastTapToggled = false;
  /**
   * ⭐⭐ `D68` — presses that already spent their toggle by REVERTING the first tap's. ⛔ Their
   * own release must add nothing, or a full double tap would end up flipped by one.
   * ⚠ It is `pressToggled`'s shape and NOT its rule: `D66` deleted a press that TOGGLED; this is
   * a press that UNDOES, which is what keeps `D28`'s *two taps revert* true when the second half
   * never lifts.
   */
  const pairReverted = new Set<number>();

  /**
   * ⭐⭐⭐ **THE ONE PLACE A TAP FLIPS THE MODE — and it records the fact `D68` reads.**
   *
   * ⛔⛔ **DEVICE-REPORTED, 2026-09-23**: *"When i double tap on the pioneer to change
   * followerface, the translation/rotation mode also toggles."* ⚠ `D68` is the rule that stops
   * exactly that, and it was **dead for this gesture**: the revert fires only when
   * `lastTapToggled` says the first tap flipped something, and there were **two** places that
   * flipped it — `noteTap`, for a touchpoint routed `OUTSIDE` or `SECOND`, which set the flag,
   * and the OBJECT release below, which did not.
   *
   * ⭐⭐ A double tap on the **Pioneer** is a tap on an OBJECT by definition, so it took the one
   * path that forgot to arm: tap 1 flipped the mode, the press completing the pair found
   * `lastTapToggled === false` and reverted nothing, and the gesture ended one toggle out.
   * ⛔ Every earlier double tap in the input model went through `noteTap`, which is why `D68`
   * looked correct on the glass for two days.
   *
   * ⭐⭐⭐ `METHOD`: *a composition is a thing to MEASURE* — and the composition here is **two
   * writers of one fact**, which is the same shape as the render loop drawing only the objects
   * that happened to have a follower. ⚠ The fix is not the missing line; it is that there is
   * now one writer and a second cannot be added by accident.
   */
  const toggleByTap = (why: string, pointerId: number): void => {
    // ⛔⛔⛔ **AND THE OTHER HALF OF `D68` WAS DEAD TOO — `pairReverted` WAS WRITTEN AND NEVER
    // READ.** Its own comment says *"their own release must add nothing, or a full double tap
    // would end up flipped by one"*, and nothing consulted the set: a **completed** double tap
    // therefore went toggle → revert → **toggle**, and finished one out. ⚠ That is the DEAD
    // INSTRUMENT shape at its purest — a guard that cannot fire, described in prose as though
    // it does — and it is the third time on this project (`METHOD`).
    // ⭐ Consumed with `delete`, so the entry cannot survive into the next gesture and eat a
    // tap that has nothing to do with it.
    // ⭐ THE DECISION IS `tapReleaseToggles`'s; this reads the two facts and obeys. ⚠ The
    // alignment's own consumption is applied by its caller (`alignedByThisTap`), which is why
    // `false` is passed here — this helper is only ever reached when the tap was not spent that
    // way, and threading it twice would give the rule two masters.
    if (!tapReleaseToggles(pairReverted.delete(pointerId), false)) {
      lastVerdict = `${why} — release spent (its press reverted the pair)`;
      return;
    }
    behaviour = toggleBehaviour(behaviour);
    lastTapToggled = true;
    lastVerdict = `${why} → ${behaviour}`;
  };

  // ⛔⛔ **`pressToggled` AND `secondTouch` ARE DELETED WITH `D66`.** The first existed only
  // because a press could toggle; the second (`D65`) only because a press toggling made a
  // second touch's LIFT ambiguous. ⭐ With the press inert, a tap is a tap again — *"as per
  // present rule for tap"* — and `noteTap` needs no verdict from anyone.

  const noteTap = (
    pressed: Sample,
    released: Sample,
    pointerId: number,
  ): "TAP" | "DOUBLE_TAP" | null => {
    const wasTap = isTapRelease(
      pressed.t,
      pressed.x,
      pressed.y,
      released.t,
      released.x,
      released.y,
      cfg.tapMaxDuration,
      mmToPx(cfg.doubleTapSlop),
    );
    if (!wasTap) return null;
    // ⛔ The history is kept for §1.3's double tap whatever the fork, and the toggle depends
    // on neither its verdict nor on anything being held: *"a single tap by one only
    // touchpoint ANYWHERE also toggles"* (owner, 2026-09-16).
    const verdict = taps.record(pressed, released.t);
    // ⛔⛔ EVERY tap toggles — *"a single tap by one only touchpoint anywhere"* — with no
    // condition left: not the fork (there is one model now), and not whether anything is
    // held, since the mode is what the NEXT grab inherits.
    // ⛔⛔ **AND NOTHING SPENDS IT ANY MORE** (`D66`). Two rules used to: a press that had
    // already toggled (`D58`), and a second touch that had driven the body (`D64`). Both are
    // gone with the press toggle — *"a tap by the second touchpoint can [toggle], as per
    // present rule for tap"*. ⚠ The history is recorded first, as it always was: it is what the
    // double tap and the camera reset read.
    // ⭐ `D68`: this tap DID toggle, so a press that completes the pair may undo it — and the
    // arming is `toggleByTap`'s, not this function's, so the OBJECT path cannot disagree.
    toggleByTap("tap", pointerId);
    return verdict;
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

    // ⛔⛔⛔ **THE NUMBER THE WHOLE DEFECT TURNS ON**: the gap between two consecutive move events
    // FOR ONE POINTER. §1.1 rests an axis after `restConfirmMs` of silence, so a pointer whose
    // events arrive slower than that reads STATIONARY *between events while the finger is still
    // moving*. ⭐ Measured per pointer and reported as the WORST gap in the last second — a mean
    // would hide exactly the excursions that cause it.
    if (
      info.type === PointerEventTypes.POINTERDOWN ||
      info.type === PointerEventTypes.POINTERMOVE
    ) {
      const seen = eventGaps.get(e.pointerId);
      if (seen !== undefined && info.type === PointerEventTypes.POINTERMOVE) {
        seen.gaps.push({ t: s.t, ms: s.t - seen.last });
        while (seen.gaps.length > 0 && s.t - seen.gaps[0]!.t > 1000)
          seen.gaps.shift();
      }
      eventGaps.set(e.pointerId, { last: s.t, gaps: seen?.gaps ?? [] });
    }
    if (info.type === PointerEventTypes.POINTERUP)
      eventGaps.delete(e.pointerId);

    // ⭐ The anchor fork latches here, before anything is dispatched, so one event cannot be
    // judged half under one rule set and half under another.

    // ⭐⭐⭐ A15 — AN ORPHANED SELECTION IS COLLECTED HERE, AT THE NEXT INPUT EVENT, and
    // before anything is dispatched. ⛔ The owner's requirement: the lift itself changes
    // nothing, and the object is unselected only once the hand says something new — after
    // which THIS event flows into whatever rule the re-resolved configuration selects.
    // ⚠ A POINTERUP is deliberately absent: the orphaned holder's own release is handled
    // in its branch, where the §1.3 verdict has to be SKIPPED rather than re-resolved.

    // ⛔⛔⛔ **A PRESS FOR AN ID THAT NEVER RELEASED TAKES ITS OLD GRIP WITH IT** — audit fix,
    // 2026-09-17.
    //
    // ⚠⚠ `router.press` already drops its own record for an id that is pressed while still
    // down. ⛔ This file did not: it overwrites `held` only on the `OBJECT` branch, and the
    // `SECOND` and `IGNORED` branches `return` before reaching it. So a re-press that resolved
    // to either of those left the PREVIOUS grip in `held` — ticked every frame, holding a
    // recognizer and a mesh, and never deleted, because the branch that would have deleted it
    // belongs to a release that has already happened.
    // ⭐⭐ That is **defect 40's shape and `A13`'s at once**: *a tracker that outlived its
    // finger*, which this project has already paid for twice. ⚠ It needs a lost `pointerup`
    // plus a reused pointer id — rare, real (Firefox reuses ids), and impossible to reproduce
    // deliberately, which is exactly the kind of report that costs a day.
    // ⭐ The anchors go with it: `anchorMotion` lives on the grip, so dropping the grip drops
    // the trackers that would otherwise answer §1.1's question about a previous gesture's
    // travel.
    if (info.type === PointerEventTypes.POINTERDOWN && held.has(e.pointerId)) {
      held.get(e.pointerId)!.anchorMotion.clear();
      held.delete(e.pointerId);
      lastVerdict = `pressed an id that never released — dropped its stale grip`;
    }

    if (info.type === PointerEventTypes.POINTERDOWN) {
      // ⛔ A NEW TOUCH CANCELS A RESET IN FLIGHT. The animation writes the whole camera
      // pose every frame, so a drag during one would be overwritten as fast as it was
      // applied — the hand would appear to have no effect at all.
      cameraReset = null;
      const pick = info.pickInfo;
      const rayHit = pick?.hit && pick.pickedMesh ? pick.pickedMesh : null;
      // ⭐⭐⭐ **A SECOND TOUCH ON A FROZEN BODY IS TREATED AS A MISS** (the owner, 2026-09-23:
      // *"therefore, this second touch could for example move another object"*). ⛔ Filtered on
      // the way IN, before the latch, so every rule downstream sees a touchpoint that landed on
      // nothing — which is what makes it a working second finger for the body in the OTHER hand.
      // ⚠ The DECISION is `frozen_pick.ts`'s; this reads the two facts and obeys.
      const hitId = rayHit === null ? undefined : idOf.get(rayHit);
      // ⭐⭐⭐ **IS THE FACE UNDER THIS RAY ONE THE PRODUCT IS OFFERING?** — the owner, 2026-09-24:
      // *"frozen object fuchsia face is not responsive to touch and nothing happens."*
      //
      const hit = pressHit(
        rayHit,
        hitId !== undefined && world.objects.get(hitId)?.frozen === true,
        // ⛔ The count BEFORE this press is registered: `router.press` has not run yet.
        router.size,
      );
      // ⭐⭐ THE ONE PLACE A ROLE IS DECIDED, and it is decided by `IN2`, once.
      const routed = router.press(e.pointerId, s, hit);
      if (rayHit !== null && hit === null) {
        lastVerdict = `frozen ${hitId ?? "?"} — second touch routed as a MISS`;
      }

      // ⭐⭐⭐ **`D68` — A PRESS THAT COMPLETES A DOUBLE TAP UNDOES THE FIRST TAP'S TOGGLE.**
      // ⛔ The owner: *"if i double tap without release the pioneer and press the follower →
      // orange, the translation/rotation mode toggles: it should not."* ⚠ `D28`'s *two taps
      // revert* was keyed to the second RELEASE, and `D67`'s route to orange never lifts.
      // ⭐ THE DECISION IS `pairPressRevertsToggle`'s; this reads the two facts and obeys.
      if (pairPressRevertsToggle(taps.wouldPair(s), lastTapToggled)) {
        behaviour = toggleBehaviour(behaviour);
        lastTapToggled = false;
        // ⛔ …and this press's own release must not toggle again, or the full double tap would
        // end up flipped by one instead of reverting.
        pairReverted.add(e.pointerId);
        lastVerdict = `double tap (no release) → mode back to ${behaviour}`;
      }

      // ⛔⛔⛔ **`D66` — A PRESS NO LONGER TOGGLES THE MOVEMENT MODE, ANYWHERE.**
      //
      // > *"A press never toggles while a body is held, but a tap by the second touchpoint can
      // > (as per present rule for tap)."* — the owner, 2026-09-21
      //
      // ⭐⭐ `D58`'s two press triggers stood here and are **deleted**, and with them `D61`'s
      // exemption, `pressToggled` and `Held.outsidePressSeen`. ⚠ Everything they contained was
      // a consequence of the press toggle itself: the `A16` collision (*placing the control
      // finger flips what it will drive*) cannot happen once placing a finger does nothing.
      // ⭐ What is left is `D28`'s original rule, which `A16` asked for in the first place:
      // **switching the mode requires a TAP.**

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
            cfg.orbitCentreGraceMs > 0
              ? { x: e.clientX, y: e.clientY, at: s.t }
              : null;
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
      // ⭐⭐⭐ `IN3` RULE 2 — *"the hit object is selected and the hit face is selected."*
      //
      // ⛔⛔ FROM THE PICKED **NORMAL**, never from `pickInfo.faceId`: that is a TRIANGLE
      // index, a box face is two of them, and an imported mesh face is arbitrarily many.
      // ⭐ `core/face_pick.ts` owns the mapping and carries the frame — the pick arrives in
      // world, face normals are stored local, and getting that direction backwards is the
      // silent error that only shows once an object has been turned.
      // ⭐⭐ EVERY PRESS ON AN OBJECT RESOLVES ITS FACE, from the picked **NORMAL**.
      // ⛔ `getNormal(true)` asks Babylon for the WORLD-space normal at the hit; the mapping
      // to a face lives in `core/face_pick.ts`, which carries the frame — the pick arrives in
      // world, face normals are stored local, and getting that direction backwards is the
      // silent error that only shows once an object has been turned.
      // ⚠ PER GRIP: the alignment's trigger names TWO faces on two objects at once, so one
      // global selection cannot express it.
      // ⛔ A PRESS DOES **NOT** HIGHLIGHT. The highlight is the ALIGNMENT's state — *"the
      // FollowerFace shall remain highlighted until un-highlight occurs"* is the alignment's
      // clause — so a press that aligns nothing draws nothing.
      const faceNormal = pick?.getNormal(true);
      const pickedId = idOf.get(mesh);
      // ⚠ `faceHit`, not `hit`: `hit` is the picked MESH a few lines above, and two different
      // things called the same name in one scope is how the wrong one gets used.
      const faceHit =
        faceNormal && pickedId !== undefined
          ? faceFromPickedNormal(world, pickedId, [
              faceNormal.x,
              faceNormal.y,
              faceNormal.z,
            ] as Vec3)
          : null;
      const pressFace = faceHit
        ? { faceId: faceHit.faceId, cos: faceHit.cos }
        : null;
      lastVerdict = faceHit
        ? `${pickedId}/${faceHit.faceId} under the finger (cos ${faceHit.cos.toFixed(2)})`
        : "no face resolved";
      const rec = new Recognizer(cfg, poseOf(mesh), taps);
      rec.press(s);
      held.set(e.pointerId, {
        rec,
        mesh,
        frame: requireGestureFrame(),
        prev: s,
        // ⭐ `D67`: asked HERE, once, on the way down — a peek, not a record. The release still
        // consumes the pair through `TapHistory.record`.
        pressWasDoubleTap: taps.wouldPair(s),
        pointerType: e.pointerType,
        mode: null,
        pressFace,
        alignmentTouched: false,
        pressActed: false,
        sway: new SwayWatcher(cfg.swayTurnDeg, cfg.pointerNoiseMm),
        anchorMotion: new Map(),
        anchorRollSign: new Map(),
        // ⭐ The four tunables and the MEASURED noise — passed in, never assumed, exactly as
        // `SwayWatcher` takes it.
        // ⛔⛔ THROUGH `shakeParamsFrom`, AND THAT IS A FIX: this file built the same four
        // fields inline while `shake.ts` exported the function for it — two copies of one
        // mapping, which is precisely what `CONSTRAINTS` §4 forbids (*a tuning value needed in
        // two places is IMPORTED, never copied*). ⚠ Nothing had drifted yet; the point is that
        // nothing now can.
        shake: new ShakeDetector(shakeParamsFrom(cfg), cfg.pointerNoiseMm),
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
      // ⭐⭐⭐ **`D55` — THE PIONEER–FOLLOWER MECHANISM TOGGLES ON *HERE*, ON THE WAY DOWN.**
      //
      // > *"when first touch is pressed on first object, as soon as a second touch is pressed
      // > on second object (= a tap or a continued press), the Pioneer - Follower mechanism
      // > toggles on. To toggle off, the rule stays unchanged."* — the owner, 2026-09-19
      //
      // ⛔⛔ **IT IS THE TRIGGER THAT MOVED, NOT THE MECHANISM.** `alignFollowerToPioneer` is
      // called unchanged, with all its refusals — frozen Follower, no resolved face, the cycle
      // undo — and the release path below still owns every way OUT. ⭐ What changed is that a
      // **continued press** now counts: the old trigger was a release verdict, so a finger that
      // came down on the second body and stayed there aligned NOTHING until it lifted.
      //
      // ⚠⚠ **AND THIS IS WHERE `D51` BECOMES THE ORDINARY POSTURE.** `pinnedPair` needs a live
      // relation, and the relation used to cost a deliberate tap; now the grab IS it. ⛔ With
      // `pioneerTranslates = 0` at boot, the second body stops being cargo and becomes a
      // control surface — its finger drives the Follower's depth and roll — the instant it is
      // touched. ⭐ That is the owner's intent read plainly, and it is stated rather than
      // discovered because it changes what two fingers on two bodies do at boot.
      //
      // ⛔ THE DECISION IS `pressMeaning`'s, NOT THIS FILE'S — `pioneer_cascade.ts`'s rule: *a
      // RULE in a render file is a rule nothing can interrogate.* ⚠ Only the WIRING is here.
      const pressGrip = held.get(e.pointerId)!;
      const pressOthers = [...held.entries()].filter(
        ([pid]) => pid !== e.pointerId,
      );
      const pressHeldIds = pressOthers
        .map(([, g]) => idOf.get(g.mesh))
        .filter((v): v is string => v !== undefined);
      // ⚠ Asked only when exactly one other body is held, so `links` is consulted about a body
      // that unambiguously exists — the same guard `pressMeaning` re-states and refuses on.
      const pressHeldId = pressHeldIds.length === 1 ? pressHeldIds[0]! : null;
      // ⚠ The held GRIP, not just its id: `D67` reads the Pioneer's own press for the mode.
      const pressHeldGrip =
        pressOthers.length === 1 ? pressOthers[0]![1] : undefined;
      const pressPioneerOfHeld =
        pressHeldId === null ? null : links.pioneerFor(pressHeldId);
      // ⭐⭐⭐ **A FUCHSIA FACE PRESSED BY THE SECOND TOUCH BECOMES THE PIONEERFACE.**
      //
      // > *"if one fuchsia highlighted face is pressed by second touch, it becomes PioneerFace and
      // > the object becomes Pioneer object and the highlight switches to the pioneer highlight
      // > and the object with HitFace becomes aligned Follower object and the HitFace becomes
      // > FollowerFace."* — the owner, 2026-09-24
      //
      // ⛔⛔ **THE ROLES ARE THE INVERSE OF `D67`'s**, which is why this cannot be folded into
      // `pressMeaning`: there the PRESSED body is the Follower and the HELD one the Pioneer,
      // because the hand reaches out to the part it wants to move. ⚠ Here the hand is already
      // holding the part and reaching out to the thing it wants to align TO — the fuchsia
      // highlight is what makes the intent unambiguous, and it only exists in this configuration.
      //
      // ⭐ It tails into what is already built: `alignFollowerToPioneer` is called with the HELD
      // grip as the Follower, so it finds the freshly pressed body as its one other holder and
      // every downstream rule — the colours, the two-way index, the cascade — is the vetted one.
      // ⛔ `pressActed` from the RETURN VALUE, as `D67`'s branch does: a refusal must leave the
      // release untouched so the tap still means what it always meant.
      // ⭐⭐⭐ **THE SECOND PRESS OF A DOUBLE TAP UPGRADES THE RELATION TO `FOLLOW`.**
      //
      // > *"rapid double tap on fuchsia face does not trigger the amber mode"* — the owner
      //
      // ⛔⛔ **THE FIRST PRESS CONSUMES THE OFFER, WHICH IS WHY THE SECOND ONE MISSES IT.** Once
      // it aligns, the held body IS aligned — and `pressMeaning` answers `NOTHING` for a press on
      // the very face it now follows (`D39`'s rule, so a press-and-hold does not silently undo).
      // ⭐ So the pair is recognised on the LINK that already exists rather than on an offer that
      // no longer does: same two bodies, same face, and this press pairs with the last.
      // ⚠ Waiting out the double-tap window before aligning was the other way to fix it, and it
      // would put the whole gesture behind a timer — `D73`'s lesson about lag, one rule over.
      //
      // ⛔ The ALIGN half of this branch is **deleted by `D87`**: with the roles inverted,
      // `pressMeaning` aligns the held body to the pressed one for ANY face, so a separate rule
      // for fuchsia ones would be a second decision about the same gesture. ⭐ The highlight is
      // what it always was — guidance — and no longer a precondition for acting.
      const heldPioneer =
        pressHeldId === null ? null : links.pioneerFor(pressHeldId);
      if (
        pressGrip.pressWasDoubleTap === true &&
        pressHeldId !== null &&
        pickedId !== undefined &&
        pressFace !== null &&
        heldPioneer !== null &&
        heldPioneer.objectId === pickedId &&
        heldPioneer.faceId === pressFace.faceId
      ) {
        alignModeOf.set(pressHeldId, "FOLLOW");
        lastVerdict = `align: ${pressHeldId} → FOLLOW (double tap on its Pioneer face)`;
        pressGrip.pressActed = true;
        paint();
        return;
      }
      const pressVerdict = pressMeaning({
        // ⭐ `D67`: the body under THIS press is the FOLLOWER, and the held one is the Pioneer.
        pressedObject: pickedId ?? null,
        pressedFace: pressFace?.faceId ?? null,
        heldObjects: pressHeldIds,
        // ⛔ The cycle guard, in the inverted direction: does the PIONEER already follow the
        // body being pressed?
        pioneerOfHeld:
          pressPioneerOfHeld === null ? null : pressPioneerOfHeld.objectId,
        // ⭐⭐ The HELD body's CURRENT FollowerFace — it is the FOLLOWER under `D87`, so *already
        // aligned to this very face* is a question about IT. ⛔ Derived from its constraint rather
        // than remembered: `alignedFaceOf` is the one implementation, and a shadow copy would be a
        // second source of truth free to disagree after an eviction.
        alignedFaceOfHeld:
          pressHeldId === null ? null : alignedFaceOf(world, pressHeldId),
        // ⭐⭐ The PIONEERFACE the held body follows — a face of the PRESSED body, and the only
        // thing `pressedFace` may be compared against. ⛔ Straight off the link, not remembered.
        pioneerFaceOfHeld: pressPioneerOfHeld?.faceId ?? null,
        // ⭐ The held body's HitFace: the FollowerFace this press WOULD use. ⚠ A different one
        // makes the press a RE-POINT rather than a no-op.
        heldPressFace: pressHeldGrip?.pressFace?.faceId ?? null,
        // ⭐⭐⭐ **`D87` — THE MODE COMES FROM *THIS* PRESS.** ⛔ `D67` read it off the held grip
        // because the held body was the Pioneer; inverted, the Pioneer is the body being pressed,
        // so the touch that selects it is the one that says which relation is wanted.
        pressWasDoubleTap: pressGrip.pressWasDoubleTap === true,
      });
      if (
        pressVerdict.action === "ALIGN" &&
        pressVerdict.mode !== null &&
        pressHeldGrip !== undefined
      ) {
        // ⭐⭐⭐ **`D87` — THE HELD BODY IS THE FOLLOWER NOW.** ⛔ So the call is made with the
        // HELD pointer and grip, and `alignFollowerToPioneer` finds the freshly pressed body as
        // its one other holder — the Pioneer. ⚠ Under `D67` these two arguments were this press's
        // own, which is the whole of the inversion at the wiring level.
        // ⛔ `pressActed` is set from the RETURN VALUE, never from the intent. Every refusal
        // inside `alignFollowerToPioneer` returns `false` and says why on the HUD, and a press
        // that aligned nothing must leave its release completely untouched — the tap then means
        // whatever it has always meant, including `D28`'s toggle.
        pressGrip.pressActed = alignFollowerToPioneer(
          pressOthers[0]![0],
          pressHeldGrip,
          pressVerdict.mode,
          // ⭐ THIS press's finger is the transient one: it selected the Pioneer and will lift.
          // ⛔ The held grip keeps its HitFace, which is what `D39`'s re-press compares against.
          pressGrip,
        );
      }
      // ⛔⛔ `A22`'s **SWITCH** branch stood here and is deleted with `D67`: the upgrade to
      // `FOLLOW` was the second touch's rapid pair, and the owner has moved that decision to
      // the PIONEER's own press. ⚠ `pressMeaning` can no longer return `SWITCH` at all.
      // ⛔ `D58`'s THIRD TRIGGER — a continued press on the held body's exact PioneerFace —
      // stood here and is **deleted by `D66`**. ⚠ It was the one press on a Pioneer that had no
      // other job; it now has none again, and `A22`'s rapid-pair upgrade keeps the gesture.
      paint();
      return;
    }

    // ⛔ Everything past here is a MOVE or an UP for a touchpoint already latched. The
    // role decides which rule sees it — never a second look at what is under the finger.
    const routed = router.get(e.pointerId);
    if (!routed) return;

    if (routed.role === "SECOND") {
      if (info.type === PointerEventTypes.POINTERUP) {
        forgetAnchor(routed.seq);
        router.release(e.pointerId);
        lastVerdict = "second touchpoint released";
        // ⭐⭐⭐ *"Tapped ANYWHERE"* includes the held object itself.
        // ⚠ A `SECOND` release never fed §1.3's tap history before the toggle existed. It
        // does now, and that is deliberate: a tap on the held object is a tap *anywhere*.
        // ⛔⛔ **`D64` — AND A FINGER THAT DROVE THIS BODY DOES NOT TOGGLE ON THE WAY UP.**
        // ⚠ Both sets are consulted unconditionally, never short-circuited: each owns an entry
        // for this pointer id and leaving one behind would eat the NEXT gesture's tap.
        noteTap(routed.pressed, s, e.pointerId);
        // ⭐⭐⭐ A15: released FROM THE SAME OBJECT (A12's roll/depth finger). Ask whether
        // the holder is still on its object before anything else can happen.
      } else {
        router.move(e.pointerId, s, info.pickInfo?.pickedMesh ?? null);
        // ⭐⭐⭐ A12: A SECOND FINGER ON THE SAME OBJECT DRIVES IT, exactly as one outside
        // does — the owner: *"second touchpoint INSIDE OR OUTSIDE any object"*. Its x is
        // roll and its y is depth, while the finger on the object is held still.
        // ⚠ A touchpoint on a DIFFERENT object is deliberately excluded: that is §4 rule 5
        // / 6bis / 6ter's configuration and must stay reachable.
        const holder2 = router
          .objects()
          .find((q) => q.object === routed.object);
        const grip2 = holder2 ? held.get(holder2.id) : undefined;
        // ⚠ `SAME_OBJECT` is untouched by `D59` — the owner's sentence says *outside any
        // object* — but it goes through the same table so all three configurations are decided
        // in one place rather than by three scattered call sites.
        if (
          grip2 &&
          applyDepthDrag(
            grip2,
            routed.seq,
            s,
            secondTouchDrive("SAME_OBJECT", gripIsAlignedFollower(grip2)) ===
              "BOTH",
          )
        ) {
          // ⚠ `D64` recorded a DRIVE here and `D65` deleted it: the fact could not answer the
          // question, because a finger moved along the channel the mode did not give it drives
          // nothing and is not a tap either. Nothing to record — the press already decided.
        }
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
        forgetAnchor(routed.seq);
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
        // ⭐⭐ THIS IS THE FINGER THAT DRIVES DEPTH OR ROLL, and this branch is the only place
        // either is applied. ✅ **SIMULTANEOUS SINCE 2026-09-17** (owner): the holder's own
        // x/y keep running in their own handler while this one adds its axis, and the two SUM.
        // ⛔ `A10`'s gate — which required the holder to be STILL — is deleted, and
        // `depth_translate.ts` carries the note: what it protected is worth knowing first.
        const holder = router.objects()[0];
        const grip = holder ? held.get(holder.id) : undefined;
        // ⭐⭐⭐ **`D59` — AN ALIGNED FOLLOWER GIVES THIS FINGER BOTH AXES**, exactly as a
        // finger on its Pioneer already did. ⛔ The owner's generalisation: an aligned body has
        // one rotational DOF left, so there is nothing for the movement mode to choose between.
        // ⚠ A FREE body still has three, and `A16`'s split still earns its keep there.
        if (
          grip &&
          applyDepthDrag(
            grip,
            routed.seq,
            s,
            secondTouchDrive("OUTSIDE", gripIsAlignedFollower(grip)) === "BOTH",
          )
        ) {
          paint();
          return;
        }
        if (router.outside().length === 2) {
          updatePinch();
        } else if (
          router.outside().length === 1 &&
          router.objects().length === 0
        ) {
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
        forgetAnchor(routed.seq);
        router.release(e.pointerId);
        // ⭐⭐⭐ A15: this is A10's DEPTH ANCHOR going up — the case that motivated the
        // amendment, because depth is what slides the object off the holder's finger.
        // ⛔ A pinch needs BOTH touchpoints. Lifting one ends it rather than letting
        // the survivor keep scaling against a partner that is gone.
        pinch.end();
        // ⭐⭐ ONE call, ONE record: it judges the tap, keeps §1.3's history, and arms fork
        // C's pending toggle. ⛔ A DOUBLE tap keeps exactly the meaning it has in forks A and
        // B — the camera reset — and cancels the pending toggle rather than being consumed
        // by it. ⭐ That is what the discrimination bought: the two gestures stopped
        // overlapping, so the special case disappeared instead of growing.
        // ⛔⛔ **`D64` — a finger that drove depth or roll releases, it does not tap.** ⚠ The
        // DOUBLE-TAP is untouched: the history is recorded either way, so the camera reset
        // pairs exactly as it always has. Only the toggle is spent.
        // ⭐⭐⭐ **`D95` — A TAP HERE WHILE HOLDING AN ALIGNED BODY RELEASES ITS ALIGNMENT**, and is
        // consumed rather than also toggling the mode. ⛔ Judged with the SAME tap test `noteTap`
        // uses, and asked BEFORE it, because `noteTap` toggles. ⭐ The desktop's right-hold + left
        // click on empty space arrives here as exactly this configuration (`D94`).
        const soleHolder =
          router.objects().length === 1 ? router.objects()[0] : undefined;
        const heldGrip = soleHolder ? held.get(soleHolder.id) : undefined;
        const heldId = heldGrip ? idOf.get(heldGrip.mesh) : undefined;
        const isTap = isTapRelease(
          routed.pressed.t,
          routed.pressed.x,
          routed.pressed.y,
          s.t,
          s.x,
          s.y,
          cfg.tapMaxDuration,
          mmToPx(cfg.doubleTapSlop),
        );
        if (
          isTap &&
          heldGrip !== undefined &&
          heldId !== undefined &&
          outsideTapReleases(
            router.objects().length,
            alignedFaceOf(world, heldId) !== null,
          )
        ) {
          // ⚠ The history is still recorded, so a double tap keeps pairing exactly as it did.
          taps.record(routed.pressed, s.t);
          releaseAlignmentOf(heldId);
          heldGrip.alignmentTouched = false;
          lastVerdict = `align: TAP on empty space released the alignment on ${heldId}`;
        } else if (noteTap(routed.pressed, s, e.pointerId) === "DOUBLE_TAP") {
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

      // ⭐⭐⭐ **`D51` — A PINNED PIONEER STEERS THE FOLLOWER AND DOES NOT MOVE ITSELF.**
      //
      // > *"if it is toggled off … 1) the Pioneer cannot translate and 2) the second touchpoint
      // > controls both the depth translation and the roll of the Follower object"*
      //
      // ⛔ BEFORE the recognizer commits this grip to a continuous rule, because the point is
      // that this body has **no** continuous rule of its own while pinned. ⚠ Letting it commit
      // and then suppressing the write would leave the sway, the shake and the mode latch all
      // running on a gesture that moves nothing — which is how a *retired gesture that still
      // owns a verdict* happens (defect 40).
      // ⭐ The drive goes through the SAME path `A10`'s second finger uses, with `bothAxes` — so
      // the roll's constraint channel, the snap ride-along and the depth clamp are the vetted
      // ones rather than a second copy. ⛔ `METHOD`: one rule, one implementation.
      {
        const pin = pinnedNow();
        const myId = idOf.get(grip.mesh);
        if (pin !== null && myId === pin.pioneer && routed !== null) {
          const target = gripOfObject(pin.follower);
          if (target !== undefined) {
            applyDepthDrag(
              target,
              routed.seq,
              s,
              secondTouchDrive("PIONEER", gripIsAlignedFollower(target)) ===
                "BOTH",
            );
          }
          // ⚠ The Pioneer's own recognizer is still fed — a shake on it must still release its
          // followers, and a tap must still be a tap. ⛔ What it does NOT get is a continuous
          // rule: no translate, no rotate, no sway kick of its own.
          grip.rec.move(s);
          grip.shake.push(s);
          paint();
          return;
        }
      }

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
        // ⭐⭐⭐ A14: A LIFT-AND-REPLACE IS ONE GESTURE. Between the lift and the press
        // there is genuinely one touchpoint down, so without the grace A13 translates
        // through the middle of a swap — and a swap is 150-300 ms of hand, which is very
        // visible if the holder happens to be moving at the time. ⚠ That is exactly why the
        // owner's cases 2 and 3 *"differ by timing of the input"*.
        // ⭐⭐ **ONE RULE, ONE PLACE** (`A16`): `translatesOnDrag` is the same function the
        // highlight condition reads, so the two cannot drift apart. ⛔ It used to be spelled
        // inline here as `objects().length === 1 ? behaviour : "TRANSLATE"`, and a second copy
        // in `highlight.ts` would have been two implementations of one rule — free to
        // disagree, with nothing to catch it.
        // ⭐⭐⭐ `D60` — **AND A SECOND TOUCH THAT OWNS ROLL + DEPTH TAKES THE MODE'S PLACE.**
        // ⛔ The owner's completion: *"the first touch shall control the translation with delta
        // position x and y — which is currently the case in translation mode but not in rotation
        // mode."* ⚠ Without it the first touch keeps twisting about the very axis the second
        // touch's `dx` turns, and two fingers drive ONE DOF.
        grip.mode = translatesOnDrag(
          router.objects().length,
          behaviour,
          secondTouchOwnsRollAndDepth(grip),
        )
          ? "TRANSLATE"
          : "ROTATE";
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

      // ⭐⭐⭐ **FORK C's SHAKE — AND IT IS NOT GATED ON THE MODE, UNLIKE `D32`'s.**
      //
      // > *"Shaking of one object releases the alignment constraints on that object and
      // > un-highlight the FollowerFace and then nullify the FollowerFace."*
      //
      // ⛔⛔ NOT GATED ON THE MODE, and `D32` (which gated fork B's) is deleted with fork B.
      // The owner's sentence carries no mode condition, and said so again when it failed —
      // *"the shake is not working in translation mode, contradicting what you have written
      // above: correct this bug."*
      // ⚠⚠ IT WAS NOT THIS GATE THAT FAILED THEM. The block already ran in both modes; what
      // failed was the detector, which claimed its axis ONCE at the start of the gesture — so
      // after an alignment (which takes a hold and a tap, i.e. time) no later shake could
      // ever register, in either mode. `shake.ts` carries that defect and its fix.
      // ⚠ The cost of having no mode gate is accepted and named: in fork C a vigorous
      // repositioning can evict, and the four shake tunables are the only defence. Their
      // sliders ship with the rule.
      {
        const fired = grip.shake.push(s);
        const sid = idOf.get(grip.mesh);
        if (fired && sid !== undefined) {
          const ev = evictObjectConstraints(world, sid);
          world = ev.world;
          if (ev.result.refused) {
            lastVerdict = "align: shake — nothing to release";
          } else {
            // ⭐ *"un-highlight the FollowerFace and then nullify the FollowerFace"* — the
            // highlight IS the alignment's state, so it goes with it (`D35`).
            // ⭐ *"un-highlight the FollowerFace"* — and the Pioneer's contour with it: both
            // report the same alignment, so neither may outlive it (the owner's amendment).
            if (selectedFace?.objectId === sid) {
              cancelAlignAnim(selectedFace.objectId);
              selectedFace = null;
            }
            if (selectedFace === null) {
            }
            grip.alignmentTouched = false;
            lastVerdict = `align: SHAKE released the alignment on ${sid}`;
          }
          // ⭐⭐⭐ **A SHAKE ON A *PIONEER* RELEASES **EVERY** FOLLOWER ALIGNED TO IT.**
          //
          // > *"If the said pioneer object is later shaken, the alignment of the aligned object
          // > shall be released … in case I have aligned one object and then another object to
          // > the same pioneer object: when I shake the pioneer object it shall release all the
          // > follower objects"* — the owner, 2026-09-17
          //
          // ⛔⛔ **TWO THINGS CHANGED HERE AND BOTH WERE LIMITATIONS, NOT CHOICES.**
          // ⚠ It was gated on `alignMode === "FOLLOW"`, on the argument that `SNAPSHOT` got the
          // same outcome for free — shaking while rotating turns the body, and a turned Pioneer
          // releases a `SNAPSHOT`. ⛔ That argument had a hole this file already admitted: in
          // `SNAPSHOT` with the mode on `TRANSLATE`, a shake turns nothing, so it released
          // nothing. ✅ Now the rule is unconditional and the hole is closed.
          // ⚠ And it compared ONE `pioneerFace` against ONE `selectedFace`, so at most a single
          // follower was released. ✅ `pioneerOf` is many-to-one, so all of them go.
          //
          // ⭐⭐ AN INDEX LOOKUP, NOT A SCAN over every alignment in the scene — and
          // `followersOf` hands back a COPY, because releasing mutates the very set being
          // walked and deleting from a live `Set` mid-iteration silently skips entries.
          const orphaned = links.followersOf(sid);
          if (orphaned.length > 0) {
            for (const followerId of orphaned) releaseAlignmentOf(followerId);
            lastVerdict =
              `align: SHAKE on Pioneer ${sid} released ${orphaned.length} follower` +
              `${orphaned.length === 1 ? "" : "s"} (${orphaned.join(", ")})`;
          }
        }
      }
      if (grip.mode === "TRANSLATE") {
        // §4 RULE 6 — ⛔⛔ **NO LONGER THE SCREEN VIEW PLANE** (`D75`, 2026-09-22): the body is
        // translated along ITS OWN AXES, and the two comments below about the gain and the
        // deadband are the parts of rule 6 that survive unchanged.
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
        // ⭐⭐⭐ **THE CHANNELS ARE REMAPPED (the owner, 2026-09-22)**: `dx` drives the body's
        // **x** axis and `dy` drives its **depth** axis — both horizontal outside the zone — and
        // the SECOND touchpoint's `dy` drives its **gravity** axis (`applyDepthStep`).
        // ⛔⛔ It is unconditional: `worldAxisB` chooses WHICH axes, never whether the remap
        // applies. ⚠ What it costs, and it is inherent rather than tunable: the holder's `dy`
        // goes quiet at a level camera, where a depth change produces no screen motion at all.
        // ⭐ `axis_translate.ts` derives it, and the sign `depthTranslate` needed `awaySign`
        // for falls out of the projection instead of being asserted.
        // ⚠ `sid` above is scoped to the shake block; this branch asks for its own. ⛔ A body
        // the model does not know is given the boot basis rather than no basis — it is still
        // being dragged, and the alternative is a frame in which the finger does nothing.
        const tid = idOf.get(grip.mesh);
        const axes =
          tid === undefined
            ? (bootObjectAxes ?? axesFromFrame(grip.frame))
            : axesOf();
        const travel = axisTravel(
          {
            holderDxPx: grip.rec.step.dx,
            holderDyPx: grip.rec.step.dy,
            secondDyPx: 0,
          },
          // ⛔ THE TRUE CAMERA AXES, not the gravity frame: the question is what the axis looks
          // like ON THE GLASS. ⚠ Handing it `grip.frame` would make the depth channel's
          // projection identically zero at every camera angle.
          screenFrame(),
          axes,
          trackingMetresPerPx(camera.radius, camera.fov, canvas.clientHeight),
          cfg.gainTranslateScreen,
          cfg.gainTranslateDepth,
          cfg.translatePairing === 1 ? "PLANE" : "CHANNELS",
          cfg.axisTrackingConeDeg,
          // ⭐ Read ONLY inside the cone, where it is the sign `depthTranslate` needed: +1
          // looking down on the scene, −1 looking up at it.
          grip.frame.towardGravity,
        );
        noteAxisTravel(tid, travel);
        lastTrackGain = travel.trackGain;
        lastEdgeOn = travel.edgeOn;
        const step = axisDisplacement(travel, axes);
        // ⭐ `grip.frame` is the basis LATCHED AT PRESS, and `applyWorldStep` uses it for the
        // swing's screen travel and the depth clamp only — the body's own axes decide the
        // motion, and with `worldAxisB` they were latched at BOOT rather than at this press.
        // ⛔ THE FINGER MOVES THE TARGET, NOT THE MESH. The mesh chases it in the render
        // loop. With `translateInertiaMs` at 0 the two are the same thing.
        // ⛔ THE FINGER MOVES THE MODEL. The follower's target is re-read from it every
        // frame, so the inertia stays exactly what it was — a filter on the way to the
        // screen, and no longer the place the object's position is kept.
        // ⭐⭐⭐ **CASE 2's BLEND IS DRIVEN BY *THIS* FINGER** — without it the retarget was
        // invisible: `centreBlend.advance` is called from the ORBIT branch only, so during an
        // object drag the target moved and the camera never migrated to it (measured on the
        // tablet as `→0%` forever). ⛔ The same quantity the orbit uses — millimetres of finger
        // travel — so the centre arrives as the gesture progresses rather than on a timer.
        // ⚠ Gated on the selector so **case 1 is byte-for-byte what it was**.
        if (cfg.approachRetargetsOrbit === 1 && centreBlend.isBlending) {
          centreBlend.advance(
            Math.hypot(grip.rec.step.dx, grip.rec.step.dy) / mmToPx(1),
          );
          syncCentre();
        }
        // ⭐ ONE writer for an applied step: it moves the body, feeds the swing's direction and
        // records the travel direction the LeadingFace ray is fired along. ⛔ THE FINGER MOVES
        // THE MODEL — the follower re-reads it every frame, so the inertia stays a filter on the
        // way to the screen rather than the place the position is kept.
        applyWorldStep(grip, step);
      } else if (grip.mode === "ROTATE") {
        // The provisional motion — applied LIVE, and undone by the recognizer itself
        // if the flick test passes at release.
        //
        // ⭐⭐⭐ `IN3`: RULE 2bis NOW HAS ITS PRECONDITION — *"with an empty constraint
        // stack"* — and it is asked through `dragRule`, which is also where 2sexte and the
        // two-constraint refusal live. ⛔ In forks A and C the stack is never consulted, so
        // this reads exactly as it did before: today's behaviour is the default.
        //
        // ⚠⚠ AND THE UNWIRED BRANCH DOES NOTHING RATHER THAN THE WRONG THING.
        // `CONSTRAINED_ROTATE`'s driver (`anchor_rotate.ts`, 25 vectors) is built and NOT
        // wired — blocked on a decision `A12` reopened by moving roll to the second
        // touchpoint. ⛔ So a constrained object does not rotate at all, and the readout
        // names the rule that would have run. A fall-through to free rotation would
        // silently break the anchor the user set, which is the defect §1.4's eviction
        // clause exists to prevent, arriving by a different door.
        // ⭐⭐⭐ **FORK C: AN ALIGNED OBJECT TWISTS ABOUT ITS OWN ALIGNED NORMAL** — the
        // owner's answer to *an aligned object, one finger, no target*: **twist about the
        // aligned normal**.
        //
        // ⭐⭐ `anchor_rotate.ts` is reused UNCHANGED, and that is the point: it was built for
        // `A3`/2sexte in fork B, and the geometry of *one constraint, one free DOF* does not
        // care which fork created the constraint. ⚠ What differs is only that fork C can
        // never reach two constraints (the cap), so there is no refusal branch here.
        // ⛔ It REFUSES where the axis points at the camera — the projection has no direction
        // there — and says so, rather than turning the object by an arbitrary amount.
        {
          const fid = idOf.get(grip.mesh);
          const fstack =
            fid === undefined
              ? []
              : (world.objects.get(fid)?.constraints ?? []);
          // ⛔⛔ **`rotationChannel`, NOT `fstack.length === 1`** — audit, 2026-09-17. The count
          // asked the wrong question: it meant *"is this body aligned?"* and answered *"does it
          // hold exactly one thing?"*, so a body holding a MATE plus an alignment fell through
          // to the FREE rotation below and broke both. ⚠ Unreachable under the cap, armed by
          // `3D2`. ⭐ The REFUSED verdict is the honest third answer, and it is reported.
          const channel = rotationChannel(fstack);
          if (channel.kind === "REFUSED") {
            lastVerdict = `align: rotation refused — ${channel.why}`;
            // ⛔⛔⛔ **AND IT RETURNS, WHICH IS THE ENTIRE POINT OF THE FIX.** Setting a verdict
            // and falling through would leave the body FREE-ROTATING under the refusal — the
            // very behaviour this branch exists to prevent, with a readout that says the
            // opposite. ⚠ That is the readout-that-lies shape, and it would have been worse
            // than the defect it replaced: the HUD would have reported the refusal while the
            // mate broke.
            grip.prev = s;
            paint();
            return;
          } else if (channel.kind === "TWIST") {
            const axis = channel.axis;
            // ⭐⭐ **THE GREY LINE COVERS THIS GESTURE TOO** — the owner, 2026-09-23: *"also when
            // there is rotation with the dx of the first touch in rotation mode (on aligned
            // follower object)."* ⛔ Recorded where the turn is APPLIED, exactly as the second
            // touchpoint's roll is: both channels twist about the SAME constraint axis, and a
            // gizmo that learned it from only one of them would go blank on the other.
            noteTurnAxis(idOf.get(grip.mesh), TURN_ROLL, axis);
            // ⛔⛔⛔ **D57 REACHES THE FIRST TOUCHPOINT AT LAST** -- device-reported 2026-09-22:
            // *"there are some cases where the dx delta position and the yaw rotation direction
            // are inverted."*
            //
            // ⛔⛔ **MEASURED, NOT REASONED.** A sweep of the FREE yaw over 408 camera positions
            // found **zero** inversions -- it turns about the world vertical and cannot reverse.
            // A sweep of THIS channel over alignment orientations found **12 of 24**, exactly the
            // half a cosine predicts. ⭐ *"Same symptom" never means "same cause"*: the report
            // said *yaw*, and the culprit was the twist.
            //
            // ⭐⭐ **THE CAUSE IS THE PROJECTION D57 ALREADY DELETED FROM THE OTHER CHANNEL.**
            // `constrainedDragAngle` maps the drag onto the NEAR-SIDE screen direction, whose
            // x component reverses as the alignment axis swings past horizontal-on-screen. The
            // second touchpoint had exactly this, and the owner dictated the cure in 2026-09-19's
            // own words: *"If there are cos or sin projections on axis based on orientation,
            // remove those projections."* ⚠ It was applied to one channel and not its twin --
            // `METHOD`: *when a rule has two channels, the correction belongs to the RULE.*
            //
            // ⚠⚠ **WHAT IT COSTS, STATED**: `dy` no longer contributes. The old mapping let a
            // hand drag ALONG the near-side direction whatever its screen orientation; now a
            // vertical drag does not twist. ⛔ That is the trade D57 already made once, and it
            // buys the property the owner asked for: `dx` and the turn always agree.
            let twistSign = grip.twistSign;
            if (twistSign === undefined) {
              // ⭐ LATCHED AT FIRST USE, exactly as the second touchpoint latches its own --
              // recomputed per frame it would flip mid-drag as the axis swung through
              // horizontal-on-screen, which is worse than being inverted consistently.
              twistSign = rollSignFor(screenFrame(), axis);
              grip.twistSign = twistSign;
            }
            const twist = flatTwistAngle(
              grip.rec.step.dx,
              twistSign,
              cfg.gainRotateConstrained,
            );
            if (twist !== 0) {
              if (
                incrementRadians(cfg.rotationIncrementDeg) !== null &&
                fid !== undefined
              ) {
                rotationTally.add(fid, "twist", axis, twist);
              } else {
                setModelOrientation(
                  grip.mesh,
                  rotateAboutAxis(modelOrientation(grip.mesh), axis, twist),
                );
              }
              // ⛔⛔ **DEVICE-REPORTED 2026-09-17: *"there is no slerp during rotation: did you
              // wire it?"*** ⭐ It was wired, in both modes — and this line used to SETTLE the
              // snap, so the first finger movement past the deadband landed it instantly. In
              // `TRANSLATE` the holder writes only POSITION, so the animation survived and the
              // slerp was visible; in `ROTATE` the twist wrote the orientation and killed it.
              // That is why it looked wired in one mode and missing in the other.
              // ✅ NOW IT RIDES ALONG: the twist is a WORLD rotation about the aligned axis, so
              // composing it onto both ends of the animation keeps the snap travelling AND
              // accumulates the turn — the same trick C2's follow uses. ⚠ Not a compromise: a
              // hand twisting while the object swings into place gets both, which is what both
              // gestures asked for.
              if (fid !== undefined) {
                // ⛔ ONE definition of the world rotation, borrowed from the rule that applies
                // it — a second `qFromAxisAngle` here would be free to disagree with it.
                // ⚠ `ride` ignores a body with no snap in flight, so no guard is needed here.
                alignSnaps.ride(fid, rotateAboutAxis(IDENTITY, axis, twist));
              }
              lastVerdict = `align: twist ${((twist * 180) / Math.PI).toFixed(1)}° about the alignment`;
              // ⭐⭐ THE SWAY — the line whose absence the owner spotted. An aligned object
              // turning is still an object turning, and the scene reacts to it.
              noteSpin(grip, s.t);
            }
            grip.prev = s;
            paint();
            return;
          }
          // ⚠ An UNALIGNED object in fork C rotates freely — fork A's 2bis, which is what
          // *"fork C branches from fork A"* means when no alignment exists. It also matches
          // 2bis's own precondition (*an empty constraint stack*), so nothing is special-cased.
        }
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
        // ⭐ TALLIED PER AXIS, and the angles restated here are `screenPlaneRotation`'s own,
        // negation and all. ⛔ The settle corrects what the gesture DEMANDED, so a sign that
        // disagreed with the rule would land the body on a multiple of the wrong quantity.
        const radPerPx = cfg.gainRotateFree / mmToPx(1);
        const freeId = idOf.get(grip.mesh);
        // ⭐⭐⭐ **PURPLE AND MAROON** — the owner, 2026-09-23: *"create purple and marron axis for
        // yaw and pitch rotation on unaligned object in rotation mode."*
        // ⛔⛔ **PER CHANNEL, FROM THE DEADBANDED STEP THE TURN ITSELF USES** (`grip.rec.step`, not
        // the raw delta): a `dx`-only drag yaws and must light purple ALONE, exactly as a `dx`-only
        // translation lights red alone. ⚠ Reading the raw pointer delta here would light both lines
        // on a resting finger's noise — the mistake the translation channels already made once.
        // ⭐ The axes are `screenPlaneRotation`'s own — the gravity frame's `up` and `right` — taken
        // from the same `grip.frame` the rotation below is handed, so the line cannot disagree with
        // the turn it describes.
        // ⛔⛔ **`worldAxisB` PICKS THE FRAME HERE TOO** (the owner, 2026-09-23). ⚠ ONE lookup for
        // the lines, the tally and the turn — they restate each other's axes, so two calls could
        // hand them different ones on the very frame the flag is toggled.
        const turnFrame = rotationFrameOf(grip.frame);
        if (grip.rec.step.dx !== 0)
          noteTurnAxis(freeId, TURN_YAW, turnFrame.up);
        if (grip.rec.step.dy !== 0)
          noteTurnAxis(freeId, TURN_PITCH, turnFrame.right);
        const incOnFree =
          incrementRadians(cfg.rotationIncrementDeg) !== null &&
          freeId !== undefined;
        if (incOnFree) {
          // ⭐ The angles restated here are `screenPlaneRotation`'s own, negation and all, about
          // the same two frame axes — pinned to the real function by
          // `tests/rotation_increment.test.ts`, because this is a place a sign is restated.
          rotationTally.add(
            freeId,
            "yaw",
            turnFrame.up,
            -grip.rec.step.dx * radPerPx,
          );
          rotationTally.add(
            freeId,
            "pitch",
            turnFrame.right,
            -grip.rec.step.dy * radPerPx,
          );
        } else
          setModelOrientation(
            grip.mesh,
            screenPlaneRotation(
              cur,
              turnFrame,
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
        noteSpin(grip, s.t);
      } else {
        grip.spinSway.push(modelOrientation(grip.mesh), s.t, false);
      }

      grip.prev = s;
      paint();
      return;
    }

    if (info.type === PointerEventTypes.POINTERUP) {
      // ⭐⭐⭐ A15 — AN ORPHANED HOLDER LIFTS WITHOUT A VERDICT, and the exclusion is the
      // point. ⛔ A flick-to-align or a double-tap belongs to a finger that was still on
      // its object; running one here would align — or evict a constraint on — an object the
      // user stopped touching a few hundred milliseconds ago, and never aimed this gesture
      // at. ⚠ The camera reset is refused for the same reason: the press was on an object.
      // ⚠ No `ReleaseContext` yet: selection and the two-touchpoint context are
      // `IN2`/`IN3`. So 6quater cannot win here, and the readout will show 2ter /
      // 2quater only. That is a missing INPUT, not a recognizer that ignores it.
      const verdict = grip.rec.release(s);
      lastVerdict = describe(verdict);

      // ⛔⛔ **FORK B's FLICK-TO-ALIGN IS DELETED HERE** (2026-09-17, with forks A and B).
      // ⭐ What stood in this place pushed a `GRAVITY_ALIGN` or `WORLD_AXIS_ALIGN` at the
      // release of a flick, re-solved, and unselected. The owner left it because a
      // release-time trigger *"releases the finger from the object it is tracking"* — and
      // fork C's tap does the same work mid-gesture. ⚠ `A4`'s flick SKIP went with it: there
      // is no flick-driven constraint left for a shake's last leg to push, and the flick now
      // means one thing only, which is the rotation reset below.
      // ⭐⭐⭐ **FORK C: THE ROTATION RESET, REINSTATED** (owner, 2026-09-16).
      //
      // ⛔ `D36` deleted §1.3's rollback GLOBALLY the same day, because it fought fork B's
      // flick-to-align: a flick both pushed a constraint and threw away the rotation the hand
      // had just made. ⭐ Fork C has **no flick alignment at all**, so the channel is free and
      // the conflict does not exist here — which is why this is a fork C rule and not a
      // restored global behaviour. Fork A shipped without it and still does.
      //
      // ⭐⭐ THE OWNER SCOPED IT BY **WHEN THE ALIGNMENT HAPPENED**, not by whether one
      // exists — see `flickResetPlan`. Only the gesture can tell those apart, and
      // `grip.alignmentTouched` is that fact.
      if (verdict.kind === "FLICK") {
        const plan = flickResetPlan(grip.alignmentTouched);
        const snap = grip.rec.pressSnapshot;
        const rid = idOf.get(grip.mesh);
        // ⛔ The reset writes the PRESS pose itself, so a snap in flight is simply dropped —
        // landing it first would be a rotation the reset is about to undo anyway.
        if (rid !== undefined) cancelAlignAnim(rid);
        if (plan.restoreOrientation && snap !== null) {
          // ⚠ ORIENTATION ONLY — the snapshot never carried a position, which is what makes
          // *"rotation reset"* the literal description of this rule rather than an analogy.
          setModelOrientation(grip.mesh, snap);
        }
        if (plan.dropAlignment && rid !== undefined) {
          const ev = evictObjectConstraints(world, rid);
          world = ev.world;
          if (selectedFace?.objectId === rid) {
            selectedFace = null;
          }
          lastVerdict = `align: rotation reset — alignment made in this gesture, dropped (${ev.result.removed})`;
        } else {
          lastVerdict =
            "align: rotation reset — alignment older than the press, conserved";
        }
      }
      // ⭐⭐⭐ **THE TAP'S FOUR MEANINGS, AND `tapMeaning` OWNS THE CHOICE.**
      //
      // ⛔⛔ `D27`/`D28` MADE EVERY TAP FLIP THE MOVEMENT MODE, and the alignment trigger IS a
      // tap — so the two rules want the same gesture, and the alignment CONSUMES it when it
      // fires (`D38`). ⭐ Since 2026-09-17 the GESTURE also chooses what the alignment means:
      // a single tap makes a `SNAPSHOT`, a double tap makes a `FOLLOW`, and either one on the
      // face that is already the Pioneer switches the mode or lets it go.
      //
      // ⚠⚠ **AND A DOUBLE TAP ON ANOTHER OBJECT'S FACE NO LONGER FLIES THE CAMERA HOME.**
      // That meaning survives everywhere else — empty space, the held object — but here it
      // would make every `FOLLOW` alignment reset the view, which is unusable. ⛔ The camera
      // reset is therefore evaluated AFTER the alignment decision and skipped when the tap
      // aligned; this block used to run first, which is why it moved.
      let alignedByThisTap = false;
      // ⚠⚠ `D68` — THE HONEST HALF. A tap consumed by an alignment toggles NOTHING, so the
      // fact is cleared before either branch can set it: undoing a toggle that never happened
      // would flip the mode the hand actually had.
      lastTapToggled = false;
      // ⛔⛔⛔ **`D55` — A RELEASE WHOSE OWN PRESS ALIGNED IS ALREADY SPENT.**
      //
      // ⚠⚠ WITHOUT THIS BRANCH THE GESTURE UNDOES ITSELF, and it would look like the trigger
      // never worked at all. The press aligns; the release that follows it is a `TAP` on the
      // very face that alignment names, and `tapMeaning` reads that — correctly, and by a rule
      // the owner explicitly kept — as `UNALIGN`. ⭐ So align-then-break, ~80 ms apart, with
      // nothing on the glass to show for it.
      //
      // ⭐⭐ **AND IT IS THE *PRESS* THAT IS ASKED, NOT THE STATE.** *"Is the held body aligned
      // to this one?"* would be the substituted quantity again: it is true for the second tap
      // of a double tap as well, and that release must NOT be consumed — it is what carries
      // `SNAPSHOT` → `FOLLOW`. ⛔ Only *"did MY press make it?"* separates the two.
      if (grip.pressActed) {
        alignedByThisTap = true;
        lastVerdict = `${lastVerdict} — release spent (the press aligned)`;
      } else if (verdict.kind === "TAP" || verdict.kind === "DOUBLE_TAP") {
        const others = [...held.entries()].filter(
          ([pid]) => pid !== e.pointerId,
        );
        const heldId =
          others.length === 1 ? (idOf.get(others[0]![1].mesh) ?? null) : null;
        // ⛔⛔⛔ **THE TAP READS THE *HELD BODY's OWN* ALIGNMENT, NOT THE ACTIVE RECORD** —
        // audit fix, 2026-09-17.
        //
        // ⚠⚠ This block used to build its context from the three GLOBALS (`alignMode`,
        // `pioneerFace`, and `selectedFace` as the guard), which name **the most recent
        // alignment in the scene**. ⭐ The per-body truth has lived in `links` and `alignModeOf`
        // since `A18`, and they disagree the moment a second body is aligned.
        // ⭐⭐ `METHOD`: *a substituted quantity* — *"is the active alignment on the held body?"*
        // stood in for *"what is the held body aligned to?"*, and the two agree only while
        // exactly one body is aligned.
        //
        // ⭐⭐⭐ **`D90` — EVERY FIELD IS READ OFF THE OTHER END AGAIN.** The tapped body is the
        // PIONEER now and the held one the FOLLOWER, so the questions are all about the held
        // body. ⛔ This is `D87` reaching the release path, four defects after it reached the
        // press — see `tapMeaning`.
        const tappedId = idOf.get(grip.mesh) ?? null;
        const heldGrip = others.length === 1 ? others[0]![1] : null;
        const heldPioneer = heldId === null ? null : links.pioneerFor(heldId);
        const ctx: TapContext = {
          tappedObject: tappedId,
          tappedFace: grip.pressFace?.faceId ?? null,
          heldObject: heldId,
          pioneerOfHeld: heldPioneer?.objectId ?? null,
          pioneerFaceOfHeld: heldPioneer?.faceId ?? null,
          alignedFaceOfHeld:
            heldId === null ? null : alignedFaceOf(world, heldId),
          heldPressFace: heldGrip?.pressFace?.faceId ?? null,
        };
        const meaning = tapMeaning(ctx);
        // ⛔⛔ **`tapMeaning` CAN NO LONGER ALIGN** (`D90`): the press owns that, and this path's
        // own `ALIGN` was `D67`'s trigger left running — it is what silently re-pointed an
        // alignment when the owner expected a swap. ⭐ Deleted, not left unreachable.
        if (meaning.action === "UNALIGN" && heldId !== null) {
          // ⭐⭐⭐ **THE BODY RELEASED IS THE HELD ONE.** It is the FOLLOWER since `D87`, and it is
          // the body that owns the alignment. ⚠ Releasing the TAPPED body — which this branch
          // did until `D90` — broke the PIONEER's relation to some third body, one the hand
          // never touched.
          const hadAlignment = links.pioneerFor(heldId) !== null;
          releaseAlignmentOf(heldId);
          if (heldGrip !== null) heldGrip.alignmentTouched = false;
          alignedByThisTap = true;
          lastVerdict = hadAlignment
            ? `align: RE-PRESS released the alignment on ${heldId}`
            : `align: re-press — nothing to release on ${heldId}`;
        }
      }
      // ⭐⭐ A DOUBLE-TAP ON AN OBJECT RESETS THE CAMERA TOO. ⛔ The reason is reachability:
      // orbit can get stuck close in with an object filling the view, and then every tap
      // lands ON something — a reset that only listened to empty space would be
      // unreachable precisely when it is wanted.
      // ⚠⚠ UNLESS THE TAP ALIGNED — **the owner's rule, 2026-09-17**: *"the double tap in such
      // case shall not trigger the camera orbit reset."* ⭐ A double tap on another object's
      // face now makes a `FOLLOW` alignment, and flying the camera home on top of it would
      // make the gesture unusable. ⛔ One gesture, one consequence.
      // ⚠ Everywhere else the double tap keeps the camera reset: empty space, the held
      // object, a second touchpoint. Only this one configuration is claimed.
      if (verdict.kind === "DOUBLE_TAP" && !alignedByThisTap) {
        resetCamera();
        lastVerdict = "DOUBLE_TAP → camera reset";
      }
      // ⛔⛔ *"A single tap by one only touchpoint ANYWHERE also toggles"* — and
      // *anywhere* includes the object the touchpoint was carrying, which is this branch.
      // ⭐⭐ THE VERDICT IS READ, NOT RE-JUDGED: the recognizer already recorded this tap in
      // the SHARED `TapHistory` (`recognizer.ts` does it), so calling `noteTap` here would
      // record the same tap twice and corrupt the double-tap pairing for every consumer.
      // ⚠ Both `TAP` and `DOUBLE_TAP` toggle, once each: a `DOUBLE_TAP` verdict IS the
      // second tap of a pair, so two taps flip the mode twice — back where it started — and
      // also reset the camera, which is the owner's stated worst case and identical to what
      // a second touchpoint's taps do. ⛔ One rule: **one toggle per tap release.**
      // ⛔⛔ **`D66` — AND NOTHING SETTLES UP HERE ANY MORE.** `D58`'s press toggle used to
      // land in this branch twice over: a flag saying *the press already did it*, and a
      // ROLLBACK for the one gesture where the press's meaning and the tap's disagreed (a
      // re-tap on the PioneerFace releases the alignment, `D39`). ⭐ Both are deleted with the
      // press toggle: a rule that cannot fire needs no correction, and `D39` gets its single
      // meaning back without one.
      if (
        !alignedByThisTap &&
        (verdict.kind === "TAP" || verdict.kind === "DOUBLE_TAP")
      ) {
        // ⚠ A tap that ALIGNED or released an alignment is excluded, unchanged — *"as per
        // present rule for tap"*: one gesture, one consequence.
        // ⛔⛔ **THIS LINE USED TO FLIP THE MODE WITHOUT ARMING `D68`'s REVERT**, which is the
        // 2026-09-23 device report: a double tap on the Pioneer left the session one toggle out.
        toggleByTap("tap on the object", e.pointerId);
      }
      // ⭐ §3 rule 3 — *"release unselects object and face, stack preserved."* ⛔ The stack
      // lives on the OBJECT, so preserving it is not an action: it is what NOT clearing the
      // selection state means.
      //
      // ⭐⭐⭐ AND THE OWNER AMENDED IT, 2026-09-16: *"keep the face highlighted when the
      // object is aligned, until the shaking releases the alignment."*
      // ⛔⛔ THE ARGUMENT IS THAT THE HIGHLIGHT IS NOT A SELECTION INDICATOR ANY MORE — it is
      // **the alignment's only visible state**. A constrained object looks exactly like a
      // free one: the stack is invisible, 2sexte's refusal to yaw feels like a dead control,
      // and *which* face is anchored is unknowable. ⭐ So the marker outlives the gesture
      // that made it and dies with the CONSTRAINT, which is the thing it now reports.
      // ⚠ §3's clause still governs an UNALIGNED object: press, look, release, and the
      // highlight goes — nothing to report, nothing drawn.
      // ⛔⛔⛔ **DEVICE-REPORTED: *"the aligned face shall continue to be highlighted. You
      // completely disregarded the highlight rule — or if you built it, I can't see it."***
      //
      // ⚠ It WAS built, and this line destroyed it one event later. The test asked *"is the
      // object being RELEASED the highlighted one?"* — and in fork C it never is: the
      // highlight names the **Follower**, while the release that follows an alignment is the
      // **Pioneer's** tap. So the marker was raised and wiped in the same handler.
      //
      // ⭐⭐ THE FIX IS TO ASK THE QUESTION THE HIGHLIGHT ACTUALLY ANSWERS. It reports *this
      // object is aligned on this face* (`D35`), so it lives exactly as long as that
      // alignment does — **whichever** object is being released. ⛔ The old form was a
      // condition about the GESTURE standing in for a fact about the MODEL, which is the
      // shape `METHOD` calls a substituted quantity.
      // ⛔⛔ `hasAlignment`, NOT `length > 0` — audit, 2026-09-17: a MATE is not an alignment,
      // and `evict` deliberately never removes one, so a mated body would keep its follower
      // marker for ever. ⚠ A stale highlight is what produced TWO false device reports on
      // 2026-09-17; this is the same shape one constraint-kind further on.
      const highlightedStillAligned =
        selectedFace !== null &&
        hasAlignment(
          world.objects.get(selectedFace.objectId)?.constraints ?? [],
        );
      if (!highlightedStillAligned) {
        selectedFace = null;
      }
      forgetAnchor(routed.seq);
      // ⭐⭐ **THE GESTURE ENDS, AND THERE IS NOTHING TO TIDY UP.** The body is already on an
      // increment — it has never been anywhere else — so a release needs no correction of its
      // own. ⛔ That is the whole difference from the three formulations before this one, each
      // of which had to decide what to do about a pose it should not have allowed.
      {
        const endId = idOf.get(grip.mesh);
        if (endId !== undefined) rotationTally.clear(endId);
      }
      router.release(e.pointerId);
      held.delete(e.pointerId);
      paint();
    }
  });

  paint();

  let frames = 0;
  /** ⚠ One clock, `performance.now()`, as everywhere else in this file. */
  let lastFrameMs: number | null = null;
  // ⭐⭐⭐ **THE AXES ARE BORN HERE, AT BOOT, FROM THE BOOT CAMERA** — *"at scene boot, all
  // object axis are updated based on camera quaternion at scene boot"* (the owner, 2026-09-22),
  // and with `worldAxisB` on they are *"fixed forever for this scene"*.
  //
  // ⛔⛔ **AT THE FOOT OF THE FACTORY AND NOT AT THE TOP, DELIBERATELY.** `requireGestureFrame`
  // is a `const` declared half way down this file; reading it from an initialiser above its
  // declaration is a TEMPORAL DEAD ZONE crash at boot — which this project has already shipped
  // once, on 2026-09-19, and which takes the whole page down with a blank screen.
  // ⚠ Every body inherits this basis through `axesOf`'s fallback rather than by a loop over
  // the scene: a body created later (an import, a spawn) then gets the same answer, where a
  // one-time loop would leave it with none.
  bootObjectAxes = axesFromFrame(requireGestureFrame());
  bootGestureFrame = requireGestureFrame();

  engine.runRenderLoop(() => {
    const now = performance.now();

    // ⭐ And on idle frames too: a flip made with an empty glass produces no pointer event.
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

    // ⭐⭐ `A16`: re-derived EVERY FRAME, here, before anything reads it.
    refreshHighlight();

    // ⭐ The leading face and its gizmo, AFTER the highlight — the zone edge may have just
    // re-decided the axes, and the gizmo is documented to point along them. ⚠ A gizmo drawn
    // first would show the previous basis for one frame, at exactly the moment a hand is
    // looking at it to see what changed.
    refreshAxisGizmo();

    // ⭐⭐⭐ **AND THE APPROACH SWING IS PUT ON THE CAMERA HERE** — device-reported, 2026-09-19:
    // *"not working. the camera does not orbit."*
    //
    // ⛔⛔ THE LAW WAS RIGHT AND THE WIRING WAS ABSENT. `applyCamera()` is called only by
    // CAMERA events — reset, startup, pinch, a slider, the orbit drag — and an approach is a
    // finger translating an OBJECT, during which not one of them fires. ⚠ So the yaw was
    // recomputed every frame and never written. ⭐ `METHOD`: *a rule that is never called is
    // indistinguishable from a rule that is wrong*, and only the glass can tell them apart:
    // `approach_swing.ts` has eleven green vectors and every one of them still passed.
    //
    // ⚠ Skipped while the camera reset is flying home — that animation writes the whole pose
    // every frame, and two writers would fight for the camera with the reset winning by
    // arriving second. ⛔ The swing's own return to zero is unaffected: it is a pure function
    // of the gap, so whatever it missed it picks up on the next frame it is allowed to write.
    if (cameraReset === null) {
      const wantSwing = swingAngleNow();
      if (wantSwing !== appliedSwingYaw) {
        appliedSwingYaw = wantSwing;
        applyCamera();
      }
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
    if (
      pendingCentre !== null &&
      now - pendingCentre.at >= cfg.orbitCentreGraceMs
    ) {
      const p = pendingCentre;
      pendingCentre = null;
      // ⚠ BOTH conditions re-checked at commit time, not only at press: within the grace
      // a second finger could have arrived and left, or a finger could have landed on an
      // object and turned the whole gesture into a translation.
      if (router.outside().length === 1 && router.objects().length === 0) {
        recomputeOrbitCentre({ clientX: p.x, clientY: p.y });
      }
    }

    // ⛔⛔⛔ **THE MODEL WRITERS RUN BEFORE THE VIEW READS THE MODEL — reordered by audit,
    // 2026-09-17.** The alignment slerp and the Pioneer cascade both WRITE orientations, and
    // they used to run AFTER the follower loop below, which READS the model and sets every
    // mesh transform. ⚠ So a snapping or a cascading body was drawn one frame behind its own
    // model, for the whole length of the animation.
    // ⭐ The slerp's own comment claimed it ran *"before anything reads an orientation this
    // frame"* — true of the Pioneer watch and the markers that followed it, and false of the
    // loop that actually draws the scene.
    // ⭐⭐ `METHOD`: *a claim about ORDER has to name what it is ordered against.*

    // ⭐⭐ THE ALIGNMENT'S SLERP, ADVANCED BEFORE ANYTHING READS AN ORIENTATION this frame —
    // the Pioneer watch below compares orientations, the markers are drawn from them, and
    // since 2026-09-17 the follower loop that writes every mesh runs after it too.
    // ⚠ `easeInOut` is the camera reset's own easing, imported rather than re-derived: two
    // eased snaps in one product should not accelerate differently for no reason.
    // ⚠ EVERY live snap, not one: see `alignSnaps` where it is declared.
    for (const step of alignSnaps.advance(
      now,
      cfg.cameraResetMs * ALIGN_SNAP_FRACTION,
      easeInOut,
      (id) => meshOf.has(id),
    )) {
      const mesh = meshOf.get(step.id);
      if (mesh) setModelOrientation(mesh, step.orientation);
    }

    // ⭐⭐⭐ **WHICH INCREMENT IS EACH HELD BODY IN NOW?** Asked once per frame, per grip.
    //
    // ⛔ HERE RATHER THAN IN THE POINTER HANDLER, deliberately: the rotation paths return early
    // in four places (the refusal, the twist, the roll, the free drag), and a check bolted to
    // each of them is four chances to forget one. ⭐ The render loop sees every grip, every
    // frame, whatever the gesture did — `A15`'s discipline: *ask the state, not the gesture.*
    //
    // ⚠ No edge-trigger and no rest test. A frame in which nothing crossed a boundary advances
    // nothing, so asking every frame costs a comparison and cannot repeat a step.
    for (const g of held.values()) advanceRotation(idOf.get(g.mesh));

    // ⭐⭐ **THE INCREMENT'S CHASE** — an exponential approach, advanced with the alignment
    // snaps. ⚠ A body cannot be in both: `advanceRotation` refuses to start one while an
    // alignment is travelling, so these two never write the same orientation in one frame.
    //
    // ⭐⭐⭐ **τ IS THE ALIGNMENT SNAP'S WINDOW OVER THREE**, so *essentially arrived* still takes
    // about that window — an exponential covers 95% in 3τ. ⛔ Borrowed rather than added, and
    // borrowable because it is the same KIND of number: how long a discrete, hand-requested
    // settle should take. ⚠ At `0` the slider means *arrive at once*, as it does everywhere.
    {
      // ⛔⛔ **`dtSec` IS THE LOOP'S OWN, NOT A SECOND CLOCK.** The first draft declared its own
      // `lastFrameMs` here — which the render loop had already advanced sixty lines above, so
      // `now - lastFrameMs` would have been **zero every frame** and the follower would never
      // have moved at all. ⚠ A silent freeze, caught by the compiler refusing the redeclaration
      // rather than by anything looking. ⭐ *One clock, `performance.now()`, as everywhere else.*
      for (const step of rotationFollower.advance(
        dtSec * 1000,
        (cfg.cameraResetMs * ALIGN_SNAP_FRACTION) / 3,
        (id) => {
          const m = meshOf.get(id);
          return m ? modelOrientation(m) : null;
        },
        (id) => meshOf.has(id),
      )) {
        const mesh = meshOf.get(step.id);
        if (mesh) setModelOrientation(mesh, step.orientation);
      }
    }

    // ⭐⭐⭐ **THE PIONEER'S OBJECT WAS TURNED** — `D41`'s C1/C2, checked once per frame.
    //
    // ⛔⛔ THE CASE HAD NO RULE AT ALL UNTIL 2026-09-17, AND ITS ABSENCE WAS INVISIBLE: an
    // alignment stores a FROZEN world direction, so turning the object that direction was read
    // FROM leaves the Follower obeying a target nothing on the glass corresponds to — and
    // both highlights keep saying it is fine. ⭐ Two readings, behind one flag, because *what
    // an alignment means* is the owner's question and not mine.
    //
    // ⚠ CHECKED HERE, AGAINST THE MODEL, and not at a pointer event: the Pioneer can be turned
    // by any rule — a drag, a twist, a rotation reset — and watching the ORIENTATION catches
    // every one of them without enumerating them. ⛔ The same discipline as `A15`'s raycast:
    // ask the state, not the gesture.
    // ⭐⭐⭐ **EVERY FOLLOWER WATCHES ITS OWN PIONEER, EVERY FRAME.**
    //
    // The owner, 2026-09-17: *"while the initial follower object is blue, if the pioneer object
    // is rotated because it is aligned with another object, the alignment of the initial
    // follower object shall be released"*, and *"the tracking shall enable a pioneer object to
    // rotate all its follower objects which are orange"*.
    //
    // ⛔⛔ **BOTH OF THOSE ARE ONE GENERALISATION, NOT TWO RULES.** `pioneerTurned` already
    // returns `RELEASE` for a `SNAPSHOT` (cyan) follower and `FOLLOW` for an orange one; it was
    // simply being asked **once**, about the single active alignment. ⭐ Asked per LINK it
    // covers every follower of every Pioneer, and chains fall out for free: an orange body
    // rotates when its own Pioneer turns, and anything cyan aligned to THAT body then sees its
    // baseline break and releases.
    //
    // ⚠ CHECKED AGAINST THE MODEL, never at a pointer event: a Pioneer can be turned by a drag,
    // a twist, a rotation reset, a slerp, or another alignment's `FOLLOW`. ⭐ Comparing poses
    // catches all of them without enumerating any — `A15`'s discipline, *ask the state, not the
    // gesture.*
    //
    // ⚠⚠ ONE FRAME OF LAG IS POSSIBLE IN A CHAIN AND IS ACCEPTED: the links are visited in
    // insertion order, so a follower processed before its Pioneer rotates sees the turn on the
    // next frame instead. ⛔ It cannot be MISSED, because the baseline is only re-set after the
    // turn has been accounted for — which is why this loop compares against a remembered pose
    // rather than a per-frame delta.
    // ⭐⭐ THE PLAN COMES FROM `input/pioneer_cascade.ts`, WHICH HAS VECTORS. ⛔ This block used
    // to BE the rule, inside the render loop, where nothing could interrogate it — and when a
    // hand reported the release *"not working"* there was no way to ask the code what it
    // believed. ⚠ Now the rule is a pure function with 14 vectors and this is only the part
    // that reads the world and applies the result.
    // ⚠ The ASSEMBLY moved out too, 2026-09-17: it was an inline `flatMap` here, so the wiring
    // test had to re-type it and its copy used one mode for every link. See `followerLinksFrom`.
    const cascade = resolvePioneerTurns(
      followerLinksFrom(
        links.alignedObjects(),
        (f) => links.pioneerFor(f),
        (f) => alignModeOf.get(f),
      ),
      // ⚠ WORLD orientation, through the parent chain — never `local`, which is measured in
      // someone else's frame the moment an assembly exists.
      (id) => worldPlacementOf(world, id)?.orientation ?? null,
    );

    // ⚠ Anything the cascade decides must reach the readout in the SAME frame — see `hudDirty`.
    if (cascade.steps.length > 0) hudDirty = true;
    for (const step of cascade.steps) {
      if (step.kind === "RELEASE") {
        // ⭐ C1: *"releases the first object alignment (but not rotate the first object)"* — the
        // pose is left exactly as the hand left it, and only the RULE goes.
        const ref = links.pioneerFor(step.follower);
        releaseAlignmentOf(step.follower);
        lastVerdict =
          `align: SNAPSHOT — ${ref?.objectId ?? "pioneer"} turned, ` +
          `alignment released on ${step.follower}`;
        continue;
      }
      // ⭐⭐ C2: the follower takes the SAME WORLD ROTATION, which keeps the two normals
      // parallel by construction — no solve, and no chance of the solver adding a twist.
      const followerMesh = meshOf.get(step.follower);
      if (followerMesh) {
        setModelOrientation(
          followerMesh,
          qmul(step.delta, modelOrientation(followerMesh)),
        );
      }
      // ⭐⭐ AN ANIMATION IN FLIGHT RIDES ALONG: both ends take the same world rotation, so the
      // snap keeps travelling toward a target that has moved with the Pioneer. ⛔ Without this
      // the slerp would drag the body back toward where the Pioneer USED to point.
      alignSnaps.ride(step.follower, step.delta);
      // ⭐ Keep the CONSTRAINT truthful — the geometry above already holds. ⚠ Without this the
      // stack would still name the old world direction, and the next rule to read it (a twist,
      // a reset) would act on a stale target.
      const ref = links.pioneerFor(step.follower);
      const pn =
        ref === null
          ? null
          : faceWorld(world, ref.objectId, ref.faceId)?.normal;
      const stack = world.objects.get(step.follower)?.constraints ?? [];
      // ⛔⛔ Audit, 2026-09-17: the count again. ⚠ Here the fall-through was SILENT rather than
      // destructive — the constraint simply kept naming the Pioneer's OLD world direction, and
      // the next twist or reset acted on a stale target with nothing to say so.
      if (pn && rotationChannel(stack).kind === "TWIST") {
        world = clearObjectConstraints(world, step.follower);
        world = pushObjectConstraint(
          world,
          step.follower,
          retargetAlignment(stack[0]!, pn),
          false,
        );
      }
      lastVerdict = `align: FOLLOW — ${step.follower} took ${ref?.objectId ?? "pioneer"}'s turn`;
    }
    // ⛔ RE-BASELINE LAST, from the plan. ⚠ A released follower is deliberately absent from
    // `baselines`, so this cannot resurrect a link `releaseAlignmentOf` has just removed.
    for (const [follower, orientation] of cascade.baselines) {
      links.noteOrientation(follower, orientation);
    }

    // ⭐⭐⭐ **`D69` — AND A TRANSLATED PIONEER CARRIES ITS FOLLOWERS, ALL OF THEM.**
    //
    // > *"Currently, if in rotation mode, a rotation of the pioneer controls the same rotation
    // > of all the orange follower objects. Do the same with translation: a translation of
    // > pioneer controls the same translation of all the follower objects."* — the owner
    //
    // ⛔ Run AFTER the turn cascade and read the same index. ⚠ The two cannot fight: a turn is
    // about a body's orientation and a move about its position, and a rotation about a body's
    // own centre leaves that position alone.
    // ⛔⛔ THE DECISION IS `resolvePioneerMoves`'s — *a rule in a render file is a rule nothing
    // can interrogate*, which this branch has paid for seven times.
    const moves = resolvePioneerMoves(
      followerMoveLinksFrom(
        links.alignedObjects(),
        (f) => links.pioneerFor(f),
        (f) => alignModeOf.get(f),
      ),
      (id) => worldPlacementOf(world, id)?.position ?? null,
    );
    if (moves.steps.length > 0) hudDirty = true;
    for (const step of moves.steps) {
      // ⭐⭐⭐ **`D70` — A MOVED PIONEER RELEASES A CYAN FOLLOWER**, exactly as a turned one does.
      // ⛔ The owner: *"a translation of the pioneer should break the alignment of the cyan."*
      // ⚠ Written through the SAME `releaseAlignmentOf` the turn cascade uses, so the two
      // channels cannot end in different states.
      if (step.kind === "RELEASE") {
        const ref = links.pioneerFor(step.follower);
        releaseAlignmentOf(step.follower);
        lastVerdict =
          `align: SNAPSHOT — ${ref?.objectId ?? "pioneer"} moved, ` +
          `alignment released on ${step.follower}`;
        continue;
      }
      const followerMesh = meshOf.get(step.follower);
      if (!followerMesh) continue;
      const mp = requirePose(followerMesh);
      // ⚠ A FROZEN body is refused by `object_model`'s writers, so the plate cannot be dragged
      // along even if something linked it — the guarantee is there and not here.
      setModelPose(followerMesh, {
        position: [
          mp.position[0] + step.delta[0],
          mp.position[1] + step.delta[1],
          mp.position[2] + step.delta[2],
        ],
        orientation: mp.orientation,
      });
    }
    for (const [follower, position] of moves.baselines) {
      links.notePosition(follower, position);
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
    // ⭐⭐⭐ **THE DISCONTINUITY WATCH** — the owner, 2026-09-25: *"at one point, one of the
    // objects has made a big jump (I could not see if it was the pioneer or the follower)."*
    //
    // ⛔⛔ Read off the **MODEL**, here, after every rule has written and before the follower and
    // the sway bend it. ⚠ A jump the eye sees that the model did not make is a different defect,
    // and one readout for both would report neither. ⭐ The decision is `jump_watch.ts`'s; this
    // holds the call, which is the 2026-09-19 lesson.
    for (const [jid, jmesh] of meshOf) {
      const jp = modelPose(jmesh);
      if (!jp) continue;
      const j = jumpWatch.note(jid, jp.position, jp.orientation);
      if (j !== null) {
        lastJump = j;
        lastJumpVerdict = lastVerdict;
        lastJumpAt = performance.now();
        hudDirty = true;
      }
    }
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
          exponentialSmooth(
            f.vTarget.x,
            (f.target.x - f.lastTarget.x) / dtSec,
            tauSec,
            dtSec,
          ),
          exponentialSmooth(
            f.vTarget.y,
            (f.target.y - f.lastTarget.y) / dtSec,
            tauSec,
            dtSec,
          ),
          exponentialSmooth(
            f.vTarget.z,
            (f.target.z - f.lastTarget.z) / dtSec,
            tauSec,
            dtSec,
          ),
        );
        f.lastTarget.copyFrom(f.target);
      }
      f.x = advanceFollow(
        f.x,
        phantomTarget(f.target.x, f.vTarget.x, leadSec),
        tauSec,
        zeta,
        dtSec,
      );
      f.y = advanceFollow(
        f.y,
        phantomTarget(f.target.y, f.vTarget.y, leadSec),
        tauSec,
        zeta,
        dtSec,
      );
      f.z = advanceFollow(
        f.z,
        phantomTarget(f.target.z, f.vTarget.z, leadSec),
        tauSec,
        zeta,
        dtSec,
      );
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

    // ⭐⭐⭐ THE FACE HIGHLIGHT, placed from the MESH's world matrix — not from the model.
    //
    // ⛔⛔ THAT CHOICE IS THE WHOLE CORRECTNESS OF IT. What the eye sees is
    // `displayPose = SWAY ∘ FOLLOW ∘ model`, so a highlight positioned from the MODEL would
    // sit where the object *is* while the object is drawn where it is *going* — lagging by
    // the follower's time constant during every drag and by the sway's excursion after it.
    // ⭐ Reading the mesh's matrix makes the two agree by construction, which is the same
    // reason the barycentre subtracts the sway rather than compensating for it.
    // ⚠ The local face centre and normal come from the MODEL, which is where faces live.
    // ⭐⭐ BOTH MARKERS, ONE PATH — the filled quad on the Follower, the contour on the
    // Pioneer, each drawn only while the state that MEANS something is present.
    // ⭐⭐⭐ **EVERY ALIGNED OBJECT KEEPS ITS FOLLOWERFACE**, asked of the MODEL, every frame.
    // ⛔ `selectedFace` is no longer what decides this — it names the ACTIVE alignment and is
    // still what the tap, shake and flick rules read, but it is one record and the owner needs
    // to see all of them at once.
    //
    // ⭐⭐ **THIS LOOP COSTS *ALIGNED BODIES*, NOT *SCENE BODIES*, AND THAT IS DELIBERATE.** It
    // ran over `world.objects.keys()` when there were three; at sixty frames a second the shape
    // that stops working as the scene grows is the one that walks everything to find the two
    // that matter. ⚠ `links.prune` reconciles the index against the model and RETURNS what it
    // dropped, so retiring a released body's markers needs no second sweep either.
    // ⛔ `prune` reconciles the index against the model — it catches releases that evict a
    // constraint WITHOUT unlinking (the shake-on-self path does exactly that). ⚠ Its return
    // value is deliberately NOT used to decide what to hide; see below.
    for (const id of links.prune((f) => alignedFaceOf(world, f) !== null)) {
      alignModeOf.delete(id);
      // ⚠ A pruned link is a state change with no pointer event behind it. See `hudDirty`.
      hudDirty = true;
    }

    // ⛔⛔⛔ **HIDE BY SET MEMBERSHIP, NEVER BY WHAT `prune` HAPPENED TO DROP — DEVICE BUG,
    // 2026-09-17.**
    //
    // > *"the rotation of the pioneer currently removes the highlight of the pioneer but does
    // > not release the alignment of the cyan follower object"*, then the clue that cracked it:
    // > *"if the highlight of the pioneer is toggled off, the shake on the cyan follower is not
    // > working any longer"*
    //
    // ⚠⚠ **THE RELEASE WAS WORKING ALL ALONG.** The constraint was evicted and the link
    // removed; what failed is that the follower's markers were never HIDDEN, so the body still
    // LOOKED aligned — and a shake on it then answered *"nothing to release"*, which read as a
    // second bug. ⭐ One stale quad produced two false reports and sent me hunting the rule,
    // which was correct and is now vectored twice over.
    //
    // ⛔⛔ THE CAUSE WAS THE SHAPE OF THE LOOP: it hid only what `prune` dropped, and
    // `releaseAlignmentOf` unlinks DIRECTLY — so for every release that went through it (the
    // shake sweep, the re-tap, the rotation reset, a turned Pioneer, the cycle guard) `prune`
    // never saw the body and nothing ever hid its markers.
    // ⭐⭐ `METHOD`: *prefer the structure that cannot express the defect.* Hiding everything
    // not currently wanted is correct **whatever** removed the link, and needs no cooperation
    // from the paths that remove them. ⚠ I used exactly this pattern for the Pioneer contours
    // twenty lines below and the wrong one here, in the same edit — which is why the Pioneer's
    // highlight DID disappear and the follower's did not, the asymmetry the report describes.
    const alignedNow = new Set(links.alignedObjects());
    // ⭐⭐⭐ **THE FUCHSIA CANDIDATES** — every face on another body that the HitFace is within
    // `pioneerCandidateConeDeg` of mating with (the owner, 2026-09-24). ⛔ Recomputed every frame
    // from the MODEL, never remembered: *during the rotation* means the set follows the pose, and
    // a remembered set is the shape that produced eight reports on the gizmo.
    const hitFace = hitFaceNow();
    // ⚠ `candidateFacesNow` is the gated source; `hitFace` is NOT gated, so the HitFace contour
    // below survives with the offer switched off.
    const candidates = candidateFacesNow();
    const candidateKeys = new Set(
      candidates.map((c) => `${c.objectId}/${c.faceId}`),
    );
    guardDraw("alignmentMarkers", () => {
      // ⛔⛔ **RETIRED BY SET MEMBERSHIP, WHATEVER REMOVED THE LINK.** The 2026-09-17 bug was the
      // other pattern — hiding only what `prune` dropped, so `releaseAlignmentOf` left markers
      // behind and produced TWO false defect reports against a rule that was correct.
      // ⭐ `METHOD`: *prefer the structure that cannot express the defect.*
      for (const [key, q] of faceMarkers) {
        const id = key.slice(0, key.indexOf("/"));
        const faceId = key.slice(key.indexOf("/") + 1);
        // ⛔⛔ **ONE POOL, ONE MEMBERSHIP TEST.** The fuchsia faces join the same retire loop
        // rather than getting a pool of their own: on 2026-09-17 two marker pools retired by two
        // different rules in one edit, and the asymmetry produced TWO false device reports.
        const wanted =
          (alignedNow.has(id) && alignedFaceOf(world, id) === faceId) ||
          candidateKeys.has(key);
        // ⛔⛔ **THE RING IS RETIRED IN THE SAME PASS, ON THE SAME KEY.** ⚠ It had a loop of its
        // own and its own (correct) test, which is one edit away from the 2026-09-17 defect: two
        // marker pools retired by two rules, and the asymmetry produced two false device reports.
        // ⭐ One pass cannot drift, whatever a later change does to the membership test above.
        const ring = candidateRings.get(key);
        if (ring !== undefined && !candidateKeys.has(key))
          ring.isVisible = false;
        if (wanted) continue;
        q.fill.isVisible = false;
        // ⛔⛔ **RETIRED BY THE SAME MEMBERSHIP TEST, IN THE SAME LOOP.** The twin must not outlive
        // the marker it doubles: a stale highlight produced TWO false device reports in one day
        // (*"the release is not working"*, *"the shake is not working"*) against rules that were
        // correct, and the cause was one pool retired by membership and another by what changed.
        q.xray.isVisible = false;
      }
      for (const [id, o] of outlines) {
        if (alignedNow.has(id)) continue;
        // ⛔ THE PAIR IS ATOMIC. A body outline left behind by a released alignment would claim
        // the body is still aligned — the readout-that-lies shape this file guards against.
        o.align.isVisible = false;
      }

      // ⭐⭐ **THE FUCHSIA FILL AND ITS WHITE RING**, drawn BEFORE the alignment colours so that a
      // face which is both a candidate and a live Follower/Pioneer keeps its established meaning.
      for (const c of candidates) {
        const marker = faceMarkerFor(c.objectId, c.faceId);
        if (marker !== null) {
          if (!marker.mat.emissiveColor.equals(CANDIDATE_COLOUR))
            marker.mat.emissiveColor.copyFrom(CANDIDATE_COLOUR);
          marker.fill.isVisible = true;
          const xrayOn = cfg.followerFaceXrayAlpha > 0;
          if (xrayOn) {
            if (!marker.xrayMat.emissiveColor.equals(CANDIDATE_COLOUR))
              marker.xrayMat.emissiveColor.copyFrom(CANDIDATE_COLOUR);
            marker.xrayMat.alpha = cfg.followerFaceXrayAlpha;
          }
          marker.xray.isVisible = xrayOn;
        }
        // ⚠ The ring is PARENTED, so only its scale is written here — it keeps a constant
        // apparent size as the camera moves, the same conversion the capture shell uses.
        const ring = candidateRingFor(c.objectId, c.faceId);
        if (ring !== null) {
          const m =
            trackingMetresPerPx(
              camera.radius,
              camera.fov,
              canvas.clientHeight,
            ) * GIZMO_RING_PX;
          ring.scaling.set(m, m, m);
          ring.isVisible = true;
        }
      }

      for (const id of alignedNow) {
        const faceId = alignedFaceOf(world, id);
        // ⚠ `prune` just guaranteed this, so the guard is for the types rather than the logic.
        if (faceId === null) continue;
        const mode = alignModeOf.get(id);
        const want = mode === "FOLLOW" ? PIONEER_COLOUR : FOLLOWER_COLOUR;
        // ⭐⭐⭐ THE FOLLOWER FACE, DRAWN FROM ITS OWN TRIANGLES (`D50`) — so a triangular or an
        // L-shaped face marks itself correctly instead of wearing a rectangle.
        const marker = faceMarkerFor(id, faceId);
        if (marker !== null) {
          // ⚠ Written only on CHANGE, not blindly per frame.
          if (!marker.mat.emissiveColor.equals(want))
            marker.mat.emissiveColor.copyFrom(want);
          marker.fill.isVisible = true;
          // ⭐ `0` means the twin is not drawn AT ALL, which is the build before this flag — not an
          // invisible mesh still costing a draw call and still able to come back wrong.
          const xrayOn = cfg.followerFaceXrayAlpha > 0;
          if (xrayOn) {
            if (!marker.xrayMat.emissiveColor.equals(want))
              marker.xrayMat.emissiveColor.copyFrom(want);
            // ⚠ Written every frame because it is a SLIDER: a hand turning it must see the overlay
            // change under the finger, which is the whole point of shipping the number with the rule.
            marker.xrayMat.alpha = cfg.followerFaceXrayAlpha;
          }
          marker.xray.isVisible = xrayOn;
        }
        // ⭐⭐ AND THE WHOLE BODY, in the alignment's colour — its own mesh edges, offset a
        // little further out than the white body outline so the two nest rather than z-fight.
        const o = outlinesFor(id);
        if (o !== null) {
          if (!o.align.color.equals(want)) o.align.color.copyFrom(want);
          o.align.isVisible = true;
        }
      }

      // ⛔⛔ **EVERY PIONEER FACE THAT SOMETHING IS ALIGNED TO**, from the index.
      //
      // ⭐ THE PAIR IS ATOMIC BY STRUCTURE: a Pioneer face is drawn only because a link names it,
      // and a link exists only while its follower's constraint does (`links.prune`, above).
      // ⚠ The old form was `selectedFace !== null && pioneerFace !== null && …` — two records
      // kept in step by hand, and defect 44 was exactly them falling out of step.
      const wantedPioneerKeys = new Set<string>();
      for (const ref of links.pioneerFaces()) {
        const key = `${ref.objectId}/${ref.faceId}`;
        wantedPioneerKeys.add(key);
        const m = faceMarkerFor(ref.objectId, ref.faceId);
        // ⭐ The Pioneer face is OUTLINED, not filled — *which face it was aimed at*, against the
        // Follower's fill for *which face moved*. `D39`'s distinction, now on real face boundaries.
        if (m !== null) {
          if (!m.loop.color.equals(PIONEER_COLOUR))
            m.loop.color.copyFrom(PIONEER_COLOUR);
          m.loop.isVisible = true;
        }
      }
      // ⭐⭐⭐ **THE HITFACE WEARS A FUCHSIA CONTOUR WHILE IT IS ACTIVE** — the owner, 2026-09-25:
      // *"when active, highlight the contour of the hitface in fuchsia."*
      //
      // ⭐ OUTLINED, not filled, and that is the existing grammar rather than a new one: a FILL
      // says *this face moved* (the Follower) or *this face is on offer* (a candidate); a CONTOUR
      // says *this face is the one being aimed*. ⚠ So the HitFace and the candidates share a
      // colour and differ in form, which is exactly the pair they are.
      // ⛔ It joins `wantedPioneerKeys` rather than getting a pool of its own: one set, one retire,
      // the same discipline the fills and the rings are now under.
      if (hitFace !== null) {
        const key = `${hitFace.objectId}/${hitFace.faceId}`;
        const m = faceMarkerFor(hitFace.objectId, hitFace.faceId);
        if (m !== null) {
          // ⚠ A Pioneer contour on the same face KEEPS its amber: an established relation outranks
          // an offer, which is the order the fills already use.
          if (!wantedPioneerKeys.has(key)) {
            if (!m.loop.color.equals(CANDIDATE_COLOUR))
              m.loop.color.copyFrom(CANDIDATE_COLOUR);
            m.loop.isVisible = true;
          }
          wantedPioneerKeys.add(key);
        }
      }
      // ⚠ Hidden rather than disposed: a body can be re-aligned to the same face seconds later,
      // and churning meshes per gesture is how a render loop acquires a stall.
      for (const [key, q] of faceMarkers) {
        if (!wantedPioneerKeys.has(key)) q.loop.isVisible = false;
      }
    });

    // ⛔⛔⛔ **THE HUD IS REPAINTED WHEN THE *LOOP* CHANGES SOMETHING** — audit fix, 2026-09-17.
    //
    // ⚠⚠ `paint()` ran on pointer events and slider changes only. ⛔ But the cascade, the
    // prune and the snap all decide things HERE, with no event behind them — and the move
    // handler paints BEFORE this loop runs them. So the readout built to diagnose *"the release
    // is not working"* showed the state as of the previous event, one step behind the rule it
    // was reporting on. ⭐ That is not a cosmetic lag: on 2026-09-17 two false device reports
    // came from a stale marker, and the instrument for telling a stale marker from a broken
    // rule was itself stale.
    // ⚠ Guarded by a DIRTY FLAG rather than painted every frame: the HUD writes text into the
    // DOM, and 60 unconditional layout-invalidating writes a second is a cost with no reader.
    if (hudDirty) {
      hudDirty = false;
      paint();
    }

    scene.render();
    frames++;
  });
  window.addEventListener("resize", () => engine.resize());

  return { scene, engine, framesRendered: () => frames };
}
