/**
 * ⭐⭐⭐ prototype — THE YAW AND THE PITCH OF THE ORBITED PIECE (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"build the yaw and
 * pitch"*): the axes from the resting face's couple, the next face by the SECTION LOOP, the couple put back, the screen senses; the gesture
 * (slide or pinch, the latch, the steps); the mouse's two-button drag; the wiring.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { nearestCouple, nextTumble, tumbleAxes, tumbleAxisSigned, type TumbleFace } from "../src/core/tumble";
import { startTumble, stepTumble, tumbleTurnOf } from "../src/input/tumble_gesture";
import { MouseSecondTouch } from "../src/input/mouse_second_touch";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { dot, qFromAxisAngle, qmul, qRotate, IDENTITY, type Quat, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const near = (a: Vec3, b: Vec3, eps = 1e-6) => a.every((v, i) => Math.abs(v - b[i]!) < eps);
const deg = (r: number) => (r * 180) / Math.PI;

/** A box `2X × 2Y × 2Z`, its faces named by their normals. */
function box(X: number, Y: number, Z: number): { faces: TumbleFace[]; positions: Vec3[] } {
  const positions: Vec3[] = [];
  for (const x of [-X, X]) for (const y of [-Y, Y]) for (const z of [-Z, Z]) positions.push([x, y, z]);
  const face = (id: string, normal: Vec3): TumbleFace => ({
    id,
    normal,
    points: positions.filter((p) => dot(p, normal) > 0 && Math.abs(dot(p, normal) - Math.abs(dot([X, Y, Z], normal.map(Math.abs) as unknown as Vec3))) < 1e-9),
  });
  return {
    positions,
    faces: [face("+x", [1, 0, 0]), face("-x", [-1, 0, 0]), face("+y", [0, 1, 0]), face("-y", [0, -1, 0]), face("+z", [0, 0, 1]), face("-z", [0, 0, -1])],
  };
}

/** A hexagonal prism (the turquoise piece's shape): its axis along y, sides at 0°, 60°, … in xz, caps ±y. */
function hexPrism(R: number, H: number): { faces: TumbleFace[]; positions: Vec3[] } {
  const ring = (y: number) => [0, 1, 2, 3, 4, 5].map((k) => [R * Math.cos(((k + 0.5) * Math.PI) / 3), y, R * Math.sin(((k + 0.5) * Math.PI) / 3)] as Vec3);
  const lo = ring(-H);
  const hi = ring(H);
  const faces: TumbleFace[] = [0, 1, 2, 3, 4, 5].map((k) => ({
    id: `s${k}`,
    normal: [Math.cos((k * Math.PI) / 3), 0, Math.sin((k * Math.PI) / 3)],
    points: [lo[(k + 5) % 6]!, lo[k]!, hi[k]!, hi[(k + 5) % 6]!],
  }));
  faces.push({ id: "top", normal: [0, 1, 0], points: hi }, { id: "bottom", normal: [0, -1, 0], points: lo });
  return { faces, positions: [...lo, ...hi] };
}

const UP: Vec3 = [0, 1, 0];
const RIGHT: Vec3 = [1, 0, 0];

