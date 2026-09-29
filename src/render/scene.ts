/**
 * THE COMPOSITION ROOT — ⭐ split into modules on 2026-09-26 (the owner: *"split it so that we
 * correct that now and make everything as much modular as possible"*).
 *
 * ⛔⛔ **WHAT THIS FILE OWNS**: the engine, the scene, the camera and the light; the boot of the
 * four bodies; every field of `SceneState` initialised in the order the old closure had them; and
 * the install order — the camera, the tuning menu, the pointer handler, the first HUD paint, the
 * render loop. ⭐ It holds NO rule and NO per-frame logic: those are the modules', each of which
 * takes `st: SceneState` first.
 *
 * | module | owns |
 * |---|---|
 * | `scene_state.ts` | `SceneState`, the closure-level types, the constants |
 * | `bodies.ts` | meshes, topology, shapes, the model-pose port (`setModelPose`) |
 * | `markers.ts` | face fills and contours, the HitFace contour, PioneerFaceCursors, outlines |
 * | `alignment_wiring.ts` | `alignFollowerTo`, release, seat/unseat |
 * | `gizmo.ts` | the axis gizmo and its rings |
 * | `camera_rig.ts` | orbit, zoom, centre blend, reset, gesture frames |
 * | `hud_paint.ts` | every readout line |
 * | `tuning_menu.ts` | every slider |
 * | `sway_pass.ts` | the nudge and the spin of the other bodies |
 * | `drive.ts` | where a translation or a depth step lands (`applyWorldStep`) |
 * | `seat_wiring.ts` | the snap, the seats, the unsnap feed, the cursor drag |
 * | `pointer_wiring.ts` | every press, move and release (`installPointerHandler`) |
 * | `render_loop.ts` | the per-frame order (`startRenderLoop`) |
 *
 * ⛔ The 2026-09-19 lesson still binds every module: *a rule written in a render file is a rule
 * nothing can interrogate.* Write the decision in `src/input` or `src/core`; a render module holds
 * the state and the call.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔⛔ THE UNITS TRAP THAT COST THE FIRST DEPLOY: **THIS SCENE IS IN METRES, AND
 * BABYLON'S DEFAULT NEAR PLANE IS 1 WORLD UNIT.**
 *
 * The objects are 0.08 m across at a camera radius of 0.6 m — so with `minZ` at its
 * default of `1`, EVERY object sits inside the near plane and is clipped away. The
 * result is a page showing nothing but the clear colour, with **no error anywhere**.
 * ⭐ Working in metres is the right choice — the mate geometry, the capture radii
 * and the play volume are all physical — so the near plane moves, not the scale.
 * ⚠ Any future camera must set `minZ` too. It is a per-camera property, not a scene one.
 */
import { attachShadows, buildLighting } from "./lighting";
import { levelElevation } from "../input/orbit";
import { EpisodeTally } from "../input/episode_ledger";
import { GestureSpan, UndoHistory } from "../core/undo_history";
import { type SceneSnapshot } from "./undo_wiring";
import "@babylonjs/core/Culling/ray";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { sceneConfig } from "../input/scene_rig";
import { DEFAULT_CONFIG, parseConfigOverrides, PinchTracker, OrbitController, OrbitCentreBlend, PointerNoiseMeter, PointerRouter, initialBehaviour, TapHistory } from "../input";
import { type Vec3 } from "../core/vec";
import { FrameMeter } from "../core/frame_meter";
import { makeWorld, type ObjectId } from "../core/object_model";
import { CAMERA_NEAR_PLANE_M } from "../input/gestureConfig";
import { RotationFollower, RotationTally } from "../input/rotation_increment";
import { seededRotations } from "../core/random_pose";
import { contourDims, resolveBootOrientation, type SceneDescriptor } from "../core/game_structure";
import { SCENE_0 } from "../content/scene_0";
import { AlignmentLinks } from "../core/alignment_links";
import { PioneerFaceCursors } from "../core/pioneer_face_cursors";
import { SnapArming } from "../input/snap";
import { UnsnapDetector } from "../input/unsnap";
import { SeatSnaps } from "../input/seat_snap";
import { AlignSnaps } from "../input/align_snap";
import { type MeshTopology } from "../core/mesh_topology";
import { JumpWatch } from "../input/jump_watch";
import { type GizmoChannels } from "../input/axis_translate";
import { createHud } from "./hud";
import { attachMouseSecondTouch } from "./mouse_adapter";
import { wheelZoom } from "../input/mouse_wheel_zoom";
import { CAMERA_RADIUS_M, ORBIT_START_CENTRE_M, ORBIT_START_ELEVATION, ORBIT_START_YAW_RAD, type AxisGizmo, type BodyOutlines, type FaceMarker, type Follow, type Held, type SceneState, type TurnAxes } from "./scene_state";
import { coreOf, make, quatOf, shapeOfBody, topologyOfBody } from "./bodies";
import { applyCamera, requireGestureFrame } from "./camera_rig";
import { paint } from "./hud_paint";
import { installTuningMenu } from "./tuning_menu";
import { installPointerHandler } from "./pointer_wiring";
import { startRenderLoop } from "./render_loop";

