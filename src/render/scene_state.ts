/**
 * THE SCENE'S SHARED STATE AND TYPES — one `SceneState` object every render module takes, the closure-level types, and the constants.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { type EpisodeTally } from "../input/episode_ledger";
import { GoalCapture, GoalPulls } from "../input/goal_capture";
import { GoalCommit } from "../input/goal_commit";
import type { PressSide } from "../input/screen_rotate";
import type { CameraOrbitState, OrbitSpring, OrbitZoom } from "../input/follow_camera";
import type { Pose } from "../core/goal";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { parseConfigOverrides, PinchTracker, OrbitController, OrbitCentreBlend, PointerNoiseMeter, PointerRouter, SwayWatcher, SpinSwayWatcher, CameraResetAnimation, Recognizer, TapHistory, MotionTracker, type GravityFrame, type Behaviour, type FollowState, type Sample } from "../input";
import { type Quat, type Vec3 } from "../core/vec";
import { type FrameMeter } from "../core/frame_meter";
import { type SceneDescriptor } from "../core/game_structure";
import { type ObjectId, type World } from "../core/object_model";
import { RotationFollower, RotationTally } from "../input/rotation_increment";
import { AlignmentLinks } from "../core/alignment_links";
import { PioneerFaceCursors } from "../core/pioneer_face_cursors";
import { SnapArming } from "../input/snap";
import { UnsnapDetector, UnsnapHold } from "../input/unsnap";
import { SeatSnaps } from "../input/seat_snap";
import { AlignSnaps } from "../input/align_snap";
import { type MeshTopology } from "../core/mesh_topology";
import { JumpWatch, type Jump } from "../input/jump_watch";
import { type GizmoChannels } from "../input/axis_translate";
import { type GestureConfig } from "../input/gestureConfig";
import { type Hud } from "./hud";
import { type ScoreOverlay } from "./score_overlay";
import { type MouseSecondTouchHandle } from "./mouse_adapter";
import { type GestureSpan, type UndoHistory } from "../core/undo_history";
import { type PointerRole } from "../input/router";
import { type SceneSnapshot } from "./undo_wiring";
import { type DemoPlan } from "../core/demo_plan";
import { type LevelEnd, type LevelResult } from "../core/level_end";
import { type Aabb } from "../core/collision";

// ⛔ `MARKER_LIFT_M` (1.5 mm in the world) is deleted: a highlight's lift is one pixel ON THE GLASS,
// recomputed every frame (`input/highlight_lift.ts`, `highlightLiftMm`).

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
export const ALIGN_SNAP_FRACTION = 2 / 7;

/** ⭐ The two marker colours, named once: cyan marks what MOVED, amber what it was aimed at. */
export const FOLLOWER_COLOUR = new Color3(0.2, 0.9, 1);
export const PIONEER_COLOUR = new Color3(1, 0.62, 0.1);
/**
 * ⭐⭐⭐ **FUCHSIA — THE HITFACE'S CONTOUR** while it is active (the owner, 2026-09-25). ⛔ A third
 * colour and not a shade of the other two: cyan and amber say *this pair IS aligned*. ⚠ It first
 * coloured the fuchsia OFFER (candidate faces, 2026-09-24), deleted by `D109`.
 */
export const CANDIDATE_COLOUR = new Color3(1, 0.1, 0.8);
/**
 * ⭐ The PioneerFaceCursor was AMBER — the Pioneer's own colour (the owner, 2026-09-25: *"the ring shall be amber
 * instead of green"*). ⭐⭐ `D164` (2026-09-29): it is CYAN now — *"make the gizmo of the pioneer cyan. This will help
 * visibility"* — so it reads on the amber Pioneer face, which `D162` fills while the aligned part is pressed.
 */
export const PIONEER_CURSOR_COLOUR = FOLLOWER_COLOUR;

// ⛔⛔⛔ **THE BOOT SCENE'S DIMENSIONS LIVE IN `core/scene_dims.ts`**, not here. ⚠ They were
// declared in this file and MIRRORED in two test files, so scaling the pyramid on 2026-09-25 left
// 1125 vectors green against the old body — including the one guarding the boot clearance.
// ⭐ *A fixture that mirrors a constant is a second implementation of it, and it disagrees exactly
// when the constant is the thing being changed.*

export const CAMERA_RADIUS_M = 0.6;

