/**
 * GOLDEN VECTORS — **THE ORBIT ON CHARTS, STEP 2.4c: ONE STATE AT EVERY CHANGE OF FRAME** (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §11 1.,
 * §12 2.4c and "THE ONE TRANSITION") (⛔ its switch `chartLayout` and the old paths deleted at step 2.5, 2026-11-16 — the default half kept):
 * * The piece's shown direction eased on the turn's clock (`dirGap`, `easedDir`, `easeRest`): at share 0 the direction drawn before, at 1 the new one
 *   EXACTLY, between them on the arc; a zero gap none; antiparallel directions a half turn about an axis square to the new one; one rigid rotation for every
 *   direction (the piece, its solver, the foot alike); carried onto a restarted turn by its rest.
 * * The turn's pace (`seamTurnPace`, `seamTurnHolds`, `seamTurnStep`): a table over (pending, blend mm, blend span) — held / by the finger / by time, and
 *   whether the gizmo is held — EQUAL to today's swing rule (`tiltClampStep`'s `swingTimed`, `tiltFrame`'s `swingE`) on the same inputs.
 * * The round trip `seamRebase` relies on: places on a box's top (a box and `Scene_1`'s REAL cube) in a cap's layout frame (`capTilt`) and back in the
 *   world's map — `mapAngles`, then the map's place at those angles is the same point (≤ 1e-9 m); at the cap's centre the yaw handed (`poleYawKept`) is
 *   the one asked for, and the place stays the centre.
 * * The wiring (`render/assembly_wiring.ts`): `tiltOn`, `tiltOff` and `zoneSwitch` (with a place) call `seamRebase` and not `turnAngles`; the entry's and
 *   the exit's turns start from `poseShown`; `dirAt` applies the eased direction.
 * RED on the mutants listed in the step's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, DEFAULT_FACET_OPTS, facetOfNormal, mapAngles, mapTarget, type FaceMap, type Facet, type FacetOpts, type MapFace, type MapOpts } from "../src/input/face_map";
import { assignCharts, capTiltHeading, chartContour } from "../src/input/orbit_charts";
import { blendShare, capTilt, mulT, rollDurationMs, tiltBox, tiltFaces } from "../src/input/orbit_tilt";

/** ⛔ (2026-11-16, step 2.5) `rollStep` as committed before it was deleted with the roll back (`orbit_tilt.ts` at `d917d04`), verbatim but local — the
 *  reference the turn's pace is measured against below (today's swing rule) */
function rollStep(shown: number, target: number, dtMs: number, minMs: number): number {
  if (!(minMs > 0)) return target;
  const r = Math.max(0, dtMs) / minMs;
  return shown + Math.max(-r, Math.min(r, target - shown));
}
import { ORBIT_PITCH_MAX_RAD } from "../src/input/assembly_orbit";
import { dirGap, DIR_GAP_MIN_RAD, easedDir, easeRest, poleYawKept, seamTurnHolds, seamTurnPace, seamTurnStep, seamWholeRad, tiltLeavesNow } from "../src/input/seam_turn";
import type { ShellBox } from "../src/input/orbit_shell";
import type { Vec3 } from "../src/core/vec";
import { boxPolys, solid } from "./helpers/chart_shapes";

const CHART: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" };
const O: MapOpts = { edgeMm: 0, edgeDeg: 0 };
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const ang = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b)))));
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

