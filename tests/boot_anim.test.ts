/**
 * ⭐⭐ THE BOOT'S ANIMATION — POP AND TUMBLE, ALL AT ONCE (`core/boot_anim.ts`; `40_RENDER_SCENE/spec/ANIMATION.md` §4): on the real `.glb`'s
 * layouts — every part (the plinth too, NOT turning) pops, falls and lands at the SAME time; the end pose EXACT; every turning sphere above the
 * floor; the pop's overshoot bounded; the pitch axis tipping the top toward the camera — each rule with its counter-example; the brushes in the
 * air MEASURED.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { bootFromModel, type BootLayout } from "../src/core/boot_heaps";
import { apply, glbBin, partGeometry, type Placement } from "../src/core/glb_geometry";
import { gapBetween } from "../src/core/collision_shape";
import {
  animatedPlacement, BOOT_ANIM_DEFAULT, bootAnimPlan, bootAnimState, bootCamYawDeg, pitchAxis, popScale, pullBackRadius, type AnimEntry, type AnimPart, type AnimPlan,
} from "../src/core/boot_anim";
import { SCENE2_BOOT_RULE } from "../src/content/scene2_boot";
import { qFromAxisAngle, qRotate, type Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const bytes = new Uint8Array(readFileSync(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url)));
const json = (glbJson(bytes) as { json: unknown }).json;
const cat = readModelCatalog(json).catalog!;
const geo = new Map(partGeometry(json, glbBin(bytes), cat).map((g) => [g.id, g]));
const cfg = BOOT_ANIM_DEFAULT;

/** As the wiring gives them: the anchors (the plinth) NOT turning, then the parts. */
const animParts = (L: BootLayout): AnimPart[] => [
  ...Object.entries(L.anchors).map(([id, a]) => ({ id, extent: a.extent, motion: "pop" as const })),
  ...Object.entries(L.poses).map(([id, p]) => ({ id, extent: p.extent })),
];
const restOf = (L: BootLayout, id: string): Placement => L.anchors[id]?.goal ?? L.poses[id]!;
const centreOf = (L: BootLayout, id: string): Vec3 => (L.anchors[id] ?? L.poses[id]!).extent.centre;
const turning = (theta: number): boolean => {
  const m = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return m > 1e-9 && 2 * Math.PI - m > 1e-9; // the hold's −360° IS the rest orientation
};

/** ⭐ The FLOOR rule, every 2 ms: a turning part's sphere (its pop's scale) never below the floor (y 0). */
function throughFloor(plan: AnimPlan, L: BootLayout): string[] {
  const out = new Set<string>();
  for (let t = 0; t <= plan.endMs; t += 2)
    for (const e of plan.entries) {
      const s = bootAnimState(e, t, cfg);
      if (!s.visible || !turning(s.theta)) continue;
      const x = (L.anchors[e.id] ?? L.poses[e.id]!).extent;
      if (x.centre[1] + s.h - x.radius * s.scale < -1e-9) out.add(`${e.id} below the floor at ${t} ms`);
    }
  return [...out];
}

/** ⚠ MEASURED (not a rule): the pairs whose real hull pieces touch in the air while they turn together, sampled every 10 ms. */
function brushes(plan: AnimPlan, L: BootLayout, axis: Vec3): Set<string> {
  const out = new Set<string>();
  const t0 = Math.min(...plan.entries.map((e) => e.fallAt)), t1 = Math.max(...plan.entries.map((e) => e.landAt));
  for (let t = t0; t < t1; t += 10) {
    const at = plan.entries.map((e) => {
      const P = animatedPlacement(restOf(L, e.id), centreOf(L, e.id), axis, bootAnimState(e, t, cfg));
      return { id: e.id, pcs: geo.get(e.id)!.pieces.map((pc) => pc.map((p) => apply(P, p))) };
    });
    for (let i = 0; i < at.length; i++)
      for (let j = i + 1; j < at.length; j++)
        if (at[i]!.pcs.some((a) => at[j]!.pcs.some((b) => (gapBetween(a, b) ?? 0) === 0))) out.add(`${at[i]!.id}×${at[j]!.id}`);
  }
  return out;
}

