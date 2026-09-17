/**
 * GOLDEN VECTORS — **WHAT A TURNED PIONEER DOES, AND HOW FAR IT REACHES.**
 *
 * Design of record: the owner, 2026-09-17 — *"if a previous pioneer P1 has a follower F1 and if
 * P1 becomes the follower of P2: if P1 is orange, P2 rotation shall trigger rotation of P1 which
 * in turn shall cascade to rotation of F1; if P1 is blue, P2 rotation shall release the
 * alignment of P1 with P2 but not the alignment of F1 with P1"*.
 *
 * ⛔⛔ **THIS FILE EXISTS BECAUSE THE RULE WAS UNTESTABLE.** It lived in `render/scene.ts`, so
 * when a hand reported *"the release of the cyan follower objects by the rotation of the pioneer
 * is not working"* there was no way to ask the code what it believed. ⭐ Every vector below is
 * a question I could not previously put to the product.
 */
import { describe, expect, it } from "vitest";
import { resolvePioneerTurns, type FollowerLink } from "@input/pioneer_cascade";
import { IDENTITY, qAngle, qFromAxisAngle, qmul, type Quat } from "@core/vec";
import type { ObjectId } from "@core/object_model";

const TURN = qFromAxisAngle([0, 1, 0], 0.4);
const BIG = qFromAxisAngle([1, 0, 0], 1.1);

/** A world of poses, read through a callback exactly as the render loop does. */
const poses = (m: Record<string, Quat>) => (id: ObjectId) => m[id] ?? null;

const link = (
  follower: string,
  pioneer: string,
  mode: "SNAPSHOT" | "FOLLOW",
  baseline: Quat = IDENTITY,
): FollowerLink => ({ follower, pioneer, mode, baseline });

describe("⛔⛔⛔ THE ONE THAT WAS REPORTED BROKEN — a cyan follower releases", () => {
  it("⭐⭐⭐ A TURNED PIONEER RELEASES ITS **SNAPSHOT** FOLLOWER", () => {
    // ⛔ *"if the pioneer object rotates, all its blue follower shall be released from
    // alignment."* ⚠ The body must NOT be rotated — `D41`'s C1 is explicit: *"releases the
    // first object alignment (but not rotate the first object)"*.
    const plan = resolvePioneerTurns([link("f", "p", "SNAPSHOT")], poses({ p: TURN, f: IDENTITY }));
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "f" }]);
  });

  it("⭐⭐ ALL of them, not just one — the owner said *all its blue followers*", () => {
    const plan = resolvePioneerTurns(
      [link("f1", "p", "SNAPSHOT"), link("f2", "p", "SNAPSHOT"), link("f3", "p", "SNAPSHOT")],
      poses({ p: TURN, f1: IDENTITY, f2: IDENTITY, f3: IDENTITY }),
    );
    expect(plan.steps.map((s) => s.follower).sort()).toEqual(["f1", "f2", "f3"]);
    expect(plan.steps.every((s) => s.kind === "RELEASE")).toBe(true);
  });

  it("⛔ a released follower is NOT re-baselined — its link is about to cease to exist", () => {
    // ⚠ Baselining it would leave a stale entry keyed to a dead link; harmless today and
    // exactly the sort of ghost that becomes a defect once the mate reads this map.
    const plan = resolvePioneerTurns([link("f", "p", "SNAPSHOT")], poses({ p: TURN, f: IDENTITY }));
    expect(plan.baselines.has("f")).toBe(false);
  });

  it("⭐ an UNMOVED Pioneer does nothing at all", () => {
    // ⛔ The rule must not fire on float noise — `PIONEER_TURN_EPSILON_RAD` guards that, and a
    // rule that fired every frame would release an alignment the instant it was made.
    const plan = resolvePioneerTurns([link("f", "p", "SNAPSHOT")], poses({ p: IDENTITY, f: IDENTITY }));
    expect(plan.steps).toEqual([]);
  });

  it("⛔⛔ AND A TURN IS COUNTED **ONCE** — the second call is quiet", () => {
    // ⭐⭐ THE VECTOR FOR THE MOST LIKELY CAUSE OF *"it fires repeatedly"* OR *"it fires once and
    // never again"*. ⚠ The plan returns new baselines; feeding them back must leave the next
    // call with nothing to do, or a single turn would re-release for ever.
    const orange = [link("f", "p", "FOLLOW")];
    const first = resolvePioneerTurns(orange, poses({ p: TURN, f: IDENTITY }));
    expect(first.steps.length).toBe(1);
    const rebased = orange.map((l) => ({ ...l, baseline: first.baselines.get(l.follower)! }));
    const second = resolvePioneerTurns(rebased, poses({ p: TURN, f: TURN }));
    expect(second.steps).toEqual([]);
  });
});