describe("⭐⭐⭐ the piece's shown direction eased on the turn's clock (`dirGap`, `easedDir`)", () => {
  const PAIRS: readonly [Vec3, Vec3][] = [
    [[0, 1, 0], unit([0.3, 0.9, 0.1])],
    [unit([1, 0.2, -0.4]), unit([-0.2, 0.7, 0.6])],
    [[1, 0, 0], [0, 0, 1]],
    [unit([0.1, -0.9, 0.2]), unit([0.12, -0.88, 0.21])], // a small gap (a box's)
    [unit([0.5, 0.5, 0.7]), unit([-0.4, -0.6, 0.65])], // a large one (another shape)
  ];
  it("⭐ at share 0 the direction drawn before, at 1 the new one EXACTLY, between them on the arc (the angle shared out linearly, in their plane)", () => {
    for (const [shown, next] of PAIRS) {
      const e = dirGap(shown, next)!;
      expect(e).not.toBeNull();
      expect(e.angle).toBeCloseTo(ang(shown, next), 12);
      expect(dist(easedDir(next, e, 0), shown)).toBeLessThan(1e-12);
      expect(easedDir(next, e, 1)).toBe(next); // exactly: the same direction, untouched
      for (const s of [0.1, 0.25, 0.5, 0.8, 0.99]) {
        const m = easedDir(next, e, s);
        expect(Math.hypot(...m)).toBeCloseTo(1, 12);
        expect(ang(m, next)).toBeCloseTo((1 - s) * e.angle, 9);
        expect(ang(m, shown)).toBeCloseTo(s * e.angle, 9);
        expect(Math.abs(dot(m, unit(cross(shown, next))))).toBeLessThan(1e-9); // on the great circle through both
      }
      // the share clamped: below 0 the old one, above 1 the new one
      expect(dist(easedDir(next, e, -3), shown)).toBeLessThan(1e-12);
      expect(easedDir(next, e, 7)).toBe(next);
      expect(easedDir(next, e, Number.NaN)).toBe(next);
    }
  });
  it("⭐ ONE rigid rotation for every direction asked (the piece, its solver's queries, the foot): angles between directions kept, each turned by the rest", () => {
    const [shown, next] = PAIRS[1]!;
    const e = dirGap(shown, next)!;
    const others: Vec3[] = [unit([0.3, 0.2, 0.9]), unit([-0.8, 0.1, 0.2]), [0, 1, 0]];
    for (const s of [0, 0.4]) {
      const r = others.map((u) => easedDir(u, e, s));
      for (let i = 0; i < others.length; i++) for (let j = 0; j < others.length; j++) expect(dot(r[i]!, r[j]!)).toBeCloseTo(dot(others[i]!, others[j]!), 12);
      // a direction along the axis is fixed
      expect(dist(easedDir(e.axis, e, s), e.axis)).toBeLessThan(1e-12);
    }
  });
  it("⭐ a zero gap: none — the new direction at every share (and none below the tie)", () => {
    const u = unit([0.2, 0.9, -0.3]);
    expect(dirGap(u, u)).toBeNull();
    expect(dirGap(u, [u[0] * 3, u[1] * 3, u[2] * 3])).toBeNull(); // lengths do not matter
    for (const s of [0, 0.5, 1]) expect(easedDir(u, null, s)).toBe(u);
    expect(DIR_GAP_MIN_RAD).toBe(1e-12);
    expect(dirGap([0, 0, 0], u)).toBeNull();
  });
  it("⭐ ANTIPARALLEL: a half turn about an axis square to the new direction (the world axis most square to it) — the old one at share 0, never a zero axis", () => {
    const cases: Vec3[] = [[0, 1, 0], [1, 0, 0], [0, 0, -1], unit([0.3, -0.8, 0.5])];
    for (const n of cases) {
      const shown: Vec3 = [-n[0], -n[1], -n[2]];
      const e = dirGap(shown, n)!;
      expect(e).not.toBeNull();
      expect(e.angle).toBeCloseTo(Math.PI, 12);
      expect(Math.hypot(...e.axis)).toBeCloseTo(1, 12);
      expect(Math.abs(dot(e.axis, n))).toBeLessThan(1e-12);
      expect(dist(easedDir(n, e, 0), shown)).toBeLessThan(1e-12);
      expect(ang(easedDir(n, e, 0.5), n)).toBeCloseTo(Math.PI / 2, 9);
    }
    // the vertical: the axis is x (the first world axis square to it)
    expect(dist(dirGap([0, -1, 0], [0, 1, 0])!.axis, [1, 0, 0])).toBeLessThan(1e-12);
  });
  it("⭐ carried onto a turn restarted from the pose shown (the spit's crossing): the REST, the same axis — the direction shown the same on both sides", () => {
    const [shown, next] = PAIRS[0]!;
    const e = dirGap(shown, next)!;
    for (const k of [0, 0.3, 0.7]) {
      const r = easeRest(e, k)!;
      expect(r.axis).toBe(e.axis);
      expect(r.angle).toBeCloseTo((1 - k) * e.angle, 14);
      expect(dist(easedDir(next, r, 0), easedDir(next, e, k))).toBeLessThan(1e-12);
    }
    expect(easeRest(e, 1)).toBeNull();
    expect(easeRest(null, 0.2)).toBeNull();
  });
});

