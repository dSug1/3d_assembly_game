// THE SURFACE STUDY — SELF-CHECKS: cases computed BY HAND (each in its comment) and asserted, so a wrong prototype cannot report silently. Run first by
// both runners; a failure throws and stops the run.
import { shellAnchor } from "../../../src/input/orbit_shell";
import { blockLess, boxPart, castRay, floodOutside, isOutside, prismLevels, prismZ, type V } from "./geom";
import { M, PIECE_A, PIECE_BAR, buildCtx, facetFor, propFar, todayAt, heldFoot, landing } from "./readings";
import { continuity, goalCheck } from "./checks";

let n = 0;
function eq(name: string, got: number | boolean | string | null, want: number | boolean | string | null, tol = 1e-6): void {
  n++;
  const ok = typeof want === "number" && typeof got === "number" ? Math.abs(got - want) <= tol : got === want;
  if (!ok) throw new Error(`SELF-CHECK ${name}: got ${got}, want ${want}`);
}
export function selfCheck(): number {
  const B = { lo: [-240, 0, -240] as V, hi: [240, 240, 240] as V };
  const vd = (x0: number, x1: number, z0: number, z1: number, d: number) => ({ lo: [x0, 240 - d, z0] as V, hi: [x1, 240, z1] as V });
  // 1. a ray straight down at (10, ·, 20) from y 1000 onto the block: hits the top, t = 1000 − 240 = 760, normal +y
  const blk = [boxPart("b", B.lo, B.hi)];
  const h = castRay(blk, [10, 1000, 20], [0, -1, 0]);
  eq("1 cast t", h!.t, 760); eq("1 cast n", h!.n[1], 1);
  // 2. a 50 x 50 slot 20 deep at the origin; piece A (41.3 x 45) centred on it: 41.3 < 50 and 45 < 50 → it fits; the first contact is the floor, 220
  const slot50 = buildCtx(blockLess(B, [vd(-25, 25, -25, 25, 20)]));
  const top50 = slot50.map!.facets[facetFor(slot50.map, [0, 1, 0])]!;
  eq("2 P2 fits the 50 slot", propFar(slot50, top50, 0, 0, PIECE_A).level, 220);
  // 3. a 40 x 40 slot: 41.3 > 40 — the piece rests on the rims: 240
  const slot40 = buildCtx(blockLess(B, [vd(-20, 20, -20, 20, 20)]));
  const top40 = slot40.map!.facets[facetFor(slot40.map, [0, 1, 0])]!;
  eq("3 P2 closed on the 40 slot", propFar(slot40, top40, 0, 0, PIECE_A).level, 240);
  // 4. a 100 x 100 hole right through: A clears both rims at the centre — nothing to land on (the facet's plane 240, marked)
  const hole = buildCtx(blockLess(B, [vd(-50, 50, -50, 50, 240)]));
  const topH = hole.map!.facets[facetFor(hole.map, [0, 1, 0])]!;
  const ph = propFar(hole, topH, 0, 0, PIECE_A);
  eq("4 nothing to land on", ph.nothing, true); eq("4 at the plane", ph.level, 240, 1e-6);
  // ... and 40 mm off centre (t 40): the footprint spans 40 ± 20.65 = 19.35 … 60.65, over the rim at 50 → touches the rim: 240, not nothing
  eq("4b the rim", propFar(hole, topH, 40, 0, PIECE_A).nothing, false);
  // 5. a pin 10 x 10 x 20 at the origin on the block: A centred 30 mm away along t spans 9.35 … 50.65 — clear of the pin (−5 … 5): 240;
  //    at 20 mm it spans −0.65 … 40.65 — over the pin: its top, 260
  const pin = buildCtx([...blk, boxPart("pin", [-5, 240, -5], [5, 260, 5])]);
  const topP = pin.map!.facets[facetFor(pin.map, [0, 1, 0])]!;
  eq("5 beside the pin", propFar(pin, topP, 30, 0, PIECE_A).level, 240);
  eq("5 over the pin", propFar(pin, topP, 20, 0, PIECE_A).level, 260);
  // 6. a ramp prism rising from y 240 at x 0 to 260 at x 100 (z ±50): the footprint x 40 … 81.3 — its highest point at x 81.3: 240 + 20 × 0.813 = 256.26
  const ramp = prismZ("r", [[0, 240], [100, 240], [100, 260]], -50, 50);
  const lv = prismLevels(ramp, [0, 1, 0], [1, 0, 0], [0, 0, 1], 60.65, 0, 20.65, 22.5);
  eq("6 ramp LP max", lv![1], 256.26, 1e-3);
  // 7. TODAY on the 50 slot, A's heldFoot [41.3, 45] mm: the void fits → inside → the cast lands on the floor: 220
  eq("7 today 50 slot", todayAt(slot50, top50, 0, 0, heldFoot(PIECE_A)).level, 220, 1e-6);
  // 8. TODAY on the 40 slot: 41.3 > 40 + 0.5 → bridged on the plane: 240
  eq("8 today 40 slot", todayAt(slot40, top40, 0, 0, heldFoot(PIECE_A)).level, 240, 1e-6);
  // 9. the bar 20 x 100 (20 tall): heldFoot is [20, 20] — TODAY it 'fits' a 25 x 60 slot (20 ≤ 25, 20 ≤ 60): the floor 210; P2 with the bar as held
  //    (100 along b) over a 60-long slot rests on the ends: 240
  const keyed = buildCtx(blockLess(B, [vd(-12.5, 12.5, -30, 30, 30)]));
  const topK = keyed.map!.facets[facetFor(keyed.map, [0, 1, 0])]!;
  eq("9 heldFoot of the bar", heldFoot(PIECE_BAR)[1] / M, 20);
  eq("9 today keyed", todayAt(keyed, topK, 0, 0, heldFoot(PIECE_BAR)).level, 210, 1e-6);
  eq("9 P2 keyed", propFar(keyed, topK, 0, 0, PIECE_BAR).level, 240);
  // 10. landing: A's bottom at 220 centred over the 40 slot (rims at 240 under the footprint's sides) enters the rims by 20 mm
  eq("10 enters by 20", landing(slot40, top40, 0, 0, PIECE_A, 220).enter, 20, 1e-6);
  // 11. the shell's foot (the real shellAnchor): over the top, u = +y, d 0.3 m: a gizmo at 220 or at 240 gives the SAME foot (the box's top, y 0.24)
  const box = { lo: [-0.24, 0, -0.24] as V, hi: [0.24, 0.24, 0.24] as V };
  const fa = shellAnchor([0, 0.22, 0], [0, 1, 0], 0.3, 0.06, box), fb = shellAnchor([0, 0.24, 0], [0, 1, 0], 0.3, 0.06, box);
  eq("11 foot invariant", Math.abs(fa[1] - fb[1]) < 1e-6, true); eq("11 foot on the box", fa[1], 0.24, 1e-6);
  // 12. a closed box (a tray and its lid): the inside cell is not reached by the flood; the outside is
  const sealed = [boxPart("fl", [0, 0, 0], [100, 10, 100]), boxPart("w1", [0, 10, 0], [10, 90, 100]), boxPart("w2", [90, 10, 0], [100, 90, 100]), boxPart("w3", [10, 10, 0], [90, 90, 10]), boxPart("w4", [10, 10, 90], [90, 90, 100]), boxPart("lid", [0, 90, 0], [100, 100, 100])];
  const fl = floodOutside(sealed, 4)!;
  eq("12 inside sealed", isOutside(fl, [50, 50, 50]), false); eq("12 outside", isOutside(fl, [50, 120, 50]), true);
  // 13. continuity: isolated steps of 0.3 (noise), 3 (a jump with no event), 6 (glided); and a 45° slope sampled every 1 mm (1 mm a sample): no step
  const c = continuity([0, 0.3, 0.3, 3.3, 3.3, 3.3, 9.3, 9.3]);
  eq("13 unnamed", c.unnamed, 1); eq("13 glides", c.glides, 1);
  eq("13 slope", continuity([0, 0, 1, 2, 3, 4, 5, 5]).steps.length, 0);
  // 14. a peg 59 x 59 seated in the 60 slot of a block, under a slab 60 above: withdrawn along +y it meets the slab — blocked; without the slab clear
  const s60 = blockLess(B, [vd(-30, 30, -30, 30, 40)]);
  const peg = boxPart("peg", [-29.5, 200, -29.5], [29.5, 260, 29.5]);
  eq("14 clear", goalCheck(buildCtx([...s60, peg]), { part: peg, entry: [0, 1, 0] }).blockers.length, 0);
  eq("14 blocked", goalCheck(buildCtx([...s60, peg, boxPart("slab", [-100, 300, -100], [100, 320, 100])]), { part: peg, entry: [0, 1, 0] }).blockers.length, 1);
  return n;
}
