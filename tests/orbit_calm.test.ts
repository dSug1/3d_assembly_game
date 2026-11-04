// ⭐⭐⭐ THE CALM — 58d86ff's face-span orbit share (2026-11-03), ported to the tilted orbit's rebuild (2026-11-04, `1.0.95-`, the owner: *"i am referring to
// this calm behavior of commit 58d86ff… It shall stay"*). The first five cases are 58d86ff's own, unchanged.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { alignedShare, calmEngageM, calmHeading, calmWeight, CALM_RELEASE_FACTOR, CALM_TAU_MS, easeNormal, easeToward, edgeShare, shownDir } from "../src/input/orbit_calm";
import { chainOf, chainRun, edgeNormal, facetRunToward, nearestOnChain, chainAt } from "../src/input/section_hull";

const nearestFacetNormalZ = (loop: ReturnType<typeof chainOf>, p: [number, number]) => edgeNormal(loop, chainAt(loop, nearestOnChain(loop, p)).edge)[1];
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
  it("⭐ (58d86ff) the calm's weight: whole by 0.8 × the distance, none at the release (1.2 ×) — far out (Scene_1's 6 m) none; the distance kept inside the far orbit's", () => {
    expect(calmWeight(0, 3, 4.5, 1.2)).toBe(0);
    expect(calmWeight(1, 3.6, 4.5, 1.2)).toBe(1);
    expect(calmWeight(1, 5.4, 4.5, 1.2)).toBe(0);
    expect(calmWeight(1, 4.5, 4.5, 1.2)).toBeGreaterThan(0);
    expect(CALM_RELEASE_FACTOR).toBe(1.2);
    expect(calmEngageM(4.5, 6)).toBe(4.5);
    expect(calmEngageM(9, 6)).toBeCloseTo(6 / (1.2 * 1.02), 12);
  });
});

