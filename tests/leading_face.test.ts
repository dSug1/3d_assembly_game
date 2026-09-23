/**
 * GOLDEN VECTORS — **THE LEADING FACE**, the face a body is advancing on.
 *
 * ⛔⛔ **EVERY FIXTURE HERE IS OFF-AXIS SOMEWHERE**, and that is the 2026-09-17 audit's
 * finding applied before the fact: *a fixture chosen because it is easy to reason about is
 * usually chosen from the set where the quantity under test is ZERO.* A cube at the origin
 * pushed along `+x` would pass against an implementation that ignored the body's orientation,
 * ignored its placement, or returned the face whose normal merely has the largest dot with the
 * ray — three different rules that agree on the easy case and disagree on a turned body.
 *
 * ⭐ So the counter-examples are written out and asserted to FAIL: `naiveBestDot` is the rule
 * this was nearly written as, and it is wrong for an OBLONG body, which is what the scene's
 * parts are.
 */
import { describe, expect, it } from "vitest";
import { leadingFace } from "@core/leading_face";
import {
  makeWorld,
  setWorldPlacement,
  type SceneObject,
  type World,
} from "@core/object_model";
import { IDENTITY, dot, normalize, qFromAxisAngle, type Quat, type Vec3 } from "@core/vec";

/** A box with the six logical faces the scene builds, half-extents `h`. */
const box = (id: string, h: readonly [number, number, number]): SceneObject => ({
  id,
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "+x", centre: [h[0], 0, 0], normal: [1, 0, 0] },
    { id: "-x", centre: [-h[0], 0, 0], normal: [-1, 0, 0] },
    { id: "+y", centre: [0, h[1], 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -h[1], 0], normal: [0, -1, 0] },
    { id: "+z", centre: [0, 0, h[2]], normal: [0, 0, 1] },
    { id: "-z", centre: [0, 0, -h[2]], normal: [0, 0, -1] },
  ],
  connectors: [],
  constraints: [],
});

const scene = (
  h: readonly [number, number, number],
  position: Vec3 = [0, 0, 0],
  orientation: Quat = IDENTITY,
): World => setWorldPlacement(makeWorld([box("a", h)]), "a", { position, orientation });

/**
 * ⭐⭐⭐ **A FRUSTUM — and its side faces SLANT, which is the whole of the 2026-09-23 report.**
 *
 * ⚠ `objectB` in the scene is a trapezoidal pyramid (`D72`), so its sides lean inward going up
 * and their outward normals have an **upward component**. ⛔ A box cannot show this: its side
 * normals are exactly horizontal, so `n·up` is 0 and the old latch let go of them by itself.
 * ⭐ `slant` is the tangent of the lean — 0 is a box.
 */
const frustum = (id: string, h: readonly [number, number, number], slant: number): SceneObject => ({
  id,
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "+x", centre: [h[0], 0, 0], normal: normalize([1, slant, 0])! },
    { id: "-x", centre: [-h[0], 0, 0], normal: normalize([-1, slant, 0])! },
    { id: "+y", centre: [0, h[1], 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -h[1], 0], normal: [0, -1, 0] },
    { id: "+z", centre: [0, 0, h[2]], normal: normalize([0, slant, 1])! },
    { id: "-z", centre: [0, 0, -h[2]], normal: normalize([0, slant, -1])! },
  ],
  connectors: [],
  constraints: [],
});

/**
 * ⛔ THE COUNTER-EXAMPLE: *the face whose normal is most nearly along the ray*. It is the rule
 * a reader reaches for first, it is right for a CUBE, and it is wrong for an oblong body —
 * which is exactly what `objectA` is (`L × 2L × 3L`).
 */
const naiveBestDot = (w: World, id: ObjectIdish, d: Vec3): string | null => {
  const body = w.objects.get(id);
  const u = normalize(d);
  if (!body || !u) return null;
  let best: string | null = null;
  let bestCos = -Infinity;
  for (const f of body.faces) {
    const c = dot(f.normal, u);
    if (c > bestCos) {
      bestCos = c;
      best = f.id;
    }
  }
  return best;
};
type ObjectIdish = string;

const DEG = Math.PI / 180;