describe("on the real layouts (four seeds, four fronts)", () => {
  const cases: [number, number][] = [[1, 270], [7, 0], [42, 90], [20261113, 180]];
  for (const [seed, front] of cases) {
    const L = bootFromModel(bytes, json, cat, SCENE2_BOOT_RULE, seed, front);
    const plan = bootAnimPlan(animParts(L), cfg, seed);
    it(`seed ${seed}: EVERY part but the floor, the plinth too, pops at the SAME time, from the same lift (${(plan.endMs / 1000).toFixed(2)} s)`, () => {
      expect(plan.entries.map((e) => e.id).sort()).toEqual(cat.parts.map((p) => p.id).sort());
      expect(new Set(plan.entries.map((e) => e.popAt)).size).toBe(1);
      expect(new Set(plan.entries.filter((e) => e.id !== "E01").map((e) => e.lift)).size).toBe(1);
      expect(plan.entries[0]!.popAt).toBe(0);
      expect(plan.endMs).toBeLessThan(2500);
    });
    it(`seed ${seed}: each piece's HOLD its own, 50 – 100 ms (the owner: "random, clamped between 50 ms and 100 ms … different lag for each piece")`, () => {
      const holds = plan.entries.filter((e) => e.id !== "E01").map((e) => e.fallAt - e.popAt - cfg.popMs);
      for (const h of holds) {
        expect(h).toBeGreaterThanOrEqual(50);
        expect(h).toBeLessThanOrEqual(100);
      }
      expect(new Set(holds).size).toBeGreaterThan(holds.length / 2); // ⛔ not one lag for all
      expect(bootAnimPlan(animParts(L), cfg, seed).entries).toEqual(plan.entries); // the same seed, the same holds
      expect(bootAnimPlan(animParts(L), cfg, seed + 1).entries.map((e) => e.fallAt)).not.toEqual(plan.entries.map((e) => e.fallAt));
    });
    it(`seed ${seed}: ⭐ the PLINTH pops IN PLACE — no lift, no fall, no turn, no rebound (the owner: "the plinth pops up directly in its position")`, () => {
      const p = plan.entries.find((e) => e.id === "E01")!;
      for (let t = 0; t <= plan.endMs; t += 2) {
        const s = bootAnimState(p, t, cfg);
        expect(s.h).toBe(0);
        expect(s.theta).toBe(0);
      }
      expect(p.endAt).toBe(cfg.popMs);
      expect(bootAnimState(p, cfg.popMs / 2, cfg).scale).toBeGreaterThan(0.5); // it does pop
      const crank = plan.entries.find((e) => e.id === "E03")!;
      expect(turning(bootAnimState(crank, (crank.fallAt + crank.landAt) / 2, cfg).theta)).toBe(true);
    });
    it(`seed ${seed}: the END POSE is the layout's, EXACTLY; nothing visible before its pop`, () => {
      const axis = pitchAxis(front);
      for (const e of plan.entries) {
        const rest = restOf(L, e.id);
        expect(animatedPlacement(rest, centreOf(L, e.id), axis, bootAnimState(e, e.endAt, cfg))).toEqual({ position: rest.position, rotation: rest.rotation, scale: 1 });
        expect(bootAnimState(e, e.popAt - 1, cfg).visible).toBe(false);
        const near = animatedPlacement(rest, centreOf(L, e.id), axis, bootAnimState(e, e.endAt - 1, cfg));
        expect(Math.hypot(...(near.position.map((v, k) => v - rest.position[k]!) as [number, number, number]))).toBeLessThan(0.01);
      }
    });
    it(`seed ${seed}: NO TURNING PART THROUGH THE FLOOR (every 2 ms)`, () => {
      expect(throughFloor(plan, L)).toEqual([]);
    });
    it(`seed ${seed}: ⛔ counter-example — the turn run down to the rest goes through the floor, CAUGHT`, () => {
      const bad: AnimPlan = { ...plan, entries: plan.entries.map((e) => ({ ...e, turnTo: 0 })) };
      expect(throughFloor(bad, L).length).toBeGreaterThan(0);
    });
    it(`seed ${seed}: ⚠ measured — the pairs brushing in the air while all turn together`, { timeout: 120_000 }, () => {
      const b = brushes(plan, L, pitchAxis(front));
      console.log(`seed ${seed}: lift ${plan.entries.find((e) => e.id !== "E01")!.lift.toFixed(2)} units, ${b.size} pairs brush in the air: ${[...b].join(" ")}`);
      expect(b.size).toBeLessThan(plan.entries.length * 2); // a record, not a guarantee (`ANIMATION.md` §4)
    });
  }
});

