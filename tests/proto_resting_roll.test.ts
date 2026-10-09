/**
 * ⭐⭐ prototype — THE ROLL TO THE NEXT EDGE (`1.0.59z-Rotation-of-resting-face`; the owner, 2026-10-09: *"rotation of the piece around the
 * normal of the resting face so the next edge of the resting face takes the alignment with the pink face long axis … a series of second
 * touch/right click make scroll the edges so there is a snapped roll around the normal of the resting face"* → *"Build what you
 * proposed"*): one stop per edge, clockwise as seen from the camera, the stop already reached passed over, quick taps adding up.
 */
import { readFileSync } from "node:fs";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import { describe, expect, it } from "vitest";
import { edgeStops, faceEdges, nextEdgeRoll, placeByFaceCentre } from "../src/core/resting_face";
import { tapAction } from "../src/input/orbit_tap";
import { dot, qRotate, qSlerp, type Quat, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const D = Math.PI / 180;
const DOWN: Vec3 = [0, -1, 0];
// the green piece's base: 103.5 × 45 mm on y = 0, its outward normal DOWN; the turquoise piece's end: a regular hexagon, 25.875 mm a side
const RECT: Vec3[] = [[-0.05175, 0, -0.0225], [0.05175, 0, -0.0225], [0.05175, 0, 0.0225], [-0.05175, 0, 0.0225]];
const HEX: Vec3[] = Array.from({ length: 6 }, (_, k) => [0.025875 * Math.cos((k * Math.PI) / 3), 0, 0.025875 * Math.sin((k * Math.PI) / 3)] as Vec3);
const rectStops = edgeStops(faceEdges(RECT, DOWN), DOWN);
const hexStops = edgeStops(faceEdges(HEX, DOWN), DOWN);
const LOOK_DOWN: Vec3 = [0, -1, 0]; // the camera above, looking down — the normal points away from it
const LOOK_UP: Vec3 = [0, 1, 0];
const X: Vec3 = [1, 0, 0]; // the pink face's long axis
const sameTurn = (a: Quat, b: Quat) => Math.abs(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]) - 1) < 1e-9;