describe("⭐⭐⭐ prototype — the yaw and the pitch: the geometry (`core/tumble.ts`)", () => {
  // the green box's proportions: long x, thin y, z between; resting on −y, its edge-to-edge axes x and z
  const B = box(0.2, 0.05, 0.1);
  const restAxes: Vec3[] = [[1, 0, 0], [0, 0, 1]];
  const restCentre: Vec3 = [0, -0.05, 0];

  it("⭐ a HORIZONTAL resting face has no yaw; its pitch is about the couple axis most along the screen", () => {
    const a = tumbleAxes(IDENTITY, [0, -1, 0], restAxes, UP, RIGHT);
    expect(a.vertical).toBe(false);
    expect(a.yaw).toBeNull();
    expect(Math.abs(dot(a.pitch!, RIGHT))).toBeCloseTo(1, 9);
  });

  it("⭐⭐ a VERTICAL resting face yaws about GRAVITY (its couple axis closest to it) and pitches across it", () => {
    const q = qFromAxisAngle([0, 0, 1], Math.PI / 2); // −y → +x: the face stands
    const a = tumbleAxes(q, [0, -1, 0], restAxes, UP, RIGHT);
    expect(a.vertical).toBe(true);
    expect(near(a.yaw!, [0, 1, 0])).toBe(true);
    expect(Math.abs(dot(a.pitch!, [0, 0, 1]))).toBeCloseTo(1, 9);
  });

  it("⭐⭐ the YAW steps onto the NEXT side face of the section loop (90° on a box), in the turn's sense — never an end face", () => {
    const q = qFromAxisAngle([0, 0, 1], Math.PI / 2);
    const plus = nextTumble(q, B.faces, B.positions, ["-y"], [0, -1, 0], restCentre, [0, 1, 0], 1e-6)!;
    expect(plus.faceId).toBe("+z");
    expect(deg(plus.angleRad)).toBeCloseTo(90, 6);
    // ⭐ the new face's normal is exactly where the old one's was
    expect(near(qRotate(plus.q, [0, 0, 1]), qRotate(q, [0, -1, 0]))).toBe(true);
    const minus = nextTumble(q, B.faces, B.positions, ["-y"], [0, -1, 0], restCentre, [0, -1, 0], 1e-6)!;
    expect(minus.faceId).toBe("-z");
  });

  it("⭐⭐ the owner's case: the box TILTED (its top and bottom no longer flat) — the loop is the face's own, so ±x stay off it", () => {
    const tilt = qmul(qFromAxisAngle([0.3, 0.2, 0.9], 0.6), qFromAxisAngle([0, 0, 1], Math.PI / 2));
    const a = tumbleAxes(tilt, [0, -1, 0], restAxes, UP, RIGHT);
    for (const axis of [a.yaw, a.pitch]) {
      if (axis === null) continue;
      for (const s of [1, -1]) {
        const t = nextTumble(tilt, B.faces, B.positions, ["-y"], [0, -1, 0], restCentre, axis.map((v) => v * s) as unknown as Vec3, 1e-6)!;
        expect(t).not.toBeNull();
        expect(deg(t.angleRad)).toBeCloseTo(90, 6);
        expect(near(qRotate(t.q, B.faces.find((f) => f.id === t.faceId)!.normal), qRotate(tilt, [0, -1, 0]))).toBe(true);
      }
    }
    // the yaw axis is the box's x (its couple axis closest to gravity): its loop is ±z and +y — the ends ±x never
    const yawPlus = nextTumble(tilt, B.faces, B.positions, ["-y"], [0, -1, 0], restCentre, a.yaw!, 1e-6)!;
    expect(["+z", "-z"]).toContain(yawPlus.faceId);
  });

  it("⭐ the turquoise piece: on a side face, the yaw steps 60° to the next side", () => {
    const P = hexPrism(0.05, 0.1);
    const t = nextTumble(IDENTITY, P.faces, P.positions, ["s0"], [1, 0, 0], [0.05 * Math.cos(Math.PI / 6), 0, 0], [0, 1, 0], 1e-6)!;
    expect(deg(t.angleRad)).toBeCloseTo(60, 6);
    expect(["s1", "s5"]).toContain(t.faceId);
  });

  it("⭐ a face NOT on the convex hull is no stop (a piece rests on its hull): the loop skips it", () => {
    const q = qFromAxisAngle([0, 0, 1], Math.PI / 2);
    const withBump = [...B.positions, [0, 0, 0.15] as Vec3]; // a vertex beyond the +z face's plane
    const t = nextTumble(q, B.faces, withBump, ["-y"], [0, -1, 0], restCentre, [0, 1, 0], 1e-6)!;
    expect(t.faceId).toBe("+y");
    expect(deg(t.angleRad)).toBeCloseTo(180, 6);
  });

  it("⭐⭐ the SECTION PLANE decides the loop: a chamfer at one end (a hull face, as far round as the side) is off it", () => {
    // the box's corner at +x, +z cut off by a 45° chamfer of 0.05 — listed FIRST, so only the plane keeps it from winning the tie
    const X = 0.2, Y = 0.05, Z = 0.1, c = 0.05;
    const positions: Vec3[] = [];
    for (const y of [-Y, Y]) positions.push([-X, y, -Z], [-X, y, Z], [X, y, -Z], [X - c, y, Z], [X, y, Z - c]);
    const at = (pred: (p: Vec3) => boolean) => positions.filter(pred);
    const faces: TumbleFace[] = [
      { id: "chamfer", normal: [Math.SQRT1_2, 0, Math.SQRT1_2], points: at((p) => (p[0] === X - c && p[2] === Z) || (p[0] === X && p[2] === Z - c)) },
      { id: "+z", normal: [0, 0, 1], points: at((p) => p[2] === Z) },
      { id: "-z", normal: [0, 0, -1], points: at((p) => p[2] === -Z) },
      { id: "+y", normal: [0, 1, 0], points: at((p) => p[1] === Y) },
      { id: "-y", normal: [0, -1, 0], points: at((p) => p[1] === -Y) },
    ];
    const t = nextTumble(IDENTITY, faces, positions, ["-y"], [0, -1, 0], [0, -0.05, 0], [1, 0, 0], 1e-6)!;
    expect(t.faceId).toBe("+z");
  });

  it("⭐⭐ a SLANTED next face: the turn about the axis leaves a tilt, taken out so its normal is exactly the old one's", () => {
    // the +z side leans toward +x (its corners at +x pulled in by 0.04): its normal has a part along the pitch axis x
    const X = 0.2, Y = 0.05, Z = 0.1, d = 0.04;
    const positions: Vec3[] = [];
    for (const x of [-X, X]) for (const y of [-Y, Y]) positions.push([x, y, -Z], [x, y, x > 0 ? Z - d : Z]);
    const n: Vec3 = [d / Math.hypot(d, 2 * X), 0, (2 * X) / Math.hypot(d, 2 * X)];
    const faces: TumbleFace[] = [
      { id: "+z", normal: n, points: positions.filter((p) => p[2] > 0) },
      { id: "-z", normal: [0, 0, -1], points: positions.filter((p) => p[2] === -Z) },
      { id: "+y", normal: [0, 1, 0], points: positions.filter((p) => p[1] === Y) },
      { id: "-y", normal: [0, -1, 0], points: positions.filter((p) => p[1] === -Y) },
    ];
    const t = nextTumble(IDENTITY, faces, positions, ["-y"], [0, -1, 0], [0, -0.05, 0], [1, 0, 0], 1e-6)!;
    expect(t.faceId).toBe("+z");
    expect(deg(t.angleRad)).toBeCloseTo(90, 6);
    expect(near(qRotate(t.q, n), [0, -1, 0], 1e-9)).toBe(true);
  });

  it("⭐⭐ the couple put back: the SMALLEST spin about the normal, either sense, an axis being a line", () => {
    const off = (d: number): Quat => qFromAxisAngle([0, 1, 0], (d * Math.PI) / 180);
    const pink: Vec3[] = [[1, 0, 0], [0, 0, 1]];
    // ⚠ the spin is about the resting NORMAL (−y here), so a twist given about +y reads with the other sign
    for (const [d, want] of [[30, 30], [-20, -20], [80, -10], [0, 0]] as const) {
      const c = nearestCouple(off(d), [0, -1, 0], restAxes, pink);
      expect(deg(c.angleRad)).toBeCloseTo(want, 6);
      const x = qRotate(c.q, [1, 0, 0]);
      expect(Math.abs(Math.abs(x[0]) - 1) < 1e-9 || Math.abs(Math.abs(x[2]) - 1) < 1e-9).toBe(true);
    }
    expect(nearestCouple(IDENTITY, [0, -1, 0], [], pink).couple).toBeNull();
  });

  it("⭐ the senses: a yaw RIGHT moves the near side right; a pitch UP tips the top away (world vectors, so no handedness)", () => {
    const view: Vec3 = [0, 0, 1];
    const right: Vec3 = [1, 0, 0];
    const up: Vec3 = [0, 1, 0];
    const yaw = tumbleAxisSigned("YAW", [0, 1, 0], 1, view, right, up);
    const nearSide: Vec3 = [0, 0, -1];
    const moves = (a: Vec3, r: Vec3) => [a[1] * r[2] - a[2] * r[1], a[2] * r[0] - a[0] * r[2], a[0] * r[1] - a[1] * r[0]] as Vec3;
    expect(dot(moves(yaw, nearSide), right)).toBeGreaterThan(0);
    expect(dot(moves(tumbleAxisSigned("YAW", [0, 1, 0], -1, view, right, up), nearSide), right)).toBeLessThan(0);
    const pitch = tumbleAxisSigned("PITCH", [-1, 0, 0], 1, view, right, up);
    expect(dot(moves(pitch, up), view)).toBeGreaterThan(0);
  });
});

