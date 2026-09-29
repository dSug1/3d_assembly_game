/**
 * GOLDEN VECTORS — **`D170`: the demo scene** (the owner, 2026-09-29) → `Claude/20_GAME_RULES/spec/DEMO_SCENE.md`.
 *
 * ⭐ What is asserted is the SPEC, measured on the committed plan: 30 moves, each the shape of a player move,
 * chained from the start configuration to the final one, penetrating nothing and leaving the cube at no
 * sample of its path; and the playback's timing and camera. ⛔ The path check samples the PLAYBACK
 * (`demoPosesAt`), not the generator's own segments — a second route to the same claim.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE1_DEMO } from "../src/content/scene1_demo";
import { SCENE1_DEMO_PLAN as PLAN } from "../src/content/scene1_demo_plan";
import { formatDemoPlan } from "../src/content/demo_plan_format";
import { SCENES } from "../src/content/scenes";
import { GAME_CONTENT } from "../src/content/worlds";
import { DEMO_DEFAULTS, DEMO_MOVES_END, demoVolume, demoYawAt, generateDemoPlan, movesProgress, seatsOf, towardCamera, type DemoPlan, type DemoPose } from "@core/demo_plan";
import { contourDims, parseSceneDescriptor, serializeSceneDescriptor, type SceneDescriptor } from "@core/game_structure";
import { boxShape, gapBetween } from "@core/collision_shape";
import { boundsFromShapes, hullAtSpawn, poseFree } from "@core/collision";
import { makeWorld, setWorldPlacement, type World } from "@core/object_model";
import { add, cross, dot, IDENTITY, length, normalize, qAngle, qconj, qmul, qRotate, sub, type Vec3 } from "@core/vec";
import { advanceDemo, DEMO_LEAD_IN_S, demoCamera, demoDistanceM, demoMoveAt, demoPosesAt, demoSchedule, fitDistanceM } from "@input/demo_playback";
import { orbitOffset } from "@input/orbit";
import { sceneConfig } from "@input/scene_rig";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const final = new Map(SCENE_1.final!.bodies.map((f) => [f.id, f.position]));
const near = (a: readonly number[], b: readonly number[], eps = 1e-5) => a.every((v, i) => Math.abs(v - b[i]!) <= eps);
const turn = (a: DemoPose, b: DemoPose) => qAngle(qmul([...b.orientation], qconj([...a.orientation])));

describe("⭐⭐⭐ `D170` — the plan is data, and the data is the generator's", () => {
  it("⭐ the committed `scene1_demo_plan.ts` is exactly what the generator writes today (seed 1)", { timeout: 120_000 }, () => {
    const committed = readFileSync(new URL("../src/content/scene1_demo_plan.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n");
    expect(committed).toBe(formatDemoPlan(generateDemoPlan(SCENE_1, { seed: DEMO_DEFAULTS.seed })));
  });

  it("⭐ `D171`: 150 moves — 30 pieces, 5 moves each (the owner's hypothesis)", () => {
    expect(PLAN.moves).toHaveLength(150);
    expect(Object.keys(PLAN.start)).toHaveLength(30);
  });

  it("⭐ the volume: a cube of half the floor's largest side (20 → 10 units), centred on the boot orbit centre (0, 2.3, 0)", () => {
    expect(demoVolume(SCENE_1)).toEqual({ min: [-5, -2.7, -5], max: [5, 7.3, 5] });
    expect(PLAN.volume).toEqual({ min: [-5, -2.7, -5], max: [5, 7.3, 5] });
  });
});

describe("⭐⭐⭐ every move is the reverse of a player move — its SHAPE", () => {
  for (const [i, m] of PLAN.moves.entries()) {
    it(`#${i + 1} ${m.kind} ${m.body}`, () => {
      const d = sub([...m.to.position], [...m.from.position]);
      const still = turn(m.from, m.to) < 1e-5;
      if (m.kind === "TRANSLATE") expect([still, Math.abs(d[1]) < 1e-9, length(d) > 0]).toEqual([true, true, true]);
      if (m.kind === "LIFT") expect([still, Math.abs(d[0]) + Math.abs(d[2]) < 1e-9, length(d) > 0]).toEqual([true, true, true]);
      if (m.kind === "APPROACH") {
        expect(still).toBe(true);
        expect(d.filter((v) => Math.abs(v) > 1e-9)).toHaveLength(1); // ⭐ one world axis
      }
      if (m.kind === "YAW" || m.kind === "ALIGN") {
        expect(near(m.from.position, m.to.position, 1e-9)).toBe(true); // ⭐ about the centre
        expect(turn(m.from, m.to)).toBeGreaterThan(0.05);
      }
      if (m.kind === "YAW") {
        const q = qmul([...m.to.orientation], qconj([...m.from.orientation]));
        const axis = normalize([q[1], q[2], q[3]])!;
        expect(Math.abs(axis[1])).toBeCloseTo(1, 5); // ⭐ about gravity
      }
      if (m.kind === "ALIGN") expect(turn(m.to, { position: [0, 0, 0], orientation: [...IDENTITY] as DemoPose["orientation"] })).toBeLessThan(1e-5);
      if (m.kind === "SNAP") {
        expect(still).toBe(true);
        expect(length(d)).toBeCloseTo(DEMO_DEFAULTS.snapGap, 5);
        expect(near(m.to.position, final.get(m.body)!, 1e-6)).toBe(true); // ⭐ it lands on its final pose
        expect(m.pioneer).toBeDefined();
      }
    });
  }

  it("⭐ each piece's chain is 5 moves (`D171`) ending ALIGN → APPROACH → SNAP, so a YAW is always undone by an ALIGN", () => {
    for (const id of Object.keys(PLAN.start)) {
      const kinds = PLAN.moves.filter((m) => m.body === id).map((m) => m.kind);
      expect(kinds.slice(-3)).toEqual(["ALIGN", "APPROACH", "SNAP"]);
      expect(kinds).toHaveLength(5);
      expect(kinds[0] === "TRANSLATE" ? kinds[1] : kinds[0]).toMatch(/^(LIFT|YAW)$/);
    }
  });

  it("⭐ each SNAP seats the piece against its Pioneer: at the final pose that neighbour is one of its seats", () => {
    const w = assembled();
    for (const m of PLAN.moves.filter((x) => x.kind === "SNAP")) {
      const seats = seatsOf(w, m.body, DEMO_DEFAULTS.minContact);
      const seat = seats.find((s) => s.pioneer === m.pioneer)!;
      expect(seat).toBeDefined();
      // ⭐ the snap arrives moving TOWARD the Pioneer: opposite to the direction that leaves it
      const d = normalize(sub([...m.to.position], [...m.from.position]))!;
      expect(dot(d, seat.away)).toBeCloseTo(-1, 6);
    }
  });
});

function assembled(): World {
  return makeWorld(
    SCENE_1.bodies.map((b) => ({
      id: b.id,
      local: { position: b.frozen ? [...b.position] : [...final.get(b.id)!], orientation: [...IDENTITY] },
      parent: null,
      faces: [],
      connectors: [],
      constraints: [],
      frozen: b.frozen,
      shape: boxShape(contourDims(b)),
    })),
  );
}

/** ⭐ Every collision or cube exit met along the PLAYBACK of `plan` from its start configuration. */
function violations(plan: DemoPlan, scene: SceneDescriptor, samples: number): string[] {
  const fin = new Map(scene.final!.bodies.map((f) => [f.id, f.position]));
  let world = makeWorld(
    scene.bodies.map((b) => ({
      id: b.id,
      local: { position: b.frozen ? [...b.position] : [...fin.get(b.id)!], orientation: [...IDENTITY] },
      parent: null,
      faces: [],
      connectors: [],
      constraints: [],
      frozen: b.frozen,
      shape: boxShape(contourDims(b)),
    })),
  );
  for (const [id, p] of demoPosesAt(plan, 0)) world = setWorldPlacement(world, id, p);
  const setup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: DEMO_DEFAULTS.skin };
  const sched = demoSchedule(plan.moves);
  const dims = new Map(scene.bodies.map((b) => [b.id, contourDims(b)]));
  const bad: string[] = [];
  plan.moves.forEach((m, i) => {
    const { t0, t1 } = sched[i]!;
    for (let k = 1; k <= samples; k++) {
      const p = demoPosesAt(plan, t0 + ((t1 - t0) * k) / samples).get(m.body)!;
      const next = setWorldPlacement(world, m.body, p);
      if (!poseFree(world, next, [m.body], m.body, setup).free) bad.push(`#${i + 1} ${m.body} collides`);
      const h = dims.get(m.body)!.map((v) => v / 2);
      for (let c = 0; c < 8; c++) {
        const corner = add(p.position, qRotate(p.orientation, [c & 1 ? h[0]! : -h[0]!, c & 2 ? h[1]! : -h[1]!, c & 4 ? h[2]! : -h[2]!]));
        if (corner.some((v, j) => v < plan.volume.min[j]! - 1e-6 || v > plan.volume.max[j]! + 1e-6)) bad.push(`#${i + 1} ${m.body} leaves the cube`);
      }
      world = next;
    }
  });
  return [...new Set(bad)];
}

