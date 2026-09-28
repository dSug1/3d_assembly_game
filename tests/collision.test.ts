/**
 * GOLDEN VECTORS — **`3D6`: collision** (`COLLISION.md` §7), each one RED against today's build,
 * where nothing in the move path asked whether a body may go somewhere.
 *
 * > *"forbid the objects to penetrate each others"* · *"i do not want to switch rotation axis if
 * > there is a collision"* · *"Kinematic stop and slide: ok for translation, not ok for rotation"*
 * > · *"clamp"* — the owner, 2026-09-27.
 *
 * ⚠ Fixtures chosen so the quantity under test is NOT zero (the 2026-09-17 audit's shape): the
 * diagonal drag has a real tangential part, the turn a real axis, the L-shape a real notch.
 */
import { describe, expect, it } from "vitest";
import {
  blendPlacement,
  boundsFromShapes,
  hullAtSpawn,
  largestFreeFraction,
  resolveMove,
  slideAlong,
  type CollisionSetup,
  type CollisionShapeSource,
} from "@core/collision";
import { boxShape, gapBetween, overlapAlong } from "@core/collision_shape";
import { attach, makeWorld, worldPlacementOf, type SceneObject, type World } from "@core/object_model";
import { surfaceGap } from "@core/proximity";
import { IDENTITY, qAngle, qFromAxisAngle, qmul, type Quat, type Vec3 } from "@core/vec";

const body = (
  id: string,
  at: Vec3,
  dims: [number, number, number] = [0.1, 0.1, 0.1],
  frozen = false,
): SceneObject => ({
  id,
  local: { position: at, orientation: IDENTITY },
  parent: null,
  faces: [],
  connectors: [],
  constraints: [],
  shape: boxShape(dims),
  ...(frozen ? { frozen: true } : {}),
});

const SKIN = 0.001;
const setup = (extra: Partial<CollisionSetup> = {}): CollisionSetup => ({
  shapes: hullAtSpawn,
  bounds: boundsFromShapes(hullAtSpawn),
  skinM: SKIN,
  ...extra,
});
const pos = (w: World, id: string) => worldPlacementOf(w, id)!.position;

/** The axis of the turn taking `a` to `b`, as a unit vector (`null` for no turn). */
function turnAxis(a: Quat, b: Quat): Vec3 | null {
  const d = qmul(b, [a[0], -a[1], -a[2], -a[3]]);
  const s = Math.hypot(d[1], d[2], d[3]);
  if (s < 1e-12) return null;
  const sign = d[0] < 0 ? -1 : 1;
  return [(sign * d[1]) / s, (sign * d[2]) / s, (sign * d[3]) / s];
}

