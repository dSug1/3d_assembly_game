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
