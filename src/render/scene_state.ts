/**
 * THE SCENE'S SHARED STATE AND TYPES — one `SceneState` object every render module takes, the closure-level types, and the constants.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
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
import { parseConfigOverrides, PinchTracker, OrbitController, OrbitCentreBlend, PointerNoiseMeter, PointerRouter, ShakeDetector, SwayWatcher, SpinSwayWatcher, CameraResetAnimation, Recognizer, TapHistory, MotionTracker, type GravityFrame, type Behaviour, type AlignMode, type FollowState, type Sample } from "../input";
import { type Quat, type Vec3 } from "../core/vec";
import { type ObjectId, type World } from "../core/object_model";
import { RotationFollower, RotationTally } from "../input/rotation_increment";
import { AlignmentLinks } from "../core/alignment_links";
import { PioneerFaceCursors } from "../core/pioneer_face_cursors";
import { SnapArming } from "../input/snap";
import { UnsnapDetector } from "../input/unsnap";
import { SeatSnaps } from "../input/seat_snap";
import { AlignSnaps } from "../input/align_snap";
import { type MeshTopology } from "../core/mesh_topology";
import { type HighlightVerdict } from "../input/highlight";
import { type ObjectAxes } from "../input/object_axes";
import { JumpWatch, type Jump } from "../input/jump_watch";
import { type GizmoChannels } from "../input/axis_translate";
import { type SwingLatch } from "../input/approach_swing";
import { type GestureConfig } from "../input/gestureConfig";
import { type Hud } from "./hud";
import { type MouseSecondTouchHandle } from "./mouse_adapter";

/**
 * ⭐ How far a face marker floats off the surface it marks, in METRES. ⛔ Enough to beat
 * z-fighting and small enough not to read as a gap — and a named constant because it is used
 * in the parent's frame now, where a bare `0.0015` would look like a UV or an alpha.
 */
export const MARKER_LIFT_M = 0.0015;

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
 * ⭐⭐⭐ **FUCHSIA — A FACE THE HELD BODY IS NEARLY READY TO MATE WITH** (the owner, 2026-09-24).
 * ⛔ A third colour and not a shade of the other two: cyan and amber say *this pair IS aligned*,
 * and this one says *this pair COULD be* — an offer, not a state.
 */
export const CANDIDATE_COLOUR = new Color3(1, 0.1, 0.8);
/**
 * ⭐ The PioneerFaceCursor is AMBER — the Pioneer's own colour (the owner, 2026-09-25: *"the ring
 * shall be amber instead of green"*, correcting the first dictation).
 */
export const PIONEER_CURSOR_COLOUR = PIONEER_COLOUR;
/**
 * ⭐⭐ `A16`'s **WHITE** — the capture contour, on BOTH bodies of the pair.
 *
 * ⛔ ONE WHITE FOR BOTH, by the owner's decision: *"make the white contours not differ for the
 * moment, capture it for possible future improvement."*
 */
export const CAPTURE_COLOUR = new Color3(1, 1, 1);

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
  readonly body: LinesMesh;
  readonly align: LinesMesh;
  shell: LinesMesh;
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
  tuning: ReturnType<typeof parseConfigOverrides>;
  centreMarker: Mesh;
  mouseLayer: MouseSecondTouchHandle;
  selectedFace: { objectId: string; faceId: string; cos: number } | null;
  orbitStartZoom: number;
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  light: HemisphericLight;
  dimsOf: Map<ObjectId, readonly [number, number, number]>;
  untaperedBodies: string[];
  idOf: Map<AbstractMesh, ObjectId>;
  meshOf: Map<ObjectId, AbstractMesh>;
  shapelessBodies: string[];
  drawFault: string | null;
  drawFaultCount: number;
  topoOf: Map<ObjectId, MeshTopology>;
  world: World;
  faceMarkers: Map<string, FaceMarker>;
  candidateRings: Map<string, LinesMesh>;
  candidateRingLocal: Map<string, Vec3>;
  pioneerCursors: PioneerFaceCursors;
  pioneerCursorMeshes: Map<string, Mesh>;
  pioneerCursorMat: StandardMaterial;
  alignModeOf: Map<ObjectId, AlignMode>;
  links: AlignmentLinks;
  snapArming: SnapArming;
  seatSnaps: SeatSnaps<ObjectId>;
  unsnapDetectors: Map<string, UnsnapDetector>;
  rawPressedBody: Map<number, ObjectId>;
  pointerTypeOf: Map<number, string>;
  outlines: Map<ObjectId, BodyOutlines>;
  highlighted: HighlightVerdict;
  bootObjectAxes: ObjectAxes | null;
  bootGestureFrame: GravityFrame | null;
  gizmoAxes: Map<ObjectId, GizmoChannels>;
  rolledThisHold: Set<ObjectId>;
  frameAxisDriven: Map<ObjectId, [boolean, boolean, boolean]>;
  frameTurnAxes: Map<ObjectId, TurnAxes>;
  gizmoTurnAxes: Map<ObjectId, TurnAxes>;
  lastTrackGain: number;
  lastEdgeOn: boolean;
  zoneWas: boolean;
  zonePair: readonly ObjectId[];
  zoneEnterCalls: number;
  axisGizmos: Map<ObjectId, AxisGizmo>;
  gizmoRings: Map<ObjectId, LinesMesh>;
  gizmoTurnRings: Map<ObjectId, LinesMesh>;
  markerMat: StandardMaterial;
  hud: Hud;
  taps: TapHistory;
  router: PointerRouter<AbstractMesh>;
  held: Map<number, Held>;
  followers: Map<AbstractMesh, Follow>;
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
  swing: SwingLatch | null;
  frameTravelRightM: number;
  frameTravelUpM: number;
  frameTravelDepthM: number;
  appliedSwingYaw: number;
  swingAmp: { rad: number; atMs: number } | null;
  swingFrozenProgress: number | null;
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
  unsnapTrace: string;
  lastFedPointer: number;
  cfg: GestureConfig;
  canvas: HTMLCanvasElement;
}


export const BODY_OUTLINE_FRACTION = 0.005;

export const ALIGN_OUTLINE_FRACTION = 0.02;

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
export const GIZMO_RING_PX = 11;

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
export const ORBIT_START_YAW_RAD = -Math.PI / 2;

export const ORBIT_START_ELEVATION = 0.62;

export const ORBIT_START_CENTRE_M: Vec3 = [0, 0, 0];
