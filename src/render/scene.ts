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
 * | `markers.ts` | face fills and contours, fuchsia rings, PioneerFaceCursors, outlines |
 * | `alignment_wiring.ts` | `alignFollowerToPioneer`, release, seat/unseat |
 * | `gizmo.ts` | the axis gizmo and its rings |
 * | `highlight_pass.ts` | the capture highlight and the swing latch, per frame |
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
import "@babylonjs/core/Culling/ray";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { DEFAULT_CONFIG, parseConfigOverrides, PinchTracker, OrbitController, OrbitCentreBlend, PointerNoiseMeter, PointerRouter, initialBehaviour, TapHistory, type AlignMode } from "../input";
import { type Vec3 } from "../core/vec";
import { makeWorld, type ObjectId } from "../core/object_model";
import { CAMERA_NEAR_PLANE_M } from "../input/gestureConfig";
import { RotationFollower, RotationTally } from "../input/rotation_increment";
import { seededRotations } from "../core/random_pose";
import { resolveBootOrientation, type SceneDescriptor } from "../core/game_structure";
import { SCENE_0 } from "../content/scene_0";
import { AlignmentLinks } from "../core/alignment_links";
import { PioneerFaceCursors } from "../core/pioneer_face_cursors";
import { SnapArming } from "../input/snap";
import { UnsnapDetector } from "../input/unsnap";
import { SeatSnaps } from "../input/seat_snap";
import { AlignSnaps } from "../input/align_snap";
import { type MeshTopology } from "../core/mesh_topology";
import { axesFromFrame } from "../input/object_axes";
import { JumpWatch } from "../input/jump_watch";
import { type GizmoChannels } from "../input/axis_translate";
import { createHud } from "./hud";
import { attachMouseSecondTouch } from "./mouse_adapter";
import { wheelZoom } from "../input/mouse_wheel_zoom";
import { CAMERA_RADIUS_M, ORBIT_START_CENTRE_M, ORBIT_START_ELEVATION, ORBIT_START_YAW_RAD, PIONEER_CURSOR_COLOUR, type AxisGizmo, type BodyOutlines, type FaceMarker, type Follow, type Held, type SceneState, type TurnAxes } from "./scene_state";
import { make, quatOf, shapeOfBody, topologyOfBody } from "./bodies";
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
  st.tuning = parseConfigOverrides(DEFAULT_CONFIG, window.location.search);
  st.cfg = st.tuning.config;
  // ⚠ Explicit, so "dark page" always means the SCENE, never an unset default.
  st.scene.clearColor = new Color4(0.078, 0.086, 0.102, 1);

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

  st.light = new HemisphericLight("light", new Vector3(0.3, 1, 0.2), st.scene);
  st.light.intensity = 0.95;

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
  st.dimsOf = new Map<ObjectId, readonly [number, number, number]>();
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
  for (const b of st.sceneSpec.bodies) {
    make(
      st,
      b.id,
      new Vector3(b.position[0], b.position[1], b.position[2]),
      [b.colour[0], b.colour[1], b.colour[2]],
      resolveBootOrientation(b.orientation, bootRotations),
      b.dims,
      b.frozen,
      b.topScale,
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

  st.faceMarkers = new Map<string, FaceMarker>();

  /**
   * ⭐⭐ The white ring that marks a fuchsia face's centre, one per candidate face.
   *
   * ⛔ NOT parented — see `worldPointOn`. Its position AND scale are written every frame.
   */
  st.candidateRings = new Map<string, LinesMesh>();
  /** ⭐ Each candidate ring's point, in its body's LOCAL frame, lifted off the face. */
  st.candidateRingLocal = new Map<string, Vec3>();

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
  st.pioneerCursorMat = new StandardMaterial("pioneer-cursor-mat", st.scene);
  st.pioneerCursorMat.emissiveColor = PIONEER_CURSOR_COLOUR.clone();
  st.pioneerCursorMat.disableLighting = true;
  st.pioneerCursorMat.backFaceCulling = false;

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
  st.alignModeOf = new Map<ObjectId, AlignMode>();

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
  st.highlighted = {
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
  st.bootObjectAxes = null;
  /**
   * ⭐ The gravity frame at scene boot — what a FREE body is turned about while `worldAxisB` is on.
   * ⚠ Filled beside `bootObjectAxes`, at the very bottom of this file, for the same reason.
   */
  st.bootGestureFrame = null;
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
  st.lastEdgeOn = false;

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
  st.zoneWas = false;
  /**
   * ⛔ The pair that was in range when the zone was ENTERED, so the EXIT edge can reach the
   * same two bodies. ⚠ At the exit `highlighted.pair` is already `null` — the verdict that
   * tells you a body has left is the one that no longer names it.
   */
  st.zonePair = [];
  st.zoneEnterCalls = 0;
  st.axisGizmos = new Map<ObjectId, AxisGizmo>();
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
  st.gizmoRings = new Map<ObjectId, LinesMesh>();
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
  st.orbit = new OrbitController(
    st.cfg,
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

  /**
   * ⭐⭐⭐ **THE APPROACH SWING'S LATCH** — the trial on branch `1.0.18-`, `null` when the
   * capture is not live. ⛔ Armed on the RISING EDGE of the capture and dropped on the falling
   * one, so it is a property of the approach rather than of any gesture.
   * ⚠ It holds only what must NOT be re-read: the gap at the trigger, and which way to lean.
   */
  st.swing = null;
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
  st.frameTravelRightM = 0;
  /**
   * ⭐⭐ **THE VERTICAL HALF OF THE SAME FRAME'S TRAVEL** — device-reported, 2026-09-21:
   * *"when the follower enters the offset radius by a vertical translation (delta position dy)
   * the camera orbit swing is not triggered."*
   * ⛔ It is not there to AIM the swing — a yaw is symmetric about a vertical approach — but to
   * answer *was this crossing driven by a translation at all*, which is the question that
   * separates a vertical drag from a press, a rotation or a pinch.
   */
  st.frameTravelUpM = 0;
  /** ⭐⭐ The ALONG-VIEW component of the body's travel — invisible on screen, and still travel. */
  st.frameTravelDepthM = 0;
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
  st.appliedSwingYaw = 0;
  /**
   * ⭐⭐ `D63` — the SMOOTHED swing amplitude, and the clock it was last advanced on.
   * ⛔ `null` means *no approach*, so the next one starts from its own first reading rather
   * than from whatever the last approach happened to end on.
   */
  st.swingAmp = null;
  /**
   * ⛔⛔ The progress the swing was showing when a translation STOPPED driving it, captured
   * once. ⚠ It must be remembered rather than recomputed: `rebaseTriggerGap(gap, p)` with `p`
   * read from the LIVE gap is algebraically the identity — `gap/(1−(g0−gap)/g0) = g0` — so it
   * would do nothing at all, which is how the first version of this fix failed.
   */
  st.swingFrozenProgress = null;

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
  st.behaviour = initialBehaviour();

  /**
   * ⭐⭐⭐ `IN3`'s SELECTED FACE — §2 rule 2's other half, and the input every remaining
   * `IN3` rule reads: 2ter anchors it to gravity, 2quater to a world axis, `MATE` joins two.
   *
   * ⛔ `null` in forks A and C, always. ⚠ It carries the pick's COSINE because a later rule
   * may want to refuse a grazing pick — and nothing refuses one yet, so the number is
   * evidence on the readout rather than a hidden threshold.
   */
  st.selectedFace =
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
  // and with `worldAxisB` on they are *"fixed forever for this scene"*.
  //
  // ⛔⛔ **AT THE FOOT OF THE FACTORY AND NOT AT THE TOP, DELIBERATELY.** `requireGestureFrame`
  // is a `const` declared half way down this file; reading it from an initialiser above its
  // declaration is a TEMPORAL DEAD ZONE crash at boot — which this project has already shipped
  // once, on 2026-09-19, and which takes the whole page down with a blank screen.
  // ⚠ Every body inherits this basis through `axesOf`'s fallback rather than by a loop over
  // the scene: a body created later (an import, a spawn) then gets the same answer, where a
  // one-time loop would leave it with none.
  st.bootObjectAxes = axesFromFrame(requireGestureFrame(st));
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
