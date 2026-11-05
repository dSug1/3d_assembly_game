/**
 * ⭐⭐⭐ THE ORBIT'S FRAME TURNED AT EVERY CROSSING (2026-11-05, branch `1.0.101-`; `TILTED_ORBIT_REBUILD_SCOPE.md` §19 → §21): `src/input/orbit_frame.ts`,
 * wired in `render/assembly_wiring.ts`. Past a column's bound by the margin the frame turns about the edge by the dihedral — in ANY frame (⭐ §21: every
 * crossing turns, the frame never resets; ⛔ Step 6's clamps, exits to upright and hold); the cap is then orbited as a wall (I1: the world's lines on a box);
 * nothing moves at the turn; the axes snapped exact. RED against `3c00d35` (the module absent) and, for §21's turns, against `38cbc8e`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, columnAt, mapAngles, mapTarget, type FaceMap } from "../src/input/face_map";
import { CROSS_EPS_RAD, UPRIGHT, anglesOf, dirOf, frameStep, rebaseAngles, snapFrame, stepToBoundary, toFrame, toWorld, type OrbitFrame } from "../src/input/orbit_frame";
import { shellBox, type ShellBox } from "../src/input/orbit_shell";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const opts = { edgeMm: 10, edgeDeg: 10 };
const box: ShellBox = { lo: [-0.25, 0, -0.05], hi: [0.25, 0.6, -0.017] };
const up = buildFaceMap([], box);
const near = (a: Vec3, b: Vec3, eps = 1e-9) => expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(eps);
const corners = (b: ShellBox): Vec3[] => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? b.hi[0] : b.lo[0], i & 2 ? b.hi[1] : b.lo[1], i & 4 ? b.hi[2] : b.lo[2]]);
/** ⭐ the box's face map built IN a frame (as the wiring does: its box the parts' corners read in the frame) */
const mapIn = (f: OrbitFrame): FaceMap => buildFaceMap([], shellBox([corners(box).map((v) => toFrame(f, v))])!);
const FRONT = -90 * D; // the −z face's heading