/**
 * ⛔⛔ A QUATERNION, NOT EULER ANGLES. Device-reported 2026-09-13: *"the yaw is in
 * the world coordinates while the pitch is in the object coordinates."* That is what
 * `mesh.rotation` does — Euler components are applied in a FIXED ORDER, so the second
 * angle acts inside the frame the first one just made, and the cube tumbles. The
 * composition now lives in `input/screen_rotate.ts`, where vectors can check it.
 */
export type DiagnosticPose = Quat;


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
export interface FaceMarker {
  /** The body the face belongs to, and the face's outward normal in that body's frame. */
  readonly objectId: ObjectId;
  readonly normal: Vec3;
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

export interface BodyOutlines {
  /** ⭐ The aligned body's coloured outline. ⛔ The white capture outlines are deleted (`D120`). */
  readonly align: LinesMesh;
  /** ⭐ The offset, in metres, the outline's geometry was last built with. */
  builtM: number | null;
}

export type TurnAxes = [Vec3 | null, Vec3 | null, Vec3 | null];

export interface AxisGizmo {
  readonly lines: readonly [
    LinesMesh,
    LinesMesh,
    LinesMesh,
    LinesMesh,
    LinesMesh,
    LinesMesh,
  ];
}

export interface Held {
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
   * ⭐⭐ The face THIS touchpoint's press landed on, in the object it carries — the HitFace.
   *
   * ⛔⛔ PER GRIP, NOT ONE GLOBAL, and that is forced by the rule: *"one touchpoint on first
   * object's hit face (FollowerFace) && tap on second object's hit face (PioneerFace)"*.
   * Two faces on two objects are live at the same instant. ⭐ Since `D87` the held grip's face
   * is the FollowerFace; the PioneerFace comes from the tap (`tapFace`).
   * ⚠ `null` whenever the pick resolved no face.
   */
  pressFace: { faceId: string; cos: number } | null;
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
   * latches every role at press; this is the same doctrine one rule over: *a mode may be keyed
   * on PRESENCE, never on MOTION.*
   */
  anchorRollSign: Map<number, 1 | -1>;
  /** ⭐ `D137`: the holder's latest sideways direction (its last non-zero deadbanded `dx`). */
  holderDxSign: -1 | 0 | 1;
  /** ⭐ `D137`: each second finger's latest sideways direction, by press order. */
  anchorDxSign: Map<number, -1 | 0 | 1>;
  /**
   * ⭐⭐ `D137`: the running hold-pinch — the second finger's `seq`, its zoom tracker and the zoom it
   * started from — or `null`. ⭐ Set on a sideways pinch with both deadbanded `dy` zero; cleared as soon
   * as either `dy` is not (amended), or when a finger lifts.
   */
  holdPinch: { readonly seq: number; readonly tracker: PinchTracker; readonly zoomAtStart: number } | null;
  /**
   * ⭐⭐ `D139`: this grip's Follower has just SEATED — every channel is refused but the roll until the
   * finger lifts (the lock dies with the grip). ⛔ Set by the landing only (`seat_wiring.ts`).
   */
  seatLocked: boolean;
  /** ⭐ `D172`: the highest touchpoint `seq` down when the seat locked the grip — only a later one may roll. */
  seatSeq: number;
  /**
   * ⭐⭐ **WHICH WAY `dx` TWISTS AN ALIGNED BODY -- latched once per grip** (2026-09-22).
   * ⛔ The same doctrine as `anchorRollSign` one channel over: recomputed per frame the sign
   * flips mid-drag as the alignment axis swings through horizontal-on-screen.
   */
  twistSign?: 1 | -1;
  /** ⭐ `D185`: which side of the gizmo the press landed on, latched — the maroon pitch's sense reads it. */
  pressSide: PressSide | null;
  /** A6's sympathetic sway, on the same trigger and the same four tunables as the drag. */
  depthSway: SwayWatcher;