describe("⭐⭐⭐ THE CHAIN — P2 → P1 → F1, the owner's exact case", () => {
  it("⭐⭐⭐ P1 **ORANGE**: P2's turn rotates P1, AND CASCADES TO F1 — in one call", () => {
    // ⛔⛔ THE VECTOR THE WHOLE MODULE IS FOR. *"if P1 is orange, P2 rotation shall trigger
    // rotation of P1 which in turn shall cascade to rotation of F1."*
    // ⚠ The previous implementation compared each follower against a remembered pose once per
    // frame, so this unwound at ONE LINK PER FRAME. ⭐ Here it is a fixed point: P1 moves, which
    // makes P1 a changed Pioneer, which F1 then sees — within the same resolution.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW"), link("p1", "p2", "FOLLOW")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    const rotated = plan.steps.filter((s) => s.kind === "ROTATE").map((s) => s.follower);
    expect(rotated.sort()).toEqual(["f1", "p1"]);
    // ⭐ and F1 takes the SAME world rotation as P1, which is what keeps their normals parallel
    const f1 = plan.steps.find((s) => s.follower === "f1")!;
    const p1 = plan.steps.find((s) => s.follower === "p1")!;
    expect(f1.kind).toBe("ROTATE");
    expect(qAngle(qmul((f1 as { delta: Quat }).delta, IDENTITY))).toBeCloseTo(
      qAngle((p1 as { delta: Quat }).delta),
      9,
    );
  });

  it("⭐⭐⭐ P1 **BLUE**: P2's turn releases P1, AND F1 IS LEFT ALONE", () => {
    // ⛔⛔ THE OTHER HALF, AND IT IS THE SUBTLER ONE. *"if P1 is blue, P2 rotation shall release
    // the alignment of P1 with P2 but not the alignment of F1 with P1."*
    // ⭐⭐ It falls out of the geometry rather than needing a rule of its own: a `RELEASE` does
    // **not move the body**, so P1 is not a changed Pioneer and F1's baseline still holds.
    // ⚠ An implementation that released P1 *and* re-based F1, or that rotated P1 on the way
    // out, would break this — and nothing on the glass would explain why F1 dropped.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW"), link("p1", "p2", "SNAPSHOT")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "p1" }]);
    // ⛔ F1 is untouched: not rotated, not released
    expect(plan.steps.some((s) => s.follower === "f1")).toBe(false);
  });

  it("⭐⭐ A MIXED FAN: one Pioneer, one cyan and one orange follower", () => {
    // ⚠ Both consequences in the same instant, which is what a hand will actually do first.
    const plan = resolvePioneerTurns(
      [link("cy", "p", "SNAPSHOT"), link("or", "p", "FOLLOW")],
      poses({ p: TURN, cy: IDENTITY, or: IDENTITY }),
    );
    expect(plan.steps.find((s) => s.follower === "cy")!.kind).toBe("RELEASE");
    expect(plan.steps.find((s) => s.follower === "or")!.kind).toBe("ROTATE");
  });

  it("⭐⭐ A CASCADE THAT ENDS IN A RELEASE: P2 → P1 orange → F1 **cyan**", () => {
    // ⛔ P1 rotates, so F1's baseline for P1 DOES break — and F1 is cyan, so it releases.
    // ⚠ This is the case that distinguishes *"the release did not fire"* from *"the cascade did
    // not reach it"*, and the two are indistinguishable on the glass.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "SNAPSHOT"), link("p1", "p2", "FOLLOW")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    expect(plan.steps.find((s) => s.follower === "p1")!.kind).toBe("ROTATE");
    expect(plan.steps.find((s) => s.follower === "f1")!.kind).toBe("RELEASE");
  });

  it("⛔⛔ ORDER MATTERS AND IS GUARANTEED: the ROTATE precedes the RELEASE it caused", () => {
    // ⭐ The caller applies these in order. ⚠ Releasing F1 before rotating P1 would be harmless
    // here but is the sort of ordering that stops being harmless once a step reads the pose a
    // previous step wrote.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "SNAPSHOT"), link("p1", "p2", "FOLLOW")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    const iRotate = plan.steps.findIndex((s) => s.kind === "ROTATE");
    const iRelease = plan.steps.findIndex((s) => s.kind === "RELEASE");
    expect(iRotate).toBeLessThan(iRelease);
  });

  it("⭐ a THREE-deep orange chain resolves entirely, not one level per call", () => {
    const plan = resolvePioneerTurns(
      [
        link("d", "c", "FOLLOW"),
        link("c", "b", "FOLLOW"),
        link("b", "a", "FOLLOW"),
      ],
      poses({ a: BIG, b: IDENTITY, c: IDENTITY, d: IDENTITY }),
    );
    expect(plan.steps.map((s) => s.follower).sort()).toEqual(["b", "c", "d"]);
  });
});

describe("⛔ the cases that must not hang or corrupt", () => {
  it("⛔⛔ A CYCLE TERMINATES — A aligned to B, B aligned to A", () => {
    // ⭐⭐ `singleAlignment` makes this hard to reach by hand, and *hard to reach* is not
    // *unreachable*. ⚠ An uncapped fixed point on a cycle is a **hung render loop** — the worst
    // failure mode in this file, because the glass simply freezes with no error.
    expect(() =>
      resolvePioneerTurns(
        [link("a", "b", "FOLLOW"), link("b", "a", "FOLLOW")],
        poses({ a: TURN, b: IDENTITY }),
      ),
    ).not.toThrow();
  });

  it("⚠ a missing Pioneer neither releases nor rotates", () => {
    // ⛔ §1.4 stores a frozen world direction precisely so an alignment survives its Pioneer
    // being deleted, so a vanished Pioneer must not be read as a turn.
    const plan = resolvePioneerTurns([link("f", "gone", "SNAPSHOT")], poses({ f: IDENTITY }));
    expect(plan.steps).toEqual([]);
  });

  it("⚠ no links at all is an empty plan", () => {
    const plan = resolvePioneerTurns([], poses({}));
    expect(plan.steps).toEqual([]);
    expect(plan.baselines.size).toBe(0);
  });
});
