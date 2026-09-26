/**
 * GOLDEN VECTORS — **THE SNAP, THE SEAT AND THE UNSNAP** (the owner, 2026-09-26, `D100`): the
 * conditions, the re-arm on exit, the seated placement identity, the position lerp, the seated
 * flag on the links, the cascades skipping a seat, the press that belongs to the unsnap, and the
 * unsnap gesture on both devices.
 */
import { describe, expect, it } from "vitest";
import { SnapArming, snapConditionMet } from "@input/snap";
import {
  UnsnapDetector,
  grewWithin,
  travelledWithin,
  unsnapCouple,
  unsnapParamsFrom,
} from "@input/unsnap";
import { SeatSnaps, magnetEase } from "@input/seat_snap";
import { assemblyRoot, frozenHoldAdmitted } from "@input/assembly";
import { seatedLocalPlacement } from "@core/seat";
import { AlignmentLinks } from "@core/alignment_links";
import {
  followerLinksFrom,
  followerMoveLinksFrom,
  resolvePioneerMoves,
  resolvePioneerTurns,
} from "@input/pioneer_cascade";
import { pressMeaning } from "@input/alignment";
import { receivesSway } from "@input/sway";
import { DEFAULT_CONFIG } from "@input/gestureConfig";
import {
  attach,
  makeWorld,
  setLocalPlacement,
  worldPlacementOf,
  type SceneObject,
} from "@core/object_model";
import { IDENTITY, qFromAxisAngle, qRotate, type Quat, type Vec3 } from "@core/vec";

const DEG = Math.PI / 180;
const UP: Vec3 = [0, 1, 0];
const DOWN: Vec3 = [0, -1, 0];

describe("⭐⭐⭐ snapConditionMet — within the offset radius AND inside the cone", () => {
  it("⭐ on the cursor, exactly anti-parallel → snaps", () => {
    expect(snapConditionMet([0, 0, 0], [0, 0, 0], 0.02, DOWN, UP, 15 * DEG)).toBe(true);
  });

  it("⛔ one hair beyond the radius → no snap; on the radius → snaps", () => {
    // ⛔ RED against a strict `<` or a missing distance test.
    expect(snapConditionMet([0.021, 0, 0], [0, 0, 0], 0.02, DOWN, UP, 15 * DEG)).toBe(false);
    expect(snapConditionMet([0.02, 0, 0], [0, 0, 0], 0.02, DOWN, UP, 15 * DEG)).toBe(true);
  });

  it("⛔⛔ the cone is about ANTI-parallel — a PARALLEL pair does not snap", () => {
    // ⛔ RED against the parallel sense (`D37`'s), which `D78` reversed.
    expect(snapConditionMet([0, 0, 0], [0, 0, 0], 0.02, UP, UP, 15 * DEG)).toBe(false);
  });

  it("⭐ 10° off inside a 15° cone → snaps; 20° off → does not", () => {
    const tilt = (deg: number): Vec3 => qRotate(qFromAxisAngle([1, 0, 0], deg * DEG), DOWN);
    expect(snapConditionMet([0, 0, 0], [0, 0, 0], 0.02, tilt(10), UP, 15 * DEG)).toBe(true);
    // ⛔ RED against ignoring the cone.
    expect(snapConditionMet([0, 0, 0], [0, 0, 0], 0.02, tilt(20), UP, 15 * DEG)).toBe(false);
  });

  it("⚠ a zero radius, a negative cone or a zero normal never snaps", () => {
    expect(snapConditionMet([0, 0, 0], [0, 0, 0], 0, DOWN, UP, 15 * DEG)).toBe(false);
    expect(snapConditionMet([0, 0, 0], [0, 0, 0], 0.02, DOWN, UP, -1)).toBe(false);
    expect(snapConditionMet([0, 0, 0], [0, 0, 0], 0.02, [0, 0, 0], UP, 15 * DEG)).toBe(false);
  });
});