/** ⭐ `D171`: the least gap, over every APPROACH's start, from the approaching piece to any other body then. */
function leastApproachClearance(plan: DemoPlan): number {
  const poses = new Map<string, { position: Vec3; orientation: readonly number[] }>();
  for (const b of SCENE_1.bodies) poses.set(b.id, { position: [...(b.frozen ? b.position : final.get(b.id)!)] as Vec3, orientation: [1, 0, 0, 0] });
  for (const [id, p] of Object.entries(plan.start)) poses.set(id, { position: [...p.position] as Vec3, orientation: p.orientation });
  const dims = new Map(SCENE_1.bodies.map((b) => [b.id, contourDims(b)]));
  const box = (id: string) => {
    const p = poses.get(id)!;
    const h = dims.get(id)!.map((v) => v / 2);
    return [0, 1, 2, 3, 4, 5, 6, 7].map((c) => add(p.position, qRotate([...p.orientation] as never, [c & 1 ? h[0]! : -h[0]!, c & 2 ? h[1]! : -h[1]!, c & 4 ? h[2]! : -h[2]!])));
  };
  let least = Infinity;
  for (const m of plan.moves) {
    if (m.kind === "APPROACH")
      for (const other of poses.keys()) if (other !== m.body) least = Math.min(least, gapBetween(box(m.body), box(other))!);
    poses.set(m.body, { position: [...m.to.position] as Vec3, orientation: m.to.orientation });
  }
  return least;
}

