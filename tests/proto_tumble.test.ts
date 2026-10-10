/**
 * ⭐⭐⭐ prototype — THE YAW AND THE PITCH OF THE ORBITED PIECE (`RESTING_FACE_ALIGNMENT.md` §18; the owner, 2026-10-10: *"build the yaw and
 * pitch"*): the axes from the resting face's couple, the next face by the SECTION LOOP, the couple put back, the screen senses; the gesture
 * (slide or pinch, the latch, the steps); the mouse's two-button drag; the wiring.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { edgeAxisRelative, edgeDirections, nearestCouple, nextEdgeAxis, nextTumble, tumbleAxes, tumbleAxisSigned, type TumbleFace } from "../src/core/tumble";
import { heldStill, startTrail, startTumble, stepTumble, trailAfter, trailBefore, trailTurn, TUMBLE_REST_MS, tumbleTurnOf, type TumbleTrail } from "../src/input/tumble_gesture";
import { pinchDxOpen } from "../src/input/pinch_gate";
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

  it("⭐ a face's EDGE directions, one per line: a rectangle 2, a hexagon 3", () => {
    const P = hexPrism(0.05, 0.1);
    const cap = P.faces.find((f) => f.id === "bottom")!.points;
    expect(edgeDirections(cap.map((p, i) => [p, cap[(i + 1) % cap.length]!] as const))).toHaveLength(3);
    const rect: Vec3[] = [[-1, 0, -2], [1, 0, -2], [1, 0, 2], [-1, 0, 2]];
    expect(edgeDirections(rect.map((p, i) => [p, rect[(i + 1) % 4]!] as const))).toHaveLength(2);
  });

  it("⭐⭐ the owner's report: the turquoise on an END face reaches its SIDE faces — about an EDGE (the first build's axis across the flats only reached the other end)", () => {
    const P = hexPrism(0.05, 0.1);
    const cap = P.faces.find((f) => f.id === "bottom")!.points;
    const dirs = edgeDirections(cap.map((p, i) => [p, cap[(i + 1) % cap.length]!] as const));
    const centre: Vec3 = [0, -0.1, 0];
    for (const d of dirs)
      for (const s of [1, -1]) {
        const t = nextTumble(IDENTITY, P.faces, P.positions, ["bottom"], [0, -1, 0], centre, d.map((v) => v * s) as unknown as Vec3, 1e-6)!;
        expect(t.faceId).toMatch(/^s[0-5]$/);
        expect(deg(t.angleRad)).toBeCloseTo(90, 6);
      }
    // ⛔ the first build: about the axis ACROSS a flat (side 0's normal, x), the plane runs through two corners — only the other end
    const across = nextTumble(IDENTITY, P.faces, P.positions, ["bottom"], [0, -1, 0], centre, [1, 0, 0], 1e-6)!;
    expect(across.faceId).toBe("top");
    // ⭐ and the end face is VERTICAL-agnostic: tumbleAxes now hands an edge direction
    const a = tumbleAxes(IDENTITY, [0, -1, 0], dirs, UP, RIGHT);
    expect(dirs.some((d) => Math.abs(dot(d, a.pitch!)) > 1 - 1e-9)).toBe(true);
  });

  it("⭐ the turquoise on a SIDE face: about its long edge it walks the six sides (60°); about its short edge it reaches an end", () => {
    const P = hexPrism(0.05, 0.1);
    const s0 = P.faces.find((f) => f.id === "s0")!;
    const dirs = edgeDirections(s0.points.map((p, i) => [p, s0.points[(i + 1) % 4]!] as const));
    const centre: Vec3 = [0.05 * Math.cos(Math.PI / 6), 0, 0];
    const long = edgeAxisRelative(IDENTITY, [1, 0, 0], dirs, [0, 1, 0], true)!;
    expect(deg(nextTumble(IDENTITY, P.faces, P.positions, ["s0"], [1, 0, 0], centre, long, 1e-6)!.angleRad)).toBeCloseTo(60, 6);
    const short = edgeAxisRelative(IDENTITY, [1, 0, 0], dirs, [0, 1, 0], false)!;
    expect(["top", "bottom"]).toContain(nextTumble(IDENTITY, P.faces, P.positions, ["s0"], [1, 0, 0], centre, short, 1e-6)!.faceId);
  });

  it("⭐⭐ the swap moves on to the NEXT edge direction: a rectangle alternates its two, a hexagon takes its three in turn", () => {
    const P = hexPrism(0.05, 0.1);
    const cap = P.faces.find((f) => f.id === "bottom")!.points;
    const dirs = edgeDirections(cap.map((p, i) => [p, cap[(i + 1) % cap.length]!] as const));
    const seen: Vec3[] = [dirs[0]!];
    for (let i = 0; i < 3; i++) seen.push(nextEdgeAxis(IDENTITY, [0, -1, 0], dirs, seen[seen.length - 1]!)!);
    const line = (a: Vec3, b: Vec3) => Math.abs(dot(a, b)) > 1 - 1e-9;
    expect(line(seen[0]!, seen[1]!) || line(seen[1]!, seen[2]!) || line(seen[0]!, seen[2]!)).toBe(false); // three different
    expect(line(seen[3]!, seen[0]!)).toBe(true); // and round again
    const rect: Vec3[] = [[1, 0, 0], [0, 0, 1]];
    expect(line(nextEdgeAxis(IDENTITY, [0, -1, 0], rect, [1, 0, 0])!, [0, 0, 1])).toBe(true);
    expect(line(nextEdgeAxis(IDENTITY, [0, -1, 0], rect, [0, 0, 1])!, [1, 0, 0])).toBe(true);
    // ⭐ the input reversed: the hexagon's edge directions taken the other way round — the forward order, mirrored
    const back = nextEdgeAxis(IDENTITY, [0, -1, 0], dirs, seen[1]!, -1)!;
    expect(line(back, seen[0]!)).toBe(true);
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
  const DB = 3.5;
  const STEP = 12;

  it("⭐⭐ the input (2026-10-10): the FIRST touch's travel while the second is held STILL — within its deadband along x and y", () => {
    expect(heldStill(2, -3, DB)).toBe(true);
    expect(heldStill(3.6, 0, DB)).toBe(false);
    expect(heldStill(0, -3.6, DB)).toBe(false);
  });

  it("⭐ the axis is whichever of x and y first passes the deadband", () => {
    const y = stepTumble(startTumble(), [2, -4], DB, STEP).g;
    expect(y.axis).toBe("Y");
    expect(stepTumble(y, [30, -4], DB, STEP).g.axis).toBe("Y"); // a later x does not take it while y stays out
  });

  it("⭐⭐ the choice UNDONE when the travel comes back within the deadband along it — the next axis out owns it (the owner, 2026-10-10)", () => {
    let r = stepTumble(startTumble(), [5, 0], DB, STEP);
    expect(r.g.axis).toBe("X");
    r = stepTumble(r.g, [2, 1], DB, STEP); // back within along x
    expect(r.g.axis).toBeNull();
    expect(r.restarted).toBe(true);
    r = stepTumble(r.g, [2, 6], DB, STEP); // now y leaves it first
    expect(r.g.axis).toBe("Y");
  });

  it("⭐ whole steps of travel, signed; back through zero before the other way", () => {
    let r = stepTumble(startTumble(), [25, 0], DB, STEP);
    expect(r.steps).toBe(2);
    r = stepTumble(r.g, [20, 0], DB, STEP); // back 5: no step
    expect(r.steps).toBe(0);
    r = stepTumble(r.g, [-20, 0], DB, STEP); // back 40 more: two steps back (the deadband crossed on the way does not undo — the travel jumped it)
    expect(r.steps).toBe(-3);
  });

  // a box's two loops through A: the yaw A → B → C → D → A, the pitch A → E → C → F → A — each step a quarter turn
  const Q4 = Math.PI / 2;
  const step = (t: TumbleTrail, from: string, to: string, sense: 1 | -1) => {
    const b = trailBefore(t, from, sense);
    return { action: b.action, trail: trailAfter(b.trail, to, sense, Q4) };
  };

  it("⭐⭐ the SWAP: back on the starting face with a net count, the next step goes on to the NEXT path (pitch after yaw); out and back is no path", () => {
    let t = startTrail("YAW", "A", 1);
    let r = step(t, "A", "B", 1);
    for (const [f, g] of [["B", "C"], ["C", "D"], ["D", "A"]] as const) r = step(r.trail, f, g, 1);
    expect(r.trail.paths[0]!.whole).toBe(true);
    expect(trailTurn(r.trail)).toBe("YAW");
    r = step(r.trail, "A", "E", 1);
    expect(r.action).toBe("NEXT");
    expect(trailTurn(r.trail)).toBe("PITCH");
    // out and back on one path: not whole
    t = startTrail("YAW", "A", 1);
    r = step(step(t, "A", "B", 1).trail, "B", "A", -1);
    expect(r.trail.paths[0]!.whole).toBe(false);
  });

  it("⭐⭐ the input REVERSED walks the faces BACK, across the swap too (the owner: *\"make sure the faces paths are reversed if the input goes in the other direction\"*)", () => {
    // forward: the yaw A B C D A, then the pitch A E
    let r = step(startTrail("YAW", "A", 1), "A", "B", 1);
    for (const [f, g] of [["B", "C"], ["C", "D"], ["D", "A"], ["A", "E"]] as const) r = step(r.trail, f, g, 1);
    expect(trailTurn(r.trail)).toBe("PITCH");
    // back: E → A on the pitch (STAY, its net back to 0) …
    r = step(r.trail, "E", "A", -1);
    expect(r.action).toBe("STAY");
    expect(trailTurn(r.trail)).toBe("PITCH");
    // … then the next step back drops the pitch and walks the YAW backwards: A → D
    r = step(r.trail, "A", "D", -1);
    expect(r.action).toBe("BACK");
    expect(trailTurn(r.trail)).toBe("YAW");
    expect(r.trail.paths).toHaveLength(1);
    expect(r.trail.paths[0]!.net).toBe(3);
    // and forward again from there goes back up the yaw: D → A, then on to the next path
    r = step(r.trail, "D", "A", 1);
    expect(r.action).toBe("STAY");
    expect(step(r.trail, "A", "E", 1).action).toBe("NEXT");
  });

  it("⭐ a path made whole BACKWARDS swaps too — the next path runs in that sense", () => {
    let r = step(startTrail("PITCH", "A", -1), "A", "F", -1);
    for (const [f, g] of [["F", "C"], ["C", "E"], ["E", "A"]] as const) r = step(r.trail, f, g, -1);
    expect(r.trail.paths[0]!.whole).toBe(true);
    const n = step(r.trail, "A", "D", -1);
    expect(n.action).toBe("NEXT");
    expect(trailTurn(n.trail)).toBe("YAW");
  });

  it("⭐⭐ …or WHOLE on a FULL TURN without the face coming back (a faceted sphere's loop) — generalised", () => {
    let t = startTrail("PITCH", "A", 1);
    const faces = ["B", "C", "D", "E", "F", "G", "H"]; // never A again
    let from = "A";
    for (const f of faces) {
      t = trailAfter(trailBefore(t, from, 1).trail, f, 1, (2 * Math.PI) / 7);
      from = f;
    }
    expect(t.paths[0]!.whole).toBe(true);
    expect(trailBefore(t, from, 1).action).toBe("NEXT");
  });

  it("⭐ the RESET: a travel that stops (none, in any direction, for TUMBLE_REST_MS) and moves again latches afresh", () => {
    let r = stepTumble(startTumble(0), [10, 0], DB, STEP, 100);
    expect(r.g.axis).toBe("X");
    r = stepTumble(r.g, [20, 0], DB, STEP, 200);
    expect(r.steps).toBe(1);
    r = stepTumble(r.g, [20, 0.2], DB, STEP, 300);
    r = stepTumble(r.g, [20, 6], DB, STEP, 200 + TUMBLE_REST_MS + 50);
    expect(r.restarted).toBe(true);
    expect(r.g.axis).toBe("Y");
    let t = stepTumble(startTumble(0), [5, 0], DB, STEP, 0);
    for (let i = 1; i < 20; i++) {
      t = stepTumble(t.g, [5 + 3 * i, 0], DB, STEP, i * 100);
      expect(t.restarted).toBe(false);
    }
  });

  it("⭐ what an axis turns first: x yaws on a vertical face and ROLLS on a horizontal one; y pitches", () => {
    expect(tumbleTurnOf("X", true)).toBe("YAW");
    expect(tumbleTurnOf("X", false)).toBe("ROLL");
    expect(tumbleTurnOf("Y", true)).toBe("PITCH");
    expect(tumbleTurnOf("Y", false)).toBe("PITCH");
    expect(DEFAULT_CONFIG.tumbleStepMm).toBe(12);
    expect((DEFAULT_CONFIG as unknown as Record<string, unknown>).tumbleSpacingTolMm).toBeUndefined(); // ⛔ the two-finger slide is deleted
  });

  it("⭐⭐ the ZOOM opens only once BOTH fingers' dx pass the deadband (the owner, 2026-10-10)", () => {
    expect(pinchDxOpen(4, -4, DB)).toBe(true);
    expect(pinchDxOpen(10, 1, DB)).toBe(false); // one finger still: the yaw / pitch, never a zoom
    expect(pinchDxOpen(0, 0, DB)).toBe(false);
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
  it("⭐ touch: armed by a second finger OFF a placed part, the orbit finger's moves owned while it is still, ended by either finger", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/const onPlacedPart = !inBand && hitId !== undefined && st\.world\.objects\.get\(hitId\)\?\.frozen !== true;\s*if \(orbitFinger !== null && !onPlacedPart\) beginTouchTumble\(st, orbitFinger, e\.pointerId\);/);
    const own = p.indexOf('if (feedTouchTumble(st) === "OWNED")');
    expect(own).toBeGreaterThan(0);
    expect(own).toBeLessThan(p.indexOf("const ot = st.orbitTap;\n        const sec = ot?.second;"));
    expect(p).toMatch(/st\.pinch\.end\(\);\s*endTumble\(st, e\.pointerId\);/);
    const t = code("render/tumble_wiring.ts");
    expect(t).toMatch(/!heldStill\(pxToMm\(pb\[0\] - t\.bStart\[0\]\), pxToMm\(pb\[1\] - t\.bStart\[1\]\), st\.cfg\.motionDeadbandMm\)/);
    expect(t).toMatch(/\[pxToMm\(pa\[0\] - t\.aStart\[0\]\), -pxToMm\(pa\[1\] - t\.aStart\[1\]\)\]/);
    expect(t).not.toMatch(/pairReady|spacing/);
  });

  it("⭐ the zoom's gate: the pinch records each finger's x at its start and stays closed until both pass the dx deadband", () => {
    expect(code("render/pointer_wiring.ts")).toMatch(/st\.pinchDx = \{ x0: new Map\(st\.router\.outside\(\)\.map\(\(q\) => \[q\.id, q\.last\.x\] as const\)\), open: false \};/);
    const c = code("render/camera_rig.ts");
    expect(c).toMatch(/if \(gate !== null && !gate\.open\) \{[\s\S]*if \(pinchDxOpen\(dx\[0\] \?\? 0, dx\[1\] \?\? 0, st\.cfg\.motionDeadbandMm\)\) gate\.open = true;\s*st\.pinch\.begin\(p\[0\], p\[1\]\);\s*st\.zoomAtPinchStart = st\.zoom;\s*return;/);
  });

  it("⭐ mouse: the adapter asks the scene at the right press and feeds it the drag", () => {
    const s = code("render/scene.ts");
    expect(s).toMatch(/\(\) => beginMouseTumble\(st\),\s*\(dx, dy\) => feedMouseTumble\(st, dx, dy\),\s*\(\) => endTumble\(st\)\);/);
    expect(code("render/mouse_adapter.ts")).toMatch(/e\.button === 2 && \(e\.buttons & 1\) !== 0 && tumbleOnRight !== undefined \? \{ tumble: tumbleOnRight\(\) \}/);
  });

  it("⭐ only outside the sphere, aligned; the path swaps to the NEXT edge direction; the reset; the clamp; the couple re-aligned", () => {
    const t = code("render/tumble_wiring.ts");
    expect(t).toMatch(/st\.greenBox !== null && st\.pieceOutside === true && st\.restAligned && st\.restRoll !== null/);
    expect(t).toMatch(/if \(t\.turn === "ROLL"\) \{\s*rollRestingFace\(st, now, sense, true\);/);
    expect(t).toMatch(/const before = trailBefore\(t\.trail, face, sense\);/);
    expect(t).toMatch(/if \(before\.action === "BACK"\) t\.axes = t\.axes\.slice\(0, -1\);/);
    expect(t).toMatch(/t\.axes = \[\.\.\.t\.axes, prev === null \? null : otherTumbleAxis\(st, prev, sense\)\];/);
    expect(t).toMatch(/const r = tumbleRestingFace\(st, now, trailTurn\(t\.trail\), sense, t\.axes\[t\.axes\.length - 1\] \?\? null\);/);
    expect(t).toMatch(/t\.trail = trailAfter\(t\.trail, restingFaceKey\(st\), sense, r\.angleRad\);/);
    expect(code("render/green_box_wiring.ts")).toMatch(/return nextEdgeAxis\(q, p\.restingFace\.normal, edgeDirections\(p\.restingEdges\), w, sense\);/);
    expect(t).toMatch(/if \(r\.restarted\) restartPath\(st\);/);
    expect(t).toMatch(/if \(steps === 0 \|\| st\.restAlign !== null\) return;/);
    expect(code("render/pointer_wiring.ts")).toMatch(/if \(r\.steps !== 0 && st\.restAlign === null\) rollRestingFace\(st, performance\.now\(\), r\.steps > 0 \? 1 : -1, true\);/);
    const w = code("render/green_box_wiring.ts");
    const fn = w.slice(w.indexOf("export function tumbleRestingFace("), w.indexOf("export function restingFaceVertical("));
    expect(fn).toMatch(/restOnTappedFace\(st, t\.faceId\)/);
    expect(fn).toMatch(/nearestCouple\(t\.q, np\.restingFace\.normal, np\.restingFlush, rr\.pinkAxes\)/);
    expect(fn).toMatch(/st\.restRoll = \{ \.\.\.rr, rolls: 0, couple: c\.couple \};/);
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"tumbleStepMm", 3, 40, 1)');
    expect(menu).not.toContain("tumbleSpacingTolMm");
  });
});