describe("⭐⭐ prototype — the yaw / pitch gesture (`input/tumble_gesture.ts`)", () => {
  const TOL = 6;
  const DB = 3.5;
  const STEP = 12;

  it("⭐ two fingers: UNDECIDED until the spacing changes (a PINCH) or the midpoint travels with it kept (a SLIDE) — latched", () => {
    const g0 = startTumble(40);
    expect(g0.kind).toBe("UNDECIDED");
    expect(stepTumble(g0, [1, 1], 41, TOL, DB, STEP).g.kind).toBe("UNDECIDED");
    expect(stepTumble(g0, [1, 0], 47, TOL, DB, STEP).g.kind).toBe("PINCH");
    const s = stepTumble(g0, [5, 0], 42, TOL, DB, STEP).g;
    expect(s.kind).toBe("SLIDE");
    // latched: a later spacing change does not make it a pinch
    expect(stepTumble(s, [6, 0], 60, TOL, DB, STEP).g.kind).toBe("SLIDE");
  });

  it("⭐ the mouse is a SLIDE from the start; the axis is whichever of x and y first passes the deadband, kept to the release", () => {
    const m = startTumble(null);
    expect(m.kind).toBe("SLIDE");
    const y = stepTumble(m, [2, -4], null, TOL, DB, STEP).g;
    expect(y.axis).toBe("Y");
    expect(stepTumble(y, [30, -4], null, TOL, DB, STEP).g.axis).toBe("Y"); // a later x does not take it
  });

  it("⭐ whole steps of travel, signed, a fresh count per gesture; back through zero before the other way", () => {
    let g = startTumble(null);
    let r = stepTumble(g, [25, 0], null, TOL, DB, STEP);
    expect(r.steps).toBe(2);
    g = r.g;
    r = stepTumble(g, [20, 0], null, TOL, DB, STEP); // back 5: no step
    expect(r.steps).toBe(0);
    r = stepTumble(r.g, [-6, 0], null, TOL, DB, STEP); // 31 mm back from the two steps forward: two steps back — net zero at −6 mm
    expect(r.steps).toBe(-2);
  });

  it("⭐ what an axis turns: x yaws on a vertical face and ROLLS on a horizontal one (the owner's choice); y pitches", () => {
    expect(tumbleTurnOf("X", true)).toBe("YAW");
    expect(tumbleTurnOf("X", false)).toBe("ROLL");
    expect(tumbleTurnOf("Y", true)).toBe("PITCH");
    expect(tumbleTurnOf("Y", false)).toBe("PITCH");
    expect(DEFAULT_CONFIG.tumbleStepMm).toBe(12);
    expect(DEFAULT_CONFIG.tumbleSpacingTolMm).toBe(6);
  });
});

