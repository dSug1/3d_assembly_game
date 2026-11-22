// THE SURFACE STUDY — the shapes (ORBIT_SURFACE.md §3.0's grid). Millimetres; y up; the BLOCK 480 × 240 × 480 (x, z centred, y 0 … 240) carries most
// features on its TOP (the cap: t = +x, b = +z) — "inside" at (x −100, z −60), "on an edge" flush with the front (+z), "on a corner" flush with +x and +z,
// "under the pole" at the top's centre. The front facet (+z): t = −x, b = +y (the red up it). Held pieces: A 41.3 × 45 (48 tall), B 80 × 80 (40 tall),
// the bar 20 × 100 (20 tall) — `readings.ts`.
import { type Part, type V, blockLess, boxPart, prismX, prismZ } from "./geom";

export interface Line { label: string; a: V; b: V } // on the studied facet (world, mm); sampled every 1 mm
export interface Study { n: V; lines: Line[] }
export interface Goal { part: Part; entry: V }
export interface Sens { label: string; ruler: number; delta: number; build: (x: number) => Part[]; at: V; n: V; piece: "A" | "B" | "bar" }
export interface Shape {
  name: string;
  classes: string;
  sketch: string;
  parts: Part[];
  twin: Part[]; // the feature filled (a void) or removed (a protrusion): S17's comparison
  studies: Study[];
  pieces?: ("A" | "B" | "bar" | "barT")[];
  goal?: Goal;
  stages?: Part[][]; // the placed sets before / after a seat (C46)
  sens?: Sens[];
  expect: Record<string, string>; // rule → what it says should happen (or "no rule says")
  pair?: boolean;
}

