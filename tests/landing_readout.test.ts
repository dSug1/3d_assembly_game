/**
 * ⭐⭐⭐ THE READOUT (package S2, `ORBIT_SURFACE_READOUT.md` §7) — its pure part's vectors: V1 `prepareLanding` IS the map's evaluation, V2 `readoutAt`'s
 * sign and size (with `landingAxes`, `heldPiece` — the facet's direction in the world, the held piece as held), V3 `readoutKey`. Each was shown RED on
 * its mutant of `src/core/landing_map.ts` before it was trusted (the list and the red lines: the design document §13). V4 (the switch) is
 * `landing_readout_switch.test.ts`.
 */
import { describe, expect, it } from "vitest";
import { buildLandingMap, heldPiece, landingAxes, prepareLanding, readoutAt, readoutKey, type Landing, type ReadoutKeyOf, type Turn } from "../src/core/landing_map";
import { LANDING_STEP_MM } from "../src/core/units";
import { qFromAxisAngle, qmul, qRotate, type Quat, type Vec3 } from "../src/core/vec";
import { PIECES, TOP_F, boxHeld, bx, frameOf, library, placesOf, toConvex, type Part } from "./helpers/surface_shapes";

const M = 0.001;
/** two landings the same BIT FOR BIT: the kind, the depth (`Object.is`: −0 too), the part */
const same = (a: Landing, b: Landing): boolean =>
  a.kind === b.kind && (a.kind !== "land" || (b.kind === "land" && Object.is(a.depth, b.depth) && a.part === b.part)) && (a.kind !== "inside" || (b.kind === "inside" && a.part === b.part));

