/**
 * GOLDEN VECTORS — **THE ORBITED PIECES' GOALS** (2026-10-14, `LEVEL_END.md` §5quater) — carried from `hover.test.ts` (deleted with the slide, 2026-11-12):
 * the goals on Piece4's top, their symmetries, the live count, the JSON seam, the margins in the world.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ the orbited pieces' GOALS and their capture (2026-10-14: *\"goal capture also applies to orbited piece during orbit and quad rotation\"* → *\"Yes, centred\"*, *\"Centred\"*, *\"Counts (x/42)\"*, *\"Piece stays placed\"*)", () => {
  it("⭐⭐ centred on Piece4's top face, flush on its CONTOUR — derived from the meshes' own sizes", async () => {
    const { SCENE_1 } = await import("../src/content/scene_1");
    const { greenPyramidSizeM, turquoiseSizeM } = await import("../src/input/green_box");
    const p4 = SCENE_1.final!.bodies.find((b) => b.id === "Piece4")!;
    const p17 = SCENE_1.bodies.find((b) => b.id === "Piece17")!;
    const { SCENE_1_CONTOUR_MARGIN } = await import("../src/content/scene_1");
    // ⭐⭐ (the hover's audit) flush on Piece4's CONTOUR — the surface a piece touches — not on its coloured core 1.5 mm inside it
    const top = p4.position[1] + 0.82 / 2 + SCENE_1_CONTOUR_MARGIN;
    const green = greenPyramidSizeM(p17.dims, 1); // in the table's units
    const g = SCENE_1.orbitGoals!.find((b) => b.id === "green-box")!;
    expect(g.position[0]).toBe(p4.position[0]);
    expect(g.position[2]).toBe(p4.position[2]);
    expect(g.position[1]).toBeCloseTo(top + green[1] / 2, 12); // wide face down, flush
    expect(g.symmetry).toBe("yawHalfTurns");
    const t = SCENE_1.orbitGoals!.find((b) => b.id === "turquoise-piece")!;
    expect(t.position[1]).toBeCloseTo(top + turquoiseSizeM(green).lengthM / 2, 12); // standing
    expect(t.symmetry).toBe("hexPrism");
  });

  it("⭐⭐ the symmetries: the green piece never upside down; the turquoise every sixth of a turn, either end up", async () => {
    const { acceptedOrientations } = await import("../src/core/goal");
    const { IDENTITY, qRotate } = await import("../src/core/vec");
    const yaw = acceptedOrientations(IDENTITY, "yawHalfTurns");
    expect(yaw).toHaveLength(2);
    for (const q of yaw) expect(qRotate(q, [0, 1, 0])[1]).toBeCloseTo(1, 12); // up stays up
    const hex = acceptedOrientations(IDENTITY, "hexPrism");
    expect(hex).toHaveLength(12);
    expect(hex.some((q) => Math.abs(qRotate(q, [1, 0, 0])[0] - Math.cos(Math.PI / 3)) < 1e-12)).toBe(true); // a sixth of a turn
    expect(hex.some((q) => qRotate(q, [0, 1, 0])[1] < -0.999)).toBe(true); // the other end up
  });

  it("⭐⭐ the goal LIVE counts the SHOWN orbited piece only (x/42) — the hidden one never; the demo plays without them", async () => {
    const { liveFinalOf } = await import("../src/core/goal");
    const { SCENE_1 } = await import("../src/content/scene_1");
    const { SCENE1_DEMO } = await import("../src/content/scene1_demo");
    const f = SCENE_1.final!;
    expect(liveFinalOf(f, SCENE_1.orbitGoals, "green-box").bodies.map((b) => b.id)).toEqual([...f.bodies.map((b) => b.id), "green-box"]);
    expect(liveFinalOf(f, SCENE_1.orbitGoals, "turquoise-piece").bodies.length).toBe(f.bodies.length + 1);
    expect(liveFinalOf(f, SCENE_1.orbitGoals, null)).toBe(f);
    expect(SCENE1_DEMO.orbitGoals).toBeUndefined();
  });

  it("⭐ they survive the JSON seam", async () => {
    const { parseSceneDescriptor, serializeSceneDescriptor } = await import("../src/core/game_structure");
    const { SCENE_1 } = await import("../src/content/scene_1");
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).orbitGoals).toEqual(SCENE_1.orbitGoals);
  });

  it("⭐ wired: the live goal everywhere; the orbited piece judged by its own margins; captured, it leaves the orbit and stays", () => {
    const g = code("render/goal_capture_wiring.ts");
    expect(g).toContain("return f === null ? null : liveFinalOf(f, st.sceneSpec.orbitGoals, st.greenBox?.name ?? null);");
    // ⭐ (the hover's second audit) the dead "always grabbed" line removed: `goalTolOf` answers the orbited piece's own margins first
    expect(g).not.toContain("st.grabbed.add(st.greenBox.name)");
    expect(g).toContain("return (id) => (id === shown && st.sceneSpec.orbitGoals !== undefined ? orbited : strict);");
    expect(g).toContain("if (id === st.greenBox?.name) st.orbitPiecePlaced = true;");
    expect(code("render/level_end_wiring.ts")).toContain("const final = liveFinal(st);"); // ⛔ (2026-11-02) the dissolve deleted (`d8134eb`)
    const w = code("render/green_box_wiring.ts");
    expect(w).toContain("if (!st.orbitPiecePlaced) box.position.set(pp[0], pp[1], pp[2]);");
    expect(w).toContain("st.orbitPiecePlaced = false; // ⭐ (2026-10-14) a switch or a respawn brings a piece back to the orbit");
  });
});

describe("⭐⭐ the orbited piece's goal margins IN THE WORLD (2026-10-14, the owner: *\"the green piece is declared having achieved its goal: this is wrong: not centered, not aligned in quad rotation\"*)", () => {
  it("⭐⭐⭐ off-centre by 2 cm or turned 10° is NOT placed (⛔ a grabbed part's margins: 182 mm on the glass at 4.25 m, 15°) — the goal pose 1 mm above is", async () => {
    const { goalReport, liveFinalOf, orbitGoalTolerance } = await import("../src/core/goal");
    const { SCENE_1 } = await import("../src/content/scene_1");
    const { IDENTITY, qFromAxisAngle } = await import("../src/core/vec");
    const u = SCENE_1.unitM ?? 1;
    const final = liveFinalOf(SCENE_1.final!, SCENE_1.orbitGoals, "green-box");
    const at = new Map(final.bodies.map((b) => [b.id, { position: [b.position[0] * u, b.position[1] * u, b.position[2] * u] as Vec3, orientation: IDENTITY }]));
    const loose = { positionM: 0.18, angleRad: (15 * Math.PI) / 180 }; // a grabbed part's, as measured headless
    const orbit = orbitGoalTolerance(DEFAULT_CONFIG.orbitGoalMm, DEFAULT_CONFIG.orbitGoalDeg);
    const placed = (dx: number, yawDeg: number) => {
      const g = at.get("green-box")!;
      const pose = { position: [g.position[0] + dx, g.position[1] + 0.001, g.position[2]] as Vec3, orientation: qFromAxisAngle([0, 1, 0], (yawDeg * Math.PI) / 180) };
      const r = goalReport(final, u, (id) => (id === "green-box" ? pose : at.get(id) ?? null), loose, (id) => (id === "green-box" ? orbit : loose));
      return r.inPlaceIds.includes("green-box");
    };
    expect(placed(0, 0)).toBe(true);
    expect(placed(0.02, 0)).toBe(false);
    expect(placed(0, 10)).toBe(false);
    expect(placed(0, 180)).toBe(true); // its half-turn looks the same
    // ⛔ by a grabbed part's margins it read as placed
    const asPart = goalReport(final, u, (id) => (id === "green-box" ? { position: [at.get("green-box")!.position[0] + 0.02, at.get("green-box")!.position[1], at.get("green-box")!.position[2]] as Vec3, orientation: IDENTITY } : at.get(id) ?? null), loose);
    expect(asPart.inPlaceIds.includes("green-box")).toBe(true);
  });
  it("⭐ wired: the shown orbited piece judged by its own margins", () => {
    expect(code("render/goal_capture_wiring.ts")).toContain('return (id) => (id === shown && st.sceneSpec.orbitGoals !== undefined ? orbited : strict);');
  });
});
