/**
 * ⭐⭐⭐ STEP 6 — THE FRAME TURN AT A CROSSING (2026-11-05, branch `1.0.101-`; `TILTED_ORBIT_REBUILD_SCOPE.md` §5 Step 6, §19): `src/input/orbit_frame.ts`,
 * wired in `render/assembly_wiring.ts`. Past a column's top (bottom) bound the orbit's frame turns about the edge by the dihedral; the top is then orbited
 * as a wall (I1: the world's x / z lines on a box); nothing moves at the turn; the far and side edges clamp (Step 7 crosses them); the way back by a margin;
 * the roll owed off square. RED against `3c00d35` (the module absent).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, columnAt, mapAngles, mapTarget, type FaceMap } from "../src/input/face_map";
import { FRAME_BACK_MARGIN_RAD, FRAME_BACK_REACH_RAD, UPRIGHT, anglesOf, capBand, dirOf, frameClamp, frameStep, rebaseAngles, rollOwed, rollStep, toFrame, toWorld, type OrbitFrame } from "../src/input/orbit_frame";
import { offsetFrame } from "../src/input/assembly_orbit";
import { sharesShowing, shownDir } from "../src/input/orbit_calm";
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
  it("⭐⭐⭐ UPRIGHT, past the front column's TOP bound (45°): the frame turns about the front's top edge by 90° — the top faced at the front's heading; ⭐ the bottom likewise; inside the band: no turn", () => {
    expect(frameStep(UPRIGHT, up, FRONT, 44 * D)).toBeNull();
    const t = frameStep(UPRIGHT, up, FRONT, 46 * D)!;
    expect(t.cap).toBe("TOP");
    near(toFrame(t, [0, 1, 0]), [0, 0, -1]); // the top, read in the new frame, faces where the front did
    near(toFrame(t, [0, 0, -1]), [0, -1, 0]); // the front below it: the way back is LOW
    expect(t.backLow).toBe(true);
    near(toWorld(t, [1, 0, 0]), [1, 0, 0]); // turned about the edge (the world's x)
    const b = frameStep(UPRIGHT, up, FRONT, -46 * D)!;
    expect(b.cap).toBe("BOTTOM");
    near(toFrame(b, [0, -1, 0]), [0, 0, -1]);
    expect(b.backLow).toBe(false);
    // the +x side's column: about the z edge
    const r = frameStep(UPRIGHT, up, 0, 46 * D)!;
    near(toFrame(r, [0, 1, 0]), [1, 0, 0]);
    near(toWorld(r, [0, 0, 1]), [0, 0, 1]);
  });

  it("⭐⭐⭐ NOTHING MOVES at the turn — every angle re-read as the same direction (`rebaseAngles`)", () => {
    const t = frameStep(UPRIGHT, up, FRONT, 46 * D)!;
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
    const t = frameStep(UPRIGHT, up, FRONT, 46 * D)!;
    const m = mapIn(t);
    const cb = capBand(t, m)!;
    expect(cb.lo).toBeCloseTo(-45 * D, 9);
    expect(cb.hi).toBeCloseTo(45 * D, 9);
    const col = m.columns[cb.column]!;
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
    const t = frameStep(UPRIGHT, up, FRONT, 46 * D)!;
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

  it("⭐⭐⭐ STEP 6's CLAMPS: the far edge (45° in the frame) and the side edges (the top's slice) hold; the WAY BACK only past the band by the margin (3°)", () => {
    const t = frameStep(UPRIGHT, up, FRONT, 46 * D)!;
    const m = mapIn(t);
    const col = m.columns[capBand(t, m)!.column]!;
    expect(frameClamp(t, m, col.mid, 30 * D)).toEqual({ yaw: col.mid, pitch: 30 * D, held: false });
    const far = frameClamp(t, m, col.mid, 70 * D);
    expect(far.pitch).toBeCloseTo(45 * D, 9);
    expect(far.held).toBe(true);
    const side = frameClamp(t, m, col.mid + col.hw + 0.2, 0);
    expect(side.yaw).toBeCloseTo(col.mid + col.hw, 12);
    // the back side: just past the way back's threshold (⛔ free: the target ran to the turned frame's pole, the turn back re-based it elsewhere — 834 mm)
    expect(frameClamp(t, m, col.mid, -60 * D).pitch).toBeCloseTo(-45 * D - FRAME_BACK_REACH_RAD, 12);
    expect(frameClamp(t, m, col.mid, -46 * D).pitch).toBeCloseTo(-46 * D, 12);
    expect(-45 * D - FRAME_BACK_REACH_RAD).toBeLessThan(-45 * D - FRAME_BACK_MARGIN_RAD); // past it: the frame does turn back
    expect(frameStep(t, m, col.mid, -46 * D)).toBeNull(); // inside the margin: no turn
    expect(frameStep(t, m, col.mid, -45 * D - FRAME_BACK_MARGIN_RAD - 1e-6)).toBe(UPRIGHT);
    expect(frameStep(t, m, col.mid, 44 * D)).toBeNull();
    // on the bottom the far edge is LOW
    const b = frameStep(UPRIGHT, up, FRONT, -46 * D)!;
    const mb = mapIn(b);
    expect(frameClamp(b, mb, mb.columns[capBand(b, mb)!.column]!.mid, -70 * D).pitch).toBeCloseTo(-45 * D, 9);
    expect(frameStep(b, mb, mb.columns[capBand(b, mb)!.column]!.mid, 45 * D + FRAME_BACK_MARGIN_RAD + 1e-6)).toBe(UPRIGHT);
    // a turn and straight back: no dithering — upright again at 42°, under the 45° that turns it
    const r = rebaseAngles(t, UPRIGHT, col.mid, -48 * D);
    expect(frameStep(UPRIGHT, up, r.yaw, r.pitch)).toBeNull();
  });

  it("⭐⭐ THE ROLL OWED: none crossing square to the edge, some off square (`rollOwed`); taken linearly by the input's travel, reversible (`rollStep`)", () => {
    const t = frameStep(UPRIGHT, up, FRONT, 46 * D)!;
    const camUp = (f: OrbitFrame, y: number, p: number): { dir: Vec3; up: Vec3 } => {
      const u = toFrame(f, toWorld(UPRIGHT, dirOf(y, p)));
      const a = anglesOf(u, y);
      const c = offsetFrame(u, a.yaw, 0, 0);
      return { dir: toWorld(f, c.dir), up: toWorld(f, c.up) };
    };
    const sq0 = camUp(UPRIGHT, FRONT, 45 * D);
    const sq1 = camUp(t, FRONT, 45 * D);
    expect(Math.abs(rollOwed(sq1.dir, sq0.up, sq1.up))).toBeLessThan(1e-9);
    const off0 = camUp(UPRIGHT, FRONT + 30 * D, 45 * D);
    const off1 = camUp(t, FRONT + 30 * D, 45 * D);
    const owed = rollOwed(off1.dir, off0.up, off1.up);
    expect(Math.abs(owed)).toBeGreaterThan(10 * D);
    expect(-rollOwed(off1.dir, off1.up, off0.up)).toBeCloseTo(owed, 12);
    // linear, reversible
    expect(rollStep(owed, owed, 0)).toEqual({ left: owed, back: false });
    expect(rollStep(owed, owed, Math.abs(owed) / 2).left).toBeCloseTo(owed / 2, 12);
    expect(rollStep(owed, owed / 2, -Math.abs(owed) / 4).left).toBeCloseTo((3 * owed) / 4, 12);
    expect(rollStep(owed, owed / 2, Math.abs(owed)).left).toBe(0);
    expect(rollStep(owed, owed, -0.01).back).toBe(true);
  });

  it("⭐⭐⭐ THE CALM CARRIED THROUGH A TURN (`sharesShowing`): the shares that show a given direction — `shownDir`'s inverse; the same direction shown about the new normal (⛔ the shares kept off square: the piece stepped 35 mm, probed)", () => {
    const n: Vec3 = [0, 0, -1];
    const h: Vec3 = [-n[2], 0, n[0]];
    const v: Vec3 = [0, 1, 0];
    for (const [y, p, sH, sV] of [[FRONT + 0.4, 0.3, 0.25, 0.8], [FRONT - 0.2, -0.5, 0.6, 0.4], [FRONT + 0.1, 0.05, 1, 1]] as const) {
      const u = dirOf(y, p);
      const shown = shownDir(u, n, h, v, sH, sV);
      const back = sharesShowing(u, shown, n, h, v, 1);
      expect(back.sH).toBeCloseTo(sH, 9);
      expect(back.sV).toBeCloseTo(sV, 9);
      near(shownDir(u, n, h, v, back.sH, back.sV), shown, 1e-12);
    }
    // under the pole's weight: the RAW shares that, weighted, show it
    const u = dirOf(FRONT + 0.3, 1.2);
    const w = 0.5;
    const shown = shownDir(u, n, h, v, 1 - (1 - 0.3) * w, 1 - (1 - 0.6) * w);
    const s = sharesShowing(u, shown, n, h, v, w);
    expect(s.sH).toBeCloseTo(0.3, 9);
    expect(s.sV).toBeCloseTo(0.6, 9);
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const sh = sharesShowing(u, toFrame(to, shownOld), k.n, [-k.n[2], 0, k.n[0]], [0, 1, 0], poleWeight(u[1]));");
  });

  it("⭐ the column the yaw is in decides the edge: the front's slice turns about x, the +x side's about z", () => {
    expect(columnAt(up, FRONT).k).not.toBe(columnAt(up, 0).k);
  });

  it("⭐⭐ WIRED (`render/assembly_wiring.ts`): the frame's step before the solve, every angle read in the frame, the face map built in it, the camera's up the frame's and the roll owed; the slide's re-base in the frame", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("orbitFrameStep(st); const q = st.pieceQ ?? st.boxOrbit");
    expect(a).toContain("const u = toWorld(st.orbitFrame, orbitDir(yaw, v));");
    expect(a).toContain("const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}#${F.key}`;");
    expect(a).toContain("const next = frameStep(st.orbitFrame, map, q.yaw, pitchOfV(q.v), FRAME_BACK_MARGIN_RAD);");
    expect(a).toContain("const c = frameClamp(F, map2, st.orbit.yaw, pitchOfV(st.orbit.elevation));");
    expect(a).toContain("return { dir: fr.dir, up: qRotate(qFromAxisAngle(fr.dir, -r.left), fr.up) };");
    expect(a).toContain("const owed = rollOwed(after.dir, before.up, after.up);");
    // ⭐ the roll's travel AWAY from the edge just crossed, and back past its start to the frame it came from (⛔ the frame's own sense, always upright:
    // a turn back down off a top undid the roll at once — 53° in a frame, probed)
    expect(a).toContain("const travel = (pitchOfV(st.orbit.elevation) - pitchOfV(r.held.v)) * r.dir;");
    expect(a).toContain("orbitFrameTurn(st, r.back);");
    // ⭐ the frame's edges bound the SOLVED place too (⛔ the target only: a slide along a part carried the piece past a side edge, pulled back next frame —
    // the camera 33 mm back and forth, probed)
    expect(a).toContain("const c = frameClamp(F, map, q.yaw, pitchOfV(q.v));");
    expect(a).toContain("const held = env.gap(at) >= gapM / 2 ? at : q0;");
    expect(a).toContain("st.orbit.reset(held.yaw, held.v); st.orbitUserV = held.v;"); // ⭐ the held place the solver's own state (⛔ the way back fought the clamp)
    // ⭐ the gizmo's map angles at a turn SOLVED onto the gizmo (an edge's gizmo is a blend — the projection alone: 24 mm off, probed)
    expect(a).toContain("st.asmMapQ = gizmoAnglesAt(st, gF, mapAngles(map, gF,");
    const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(g).toContain("st.pieceQ = assemblyOn(st) ? frameClampSolved(st, q0, fr.q, env, opt.gapM) : fr.q;");
    expect(a).toContain("const dir: 1 | -1 = to.cap !== null ? (to.backLow ? 1 : -1) : from.backLow ? -1 : 1;");
    const h = readFileSync(new URL("../src/render/hover_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(h).toContain("const t = orbitForCameraDir(toFrame(st.orbitFrame, hv.iso), q.yaw,");
  });
});