describe("⭐⭐⭐ V1 — `prepareLanding` (no grid) IS the landing map's evaluation, bit for bit", () => {
  it("the library L01 – Q10, every studied facet, pieces A and B: at every sample of the grid and every place of the travels; the same pieces refused", () => {
    let places = 0, bad = 0, land = 0, nothing = 0;
    const firstBad: string[] = [];
    for (const sh of library()) {
      if (sh.parts.length === 0) continue;
      const placed = toConvex(sh.parts);
      for (const st of sh.studies) {
        const pls = st.lines.flatMap((ln) => placesOf(st, ln, 7));
        const Ls = pls.map((p) => p[0]), Ss = pls.map((p) => p[1]);
        const frame = frameOf(st, Math.min(...Ls), Math.max(...Ls), Math.min(...Ss), Math.max(...Ss));
        for (const pk of ["A", "B"]) {
          const held = [boxHeld(PIECES[pk]!, st)];
          const map = buildLandingMap(placed, held, frame, 16);
          const prep = prepareLanding(placed, held, { origin: frame.origin, u: frame.u, v: frame.v, n: frame.n });
          expect(prep.refused).toEqual(map.refused);
          const check = (a: Landing, b: Landing, where: string) => {
            places++;
            if (a.kind === "land") land++;
            if (a.kind === "nothing") nothing++;
            if (!same(a, b)) {
              bad++;
              if (firstBad.length < 3) firstBad.push(`${sh.name} ${pk} ${where}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
            }
          };
          // ⭐ the grid's samples come from its OWN loop over the sums (`gather`): an independent path to the same numbers
          for (let i = 0; i < map.nu; i++) for (let j = 0; j < map.nv; j++) check(prep.landingAt(map.uAt(i), map.vAt(j)), map.landingSample(i, j), `sample (${i}, ${j})`);
          for (const [L, s] of pls) check(prep.landingAt(L * M, s * M), map.landingAt(L * M, s * M), `(${L}, ${s})`);
        }
      }
    }
    expect(firstBad, `${bad} of ${places} differ`).toEqual([]);
    expect(places).toBeGreaterThan(20000);
    expect(land).toBeGreaterThan(10000); // not vacuous on either kind
    expect(nothing).toBeGreaterThan(500);
  });

  it("…and from a depth (P2's fifth point), with a held piece of TWO convex pieces (a body and a peg) over the step and the slot under a slab", () => {
    const body: Vec3[] = [], peg: Vec3[] = [];
    for (const x of [-20, 20]) for (const y of [0, 20]) for (const z of [-20, 20]) body.push([x * M, y * M, z * M]);
    for (const x of [-5, 5]) for (const y of [-30, 0]) for (const z of [30, 40]) peg.push([x * M, y * M, z * M]);
    let n = 0;
    for (const name of ["L12", "Q07", "L46", "L26"]) {
      const placed = toConvex(library().find((s) => s.name === name)!.parts);
      const frame = frameOf(TOP_F, -130, 130, -130, 130);
      const map = buildLandingMap(placed, [body, peg], frame, 8);
      const prep = prepareLanding(placed, [body, peg], frame);
      for (let i = 0; i < map.nu; i += 3) for (let j = 0; j < map.nv; j += 3)
        for (const from of [undefined, 0.33, 0.251, 0.2, 0.15]) {
          expect(same(prep.landingAt(map.uAt(i), map.vAt(j), from), map.landingSample(i, j, from)), `${name} (${i}, ${j}) from ${from}`).toBe(true);
          n++;
        }
    }
    expect(n).toBeGreaterThan(2000);
  });

  it("⭐ the step's one home: `units.ts` (re-exported by the map, one binding)", () => {
    expect(LANDING_STEP_MM).toBe(4);
  });
});

// ───────────── V2: a held piece TURNED (90° about x: 100 along x, 20 along z, 40 high), its reference its resting face's centre ─────────────
/** the piece's own points (its body frame, metres): 100 × 20 × 40 along its x, y, z — centred on its origin */
const LOCAL: Vec3[] = [];
for (const x of [-50, 50]) for (const y of [-10, 10]) for (const z of [-20, 20]) LOCAL.push([x * M, y * M, z * M]);
/** turned 90° about x: its y → z, its z → −y — so its +z face (centre (0, 0, 20) mm) faces DOWN: the resting face */
const Q_HELD: Quat = qFromAxisAngle([1, 0, 0], Math.PI / 2);
const RC: Vec3 = [0, 0, 20 * M];
/** the top facet: n = +y, t = x, b = z (the map's frame) */
const N: Vec3 = [0, 1, 0], T: Vec3 = [1, 0, 0], B: Vec3 = [0, 0, 1];
const plate = (): Part[] => [bx("plate", -200, 200, 0, 40, -200, 200)];

/** the readout of the held piece at (x, z) mm over `parts`, today's gizmo at height `todayMm`, the facet's plane at `planeMm` (the world's frame) */
function read(parts: Part[], x: number, z: number, todayMm: number, planeMm = 40) {
  const prep = prepareLanding(toConvex(parts), [heldPiece(LOCAL, Q_HELD, RC)], landingAxes(N, T, B, null));
  return readoutAt(prep, [x * M, planeMm * M, z * M], [x * M, todayMm * M, z * M]);
}
const mm = (x: number) => Math.round(x / M * 1e6) / 1e6 + 0;
const deltaMm = (r: ReturnType<typeof read>) => (r.kind === "land" ? mm(r.delta) : r.kind);

describe("⭐⭐⭐ V2 — `readoutAt`'s SIGN and SIZE (Δ = P2's level − today's, mm; + = P2 farther out)", () => {
  it("a piece on a plate: Δ 0 at its centre and anywhere on it — the part, the level, the point ON the plate", () => {
    for (const [x, z] of [[0, 0], [100, 0], [-120, 90]] as const) {
      const r = read(plate(), x, z, 40);
      expect(r.kind).toBe("land");
      expect(deltaMm(r), `(${x}, ${z})`).toBe(0);
      if (r.kind === "land") {
        expect(r.part).toBe("plate");
        expect(mm(r.level)).toBe(40);
        expect(r.point.map(mm)).toEqual([x, 40, z]);
      }
    }
  });
  it("within HALF A PIECE of a proud block (41 mm, as Piece44): Δ = the block's height — past half a piece, 0", () => {
    const parts = [...plate(), bx("block", 60, 200, 40, 81, -200, 200)];
    expect(deltaMm(read(parts, 11, 0, 40))).toBe(41); // 11 + 50 = 61 > 60: the piece's end over the block
    expect(deltaMm(read(parts, 59, 0, 40))).toBe(41);
    expect(deltaMm(read(parts, 9, 0, 40))).toBe(0); // 9 + 50 = 59 < 60: the plate
    const r = read(parts, 11, 0, 40);
    expect(r.kind === "land" && r.part).toBe("block");
    expect(r.point.map(mm)).toEqual([11, 81, 0]); // the place's two other coordinates kept, at P2's level
    // ⭐ the SIGN: today's gizmo ON the block (its top), P2 there too → 0; today's at the block's top beside it, P2 the plate → −41
    expect(deltaMm(read(parts, 100, 0, 81))).toBe(0);
    expect(deltaMm(read(parts, -100, 0, 81))).toBe(-41);
  });
  it("over a slot NARROWER than the piece (a 15 mm slot across its 20 mm): the RIMS' level — today's at the slot's floor reads Δ +20", () => {
    const parts = [bx("floor", -200, 200, 0, 20, -200, 200), bx("rimA", -200, 200, 20, 40, -200, -7.5), bx("rimB", -200, 200, 20, 40, 7.5, 200)];
    const r = read(parts, 0, 0, 20);
    expect(deltaMm(r)).toBe(20);
    expect(r.kind === "land" && mm(r.level)).toBe(40);
    expect(r.kind === "land" && r.part).toBe("rimA"); // a tie of the two rims: the smaller id
    // ⭐ and a slot WIDER than the piece (30 mm): its floor, Δ 0 against today's floor
    const wide = [bx("floor", -200, 200, 0, 20, -200, 200), bx("rimA", -200, 200, 20, 40, -200, -15), bx("rimB", -200, 200, 20, 40, 15, 200)];
    expect(deltaMm(read(wide, 0, 0, 20))).toBe(0);
  });
  it("over a hole RIGHT THROUGH, wider than the piece (120 × 40): NOTHING — no depth, the point on the facet's plane; the rim once the piece's end reaches it", () => {
    const parts = [bx("w", -200, -60, 0, 40, -200, 200), bx("e", 60, 200, 0, 40, -200, 200), bx("s", -60, 60, 0, 40, -200, -20), bx("n", -60, 60, 0, 40, 20, 200)];
    const r = read(parts, 0, 0, 40);
    expect(r).toEqual({ kind: "nothing", point: [0, 40 * M, 0] });
    expect("delta" in r).toBe(false);
    expect(read(parts, 9, 0, 40).kind).toBe("nothing"); // 9 + 50 = 59 < 60
    expect(deltaMm(read(parts, 11, 0, 40))).toBe(0); // 61 > 60: the rim, at the plate's level
  });
  it("⭐⭐ (his word 2026-11-23: *\"Keep as held\"* — `ORBIT_SURFACE_READOUT.md` §14) ON A SIDE FACET the piece AS HELD, never turned onto the facet: P2 stands half its size along the normal out — +50 mm along its 100 mm, +10 across its 20 mm", () => {
    const wall = [bx("wall", -200, 0, 0, 400, -200, 200)]; // its face at x = 0, facing +x
    const at = (q: Quat) => {
      const prep = prepareLanding(toConvex(wall), [heldPiece(LOCAL, q, RC)], landingAxes([1, 0, 0], [0, 0, -1], [0, 1, 0], null));
      return readoutAt(prep, [0, 200 * M, 0], [0, 200 * M, 0]);
    };
    const along = at(Q_HELD);
    expect(along.kind === "land" && along.part).toBe("wall");
    expect(deltaMm(along)).toBe(50); // its 100 mm length along the normal: the resting face (down) never turned toward the wall
    expect(deltaMm(at(qmul(qFromAxisAngle([0, 1, 0], Math.PI / 2), Q_HELD)))).toBe(10); // a quarter turn about the vertical: its 20 mm across
  });
  it("⭐ THE MAP'S FRAME (tilted or zoned): the whole scene turned by R, the facet in the map's frame turned by `landingAxes` — the same Δ, to 1e-12 m", () => {
    const qR = qFromAxisAngle([1, 2, 3], 0.7);
    const R: Turn = [0, 1, 2].map((i) => [0, 1, 2].map((j) => qRotate(qR, [j === 0 ? 1 : 0, j === 1 ? 1 : 0, j === 2 ? 1 : 0])[i]!)) as unknown as Turn;
    const turn = (p: Vec3): Vec3 => qRotate(qR, p);
    const parts = [...plate(), bx("block", 60, 200, 40, 81, -200, 200)];
    const placed = toConvex(parts).map((p) => ({ id: p.id, points: p.points.map(turn) }));
    const prep = prepareLanding(placed, [heldPiece(LOCAL, qmul(qR, Q_HELD), RC)], landingAxes(N, T, B, R));
    for (const [x, today, want] of [[0, 40, 0], [11, 40, 41], [9, 40, 0], [100, 81, 0]] as const) {
      const r = readoutAt(prep, turn([x * M, 40 * M, 0]), turn([x * M, today * M, 0]));
      expect(r.kind).toBe("land");
      if (r.kind === "land") expect(Math.abs(r.delta - want * M), `x ${x}`).toBeLessThan(1e-12);
    }
  });
});

describe("⭐⭐⭐ V3 — `readoutKey`: a turn of the piece, a seat, a frame change each change it; an unchanged frame does not", () => {
  const base: ReadoutKeyOf = { map: 3, frame: null, placed: "Piece1/Piece1|Piece44/Piece44", held: "green-box", shape: 1, orientation: [Math.SQRT1_2, Math.SQRT1_2, 0, 0], restingCentre: [0, 0, 0.02] };
  const key = readoutKey(base);
  it("the same inputs (rebuilt, new arrays) → the same key", () => {
    expect(readoutKey({ ...base, orientation: [Math.SQRT1_2, Math.SQRT1_2, 0, 0], placed: ["Piece1/Piece1", "Piece44/Piece44"].join("|") })).toBe(key);
    const R: Turn = [[0, 1, 0], [-1, 0, 0], [0, 0, 1]];
    expect(readoutKey({ ...base, frame: R })).toBe(readoutKey({ ...base, frame: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]] }));
  });
  it("a TURN of the piece — even 1e-9 rad — changes it", () => {
    expect(readoutKey({ ...base, orientation: qmul(qFromAxisAngle([0, 1, 0], 1e-9), base.orientation) })).not.toBe(key);
    expect(readoutKey({ ...base, orientation: qmul(qFromAxisAngle([0, 1, 0], Math.PI / 2), base.orientation) })).not.toBe(key);
  });
  it("a SEAT (the placed set, the face map rebuilt) changes it; a PICK-UP of another piece changes it", () => {
    expect(readoutKey({ ...base, placed: `${base.placed}|Piece45/Piece45` })).not.toBe(key);
    expect(readoutKey({ ...base, map: 4 })).not.toBe(key);
    expect(readoutKey({ ...base, held: "turquoise-piece" })).not.toBe(key);
  });
  it("⭐ (fix round 1, the audit) a CHANGE OF RESTING FACE with the SAME orientation (a tapped face whose turn was refused) changes it; a new shape changes it", () => {
    expect(readoutKey({ ...base, restingCentre: [0, 0, -0.02] })).not.toBe(key);
    expect(readoutKey({ ...base, restingCentre: [0, 0, 0.02] })).toBe(key); // rebuilt, the same point: the same key
    expect(readoutKey({ ...base, shape: 2 })).not.toBe(key);
  });
  it("a FRAME change (the tilt, a zone: the map's frame) changes it", () => {
    expect(readoutKey({ ...base, frame: [[1, 0, 0], [0, 0, -1], [0, 1, 0]] })).not.toBe(key);
    expect(readoutKey({ ...base, frame: [[1, 0, 0], [0, 0, -1], [0, 1, 0]] })).not.toBe(readoutKey({ ...base, frame: [[1, 0, 0], [0, 0, 1], [0, -1, 0]] }));
  });
});
