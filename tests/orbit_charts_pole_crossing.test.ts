/**
 * GOLDEN VECTORS — **THE ORBIT ON CHARTS, STEP 2.4b: A POLE HELD BY AN EDGE OR A POINT IS CROSSED BY THE ONE TRANSITION** (2026-11-15,
 * `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §1 "the top and the bottom", §4.1, §12 2.4b and "THE ONE TRANSITION"; D-C6) (⛔ its switch `chartLayout` deleted at step 2.5):
 * * `poleCrossingDue` — the trigger, as a table: every condition off gives no crossing; the top and the bottom; a FACE end (a cap) never; far out never.
 * * `farFacetAt` — the far facet on the lying heptagon (`Scene_0`'s): from a top face on the ridge the other top face, at the ridge's END corner too
 *   (an end face holds the point there); off the ridge none; from an end face at its top none; a pyramid's apex (and an inverted one's) the opposite fan
 *   face; a box's top (a cap) none, a box's side at its top edge none; a cap leaning under `TILT_SLANT_MIN` level (none); the MOST opposite
 *   (`Scene_0bis`'s ridge end: the other top face, not a tip's fan face); a square face never "the other way" by rounding (the heptagon turned); a CAP
 *   with a heading never the far facet.
 * * `poleSeam` — the round trip that makes "one state" true: along the ridge (and at an apex) the far facet's angles put the map's place EXACTLY at the
 *   point (≤ 1e-9 m), the pitch at the pole, the yaw in the far facet's column.
 * * The wiring (`render/assembly_wiring.ts`): the switch guards the trigger, placed after the tilt's making and before the map's step; the beyond consumed;
 *   `seamRebase` sets every state `turnAngles` turns (the calm aside: a view) and the map's angles, never turning them; the crossing's camera turn started
 *   from the pose shown, as `spitStep`'s; the dy hold at the orbit's heading before the crossing.
 * RED on the mutants listed in the step's report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, columnAt, DEFAULT_FACET_OPTS, mapTarget, type FaceMap, type Facet, type FacetOpts, type MapOpts } from "../src/input/face_map";
import { assignCharts, chartContour } from "../src/input/orbit_charts";
import { farFacetAt, poleCrossingDue, poleSeam, type PoleCrossingFacts } from "../src/input/pole_crossing";
import { ORBIT_PITCH_MAX_RAD, vOfPitch } from "../src/input/assembly_orbit";
import type { Vec3 } from "../src/core/vec";
import { boxPolys, heptagonPolys, hullPolys, solid, tippedPolys } from "./helpers/chart_shapes";

const CHART: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" };
const LAYOUTS: readonly [string, FacetOpts][] = [["chart", CHART], ["built", DEFAULT_FACET_OPTS]];
const O: MapOpts = { edgeMm: 0, edgeDeg: 0 };
const mapOf = (polys: readonly (readonly Vec3[])[], fo: FacetOpts = CHART): FaceMap => {
  const s = solid(polys);
  return buildFaceMap(s.faces, s.box, fo);
};
/** the facet's point at `L` along `t` and `s` along `b`, on its plane */
const on = (f: Facet, L: number, s: number): Vec3 => [f.n[0] * f.e + f.t[0] * L + f.b[0] * s, f.n[1] * f.e + f.t[1] * L + f.b[1] * s, f.n[2] * f.e + f.t[2] * L + f.b[2] * s];
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** the heptagon's two top faces (real sides leaning up beyond 45°) */
const topsOf = (map: FaceMap) => map.facets.map((f, i) => (f.real && f.kind === "SIDE" && f.n[1] > Math.SQRT1_2 ? i : -1)).filter((i) => i >= 0);
/** a point on the ridge: the top edge of top face `i`, `fr` −1 … 1 along it */
const ridgeAt = (map: FaceMap, i: number, fr: number): Vec3 => {
  const f = map.facets[i]!;
  return on(f, (f.tLo + f.tHi) / 2 + (fr * (f.tHi - f.tLo)) / 2, f.bHi);
};
const pyramid = (apexUp: boolean) =>
  hullPolys(apexUp ? [[-0.2, 0, -0.2], [0.2, 0, -0.2], [0.2, 0, 0.2], [-0.2, 0, 0.2], [0, 0.3, 0]] : [[-0.2, 0.3, -0.2], [0.2, 0.3, -0.2], [0.2, 0.3, 0.2], [-0.2, 0.3, 0.2], [0, 0, 0]]);
