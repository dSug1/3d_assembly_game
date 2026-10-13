/**
 * GOLDEN VECTORS — prototype: **THE ORBITED PIECE COLLIDES** (`COLLISION.md` §11; the owner, 2026-10-13: *"Now we need to work on the
 * collision of the green-turquoise piece with the other parts … reusing what we have done for the other parts … and adapting it for the piece
 * specific orbit movement"* → *"Rotation Blocked by piece : in such case, highlight the quad in red instead of yellow and back to yellow when
 * rotation is allowed again … I agree with all the rest of your recommendations. Build"*). Each RED against the build before: nothing guarded
 * the piece (`candidates` skipped it, and no orbit step, no turn asked).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { boundsFromShapes, hullAtSpawn, resolveMove, type CollisionSetup } from "@core/collision";
import { boxShape } from "@core/collision_shape";
import { makeWorld, type SceneObject } from "@core/object_model";
import { IDENTITY, type Vec3 } from "@core/vec";
import { backOff, lerpOrbit, projectStep, rememberNormal } from "../src/input/piece_collision";

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
  it("⭐ an orbited piece is never another body's obstacle", () => {
    const v = resolveMove(w, "part", { position: [0, 0.3, 0], orientation: IDENTITY }, pieceSetup);
    expect(v.blockedBy).toBeNull();
  });
});

describe("⭐⭐ wired — the orbit step, the turns, the red quad", () => {
  it("⭐ the piece's setup: no play volume, the frozen bodies exempt", () => {
    const c = flat("render/collision_wiring.ts");
    expect(c).toContain("return { shapes: SHAPES, bounds: BOUNDS, skinM: skin, exempt: (a, b) => frozen(a) || frozen(b) };");
  });
  it("⭐⭐ the orbit step guarded each frame after the spring; blocked, PROJECTED (up to 3 re-checks), else the stop a rest gap short; the orbit's target and the spring's velocity projected the same way — only the input INTO the contact discarded", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const g = guardOrbitStep(st, prevAt, st.boxSpring.at);");
    expect(g).toContain("const vel = g.slide([sp.velYaw, sp.velV]); const tgt = g.slide([st.orbit.yaw - g.at.yaw, st.orbit.elevation - g.at.v]);");
    expect(g).toContain("st.orbit.reset(g.at.yaw + tgt[0], g.at.v + tgt[1]); st.orbitInertia.stop();");
    expect(g).toContain("const s = projectStep(dq, J, normals);");
    expect(g).toContain("const stop = lerpOrbit(from, to, backOff(v.t, stepM, skin / 2));");
    expect(g).not.toMatch(/orbitStepCandidates|refusedAxes/);
  });
  it("⭐ the skin HELD through a contact (the camera moving must not change the tolerance); the normal from `contactNormal` (factored out of `resolveMove`)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const skin = pc?.skinM ?? skinM(st); const setup = pieceCollisionSetup(st, skin);");
    expect(g).toContain("const n0 = contactNormal(setWorldPlacement(st.world, id, v.placed), id, v.blockedBy, setup);");
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
