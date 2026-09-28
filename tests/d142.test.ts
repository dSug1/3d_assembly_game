/**
 * GOLDEN VECTORS — **`D142`: a seated follower in its goal pose dissolves its couple** (the owner,
 * 2026-09-28), and the goal check names the pieces in place.
 */
import { describe, expect, it } from "vitest";
import { followersToDissolve } from "@input/goal_dissolve";
import { goalReport, type Pose } from "@core/goal";
import { IDENTITY, add, scale, type Vec3 } from "@core/vec";
import { SCENE_1 } from "../src/content/scene_1";

const U = SCENE_1.unitM!;
const FINAL = SCENE_1.final!;
const TOL = { positionM: 0.005, angleRad: (5 * Math.PI) / 180 };

describe("⭐⭐⭐ `D142` — followersToDissolve", () => {
  it("⭐ a SEATED follower that the goal check has in place dissolves (RED: nothing dissolved)", () => {
    expect(followersToDissolve(["Piece10"], new Set(["Piece10", "Piece4"]))).toEqual(["Piece10"]);
  });

  it("⛔ a seated follower NOT in place keeps its couple", () => {
    expect(followersToDissolve(["Piece10"], new Set(["Piece4"]))).toEqual([]);
  });

  it("⛔ only seated followers are asked — an in-place body that has not snapped is not a couple to dissolve", () => {
    expect(followersToDissolve([], new Set(["Piece10"]))).toEqual([]);
  });
});

describe("⭐ goalReport names the pieces in place", () => {
  it("⭐ at the table all 41 are named; one moved piece is left out", () => {
    const at = (id: string, shift: Vec3 = [0, 0, 0]): Pose | null => {
      const g = FINAL.bodies.find((b) => b.id === id);
      return g ? { position: add(scale(g.position as Vec3, U), shift), orientation: IDENTITY } : null;
    };
    const all = goalReport(FINAL, U, (id) => at(id), TOL);
    expect(all.inPlaceIds).toHaveLength(41);
    const one = goalReport(FINAL, U, (id) => at(id, id === "Piece10" ? [0.02, 0, 0] : [0, 0, 0]), TOL);
    expect(one.inPlaceIds).toHaveLength(40);
    expect(one.inPlaceIds.includes("Piece10")).toBe(false);
    expect(one.inPlace).toBe(one.inPlaceIds.length);
  });
});