const fansOf = (map: FaceMap) => map.facets.map((f, i) => (f.real && f.kind === "SIDE" ? i : -1)).filter((i) => i >= 0);
const opposite = (map: FaceMap, i: number, among: readonly number[]) => {
  const n = map.facets[i]!.n;
  return among.find((j) => j !== i && map.facets[j]!.n[0] * n[0] + map.facets[j]!.n[2] * n[2] < -0.5)!;
};

describe("⭐⭐⭐ the trigger (`poleCrossingDue`, §12 2.4b)", () => {
  const BASE: PoleCrossingFacts = { tilted: false, zoned: false, closeIn: true, turning: false, mouth: false, atPole: true, shown: true, beyondV: 0.01, topKind: "EDGE", bottomKind: "FACE" };
  it("⭐ every condition met: the top crossed (an EDGE, a POINT)", () => {
    expect(poleCrossingDue(BASE)).toBe("TOP");
    expect(poleCrossingDue({ ...BASE, topKind: "POINT" })).toBe("TOP");
  });
  it("⭐ each condition off: no crossing", () => {
    const off: Partial<PoleCrossingFacts>[] = [
      { tilted: true }, // a tilt's frame
      { zoned: true }, // a zone's frame
      { closeIn: false }, // ⛔ far out: the polar orbit's limit (D-C6)
      { turning: true }, // a camera turn under way
      { mouth: true }, // a mouth held
      { atPole: null }, // not at a pole
      { shown: false }, // no place shown
      { beyondV: 0 }, // nothing asked beyond
      { beyondV: -0.01 }, // asked down at the top
      { beyondV: Number.NaN },
      { topKind: "FACE" }, // a cap: the tilt's
      { topKind: null }, // no atlas
    ];
    for (const o of off) expect(poleCrossingDue({ ...BASE, ...o }), JSON.stringify(o)).toBeNull();
  });
  it("⭐ the bottom: below it, its own end's kind", () => {
    const B: PoleCrossingFacts = { ...BASE, atPole: false, beyondV: -0.02, topKind: "FACE", bottomKind: "POINT" };
    expect(poleCrossingDue(B)).toBe("BOTTOM");
    expect(poleCrossingDue({ ...B, bottomKind: "EDGE" })).toBe("BOTTOM");
    expect(poleCrossingDue({ ...B, beyondV: 0.02 })).toBeNull();
    expect(poleCrossingDue({ ...B, bottomKind: "FACE", topKind: "EDGE" })).toBeNull(); // the top's kind is not the bottom's
    expect(poleCrossingDue({ ...BASE, topKind: "FACE", bottomKind: "EDGE" })).toBeNull(); // nor the other way
  });
  it("⛔ a FACE end never, whatever is asked; far out never, whatever the end", () => {
    for (const atPole of [true, false])
      for (const beyondV of [-0.5, -0.01, 0.01, 0.5]) {
        expect(poleCrossingDue({ ...BASE, atPole, beyondV, topKind: "FACE", bottomKind: "FACE" })).toBeNull();
        expect(poleCrossingDue({ ...BASE, atPole, beyondV, topKind: "EDGE", bottomKind: "POINT", closeIn: false })).toBeNull();
      }
  });
  it("`Scene_0`'s heptagon's ends from the atlas: the top an EDGE (crossed), the bottom a FACE (never); a box's two FACEs; a pyramid's top a POINT", () => {
    const ends = (polys: Vec3[][]) => assignCharts(chartContour(mapOf(polys))).gravity;
    expect([ends(heptagonPolys()).top.kind, ends(heptagonPolys()).bottom.kind]).toEqual(["EDGE", "FACE"]);
    expect([ends(boxPolys(0.4, 0.4, 0.4)).top.kind, ends(boxPolys(0.4, 0.4, 0.4)).bottom.kind]).toEqual(["FACE", "FACE"]);
    expect(ends(pyramid(true)).top.kind).toBe("POINT");
  });
});

