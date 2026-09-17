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
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
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
  rollDragDeg,
  secondFingerDrive,
  gravityFrame,
  type GravityFrame,
  depthLimits,
  depthTranslate,
  bindingAfterSecondRelease,
  orphanAction,
  initialBehaviour,
  isTapRelease,
  toggleBehaviour,
  type Behaviour,
  faceAlignConstraint,
  pioneerTurned,
  type AlignMode,
  retargetAlignment,
  tapMeaning,
  flickResetPlan,
  type TapContext,
  ShakeDetector,
  shakeParamsFrom,
  constrainedDragAngle,
  constrainedRollAngle,
  rotateAboutAxis,
  type HolderBinding,
  type InputEvent,
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
  type Face,
  WORLD_DOWN,
  type ObjectId,
  type World,
} from "../core/object_model";
import type { Placed } from "../core/mate_connector";
import { CAMERA_NEAR_PLANE_M } from "../input/gestureConfig";
import { mmToPx } from "../core/units";
import { faceFromPickedNormal, faceMarkerLocalOrientation } from "../core/face_pick";
import { singleAlignment, solve } from "../core/constraint_stack";
import {
  clearObjectConstraints,
  evictObjectConstraints,
  faceWorld,
  pushObjectConstraint,
} from "../core/object_model";
import { IDENTITY, qSlerp, qmul } from "../core/vec";
import { validateGestureConfig } from "../input/gestureConfig";
import { createHud } from "./hud";
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
  const placeFaceMarker = (marker: AbstractMesh, objectId: ObjectId, faceId: string): boolean => {
    const m = meshOf.get(objectId);
    const face = world.objects.get(objectId)?.faces.find((f) => f.id === faceId);
    if (!m || !face) return false;
    if (marker.parent !== m) marker.parent = m;
    // ⭐ Lifted off the surface by a hair, or it z-fights with the face it marks. ⚠ In METRES,
    // in the PARENT's frame — the objects are unscaled, so a local millimetre is a world one.
    marker.position.set(
      face.centre[0] + face.normal[0] * MARKER_LIFT_M,
      face.centre[1] + face.normal[1] * MARKER_LIFT_M,
      face.centre[2] + face.normal[2] * MARKER_LIFT_M,
    );
    const q = faceMarkerLocalOrientation(face.normal);
    marker.rotationQuaternion?.set(q[1], q[2], q[3], q[0]);
    return true;
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
  const alignFollowerToPioneer = (pioneerPointerId: number, pioneerGrip: Held, mode: AlignMode): boolean => {
    const pioneerId = idOf.get(pioneerGrip.mesh);
    if (pioneerId === undefined || pioneerGrip.pressFace === null) {
      lastVerdict = "align: tap resolved no face — toggled instead";
      return false;
    }
    // ⛔⛔ EXACTLY ONE OTHER HOLDER. The rule names a *first* and a *second* object; with
    // two other objects held, *which* one is the Follower has no answer worth trusting, and
    // guessing would align an object the hand did not mean to move. ⭐ Same discipline as
    // `A15`'s *"every remaining holder is evaluated, not a guessed pairing"*.
    const others = [...held.entries()].filter(([pid]) => pid !== pioneerPointerId);
    if (others.length !== 1) {
      lastVerdict =
        others.length === 0
          ? "align: nothing held — the tap toggled the mode"
          : `align: ${others.length} objects held — no Follower can be chosen, toggled instead`;
      return false;
    }
    const followerGrip = others[0]![1];
    const followerId = idOf.get(followerGrip.mesh);
    if (followerId === undefined || followerGrip.pressFace === null) {
      lastVerdict = "align: the held object has no resolved face — toggled instead";
      return false;
    }

    // ⭐ The Pioneer normal is read in WORLD **now** and then frozen — §1.4's doctrine, and
    // the owner's own *"the PioneerFace resets as null"*. There is no live relationship
    // afterwards: moving the other object later does not drag this alignment with it.
    const pioneerWorld = faceWorld(world, pioneerId, pioneerGrip.pressFace.faceId)?.normal;
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
    const solved = solve(capped.stack, before, { evictOnOverflow: cfg.evictOnOverflow });
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
      alignAnim = { objectId: followerId, from: before, to: target, t0: performance.now() };
    } else {
      setModelOrientation(followerGrip.mesh, target);
      alignAnim = null;
    }
    followerGrip.alignmentTouched = true;
    // ⭐⭐ THE HIGHLIGHT IS THE ALIGNMENT'S STATE, not the press's: it appears HERE and dies
    // with the constraint (`D35`, and the owner's *"until un-highlight occurs"*).
    selectedFace = {
      objectId: followerId,
      faceId: followerGrip.pressFace.faceId,
      cos: followerGrip.pressFace.cos,
    };
    // ⛔⛔ *"THEN THE PIONEERFACE RESETS AS NULL"* WAS AMENDED THE SAME DAY. The owner now
    // wants its **contour highlighted until the alignment is broken**, and a re-tap on that
    // same face to break it — so the face's identity is REMEMBERED where it can be drawn and
    // compared. ⭐ What *is* still discarded is the grip's own `pressFace`: a Pioneer's grip
    // is being released, and a stale face on a dead grip is the kind of thing a later rule
    // picks up by accident.
    const pioneerFaceId = pioneerGrip.pressFace.faceId;
    pioneerGrip.pressFace = null;
    pioneerFace = { objectId: pioneerId, faceId: pioneerFaceId };
    pioneerOrientation = world.objects.get(pioneerId)?.local.orientation ?? null;
    alignMode = mode;
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
      `align: ${mode} ${followerId}/${followerGrip.pressFace.faceId} → ` +
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
  const faceQuad = CreatePlane(
    "selected-face",
    { size: OBJECT_SIZE_M, sideOrientation: 2 /* DOUBLESIDE */ },
    scene,
  );
  const faceQuadMat = new StandardMaterial("selected-face-mat", scene);
  faceQuadMat.emissiveColor = FOLLOWER_COLOUR.clone();
  faceQuadMat.disableLighting = true;
  faceQuadMat.alpha = 0.35;
  faceQuad.material = faceQuadMat;
  faceQuad.rotationQuaternion = Quaternion.Identity();
  // ⛔⛔ BOTH FLAGS MATTER, and each has a precedent in this file. `isPickable = false` or
  // the highlight would intercept the very picks that select a face — the second tap would
  // hit the marker, not the object. ⚠ And it is NOT tagged `orbitCandidate`, so it cannot
  // become a barycentre: a readout that moved the thing it describes is the trap the
  // orbit-centre marker already documents.
  faceQuad.isPickable = false;
  faceQuad.isVisible = false;

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
   * ⚠ Called wherever the mode changes, never per frame: a material write every frame would
   * be a second writer for a value that changes on a gesture.
   */
  const paintHighlightColours = (): void => {
    const follower = alignMode === "FOLLOW" ? PIONEER_COLOUR : FOLLOWER_COLOUR;
    faceQuadMat.emissiveColor.copyFrom(follower);
  };

  const faceContour = CreateLines(
    "pioneer-face-contour",
    {
      points: [
        new Vector3(-0.5, -0.5, 0),
        new Vector3(0.5, -0.5, 0),
        new Vector3(0.5, 0.5, 0),
        new Vector3(-0.5, 0.5, 0),
        new Vector3(-0.5, -0.5, 0),
      ],
    },
    scene,
  );
  faceContour.color = PIONEER_COLOUR.clone();
  faceContour.scaling = new Vector3(OBJECT_SIZE_M, OBJECT_SIZE_M, 1);
  faceContour.rotationQuaternion = Quaternion.Identity();
  faceContour.isPickable = false;
  faceContour.isVisible = false;

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
     * ⭐⭐⭐ A15 — is the object still UNDER this finger? Evaluated by a RAYCAST when a
     * second touchpoint lifts, and by nothing else.
     * ⛔ `ORPHANED` changes nothing on its own: the selection is dropped at the NEXT input
     * event, which is the owner's requirement and `METHOD`'s *acting is irreversible*.
     * ⚠ Depth translation is what makes this reachable — it slides the object along the
     * view axis while the holder holds still, so the object leaves the finger carrying it.
     */
    binding: HolderBinding;
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
            // ⭐⭐⭐ A15's ORPHANED BINDING, and it MUST be printed. ⛔ It is a state in
            // which everything looks normal and the very next input does something
            // different — the object is still drawn where it was, still lit, still
            // apparently held. Without a readout, *"it deselected by itself"* and *"the
            // selection was already dead"* are indistinguishable on the glass.
            ([...held.values()].some((g) => g.binding === "ORPHANED")
              ? "  ⛔ORPHANED(next input unselects)"
              : "") +
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
        // ⭐⭐ 2sexte's twist about a constraint axis (`D34`). ⚠ Defaulted EQUAL to the free
        // gain so one DOF does not feel like a different control from three — a guess, and
        // the range is the same as the free gain's so a hand can compare them directly.
        tunable("anchored twist gain (rad/mm)", "gainRotateConstrained", 0.005, 0.15, 0.005),
        // ⭐ The sympathetic swing: the rest of the scene turns as a block about this
        // object's centre when it starts turning or turns the other way.
        tunable("sway of others (deg)", "rotateSwayDeg", 0, 8, 0.1),
        tunable("sway softness (ms)", "rotateSwayTauMs", 40, 600, 20),
        tunable("sway re-trigger turn (deg)", "rotateSwayTurnDeg", 15, 170, 5),
        tunable("sway reference turn (deg/s)", "rotateSwayReferenceDegPerS", 20, 400, 10),
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
        tunable("straightness (0=strict, 1=any)", "evictShakeStraightness", 0.1, 0.9, 0.05),
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

    // ⭐⭐⭐ A12 + A16 — the second finger drives ONE of two rules: **roll** by its x or
    // **depth** by its y, and the MODE picks which. ⚠ A12 gave it both at once, kept
    // independent by A11's per-axis bands; A16 narrowed it to one, and with the forks gone
    // (`D28`) that narrowing is all there is. ⛔ The travel is the DEADBANDED travel, exactly
    // as rule 6 and 2bis take the holder's.
    // ⛔ The live mode is handed over so the choice is made inside the vectored rule, not
    // here — `D23`: breaking a decision left in `scene.ts` reddens nothing.
    const drive = secondFingerDrive(
      tracker.axes,
      tracker.step,
      behaviour,
    );
    if (drive.rollDxPx === 0 && drive.depthDyPx === 0) return false;

    if (drive.depthDyPx !== 0) {
      applyDepthStep(grip, drive.depthDyPx);
      grip.mode = "DEPTH";
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
      const rollStack = rollId === undefined ? [] : (world.objects.get(rollId)?.constraints ?? []);
      if (rollStack.length === 1) {
        const axis = rollStack[0]!.targetWorld;
        const twist = constrainedRollAngle(
          screenFrame(),
          axis,
          rollDragDeg(drive.rollDxPx, cfg.gainRollDrag),
        );
        if (twist !== null) {
          setModelOrientation(grip.mesh, rotateAboutAxis(modelOrientation(grip.mesh), axis, twist));
        }
      } else {
        // ⚠ **NO REFUSAL BRANCH ANY MORE**, and that is the CAP doing its work: an object
        // can hold at most ONE alignment (`singleAlignment`), so *"the stack is full and the
        // roll must refuse"* is unreachable by construction rather than by a test. ⛔ The
        // branch that used to say so is deleted with fork B — an unreachable guard is a trap,
        // and this project has paid for two of them.
      setModelOrientation(
        grip.mesh,
        screenRollRotation(
          modelOrientation(grip.mesh),
          grip.frame,
          rollDragDeg(drive.rollDxPx, cfg.gainRollDrag),
        ),
      );
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

  /**
   * ⭐ What object is under this screen point RIGHT NOW, or `null`.
   *
   * ⚠ Built from `createPickingRay` + `pickWithRay` rather than `scene.pick`, to use the
   * SAME coordinate convention as `recomputeOrbitCentre` — client coordinates straight off
   * the event, which is what already works on the device. ⛔ The orbit-centre marker is
   * `isPickable = false`, so an instrument cannot answer a question about the scene.
   */
  const objectUnder = (x: number, y: number): AbstractMesh | null => {
    const hit = scene.pickWithRay(scene.createPickingRay(x, y, null, camera));
    return hit?.hit === true && hit.pickedMesh ? hit.pickedMesh : null;
  };

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
  const evaluateBindings = (): void => {
    for (const holder of router.objects()) {
      const grip = held.get(holder.id);
      if (!grip) continue;
      // ⚠ The HOLDER's own last position — never the releasing finger's, and never the
      // live event's, which at a PRESS belongs to a different finger entirely.
      const under = objectUnder(holder.last.x, holder.last.y);
      grip.binding = bindingAfterSecondRelease(grip.mesh, under);
      if (grip.binding === "ORPHANED") {
        lastVerdict = "second released → object no longer under the finger, pending unselect";
      }
    }
  };

  /**
   * ⭐⭐⭐ A15 — COLLECT AN ORPHANED HOLDER, at the next input event and not before.
   *
   * ⛔ The selection is dropped and every live touchpoint is re-latched from what is under
   * it NOW, so the configuration re-resolves into whatever the hand is actually doing: a
   * finger over empty space becomes §2 rule 1's orbit, a finger on another object carries
   * that one. ⭐ None of that is a new rule — it is the rule table, read again.
   *
   * ⚠ Called BEFORE the event is dispatched, so the event itself falls through to the rule
   * the new configuration selects rather than being spent on the transition.
   */
  const collectOrphans = (event: InputEvent): void => {
    for (const [id, grip] of [...held.entries()]) {
      if (orphanAction(grip.binding, event) !== "UNSELECT_AND_RERESOLVE") continue;
      // ⛔ THE TRACKERS GO WITH THE SELECTION. They are keyed by `seq` and hold anchor
      // positions from the gesture that just ended; a surviving one would answer A11's
      // deadband question about travel that belongs to a different rule.
      grip.anchorMotion.clear();
      held.delete(id);
      // ⚠ The position comes from the ROUTER, which owns `last` — not from the recognizer
      // and not from the live event, which at a PRESS belongs to the new finger.
      const where = router.get(id)?.last;
      const relatched =
        where === undefined ? null : router.relatchOnOrphan(id, objectUnder(where.x, where.y));
      lastVerdict = `unselected → ${relatched ? relatched.role : "gone"}`;

      // ⛔⛔ AND §2 RULE 1 KEEPS THE CENTRE IT ALREADY HAS — **the previous yellow point**
      // (owner, 2026-09-16). ⭐ I had it retarget through the same `orbitCentreGraceMs`
      // deferral a real press uses, reasoning that rule 1 chooses its centre from the ray
      // of the finger that STARTS the orbit and this orbit was starting now. The owner
      // overruled it, and the rule is the one `resetCamera` already states: **home is the
      // last yellow target, not the origin** — the centre is the thing the user has been
      // orbiting, and it does not change because a selection ended.
      // ⚠ So there is deliberately NO centre code here. The marker does not move, and a
      // gesture that ends cannot retarget the camera.
    }
  };

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
  // ⭐⭐ *"Default start: rotation mode"* (owner, 2026-09-16). ⛔ There is one rule set now,
  // so this is simply the start: `initialBehaviour()` returns `ROTATE`.
  let behaviour: Behaviour = initialBehaviour();


  /**
   * ⭐⭐⭐ `IN3`'s SELECTED FACE — §2 rule 2's other half, and the input every remaining
   * `IN3` rule reads: 2ter anchors it to gravity, 2quater to a world axis, `MATE` joins two.
   *
   * ⛔ `null` in forks A and C, always. ⚠ It carries the pick's COSINE because a later rule
   * may want to refuse a grazing pick — and nothing refuses one yet, so the number is
   * evidence on the readout rather than a hidden threshold.
   */
  let selectedFace: { objectId: string; faceId: string; cos: number } | null = null;

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
  let pioneerFace: { objectId: string; faceId: string } | null = null;

  /**
   * ⭐⭐ The Pioneer object's orientation as of the last frame that looked at it — the
   * baseline `pioneerTurned` compares against.
   * ⛔ Captured when the alignment is made and refreshed every frame after, so it is *the
   * previous frame's* pose and never the alignment's. ⚠ A stale baseline would make one
   * turn fire the rule for ever.
   */
  let pioneerOrientation: Quat | null = null;

  /**
   * ⭐⭐⭐ **WHAT THE LIVE ALIGNMENT MEANS** — `SNAPSHOT` (a single tap made it) or `FOLLOW`
   * (a double tap did). ⛔ It was `?pioneerTurnRule` for a few hours on 2026-09-17 and the
   * owner replaced the flag with the GESTURE: *"one single tap … the logic is as fork C1; one
   * double tap … as fork C2"*. ⭐ So it is per-alignment state rather than a session setting,
   * and the highlight COLOURS report it — two colours for a snapshot, one for a relationship.
   * ⚠ `null` exactly when nothing is aligned.
   */
  let alignMode: AlignMode | null = null;

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
  let alignAnim: { objectId: ObjectId; from: Quat; to: Quat; t0: number } | null = null;

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
    if (alignAnim?.objectId === objectId) alignAnim = null;
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
  const noteTap = (pressed: Sample, released: Sample): "TAP" | "DOUBLE_TAP" | null => {
    const wasTap = isTapRelease(
      pressed.t, pressed.x, pressed.y,
      released.t, released.x, released.y,
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
    behaviour = toggleBehaviour(behaviour);
    lastVerdict = `tap → ${behaviour}`;
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

    // ⭐ The anchor fork latches here, before anything is dispatched, so one event cannot be
    // judged half under one rule set and half under another.

    // ⭐⭐⭐ A15 — AN ORPHANED SELECTION IS COLLECTED HERE, AT THE NEXT INPUT EVENT, and
    // before anything is dispatched. ⛔ The owner's requirement: the lift itself changes
    // nothing, and the object is unselected only once the hand says something new — after
    // which THIS event flows into whatever rule the re-resolved configuration selects.
    // ⚠ A POINTERUP is deliberately absent: the orphaned holder's own release is handled
    // in its branch, where the §1.3 verdict has to be SKIPPED rather than re-resolved.
    if (info.type === PointerEventTypes.POINTERDOWN) collectOrphans("PRESS");
    else if (info.type === PointerEventTypes.POINTERMOVE) collectOrphans("MOVE");

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
          ? faceFromPickedNormal(world, pickedId, [faceNormal.x, faceNormal.y, faceNormal.z] as Vec3)
          : null;
      const pressFace = faceHit ? { faceId: faceHit.faceId, cos: faceHit.cos } : null;
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
        mode: null,
        pressFace,
        alignmentTouched: false,
        sway: new SwayWatcher(cfg.swayTurnDeg, cfg.pointerNoiseMm),
        anchorMotion: new Map(),
        binding: "BOUND",
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
        noteTap(routed.pressed, s);
        // ⭐⭐⭐ A15: released FROM THE SAME OBJECT (A12's roll/depth finger). Ask whether
        // the holder is still on its object before anything else can happen.
        evaluateBindings();
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
        forgetAnchor(routed.seq);
        router.release(e.pointerId);
        // ⭐⭐⭐ A15: this is A10's DEPTH ANCHOR going up — the case that motivated the
        // amendment, because depth is what slides the object off the holder's finger.
        evaluateBindings();
        // ⛔ A pinch needs BOTH touchpoints. Lifting one ends it rather than letting
        // the survivor keep scaling against a partner that is gone.
        pinch.end();
        // ⭐⭐ ONE call, ONE record: it judges the tap, keeps §1.3's history, and arms fork
        // C's pending toggle. ⛔ A DOUBLE tap keeps exactly the meaning it has in forks A and
        // B — the camera reset — and cancels the pending toggle rather than being consumed
        // by it. ⭐ That is what the discrimination bought: the two gestures stopped
        // overlapping, so the special case disappeared instead of growing.
        if (noteTap(routed.pressed, s) === "DOUBLE_TAP") {
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
        // ⭐⭐⭐ A14: A LIFT-AND-REPLACE IS ONE GESTURE. Between the lift and the press
        // there is genuinely one touchpoint down, so without the grace A13 translates
        // through the middle of a swap — and a swap is 150-300 ms of hand, which is very
        // visible if the holder happens to be moving at the time. ⚠ That is exactly why the
        // owner's cases 2 and 3 *"differ by timing of the input"*.
        grip.mode =
          router.objects().length === 1
            ? behaviour
            : "TRANSLATE";
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
              pioneerFace = null;
              pioneerOrientation = null;
              alignMode = null;
            }
            grip.alignmentTouched = false;
            lastVerdict = `align: SHAKE released the alignment on ${sid}`;
          }
          // ⭐⭐⭐ **C2 ONLY: A SHAKE ON THE *PIONEER* RELEASES THE FOLLOWER'S ALIGNMENT** —
          // the owner's clause, and it belongs to C2 because C1 gets the same outcome for
          // free: shaking while rotating turns the object, and in C1 a turn releases.
          // ⚠⚠ **THE GAP THAT LEAVES, STATED**: in C1, a shake on the Pioneer *while the mode
          // is `TRANSLATE`* turns nothing, so it releases nothing. Dictated that way; whether
          // C1 wants it too is a question for the device pass (`ALIGNMENT_RULES.md` §7).
          if (
            alignMode === "FOLLOW" &&
            pioneerFace?.objectId === sid &&
            selectedFace !== null
          ) {
            const fId = selectedFace.objectId;
            const ev2 = evictObjectConstraints(world, fId);
            world = ev2.world;
            cancelAlignAnim(fId);
            selectedFace = null;
            pioneerFace = null;
            pioneerOrientation = null;
            alignMode = null;
            lastVerdict = `align: FOLLOW — shake on the Pioneer released the alignment on ${fId}`;
          }
        }
      }
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
          const fstack = fid === undefined ? [] : (world.objects.get(fid)?.constraints ?? []);
          if (fstack.length === 1) {
            const axis = fstack[0]!.targetWorld;
            const twist = constrainedDragAngle(
              screenFrame(),
              axis,
              grip.rec.step.dx,
              grip.rec.step.dy,
              cfg.gainRotateConstrained,
            );
            if (twist === null) {
              lastVerdict = "align: twist degenerate — the aligned normal points at the camera";
            } else if (twist !== 0) {
              setModelOrientation(
                grip.mesh,
                rotateAboutAxis(modelOrientation(grip.mesh), axis, twist),
              );
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
              if (alignAnim !== null && alignAnim.objectId === fid) {
                // ⛔ ONE definition of the world rotation, borrowed from the rule that applies
                // it — a second `qFromAxisAngle` here would be free to disagree with it.
                const rode = rotateAboutAxis(IDENTITY, axis, twist);
                alignAnim = {
                  ...alignAnim,
                  from: qmul(rode, alignAnim.from),
                  to: qmul(rode, alignAnim.to),
                };
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
      if (orphanAction(grip.binding, "RELEASE") === "DROP_WITHOUT_VERDICT") {
        forgetAnchor(routed.seq);
        router.release(e.pointerId);
        held.delete(e.pointerId);
        lastVerdict = "orphaned holder released — no verdict";
        paint();
        return;
      }
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
            pioneerFace = null;
            pioneerOrientation = null;
            alignMode = null;
          }
          lastVerdict = `align: rotation reset — alignment made in this gesture, dropped (${ev.result.removed})`;
        } else {
          lastVerdict = "align: rotation reset — alignment older than the press, conserved";
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
      if (verdict.kind === "TAP" || verdict.kind === "DOUBLE_TAP") {
        const others = [...held.entries()].filter(([pid]) => pid !== e.pointerId);
        const heldId = others.length === 1 ? (idOf.get(others[0]![1].mesh) ?? null) : null;
        const ctx: TapContext = {
          kind: verdict.kind,
          alignMode,
          tappedObject: idOf.get(grip.mesh) ?? null,
          tappedFace: grip.pressFace?.faceId ?? null,
          heldObject: heldId,
          // ⚠ The Pioneer counts only for the object THIS tap could act on — the one being
          // held. A remembered Pioneer belonging to some other object's alignment must not
          // make this tap an undo.
          pioneer: heldId !== null && selectedFace?.objectId === heldId ? pioneerFace : null,
        };
        const meaning = tapMeaning(ctx);
        if (meaning.action === "ALIGN" && meaning.mode !== null) {
          alignedByThisTap = alignFollowerToPioneer(e.pointerId, grip, meaning.mode);
        } else if (meaning.action === "SWITCH" && meaning.mode !== null) {
          // ⭐⭐ *"A single tap on PioneerFace can follow a double tap … and therefore toggle
          // to behaviors accordingly"* — the owner. ⛔ NOTHING MOVES: the constraint, the
          // faces and the poses are untouched, and only what the alignment MEANS changes.
          // ⭐ The colours are how a hand sees that it worked.
          alignMode = meaning.mode;
          paintHighlightColours();
          alignedByThisTap = true; // ⛔ consumed: it must not also flip the movement mode
          lastVerdict = `align: now ${meaning.mode} (the other gesture on the same face)`;
        } else if (meaning.action === "UNALIGN" && heldId !== null) {
          // ⭐⭐⭐ *"The alignment can be toggled off by taping another time to the same
          // PioneerFace"* (`D39`) — and since the modes were merged, by **the same gesture
          // that made it**: a single tap releases a `SNAPSHOT`, a double tap releases a
          // `FOLLOW`. ⚠ So leaving `FOLLOW` by single taps takes two — one to switch, one to
          // release — which is the cost of one gesture carrying two jobs.
          const ev = evictObjectConstraints(world, heldId);
          world = ev.world;
          cancelAlignAnim(heldId);
          selectedFace = null;
          pioneerFace = null;
          pioneerOrientation = null;
          alignMode = null;
          others[0]![1].alignmentTouched = false;
          alignedByThisTap = true;
          lastVerdict = ev.result.refused
            ? `align: re-tap — nothing to release on ${heldId}`
            : `align: RE-TAP released the alignment on ${heldId}`;
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
      if (!alignedByThisTap && (verdict.kind === "TAP" || verdict.kind === "DOUBLE_TAP")) {
        behaviour = toggleBehaviour(behaviour);
        lastVerdict = `tap on the object → ${behaviour}`;
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
      const highlightedStillAligned =
        selectedFace !== null &&
        (world.objects.get(selectedFace.objectId)?.constraints.length ?? 0) > 0;
      if (!highlightedStillAligned) {
        selectedFace = null;
        // ⭐ The Pioneer's contour reports the same alignment, so it goes at the same moment.
        pioneerFace = null;
        pioneerOrientation = null;
        alignMode = null;
      }
      forgetAnchor(routed.seq);
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

    // ⭐⭐ THE ALIGNMENT'S SLERP, ADVANCED BEFORE ANYTHING READS AN ORIENTATION this frame —
    // the Pioneer watch below compares orientations, and the markers are drawn from them.
    // ⚠ `easeInOut` is the camera reset's own easing, imported rather than re-derived: two
    // eased snaps in one product should not accelerate differently for no reason.
    if (alignAnim !== null) {
      const mesh = meshOf.get(alignAnim.objectId);
      if (!mesh) {
        alignAnim = null;
      } else {
        const snapMs = cfg.cameraResetMs * ALIGN_SNAP_FRACTION;
        const u = snapMs > 0 ? (now - alignAnim.t0) / snapMs : 1;
        if (u >= 1) {
          // ⛔ LAND EXACTLY on the solved orientation, never on `slerp(…, 0.999)`: the
          // constraint has been true since the tap, and the pose must agree with it exactly.
          setModelOrientation(mesh, alignAnim.to);
          alignAnim = null;
        } else {
          setModelOrientation(mesh, qSlerp(alignAnim.from, alignAnim.to, easeInOut(u)));
        }
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
    if (pioneerFace !== null && pioneerOrientation !== null && selectedFace !== null) {
      const pObj = world.objects.get(pioneerFace.objectId);
      const fId = selectedFace.objectId;
      if (!pObj) {
        pioneerFace = null;
        pioneerOrientation = null;
      } else {
        const turn = pioneerTurned(pioneerOrientation, pObj.local.orientation, alignMode ?? "SNAPSHOT");
        if (turn.kind === "RELEASE") {
          // ⭐ C1: *"releases the first object alignment (but not rotate the first object)"* —
          // so the pose is left exactly as the hand left it, and only the RULE goes.
          const ev = evictObjectConstraints(world, fId);
          world = ev.world;
          cancelAlignAnim(fId);
          selectedFace = null;
          pioneerFace = null;
          pioneerOrientation = null;
          alignMode = null;
          lastVerdict = `align: SNAPSHOT — the Pioneer turned, alignment released on ${fId}`;
        } else if (turn.kind === "FOLLOW" && turn.delta !== null) {
          // ⭐⭐ C2: the Follower takes the SAME WORLD ROTATION, which keeps the two normals
          // parallel by construction — no solve, and no chance of the solver adding a twist.
          const followerMesh = meshOf.get(fId);
          if (followerMesh) {
            setModelOrientation(followerMesh, qmul(turn.delta, modelOrientation(followerMesh)));
          }
          // ⭐⭐ AN ANIMATION IN FLIGHT RIDES ALONG: both ends take the same world rotation, so
          // the snap keeps travelling toward a target that has moved with the Pioneer.
          // ⛔ Without this the slerp would drag the object back toward where the Pioneer USED
          // to point — a tug backwards during the very gesture that is turning it.
          if (alignAnim !== null && alignAnim.objectId === fId) {
            alignAnim = {
              ...alignAnim,
              from: qmul(turn.delta, alignAnim.from),
              to: qmul(turn.delta, alignAnim.to),
            };
          }
          // ⭐ *"the alignment is updated per frame to match the second object's PioneerFace
          // normal"* — bookkeeping that keeps the CONSTRAINT truthful; the geometry above
          // already holds. ⚠ Without it the stack would still name the old direction, and the
          // next rule to read it (a twist, a reset) would act on a stale target.
          const pn = faceWorld(world, pioneerFace.objectId, pioneerFace.faceId)?.normal;
          const stack = world.objects.get(fId)?.constraints ?? [];
          if (pn && stack.length === 1) {
            world = clearObjectConstraints(world, fId);
            world = pushObjectConstraint(world, fId, retargetAlignment(stack[0]!, pn), false);
          }
          lastVerdict = `align: FOLLOW — the Follower took the Pioneer's turn`;
        }
        if (pioneerOrientation !== null) pioneerOrientation = pObj.local.orientation;
      }
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
    faceQuad.isVisible =
      selectedFace !== null && placeFaceMarker(faceQuad, selectedFace.objectId, selectedFace.faceId);
    // ⛔⛔ THE PAIR IS ATOMIC: the contour may not outlive the fill. Both report ONE
    // alignment, so a contour drawn without its Follower would be an instrument claiming a
    // relationship that no longer exists — the readout-that-lies shape, and the cheapest
    // possible guard against it is this conjunction.
    faceContour.isVisible =
      selectedFace !== null &&
      pioneerFace !== null &&
      placeFaceMarker(faceContour, pioneerFace.objectId, pioneerFace.faceId);

    scene.render();
    frames++;
  });
  window.addEventListener("resize", () => engine.resize());

  return { scene, engine, framesRendered: () => frames };
}
