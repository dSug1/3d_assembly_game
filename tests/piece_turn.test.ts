// ⭐⭐⭐ (2026-11-25, `IN14`, `PIECE_TURN.md` §4) THE PIECE ZONE'S RULES, engine-free — the zone on the glass, the commit, the turn under the finger, the lit
// quad, the twist, the roll's nearest stop, the step back's two searches (sphere tracing, conservative advancement), the pivot about the centre, the
// undo's history. RED against `9dacca36` (the module did not exist).
import { describe, expect, it } from "vitest";
import {
  advanceAlong,
  boundingSphereOf,
  inZone,
  litDirection,
  nearestAngle,
  nearestRollStop,
  pressHeldShows,
  pieceRollAngle,
  pieceTurnDegrees,
  pivotOffset,
  sceneOrbitDegPerMm,
  sphereRadiusOnGlassPx,
  traceStep,
  trackballTurn,
  TurnHistory,
  twistAngle,
  twistIsTap,
  zoneCommitted,
  zoneQuadsShare,
  zoneRadiusPx,
} from "../src/input/piece_turn";
import { qFromAxisAngle, qmul, qRotate, type Quat, type Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const close = (a: readonly number[], b: readonly number[], eps = 1e-9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, -Math.log10(eps)));

describe("⭐ the zone on the glass (§4.1)", () => {
  it("the sphere on the glass plus the margin, floored, capped", () => {
    expect(zoneRadiusPx(40, 20, 36, 300)).toBe(60);
    expect(zoneRadiusPx(5, 10, 36, 300)).toBe(36); // the floor: a finger's target
    expect(zoneRadiusPx(900, 20, 36, 300)).toBe(300); // the cap: room outside it always
    expect(zoneRadiusPx(900, 20, 36, 10)).toBe(36); // a cap under the floor never shrinks it below the floor
  });
  it("in or out, the edge in", () => {
    expect(inZone(10, 0, 0, 0, 10)).toBe(true);
    expect(inZone(10.01, 0, 0, 0, 10)).toBe(false);
  });
  it("a sphere's radius on the glass (vertical field of view)", () => {
    // R = d · tan(fov/2): the sphere's radius is half the glass's height
    expect(sphereRadiusOnGlassPx(Math.tan(0.4), 1, 0.8, 1000)).toBeCloseTo(500, 6);
    expect(sphereRadiusOnGlassPx(1, 0, 0.8, 1000)).toBe(Infinity); // at the eye: everywhere
  });
});

describe("⭐ the commit (§4.2): the tap slop, or the deadband once the tap time is over", () => {
  it("quick: past the slop only", () => {
    expect(zoneCommitted(20, 100, 30, 9, 200)).toBe(false);
    expect(zoneCommitted(31, 100, 30, 9, 200)).toBe(true);
  });
  it("slow: past the deadband", () => {
    expect(zoneCommitted(8, 250, 30, 9, 200)).toBe(false);
    expect(zoneCommitted(10, 250, 30, 9, 200)).toBe(true);
  });
});

describe("⭐ the turn under the finger (§4.3): the near point of the piece goes with the finger", () => {
  const f: Vec3 = [0, 0, 1]; // the view: the camera looks along +z
  it("a finger to the right takes the near point to the right", () => {
    const q = trackballTurn([1, 0, 0, 0], [1, 0, 0], f, 90);
    close(qRotate(q, [0, 0, -1]), [1, 0, 0], 1e-9);
  });
  it("a finger down (world −y on the glass) takes it down; the gain is degrees per mm", () => {
    const q = trackballTurn([1, 0, 0, 0], [0, -0.5, 0], f, 90); // 0.5 mm × 90°/mm = 45°
    close(qRotate(q, [0, 0, -1]), [0, -Math.SQRT1_2, -Math.SQRT1_2], 1e-9);
  });
  it("no travel: the pose as it is", () => {
    const q0: Quat = [Math.cos(0.3), Math.sin(0.3), 0, 0];
    expect(trackballTurn(q0, [0, 0, 0], f, 2)).toEqual(q0);
  });
});

