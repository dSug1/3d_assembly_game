/**
 * GOLDEN VECTORS — **`D183`: THE GOAL CAPTURE** (the owner, 2026-09-30: *"piece2 should be able to reach its goal also
 * even if unaligned or aligned with other objects provided that its transform meets the goal transform within the same
 * position and roll margins as for the snap"*; *"Capture during a drag like snap. goal wins over snap"*; *"Loose, use the
 * capture margins"*; *"if a piece was never grabbed, the criteria shall restrict to 1mm on the glass and 1 degree"*;
 * identical pieces interchangeable, *"agreed"*) → `Claude/20_GAME_RULES/spec/LEVEL_END.md` §5.
 *
 * ⚠ Fixtures where the quantity is NOT zero: a turned, moved painting; a piece off by millimetres AND degrees.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { goalReport, type Pose } from "@core/goal";
import { add, IDENTITY, length, qAngle, qconj, qFromAxisAngle, qmul, qRotate, scale, sub, type Quat, type Vec3 } from "@core/vec";
import { GoalCapture, GoalPulls } from "@input/goal_capture";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";

const DEG = Math.PI / 180;
const U = SCENE_1.unitM!;
const FINAL = SCENE_1.final!;
/** The snap's margins at the boot camera (10 mm on the glass ≈ 26 mm of world at 1.5 m): generous, as a grabbed piece's are. */
const LOOSE = { positionM: 0.01, angleRad: 15 * DEG };
/** A never-grabbed piece's: 1 mm on the glass, 1°. */
const STRICT = { positionM: 0.001, angleRad: 1 * DEG };
const R: Quat = qFromAxisAngle([0, 1, 0], 37 * DEG);
const T: Vec3 = [0.4, 0.1, -0.6];
const at = (id: string): Vec3 => add(qRotate(R, scale(FINAL.bodies.find((b) => b.id === id)!.position as Vec3, U)), T);

/** The painting carried by (R, T), with some pieces overridden. */
const poses = (over: Record<string, Pose> = {}) => {
  const m = new Map<string, Pose>(FINAL.bodies.map((b) => [b.id, { position: at(b.id), orientation: R }]));
  for (const [id, p] of Object.entries(over)) m.set(id, p);
  return (id: string) => m.get(id) ?? null;
};

describe("⭐⭐⭐ `D183` — identical pieces are interchangeable", () => {
  it("⭐ Scene_1's four black 1.26 bars are one kind; a bar of another size is not", () => {
    const kind = (id: string) => FINAL.bodies.find((b) => b.id === id)!.kind;
    expect(new Set(["Piece22", "Piece26", "Piece29", "Piece38"].map(kind)).size).toBe(1);
    expect(kind("Piece23")).not.toBe(kind("Piece22"));
    expect(kind("Piece25")).not.toBe(kind("Piece22"));
  });

  it("⭐⭐ two twins SWAPPED: both in place, each on the other's slot — and without kinds, neither", () => {
    const swapped = poses({
      Piece22: { position: at("Piece29"), orientation: R },
      Piece29: { position: at("Piece22"), orientation: R },
    });
    const r = goalReport(FINAL, U, swapped, LOOSE);
    expect(r).toMatchObject({ met: true, inPlace: 41 });
    expect(r.bodies.get("Piece22")!.slotId).toBe("Piece29");
    expect(r.bodies.get("Piece29")!.slotId).toBe("Piece22");
    const noKinds = { ...FINAL, bodies: FINAL.bodies.map(({ kind: _k, ...b }) => b) };
    const r0 = goalReport(noKinds, U, swapped, LOOSE);
    expect(r0.inPlace).toBe(39);
    expect(r0.inPlaceIds).not.toContain("Piece22");
  });

  it("⛔ a twin is not moved off its own slot when it sits there — a tie keeps each on its own", () => {
    const r = goalReport(FINAL, U, poses(), LOOSE);
    for (const id of ["Piece22", "Piece26", "Piece29", "Piece38"]) expect(r.bodies.get(id)!.slotId).toBe(id);
  });
});