describe("⭐⭐⭐ played forwards, the moves chain from the start configuration to the goal — and collide with nothing", () => {
  it("⭐ each move starts where its piece last was; every piece ends at its final pose", () => {
    const at = new Map(Object.entries(PLAN.start));
    for (const m of PLAN.moves) {
      expect(near(m.from.position, at.get(m.body)!.position, 1e-9)).toBe(true);
      expect(near(m.from.orientation, at.get(m.body)!.orientation, 1e-9)).toBe(true);
      at.set(m.body, m.to);
    }
    for (const [id, p] of at) {
      expect(near(p.position, final.get(id)!, 1e-6)).toBe(true);
      expect(near(p.orientation, [1, 0, 0, 0], 1e-6)).toBe(true);
    }
  });

  it("⭐⭐ sampled along the PLAYBACK (120 samples per move): no penetration, every moving box inside the cube", { timeout: 300_000 }, () => {
    expect(violations(PLAN, SCENE_1, 120)).toEqual([]);
  });

  it("⭐ `D171`: every piece is truly CLEAR where its APPROACH starts — at least `clearance` from every other body", { timeout: 120_000 }, () => {
    expect(leastApproachClearance(PLAN)).toBeGreaterThanOrEqual(DEMO_DEFAULTS.clearance - 1e-5);
    // ⭐ and on a fresh 100-move plan, where the rule before `D171` pulled four pieces sideways INSIDE the painting
    expect(leastApproachClearance(generateDemoPlan(SCENE_1, { moveCount: 100 }))).toBeGreaterThanOrEqual(DEMO_DEFAULTS.clearance - 1e-5);
  });

  it("⭐⭐ `D171` — the pieces come apart TOWARD the camera that will watch them go back (the real playback's camera)", () => {
    const sched = demoSchedule(PLAN.moves);
    const c = [0, 1, 2].map((i) => (PLAN.volume.min[i]! + PLAN.volume.max[i]!) / 2);
    let pull = Infinity;
    let spot = Infinity;
    PLAN.moves.forEach((m, i) => {
      const d = towardCamera(demoCamera(0.45, sched[i]!.t0 * DEMO_MOVES_END).yawRad);
      // ⭐ an APPROACH comes in from where the piece was pulled out to: that pull faced the camera, or ran across it
      if (m.kind === "APPROACH") {
        const out = normalize(sub([...m.from.position], [...m.to.position]))!;
        pull = Math.min(pull, dot(out, d));
      }
      // ⭐ a TRANSLATE leaves the scatter spot: on the camera's side of the centre, by `facing` less the camera's drift
      if (m.kind === "TRANSLATE") spot = Math.min(spot, (m.from.position[0] - c[0]!) * d[0] + (m.from.position[2] - c[2]!) * d[2]);
    });
    // ⭐ never behind: at worst 25° past square to the camera (measured −0.29 on seed 1, where one piece's camera-facing
    // axes were all blocked; the rule before `D171`, −z first, reached −1.00 with 16 of 30 pulls behind)
    expect(pull).toBeGreaterThan(-0.45);
    expect(spot).toBeGreaterThan(DEMO_DEFAULTS.facing - 0.2);
  });

  it("⭐ a TIGHTER cube (a 12-unit floor → side 6) is honoured too — the check, not the luck of the draw", { timeout: 120_000 }, () => {
    const tight: SceneDescriptor = {
      ...SCENE_1,
      bodies: SCENE_1.bodies.map((b) => (b.frozen ? { ...b, dims: [12, b.dims[1], 12] as const } : b)),
    };
    const plan = generateDemoPlan(tight, { moveCount: 30 });
    expect(plan.volume).toEqual({ min: [-3, -0.7, -3], max: [3, 5.3, 3] });
    expect(violations(plan, tight, 100)).toEqual([]);
  });

  it("⛔ a generation that cannot be completed THROWS — it never ships a shorter plan", () => {
    expect(() => generateDemoPlan(SCENE_1, { moveCount: 3 })).toThrow(/cannot be split into chains of 5–5/);
    expect(() => generateDemoPlan(SCENE_1, { moveCount: 151 })).toThrow(/cannot be split/);
    expect(() => generateDemoPlan(SCENE_1, { chain: [3, 5] })).toThrow(/at least 4 moves/);
    expect(() => generateDemoPlan({ ...SCENE_1, final: null })).toThrow(/final configuration/);
  });
});