export const TOP = 240;
const BLOCK = { lo: [-240, 0, -240] as V, hi: [240, TOP, 240] as V };
export const base = (): Part[] => [boxPart("base", BLOCK.lo, BLOCK.hi)];
const bx = (id: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => boxPart(id, [x0, y0, z0], [x1, y1, z1]);
const vd = (x0: number, x1: number, z0: number, z1: number, depth: number, y1 = TOP) => ({ lo: [x0, y1 - depth, z0] as V, hi: [x1, y1, z1] as V });
const withVoids = (voids: { lo: V; hi: V }[]) => blockLess(BLOCK, voids);
const clampT = (x: number) => Math.max(-239.5, Math.min(239.5, x));
/** two travels on the top through (x, z): along t (x) and along b (z), ± half */
export function topLines(x: number, z: number, half: number, y = TOP): Line[] {
  return [
    { label: `top, along t through z ${z}`, a: [clampT(x - half), y, z], b: [clampT(x + half), y, z] },
    { label: `top, along b through x ${x}`, a: [x, y, clampT(z - half)], b: [x, y, clampT(z + half)] },
  ];
}
/** on the front (+z): up it (the red) at x, and across it (the green) at height y */
export function frontLines(x: number, ys: number[], zf = 240, yLo = 60, yHi = 239.5): Line[] {
  return [{ label: `front, up (the red) at x ${x}`, a: [x, yLo, zf], b: [x, yHi, zf] }, ...ys.map((y): Line => ({ label: `front, across (the green) at y ${y}`, a: [clampT(x + 150), y, zf], b: [clampT(x - 150), y, zf] }))];
}
const TOPN: V = [0, 1, 0], FRONT: V = [0, 0, 1];
const top = (lines: Line[]): Study => ({ n: TOPN, lines });
const front = (lines: Line[]): Study => ({ n: FRONT, lines });
const IX = -100, IZ = -60; // "inside"

// the common expectations, by principle (ORBIT_SURFACE.md §2.2 – §2.7) — each shape adds or overrides
const E_VOID_FITS = "P2: the piece fits — its floor, half a piece from each wall (the step moved half a piece out); S5 the real depth in the central band only";
const E_VOID_NARROW = "P2: narrower than the piece — closed by its rims (S8 as a consequence): the gizmo on the plane";
const E_FAR = "P1 (S17): far / medium the feature does not change the piece's or the camera's path (the shell, the contour) — only the gizmo's marker";
const E_PROTR = "P2: the piece touches the top first — the marker climbs half a piece BEFORE the part (far); close in the drop starts at the piece: a WALL (P5, his Q1 (b))";

function lib(): Shape[] {
  const S: Shape[] = [];
  // ─────────── voids: holes, slots, channels, mouths, grooves ───────────
  const thru = (w: number, x: number, z: number) => withVoids([vd(x - w / 2, x + w / 2, z - w / 2, z + w / 2, TOP)]);
  S.push({ name: "L01 through hole 100", classes: "C4 (genus 1)", sketch: "a 100 x 100 hole right through the block, inside the top", parts: thru(100, IX, IZ), twin: base(), studies: [top(topLines(IX, IZ, 140))],
    expect: { P2: "wider than A (41.3 x 45) and B? no (80 < 100: B fits): nothing to land on in the band where the piece clears both rims, MARKED; the plane elsewhere", S6: "consequence of P2 (no blanket closing)", P1: E_FAR, S13: "the way through is the plunge (not built)" } });
  S.push({ name: "L02 through hole 30 (narrower)", classes: "C4", sketch: "a 30 x 30 hole through, narrower than every piece", parts: thru(30, IX, IZ), twin: base(), studies: [top(topLines(IX, IZ, 100))],
    expect: { P2: E_VOID_NARROW, S6: "closed (today by 'no floor', P2 by the rims)", P1: E_FAR } });
  const blind = (w: number, d: number, x = IX, z = IZ) => withVoids([vd(x - w / 2, x + w / 2, z - w / 2, z + w / 2, d)]);
  S.push({ name: "L03 blind slot 60x60x40", classes: "C6", sketch: "a pocket 60 x 60, 40 deep, inside the top; a peg 59 x 59 seats in it from above", parts: blind(60, 40), twin: base(), studies: [top(topLines(IX, IZ, 120))],
    goal: { part: bx("peg", IX - 29.5, IX + 29.5, 200, 260, IZ - 29.5, IZ + 29.5), entry: [0, 1, 0] },
    sens: [
      { label: "slot width at A's 41.3", ruler: 41.3, delta: 1, build: (w) => blind(w, 40), at: [IX, TOP, IZ], n: TOPN, piece: "A" },
      { label: "slot width at A's 45", ruler: 45, delta: 1, build: (w) => blind(w, 40), at: [IX, TOP, IZ], n: TOPN, piece: "A" },
      { label: "slot width at B's 80", ruler: 80, delta: 1, build: (w) => blind(w, 40), at: [IX, TOP, IZ], n: TOPN, piece: "B" },
      { label: "slot width at B's heldFoot 40 (its height)", ruler: 40, delta: 1, build: (w) => blind(w, 40), at: [IX, TOP, IZ], n: TOPN, piece: "B" },
    ],
    expect: { P2: E_VOID_FITS + " (A fits; B does not: closed)", S5: "the real depth under the gizmo — P2 changes it within half a piece of each wall", S21: "the peg withdrawn along +y clears; its landing = its seat", P1: E_FAR } });
  S.push({ name: "L04 blind slot 30x30x40 (narrower)", classes: "C6, C8", sketch: "a pocket 30 x 30, 40 deep", parts: blind(30, 40), twin: base(), studies: [top(topLines(IX, IZ, 100))],
    expect: { P2: E_VOID_NARROW, S8: "a void the piece cannot enter is surface (built)", P1: E_FAR } });
  const chan1 = withVoids([vd(IX - 30, IX + 30, -100, 260, 30)]);
  S.push({ name: "L05 channel 60w 30d, open at one end", classes: "C5", sketch: "a 60-wide, 30-deep channel from z -100 to the front edge, open there", parts: chan1, twin: base(), studies: [top(topLines(IX, 80, 160))],
    goal: { part: bx("block", IX - 29.5, IX + 29.5, 210, 240, 120, 200), entry: [0, 0, 1] },
    expect: { P2: E_VOID_FITS + " for A; B (80) closed", P3: "at the open end (seen from the front): a mouth — S10 the tilt at the lip, P3 to measure", S21: "a block slid in from the open end (+z): withdrawal clears", P1: E_FAR } });
  S.push({ name: "L06 channel 60w 30d, open at both ends", classes: "C5", sketch: "a 60-wide, 30-deep channel the whole top long", parts: withVoids([vd(IX - 30, IX + 30, -260, 260, 30)]), twin: base(), studies: [top(topLines(IX, 0, 160))],
    expect: { P2: E_VOID_FITS, S7: "consequence of P2", P1: E_FAR } });
  S.push({ name: "L07 mouth (L05 seen from its open end)", classes: "C7(a)", sketch: "the front face with the channel's end: a 60 x 30 notch at its top edge", parts: chan1, twin: base(), studies: [front(frontLines(IX, [225, 200]))],
    expect: { S10: "[OWNER] the tilt happens when the red reaches the edge at the bottom of the mouth (the lip at y 210)", P3: "the place belongs to the top's facet where the front's direction finds nothing (the channel's back is 340 mm away): measured, not built", P4: "the hold (built) is the one TARGET exception: path state on a dy", P2: "seen along the front's normal: the channel's back wall at z -100 is 340 mm deep — inside the shell's window? no: a 'floor' far behind" } });
  S.push({ name: "L08 groove 13w 10d", classes: "C8", sketch: "a 13-wide, 10-deep groove the whole top long (the cube's bottom groove)", parts: withVoids([vd(IX - 6.5, IX + 6.5, -260, 260, 10)]), twin: base(), studies: [top(topLines(IX, 0, 90))],
    sens: [{ label: "groove width at the joint ruler 3.2 (2 x MAP_GROW)", ruler: 3.2, delta: 1, build: (w) => withVoids([vd(IX - w / 2, IX + w / 2, -260, 260, 10)]), at: [IX, TOP, 0], n: TOPN, piece: "A" }],
    expect: { P2: E_VOID_NARROW, S8: "built", noise: "a joint under 3.2 mm closed by growth (MAP_GROW_M) — the noise family (§2.6)", P1: E_FAR } });
  for (const g of [3, 30, 60]) S.push({ name: `L${String(9 + [3, 30, 60].indexOf(g)).padStart(2, "0")} two islands, gap ${g}`, classes: "C9 (islands), C8", sketch: `two blocks ${g} mm apart (the whole assembly)`,
    parts: [bx("left", -240, -g / 2, 0, TOP, -240, 240), bx("right", g / 2, 240, 0, TOP, -240, 240)], twin: [bx("one", -240, 240, 0, TOP, -240, 240)], studies: [top(topLines(0, 0, 120)), front(frontLines(0, [120]))],
    expect: { P2: g < 41.3 ? "narrower than the piece: closed by the rims" : "wider than A: nothing to land on (no floor), MARKED; B (80) closed", OS11: "today: hangs at the nearest plane (WS4)?", P1: E_FAR, noise: g <= 3.2 ? "3 mm: closed by MAP_GROW" : "—" } });
  // ─────────── steps, stairs, L, notch, corner, overhang ───────────
  const stepParts = [bx("low", -240, 240, 0, 180, -240, 240), bx("high", -240, 240, 180, TOP, -240, 0)];
  S.push({ name: "L12 step 60 (half the top lowered)", classes: "C3 (a concave edge), C35", sketch: "the top's front half 60 mm lower: a riser across the top", parts: stepParts, twin: base(), studies: [top(topLines(0, 0, 200)), front(frontLines(0, [210, 150]))],
    expect: { P2: "far: the marker on the high tread until half a piece past the riser's edge, then the low one (a step moved half a piece out)", P5: "close in: the riser is a wall going back up; blocked, out and back in", C12: "seen from the front: the low tread's riser face; the high tread is parallel to the front's cast (I10)", P1: E_FAR } });
  const stairs = [bx("s0", -240, 240, 0, 120, -240, 240), bx("s1", -240, 240, 120, 150, -240, 180), bx("s2", -240, 240, 150, 180, -240, 120), bx("s3", -240, 240, 180, 210, -240, 60), bx("s4", -240, 240, 210, TOP, -240, 0)];
  S.push({ name: "L13 staircase (treads 60, risers 30)", classes: "C3, C12 (the tread)", sketch: "four steps down toward the front: treads 60 deep, risers 30", parts: stairs, twin: base(), studies: [top(topLines(0, 60, 200)), front(frontLines(0, [225, 165]))],
    expect: { P2: "from the top: each tread its own landing, the steps moved half a piece toward the low side", C12: "from the front (the red climbs the risers): the treads have zero width on the front's height field — no rule (⏳ D-S7)", P1: E_FAR } });
  S.push({ name: "L14 L (the assembly)", classes: "C40, C3", sketch: "the block less its front-right quarter: an L seen from above", parts: [bx("back", -240, 240, 0, TOP, -240, 0), bx("arm", -240, 0, 0, TOP, 0, 240)], twin: base(), studies: [top(topLines(120, 120, 200)), front(frontLines(120, [120]))],
    expect: { OS13: "the contour spans the missing quarter: its facets are partly void", P2: "over the missing quarter: nothing to land on (no floor), marked", C40: "⏳ open: no rule (a measure, D-S20)", P1: E_FAR } });
  S.push({ name: "L15 notch 47 at the top-front edge", classes: "C3, C35", sketch: "a 47-wide notch cut into the top-front edge, 60 down, 50 in (Scene_1's notches)", parts: withVoids([vd(-23.5, 23.5, 190, 260, 60)]), twin: base(), studies: [top(topLines(0, 215, 100)), front(frontLines(0, [210]))],
    expect: { P2: "47 > 45 > 41.3: A fits its floor only where it clears the riser; B closed", P3: "not applied: the notch has a floor along each facet's direction (§2.2 P3)", owner: "'Stays as it is' (POLAR_ORBIT_CLEANUP §6 (a))", P1: E_FAR } });
  S.push({ name: "L16 missing corner 100", classes: "C35 (across three facets)", sketch: "a 100 mm cube missing at the top-front-right corner", parts: withVoids([vd(140, 260, 140, 260, 100)]), twin: base(), studies: [top(topLines(190, 190, 120)), front(frontLines(190, [190]))],
    expect: { P2: "its floor from each facet where the piece fits (A, B both fit 100)", OS1: "a saddle / concave corner the charts pay for, unseen (the contour is convex)", P1: E_FAR } });
  S.push({ name: "L17 overhang slab", classes: "C10", sketch: "a 300 x 30 slab on the top, sticking 100 mm out over the front face", parts: [...base(), bx("slab", -150, 150, TOP, 270, 100, 340)], twin: [...base(), bx("slab", -150, 150, TOP, 270, 100, TOP)],
    studies: [top(topLines(0, 200, 200)), front(frontLines(0, [255, 200], 340, 60, 269.5)), { n: [0, -1, 0], lines: [{ label: "bottom, along b at x 0", a: [0, 0, -200], b: [0, 0, 330] }] }],
    expect: { OS3: "its underside only from the bottom cap", P2: "from the top: the slab's top; from the front: the slab's end", P1: "the slab sticks out of the block's box: the box and the shell grow — the path changes (P1 'no change' cannot hold for what changes the box)" } });
  // ─────────── cavities, lid, overlap, touch, arch, table, elbow ───────────
  const tray = [bx("floor", -150, 150, 0, 20, -150, 150), bx("wl", -150, -130, 20, 120, -150, 150), bx("wr", 130, 150, 20, 120, -150, 150), bx("wb", -130, 130, 20, 120, -150, -130), bx("wf", -130, 130, 20, 120, 130, 150)];
  S.push({ name: "L18 tray (an open box)", classes: "C25", sketch: "a 300 x 120 x 300 tray, walls 20 thick (the whole assembly)", parts: tray, twin: [bx("full", -150, 150, 0, 120, -150, 150)], studies: [top(topLines(0, 0, 145, 120))],
    goal: { part: bx("load", -40, 40, 20, 60, -40, 40), entry: [0, 1, 0] },
    expect: { P2: "its floor where the piece fits (260 inner: A, B fit)", C25: "the inner walls face no facet: never a place (S13: approached)", S21: "a load set on the floor from above: reachable", P1: E_FAR } });
  const lid = bx("lid", -150, 150, 120, 140, -150, 150);
  S.push({ name: "L19 tray sealed by a lid (two stages)", classes: "C26, C46", sketch: "L18, then a lid seated on it: the cavity sealed", parts: [...tray, lid], twin: [bx("full", -150, 150, 0, 140, -150, 150)], studies: [top(topLines(0, 0, 145, 140))],
    goal: { part: lid, entry: [0, 1, 0] }, stages: [tray, [...tray, lid]],
    expect: { S22: "the sealed inner faces are not surface (reachable from outside: no)", S19: "rebuilt at the seat; the gizmo over the lid relocated once (C46)", today: "WS19: the inner faces stay in the map (not glued)", S21: "the lid set from above: reachable" } });
  S.push({ name: "L20 parts overlapping (a cube sunk 30 into the top)", classes: "C27", sketch: "a 100 mm cube whose lower 30 mm are inside the block", parts: [...base(), bx("cube", -50, 50, 210, 310, -50, 50)], twin: base(), studies: [top(topLines(0, 0, 140))],
    expect: { S22: "the buried faces (the cube's lower sides, the block's top under it) are not surface", today: "WS19: buried faces stay in the map", P2: E_PROTR } });
  S.push({ name: "L21 parts touching on an edge", classes: "C28", sketch: "two 100 mm cubes on the top sharing one vertical edge", parts: [...base(), bx("ca", -100, 0, TOP, 340, -100, 0), bx("cb", 0, 100, TOP, 340, 0, 100)], twin: base(), studies: [top(topLines(0, 0, 160))],
    expect: { P2: "each cube's top where the piece touches it; the pinch has no width", noise: "the coplanar tolerance (§2.6)", P1: "the cubes raise the box: the path changes far out" } });
  S.push({ name: "L22 parts touching at a corner", classes: "C28", sketch: "a cube on the top and a second one touching it only at a corner, up in the air", parts: [...base(), bx("ca", -100, 0, TOP, 340, -100, 0), bx("cb", 0, 100, 340, 440, 0, 100)], twin: [...base(), bx("ca", -100, 0, TOP, 340, -100, 0)], studies: [top(topLines(0, 0, 160))],
    expect: { P2: "the high cube's top first where the footprint is under it; else the low cube's", noise: "the coplanar tolerance", OS3: "the high cube's underside: from the bottom cap only" } });
  S.push({ name: "L23 arch (two posts and a lintel)", classes: "C29 (genus), C10", sketch: "two 60 x 120 posts on the top and a lintel across them: an opening 140 wide, 120 high", parts: [...base(), bx("pl", -130, -70, TOP, 360, -30, 30), bx("pr", 70, 130, TOP, 360, -30, 30), bx("lintel", -130, 130, 360, 400, -30, 30)],
    twin: [...base(), bx("fill", -130, 130, TOP, 400, -30, 30)], studies: [top(topLines(0, 0, 200, 400)), { n: FRONT, lines: [{ label: "front, across under the lintel at y 300", a: [200, 300, 240], b: [-200, 300, 240] }, { label: "front, up through the arch at x 0", a: [0, 100, 240], b: [0, 399.5, 240] }] }],
    expect: { P2: "from the front: the opening is a void with its floor (the block's top) far behind — the piece reaches the back wall? the block's front face is the facet; the arch stands in front", OS3: "the lintel's underside only from the bottom cap", C29: "the hole through runs along the facet: no rule names it (P2 + OS3)" } });
  const legs = [[-200, -170], [170, 200]].flatMap(([x0, x1]) => [[-200, -170], [170, 200]].map(([z0, z1]) => bx(`leg${x0}${z0}`, x0!, x1!, 0, 200, z0!, z1!)));
  S.push({ name: "L24 table on four legs (the whole assembly)", classes: "C29, C10, C40", sketch: "a 400 x 30 x 400 top on four 30 mm legs 200 tall", parts: [bx("top", -200, 200, 200, 230, -200, 200), ...legs], twin: [bx("full", -200, 200, 0, 230, -200, 200)],
    studies: [top(topLines(0, 0, 195, 230)), { n: FRONT, lines: [{ label: "front, up at x 0 (under the top: open)", a: [0, 10, 200], b: [0, 229.5, 200] }, { label: "front, across at y 100", a: [195, 100, 200], b: [-195, 100, 200] }] }, { n: [0, -1, 0], lines: [{ label: "bottom, along t at z 0", a: [-195, 0, 0], b: [195, 0, 0] }] }],
    expect: { P2: "from the front between the legs: the back legs far behind or nothing to land on; from below: the top's underside between the legs", OS13: "the contour is mostly void on the sides", S4: "the bottom is a face like the others" } });
  S.push({ name: "L25 elbow tunnel", classes: "C30", sketch: "a 60 x 60 shaft down from the top that turns and leaves through the front", parts: withVoids([vd(-30, 30, -30, 30, 120), { lo: [-30, 120, -30], hi: [30, 180, 260] }]), twin: base(),
    studies: [top(topLines(0, 0, 120)), front(frontLines(0, [150]))],
    expect: { P2: "each mouth judged on its own facet: from the top the shaft's floor (the tunnel's floor at 120) where the piece fits; from the front the tunnel's back wall", C30: "nothing ties the two ends (no rule)" } });
  // ─────────── profiles: countersink, V, counterbore, dovetail, ramps ───────────
  const ends = (z0: number, z1: number) => [bx("e0", -240, 240, 0, TOP, -240, z0), bx("e1", -240, 240, 0, TOP, z1, 240)];
  S.push({ name: "L26 countersunk slot (narrowing 45°)", classes: "C31 (narrowing)", sketch: "a slot 70 wide at the top, chamfered 45° to 30 at 20 deep, then 30 wide to 60 deep, 200 long",
    parts: [bx("l", -240, -35, 0, TOP, -100, 100), prismZ("cl", [[-35, 0], [-15, 0], [-15, 220], [-35, TOP]], -100, 100), prismZ("cr", [[15, 0], [35, 0], [35, TOP], [15, 220]], -100, 100), bx("r", 35, 240, 0, TOP, -100, 100), bx("fl", -15, 15, 0, 180, -100, 100), ...ends(-100, 100)],
    twin: base(), studies: [top(topLines(0, 0, 120))],
    expect: { P2: "70 > A: the piece drops until it touches the chamfers (exact, LP): a landing between 220 and 240; B (80) closed", C31: "today: the chamfers are > 20° from the top: in no group; the 30-wide bore's floor", P1: E_FAR } });
  S.push({ name: "L27 V groove 60w 30d", classes: "C31 (a V)", sketch: "a V groove 60 wide, 30 deep, the whole top long",
    parts: [prismZ("vl", [[-240, 0], [0, 0], [0, 210], [-30, TOP], [-240, TOP]], -240, 240), prismZ("vr", [[0, 0], [240, 0], [240, TOP], [30, TOP], [0, 210]], -240, 240)], twin: base(), studies: [top(topLines(0, 0, 120))],
    expect: { P2: "the piece rests on the V's two flanks: the landing a few mm under the plane at the centre", C31: "today: the flanks (45°) in no group — the V open both ends, no floor: bridged? the nearest plane", P1: E_FAR } });
  S.push({ name: "L28 counterbore", classes: "C31 (stepped)", sketch: "an 80 x 80 recess 15 deep, then a 40 x 40 bore to 60 deep", parts: withVoids([vd(IX - 40, IX + 40, IZ - 40, IZ + 40, 15), vd(IX - 20, IX + 20, IZ - 20, IZ + 20, 60)]), twin: base(), studies: [top(topLines(IX, IZ, 120))],
    expect: { P2: "A lands on the recess's floor (225) — the bore (40 < 41.3) closed; B (80) closed", C31: "today: the fit read at the plane only (80 wide): A enters, then the bore's floor?", P1: E_FAR } });
  S.push({ name: "L29 dovetail slot (widening)", classes: "C31 (widening, an undercut)", sketch: "a slot 30 wide at the mouth widening to 50 at 25 deep, the whole top long",
    parts: [bx("l", -240, -25, 0, TOP, -240, 240), prismZ("wl", [[-25, 215], [-15, TOP], [-25, TOP]], -240, 240), prismZ("wr", [[25, 215], [25, TOP], [15, TOP]], -240, 240), bx("r", 25, 240, 0, TOP, -240, 240), bx("f", -25, 25, 0, 215, -240, 240)],
    twin: base(), studies: [top(topLines(0, 0, 100)), front(frontLines(0, [230]))],
    expect: { P2: "the mouth (30) narrower than A: closed; from the front (its end) the undercut profile", OS3: "the undercut's overhangs from no facet", P1: E_FAR } });
  const ramp = (deg: number) => {
    const drop = 120 * Math.tan((deg * Math.PI) / 180);
    return [prismZ("ramp", [[-60, 0], [60, 0], [60, TOP - drop], [-60, TOP]], -30, 30), bx("xl", -240, -60, 0, TOP, -30, 30), bx("xr", 60, 240, 0, TOP, -30, 30), bx("zb", -240, 240, 0, TOP, -240, -30), bx("zf", -240, 240, 0, TOP, 30, 240)];
  };
  S.push({ name: "L30 ramp 18° (within the merge)", classes: "C31 (inclined floor)", sketch: "a 120 x 60 pocket whose floor slopes 18° down from the top's level to 39 mm deep", parts: ramp(18), twin: base(), studies: [top(topLines(0, 0, 120))],
    sens: [{ label: "ramp angle at the merge 20°", ruler: 20, delta: 1, build: (d) => ramp(d), at: [30, TOP, 0], n: TOPN, piece: "A" }],
    expect: { P2: "60 wide > A: the piece slides down the slope? no — a translation along −n: it touches the slope's high side under its footprint", C31: "today: within 20° a floor at its centre level; the cast reads the slope", P1: E_FAR } });
  S.push({ name: "L31 ramp 35° (beyond the merge)", classes: "C31", sketch: "the same pocket, its floor 35° (84 mm deep at the low end)", parts: ramp(35), twin: base(), studies: [top(topLines(0, 0, 120))],
    expect: { P2: "as L30, steeper", C31: "today: beyond 20° in no group — the pocket bridged (closed, no floor) or the nearest plane (WS22)", P1: E_FAR } });
  // ─────────── rings, protrusions ───────────
  S.push({ name: "L32 boss in a pocket", classes: "C32", sketch: "a 150 x 150 pocket 40 deep with a 50 x 50 boss rising to 20 below the top", parts: [...withVoids([vd(IX - 75, IX + 75, IZ - 75, IZ + 75, 40)]), bx("boss", IX - 25, IX + 25, 200, 220, IZ - 25, IZ + 25)], twin: base(), studies: [top(topLines(IX, IZ, 140))],
    expect: { P2: "the moat (50 wide) fits A: its floor; over the boss the boss's top; between, the boss's edge half a piece out", C32: "today: the opening read at the plane is the whole pocket", P1: E_FAR } });
  S.push({ name: "L33 tube (a hole in a protrusion)", classes: "C32, C11", sketch: "an 80 x 80 square tube 60 tall on the top, walls 15, a 50 x 50 hole", parts: [...base(), bx("tw", IX - 40, IX - 25, TOP, 300, IZ - 40, IZ + 40), bx("te", IX + 25, IX + 40, TOP, 300, IZ - 40, IZ + 40), bx("tn", IX - 25, IX + 25, TOP, 300, IZ - 40, IZ - 25), bx("ts", IX - 25, IX + 25, TOP, 300, IZ + 25, IZ + 40)],
    twin: base(), studies: [top(topLines(IX, IZ, 120))],
    expect: { P2: "the 50 hole fits A: its floor (the block's top) inside; the walls' top elsewhere; B rests on the walls", P1: "the tube raises the box: the path changes far out" } });
  const pro = (id: string, x0: number, x1: number, h: number, z0: number, z1: number, y0 = TOP) => bx(id, x0, x1, y0, y0 + h, z0, z1);
  S.push({ name: "L34 plateau 120x120x20", classes: "C33 (a plateau)", sketch: "a 120 x 120 block 20 tall on the top", parts: [...base(), pro("plateau", IX - 60, IX + 60, 20, IZ - 60, IZ + 60)], twin: base(), studies: [top(topLines(IX, IZ, 140))],
    expect: { P2: E_PROTR, P1: "the plateau raises the box by 20: the path changes far out" } });
  S.push({ name: "L35 pin 10x10x40", classes: "C33 (a pin)", sketch: "a 10 x 10 pin 40 tall", parts: [...base(), pro("pin", IX - 5, IX + 5, 40, IZ - 5, IZ + 5)], twin: base(), studies: [top(topLines(IX, IZ, 100))],
    expect: { P2: "the piece touches the pin's top first wherever its footprint covers the pin (a 51 x 55 region for A): a landing on a pin, ③ first contact is not rest", S23: "the same ruler as voids (consequence of P2)", P1: "the pin raises the box by 40: the path changes far out" } });
  S.push({ name: "L36 rib 10w 15h 300 long", classes: "C33 (a rib)", sketch: "a 10-wide rib 15 tall along z", parts: [...base(), pro("rib", IX - 5, IX + 5, 15, -150, 150)], twin: base(), studies: [top(topLines(IX, 0, 100))],
    expect: { P2: E_PROTR, P1: "raises the box by 15" } });
  S.push({ name: "L37 mushroom (stem 20, cap 60)", classes: "C33 (with its own overhang)", sketch: "a 20 x 20 stem 30 tall carrying a 60 x 60 cap 10 thick", parts: [...base(), pro("stem", IX - 10, IX + 10, 30, IZ - 10, IZ + 10), pro("cap", IX - 30, IX + 30, 10, IZ - 30, IZ + 30, TOP + 30)], twin: base(), studies: [top(topLines(IX, IZ, 110))],
    expect: { P2: "the cap's top first; its underside from the bottom cap only (OS3)", P1: "raises the box by 40" } });
  // ─────────── arrays, frame, rebate, shallow steps, edges, fin ───────────
  const grille = (x: number, z: number) => { const v: { lo: V; hi: V }[] = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) v.push(vd(x - 85 + 30 * i, x - 65 + 30 * i, z - 85 + 30 * j, z - 65 + 30 * j, TOP)); return withVoids(v); };
  S.push({ name: "L38 grille (20 holes, 30 pitch, through)", classes: "C34", sketch: "36 holes 20 x 20 through, at a 30 mm pitch", parts: grille(IX, IZ), twin: base(), studies: [top(topLines(IX, IZ, 130))],
    expect: { P2: "every hole narrower than the piece: the grille is surface at its bars' tops", D5: "the holes inside a frame count as face (filledRegion)", P1: E_FAR } });
  const studs = (x: number, z: number, h = 8) => { const p: Part[] = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) p.push(pro(`st${i}${j}`, x - 66 + 40 * i, x - 54 + 40 * i, h, z - 66 + 40 * j, z - 54 + 40 * j)); return p; };
  S.push({ name: "L39 studs (12 x 12 x 8, 40 pitch)", classes: "C34 (studs)", sketch: "a 4 x 4 field of studs", parts: [...base(), ...studs(IX, IZ)], twin: base(), studies: [top(topLines(IX, IZ, 130))],
    expect: { P2: "a field of studs is surface at their tops where the footprint covers one (A 41.3 > 28 gap: always on a stud inside the field)", today: "the gizmo climbs each stud (C33): 8 mm steps", P1: "raises the box by 8" } });
  S.push({ name: "L40 frame (a pocket taking most of the facet)", classes: "C35 (void or face?)", sketch: "a 400 x 400 pocket 20 deep, a 40 mm rim", parts: withVoids([vd(-200, 200, -200, 200, 20)]), twin: base(), studies: [top(topLines(0, 0, 239))],
    expect: { D5: "which plane is the facet's: the pocket's floor (larger) or the rim? (C35, ⏳ order)", P2: "the floor where the piece fits; the rim's 40 < A: closed? (the rim is material: a landing)", P1: E_FAR } });
  S.push({ name: "L41 rebate 60w 30d along the top-front edge", classes: "C35 (a rebate)", sketch: "a 60-wide, 30-deep step along the whole top-front edge", parts: withVoids([vd(-260, 260, 180, 260, 30)]), twin: base(), studies: [top(topLines(0, 180, 100)), front(frontLines(0, [225]))],
    expect: { P2: "A fits the rebate (60 > 45): its floor beyond half a piece from the riser; B closed", P1: E_FAR } });
  for (const h of [0.3, 1, 6]) S.push({ name: `L${42 + [0.3, 1, 6].indexOf(h)} step of ${h} mm`, classes: "C36 (shallow)", sketch: `the top's back half raised ${h} mm`, parts: [...base(), pro("raise", -240, 240, h, -240, 0)], twin: base(), studies: [top(topLines(0, 0, 150))],
    sens: h === 1 ? [{ label: "step height at the coplanar 0.5 mm", ruler: 0.5, delta: 0.2, build: (x) => [...base(), pro("raise", -240, 240, x, -240, 0)], at: [0, TOP, -60], n: TOPN, piece: "A" }, { label: "step height at the glide's 5 mm", ruler: 5, delta: 1, build: (x) => [...base(), pro("raise", -240, 240, x, -240, 0)], at: [0, TOP, -60], n: TOPN, piece: "A" }] : undefined,
    expect: { noise: h < 0.5 ? "under the coplanar 0.5 mm: one plane" : h < 5 ? "between 0.5 and 5 mm: a jump with no event (WS23, C36)" : "a glided step (the named depth event)", P2: "far: the step moved half a piece onto the low side; close in: a 6 mm riser is a wall", P1: "raises the box by the step: a 'no change' rule cannot hold" } });
  S.push({ name: "L45 shallow edge (a low gable, 8°)", classes: "C37 (shallow edge)", sketch: "a roof of 8° on the top, its ridge along z", parts: [...base(), prismZ("rl", [[-240, TOP], [0, TOP], [0, TOP + 240 * Math.tan((8 * Math.PI) / 180)]], -240, 240), prismZ("rr", [[0, TOP], [240, TOP], [0, TOP + 240 * Math.tan((8 * Math.PI) / 180)]], -240, 240)],
    twin: base(), studies: [top(topLines(0, 0, 200, TOP + 33.7))],
    expect: { P1: "merged under 20°: one facet, its normal up to 8° off the real faces'", P2: "the landing on the slope under the footprint (exact)", C37: "the rest normal (⏳)" } });
  S.push({ name: "L46 knife wedge (a 20° ridge)", classes: "C37 (acute), C13", sketch: "a triangular blade 30 wide at its foot, 85 tall, along z", parts: [...base(), prismZ("blade", [[-15, TOP], [15, TOP], [0, TOP + 85]], -150, 150)], twin: base(), studies: [top(topLines(0, 0, 120)), front(frontLines(0, [280], 150, 60, 324.5))],
    expect: { P2: "the piece touches the ridge line first: a landing on a knife (③ not rest)", OS7: "step B worse on a blade", P1: "raises the box by 85" } });
  S.push({ name: "L47 fin 4 mm (80 tall, 200 long)", classes: "C13", sketch: "a 4 mm plate standing 80 tall along z", parts: [...base(), pro("fin", IX - 2, IX + 2, 80, -100, 100)], twin: base(), studies: [top(topLines(IX, 0, 100))],
    expect: { P2: "the fin's edge first wherever the footprint covers it (45 mm of travel for A)", C13: "today: nothing specific", P1: "raises the box by 80" } });
  // ─────────── assemblies far from convex; empty; small; keyed ───────────
  S.push({ name: "L48 U (the assembly)", classes: "C40", sketch: "a back wall and two arms: a U open to the front", parts: [bx("back", -240, 240, 0, TOP, -240, -120), bx("al", -240, -120, 0, TOP, -120, 240), bx("ar", 120, 240, 0, TOP, -120, 240)], twin: base(), studies: [top(topLines(0, 60, 230)), front(frontLines(0, [120]))],
    expect: { OS13: "the contour's top and front facets mostly void", P2: "from the top: nothing to land on in the U; from the front: the back wall's face 360 mm behind", C40: "⏳ open" } });
  S.push({ name: "L49 ring (the assembly, a 200 hole)", classes: "C40, C4 (genus 1)", sketch: "four blocks round a 200 x 200 hole through", parts: [bx("rb", -240, 240, 0, TOP, -240, -100), bx("rf", -240, 240, 0, TOP, 100, 240), bx("rl", -240, -100, 0, TOP, -100, 100), bx("rr", 100, 240, 0, TOP, -100, 100)], twin: base(), studies: [top(topLines(0, 0, 200))],
    expect: { P2: "nothing to land on over the hole's central band (marked)", OS2: "genus 1: the contour never contains it", P1: E_FAR } });
  S.push({ name: "L50 two towers and a bridge", classes: "C40, C29", sketch: "two 120 x 400 towers 240 apart, a bridge across their tops", parts: [bx("tl", -240, -120, 0, 400, -60, 60), bx("tr", 120, 240, 0, 400, -60, 60), bx("br", -120, 120, 360, 400, -60, 60)], twin: [bx("full", -240, 240, 0, 400, -60, 60)],
    studies: [front(frontLines(0, [200], 60, 10, 399.5)), top(topLines(0, 0, 230, 400))],
    expect: { P2: "from the front under the bridge: nothing to land on (no floor)", OS13: "the contour's front facet mostly void", C40: "⏳ open" } });
  S.push({ name: "L51 nothing placed", classes: "C42", sketch: "no part", parts: [], twin: [], studies: [],
    expect: { all: "no rule says (C42, WS25): no box, no map; the gizmo held or at the boot centre" } });
  S.push({ name: "L52 one small part (30 mm cube)", classes: "C42, C24", sketch: "a single 30 mm cube, smaller than every piece", parts: [bx("tiny", -15, 15, 0, 30, -15, 15)], twin: [], studies: [top(topLines(0, 0, 60, 30))],
    expect: { P2: "the piece touches the cube's top wherever its footprint covers it; beyond: nothing to land on", C24: "⏳ a piece wider than its facet: open", C42: "no rule says" } });
  const keyed = (w: number, l: number) => withVoids([vd(IX - w / 2, IX + w / 2, IZ - l / 2, IZ + l / 2, 30)]);
  S.push({ name: "L53 keyed slot 25x105 for the oblong piece", classes: "C44", sketch: "a 25 x 105 slot 30 deep: the bar 20 x 100 fits only lengthwise along z", parts: keyed(25, 105), twin: base(), pieces: ["A", "bar", "barT"], studies: [top(topLines(IX, IZ, 120))],
    goal: { part: bx("bar", IX - 10, IX + 10, 210, 230, IZ - 50, IZ + 50), entry: [0, 1, 0] },
    sens: [{ label: "slot length at the bar's 100", ruler: 100, delta: 1, build: (l) => keyed(25, l), at: [IX, TOP, IZ], n: TOPN, piece: "bar" }],
    expect: { P2: "as held: lengthwise it lands on the floor; turned (long along t) closed — ② one map per orientation (Q3)", today: "WS10: heldFoot = the two smallest sizes (20 x 20): 'fits' either way round", S21: "the bar from above: reachable lengthwise" } });
  return S;
}

