/**
 * GOLDEN VECTORS — **`A16`: WHEN THE TWO WHITE HIGHLIGHTS APPEAR.**
 *
 * Design of record: `Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md` §12 (`A16`), §1, **§19**.
 *
 * ⛔⛔⛔ **THE MEASURE CHANGED ON 2026-09-18 AND EVERY DISTANCE FIXTURE HERE CHANGED MEANING
 * WITH IT** (`D49`). The rule was *centre to centre against `4L`*; it is now *SURFACE to
 * SURFACE against a camera-scaled offset*. ⚠ So a fixture's number is no longer comparable to
 * the one it replaced, and none was carried across — each is recomputed from the bodies'
 * half-extents and written out by hand. ⭐ `METHOD`: *a constant borrowed from another rule's
 * derivation inherits that rule's QUESTION, not just its number.*
 *
 * ⭐⭐ THE FIXTURES ARE THE REAL SCENE'S METRES AND THE REAL SCENE'S DIMENSIONS — parts are
 * `L × 2L × 3L` and the base plate is `6L × 0.3L × 9L`, because the plate is the body that
 * forced this change and a cube-shaped fixture of it would hide the whole point.
 *
 * ⛔⛔ THE ONE THAT CARRIES THE RULE is *"aligned and near, but ROTATING ⇒ no highlight"* — the
 * case a hand rejected in the previous build, and the only one of the three conditions that was
 * missing from it.
 */
import { describe, expect, it } from "vitest";
import { captureOffsetM, translatesOnDrag } from "@input/highlight";
import { centreDistance, surfaceGap } from "@core/proximity";
import { boxShape } from "@core/collision_shape";
import { DEFAULT_CONFIG } from "@input/gestureConfig";
import {
  OBJECT_DIMS_M,
  OBJECT_SIZE_M,
  PLATE_DIMS_M,
  PYRAMID_DIMS_M,
  bootTilt,
} from "@core/scene_dims";
import { makeWorld, setWorldPlacement, type SceneObject, type World } from "@core/object_model";
import type { Constraint } from "@core/constraint_stack";
import { IDENTITY, qFromAxisAngle, type Quat, type Vec3 } from "@core/vec";

// ⛔⛔⛔ **READ FROM THE PRODUCT, NOT RETYPED** (2026-09-25). ⚠ These three were local copies, and
// when the owner scaled the pyramid the whole suite stayed green against the old body — including
// the boot-clearance vector below, whose entire job is to notice exactly that.
const SIZE = OBJECT_SIZE_M; // ⭐ the scene's L, in metres
const DEG = Math.PI / 180;

/** The scene's real body dimensions, in metres — parts, and the base plate. */
const PART = OBJECT_DIMS_M as unknown as [number, number, number];
const PLATE = PLATE_DIMS_M as unknown as [number, number, number];
/**
 * ⭐⭐ **`objectB` IS NOT A PART ANY MORE** — it is a trapezoidal pyramid, scaled so its top face
 * is a part's small face (the owner, 2026-09-25). ⚠ Only the BOOT-SCENE vector below uses it; the
 * abstract `a`/`b` fixtures elsewhere in this file are about the mechanism and stay cuboid.
 *
 * ⛔ A BOX of the pyramid's dimensions is the right stand-in for a CLEARANCE question and the
 * wrong one for a shape question: the frustum tapers upward, so its widest section is its base
 * and the nearest points between it and `objectA` lie exactly there — where it is as wide as
 * this box. ⭐ `tests/frustum.test.ts` measures the same gap through the REAL tapered hull, so
 * the equivalence is checked rather than assumed.
 */
const PYRAMID = PYRAMID_DIMS_M as unknown as [number, number, number];


