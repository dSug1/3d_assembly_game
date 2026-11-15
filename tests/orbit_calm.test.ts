// ⭐⭐⭐ THE CALM — 58d86ff's face-span orbit share (2026-11-03), ported to the tilted orbit's rebuild (2026-11-04, `1.0.95-`, the owner: *"i am referring to
// this calm behavior of commit 58d86ff… It shall stay"*). The first five cases are 58d86ff's own, unchanged.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { acrossWeight, alignedShare, calmHeading, calmRules, calmShown, calmStep, calmTarget, facingWeight, poleWeight, CALM_TAU_MS, easeNormal, easeToward, edgeShare, edgeShareSmooth, shownDir, shownDirAcross } from "../src/input/orbit_calm";
import type { CalmKnobs, CalmState } from "../src/input/orbit_calm";
import { buildFaceMap, facetFrame, mapTarget } from "../src/input/face_map";

import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ THE CALM (58d86ff) — the piece and the camera near square to a face in its middle, the orbit's whole angle at its edges", () => {
  const deg = Math.PI / 180;
  const n: Vec3 = [0, 0, -1];
  const h: Vec3 = [1, 0, 0];
  const v: Vec3 = [0, 1, 0];
  const dir = (aDeg: number, bDeg: number): Vec3 => [Math.cos(bDeg * deg) * Math.sin(aDeg * deg), Math.sin(bDeg * deg), -Math.cos(bDeg * deg) * Math.cos(aDeg * deg)];
  const off = (w: Vec3) => Math.acos(Math.max(-1, Math.min(1, w[0] * n[0] + w[1] * n[1] + w[2] * n[2]))) / deg;
  it("⭐⭐ (58d86ff) the share: the interior value in the middle, rising by a smoothstep to 1 within the edge zone (25 % of the run, at least 3 cm), 1 at the edge; a thin face 1 everywhere", () => {
    expect(edgeShare(0.245, 0.49, 0.25, 25, 0.03)).toBe(0.25);
    expect(edgeShare(0, 0.49, 0.25, 25, 0.03)).toBe(1);
    expect(edgeShare(0.1225, 0.49, 0.25, 25, 0.03)).toBe(0.25);
    expect(edgeShare(0.06125, 0.49, 0.25, 25, 0.03)).toBeCloseTo(0.25 + 0.75 * 0.5, 12);
    expect(edgeShare(0.01, 0.033, 0.25, 25, 0.03)).toBe(1); // the 33 mm side / top: the orbit's whole angle
    expect(edgeShare(0.1, 0.4, 0.25, 0, 0.03)).toBe(0.25);
    let prev = 2;
    for (let d = 0; d <= 0.245; d += 0.005) { const s2 = edgeShare(d, 0.49, 0.25, 25, 0.03); expect(s2).toBeLessThanOrEqual(prev + 1e-12); prev = s2; }
  });
  it("⭐⭐⭐ (58d86ff) IN THE MIDDLE OF A LARGE FACE the view stays near square: a 60° orbit offset shows 15°; AT THE EDGE exactly the orbit's", () => {
    const u = dir(60, 0);
    expect(off(shownDir(u, n, h, v, 0.25, 0.25))).toBeCloseTo(15, 9);
    expect(off(shownDir(dir(40, 30), n, h, v, 0.25, 0.25))).toBeLessThan(20);
    expect(shownDir(u, n, h, v, 1, 1)).toBe(u);
  });
  it("⭐⭐ (58d86ff) dy OFF (`faceSpanShareVOn` 0): the vertical angle shown whole, the horizontal still calmed", () => {
    const w = shownDir(dir(40, 30), n, h, v, 0.25, 1);
    expect(Math.asin(w[1]) / deg).toBeCloseTo(30, 9);
    expect(Math.atan2(w[0], -w[2]) / deg).toBeCloseTo(10, 9);
  });
  it("⭐⭐ (58d86ff) continuous in the orbit's direction, and reversible", () => {
    for (const [a, b] of [[10, 5], [50, -20], [-70, 40]] as const) {
      const w0 = shownDir(dir(a, b), n, h, v, 0.25, 0.25);
      const w1 = shownDir(dir(a + 0.5, b + 0.5), n, h, v, 0.25, 0.25);
      expect(Math.acos(Math.min(1, w0[0] * w1[0] + w0[1] * w1[1] + w0[2] * w1[2])) / deg).toBeLessThanOrEqual(0.71);
    }
    expect(shownDir(dir(33, 12), n, h, v, 0.4, 0.6)).toEqual(shownDir(dir(33, 12), n, h, v, 0.4, 0.6));
  });
});

