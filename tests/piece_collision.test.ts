/**
 * GOLDEN VECTORS — prototype: **THE ORBITED PIECE COLLIDES** (`COLLISION.md` §11; the owner, 2026-10-13: *"Now we need to work on the
 * collision of the green-turquoise piece with the other parts … reusing what we have done for the other parts … and adapting it for the piece
 * specific orbit movement"* → *"Rotation Blocked by piece : in such case, highlight the quad in red instead of yellow and back to yellow when
 * rotation is allowed again … I agree with all the rest of your recommendations. Build"*). Each RED against the build before: nothing guarded
 * the piece (`candidates` skipped it, and no orbit step, no turn asked).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { boundsFromShapes, clearance, hullAtSpawn, pairGap, resolveMove, type CollisionSetup } from "@core/collision";
import { boxShape } from "@core/collision_shape";
import { makeWorld, type SceneObject } from "@core/object_model";
import { IDENTITY, type Vec3 } from "@core/vec";
import { backOff, blockedMessage, lerpOrbit, orbitSubsteps, ORBIT_MAX_SUBSTEPS, pieceRespawnArmed, projectStep, rememberNormal } from "../src/input/piece_collision";
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

describe("⭐⭐⭐ the slide PROJECTED onto the contact in the orbit's coordinates (2026-10-13, §11bis: *\"there is some jitter as the input goes into the direction of collision instead of smooth sliding\"* — the axis-by-axis fallback stair-stepped)", () => {
  // a ring whose yaw moves the anchor along x and whose ring parameter moves it along y (unit Jacobian), and an OBLIQUE wall
  const J: [Vec3, Vec3] = [[1, 0, 0], [0, 1, 0]];
  const s = Math.SQRT1_2;
  const wall: Vec3 = [s, s, 0]; // pointing toward the piece: moving along −x−y goes INTO it
  it("⭐⭐ a step into an oblique wall keeps its part ALONG the wall — both coordinates move, every frame (no axis frozen, no stair-step)", () => {
    const out = projectStep([-0.01, -0.02], J, [wall]);
    expect(out[0] * s + out[1] * s).toBeCloseTo(0, 12); // nothing into the wall
    expect(out[0]).toBeCloseTo(0.005, 12); // the yaw moves…
    expect(out[1]).toBeCloseTo(-0.005, 12); // …and so does the ring position: along the wall, not one axis at a time
  });
  it("⭐ a step away from the contact, or along it, is untouched; head-on into it: nothing (a still rest, no shake)", () => {
    expect(projectStep([0.01, 0.02], J, [wall])).toEqual([0.01, 0.02]);
    const head = projectStep([-0.01, -0.01], J, [wall]);
    expect(Math.hypot(head[0], head[1])).toBeLessThan(1e-12);
  });
  it("⭐ the ring's own metric: where the yaw moves the anchor 3× further than the ring parameter, the slide is the least change in METRES", () => {
    const Jw: [Vec3, Vec3] = [[3, 0, 0], [0, 1, 0]];
    const out = projectStep([-0.01, -0.03], Jw, [wall]);
    const d: Vec3 = [3 * out[0], out[1], 0];
    expect(d[0] * s + d[1] * s).toBeCloseTo(0, 12);
  });
  it("⭐ two contacts against both coordinates (a crease the ring cannot follow): the step is zero", () => {
    expect(projectStep([-0.01, -0.01], J, [[1, 0, 0], [0, 1, 0]])).toEqual([0, 0]);
  });
  it("⭐ the REST GAP: a stop pulled back a fixed distance short of the contact (the next frame starts apart)", () => {
    expect(backOff(0.5, 0.01, 0.001)).toBeCloseTo(0.4, 12);
    expect(backOff(0.05, 0.01, 0.001)).toBe(0);
    expect(backOff(0.5, 0, 0.001)).toBe(0);
  });
  it("⭐ the contact's normals remembered: a near-duplicate replaces its old self, the newest first, at most two", () => {
    const a: Vec3 = [1, 0, 0];
    const b: Vec3 = [0, 1, 0];
    expect(rememberNormal([], a)).toEqual([a]);
    expect(rememberNormal([a], [0.9999, 0.0141, 0])).toHaveLength(1);
    expect(rememberNormal([a], b)).toEqual([b, a]);
    expect(rememberNormal([b, a], [0, 0, 1])).toHaveLength(2);
    expect(lerpOrbit({ yaw: 0, v: 0.6, zoom: 1 }, { yaw: 0.1, v: 0.5, zoom: 1 }, 0.5).v).toBeCloseTo(0.55, 12);
  });
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
  it("⭐⭐ the orbit step guarded each frame after the spring; blocked, PROJECTED (up to 3 re-checks), else the stop a rest gap short; the orbit's target and the spring's velocity projected the same way — only the input INTO the contact discarded", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const g = guardOrbitPath(st, prevAt, st.boxSpring.at);");
    // ⭐ (2026-10-13, §11quinquies) the per-frame guard is a safety net: the spring's velocity projected, the TARGET no longer touched there
    expect(g).toContain("const vel = g.slide([sp.velYaw, sp.velV]); st.boxSpring = { at: g.at, velYaw: vel[0], velV: vel[1], velLnZoom: sp.velLnZoom };");
    expect(g).toContain("const s = projectStep(dq, J, normals);");
    expect(g).toContain("const stop = lerpOrbit(from, to, backOff(v.t, stepM, skin / 2));");
    expect(g).not.toMatch(/orbitStepCandidates|refusedAxes/);
  });
  it("⭐ the skin HELD through a contact (the camera moving must not change the tolerance); the normal from `contactNormal` (factored out of `resolveMove`)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const skin = pc?.skinM ?? skinM(st); const setup = pieceCollisionSetup(st, skin);");
    expect(g).toContain("const n0 = contactNormal(setWorldPlacement(w, id, v.placed), id, v.blockedBy, setup);");
    expect(flat("core/collision.ts")).toContain("const n = contactNormal(stoppedWorld, id, blocker, setup);");
  });
  it("⭐⭐ a turn checked WHOLE before it starts — the align and the roll refused when blocked (nothing changes, no episode)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const blockedBy = pieceTurnBlocker(st, base); if (blockedBy !== null) { st.pinkTargetNormal = pinkWas;");
    expect(g).toContain("const blockedBy = pieceTurnBlocker(st, roll.q); if (blockedBy !== null) {");
  });
  it("⭐⭐ *\"highlight the quad in red instead of yellow and back to yellow when rotation is allowed again\"* — its tap's turn checked (at most every 100 ms)", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("const q = restingPreview(st, dir, roll); qc.blockedBy = q === null ? null : pieceTurnBlocker(st, q);");
    expect(c).toContain("x.edges.color = lit ? (st.quadTurnCheck.blockedBy !== null ? QUAD_BLOCKED : QUAD_LIT) : QUAD_EDGE;");
    expect(c).toContain("const QUAD_CHECK_MS = 100;");
  });
});

describe("⭐⭐ the STUCK piece respawned by a double tap / click on it (2026-10-13, *\"build a piece-switch respawn which activates if any delta position input (orbiting or translation) and any rotation by quad is blocked: in such case, if the user double tap/click on the piece, the piece respawns at its initial spawn transform\"*)", () => {
  it("⭐ armed only when BOTH are blocked: the position input and the yellow quad's turn", () => {
    expect(pieceRespawnArmed(true, true)).toBe(true);
    expect(pieceRespawnArmed(true, false)).toBe(false);
    expect(pieceRespawnArmed(false, true)).toBe(false);
    expect(pieceRespawnArmed(false, false)).toBe(false);
  });
  it("⭐ wired: a contact sets the position half, a free move clears it; the quad's half is its red; a DOUBLE tap on the piece then respawns it (the switch's spawn, the centre back at boot)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("st.pieceMoveBlocked = g.slide !== null;"); // ⭐ (2026-10-13) by the target's guard: the INPUT met a contact
    expect(g).toContain("if (g.slide !== null) st.pieceMoveBlocked = true; // ⭐ (2026-10-13) set here too");
    expect(g).toContain("export function respawnStuckPiece(st: SceneState): void { spawnOrbitPiece(st, st.orbitPieceKind, false); st.centreBlend.snapTo([st.bootCentreM[0], st.bootCentreM[1], st.bootCentreM[2]]); syncCentre(st);");
    const p = flat("render/pointer_wiring.ts");
    expect(p).toContain('if (tapped && st.pieceTaps.record(routed.pressed, s.t) === "DOUBLE_TAP" && pieceRespawnArmed(st.pieceStuck.all, st.pieceStuck.all)) { respawnStuckPiece(st); return; }');
  });
});

describe("⭐⭐ the red BLOCKED pop-up while the piece is stuck (2026-10-13, *\"In such case the piece is blocked, Add a pop up message (same kind as the pop up when a part reach its goal) in red (instead of green) with written “Part is blocked. Double-click the part to restart” in desktop or “Part is blocked. Double-tap the part to restart” in mobile.\"*)", () => {
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
  it("⭐ wired: shown while stuck (the respawn's two halves), hidden as soon as not", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("pieceStuckFrame(st); const stuck = pieceRespawnArmed(st.pieceStuck.all, st.pieceStuck.all);");
    expect(c).toContain("showBlockedPopup(st, stuck ? blockedMessage(coarse) : null);");
  });
});

describe("⭐⭐⭐ the orbit's TARGET guarded, as a part's input step is (2026-10-13, §11quinquies: *\"there is still some jitter … Check what is done for the translation of the parts because there the slide and block is smoother than for the piece orbit\"* → *\"Jitter appears everywhere\"*)", () => {
  it("⭐⭐ each step of the target goes through the guard from where the guarded target was, BEFORE the spring; the camera's driver is that target", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const atTarget = setWorldPlacement(st.world, b0.name, fromPose);"); // ⭐ (2026-10-13, §11nonies) or the actual piece when that ring place is in a part
    expect(g).toContain("st.pieceMoveBlocked = g.slide !== null; if (g.at !== rig) {"); // ⭐ (2026-10-13, §11septies) the reset only when not deferred — vectored below
    expect(g.indexOf("st.orbitTargetGuarded = { ...rig };")).toBeLessThan(g.indexOf("springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.boxSmoothMs / 2)"));
    expect(g).toContain("{ yaw: rig.yaw, v: rig.v },"); // the camera follows the guarded target
    expect(g).not.toContain("st.orbit.reset(g.at.yaw + tgt[0], g.at.v + tgt[1]);"); // the per-frame guard no longer pulls the target
  });
  it("⭐ a respawn starts a new guarded target", () => {
    expect(flat("render/green_box_wiring.ts")).toContain("st.orbitTargetGuarded = null; // ⭐ (2026-10-13) a new orbit: a new guarded target");
  });
});

describe("⭐⭐ the red message and the respawn only when EVERY move is blocked (2026-10-13, *\"the red message shall appear if all delta position and quad rotations are blocked\"*)", () => {
  it("⭐ the position: a probe each way along both ring coordinates, all blocked; the turns: every direction's quad tap, all blocked; while in contact, at most every 250 ms", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const blocked = k < probes.length ? probeBlocked(probes[k]!) : turnBlocked(st.orientDirs[k - probes.length]!);");
    expect(g).toContain("const STUCK_CHECK_MS = 250;");
    expect(g).toContain("if (!st.pieceMoveBlocked || b === null || st.boxOrbit === null");
  });
});

describe("⭐⭐⭐ a large orbit step checked ALONG THE RING, not its chord (2026-10-13, §11sexies: *\"Still some spring effect with large dx orbit. Check that the collision check holds at large orbit dx. Also, a red flag popped up when there was no blocking to revert the orbit during this large dx orbit\"*)", () => {
  it("⭐ the sub-steps: ≤ 2° of yaw and ≤ 2 cm of travel each, at least one, at most ORBIT_MAX_SUBSTEPS", () => {
    expect(orbitSubsteps(0.001, 0.001)).toBe(1);
    expect(orbitSubsteps((10 * Math.PI) / 180, 0.01)).toBe(5); // 10° of yaw: 5 sub-steps
    expect(orbitSubsteps(0.001, 0.1)).toBe(5); // 10 cm of travel: 5
    expect(orbitSubsteps(-Math.PI, 3)).toBe(ORBIT_MAX_SUBSTEPS);
  });
  it("⭐ why: the chord of a 60° step on a 1 m ring passes 13 cm inside the arc — a part there seen by neither, or one on the chord refused wrongly", () => {
    const sag = 1 - Math.cos(Math.PI / 6);
    expect(sag).toBeGreaterThan(0.13);
    const n = orbitSubsteps(Math.PI / 3, 1);
    expect(1 - Math.cos(Math.PI / 3 / n / 2)).toBeLessThan(0.001); // each sub-step's chord within 1 mm of the arc
  });
  it("⭐ wired: both guards walk the ring (the target's, the per-frame net); the rest projected after a contact; the stuck probes from the piece AS IT IS", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("return { n: orbitSubsteps(to.yaw - from.yaw, pathM), pathM };"); // ⭐ (2026-10-13) from the path's length along the ring, not its chord
    expect(g).toContain("const a = ringAnchorAt(st, lerpOrbit(from, to, i / ORBIT_PATH_SAMPLES)); pathM += length(sub(a, prevA));");
    expect(g).toContain("rest = g.slide(rest); // ⭐ the rest of the step projected onto the contact met");
    expect(g).toContain("const t = { position: add(actual.position, d), orientation: actual.orientation };");
  });
});

describe("⭐⭐ the guards never freeze a frame (2026-10-13, §11septies: *\"When i do large orbit dx sweeps which collide, sometimes the scene freezes or the orbit slows down when the piece approaches the collision part\"* → *\"Build\"*)", () => {
  it("⭐⭐ a TIME BUDGET (4 ms a frame): past it the rest of a step waits for the next frame — KEPT (the target untouched), never discarded", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const GUARD_BUDGET_MS = 4;");
    expect(g).toContain("st.pieceGuardDeadline = performance.now() + GUARD_BUDGET_MS;");
    expect(g).toContain("if (guard > 0 && performance.now() > st.pieceGuardDeadline) { deferred = true; break; }");
    expect(g).toContain("if (!g.deferred) { st.orbit.reset(g.at.yaw, g.at.v); st.orbitInertia.stop();");
    expect(g).toContain("} else if (g.deferred) { // ⭐ (2026-10-13, §11septies) the budget spent: the spring only as far as was checked st.boxSpring = { ...st.boxSpring, at: g.at };");
  });
  it("⭐ after a contact the projected rest is walked ANEW (its own count) — not re-slid every 2 cm; head-on, nothing left: done", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("if (Math.abs(rest[0]) + Math.abs(rest[1]) < 1e-12) break; const ps = pathSubsteps(st, cur, { yaw: cur.yaw + rest[0], v: Math.min(1, Math.max(0, cur.v + rest[1])), zoom: to.zoom }); n = ps.n; stepM = ps.pathM / ps.n; i = 0;");
  });
  it("⭐ the stop's bisection 8 rounds for the piece (14 for the parts): ~0.02 mm on a skin-long substep", () => {
    expect(flat("core/collision.ts")).toContain("largestFreeFraction((u) => poseFree(base, at(lo + (f - lo) * u), moving, root, setup).free, setup.bisectIterations ?? 14);");
  });
  it("⭐ the stuck check: only after 150 ms at rest under the push, ONE check a frame in turn; the quad's check paused while the piece moves > 3 mm a frame", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("now - st.pieceMovedAt < STUCK_STILL_MS) {");
    expect(g).toContain("const STUCK_STILL_MS = 150;");
    expect(g).toContain("if (st.pieceFrameStepM > 0.0005) st.pieceMovedAt = now;");
    expect(flat("render/orient_cube.ts")).toContain("if (st.pieceFrameStepM > QUAD_PAUSE_STEP_M) return;");
  });
  it("⭐ the HUD: both guards' cost a frame, its mean and the peak of the last 2 s", () => {
    expect(flat("render/hud_paint.ts")).toContain("` guard ${st.pieceGuardMs.toFixed(2)}ms (peak ${st.pieceGuardPeak.toFixed(0)})");
  });
});

describe("⭐⭐⭐ §11octies — the cheap approach, the height kept, the UNLOCK (2026-10-13, *\"Can both be improved ?\"* → *\"Do not build detour. Instead, propose a way to unlock the head-on block when the user reverses the delta position direction\"* → *\"Finish\"*)", () => {
  const near = (id: string, at: Vec3): SceneObject => body(id, at, [0.1, 0.1, 0.1]);
  const setup: CollisionSetup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: 0.001 };
  it("⭐ CLEARANCE: the least surface gap to anything not exempt within the look distance; the look distance when nothing is that near; 0 in contact", () => {
    const w = makeWorld([near("a", [0, 0, 0]), near("b", [0.3, 0, 0])]);
    expect(clearance(w, "a", setup, 0.5)).toBeCloseTo(0.2, 9); // 0.3 apart, 0.1 boxes: 0.2 of air
    expect(clearance(w, "a", setup, 0.1)).toBe(0.1); // nothing within 0.1
    expect(clearance(makeWorld([near("a", [0, 0, 0]), near("b", [0.1, 0, 0])]), "a", setup, 0.5)).toBe(0);
    expect(pairGap(w, "a", "b", setup)).toBeCloseTo(0.2, 9);
  });
  it("⭐⭐ the walk trusts the clearance (×0.8) for that many sub-steps unchecked — the checks are left for the last centimetres", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const free = clearance(w, b.name, freeSetup, CLEARANCE_LOOK_M) - freeSetup.skinM; const m = Math.min(k, Math.floor((free * CLEARANCE_SAFETY) / Math.max(1e-9, stepM)));");
    expect(g).toContain("const GUARD_BUDGET_MS = 4;"); // ⛔ not raised (*"do not increase the ms budget (i am testing on iphone)"*)
  });
  it("⭐⭐⭐ THE UNLOCK: a step AWAY from the part the piece TOUCHES is never refused by that part — judged against the others", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const touching = (pairGap(w, id, blk, setup) ?? 1) <= setup.skinM;");
    expect(g).toContain("if (nb !== null && stepW[0] * nb[0] + stepW[1] * nb[1] + stepW[2] * nb[2] > 0) {");
    expect(g).toContain("const others = { ...setup, exempt: (a: string, c: string) => (setup.exempt?.(a, c) ?? false) || a === blk || c === blk };");
  });
  it("⭐⭐ THE HEIGHT KEPT: only the finger's own dy moves it; a push of its own into a part is discarded; the return waits while blocked", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const dvIn = prevRaw === null ? 0 : rig.v - prevRaw.v; st.orbitUserV = Math.min(1, Math.max(0, (st.orbitUserV ?? rig.v) + dvIn));");
    expect(g).toContain("if (g.slide !== null && Math.abs(dvIn) > 1e-12) st.orbitUserV = g.at.v;");
    expect(g).toContain("if (back.slide === null && back.anchor === null && !back.deferred) {");
  });
  it("⭐ the HUD's flags: d (the budget cut a step), H (held off the ring), U (the unlock let a step through)", () => {
    expect(code("render/hud_paint.ts")).toContain('${st.pieceDeferred ? " d" : ""}${st.pieceHeld ? " H" : ""}${st.pieceUnlocked ? " U" : ""}');
  });
});

import { orbitTargetOnRelease } from "../src/input/goal_lock";
describe("⭐⭐ §11nonies — a DRAG from a placed part no longer moves the gizmo; the guard starts from the piece as it is when its ring place is in a part (2026-10-13, *\"Piece still locked onto the collided part without possibility to go backwards\"*)", () => {
  it("⭐ the gizmo moves at a TAP's release only — a drag's press only notes where", () => {
    const at: [number, number, number] = [0.1, 0.2, 0.3];
    expect(orbitTargetOnRelease(at, true)).toEqual(at);
    expect(orbitTargetOnRelease(at, false)).toBeNull();
    expect(orbitTargetOnRelease(null, true)).toBeNull();
  });
  it("⭐ the target's guard starts from the ACTUAL piece when its place on the ring is in or against a part", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const fromRingInPart = clearance(atTarget, b0.name, pieceCollisionSetup(st), 0.001) <= 0; const g = guardOrbitPath(st, tg, rig, fromRingInPart ? st.world : atTarget);");
  });
});
