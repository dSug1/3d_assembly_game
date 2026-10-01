/**
 * GOLDEN VECTORS — **`D191`: the demo starts from small HEAPS, one per colour** (the owner, 2026-09-30) →
 * `Claude/20_GAME_RULES/spec/DEMO_SCENE.md` §2bis.
 *
 * > *"modify the specification so that the start configuration is small heaps one per color (E. in the artefact). Make
 * > sure that the parts are disassembled and added to the heap in the correct order so later they can be reassembled
 * > without colliding with any when they are picked from the heap. pieces in the heap can lay on top of each other at
 * > different elevations (for example one end on floor and one end on top of another piece) which creates natural
 * > rotation of the piece"* — the owner, 2026-09-30.
 *
 * ⭐ Asserted on the COMMITTED plan, read back from its poses with the game's own collision rule — never from the
 * generator's bookkeeping.
 */
import { describe, expect, it } from "vitest";
import { SCENE_1, SCENE_1_PALETTE } from "../src/content/scene_1";
import { SCENE1_DEMO_OPTIONS } from "../src/content/scene1_demo";
import { SCENE1_DEMO_PLAN as PLAN } from "../src/content/scene1_demo_plan";
import { DEMO_DEFAULTS, demoHeaps, demoVolume } from "@core/demo_plan";
import { contourDims } from "@core/game_structure";
import { boxShape, gapBetween } from "@core/collision_shape";
import { boundsFromShapes, hullAtSpawn, poseFree } from "@core/collision";
import { makeWorld, setWorldPlacement, type World } from "@core/object_model";
import { add, IDENTITY, qFromAxisAngle, qmul, qRotate, type Quat, type Vec3 } from "@core/vec";

const OPT = { ...DEMO_DEFAULTS, ...SCENE1_DEMO_OPTIONS };
const ids = Object.keys(PLAN.start);
const body = (id: string) => SCENE_1.bodies.find((b) => b.id === id)!;
const final = new Map(SCENE_1.final!.bodies.map((f) => [f.id, f.position]));
const HEAPS = demoHeaps(SCENE_1, ids, PLAN.volume, OPT);
const setup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: OPT.skin };
const FLOOR_TOP = 0;
const FAR: Vec3 = [1e4, -1e4, 0];

const q = (id: string): Quat => [...PLAN.start[id]!.orientation] as unknown as Quat;
const pos = (id: string): Vec3 => [...PLAN.start[id]!.position] as unknown as Vec3;
function cornersAt(id: string, p: Vec3, o: Quat): Vec3[] {
  const h = contourDims(body(id)).map((v) => v / 2);
  return [0, 1, 2, 3, 4, 5, 6, 7].map((c) => add(p, qRotate(o, [c & 1 ? h[0]! : -h[0]!, c & 2 ? h[1]! : -h[1]!, c & 4 ? h[2]! : -h[2]!])));
}
const bottom = (id: string) => Math.min(...cornersAt(id, pos(id), q(id)).map((c) => c[1]));
/** ⭐ How far the piece's long axis rises from level, degrees. */
function pitchDeg(id: string): number {
  const d = contourDims(body(id));
  const i = [0, 1, 2].sort((a, b) => d[b]! - d[a]! || a - b)[0]!;
  const a = qRotate(q(id), [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]);
  return (Math.asin(Math.min(1, Math.abs(a[1]))) * 180) / Math.PI;
}
/** ⭐ The demo's world at its START: the 30 on their heaps, the 11 in the painting, the floor. */
function startWorld(): World {
  return makeWorld(
    SCENE_1.bodies.map((b) => ({
      id: b.id,
      local: b.frozen
        ? { position: [...b.position], orientation: [...IDENTITY] }
        : PLAN.start[b.id]
          ? { position: pos(b.id), orientation: q(b.id) }
          : { position: [...final.get(b.id)!], orientation: [...IDENTITY] },
      parent: null,
      faces: [],
      connectors: [],
      constraints: [],
      frozen: b.frozen,
      shape: boxShape(contourDims(b)),
    })),
  );
}
const at = (p: Vec3, o: Quat) => ({ position: p, orientation: o });
/** ⭐ Is `id` free at `p` — coming from far away, so any penetration deeper than the skin is refused. */
const freeFromAfar = (w: World, id: string, p: Vec3, o: Quat) =>
  poseFree(setWorldPlacement(w, id, at(FAR, o)), setWorldPlacement(w, id, at(p, o)), [id], id, setup).free;
/** ⭐ The pieces in the order they are LIFTED, played forwards. */
const liftOrder = PLAN.moves.filter((m) => m.kind === "LIFT").map((m) => m.body);
/**
 * ⭐ Lift the pieces off their heaps in `order`, each straight up by its own LIFT's height in 40 steps against the heaps
 * as they are then (the pieces not yet lifted); a lifted piece leaves the scene. The pieces whose lift collides.
 */