describe("⭐⭐⭐ TRANSLATION — stop, then slide", () => {
  const w = makeWorld([body("A", [0, 0, 0]), body("B", [0.3, 0, 0])]);

  it("⭐ a free move is untouched", () => {
    const v = resolveMove(w, "A", { position: [-0.2, 0, 0], orientation: IDENTITY }, setup());
    expect(v.t).toBe(1);
    expect(v.blockedBy).toBeNull();
  });

  it("⛔⛔ a move INTO B stops at the skin — it never passes through", () => {
    const v = resolveMove(w, "A", { position: [0.5, 0, 0], orientation: IDENTITY }, setup());
    expect(v.blockedBy).toBe("B");
    expect(v.t).toBeLessThan(1);
    const after = makeWorld([{ ...body("A", v.placed.position) }, body("B", [0.3, 0, 0])]);
    const g = surfaceGap(after, "A", "B")!;
    expect(g).toBeGreaterThanOrEqual(SKIN - 1e-9);
    expect(g).toBeLessThan(SKIN * 1.5);
  });

  it("⭐⭐ a DIAGONAL drag into B SLIDES — the tangential part survives in full", () => {
    // 0.3 along x (into a TALL B) and 0.2 along y (along B's face): x stops at contact, y is kept.
    // ⚠ B must be tall: a short B is cleared by the diagonal's own rise and nothing is tested.
    const tall = makeWorld([body("A", [0, 0, 0]), body("B", [0.3, 0, 0], [0.1, 0.8, 0.1])]);
    const v = resolveMove(tall, "A", { position: [0.3, 0.2, 0], orientation: IDENTITY }, setup());
    expect(v.slid).toBe(true);
    expect(v.placed.position[0]).toBeCloseTo(0.2 - SKIN, 3);
    expect(v.placed.position[1]).toBeCloseTo(0.2, 3);
  });

  it("⭐ the excess is DISCARDED: from the stop, moving back is free at once", () => {
    const stop = resolveMove(w, "A", { position: [0.5, 0, 0], orientation: IDENTITY }, setup());
    const w2 = makeWorld([body("A", stop.placed.position), body("B", [0.3, 0, 0])]);
    const back = resolveMove(w2, "A", { position: [0, 0, 0], orientation: IDENTITY }, setup());
    expect(back.t).toBe(1);
  });

  it("⭐ a body resting INSIDE the skin can LEAVE, and cannot press further in", () => {
    // ⚠ Inside the skin, not at gap 0 — the case AT 0 has its own describe below (`D125`).
    const x = 0.2 - SKIN / 2;
    const resting = makeWorld([body("A", [x, 0, 0]), body("B", [0.3, 0, 0])]);
    expect(surfaceGap(resting, "A", "B")).toBeCloseTo(SKIN / 2, 9);
    const away = resolveMove(resting, "A", { position: [0.1, 0, 0], orientation: IDENTITY }, setup());
    expect(away.t).toBe(1);
    const into = resolveMove(resting, "A", { position: [0.25, 0, 0], orientation: IDENTITY }, setup());
    expect(into.placed.position[0]).toBeLessThanOrEqual(x + 1e-9);
  });

  it("⛔ the FROZEN plate blocks exactly like any body", () => {
    const wp = makeWorld([body("A", [0, 0.2, 0]), body("plate", [0, 0, 0], [1, 0.05, 1], true)]);
    const v = resolveMove(wp, "A", { position: [0, -0.3, 0], orientation: IDENTITY }, setup());
    expect(v.blockedBy).toBe("plate");
    expect(v.placed.position[1]).toBeGreaterThan(0.025 + 0.05 - 1e-6);
  });

  it("⭐ an exempt pair (a snapping or just-unsnapped couple) passes", () => {
    const v = resolveMove(w, "A", { position: [0.5, 0, 0], orientation: IDENTITY }, setup({ exempt: () => true }));
    expect(v.t).toBe(1);
  });
});

describe("⛔⛔⛔ `D125` — TWO BODIES THAT START IN CONTACT (a gap of exactly 0)", () => {
  // ⚠ GJK reads touching and overlapping alike as 0, so "may not come closer" compared 0 with 0 and
  // let a touching body walk straight through its neighbour — found by a headless drag in `Scene_1`,
  // whose contoured pieces all boot face to face. ⭐ At 0 → 0 the rule now asks how DEEP.
  const touching = () => makeWorld([body("A", [0.2, 0, 0]), body("B", [0.3, 0, 0], [0.1, 0.8, 0.1])]);

  it("the fixture really is at 0 — faces flush, not inside the skin", () => {
    expect(surfaceGap(touching(), "A", "B")).toBeCloseTo(0, 12);
  });

  it("⛔⛔ a push INTO the neighbour goes nowhere (RED: it went straight through)", () => {
    const v = resolveMove(touching(), "A", { position: [0.3, 0, 0], orientation: IDENTITY }, setup());
    expect(v.blockedBy).toBe("B");
    expect(v.placed.position[0]).toBeLessThanOrEqual(0.2 + 1e-9);
  });

  it("⭐ a slide ALONG the shared face is free, and so is leaving", () => {
    const along = resolveMove(touching(), "A", { position: [0.2, 0.2, 0], orientation: IDENTITY }, setup());
    expect(along.t).toBe(1);
    expect(along.placed.position[1]).toBeCloseTo(0.2, 9);
    const away = resolveMove(touching(), "A", { position: [0.05, 0, 0], orientation: IDENTITY }, setup());
    expect(away.t).toBe(1);
  });

  it("⭐⭐ a DIAGONAL push SLIDES along the face — the contact normal comes from the depth (RED: it passed through)", () => {
    const v = resolveMove(touching(), "A", { position: [0.3, 0.2, 0], orientation: IDENTITY }, setup());
    expect(v.placed.position[0]).toBeLessThanOrEqual(0.2 + 1e-9);
    expect(v.placed.position[1]).toBeCloseTo(0.2, 3);
  });

  it("⛔ a TURN that digs a corner in is clamped (RED: it turned freely)", () => {
    const q = qFromAxisAngle([0, 0, 1], 0.4);
    const v = resolveMove(touching(), "A", { position: [0.2, 0, 0], orientation: q }, setup());
    expect(v.blockedBy).toBe("B");
    expect(v.t).toBeLessThan(0.05);
  });

  it("⭐ the depth measure: apart < 0, touching = 0, overlapping = the overlap", () => {
    const axes: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]];
    const cube = (x: number) => boxShape([0.1, 0.1, 0.1]).points.map((p) => [p[0] + x, p[1], p[2]] as Vec3);
    expect(overlapAlong(cube(0), cube(0.15), axes)!.depth).toBeCloseTo(-0.05, 12);
    expect(overlapAlong(cube(0), cube(0.1), axes)!.depth).toBeCloseTo(0, 12);
    const o = overlapAlong(cube(0), cube(0.07), axes)!;
    expect(o.depth).toBeCloseTo(0.03, 12);
    // ⭐ the direction that achieved it points from A toward B: the way A would have to leave is −dir
    expect(o.dir).toEqual([1, 0, 0]);
  });
});