describe("⭐⭐ prototype — the desktop: left + right buttons held, a drag", () => {
  it("⭐ the scene said so at the right press: the cursor's moves are the yaw / pitch, the orbit pointer stays; never a right tap", () => {
    const m = new MouseSecondTouch();
    m.step({ type: "DOWN", button: 0, buttons: 1, shift: false, x: 0, y: 0, t: 0 });
    m.step({ type: "DOWN", button: 2, buttons: 3, shift: false, x: 0, y: 0, t: 10, tumble: true });
    const v = m.step({ type: "MOVE", button: -1, buttons: 3, shift: false, x: 7, y: -2, t: 20 });
    expect(v.rightDrag).toEqual({ dx: 7, dy: -2 });
    expect(v.skip).toBe(true);
    expect(v.emit).toEqual([]);
    const up = m.step({ type: "UP", button: 2, buttons: 1, shift: false, x: 7, y: -2, t: 30 });
    expect(up.rightDragEnd).toBe(true);
    expect(up.rightTapMs).toBeUndefined();
    // ⭐ the left drag goes on from where the orbit pointer was — re-issued there, no jump
    const after = m.step({ type: "MOVE", button: -1, buttons: 1, shift: false, x: 9, y: -2, t: 40 });
    expect(after.emit).toEqual([{ target: "REAL", kind: "MOVE", x: 2, y: 0 }]);
  });

  it("⭐ the scene said no (a part held, inside the sphere): the move drives the left pointer as before", () => {
    const m = new MouseSecondTouch();
    m.step({ type: "DOWN", button: 0, buttons: 1, shift: false, x: 0, y: 0, t: 0 });
    m.step({ type: "DOWN", button: 2, buttons: 3, shift: false, x: 0, y: 0, t: 10, tumble: false });
    const v = m.step({ type: "MOVE", button: -1, buttons: 3, shift: false, x: 7, y: -2, t: 20 });
    expect(v.rightDrag).toBeUndefined();
    expect(v.skip).toBe(false);
  });

  it("⭐ a button released off the page ends the drag (the mask, as for every pointer here)", () => {
    const m = new MouseSecondTouch();
    m.step({ type: "DOWN", button: 0, buttons: 1, shift: false, x: 0, y: 0, t: 0 });
    m.step({ type: "DOWN", button: 2, buttons: 3, shift: false, x: 0, y: 0, t: 10, tumble: true });
    expect(m.step({ type: "MOVE", button: -1, buttons: 1, shift: false, x: 3, y: 0, t: 20 }).rightDragEnd).toBe(true);
  });
});