describe("⭐⭐ SnapArming — re-arm on EXIT after an unsnap", () => {
  it("⛔⛔ held off after an unsnap, the couple does not re-snap while still inside", () => {
    // ⛔ RED against a hold-off that clears on the next frame: an unsnapped body is still on the
    // cursor, so it would snap straight back.
    const a = new SnapArming();
    expect(a.armed("k", 0, 0.02)).toBe(true);
    a.holdOff("k");
    expect(a.armed("k", 0, 0.02)).toBe(false);
    expect(a.armed("k", 0.02, 0.02)).toBe(false);
  });

  it("⭐ once STRICTLY outside the radius it re-arms, and stays armed on the way back in", () => {
    const a = new SnapArming();
    a.holdOff("k");
    expect(a.armed("k", 0.021, 0.02)).toBe(true);
    expect(a.armed("k", 0.01, 0.02)).toBe(true);
  });

  it("⚠ forget drops a hold-off with its alignment; other couples are untouched", () => {
    const a = new SnapArming();
    a.holdOff("k");
    a.holdOff("j");
    a.forget("k");
    expect(a.armed("k", 0, 0.02)).toBe(true);
    expect(a.armed("j", 0, 0.02)).toBe(false);
  });
});

describe("⭐⭐⭐ seatedLocalPlacement — the face centre is ON the cursor whatever the orientation", () => {
  const faceCentre: Vec3 = [0, -0.05, 0]; // the bottom face of a 0.1 m body
  const cursor: Vec3 = [0.3, 0.1, -0.2];

  it("⭐ at identity the body sits its half-height above the cursor", () => {
    const p = seatedLocalPlacement(cursor, IDENTITY, faceCentre);
    expect(p.position[0]).toBeCloseTo(0.3, 12);
    expect(p.position[1]).toBeCloseTo(0.15, 12);
    expect(p.position[2]).toBeCloseTo(-0.2, 12);
  });

  it("⭐⭐ a twist about the face normal keeps the face centre on the cursor — a turn ABOUT THE FACE", () => {
    // ⛔ RED against keeping the body centre fixed (a turn about the body's own centre).
    const q = qFromAxisAngle([0, 1, 0], 37 * DEG);
    const p = seatedLocalPlacement(cursor, q, faceCentre);
    const centreW = qRotate(p.orientation, faceCentre);
    for (let i = 0; i < 3; i++)
      expect(p.position[i]! + centreW[i]!).toBeCloseTo(cursor[i]!, 12);
  });

  it("⭐ an off-centre face (the pyramid's slanted side) still lands its centre on the cursor", () => {
    const off: Vec3 = [0.04, 0.02, -0.01];
    const q = qFromAxisAngle([1, 1, 0], 70 * DEG);
    const p = seatedLocalPlacement(cursor, q, off);
    const c = qRotate(q, off);
    for (let i = 0; i < 3; i++) expect(p.position[i]! + c[i]!).toBeCloseTo(cursor[i]!, 12);
  });
});

describe("⭐⭐ SeatSnaps — the position half of a snap, lerped and landed exactly", () => {
  it("⭐ half-way is half-way; the end lands EXACTLY on `to` and is done", () => {
    const s = new SeatSnaps<string>();
    s.start("f", [0, 0, 0], [1, 2, 4], 0);
    const mid = s.advance(50, 100, (u) => u);
    expect(mid[0]?.position).toEqual([0.5, 1, 2]);
    expect(mid[0]?.done).toBe(false);
    const end = s.advance(100, 100, (u) => u);
    expect(end[0]?.position).toEqual([1, 2, 4]);
    expect(end[0]?.done).toBe(true);
    expect(s.has("f")).toBe(false);
  });

  it("⭐ retarget moves the END, not the start; cancel drops it; a dead body is dropped", () => {
    const s = new SeatSnaps<string>();
    s.start("f", [0, 0, 0], [1, 0, 0], 0);
    s.retarget("f", [2, 0, 0]);
    expect(s.advance(50, 100, (u) => u)[0]?.position).toEqual([1, 0, 0]);
    s.cancel("f");
    expect(s.advance(60, 100, (u) => u)).toHaveLength(0);
    s.start("g", [0, 0, 0], [1, 0, 0], 0);
    expect(s.advance(10, 100, (u) => u, () => false)).toHaveLength(0);
    expect(s.has("g")).toBe(false);
  });

  it("⚠ a zero duration arrives at once", () => {
    const s = new SeatSnaps<string>();
    s.start("f", [0, 0, 0], [1, 0, 0], 0);
    expect(s.advance(0, 0, (u) => u)[0]?.done).toBe(true);
  });
});