describe("the curves", () => {
  it("the POP: 0 → peak 1 + overshoot → 1; with no overshoot never past 1", () => {
    let peak = 0;
    for (let u = 0; u <= 1; u += 0.001) peak = Math.max(peak, popScale(u, 0.08));
    expect(popScale(0, 0.08)).toBe(0);
    expect(popScale(1, 0.08)).toBe(1);
    expect(peak).toBeGreaterThan(1.075);
    expect(peak).toBeLessThanOrEqual(1.08 + 1e-9);
    for (let u = 0; u <= 1; u += 0.01) expect(popScale(u, 0)).toBeLessThanOrEqual(1);
  });
  it("the HOLD is short and each piece's own (the owner: \"shorten the pause\", then \"random, clamped between 50 ms and 100 ms\")", () => {
    expect([cfg.holdMinMs, cfg.holdMaxMs]).toEqual([50, 100]);
  });
  const e: AnimEntry = { id: "x", popAt: 0, fallAt: 270, landAt: 770, endAt: 950, lift: 4, radius: 1, turns: true, turnFrom: 4, turnTo: 1 };
  it("the FALL accelerates (gravity): the first half covers a quarter of the height", () => {
    expect(bootAnimState(e, 520, cfg).h).toBeCloseTo(3, 9);
  });
  it("one g: a higher lift falls LONGER (√ of the height)", () => {
    const parts: AnimPart[] = [{ id: "a", extent: { centre: [0, 1, 0], radius: 1, bottom: 0, top: 2 } }];
    const lo = bootAnimPlan(parts, { ...cfg, turnRoom: 1 }).entries[0]!, hi = bootAnimPlan(parts, { ...cfg, turnRoom: 6 }).entries[0]!;
    expect((hi.landAt - hi.fallAt) / (lo.landAt - lo.fallAt)).toBeCloseTo(Math.sqrt(hi.lift / lo.lift), 2);
  });
  it("the TURN: a whole 360° off at the hold, back to 0 by `turnTo`, none below it", () => {
    expect(Math.abs(bootAnimState(e, 270, cfg).theta)).toBeCloseTo(2 * Math.PI, 9);
    for (let t = 270; t < 770; t += 2) {
      const s = bootAnimState(e, t, cfg);
      if (s.h < e.turnTo) expect(s.theta).toBe(-0);
    }
  });
  it("a `pop` part (the plinth) does not set the turn's window, never moves", () => {
    const parts: AnimPart[] = [
      { id: "plinth", extent: { centre: [0, 0.2, 0], radius: 2.5, bottom: 0, top: 0.4 }, motion: "pop" },
      { id: "part", extent: { centre: [5, 0.3, 0], radius: 0.7, bottom: 0, top: 0.6 } },
    ];
    const p = bootAnimPlan(parts, cfg);
    expect(p.entries[1]!.turnTo).toBeCloseTo(0.7 * 1.08 - 0.3, 9); // the falling part's window, the plinth's radius not in it
    for (let t = 0; t < p.endMs; t += 5) expect(bootAnimState(p.entries[0]!, t, cfg).theta).toBe(0);
  });
  it("the REBOUND: TWO hops straight up (the owner: \"the rebound is a bit dull\"), the second a quarter of the first, back to rest; no turn", () => {
    const d1 = 180 / 1.5; // the test entry's 180 ms of rebound, split 2 : 1
    let top1 = 0, top2 = 0;
    for (let t = 770; t < 950; t++) {
      const s = bootAnimState(e, t, cfg);
      if (t - 770 < d1) top1 = Math.max(top1, s.h);
      else top2 = Math.max(top2, s.h);
      expect(s.theta).toBe(0);
    }
    expect(top1).toBeCloseTo(cfg.rebound * e.radius, 3);
    expect(top2).toBeCloseTo((cfg.rebound * e.radius) / 4, 3);
    expect(Math.abs(bootAnimState(e, 770 + d1, cfg).h)).toBeLessThan(1e-9); // it touches down between the hops
    expect(top1).toBeLessThanOrEqual(0.2); // 16 % of the radius ("a bit more" than 12 %)
    expect(bootAnimState(e, 950, cfg)).toEqual({ visible: true, scale: 1, h: 0, theta: 0, done: true });
  });
});