describe("⭐⭐ the playback — timing, speed, camera (`input/demo_playback.ts`)", () => {
  it("⭐ the schedule covers [0, 1] in play order, a longer move taking longer", () => {
    const s = demoSchedule(PLAN.moves);
    expect(s[0]!.t0).toBe(0);
    expect(s[s.length - 1]!.t1).toBe(1);
    for (let i = 1; i < s.length; i++) expect(s[i]!.t0).toBeCloseTo(s[i - 1]!.t1, 12);
    const w = demoSchedule([{ travel: 0.3 }, { travel: 4 }]);
    expect(w[1]!.t1 - w[1]!.t0).toBeGreaterThan(w[0]!.t1 - w[0]!.t0);
  });

  it("⭐ progress 0 shows the start configuration, progress 1 the final one", () => {
    const a = demoPosesAt(PLAN, 0);
    const b = demoPosesAt(PLAN, 1);
    for (const [id, p] of Object.entries(PLAN.start)) {
      expect(near(a.get(id)!.position, p.position, 1e-12)).toBe(true);
      expect(near(b.get(id)!.position, final.get(id)!, 1e-6)).toBe(true);
    }
    expect(demoMoveAt(PLAN, 0)).toBe(0);
    expect(demoMoveAt(PLAN, 1)).toBeNull();
  });

  it("⭐ the lead-in is spent first; the duration sets the speed; a change mid-demo keeps the progress made", () => {
    let s = advanceDemo({ leadS: DEMO_LEAD_IN_S, progress: 0 }, 0.5, 30);
    expect(s).toEqual({ leadS: 0.5, progress: 0 });
    s = advanceDemo(s, 3.5, 30);
    expect(s.leadS).toBe(0);
    expect(s.progress).toBeCloseTo(0.1, 12);
    const faster = advanceDemo(s, 1, 10);
    expect(faster.progress).toBeCloseTo(0.2, 12);
    expect(advanceDemo(s, 1000, 30).progress).toBe(1);
  });

  it("⭐⭐ the camera: a turn to the RIGHT, steady while the moves play, rising linearly to the top ring", () => {
    const boot = -Math.PI / 2;
    const deg = (r: number) => (r * 180) / Math.PI;
    const c0 = demoCamera(0.45, 0);
    const c1 = demoCamera(0.45, 1);
    expect([c0.yawRad, c0.elevation]).toEqual([boot, 0.45]);
    expect(deg(c1.yawRad - boot)).toBeCloseTo(360, 9);
    expect(c1.elevation).toBe(1);
    expect(demoCamera(0.45, 0.5).elevation).toBeCloseTo(0.725, 12);
    // ⭐ steady: equal steps of progress, equal turns, up to the end of the moves
    const step = (p: number) => demoYawAt(p + 1e-4) - demoYawAt(p);
    expect(step(0.1)).toBeCloseTo(step(0.8), 12);
    // ⭐ "towards the right": the camera's first step moves along its own right, cross(up, forward)
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const cam = (yaw: number) => orbitOffset(cfg, yaw, 0.45, 1).offsetM;
    const forward = normalize(sub([0, 0, 0], cam(boot)))!;
    const right = cross([0, 1, 0], forward);
    expect(dot(sub(cam(demoCamera(0.45, 0.01).yawRad), cam(boot)), right)).toBeGreaterThan(0);
  });

  it("⭐⭐ `D171` — the goal is reached with 15° of orbit LEFT; the camera then slows, with no jolt, to rest at the end", () => {
    const deg = (r: number) => (r * 180) / Math.PI;
    expect(DEMO_MOVES_END).toBeCloseTo(345 / 375, 12);
    // ⭐ the last move lands exactly when 15° remain
    expect(movesProgress(DEMO_MOVES_END)).toBe(1);
    expect(movesProgress(DEMO_MOVES_END - 1e-6)).toBeLessThan(1);
    expect(deg(demoYawAt(DEMO_MOVES_END) - demoYawAt(0))).toBeCloseTo(345, 9);
    const poses = demoPosesAt(PLAN, movesProgress(DEMO_MOVES_END));
    for (const [id, p] of poses) expect(near(p.position, final.get(id)!, 1e-6)).toBe(true);
    // ⭐ no jolt: the speed just before and just after the moves end is the same; it slows the whole tail; zero at the end
    const rate = (p: number) => (demoYawAt(p + 1e-7) - demoYawAt(p - 1e-7)) / 2e-7;
    expect(rate(DEMO_MOVES_END + 1e-6)).toBeCloseTo(rate(DEMO_MOVES_END - 1e-6), 3);
    expect(rate(0.96)).toBeLessThan(rate(0.94));
    expect((demoYawAt(1) - demoYawAt(1 - 1e-6)) / 1e-6).toBeLessThan(1e-3 * rate(0.5));
  });

  it("⭐⭐ `D171` — the start distance FITS the whole cube: every corner inside both fields of view, and 1 % closer one is not", () => {
    // ⭐ An independent projection: a look-at camera built here, not `fitDistanceM`'s own basis.
    const inside = (half: Vec3, toCam: Vec3, d: number, fovV: number, aspect: number): boolean => {
      const eye: Vec3 = [toCam[0] * d, toCam[1] * d, toCam[2] * d];
      const fwd = normalize(sub([0, 0, 0], eye))!;
      const right = normalize(cross([0, 1, 0], fwd))!;
      const up = cross(fwd, right);
      for (let c = 0; c < 8; c++) {
        const p: Vec3 = [c & 1 ? half[0] : -half[0], c & 2 ? half[1] : -half[1], c & 4 ? half[2] : -half[2]];
        const v = sub(p, eye);
        const z = dot(v, fwd);
        if (Math.abs(dot(v, right)) > Math.tan(fovV / 2) * aspect * z + 1e-9) return false;
        if (Math.abs(dot(v, up)) > Math.tan(fovV / 2) * z + 1e-9) return false;
      }
      return true;
    };
    const half: Vec3 = [0.5, 0.5, 0.5];
    for (const [toCam, aspect] of [
      [[0, 0, -1], 1],
      [[0, 0, -1], 0.63], // ⭐ a portrait tablet: the width decides
      [normalize([0.4, 0.5, -0.7])!, 1.6],
      [normalize([-0.7, 0.2, 0.3])!, 0.63],
    ] as [Vec3, number][]) {
      const d = fitDistanceM(half, toCam, 0.8, aspect);
      expect(inside(half, toCam, d, 0.8, aspect)).toBe(true);
      expect(inside(half, toCam, d * 0.99, 0.8, aspect)).toBe(false);
    }
    // ⭐ the closed form at a level view: d = ½ / tan(fov / 2) + ½ — 1.683 m square, 2.377 m portrait (fov 0.8)
    expect(fitDistanceM(half, [0, 0, -1], 0.8, 1)).toBeCloseTo(0.5 / Math.tan(0.4) + 0.5, 9);
    expect(fitDistanceM(half, [0, 0, -1], 0.8, 0.63)).toBeCloseTo(0.5 / (Math.tan(0.4) * 0.63) + 0.5, 9);
  });

  it("⭐⭐ `D171` — the distance grows linearly from the fit to the rig's maximum, reached as the demo ends", () => {
    expect(demoDistanceM(2, 3, 0)).toBe(2);
    expect(demoDistanceM(2, 3, 0.5)).toBe(2.5);
    expect(demoDistanceM(2, 3, 1)).toBe(3);
    // ⛔ a cube that cannot be fitted within the maximum: held AT the maximum the whole demo
    expect([0, 0.5, 1].map((p) => demoDistanceM(3.4, 3, p))).toEqual([3, 3, 3]);
  });

  it("⭐ the duration is a validated tunable, 10–60 s, default 23 (the owner, 2026-09-29; 30, then 20)", () => {
    expect(DEFAULT_CONFIG.demoDurationS).toBe(23);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, demoDurationS: 9 })).toThrow(/demoDurationS/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, demoDurationS: 61 })).toThrow(/demoDurationS/);
  });
});