function blockedLifts(order: readonly string[]): string[] {
  let w = startWorld();
  const blocked: string[] = [];
  for (const id of order) {
    const lift = PLAN.moves.find((m) => m.kind === "LIFT" && m.body === id)!;
    const rise = lift.to.position[1] - lift.from.position[1];
    let prev = w;
    for (let k = 1; k <= 40; k++) {
      const next = setWorldPlacement(prev, id, at(add(pos(id), [0, (rise * k) / 40, 0]), q(id)));
      if (!poseFree(prev, next, [id], id, setup).free) {
        blocked.push(id);
        break;
      }
      prev = next;
    }
    w = setWorldPlacement(w, id, at(add(FAR, [ids.indexOf(id) * 100, 0, 0]), q(id)));
  }
  return blocked;
}

describe("⭐⭐⭐ `D191` — the start configuration: small HEAPS, one per colour", () => {
  it("⭐ one heap per colour, left to right as the boot camera sees them: white, black, yellow, red, blue", () => {
    const order = [SCENE_1_PALETTE.MAT_A, SCENE_1_PALETTE.MAT_B, SCENE_1_PALETTE.MAT_C, SCENE_1_PALETTE.MAT_D, SCENE_1_PALETTE.MAT_E];
    // ⭐ in that order, for the colours the 30 include (seed 1: the blue plate stays in the painting — four heaps)
    const rank = HEAPS.heaps.map((h) => order.findIndex((c) => c.every((v, i) => v === h.colour[i])));
    expect(rank.every((r, i) => r >= 0 && (i === 0 || r > rank[i - 1]!))).toBe(true);
    expect(HEAPS.heaps.length).toBe(new Set(ids.map((id) => body(id).colour.join())).size);
    for (let i = 1; i < HEAPS.heaps.length; i++) expect(HEAPS.heaps[i]!.x0).toBeGreaterThanOrEqual(HEAPS.heaps[i - 1]!.x1 + OPT.heapGap - 1e-9);
    // ⭐ every piece in the heap of its own colour, its centre inside that heap's strip — or, the fallback, lying FLAT ON
    // THE FLOOR beside it, within a heap and a half of its centre
    let beside = 0;
    for (const h of HEAPS.heaps)
      for (const id of h.ids) {
        expect(body(id).colour).toEqual(h.colour);
        const x = pos(id)[0];
        if (x >= h.x0 - 1e-9 && x <= h.x1 + 1e-9) continue;
        beside++;
        expect(Math.abs(x - h.centre[0])).toBeLessThanOrEqual(1.5 * (h.x1 - h.x0) + 1e-9);
        expect([pitchDeg(id) < 1e-3, bottom(id) < FLOOR_TOP + 0.005]).toEqual([true, true]);
      }
    expect(beside).toBeLessThanOrEqual(3); // seed 1: few — the fallback, not the rule
    expect(HEAPS.heaps.flatMap((h) => h.ids).sort()).toEqual([...ids].sort());
  });

  it("⭐ *in front, just outside the demo cube*, on the floor: every corner outside the cube and over the floor", () => {
    const floor = body("Floor");
    for (const id of ids)
      for (const c of cornersAt(id, pos(id), q(id))) {
        expect(c[2]).toBeLessThanOrEqual(PLAN.volume.min[2] - OPT.heapOffset + 1e-6);
        expect(Math.abs(c[0])).toBeLessThanOrEqual(floor.dims[0] / 2);
        expect(Math.abs(c[2])).toBeLessThanOrEqual(floor.dims[2] / 2);
        expect(c[1]).toBeGreaterThanOrEqual(FLOOR_TOP - OPT.skin - 1e-6);
      }
  });

  it("⭐⭐ every piece RESTS: put down in its turn, it penetrates nothing, and 2 mm lower it would — floor or a piece holds it", () => {
    // ⭐ The heaps rebuilt in the order the pieces were PUT DOWN (the reverse of the lifts), each arriving against the
    // pieces already there — the way the game's rule judges a moving body against the others.
    let w = startWorld();
    for (const id of ids) w = setWorldPlacement(w, id, at(add(FAR, [ids.indexOf(id) * 100, 0, 0]), q(id)));
    for (const id of [...liftOrder].reverse()) {
      // ⭐ lowered onto its heap from the top of its LIFT, in 40 steps, each judged by the game's rule
      const lift = PLAN.moves.find((m) => m.kind === "LIFT" && m.body === id)!;
      const rise = lift.to.position[1] - lift.from.position[1];
      w = setWorldPlacement(w, id, at(add(pos(id), [0, rise, 0]), q(id)));
      expect([id, freeFromAfar(w, id, add(pos(id), [0, rise, 0]), q(id))]).toEqual([id, true]);
      for (let k = 39; k >= 0; k--) {
        const next = setWorldPlacement(w, id, at(add(pos(id), [0, (rise * k) / 40, 0]), q(id)));
        expect([id, k, poseFree(w, next, [id], id, setup)]).toEqual([id, k, { free: true, blockedBy: null }]);
        w = next;
      }
      const lower = add(pos(id), [0, -0.02, 0]);
      expect(poseFree(w, setWorldPlacement(w, id, at(lower, q(id))), [id], id, setup).free).toBe(false);
    }
  });

  it("⭐⭐ *on top of each other at different elevations*, *one end on floor and one end on top of another piece*: natural tilts", () => {
    const tilted = ids.filter((id) => pitchDeg(id) > 5);
    const endOnFloor = tilted.filter((id) => bottom(id) < FLOOR_TOP + 0.005);
    const onOthers = ids.filter((id) => bottom(id) > FLOOR_TOP + 0.01);
    // ⚠ the three-high rule (`D193`, `D194`) leaves fewer leaning: seed 1, 2 (9 at `D191`, 4 at `D193`)
    expect(tilted.length).toBeGreaterThanOrEqual(2);
    expect(endOnFloor.length + tilted.filter((id) => !endOnFloor.includes(id)).length).toBeGreaterThanOrEqual(2);
    expect(onOthers.length).toBeGreaterThanOrEqual(6); // seed 1: 11
    // ⚠ `D193`: *"same as what is shown for the longest black piece"* is no longer held — a 48 cm bar leaning across a
    // heap covers four pieces from above, which the three-deep rule refuses; the bars lie flat at seed 1.
    // ⭐ a leaning piece is held up by ANOTHER piece: it touches one (a gap under 1 mm)
    const gapTo = (a: string, b: string) => gapBetween(cornersAt(a, pos(a), q(a)), cornersAt(b, pos(b), q(b))) ?? 0;
    for (const id of endOnFloor) expect(Math.min(...ids.filter((o) => o !== id).map((o) => gapTo(id, o)))).toBeLessThan(0.01);
    // ⭐ a tilt is a REST, never the search's limit: no piece at the pitch limit
    for (const id of ids) expect(pitchDeg(id)).toBeLessThan(OPT.heapPitchDeg - 1e-6);
  });

  it("⭐⭐⭐ *added to the heap in the correct order*: lifted in play order, no piece's lift meets anything — lifted in the order they were put down, some do", { timeout: 60_000 }, () => {
    expect(liftOrder).toHaveLength(30);
    expect(blockedLifts(liftOrder)).toEqual([]);
    // ⭐ the order is what makes it work: the reverse (the first put down lifted first) digs from the bottom
    expect(blockedLifts([...liftOrder].reverse()).length).toBeGreaterThan(0);
  });

  it("⭐⭐ a rest HOLDS: put down in its turn, a small turn about its centre — either way, about its width or its length — presses into something", () => {
    // ⭐ what a real piece does: whichever side goes down is held, so it does not tip (a piece balanced on one edge would)
    let w = startWorld();
    for (const id of ids) w = setWorldPlacement(w, id, at(add(FAR, [ids.indexOf(id) * 100, 0, 0]), q(id)));
    let checked = 0;
    for (const id of [...liftOrder].reverse()) {
      w = setWorldPlacement(w, id, at(pos(id), q(id)));
      const d = contourDims(body(id));
      const order = [0, 1, 2].sort((a, b) => d[b]! - d[a]! || a - b);
      const axis = (i: number): Vec3 => qRotate(q(id), [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]);
      for (const [about, lever] of [[order[1]!, d[order[0]!]! / 2], [order[0]!, d[order[1]!]! / 2]] as [number, number][]) {
        const delta = Math.min((10 * Math.PI) / 180, Math.asin(Math.min(1, (3 * OPT.skin) / lever)));
        for (const s of [1, -1]) {
          const turned = qmul(qFromAxisAngle(axis(about), s * delta), q(id));
          expect(poseFree(w, setWorldPlacement(w, id, at(pos(id), turned)), [id], id, setup).free).toBe(false);
          checked++;
        }
      }
    }
    expect(checked).toBe(4 * ids.length);
    // ⛔ the counter-example: the first piece lifted, at the top of its LIFT, over nothing, turns freely — the check can fail
    const first = liftOrder[0]!;
    const top = [...PLAN.moves.find((m) => m.kind === "LIFT" && m.body === first)!.to.position] as unknown as Vec3;
    const lifted = setWorldPlacement(w, first, at(top, q(first)));
    const tilt = qmul(qFromAxisAngle([1, 0, 0], 0.05), q(first));
    expect(poseFree(lifted, setWorldPlacement(lifted, first, at(top, tilt)), [first], first, setup).free).toBe(true);
  });

  it("⭐⭐ `D192`/`D193` — *max three pieces stacked on top of each other*: seen from above, no spot under more than three", () => {
    // ⭐ The count the eye makes: each heap piece's outline on the floor (the hull of its corners), and a 1 cm scan of
    // the whole strip. ⛔ `D193`: `D192`'s first rule counted layers of SUPPORT and let a spot 4 deep through.
    const outline = (id: string) => {
      const pts = cornersAt(id, pos(id), q(id)).map((c) => [c[0], c[2]] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cr = (o: number[], a: number[], b: number[]) => (a[0]! - o[0]!) * (b[1]! - o[1]!) - (a[1]! - o[1]!) * (b[0]! - o[0]!);
      const lo: number[][] = [], up: number[][] = [];
      for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, p) <= 0) lo.pop(); lo.push(p); }
      for (const p of [...pts].reverse()) { while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    };
    const under = (h: number[][], x: number, z: number) =>
      h.every((a, i) => { const b = h[(i + 1) % h.length]!; return (b[0]! - a[0]!) * (z - a[1]!) - (b[1]! - a[1]!) * (x - a[0]!) > 0; });
    const outlines = ids.map(outline);
    let most = 0;
    for (let x = PLAN.stage.min[0]; x <= PLAN.stage.max[0]; x += 0.1)
      for (let z = PLAN.stage.min[2]; z <= PLAN.stage.max[2]; z += 0.1) most = Math.max(most, outlines.filter((h) => under(h, x, z)).length);
    expect(OPT.heapMaxLayers).toBe(3);
    expect(most).toBeLessThanOrEqual(3);
    expect(most).toBe(3); // ⭐ and the heaps are still heaps: somewhere, three deep
  });

  it("⭐⭐ `D194` — *max three pieces stacked*: no stack — rest on rest, or leaning — climbs past three pieces", () => {
    // ⭐ Rebuilt in the order the pieces were put down: flat on the floor is level 1; any other piece is one above the
    // highest EARLIER piece it touches (a gap under 1 mm). ⛔ `D193` counted only from above and let a staircase 4 high
    // through — the owner saw it on the glass, *"4 pieces are stacked and one piece is leaning on three stacked"*.
    const level = new Map<string, number>();
    for (const id of [...liftOrder].reverse()) {
      const mine = cornersAt(id, pos(id), q(id));
      const ys = mine.map((c) => c[1]);
      const thin = Math.min(...contourDims(body(id)));
      const flat = Math.min(...ys) < FLOOR_TOP + 0.005 && Math.max(...ys) - Math.min(...ys) < thin + 0.005;
      let below = 0;
      for (const [o, l] of level) if ((gapBetween(mine, cornersAt(o, pos(o), q(o))) ?? 0) < 0.01) below = Math.max(below, l);
      level.set(id, flat ? 1 : below + 1);
    }
    const most = Math.max(...level.values());
    expect(most).toBeLessThanOrEqual(OPT.heapMaxLayers);
    expect([...level.values()].filter((l) => l >= 2).length).toBeGreaterThanOrEqual(6); // ⭐ still heaps
  });

  it("⭐ the stage (what the start view frames) holds every heap piece, from the floor to the highest", () => {
    for (const id of ids)
      for (const c of cornersAt(id, pos(id), q(id))) {
        expect(c[0]).toBeGreaterThanOrEqual(PLAN.stage.min[0] - 1e-5);
        expect(c[0]).toBeLessThanOrEqual(PLAN.stage.max[0] + 1e-5);
        expect(c[2]).toBeGreaterThanOrEqual(PLAN.stage.min[2] - 1e-5);
        expect(c[1]).toBeLessThanOrEqual(PLAN.stage.max[1] + 1e-5);
      }
    expect(PLAN.stage.min[1]).toBe(FLOOR_TOP);
    expect(PLAN.stage.max[1]).toBeGreaterThan(0.5); // ⭐ heaps have height (a grid was one piece thick, 0.33)
  });

  it("⛔ heaps that cannot lie on the floor outside the cube THROW", () => {
    const v = demoVolume(SCENE_1);
    const all = SCENE_1.bodies.filter((b) => !b.frozen).map((b) => b.id);
    const narrow = { ...SCENE_1, bodies: SCENE_1.bodies.map((b) => (b.frozen ? { ...b, dims: [6, b.dims[1], 20] as const } : b)) };
    expect(() => demoHeaps(narrow, all, v, OPT)).toThrow(/leave the floor/);
    expect(() => demoHeaps(SCENE_1, ids, { min: [-5, -2.7, -9.9], max: [5, 7.3, 0] }, OPT)).toThrow(/no room for the demo heaps/);
    expect(() => demoHeaps(SCENE_1, ids, v, OPT)).not.toThrow();
  });
});