describe("⭐⭐⭐ ROTATION — clamped along its OWN axis, never slid", () => {
  // A long bar pointing at +x beside B; a turn about z swings its tip into B.
  const w = makeWorld([body("bar", [0, 0, 0], [0.4, 0.05, 0.05]), body("B", [0.05, 0.25, 0])]);
  const asked = qFromAxisAngle([0, 0, 1], Math.PI / 2);

  it("⛔⛔ the turn stops at contact, SHORT of what was asked", () => {
    const v = resolveMove(w, "bar", { position: [0, 0, 0], orientation: asked }, setup());
    expect(v.blockedBy).toBe("B");
    expect(v.t).toBeGreaterThan(0);
    expect(v.t).toBeLessThan(1);
    expect(v.slid).toBe(false);
  });

  it("⭐⭐⭐ and the applied turn has THE SAME AXIS as the asked one — the owner's rule", () => {
    const v = resolveMove(w, "bar", { position: [0, 0, 0], orientation: asked }, setup());
    const ax = turnAxis(IDENTITY, v.placed.orientation)!;
    expect(ax[0]).toBeCloseTo(0, 9);
    expect(ax[1]).toBeCloseTo(0, 9);
    expect(ax[2]).toBeCloseTo(1, 9);
    // ⭐ and it really is partial
    expect(qAngle(v.placed.orientation)).toBeLessThan(Math.PI / 2);
    // ⛔ the position never moves for a turn about the body's own origin — no slide
    expect(v.placed.position).toEqual([0, 0, 0]);
  });

  it("⭐ blendPlacement keeps the axis of ANY turn, not only this fixture's", () => {
    const a = qFromAxisAngle([1, 2, 3], 0.4);
    const b = qmul(qFromAxisAngle([-2, 1, 0.5], 1.1), a);
    const want = turnAxis(a, b)!;
    for (const t of [0.1, 0.37, 0.8]) {
      const got = turnAxis(a, blendPlacement({ position: [0, 0, 0], orientation: a }, { position: [0, 0, 0], orientation: b }, t).orientation)!;
      for (let i = 0; i < 3; i++) expect(got[i]).toBeCloseTo(want[i]!, 9);
    }
  });
});

describe("⭐⭐ ASSEMBLIES — the compound moves as one; its members never test each other", () => {
  // P carries a seated F touching it; D sits ahead of F.
  const base = makeWorld([body("P", [0, 0, 0]), body("F", [0, 0.1, 0]), body("D", [0.3, 0.1, 0])]);
  const w = attach(base, "F", "P");

  it("⭐ the members touch (gap 0) and moving the root is still free where nothing else is", () => {
    expect(surfaceGap(w, "P", "F")).toBe(0);
    const v = resolveMove(w, "P", { position: [-0.1, 0, 0], orientation: IDENTITY }, setup());
    expect(v.t).toBe(1);
  });

  it("⛔⛔ the root's move is blocked by what its SEATED child would hit", () => {
    const v = resolveMove(w, "P", { position: [0.5, 0, 0], orientation: IDENTITY }, setup());
    expect(v.blockedBy).toBe("D");
    const fAfter = pos(attach(makeWorld([body("P", v.placed.position), body("F", [v.placed.position[0], 0.1, 0]), body("D", [0.3, 0.1, 0])]), "F", "P"), "F");
    expect(fAfter[0]).toBeLessThan(0.2);
  });
});