describe("⭐⭐ AlignmentLinks — the seated flag lives and dies with the link", () => {
  it("⭐ seat needs a link; unlink and prune clear it", () => {
    const l = new AlignmentLinks();
    expect(l.seat("f")).toBe(false);
    l.link("f", "p", "top", IDENTITY, [0, 0, 0]);
    expect(l.seat("f")).toBe(true);
    expect(l.isSeated("f")).toBe(true);
    expect(l.seatedFollowers()).toEqual(["f"]);
    l.unlink("f");
    // ⛔ RED against a seat that outlives its link.
    expect(l.isSeated("f")).toBe(false);
    l.link("f", "p", "top", IDENTITY, [0, 0, 0]);
    l.seat("f");
    l.prune(() => false);
    expect(l.isSeated("f")).toBe(false);
  });

  it("⭐ unseat keeps the link", () => {
    const l = new AlignmentLinks();
    l.link("f", "p", "top", IDENTITY, [0, 0, 0]);
    l.seat("f");
    l.unseat("f");
    expect(l.isSeated("f")).toBe(false);
    expect(l.pioneerFor("f")?.objectId).toBe("p");
  });
});

describe("⭐⭐⭐ the cascades SKIP a seated Follower — the tree carries it", () => {
  const q = qFromAxisAngle([0, 1, 0], 30 * DEG);

  it("⛔⛔ a turned Pioneer neither releases nor rotates its SEATED cyan follower", () => {
    // ⛔ RED against the build before `isSeated`: SNAPSHOT would RELEASE the seat on the first turn.
    const l = new AlignmentLinks();
    l.link("f", "p", "top", IDENTITY, [0, 0, 0]);
    l.seat("f");
    const plan = resolvePioneerTurns(
      followerLinksFrom(l.alignedObjects(), (f) => l.pioneerFor(f), () => "SNAPSHOT", (f) => l.isSeated(f)),
      (id) => (id === "p" ? q : IDENTITY),
    );
    expect(plan.steps).toHaveLength(0);
  });

  it("⛔ a moved Pioneer neither releases nor pushes its SEATED follower", () => {
    const l = new AlignmentLinks();
    l.link("f", "p", "top", IDENTITY, [0, 0, 0]);
    l.seat("f");
    const plan = resolvePioneerMoves(
      followerMoveLinksFrom(l.alignedObjects(), (f) => l.pioneerFor(f), () => "FOLLOW", (f) => l.isSeated(f)),
      (id) => (id === "p" ? [1, 0, 0] : [0, 0, 0]),
    );
    expect(plan.steps).toHaveLength(0);
  });

  it("⭐ an UNSEATED follower is still the cascade's — nothing else changed", () => {
    const l = new AlignmentLinks();
    l.link("f", "p", "top", IDENTITY, [0, 0, 0]);
    const plan = resolvePioneerTurns(
      followerLinksFrom(l.alignedObjects(), (f) => l.pioneerFor(f), () => "SNAPSHOT", (f) => l.isSeated(f)),
      (id) => (id === "p" ? q : IDENTITY),
    );
    expect(plan.steps.map((s) => s.kind)).toEqual(["RELEASE"]);
  });
});

describe("⭐⭐ pressMeaning — a press on a SEATED partner belongs to the unsnap", () => {
  const base = {
    pressedObject: "p",
    pressedFace: "top",
    heldObjects: ["f"],
    pioneerOfHeld: "p",
    pioneerFaceOfHeld: "top",
    alignedFaceOfHeld: "bottom",
    heldPressFace: "side",
    pressWasDoubleTap: false,
  } as const;

  it("⛔⛔ hold the follower, press its Pioneer: seated → NOTHING; unseated → re-points the alignment", () => {
    // ⛔ RED against the build before the flag, which would re-align (or `D39`-undo) and break the seat.
    expect(pressMeaning({ ...base, pressedIsSeatedPartner: true }).action).toBe("NOTHING");
    expect(pressMeaning({ ...base, pressedIsSeatedPartner: false }).action).toBe("ALIGN");
  });

  it("⛔ hold the Pioneer, press its seated follower (the desktop's order): NOTHING, not `D90`'s swap", () => {
    const swap = {
      ...base,
      pressedObject: "f",
      heldObjects: ["p"],
      pioneerOfHeld: null,
      pioneerFaceOfHeld: null,
      alignedFaceOfHeld: null,
    };
    expect(pressMeaning({ ...swap, pressedIsSeatedPartner: true }).action).toBe("NOTHING");
    expect(pressMeaning({ ...swap, pressedIsSeatedPartner: false }).action).toBe("ALIGN");
  });
});

