/**
 * GOLDEN VECTORS — **`D174`: the demo starts from a floor GRID** (the owner, 2026-09-30) →
 * `Claude/20_GAME_RULES/spec/DEMO_SCENE.md` §2bis.
 *
 * > *"the parts in the start configuration shall be all aligned with the floor, set on the floor on a virtual grid (do
 * > not show any grid), ordered by color and inside the color groups by descending size. Once lifted, each part shall
 * > reach a position which blends into the current build (piece position matching camera orbit movement not to occlude
 * > the movement)"* — with *"only the 30 moved"*, *"in front, just outside the demo cube"*, *"volume"*.
 * > *"the parts shall present their longest dimension towards the depth axis and their bottom surfaces on depth axis
 * > shall be aligned on x axis"* — the owner, 2026-09-30 (`D175`).
 * > *"make two or three rows of parts instead of one unique row. If required to fit the parts, reverse the order of
 * > alignment along longest dimension every second row. The rows do not need to be justified"* — the owner (`D176`).
 *
 * ⭐ Asserted on the COMMITTED plan, read back from its poses — never from the generator's own bookkeeping.
 */
import { describe, expect, it } from "vitest";
import { SCENE_1, SCENE_1_PALETTE } from "../src/content/scene_1";
import { SCENE1_DEMO as SHELL } from "../src/content/scene1_demo";
import { SCENE1_DEMO_PLAN as PLAN } from "../src/content/scene1_demo_plan";
import { DEMO_DEFAULTS, demoReach, flatOrientations, withDemoPlan, type DemoPose } from "@core/demo_plan";
import { contourDims } from "@core/game_structure";
import { cross, dot, normalize, qAngle, qRotate, sub, type Quat, type Vec3 } from "@core/vec";
import { alongPath, demoFramePointsM, demoPosesAt, demoSchedule, fitPointsDistanceM } from "@input/demo_playback";

const body = (id: string) => SCENE_1.bodies.find((b) => b.id === id)!;
const final = new Map(SCENE_1.final!.bodies.map((f) => [f.id, f.position]));
const q = (p: DemoPose): Quat => [...p.orientation] as unknown as Quat;
/**
 * A piece's world half-extents at an orientation — and whether it is SQUARE (every local axis on a world axis).
 * ⚠ To 1e-5: the saved plan rounds a quaternion to 1e-6 (0.707107), which is not exactly unit length.
 */
function extents(id: string, o: Quat): { half: Vec3; square: boolean } {
  const d = contourDims(body(id));
  const half: [number, number, number] = [0, 0, 0];
  let square = true;
  for (let i = 0; i < 3; i++) {
    const a = qRotate(o, [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]);
    for (let j = 0; j < 3; j++) {
      half[j] = half[j]! + (Math.abs(a[j]!) * d[i]!) / 2;
      if (Math.abs(a[j]!) > 1e-5 && Math.abs(Math.abs(a[j]!) - 1) > 1e-5) square = false;
    }
  }
  return { half, square };
}
const ids = Object.keys(PLAN.start);
/** ⭐ `D176`: a piece's near and far ends along depth, at its start. */
const nearEnd = (id: string) => PLAN.start[id]!.position[2] - extents(id, q(PLAN.start[id]!)).half[2];
const farEnd = (id: string) => PLAN.start[id]!.position[2] + extents(id, q(PLAN.start[id]!)).half[2];
/** ⭐ `D176`: row 1 is the pieces whose NEAR ends are on the near line; row 2 the rest. */
const NEAR_LINE = Math.min(...ids.map(nearEnd));
const row1 = ids.filter((id) => Math.abs(nearEnd(id) - NEAR_LINE) < 1e-5);
const row2 = ids.filter((id) => !row1.includes(id));
const FLOOR_TOP = 0;