describe("⭐⭐⭐ the far facet (`farFacetAt`)", () => {
  it("⭐ the lying heptagon: from a top face on the ridge, the OTHER top face — at its END corners too (an end face holds the point there)", () => {
    for (const [, fo] of LAYOUTS) {
      const map = mapOf(heptagonPolys(), fo);
      const tops = topsOf(map);
      expect(tops.length).toBe(2);
      for (const i of tops) {
        const other = tops.find((j) => j !== i)!;
        for (const fr of [-1, -0.999, -0.5, 0, 0.3, 0.999, 1]) expect(farFacetAt(map, i, ridgeAt(map, i, fr)), `${i} ${fr}`).toBe(other);
      }
      // the END corner is held by an end face as well (that is what the case is about)
      const ends = map.facets.map((f, i) => (f.real && f.kind === "SIDE" && Math.abs(f.n[0]) > 0.999 ? i : -1)).filter((i) => i >= 0);
      expect(ends.length).toBe(2);
      const corner = ridgeAt(map, tops[0]!, 1);
      expect(ends.some((e) => farFacetAt(map, e, corner) === -1 && map.facets[e]!.poly.some((v) => dist(v, corner) < 1e-9))).toBe(true);
    }
  });
  it("⭐ off the ridge: none (mid-face, just below the ridge)", () => {
    const map = mapOf(heptagonPolys());
    for (const i of topsOf(map)) {
      const f = map.facets[i]!;
      expect(farFacetAt(map, i, on(f, (f.tLo + f.tHi) / 2, (f.bLo + f.bHi) / 2))).toBe(-1);
      expect(farFacetAt(map, i, on(f, (f.tLo + f.tHi) / 2, f.bHi - 0.002))).toBe(-1); // 2 mm below: beyond the tolerance
    }
  });
  it("⭐ an end face at the ridge's end (its top corner): none — no facet holding it faces the other way", () => {
    const map = mapOf(heptagonPolys());
    for (const [i, f] of map.facets.entries()) {
      if (!(f.real && f.kind === "SIDE" && Math.abs(f.n[0]) > 0.999)) continue;
      const top = f.poly.reduce((a, v) => (v[1] > a[1] ? v : a));
      expect(farFacetAt(map, i, top)).toBe(-1);
    }
  });
  it("⭐ a pyramid's apex (a POINT at the top), and an inverted one's (at the bottom): the OPPOSITE fan face, never a neighbour", () => {
    for (const up of [true, false]) {
      const map = mapOf(pyramid(up));
      const fans = fansOf(map);
      expect(fans.length).toBe(4);
      const apex: Vec3 = [0, up ? 0.3 : 0, 0];
      for (const i of fans) expect(farFacetAt(map, i, apex)).toBe(opposite(map, i, fans));
    }
  });
  it("⭐ a box's top (a cap): none; a box's side at its top edge: none (the opposite side does not hold it)", () => {
    const map = mapOf(boxPolys(0.4, 0.4, 0.4));
    expect(farFacetAt(map, map.top, [0, 0.4, 0])).toBe(-1);
    expect(farFacetAt(map, map.top, [0.2, 0.4, 0])).toBe(-1);
    for (const [i, f] of map.facets.entries()) if (f.kind === "SIDE") expect(farFacetAt(map, i, on(f, (f.tLo + f.tHi) / 2, f.bHi))).toBe(-1);
  });
  it("⭐ a cap leaning LESS than `TILT_SLANT_MIN` (0.03°): level — none, even at its rim over the side its lean faces away from", () => {
    const k = Math.tan(0.03 * (Math.PI / 180));
    const polys = boxPolys(0.4, 0.4, 0.4).map((q) => q.map((p): Vec3 => (p[1] > 0.3 ? [p[0], 0.4 - k * p[2], p[2]] : p)));
    const map = mapOf(polys);
    const cap = map.facets[map.top]!;
    expect(cap.n[1]).toBeGreaterThan(0.999);
    expect(Math.hypot(cap.n[0], cap.n[2])).toBeLessThan(1e-3);
    expect(cap.n[2]).toBeGreaterThan(0); // its lean toward +z: the −z side faces the other way
    expect(farFacetAt(map, map.top, [0, 0.4 + k * 0.2, -0.2])).toBe(-1);
  });
  it("⭐ the MOST opposite: `Scene_0bis`'s tipped heptagon at the ridge's end — the other top face, not a tip's fan face leaning the other way too", () => {
    const map = mapOf(tippedPolys(7, 0.12));
    const tops = topsOf(map);
    expect(tops.length).toBe(2);
    for (const i of tops) {
      const other = tops.find((j) => j !== i)!;
      for (const fr of [-1, 1]) {
        const P = ridgeAt(map, i, fr);
        // a tip's fan face holds the end too, its heading against this one's
        const fans = map.facets.map((f, j) => (j !== i && j !== other && f.real && f.kind === "SIDE" && f.poly.some((v) => dist(v, P) < 1e-9) && f.n[2] * map.facets[i]!.n[2] < 0 ? j : -1)).filter((j) => j >= 0);
        expect(fans.length).toBeGreaterThan(0);
        expect(farFacetAt(map, i, P)).toBe(other);
      }
    }
  });
  it("⭐ a face square to the current one is never \"the other way\", whatever the rounding: the heptagon TURNED about the vertical, an end face at its top corner — none", () => {
    for (const deg of [10, 23, 30, 47, 61, 73, 89, 113]) {
      const a = (deg * Math.PI) / 180;
      const turn = (p: Vec3): Vec3 => [p[0] * Math.cos(a) - p[2] * Math.sin(a), p[1], p[0] * Math.sin(a) + p[2] * Math.cos(a)];
      const map = mapOf(heptagonPolys().map((q) => q.map(turn)));
      const ends = map.facets.map((f, i) => (f.real && f.kind === "SIDE" && Math.abs(f.n[1]) < 1e-6 && Math.abs(f.n[0] * Math.cos(a) + f.n[2] * Math.sin(a)) > 0.999 ? i : -1)).filter((i) => i >= 0);
      expect(ends.length).toBe(2);
      for (const i of ends) {
        const top = map.facets[i]!.poly.reduce((u, v) => (v[1] > u[1] ? v : u));
        expect(farFacetAt(map, i, top), `${deg}° ${i}`).toBe(-1);
      }
    }
  });
  it("⭐ a CAP is never the far facet: a box's top tilted 10° as the built layout keeps it (a TOP cap with a heading) — from the side under its high edge, none", () => {
    const k = Math.tan((10 * Math.PI) / 180);
    const map = mapOf(boxPolys(0.4, 0.4, 0.4).map((q) => q.map((p): Vec3 => (p[1] > 0.3 ? [p[0], 0.4 - k * p[2], p[2]] : p))), DEFAULT_FACET_OPTS);
    expect(map.facets[map.top]!.real).toBe(true);
    expect(map.facets[map.top]!.n[2]).toBeGreaterThan(0.1); // a cap with a heading (+z)
    const side = map.facets.findIndex((f) => f.kind === "SIDE" && f.n[2] < -0.999);
    expect(farFacetAt(map, side, [0, 0.4 + k * 0.2, -0.2])).toBe(-1);
  });
  it("a facet that is not there: none", () => {
    const map = mapOf(heptagonPolys());
    for (const i of [-1, map.facets.length, 99]) expect(farFacetAt(map, i, [0, 0.483, 0])).toBe(-1);
  });
});