describe("⭐⭐ prototype — the roll to the next edge", () => {
  it("⭐⭐ the stops: one per edge, outward, in the plane — the green base's 4 (its long axis, its short axis, each both ways), the hexagon's 6, 60° apart", () => {
    expect(rectStops.length).toBe(4);
    const xs = rectStops.filter((s) => Math.abs(Math.abs(s[0]) - 1) < 1e-9).length;
    const zs = rectStops.filter((s) => Math.abs(Math.abs(s[2]) - 1) < 1e-9).length;
    expect([xs, zs]).toEqual([2, 2]); // ±x through the short edges (the long axis), ±z through the long ones (the short axis)
    for (const s of rectStops) expect(Math.abs(s[1])).toBeLessThan(1e-12);
    expect(hexStops.length).toBe(6);
    for (let k = 0; k < 6; k++) {
      const a = hexStops[k]!;
      const b = hexStops[(k + 1) % 6]!;
      expect(Math.acos(Math.max(-1, Math.min(1, dot(a, b))))).toBeCloseTo(60 * D, 9); // round the face, one edge to the next
    }
  });

  it("⭐⭐ GREEN: aligned (long axis ∥ the pink long axis), a tap → the SHORT axis ∥ it (90°); four taps → back where it started", () => {
    let q: Quat = [1, 0, 0, 0];
    const r1 = nextEdgeRoll(q, DOWN, rectStops, X, LOOK_DOWN)!;
    expect(r1.angleRad).toBeCloseTo(90 * D, 9);
    expect(Math.abs(qRotate(r1.q, [0, 0, 1])[0])).toBeCloseTo(1, 9); // the short axis now along the pink long axis
    expect(qRotate(r1.q, DOWN)[1]).toBeCloseTo(-1, 12); // the resting face still faces the same way: a roll about its normal
    for (let i = 0; i < 4; i++) q = nextEdgeRoll(q, DOWN, rectStops, X, LOOK_DOWN)!.q;
    expect(sameTurn(q, [1, 0, 0, 0])).toBe(true);
  });

  it("⭐⭐ TURQUOISE: a tap → the NEXT long axis (60°); six taps → back where it started", () => {
    // the hexagon's across-flats lines are its stops; start with one along the pink long axis
    const at = Math.atan2(hexStops[0]![2], hexStops[0]![0]);
    let q: Quat = [Math.cos(at / 2), 0, Math.sin(at / 2), 0]; // a turn about +y putting stop 0 along +x
    expect(Math.abs(dot(qRotate(q, hexStops[0]!), X))).toBeCloseTo(1, 9);
    const r1 = nextEdgeRoll(q, DOWN, hexStops, X, LOOK_DOWN)!;
    expect(r1.angleRad).toBeCloseTo(60 * D, 9);
    expect(hexStops.some((s) => Math.abs(dot(qRotate(r1.q, s), X) - 1) < 1e-9)).toBe(true);
    const q0 = q;
    for (let i = 0; i < 6; i++) q = nextEdgeRoll(q, DOWN, hexStops, X, LOOK_DOWN)!.q;
    expect(sameTurn(q, q0)).toBe(true);
  });

  it("⭐⭐ always the same sense ON THE SCREEN: clockwise as seen from the camera — seen from below, the turn about the world is the other way", () => {
    const above = nextEdgeRoll([1, 0, 0, 0], DOWN, rectStops, X, LOOK_DOWN)!;
    const below = nextEdgeRoll([1, 0, 0, 0], DOWN, rectStops, X, LOOK_UP)!;
    expect(above.angleRad).toBeCloseTo(below.angleRad, 9);
    const xa = qRotate(above.q, X);
    const xb = qRotate(below.q, X);
    expect(xa[2]).toBeCloseTo(-xb[2], 9); // the piece's long axis went opposite ways in the world
    expect(Math.abs(xa[2])).toBeCloseTo(1, 9);
    // ⛔ LEFT-HANDED (Babylon): screen right = up × forward. Looking down −y with the screen's up along +x, its right is +x × −y… = up × f
    // = (+x) × (−y) = −z: clockwise turns the up direction (+x) toward the right (−z)
    expect(xa[2]).toBeCloseTo(-1, 9);
  });

  it("⛔⛔ CLOCKWISE ON THE SCREEN, checked by Babylon's own projection (the scene is LEFT-HANDED — the first build turned the other way)", () => {
    const engine = new NullEngine({ renderHeight: 600, renderWidth: 800, textureSize: 512, deterministicLockstep: false, lockstepMaxSteps: 1 });
    const scene = new Scene(engine);
    for (const at of [[0.3, 2, 0.1], [0.2, -2, 0.4], [2, 0.5, 1], [-1, 1.5, -2]] as Vec3[]) {
      const cam = new FreeCamera("c", new Vector3(...at), scene);
      cam.setTarget(Vector3.Zero());
      cam.computeWorldMatrix();
      const tm = cam.getViewMatrix().multiply(cam.getProjectionMatrix());
      const px = (p: Vec3) => Vector3.Project(new Vector3(...p), Matrix.Identity(), tm, new Viewport(0, 0, 800, 600));
      const r = nextEdgeRoll([1, 0, 0, 0], DOWN, rectStops, X, [-at[0], -at[1], -at[2]])!;
      const tenth = qSlerp([1, 0, 0, 0], r.q, 0.1); // a tenth of the turn: its sense unambiguous
      const c = px([0, 0, 0]);
      const a = px([0.05, 0, 0.01]);
      const b = px(qRotate(tenth, [0.05, 0, 0.01]));
      expect((a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x)).toBeGreaterThan(0); // pixels, y DOWN: > 0 is clockwise
    }
    engine.dispose();
  });

  it("⭐ a tap always MOVES (the stop already reached is passed over); off a stop it goes to the next one, never back; nothing to roll → null", () => {
    const off: Quat = [Math.cos(10 * D), 0, Math.sin(10 * D), 0]; // 20° off a stop
    const r = nextEdgeRoll(off, DOWN, rectStops, X, LOOK_DOWN)!;
    expect(r.angleRad).toBeGreaterThan(0);
    expect(r.angleRad).toBeLessThanOrEqual(90 * D + 1e-9);
    expect(nextEdgeRoll([1, 0, 0, 0], DOWN, [], X, LOOK_DOWN)).toBeNull();
    expect(nextEdgeRoll([1, 0, 0, 0], DOWN, rectStops, [0, 1, 0], LOOK_DOWN)).toBeNull(); // a reference along the normal: no line to align
  });

  it("⭐⭐ the RESTING FACE'S CENTRE rides the anchor (*\"the center of the resting position to be on the ring … not the center of the object\"*): every turn — a roll, the alignment — pivots on it", () => {
    // a face whose centre is OFF the line through the piece's origin along its normal (a slanted face of the frustum, say)
    const fc: Vec3 = [0.03, -0.02, 0.01];
    const anchor: Vec3 = [0.5, 0.2, -0.3]; // where the orbit put it
    const q0: Quat = [1, 0, 0, 0];
    const r = nextEdgeRoll(q0, [0, -1, 0], rectStops, X, LOOK_DOWN)!;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const q = qSlerp(q0, r.q, t);
      const origin = placeByFaceCentre(anchor, q, fc);
      const c = qRotate(q, fc);
      for (const k of [0, 1, 2]) expect(origin[k]! + c[k]!).toBeCloseTo(anchor[k]!, 12); // the face centre exactly at the anchor
    }
    // ⛔ about the piece's origin (the old rule) the face centre would have moved
    const c0 = qRotate(q0, fc);
    const c1 = qRotate(r.q, fc);
    expect(Math.hypot(c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2])).toBeGreaterThan(0.01);
  });

  it("⭐⭐ the rolls CARRY to a new resting face when the pink face has not changed — at once, in the alignment's own turn", () => {
    const w = code("render/green_box_wiring.ts");
    const align = w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("export function restTargetKey"));
    expect(align).toMatch(/export function alignRestingFace\(st: SceneState, now: number, carryRolls = 0\): boolean \{/);
    expect(align).toMatch(/for \(let i = 0; i < carryRolls; i\+\+\) \{\s*const step = nextEdgeRoll\(base, p\.restingFace\.normal, stops, ref \?\? \[right\.x, right\.y, right\.z\], view\);/);
    expect(align).toMatch(/st\.restAlign = \{ from: q, t0: now, base \};/); // ONE turn, the rolls included
    const roll = w.slice(w.indexOf("export function rollRestingFace"), w.indexOf("export function enterPieceOrbit"));
    expect(roll).toMatch(/rolls: rr\.rolls \+ 1/);
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/const carry = st\.restRoll !== null && st\.restRoll\.key === restTargetKey\(st\) \? st\.restRoll\.rolls : 0;\s*if \(tapped && restOnTappedFace\(st, ft\.faceId\) && alignRestingFace\(st, performance\.now\(\), carry\)\)/);
    // the mesh placed from the ANCHOR last, after the orbit placed it and the sphere and the transitions read it; a new face's jump faded
    expect(w).toMatch(/restAlignFrame\(st, now\);\s*anchorFrame\(st, now\);/);
    expect(w).toMatch(/const at = placeByFaceCentre\(a, \[r\.w, r\.x, r\.y, r\.z\], p\.restingCentre\);\s*const s = anchorShiftNow\(st, now\);/);
    expect(w).toMatch(/st\.anchorShift = \{ off: \[jump\[0\] \+ prev\[0\], jump\[1\] \+ prev\[1\], jump\[2\] \+ prev\[2\]\], t0: performance\.now\(\) \};/);
    expect(w).toMatch(/st\.pieceAnchor = pp;/);
    expect(w).toMatch(/st\.restRoll = null;\s*st\.anchorShift = null;/); // the respawn
  });

  it("⭐⭐ what a tap does: ALIGN until aligned to the SAME face, then ROLL — the orbit finger lifted in between or not", () => {
    expect(tapAction(false, false)).toBe("ALIGN");
    expect(tapAction(false, true)).toBe("ALIGN");
    expect(tapAction(true, false)).toBe("ALIGN"); // the pink face changed since: align again
    expect(tapAction(true, true)).toBe("ROLL");
  });

  it("⭐⭐ wired: the alignment records its target and paired axis; the roll from where the last turn was heading; a respawn clears it; the HUD", () => {
    const w = code("render/green_box_wiring.ts");
    const align = w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("export function restTargetKey"));
    expect(align).toMatch(/paired = r\.pinkAxis;/);
    expect(align).toMatch(/const ref: Vec3 \| null = target !== null && paired >= 0 \? target\.long\.axes\[paired\]! : null;/);
    expect(align).toMatch(/st\.restRoll = \{ key: target\?\.label \?\? "", ref, stop, of: stops\.length, rolls \};/);
    const roll = w.slice(w.indexOf("export function rollRestingFace"), w.indexOf("export function enterPieceOrbit"));
    expect(roll).toMatch(/const from = st\.restAlign\?\.base \?\? shown;/); // quick taps add up
    expect(roll).toMatch(/const right = st\.camera\.getDirection\(new Vector3\(1, 0, 0\)\);/); // no long axis: the screen's horizontal
    expect(roll).toMatch(/const roll = nextEdgeRoll\(from, p\.restingFace\.normal, stops, ref, view\);/);
    expect(roll).toMatch(/st\.restAlign = \{ from: shown, t0: now, base: roll\.q \};/); // one eased turn, REST_ALIGN_MS — about the face centre (the anchor)
    expect(w).toMatch(/st\.restAligned = false;\s*st\.restRoll = null;/); // the respawn
    expect(code("render/scene.ts")).toMatch(/st\.restAligned = false;\s*st\.restRoll = null;/);
    expect(code("render/hud_paint.ts")).toMatch(/ · edge \$\{st\.restRoll\.stop \+ 1\}\/\$\{st\.restRoll\.of\}/);
  });
});
