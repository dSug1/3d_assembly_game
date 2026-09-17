/**
 * GOLDEN VECTORS — **`A16`: WHEN THE TWO WHITE HIGHLIGHTS APPEAR.**
 *
 * Design of record: `Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md` §12 (`A16`), §1.
 *
 * ⭐⭐ THE FIXTURES ARE THE REAL SCENE'S METRES, because that is the only way a vector can say
 * whether the owner's amended factor does what he expects: the cube is **80 mm**, the radius is
 * **2.0 ×** = **160 mm** between centres, and the three cubes now boot **240 mm** apart — so
 * *nothing is highlighted at rest* is a statement this file can actually check.
 *
 * ⛔⛔ THE ONE THAT CARRIES THE RULE is *"aligned and near, but ROTATING ⇒ no highlight"* — the
 * case a hand rejected in the previous build, and the only one of the three conditions that was
 * missing from it.
 */
import { describe, expect, it } from "vitest";
import {
  alignmentMatchesTarget,
  highlightedPair,
  translatesOnDrag,
  type HighlightNumbers,
} from "@input/highlight";
import { captureRadiusM, centreDistance, nearestCapture } from "@core/proximity";
import { makeWorld, setWorldPlacement, type SceneObject, type World } from "@core/object_model";
import type { Constraint } from "@core/constraint_stack";
import { IDENTITY, qFromAxisAngle, type Quat, type Vec3 } from "@core/vec";

const SIZE = 0.08; // ⭐ the scene's cube, in metres
const H = SIZE / 2;
const DEG = Math.PI / 180;

/** ⭐ `4L` = 320 mm, the owner's radius. */
const N: HighlightNumbers = { snapRadiusM: 4 * SIZE, alignMatchRad: 15 * DEG };

/** ⭐ The scene's actual boot positions — three lengths apart, brown cube two lengths back. */
const BOOT: readonly (readonly [string, Vec3])[] = [
  ["objectA", [-0.12, 0, 0]],
  ["objectB", [0.12, 0, 0]],
  ["objectC", [0, 0.132665, 0.16]],
];

const cube = (id: string, constraints: readonly Constraint[] = []): SceneObject => ({
  id,
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "+x", centre: [H, 0, 0], normal: [1, 0, 0] },
    { id: "-x", centre: [-H, 0, 0], normal: [-1, 0, 0] },
    { id: "+y", centre: [0, H, 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -H, 0], normal: [0, -1, 0] },
    { id: "+z", centre: [0, 0, H], normal: [0, 0, 1] },
    { id: "-z", centre: [0, 0, -H], normal: [0, 0, -1] },
  ],
  connectors: [],
  constraints,
});

/** Build a world. A trailing constraint list attaches an alignment to that object. */
function scene(
  ...placed: readonly (readonly [string, Vec3, Quat?, Constraint[]?])[]
): World {
  let w = makeWorld(placed.map(([id, , , c]) => cube(id, c ?? [])));
  for (const [id, position, orientation] of placed) {
    w = setWorldPlacement(w, id, { position, orientation: orientation ?? IDENTITY });
  }
  return w;
}

/** An alignment driving the object's `+x` onto a frozen WORLD direction. */
const aligned = (targetWorld: Vec3): Constraint[] => [
  { kind: "FACE_ALIGN", localNormal: [1, 0, 0], targetWorld },
];