function pairs(): Shape[] {
  const S: Shape[] = [];
  const P = (s: Omit<Shape, "pair">): Shape => ({ ...s, pair: true });
  S.push(P({ name: "Q01 through hole at the pole", classes: "C4 + C41 (a void at a pole)", sketch: "L01's 100 mm hole at the top's centre, where the cap's quarters converge", parts: withVoids([vd(-50, 50, -50, 50, TOP)]), twin: base(), studies: [top(topLines(0, 0, 140))],
    expect: { P2: "nothing to land on at the pole, marked", P6: "the pole on the landing map: one event (C41 ⏳)", C41: "no rule says how the two meet" } }));
  S.push(P({ name: "Q02 channel through the pole, open at the edges that hold it", classes: "C5 + C7(a) + C41", sketch: "a 60 x 30 channel the whole top long through its centre; its ends are mouths on the front and back", parts: withVoids([vd(-30, 30, -260, 260, 30)]), twin: base(),
    studies: [top(topLines(0, 0, 160)), front(frontLines(0, [225]))],
    expect: { S10: "the tilt at the lip (y 210) on the red", P3: "measured, not built", P6: "the channel crosses the cap's centre: the quarters converge into a void (C41 ⏳)", P4: "the hold is path state" } }));
  S.push(P({ name: "Q03 pin beside a slot", classes: "C6 + C33", sketch: "L03's slot with a 10 mm pin 30 tall standing 15 mm from its rim", parts: [...withVoids([vd(IX - 30, IX + 30, IZ - 30, IZ + 30, 40)]), bx("pin", -55, -45, TOP, 270, IZ - 5, IZ + 5)], twin: [...base(), bx("pin", -55, -45, TOP, 270, IZ - 5, IZ + 5)],
    studies: [top(topLines(IX, IZ, 120))], goal: { part: bx("peg", IX - 29.5, IX + 29.5, 200, 260, IZ - 29.5, IZ + 29.5), entry: [0, 1, 0] },
    expect: { P2: "A's footprint reaches the pin before it clears the slot's rim: the slot's floor narrowed on the pin's side", S21: "the peg from above: clear of the pin (15 mm away)", P1: "the pin raises the box" } }));
  S.push(P({ name: "Q04 step inside a channel", classes: "C5 + C3", sketch: "a 100-wide channel along z, 40 deep at the back, 60 deep at the front", parts: withVoids([vd(IX - 50, IX + 50, -260, 0, 40), vd(IX - 50, IX + 50, 0, 260, 60)]), twin: base(), studies: [top(topLines(IX, 0, 160))],
    expect: { P2: "the floor's step moved half a piece toward the deep side (far); close in the step up is a wall (P5)", P1: E_FAR } }));
  S.push(P({ name: "Q05 two slots closer than the piece", classes: "C6 x 2 + C41 (two features closer than the piece)", sketch: "two 30 x 30 slots 20 mm apart", parts: withVoids([vd(IX - 55, IX - 25, IZ - 15, IZ + 15, 40), vd(IX + 25, IX + 55, IZ - 15, IZ + 15, 40)]), twin: base(), studies: [top(topLines(IX, IZ, 110))],
    expect: { P2: "each narrower than the piece: closed; the bar between them carries it", P1: E_FAR } }));
  S.push(P({ name: "Q06 boss flush with the front edge", classes: "C11 on an edge", sketch: "a 60 x 60 x 40 boss on the top, its front face flush with the block's", parts: [...base(), bx("boss", -30, 30, TOP, 280, 180, 240)], twin: base(), studies: [top(topLines(0, 210, 100)), front(frontLines(0, [260]))],
    expect: { P2: E_PROTR, P1: "the boss raises the box: the front facet's top edge (the pole's band) moves", C41: "a protrusion on the edge that holds the pole" } }));
  S.push(P({ name: "Q07 slot under an overhang", classes: "C6 + C10 (a goal under an overhang)", sketch: "a slot 60 x 60 x 40 under a slab carried 60 mm above the top on a post",
    parts: [...withVoids([vd(-30, 30, 150, 210, 40)]), bx("post", -100, -80, TOP, 300, 100, 240), bx("slab", -100, 100, 300, 320, 100, 240)], twin: [...base(), bx("post", -100, -80, TOP, 300, 100, 240), bx("slab", -100, 100, 300, 320, 100, 240)],
    studies: [top(topLines(0, 180, 100)), front(frontLines(0, [270]))], goal: { part: bx("peg", -29.5, 29.5, 200, 260, 150.5, 209.5), entry: [0, 1, 0] },
    expect: { S21: "the peg withdrawn along +y meets the slab: NOT reachable that way — B4 finds it at the build", OS16: "a goal that is not a place", P2: "from the top the slab first" } }));
  S.push(P({ name: "Q08 grille under the pole", classes: "C34 + C41", sketch: "L38's grille at the top's centre", parts: (() => { const v: { lo: V; hi: V }[] = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) v.push(vd(-85 + 30 * i, -65 + 30 * i, -85 + 30 * j, -65 + 30 * j, TOP)); return withVoids(v); })(), twin: base(), studies: [top(topLines(0, 0, 130))],
    expect: { P2: "surface at the bars' tops", P6: "the pole over a porous region", P1: E_FAR } }));
  S.push(P({ name: "Q09 pin in a hole (a moat)", classes: "C32", sketch: "an 80 x 80 hole 40 deep with a 20 x 20 pin rising from its floor to 10 above the top", parts: [...withVoids([vd(IX - 40, IX + 40, IZ - 40, IZ + 40, 40)]), bx("pin", IX - 10, IX + 10, 200, 250, IZ - 10, IZ + 10)], twin: base(), studies: [top(topLines(IX, IZ, 120))],
    expect: { P2: "the moat is 30 wide (< A): A lands on the pin's top wherever it covers it, else the rim", C32: "today: the pin stands proud: climbed; the opening the whole hole's", P1: "the pin raises the box by 10" } }));
  S.push(P({ name: "Q10 fin beside a channel", classes: "C5 + C13", sketch: "L06's channel with a 4 mm fin 60 tall on its rim", parts: [...withVoids([vd(IX - 30, IX + 30, -260, 260, 30)]), bx("fin", IX - 36, IX - 32, TOP, 300, -100, 100)], twin: [...base(), bx("fin", IX - 36, IX - 32, TOP, 300, -100, 100)], studies: [top(topLines(IX, 0, 120))],
    expect: { P2: "the fin is touched before the channel is entered from that side: the channel's floor narrowed", P1: "the fin raises the box" } }));
  return S;
}