describe("⭐⭐⭐ the turn's pace — today's swing rule on the one camera turn (`seamTurnPace`, `seamTurnHolds`, `seamTurnStep`)", () => {
  /** today's `tiltClampStep`: `swingTimed = tl !== null && tl.swingMs !== null && !(tl.byMm && (st.asmTiltPending || st.asmBlend !== null))` */
  const swingTimed = (byMm: boolean, pending: boolean, blend: number | null) => !(byMm && (pending || blend !== null));
  /** today's `tiltFrame` swing advance (`byMm`): held while pending, `max(swingE, blendShare)` while the blend runs, then `rollStep` by time */
  const swingE = (e: number, pending: boolean, blend: number | null, span: number, dtMs: number, durMs: number) =>
    pending ? e : blend !== null ? Math.max(e, blendShare(blend, span)) : rollStep(e, 1, dtMs, durMs);
  const DEG_S = 360;
  const RAD = 1.1; // the turn's whole angle
  it("⭐ the table over (paced, pending, blend mm, blend span): the pace, the gizmo held, the share stepped — each EQUAL to today's on the same inputs", () => {
    let rows = 0;
    for (const paced of [true, false])
      for (const pending of [true, false])
        for (const blend of [null, 0, 2.5, 5, 10, 25])
          for (const span of [0, 10, 30])
            for (const k0 of [0, 0.2, 0.6]) {
              rows++;
              const pace = seamTurnPace(paced, pending, blend !== null);
              const want = !paced ? "TIME" : pending ? "HELD" : blend !== null ? "FINGER" : "TIME";
              expect(pace).toBe(want);
              // the gizmo held: exactly today's `swingTimed` (a turn short of whole)
              expect(seamTurnHolds(paced, pending, blend !== null, k0)).toBe(swingTimed(paced, pending, blend));
              expect(seamTurnHolds(paced, pending, blend !== null, 1)).toBe(false);
              // the share: today's swing (paced) — by time at the turn's angle's duration
              const r = seamTurnStep({ k: k0, done: k0 * RAD, rad: RAD, axisKnown: true }, pace, blend === null ? 1 : blendShare(blend, span), 16, DEG_S);
              const e0 = paced ? swingE(k0, pending, blend, span, 16, rollDurationMs(RAD, DEG_S)) : rollStep(k0, 1, 16, rollDurationMs(RAD, DEG_S));
              // ⭐⭐⭐ (2026-11-16 night, package A — the owner's *"1- A"*) by the finger: the swing's share, but never over the one speed's step a frame (⛔ at once)
              const e = pace === "FINGER" ? Math.min(e0, k0 + ((DEG_S * Math.PI) / 180) * 0.016 / RAD) : e0;
              expect(r.k).toBeCloseTo(e, 12);
              expect(r.done).toBeCloseTo(r.k * RAD, 12);
            }
    expect(rows).toBe(216);
  });
  it("⭐ any turn not paced: by time, held while short of whole — `asmZoneMix` as ever (`k < 1`)", () => {
    for (const pending of [true, false])
      for (const blend of [true, false])
        for (const k of [0, 0.5, 0.999, 1, 1.2]) {
          expect(seamTurnPace(false, pending, blend)).toBe("TIME");
          expect(seamTurnHolds(false, pending, blend, k)).toBe(k < 1);
        }
  });
  it("⭐ by time AND by the finger (package A) only from the frame the turn's angle is read (`axisKnown`, `zoneStep`'s wait); held needs none; `degS` 0 whole at once", () => {
    const t = { k: 0, done: 0, rad: Math.PI / 2, axisKnown: false };
    expect(seamTurnStep(t, "TIME", 1, 16, 360)).toEqual({ k: 0, done: 0 });
    expect(seamTurnStep({ ...t, k: 0.3, done: 0.3 }, "HELD", 0.9, 16, 360)).toEqual({ k: 0.3, done: 0.3 });
    expect(seamTurnStep(t, "FINGER", 0.4, 16, 360).k).toBe(0); // ⭐ (package A) held: the cap needs the whole angle (⛔ 0.4 at once)
    expect(seamTurnStep({ ...t, axisKnown: true }, "FINGER", 0.04, 16, 360).k).toBe(0.04); // under the cap: the finger's share
    expect(seamTurnStep({ ...t, axisKnown: true }, "TIME", 1, 16, 0)).toEqual({ k: 1, done: Math.PI / 2 });
    // the finger's share never back (today's `max`)
    expect(seamTurnStep({ k: 0.5, done: 0.5, rad: 1, axisKnown: true }, "FINGER", 0.2, 16, 360).k).toBe(0.5);
    // a zero turn: whole
    expect(seamTurnStep({ k: 0, done: 0, rad: 0, axisKnown: true }, "TIME", 1, 16, 360).k).toBe(1);
    // 360°/s: 5.76° in a 16 ms frame
    expect(seamTurnStep({ k: 0, done: 0, rad: Math.PI, axisKnown: true }, "TIME", 1, 16, 360).done).toBeCloseTo((5.76 * Math.PI) / 180, 12);
  });
  it("⭐ the tilt left at once: off the tilted facet, or turned off (out past the automatic distance, a zone taking over)", () => {
    expect(tiltLeavesNow(true, false)).toBe(false);
    expect(tiltLeavesNow(false, false)).toBe(true);
    expect(tiltLeavesNow(true, true)).toBe(true);
    expect(tiltLeavesNow(false, true)).toBe(true);
  });
});