  /**
   * ⭐ Decides WHEN the scene reacts — see `input/sway.ts`. It owns the direction and
   * speed estimate over a stated window, so this file does not invent a second one.
   */
  sway: SwayWatcher;
  /** The same, for ROTATION — see `input/sway.ts`'s `SpinSwayWatcher`. */
  spinSway: SpinSwayWatcher;
}

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
export interface Follow {
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
   * ⭐ prototype (green box), 2026-10-02: the SOFTNESS the block swing springs back on, ms — set by the kick that made it (a held
   * piece's turn: `rotateSwayTauMs`; the green piece's orbit: `orbitSwayTauMs`, quicker — *"I want the sway to resolve quickly"*).
   */
  swayRotTauMs: number;
  /** ⭐ prototype (green box), 2026-10-02: the same for the translation sway — a dragged piece: `translateSwayTauMs`; the orbit slide: `orbitSwayTauMs`. */
  swayTransTauMs: number;
  /**
   * The orientation this object would have with no sway at all. ⛔ Kept because the
   * sway is applied ON TOP every frame; reading the mesh back would compound it.
   */
  qHome: Quat;
}

/**
 * ⭐⭐⭐ **THE SCENE'S SHARED STATE — ONE OBJECT, TYPED** (the split of `scene.ts`, 2026-09-26).
 * Every field was a closure variable of `createScene`; naming them here is what lets the
 * wiring move into modules that take `st` instead of closing over a 7,800-line function.
 */
export interface SceneState {
  /** ⭐ The scene being played — `Scene_0` unless a level says otherwise. */
  sceneSpec: SceneDescriptor;
  tuning: ReturnType<typeof parseConfigOverrides>;
  centreMarker: Mesh;
  /** ⭐ prototype (green box): the green box, midway between the yellow target and the camera — `null` in a scene with no yellow body. */
  greenBox: Mesh | null;
  /** ⭐ Prototype: the pink ring at the yellow target (`pinkRingFrame`). */
  pinkRing: LinesMesh | null;
  /** ⭐ Prototype: has a press on a placed piece set the yellow target yet? Until then it is the BOOT target (`pinkRingVisibility`). */
  targetSetByPress: boolean;
  /** ⭐ Prototype: the green piece's distance to the yellow target this frame, metres (`null` before the first frame). */
  greenBoxDistM: number | null;
  /** ⭐ Prototype: where the orbit rig puts the green box (where it used to put the camera), and the following camera. */
  greenBoxRigM: Vec3 | null;
  cameraOrbit: CameraOrbitState | null;
  /** ⭐ Prototype: the camera's angles as SHOWN — `cameraOrbit.cam` eased by the time lag (`cameraLag`). */
  cameraLagged: { readonly yaw: number; readonly v: number } | null;
  /** ⭐ Prototype: the orbit finger's own §1.1 tracker — it says per axis whether the input is moving (`D86`'s rest window). */
  orbitMotion: { readonly pointerId: number; readonly tracker: MotionTracker } | null;
  /** ⭐ Prototype: the orbit finger's sway trigger — the other pieces sway when the green piece orbits (`greenPieceHeading`). */
  orbitSway: { readonly pointerId: number; readonly watcher: SwayWatcher } | null;
  /** ⭐ Prototype: how many orbit swings have been kicked — the HUD's check that the trigger fires. */
  orbitSwayKicks: number;
  /** ⭐ Prototype: the green box's eased orbit (it chases the rig every frame). */
  boxOrbit: OrbitZoom | null;
  /** ⭐ Prototype: the box's spring (`springOrbit`) — `boxOrbit` is its `at`. */
  boxSpring: OrbitSpring | null;
  mouseLayer: MouseSecondTouchHandle;
  orbitStartZoom: number;
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  light: HemisphericLight;
  dimsOf: Map<ObjectId, readonly [number, number, number]>;
  /** ⭐ `D125`: every contour material, so the slider reaches them all; empty in a scene without one. */
  contourMats: StandardMaterial[];
  untaperedBodies: string[];
  idOf: Map<AbstractMesh, ObjectId>;
  meshOf: Map<ObjectId, AbstractMesh>;
  shapelessBodies: string[];
  drawFault: string | null;
  drawFaultCount: number;
  topoOf: Map<ObjectId, MeshTopology>;
  world: World;
  faceMarkers: Map<string, FaceMarker>;
  pioneerCursors: PioneerFaceCursors;
  pioneerCursorMeshes: Map<string, Mesh>;
  links: AlignmentLinks;
  snapArming: SnapArming;
  seatSnaps: SeatSnaps<ObjectId>;
  unsnapDetectors: Map<string, UnsnapDetector>;
  /** ⭐ `D182`: while two touches form an unsnap couple, neither drives any body (`input/unsnap.ts`). */
  unsnapHold: UnsnapHold;
  rawPressedBody: Map<number, ObjectId>;
  pointerTypeOf: Map<number, string>;
  outlines: Map<ObjectId, BodyOutlines>;
  bootGestureFrame: GravityFrame | null;
  gizmoAxes: Map<ObjectId, GizmoChannels>;
  rolledThisHold: Set<ObjectId>;
  frameAxisDriven: Map<ObjectId, [boolean, boolean, boolean]>;
  frameTurnAxes: Map<ObjectId, TurnAxes>;
  gizmoTurnAxes: Map<ObjectId, TurnAxes>;
  lastTrackGain: number;
  edgeOnNow: boolean;
  axisGizmos: Map<ObjectId, AxisGizmo>;
  gizmoRings: Map<ObjectId, LinesMesh>;
  /** ⭐ `D153`: the white rings where a translation line hits an object, keyed `body:axis:side`. */
  gizmoHitRings: Map<string, LinesMesh>;
  gizmoTurnRings: Map<ObjectId, LinesMesh>;
  markerMat: StandardMaterial;
  hud: Hud;
  /** ⭐ `D188`: the player's score bar — moves, time, goal. */
  scoreOverlay: ScoreOverlay;
  taps: TapHistory;
  router: PointerRouter<AbstractMesh>;
  held: Map<number, Held>;
  followers: Map<AbstractMesh, Follow>;
  /** ⭐ `D111`: the scene's one undo history, and the gesture that may add to it. */
  undo: UndoHistory<SceneSnapshot>;
  gestureSpan: GestureSpan;
  gestureBefore: SceneSnapshot | null;
  gestureUndid: boolean;
  /** ⭐ `D112`: the touchpoint episodes counted, and when the scene started (the timer). */
  episodes: EpisodeTally;
  /** ⚠ `null` until the first press — `SCORE.md` §6: the ledger starts at the first press after boot. */
  sceneStartMs: number | null;
  /** ⭐ `3D7` (`D181`): the play volume, world metres — `null` for a scene that declares none (unbounded). */
  playVolume: Aabb | null;
  /** ⭐ `D196`: each frozen body's top-face contour, shown while it is hidden from below (`null`: none can be drawn). */
  topOutlines: Map<string, LinesMesh | null>;
  /** ⭐ `D183`: the goal capture's arming, its pulls in flight, and each piece's pose last frame (what MOVED). */
  goalCapture: GoalCapture;
  goalPulls: GoalPulls;
  goalLastPose: Map<string, Pose>;
  /** ⭐ `D189`: the pieces placed at the last COMPLETED action, the model they were read from, and a quiet next commit (undo). */
  goalCommit: GoalCommit;
  goalCommitWorld: World | null;
  goalCommitQuiet: boolean;
  /** ⭐ `D183`: every piece a finger or the mouse has GRABBED this level — a piece never grabbed is judged strictly. */
  grabbed: Set<string>;
  /** ⭐ `D180`: the level end's latch — its `result` is the frozen result once the level is complete. */
  levelEnd: LevelEnd;
  /** ⭐ `D180`: told once, on the frame the level completes (`main.ts` shows the results screen). */
  onLevelEnd: ((result: LevelResult) => void) | null;
  /** The last whole second the HUD showed — the timer repaints once a second, not per frame. */
  hudSecond: number;
  /** ⭐ `D113`: the edge band's faint outline, and the width it was last drawn at. */
  edgeBandEl: HTMLDivElement;
  edgeBandKey: string;
  /** ⭐ `D119`/`D124`: a second touch that pressed a frozen body, or steers over another — its face, for a tap to align to. */
  tapFace: Map<number, { id: ObjectId; faceId: string }>;
  /** ⭐ The rig elevation the scene boots at, and the camera reset returns to. */
  bootElevation: number;
  /** ⭐ `D170`: a demo scene's playback — its plan, the lead-in left, its progress ∈ [0, 1] — or `null`. */
  demo: { plan: DemoPlan; leadS: number; progress: number; done: boolean; fitM: number } | null;
  /** The last block, for the HUD — `A⟂B 42% slid` — and when it happened. */
  lastCollision: string;
  lastCollisionAt: number;
  /** ⭐ `D114`: does a FIRST touch have somewhere empty to land? Probed at 4 Hz; `true` until then. */
  emptySpaceVisible: boolean;
  lastEmptyProbeMs: number;
  episodeFacts: Map<number, { role: PointerRole; heldAtPress: number; pressedAnotherBody: boolean }>;
  episodeUnaligned: Set<number>;
  /**
   * ⭐ `D159`: a Space freeze is carrying the gesture across the drag's release — the release does not
   * end it and the latched HitFace's press does not begin a new one, so the action lands ONCE.
   */
  freezeCarry: boolean;
  /** ⭐ `D159`: the latched HitFace that continues a frozen drag — its hold is the drag's, not a second one. */
  episodeContinued: Set<number>;
  /** ⭐ `D187`: each touchpoint's key in the tally — its press record, replaced at its release. */
  episodeKey: Map<number, number>;
  episodeSeq: number;
  /** ⭐ `D187`: the open gesture has changed the model (latched) — `gestureChangedSoFar`. */
  gestureChanged: boolean;
  /** ⭐ `D155`: the face a Space freeze hands to the next second-touch press on this mesh. */
  inheritPressFace: { mesh: AbstractMesh; pressFace: { faceId: string; cos: number } | null } | null;
  lastVerdict: string;
  hudDirty: boolean;
  pinch: PinchTracker;
  pendingCentre: { x: number; y: number; at: number } | null;
  cameraReset: CameraResetAnimation | null;
  orbit: OrbitController;
  zoom: number;
  zoomAtPinchStart: number;
  centreBlend: OrbitCentreBlend;
  orbitCentreM: Vector3;
  eventGaps: Map< number, { last: number; gaps: { t: number; ms: number }[] } >;
  noise: PointerNoiseMeter;
  noisePointer: number | null;
  behaviour: Behaviour;
  alignSnaps: AlignSnaps<ObjectId>;
  jumpWatch: JumpWatch<ObjectId>;
  lastJump: Jump<ObjectId> | null;
  lastJumpVerdict: string;
  lastJumpAt: number;
  rotationTally: RotationTally<ObjectId>;
  rotationFollower: RotationFollower<ObjectId>;
  lastTapToggled: boolean;
  pairReverted: Set<number>;
  cursorDrags: Map<number, { key: string; dx: number; dy: number }>;
  frames: number;
  lastFrameMs: number | null;
  /** ⭐ The frame meter — the HUD's `frame` line (median and p95 of recent frames). */
  frameMeter: FrameMeter;
  /** ⭐ `D142`: the goal pop-up's element (made on first use) and its fade timer. */
  goalPopupEl?: HTMLDivElement;
  goalPopupTimer?: ReturnType<typeof setTimeout>;
  /** ⭐ `D138`: AUTO shadows' verdict — `null` while measuring — and when that measurement began. */
  autoShadow: "ON" | "OFF" | null;
  autoShadowArmedAt: number;
  /** The `shadowsOn` value last applied, so a change back to AUTO re-arms the measurement. */
  shadowModeSeen: number;
  unsnapTrace: string;
  lastFedPointer: number;
  cfg: GestureConfig;
  canvas: HTMLCanvasElement;
}




/**
 * ⭐⭐⭐ **THE THREE TURN CHANNELS**, in the gizmo's own order after the translation axes:
 * `ROLL` grey, `YAW` purple, `PITCH` maroon.
 */
export const TURN_ROLL = 0;

export const TURN_YAW = 1;

export const TURN_PITCH = 2;


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
export const GIZMO_AXIS_COLOURS = [
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
export { GIZMO_RING_PX } from "../input/pioneer_cursor_grab";

/** ⭐ The MOVE ring: white, on the FollowerFace, shown while a translation channel is lit. */
export const GIZMO_RING_MOVE_COLOUR = new Color3(1, 1, 1);

/**
 * ⭐ The TURN ring: grey, matching the roll axis's own colour, at the body's centre — the point
 * the turn is actually applied about (the owner, 2026-09-23).
 */
export const GIZMO_RING_TURN_COLOUR = new Color3(0.72, 0.72, 0.72);

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
export const GIZMO_TURN_SCREEN_FRACTION = 1 / 3;

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
export const RING_POINTS: Vector3[] = Array.from({ length: 49 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2;
  return new Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
});

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
export const GIZMO_MOVE_GROUP = 2;

export const GIZMO_TURN_GROUP = 3;


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
// ⭐ `D171`: its one home is `core/scene_dims.ts` now, so the demo generator (engine-free) reads the same yaw.
export { ORBIT_START_YAW_RAD } from "../core/scene_dims";

export const ORBIT_START_ELEVATION = 0.62;

export const ORBIT_START_CENTRE_M: Vec3 = [0, 0, 0];