describe("⭐⭐⭐ (2026-11-04, `1.0.95-`) THE CALM PORTED — the runs from the carrier, the shares and the face EASED (the face at a height changes with the height)", () => {
  it("⭐⭐⭐ dx's run: the facet FACING the way of the real face under the gizmo, nearest it (edges in line one facet) — ⛔ the nearest facet alone: a part sticking out of the front bridges the hull, the gizmo on the real front is inside it, nearer the BACK — the calm took the back's normal, the camera swung behind (probed, 121°)", () => {
    const thin = chainOf([[-0.25, -0.05], [0.0, -0.05], [0.25, -0.05], [0.25, -0.017], [-0.25, -0.017], [-0.25, -0.05]]);
    const f = facetRunToward(thin, [-0.15, -0.05], [0, 0, -1])!; // on the front, 10 cm from its left end — the front split in two in line: one run of 0.5 m
    expect(f.run).toBeCloseTo(0.5, 12);
    expect(f.dEdge).toBeCloseTo(0.1, 12);
    expect(f.n[2]).toBeCloseTo(-1, 12);
    const side = facetRunToward(thin, [0.25, -0.04], [1, 0, 0])!;
    expect(side.run).toBeCloseTo(0.033, 9);
    expect(side.n[0]).toBeCloseTo(1, 12);
    // Scene_1 at 0.145–0.217 m: the front bridged to a part at z −0.092 (x 0 … 0.046); the gizmo on the real front (0, −0.05)
    const bridged = chainOf([[-0.243, -0.051], [0, -0.092], [0.046, -0.092], [0.248, -0.051], [0.248, -0.018], [-0.243, -0.018], [-0.243, -0.051]]);
    const fb = facetRunToward(bridged, [0, -0.05], [0, 0, -1])!;
    expect(fb.n[2]).toBeLessThan(-0.95); // a front facet — ⛔ the nearest one alone: the back (+z)
    expect(nearestFacetNormalZ(bridged, [0, -0.05])).toBeGreaterThan(0.95); // what the nearest alone picks
  });
  it("⭐⭐ dy's run: the carrier's in-line stretch of the red chain (the vertical face, split or not), its distance to the nearer end", () => {
    const ch = chainOf([[0, -0.3], [0.05, -0.3], [0.05, 0], [0.05, 0.3], [0, 0.3]]); // bottom, the side in two pieces in line, top
    const r = chainRun(ch, 0.05 + 0.1)!;
    expect(r.run).toBeCloseTo(0.6, 12);
    expect(r.dEdge).toBeCloseTo(0.1, 12);
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
  it("⭐⭐⭐ the calm only as far as the eased normal has caught up (none beyond 30°, whole within 5°); whole shares take a new normal at once (⛔ a share calming while the normal swung across from a stale face: a 271 mm camera jump, probed)", () => {
    expect(alignedShare(0.25, 1)).toBe(0.25);
    expect(alignedShare(0.25, Math.cos((40 * Math.PI) / 180))).toBe(1);
    const mid = alignedShare(0.25, Math.cos((17.5 * Math.PI) / 180));
    expect(mid).toBeGreaterThan(0.25);
    expect(mid).toBeLessThan(1);
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("k.n = k.sH > 0.999 && k.sV > 0.999 ? n : easeNormal(k.n, n, dtMs);");
    expect(a).toContain("sH = alignedShare(sH, al);");
  });
  it("⭐⭐⭐ wired: the piece and the camera on the shown direction (the gizmo on the orbit's own); the targets from the carrier each frame; the eight sliders (58d86ff's seven + its distance) in the submenu", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return n === null ? calmDir(st, u) : coneClamp(u, n, st.asmLock!.cone ?? undefined);");
    expect(a).toContain("return shownDir(u, k.n, [-k.n[2], 0, k.n[0]], [0, 1, 0], 1 - (1 - k.sH) * w, 1 - (1 - k.sV) * w);");
    expect(a).toContain("const w = calmWeight(1, approachDistance(st.cfg, st.approach), calmEngageM(st.cfg.faceSpanEngageM, farDistance(st.cfg)), CALM_RELEASE_FACTOR);");
    expect(a).toContain("sH = edgeShare(f.dEdge, f.run, cfg.faceSpanShareH, cfg.faceSpanZoneHPct, cfg.faceSpanZoneMinHCm / 100);");
    expect(a).toContain("const f = loop === null ? null : facetRunToward(loop, [c.w[0], c.w[2]], hn);");
    expect(a).toContain("st.asmShown = st.asmCarrier === null ? null : { c: st.asmCarrier, yaw: q.yaw, n: hit.normal };");
    expect(a).toContain("const r = cfg.faceSpanShareVOn === 1 ? chainRun(c.chain, c.s) : null;");
    expect(a).toContain("calmFrame(st, dtMs);");
    expect(code("render/scene.ts")).toContain("st.asmCalm = null;");
    const m = code("render/tuning_menu.ts");
    const i = m.indexOf('title: "FACE-SPAN ORBIT SHARE"');
    expect(i).toBeGreaterThan(m.indexOf('title: "CAMERA ORBIT AROUND CENTER"'));
    const sub = m.slice(i, m.indexOf("],", i));
    for (const k of ["faceSpanShareH", "faceSpanZoneHPct", "faceSpanZoneMinHCm", "faceSpanShareVOn", "faceSpanShareV", "faceSpanZoneVPct", "faceSpanZoneMinVCm", "faceSpanEngageM"]) expect(sub).toContain(`"${k}"`);
    const d = DEFAULT_CONFIG;
    expect([d.faceSpanShareH, d.faceSpanZoneHPct, d.faceSpanZoneMinHCm, d.faceSpanShareVOn, d.faceSpanShareV, d.faceSpanZoneVPct, d.faceSpanZoneMinVCm, d.faceSpanEngageM]).toEqual([0.25, 25, 3, 1, 0.25, 25, 3, 4.5]);
    expect(() => validateGestureConfig({ ...d, faceSpanShareVOn: 0.5 })).toThrow();
    expect(() => validateGestureConfig({ ...d, faceSpanShareH: 1.5 })).toThrow();
  });
});
