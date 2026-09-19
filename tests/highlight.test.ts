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
import {
  alignmentMatchesTarget,
  captureOffsetM,
  highlightedPair,
  translatesOnDrag,
  type HighlightNumbers,
} from "@input/highlight";
import { centreDistance, nearestCapture, surfaceGap } from "@core/proximity";
import { boxShape } from "@core/collision_shape";
import { DEFAULT_CONFIG } from "@input/gestureConfig";
import { makeWorld, setWorldPlacement, type SceneObject, type World } from "@core/object_model";
import type { Constraint } from "@core/constraint_stack";
import { IDENTITY, qFromAxisAngle, type Quat, type Vec3 } from "@core/vec";

const SIZE = 0.08; // ⭐ the scene's cube, in metres
const H = SIZE / 2;
const DEG = Math.PI / 180;

/** The scene's real body dimensions, in metres — parts, and the base plate. */
const PART: [number, number, number] = [SIZE, 2 * SIZE, 3 * SIZE];
const PLATE: [number, number, number] = [6 * SIZE, 0.3 * SIZE, 9 * SIZE];

/**
 * ⭐⭐ **A 100 mm SURFACE OFFSET — chosen for the vectors, not shipped.**
 *
 * ⛔ The product's offset is computed per frame from the camera (`captureOffsetM`), so there is
 * no fixed metre value to pin fixtures to. ⚠ These vectors therefore state their own threshold
 * and place bodies relative to IT — which is the lesson the *too far* vector below already
 * learned the hard way: a distance fixture written relative to *the scene* silently changes
 * meaning when the scene does.
 */
const OFFSET = 0.1;
const N: HighlightNumbers = { captureOffsetM: OFFSET, alignMatchRad: 15 * DEG };

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

/** An alignment driving the object's `+x` onto a frozen WORLD direction. */
const aligned = (targetWorld: Vec3): Constraint[] => [
  { kind: "FACE_ALIGN", localNormal: [1, 0, 0], targetWorld },
];

/** ⭐ The product's own measure, bound to a world — what `scene.ts` passes in. */
const gapIn = (w: World) => (a: string, b: string) => surfaceGap(w, a, b);

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
    expect(nearestCapture(w, "a", OFFSET, null, gapIn(w))).toBeNull();
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

  it("AT THE BOOT CAMERA, NOTHING CAPTURES AT REST \u2014 against the SHIPPED default", () => {
    // **THIS PROPERTY WAS TRUE OF THE PARTS, FALSE OF THE PLATE, AND IS NOW TRUE AGAIN.**
    // `render/scene.ts` claimed *"at 5L nothing is in range at rest"*; the audit measured the
    // plate at 312 mm against a 320 mm radius and showed the claim false.
    //
    // **IT READS `DEFAULT_CONFIG`, NOT A LITERAL, AND THAT IS THE VALUE OF IT.** The audit's
    // sharpest finding was a vector asserting the value a function RETURNED rather than the
    // decision the owner MADE \u2014 it defended the boot-mode defect for a day. A hard-coded 8 or
    // 15 here would certify a configuration nobody ships the moment the number moves. So this
    // is a live guard on the shipped number: raise the default far enough to capture the base
    // plate at boot and the suite reddens.
    const offset = captureOffsetM(DEFAULT_CONFIG.captureOffsetMm, 1.5, FOV, VH);
    const w = scene(
      ["objectA", [-0.2, 0, 0], IDENTITY, [], PART],
      ["objectB", [0.2, 0, 0], IDENTITY, [], PART],
      ["objectD", [0, 0.307246, 0.16], IDENTITY, [], PART],
      ["objectC", [0, -3 * SIZE, 0], IDENTITY, [], PLATE],
    );
    for (const id of ["objectA", "objectB", "objectD"]) {
      expect(nearestCapture(w, id, offset, null, gapIn(w))).toBeNull();
    }
    // The PLATE is what a part is nearest to, by surface \u2014 148 mm, not the 320 mm of air
    // between the two parts. The margin is stated rather than implied: the threshold must sit
    // clear of it by a real factor, not by a millimetre.
    expect(surfaceGap(w, "objectA", "objectC")).toBeCloseTo(0.148, 9);
    expect(surfaceGap(w, "objectA", "objectB")).toBeCloseTo(0.32, 9);
    expect(offset).toBeLessThan(0.148 / 2);
    // And it must stay big enough to be usable: an offset under 5 mm of world would mean two
    // parts had to nearly touch before anything showed, which is a different failure.
    expect(offset).toBeGreaterThan(0.005);
  });

  it("the shipped default is 15 mm on the glass \u2014 the owner's number", () => {
    // Stated once, here, so a change to it is a deliberate edit with a red suite in between
    // rather than a silent drift. What that number DOES is the vector above.
    expect(DEFAULT_CONFIG.captureOffsetMm).toBe(15);
    // 15 mm of glass at the boot camera is about 60 mm of world \u2014 \u00be of the L = 80 mm module.
    expect(captureOffsetM(DEFAULT_CONFIG.captureOffsetMm, 1.5, FOV, VH)).toBeCloseTo(0.06, 3);
  });
});