describe("⭐⭐⭐ `D183` — PLACED is loose once grabbed, strict before", () => {
  const off: Pose = { position: add(at("Piece10"), [0.004, 0, 0]), orientation: qmul(qFromAxisAngle([0, 0, 1], 6 * DEG), R) };

  it("⭐ 4 mm and 6° off: in place on the snap's margins, NOT on the never-grabbed ones", () => {
    expect(goalReport(FINAL, U, poses({ Piece10: off }), LOOSE).inPlaceIds).toContain("Piece10");
    const strict = goalReport(FINAL, U, poses({ Piece10: off }), LOOSE, (id) => (id === "Piece10" ? STRICT : LOOSE));
    expect(strict.inPlaceIds).not.toContain("Piece10");
    expect(strict.inPlace).toBe(40);
    expect(strict.worstId).toBe("Piece10");
  });

  it("⭐ the painting exact is in place even held to 1 mm / 1°", () => {
    expect(goalReport(FINAL, U, poses(), LOOSE, () => STRICT).met).toBe(true);
  });

  it("⭐⭐ the target is the EXACT goal pose — the nearest accepted turn (a half-turned piece stays half-turned)", () => {
    const flipped = qmul(qmul(qFromAxisAngle([0, 0, 1], 6 * DEG), R), qFromAxisAngle([0, 1, 0], Math.PI));
    const g = goalReport(FINAL, U, poses({ Piece10: { position: off.position, orientation: flipped } }), LOOSE).bodies.get("Piece10")!;
    expect(g.positionM).toBeCloseTo(0.004, 9);
    expect(g.angleRad).toBeCloseTo(6 * DEG, 9);
    expect(length(sub(g.target.position, at("Piece10")))).toBeLessThan(1e-9);
    expect(qAngle(qmul(g.target.orientation, qconj(qmul(R, qFromAxisAngle([0, 1, 0], Math.PI)))))).toBeLessThan(1e-9);
    // ⭐ Pulled there, it is in place at any strictness.
    const landed = goalReport(FINAL, U, poses({ Piece10: g.target }), LOOSE, () => STRICT);
    expect(landed.inPlaceIds).toContain("Piece10");
  });

  it("⛔⛔ the piece being judged does not bend its own frame — 33 mm and 8° off inside 40 mm margins, its target is the table", () => {
    // ⭐ Found in the real app: the fit's inlier cut was the placement margin, so a piece inside it pulled the frame and
    // landed 4.7 mm and 0.7° off the table. The cut is the fit's own (2 mm, or twice the median residual).
    const wide = { positionM: 0.04, angleRad: 15 * DEG };
    const p: Pose = { position: add(at("Piece2"), qRotate(R, [0, 0.001, -0.033])), orientation: qmul(R, qFromAxisAngle([0, 1, 0], 8 * DEG)) };
    const g = goalReport(FINAL, U, poses({ Piece2: p }), wide).bodies.get("Piece2")!;
    expect(length(sub(g.target.position, at("Piece2")))).toBeLessThan(1e-6);
    expect(qAngle(qmul(g.target.orientation, qconj(R)))).toBeLessThan(1e-6);
  });

  it("⭐ the tunables: 1 mm and 1° shipped, validated — never 0, never looser than a grabbed piece", () => {
    expect([DEFAULT_CONFIG.ungrabbedGoalMm, DEFAULT_CONFIG.ungrabbedGoalDeg]).toEqual([1, 1]);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, ungrabbedGoalMm: 0 })).toThrow(/ungrabbedGoalMm/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, ungrabbedGoalMm: DEFAULT_CONFIG.captureOffsetMm + 1 })).toThrow(/ungrabbedGoalMm/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, ungrabbedGoalDeg: 0 })).toThrow(/ungrabbedGoalDeg/);
    expect("goalPositionTolM" in DEFAULT_CONFIG || "goalAngleTolDeg" in DEFAULT_CONFIG).toBe(false);
  });
});

