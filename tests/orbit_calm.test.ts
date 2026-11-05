// ⭐⭐⭐ THE CALM — 58d86ff's face-span orbit share (2026-11-03), ported to the tilted orbit's rebuild (2026-11-04, `1.0.95-`, the owner: *"i am referring to
// this calm behavior of commit 58d86ff… It shall stay"*). The first five cases are 58d86ff's own, unchanged.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { alignedShare, poleWeight, CALM_TAU_MS, easeNormal, easeToward, edgeShare, shownDir } from "../src/input/orbit_calm";
import { buildFaceMap, mapTarget } from "../src/input/face_map";

import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";
import { UP_FRESH, placeUp } from "../src/input/camera_up";

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
    // dy's run: ⭐⭐⭐ (2026-11-05, Step 6) the place up its FACET within the facet's span — one span on every side of the box (no bounce), whole at its edge
    // (⛔ the parts' box: above the top face on `Scene_1`, the calm still at work at the edge where the frame turns — the piece jumped at the turn)
    const spans = core.facets.filter((f) => f.kind === "SIDE").map((f) => [f.bLo, f.bHi]);
    for (const sp of spans) expect(sp).toEqual([expect.closeTo(spans[0]![0]!, 12), expect.closeTo(spans[0]![1]!, 12)]);
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("sV = fv === null ? 1 : edgeShare(Math.min(b - fv.bLo, fv.bHi - b), fv.bHi - fv.bLo, cfg.faceSpanShareV, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100);");
    expect(a).not.toContain("chainRun(");
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
    const { offsetFrame, offsetWithUp } = await import("../src/input/assembly_orbit");
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
    // ⭐ (2026-11-05, §20) the up the shown direction's OWN (`cameraUp` → gravity's for it — `calmHeading` deleted): upright on the wall
    expect(rollOf(offsetWithUp(u, placeUp(u, { cap: null, edges: [] }, UP_FRESH, 0.01).up, 0, 0))).toBeLessThan(1e-6); // upright on a wall
    expect(rollOf(offsetFrame(u, yaw, 0, 0))).toBeGreaterThan(5); // ⛔ the orbit's yaw: rolled
    expect(code("render/assembly_wiring.ts")).toContain("const r = placeUp(u, st.asmUpPlace, st.asmUpState, st.cfg.cameraRollMm / 1000);");
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
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("k.n = k.sH > 0.999 ? n : easeNormal(k.n, n, dtMs);");
    expect(a).toContain("sH = alignedShare(sH, k.n[0] * n[0] + k.n[2] * n[2]);");
    expect(a).not.toContain("sV = alignedShare("); // ⛔ the vertical share released at every corner: the bounce
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
    expect(a).toContain("return n === null ? calmDir(st, u) : coneClamp(u, n, st.asmLock!.cone ?? undefined);");
    expect(a).toContain("return toWorld(F, shownDir(u, k.n, [-k.n[2], 0, k.n[0]], [0, 1, 0], 1 - (1 - k.sH) * w, 1 - (1 - k.sV) * w));");
    // ⭐⭐⭐ (the owner, Q3: *"same calm at every distance"*) no distance in the weight — ⛔ 58d86ff's gate curved the A + dy approach
    expect(a).toContain("const w = poleWeight(u[1]);");
    expect(a).not.toContain("calmWeight(");
    expect(a).toContain("sH = edgeShare(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm / 100);");
    expect(a).toContain("const nf = colFacet === null ? t.normal : colFacet.n;"); // ⭐ (Step 4c-bis) the face map's side, never a hit's normal
    expect(a).toContain("st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch };");
    expect(a).toContain("const fv = cfg.faceSpanShareVOn === 1 && !capBand ? (faceMapOf(st)?.facets[t.stack] ?? null) : null;");
    // ⭐⭐⭐ (2026-11-05, §20) past a column's band the calm of the facet just passed (⛔ none: the targets flipped at the band's edge — the camera swung 100–127 mm)
    expect(a).toContain("const nf = colFacet === null ? t.normal : colFacet.n;");
    expect(a).toContain("calmFrame(st, dtMs);");
    expect(code("render/scene.ts")).toContain("st.asmCalm = null;");
    const m = code("render/tuning_menu.ts");
    const i = m.indexOf('title: "FACE-SPAN ORBIT SHARE"');
    expect(i).toBeGreaterThan(m.indexOf('title: "CAMERA ORBIT AROUND CENTER"'));
    const sub = m.slice(i, m.indexOf("],", i));
    for (const k of ["faceSpanShareH", "faceSpanZoneHPct", "faceSpanZoneMinHCm", "faceSpanShareVOn", "faceSpanShareV", "faceSpanZoneVPct", "faceSpanZoneMinVCm"]) expect(sub).toContain(`"${k}"`);
    const d = DEFAULT_CONFIG;
    expect([d.faceSpanShareH, d.faceSpanZoneHPct, d.faceSpanZoneMinHCm, d.faceSpanShareVOn, d.faceSpanShareV, d.faceSpanZoneVPct, d.faceSpanZoneMinVCm]).toEqual([0.25, 25, 3, 1, 0.25, 25, 3]);
    expect("faceSpanEngageM" in d).toBe(false); // the distance gate deleted (Q3)
    expect(() => validateGestureConfig({ ...d, faceSpanShareVOn: 0.5 })).toThrow();
    expect(() => validateGestureConfig({ ...d, faceSpanShareH: 1.5 })).toThrow();
  });
});