export const LIBRARY = (): Shape[] => [...lib(), ...pairs()];

// ───────────────────────────── THE PARAMETRIC SWEEP (§3.0's grid) ─────────────────────────────
export type Sign = "void" | "protrusion";
export type Foot = "island" | "strip1" | "strip2" | "ring" | "array";
export type Prof = "straight" | "stepped" | "widening" | "through";
export type Pos = "inside" | "edge" | "corner" | "pole";
export interface Combo { id: string; sign: Sign; foot: Foot; prof: Prof; wf: number; w: number; dh: number; pos: Pos; parts: () => Part[]; centre: [number, number]; ext: [number, number] }
export const PIECE_MIN = 41.3; // the width ruler: piece A's smaller side
export function sweepCombos(): Combo[] {
  const out: Combo[] = [];
  const signs: Sign[] = ["void", "protrusion"];
  const foots: Foot[] = ["island", "strip1", "strip2", "ring", "array"];
  const wfs = [0.5, 0.9, 1.1, 2];
  const dhs = [0.3, 1, 6, 40];
  const poss: Pos[] = ["inside", "edge", "corner", "pole"];
  for (const sign of signs) for (const foot of foots) for (const prof of ["straight", "stepped", "widening", "through"] as Prof[]) for (const wf of wfs) for (const dh of prof === "through" ? [TOP] : dhs) for (const pos of poss) {
    if (sign === "protrusion" && prof === "through") continue;
    if (prof === "widening" && dh < 6) continue;
    if (foot === "strip2" && pos === "corner") continue;
    const w = Math.round(wf * PIECE_MIN * 10) / 10;
    // the footprint's boxes in (x, z) and its centre
    const rects: [number, number, number, number][] = [];
    let cx = pos === "pole" ? 0 : IX, cz = pos === "pole" ? 0 : IZ;
    let hx = w / 2, hz = w / 2;
    if (foot === "island") rects.push([-w / 2, w / 2, -w / 2, w / 2]);
    else if (foot === "strip1" || foot === "strip2") { hz = foot === "strip2" ? 240 : 120; rects.push([-w / 2, w / 2, -hz, hz]); }
    else if (foot === "ring") { const k = 30; hx = hz = k + w; rects.push([-k - w, k + w, -k - w, -k], [-k - w, k + w, k, k + w], [-k - w, -k, -k, k], [k, k + w, -k, k]); }
    else { hx = hz = 2.5 * w; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) rects.push([2 * w * i - w / 2, 2 * w * i + w / 2, 2 * w * j - w / 2, 2 * w * j + w / 2]); }
    if (foot === "strip1" || foot === "strip2") { if (pos === "edge" || pos === "corner") cx = 240 - hx; if (foot === "strip1") cz = 240 - hz; if (foot === "strip2") cz = 0; }
    else { if (pos === "edge" || pos === "corner") cz = 240 - hz; if (pos === "corner") cx = 240 - hx; }
    const R = rects.map(([a, b, c, d]) => [a + cx, b + cx, c + cz, d + cz] as [number, number, number, number]);
    const shrink = ([a, b, c, d]: [number, number, number, number], k: number): [number, number, number, number] => { const mx = (a + b) / 2, mz = (c + d) / 2; return [mx - ((b - a) / 2) * k, mx + ((b - a) / 2) * k, mz - ((d - c) / 2) * k, mz + ((d - c) / 2) * k]; };
    const grow = ([a, b, c, d]: [number, number, number, number], g: number): [number, number, number, number] => [a - g, b + g, c - g, d + g];
    const id = `${sign[0]}-${foot}-${prof}-w${wf}-d${dh}-${pos}`;
    const parts = (): Part[] => {
      if (sign === "void") {
        const v: { lo: V; hi: V }[] = [];
        for (const r of R) {
          if (prof === "straight" || prof === "through") v.push(vd(r[0], r[1], r[2], r[3], Math.min(dh, TOP)));
          else if (prof === "stepped") { v.push(vd(r[0], r[1], r[2], r[3], dh / 2)); const q = shrink(r, 0.5); v.push(vd(q[0], q[1], q[2], q[3], dh)); }
          else { v.push(vd(r[0], r[1], r[2], r[3], dh / 2)); const q = grow(r, w / 2); v.push({ lo: [q[0], TOP - dh, q[2]], hi: [q[1], TOP - dh / 2, q[3]] }); }
        }
        return withVoids(v);
      }
      const p: Part[] = base();
      R.forEach((r, k) => {
        if (prof === "straight") p.push(bx(`f${k}`, r[0], r[1], TOP, TOP + dh, r[2], r[3]));
        else if (prof === "stepped") { p.push(bx(`f${k}`, r[0], r[1], TOP, TOP + dh / 2, r[2], r[3])); const q = shrink(r, 0.5); p.push(bx(`g${k}`, q[0], q[1], TOP + dh / 2, TOP + dh, q[2], q[3])); }
        else { const q = shrink(r, 0.5); p.push(bx(`f${k}`, q[0], q[1], TOP, TOP + dh / 2, q[2], q[3])); p.push(bx(`g${k}`, r[0], r[1], TOP + dh / 2, TOP + dh, r[2], r[3])); }
      });
      return p;
    };
    out.push({ id, sign, foot, prof, wf, w, dh, pos, parts, centre: [cx, cz], ext: [hx, hz] });
  }
  return out;
}