describe("the leading face is the face the ray LEAVES through", () => {
  it("a cube pushed along each of six directions leaves through the matching face", () => {
    const w = scene([0.5, 0.5, 0.5]);
    const cases: readonly (readonly [Vec3, string])[] = [
      [[1, 0, 0], "+x"],
      [[-1, 0, 0], "-x"],
      [[0, 1, 0], "+y"],
      [[0, -1, 0], "-y"],
      [[0, 0, 1], "+z"],
      [[0, 0, -1], "-z"],
    ];
    for (const [d, id] of cases) expect(leadingFace(w, "a", d)?.faceId).toBe(id);
  });

  it("⭐⭐ AN OBLONG BODY SEPARATES *EXIT* FROM *BEST ALIGNED* — and the naive rule fails it", () => {
    // ⛔ A long thin body, `0.1 × 0.1 × 1.5` half-extents, pushed 40° off its long axis.
    // The ray is still mostly along `+z`, so "best dot" says `+z` — but the body is 15×
    // longer that way, so the ray leaves through the SIDE long before it reaches the end.
    const w = scene([0.1, 0.1, 1.5]);
    const d: Vec3 = [Math.sin(40 * DEG), 0, Math.cos(40 * DEG)];
    expect(leadingFace(w, "a", d)?.faceId).toBe("+x");
    // ⭐ The counter-example, asserted to be WRONG. A vector that cannot fail is not a test.
    expect(naiveBestDot(w, "a", d)).toBe("+z");
  });

  it("⭐ the distance reported is the real one, and it is the SHORTEST exit", () => {
    const w = scene([0.1, 0.1, 1.5]);
    // Straight along `+x`: half-extent 0.1 m, so the exit is at exactly 0.1 m.
    expect(leadingFace(w, "a", [1, 0, 0])?.distanceM).toBeCloseTo(0.1, 12);
    // 45° in the x/z plane: the `+x` plane is crossed at `0.1 / cos45` = 0.1414.
    const hit = leadingFace(w, "a", [1, 0, 1]);
    expect(hit?.faceId).toBe("+x");
    expect(hit?.distanceM).toBeCloseTo(0.1 * Math.SQRT2, 12);
  });

  it("⛔⛔ A TURNED BODY IS THE CASE A PLACEMENT-BLIND RULE PASSES BY ACCIDENT", () => {
    // Rotate the body 90° about `+y`: its local `+x` now points along world `-z`.
    const w = scene([0.5, 0.5, 0.5], [0, 0, 0], qFromAxisAngle([0, 1, 0], 90 * DEG));
    // Pushing along world `+x` must now leave through the face whose LOCAL id is `+z`.
    const hit = leadingFace(w, "a", [1, 0, 0]);
    expect(hit?.faceId).toBe("+z");
    // ⭐ And the normal handed back is in WORLD space, pointing the way the body is going.
    expect(hit?.normal[0]).toBeCloseTo(1, 12);
    expect(hit?.normal[2]).toBeCloseTo(0, 12);
  });

  it("⛔ the body's PLACEMENT does not change which face leads, only where it is", () => {
    const at = (p: Vec3) => leadingFace(scene([0.5, 0.5, 0.5], p), "a", [1, 0, 0]);
    expect(at([0, 0, 0])?.faceId).toBe("+x");
    expect(at([7, -3, 11])?.faceId).toBe("+x");
    // ⚠ The centre moves with the body — this is what the gizmo is positioned from.
    expect(at([7, -3, 11])?.centre).toEqual([7.5, -3, 11]);
    // ⭐ And the DISTANCE is from the body's own origin, so it is unchanged by the move.
    expect(at([7, -3, 11])?.distanceM).toBeCloseTo(0.5, 12);
  });

  it("⛔⛔ A FROZEN BODY HAS NO LEADING FACE — it never advances on one", () => {
    // ⚠ The base plate is frozen, and a gizmo on a body that cannot move is a readout that lies:
    // *"don't show the gizmo for the frozen objects"* (the owner, 2026-09-23).
    // ⭐ Refused by the DEFINITION rather than by a guard in the renderer — the same reasoning
    // `object_model.ts` uses to enforce `frozen` at its writers instead of at its callers.
    const w = makeWorld([{ ...box("a", [0.5, 0.5, 0.5]), frozen: true }]);
    expect(leadingFace(w, "a", [1, 0, 0])).toBeNull();
    // ⛔ And the SAME body unfrozen still answers — otherwise this vector would pass against an
    // implementation that had simply stopped working.
    const live = makeWorld([box("a", [0.5, 0.5, 0.5])]);
    expect(leadingFace(live, "a", [1, 0, 0])?.faceId).toBe("+x");
  });

  it("⛔ it REFUSES rather than guessing: zero direction, unknown body, no faces", () => {
    const w = scene([0.5, 0.5, 0.5]);
    expect(leadingFace(w, "a", [0, 0, 0])).toBeNull();
    expect(leadingFace(w, "nobody", [1, 0, 0])).toBeNull();
    const faceless = makeWorld([{ ...box("f", [1, 1, 1]), faces: [] }]);
    expect(leadingFace(faceless, "f", [1, 0, 0])).toBeNull();
  });

  it("⚠ a face SQUARE to the ray is never the exit — it is parallel to it", () => {
    // Pushing along `+x`, the `+y`/`-y`/`+z`/`-z` planes all contain the ray's direction.
    // ⛔ Their `n·d` is exactly 0, and dividing by it would give ±Infinity, not a face.
    const hit = leadingFace(scene([0.5, 0.5, 0.5]), "a", [1, 0, 0]);
    expect(hit?.faceId).toBe("+x");
    expect(Number.isFinite(hit!.distanceM)).toBe(true);
  });

  it("⭐ every direction on a sphere of samples returns SOME face, and it is in front", () => {
    // ⛔ THE INVARIANT, ON MORE THAN ONE AXIS — `METHOD`: *an invariant tested on one axis is
    // not tested*. A closed convex body has an exit in every direction, at a positive distance.
    const w = scene([0.4, 0.9, 1.3], [0.2, -0.4, 0.7], qFromAxisAngle([1, 2, 3], 37 * DEG));
    for (let i = 0; i < 64; i++) {
      const a = (i * 2 * Math.PI) / 64;
      for (const e of [-1.2, -0.4, 0, 0.6, 1.4]) {
        const d: Vec3 = [Math.cos(a), e, Math.sin(a)];
        const hit = leadingFace(w, "a", d);
        expect(hit).not.toBeNull();
        expect(hit!.distanceM).toBeGreaterThan(0);
        // ⭐ The face it names must genuinely face the way we are going.
        expect(dot(hit!.normal, normalize(d)!)).toBeGreaterThan(0);
      }
    }
  });
});