describe("⭐⭐⭐ `D183` — the capture fires on ENTRY, never on presence", () => {
  const see = (c: GoalCapture, inside: boolean, moved: boolean) => c.frame([{ id: "P", inside, moved }]);

  it("⛔ first seen INSIDE (the boot, after an undo): a drag within the margins captures nothing", () => {
    const c = new GoalCapture();
    expect(c.needsSight()).toBe(true);
    expect(see(c, true, false)).toEqual([]);
    expect(see(c, true, true)).toEqual([]);
  });

  it("⭐ outside, then MOVED in: captured; still inside after it: never again until it has left", () => {
    const c = new GoalCapture();
    see(c, false, false);
    expect(see(c, true, true)).toEqual(["P"]);
    c.captured("P");
    expect(see(c, true, true)).toEqual([]);
    see(c, false, true);
    expect(see(c, true, true)).toEqual(["P"]);
  });

  it("⛔ inside but NOT moved (a zoom, another piece's fit): no capture", () => {
    const c = new GoalCapture();
    see(c, false, false);
    expect(see(c, true, false)).toEqual([]);
  });

  it("⭐ a blocked capture stays PENDING while the piece stays inside, moving or not — and drops when it leaves", () => {
    const c = new GoalCapture();
    see(c, false, false);
    expect(see(c, true, true)).toEqual(["P"]);
    expect(see(c, true, false)).toEqual(["P"]);
    expect(c.hasPending()).toBe(true);
    see(c, false, false);
    expect(c.hasPending()).toBe(false);
  });

  it("⭐ a pull cancelled in flight is re-offered; `forget` re-sights everything", () => {
    const c = new GoalCapture();
    see(c, false, false);
    see(c, true, true);
    c.captured("P");
    c.retry("P");
    expect(see(c, true, false)).toEqual(["P"]);
    c.forget();
    expect(c.needsSight()).toBe(true);
    expect(see(c, true, true)).toEqual([]);
  });
});

describe("⭐⭐ `D183` — the pull lands EXACTLY on the goal pose", () => {
  it("⭐ position lerped, orientation slerped, the last step the target itself", () => {
    const p = new GoalPulls();
    const from: Pose = { position: [0, 0, 0], orientation: IDENTITY };
    const to: Pose = { position: [0.02, 0, 0], orientation: qFromAxisAngle([0, 1, 0], 10 * DEG) };
    p.start("P", from, to, 0);
    const mid = p.advance(30, 60, (u) => u)[0]!;
    expect(mid.done).toBe(false);
    expect(mid.pose.position[0]).toBeCloseTo(0.01, 9);
    expect(qAngle(mid.pose.orientation)).toBeCloseTo(5 * DEG, 9);
    const end = p.advance(60, 60, (u) => u)[0]!;
    expect(end).toEqual({ id: "P", pose: to, done: true });
    expect(p.size).toBe(0);
  });
});

describe("⭐⭐ `D183` — wired: before the seats, a press grabs, an undo re-sights", () => {
  const src = (f: string) => readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8");

  it("⭐ the goal wins: its frame runs BEFORE `syncSeats`", () => {
    const loop = src("render_loop.ts");
    expect(loop.indexOf("goalCaptureFrame(st, now)")).toBeGreaterThan(0);
    expect(loop.indexOf("goalCaptureFrame(st, now)")).toBeLessThan(loop.indexOf("syncSeats(st, now)"));
  });

  it("⭐ a press marks its body grabbed; an undo forgets the arming and drops the pulls", () => {
    expect(src("pointer_wiring.ts")).toMatch(/st\.grabbed\.add\(rawHitId\)/);
    const undo = src("undo_wiring.ts");
    expect(undo).toMatch(/st\.goalCapture\.forget\(\)/);
    expect(undo).toMatch(/st\.goalPulls\.cancel\(id\)/);
  });

  it("⭐ one set of margins everywhere: the HUD, the dissolve and the level end read `goalTolOf`", () => {
    for (const f of ["hud_paint.ts", "goal_dissolve_wiring.ts", "level_end_wiring.ts"]) expect(src(f)).toMatch(/goalTolOf\(st\)/);
    expect(src("level_end_wiring.ts")).toMatch(/st\.goalPulls\.size > 0/);
  });

  it("⛔ a dissolve is its capture — one pop-up, not two (found in the real app)", () => {
    expect(src("goal_dissolve_wiring.ts")).toMatch(/releaseAlignmentOf\(st, f\);[\s\S]{0,200}st\.goalCapture\.captured\(f\)/);
  });

  it("⭐ a start blocked on the way WAITS — the snap's own path check", () => {
    expect(src("goal_capture_wiring.ts")).toMatch(/snapPathBlockedBy\(st\.world, id, g\.target/);
  });
});