describe("⭐⭐ prototype — the yaw / pitch, wired", () => {
  it("⭐ touch: begun by the second finger, its moves owned before the orbit / pinch / taps, ended by either finger", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(orbitFinger !== null\) beginTouchTumble\(st, orbitFinger, e\.pointerId\);/);
    const own = p.indexOf("if (feedTouchTumble(st) === \"OWNED\")");
    expect(own).toBeGreaterThan(0);
    expect(own).toBeLessThan(p.indexOf("const ot = st.orbitTap;\n        const sec = ot?.second;"));
    expect(p).toMatch(/st\.pinch\.end\(\);\s*endTumble\(st, e\.pointerId\);/);
  });

  it("⭐ mouse: the adapter asks the scene at the right press and feeds it the drag", () => {
    const s = code("render/scene.ts");
    expect(s).toMatch(/\(\) => beginMouseTumble\(st\),\s*\(dx, dy\) => feedMouseTumble\(st, dx, dy\),\s*\(\) => endTumble\(st\)\);/);
    expect(code("render/mouse_adapter.ts")).toMatch(/e\.button === 2 && \(e\.buttons & 1\) !== 0 && tumbleOnRight !== undefined \? \{ tumble: tumbleOnRight\(\) \}/);
  });

  it("⭐ only outside the sphere, aligned; x rolls on a horizontal face; a step re-aligns the couple and restarts the roll count", () => {
    const t = code("render/tumble_wiring.ts");
    expect(t).toMatch(/st\.greenBox !== null && st\.pieceOutside === true && st\.restAligned && st\.restRoll !== null/);
    expect(t).toMatch(/t\.turn === "ROLL" \? rollRestingFace\(st, now, sense, true\) : tumbleRestingFace\(st, now, t\.turn, sense\)/);
    const w = code("render/green_box_wiring.ts");
    const fn = w.slice(w.indexOf("export function tumbleRestingFace("), w.indexOf("export function restingFaceVertical("));
    expect(fn).toMatch(/restOnTappedFace\(st, t\.faceId\)/);
    expect(fn).toMatch(/nearestCouple\(t\.q, np\.restingFace\.normal, np\.restingFlush, rr\.pinkAxes\)/);
    expect(fn).toMatch(/st\.restRoll = \{ \.\.\.rr, rolls: 0, couple: c\.couple \};/);
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"tumbleStepMm", 3, 40, 1)');
    expect(menu).toContain('"tumbleSpacingTolMm", 1, 20, 0.5)');
  });
});