describe("⭐ the lit quad (§4.3, D-P5): the direction the resting face is nearest to sitting on, with hysteresis", () => {
  const dirs: Vec3[] = [[0, 1, 0], [0, -1, 0], [1, 0, 0]];
  it("the resting normal down sits on the up direction", () => {
    expect(litDirection([0, -1, 0], dirs, -1, 0)).toBe(0);
  });
  it("the current one kept until another is nearer by the hysteresis", () => {
    const n = (deg: number): Vec3 => [-Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180), 0]; // from down (sits on +y) to −x (sits on +x)
    expect(litDirection(n(46), dirs, 0, (3 * Math.PI) / 180)).toBe(0); // +x nearer by 2°: kept
    expect(litDirection(n(49), dirs, 0, (3 * Math.PI) / 180)).toBe(2); // nearer by 8°: taken
  });
  it("none", () => {
    expect(litDirection([0, -1, 0], [], -1, 0)).toBe(-1);
  });
});

describe("⭐ the twist (§4.4): the line between the fingers, clockwise on the glass positive (y down)", () => {
  it("a quarter turn clockwise", () => {
    expect(twistAngle([0, 0], [10, 0], [0, 0], [0, 10])).toBeCloseTo(Math.PI / 2, 9);
  });
  it("wrapped to (−π, π]", () => {
    expect(twistAngle([0, 0], [-10, 1], [0, 0], [-10, -1])).toBeCloseTo(2 * Math.atan2(1, 10), 9);
  });
  it("a second finger's tap: the tap rules and under 10° of twist", () => {
    expect(twistIsTap(true, 0.1)).toBe(true);
    expect(twistIsTap(true, 0.2)).toBe(false);
    expect(twistIsTap(false, 0)).toBe(false);
  });
  it("the nearest stop", () => {
    expect(nearestAngle(0.9, [0, Math.PI / 2, -Math.PI / 2])).toBe(Math.PI / 2);
    expect(nearestAngle(0.7, [0, Math.PI / 2])).toBe(0);
  });
});

describe("⭐⭐ the step back (§4.5): the first free place on the line, and the way there checked", () => {
  // the frames' loop the wiring runs (one query a frame)
  const trace = (g: (s: number) => number, need: number, maxLift: number, frames: number): number | null => {
    let lift = 0;
    for (let i = 0; i < frames; i++) {
      const next = traceStep(lift, g(lift), need, 1e-6);
      if (next === null) return lift;
      if (next > maxLift) return null;
      lift = next;
    }
    return null;
  };
  it("sphere tracing reaches the first place the clearance is enough — never past it", () => {
    // a wall at 0, the line straight out: the clearance is the lift + 0.1
    expect(trace((s) => s + 0.1, 0.5, 2, 12)).toBeCloseTo(0.4, 9);
    // a wall at an angle: the clearance grows at half the lift's pace — the first place is 0.8, reached from below
    const r = trace((s) => s / 2 + 0.1, 0.5, 2, 60)!;
    expect(r).toBeLessThanOrEqual(0.8 + 1e-6);
    expect(r).toBeGreaterThan(0.8 - 1e-3);
  });
  it("free at once: no lift", () => {
    expect(traceStep(0, 1, 0.5, 1e-6)).toBeNull();
  });
  it("a line that never clears (or a lift past the most): none", () => {
    expect(trace(() => 0.1, 0.5, 2, 12)).toBeNull();
    expect(trace((s) => s * 0.01, 0.5, 2, 50)).toBeNull();
  });
  it("conservative advancement: every step within the clearance, a wall stops it", () => {
    // free away from a wall at s = 1: the gap is 1 − s; the gap kept 0.1
    const r = advanceAlong((s) => 1 - s, 2, 0.1, 50, 1e-4);
    expect(r.blocked).toBe(true);
    expect(r.reached).toBeLessThan(0.9);
    expect(r.reached).toBeGreaterThan(0.89);
    const free = advanceAlong(() => 5, 2, 0.1, 50, 1e-4);
    expect(free).toEqual({ reached: 2, queries: 1, blocked: false });
  });
  it("out of queries: stopped where it is, not blocked", () => {
    const r = advanceAlong((s) => 0.2 + s, 10, 0.1, 3, 1e-4);
    expect(r.blocked).toBe(false);
    expect(r.queries).toBe(3);
    expect(r.reached).toBeLessThan(10);
  });
});