describe("⭐⭐⭐ the unsnap gesture — one touchpoint on each body, then a rapid move", () => {
  const P = unsnapParamsFrom(DEFAULT_CONFIG);

  it("⛔⛔ the ORDER: first the Pioneer, second the Follower — the reverse is not this gesture", () => {
    // > *"first touch on pioneer object and second touch on follower object … This will maintain
    // > symmetry between mobile and desktop"* — the owner, 2026-09-26 (corrected).
    const pioneerOf = (f: string) => (f === "f" ? "p" : null);
    const seated = (f: string) => f === "f";
    expect(unsnapCouple("p", "f", pioneerOf, seated)).toBe("f");
    // ⛔ RED against an order-agnostic reading, which the first text of the rule had.
    expect(unsnapCouple("f", "p", pioneerOf, seated)).toBeNull();
    // ⚠ not seated, a stranger, or one body twice → nothing
    expect(unsnapCouple("p", "f", pioneerOf, () => false)).toBeNull();
    expect(unsnapCouple("x", "f", pioneerOf, seated)).toBeNull();
    expect(unsnapCouple("f", "f", pioneerOf, seated)).toBeNull();
  });

  it("⭐ the params are the eviction shake's own sliders — *\"same sliders as eviction shake\"*", () => {
    expect(P.legMm).toBe(DEFAULT_CONFIG.evictShakeLegMm);
    expect(P.windowMs).toBe(DEFAULT_CONFIG.evictShakeWindowMs);
  });

  it("⭐⭐ TOUCH: the fingers' separation GROWING by a leg within the window fires, once", () => {
    const d = new UnsnapDetector({ legMm: 6, windowMs: 300 }, "TOUCH");
    expect(d.push(0, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(false);
    expect(d.push(100, { x: 0, y: 0 }, { x: 13, y: 0 })).toBe(false);
    expect(d.push(200, { x: 0, y: 0 }, { x: 17, y: 0 })).toBe(true);
    // ⚠ fired once; quiet until reset
    expect(d.push(250, { x: 0, y: 0 }, { x: 30, y: 0 })).toBe(false);
    d.reset();
    expect(d.push(300, { x: 0, y: 0 }, { x: 30, y: 0 })).toBe(false);
  });

  it("⛔⛔ TOUCH: a ZOOM IN (separation shrinking) does not fire — the owner said zoom OUT", () => {
    // ⛔ RED against reading |Δseparation|.
    const d = new UnsnapDetector({ legMm: 6, windowMs: 300 }, "TOUCH");
    d.push(0, { x: 0, y: 0 }, { x: 30, y: 0 });
    expect(d.push(100, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(false);
  });

  it("⛔ TOUCH: the same growth spread over LONGER than the window does not fire — it must be rapid", () => {
    // ⛔ RED against ignoring the window.
    const d = new UnsnapDetector({ legMm: 6, windowMs: 300 }, "TOUCH");
    d.push(0, { x: 0, y: 0 }, { x: 10, y: 0 });
    d.push(400, { x: 0, y: 0 }, { x: 13, y: 0 });
    expect(d.push(800, { x: 0, y: 0 }, { x: 17, y: 0 })).toBe(false);
  });

  it("⭐⭐ MOUSE: the driven pointer TRAVELLING a leg within the window fires, whatever the other does", () => {
    // ⛔ RED against reading separation on a mouse: the right-button touchpoint never moves, and
    // a rapid move TOWARD it would then never unsnap.
    const still = { x: 100, y: 100 };
    const d = new UnsnapDetector({ legMm: 6, windowMs: 300 }, "MOUSE");
    expect(d.push(0, { x: 120, y: 100 }, still)).toBe(false);
    expect(d.push(100, { x: 113, y: 100 }, still)).toBe(true);
  });

  it("⛔ grewWithin / travelledWithin enforce the WINDOW on an untrimmed series too", () => {
    // ⛔ RED against dropping the in-function window test: the detector trims, a caller may not.
    expect(grewWithin([{ t: 0, v: 0 }, { t: 1000, v: 10 }], 6, 300)).toBe(false);
    expect(grewWithin([{ t: 0, v: 0 }, { t: 900, v: 0 }, { t: 1000, v: 10 }], 6, 300)).toBe(true);
    expect(travelledWithin([{ t: 0, x: 0, y: 0 }, { t: 1000, x: 10, y: 0 }], 6, 300)).toBe(false);
  });

  it("⚠ grewWithin / travelledWithin refuse a single sample and a non-positive leg", () => {
    expect(grewWithin([{ t: 0, v: 0 }], 6, 300)).toBe(false);
    expect(grewWithin([{ t: 0, v: 0 }, { t: 1, v: 10 }], 0, 300)).toBe(false);
    expect(travelledWithin([{ t: 0, x: 0, y: 0 }], 6, 300)).toBe(false);
  });
});

describe("⭐⭐ receivesSway — a seated assembly is ONE body", () => {
  it("⛔ a body seated with the mover does not sway; a stranger still does", () => {
    // ⛔ RED against the predicate before `inMoverAssembly`.
    const inAssembly = (id: string) => id === "child";
    expect(receivesSway({ id: "child" }, "mover", () => false, null, true, inAssembly)).toBe(false);
    expect(receivesSway({ id: "stranger" }, "mover", () => false, null, true, inAssembly)).toBe(true);
  });
});

describe("⭐ object_model.setLocalPlacement — the seat's writer", () => {
  const body = (id: string, parent: string | null, frozen = false): SceneObject => ({
    id,
    local: { position: [0, 0, 0], orientation: IDENTITY as Quat },
    parent,
    faces: [],
    shape: { points: [] },
    frozen,
    connectors: [],
    constraints: [],
  });

  it("⭐ writes the LOCAL placement, so the world one composes through the parent", () => {
    let w = makeWorld([body("p", null), body("c", null)]);
    w = attach(w, "c", "p");
    w = setLocalPlacement(w, "p", { position: [1, 0, 0], orientation: IDENTITY });
    w = setLocalPlacement(w, "c", { position: [0, 2, 0], orientation: IDENTITY });
    expect(worldPlacementOf(w, "c")?.position).toEqual([1, 2, 0]);
  });

  it("⛔ a frozen body is refused; an unknown id is ignored", () => {
    let w = makeWorld([body("plate", null, true)]);
    const before = worldPlacementOf(w, "plate");
    w = setLocalPlacement(w, "plate", { position: [9, 9, 9], orientation: IDENTITY });
    expect(worldPlacementOf(w, "plate")).toEqual(before);
    expect(setLocalPlacement(w, "ghost", { position: [1, 1, 1], orientation: IDENTITY })).toBe(w);
  });
});

describe("⭐⭐⭐ assemblyRoot — a press on any member drives the assembly's root", () => {
  // grey seated on the pyramid, the pyramid seated on the plate (frozen)
  const pioneerOf = (f: string) => ({ grey: "pyramid", pyramid: "plate" })[f] ?? null;
  const seated = (f: string) => f === "grey" || f === "pyramid";
  const frozen = (b: string) => b === "plate";

  it("⭐ a seated member walks up to its Pioneer; a free body is its own root", () => {
    expect(assemblyRoot("grey", pioneerOf, seated, () => false)).toBe("plate");
    expect(assemblyRoot("pink", pioneerOf, seated, frozen)).toBe("pink");
  });

  it("⛔⛔ the walk STOPS BELOW A FROZEN PIONEER — a part on the plate holds the part", () => {
    // ⛔ RED against walking onto the plate, which can never move and whose first touch is a miss.
    expect(assemblyRoot("grey", pioneerOf, seated, frozen)).toBe("pyramid");
    expect(assemblyRoot("pyramid", pioneerOf, seated, frozen)).toBe("pyramid");
  });

  it("⚠ an aligned-but-unseated member is its own root; a ring cannot hang it", () => {
    expect(assemblyRoot("grey", pioneerOf, (f) => f === "pyramid", frozen)).toBe("grey");
    expect(assemblyRoot("a", (f) => (f === "a" ? "b" : "a"), () => true, () => false)).toBeDefined();
  });

  it("⭐ a frozen body is holdable only when a seated Follower rests on it", () => {
    expect(frozenHoldAdmitted(true)).toBe(true);
    expect(frozenHoldAdmitted(false)).toBe(false);
  });
});

describe("⭐⭐ magnetEase — accelerating INTO contact", () => {
  it("⭐ endpoints, monotone, and the second half covers three quarters of the way", () => {
    expect(magnetEase(0)).toBe(0);
    expect(magnetEase(1)).toBe(1);
    // ⛔ RED against `easeInOut`, whose second half covers exactly half.
    expect(magnetEase(0.5)).toBeCloseTo(0.25, 12);
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const v = magnetEase(i / 10);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
    expect(magnetEase(-1)).toBe(0);
    expect(magnetEase(2)).toBe(1);
  });

  it("⭐ the shipped snap time is 60 ms, on a slider", () => {
    expect(DEFAULT_CONFIG.snapMs).toBe(60);
  });
});