describe("⭐⭐⭐ the round trip that makes ONE STATE true (`poleSeam`)", () => {
  it("⭐ along the heptagon's ridge, both ways: the far facet's angles put the map's place AT the point (≤ 1e-9 m), the pitch at the pole, the yaw in its column", () => {
    for (const [, fo] of LAYOUTS) {
      const map = mapOf(heptagonPolys(), fo);
      const tops = topsOf(map);
      for (const i of tops) {
        const other = tops.find((j) => j !== i)!;
        for (const fr of [-1, -0.999, -0.7, -0.5, -0.1, 0, 0.3, 0.6, 0.999, 1]) {
          const P = ridgeAt(map, i, fr);
          const s = poleSeam(map, i, P, O)!;
          expect(s, `${i} ${fr}`).not.toBeNull();
          expect(s.far).toBe(other);
          const t = mapTarget(map, s.yaw, s.pitch, O);
          expect(dist(t.surface, P)).toBeLessThanOrEqual(1e-9);
          expect(s.pitch).toBeGreaterThanOrEqual(ORBIT_PITCH_MAX_RAD - 1e-9);
          expect(vOfPitch(s.pitch)).toBe(1); // the orbit's elevation there: the top, exactly
          // inside the ridge (not at its end corners, where the end face's column takes the same point) the far facet's own column and facet
          if (Math.abs(fr) < 0.99) {
            expect(map.columns[columnAt(map, s.yaw).k]!.facets).toContain(other);
            expect(t.stack).toBe(other);
          }
        }
      }
    }
  });
  it("⭐ at a pyramid's apex: the opposite fan face's angles, the apex itself, the pole", () => {
    const map = mapOf(pyramid(true));
    const apex: Vec3 = [0, 0.3, 0];
    for (const i of fansOf(map)) {
      const s = poleSeam(map, i, apex, O)!;
      expect(s.far).toBe(opposite(map, i, fansOf(map)));
      expect(dist(mapTarget(map, s.yaw, s.pitch, O).surface, apex)).toBeLessThanOrEqual(1e-9);
      expect(s.pitch).toBeGreaterThanOrEqual(ORBIT_PITCH_MAX_RAD - 1e-9);
      expect(map.columns[columnAt(map, s.yaw).k]!.facets).toContain(s.far);
    }
  });
  it("no far facet: none", () => {
    const map = mapOf(heptagonPolys());
    const i = topsOf(map)[0]!;
    const f = map.facets[i]!;
    expect(poleSeam(map, i, on(f, (f.tLo + f.tHi) / 2, (f.bLo + f.bHi) / 2), O)).toBeNull();
  });
});

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const code = (f: string) => raw(f).replace(/\s+/g, " ");
/** one function's source, from its signature to the first closing brace at its own indentation */
function fnSource(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return s.slice(i, s.indexOf(close, i) + close.length).replace(/\s+/g, " ");
}