describe("⭐⭐ `Scene1_demo` — the spec applied to `Scene_1`, in World 0", () => {
  it("⭐ World 0's third level, so `?sceneIndex=2`", () => {
    const w0 = GAME_CONTENT.worlds.find((w) => w.id === "World_0")!;
    expect(w0.levels.map((l) => l.id)).toEqual(["Level_0", "Level_1", "Level1_demo"]);
    expect(SCENES[2]!.id).toBe("Scene1_demo");
  });

  it("⭐ its pieces start at the plan's start poses; the others sit in the painting; the goal is Scene_1's", () => {
    for (const b of SCENE1_DEMO.bodies) {
      if (b.frozen) continue;
      const s = PLAN.start[b.id];
      if (s) expect(b).toMatchObject({ position: s.position, orientation: { quat: s.orientation } });
      else expect(b.position).toEqual(final.get(b.id));
    }
    expect(SCENE1_DEMO.final).toBe(SCENE_1.final);
    expect(SCENE1_DEMO.demo).toBe(PLAN);
  });

  it("⭐ it survives the JSON seam; a demo moving a body the scene lacks is refused", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE1_DEMO))).toEqual(SCENE1_DEMO);
    const bad = JSON.parse(serializeSceneDescriptor(SCENE1_DEMO));
    bad.demo.moves[0].body = "Nobody";
    expect(() => parseSceneDescriptor(JSON.stringify(bad))).toThrow(/demo moves a body/);
  });
});
