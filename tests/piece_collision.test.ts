/**
 * GOLDEN VECTORS — prototype: **THE ORBITED PIECE COLLIDES** (`COLLISION.md` §11, rebuilt §12 on 2026-10-13 after the audit: *"Build"*). The
 * solver itself is vectored in `piece_orbit_solver.test.ts`; here: the rule's setup, the piece as an obstacle, the wiring of the one solve a
 * frame, the turns, stuck, the pop-up and the respawn.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { boundsFromShapes, clearance, hullAtSpawn, nearestObstacle, resolveMove, type CollisionSetup, type CollisionShapeSource } from "@core/collision";
import { boxShape } from "@core/collision_shape";
import { makeWorld, type SceneObject } from "@core/object_model";
import { IDENTITY, type Vec3 } from "@core/vec";
import { blockedMessage, pieceRespawnArmed } from "../src/input/piece_orbit_solver";
import { orbitTargetOnRelease } from "../src/input/goal_lock";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { UI_THEMES } from "../src/content/ui_themes";
import { themeProblems } from "../src/core/ui_theme";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const flat = (f: string) => code(f).replace(/\s+/g, " ");

const body = (id: string, at: Vec3, dims: [number, number, number], extra: Partial<SceneObject> = {}): SceneObject => ({
  id,
  local: { position: at, orientation: IDENTITY },
  parent: null,
  faces: [],
  connectors: [],
  constraints: [],
  shape: boxShape(dims),
  ...extra,
});

describe("⭐⭐⭐ the rule is `resolveMove`'s, with the piece's own setup — parts block, the frozen floor never does", () => {
  const piece = body("piece", [0, 0.3, 0], [0.1, 0.1, 0.1], { orbited: true });
  const part = body("part", [0.3, 0.3, 0], [0.1, 0.1, 0.1]);
  const floor = body("floor", [0, 0, 0], [2, 0.05, 2], { frozen: true });
  const w = makeWorld([piece, part, floor]);
  const pieceSetup: CollisionSetup = {
    shapes: hullAtSpawn,
    bounds: boundsFromShapes(hullAtSpawn),
    skinM: 0.001,
    exempt: (a, b) => w.objects.get(a)?.frozen === true || w.objects.get(b)?.frozen === true,
  };
  it("⭐ the MOVING orbited piece is stopped by a part (an orbited body is skipped only as an OBSTACLE)", () => {
    const v = resolveMove(w, "piece", { position: [0.3, 0.3, 0], orientation: IDENTITY }, pieceSetup);
    expect(v.blockedBy).toBe("part");
    expect(v.placed.position[0]).toBeLessThan(0.21);
  });
  it("⭐ the frozen floor never blocks it (its 3rd and 4th rings pass under the floor)", () => {
    const v = resolveMove(w, "piece", { position: [0, -0.5, 0], orientation: IDENTITY }, pieceSetup);
    expect(v.blockedBy).toBeNull();
  });
  it("⭐⭐ (2026-10-13, *\"Build case 3\"*) the orbited piece IS another body's obstacle: a part moved into it stops", () => {
    const v = resolveMove(w, "part", { position: [0, 0.3, 0], orientation: IDENTITY }, pieceSetup);
    expect(v.blockedBy).toBe("piece");
  });
  it("⭐ the wiring: the shown piece an obstacle, the hidden one exempt (`hiddenOrbited`) — for the parts and for the piece", () => {
    const c = flat("render/collision_wiring.ts");
    expect(c).toContain("if (hiddenOrbited(st, a) || hiddenOrbited(st, b)) return true;");
    expect(c).toContain("const hiddenOrbited = (st: SceneState, id: ObjectId): boolean => st.world.objects.get(id)?.orbited === true && id !== st.greenBox?.name;");
    expect(code("core/collision.ts")).not.toContain("if (world.objects.get(o)?.orbited === true) continue;");
  });
});

describe("⭐⭐ wired — the orbit step, the turns, the red quad", () => {
  it("⭐ the piece's setup: no play volume, the frozen bodies exempt", () => {
    const c = flat("render/collision_wiring.ts");
    expect(c).toContain("return { shapes: SHAPES, bounds: BOUNDS, skinM: skin, bisectIterations: 8, exempt: (a, b) => frozen(a) || frozen(b) || hiddenOrbited(st, a) || hiddenOrbited(st, b) };");
  });
  it("⭐⭐ a turn checked WHOLE before it starts — the align and the roll refused when blocked (nothing changes, no episode)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const blockedBy = pieceTurnBlocker(st, base); if (blockedBy !== null) { st.pinkTargetNormal = pinkWas;");
    expect(g).toContain("const blockedBy = pieceTurnBlocker(st, roll.q); if (blockedBy !== null) {");
  });
  it("⭐⭐ *\"highlight the quad in red instead of yellow and back to yellow when rotation is allowed again\"* — its tap's turn checked (at most every 100 ms)", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("const q = restingPreview(st, dir, roll); qc.blockedBy = q === null ? null : pieceTurnBlocker(st, q);");
    expect(c).toContain("x.edges.color = lit ? (st.quadTurnCheck.blockedBy !== null || st.restAlignHeld ? QUAD_BLOCKED : QUAD_LIT) : QUAD_EDGE;"); // ⭐ red while held too (the third audit)
    expect(c).toContain('r ? [r.w, r.x, r.y, r.z].map((x) => x.toFixed(4)).join(",") : "", sceneSignature(st)].join("|");'); // ⭐ re-judged when a part moves
    expect(c).toContain("const QUAD_CHECK_MS = 100;");
  });
});

describe("⭐⭐⭐ §12 — ONE SOLVE A FRAME, ONE AUTHORITY (2026-10-13, the audit's rebuild → *\"Build\"*)", () => {
  it("⭐⭐⭐ the piece's place is SOLVED from where it is toward the orbit's target, and the camera is driven by the solved place", () => {
    const g = flat("render/green_box_wiring.ts");
    // ⭐ (the second audit) the frame DECIDED in `orbitFrame` (vectored on behaviour in piece_orbit_solver.test.ts); the render applies it
    expect(g).toContain("const fr = orbitFrame( { q: st.pieceQ, target: rig, userV: st.orbitUserV, prevRaw: st.orbitRawPrev }, env, opt, { stepM: RELOCATE_STEP_M, maxM: RELOCATE_MAX_M, from: st.relocateCursor.from }, );");
    expect(g).toContain("if (!sameQ(fr.target, rig)) st.orbit.reset(fr.target.yaw, fr.target.v); if (fr.stopCoast) st.orbitInertia.stop();");
    expect(g).toContain("st.pieceQ = fr.q; rig = { ...fr.q };");
    // ⛔ the layers it replaces: the target guard, the safety net on the spring, the held anchor, the unlock, the clock budget
    expect(g).not.toMatch(/guardOrbitPath|guardOrbitStep|heldAnchor|pieceUnlocked|GUARD_BUDGET_MS|orbitTargetGuarded|fromRingInPart/);
  });
  it("⭐⭐ the eye eases toward the SOLVED place, never a refused target — no pull-back (the spring chased the raw target before)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.boxSmoothMs / 2)");
    const solved = g.indexOf("st.pieceQ = fr.q; rig = { ...fr.q };");
    expect(solved).toBeGreaterThan(0); // ⭐ (the third audit) the line must exist — its indexOf of −1 passed for ever
    expect(solved).toBeLessThan(g.indexOf("springOrbit(st.boxSpring, rig,"));
  });
  it("⭐⭐⭐ (audit 8) the gap kept is in the WORLD — a tunable in mm, never scaled by the camera (the parts' skin is on the glass; the piece's is not)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("return { gapM: st.cfg.pieceGapMm / 1000, maxQueries: st.cfg.pieceSolverQueries };");
    expect(g).not.toMatch(/skinM\(st\)/);
    expect(DEFAULT_CONFIG.pieceGapMm).toBe(1); // the owner's ~1 mm
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceGapMm: 0 })).toThrow(/pieceGapMm/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceSolverQueries: 2.5 })).toThrow(/pieceSolverQueries/);
  });
  it("⭐ the solver's scene: the gap to the nearest part and the normal against THAT part", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const n = nearestObstacle(world, b.name, setup, LOOK_M);");
    expect(g).toContain("return m.blocker === null ? null : contactNormal(m.world, b.name, m.blocker, setup);");
  });
  it("⭐⭐ a TURN is swept by the same gap rule, along the slerp the alignment plays", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const pose = pieceMeshAt(st, a, qSlerp(from, q, u));");
    expect(g).toContain("const u = turnSweepFree(counted, 2 * Math.acos(d), pieceReachM(p.mesh, p.restingCentre), opt.gapM, opt.maxQueries);"); // ⭐ under the frame's cap
    // ⭐ (the second audit) the turn in flight re-checked each frame at the piece's place NOW, held (never aborted)
    expect(g).toContain("if (turnStepHeld(gapWith(next), gapWith(shown), pieceSolveOptions(st).gapM)) { u = a.u ?? 0; st.restAlign = { ...a, t0: now - u * REST_ALIGN_MS }; st.restAlignHeld = true;");
    expect(g).toContain("const q = u < 1 ? qSlerp(a.from, a.base, u * u * (3 - 2 * u)) : a.base;"); // the playback: the same slerp
  });
  it("⭐ the HUD: the solver's cost, its gap queries, d (the work cap) and b (the input blocked)", () => {
    expect(code("render/hud_paint.ts")).toContain('q${st.pieceQueries}${st.pieceDeferred ? " d" : ""}${st.pieceMoveBlocked ? " b" : ""}');
  });
});

describe("⭐⭐ the STUCK piece respawned by a double tap / click on it (2026-10-13, *\"build a piece-switch respawn which activates if any delta position input (orbiting or translation) and any rotation by quad is blocked\"* → *\"the red message shall appear if all delta position and quad rotations are blocked\"*)", () => {
  it("⭐ armed only when BOTH are blocked: the position and every turn", () => {
    expect(pieceRespawnArmed(true, true)).toBe(true);
    expect(pieceRespawnArmed(true, false)).toBe(false);
    expect(pieceRespawnArmed(false, true)).toBe(false);
    expect(pieceRespawnArmed(false, false)).toBe(false);
  });
  it("⭐⭐ (audit 6) stuck is the SOLVER's answer — its probes, then every direction's turn, one a frame, once the shown piece has caught up", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("blocked = stuckProbe(q, counted, opt, STUCK_PROBE_M);");
    // ⭐ (the second audit) scheduled — one check every 100 ms, a verdict per key — and INSIDE the margin counts, blocked input or not
    expect(g).toContain("const next = stuckNext(st.pieceStuck, key, t0, STUCK_EVERY_MS);");
    expect(g).toContain("if (!st.pieceMoveBlocked && !inside) {");
  });
  it("⭐⭐ ⛔ the tautology fixed: both halves read, the position AND the turns — at the pop-up and at the double tap", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("const stuck = pieceRespawnArmed(st.pieceStuck.position, st.pieceStuck.turns);");
    expect(c).toContain("showBlockedPopup(st, stuck ? blockedMessage(coarse) : null);");
    const p = flat("render/pointer_wiring.ts");
    expect(p).toContain('const action = pieceTapAction( tapped, tapped && st.pieceTaps.record(routed.pressed, s.t) === "DOUBLE_TAP", pieceRespawnArmed(st.pieceStuck.position, st.pieceStuck.turns), st.blockedShown === true, ); if (action === "RESPAWN") { respawnStuckPiece(st); return; }');
    expect(p + c).not.toContain("pieceStuck.all");
  });
  it("⭐ the respawn: the switch's spawn, the centre back at boot, a new solved place", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("export function respawnStuckPiece(st: SceneState): void { spawnOrbitPiece(st, st.orbitPieceKind, false); st.centreBlend.snapTo([st.bootCentreM[0], st.bootCentreM[1], st.bootCentreM[2]]); syncCentre(st);");
    expect(g).toContain("st.pieceQ = null; // ⭐ (2026-10-13, §12) a new orbit");
  });
});

describe("⭐⭐ the red BLOCKED pop-up while the piece is stuck (2026-10-13, *\"In such case the piece is blocked, Add a pop up message … in red\"*)", () => {
  it("⭐ the words by the device: a touch screen taps, a desktop clicks", () => {
    expect(blockedMessage(true)).toBe("Part is blocked. Double-tap the part to restart");
    expect(blockedMessage(false)).toBe("Part is blocked. Double-click the part to restart");
  });
  it("⭐ the goal pop-up's kind in RED: a danger pair in every theme, readable (≥ 4.5 : 1)", () => {
    for (const th of UI_THEMES) {
      expect(th.colour.danger).toMatch(/^#/);
      expect(themeProblems(th).filter((p) => p.includes("danger"))).toEqual([]);
    }
    expect(flat("render/ui_theme.ts")).toContain(".ui-toast--danger { background: var(--ui-danger); color: var(--ui-danger-text);");
    expect(flat("render/goal_popup.ts")).toContain('el.className = "ui-toast ui-toast--danger";');
  });
});

describe("⭐⭐ the second gap per convex PART (the fourth audit: per body, a U-shaped body's far arm was unbounded)", () => {
  it("⭐⭐ a body of two convex parts: the nearest part and, as the second gap, its OTHER part", () => {
    const box = (cx: number, h: number): Vec3[] => {
      const out: Vec3[] = [];
      for (const x of [-h, h]) for (const y of [-0.05, 0.05]) for (const z of [-0.05, 0.05]) out.push([cx + x, y, z]);
      return out;
    };
    const parts: CollisionShapeSource = {
      partsOf(world, id) {
        if (id === "u") return [box(0.07, 0.01), box(-0.12, 0.01)]; // two arms: 1 cm and 6 cm of air from the piece
        const pts = world.objects.get(id)?.shape?.points;
        return pts ? [pts] : null;
      },
    };
    const w = makeWorld([body("piece", [0, 0, 0], [0.1, 0.1, 0.1]), body("u", [0, 0, 0], [0.01, 0.01, 0.01])]);
    const n = nearestObstacle(w, "piece", { shapes: parts, bounds: boundsFromShapes(parts), skinM: 0.001 }, 0.3);
    expect(n.blocker).toBe("u");
    expect(n.gapM).toBeCloseTo(0.01, 9);
    expect(n.secondGapM).toBeCloseTo(0.06, 9); // ⛔ 0.3 (the look distance) per body
  });
});

describe("⭐ CLEARANCE and the NEAREST OBSTACLE (core)", () => {
  const near = (id: string, at: Vec3): SceneObject => body(id, at, [0.1, 0.1, 0.1]);
  const setup: CollisionSetup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: 0.001 };
  it("⭐ CLEARANCE: the least surface gap to anything not exempt within the look distance; the look distance when nothing is that near; 0 in contact", () => {
    const w = makeWorld([near("a", [0, 0, 0]), near("b", [0.3, 0, 0])]);
    expect(clearance(w, "a", setup, 0.5)).toBeCloseTo(0.2, 9); // 0.3 apart, 0.1 boxes: 0.2 of air
    expect(clearance(w, "a", setup, 0.1)).toBe(0.1); // nothing within 0.1
    expect(clearance(makeWorld([near("a", [0, 0, 0]), near("b", [0.1, 0, 0])]), "a", setup, 0.5)).toBe(0);
  });
  it("⭐ the nearest obstacle NAMED with its gap — the solver asks that body for the normal", () => {
    const w = makeWorld([near("a", [0, 0, 0]), near("b", [0.3, 0, 0]), near("c", [0, 0.25, 0])]);
    const n = nearestObstacle(w, "a", setup, 0.5);
    expect(n.blocker).toBe("c");
    expect(n.gapM).toBeCloseTo(0.15, 9);
    expect(nearestObstacle(w, "a", setup, 0.1)).toEqual({ gapM: 0.1, blocker: null, secondGapM: 0.1 });
    // ⭐ (the third audit) the gap to every OTHER body: b, 0.2 of air (the directional stride's bound on everything but the nearest)
    expect(n.secondGapM).toBeCloseTo(0.2, 9);
  });
});

describe("⭐⭐ §11nonies — a DRAG from a placed part no longer moves the gizmo (2026-10-13, *\"Piece still locked onto the collided part without possibility to go backwards\"*)", () => {
  it("⭐ the gizmo moves at a TAP's release only — a drag's press only notes where", () => {
    const at: [number, number, number] = [0.1, 0.2, 0.3];
    expect(orbitTargetOnRelease(at, true)).toEqual(at);
    expect(orbitTargetOnRelease(at, false)).toBeNull();
    expect(orbitTargetOnRelease(null, true)).toBeNull();
  });
});
