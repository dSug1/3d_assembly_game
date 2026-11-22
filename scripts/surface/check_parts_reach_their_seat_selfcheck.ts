// CAN EVERY PART REACH ITS SEAT? (check_parts_reach_their_seat.ts; SCENE_WORKFLOW.md §8) — the check's SELF-CHECKS (first written as package S0):
// known answers on boxes and a slanted hull, the contact at the seat, the tunnelling case, and the
// study's own answers (ORBIT_SURFACE_SHAPES.md §3.3: L05 0.8 % and +y, +z exactly; L03 +y alone; Q07 EMPTY) computed by the STUDY's code
// (`goalCheck`, the box-only implementation) and by this one. Every check returns its expected and measured figures; the run exits 1 on a failure.
import { ENTRY_SPHERE_N, goalCheck } from "../probes/surface_study/checks";
import { buildCtx } from "../probes/surface_study/readings";
import { LIBRARY } from "../probes/surface_study/shapes";
import { gapBetween } from "../../src/core/collision_shape";
import { type Piece, type V, entrySet, makePiece, mouthAlong } from "./check_parts_reach_their_seat_geom";

const AXES: { label: string; d: V }[] = [
  { label: "+x", d: [1, 0, 0] }, { label: "-x", d: [-1, 0, 0] }, { label: "+y", d: [0, 1, 0] },
  { label: "-y", d: [0, -1, 0] }, { label: "+z", d: [0, 0, 1] }, { label: "-z", d: [0, 0, -1] },
];
const box = (owner: string, lo: V, hi: V): Piece => {
  const pts: V[] = [];
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) pts.push([x, y, z]);
  return makePiece(owner, "box", pts);
};
const freeAxes = (r: ReturnType<typeof entrySet>) => r.exact.filter((e) => e.free).map((e) => e.label).sort().join(" ");

export interface SelfLine { name: string; expected: string; got: string; ok: boolean }