describe("⭐⭐⭐ `D174` — the start configuration: every moved piece FLAT on the floor, on a grid", () => {
  it("⭐ only the 30 the plan moves; the other 11 stay in the painting", () => {
    expect(ids).toHaveLength(30);
    for (const b of withDemoPlan(SHELL, PLAN).bodies)
      if (!b.frozen && !PLAN.start[b.id]) expect(b.position).toEqual(final.get(b.id));
  });

  it("⭐⭐ *aligned with the floor*: square to its axes, the smallest side vertical, the longest along DEPTH (`D175`), resting ON it", () => {
    for (const id of ids) {
      const s = PLAN.start[id]!;
      const { half, square } = extents(id, q(s));
      const d = [...contourDims(body(id))].sort((a, b) => b - a);
      expect(square).toBe(true);
      expect(half[2]).toBeCloseTo(d[0]! / 2, 5); // ⭐ `D175`: longest along z — depth
      expect(half[1]).toBeCloseTo(d[2]! / 2, 5); // smallest vertical
      expect(half[0]).toBeCloseTo(d[1]! / 2, 5);
      expect(s.position[1] - half[1]).toBeCloseTo(FLOOR_TOP, 5); // on the floor, not above it and not in it
    }
  });

  it("⭐⭐ *ordered by color and inside the color groups by descending size* — in reading order as the boot camera sees it", () => {
    // ⭐ `D176`: row 1 left to right, then row 2 RIGHT TO LEFT — the order snakes back
    const x = (id: string) => PLAN.start[id]!.position[0];
    const read = [...[...row1].sort((a, b) => x(a) - x(b)), ...[...row2].sort((a, b) => x(b) - x(a))];
    const colours = [SCENE_1_PALETTE.MAT_A, SCENE_1_PALETTE.MAT_B, SCENE_1_PALETTE.MAT_C, SCENE_1_PALETTE.MAT_D, SCENE_1_PALETTE.MAT_E];
    const group = (id: string) => colours.findIndex((c) => c.every((v, i) => v === body(id).colour[i]));
    const volume = (id: string) => body(id).dims[0] * body(id).dims[1] * body(id).dims[2];
    const index = (id: string) => SCENE_1.bodies.indexOf(body(id));
    const expected = [...ids].sort((a, b) => group(a) - group(b) || volume(b) - volume(a) || index(a) - index(b));
    expect(read).toEqual(expected);
    // ⭐ and the order is not trivially the table's: the groups are interleaved in the painting
    expect(expected).not.toEqual([...ids].sort((a, b) => index(a) - index(b)));
    // ⭐ the boot camera looks along +z from −z, so its right is +x: a row reads left to right as x grows
    expect(cross([0, 1, 0], [0, 0, 1])).toEqual([1, 0, 0]);
  });

  it("⭐ on a virtual GRID: each piece at the middle of a whole number of 5 mm cells across, its gutter included", () => {
    const p = DEMO_DEFAULTS.gridPitch;
    for (const id of ids) {
      const across = [...contourDims(body(id))].sort((a, b) => b - a)[1]!; // `D175`: its WIDTH is across
      const cells = Math.ceil((across + DEMO_DEFAULTS.gridGap) / p - 1e-9);
      const edge = PLAN.start[id]!.position[0] - (cells * p) / 2;
      expect(Math.abs(edge / p - Math.round(edge / p))).toBeLessThan(1e-6);
    }
  });

  it("⭐⭐ `D176` — TWO ROWS, the alignment reversed on the second: row 1's NEAR ends on one line, row 2's FAR ends on another", () => {
    expect(row1.length).toBeGreaterThan(1);
    expect(row2.length).toBeGreaterThan(1);
    const farLine = farEnd(row2[0]!);
    for (const id of row2) expect(farEnd(id)).toBeCloseTo(farLine, 5); // `D175`'s *aligned on x*, from the other end
    expect(farLine).toBeCloseTo(PLAN.volume.min[2] - DEMO_DEFAULTS.gridOffset, 5); // 3 cm outside the cube
    // ⭐ and the other ends are ragged: the lengths differ in both rows
    for (const [row, end] of [[row1, farEnd], [row2, nearEnd]] as const) {
      const e = row.map(end);
      expect(Math.max(...e) - Math.min(...e)).toBeGreaterThan(1);
    }
    // ⭐ they INTERLOCK: some pieces of the two rows share x, where the long face the short
    const shareX = row1.some((a) => row2.some((b) => Math.abs(PLAN.start[a]!.position[0] - PLAN.start[b]!.position[0]) < 0.3));
    expect(shareX).toBe(true);
    // ⭐ not justified: the rows end at different x
    const xs = (row: string[]) => row.map((id) => PLAN.start[id]!.position[0]);
    expect(Math.min(...xs(row1))).not.toBeCloseTo(Math.min(...xs(row2)), 2);
  });

  it("⭐ *in front, just outside the demo cube*, all on the floor: the longest piece's far end outside the cube, the line on the floor", () => {
    const front = PLAN.volume.min[2];
    const floor = body("Floor");
    for (const id of ids) {
      const s = PLAN.start[id]!;
      const { half } = extents(id, q(s));
      expect(s.position[2] + half[2]).toBeLessThan(front); // outside the cube, on the boot camera's side
      expect(Math.abs(s.position[0]) + half[0]).toBeLessThanOrEqual(floor.dims[0] / 2);
      expect(Math.abs(s.position[2]) + half[2]).toBeLessThanOrEqual(floor.dims[2] / 2);
    }
    // ⭐ row 1's line sits half a gutter in from the floor's edge (the most room for the rows to interlock)
    expect(PLAN.stage.min[2]).toBeCloseTo(-floor.dims[2] / 2, 9);
    expect(NEAR_LINE).toBeCloseTo(-floor.dims[2] / 2 + DEMO_DEFAULTS.gridGap / 2, 5);
    // ⭐ `D176`: two rows fit in the cube's own width (one rank took 18.25 units)
    expect(PLAN.stage.max[0] - PLAN.stage.min[0]).toBeLessThanOrEqual(PLAN.volume.max[0] - PLAN.volume.min[0] + 1e-9);
    expect(PLAN.stage.max[2]).toBeLessThan(front);
  });

  it("⭐ no two pieces on the grid closer than the gutter (`gridGap`, 1 cm)", () => {
    for (const a of ids)
      for (const b of ids) {
        if (a >= b) continue;
        const A = PLAN.start[a]!, B = PLAN.start[b]!;
        const ha = extents(a, q(A)).half, hb = extents(b, q(B)).half;
        const gx = Math.abs(A.position[0] - B.position[0]) - ha[0] - hb[0];
        const gz = Math.abs(A.position[2] - B.position[2]) - ha[2] - hb[2];
        expect(Math.max(gx, gz)).toBeGreaterThanOrEqual(DEMO_DEFAULTS.gridGap - 1e-5);
      }
  });

  it("⭐ *do not show any grid*: the demo scene carries exactly Scene_1's bodies — no grid mesh, no marker", () => {
    expect(withDemoPlan(SHELL, PLAN).bodies.map((b) => b.id)).toEqual(SCENE_1.bodies.map((b) => b.id));
  });

  it("⭐ `flatOrientations`: the four half-turns that lay a box flat, nearest the final pose first", () => {
    const f = flatOrientations([0.13, 4.83, 0.33]); // a 4.8-unit black bar, standing
    expect(f).toHaveLength(4);
    for (const o of f) {
      expect(Math.abs(qRotate(o, [0, 1, 0])[2])).toBeCloseTo(1, 8); // `D175`: its length along z
      expect(Math.abs(qRotate(o, [1, 0, 0])[1])).toBeCloseTo(1, 8); // its thinnest side vertical
    }
    expect(flatOrientations([1, 0.3, 2])[0]).toEqual([1, 0, 0, 0]); // already flat and lengthwise: no turn at all
    expect(qAngle(flatOrientations([2, 0.3, 1])[0]!)).toBeCloseTo(Math.PI / 2, 8); // flat across: a quarter-turn
  });
});