/** the facet's point at `L` along `t` and `s` along `b`, on its plane */
const on = (f: Facet, L: number, s: number): Vec3 => [f.n[0] * f.e + f.t[0] * L + f.b[0] * s, f.n[1] * f.e + f.t[1] * L + f.b[1] * s, f.n[2] * f.e + f.t[2] * L + f.b[2] * s];
const FR = [0.02, 0.15, 0.37, 0.5, 0.63, 0.88, 0.98];
const placesOn = (f: Facet): Vec3[] => FR.flatMap((a) => FR.map((b) => on(f, f.tLo + a * (f.tHi - f.tLo), f.bLo + b * (f.bHi - f.bLo))));

describe("⭐⭐⭐ the round trip `seamRebase` relies on: the chart's angles read at the gizmo put the map's place EXACTLY there", () => {
  const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };
  const box = solid(boxPolys(0.483, 0.483, 0.483));
  const SHAPES: readonly [string, { faces: MapFace[]; box: ShellBox }][] = [["a box", box], ["Scene_1's real cube", { faces: cube.faces, box: cube.box }]];
  const YAWS = [-2.4, -0.9, 0, 0.4, 1.3, 2.9];
  for (const [name, s] of SHAPES) {
    const wm: FaceMap = buildFaceMap(s.faces, s.box, CHART);
    const C = chartContour(wm);
    const A = assignCharts(C);
    it(`⭐ ${name}: the top and the bottom in each cap's layout frame (the tilt's entry) — ≤ 1e-9 m`, () => {
      let n = 0;
      for (const cap of [wm.top, wm.bottom]) {
        const f = wm.facets[cap]!;
        for (const y of YAWS) {
          const h = capTiltHeading(A, C, cap, f.n, y);
          expect(h).not.toBeNull();
          const R1 = capTilt(h!, f.n);
          const mF = buildFaceMap(tiltFaces(s.faces, R1), tiltBox(s.box, R1), CHART);
          for (const p of placesOn(f)) {
            const pF = mulT(R1, p);
            const fi = facetOfNormal(mF, mulT(R1, f.n), pF);
            const mq = mapAngles(mF, pF, fi, O);
            expect(dist(mapTarget(mF, mq.yaw, mq.pitch, O).surface, pF)).toBeLessThan(1e-9);
            n++;
          }
        }
      }
      expect(n).toBe(2 * YAWS.length * FR.length * FR.length);
    });
    it(`⭐ ${name}: back in the world's map (the tilt's exit) — the cap and every side face crossed onto, ≤ 1e-9 m`, () => {
      for (let i = 0; i < wm.facets.length; i++) {
        const f = wm.facets[i]!;
        if (!f.real) continue;
        for (const p of placesOn(f)) {
          const mq = mapAngles(wm, p, facetOfNormal(wm, f.n, p), O);
          expect(dist(mapTarget(wm, mq.yaw, mq.pitch, O).surface, p), `${i}`).toBeLessThan(1e-9);
        }
      }
    });
    it(`⭐ ${name}: at the cap's centre (a pole of the world's map: any yaw) the yaw handed is the one asked for, the place the centre`, () => {
      for (const cap of [wm.top, wm.bottom]) {
        const f = wm.facets[cap]!;
        // the centre: where the map's pole is (its pitch at ±90°)
        const c = mapTarget(wm, 0.7, (cap === wm.top ? 1 : -1) * ORBIT_PITCH_MAX_RAD, O).surface;
        const mq = mapAngles(wm, c, cap, O);
        expect(Math.abs(mq.pitch)).toBeCloseTo(ORBIT_PITCH_MAX_RAD, 12);
        for (const asked of [-2.9, -1, 0.2, 1.6, 3.1, 7]) {
          const k = poleYawKept(mq, ORBIT_PITCH_MAX_RAD, asked);
          expect(Math.cos(k.yaw)).toBeCloseTo(Math.cos(asked), 12);
          expect(Math.sin(k.yaw)).toBeCloseTo(Math.sin(asked), 12);
          expect(k.pitch).toBe(mq.pitch);
          expect(dist(mapTarget(wm, k.yaw, k.pitch, O).surface, c)).toBeLessThan(1e-9);
        }
        // none asked: the map's own
        expect(poleYawKept(mq, ORBIT_PITCH_MAX_RAD, null)).toBe(mq);
        // off the pole: the map's angles untouched, whatever is asked
        const p = on(f, f.tLo + 0.3 * (f.tHi - f.tLo), f.bLo + 0.6 * (f.bHi - f.bLo));
        const q = mapAngles(wm, p, cap, O);
        expect(poleYawKept(q, ORBIT_PITCH_MAX_RAD, 1.234)).toBe(q);
      }
    });
  }
});

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
function fnSource(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return s.slice(i, s.indexOf(close, i) + close.length).replace(/\s+/g, " ");
}
const before = (src: string, a: string, b: string) => {
  expect(src.indexOf(a), a).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(b), b).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(a), `${a} before ${b}`).toBeLessThan(src.indexOf(b));
};

