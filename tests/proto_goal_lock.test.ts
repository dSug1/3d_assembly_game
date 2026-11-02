/**
 * ⭐⭐⭐ prototype (green box) — A PIECE IN ITS GOAL CANNOT BE MOVED (the owner, 2026-10-01). `input/goal_lock.ts`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { goalLocked } from "../src/input/goal_lock";
import { GoalCommit } from "../src/input/goal_commit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ prototype — a piece in its goal cannot be moved", () => {
  it("⭐ locked = placed at the last COMMIT, and the lock is on", () => {
    const c = new GoalCommit();
    c.commit(["Piece1", "Piece2"], 41); // the boot baseline
    expect(goalLocked("Piece1", c, true)).toBe(true);
    expect(goalLocked("Piece3", c, true)).toBe(false); // not placed: free
    expect(goalLocked(undefined, c, true)).toBe(false); // a press on no piece
    expect(goalLocked("Piece1", c, false)).toBe(false); // ⭐ re-enabled: the lock off
    // a piece dragged INTO its goal is free until its action completes — then locked
    c.commit(["Piece1", "Piece2", "Piece3"], 41, new Set(["Piece3"]));
    expect(goalLocked("Piece3", c, true)).toBe(true);
    // ⭐ an undo that takes it out commits it out — free again
    c.commit(["Piece1", "Piece2"], 41, new Set(["Piece3"]));
    expect(goalLocked("Piece3", c, true)).toBe(false);
    expect(new GoalCommit().has("Piece1")).toBe(false); // nothing committed yet
  });

  it("⭐ on by default, with a 0/1 switch in OBJECT TRANSLATION — the methods it gates are intact", () => {
    expect(DEFAULT_CONFIG.lockPlacedPieces).toBe(1);
    expect(code("render/tuning_menu.ts")).toMatch(/"lockPlacedPieces", 0, 1, 1\)/);
  });

  it("⭐⭐ wired: a placed part is where a tap moves the gizmo — the first touch's and the held second's (⛔ 2026-11-02: the drag, the second finger and the alignment it gated are deleted with the parts' translation, rotation and alignment, `d8134eb`)", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("goalLocked(hitId, st.goalCommit, st.cfg.lockPlacedPieces === 1), hitAt);");
    expect(p).toContain("const onPlaced = e.pointerId !== MOUSE_SECOND_ID && hitId !== undefined && goalLocked(hitId, st.goalCommit, st.cfg.lockPlacedPieces === 1);");
    expect(p).not.toContain("lockedInGoal");
  });
});