describe("⭐⭐⭐ `D174` — *once lifted, each part reaches a position which blends into the current build*", () => {
  it("⭐ LIFT: straight up off its cell; the ALIGN then turns it from FLAT to its final orientation", () => {
    for (const id of ids) {
      const [lift, carry, align] = PLAN.moves.filter((m) => m.body === id);
      expect(lift!.from).toEqual(PLAN.start[id]);
      const d = sub([...lift!.to.position], [...lift!.from.position]);
      expect([Math.abs(d[0]) + Math.abs(d[2]) < 1e-9, d[1] > 0]).toEqual([true, true]);
      expect(carry!.to).toEqual(align!.from);
      expect(align!.from.orientation).toEqual(PLAN.start[id]!.orientation);
    }
  });

  it("⭐⭐ it BLENDS INTO THE BUILD: every SNAP seats it against a Pioneer already in place — never onto a gap", () => {
    const inPlace = new Set(SCENE_1.bodies.filter((b) => !b.frozen && !PLAN.start[b.id]).map((b) => b.id));
    expect(inPlace.size).toBe(11);
    for (const m of PLAN.moves.filter((x) => x.kind === "SNAP")) {
      expect(inPlace.has(m.pioneer!)).toBe(true);
      inPlace.add(m.body);
    }
    expect(inPlace.size).toBe(41);
  });

  it("⭐ the build's own moves stay in the CUBE; only the lift and the carry reach over the grid", () => {
    const sched = demoSchedule(PLAN.moves);
    const v = PLAN.volume;
    PLAN.moves.forEach((m, i) => {
      if (m.kind === "LIFT" || m.kind === "TRANSLATE") return;
      for (let k = 0; k <= 30; k++) {
        const p = demoPosesAt(PLAN, sched[i]!.t0 + ((sched[i]!.t1 - sched[i]!.t0) * k) / 30).get(m.body)!;
        const { half } = extents(m.body, p.orientation);
        for (let j = 0; j < 3; j++) {
          // ⚠ `extents` bounds a TURNED box by its axis-aligned hull, so this is a stricter test than the corners
          expect(p.position[j]! - half[j]!).toBeGreaterThanOrEqual(v.min[j]! - 1e-6);
          expect(p.position[j]! + half[j]!).toBeLessThanOrEqual(v.max[j]! + 1e-6);
        }
      }
    });
    const r = demoReach(PLAN);
    // ⭐ the reach is the hull of the two: the cube, extended toward the camera over the grid
    const s = PLAN.stage;
    expect(r).toEqual({
      min: [Math.min(s.min[0], v.min[0]), v.min[1], Math.min(s.min[2], v.min[2])],
      max: [Math.max(s.max[0], v.max[0]), v.max[1], Math.max(s.max[2], v.max[2])],
    });
    expect(r.min[2]).toBe(s.min[2]); // it reaches out over the grid
    expect(r.max[2]).toBe(v.max[2]);
  });

  it("⭐ a carry OVER the build is up, across, down: level across from above the cell, then straight down (`D175`: then a step in)", () => {
    const over = PLAN.moves.filter((m) => m.kind === "TRANSLATE" && m.via);
    expect(over.length).toBeGreaterThan(0);
    for (const m of over) {
      const c = m.via![0]!;
      expect(c[1]).toBeCloseTo(m.from.position[1], 9); // across at the lift's height
      const down = m.via!.length === 1 ? m.to.position : m.via![1]!;
      expect([c[0] - down[0], c[2] - down[2]].map((x) => Math.abs(x) < 1e-9)).toEqual([true, true]); // straight down
      expect(c[1]).toBeGreaterThan(down[1]);
      if (m.via!.length === 2) expect(Math.abs(m.via![1]![1] - m.to.position[1])).toBeLessThan(1e-9); // a level step in
      expect(m.via!.length).toBeLessThanOrEqual(2);
    }
  });
});