export function selfChecks(skin = 0.3): SelfLine[] {
  const out: SelfLine[] = [];
  const check = (name: string, expected: string, got: string) => out.push({ name, expected, got, ok: expected === got });

  // K1 — a part RESTING on an open plate: the free half of the sphere (the golden spiral has exactly half its samples above y = 0); it may slide
  // along the plate (±x, ±z) and leave it (+y), never push into it (−y)
  const plate = box("plate", [-500, -20, -500], [500, 0, 500]);
  const k1 = entrySet([box("cube", [-50, 0, -50], [50, 100, 50])], [plate], AXES, skin, ENTRY_SPHERE_N);
  check("K1 resting on a plate: share, free axes", "50.0 % | +x +y +z -x -z", `${k1.sharePct.toFixed(1)} % | ${freeAxes(k1)}`);
  // its pre-insertion pose: up, nothing beside it is ahead (0 mm); along +x it slides until it is off the plate (500 + 50 = 550 mm)
  const cube = [box("cube", [-50, 0, -50], [50, 100, 50])];
  check("K1 pre-insertion along +y, +x (mm)", "0.0 | 550.0", `${mouthAlong(cube, [plate], [0, 1, 0], 10, gapBetween).mm.toFixed(1)} | ${mouthAlong(cube, [plate], [1, 0, 0], 10, gapBetween).mm.toFixed(1)}`);

  // K2 — a block in a ZERO-clearance channel along z (walls touching on both sides, the floor under it), open at both ends and on top: the set is
  // the half-circle {d_x = 0, d_y ≥ 0} — of zero measure: no sample, the exact +y, +z, −z
  const walls = (gap: number) => [box("wallL", [-100, 0, -200], [-30 + gap, 60, 200]), box("wallR", [30 - gap, 0, -200], [100, 60, 200]), box("floor", [-100, -20, -200], [100, 0, 200])];
  const blk = [box("blk", [-30, 0, -40], [30, 50, 40])];
  // (at a vanishing skin; at the game's skin a sample may lean into a wall by up to the skin before it is out: K2b — every such sample within
  // asin(skin / 10 mm) of the plane x = 0, 10 mm being the shortest way out, upward past the walls' top)
  const k2 = entrySet(blk, walls(0), AXES, 1e-4, ENTRY_SPHERE_N);
  check("K2 zero-clearance channel (skin 1e-4 mm): share, free axes", "0.0 % | +y +z -z", `${k2.sharePct.toFixed(1)} % | ${freeAxes(k2)}`);
  const k2b = entrySet(blk, walls(0), AXES, skin, ENTRY_SPHERE_N);
  const lean = Math.max(0, ...k2b.regions.map((g) => (Math.asin(Math.abs(g.centre[0])) * 180) / Math.PI));
  check("K2b the same at the skin: free axes, every free region's centre within the skin's lean of x = 0", `+y +z -z | yes`, `${freeAxes(k2b)} | ${lean <= (Math.asin(skin / 10) * 180) / Math.PI + 1e-9 ? "yes" : `no (${lean.toFixed(2)}°)`}`);
  // K3 — the same with the walls overlapping the block by half the skin (within the tolerance), then by twice it (an authored interference: the
  // game's rule lets a pair already deeper only get shallower — so the same directions, and the overlap REPORTED)
  const k3a = entrySet(blk, walls(skin / 2), AXES, skin, ENTRY_SPHERE_N);
  check("K3a overlap 0.5 skin: free axes, overlaps reported", "+y +z -z | 0", `${freeAxes(k3a)} | ${k3a.seatOverlaps.length}`);
  const k3b = entrySet(blk, walls(2 * skin), AXES, skin, ENTRY_SPHERE_N);
  check("K3b overlap 2 skin: free axes, overlaps reported", "+y +z -z | 2", `${freeAxes(k3b)} | ${k3b.seatOverlaps.length}`);

  // K4 — EXACTNESS: a TILE 0.5 mm thick withdrawn up past a slab 0.5 mm thick 2 m above it (together 1 mm of overlap along the way: a time-stepped
  // sweep with a step over about 1 mm jumps it); then the slab moved aside so the tile passes it with 0.1 mm to spare
  const tile = [box("tile", [-50, 0, -50], [50, 0.5, 50])];
  const k4a = entrySet(tile, [plate, box("slab", [-300, 2101.3, -300], [300, 2101.8, 300])], AXES, skin, ENTRY_SPHERE_N);
  check("K4a thin slab 2 m above a thin tile: +y", "blocked", k4a.exact.find((e) => e.label === "+y")!.free ? "free" : "blocked");
  const k4b = entrySet(tile, [plate, box("slab", [50.1, 2101.3, -300], [600, 2101.8, 300])], AXES, skin, ENTRY_SPHERE_N);
  check("K4b slab 0.1 mm aside: +y", "free", k4b.exact.find((e) => e.label === "+y")!.free ? "free" : "blocked");

  // K5 — a SLANTED hull: a 30° ramp (a triangular prism) and a box lying on its slope. Free: the side of the slope's plane the box is on (about
  // half the sphere), the slope's normal; blocked: into the ramp
  const s = Math.sin(Math.PI / 6), c = Math.cos(Math.PI / 6);
  const ramp = makePiece("ramp", "prism", [[-400, 0, -200], [400, 0, -200], [400, 800 * s / c, -200], [-400, 0, 200], [400, 0, 200], [400, 800 * s / c, 200]].map((p) => p as V));
  // the ramp's slope: through (−400, 0), rising toward +x at 30°; its outward normal (−s, c, 0)
  const nS: V = [-s, c, 0], tS: V = [c, s, 0];
  const at = (u: number, v: number, w: number, z: number): V => [-400 + tS[0] * u + nS[0] * v, tS[1] * u + nS[1] * v, z + w];
  const onSlope: V[] = [];
  for (const u of [300, 400]) for (const v of [0, 60]) for (const z of [-50, 50]) onSlope.push(at(u, v, 0, z));
  const k5 = entrySet([makePiece("tile", "box", onSlope)], [ramp], [{ label: "n", d: nS }, { label: "-n", d: [s, -c, 0] }, { label: "t", d: tS }, { label: "-t", d: [-c, -s, 0] }], skin, ENTRY_SPHERE_N);
  const k5share = k5.sharePct;
  check("K5 on a 30° slope: share in 45–55 %, free n t -t, blocked -n", "yes | -t n t", `${k5share >= 45 && k5share <= 55 ? "yes" : `no (${k5share.toFixed(1)})`} | ${k5.exact.filter((e) => e.free).map((e) => e.label).sort().join(" ")}`);

  // the STUDY's shapes: its own code (box-only, `goalCheck`) and this one, on the same samples
  for (const key of ["L05", "L03", "Q07", "L19"]) {
    const sh = LIBRARY().find((x) => x.name.startsWith(key));
    if (!sh || !sh.goal) throw new Error(`the study has no ${key} with a goal`);
    const parts = sh.parts.some((p) => p.id === sh.goal!.part.id) ? sh.parts : [...sh.parts, sh.goal.part];
    const study = goalCheck(buildCtx(parts), sh.goal).entrySet;
    const placed = parts.filter((p) => p.id !== sh.goal!.part.id).map((p) => makePiece(p.id, "part", p.verts));
    const mine = entrySet([makePiece(sh.goal.part.id, "goal", sh.goal.part.verts)], placed, AXES, skin, ENTRY_SPHERE_N);
    const st = `${study.freeShare.toFixed(1)} % | ${study.freeAxes.map((a) => a.dir).sort().join(" ") || "-"}${study.empty ? " | EMPTY" : ""}`;
    const me = `${(Math.round(mine.sharePct * 10) / 10).toFixed(1)} % | ${freeAxes(mine) || "-"}${mine.freeSamples === 0 && mine.exact.every((e) => !e.free) ? " | EMPTY" : ""}`;
    check(`${key} the study's answer = this code's`, st, me);
    // L03's peg (y 200 – 260) in its 40-deep pocket (top 240): withdrawn along +y it is beyond the block after 40 mm — the mouth
    if (key === "L03") check("L03 pre-insertion along +y (mm)", "40.0", mouthAlong([makePiece(sh.goal.part.id, "goal", sh.goal.part.verts)], placed, [0, 1, 0], 10, gapBetween).mm.toFixed(1));
  }
  return out;
}
