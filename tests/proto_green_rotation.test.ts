/**
 * ⭐⭐ prototype (green box) — with `FacesRotateByIncrement` OFF, dx turns the green piece continuously: yaw 360°, a smooth blend,
 * pitch 360°, a blend, yaw again (the owner, 2026-10-03: *"Dx rotates the green piece around yaw in world axis and then, once the yaw
 * has done 360 degrees, transitions to rotation in pitch … The transitions shall be done as per a 2D curve … a smooth blend"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { staircaseAngles, staircaseOrientation } from "../src/input/green_box";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { qAngle, qconj, qFromAxisAngle, qmul, type Quat, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const UP: Vec3 = [0, 1, 0];
const PITCH: Vec3 = [1, 0, 0];
const Q0 = qFromAxisAngle([0.3, 1, 0.2], 0.7);
const W = 60;
// the lap's length in s, read off the rule: find where both angles reach 360
const lapLength = (w: number): number => {
  let lo = 360, hi = 1000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const a = staircaseAngles(mid, w);
    if (a.yawDeg >= 360 - 1e-9 && a.pitchDeg >= 360 - 1e-9) hi = mid;
    else lo = mid;
  }
  return hi;
};

describe("⭐⭐ prototype — the green piece's continuous turn: a staircase in the (yaw, pitch) plane, its corners rounded", () => {
  it("⭐ the gain and the blend have sliders in OBJECT ROTATION › GREEN PIECE ROTATION; 4°/mm (gainRotateFree’s 0.07 rad/mm), blend 0 by default", () => {
    expect(DEFAULT_CONFIG.greenRotateCycleOrbitYawDeg).toBe(70); // the owner, 2026-10-03 (was 360, a cycle per orbit turn; before that 4°/mm)
    expect(DEFAULT_CONFIG.greenRotateBlendDeg).toBe(0); // the owner, 2026-10-03: a hard switch by default (was 60)
    const menu = code("render/tuning_menu.ts");
    const sec = menu.slice(menu.indexOf('title: "GREEN PIECE ROTATION"'));
    expect(sec).toContain('"greenRotateCycleOrbitYawDeg", 45, 1440, 15)');
    expect(sec).toContain('"greenRotateBlendDeg", 0, 180, 5)');
  });

  it("⭐⭐ the cycle is set in ORBIT YAW (the owner: *\"orbit rotation yaw angle required to complete the full cycle\"*): that much orbit completes exactly 360° of yaw AND 360° of pitch", async () => {
    const { staircasePerOrbitDeg } = await import("../src/input/green_box");
    for (const [w, cycle] of [[0, 360], [60, 360], [0, 180], [90, 1000]] as const) {
      const s = cycle * staircasePerOrbitDeg(w, cycle);
      const a = staircaseAngles(s, w);
      expect(a.yawDeg).toBeCloseTo(360, 6);
      expect(a.pitchDeg).toBeCloseTo(360, 6);
      // half of it: the yaw done, no pitch yet (a hard switch)
      if (w === 0) expect(staircaseAngles(s / 2, 0)).toEqual({ yawDeg: 360, pitchDeg: 0 });
    }
    expect(staircasePerOrbitDeg(0, 360)).toBe(2); // 720° of turn per 360° of orbit
  });

  it("⭐⭐ pure YAW from s = 0, then the blend, then pure PITCH, then the blend — and each lap adds EXACTLY 360° to both", () => {
    const P = lapLength(W);
    for (const s of [0, 50, 200]) expect(staircaseAngles(s, W)).toEqual({ yawDeg: s, pitchDeg: 0 }); // pure yaw
    const a = staircaseAngles(P * 0.75, W); // mid pure pitch: the yaw parked
    const b = staircaseAngles(P * 0.75 + 30, W);
    expect(b.yawDeg).toBeCloseTo(a.yawDeg, 9);
    expect(b.pitchDeg - a.pitchDeg).toBeCloseTo(30, 9);
    for (const k of [1, 2, -1]) {
      const e = staircaseAngles(k * P, W);
      expect(e.yawDeg).toBeCloseTo(360 * k, 6);
      expect(e.pitchDeg).toBeCloseTo(360 * k, 6);
    }
    // the hard switch (W = 0): 360 of yaw then 360 of pitch, a lap of 720
    expect(lapLength(0)).toBeCloseTo(720, 6);
    expect(staircaseAngles(500, 0)).toEqual({ yawDeg: 360, pitchDeg: 140 });
  });

  it("⭐⭐ smooth: the turn speed is constant (cos θ + sin θ shares) and changes direction gradually across a blend", () => {
    const P = lapLength(W);
    const h = 1e-3;
    let prev: [number, number] | null = null;
    for (let s = 0; s < 2 * P; s += 0.5) {
      const a = staircaseAngles(s, W), b = staircaseAngles(s + h, W);
      const v: [number, number] = [(b.yawDeg - a.yawDeg) / h, (b.pitchDeg - a.pitchDeg) / h];
      expect(Math.hypot(...v)).toBeCloseTo(1, 3); // constant turn speed
      if (prev !== null) expect(Math.hypot(v[0] - prev[0], v[1] - prev[1])).toBeLessThan(0.05); // no kink at a corner
      prev = v;
    }
  });

  it("⭐⭐ the piece comes back to its START pose every lap, and s going back retraces it — ⛔ blending the turning axis frame by frame drifted 14.7° a lap", () => {
    const P = lapLength(W);
    for (const k of [1, 3, -2]) expect(qAngle(qmul(staircaseOrientation(Q0, k * P, W, UP, PITCH), qconj(Q0)))).toBeCloseTo(0, 6);
    // pure segments are pure world turns: mid-yaw about UP, mid-pitch about PITCH
    const turn = (s: number): Quat => qmul(staircaseOrientation(Q0, s + 1, W, UP, PITCH), qconj(staircaseOrientation(Q0, s, W, UP, PITCH)));
    const axisOf = (q: Quat): Vec3 => { const n = Math.hypot(q[1], q[2], q[3]); return [q[1] / n, q[2] / n, q[3] / n]; };
    expect(Math.abs(axisOf(turn(100))[1])).toBeCloseTo(1, 6);
    expect(Math.abs(axisOf(turn(P * 0.75))[0])).toBeCloseTo(1, 6);
    // ⛔ the obvious way: rotate about an axis blended by the same window, frame by frame — it does not close
    const mul = qmul;
    let q: Quat = [1, 0, 0, 0];
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const s = ((i + 0.5) / N) * 720; // that scheme's lap: 360 + 360
      const ss = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (6 * t - 15) + 10));
      const m = s;
      const th = m < 360 - W / 2 ? (m < W / 2 ? (Math.PI / 2) * (1 - ss((m + W / 2) / W)) : 0) : m < 360 + W / 2 ? (Math.PI / 2) * ss((m - 360 + W / 2) / W) : m < 720 - W / 2 ? Math.PI / 2 : (Math.PI / 2) * (1 - ss((m - 720 + W / 2) / W));
      q = mul(qFromAxisAngle([Math.sin(th), Math.cos(th), 0], ((720 / N) * Math.PI) / 180), q);
    }
    expect((qAngle(q) * 180) / Math.PI).toBeGreaterThan(14);
  });

  it("⭐⭐ NO PITCH IN THE YAW (the owner: *\"there is no pitch mixed with yaw when rotation is on yaw\"*): from a LEVEL start pose the piece's own up stays vertical through every yaw phase — ⛔ from a tilted one it circled the vertical", async () => {
    const { levelHeading } = await import("../src/input/green_box");
    const tilted = qmul(qFromAxisAngle([1, 0, 0], 0.4), qFromAxisAngle(UP, 0.8)); // left the sphere part-pitched
    const P = lapLength(0);
    const upOf = (q: Quat): Vec3 => {
      const [w, x, y, z] = q; // rotate (0,1,0)
      return [2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x)];
    };
    const level = levelHeading(tilted);
    expect(upOf(level)[1]).toBeCloseTo(1, 9); // level
    // the heading kept: the same direction of the piece's x across the floor
    expect(qAngle(qmul(levelHeading(qFromAxisAngle(UP, 0.8)), qconj(qFromAxisAngle(UP, 0.8))))).toBeCloseTo(0, 9);
    for (const lap of [0, 1, 2]) {
      for (const s of [10, 120, 250, 350]) {
        expect(upOf(staircaseOrientation(level, lap * P + s, 0, UP, PITCH))[1]).toBeCloseTo(1, 9); // pure yaw: still upright
      }
    }
    // ⛔ the old start (the pose as it was): its up is tilted 23° AND moves around the vertical as it yaws — a pitch riding on the yaw
    const a = upOf(staircaseOrientation(tilted, 10, 0, UP, PITCH));
    const b = upOf(staircaseOrientation(tilted, 190, 0, UP, PITCH));
    expect(a[1]).toBeLessThan(0.95);
    expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeGreaterThan(0.5);
  });

  it("⭐ wired: OFF turns the piece by the staircase — its state kept for the session (paused inside, continued at the next exit), started LEVEL; ON keeps the face cycles", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const freeMode = st\.cfg\.facesRotateByIncrement === 0;/);
    expect(w).toMatch(/const stored = st\.freeTurns\.get\(m\);/);
    expect(w).toMatch(/if \(stored === undefined\) \{\s*const q0 = levelHeading\(cur\);/);
    expect(w).toMatch(/\}\s*else if \(entering\) free = stored;/);
    expect(w).toMatch(/sDeg: stored\.sDeg \+ dYawDeg \* staircasePerOrbitDeg\(st\.cfg\.greenRotateBlendDeg, st\.cfg\.greenRotateCycleOrbitYawDeg\)/);
    // the angles from the staircase (snapped or not, below), the pose from them
    expect(w).toMatch(/const ang = staircaseAngles\(free\.sDeg, st\.cfg\.greenRotateBlendDeg\);/);
    expect(w).toMatch(/: staircaseOrientation\(free\.q0, free\.sDeg, st\.cfg\.greenRotateBlendDeg, \[0, 1, 0\], free\.pitchAxis\);/);
    expect(w).toMatch(/else m\.rotationQuaternion = toBabylon\(want\);/);
    // the switch turned back on (or a START): the cycles start again
    expect(w).toMatch(/const cyclesStart = !freeMode && \(step === "START" \|\| prev\?\.free !== null \|\| cycles\.yaw\.length \+ cycles\.pitch\.length === 0\);/);
  });
});

describe("⭐⭐ prototype — the turn SNAPPED to the face increments (the owner, 2026-10-03: *\"not continuous but incremented\"*)", () => {
  // the green piece's frustum (base 0.1035 × 0.045, top half of it, 0.04125 high), upright
  const frustum = async () => {
    const { pieceFaces } = await import("../src/input/green_box");
    const { meshTopology } = await import("../src/core/mesh_topology");
    const Wd = 0.1035 / 2, H = 0.04125 / 2, D = 0.045 / 2;
    const c: Vec3[] = [
      [-Wd, -H, -D], [Wd, -H, -D], [Wd / 2, H, -D / 2], [-Wd / 2, H, -D / 2],
      [-Wd, -H, D], [Wd, -H, D], [Wd / 2, H, D / 2], [-Wd / 2, H, D / 2],
    ];
    const tris = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];
    const t = meshTopology(new Float32Array(c.flat()), tris);
    return pieceFaces(t.positions, t.faces);
  };

  it("⭐⭐ the frustum: 4 faces scroll past in a 360° yaw (its sides), 4 in a 360° pitch (top, bottom and the two across the pink side) → 90° and 90°", async () => {
    const { scrollIncrements } = await import("../src/input/green_box");
    const faces = await frustum();
    for (const [q0, pitch] of [[[1, 0, 0, 0] as Quat, [1, 0, 0] as Vec3], [qFromAxisAngle(UP, 0.6), [0, 0, 1] as Vec3]] as const) {
      const r = scrollIncrements(faces, q0, UP, pitch);
      expect([r.yawFaces, r.pitchFaces]).toEqual([4, 4]);
      expect([r.yawStepDeg, r.pitchStepDeg]).toEqual([90, 90]);
    }
    expect(scrollIncrements([], [1, 0, 0, 0], UP, PITCH).yawStepDeg).toBe(360);
  });

  it("⭐⭐ each angle snaps to its NEAREST increment — the piece rests on whole face steps, the same going and coming back", async () => {
    const { snapAngle } = await import("../src/input/green_box");
    expect(snapAngle(44, 90)).toBe(0);
    expect(snapAngle(46, 90)).toBe(90);
    expect(snapAngle(-46, 90)).toBe(-90);
    expect(snapAngle(359, 90)).toBe(360);
    expect(snapAngle(37.5, 0)).toBe(37.5); // no increment: unchanged
    // over a lap at 90/90, only 4 + 4 distinct poses are shown
    const seen = new Set<string>();
    for (let s = 0; s < 720; s += 1) {
      const a = staircaseAngles(s, 0);
      seen.add(`${((snapAngle(a.yawDeg, 90) % 360) + 360) % 360}/${((snapAngle(a.pitchDeg, 90) % 360) + 360) % 360}`);
    }
    expect(seen.size).toBe(8 - 1); // the start pose is shared by the yaw's and the pitch's start
  });

  it("⭐ wired: counted ONCE when the turn starts (at boot); each frame both angles snapped, each new increment eased in; a slider turns it off", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/free = \{ q0, sDeg: 0, pitchAxis, \.\.\.scrollIncrements\(faces, q0, \[0, 1, 0\], pitchAxis\) \};/);
    expect(w).toMatch(/\? orientationAt\(free\.q0, snapAngle\(ang\.yawDeg, free\.yawStepDeg\), snapAngle\(ang\.pitchDeg, free\.pitchStepDeg\), \[0, 1, 0\], free\.pitchAxis\)/);
    expect(w).toMatch(/if \(qAngle\(qmul\(want, qconj\(easing\?\.to \?\? cur\)\)\) > 1e-6\) \{\s*st\.pieceTurns\.set\(m, \{ from: cur, to: want, t0: now \}\);/);
    expect(DEFAULT_CONFIG.greenRotateSnap).toBe(1);
    expect(code("render/tuning_menu.ts")).toContain('"greenRotateSnap", 0, 1, 1)');
  });
});
