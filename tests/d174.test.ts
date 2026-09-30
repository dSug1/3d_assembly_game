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
 * > *"randomly roll the parts when they are laid on the floor at start by up to 1.5 degrees … Also, randomly misalign the
 * > face facing camera by up to 1 pixel negative or positive in depth axis"* — *"I was meaning yaw, not roll"* (`D177`).
 * > *"random between 5 to 10 degrees negative or positive yaw, random between 5 to 10% of longest dimension of each part
 * > negative or positive for part misalignment on depth for the row alignments"* (`D178`).
 * > *"random between 0 to 4 degrees negative or positive yaw absolute value median 2.5 degrees, random between 0 to 5 % of
 * > longest dimension … absolute value median 3%"* (`D179`).
 *
 * ⭐ Asserted on the COMMITTED plan, read back from its poses — never from the generator's own bookkeeping.
 */
import { describe, expect, it } from "vitest";
import { SCENE_1, SCENE_1_PALETTE } from "../src/content/scene_1";
import { SCENE1_DEMO as SHELL, SCENE1_DEMO_OPTIONS } from "../src/content/scene1_demo";
import { SCENE1_DEMO_PLAN as PLAN } from "../src/content/scene1_demo_plan";
import { DEMO_DEFAULTS, demoGrid, demoReach, flatOrientations, naturalOf, sizeWithMedian, withDemoPlan, type DemoPose } from "@core/demo_plan";
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
const OPT = { ...DEMO_DEFAULTS, ...SCENE1_DEMO_OPTIONS };
/** ⭐ `D176`–`D178`: the grid the plan was laid from — its rows, lines and final shifts. The start poses are checked
 * against it below, so what is asserted of it is asserted of the plan. */
const GRID = demoGrid(SCENE_1, ids, PLAN.volume, OPT);
/** ⭐ A piece's long axis in the world, at its start (`D175`: along depth, turned by its yaw). */
const longAxis = (id: string): Vec3 => {
  const d = contourDims(body(id));
  const i = [0, 1, 2].sort((a, b) => d[b]! - d[a]! || a - b)[0]!;
  return qRotate(q(PLAN.start[id]!), [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]);
};
const lengthOf = (id: string) => Math.max(...contourDims(body(id)));
/** ⭐ The depth of a piece's END FACES' centres — the near one faces the boot camera. */
const nearEnd = (id: string) => PLAN.start[id]!.position[2] - (lengthOf(id) / 2) * Math.abs(longAxis(id)[2]);
const farEnd = (id: string) => PLAN.start[id]!.position[2] + (lengthOf(id) / 2) * Math.abs(longAxis(id)[2]);
/** ⭐ A piece's yaw at its start, degrees, signed (0 = its length along depth). */
const yawDeg = (id: string) => {
  const a = longAxis(id);
  const t = Math.atan2(a[0], a[2]);
  const w = t > Math.PI / 2 ? t - Math.PI : t < -Math.PI / 2 ? t + Math.PI : t;
  return (w * 180) / Math.PI;
};
const row1 = [...GRID.rows[0]];
const row2 = [...GRID.rows[1]];
const FLOOR_TOP = 0;

