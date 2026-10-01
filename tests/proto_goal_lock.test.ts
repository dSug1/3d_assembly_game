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

  it("⭐⭐ wired at the three gates: the holder's drag, the second finger, the alignment's FOLLOWER", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/const lockedInGoal = goalLocked\(st\.idOf\.get\(grip\.mesh\), st\.goalCommit, st\.cfg\.lockPlacedPieces === 1\);/);
    expect(p).toMatch(/if \(lockedInGoal \|\| unsnapHolds\(/);
    const d = code("render/drive.ts");
    const depth = d.slice(d.indexOf("export function applyDepthDrag"));
    expect(depth.indexOf("goalLocked(st.idOf.get(grip.mesh), st.goalCommit")).toBeGreaterThan(0);
    expect(depth.indexOf("goalLocked(")).toBeLessThan(depth.indexOf("new MotionTracker"));
    const a = code("render/alignment_wiring.ts");
    expect(a).toMatch(/if \(goalLocked\(followerId, st\.goalCommit, st\.cfg\.lockPlacedPieces === 1\)\) \{/);
    // ⭐ only a drag ON the piece: the translation step itself is not gated — a seated assembly still carries it
    const step = d.slice(d.indexOf("export function applyWorldStep"), d.indexOf("export function applyDepthStep"));
    expect(step).not.toMatch(/goalLocked/);
  });
});

describe("⭐ prototype — the HitFace's fuchsia contour is toggled OFF, not deleted", () => {
  it("⭐ ships hidden; a 0/1 switch in FOLLOWERFACE draws it again; the drawing is gated, the HitFace itself untouched", () => {
    expect(DEFAULT_CONFIG.showHitFaceContour).toBe(0);
    expect(code("render/tuning_menu.ts")).toContain('"showHitFaceContour", 0, 1, 1)');
    const loop = code("render/render_loop.ts");
    expect(loop).toContain("if (hitFace !== null && st.cfg.showHitFaceContour === 1) {");
    expect(loop).toContain("m.loop.color.copyFrom(CANDIDATE_COLOUR)"); // the method is intact
    expect(loop).toContain("const hitFace = hitFaceNow(st);");
  });
});