describe("⭐⭐⭐ (2026-11-04, `1.0.95-`) THE CALM PORTED — the runs from the carrier, the shares and the face EASED (the face at a height changes with the height)", () => {
  it("⭐⭐⭐ (Step 4c-bis) dx's run: THE SIDE the face map's yaw is in, across the CORE box — a slanted block at the front's end, a part bridged to it belong to the front's run (⛔ read as faces of their own — runs of a few cm, the shares whole — a pure dx swung the piece up to the orbit's whole pitch and the camera back 70 cm: the owner's bounce, probed); the calm's normal the side's world axis", () => {
    // ⭐ (Step 5) the core box as a faces contour with no face: its six sides, virtual
    const core = buildFaceMap([], { lo: [-0.243, 0, -0.051] as [number, number, number], hi: [0.248, 0.54, -0.018] as [number, number, number] });
    const opts = { edgeMm: 10, edgeDeg: 10 };
    const D = Math.PI / 180;
    // the −z front's slice (225° … 315°): at its middle, near its right end, at the slice's very end — one run, the front's whole width
    for (const yaw of [270, 300, 314.9]) {
      const t = mapTarget(core, yaw * D, 0, opts);
      expect(t.band).toBe("SIDE");
      expect(t.across.hi - t.across.lo).toBeCloseTo(0.491, 9);
      expect(t.normal).toEqual([0, 0, -1]);
    }
    const end = mapTarget(core, 314.9 * D, 0, opts);
    expect(Math.min(end.across.L - end.across.lo, end.across.hi - end.across.L)).toBeLessThan(0.001); // at its end: the share near whole
    // the right side (+x): its own run, the painting's 33 mm
    const side = mapTarget(core, 0, 0, opts);
    expect(side.across.hi - side.across.lo).toBeCloseTo(0.033, 9);
    expect(side.normal).toEqual([1, 0, 0]);
    // dy's run: the gizmo's height in the placed parts' box — one top and bottom on every face (⭐ 2026-11-09, §8: the rule in `calmTarget`, pinned by
    // behaviour — two vertical facets of different own extents at one height: the same vertical share; the box's, not theirs)
    const K = { shareH: 0.25, zoneHPct: 25, zoneMinHM: 0.03, vOn: true, shareV: 0.25, zoneVPct: 25, zoneMinVM: 0.03 };
    const box = { lo: [-0.243, 0, -0.051] as Vec3, hi: [0.248, 0.54, -0.018] as Vec3 };
    const at = (y: number) => ({ band: "SIDE" as const, surface: [0, y, 0] as Vec3, across: { L: 0.1, lo: 0, hi: 0.2 } });
    for (const y of [0.02, 0.1, 0.27, 0.52]) {
      const a1 = calmTarget(at(y), { n: [0, 0, -1], b: [0, 1, 0], bLo: 0, bHi: 0.54 }, box, K);
      const a2 = calmTarget(at(y), { n: [1, 0, 0], b: [0, 1, 0], bLo: 0.1, bHi: 0.3 }, box, K);
      expect(a1.sV).toBe(a2.sV);
      expect(a1.sV).toBe(edgeShare(Math.min(y, 0.54 - y), 0.54, 0.25, 25, 0.03));
    }
    expect(code("render/assembly_wiring.ts")).not.toContain("chainRun(");
  });
  it("⭐⭐⭐ the shares and the face's normal FOLLOW their targets (an exponential, 120 ms) — a target that changes at once (another height's face) never moves them at once", () => {
    expect(CALM_TAU_MS).toBe(120);
    expect(easeToward(1, 0.25, 0)).toBe(1);
    expect(easeToward(1, 0.25, 16)).toBeGreaterThan(0.85); // one frame: a little of the way
    expect(easeToward(1, 0.25, 2000)).toBeCloseTo(0.25, 5);
    const e = easeNormal([0, 0, -1], [1, 0, 0], 16);
    expect(Math.atan2(e[2], e[0])).toBeGreaterThan(-Math.PI / 2); // turned toward +x, the short way
    expect(Math.atan2(e[2], e[0])).toBeLessThan(-Math.PI / 2 + 0.2);
    expect(Math.hypot(...e)).toBeCloseTo(1, 12);
  });
  it("⭐⭐⭐ the camera's heading turned as the calm turned the direction — its up from the shown direction's own heading (⛔ the orbit's yaw: the camera rolled on a wall, 222 frames over 5° on one close-in dx leg, probed); straight above / below the yaw itself", async () => {
    const { offsetFrame } = await import("../src/input/assembly_orbit");
    const deg = Math.PI / 180;
    const yaw = -30 * deg; // 60° round from the front's normal (−z), 55° up — the probe's close-in dx
    const u0: Vec3 = [Math.cos(55 * deg) * Math.cos(yaw), Math.sin(55 * deg), Math.cos(55 * deg) * Math.sin(yaw)];
    const u = shownDir(u0, [0, 0, -1], [1, 0, 0], [0, 1, 0], 0.25, 0.25);
    const rollOf = (f: { dir: Vec3; up: Vec3 }) => {
      const d = f.dir;
      const w: Vec3 = [-d[0] * d[1], 1 - d[1] * d[1], -d[2] * d[1]];
      const l = Math.hypot(...w);
      return Math.acos(Math.min(1, (w[0] * f.up[0] + w[1] * f.up[1] + w[2] * f.up[2]) / l)) / deg;
    };
    expect(rollOf(offsetFrame(u, calmHeading(yaw, u0, u), 0, 0))).toBeLessThan(1e-6); // upright
    expect(rollOf(offsetFrame(u, yaw, 0, 0))).toBeGreaterThan(5); // ⛔ the orbit's yaw: rolled
    expect(calmHeading(yaw, [0, 1, 0], u)).toBe(yaw);
    expect(code("render/assembly_wiring.ts")).toContain("return offsetFrame(u, cameraHeading(cam.yaw, orbitDir(cam.yaw, cam.v), u, levelHeadingOf(st, cam.yaw)), o.yawRad, o.pitchRad);"); // ⭐ (2026-11-13, ORBIT_ANY_SHAPE.md §9) toward the poles the calm read level (`cameraHeading`): the roll at the zenith
  });
  it("⭐⭐⭐ the calm fades out toward straight above / below: whole under 60° of pitch, none from 85° (⛔ at the bottom pole a stale side normal, a share of 0.53: the piece bent off its gizmo's face, 657 frames behind it, probed)", () => {
    const s = (deg: number) => Math.sin((deg * Math.PI) / 180);
    expect(poleWeight(s(0))).toBe(1);
    expect(poleWeight(s(60))).toBeCloseTo(1, 12);
    expect(poleWeight(s(85))).toBeCloseTo(0, 12);
    expect(poleWeight(-1)).toBe(0);
    const m = poleWeight(s(72.5));
    expect(m).toBeGreaterThan(0.3);
    expect(m).toBeLessThan(0.7);
  });
  it("⭐⭐⭐ the calm only as far as the eased normal has caught up (none beyond 30°, whole within 5°); whole shares take a new normal at once (⛔ a share calming while the normal swung across from a stale face: a 271 mm camera jump, probed)", () => {
    expect(alignedShare(0.25, 1)).toBe(0.25);
    expect(alignedShare(0.25, Math.cos((40 * Math.PI) / 180))).toBe(1);
    const mid = alignedShare(0.25, Math.cos((17.5 * Math.PI) / 180));
    expect(mid).toBeGreaterThan(0.25);
    expect(mid).toBeLessThan(1);
    // ⭐ (2026-11-09, §8) the rule in `calmStep`, pinned by behaviour: a whole horizontal share takes a new (vertical) normal at once; a calming one eases it
    // and holds the horizontal share toward 1 while it turns; ⛔ the vertical share never held between two vertical facets (released at every corner: the bounce)
    const tg = { n: [1, 0, 0] as Vec3, sH: 0.25, sV: 0.25 };
    expect(calmStep({ n: [0, 0, -1], sH: 1, sV: 0.25 }, tg, 16)!.n).toEqual([1, 0, 0]);
    const held = calmStep({ n: [0, 0, -1], sH: 0.25, sV: 0.25 }, tg, 16)!;
    expect(held.n[0]).toBeLessThan(0.2); // turned only a little toward +x
    expect(held.sH).toBeGreaterThan(0.25); // the horizontal calm released while the normal turns (90° off: its target 1)
    expect(held.sV).toBe(0.25); // the vertical calm kept: 0.25 eased toward 0.25
    // ⭐ with the horizontal share whole the face's normal cancels out — only the pitch is calmed, the heading is the orbit's own
    const deg = Math.PI / 180;
    const u: Vec3 = [Math.cos(50 * deg) * Math.cos(-30 * deg), Math.sin(50 * deg), Math.cos(50 * deg) * Math.sin(-30 * deg)];
    for (const nn of [[0, 0, -1], [1, 0, 0], [0.6, 0, -0.8]] as Vec3[]) {
      const w = shownDir(u, nn, [-nn[2], 0, nn[0]], [0, 1, 0], 1, 0.25);
      expect(Math.atan2(w[2], w[0])).toBeCloseTo(-30 * deg, 9);
      expect(Math.asin(w[1])).toBeCloseTo(12.5 * deg, 9);
    }
  });
  it("⭐⭐⭐ wired: the piece and the camera on the shown direction (the gizmo on the orbit's own); the targets from the carrier each frame; 58d86ff's seven sliders (its distance deleted, Q3) in the submenu", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return tiltDir(R, calmDir(st, u));"); // ⛔ (2026-11-12) no lock: always the calm's
    expect(a).toContain(": calmShown(u, c);"); // ⭐ (`1.0.120b-`) the calm's, then the square camera over it
    // ⭐ (2026-11-09, §8) on a VERTICAL facet `calmShown` is exactly the old wiring's: the side's frame (its level `t`, the world's up) and the pole weight by
    // the pitch alone — ⭐⭐⭐ (the owner, Q3: *"same calm at every distance"*) no distance in the weight (⛔ 58d86ff's gate curved the A + dy approach)
    const D = Math.PI / 180;
    for (const nn of [[0, 0, -1], [1, 0, 0], [0.6, 0, -0.8]] as Vec3[])
      for (const [y, p] of [[-60, 20], [-100, 70], [10, -40]]) {
        const u: Vec3 = [Math.cos(p! * D) * Math.cos(y! * D), Math.sin(p! * D), Math.cos(p! * D) * Math.sin(y! * D)];
        // ⭐⭐⭐ (2026-11-14) × how much the face faces the orbit (`facingWeight`: whole to 90° off its normal, none from 135°)
        const w = poleWeight(u[1]) * facingWeight(u, nn, [-nn[2], 0, nn[0]]);
        const old = shownDir(u, nn, [-nn[2], 0, nn[0]], [0, 1, 0], 1 - 0.75 * w, 1 - 0.6 * w);
        const now = calmShown(u, { n: nn, sH: 0.25, sV: 0.4 });
        for (const k of [0, 1, 2]) expect(now[k]).toBeCloseTo(old[k]!, 12);
      }
    expect(a).not.toContain("calmWeight(");
    // the targets: across, the facet's span (`edgeShare` of `t.across`); the facet the map's own (never a hit's normal)
    const K = { shareH: 0.25, zoneHPct: 25, zoneMinHM: 0.03, vOn: true, shareV: 0.25, zoneVPct: 25, zoneMinVM: 0.03 };
    const t0 = { band: "SIDE" as const, surface: [0, 0.2, 0] as Vec3, across: { L: 0.03, lo: 0, hi: 0.49 } };
    expect(calmTarget(t0, { n: [0, 0, -1], b: [0, 1, 0], bLo: 0, bHi: 0.4 }, null, K).sH).toBe(edgeShare(0.03, 0.49, 0.25, 25, 0.03));
    expect(calmTarget({ ...t0, band: "TOP" }, { n: [0, 1, 0], b: [0, 0, 1], bLo: 0, bHi: 0.4 }, null, K)).toEqual({ n: null, sH: 1, sV: 1, wA: 1 }); // a cap: none (⭐ 2026-11-10: read toward its edge's line, `wA` 1)
    // ⭐ (2026-11-15, step 2.3) the knobs from one helper (`calmKnobs`, its `smooth` from `calmRules`) — `chart_calm_wiring.test.ts`
    expect(a).toContain("calmTarget(sh.t, map.facets[sh.t.stack]!, cfg.faceSpanShareVOn === 1 ? map.box : null, calmKnobs(st, rules.smooth), acrossNormals(st, map, sh));");
    expect(a).toContain("st.asmCalm = calmStep(st.asmCalm, tg, dtMs);"); // ⭐ (step 2.3) a cap with no side to read; the generic call: `chart_calm_wiring.test.ts`
    expect(a).toContain("st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch };");
    expect(a).toContain("calmFrame(st, dtMs);");
    expect(code("render/assembly_wiring.ts")).toContain("asmCalm: null,");
    const m = code("render/tuning_menu.ts");
    const i = m.indexOf('title: "CALM ON A FACE"'); // ⭐ (2026-11-13) the menu by subject (`menu_layout.test.ts`)
    expect(i).toBeGreaterThan(m.indexOf('title: "ORBIT"'));
    const sub = m.slice(i, m.indexOf("],", i));
    for (const k of ["faceSpanShareH", "faceSpanZoneHPct", "faceSpanZoneMinHCm", "faceSpanShareVOn", "faceSpanShareV", "faceSpanZoneVPct", "faceSpanZoneMinVCm"]) expect(sub).toContain(`"${k}"`);
    const d = DEFAULT_CONFIG;
    expect([d.faceSpanShareH, d.faceSpanZoneHPct, d.faceSpanZoneMinHCm, d.faceSpanShareVOn, d.faceSpanShareV, d.faceSpanZoneVPct, d.faceSpanZoneMinVCm]).toEqual([0.25, 25, 3, 1, 0.25, 25, 3]);
    expect("faceSpanEngageM" in d).toBe(false); // the distance gate deleted (Q3)
    expect(() => validateGestureConfig({ ...d, faceSpanShareVOn: 0.5 })).toThrow();
    expect(() => validateGestureConfig({ ...d, faceSpanShareH: 1.5 })).toThrow();
  });
});