describe("⭐⭐⭐ `D174` — the start configuration: every moved piece FLAT on the floor, on a grid", () => {
  it("⭐ only the 30 the plan moves; the other 11 stay in the painting", () => {
    expect(ids).toHaveLength(30);
    for (const b of withDemoPlan(SHELL, PLAN).bodies)
      if (!b.frozen && !PLAN.start[b.id]) expect(b.position).toEqual(final.get(b.id));
  });

  it("⭐ the plan's start poses ARE the grid's — so what follows of the grid holds of the plan", () => {
    for (const id of ids) expect(PLAN.start[id]!.position.every((v, k) => Math.abs(v - GRID.rest.get(id)![k]!) < 1e-5)).toBe(true);
    for (const k of ["min", "max"] as const) for (let j = 0; j < 3; j++) expect(GRID.stage[k][j]!).toBeCloseTo(PLAN.stage[k][j]!, 5);
  });

  it("⭐⭐ *aligned with the floor*: the smallest side vertical, the longest along DEPTH (`D175`) within the yaw, resting ON it", () => {
    for (const id of ids) {
      const s = PLAN.start[id]!;
      const { half } = extents(id, q(s));
      const d = [...contourDims(body(id))].sort((a, b) => b - a);
      expect(half[1]).toBeCloseTo(d[2]! / 2, 5); // smallest EXACTLY vertical — flat, not rolled (`D177`: yaw only)
      expect(Math.abs(longAxis(id)[2])).toBeGreaterThanOrEqual(Math.cos((OPT.startYawDeg.max * Math.PI) / 180) - 1e-6);
      expect(Math.abs(longAxis(id)[1])).toBeLessThan(1e-5); // the long axis level
      expect(s.position[1] - half[1]).toBeCloseTo(FLOOR_TOP, 5); // on the floor, not above it and not in it
    }
  });

  it("⭐⭐ `D179` — *random between 0 to 4 degrees negative or positive yaw*, median 2.5°: every piece, both ways", () => {
    const y = ids.map(yawDeg);
    for (const a of y) expect(Math.abs(a)).toBeLessThanOrEqual(OPT.startYawDeg.max + 1e-3);
    expect(y.some((a) => a > 0) && y.some((a) => a < 0)).toBe(true);
    // ⭐ the sample's median sits near the law's (30 draws: within a degree)
    const sorted = y.map(Math.abs).sort((a, b) => a - b);
    expect(Math.abs((sorted[14]! + sorted[15]!) / 2 - OPT.startYawDeg.median)).toBeLessThan(1);
    // ⭐ the yaw is the drawn one, sign and all — `naturalOf` from the seed and the piece
    for (const id of ids) expect(yawDeg(id)).toBeCloseTo((naturalOf(SCENE_1, id, OPT).yaw * 180) / Math.PI, 3);
  });

  it("⭐⭐ `D179` — *random between 0 to 5 % of longest dimension … negative or positive*, median 3 %, off the row's line in depth", () => {
    const off: number[] = [];
    for (const id of row1) off.push((nearEnd(id) - GRID.lines[0]) / lengthOf(id));
    for (const id of row2) off.push((farEnd(id) - GRID.lines[1]) / lengthOf(id));
    for (const o of off) expect(Math.abs(o)).toBeLessThanOrEqual(OPT.startShiftFrac.max + 1e-5);
    expect(off.some((o) => o > 0) && off.some((o) => o < 0)).toBe(true);
    // ⭐ the size is the drawn one; ⚠ the SIGN may be flipped to keep a piece on the floor and out of the cube
    for (const id of ids) expect(Math.abs(GRID.shift.get(id)!)).toBeCloseTo(Math.abs(naturalOf(SCENE_1, id, OPT).shift), 9);
    const flipped = ids.filter((id) => Math.sign(GRID.shift.get(id)!) !== Math.sign(naturalOf(SCENE_1, id, OPT).shift));
    expect(flipped.length).toBeLessThanOrEqual(3); // seed 1: ONE, the 4.83-unit bar — the longer piece in a conflict flips first
  });

  it("⭐ `sizeWithMedian`: 0 at u = 0, the max at 1, EXACTLY the median at ½, rising between; a median outside (0, max) throws", () => {
    for (const law of [OPT.startYawDeg, OPT.startShiftFrac]) {
      expect(sizeWithMedian(law, 0)).toBe(0);
      expect(sizeWithMedian(law, 1)).toBeCloseTo(law.max, 12);
      expect(sizeWithMedian(law, 0.5)).toBeCloseTo(law.median, 12);
      for (let u = 0.05; u < 1; u += 0.05) expect(sizeWithMedian(law, u + 0.01)).toBeGreaterThan(sizeWithMedian(law, u));
      // ⭐ and over many draws, half fall below the median
      let below = 0;
      for (let k = 0; k < 1000; k++) if (sizeWithMedian(law, (k + 0.5) / 1000) < law.median) below++;
      expect(below).toBe(500);
    }
    expect(() => sizeWithMedian({ max: 4, median: 4 }, 0.5)).toThrow(/median < max/);
    expect(() => sizeWithMedian({ max: 4, median: 0 }, 0.5)).toThrow(/0 < median/);
  });

  it("⭐⭐ *ordered by color and inside the color groups by descending size* — in reading order as the boot camera sees it", () => {
    // ⭐ `D176`: row 1 left to right, then row 2 RIGHT TO LEFT — the order snakes back
    const x = (id: string) => PLAN.start[id]!.position[0];
    const read = [...[...row1].sort((a, b) => x(a) - x(b)), ...[...row2].sort((a, b) => x(b) - x(a))];
    expect([...row1, ...row2]).toEqual(read);
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

  it("⭐ on a virtual GRID: each piece at the middle of a whole number of 5 mm cells across, its turned footprint and gutter included", () => {
    const p = DEMO_DEFAULTS.gridPitch;
    for (const id of ids) {
      const d = [...contourDims(body(id))].sort((a, b) => b - a);
      const y = naturalOf(SCENE_1, id, OPT).yaw;
      const cells = Math.ceil((d[1]! * Math.cos(y) + d[0]! * Math.abs(Math.sin(y)) + DEMO_DEFAULTS.gridGap) / p - 1e-9);
      const edge = PLAN.start[id]!.position[0] - (cells * p) / 2;
      expect(Math.abs(edge / p - Math.round(edge / p))).toBeLessThan(1e-6);
    }
  });

  it("⭐⭐ `D176` — TWO ROWS, the alignment reversed on the second: row 1's NEAR faces on one line, row 2's FAR faces on another", () => {
    expect(row1.length).toBeGreaterThan(1);
    expect(row2.length).toBeGreaterThan(1);
    expect(row1.length + row2.length).toBe(ids.length);
    // `D175`'s *aligned on x* — each face on its row's line but for its own `D178` shift
    for (const id of row1) expect(nearEnd(id) - GRID.shift.get(id)!).toBeCloseTo(GRID.lines[0], 5);
    for (const id of row2) expect(farEnd(id) - GRID.shift.get(id)!).toBeCloseTo(GRID.lines[1], 5);
    expect(GRID.lines[1]).toBeLessThanOrEqual(PLAN.volume.min[2] - DEMO_DEFAULTS.gridOffset + 1e-9); // outside the cube
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

  it("⭐ *in front, just outside the demo cube*, all on the floor: every corner outside the cube and on the floor", () => {
    const front = PLAN.volume.min[2];
    const floor = body("Floor");
    for (const id of ids) {
      const s = PLAN.start[id]!;
      const { half } = extents(id, q(s));
      expect(s.position[2] + half[2]).toBeLessThan(front); // outside the cube, on the boot camera's side
      expect(Math.abs(s.position[0]) + half[0]).toBeLessThanOrEqual(floor.dims[0] / 2);
      expect(Math.abs(s.position[2]) + half[2]).toBeLessThanOrEqual(floor.dims[2] / 2 - DEMO_DEFAULTS.gridGap / 2 + 1e-5);
    }
    // ⭐ `D176`: two rows — far narrower than `D175`'s one rank (18.25 units), on the floor
    expect(PLAN.stage.max[0] - PLAN.stage.min[0]).toBeLessThan(15);
    expect(Math.max(-PLAN.stage.min[0], PLAN.stage.max[0])).toBeLessThanOrEqual(floor.dims[0] / 2);
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
