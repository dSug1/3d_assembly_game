/**
 * GOLDEN VECTORS — **`D189`: THE GOAL IS COMMITTED WHEN AN ACTION COMPLETES** (the owner, 2026-09-30: *"an action which
 * results in a transform identical to the transform prior to the action, including the 180 degree rotation margin in this
 * scene, cannot trigger the message 'piece xxx reached its goal'"*; *"goal xx/yy shall be incremented / decremented only
 * after the action has completed (release of the input, or snap, etc.), not midway of a movement"*)
 * → `Claude/20_GAME_RULES/spec/LEVEL_END.md` §5bis.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { goalReport, type Pose } from "@core/goal";
import { qFromAxisAngle, qmul, scale, type Quat, type Vec3 } from "@core/vec";
import { GoalCommit } from "@input/goal_commit";
import { SCENE_1 } from "../src/content/scene_1";

const code = (f: string) =>
  readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

describe("⭐⭐⭐ `D189` — a piece REACHES its goal only if it was not placed at the last completed action", () => {
  it("⭐ the first commit is the baseline: the pieces placed at boot reached nothing", () => {
    const c = new GoalCommit();
    expect(c.never).toBe(true);
    expect(c.commit(["A", "B"], 3)).toEqual([]);
    expect([c.count, c.total]).toEqual([2, 3]);
  });

  it("⛔⛔ an action that leaves a placed piece placed says NOTHING (an alignment, a drag out and back, a half-turn)", () => {
    const c = new GoalCommit();
    c.commit(["A", "B"], 3);
    expect(c.commit(["A", "B"], 3)).toEqual([]);
  });

  it("⭐ a piece not placed before and placed now REACHED it; one that left is counted down, silently", () => {
    const c = new GoalCommit();
    c.commit(["A", "B"], 3);
    expect(c.commit(["A", "B", "C"], 3)).toEqual(["C"]);
    expect(c.count).toBe(3);
    expect(c.commit(["A", "C"], 3)).toEqual([]);
    expect(c.count).toBe(2);
    expect(c.commit(["A", "B", "C"], 3)).toEqual(["B"]); // back, at a LATER completed action: it reached it again
  });

  it("⭐⭐ `Scene_1`: a piece half-turned in its slot is still placed — its commit changes nothing, so no message", () => {
    const U = SCENE_1.unitM!;
    const at = (id: string): Vec3 => scale(SCENE_1.final!.bodies.find((b) => b.id === id)!.position as Vec3, U);
    const R: Quat = [1, 0, 0, 0];
    const poses = (over: Record<string, Pose> = {}) => (id: string) =>
      over[id] ?? (SCENE_1.final!.bodies.some((b) => b.id === id) ? { position: at(id), orientation: R } : null);
    const tol = { positionM: 0.01, angleRad: (15 * Math.PI) / 180 };
    const before = goalReport(SCENE_1.final!, U, poses(), tol);
    const flipped = goalReport(SCENE_1.final!, U, poses({ Piece10: { position: at("Piece10"), orientation: qmul(R, qFromAxisAngle([0, 1, 0], Math.PI)) } }), tol);
    const c = new GoalCommit();
    c.commit(before.inPlaceIds, before.total);
    expect(c.commit(flipped.inPlaceIds, flipped.total)).toEqual([]);
    expect(c.count).toBe(41);
  });
});

describe("⭐⭐ `D189` — wired: only the commit pops up, and the count shown is the committed one", () => {
  it("⛔ neither the goal pull nor the dissolve pops up on its own any more — they commit", () => {
    for (const f of ["goal_capture_wiring.ts", "goal_dissolve_wiring.ts"]) {
      expect(code(f)).not.toMatch(/showGoalPopup/);
      expect(code(f)).toMatch(/commitGoal\(st\)/);
    }
    expect(code("seat_wiring.ts")).toMatch(/commitGoal\(st\)/);
  });

  it("⭐ the scene at rest after a change commits — every frame, never mid-gesture; an undo commits silently", () => {
    expect(code("render_loop.ts")).toMatch(/goalCommitFrame\(st\)/);
    const w = code("goal_commit_wiring.ts");
    expect(w).toMatch(/st\.gestureSpan\.active === 0/);
    expect(w).toMatch(/st\.world === st\.goalCommitWorld/);
    expect(code("undo_wiring.ts")).toMatch(/st\.goalCommitQuiet = true/);
  });

  it("⭐ the HUD's `goal n/41` and the score bar read the COMMITTED count", () => {
    const p = code("hud_paint.ts");
    expect(p).toMatch(/inPlace: st\.goalCommit\.count/);
    expect(p).toMatch(/goal \$\{c\.count\}\/\$\{c\.total\}/);
  });
});