/**
 * ⛔⛔ **THE `BOOT` FIXTURE WAS DELETED ON 2026-09-18, AND THE REASON IS WORTH KEEPING.**
 *
 * It listed the scene's boot positions and every distance vector read it. ⚠ It had already gone
 * stale once — the 2026-09-17 audit found it pinning the PRE-PLATE layout while calling itself
 * *"the scene's actual boot positions"*, so the suite stayed green describing a world that no
 * longer booted.
 *
 * ⭐⭐ With the surface rule (`D49`) each vector states the geometry it is actually about, in
 * terms of the THRESHOLD rather than the scene — two parts `50 mm` of clear air apart, a plate
 * `148 mm` below a part. ⛔ A fixture named after the product is a claim about the product, and
 * it is the kind of claim nothing checks. The one vector that genuinely needs the boot layout
 * builds it inline and says so.
 */

const cube = (
  id: string,
  constraints: readonly Constraint[] = [],
  dims: readonly [number, number, number] = [SIZE, SIZE, SIZE],
): SceneObject => ({
  id,
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "+x", centre: [dims[0] / 2, 0, 0], normal: [1, 0, 0] },
    { id: "-x", centre: [-dims[0] / 2, 0, 0], normal: [-1, 0, 0] },
    { id: "+y", centre: [0, dims[1] / 2, 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -dims[1] / 2, 0], normal: [0, -1, 0] },
    { id: "+z", centre: [0, 0, dims[2] / 2], normal: [0, 0, 1] },
    { id: "-z", centre: [0, 0, -dims[2] / 2], normal: [0, 0, -1] },
  ],
  connectors: [],
  constraints,
  shape: boxShape(dims),
});

/** One placed body: id, position, and optionally an orientation, constraints and dimensions. */
type Placement = readonly [
  string,
  Vec3,
  Quat?,
  Constraint[]?,
  [number, number, number]?,
];

/** Build a world. A trailing constraint list attaches an alignment to that object. */
function scene(...placed: readonly Placement[]): World {
  let w = makeWorld(placed.map(([id, , , c, d]) => cube(id, c ?? [], d)));
  for (const [id, position, orientation] of placed) {
    w = setWorldPlacement(w, id, { position, orientation: orientation ?? IDENTITY });
  }
  return w;
}



/**
 * ⚠ Every OTHER body in the world — what `nearestCapture` used to consider by default.
 * ⛔ Since `D62` there is no *"whole scene"* value: a caller must NAME its candidates, so the
 * vectors that predate the restriction say out loud what they are asking about, and the ones
 * that test the restriction pass a real partner set instead.
 */
const others = (w: World, held: string): string[] =>
  [...w.objects.keys()].filter((id) => id !== held);