describe("⭐ the pivot about the centre (§4.3): the offset that keeps the centre still", () => {
  it("the centre stays where it was whatever the turn", () => {
    const c: Vec3 = [0, 0.2, 0]; // the centre in the piece's frame
    const r: Vec3 = [0, 0, 0]; // the resting face's centre
    const A: Vec3 = [1, 2, 3]; // the ring's anchor
    const W: Vec3 = [1, 2.2, 3]; // the centre in the world at the start (q = identity)
    const q: Quat = [Math.SQRT1_2, Math.SQRT1_2, 0, 0]; // 90° about x
    const off = pivotOffset(A, W, q, c, r);
    // the mesh: its resting centre at A + off; its centre at A + off + q(c − r) — W
    const cw = qRotate(q, [c[0] - r[0], c[1] - r[1], c[2] - r[2]]);
    close([A[0] + off[0] + cw[0], A[1] + off[1] + cw[1], A[2] + off[2] + cw[2]], W, 1e-12);
  });
  it("the bounding sphere of a shape: the box's centre, the farthest point", () => {
    const s = boundingSphereOf([[[0, 0, 0], [2, 0, 0]], [[0, 4, 0]]]);
    close(s.centre, [1, 2, 0]);
    expect(s.radius).toBeCloseTo(Math.hypot(1, 2), 12);
  });
});

describe("⭐ the undo's history (§4.7)", () => {
  it("last in, first out; at most its size; cleared", () => {
    const h = new TurnHistory<number>(3);
    for (const x of [1, 2, 3, 4]) h.push(x);
    expect(h.size).toBe(3);
    expect(h.peek()).toBe(4);
    expect(h.pop()).toBe(4);
    expect(h.pop()).toBe(3);
    h.clear();
    expect(h.pop()).toBeNull();
  });
});

// ⭐⭐⭐ (2026-11-26, `PIECE_TURN.md` §9 — his word: *"piece orbit speed = scene orbit gains (x, y) * piece orbit gains (x, y) * inputs (x,y)"*) THE PIECE
// ORBIT'S GAINS on the scene orbit's. RED against `ba252368` (no `sceneOrbitDegPerMm`, no `pieceTurnDegrees`, no `pieceTurnGainX` / `pieceTurnGainY`).
describe("⭐ the piece orbit's gains (§9): scene orbit gains × piece orbit gains × the finger, per axis", () => {
  const DEG = 180 / Math.PI;
  it("the scene orbit's degrees per mm: x the yaw's chain; y the same on the assembly orbit (the pitch sliders do not act there)", () => {
    const s = sceneOrbitDegPerMm(DEFAULT_CONFIG);
    expect(s.x).toBeCloseTo(DEFAULT_CONFIG.gainOrbitYaw * DEFAULT_CONFIG.boxGainYaw * DEG, 9);
    expect(s.y).toBe(s.x);
    const doubled = sceneOrbitDegPerMm({ ...DEFAULT_CONFIG, boxGainYaw: 2 * DEFAULT_CONFIG.boxGainYaw });
    expect(doubled.x).toBeCloseTo(2 * s.x, 9); // proportional to the scene orbit's gain
    expect(doubled.y).toBeCloseTo(2 * s.y, 9);
    const pitchMoved = sceneOrbitDegPerMm({ ...DEFAULT_CONFIG, gainOrbitElevation: 0.05, boxGainPitch: 1.5 });
    expect(pitchMoved.y).toBeCloseTo(s.y, 9);
  });
  it("each axis its own gain: scene × piece × mm", () => {
    expect(pieceTurnDegrees(10, 0, { x: 5, y: 5 }, 0.4, 1)).toEqual({ dx: 20, dy: 0 });
    expect(pieceTurnDegrees(0, 10, { x: 5, y: 5 }, 1, 0.2)).toEqual({ dx: 0, dy: 10 });
    const d = pieceTurnDegrees(3, -4, { x: 2, y: 3 }, 0.5, 2);
    expect(d.dx).toBeCloseTo(3, 12);
    expect(d.dy).toBeCloseTo(-24, 12);
  });
  it("the turn's angle: a dx of 10 mm at the shipped gains turns the piece sceneX × gainX × 10 degrees", () => {
    const s = sceneOrbitDegPerMm(DEFAULT_CONFIG);
    const d = pieceTurnDegrees(10, 0, s, DEFAULT_CONFIG.pieceTurnGainX, DEFAULT_CONFIG.pieceTurnGainY);
    const q = trackballTurn([1, 0, 0, 0], [d.dx, 0, 0], [0, 0, 1], 1);
    expect(2 * Math.acos(Math.min(1, Math.abs(q[0]))) * DEG).toBeCloseTo(s.x * DEFAULT_CONFIG.pieceTurnGainX * 10, 6);
  });
  // ⭐⭐⭐ (2026-11-26, §9.1 — his word: *"Set the two sliders default to 2.00. Increase their range up to 5.00"*) RED against `263e809d` (0.4; [0.05, 2]).
  it("the defaults his 2.00 each (10.2°/mm at the shipped scene gains); the old single gain is gone", () => {
    const s = sceneOrbitDegPerMm(DEFAULT_CONFIG);
    expect(DEFAULT_CONFIG.pieceTurnGainX).toBe(2);
    expect(DEFAULT_CONFIG.pieceTurnGainY).toBe(2);
    expect(s.x * DEFAULT_CONFIG.pieceTurnGainX).toBeCloseTo(10.21, 1);
    expect(s.y * DEFAULT_CONFIG.pieceTurnGainY).toBeCloseTo(10.21, 1);
    expect("pieceTurnDegPerMm" in DEFAULT_CONFIG).toBe(false);
  });
  it("the gains validated in [0.05, 5]", () => {
    expect(() => validateGestureConfig(DEFAULT_CONFIG)).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceTurnGainX: 5, pieceTurnGainY: 5 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceTurnGainX: 0 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceTurnGainY: 5.5 })).toThrow();
  });
});