describe("⭐⭐⭐ Step 6 — the orbit's frame turned at a crossing", () => {
  it("⭐⭐⭐ UPRIGHT, past the front column's TOP bound (45°) by the margin (3°): the frame turns about the front's top edge by 90° — the top faced at the front's heading; ⭐ the bottom likewise; inside the band: no turn", () => {
    expect(frameStep(UPRIGHT, up, FRONT, 44 * D)).toBeNull();
    expect(frameStep(UPRIGHT, up, FRONT, 45 * D)).toBeNull(); // ⭐ (§21.5 F1) AT the bound: no turn — past it, one (no margin)
    expect(frameStep(UPRIGHT, up, FRONT, 45 * D + 1e-6)).not.toBeNull();
    const t = frameStep(UPRIGHT, up, FRONT, 49 * D)!;
    expect(t.cap).toBe("TOP");
    near(toFrame(t, [0, 1, 0]), [0, 0, -1]); // the top, read in the new frame, faces where the front did
    near(toFrame(t, [0, 0, -1]), [0, -1, 0]); // the front below it: the way back is LOW
    expect(t.backLow).toBe(true);
    near(toWorld(t, [1, 0, 0]), [1, 0, 0]); // turned about the edge (the world's x)
    const b = frameStep(UPRIGHT, up, FRONT, -49 * D)!;
    expect(b.cap).toBe("BOTTOM");
    near(toFrame(b, [0, -1, 0]), [0, 0, -1]);
    expect(b.backLow).toBe(false);
    // the +x side's column: about the z edge
    const r = frameStep(UPRIGHT, up, 0, 49 * D)!;
    near(toFrame(r, [0, 1, 0]), [1, 0, 0]);
    near(toWorld(r, [0, 0, 1]), [0, 0, 1]);
  });

  it("⭐⭐⭐ NOTHING MOVES at the turn — every angle re-read as the same direction (`rebaseAngles`)", () => {
    const t = frameStep(UPRIGHT, up, FRONT, 49 * D)!;
    for (const [y, p] of [[FRONT, 46 * D], [FRONT + 0.4, 50 * D], [FRONT - 0.7, 30 * D], [0.3, -20 * D]] as const) {
      const r = rebaseAngles(UPRIGHT, t, y, p);
      near(toWorld(t, dirOf(r.yaw, r.pitch)), dirOf(y, p), 1e-12);
      const back = rebaseAngles(t, UPRIGHT, r.yaw, r.pitch);
      expect(back.pitch).toBeCloseTo(p, 12);
      expect(Math.cos(back.yaw - y)).toBeCloseTo(1, 12);
    }
    // the crossing square to the edge: the frame's yaw the same heading, its pitch the band's other end (−45°)
    const sq = rebaseAngles(UPRIGHT, t, FRONT, 45 * D);
    expect(sq.yaw).toBeCloseTo(FRONT, 12);
    expect(sq.pitch).toBeCloseTo(-45 * D, 12);
    // a yaw kept nearest its hint (no 2π jump)
    expect(anglesOf(dirOf(FRONT + 4 * Math.PI, 0.1), FRONT + 4 * Math.PI).yaw).toBeCloseTo(FRONT + 4 * Math.PI, 12);
  });

  it("⭐⭐⭐ I1 ON THE TOP: in the turned frame a dx moves the gizmo's place along the world's x only, a dy along z only (the facet frame's planes — world lines on a box)", () => {
    const t = frameStep(UPRIGHT, up, FRONT, 49 * D)!;
    const m = mapIn(t);
    const col = m.columns[columnAt(m, FRONT).k]!;
    expect(col.bounds[0]).toBeCloseTo(-45 * D, 9);
    expect(col.bounds[col.bounds.length - 1]).toBeCloseTo(45 * D, 9);
    const at = (y: number, p: number) => toWorld(t, mapTarget(m, y, p, opts).surface);
    for (const p of [-40, -10, 0, 20, 40]) {
      const a = at(col.mid - 0.6, p * D);
      for (let y = col.mid - 0.6; y <= col.mid + 0.6; y += 0.05) {
        const q = at(y, p * D);
        expect(q[1]).toBeCloseTo(box.hi[1], 9); // on the top
        expect(q[2]).toBeCloseTo(a[2], 9); // a dx: z kept
      }
    }
    for (const y of [col.mid - 0.5, col.mid, col.mid + 0.3]) {
      const a = at(y, -44 * D);
      for (let p = -44; p <= 44; p += 2) {
        const q = at(y, p * D);
        expect(q[1]).toBeCloseTo(box.hi[1], 9);
        expect(q[0]).toBeCloseTo(a[0], 9); // a dy: x kept
      }
    }
    // the dy goes ACROSS the top, from the front's edge to the back's
    expect(at(col.mid, -44.9 * D)[2]).toBeCloseTo(box.lo[2], 3);
    expect(at(col.mid, 44.9 * D)[2]).toBeCloseTo(box.hi[2], 3);
  });

  it("⭐⭐⭐ the gizmo kept at the turn: its place read in the new frame's map (`mapAngles`, as after the slide) gives the same point", () => {
    const t = frameStep(UPRIGHT, up, FRONT, 49 * D)!;
    const m = mapIn(t);
    // the gizmo at the front's top edge, a little off its middle
    const g = mapTarget(up, FRONT + 0.3, 45 * D - 1e-9, opts).surface;
    const gF = toFrame(t, g);
    const capI = m.facets.findIndex((f) => Math.hypot(f.n[0], f.n[1] + 1, f.n[2]) < 1e-9); // the front, the frame's bottom cap
    const a = mapAngles(m, gF, capI, opts);
    near(toWorld(t, mapTarget(m, a.yaw, a.pitch, opts).surface), g, 1e-6);
    // …and a gizmo already on the top (a fast dy): read on the top's facet
    const g2 = mapTarget(up, FRONT, 60 * D, opts).surface;
    const topI = m.facets.findIndex((f) => Math.hypot(f.n[0], f.n[1], f.n[2] + 1) < 1e-9);
    const a2 = mapAngles(m, toFrame(t, g2), topI, opts);
    near(toWorld(t, mapTarget(m, a2.yaw, a2.pitch, opts).surface), g2, 1e-6);
  });

  it("⭐⭐⭐ (§21) EVERY CROSSING TURNS, IN ANY FRAME — over the top and on over its far edge the frame turns again (the far wall at the front's heading; ⛔ §20: back to upright); the way back turns back; a dx never turns; each turn lands inside the new band (no dithering); the axes exact", () => {
    const t = frameStep(UPRIGHT, up, FRONT, 49 * D)!;
    const mt = mapIn(t);
    const col = mt.columns[columnAt(mt, FRONT).k]!;
    // the landing: inside the band, no turn back
    const land = rebaseAngles(UPRIGHT, t, FRONT, 49 * D);
    expect(land.pitch).toBeCloseTo(-41 * D, 9);
    expect(frameStep(t, mt, land.yaw, land.pitch)).toBeNull();
    // a dx along the top's loop: never a turn
    for (let y = -180; y < 180; y += 5) expect(frameStep(t, mt, y * D, 0)).toBeNull();
    // over the far edge: a second turn — the back faces where the front did
    const t2 = frameStep(t, mt, col.mid, 49 * D)!;
    expect(t2).not.toBeNull();
    near(toFrame(t2, [0, 0, 1]), [0, 0, -1]);
    // back down off the top: turned back — the world's up the frame's again
    const back = frameStep(t, mt, col.mid, -49 * D)!;
    near(toWorld(back, [0, 1, 0]), [0, 1, 0]);
    near(toWorld(back, [1, 0, 0]), [1, 0, 0]);
    // the axes EXACT after a chain of turns (no drift off the world's planes)
    let f: OrbitFrame = UPRIGHT;
    for (let k = 0; k < 12; k++) {
      const m = mapIn(f);
      const c = m.columns[columnAt(m, FRONT).k]!;
      f = frameStep(f, m, c.mid, (k % 3 === 2 ? -49 : 49) * D)!;
      for (const a of [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Vec3[]) for (const x of toWorld(f, a)) expect(Math.abs(x - Math.round(x))).toBeLessThan(1e-12);
    }
    // snapFrame: a rotation a hair off a world-axis one put on it; any other left as it is
    expect(snapFrame([Math.SQRT1_2 + 1e-9, Math.SQRT1_2, 0, 0])).toEqual([Math.SQRT1_2, Math.SQRT1_2, 0, 0].map((x) => expect.closeTo(x, 12)));
    const odd: [number, number, number, number] = [Math.cos(0.2), Math.sin(0.2), 0, 0];
    expect(snapFrame(odd)).toBe(odd);
  });

  it("⭐⭐⭐ (§21.6 F5) THE TURN CARRIES NOTHING FOR THE CALM: a function of the place, the same in every frame (⛔ its shares re-expressed at the turn — `sharesShowing`: kept one direction, its lagging neighbours jumped)", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    const turn = a.slice(a.indexOf("function orbitFrameTurn("), a.indexOf("function gizmoAnglesAt("));
    expect(turn.length).toBeGreaterThan(100);
    expect(turn).not.toContain("calm");
    expect(turn).not.toContain("shares");
  });

  it("⭐ the column the yaw is in decides the edge: the front's slice turns about x, the +x side's about z", () => {
    expect(columnAt(up, FRONT).k).not.toBe(columnAt(up, 0).k);
  });

  it("⭐⭐⭐ (§21.5 F1) THE STEP SPLIT AT ITS FIRST FACE CHANGE (`stepToBoundary`): a dy toward the top bound stops a hair past it; a dx toward a column's edge the same; the nearer of the two; none within the step: whole. RED against `ba47b75` (absent: the frame turned 3° past the bound on the solved place)", () => {
    const col = up.columns[columnAt(up, FRONT).k]!;
    const top = col.bounds[col.bounds.length - 1]!;
    const a = stepToBoundary(up, col.mid, top - 0.1, 0, 0.4);
    expect(a.crossing).toBe(true);
    expect(top - 0.1 + 0.4 * a.t).toBeCloseTo(top + CROSS_EPS_RAD, 12);
    const b = stepToBoundary(up, col.mid + col.hw - 0.05, 0, 0.2, 0);
    expect(b.crossing).toBe(true);
    expect(0.2 * b.t).toBeCloseTo(0.05 + CROSS_EPS_RAD, 12);
    const c = stepToBoundary(up, col.mid + col.hw - 0.05, top - 0.02, 0.2, 0.2);
    expect(0.2 * c.t).toBeCloseTo(0.02 + CROSS_EPS_RAD, 12); // the pitch bound first
    expect(stepToBoundary(up, col.mid, 0, 0.01, 0.01)).toEqual({ t: 1, crossing: false });
    // landed just past: the frame turns there, and the turn lands inside the new band (no turn back)
    const t = frameStep(UPRIGHT, up, col.mid, top + CROSS_EPS_RAD)!;
    const land = rebaseAngles(UPRIGHT, t, col.mid, top + CROSS_EPS_RAD);
    expect(frameStep(t, mapIn(t), land.yaw, land.pitch)).toBeNull();
  });

  it("⭐⭐ WIRED (`render/assembly_wiring.ts`): the frame's step before the solve (every crossing turns), every angle read in the frame, the face map built in it; ⛔ the exits, the hold, the clamps and the roll owed gone; the slide's re-base in the frame", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("frameAtTarget(st); const q = st.pieceQ ?? st.boxOrbit");
    expect(a).toContain("const u = toWorld(st.orbitFrame, orbitDir(yaw, v));");
    expect(a).toContain("const next = frameStep(st.orbitFrame, map, st.orbit.yaw, pitchOfV(st.orbit.elevation)); if (next !== null) orbitFrameTurn(st, next);"); // ⭐ (§21.5 F1) at the TARGET
    expect(a).toContain("st.asmMapQ = gizmoAnglesAt(st, gF, mapAngles(map, gF,");
    for (const gone of ["frameClamp(", "rollOwed(", "rollStep(", "st.orbitRoll", "frameClampSolved(", "holdPitch(", "capExit(", "st.orbitHold"]) expect(a).not.toContain(gone);
    const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(g).toContain("st.pieceQ = fr.q; rig = { ...fr.q };");
    const h = readFileSync(new URL("../src/render/hover_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(h).toContain("const t = orbitForCameraDir(toFrame(st.orbitFrame, hv.iso), q.yaw,");
  });
});