describe("THE SURFACE GAP — the measure itself, on the real scene", () => {
  it("two parts side by side: the gap is the centre distance MINUS both half-extents", () => {
    // Hand-computed. `L x 2L x 3L` parts at +/-200 mm are 400 mm apart between centres, and each
    // reaches 40 mm towards the other along x => 400 - 40 - 40 = **320 mm** of clear air.
    // The two numbers differ, which is the whole point: a vector that used the centre
    // distance would pass against the OLD rule and this one cannot.
    const w = scene(["a", [-0.2, 0, 0], IDENTITY, [], PART], ["b", [0.2, 0, 0], IDENTITY, [], PART]);
    expect(centreDistance(w, "a", "b")).toBeCloseTo(0.4, 12);
    expect(surfaceGap(w, "a", "b")).toBeCloseTo(0.32, 9);
  });

  it("THE BASE PLATE — the body that forced this change, measured both ways", () => {
    // **THIS IS THE AUDIT FINDING, NOW WITH ITS FIX BESIDE IT.** The plate is
    // `6L x 0.3L x 9L` sitting `3L` below the parts. By CENTRES it read **312 mm** from
    // `objectA` — inside the old 320 mm radius — so dragging a part at boot raised the white
    // pair on the plate immediately. And no radius repaired it: the plate is `6L x 9L` across,
    // so a part RESTING on it near an edge is further from its centre than one hovering high
    // above its middle.
    // By SURFACES the answer is the physically obvious one: the plate's top face is at
    // -228 mm, the part's underside at -80 mm, and the bodies overlap in x and z — so the gap is
    // purely vertical and exactly **148 mm**.
    const w = scene(
      ["objectA", [-0.2, 0, 0], IDENTITY, [], PART],
      ["objectC", [0, -3 * SIZE, 0], IDENTITY, [], PLATE],
    );
    expect(centreDistance(w, "objectA", "objectC")).toBeCloseTo(0.31241, 4);
    expect(surfaceGap(w, "objectA", "objectC")).toBeCloseTo(0.148, 9);
  });

  it("a part RESTING on the plate reads ZERO, which the centre rule could never say", () => {
    // **THE CASE THAT DECIDES THE WHOLE DESIGN.** Sitting on the plate's top face the part
    // is touching — and by centres it reads 228 mm away, FURTHER than a part hovering 100 mm
    // above the plate's middle. That inversion is not a tuning error; it is what a centre
    // distance means for a wide, thin body.
    const w = scene(
      ["part", [-0.2, -0.148, 0], IDENTITY, [], PART],
      ["plate", [0, -3 * SIZE, 0], IDENTITY, [], PLATE],
    );
    expect(surfaceGap(w, "part", "plate")).toBeCloseTo(0, 9);
    expect(centreDistance(w, "part", "plate")).toBeGreaterThan(0.2);
  });

  it("ORIENTATION changes the gap — a turned part presents a different extent", () => {
    // The scene boots its parts at seeded random orientations, so this is the ordinary case
    // and not an edge one. A gap computed from centres and a stored radius cannot see it at
    // all; here a quarter turn about z swaps which half-extent faces the neighbour.
    const flat = scene(["a", [0, 0, 0], IDENTITY, [], PART], ["b", [0.4, 0, 0], IDENTITY, [], PART]);
    const turned = scene(
      ["a", [0, 0, 0], qFromAxisAngle([0, 0, 1], 90 * DEG), [], PART],
      ["b", [0.4, 0, 0], IDENTITY, [], PART],
    );
    // Upright, `a` reaches 40 mm along x; turned, it reaches 80 mm => 40 mm less air.
    expect(surfaceGap(flat, "a", "b")).toBeCloseTo(0.32, 9);
    expect(surfaceGap(turned, "a", "b")).toBeCloseTo(0.28, 9);
  });

  it("a body with NO SHAPE is out of range, never in range", () => {
    // `LESSONS_CARRIED` section 6, and BOTH defaults here are harmful: *in range* would make a
    // shapeless body capture the whole scene, and it would look like a feature rather than a
    // failure. `null` reads as *too far* everywhere it is used.
    // ⚠ Built by OMITTING the field rather than setting it to `undefined`: `shape` is optional
    // and the compiler is configured with `exactOptionalPropertyTypes`, so the two are not the
    // same thing. ⭐ Omission is also the case that can really occur — a body constructed
    // before `D49` existed, or by a caller that does not know about shapes.
    const { shape: _dropped, ...shapeless } = cube("a");
    let w = makeWorld([shapeless, cube("b")]);
    w = setWorldPlacement(w, "a", { position: [0, 0, 0], orientation: IDENTITY });
    w = setWorldPlacement(w, "b", { position: [0.05, 0, 0], orientation: IDENTITY });
    expect(surfaceGap(w, "a", "b")).toBeNull();
    // ⭐ out of range, never in range — `null`, which no threshold can read as near
    expect(surfaceGap(w, "a", others(w, "a")[0]!)).toBeNull();
  });
});

