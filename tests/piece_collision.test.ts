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
import { lerpOrbit, orbitStepCandidates, refusedAxes } from "../src/input/piece_collision";

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

describe("⭐⭐⭐ the orbit's own slide — the whole step, else the yaw alone, else the ring position alone", () => {
  const from = { yaw: 0, v: 0.6, zoom: 1 };
  const to = { yaw: 0.1, v: 0.55, zoom: 1 };
  it("⭐ the order: the whole step first, then the yaw alone (the ring position kept), then the ring position alone (the yaw kept)", () => {
    expect(orbitStepCandidates(from, to)).toEqual([to, { yaw: 0.1, v: 0.6, zoom: 1 }, { yaw: 0, v: 0.55, zoom: 1 }]);
  });
  it("⭐ an axis that did not move gives no fallback (it would be no step)", () => {
    expect(orbitStepCandidates(from, { yaw: 0.1, v: 0.6, zoom: 1 })).toEqual([{ yaw: 0.1, v: 0.6, zoom: 1 }]);
    expect(orbitStepCandidates(from, { yaw: 0, v: 0.55, zoom: 1 })).toEqual([{ yaw: 0, v: 0.55, zoom: 1 }]);
  });
  it("⭐ the stop: a fraction of the whole step; the axes it refused are the ones whose input is discarded", () => {
    expect(lerpOrbit(from, to, 0.5)).toEqual({ yaw: 0.05, v: 0.575, zoom: 1 });
    expect(lerpOrbit(from, to, 2)).toEqual(to);
    expect(refusedAxes(to, { yaw: 0.1, v: 0.6, zoom: 1 })).toEqual({ yaw: false, v: true }); // the yaw went on: only the ring position refused
    expect(refusedAxes(to, to)).toEqual({ yaw: false, v: false });
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
    expect(c).toContain("return { shapes: SHAPES, bounds: BOUNDS, skinM: skinM(st), exempt: (a, b) => frozen(a) || frozen(b) };");
  });
  it("⭐⭐ the orbit step guarded each frame after the spring; the refused axes' input discarded (the spring and the orbit's target pulled back, the coast stopped)", () => {
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const g = guardOrbitStep(st, prevAt, st.boxSpring.at);");
    expect(g).toContain("st.orbit.reset(ref.yaw ? g.at.yaw : st.orbit.yaw, ref.v ? g.at.v : st.orbit.elevation); st.orbitInertia.stop();");
    expect(g).toContain("for (const cand of orbitStepCandidates(from, to)) {");
    expect(g).toContain("const stop = lerpOrbit(from, to, first?.t ?? 0);");
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
