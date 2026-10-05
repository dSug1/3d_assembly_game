/**
 * ⭐⭐⭐ prototype — THE RESTING-FACE ALIGNMENT OF THE ORBITED PIECE (`Claude/40_RENDER_SCENE/spec/RESTING_FACE_ALIGNMENT.md`; the owner,
 * 2026-10-05): the face's long axes, the alignment's target, the second-finger tap while orbiting, the mouse's right tap, the wiring.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { meshTopology } from "../src/core/mesh_topology";
import { chooseInGroup, faceLongAxes, restAlignTarget, restingFaces } from "../src/core/resting_face";
import { dot, qRotate, type Quat, type Vec3 } from "../src/core/vec";
import { counterYaw, greenBootOrientation, wrapAngle } from "../src/input/green_box";
import { isOrbitTap, orbitTapCount, secondPinches } from "../src/input/orbit_tap";
import { MouseSecondTouch } from "../src/input/mouse_second_touch";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const D = Math.PI / 180;

function frustum() {
  const W = 51.75, Dd = 22.5, H = 41.25, w = 25.875, d = 11.25;
  const c: Vec3[] = [[-W, 0, -Dd], [W, 0, -Dd], [w, H, -d], [-w, H, -d], [-W, 0, Dd], [W, 0, Dd], [w, H, d], [-w, H, d]];
  const tris = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];
  return meshTopology(new Float32Array(c.flat()), tris);
}
function hexPrism() {
  const m = CreateCylinder("h", { height: 103.5, diameter: 51.75, tessellation: 6 }, new Scene(new NullEngine()));
  m.convertToFlatShadedMesh();
  return meshTopology(new Float32Array(m.getVerticesData(VertexBuffer.PositionKind)!), m.getIndices()!);
}

describe("⭐⭐⭐ prototype — the resting-face alignment", () => {
  it("⭐⭐ the long axis: the green bottom's LENGTH (103.5, not 45); the hexagon end's three FLAT-TO-FLAT axes (never corner to corner)", () => {
    const rect: Vec3[] = [[-51.75, 0, -22.5], [51.75, 0, -22.5], [51.75, 0, 22.5], [-51.75, 0, 22.5]];
    const r = faceLongAxes(rect, [0, -1, 0], 0.01);
    expect(r.axes).toHaveLength(1);
    expect(Math.abs(r.axes[0]![0])).toBeCloseTo(1, 9);
    expect(r.length).toBeCloseTo(103.5, 9);
    expect(r.fallback).toBe(false);
    // the hexagon: corners at 0°, 60°, … (circumradius 25.875) — its flat-to-flat axes are at 30°, 90°, 150°, 44.8 long
    const hex: Vec3[] = [0, 60, 120, 180, 240, 300].map((a) => [25.875 * Math.cos(a * D), 0, 25.875 * Math.sin(a * D)]);
    const h = faceLongAxes(hex, [0, -1, 0], 0.01);
    expect(h.axes).toHaveLength(3);
    expect(h.length).toBeCloseTo(2 * 25.875 * Math.cos(30 * D), 6);
    for (const a of h.axes) {
      const ang = (((Math.atan2(a[2], a[0]) / D) % 60) + 60) % 60;
      expect(Math.min(Math.abs(ang - 30), 60 - Math.abs(ang - 30))).toBeLessThan(1e-6); // ⛔ never along a corner (0°, 60°, …)
    }
  });

  it("⚠ an odd-sided face (a triangle) has no edge-to-edge axis: its longest mirror axis, flagged", () => {
    const tri: Vec3[] = [0, 120, 240].map((a) => [Math.cos(a * D), 0, Math.sin(a * D)]);
    const t = faceLongAxes(tri, [0, 1, 0], 1e-6);
    expect(t.fallback).toBe(true);
    expect(t.axes.length).toBeGreaterThan(0);
  });

  it("⭐⭐ the target: the resting face DOWN, its long axis along the horizontal direction to the ring — from the green piece's tumbled boot pose", () => {
    const t = frustum();
    const res = restingFaces(t.positions, t.faces);
    const q0 = greenBootOrientation("Scene_1");
    const face = chooseInGroup(res.winner!, q0);
    const pts = [...new Set(face.faces.flatMap((f) => t.faces[f]!.triangles))].map((i) => t.positions[i]!);
    const axes = faceLongAxes(pts, face.normal, 0.6).axes;
    const toward: Vec3 = [0.6, 0.3, -0.8]; // toward the ring, with a vertical part (ignored)
    const q = restAlignTarget(q0, face.normal, axes, toward);
    expect(dot(qRotate(q, face.normal), [0, -1, 0])).toBeCloseTo(1, 9); // the face down
    const w = qRotate(q, axes[0]!);
    expect(w[1]).toBeCloseTo(0, 9); // the long axis horizontal
    const flat = Math.hypot(0.6, 0.8);
    expect(Math.abs(dot(w, [0.6 / flat, 0, -0.8 / flat]))).toBeCloseTo(1, 9); // along the direction to the ring
  });

  it("⭐ of several long axes (the hexagon end), the one ALREADY closest to the ring is the one turned onto it — the smallest yaw", () => {
    const t = hexPrism();
    const res = restingFaces(t.positions, t.faces);
    const q0: Quat = [1, 0, 0, 0];
    const face = chooseInGroup(res.winner!, q0); // the end facing down: no first turn
    const pts = [...new Set(face.faces.flatMap((f) => t.faces[f]!.triangles))].map((i) => t.positions[i]!);
    const axes = faceLongAxes(pts, face.normal, 0.6).axes;
    expect(axes).toHaveLength(3);
    const toward: Vec3 = [Math.cos(100 * D), 0, Math.sin(100 * D)];
    const q = restAlignTarget(q0, face.normal, axes, toward);
    const yaw = Math.acos(Math.min(1, Math.abs(q[0]))) * 2; // the turn it made, radians
    expect(yaw / D).toBeLessThanOrEqual(30 + 1e-6); // three axes 60° apart (six directions): never more than 30°
  });

  it("⭐⭐ the second touch: a PINCH the moment it passes the deadband; a TAP released within the time, never pinched, the orbit still down", () => {
    expect(secondPinches(3.4, 3.5)).toBe(false);
    expect(secondPinches(3.6, 3.5)).toBe(true);
    expect(isOrbitTap(1000, 1150, 200, false, true)).toBe(true);
    expect(isOrbitTap(1000, 1250, 200, false, true)).toBe(false); // held too long
    expect(isOrbitTap(1000, 1100, 200, true, true)).toBe(false); // it pinched
    expect(isOrbitTap(1000, 1100, 200, false, false)).toBe(false); // the orbit finger lifted first
    expect(orbitTapCount(0)).toEqual({ count: 1, aligns: true });
    expect(orbitTapCount(1)).toEqual({ count: 2, aligns: false }); // the later taps: to be defined
    expect(DEFAULT_CONFIG.tapMaxDuration).toBe(200); // ⭐ Unity's, for every tap (option 1)
    expect(code("render/tuning_menu.ts")).toContain('"tapMaxDuration", 100, 400, 10)');
  });

  it("⭐ the mouse: a right press while the left is down is TIMED and reported at its release; a plain right click is untouched", () => {
    const m = new MouseSecondTouch();
    m.step({ type: "DOWN", button: 0, buttons: 1, shift: false, x: 0, y: 0, t: 0 });
    m.step({ type: "DOWN", button: 2, buttons: 3, shift: false, x: 0, y: 0, t: 1000 });
    expect(m.step({ type: "UP", button: 2, buttons: 1, shift: false, x: 5, y: 0, t: 1130 }).rightTapMs).toBe(130);
    const plain = new MouseSecondTouch();
    plain.step({ type: "DOWN", button: 2, buttons: 2, shift: false, x: 0, y: 0, t: 0 });
    expect(plain.step({ type: "UP", button: 2, buttons: 0, shift: false, x: 0, y: 0, t: 100 }).rightTapMs).toBeUndefined();
  });

  it("⭐⭐⭐ the piece turns AGAINST the orbit, the same amount, about the vertical (the owner: *\"in all cases … also at boot\"*)", () => {
    // the orbit moved the piece's heading by +0.3 rad about +y: the piece turns by −0.3 about +y
    const q0: Quat = [1, 0, 0, 0];
    const q = counterYaw(q0, 0.3);
    const x = qRotate(q, [1, 0, 0]);
    expect(Math.atan2(-x[2], x[0])).toBeCloseTo(-0.3, 12); // a turn of −0.3 about +y takes x to (cos, 0, sin(0.3))
    expect(x[1]).toBeCloseTo(0, 12); // about the vertical only
    // a tumbled piece: its vertical tilt is untouched, its heading turns by −d
    const t = greenBootOrientation("Scene_1");
    const up = (r: Quat) => qRotate(r, [0, 1, 0])[1];
    expect(up(counterYaw(t, 1.1))).toBeCloseTo(up(t), 12);
    // the heading's change across the ±π seam is the short way round
    expect(wrapAngle(3.1 - -3.1)).toBeCloseTo(6.2 - 2 * Math.PI, 12);
    expect(wrapAngle(-0.2)).toBeCloseTo(-0.2, 12);
    expect(wrapAngle(Math.PI)).toBeCloseTo(Math.PI, 12);
    // ⭐ once aligned, the resting face's normal IS the vertical: the turn is about it
    const n: Vec3 = [0, -1, 0];
    expect(dot(qRotate(counterYaw(q0, 0.7), n), n)).toBeCloseTo(1, 12);
  });

  it("⭐⭐ wired: every frame from the spring's heading, at boot and before the alignment; STOPPED once aligned; a respawn starts again", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const d = wrapAngle\(h - prev\);\s*if \(d === 0\) return;\s*const r = box\.rotationQuaternion \?\? Quaternion\.Identity\(\);\s*const q = counterYaw\(\[r\.w, r\.x, r\.y, r\.z\], d\);/);
    // ⛔ the owner, 2026-10-05: *"remove the rotation when the resting piece is aligned"* — it stops at the tap, and stays stopped
    expect(w).toMatch(/if \(prev === null \|\| st\.restAligned\) return;/);
    expect(w).toMatch(/st\.restAlign = \{ from: q, t0: now, base \};\s*st\.restAligned = true;/);
    expect(w).toMatch(/st\.restAlign = null;\s*st\.orbitHeadingPrev = null;\s*st\.restAligned = false;/); // the respawn clears it
    // ⛔ no gate on a finger: before the alignment the frame step runs whatever the finger does
    expect(w).toMatch(/function counterYawFrame\(st: SceneState\): void \{\s*const box = st\.greenBox;\s*if \(box === null \|\| st\.boxOrbit === null\) return;/);
  });

  it("⭐⭐ wired: the second touch while orbiting never grabs; the orbit goes on until it pinches; its tap is consumed; the lift resets", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/const rayHit =\s*orbitFinger !== null \? null : throughGreenBox\(/);
    expect(p).toMatch(/if \(secondPinches\(pxToMm\(Math\.hypot\(s\.x - sec\.pressX, s\.y - sec\.pressY\)\), st\.cfg\.motionDeadbandMm\)\) \{\s*sec\.pinched = true;\s*updatePinch\(st\);/);
    expect(p).toMatch(/\} else if \(e\.pointerId === ot\.orbitPointer\) \{\s*\/\/[^\n]*\n\s*orbitDragStep\(st, e\.pointerId, s, prev\);/);
    // the tap is judged and CONSUMED before the camera-reset / mode-toggle taps
    expect(p).toMatch(/if \(isOrbitTap\(sec\.pressT, s\.t, st\.cfg\.tapMaxDuration, sec\.pinched, stillDown\)\) orbitTapped\(st, performance\.now\(\)\);\s*st\.hudDirty = true;\s*return;/);
    const i0 = p.indexOf("the second touch released — a TAP if quick");
    const i1 = p.indexOf("orbitTapped(st, performance.now())");
    expect(i0).toBeGreaterThan(0);
    expect(i1).toBeGreaterThan(i0);
    expect(p.indexOf("noteTap(", i0)).toBeGreaterThan(i1); // the release branch's camera-reset / toggle tap comes after
    // the lift resets the count — and nothing else (the piece turns against the orbit in ALL cases, §2bis)
    expect(p).toMatch(/st\.orbitTap = null;\s*st\.hudDirty = true;\s*\}/);
    expect(p).not.toMatch(/stopRestFollow/);
    // the first tap aligns and costs ONE episode
    expect(p).toMatch(/if \(r\.aligns && alignRestingFace\(st, now\)\) \{\s*st\.episodes\.touch\(--st\.episodeSeq, true, true\);\s*st\.episodes\.sync\(true\);/);
    // the mouse's right tap
    expect(code("render/scene.ts")).toMatch(/\(heldMs\) => orbitRightTap\(st, heldMs\)/);
    expect(p).toMatch(/if \(!isOrbitTap\(0, heldMs, st\.cfg\.tapMaxDuration, false, true\)\) return;/);
    const w = code("render/green_box_wiring.ts");
    // the target, the ease (125 ms), the follow by the orbit's heading until the finger lifts
    // ⭐ `1.0.59q-`: the target is by the PINK FACE now (`proto_resting_face_align.test.ts`)
    expect(w).toMatch(/const r = restAlignToFace\(/);
    expect(w).toMatch(/const REST_ALIGN_MS = 125;/);
    expect(w).toMatch(/const q = u < 1 \? qSlerp\(a\.from, a\.base, u \* u \* \(3 - 2 \* u\)\) : a\.base;/);
    expect(w).toMatch(/return Math\.atan2\(o\[0\], o\[2\]\);/);
  });
});
