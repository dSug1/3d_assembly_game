// ⭐⭐⭐ THE CALM — 58d86ff's face-span orbit share (2026-11-03), ported to the tilted orbit's rebuild (2026-11-04, `1.0.95-`, the owner: *"i am referring to
// this calm behavior of commit 58d86ff… It shall stay"*). The first five cases are 58d86ff's own, unchanged.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { alignedShare, calmHeading, calmShown, calmStep, calmTarget, poleWeight, CALM_TAU_MS, easeNormal, easeToward, edgeShare, shownDir } from "../src/input/orbit_calm";
import { buildFaceMap, mapTarget } from "../src/input/face_map";

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
    expect(code("render/assembly_wiring.ts")).toContain("return offsetFrame(u, st.asmLocked ? cam.yaw : calmHeading(cam.yaw, orbitDir(cam.yaw, cam.v), u), o.yawRad, o.pitchRad);");
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
    expect(a).toContain("return n === null ? tiltDir(R, calmDir(st, u)) : coneClamp(tiltDir(R, u), n, st.asmLock!.cone ?? undefined);");
    expect(a).toContain("return calmShown(u, c);");
    // ⭐ (2026-11-09, §8) on a VERTICAL facet `calmShown` is exactly the old wiring's: the side's frame (its level `t`, the world's up) and the pole weight by
    // the pitch alone — ⭐⭐⭐ (the owner, Q3: *"same calm at every distance"*) no distance in the weight (⛔ 58d86ff's gate curved the A + dy approach)
    const D = Math.PI / 180;
    for (const nn of [[0, 0, -1], [1, 0, 0], [0.6, 0, -0.8]] as Vec3[])
      for (const [y, p] of [[-60, 20], [-100, 70], [10, -40]]) {
        const u: Vec3 = [Math.cos(p! * D) * Math.cos(y! * D), Math.sin(p! * D), Math.cos(p! * D) * Math.sin(y! * D)];
        const w = poleWeight(u[1]);
        const old = shownDir(u, nn, [-nn[2], 0, nn[0]], [0, 1, 0], 1 - 0.75 * w, 1 - 0.6 * w);
        const now = calmShown(u, { n: nn, sH: 0.25, sV: 0.4 });
        for (const k of [0, 1, 2]) expect(now[k]).toBeCloseTo(old[k]!, 12);
      }
    expect(a).not.toContain("calmWeight(");
    // the targets: across, the facet's span (`edgeShare` of `t.across`); the facet the map's own (never a hit's normal)
    const K = { shareH: 0.25, zoneHPct: 25, zoneMinHM: 0.03, vOn: true, shareV: 0.25, zoneVPct: 25, zoneMinVM: 0.03 };
    const t0 = { band: "SIDE" as const, surface: [0, 0.2, 0] as Vec3, across: { L: 0.03, lo: 0, hi: 0.49 } };
    expect(calmTarget(t0, { n: [0, 0, -1], b: [0, 1, 0], bLo: 0, bHi: 0.4 }, null, K).sH).toBe(edgeShare(0.03, 0.49, 0.25, 25, 0.03));
    expect(calmTarget({ ...t0, band: "TOP" }, { n: [0, 1, 0], b: [0, 0, 1], bLo: 0, bHi: 0.4 }, null, K)).toEqual({ n: null, sH: 1, sV: 1 }); // a cap: none
    expect(a).toContain("calmTarget(sh.t, map.facets[sh.t.stack]!, cfg.faceSpanShareVOn === 1 ? map.box : null, {");
    expect(a).toContain("st.asmCalm = calmStep(st.asmCalm, tg, dtMs);");
    expect(a).toContain("st.asmShown = { t: m.t, yaw: mq.yaw, pitch: mq.pitch };");
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