// ⭐⭐⭐ (2026-11-26, §9.1 — his word: *"add a slider for piece roll gain and set it by default to three times the current setup"*) THE PIECE ROLL'S
// GAIN on both roll inputs. RED against `263e809d` (no `pieceRollAngle`, no `pieceRollGain`).
describe("⭐ the piece roll's gain (§9.1): the roll = the gain × the input's own angle", () => {
  it("the gain multiplies the input's angle; 1 = as before", () => {
    expect(pieceRollAngle(0.5, 3)).toBeCloseTo(1.5, 12);
    expect(pieceRollAngle(-0.2, 1)).toBeCloseTo(-0.2, 12);
    expect(pieceRollAngle(0.7, 0)).toBe(0);
  });
  // ⭐⭐⭐ (2026-11-26, §9.2 — his word: *"Set the piece roll gain to default 8.00"*) RED against `66aa017a` (3).
  it("the default his 8.00: the twist 8:1, A + dx 2°/mm × 8 = 16°/mm", () => {
    expect(DEFAULT_CONFIG.pieceRollGain).toBe(8);
    expect(pieceRollAngle(Math.PI / 12, DEFAULT_CONFIG.pieceRollGain)).toBeCloseTo((2 * Math.PI) / 3, 12); // a 15° twist rolls 120°
    const aDx = (10 * DEFAULT_CONFIG.pieceRollDegPerMm * Math.PI) / 180; // 10 mm of A + dx
    expect((pieceRollAngle(aDx, DEFAULT_CONFIG.pieceRollGain) * 180) / Math.PI).toBeCloseTo(160, 9);
  });
  it("validated in [0.1, 10]", () => {
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceRollGain: 10 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceRollGain: 0 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pieceRollGain: 11 })).toThrow();
  });
});

