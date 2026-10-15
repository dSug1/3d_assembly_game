/**
 * GOLDEN VECTORS — **A PIECE AT ITS GOAL IS SET EXACTLY ON IT** (2026-10-15, the owner: *"When a piece/part reaches its goal, set its transform to
 * perfectly match the goal transform so there is no misalignment of any sort."*). A piece is judged PLACED within margins (a grabbed part the snap's
 * 10 mm on the glass / 15°, the orbited piece 5 mm / 3°); a pull lands exactly, but a DISSOLVE set only its spin and a piece placed without a pull
 * kept its offset. Now every commit sets each placed piece exactly onto its goal (`goalSnaps`, `commitGoal`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Placed } from "../src/core/mate_connector";
import { goalSnaps } from "../src/input/goal_commit";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const at = (x: number, w = 1): Placed => ({ position: [x, 0, 0], orientation: [w, 0, Math.sqrt(Math.max(0, 1 - w * w)), 0] });

describe("⭐⭐⭐ a placed piece set exactly on its goal (2026-10-15)", () => {
  const targets = new Map<string, Placed>([["a", at(0)], ["b", at(1)], ["c", at(2)], ["floor", at(3)], ["green", at(4)]]);
  const poses = new Map<string, Placed>([["a", at(0.004)], ["b", at(1)], ["c", at(2, Math.cos(0.05))], ["floor", at(3.01)], ["green", at(4.003)]]);
  const depth = new Map<string, number>([["a", 1], ["c", 0]]);
  it("⭐⭐⭐ every placed piece OFF its goal by any amount is listed with its exact target — position or turn; one already exact is not", () => {
    const s = goalSnaps(["a", "b", "c"], (id) => targets.get(id) ?? null, (id) => poses.get(id) ?? null, () => false, (id) => depth.get(id) ?? 0);
    expect(s.map((x) => x.id)).toEqual(["c", "a"]); // b exact: nothing to do; the parent (depth 0) before its child (depth 1)
    expect(s.find((x) => x.id === "a")!.target).toEqual(at(0));
    expect(s.find((x) => x.id === "c")!.target).toEqual(at(2));
  });
  it("⭐⭐ a frozen body, or the orbited piece still in the orbit, is left alone (`skip`)", () => {
    const s = goalSnaps(["floor", "green", "a"], (id) => targets.get(id) ?? null, (id) => poses.get(id) ?? null, (id) => id === "floor" || id === "green", () => 0);
    expect(s.map((x) => x.id)).toEqual(["a"]);
  });
  it("⭐ a piece with no target or no pose is skipped", () => {
    expect(goalSnaps(["x"], () => null, () => at(0), () => false, () => 0)).toEqual([]);
    expect(goalSnaps(["a"], (id) => targets.get(id) ?? null, () => null, () => false, () => 0)).toEqual([]);
  });
  it("⭐⭐⭐ wired: every commit sets each placed piece on its exact goal, BEFORE the committed model is kept (no second commit), the capture's last pose updated (no second pull)", () => {
    const c = code("render/goal_commit_wiring.ts");
    expect(c).toContain("for (const s of goalSnaps(");
    expect(c).toContain("setModelPose(st, mesh, s.target, false);");
    expect(c).toContain("st.goalLastPose.set(s.id, s.target);");
    expect(c.indexOf("setModelPose(st, mesh, s.target, false);")).toBeLessThan(c.indexOf("st.goalCommitWorld = st.world;"));
    // the orbited piece moves with the orbit until it is placed
    expect(c).toContain("id === st.greenBox?.name && !st.orbitPiecePlaced");
  });
});
