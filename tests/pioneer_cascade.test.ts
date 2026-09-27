/**
 * GOLDEN VECTORS — **THE TURN CASCADE, SINCE `FOLLOW` WAS DELETED** (`D106`, the owner, 2026-09-27:
 * *"OK"* to merging SNAPSHOT and FOLLOW).
 *
 * ⭐ Every alignment is a snapshot now: a turned Pioneer RELEASES its unseated followers and moves
 * none of them; a seated follower is the tree's and never reaches this resolver
 * (`followerLinksFrom`'s `isSeated`, vectored in `snap.test.ts`).
 *
 * ⛔ The `FOLLOW` vectors — the orange cascade, its composition order, the chain that rotated a
 * whole stack — are deleted with the rule they tested (`D28`/`D40`: *deleted, not disabled*).
 */
import { describe, expect, it } from "vitest";
import { resolvePioneerTurns, type FollowerLink } from "@input/pioneer_cascade";
import { IDENTITY, qFromAxisAngle, qmul, type Quat } from "@core/vec";
import type { ObjectId } from "@core/object_model";

const TURN = qFromAxisAngle([0, 1, 0], 0.4);
const poses = (m: Record<string, Quat>) => (id: ObjectId) => m[id] ?? null;
const link = (follower: string, pioneer: string, baseline: Quat = IDENTITY): FollowerLink => ({
  follower,
  pioneer,
  baseline,
});

describe("⭐⭐⭐ a turned Pioneer RELEASES its followers and moves none of them", () => {
  it("⭐ one follower: one RELEASE, and no baseline written for a link that is going", () => {
    // ⛔ RED against a resolver that rotates the follower (the deleted `FOLLOW` C2).
    const plan = resolvePioneerTurns([link("f", "p")], poses({ p: TURN, f: IDENTITY }));
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "f" }]);
    expect(plan.baselines.has("f")).toBe(false);
  });

  it("⭐ every follower of the turned Pioneer is released", () => {
    const plan = resolvePioneerTurns(
      [link("f1", "p"), link("f2", "p"), link("f3", "p")],
      poses({ p: TURN }),
    );
    expect(plan.steps.map((s) => s.follower)).toEqual(["f1", "f2", "f3"]);
  });

  it("⚠ an unturned Pioneer releases nothing and re-baselines the link", () => {
    const plan = resolvePioneerTurns([link("f", "p")], poses({ p: IDENTITY }));
    expect(plan.steps).toEqual([]);
    expect(plan.baselines.get("f")).toEqual(IDENTITY);
  });

  it("⛔ float noise under the epsilon is not a turn — nothing a hand did must not release", () => {
    const noise = qmul(qFromAxisAngle([0, 1, 0], 1e-6), IDENTITY);
    expect(resolvePioneerTurns([link("f", "p")], poses({ p: noise })).steps).toEqual([]);
  });
});

describe("⭐⭐ the chain P2 → P1 → F1, all snapshots", () => {
  it("⭐⭐ turning P2 releases P1 ONLY — P1 does not move, so F1 keeps its alignment", () => {
    // ⭐ The consequence of `D106`, stated so it is not rediscovered: with no `FOLLOW`, a release
    // moves nothing, so nothing downstream sees a turn. ⛔ RED against a resolver that cascades.
    const plan = resolvePioneerTurns(
      [link("f1", "p1"), link("p1", "p2")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "p1" }]);
    expect(plan.baselines.get("f1")).toEqual(IDENTITY);
  });
});

describe("⛔ the cases that must not hang or corrupt", () => {
  it("⛔ a Pioneer that cannot be read leaves its link alone — no step, no baseline", () => {
    const plan = resolvePioneerTurns([link("f", "gone")], poses({ f: IDENTITY }));
    expect(plan.steps).toEqual([]);
    expect(plan.baselines.size).toBe(0);
  });

  it("⛔ a ring a↔b (which `link` refuses to build) resolves in one pass without hanging", () => {
    const plan = resolvePioneerTurns(
      [link("a", "b"), link("b", "a")],
      poses({ a: TURN, b: TURN }),
    );
    expect(plan.steps.map((s) => s.follower).sort()).toEqual(["a", "b"]);
  });

  it("⚠ no links at all is an empty plan", () => {
    const plan = resolvePioneerTurns([], () => null);
    expect(plan.steps).toEqual([]);
    expect(plan.baselines.size).toBe(0);
  });
});