describe("⭐⭐ the amended numbers, on the real scene", () => {
  it("⭐ the radius is 4L = 320 mm, an absolute distance", () => {
    expect(captureRadiusM(SIZE, 4)).toBeCloseTo(0.32, 12);
    expect(N.snapRadiusM).toBeCloseTo(0.32, 12);
  });

  it("⭐⭐ THE BOOT LAYOUT IS 3L APART — all three pairs, exactly 240 mm", () => {
    // ⭐ *"three lengths apart"* has to hold for all THREE pairs, not just A↔B — `objectC`'s
    // height is derived for exactly that (√(3L² − (1.5L)² − (2L)²)), so a regression in it
    // would otherwise pass unnoticed. ⚠ Whether that is inside the capture radius is the NEXT
    // vector's business, and at 4L it is.
    const w = scene(...BOOT.map(([id, p]) => [id, p] as const));
    // ⚠ 7 dp = 0.1 µm. ⛔ My first version asked for 9 and FAILED, because the scene's `y` was
    // rounded to 0.1327 and the diagonals came out 240.019 mm. ⭐ The fix was the LITERAL, not
    // the tolerance: loosening it to 4 dp would have passed while no longer proving that
    // `objectC`'s height was derived at all.
    expect(centreDistance(w, "objectA", "objectB")).toBeCloseTo(0.24, 7);
    expect(centreDistance(w, "objectA", "objectC")).toBeCloseTo(0.24, 7);
    expect(centreDistance(w, "objectB", "objectC")).toBeCloseTo(0.24, 7);
  });

  // ⛔⛔ TWO VECTORS WERE **DELETED HERE** WITH THE RULE THEY DESCRIBED (2026-09-17).
  // ⚠ They pinned `objectSpan` returning the LARGEST extent, and the capture radius belonging
  // to the CANDIDATE rather than the holder — both real properties of a per-object radius, and
  // both killed by mutants only after non-cube fixtures were added for them. ⭐ *"set capture
  // radius at 4L"* replaced that rule with one absolute distance, so `objectSpan` and
  // `captureDistance` are gone and their vectors went with them. ⛔ A vector for a rule that no
  // longer exists is worse than no vector: it passes, and it describes the wrong product.

  it("⭐⭐ the band itself: 315 mm captures, 325 mm does not", () => {
    const at = (x: number) => scene(["a", [0, 0, 0]], ["b", [x, 0, 0]]);
    expect(nearestCapture(at(0.315), "a", N.snapRadiusM, null)).toBe("b");
    expect(nearestCapture(at(0.325), "a", N.snapRadiusM, null)).toBeNull();
  });

  it("⛔⛔ AND AT 4L THE BOOT LAYOUT **IS** IN RANGE — 3L apart is inside a 4L radius", () => {
    // ⚠⚠ STATED AS A VECTOR BECAUSE IT IS A CONSEQUENCE, NOT AN ACCIDENT. The bodies boot
    // **3L** apart (240 mm) and the radius is **4L** (320 mm), so condition 3 is satisfied for
    // every pair at rest. ⭐ Nothing is highlighted anyway — `A16` also needs an alignment and a
    // translation, and at rest neither holds — but it means **the distance is not what will
    // block a highlight in this scene**, and a device pass cannot judge the threshold without
    // first dragging a body well clear of the others.
    const w = scene(...BOOT.map(([id, p]) => [id, p] as const));
    expect(centreDistance(w, "objectA", "objectB")).toBeCloseTo(3 * SIZE, 7);
    expect(nearestCapture(w, "objectA", N.snapRadiusM, null)).not.toBeNull();
  });
});

describe("⛔⛔ CONDITION 2 — *translation by one touchpoint or two touchpoints*", () => {
  it("⭐ one held object follows the session mode", () => {
    expect(translatesOnDrag(1, "TRANSLATE")).toBe(true);
    expect(translatesOnDrag(1, "ROTATE")).toBe(false);
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
  /** `a` aligned onto +x, `b` 90 mm away on +x: conditions 1 and 3 both hold. */
  const nearAndAligned = () =>
    scene(["a", [0, 0, 0], IDENTITY, aligned([1, 0, 0])], ["b", [0.09, 0, 0]]);

  it("⭐⭐ all three ⇒ the pair is outlined", () => {
    const v = highlightedPair(nearAndAligned(), ["a"], true, N, null);
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
    const v = highlightedPair(nearAndAligned(), ["a"], false, N, null);
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
    const w = scene(["a", [0, 0, 0]], ["b", [0.09, 0, 0]]);
    const v = highlightedPair(w, ["a"], true, N, null);
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
    const w = scene(["a", [-0.2, 0, 0], IDENTITY, aligned([1, 0, 0])], ["b", [0.2, 0, 0]]);
    expect(centreDistance(w, "a", "b")).toBeGreaterThan(N.snapRadiusM);
    const v = highlightedPair(w, ["a"], true, N, null);
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
    const w = scene(["a", [0, 0, 0]], ["b", [0.09, 0, 0], IDENTITY, aligned([1, 0, 0])]);
    expect(highlightedPair(w, ["a", "b"], true, N, null).pair).toEqual({ subject: "a", target: "b" });
    expect(highlightedPair(w, ["b", "a"], true, N, null).pair).toEqual({ subject: "b", target: "a" });
  });

  it("⚠ nothing held ⇒ nothing, whatever the geometry says", () => {
    const v = highlightedPair(nearAndAligned(), [], true, N, null);
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
    expect(highlightedPair(w, ["a"], true, N, "c").pair!.target).toBe("c");
    expect(highlightedPair(w, ["a"], true, N, "b").pair!.target).toBe("b");
  });
});