describe("⭐⭐ `D174` — the playback: a path's corners, and a start view that holds the grid", () => {
  it("⭐ `alongPath`: a point at a fraction of the path's LENGTH, through its corners", () => {
    const pts = [[0, 0, 0], [0, 3, 0], [4, 3, 0]];
    expect(alongPath(pts, 0)).toEqual([0, 0, 0]);
    expect(alongPath(pts, 3 / 7)).toEqual([0, 3, 0]);
    expect(alongPath(pts, 0.5)).toEqual([0.5, 3, 0]);
    expect(alongPath(pts, 1)).toEqual([4, 3, 0]);
    expect(alongPath([[1, 2, 3], [4, 6, 3]], 0.5)).toEqual([2.5, 4, 3]); // one leg: the old lerp
  });

  it("⭐ a carry over the build passes THROUGH its corner in the playback", () => {
    const sched = demoSchedule(PLAN.moves);
    const i = PLAN.moves.findIndex((m) => m.via);
    const m = PLAN.moves[i]!;
    let best = Infinity;
    for (let k = 0; k <= 2000; k++) {
      const p = demoPosesAt(PLAN, sched[i]!.t0 + ((sched[i]!.t1 - sched[i]!.t0) * k) / 2000).get(m.body)!;
      best = Math.min(best, Math.hypot(...sub(p.position, [...m.via![0]!] as unknown as Vec3)));
    }
    expect(best).toBeLessThan(0.02);
  });

  it("⭐⭐ the start distance holds the cube AND the grid: every point in view, 1 % closer one is not", () => {
    const pts = demoFramePointsM(PLAN, SCENE_1.unitM!);
    expect(pts).toHaveLength(16);
    for (const [toCam, aspect, gridDecides] of [
      [normalize([0, 0.15, -1])!, 0.68, true], // ⭐ portrait: the grid's width decides
      [normalize([0, 0.15, -1])!, 1.6, true], // landscape too: the grid lies nearer the camera than the cube
    ] as [Vec3, number, boolean][]) {
      const d = fitPointsDistanceM(pts, toCam, 0.8, aspect);
      const eye = (k: number): Vec3 => [toCam[0] * d * k, toCam[1] * d * k, toCam[2] * d * k];
      const inView = (k: number) =>
        pts.every((p) => {
          const fwd = normalize(sub([0, 0, 0], eye(k)))!;
          const right = normalize(cross([0, 1, 0], fwd))!;
          const up = cross(fwd, right);
          const v = sub(p, eye(k));
          const z = dot(v, fwd);
          return Math.abs(dot(v, right)) <= Math.tan(0.4) * aspect * z + 1e-9 && Math.abs(dot(v, up)) <= Math.tan(0.4) * z + 1e-9;
        });
      expect([inView(1), inView(0.99)]).toEqual([true, false]);
      const alone = fitPointsDistanceM(demoFramePointsM({ volume: PLAN.volume }, SCENE_1.unitM!), toCam, 0.8, aspect);
      if (gridDecides) expect(d).toBeGreaterThan(alone + 1e-6);
      else expect(d).toBeCloseTo(alone, 9);
    }
    // ⭐ a plan without a grid frames the cube alone: its eight corners — at a level view `half / tan(fov / 2) + half`
    const eight = demoFramePointsM({ volume: PLAN.volume }, 1);
    expect(eight).toHaveLength(8);
    expect(fitPointsDistanceM(eight, [0, 0, -1], 0.8, 1)).toBeCloseTo(5 / Math.tan(0.4) + 5, 9);
  });
});