describe("⭐ members of one assembly never test each other — a SIBLING either (`COLLISION.md` §5)", () => {
  it("⭐ a seated bar twisting into its seated sibling is not blocked by it", () => {
    // ⚠ The stated cost: a hull cannot represent the fit, so the assembly is exempt among itself;
    // `3D8`'s authored shapes are where this is revisited.
    const base = makeWorld([
      body("P", [0, 0, 0], [0.6, 0.1, 0.6]),
      body("F1", [0, 0.1, 0], [0.4, 0.1, 0.05]),
      body("F2", [0.05, 0.1, 0.15], [0.05, 0.1, 0.05]),
    ]);
    const w = attach(attach(base, "F1", "P"), "F2", "P");
    const twist = qFromAxisAngle([0, 1, 0], -Math.PI / 2);
    const v = resolveMove(w, "F1", { position: [0, 0.1, 0], orientation: twist }, setup());
    expect(v.t).toBe(1);
    expect(v.blockedBy).toBeNull();
  });
});

describe("⭐⭐⭐ THE SEAM — a shape source is replaceable (`3D8`: Blender `UCX_` pieces)", () => {
  // An L: a floor slab and a wall, leaving a NOTCH at +x above the floor. The hull fills the notch.
  const floor: Vec3[] = boxShape([0.4, 0.05, 0.1]).points.map((p) => [p[0], p[1] - 0.075, p[2]] as Vec3);
  const wall: Vec3[] = boxShape([0.05, 0.2, 0.1]).points.map((p) => [p[0] - 0.175, p[1], p[2]] as Vec3);
  const L: SceneObject = { ...body("L", [0, 0, 0]), shape: { points: [...floor, ...wall] } };
  const w = makeWorld([L, body("c", [0.15, 0.3, 0], [0.05, 0.05, 0.05])]);
  const intoNotch = { position: [0.15, 0.0, 0] as Vec3, orientation: IDENTITY };
  const twoParts: CollisionShapeSource = {
    partsOf: (world, id) => (id === "L" ? [floor, wall] : hullAtSpawn.partsOf(world, id)),
  };

  it("⛔ with TODAY's hull the notch is filled — the cube cannot enter it", () => {
    const v = resolveMove(w, "c", intoNotch, setup());
    expect(v.blockedBy).toBe("L");
  });

  it("⭐⭐ with a two-part source the SAME rule lets it in — nothing else changed", () => {
    const v = resolveMove(w, "c", intoNotch, setup({ shapes: twoParts, bounds: boundsFromShapes(twoParts) }));
    expect(v.t).toBe(1);
    expect(gapBetween(floor, v.placed.position.length ? boxShape([0.05, 0.05, 0.05]).points.map((p) => [p[0] + 0.15, p[1], p[2]] as Vec3) : [])).toBeGreaterThan(0);
  });
});

describe("the pieces", () => {
  it("largestFreeFraction finds the boundary, and answers 0 when nothing is free", () => {
    expect(largestFreeFraction((t) => t <= 0.3)).toBeCloseTo(0.3, 3);
    expect(largestFreeFraction(() => true)).toBe(1);
    expect(largestFreeFraction(() => false)).toBe(0);
  });

  it("slideAlong removes only the part pressing INTO the contact", () => {
    expect(slideAlong([-1, 2, 0], [1, 0, 0])).toEqual([0, 2, 0]);
    expect(slideAlong([1, 2, 0], [1, 0, 0])).toEqual([1, 2, 0]);
  });
});

describe("⛔⛔ THE SNAP LANDS FLUSH ON ITS PIONEER ONLY WITH ITS COUPLE EXEMPT (2026-09-27)", () => {
  // > *"a follower seated object can be unseated with only a touch delta position"* · *"if i rotate
  // > a pioneer, the follower unsnaps instead of following"* — the owner. ⭐ One cause: the snap's
  // > landing step was tested against its own Pioneer (the exemption was inferred from
  // > `seatSnaps.has`, which is already false on that step), blocked, and the snap CANCELLED.
  const w = makeWorld([body("F", [0, 0.2, 0]), body("P", [0, 0, 0])]);
  const flush = { position: [0, 0.1, 0] as Vec3, orientation: IDENTITY };

  it("⛔ without the exemption the landing is refused — the defect", () => {
    expect(resolveMove(w, "F", flush, setup()).blockedBy).toBe("P");
  });

  it("⭐ with the couple NAMED for the write, it lands exactly flush", () => {
    const v = resolveMove(w, "F", flush, setup({ exempt: (a, b) => (a === "F" && b === "P") || (a === "P" && b === "F") }));
    expect(v.t).toBe(1);
    expect(v.placed.position).toEqual([0, 0.1, 0]);
  });
});
