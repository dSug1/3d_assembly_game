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

/**
 * ⭐⭐ **THE SCENE's ACTUAL BOOT POSITIONS** — three parts `5L` apart pairwise, and the frozen
 * base plate `3L` below them.
 *
 * ⛔⛔ **THIS FIXTURE PINNED A LAYOUT THE PRODUCT HAD ABANDONED.** It carried the pre-plate
 * scene (±0.12, i.e. `3L` apart, and no plate at all) and called itself *"the scene's actual
 * boot positions"*, so every vector built on it certified a world that no longer booted.
 * ⚠ Found by audit 2026-09-17, together with the false claim in `render/scene.ts` that the
 * `5L` spacing puts nothing in range.
 * ⭐ `METHOD`: *a fixture that names itself after the product is a claim about the product*,
 * and it goes stale silently — the suite stays green while it describes something else.
 */
const BOOT: readonly (readonly [string, Vec3])[] = [
  ["objectA", [-0.2, 0, 0]],
  ["objectB", [0.2, 0, 0]],
  // ⚠ The pink part, whose height is DERIVED so all three pairs come out at exactly `5L`.
  ["objectD", [0, 0.307246, 0.16]],
  // ⛔ The frozen base plate, `3L` below the parts' centres.
  ["objectC", [0, -3 * SIZE, 0]],
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

  it("⭐⭐ THE THREE PARTS BOOT 5L APART — all three pairs, exactly 400 mm", () => {
    // ⭐ *"increase their distances between each other by 2L"* has to hold for all THREE pairs,
    // not just A↔B — `objectD`'s height is derived for exactly that, so a regression in it
    // would otherwise pass unnoticed. ⚠ Whether that is inside the capture radius is the next
    // vector's business.
    const w = scene(...BOOT.map(([id, p]) => [id, p] as const));
    // ⚠ 6 dp = 1 µm. ⛔ The scene's `y` is the rounded literal `0.307246`, so the diagonals
    // land a shade off 400 mm. ⭐ The tolerance states that rounding; loosening it further would
    // pass while no longer proving that the height was derived at all.
    expect(centreDistance(w, "objectA", "objectB")).toBeCloseTo(0.4, 6);
    expect(centreDistance(w, "objectA", "objectD")).toBeCloseTo(0.4, 6);
    expect(centreDistance(w, "objectB", "objectD")).toBeCloseTo(0.4, 6);
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

  it("⛔ EXACTLY on the radius still captures — the boundary belongs to the inside", () => {
    // ⚠ The rule is `d > radiusM` → out, so equality is IN. ⛔ Untested until 2026-09-17: the
    // audit found `>` → `>=` survives every other vector, because no fixture lands on the line.
    // ⭐ Which way it falls matters less than it being STATED: an unpinned boundary is a
    // free variable the next reader may flip while tidying.
    const at = (x: number) => scene(["a", [0, 0, 0]], ["b", [x, 0, 0]]);
    expect(nearestCapture(at(N.snapRadiusM), "a", N.snapRadiusM, null)).toBe("b");
  });

  it("⚠ an EXACT tie keeps the incumbent — and only an exact one", () => {
    // ⛔⛔ `proximity.ts` called this *"hysteresis by MEMORY"*. It is not: the comparison is
    // `===`, so it holds the incumbent only when the two distances are bit-for-bit equal.
    // ⭐ Both halves are pinned here so the limitation is visible rather than assumed away.
    const tied = scene(["h", [0, 0, 0]], ["a", [0.1, 0, 0]], ["b", [-0.1, 0, 0]]);
    expect(nearestCapture(tied, "h", N.snapRadiusM, "b")).toBe("b");
    expect(nearestCapture(tied, "h", N.snapRadiusM, "a")).toBe("a");
    // ⚠ One part in 1e12 nearer, and the incumbent loses. That is the overclaim, measured.
    const nudged = scene(["h", [0, 0, 0]], ["a", [0.1, 0, 0]], ["b", [-0.1 - 1e-13, 0, 0]]);
    expect(nearestCapture(nudged, "h", N.snapRadiusM, "b")).toBe("a");
  });

  it("⛔⛔⛔ AT BOOT THE PARTS ARE CLEAR OF EACH OTHER AND **NOT** CLEAR OF THE PLATE", () => {
    // ⛔⛔⛔ **THE AUDIT FINDING OF 2026-09-17, AS A NUMBER.** `render/scene.ts` claimed
    // *"AND AT 5L NOTHING IS IN RANGE AT REST, WHICH IS THE POINT"* — and that reasoning
    // considered only the three PARTS. ⚠ The base plate landed `3L` below them afterwards, and
    // its CENTRE is 312.4 mm from A and from B, inside the 320 mm capture radius. ⭐ So dragging
    // either part at boot raises the white pair on the plate immediately, which is the opposite
    // of what the comment promised a device pass would see.
    //
    // ⚠⚠ **AND IT IS NOT A NUMBER TO NUDGE.** The radius is centre-to-centre
    // (`CENTRES-FOR-NOW`, the owner: *"later we will use distances between faces"*), and the
    // plate is `6L × 9L` — so a part resting ON the plate near its edge is FURTHER from its
    // centre than one hovering high above the middle. ⛔ Moving the radius trades one wrong
    // answer for another; the fix is the face-distance rule `3D2` already owes.
    // ⭐ This vector exists to make the current answer VISIBLE rather than to bless it.
    const w = scene(...BOOT.map(([id, p]) => [id, p] as const));
    // ⭐ Part to part: clear, by 80 mm.
    expect(centreDistance(w, "objectA", "objectB")).toBeGreaterThan(N.snapRadiusM);
    expect(centreDistance(w, "objectA", "objectD")).toBeGreaterThan(N.snapRadiusM);
    // ⛔ Part to plate: INSIDE the radius, by about 8 mm.
    expect(centreDistance(w, "objectA", "objectC")).toBeCloseTo(0.31241, 4);
    expect(centreDistance(w, "objectA", "objectC")).toBeLessThan(N.snapRadiusM);
    expect(nearestCapture(w, "objectA", N.snapRadiusM, null)).toBe("objectC");
    expect(nearestCapture(w, "objectB", N.snapRadiusM, null)).toBe("objectC");
    // ⚠ The pink part sits higher, and IS clear of everything — 570 mm to the plate.
    expect(centreDistance(w, "objectD", "objectC")).toBeGreaterThan(N.snapRadiusM);
    expect(nearestCapture(w, "objectD", N.snapRadiusM, null)).toBeNull();
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