describe("⛔⛔⛔ STICKY — the leading face changes only when the body stops advancing on it", () => {
  /**
   * ⚠⚠ *"In this situation (ongoing translation = dx towards left) the gizmo keeps swapping
   * between the face and the center of the object."* — the owner, 2026-09-23, with two
   * screenshots one drag apart showing the gizmo on two different faces.
   *
   * ⛔⛔ **THE FACE WAS RE-CHOSEN EVERY FRAME FROM ONE FRAME'S APPLIED STEP**, which is
   * `QUEUE.md`'s **mistake shape 1** — *a rate estimated over the shortest available baseline* —
   * in its purest form. ⭐ `A11`'s per-axis deadband emits the excess on one axis and nothing on
   * the other, so a straight, slow drag produces a step whose DIRECTION alternates, and two faces
   * with close exit distances swap the gizmo back and forth.
   */
  it("⛔⛔⛔ RETRACTED 2026-09-23: the held face is a SEED, and loses to a nearer exit", () => {
    // ⚠⚠ **THIS VECTOR PINNED THE OPPOSITE UNTIL A HAND REPORTED IT.** It asserted that a face
    // the body is still advancing on is KEPT *even when another is a nearer exit* — which is what
    // `D54` built, and what the owner rejected:
    //
    // > *"how is it possible that the green axis passes through this face, instead of the blue
    // > face? … a vertical translation along gravity axis should immediately select the blue
    // > face, not the left face."*
    //
    // ⭐ The held face is now seeded into the search: it wins a TIE and loses to anything strictly
    // nearer. ⛔ No threshold — `<` does the whole job.
    const w = scene([0.1, 0.1, 1.5]);
    const d: Vec3 = [Math.sin(40 * DEG), 0, Math.cos(40 * DEG)];
    expect(leadingFace(w, "a", d)?.faceId).toBe("+x");
    expect(leadingFace(w, "a", d, "+z")?.faceId).toBe("+x");
  });

  it("⭐⭐⭐ THE DEVICE REPORT: a FRUSTUM pushed straight up takes its TOP face", () => {
    // ⛔⛔ **THE CASE A BOX CANNOT PRODUCE.** A frustum's sides lean, so their normals point
    // outward AND up: `n·up > 0` for every one of them, and the old latch therefore held whichever
    // side was current for as long as the body rose. ⭐ The exit it reported was metres away, which
    // is also what made the gizmo FLARE before its lines were sized from the camera.
    const w = setWorldPlacement(
      makeWorld([frustum("a", [0.5, 0.5, 0.5], 0.35)]),
      "a",
      { position: [0, 0, 0], orientation: IDENTITY },
    );
    const up: Vec3 = [0, 1, 0];
    // ⚠ The premise, measured: the slanted side really does face an upward push.
    expect(dot(w.objects.get("a")!.faces[0]!.normal, up)).toBeGreaterThan(0);
    // ⛔ THE ASSERTION THE SHIPPED BUILD FAILS — it answered `+x`, the left face.
    expect(leadingFace(w, "a", up, "+x")?.faceId).toBe("+y");
    expect(leadingFace(w, "a", up, "+z")?.faceId).toBe("+y");
    expect(leadingFace(w, "a", up)?.faceId).toBe("+y");
    // ⭐ And the exit it reports is the body's own half-height, not a grazing distance.
    expect(leadingFace(w, "a", up, "+x")!.distanceM).toBeCloseTo(0.5, 9);
  });

  it("⛔ it SWITCHES the moment the body stops advancing on that face", () => {
    // ⚠ `n·d > 0` is the whole test, and it is a geometric boundary rather than a tuned one.
    const w = scene([0.5, 0.5, 0.5]);
    // Travelling along `+x`, the body is not advancing on `−x` at all, so the stale face goes.
    expect(leadingFace(w, "a", [1, 0, 0], "-x")?.faceId).toBe("+x");
    // ⚠ And exactly square to it is NOT advancing either — the ray is parallel to that face.
    expect(leadingFace(w, "a", [1, 0, 0], "+y")?.faceId).toBe("+x");
  });

  it("⭐ an unknown or stale face id falls back to the ordinary choice rather than refusing", () => {
    const w = scene([0.5, 0.5, 0.5]);
    expect(leadingFace(w, "a", [1, 0, 0], "no-such-face")?.faceId).toBe("+x");
  });

  // ⛔⛔⛔ **TWO VECTORS STOOD HERE AND THEIR SUBJECT IS DELETED** — 2026-09-23. They pinned an
  // accumulated, fading travel direction, and the owner rejected the idea outright: *"You can lag
  // the travel, but the input itself has no lag. The gizmo repositioning should match the input,
  // not the travel and its lag."* ⭐ The face is aimed by what the channels ASK for on the frame
  // they ask it, so there is no accumulator and no time constant to vector.
  // ⚠⚠ What that gives up is stated in `leading_face.ts`: `D54`'s chatter had two answers, the
  // latch and the memory, and both are gone. The seed below is what is left against it.

  it("⚠ RETIRED: the sticky-face arithmetic this replaced", () => {
    // ⭐⭐ THE VECTOR THE REPORT ASKED FOR. A direction wobbling either side of the diagonal
    // between two faces flips the un-sticky answer every sample; the sticky one does not move.
    const w = scene([0.5, 0.5, 0.5]);
    const jitter: readonly Vec3[] = [
      [1, 0.001, 0],
      [1, -0.001, 0],
      [0.999, 0.002, 0],
      [1, -0.002, 0],
    ];
    const free = jitter.map((d) => leadingFace(w, "a", d)?.faceId);
    const sticky = jitter.map((d) => leadingFace(w, "a", d, "+x")?.faceId);
    // ⚠ The free answers are all `+x` here because a cube's faces are far from tied — the point
    // is the STICKY one is invariant BY CONSTRUCTION, which is what the fixture below shows.
    expect(new Set(sticky).size).toBe(1);
    expect(free.every((f) => f !== undefined)).toBe(true);
    // ⛔ The genuinely tied case: a ray at exactly 45° between `+x` and `+z` on a cube. Either
    // answer is defensible frame to frame, and that is precisely the chatter a hand saw.
    const tied: readonly Vec3[] = [
      [1, 0, 0.9999],
      [1, 0, 1.0001],
    ];
    expect(new Set(tied.map((d) => leadingFace(w, "a", d)?.faceId)).size).toBe(2);
    // ⚠⚠ **AND HERE IS WHAT THE SEED DOES AND DOES NOT DO.** The latch answered `+x` for both,
    // because it never let go while the body advanced at all. ⭐ The seed answers each ray on its
    // own merits — `+x` then `+z` — and holds the current face only at an EXACT tie.
    expect(new Set(tied.map((d) => leadingFace(w, "a", d, "+x")?.faceId)).size).toBe(2);
    const exact: Vec3 = [1, 0, 1];
    expect(leadingFace(w, "a", exact, "+x")?.faceId).toBe("+x");
    expect(leadingFace(w, "a", exact, "+z")?.faceId).toBe("+z");
    // ⛔ That is the whole of the anti-chatter guarantee that survives here; the rest of it moved
    // to the DIRECTION, which no longer alternates for a straight drag.
  });
});