describe("THE CAMERA-SCALED OFFSET — the owner's rule, as arithmetic", () => {
  // The reference viewport for these vectors: 1200 CSS px tall, 0.8 rad vertical field of
  // view — Babylon's default fov and a plausible tablet height.
  const FOV = 0.8;
  const VH = 1200;

  it("A CLOSER CAMERA MEANS A SMALLER WORLD OFFSET — the requirement, directly", () => {
    // The owner: *"if the camera and focus is close to an object, the offset distance in mm
    // shall be less than if the camera and focus are far."*
    const near = captureOffsetM(8, 0.5, FOV, VH);
    const far = captureOffsetM(8, 2.0, FOV, VH);
    expect(near).toBeLessThan(far);
    // And it is PROPORTIONAL, not merely monotone: four times the distance, four times the
    // offset. A monotone-but-not-proportional mapping would keep the apparent size drifting
    // with zoom, which is the half of the request that a bare *"smaller when closer"* misses.
    expect(far / near).toBeCloseTo(4, 9);
  });

  it("THE APPARENT SIZE IS CONSTANT — the same fraction of the screen at every zoom", () => {
    // THE COMPOSITION, MEASURED. `METHOD`: *a composition is a thing to measure, not an
    // emergent property* — and *"the same in pixels, without using pixels"* is a claim about
    // the whole chain `mm -> px -> metres-per-px -> metres`, not about either half.
    // The world extent visible at distance d is `2*d*tan(fov/2)`, so the offset as a
    // FRACTION of the screen must not depend on d at all.
    const fraction = (d: number): number =>
      captureOffsetM(8, d, FOV, VH) / (2 * d * Math.tan(FOV / 2));
    expect(fraction(0.4)).toBeCloseTo(fraction(3.0), 12);
    // And the value is what 8 mm of a 1200 px viewport should be: 8 mm => 30.24 CSS px.
    expect(fraction(1.5)).toBeCloseTo(30.236220472440944 / VH, 9);
  });

  it("it is DEVICE-INDEPENDENT in the way pixels are not", () => {
    // THE HALF OF THE REQUEST RAW PIXELS COULD NOT SATISFY. A pixel threshold means a
    // different physical size on every screen; a millimetre threshold converted through the
    // viewport height means the same fraction of the screen on all of them.
    const frac = (vh: number): number =>
      captureOffsetM(8, 1.5, FOV, vh) / (2 * 1.5 * Math.tan(FOV / 2));
    expect(frac(800)).toBeGreaterThan(frac(2400));
    // A taller viewport shows more world, so 8 mm is a smaller share of it — exactly as a
    // physical ruler held against two screens of different size behaves.
    expect(frac(800) / frac(2400)).toBeCloseTo(3, 9);
  });

  it("degenerate inputs give 0 — which reads as NOTHING CAPTURES, the safe direction", () => {
    // A zero-height viewport happens for real, in the frame before the canvas is laid out.
    // The alternative — Infinity or NaN — would capture the entire scene for that frame, and
    // a NaN written into a comparison never washes out.
    expect(captureOffsetM(8, 1.5, FOV, 0)).toBe(0);
    expect(captureOffsetM(8, 0, FOV, VH)).toBe(0);
    expect(captureOffsetM(0, 1.5, FOV, VH)).toBe(0);
    expect(captureOffsetM(-3, 1.5, FOV, VH)).toBe(0);
  });

  it("⛔⛔⛔ AT THE BOOT CAMERA **NOTHING CAPTURES AT REST** — at the 10 mm offset", () => {
    // ⭐⭐⭐ **THE FIFTH READING OF THIS VECTOR.** Nothing captured at boot; the owner's 30° tilt
    // closed the pyramid–plate gap to 53 mm inside a 60 mm band; a 5 mm offset cleared it; 15 mm
    // brought it back; and the owner's 10 mm (2026-09-26) is a ~40 mm band — every pair clear.
    // ⭐⭐ **THIS VECTOR USED TO ASSERT THE OPPOSITE, AND THE CHANGE IS THE OWNER'S**: *"rotate the
    // grey rectangle 30 degrees roll and 30 pitch. Same for the pyramid, in opposite senses"*
    // (2026-09-25). ⛔ Tilting `objectB` swings a corner down, and the surface gap to the base
    // plate closes from clear air to **53 mm** against a **60 mm** capture offset.
    //
    // ⚠⚠ **IT IS PINNED RATHER THAN RELAXED.** The property *"at boot nothing captures at rest"*
    // is the audit's own — `scene.ts` once claimed it and the audit measured it false — so a
    // vector that quietly stopped asking would put the project back where it started. ⭐ The fact
    // is asserted in both directions instead: which pair captures, and that the others do not.
    //
    // ⛔ **IT READS `DEFAULT_CONFIG`, NOT A LITERAL**, so raising the shipped offset reddens this.
    const offset = captureOffsetM(DEFAULT_CONFIG.captureOffsetMm, 1.5, FOV, VH);
    const w = scene(
      // ⛔⛔ **THE BOOT ORIENTATIONS COME FROM THE PRODUCT** (`bootTilt`), not from `IDENTITY`.
      // ⚠ They were `IDENTITY` here until the tilt, which is defect 66's shape a second time: a
      // fixture that mirrors the product goes stale in silence at the moment the product changes.
      ["objectA", [-0.2, 0, 0], bootTilt(1), [], PART],
      ["objectB", [0.2, 0, 0], bootTilt(-1), [], PYRAMID],
      ["objectD", [0, 0.307246, 0.16], IDENTITY, [], PART],
      ["objectC", [0, -3 * SIZE, 0], IDENTITY, [], PLATE],
    );
    // ⭐ Every body is clear at rest. ⛔ RED against the 15 mm default, which names the plate for
    // the pyramid.
    for (const id of ["objectA", "objectB", "objectD"]) {
      // ⭐ Measured directly now that the capture pass is deleted (`D120`): no gap is inside the offset.
      for (const o of others(w, id)) expect(surfaceGap(w, id, o)!).toBeGreaterThan(offset);
    }
    // ⚠ The measured numbers: the nearest pair is 53 mm apart against a ~40 mm band.
    expect(surfaceGap(w, "objectB", "objectC")! * 1000).toBeCloseTo(53.4, 1);
    expect(surfaceGap(w, "objectA", "objectC")! * 1000).toBeCloseTo(90.7, 1);
    expect(offset * 1000).toBeCloseTo(39.9, 1);
    // ⛔⛔ **216 mm BETWEEN THE PARTS, AND IT HAS BEEN 320, 300 AND 280 BEFORE IT** — once per time
    // `objectB` changed shape or pose. ⭐ The number moving is the vector working; it stopped
    // moving once, in silence, and that was defect 66.
    expect(surfaceGap(w, "objectA", "objectB")! * 1000).toBeCloseTo(216.1, 1);
  });

  it("the shipped default is 10 mm on the glass \u2014 the owner's number (2026-09-26, after 15)", () => {
    // Stated once, here, so a change to it is a deliberate edit with a red suite in between
    // rather than a silent drift. What that number DOES is the vector above.
    expect(DEFAULT_CONFIG.captureOffsetMm).toBe(10);
    // 10 mm of glass at the boot camera is about 40 mm of world, half the L = 80 mm module.
    expect(captureOffsetM(DEFAULT_CONFIG.captureOffsetMm, 1.5, FOV, VH)).toBeCloseTo(0.04, 3);
  });
});