describe("⭐⭐⭐ the wiring (`render/assembly_wiring.ts`): ONE STATE (⛔ the old path of the switch off: step 2.5)", () => {
  const W = "render/assembly_wiring.ts";
  it("⭐ `tiltOn`: the frame at once (`R1`, no swing), F's angles at the gizmo SET (`seamRebase`), the turn from the pose shown at the swing's pace, the ease", () => {
    const f = fnSource(W, "function tiltOn(");
    expect(f).toContain("const uWas = drawnDir(st);");
    before(f, "const uWas = drawnDir(st);", "st.asmTilt = { id: ++TILT_SEQ,"); // read before anything moves
    expect(f).toContain("st.asmTilt = { id: ++TILT_SEQ, map: R1, facet: -1, off: false, exit: false, exitAcross: false, heading: hs };");
    expect(f).toContain("seamRebase(st, mq);");
    expect(f).toContain("seamTurnStart(st, byMm); seamEase(st, uWas);");
    before(f, "const mq = mapAngles(map, gF, fi, mapOpts(st));", "seamRebase(st, mq);");
    before(f, "st.asmShown = null;", "seamTurnStart(st, byMm);");
    expect(f).not.toMatch(/turnAngles\(/);
  });
  it("⭐ `tiltOff`: the world's angles at the gizmo (the heading shown at a pole), SET; the dy hold, the calm, the square camera as before; one timed turn from the pose shown", () => {
    const f = fnSource(W, "function tiltOff(");
    expect(f).toContain("const seam = g !== null && worldFaceMap(st) !== null; const uWas = seam ? drawnDir(st) : null;");
    before(f, "const uWas = seam ? drawnDir(st) : null;", "st.asmTilt = null;");
    expect(f).toContain("if (!seam) turnAngles(st, (d) => mulM(D, d), Math.atan2(Math.sin(hP), Math.cos(hP)));");
    // ⭐⭐⭐ (2026-11-16, step C5) the rebase, the turn (paced by distance: step C3) and the ease through the one event (`crossTurn`)
    expect(f).toContain("if (seam && mq0 !== null && g !== null) {");
    before(f, "if (seam && mq0 !== null && g !== null) {", "crossTurn(st, { at: { mq: poleYawKept(mq0, ORBIT_PITCH_MAX_RAD, hP), g }, uWas, carry: false, paced, hold: held }); } else { if (mq0 !== null && g !== null) { st.asmMapQ = mq0;");
    expect(f).toContain("crossingEvent(mulM(tl.map, [0, 1, 0]), nT, nW, WORLD_UP, st.asmDySign).hold"); // the one rule (⛔ `edgeHoldAt`: step 2.5)
    const c = fnSource(W, "function crossTurn(");
    expect(c).toContain("seamRebase(st, mq);");
    before(c, "seamRebase(st, mq);", "if (c.paced) seamOutStart(st); else if (st.asmCamLast !== null) seamTurnStart(st, false); if (c.uWas !== null) seamEase(st, c.uWas); else if (uCarry !== null) easeCarry(st, mixWas, uCarry);");
    expect(f).toContain("if (nW !== null) sqO.target = nW;");
    expect(f.match(/turnAngles\(/g)?.length).toBe(1);
  });
  it("⭐ `zoneSwitch`: with a place shown the new map's angles SET (`seamRebase`); with none (the first frame) `turnAngles` as today; the turn as today, the ease on it", () => {
    const f = fnSource(W, "function zoneSwitch(");
    expect(f).toContain("const chart = g !== null; const uWas = chart ? drawnDir(st) : null;");
    before(f, "const uWas = chart ? drawnDir(st) : null;", "st.asmZone = next === null ? null :");
    expect(f).toContain("const seam = chart && faceMapOf(st) !== null; if (!seam) turnAngles(st, turn);");
    expect(f).toContain("if (seam) seamRebase(st, mq); else st.asmMapQ = mq;");
    expect(f).toContain("st.asmZoneMix = st.asmCamLast === null ? null : { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null, rule: 0, keep: null, done: 0 };");
    expect(f).toContain("if (seam && uWas !== null) seamEase(st, uWas);");
    expect(f.match(/turnAngles\(/g)?.length).toBe(1);
  });
  it("⭐ the entry's and the exit's turns from the pose SHOWN (`poseShown`, as a zone's), paced by the swing's rule; `zoneStep` leaves a paced turn to it", () => {
    const s = fnSource(W, "function seamTurnStart(");
    expect(s).toContain("st.asmZoneMix = st.asmCamLast === null ? null : { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null, rule: 0, keep: null, done: 0, ...(paced ? { byMm: true } : {}) };");
    const t = fnSource(W, "function seamTurnFrame(");
    expect(t).toContain("if (zm === null || zm.byMm !== true) return;");
    expect(t).toContain("const pace = seamTurnPace(true, st.asmTiltPending, bl !== null);");
    expect(t).toContain("bl === null ? 1 : blendShare(bl.mm, st.cfg.tiltBlendMm)");
    const z = fnSource(W, "function zoneStep(");
    expect(z).toContain("if (zm !== null && zm.axis !== null && zm.dirFrom === undefined && zm.byMm !== true && zm.out === undefined) {"); // ⭐ (package A) …and its ease read // ⭐ (2026-11-16, step C3) the way out paced in `seamOutFrame`
    const a = fnSource(W, "export function assemblyFrame(");
    before(a, "if (st.asmBlend !== null) st.asmBlend.mm += fingerMm;", "seamTurnFrame(st, dtMs);");
    before(a, "if (st.asmTiltAuto && st.asmTilt === null) tiltOn(st,", "seamTurnFrame(st, dtMs);");
    before(a, "seamTurnFrame(st, dtMs);", "const q = st.pieceQ ?? st.boxOrbit ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };");
    const h = fnSource(W, "export function tiltClampStep(");
    expect(h).toContain("const zoneTurning = zm !== null && turnHoldsGizmo(zm.out !== undefined, zm.byMm === true, st.asmTiltPending, st.asmBlend !== null, zm.k);"); // ⭐ (2026-11-16, step C3) the rule in `turnHoldsGizmo`: as before for every turn but the way out paced by the finger
    expect(h).toContain("if (!turning && (tl === null || !(tl.exit || tl.off))) return false;");
    expect(h).not.toContain("tiltUnderWay(");
  });
  it("⭐ no roll back inside F: the exit asked at once (`tiltLeavesNow`), the camera upright in F to it (⛔ the roll back of the switch off: step 2.5)", () => {
    const t = fnSource(W, "function tiltFrame(");
    expect(t).toContain("if (!tl.exit && tiltLeavesNow(onFacet, tl.off)) { if (!onFacet) tl.exitAcross = (st.asmCalm?.wA ?? 0) > 0.5;");
    expect(t).toContain("tl.exit = true; } }");
    expect(t).not.toContain("tl.finishing");
    const c = fnSource(W, "function assemblyCameraFrameRaw(");
    expect(c).toContain("return { dir: mulM(tl.map, fF.dir), up: mulM(tl.map, fF.up) };");
    expect(c).not.toContain("frameMix(");
  });
  it("⭐ `dirAt` applies the eased direction (the turn's own share; another turn or none: whole) — ONE place; the pole's crossing and the spit's restart carry it", () => {
    const d = fnSource(W, "function dirAt(");
    expect(d).toContain("const s = tiltDir(R, calmDir(st, u));");
    expect(d).toContain("const e = st.asmDirEase; if (e === null) return s; return easedDir(s, e, e.mix === st.asmZoneMix && st.asmZoneMix !== null ? st.asmZoneMix.k : 1);");
    expect(raw(W).match(/easedDir\(/g)?.length).toBe(1);
    const e = fnSource(W, "function seamEase(");
    expect(e).toContain("const gap = dirGap(uWas, drawnDir(st));");
    expect(e).toContain("if (gap !== null) st.asmDirEase = { axis: gap.axis, angle: gap.angle, mix };");
    expect(fnSource(W, "function drawnDir(")).toContain("const q = st.boxOrbit ?? st.pieceQ ?? { yaw: st.orbit.yaw, v: st.orbit.elevation };");
    const x = fnSource(W, "function poleCross(");
    // ⭐⭐⭐ (2026-11-16, step C5) the crossing's rebase, turn and ease through the one event (`crossTurn`), the direction drawn read before it
    before(x, "const uWas = drawnDir(st);", "crossTurn(st, { at: { mq: { yaw: seam.yaw, pitch: seam.pitch }, g: P }, uWas, carry: false, paced: false, hold });");
    const sp = fnSource(W, "function spitFaceStep("); // ⭐ (2026-11-17, R1) the spit's change of side at the gizmo's edge
    expect(sp).toContain("crossTurn(st, { at: null, uWas: null, carry: true, paced: false, hold });"); // the one event, the ease carried
    expect(sp).not.toContain("easeCarry(st, mixWas)"); // ⛔ the switch off's own turn: step 2.5
    // ⛔ the sway: nothing of a drawn mesh, a pick or the camera read by the ease (the pose shown only starts a turn, in `seamTurnStart`)
    for (const sig of ["function seamEase(", "function drawnDir(", "function easeCarry(", "function seamTurnFrame("]) expect(fnSource(W, sig)).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|st\.camera\.|cameraPrev|modelCast/);
  });
});

// ⭐⭐⭐ (2026-11-15, the auditor's find — measured in the app, `Scene_1`'s top, close in, a fast dy onto it: the automatic tilt's camera turn read 1.2°
// whole, the piece's shown direction's gap 7.69° (the spring's lag behind the finger); the turn was whole after ONE frame and the ease, tied to its share,
// handed the gap's rest over in the next — the view turned 9.14° in ONE frame against the tilts' 6°; on the LONGER of the two, the first fix, the two
// parts added: 8.89°) THE TRANSITION'S ONE CLOCK RUNS OVER THE SUM OF ITS TWO PARTS (`seamWholeRad`): the camera's turn and the direction's gap — the
// two together never over the tilts' one speed. RED on: the camera's angle alone; the longer of the two; the gap alone.
describe("⭐⭐⭐ the transition's whole angle: the camera's turn PLUS the piece's direction's gap (`seamWholeRad`)", () => {
  const D = Math.PI / 180;
  it("the sum of the two; no gap (the switch off, always): the camera's own, bit for bit", () => {
    expect(seamWholeRad(1.2 * D, 7.69 * D)).toBe(1.2 * D + 7.69 * D); // the measured case
    expect(seamWholeRad(170 * D, 7.69 * D)).toBe(170 * D + 7.69 * D);
    expect(seamWholeRad(40 * D, 40 * D)).toBe(80 * D);
    for (const r of [0, 1e-12, 0.021, Math.PI / 2, 3.1]) expect(seamWholeRad(r, 0)).toBe(r);
  });
  it("never negative, never NaN: a part that is not a positive number counts for nothing", () => {
    expect(seamWholeRad(NaN, 0.3)).toBe(0.3);
    expect(seamWholeRad(0.3, NaN)).toBe(0.3);
    expect(seamWholeRad(-1, -2)).toBe(0);
    expect(seamWholeRad(0, 0)).toBe(0);
  });
  it("on that clock the measured case takes two frames at 360°/s, the two parts TOGETHER never over 6° a frame (⛔ one frame, then the rest at once)", () => {
    const whole = seamWholeRad(1.2 * D, 7.69 * D);
    const a = seamTurnStep({ k: 0, done: 0, rad: whole, axisKnown: true }, "TIME", 0, 1000 / 60, 360);
    expect(a.k).toBeCloseTo(6 / 8.89, 6);
    expect(a.k * 7.69 + a.k * 1.2).toBeLessThanOrEqual(6 + 1e-9); // the direction's step plus the camera's, deg — ⛔ on the longer alone: 6.94
    const b = seamTurnStep({ k: a.k, done: a.done, rad: whole, axisKnown: true }, "TIME", 0, 1000 / 60, 360);
    expect(b.k).toBe(1);
    // ⛔ on the camera's angle alone: whole after one frame — the gap's 7.69° in the frame after
    expect(seamTurnStep({ k: 0, done: 0, rad: 1.2 * D, axisKnown: true }, "TIME", 0, 1000 / 60, 360).k).toBe(1);
  });
  it("wired: `zoneStep`'s clock and a paced turn's both run over `turnWhole` — this turn's eased direction, else the camera's own", () => {
    const aw = readFileSync("src/render/assembly_wiring.ts", "utf8").replace(/\s+/g, " ");
    expect(aw).toContain("function turnWhole(st: SceneState, zm: NonNullable<SceneState[\"asmZoneMix\"]>): number { const e = st.asmDirEase; return seamWholeRad(zm.rad, e !== null && e.mix === zm ? e.angle : 0); }");
    expect(aw).toContain("const whole = turnWhole(st, zm); zm.done = degS > 0 ? Math.min(whole, zm.done + seamStepRad((degS * Math.PI / 180) * (dtMs / 1000), zm.rad, turnEase(st, zm))) : whole; zm.k = whole > 1e-9 ? Math.min(1, zm.done / whole) : 1;"); // ⭐ (package A) the step less the camera's growth with the ease
    expect(aw).toContain("seamTurnStep({ k: zm.k, done: zm.done, rad: turnWhole(st, zm), axisKnown: zm.axis !== null && zm.dirFrom === undefined }, pace,"); // ⭐ (package A) …and its ease read
    expect(aw).not.toContain("Math.min(zm.rad, zm.done +");
  });
});