describe("the capture band, and the tie rule", () => {
  /** Two parts on the x axis whose SURFACES are `gap` apart. */
  const apart = (gap: number) =>
    scene(["a", [0, 0, 0], IDENTITY, [], PART], ["b", [SIZE + gap, 0, 0], IDENTITY, [], PART]);

  it("the band itself: 95 mm captures, 105 mm does not", () => {
    const near = apart(0.095);
    const far = apart(0.105);
    expect(nearestCapture(near, "a", OFFSET, null, gapIn(near))?.target).toBe("b");
    expect(nearestCapture(far, "a", OFFSET, null, gapIn(far))).toBeNull();
  });

  it("EXACTLY on the offset still captures — the boundary belongs to the inside", () => {
    // The rule is `d > offsetM` -> out, so equality is IN. Untested until 2026-09-17: the
    // audit found `>` -> `>=` survives every other vector, because no fixture lands on the line.
    // Which way it falls matters less than it being STATED: an unpinned boundary is a
    // free variable the next reader may flip while tidying.
    const w = apart(OFFSET);
    expect(surfaceGap(w, "a", "b")).toBeCloseTo(OFFSET, 9);
    expect(nearestCapture(w, "a", OFFSET, null, gapIn(w))?.target).toBe("b");
  });

  it("the capture carries the MEASURED gap, not just the winner", () => {
    // The HUD prints this number, and it must be the one the rule compared — a readout that
    // measured the gap itself would be a second implementation free to disagree.
    const w = apart(0.05);
    expect(nearestCapture(w, "a", OFFSET, null, gapIn(w))?.gapM).toBeCloseTo(0.05, 9);
  });

  it("an EXACT tie keeps the incumbent — and only an exact one", () => {
    // `proximity.ts` called this *"hysteresis by MEMORY"*. It is not: the comparison is
    // `===`, so it holds the incumbent only when the two gaps are bit-for-bit equal.
    // Both halves are pinned here so the limitation is visible rather than assumed away.
    const tied = scene(["h", [0, 0, 0]], ["a", [0.1, 0, 0]], ["b", [-0.1, 0, 0]]);
    expect(nearestCapture(tied, "h", OFFSET, "b", gapIn(tied))?.target).toBe("b");
    expect(nearestCapture(tied, "h", OFFSET, "a", gapIn(tied))?.target).toBe("a");
    // One part in 1e12 nearer, and the incumbent loses. That is the overclaim, measured.
    const nudged = scene(["h", [0, 0, 0]], ["a", [0.1, 0, 0]], ["b", [-0.1 - 1e-13, 0, 0]]);
    expect(nearestCapture(nudged, "h", OFFSET, "b", gapIn(nudged))?.target).toBe("a");
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
  // satisfy the fixture, the case is left to the one caller that can actually see it:
  // `highlightedPair` returns `null` for an empty held list, and there is a vector for that.
  // ⛔ `METHOD`: *a guard that cannot fail is not a guard* — no caller ever asks this function
  // about zero objects, so a guard here would have been unfalsifiable code added to make a
  // test of my own devising pass. Mistake shape 5, caught before it landed.
});

describe("⛔⛔ CONDITION 1 — the alignment, as GEOMETRY not identity", () => {
  it("⭐⭐ an alignment made against a THIRD object still qualifies for this one", () => {
    // ⛔⛔ *"is the target the object the alignment was tapped on?"* would return false here and
    // silently refuse an ordinary assembly. ⚠ `D46` §2 is explicit: *any* other object, **not
    // necessarily the one with PioneerFace**.
    const w = scene(["a", [0, 0, 0]], ["b", [0.09, 0, 0]], ["c", [0, 0, 0.9]]);
    expect(alignmentMatchesTarget(w, aligned([1, 0, 0]), "b", N.alignMatchRad)).toBe(true);
  });

  it("⭐⭐ the tolerance BITES — a target turned 45° no longer matches, 10° still does", () => {
    const turned = scene(["a", [0, 0, 0]], ["b", [0.09, 0, 0], qFromAxisAngle([0, 0, 1], 45 * DEG)]);
    expect(alignmentMatchesTarget(turned, aligned([1, 0, 0]), "b", N.alignMatchRad)).toBe(false);
    const nudged = scene(["a", [0, 0, 0]], ["b", [0.09, 0, 0], qFromAxisAngle([0, 0, 1], 10 * DEG)]);
    expect(alignmentMatchesTarget(nudged, aligned([1, 0, 0]), "b", N.alignMatchRad)).toBe(true);
  });

  it("⛔⛔ |dot| — AND IT TAKES A PART WITH NO OPPOSITE FACE TO SHOW IT", () => {
    // ⚠⚠ ON A CUBE THIS ASSERTION WOULD BE HOLLOW, and a mutant proved it: every cube face has
    // an opposite, so a SIGNED test finds `-x` and passes anyway. ⭐ It binds the moment a part
    // is not a cube. This wedge has a single `+x` face; an alignment frozen pointing the other
    // way along that axis is still aligned to it.
    let w = makeWorld([
      cube("a"),
      {
        ...cube("wedge"),
        faces: [
          { id: "+x", centre: [H, 0, 0], normal: [1, 0, 0] },
          { id: "+y", centre: [0, H, 0], normal: [0, 1, 0] },
        ],
      },
    ]);
    w = setWorldPlacement(w, "a", { position: [0, 0, 0], orientation: IDENTITY });
    w = setWorldPlacement(w, "wedge", { position: [0.09, 0, 0], orientation: IDENTITY });
    expect(alignmentMatchesTarget(w, aligned([-1, 0, 0]), "wedge", N.alignMatchRad)).toBe(true);
    // ⚠ and an unrelated axis is still refused, so this is a test and not a yes-man
    expect(alignmentMatchesTarget(w, aligned([0, 0, 1]), "wedge", N.alignMatchRad)).toBe(false);
  });

  it("⛔⛔ A **MATE** DOES NOT COUNT AS AN ALIGNMENT — a seat is not an orientation", () => {
    // ⭐ A mated object carries a `MATE` whose `targetWorld` is a real world direction, so a
    // test that looked only at the vector would accept it.
    const w = scene(["a", [0, 0, 0]], ["b", [0.09, 0, 0]]);
    const mate: Constraint[] = [
      { kind: "MATE", localNormal: [1, 0, 0], targetWorld: [1, 0, 0], otherObjectId: "c" },
    ];
    expect(alignmentMatchesTarget(w, mate, "b", N.alignMatchRad)).toBe(false);
  });

  it("⚠ an empty stack matches nothing; a missing target answers false", () => {
    const w = scene(["a", [0, 0, 0]], ["b", [0.09, 0, 0]]);
    expect(alignmentMatchesTarget(w, [], "b", N.alignMatchRad)).toBe(false);
    expect(alignmentMatchesTarget(w, aligned([1, 0, 0]), "gone", N.alignMatchRad)).toBe(false);
  });
});

describe("⛔⛔⛔ THE CONJUNCTION — all three, and each one alone is not enough", () => {
  /**
   * `a` aligned onto +x, and `b` with **50 mm of clear air** between their surfaces — inside
   * the 100 mm test offset. ⚠ Written as a SURFACE gap: the centres are 130 mm apart, and
   * quoting that number instead is exactly the fixture mistake this file made once already.
   */
  const nearAndAligned = () =>
    scene(
      ["a", [0, 0, 0], IDENTITY, aligned([1, 0, 0]), PART],
      ["b", [SIZE + 0.05, 0, 0], IDENTITY, [], PART],
    );

  it("⭐⭐ all three ⇒ the pair is outlined", () => {
    const w = nearAndAligned();
    const v = highlightedPair(w, ["a"], true, N, null, gapIn(w));
    expect(v.pair).toEqual({ subject: "a", target: "b" });
    // ⭐ and both reasons report satisfied, so the HUD cannot contradict the contour
    expect(v.translating && v.inRange).toBe(true);
  });

  it("⛔⛔ ALIGNED AND NEAR BUT **ROTATING** ⇒ NOTHING — the case a hand rejected", () => {
    // ⭐⭐⭐ THE VECTOR THIS WHOLE SLICE EXISTS FOR. The previous build had conditions 1 and 3
    // and shipped without 2, and the owner rejected it by finger: *"white contours cannot
    // appear if objects are not aligned"* and *"that's also the case with single object
    // translation."* ⛔ `translating === false` is a one-finger drag in ROTATE mode, and it must
    // draw nothing even though everything else about the geometry is ready.
    const w = nearAndAligned();
    const v = highlightedPair(w, ["a"], false, N, null, gapIn(w));
    expect(v.pair).toBeNull();
    // ⭐⭐ AND THE READOUT MUST BLAME THE RIGHT CONDITION — the range is fine and only the
    // movement mode is wrong, so a verdict claiming otherwise would send a device pass
    // hunting the wrong thing.
    expect(v.translating).toBe(false);
    expect(v.inRange).toBe(true);
  });

  it("⛔⛔ TRANSLATING AND NEAR BUT **NOT ALIGNED** ⇒ IT **DOES** HIGHLIGHT", () => {
    // ⚠⚠ THIS VECTOR WAS INVERTED ON 2026-09-17, AND THE INVERSION IS THE RECORD OF A DESIGN
    // REVERSAL, NOT A BUG FIX. It used to assert `null`: the owner had said *"white contours
    // cannot appear if objects are not aligned"*, and I made the alignment a precondition.
    // ⛔ He then removed it: *"the white contour does not necessitate the object to be aligned
    // … remove the 'object is aligned' from the approach logic."*
    // ⭐⭐ The lesson is mine to keep: the original complaint was made against a build with NO
    // translation condition, so *"appearing while unaligned"* and *"appearing while rotating"*
    // were indistinguishable in the evidence. I picked the stronger reading and did not say
    // that I had chosen. `METHOD`: **when two readings fit one report, name both.**
    const w = scene(
      ["a", [0, 0, 0], IDENTITY, [], PART],
      ["b", [SIZE + 0.05, 0, 0], IDENTITY, [], PART],
    );
    const v = highlightedPair(w, ["a"], true, N, null, gapIn(w));
    expect(v.pair).toEqual({ subject: "a", target: "b" });
    expect(v.inRange).toBe(true);
    expect(v.translating).toBe(true);
  });

  it("⛔⛔ TRANSLATING AND ALIGNED BUT **TOO FAR** ⇒ NOTHING", () => {
    // ⚠⚠ 400 mm apart — **5L**, comfortably outside the 4L radius. ⛔ THIS VECTOR USED TO USE
    // THE BOOT SEPARATION (3L = 240 mm) AND IT BROKE the moment the radius went from 2.0 × span
    // (160 mm) to 4L (320 mm): 240 mm is now INSIDE the band, so the fixture stopped being a
    // *too far* case while still claiming to be one. ⭐ The lesson is the fixture's, not the
    // code's — a distance fixture written relative to *the scene* silently changes meaning when
    // the scene does, so this one is written relative to **the threshold**.
    const w = scene(
      ["a", [-0.2, 0, 0], IDENTITY, aligned([1, 0, 0]), PART],
      ["b", [0.2, 0, 0], IDENTITY, [], PART],
    );
    expect(surfaceGap(w, "a", "b")!).toBeGreaterThan(N.captureOffsetM);
    const v = highlightedPair(w, ["a"], true, N, null, gapIn(w));
    expect(v.pair).toBeNull();
    // ⚠ out of range — and the readout says exactly that, so a hand knows to close the gap
    expect(v.inRange).toBe(false);
  });

  it("⚠⚠ two held objects: PRESS ORDER decides the subject now, and that is a real loss", () => {
    // ⛔⛔ THIS VECTOR USED TO ASSERT THAT THE **ALIGNED** BODY WON, WHICHEVER WAS PRESSED
    // FIRST. ⚠ Removing the alignment from the approach removed the only asymmetry the pair
    // had, so the subject is now simply the first-pressed body — and with a symmetric pair it
    // genuinely does not matter WHICH is called the subject: the same two bodies are outlined
    // either way, which is all the white contours claim.
    // ⭐ Recorded because it stops being harmless the moment the approach does something
    // DIRECTIONAL with the subject (slice 3's snap moves *the first object*). At that point the
    // pair needs an asymmetry again, and the alignment is the obvious candidate.
    const w = scene(
      ["a", [0, 0, 0], IDENTITY, [], PART],
      ["b", [SIZE + 0.05, 0, 0], IDENTITY, aligned([1, 0, 0]), PART],
    );
    expect(highlightedPair(w, ["a", "b"], true, N, null, gapIn(w)).pair).toEqual({ subject: "a", target: "b" });
    expect(highlightedPair(w, ["b", "a"], true, N, null, gapIn(w)).pair).toEqual({ subject: "b", target: "a" });
  });

  it("⚠ nothing held ⇒ nothing, whatever the geometry says", () => {
    const w = nearAndAligned();
    const v = highlightedPair(w, [], true, N, null, gapIn(w));
    expect(v.pair).toBeNull();
    // ⚠ nothing held, so the range was never evaluated
    expect(v.inRange).toBe(false);
  });

  it("⭐ the tie rule reaches through the conjunction", () => {
    const w = scene(
      ["a", [0, 0, 0], IDENTITY, aligned([1, 0, 0])],
      ["b", [0.09, 0, 0]],
      ["c", [-0.09, 0, 0]],
    );
    expect(highlightedPair(w, ["a"], true, N, "c", gapIn(w)).pair!.target).toBe("c");
    expect(highlightedPair(w, ["a"], true, N, "b", gapIn(w)).pair!.target).toBe("b");
  });
});