// ⭐⭐⭐ (2026-11-26, §9.2, D-P21 — his words: *"i don't want this snap but i want a roll based on accumulated input"*; *"the roll shall snap to alignment
// and the piece orbit shall continue"*) THE STOP NEAREST A POSE: from an aligned stop, the edge stops both ways round, the least turn from the pose asked
// — a snap after a roll keeps the roll. RED against `66aa017a` (no `nearestRollStop`).
describe("⭐ the stop nearest the pose asked (§9.2, D-P21)", () => {
  const D = Math.PI / 180;
  const DOWN: Vec3 = [0, -1, 0];
  const LOOK_DOWN: Vec3 = [0, -1, 0]; // the camera above: the roll's axis +y (toward it), clockwise as seen +
  const Y: Vec3 = [0, 1, 0];
  const RECT: Vec3[] = [[1, 0, 0], [0, 0, 1]]; // a rectangle's edge-to-edge lines
  const PINK: Vec3[] = [[1, 0, 0], [0, 0, 1]];
  const ID: Quat = [1, 0, 0, 0];
  const about = (a: Vec3, deg: number): Quat => qFromAxisAngle(a, deg * D);
  const same = (a: Quat, b: Quat) => expect(Math.abs(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]) - 1)).toBeLessThan(1e-9);
  it("a rectangle (90° stops): 70° → the 90° stop (one roll), −20° → the base, −100° → the −90° stop", () => {
    const a = nearestRollStop(ID, about(Y, 70), DOWN, RECT, PINK, LOOK_DOWN);
    same(a.q, about(Y, 90));
    expect(a.rolls).toBe(1);
    expect(a.couple).not.toBeNull();
    const b = nearestRollStop(ID, about(Y, -20), DOWN, RECT, PINK, LOOK_DOWN);
    same(b.q, ID);
    expect(b.rolls).toBe(0);
    const c = nearestRollStop(ID, about(Y, -100), DOWN, RECT, PINK, LOOK_DOWN);
    same(c.q, about(Y, -90));
    expect(c.rolls).toBe(-1);
  });
  it("past a quarter turn: 170° → the half turn (two rolls, either way round)", () => {
    const r = nearestRollStop(ID, about(Y, 170), DOWN, RECT, PINK, LOOK_DOWN);
    same(r.q, about(Y, 180));
    expect(Math.abs(r.rolls)).toBe(2);
  });
  it("a hexagon's lines (60° stops): 100° → the 120° stop", () => {
    const HEXL: Vec3[] = [0, 60, 120].map((t) => [Math.cos(t * D), 0, Math.sin(t * D)] as Vec3);
    const r = nearestRollStop(ID, about(Y, 100), DOWN, HEXL, [[1, 0, 0]], LOOK_DOWN);
    same(r.q, about(Y, 120));
    expect(Math.abs(r.rolls)).toBe(2);
  });
  it("the pose asked off the quad (a turn's): still the least turn — tilted 10°, rolled 80° → the 90° stop", () => {
    const asked = qmul(about(Y, 80), about([1, 0, 0], 10));
    const r = nearestRollStop(ID, asked, DOWN, RECT, PINK, LOOK_DOWN);
    same(r.q, about(Y, 90));
  });
  it("nothing to pair (no pink axis): the base", () => {
    const r = nearestRollStop(ID, about(Y, 70), DOWN, RECT, [], LOOK_DOWN);
    same(r.q, ID);
    expect(r.rolls).toBe(0);
    expect(r.couple).toBeNull();
  });
});

// ⭐⭐⭐ (2026-11-26, §9.3, D-P24, D-P25 — his word: *"a press or left click held on the piece shows the quads after the same timer as when the quads fade
// away"*) THE QUADS BY A HELD PRESS: none before the hold (300 ms), all from it, at once; its end held, then faded. RED against `01d07e11` (neither exists).
describe("⭐ the quads shown by a press held on the piece (§9.3)", () => {
  const HOLD = 300;
  const FADE = 250;
  it("a press held: nothing before the hold, the quads from it (at once, no fade in)", () => {
    expect(pressHeldShows(1299, 1000, HOLD)).toBe(false);
    expect(pressHeldShows(1300, 1000, HOLD)).toBe(true);
    expect(zoneQuadsShare(1150, false, 1000, -Infinity, HOLD, FADE)).toBe(0);
    expect(zoneQuadsShare(1299, false, 1000, -Infinity, HOLD, FADE)).toBe(0);
    expect(zoneQuadsShare(1300, false, 1000, -Infinity, HOLD, FADE)).toBe(1);
    expect(zoneQuadsShare(5000, false, 1000, -Infinity, HOLD, FADE)).toBe(1);
  });
  it("no press, nothing live: hidden; a live gesture: shown whatever its press", () => {
    expect(zoneQuadsShare(5000, false, null, -Infinity, HOLD, FADE)).toBe(0);
    expect(zoneQuadsShare(1010, true, null, -Infinity, HOLD, FADE)).toBe(1);
  });
  it("its release (D-P25): held for the hold, then faded over the fade — as after a snap", () => {
    const up = 2000;
    const until = up + HOLD; // what the release sets
    expect(zoneQuadsShare(up + 100, false, null, until, HOLD, FADE)).toBe(1);
    expect(zoneQuadsShare(until, false, null, until, HOLD, FADE)).toBe(1);
    expect(zoneQuadsShare(until + FADE / 2, false, null, until, HOLD, FADE)).toBeCloseTo(0.5, 12);
    expect(zoneQuadsShare(until + FADE, false, null, until, HOLD, FADE)).toBe(0);
  });
});
