/**
 * GOLDEN VECTORS — **`D190`: A PIECE NOBODY MOVED NEVER CHANGES STATUS** (the owner, 2026-09-30: *"the bug message was all
 * 'piece XXX reached its goal' next to each other on one single row on the screen … Do a better and deeper analysis"*;
 * *"why a one piece move would trigger the check on goal for all other pieces?"*) → `LEVEL_END.md` §5ter.
 *
 * ⭐ Found by a SEARCH, not by reasoning: random play on the real goal check (pieces sent anywhere in the play volume, set
 * home exactly, half-turned, loosely, or into a free twin's slot), flagging every step where a piece that was NOT moved
 * changed status. Three causes: the frame fit stopped refitting on a same-size set, loose pieces voted in the frame, and a
 * far piece could steal a loose twin's slot. ⭐ And the rule that makes it impossible whatever the fit does: only the
 * pieces an action moved are re-judged.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { goalReport, type Pose } from "@core/goal";
import { makeWorld, setWorldPlacement } from "@core/object_model";
import { IDENTITY, qFromAxisAngle, qmul, scale, type Vec3 } from "@core/vec";
import { GoalCommit, piecesMoved } from "@input/goal_commit";
import { SCENE_1 } from "../src/content/scene_1";

const U = SCENE_1.unitM!;
const FINAL = SCENE_1.final!;
const IDS = FINAL.bodies.map((b) => b.id);
const goalPos = (id: string): Vec3 => scale(FINAL.bodies.find((b) => b.id === id)!.position as Vec3, U);
const kindOf = (id: string) => FINAL.bodies.find((b) => b.id === id)!.kind;
const TOL = { positionM: 0.04, angleRad: (15 * Math.PI) / 180 };

/** A seeded generator (mulberry32) — the search is the same every run. */
function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bootPoses(): Map<string, Pose> {
  const m = new Map<string, Pose>();
  for (const b of SCENE_1.bodies) {
    if (b.frozen) continue;
    const yaw = typeof b.orientation === "object" && "yawDeg" in b.orientation ? b.orientation.yawDeg : 0;
    m.set(b.id, { position: scale(b.position as Vec3, U), orientation: qFromAxisAngle([0, 1, 0], (yaw * Math.PI) / 180) });
  }
  return m;
}

/** ⭐ Random play; returns how many steps flipped a piece that was NOT moved, in the raw goal report. */
function search(seed: number, games: number, steps: number): number {
  const rnd = rng(seed);
  let flips = 0;
  for (let game = 0; game < games; game++) {
    const poses = bootPoses();
    const occupied = (slotOf: string, except: string) =>
      [...poses.entries()].some(([k, q]) => k !== except && Math.hypot(...(q.position.map((v, i) => v - goalPos(slotOf)[i]!) as [number, number, number])) < 0.05);
    let prev = new Set(goalReport(FINAL, U, (id) => poses.get(id) ?? null, TOL).inPlaceIds);
    for (let step = 0; step < steps; step++) {
      const id = IDS[Math.floor(rnd() * IDS.length)]!;
      const r = rnd();
      let p: Pose | null = null;
      if (r < 0.35 && !occupied(id, id)) p = { position: goalPos(id), orientation: IDENTITY };
      else if (r < 0.45 && !occupied(id, id)) p = { position: goalPos(id), orientation: qFromAxisAngle([0, 1, 0], Math.PI) };
      else if (r < 0.6 && !occupied(id, id))
        p = {
          position: goalPos(id).map((v) => v + (rnd() - 0.5) * 0.06) as unknown as Vec3,
          orientation: qFromAxisAngle([0, 0, 1], (rnd() - 0.5) * 0.35),
        };
      else if (r < 0.7) {
        const twin = IDS.find((x) => x !== id && kindOf(x) === kindOf(id) && !occupied(x, id));
        if (twin !== undefined) p = { position: goalPos(twin), orientation: IDENTITY };
      } else if (r >= 0.7)
        p = {
          position: [(rnd() - 0.5) * 2, rnd(), (rnd() - 0.5) * 2],
          orientation: qmul(qFromAxisAngle([0, 1, 0], rnd() * 6.28), qFromAxisAngle([1, 0, 0], rnd() * 6.28)),
        };
      if (p === null) continue;
      poses.set(id, p);
      const now = new Set(goalReport(FINAL, U, (x) => poses.get(x) ?? null, TOL).inPlaceIds);
      if (IDS.some((x) => x !== id && prev.has(x) !== now.has(x))) flips++;
      prev = now;
    }
  }
  return flips;
}

describe("⭐⭐⭐ `D190` — the relative frame no longer moves when a far or loose piece does", () => {
  it("⭐⭐ random play (seeds 1, 8, 25 — 300 games × 40 moves each): no piece that was NOT moved changes status", () => {
    // ⛔ RED on the old code (10 flips at seed 1) and against each fix removed: the fit's same-SIZE stop (a 22° then
    // 10.6° tilt with two pieces a metre away — nine untouched pieces un-placed; 4 at seed 1), the uncapped twin matching
    // (a far piece stealing a loose twin's slot; 4 at seed 1), the exact-core stage (loose pieces voting; seeds 8, 25).
    // ⚠ Not every seed is clean without the commit rule below: a piece exactly at its margin's edge can still tip when
    // the frame is refitted (seeds 10, 18) — which is why only the pieces an action moved are re-judged.
    expect([1, 8, 25].map((seed) => search(seed, 300, 40))).toEqual([0, 0, 0]);
  });
});

describe("⭐⭐⭐ `D190` — only the pieces an action MOVED are re-judged", () => {
  it("⭐ an untouched piece keeps its committed status, whatever the live report says", () => {
    const c = new GoalCommit();
    c.commit(["A", "B", "C"], 4);
    // the live report lost B (a frame refit) and gained D, but only D moved
    expect(c.commit(["A", "C", "D"], 4, new Set(["D"]))).toEqual(["D"]);
    expect(c.count).toBe(4);
    // B moved away: it is re-judged, and leaves
    expect(c.commit(["A", "C", "D"], 4, new Set(["B"]))).toEqual([]);
    expect(c.count).toBe(3);
  });

  it("⭐ a single move can reach at most the pieces it moved — never a row of untouched ones", () => {
    const c = new GoalCommit();
    c.commit([], 5);
    expect(c.commit(["A", "B", "C", "D"], 5, new Set(["A"]))).toEqual(["A"]);
  });

  it("⭐ `piecesMoved`: the pieces whose world pose differs between two models", () => {
    const w0 = makeWorld(
      ["A", "B"].map((id) => ({ id, local: { position: [0, 0, 0] as Vec3, orientation: IDENTITY }, parent: null, faces: [], connectors: [], constraints: [], frozen: false })),
    );
    const w1 = setWorldPlacement(w0, "B", { position: [0.01, 0, 0], orientation: IDENTITY });
    expect([...piecesMoved(w0, w1, ["A", "B"])]).toEqual(["B"]);
    expect(piecesMoved(w0, w0, ["A", "B"]).size).toBe(0);
  });

  it("⭐ wired: every commit passes the pieces moved since the last one", () => {
    const src = readFileSync(new URL("../src/render/goal_commit_wiring.ts", import.meta.url), "utf8");
    expect(src).toMatch(/piecesMoved\(st\.goalCommitWorld, st\.world,/);
    expect(src).toMatch(/st\.goalCommit\.commit\(r\.inPlaceIds, r\.total, moved\)/);
  });
});