describe("⭐⭐⭐ the wiring (`render/assembly_wiring.ts`)", () => {
  const W = "render/assembly_wiring.ts";
  it("⭐ the trigger placed after the tilt's making and before the map's step; the beyond consumed by a crossing (⛔ the switch's guard: step 2.5)", () => {
    const a = code(W);
    const frame = fnSource(W, "export function assemblyFrame(");
    expect(frame).toContain("let beyondV = st.orbit.takeBeyond();");
    const guard = "{ const atl = atlasOf(st); const due = poleCrossingDue({ tilted: st.asmTilt !== null, zoned: st.asmZone !== null, closeIn: st.asmTiltAuto, turning: st.asmZoneMix !== null, mouth: st.asmMouth !== null, atPole, shown: st.asmShown !== null && st.asmG !== null, beyondV, topKind: atl?.assign.gravity.top.kind ?? null, bottomKind: atl?.assign.gravity.bottom.kind ?? null, }); if (due !== null && poleCross(st)) beyondV = 0; }";
    expect(frame).toContain(guard);
    const iTilt = frame.indexOf("if (st.asmTiltAuto && st.asmTilt === null) tiltOn(st, st.asmMouth !== null ? st.asmMouth.hi : atPole);");
    const iCross = frame.indexOf(guard);
    const iMap = frame.indexOf("const beyond = poleBeyondPitch(q.v, beyondV, ORBIT_PITCH_MAX_RAD);");
    expect(iTilt).toBeGreaterThan(0);
    expect(iCross).toBeGreaterThan(iTilt);
    expect(iMap).toBeGreaterThan(iCross);
    // one caller of the crossing, one reader of the beyond besides it
    expect(a.match(/poleCross\(st\)/g)?.length).toBe(1);
    expect(a.match(/takeBeyond\(\)/g)?.length).toBe(1);
  });
  it("⭐ ONE STATE: `seamRebase` SETS every state `turnAngles` turns (the calm aside — a view, the caller's) and the map's angles; it turns nothing", () => {
    const turn = fnSource(W, "function turnAngles(");
    const rebase = fnSource(W, "function seamRebase(");
    const fields = new Set([...turn.matchAll(/st\.(\w+) = /g)].map((m) => m[1]!));
    fields.delete("asmCalm");
    expect([...fields].sort()).toEqual(["asmPrevQ", "boxOrbit", "boxSpring", "cameraLagged", "cameraOrbit", "orbitRawPrev", "orbitUserV", "pieceQ"]);
    for (const f of fields) expect(rebase, f).toContain(`st.${f} = `);
    expect(turn).toContain("st.orbit.reset(o.yaw, o.v);");
    expect(turn).toContain("st.orbitInertia.stop();");
    expect(rebase).toContain("const v = vOfPitch(mq.pitch);");
    expect(rebase).toContain("st.orbit.reset(yaw, v);");
    expect(rebase).toContain("st.orbitUserV = v;");
    expect(rebase).toContain("st.orbitRawPrev = { yaw, v };");
    expect(rebase).toContain("st.pieceQ = { ...st.pieceQ, yaw, v };");
    expect(rebase).toContain("st.boxSpring = { at: { ...sp.at, yaw, v }, velYaw: 0, velV: 0, velLnZoom: sp.velLnZoom };");
    expect(rebase).toContain("st.boxOrbit = st.boxSpring.at;");
    expect(rebase).toContain("st.boxOrbit = { ...st.boxOrbit, yaw, v };");
    expect(rebase).toContain("st.cameraLagged = { yaw, v };");
    expect(rebase).toContain("cam: { ...co.cam, yaw, v }, yaw: { ...co.yaw, lastDriver: yaw, lastBox: yaw, vel: 0, glide: null }, pitch: { ...co.pitch, lastDriver: v, lastBox: v, vel: 0, glide: null }, yawVel: 0, pitchVel: 0,");
    expect(rebase).toContain("st.asmPrevQ = { yaw, v };");
    expect(rebase).toContain("st.asmMapQ = { yaw: mq.yaw, pitch: mq.pitch };");
    expect(rebase).toContain("st.orbitInertia.stop();");
    // ⛔ never a rigid rotation of a state (the root cause, §11 1.)
    expect(rebase).not.toMatch(/turnAngles|anglesOfDir|orbitDir|conv\(/);
  });
  it("⭐ the crossing: the far chart's angles at the map's place, ONE state, ONE camera turn from the pose shown (as `spitStep`'s), the dy hold at the heading before", () => {
    const x = fnSource(W, "function poleCross(");
    const order = [
      "const S = sh.t.surface;",
      "const seam = poleSeam(wm, cur, S, mapOpts(st));",
      "if (n0 === undefined || seam === null) return false;",
      // ⭐⭐⭐ (2026-11-16, step C5) the hold by the one rule: the face left's own up, the dy that pushed over the ridge and would come back
      "const upL = faceOwnUp(n0, WORLD_UP);",
      "const hold = upL === null ? 0 : crossingEvent(upL, n0, nFar, WORLD_UP, st.asmDySign).hold;",
      "st.asmHeadO = null; st.asmHeadW = 1; st.asmHeadYaw = null;",
      "st.asmCalm = { n: nFar, sH: c.sH, sV: 1, wA: 1,",
      "st.asmSquare.target = nFar;",
      // the rebase at the far face's angles, the gizmo kept, one camera turn from the pose shown, the ease, the hold — THE ONE EVENT
      "crossTurn(st, { at: { mq: { yaw: seam.yaw, pitch: seam.pitch }, g: P }, uWas, carry: false, paced: false, hold });",
      "st.hudDirty = true; return true;",
    ];
    let at = -1;
    for (const s of order) {
      const i = x.indexOf(s);
      expect(i, s).toBeGreaterThan(at);
      at = i;
    }
    expect(x).not.toContain("edgeHoldAt(");
    // the one event: the angle states set, the place shown at them, its relocation as `tiltOff`'s (the gizmo kept, the map's place more than a micrometre
    // off — eased), the band afresh; the turn from the pose shown; the hold set only when the rule names a dy
    const c = fnSource(W, "function crossTurn(");
    const order2 = [
      "seamRebase(st, mq);",
      "const m = mapGizmo(st, mq.yaw, mq.pitch);",
      "if (Math.hypot(v[0], v[1], v[2]) > 1e-6) st.asmGOff = { v, left: 1, timeMs: 0, durMs: rollDurationMs(RELOCATE_ANGLE, st.cfg.tiltRollDegS) };",
      "st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch }; faceBandRead(st, m.t);",
      "else if (st.asmCamLast !== null) seamTurnStart(st, false);",
      "st.orbitInertia.stop(); if (c.hold !== 0) st.asmEdgeHold = { sign: c.hold, back: 0 };",
    ];
    let at2 = -1;
    for (const s of order2) {
      const i = c.indexOf(s);
      expect(i, s).toBeGreaterThan(at2);
      at2 = i;
    }
    expect(c).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|st\.camera\.|cameraPrev|modelCast|gizmoNormal/);
    // the turn started exactly as the spit's crossing starts it (the same event, `crossTurn`; ⛔ the spit's own lines of the switch off: step 2.5)
    expect(fnSource(W, "function seamTurnStart(")).toContain("st.asmZoneMix = st.asmCamLast === null ? null : { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null, rule: 0, keep: null, done: 0, ...(paced ? { byMm: true } : {}) };");
    expect(fnSource(W, "function spitFaceStep(")).toContain("crossTurn(st, { at: null, uWas: null, carry: true, paced: false, hold });"); // ⭐ (R1) the spit's side at the gizmo's edge
    // ⛔ the sway: nothing read off a drawn mesh, a pick or the camera for a place, a normal or a frame (the pose shown only starts the turn)
    expect(x).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|st\.camera\.|cameraPrev|modelCast|gizmoNormal/);
  });
  it("⭐ the gizmo held while the turn runs: `tiltClampStep` refuses an orbit step while `asmZoneMix` is short of whole (no second hold added)", () => {
    const h = fnSource(W, "export function tiltClampStep(");
    // ⭐ (2026-11-15, step 2.4c) a turn not paced (`byMm` — the automatic tilt's entry made pending, `chartLayout` 1 only) is held while short of whole, as before
    expect(h).toContain("const zoneTurning = zm !== null && turnHoldsGizmo(zm.out !== undefined, zm.byMm === true, st.asmTiltPending, st.asmBlend !== null, zm.k);"); // ⭐ (2026-11-16, step C3) the rule in `turnHoldsGizmo`: as before for every turn but the way out paced by the finger
    expect(h).toContain("if (zoneTurning && (st.orbit.yaw !== yaw0 || st.orbit.elevation !== v0)) { st.orbit.reset(yaw0, v0); return true; }");
  });
});