describe("the CAMERA'S PULL BACK (the owner: \"from r=1.5m to r=3m\" until the pieces are set)", () => {
  it("1.5 m at the boot, 3 m EXACTLY when the last piece is set, eased both ends, never past", () => {
    expect(pullBackRadius(1.5, 3, 0, 1600)).toBe(1.5);
    expect(pullBackRadius(1.5, 3, 800, 1600)).toBeCloseTo(2.25, 12);
    expect(pullBackRadius(1.5, 3, 1600, 1600)).toBe(3);
    expect(pullBackRadius(1.5, 3, 5000, 1600)).toBe(3);
    expect(pullBackRadius(1.5, 3, 16, 1600) - 1.5).toBeLessThan(0.002); // slow in: no jump at the start
    let last = 0;
    for (let t = 0; t <= 1600; t += 10) {
      const r = pullBackRadius(1.5, 3, t, 1600);
      expect(r).toBeGreaterThanOrEqual(last);
      last = r;
    }
  });
  it("the defaults: 2.5 m and −15° of yaw; a LAYER — the radius given back after the draw", () => {
    expect(DEFAULT_CONFIG.bootCamFromM).toBe(2.5); // the owner: "revert to 2.5 m -> 3m" (1.5 first; 2.25 tried)
    expect(DEFAULT_CONFIG.bootCamYawFromDeg).toBe(-15); // then "from -15 to zero degree" (−5 first) // "yaw from -5 to 0 degree (current front)"
    const w = readFileSync(new URL("../src/render/boot_anim_wiring.ts", import.meta.url), "utf8");
    expect(w).toMatch(/onAfterRenderObservable\.add[\s\S]*st\.camera\.radius -= applied\.dRadius;\s*st\.camera\.alpha -= applied\.dAlpha;[\s\S]*getViewMatrix\(true\)/);
  });
});

describe("the CAMERA'S YAW: −15° → +2° (null speed there) → 0° in 1 s, arriving at almost zero speed", () => {
  const y = (t: number) => bootCamYawDeg(-15, 2, t, 1600, 1000);
  const v = (t: number) => (y(t + 1) - y(t)) * 1000; // °/s
  it("the poses: −15° at the boot, +2° when the pieces are set, 0° exactly 1 s later", () => {
    expect(y(0)).toBe(-15);
    expect(y(1600)).toBe(2);
    expect(y(2600)).toBe(0);
    expect(y(9999)).toBe(0);
  });
  it("almost zero speed at +2° and at 0°; it does move between", () => {
    expect(Math.abs(v(1599))).toBeLessThan(0.05);
    expect(Math.abs(v(1600))).toBeLessThan(0.05);
    expect(Math.abs(v(2598))).toBeLessThan(0.05);
    expect(Math.abs(v(2100))).toBeGreaterThan(3); // the peak, mid-way (2° × 15/8 per s)
  });
});

describe("⛔ no input-driven orbit or approach until the yaw is back at 0° (the owner: \"deny input driven orbit or approach until the zero degree has been reached\")", () => {
  const w = readFileSync(new URL("../src/render/boot_anim_wiring.ts", import.meta.url), "utf8");
  it("the module's pointer filter is FIRST in line, stops the scene's pointer events while the animation or the yaw's tail runs", () => {
    expect(w).toMatch(/st\.scene\.onPointerObservable\.add\(\s*\(info, es\) => \{[\s\S]*const busy = anim !== null \|\| tail !== null;[\s\S]*es\.skipNextObservers = true;[\s\S]*\},\s*undefined,\s*true,\s*\);/);
  });
  it("a press made meanwhile stays stopped until its release (no half gesture)", () => {
    expect(w).toMatch(/if \(busy && info\.type === PointerEventTypes\.POINTERDOWN\) held\.add\(id\);/);
    expect(w).toMatch(/if \(busy \|\| held\.has\(id\)\)/);
  });
});

describe("the PITCH axis: the boot camera's right — a positive angle tips the top TOWARD the camera", () => {
  for (const f of [0, 90, 180, 270, 33]) {
    it(`front ${f}°`, () => {
      const toCam: Vec3 = [Math.cos((f * Math.PI) / 180), 0, Math.sin((f * Math.PI) / 180)];
      const up: Vec3 = [0, 1, 0];
      const tipped = qRotate(qFromAxisAngle(pitchAxis(f), 0.1), up);
      expect(tipped[0] * toCam[0] + tipped[2] * toCam[2]).toBeGreaterThan(0.09);
      // ⛔ counter-example: the opposite axis tips it AWAY
      const away = qRotate(qFromAxisAngle(pitchAxis(f).map((v) => -v) as unknown as Vec3, 0.1), up);
      expect(away[0] * toCam[0] + away[2] * toCam[2]).toBeLessThan(-0.09);
      expect(Math.abs(pitchAxis(f)[1])).toBe(0); // horizontal
    });
  }
});