export interface SceneHandle {
  readonly scene: Scene;
  readonly engine: Engine;
  /** Set by the render loop; `main.ts` uses it to prove drawing actually happened. */
  framesRendered: () => number;
}

export function createScene(
  canvas: HTMLCanvasElement,
  /** ⭐ The scene to boot — `Scene_0` unless a level says otherwise (`core/game_structure.ts`). */
  spec: SceneDescriptor = SCENE_0,
): SceneHandle {
  const st = {} as SceneState;
  st.canvas = canvas;
  st.sceneSpec = spec;
  st.engine = new Engine(st.canvas, true, { stencil: true }, true);
  st.scene = new Scene(st.engine);

  // ⛔⛔ **PARSED HERE, FIRST, BECAUSE THE BOOT SCENE ITSELF NOW DEPENDS ON IT.** It used to sit
  // three hundred lines below, next to the gesture state that reads it — fine while only
  // gestures were tunable. ⚠ `sceneSeed` chooses the bodies' boot orientations, so the config
  // has to exist before the first `make()` call. ⭐ Moved rather than duplicated: a second
  // URL read would bypass `parseConfigOverrides`' validation and its rejected-key reporting,
  // and a typo'd key would then silently do nothing instead of being named on the HUD.
  // ⭐ `D131`: the scene's own orbit rig first, then the URL over it.
  st.tuning = parseConfigOverrides(sceneConfig(DEFAULT_CONFIG, spec.orbit), window.location.search);
  st.cfg = st.tuning.config;
  // ⛔ BEFORE anything paints: the HUD's `frame` line reads the meter on the first `paint()`,
  // which runs during boot — created later, it crashed the page (`Cannot read … 'stats'`).
  st.frameMeter = new FrameMeter();
  st.autoShadow = null;
  st.autoShadowArmedAt = performance.now();
  st.shadowModeSeen = st.cfg.shadowsOn;

  st.camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3,
    CAMERA_RADIUS_M,
    Vector3.Zero(),
    st.scene,
  );
  // ⛔⛔ SEE THE HEADER. Without this the whole scene is inside the near plane.
  // ⛔ ONE CONSTANT, ONE PLACE: the value lives in `gestureConfig.ts` because the
  // config VALIDATOR needs it to refuse a zoom range that would clip the scene.
  st.camera.minZ = CAMERA_NEAR_PLANE_M;
  st.camera.maxZ = 100;
  // ⛔ The camera does NOT take the pointer. Rules 1 and 4 drive the orbit through
  // the gesture layer; letting Babylon's own controls attach as well means two
  // things claim the same touch and the winner depends on event order.
  st.camera.detachControl();

  // ⭐⭐ THE SCENE'S OWN LIGHTS AND BACKGROUND (`Scene_1`), or `Scene_0`'s one hemispheric light.
  // ⭐ Measured at the mean of the bodies, in AUTHORED units — where the lights were aimed.
  const shadowGens = buildLighting(st, (() => {
    const bs = st.sceneSpec.bodies.filter((b) => !b.frozen);
    const n = Math.max(1, bs.length);
    return [0, 1, 2].map((i) => bs.reduce((a, b) => a + b.position[i]!, 0) / n) as [number, number, number];
  })());

  // ⚠ EXPLICIT materials rather than the auto-created default: with tree-shaken ES6
  // imports the default material is one more thing that has to have been pulled in,
  // and "the mesh is there but shaded black" is another silent-looking failure.
  /**
   * ⭐⭐ **EVERY BODY'S OWN DIMENSIONS.**
   *
   * ⛔⛔ THEY USED TO BE ONE SHARED CONSTANT, and the base plate is what broke that: at
   * `6L × 0.3L × 9L` it shares nothing with the `L × 2L × 3L` parts. ⚠ Five things read a
   * body's size — the mesh, its faces, the alignment contour and the face-marker extents (and
   * the white capture contour, deleted `D120`) — and a single constant would have drawn them
   * at the parts' size on a plate seventy times their volume.
   */
  st.dimsOf = new Map<ObjectId, readonly [number, number, number]>();
  st.contourMats = [];
  /** ⚠ Bodies whose taper was refused — reported on the HUD, never silently a box. */
  st.untaperedBodies = [];
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
  // ⚠ History (audit 2026-09-17): a claim here that *"at 5L nothing is in range at rest"* was
  // false for the base plate under the old centre-to-centre capture radius; the capture became a
  // surface gap (`D49`) and its white highlight is deleted (`D120`). ⭐⭐ `METHOD`: *a claim about a
  // composition expires when any part of it changes.*
  //
  // ⛔⛔ THE ROTATIONS ARE **SEEDED**, not per-boot random — `core/random_pose.ts` argues why,
  // and `?sceneSeed=N` rolls a new scene. ⚠ Three arbitrary orientations mean **no two bodies
  // start aligned**, which is correct: an alignment should be something a hand earns.
  const bootRotations = seededRotations(st.cfg.sceneSeed, 3);
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
  // ⭐⭐⭐ **THE RIGHT-HAND BODY IS THE TRAPEZOIDAL PYRAMID** — *"modify the rectangle on the
  // right to be a trapezoidal pyramid"* (the owner, 2026-09-22). ⚠ `objectB` is the one on the
  // right: it sits at `+x`, and it is the FOLLOWER of the boot pair a few hundred lines below.
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
  // ⭐⭐⭐ **THE BODIES BOOT FROM `Scene_0`'s DATA** (the owner, 2026-09-26: *"name our current
  // scene as Scene_0"*): four `BodySpec`s in `content/scene_0.ts` replaced four `make(...)` calls
  // here, in the same order with the same numbers. ⛔ The orientation names are resolved by
  // `core/game_structure.ts`, where a vector reaches them.
  // ⭐ `unitM`: the scene is AUTHORED in its own units; positions and sizes become metres here, once.
  const unitM = st.sceneSpec.unitM ?? 1;
  for (const b of st.sceneSpec.bodies) {
    // ⭐ `D125`: the BODY is the contour's box; the coloured core inside it is `dims` itself.
    const outer = contourDims(b);
    make(
      st,
      b.id,
      new Vector3(b.position[0] * unitM, b.position[1] * unitM, b.position[2] * unitM),
      [b.colour[0], b.colour[1], b.colour[2]],
      resolveBootOrientation(b.orientation, bootRotations),
      [outer[0] * unitM, outer[1] * unitM, outer[2] * unitM],
      b.frozen,
      b.topScale,
      (b.margin ?? 0) > 0 ? [b.dims[0] * unitM, b.dims[1] * unitM, b.dims[2] * unitM] : undefined,
    );
  }

  st.idOf = new Map<AbstractMesh, ObjectId>();
  st.meshOf = new Map<ObjectId, AbstractMesh>();

  /**
   * ⚠ Bodies whose geometry could not be read — reported on the HUD, never thrown. ⛔ A throw
   * in scene construction takes the page down; *this body never captures* is survivable, and an
   * INVISIBLE failure is not. This project has been burned twice by a readout that was absent.
   */
  st.shapelessBodies = [];
  /**
   * ⛔⛔ **A THROW INSIDE THE DRAW PATH USED TO BE INVISIBLE, AND THAT COST A DEVICE PASS.**
   *
   * ⚠ Babylon swallows an exception thrown from a render observer — the frame simply stops
   * where it threw. ⭐ So everything BEFORE the failure is drawn and everything after it is not,
   * which on the glass reads as *"the outlines are gone"* rather than as *"something threw"*.
   * ⛔ The first message is latched and printed on the HUD; later ones are counted, because a
   * throw in a render loop repeats sixty times a second and a scrolling readout is unreadable.
   */
  st.drawFault = null;
  st.drawFaultCount = 0;

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
  st.topoOf = new Map<ObjectId, MeshTopology>();

  st.world = makeWorld(
    st.scene.meshes
      .filter((m) => m.metadata?.orbitCandidate === true)
      .map((m) => {
        st.idOf.set(m, m.name);
        st.meshOf.set(m.name, m);
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
          faces: topologyOfBody(st, m).faces.map((f) => ({
            id: f.id,
            centre: f.centre,
            normal: f.normal,
          })),
          // ⭐⭐⭐ **THE COLLISION SHAPE, FROM THE MESH ITSELF** (`D49`) — no table, no name
          // lookup, nothing for an import path to remember. ⚠ For a box it is EXACT: its
          // corners ARE its hull.
          shape: shapeOfBody(st, m),
          frozen: m.metadata?.frozen === true,
          connectors: [],
          // §0's Start condition: every object begins with an EMPTY stack.
          constraints: [],
        };
      }),
  );
  // ⭐ `Scene_1`: every movable body casts, every body receives (the frozen floor only receives).
  // ⭐ `D125`: a body with a contour casts from its CORE — the transparent margin throws no shadow.
  attachShadows(shadowGens, [...st.meshOf.values()], (m) => st.world.objects.get(st.idOf.get(m) ?? "")?.frozen === true, (m) => coreOf(m));

  st.faceMarkers = new Map<string, FaceMarker>();

  /**
   * ⭐⭐⭐ **THE PIONEERFACECURSORS** — the owner, 2026-09-25: an amber ring at the PioneerFace
   * centre for every live alignment, destroyed with it (`core/pioneer_face_cursors.ts`).
   *
   * ⛔⛔ **ONE PER COUPLE, NOT ONE PER FACE**: two Followers on one PioneerFace own two rings at one
   * position, and a Follower re-aligned on another face (either side) gets a NEW ring — the tracker
   * keys by follower + FollowerFace + pioneer + PioneerFace. ⭐ Reconciled against the model every
   * frame, so no release path has to remember it — retired by membership, the 2026-09-17 lesson.
   *
   * ⭐ DISPOSED, not hidden, unlike the face markers: a cursor is a per-alignment OBJECT that may
   * later carry state of its own, and a hidden pool keyed by a couple would grow with every couple
   * ever made. ⚠ The material is SHARED and survives, so a dispose frees the mesh's buffers only.
   * ⛔ PARENTED to the Pioneer (defect 46) and BILLBOARDED — always in the screen view plane.
   */
  st.pioneerCursors = new PioneerFaceCursors();
  st.pioneerCursorMeshes = new Map<string, Mesh>();
  // ⭐ `D166`: the cursor is a line ring now, coloured on the line — the torus's shared material is gone.

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
   * does. ⛔ So there is no lifetime to manage and no cleanup path to forget: the instant an
   * unalign, an undo or a turned Pioneer evicts the constraint, the highlight has nothing to
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
   * ⚠ It was drawn larger than `A16`'s white capture contour so the two nested; that contour is
   * deleted (`D120`).
   */

  /**
   * ⭐⭐⭐ **WHO IS ALIGNED TO WHOM** — `core/alignment_links.ts`, a two-way index.
   *
   * The owner, 2026-09-17: *"for each aligned object, track its pioneer object. If the said
   * pioneer object is later shaken, the alignment of the aligned object shall be released …
   * when I shake the pioneer object it shall release all the follower objects"* (the shake is
   * deleted, `D107`; a tap on empty space while holding the Pioneer does it now), then *"make
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
   * the need for every release path — an unalign tap, an undo, a turned Pioneer, eviction — to
   * remember to call `unlink`.
   */
  st.links = new AlignmentLinks();

  /**
   * ⭐⭐⭐ **THE SNAP AND THE SEAT** (`D100`, the owner, 2026-09-26). The DECISIONS are pure —
   * `input/snap.ts` (may it, does it), `core/seat.ts` (where a seated body sits), `input/unsnap.ts`
   * (the gesture that releases it) — and this file holds the state and the calls.
   *
   * ⭐ A seated Follower is a CHILD of its Pioneer in the model's tree, so *follows the transform*
   * is `worldPlacementOf`'s doing; every frame its LOCAL placement is re-derived from the cursor
   * (`syncSeats`), which is what makes a twist a turn about the FACE and a dragged cursor carry the
   * body. ⛔ Its own translation is refused (`applyWorldStep`); the cascades skip it; a re-align, a
   * release or a prune un-parents it (`unseatWorld`).
   */
  st.snapArming = new SnapArming();
  st.seatSnaps = new SeatSnaps<ObjectId>();
  st.unsnapDetectors = new Map<string, UnsnapDetector>();
  /**
   * ⭐ The body each pointer pressed, and its pointer type — the unsnap reads the pair (*first the
   * Pioneer, second the Follower*) and the device off these, because a `SECOND` touchpoint has no
   * grip to carry them. Both dropped at release.
   */
  st.rawPressedBody = new Map<number, ObjectId>();
  st.pointerTypeOf = new Map<number, string>();
  st.outlines = new Map<ObjectId, BodyOutlines>();

  // ⭐⭐⭐ `D145`: `bootObjectAxes` stood here — the boot camera's translation axes. A translation
  // runs along the LIVE camera's axes now (`axesOf`), so there is no state to keep.
  /**
   * ⭐ The gravity frame at scene boot — what a FREE body is turned about (`WorldAxisB`, `D109`).
   * ⚠ Filled at the very bottom of this file — `requireGestureFrame` is declared below (a TDZ).
   */
  st.bootGestureFrame = null;
  // ⚠ `lastTravelDir` and the LeadingFace ray it aimed are deleted; what persists between frames
  // is the SHOWN axes and their senses.
  /**
   * ⭐⭐ **WHICH AXES THE GIZMO IS SHOWING** — the owner, 2026-09-23: *"the direction is shown only
   * if the delta position triggers a translation in this direction."* ⛔ The decision is
   * `displayedAxes`'s; this only remembers its answer, so a pause does not blank the gizmo.
   */
  st.gizmoAxes = new Map<ObjectId, GizmoChannels>();
  /**
   * ⭐ Bodies a ROLL has turned during their CURRENT hold — what *"the roll rotation is ongoing"*
   * means for an aligned Follower's green axis (`aligned_axes.ts`). ⚠ `gizmoAxes` keeps its answer
   * across holds, so the grey line alone cannot say whether the roll belongs to THIS gesture.
   * Dropped when the body leaves the gizmo.
   */
  st.rolledThisHold = new Set<ObjectId>();
  /**
   * ⭐ ONE place both `axisTravel` call sites report to — the holder's drag and the second
   * touchpoint's push. ⛔ The owner, 2026-09-23: *"make sure the delta position on the second
   * touch triggers the gizmo in the same way as the delta positions of the first touch."*
   */
  /** ⚠ WHICH CHANNELS pushed this body THIS FRAME, over both fingers. Consumed by the gizmo. */
  st.frameAxisDriven = new Map<ObjectId, [boolean, boolean, boolean]>();
  /**
   * ⭐⭐ **THE AXES THE BODY IS BEING TURNED ABOUT**, world, this frame, one slot per turn channel.
   *
   * ⛔⛔ **RECORDED WHERE THE TURN IS APPLIED, NEVER RE-DERIVED HERE.** An aligned body twists
   * about its constraint axis, a free one rolls about the gravity frame's depth and yaws and
   * pitches about that frame's up and right — four rules in three places. ⚠ A second opinion
   * computed at the gizmo would be free to draw a line the body is **not** turning about, which is
   * exactly the class of defect `scene.ts`-resident rules keep producing.
   */
  st.frameTurnAxes = new Map<ObjectId, TurnAxes>();
  /** ⭐ The last axis each channel turned about — kept so a pause does not blank its line. */
  st.gizmoTurnAxes = new Map<ObjectId, TurnAxes>();
  /**
   * ⭐⭐ WHAT THE LAST TRANSLATION ACTUALLY BOUGHT — reported by the rule, never recomputed
   * here. ⛔ `1.0` means the body is exactly under the finger; a large number means the plane is
   * nearly edge-on and a small push is going a long way; `EDGE-ON` means the exact mapping was
   * abandoned for the fixed-rate push. ⚠ Without these, *"it went much too far"* and *"it barely
   * moved"* are one symptom with two causes, and the camera pose is what separates them.
   */
  st.lastTrackGain = 0;
  st.edgeOnNow = false;

  // ⛔ `CameraOffsetZoneEnter`, its flag and the zone ENTER/EXIT state are deleted (`D109`/`D120`).
  st.axisGizmos = new Map<ObjectId, AxisGizmo>();
  /**
   * ⭐⭐⭐ **TWO RINGS, ONE PER FAMILY** — the owner, 2026-09-23: *"there can be a grey ring for the
   * rotation and a white ring for the vertical translation if both are driven on an aligned
   * object."*
   *
   * ⛔⛔⛔ **AND THAT CORRECTS A PREMISE OF MINE THAT WAS SIMPLY FALSE.** I had built ONE ring that
   * switched colour, on the argument that a body is either being moved or being turned. It is not:
   * `secondTouchDrive` hands the second touchpoint **BOTH** of its axes when the held body is an
   * aligned follower (`"BOTH"` in `second_touch_drive.ts`), so its `dx` rolls and its `dy` lifts
   * in the SAME frame — which is the exact configuration the owner named.
   * ⭐ `METHOD`: *a premise about what the product can do is a thing to READ OUT OF THE CODE, not
   * to infer from the rule you happen to be editing.*
   *
   * ⚠ The two anchors coincide on an UNALIGNED body, so the grey ring can sit exactly on the white
   * one there. That is honest — one pivot, drawn twice — and the alternative, hiding one, would
   * have made the marker's meaning depend on the alignment state.
   */
  st.gizmoRings = new Map<ObjectId, LinesMesh>();
  st.gizmoHitRings = new Map<string, LinesMesh>();
  st.gizmoTurnRings = new Map<ObjectId, LinesMesh>();

  // ⚠ DIAGNOSTIC ONLY: a small marker at whatever §2 rule 1 chose to orbit around.
  // Without it the barycentre selection is invisible, and "it seems to orbit the right
  // thing" is not an observation. `IN3` deletes this along with the three placeholder
  // boxes. ⚠ It does NOT delete the rotation — see below.
  st.centreMarker = CreateSphere(
    "orbit-centre-marker",
    { diameter: 0.012 },
    st.scene,
  );
  st.markerMat = new StandardMaterial("orbit-centre-mat", st.scene);
  st.markerMat.emissiveColor = new Color3(1, 0.85, 0.4);
  st.markerMat.disableLighting = true;
  st.centreMarker.material = st.markerMat;
  // ⛔ Not pickable, and not a barycentre candidate: it must not alter the gesture it
  // exists to display.
  st.centreMarker.isPickable = false;

  // ───────────────────────────────────────────────────────────────────
  // `IN1` — one recognizer per touchpoint, and a readout so the state machine can
  // actually be SEEN on the glass. ⚠ Role latching (§4) is `IN2`, not this.
  st.hud = createHud();
  // ⭐ `D113`: a faint dashed line at the edge band's inner edge, so a hand can SEE the strip that
  // is always empty space. ⛔ `pointer-events: none` — the readout must not take the touches it shows.
  st.edgeBandEl = document.createElement("div");
  Object.assign(st.edgeBandEl.style, {
    position: "fixed",
    pointerEvents: "none",
    border: "1px dashed rgba(255,255,255,0.18)",
    boxSizing: "border-box",
    zIndex: "1",
  });
  document.body.appendChild(st.edgeBandEl);
  st.edgeBandKey = "";
  st.tapFace = new Map();
  st.collisionGrace = new Set<string>();
  st.lastCollision = "";
  st.lastCollisionAt = -Infinity;
  st.emptySpaceVisible = true;
  st.lastEmptyProbeMs = -Infinity;
  // ⭐⭐⭐ **THE RIGHT MOUSE BUTTON IS THE SECOND TOUCH** (the owner, 2026-09-25). ⛔ One call, at
  // Babylon's own pre-pointer seam: no DOM event is stopped or created, only `pointerType ===
  // "mouse"` is looked at, and the scene's gesture code below is untouched.
  st.mouseLayer = attachMouseSecondTouch(st.canvas, st.scene, (notches) => {
    // ⭐⭐ THE WHEEL WRITES THE SAME `zoom` THE PINCH WRITES, through the same `applyCamera()` —
    // one zoom, not two. ⛔ Clamped on the multiplier, so scrolling past a limit cannot store zoom
    // the camera will never show (`input/mouse_wheel_zoom.ts`).
    const base = st.orbit.pose(1).radiusM;
    if (!(base > 1e-9)) return;
    st.zoom = wheelZoom(
      st.zoom,
      notches,
      st.cfg.cameraRadiusMinM / base,
      st.cfg.cameraRadiusMaxM / base,
    );
    st.zoomAtPinchStart = st.zoom;
    applyCamera(st);
  },
  // ⭐ `D154`: the body under a Space click — the scene's own pick, the scene's own ids.
  (clientX, clientY) => {
    const rect = st.canvas.getBoundingClientRect();
    const mesh = st.scene.pick(clientX - rect.left, clientY - rect.top)?.pickedMesh ?? null;
    const id = mesh === null ? undefined : st.idOf.get(mesh);
    return id === undefined ? null : { id, frozen: st.world.objects.get(id)?.frozen === true };
  },
  // ⭐ `D155`: a Space freeze — the body the mouse's grip holds, a client point on it (its centre,
  // projected), and its pressed face handed over for the second touch that takes the hold.
  (pointerId) => {
    const grip = st.held.get(pointerId);
    const id = grip === undefined ? undefined : st.idOf.get(grip.mesh);
    if (grip === undefined || id === undefined) return null;
    const w = st.engine.getRenderWidth();
    const h = st.engine.getRenderHeight();
    const p = Vector3.Project(grip.mesh.getAbsolutePosition(), Matrix.Identity(), st.scene.getTransformMatrix(), st.camera.viewport.toGlobal(w, h));
    const rect = st.canvas.getBoundingClientRect();
    return {
      id,
      frozen: st.world.objects.get(id)?.frozen === true,
      x: rect.left + (p.x * rect.width) / w,
      y: rect.top + (p.y * rect.height) / h,
      mesh: grip.mesh,
    };
  },
  // ⭐⭐ `D159`: a freeze is happening — hand the drag's pressed face to the second touch that takes over,
  // and CARRY the gesture across the drag's release, so the whole action lands once at its end.
  (pointerId) => {
    const grip = st.held.get(pointerId);
    if (grip === undefined) return;
    st.inheritPressFace = { mesh: grip.mesh, pressFace: grip.pressFace };
    st.freezeCarry = true;
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
  st.taps = new TapHistory(st.cfg);
  /**
   * ⭐⭐ `IN2`: THE ROLES LIVE IN `src/input/router.ts`, NOT HERE. This file used to keep
   * a `live` map and an `outside` map and decide membership by which one an id was in —
   * which worked, and had no way to express the `IN8` decision, no explicit press order,
   * and no vectors. The router is engine-free and tested; `held` below is only the
   * per-gesture state a role cannot carry.
   */
  st.router = new PointerRouter<AbstractMesh>();
  st.held = new Map<number, Held>();

  st.followers = new Map<AbstractMesh, Follow>();
  st.undo = new UndoHistory<SceneSnapshot>();
  // ⭐ DEV ONLY — the scene state on `window` for a CDP harness to read. ⛔ `import.meta.env.DEV` is
  // false in `npm run build`, so the production bundle carries no hook.
  if (import.meta.env.DEV) (window as unknown as { __st?: unknown }).__st = st;
  st.gestureSpan = new GestureSpan();
  st.gestureBefore = null;
  st.gestureUndid = false;
  st.episodes = new EpisodeTally();
  st.sceneStartMs = null;
  st.hudSecond = -1;
  st.episodeFacts = new Map();
  st.episodeUnaligned = new Set<number>();
  st.inheritPressFace = null;
  st.freezeCarry = false;
  st.episodeContinued = new Set<number>();
  st.lastVerdict = "—";

  /**
   * ⭐⭐ **SOMETHING THE RENDER LOOP DECIDED NEEDS TO REACH THE READOUT.**
   *
   * ⛔ Set by `markHudDirty`, which every writer of `lastVerdict` goes through, and consumed
   * once at the end of the frame. ⚠ It exists because the loop is a rule-runner as well as a
   * renderer — the cascade, the prune and the snaps all reach verdicts with no pointer event
   * behind them, and before 2026-09-17 those verdicts waited for the next touch to be shown.
   */
  st.hudDirty = false;

  // ─────────────────────────────────────────────────────────────────
  // §2 RULE 4 — PINCH ZOOM, for touchpoints that hit NOTHING.
  //
  // ⭐ §4: *"Anchor role is latched at press time."* Whether a touchpoint is ON an
  // object or OUTSIDE one is decided once, when it goes down, and never revisited.
  // Without that a user steadying their grip near a part would silently switch
  // between two different mappings mid-gesture. ⭐ `IN2` now owns that latch.
  st.pinch = new PinchTracker(st.cfg);

  /**
   * An orbit centre chosen but NOT YET COMMITTED — see `orbitCentreGraceMs`.
   * ⛔ Resolved in the RENDER LOOP rather than by a timer: the loop is already running,
   * a frame is the granularity anything visible happens at, and there is no callback to
   * cancel, leak, or fire after the scene is gone.
   */
  st.pendingCentre = null;

  /**
   * The double-tap reset in flight, or `null`.
   * ⛔ CANCELLED BY THE NEXT TOUCH. An animation that kept running while a finger dragged
   * would fight the hand for the camera, and the hand would lose — the reset writes the
   * whole pose every frame.
   */
  st.cameraReset = null;
  // ⭐ `Scene_1`'s LEVEL view, found on the rig; every other scene keeps the rig's own start.
  st.bootElevation =
    st.sceneSpec.bootView === "LEVEL" ? levelElevation(st.cfg) : ORBIT_START_ELEVATION;
  st.orbit = new OrbitController(
    st.cfg,
    ORBIT_START_YAW_RAD,
    st.bootElevation,
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
  st.orbitStartZoom = (() => {
    const base = st.orbit.pose(1).radiusM;
    if (!(base > 1e-9)) return 1;
    return Math.max(1, st.cfg.cameraRadiusMaxM / 2 / base);
  })();

  st.zoom = st.orbitStartZoom;
  st.zoomAtPinchStart = st.orbitStartZoom;
  // ⛔⛔ THE CENTRE MIGRATES, IT DOES NOT TELEPORT. Rule 1 re-chooses a barycentre on
  // every press, so aiming at a different pair of objects used to JUMP the camera.
  // See input/orbit.ts — progress is finger travel in mm, not wall-clock.
  st.centreBlend = new OrbitCentreBlend(st.cfg, ORBIT_START_CENTRE_M);
  st.orbitCentreM = Vector3.Zero();

  // ⛔ The approach camera swing's latch and travel records stood here; the swing is deleted (`D120`).

  // ⚠ Place the camera on the rig surface at startup, so the very first frame is
  // already the pose the orbit will move from — not the ArcRotateCamera constructor's
  // own alpha/beta/radius, which would jump the instant a finger touched the glass.
  applyCamera(st);
  installTuningMenu(st);

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
  st.eventGaps = new Map<
    number,
    { last: number; gaps: { t: number; ms: number }[] }
  >();
  st.noise = new PointerNoiseMeter();
  st.noisePointer = null;

  // ⛔⛔ **`objectUnder` IS DELETED WITH `D54`.** It raycast at a holder's last position to
  // ask *is the object still under this finger?* — `A15`'s only question, and nothing else
  // ever asked it. ⭐ *Deleted, not disabled*: a raycast helper kept "in case" is the shape
  // `config_debt` and `unwired_debt` both exist to refuse.

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
   * ⭐⭐ **AND IT CLOSED A HOLE RATHER THAN LEAVING ONE**: `D51`'s pinned Pioneer (itself deleted
   * since, `D109`) could slide the Follower off its holder through a release path `A15` never
   * watched; with no unselect anywhere, that hole was unreachable **by construction**.
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
  st.behaviour = initialBehaviour();

  // ⛔⛔⛔ **`pioneerFace` AND `alignMode` WERE DELETED HERE, 2026-09-17 — AND DELETED, NOT
  // LEFT.** They were the ACTIVE alignment's Pioneer face and its mode: one of each, for the
  // whole scene. ⚠ The per-body truth lives in `links` (the mode itself is deleted, `D106`).
  // ⭐ A scene-wide record that nothing consumes is exactly defect 40's shape (`A12`'s retired
  // roll detector, still fed, still holding a veto). ⛔ `selectedFace` followed it (audit 2026-09-27).

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
   * rule reads, and a stack that lags the gesture would make the twist and the readout
   * briefly wrong. The pose catches up and lands EXACTLY on the solved orientation.
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
  st.alignSnaps = new AlignSnaps<ObjectId>();
  // ⚠ LATCHED, not per-frame: a jump is over in one frame and a hand cannot look up in time.
  // ⭐ The verdict in force when it happened is captured with it — that is the half that says
  // WHICH rule was running, which is what the owner could not see.
  st.jumpWatch = new JumpWatch<ObjectId>();
  st.lastJump = null;
  st.lastJumpVerdict = "";
  st.lastJumpAt = 0;
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
  st.rotationTally = new RotationTally<ObjectId>();
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
  st.rotationFollower = new RotationFollower<ObjectId>();

  // ⛔⛔ **`settleAlignAnim` WAS DELETED HERE, 2026-09-17, AND ITS ABSENCE IS THE FIX.** It
  // landed an in-flight snap so a rule could write the orientation itself — and the twist
  // called it, which is why a hand saw no slerp at all in `ROTATE`: the first movement past the
  // deadband ended the animation. ⭐ Every path now does one of two honest things instead:
  // **rides along** (the twist and the roll — compose the world rotation onto both ends) or
  // **cancels** (every release). ⚠ Nothing
  // needs to land a snap early any more, so the function that did is gone rather than kept for
  // a caller that might return.

  // ⭐ The tap toggle itself is `noteTap`, in `alignment_wiring.ts`. ⛔ `D58`'s press-toggle set is
  // deleted with the press toggle (`D66`).
  /**
   * ⭐⭐ `D68` — **did the last tap RELEASE actually toggle the mode?** ⛔ Not *was there a tap*:
   * a tap consumed by an alignment toggled nothing, and undoing it would flip the mode the hand
   * had. ⚠ Written at every tap release, both paths, so it cannot describe an older gesture.
   */
  st.lastTapToggled = false;
  /**
   * ⭐⭐ `D68` — presses that already spent their toggle by REVERTING the first tap's. ⛔ Their
   * own release must add nothing, or a full double tap would end up flipped by one.
   * ⚠ It is `pressToggled`'s shape and NOT its rule: `D66` deleted a press that TOGGLED; this is
   * a press that UNDOES, which is what keeps `D28`'s *two taps revert* true when the second half
   * never lifts.
   */
  st.pairReverted = new Set<number>();

  /**
   * ⭐⭐⭐ **A PIONEERFACECURSOR IS DRAGGED ALONG ITS PIONEERFACE** — the owner, 2026-09-25:
   * *"when left button clicked inside the PioneerFaceCursor (desktop) or first or second touch
   * pressed within a certain distance from the PioneerFaceCursor (mobile) … and the
   * PioneerFaceCursor is dragged … translate the PioneerFaceCursor on top of the PioneerFace
   * surface."*
   *
   * ⭐⭐ **THE POINTER IS CLAIMED AT PRESS AND NEVER REACHES THE ROUTER.** So it selects nothing,
   * orbits nothing, counts as no touchpoint and is no tap — a grab is its own gesture, not an
   * extra channel on someone else's. ⚠ Every later event of that pointer is swallowed too, until
   * its release; if the alignment ends mid-drag the finger simply stops moving anything.
   *
   * ⭐ The DECISIONS are pure: which cursor a press grabs (`grabbedCursor`) and where on the face
   * a ray puts it (`pointOnFace`: under the finger, bounded by the edges, on the surface when it is
   * not flat). ⚠ The drag is RELATIVE — the grab offset is kept — so a touch pressed several radii
   * away moves the ring without making it jump under the finger.
   */
  st.cursorDrags = new Map<number, { key: string; dx: number; dy: number }>();
  installPointerHandler(st);

  paint(st);

  st.frames = 0;
  /** ⚠ One clock, `performance.now()`, as everywhere else in this file. */
  st.lastFrameMs = null;
  // ⭐⭐⭐ **THE AXES ARE BORN HERE, AT BOOT, FROM THE BOOT CAMERA** — *"at scene boot, all
  // object axis are updated based on camera quaternion at scene boot"* (the owner, 2026-09-22),
  // and they are *"fixed forever for this scene"* (`WorldAxisB`, the only frame since `D109`).
  //
  // ⛔⛔ **AT THE FOOT OF THE FACTORY AND NOT AT THE TOP, DELIBERATELY.** `requireGestureFrame`
  // is a `const` declared half way down this file; reading it from an initialiser above its
  // declaration is a TEMPORAL DEAD ZONE crash at boot — which this project has already shipped
  // once, on 2026-09-19, and which takes the whole page down with a blank screen.
  // ⚠ Every body inherits this basis through `axesOf`'s fallback rather than by a loop over
  // the scene: a body created later (an import, a spawn) then gets the same answer, where a
  // one-time loop would leave it with none.
  st.bootGestureFrame = requireGestureFrame(st);

  /**
   * ⭐⭐ Feed the unsnap detector with the two holders' positions, in mm on the glass; act when it
   * fires. ⛔ Order is the ROUTER's press order (`unsnapCouple` reads it); the device is the
   * driven grip's `pointerType`.
   */
  /**
   * ⭐⭐ **WHERE THE UNSNAP FEED STOPPED, ON THE HUD** — the owner, 2026-09-26: *"once a follower is
   * snapped onto the frozen object, I cannot unsnap with right click on frozen and left click on
   * follower and rapid delta position: the assembly is stuck."* ⛔ Every reading of the code found
   * the path intact, so this prints the step it actually reached — `METHOD`: *when a defect resists
   * several correct-looking analyses, stop modelling the code and ask which READOUT moves.*
   */
  st.unsnapTrace = "—";
  st.lastFedPointer = -1;
  startRenderLoop(st);
  window.addEventListener("resize", () => st.engine.resize());

  return { scene: st.scene, engine: st.engine, framesRendered: () => st.frames };
}