// ⭐⭐⭐ (2026-11-14, the owner's records: "piece flying toward the end of each recording") the calm faded as the orbit turns AWAY from the eased face —
// whole to 90° off its normal, none from 135°: ⛔ unbounded, a fast finger took the orbit 166 – 174° round the eased normal, the angle off it wrapped
// through ±180° and the shown direction leapt to the other side (the piece 3 – 5 m in one frame, the gizmo held)
describe("the calm faded as the face turns away (facingWeight)", () => {
  const n: Vec3 = [0, 0, -1];
  const t: Vec3 = [1, 0, 0];
  const at = (deg: number): Vec3 => [Math.sin((deg * Math.PI) / 180), 0, -Math.cos((deg * Math.PI) / 180)];
  it("whole up to 90°, none from 135°, smooth between", () => {
    for (const d of [0, 30, 60, 89.9]) expect(facingWeight(at(d), n, t)).toBe(1);
    for (const d of [135, 150, 180, -170]) expect(facingWeight(at(d), n, t)).toBe(0);
    let prev = 1;
    for (let d = 90; d <= 135; d += 1) {
      const w = facingWeight(at(d), n, t);
      expect(w).toBeLessThanOrEqual(prev + 1e-12);
      expect(prev - w).toBeLessThan(0.06);
      prev = w;
    }
  });
  it("the shown direction continuous all the way round the eased normal — no leap through ±180°", () => {
    const c = { n, sH: 0.25, sV: 0.4 };
    let prev = calmShown(at(-180), c);
    for (let d = -179; d <= 180; d += 1) {
      const s = calmShown(at(d), c);
      // ⭐ through the fade (90° – 135°) the calm released: up to ≈ 3° shown per degree of orbit — continuous, never a leap
      expect((Math.acos(Math.min(1, prev[0] * s[0] + prev[1] * s[1] + prev[2] * s[2])) * 180) / Math.PI).toBeLessThan(4);
      prev = s;
    }
  });
});

// ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §5.1, step 1.4) THE SHARE CONTINUOUS ON A NARROW RUN — `edgeShare` turns whole as a face's width passes two zones
// (0.25 → 1 at 6 cm with today's knobs); `edgeShareSmooth` ramps the interior share to 1 from four minimum zones to two. Not wired: `calmTarget` reads it
// only with `smooth: true`, which no caller sets.
describe("⭐⭐⭐ (ORBIT_CHARTS step 1.4) the calm's share continuous on a narrow run (edgeShareSmooth, CalmKnobs.smooth)", () => {
  type Set = readonly [number, number, number]; // interior, zone %, minimum zone (m)
  const TODAY: Set = [0.25, 25, 0.03];
  const SETS: readonly Set[] = [TODAY, [0.4, 10, 0.02], [0, 40, 0.05], [0.25, 25, 0]];
  it("⭐⭐ EXACTLY edgeShare wherever the run is at least four minimum zones and the zone share under 50 %", () => {
    let n = 0;
    for (const [k, pct, m] of SETS)
      for (let i = 0; i <= 60; i++) {
        const run = Math.max(4 * m, 0.001) + i * 0.0097;
        for (let j = -2; j <= 52; j++) {
          const d = (j / 100) * run;
          expect(edgeShareSmooth(d, run, k, pct, m)).toBe(edgeShare(d, run, k, pct, m));
          n++;
        }
      }
    expect(n).toBe(4 * 61 * 55);
  });
  it("⭐⭐ 1 for a run of two minimum zones or less, and for a zone share of 50 % and of 80 %, as edgeShare", () => {
    for (const run of [0, 0.001, 0.03, 0.0599, 0.06])
      for (const d of [0, run / 4, run / 2]) {
        expect(edgeShareSmooth(d, run, 0.25, 25, 0.03)).toBe(1);
        expect(edgeShare(d, run, 0.25, 25, 0.03)).toBe(1);
      }
    for (const pct of [50, 80])
      for (const run of [0.07, 0.2, 0.49, 1.3])
        for (const d of [0, 0.01, run / 3, run / 2]) {
          expect(edgeShareSmooth(d, run, 0.25, pct, 0.03)).toBe(1);
          expect(edgeShare(d, run, 0.25, pct, 0.03)).toBe(1);
        }
  });
  it("⭐⭐⭐ NO JUMP: the run swept 1 – 30 cm (0.1 mm steps) at its middle and the distance across a run, never a step over 0.01 — ⛔ edgeShare jumps 0.75 at 6 cm (the defect)", () => {
    const [k, pct, m] = TODAY;
    let maxS = 0;
    let maxE = 0;
    let atE = 0;
    let prevS = edgeShareSmooth(0.005, 0.01, k, pct, m);
    let prevE = edgeShare(0.005, 0.01, k, pct, m);
    for (let i = 101; i <= 3000; i++) {
      const run = i * 1e-4;
      const s = edgeShareSmooth(run / 2, run, k, pct, m);
      const e = edgeShare(run / 2, run, k, pct, m);
      maxS = Math.max(maxS, Math.abs(s - prevS));
      if (Math.abs(e - prevE) > maxE) { maxE = Math.abs(e - prevE); atE = run; }
      prevS = s;
      prevE = e;
    }
    expect(maxS).toBeLessThan(0.01);
    expect(maxE).toBeCloseTo(0.75, 9); // ⛔ the defect, pinned
    expect(atE).toBeCloseTo(0.06, 9); // 600 × 0.1 mm, a hair over 6 cm in floating point: the first run past two zones
    for (const [k2, pct2, m2] of SETS)
      for (const run of [0.065, 0.07, 0.09, 0.11, 0.12, 0.2, 0.49]) {
        let prev = edgeShareSmooth(0, run, k2, pct2, m2);
        for (let i = 1; i * 1e-4 <= run; i++) {
          const s = edgeShareSmooth(i * 1e-4, run, k2, pct2, m2);
          expect(Math.abs(s - prev)).toBeLessThan(0.01);
          prev = s;
        }
      }
  });
  it("⭐⭐ it never decreases as the run shortens (at its middle), and stays within interior … 1", () => {
    for (const [k, pct, m] of SETS) {
      let prev = -1;
      for (let i = 3000; i >= 1; i--) {
        const run = i * 1e-4;
        const s = edgeShareSmooth(run / 2, run, k, pct, m);
        expect(s).toBeGreaterThanOrEqual(prev - 1e-12);
        prev = s;
        for (const f of [0, 0.1, 0.3, 0.5]) {
          const v = edgeShareSmooth(f * run, run, k, pct, m);
          expect(v).toBeGreaterThanOrEqual(k);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  // ⛔ `calmTarget`'s body as committed before step 1.4 (`1dc43c8`), verbatim but for its name — the "today" the knob's absence is measured against
  const oldCalmTarget = (
    t: { readonly band: "SIDE" | "TOP" | "BOTTOM"; readonly surface: Vec3; readonly across: { readonly L: number; readonly lo: number; readonly hi: number } },
    f: { readonly n: Vec3; readonly b: Vec3; readonly bLo: number; readonly bHi: number },
    box: { readonly lo: Vec3; readonly hi: Vec3 } | null,
    k: CalmKnobs,
    across?: { readonly lo: Vec3 | null; readonly hi: Vec3 | null },
  ): { readonly n: Vec3 | null; readonly sH: number; readonly sV: number; readonly wA: number } => {
    const VERTICAL_EPS = 1e-6;
    if (t.band !== "SIDE") return { n: null, sH: 1, sV: 1, wA: 1 };
    const L = t.across;
    const fracUp = (): number => {
      if (Math.abs(f.n[1]) < VERTICAL_EPS) {
        if (box === null || !(box.hi[1] - box.lo[1] > 0)) return 0.5;
        return Math.min(t.surface[1] - box.lo[1], box.hi[1] - t.surface[1]) / (box.hi[1] - box.lo[1]);
      }
      const s = t.surface[0] * f.b[0] + t.surface[1] * f.b[1] + t.surface[2] * f.b[2];
      return f.bHi - f.bLo > 0 ? Math.min(s - f.bLo, f.bHi - s) / (f.bHi - f.bLo) : 0.5;
    };
    const wA = acrossWeight(L.hi - L.lo > 0 ? Math.min(L.L - L.lo, L.hi - L.L) / (L.hi - L.lo) : 0.5, fracUp());
    let sH = edgeShare(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, k.shareH, k.zoneHPct, k.zoneMinHM);
    let sV = 1;
    if (k.vOn) {
      if (Math.abs(f.n[1]) < VERTICAL_EPS) {
        const y = t.surface[1];
        if (box !== null) sV = edgeShare(Math.min(y - box.lo[1], box.hi[1] - y), box.hi[1] - box.lo[1], k.shareV, k.zoneVPct, k.zoneMinVM);
      } else {
        const s = t.surface[0] * f.b[0] + t.surface[1] * f.b[1] + t.surface[2] * f.b[2];
        sV = edgeShare(Math.min(s - f.bLo, f.bHi - s), f.bHi - f.bLo, k.shareV, k.zoneVPct, k.zoneMinVM);
      }
    }
    const frameDiffers = (m: Vec3 | null): boolean => m !== null && !(Math.abs(f.n[1]) < VERTICAL_EPS && Math.abs(m[1]) < VERTICAL_EPS);
    const near = (d: number, run: number, pct: number, minM: number): number => 1 - edgeShare(d, run, 0, pct, minM);
    if (across !== undefined) {
      const run = L.hi - L.lo;
      const p = Math.max(frameDiffers(across.lo) ? 1 - near(L.L - L.lo, run, k.zoneHPct, k.zoneMinHM) : 0, frameDiffers(across.hi) ? 1 - near(L.hi - L.L, run, k.zoneHPct, k.zoneMinHM) : 0);
      sV = 1 - (1 - sV) * (1 - p);
    }
    return { n: f.n, sH, sV, wA };
  };

  type TT = Parameters<typeof calmTarget>[0];
  type FF = Parameters<typeof calmTarget>[1];
  type BB = Parameters<typeof calmTarget>[2];
  type AA = Parameters<typeof calmTarget>[4];
  const K: CalmKnobs = { shareH: 0.25, zoneHPct: 25, zoneMinHM: 0.03, vOn: true, shareV: 0.25, zoneVPct: 25, zoneMinVM: 0.03 };
  const slantN: Vec3 = [0, 0.5, -Math.sqrt(0.75)];
  const slantB = facetFrame(slantN).b;
  const box = (h: number) => ({ lo: [-0.3, 0, -0.3] as Vec3, hi: [0.3, h, 0.3] as Vec3 });
  const sOf = (y: number): Vec3 => [0.02, y, -0.1 + 0.4 * y];
  const FACETS: readonly { readonly f: FF; readonly box: BB }[] = [
    { f: { n: [0, 0, -1], b: [0, 1, 0], bLo: 0, bHi: 0.54 }, box: box(0.54) }, // a wide vertical facet
    { f: { n: [0, 0, -1], b: [0, 1, 0], bLo: 0, bHi: 0.09 }, box: box(0.09) }, // a vertical one in a narrow box
    { f: { n: slantN, b: slantB, bLo: -0.1, bHi: 0.3 }, box: box(0.54) }, // a slanted one
    { f: { n: slantN, b: slantB, bLo: 0, bHi: 0.09 }, box: null }, // a narrow slanted one
  ];
  const ACROSS: readonly AA[] = [undefined, { lo: slantN, hi: [1, 0, 0] }, { lo: null, hi: [0, 0.6, -0.8] }, { lo: [1, 0, 0], hi: [-1, 0, 0] }];
  const grid = (each: (t: TT, f: FF, b: BB, a: AA) => void): number => {
    let n = 0;
    for (const { f, box: b } of FACETS)
      for (const chord of [0.05, 0.08, 0.09, 0.4, 0.49])
        for (const fr of [0, 0.02, 0.1, 0.3, 0.5, 0.8, 1])
          for (const y of [0.005, 0.03, 0.045, 0.1, 0.27])
            for (const a of ACROSS) {
              each({ band: "SIDE", surface: sOf(y), across: { L: -0.1 + fr * chord, lo: -0.1, hi: -0.1 + chord } }, f, b, a);
              n++;
            }
    return n;
  };
  it("⭐⭐⭐ `smooth` absent or false: calmTarget EXACTLY as before step 1.4 on a grid of places (wide, slanted, narrow; with and without `across`)", () => {
    for (const k of [K, { ...K, vOn: false }, { ...K, zoneHPct: 10, zoneMinHM: 0.02, shareV: 0.4, zoneMinVM: 0.05 }]) {
      let differs = 0;
      const n = grid((t, f, b, a) => {
        const old = oldCalmTarget(t, f, b, k, a);
        expect(calmTarget(t, f, b, k, a)).toEqual(old);
        expect(calmTarget(t, f, b, { ...k, smooth: false }, a)).toEqual(old);
        const sm = calmTarget(t, f, b, { ...k, smooth: true }, a);
        if (sm.sH !== old.sH || sm.sV !== old.sV) differs++;
      });
      expect(n).toBe(4 * 5 * 7 * 5 * 4);
      expect(differs).toBeGreaterThan(0); // the grid reaches places where the smooth share differs: the comparison can fail
    }
    expect(calmTarget({ band: "TOP", surface: [0, 0, 0], across: { L: 0, lo: 0, hi: 0.09 } }, FACETS[0]!.f, null, { ...K, smooth: true })).toEqual({ n: null, sH: 1, sV: 1, wA: 1 });
  });
  it("⭐⭐⭐ `smooth: true`: a 9 cm chord's middle reads a horizontal share strictly between today's interior share and 1; a 40 cm chord as today; every share read through edgeShareSmooth", () => {
    const f = FACETS[0]!.f;
    const mid = (chord: number): TT => ({ band: "SIDE", surface: [0, 0.27, 0], across: { L: chord / 2, lo: 0, hi: chord } });
    expect(calmTarget(mid(0.09), f, box(0.54), K).sH).toBe(0.25); // today: the interior share at 9 cm …
    expect(calmTarget(mid(0.059), f, box(0.54), K).sH).toBe(1); // … and whole below 6 cm
    const narrow = calmTarget(mid(0.09), f, box(0.54), { ...K, smooth: true });
    expect(narrow.sH).toBeGreaterThan(0.25);
    expect(narrow.sH).toBeLessThan(1);
    expect(narrow.sH).toBeCloseTo(0.625, 12); // kEff = 0.25 + 0.75·S(0.5)
    for (const a of ACROSS) expect(calmTarget(mid(0.4), f, box(0.54), { ...K, smooth: true }, a)).toEqual(calmTarget(mid(0.4), f, box(0.54), K, a));
    // the vertical share on a vertical facet (a 9 cm box), on a slanted one (a 9 cm extent), and the weight toward a neighbour of another frame
    const nb = FACETS[1]!;
    const tv: TT = { band: "SIDE", surface: [0, 0.045, 0], across: { L: 0.2, lo: 0, hi: 0.4 } };
    expect(calmTarget(tv, nb.f, nb.box, { ...K, smooth: true }).sV).toBe(edgeShareSmooth(0.045, 0.09, 0.25, 25, 0.03));
    const ns = FACETS[3]!;
    const s0 = 0.045;
    const ts: TT = { band: "SIDE", surface: [s0 * slantB[0], s0 * slantB[1], s0 * slantB[2]], across: { L: 0.2, lo: 0, hi: 0.4 } };
    const sl = calmTarget(ts, ns.f, null, { ...K, smooth: true });
    expect(sl.sV).toBeCloseTo(edgeShareSmooth(0.045, 0.09, 0.25, 25, 0.03), 12);
    expect(sl.sV).toBeGreaterThan(0.25);
    expect(sl.sV).toBeLessThan(1);
    const ta: TT = { band: "SIDE", surface: [0, 0.27, 0], across: { L: 0.03, lo: 0, hi: 0.09 } };
    const p = edgeShareSmooth(0.03, 0.09, 0, 25, 0.03);
    const sV0 = edgeShareSmooth(0.27, 0.54, 0.25, 25, 0.03);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
    expect(calmTarget(ta, f, box(0.54), { ...K, smooth: true }, { lo: slantN, hi: null }).sV).toBe(1 - (1 - sV0) * (1 - p));
  });
});

// ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §5.1, step 2.3) THE CALM ON EVERY SIDE FACE, behind `chartCalm` (on only with `chartLayout`): the rules (`calmRules`),
// no fade by the pitch on a side facet's reading (`CalmState.poleFade` false — `facingWeight` kept), the field taken from the target at once by `calmStep`
// and never a key when the target has none (objects built with the rule off identical to today's). The wiring's pins: `chart_calm_wiring.test.ts`.
describe("⭐⭐⭐ (ORBIT_CHARTS step 2.3) the calm on every side face (calmRules, CalmState.poleFade)", () => {
  // ⛔ `calmShown`'s body as committed before step 2.3 (`50595df`), verbatim but for its name — the "today" an absent or true `poleFade` is measured against
  const oldCalmShown = (u: Vec3, c: CalmState | null): Vec3 => {
    if (c === null) return u;
    const { t, b } = facetFrame(c.n);
    const w = poleWeight(u[0] * b[0] + u[1] * b[1] + u[2] * b[2]) * facingWeight(u, c.n, t);
    if (!(w > 0)) return u;
    const sH = 1 - (1 - c.sH) * w;
    const sV = 1 - (1 - c.sV) * w;
    const wA = Math.min(1, Math.max(0, c.wA ?? 0));
    const d0 = wA >= 1 ? null : shownDir(u, c.n, t, b, sH, sV);
    const d1 = wA <= 0 ? null : shownDirAcross(u, c.n, t, b, sH, sV);
    if (d0 === null) return d1!;
    if (d1 === null) return d0;
    const m: Vec3 = [d0[0] * (1 - wA) + d1[0] * wA, d0[1] * (1 - wA) + d1[1] * wA, d0[2] * (1 - wA) + d1[2] * wA];
    const l = Math.hypot(m[0], m[1], m[2]);
    return l > 1e-12 ? [m[0] / l, m[1] / l, m[2] / l] : d0;
  };
  // the reference without the pitch's fade: the same blend with the weight `facingWeight` alone
  const noFadeRef = (u: Vec3, c: CalmState): Vec3 => {
    const { t, b } = facetFrame(c.n);
    const w = facingWeight(u, c.n, t);
    if (!(w > 0)) return u;
    const sH = 1 - (1 - c.sH) * w;
    const sV = 1 - (1 - c.sV) * w;
    const wA = Math.min(1, Math.max(0, c.wA ?? 0));
    const d0 = wA >= 1 ? null : shownDir(u, c.n, t, b, sH, sV);
    const d1 = wA <= 0 ? null : shownDirAcross(u, c.n, t, b, sH, sV);
    if (d0 === null) return d1!;
    if (d1 === null) return d0;
    const m: Vec3 = [d0[0] * (1 - wA) + d1[0] * wA, d0[1] * (1 - wA) + d1[1] * wA, d0[2] * (1 - wA) + d1[2] * wA];
    const l = Math.hypot(m[0], m[1], m[2]);
    return l > 1e-12 ? [m[0] / l, m[1] / l, m[2] / l] : d0;
  };
  const D = Math.PI / 180;
  const slant: Vec3 = [0, 0.5, -Math.sqrt(0.75)];
  const NORMALS: readonly Vec3[] = [[0, 0, -1], [1, 0, 0], [0.6, 0, -0.8], slant, [Math.sqrt(0.5), -Math.sqrt(0.5), 0]];
  /** `u` at angle `a` round the facet's `b` off `n` (in its `n`, `t` plane) and at `p` toward its `b` */
  const inFrame = (n: Vec3, aDeg: number, pDeg: number): Vec3 => {
    const { t, b } = facetFrame(n);
    const ca = Math.cos(aDeg * D);
    const sa = Math.sin(aDeg * D);
    const cp = Math.cos(pDeg * D);
    const sp = Math.sin(pDeg * D);
    return [cp * (ca * n[0] + sa * t[0]) + sp * b[0], cp * (ca * n[1] + sa * t[1]) + sp * b[1], cp * (ca * n[2] + sa * t[2]) + sp * b[2]];
  };
  const STATES = (n: Vec3): CalmState[] => [
    { n, sH: 0.25, sV: 0.4 },
    { n, sH: 0.25, sV: 0.25, wA: 0.4 },
    { n, sH: 0.6, sV: 0.3, wA: 1 },
    { n, sH: 1, sV: 0.25, wA: 0 },
  ];

  it("⭐⭐ the rules on only when BOTH switches are 1 (the charts' layout and the calm's); else all three off", () => {
    expect(calmRules(1, 1)).toEqual({ smooth: true, everyFacet: true, noPitchFade: true });
    for (const [l, c] of [[0, 0], [0, 1], [1, 0]] as const) expect(calmRules(l, c)).toEqual({ smooth: false, everyFacet: false, noPitchFade: false });
    expect(calmRules(DEFAULT_CONFIG.chartLayout, DEFAULT_CONFIG.chartCalm)).toEqual({ smooth: false, everyFacet: false, noPitchFade: false }); // the defaults: today's
  });

  it("⭐⭐⭐ `poleFade` absent or true: calmShown EXACTLY as before step 2.3 on a grid of directions, normals and shares", () => {
    let n = 0;
    for (const nn of NORMALS)
      for (const c of STATES(nn))
        for (let a = -170; a <= 180; a += 25)
          for (const p of [-89, -80, -70, -50, -20, 0, 15, 45, 62, 75, 84, 88]) {
            const u = inFrame(nn, a, p);
            const old = oldCalmShown(u, c);
            expect(calmShown(u, c)).toEqual(old);
            expect(calmShown(u, { ...c, poleFade: true })).toEqual(old);
            n++;
          }
    expect(n).toBe(5 * 4 * 15 * 12);
  });

  it("⭐⭐⭐ `poleFade: false`: no fade where `u` is 60° – 85° (and beyond) toward the facet's `b` — the calm whole there, as in the middle; `facingWeight` still applied", () => {
    let differs = 0;
    for (const nn of NORMALS)
      for (const c0 of STATES(nn)) {
        const c: CalmState = { ...c0, poleFade: false };
        for (let a = -170; a <= 180; a += 25)
          for (const p of [-84, -75, -65, -40, 0, 30, 62, 70, 78, 84, 88]) {
            const u = inFrame(nn, a, p);
            const now = calmShown(u, c);
            const ref = noFadeRef(u, c);
            for (const k of [0, 1, 2]) expect(now[k]).toBeCloseTo(ref[k]!, 12);
            if (Math.abs(p) >= 60 && Math.abs(a) <= 45) {
              const old = oldCalmShown(u, c0);
              if (Math.hypot(now[0] - old[0], now[1] - old[1], now[2] - old[2]) > 1e-6) differs++;
            }
          }
      }
    expect(differs).toBeGreaterThan(50); // the fade is gone exactly where it acted: the comparison can fail
    // at 80° toward `b`, 20° round off the normal, on a vertical facet: today the calm is all but gone (poleWeight < 0.2); without the fade, whole
    const nn: Vec3 = [0, 0, -1];
    const { t: tt, b: bb } = facetFrame(nn);
    const u = inFrame(nn, 20, 80);
    const c: CalmState = { n: nn, sH: 0.25, sV: 0.25 };
    expect(poleWeight(u[1])).toBeLessThan(0.2);
    const whole = shownDir(u, nn, tt, bb, 0.25, 0.25);
    const nf = calmShown(u, { ...c, poleFade: false });
    for (const k of [0, 1, 2]) expect(nf[k]).toBeCloseTo(whole[k]!, 12);
    expect(Math.hypot(nf[0] - u[0], nf[1] - u[1], nf[2] - u[2])).toBeGreaterThan(0.05);
    // `facingWeight` kept: a face turned away (150° round its `b`) shows the orbit's own direction; 112° a part of the calm
    for (const p of [0, 70, 80]) {
      const away = inFrame(nn, 150, p);
      expect(calmShown(away, { ...c, poleFade: false })).toEqual(away);
      const half = inFrame(nn, 112, p);
      const fw = facingWeight(half, nn, tt);
      expect(fw).toBeGreaterThan(0.2);
      expect(fw).toBeLessThan(0.8);
      const r = shownDir(half, nn, tt, bb, 1 - 0.75 * fw, 1 - 0.75 * fw);
      const got = calmShown(half, { ...c, poleFade: false });
      for (const k of [0, 1, 2]) expect(got[k]).toBeCloseTo(r[k]!, 12);
    }
  });

  it("⭐⭐⭐ calmStep: `poleFade` the TARGET's at once (by position, never eased, never the previous state's); none on the target → no such key on the result", () => {
    const tg = { n: [1, 0, 0] as Vec3, sH: 0.25, sV: 0.25 };
    const prevs: (CalmState | null)[] = [null, { n: [0, 0, -1], sH: 1, sV: 0.25 }, { n: [0, 0, -1], sH: 0.25, sV: 0.25, wA: 0.3 }, { n: [1, 0, 0], sH: 0.4, sV: 0.3 }];
    for (const prev of prevs) {
      const plain = calmStep(prev, tg, 16)!;
      expect("poleFade" in plain).toBe(false);
      expect(Object.keys(plain).sort()).toEqual(["n", "sH", "sV", "wA"]);
      for (const pf of [false, true]) {
        expect(calmStep(prev, { ...tg, poleFade: pf }, 16)).toStrictEqual({ ...plain, poleFade: pf }); // everything else as without the field
        // the previous state's own field never carried, never eased
        expect(calmStep(prev === null ? null : { ...prev, poleFade: !pf }, { ...tg, poleFade: pf }, 16)!.poleFade).toBe(pf);
        const dropped = calmStep(prev === null ? null : { ...prev, poleFade: pf }, tg, 16)!;
        expect(dropped).toStrictEqual(plain);
        expect(Object.keys(dropped)).not.toContain("poleFade");
      }
    }
    // a target with no normal: none from none; from a state, the target's field (here none: no key)
    expect(calmStep(null, { n: null, sH: 1, sV: 1, poleFade: false }, 16)).toBeNull();
    const toCap = calmStep({ n: [0, 0, -1], sH: 0.25, sV: 0.25, poleFade: false }, { n: null, sH: 1, sV: 1 }, 16)!;
    expect(Object.keys(toCap)).not.toContain("poleFade");
    // the turn about `h` taken at once (its own return): the field too
    const up: Vec3 = [0, Math.sin(30 * D), -Math.cos(30 * D)];
    const r = calmStep({ n: [0, 0, -1], sH: 0.25, sV: 1 }, { n: up, sH: 0.25, sV: 0.25, poleFade: false }, 16)!;
    expect(r.n).toEqual(up);
    expect(r.poleFade).toBe(false);
  });
});