describe("⛔⛔ CONDITION 2 — *translation by one touchpoint or two touchpoints*", () => {
  it("⭐ one held object follows the session mode", () => {
    expect(translatesOnDrag(1, "TRANSLATE")).toBe(true);
    expect(translatesOnDrag(1, "ROTATE")).toBe(false);
  });

  it("⭐⭐⭐ `D60` — A SECOND TOUCH THAT OWNS ROLL + DEPTH TAKES THE MODE'S PLACE", () => {
    // ⛔⛔ THE OWNER'S COMPLETION, 2026-09-19:
    //
    // > *"… and the first touch shall control the translation with delta position x and y
    // > (which is currently the case in translation mode but not in rotation mode)."*
    //
    // ⭐⭐ IT IS A **DOF BUDGET**. When the second touch owns roll AND depth (`D59`), the two
    // fingers already cover the body's whole remaining freedom: first touch x/y in the screen
    // plane, second touch roll + depth. ⛔ Leaving the first touch on the twist would put **two
    // fingers on one DOF**, which is exactly the conflict the owner reported.
    expect(translatesOnDrag(1, "ROTATE", true)).toBe(true);
    expect(translatesOnDrag(1, "TRANSLATE", true)).toBe(true);
  });

  it("⚠ … and with no such second touch the mode still decides — the default is inert", () => {
    // ⛔ THE VECTOR THAT PROTECTS EVERY OTHER CALLER. The parameter defaults to `false`, so a
    // caller that knows nothing about a second touch keeps exactly the behaviour it had — which
    // is what makes this an ADDITION rather than a change to `A16`'s condition 2.
    expect(translatesOnDrag(1, "ROTATE", false)).toBe(false);
    expect(translatesOnDrag(1, "ROTATE")).toBe(false);
    expect(translatesOnDrag(1, "TRANSLATE", false)).toBe(true);
  });

  it("⚠ with TWO held objects it changes nothing — the first line already fired", () => {
    // ⭐⭐ AND THIS IS WHY THE OWNER SAW THE WANTED BEHAVIOUR ONLY ON THE PIONEER: a second
    // touch THERE is a second held OBJECT, so `heldObjectCount >= 2` already returned true.
    // ⛔ A second touch OUTSIDE leaves the count at one, and the mode decided — the case `D60`
    // corrects. The two paths now agree, which is the claim worth pinning.
    expect(translatesOnDrag(2, "ROTATE", false)).toBe(true);
    expect(translatesOnDrag(2, "ROTATE", true)).toBe(true);
  });

  it("⭐⭐ TWO HELD OBJECTS TRANSLATE IN **EITHER** MODE", () => {
    // ⛔ The owner's parenthetical, and it is already true of the build: `scene.ts` overrides
    // the mode to `TRANSLATE` whenever more than one object is held, because a pair being moved
    // together is a translation by construction. ⚠ A rule that read the session mode here would
    // make the two-handed dock impossible to reach from rotation mode.
    expect(translatesOnDrag(2, "ROTATE")).toBe(true);
    expect(translatesOnDrag(2, "TRANSLATE")).toBe(true);
    expect(translatesOnDrag(3, "ROTATE")).toBe(true);
  });

  // ⚠⚠ NO VECTOR FOR A COUNT OF ZERO, AND THAT IS DELIBERATE. My first version asserted
  // `translatesOnDrag(0, "TRANSLATE") === false` and it failed — the function answers `true`,
  // because it only asks *what would a drag do*. ⭐ Rather than add a `count <= 0` guard to
  // satisfy the fixture, the case is left to the callers, none of which asks it about zero held
  // objects (`highlightedPair`, which once guarded it, is deleted, `D120`).
  // ⛔ `METHOD`: *a guard that cannot fail is not a guard* — no caller ever asks this function
  // about zero objects, so a guard here would have been unfalsifiable code added to make a
  // test of my own devising pass. Mistake shape 5, caught before it landed.
});

describe("⭐⭐⭐ `D108` — an ALIGNED Follower is mode-less: its first touch always translates", () => {
  it("⭐ one finger, ROTATE mode, aligned → translate", () => {
    // > *"1- OK"* — the owner, 2026-09-27, accepting *"for an aligned body, the first finger always
    // > slides it horizontally"* on both devices.
    expect(translatesOnDrag(1, "ROTATE", true)).toBe(true);
  });

  it("⭐ a FREE body still obeys the mode", () => {
    expect(translatesOnDrag(1, "ROTATE", false)).toBe(false);
    expect(translatesOnDrag(1, "TRANSLATE", false)).toBe(true);
  });
});
