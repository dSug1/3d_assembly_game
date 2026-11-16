// ⭐⭐⭐ THE SURFACE STUDY — PART 3: THE REPORT. Reads library.json and sweep.json (run_library.ts, run_sweep.ts) and writes results.json (compact) and
// results.txt: per shape × rule — holds / broken (how, by how much) / no rule says; the sweep by its grid; then THE FINDINGS, grouped by CAUSE, each with
// the rule or principle concerned, the shapes that show it, the numbers, and its kind: (i) a principle confirmed, (ii) a principle that breaks one of the
// owner's rules, (iii) two rules in conflict, (iv) a case no rule covers, (v) a difference between today's code and the proposal that changes what the
// player sees. No rule change is proposed here: the evidence only.
// Usage: npx vite-node scripts/probes/surface_study/report.ts
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable @typescript-eslint/no-explicit-any */
type A = any;
const here = dirname(fileURLToPath(import.meta.url));
const LIB: A[] = JSON.parse(readFileSync(join(here, "library.json"), "utf8"));
const SW: A[] = JSON.parse(readFileSync(join(here, "sweep.json"), "utf8"));
const out: string[] = [];
const w = (s = "") => out.push(s);
const f1 = (x: number) => (Number.isFinite(x) ? (Math.round(x * 10) / 10).toString() : "∞");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((100 * a) / b)}%` : "—");

// ───────────────────── per shape: the aggregates over its travels and pieces ─────────────────────
interface Agg { e: number; em: number; a: number; am: number; u: number; um: number; g: number; p: number; h: number; n: number; nothing: number; reach: number[]; trap: number; drops: number; samples: number; fb20: number; fn20: number; fb45: number; fn45: number }
const z = (): Agg => ({ e: 0, em: 0, a: 0, am: 0, u: 0, um: 0, g: 0, p: 0, h: 0, n: 0, nothing: 0, reach: [], trap: 0, drops: 0, samples: 0, fb20: 0, fn20: 0, fb45: 0, fn45: 0 });
function aggOf(d: A, piece?: string): { T: Agg; P: Agg } {
  const r = { T: z(), P: z() };
  for (const v of Object.values(d.lines ?? {}) as A[]) for (const [pk, x] of Object.entries(v) as [string, A][]) {
    if (piece && pk !== piece) continue;
    for (const R of ["T", "P"] as const) {
      const y = x[R], a = r[R];
      a.e += y.land.enter; a.em = Math.max(a.em, y.land.enterMax); a.a += y.land.air; a.am = Math.max(a.am, y.land.airMax);
      a.u += y.cont.unnamed; a.um = Math.max(a.um, y.cont.unnamedMax); a.g += y.cont.glides; a.p += y.path; a.samples += x.n;
      if (R === "T") a.h += y.held; else a.nothing += y.land.nothing;
      a.reach.push(y.close.reach); a.trap += y.close.trapped; a.drops += y.close.drops;
      if (y.far) { a.fb20 = Math.max(a.fb20, y.far.b20.max); a.fn20 += y.far.b20.n; a.fb45 = Math.max(a.fb45, y.far.b45.max); a.fn45 += y.far.b45.n; }
    }
  }
  return r;
}
const landV = (a: Agg, R: "T" | "P") => (a.e === 0 && a.a === 0 ? (R === "P" && a.nothing > 0 ? `holds (+${a.nothing} nothing to land on, marked)` : "holds") : [a.e ? `ENTERS ${a.e}/${a.samples} (max ${f1(a.em)} mm)` : "", a.a ? `AIR ${a.a}/${a.samples} (${a.am >= 9999 ? "no part under it" : `max ${f1(a.am)} mm`})` : ""].filter(Boolean).join("; "));
const contV = (a: Agg) => (a.u === 0 ? `holds (${a.g} glided steps)` : `BROKEN: ${a.u} jumps 0.5–5 mm with no event (max ${f1(a.um)} mm); ${a.g} glided`);
const placeV = (a: Agg) => (a.p === 0 ? "holds" : `BROKEN: ${a.p} places depend on the way in (${a.h} held by the mouth's hold)`);
const bumpV = (a: Agg) => (a.fn20 === 0 && a.fn45 === 0 ? "holds (no bump)" : `BUMPS: u 20° ${a.fn20} steps (max ${f1(a.fb20)} mm) · u 45° ${a.fn45} (max ${f1(a.fb45)} mm)`);
const closeV = (a: Agg) => `reach ${Math.round(a.reach.reduce((s, x) => s + x, 0) / Math.max(1, a.reach.length))}%, ${a.trap} travel-ends trapped (P5), ${a.drops} drops ≥ 5 mm`;
function farV(d: A, R: "T" | "P"): string {
  if (!d.far || d.far.note) return "no rule says (no twin: nothing placed without it)";
  const x = d.far[R];
  if (x.footMax <= 0.5 && x.nDeg === 0) return "holds";
  return `BROKEN: the foot moves ${f1(x.footMax)} mm${x.nDeg ? `, the facet turns ${f1(x.nDeg)}°` : ""} (${x.at}; box ${f1(d.far.boxMm)} mm, contour ${d.far.contour.unmatched ? `${d.far.contour.unmatched} facets differ` : `Δ ${f1(d.far.contour.dMax)} mm`})`;
}
const expoV = (d: A) => { const e = d.exposure; if (!e) return "—"; const diff = e.today - e.s22; return Math.abs(diff) <= Math.max(20, 0.02 * e.s22) ? `holds (${e.s22} cm²)` : `today ${e.today} vs S22 ${e.s22} cm² (sealed ${e.sealed}, buried ${e.buried})`; };
const covV = (d: A) => { const c = d.coverage; if (!c) return "—"; const y = c.why; return `T ${pct(c.T, c.total)} · P ${pct(c.P, c.total)} (no facet ${pct(y.noFacet, c.total)}, hidden ${pct(y.hidden, c.total)}, closed T ${pct(y.closedT, c.total)} / P ${pct(y.closedP, c.total)})`; };
const goalV = (d: A) => { const g = d.goal; if (!g) return "no goal"; const ok = g.blockers.length === 0; return `${ok ? "withdrawal clear" : `BLOCKED by ${g.blockers.join(", ")}`}; landing T ${g.landT} · P ${g.landP} vs seat ${g.seat}`; };
const detV = (d: A) => { const x = d.det; if (!x) return "—"; const all = [x.order.T, x.order.P, x.order.contour, x.moved.T, x.moved.P, x.moved.contour]; const tie = d.detTie ? Math.max(d.detTie.moved.T, d.detTie.order.T) : 0; return all.every((v) => v === 0) ? `holds${tie ? ` (a tie at a wall's exact place: T ${tie} mm)` : ""}` : `BROKEN: order T ${x.order.T} P ${x.order.P} contour ${x.order.contour}; turned+moved T ${x.moved.T} P ${x.moved.P} contour ${x.moved.contour}`; };
const sensV = (d: A) => (d.sens ? d.sens.map((s: A) => `${s.label}: T ${s.flipT ? `FLIPS ${s.lo.T}→${s.hi.T} (×${s.ampT})` : "no flip"} · P ${s.flipP ? `FLIPS ${s.lo.P}→${s.hi.P} (×${s.ampP})` : "no flip"}`).join(" | ") : "");

w("THE ORBIT'S SURFACE — THE STUDY (2026-11-16): the named library, the pairs and the parametric sweep, read TODAY and PROPOSED");
w("ORBIT_SURFACE.md; the owner: \"I suggest you complement this set of rules by doing like you did for the orbit charts: you elaborate some basic geometries or");
w("topologies with surface singularities and you consolidate the rules you have drafted, or amend them, or add rules which are missing to cover cases we did");
w("not consider.\" — \"Make sure you manage the load on my computer\" (one process at a time, one core, each run under a minute).");
w("Readings: T = today's pure functions (buildFaceMap chart layout, stackDepthAt, castPoint, mapTarget, shellAnchor, footprintSupport, mouthHold) with an exact");
w("ray cast for modelCast; P = the principles as written (P2 first contact from outside far / from the piece close in, \"nothing to land on\" marked; P1's shell).");
w("Pieces: A 41.3 x 45 (48 tall), B 80 x 80 (40 tall), the bar 20 x 100 (20 tall). Thresholds: noise 0.5 mm, glide 5 mm, skin 0.3 mm, the shell's 60 mm.");
w("Emulated (engine-bound in the game): rawGizmo's D3 cast (from outside the box at castPoint, MAP_OUT 50 mm, a bridge counts a hit 0.5 mm in front), heldFoot");
w("(the two smallest sizes of the piece's own box). Left out: the edge blend (dead), the depth glide and every ease (the SHOWN gizmo, not the target), the");
w("solver's slide, the ring's hold, the automatic tilt. The travels are sampled on the facet's plane directly (not through mapTarget's angles) except the far");
w("regime (mapTarget on a grid of angles, d = 0.3 m). Close in = the piece at contact (d = 0), its bottom from where it is, a travel stopped at its first wall");
w("(the gizmo read at the solved angles). Parts: boxes and convex prisms only; exact levels and casts; S22 by a 4 mm voxel flood; coverage on 8 mm samples.");
w();
w("═══ 1. THE NAMED LIBRARY: per shape x rule ═══");
for (const d of LIB) {
  w();
  w(`■ ${d.name}  [${d.classes}]${d.pair ? "  (a PAIR)" : ""} — ${d.sketch}${d.parts !== undefined ? `  (${d.parts} parts)` : ""}`);
  for (const [k, v] of Object.entries(d.expect ?? {})) w(`    expects ${k}: ${v}`);
  if (d.empty) { w(`    ALL CHECKS: no rule says — ${d.empty.note}`); continue; }
  for (const pk of [...new Set(Object.values(d.lines).flatMap((v: A) => Object.keys(v)))] as string[]) {
    const g = aggOf(d, pk);
    w(`  piece ${pk}:`);
    w(`    landing (far)        T ${landV(g.T, "T")}  |  P ${landV(g.P, "P")}`);
    w(`    continuity           T ${contV(g.T)}  |  P ${contV(g.P)}`);
    w(`    function of place    T ${placeV(g.T)}  |  P ${placeV(g.P)}`);
    w(`    close in (P5)        T ${closeV(g.T)}  |  P ${closeV(g.P)}`);
    w(`    far, one assembly    T ${bumpV(g.T)}  |  P ${bumpV(g.P)}`);
  }
  w(`    far regime (S17/P1)  T ${farV(d, "T")}  |  P ${farV(d, "P")}`);
  w(`    exposure (S22)       ${expoV(d)}`);
  w(`    coverage (S24, A)    ${covV(d)}`);
  w(`    goal (S21)           ${goalV(d)}`);
  w(`    determinism          ${detV(d)}${d.capReal === false ? "  ⚠ the TOP cap is VIRTUAL (D5 dropped the real one)" : ""}`);
  if (d.sens) w(`    sensitivity          ${sensV(d)}`);
  if (d.stages) w(`    stages (C46)         ${d.stages.map((s: A, i: number) => `stage ${i + 1}: gizmo at the top's centre T ${s.todayAt0} · P ${s.propAt0}; exposed today ${s.exposure.today} / S22 ${s.exposure.s22} (sealed ${s.exposure.sealed}); top-stack groups below the top ${s.topGroupsBelow}`).join(" → ")}`);
}

// ───────────────────── the sweep ─────────────────────
w();
w(`═══ 2. THE PARAMETRIC SWEEP: ${SW.length} cells (piece A; two 1 mm travels through each feature) — cells BROKEN per check, T / P ═══`);
const keys = ["enter", "air", "jump", "path", "far", "bump", "trap", "drop"] as const;
const brk = (x: A, R: "T" | "P") => ({ enter: x[R].e > 0, air: x[R].a > 0, jump: x[R].u > 0, path: x[R].p > 0, far: (R === "T" ? x.far.T : x.far.P) > 0.5, bump: x[R].fn20 > 0, trap: x[R].ct > 0, drop: x[R].cd > 0 });
const rowsBy = (key: (x: A) => string) => { const m = new Map<string, A[]>(); for (const x of SW) { const k = key(x); m.set(k, [...(m.get(k) ?? []), x]); } return m; };
w(`  ${"group".padEnd(32)} cells  ${keys.map((k) => k.padStart(11)).join("")}`);
for (const [k, xs] of rowsBy((x) => `${x.sign} ${x.foot} ${x.prof}`)) {
  const c = (R: "T" | "P", kk: (typeof keys)[number]) => xs.filter((x) => brk(x, R)[kk]).length;
  w(`  ${k.padEnd(32)} ${String(xs.length).padStart(5)}  ${keys.map((kk) => `${c("T", kk)}/${c("P", kk)}`.padStart(11)).join("")}`);
}
const tot = (R: "T" | "P", kk: (typeof keys)[number]) => SW.filter((x) => brk(x, R)[kk]).length;
w(`  ${"ALL".padEnd(32)} ${String(SW.length).padStart(5)}  ${keys.map((kk) => `${tot("T", kk)}/${tot("P", kk)}`.padStart(11)).join("")}`);
w("  (enter: the piece set at the gizmo enters a part; air: under it nothing within 0.5 mm, unmarked; jump: a 0.5–5 mm depth step with no event; path: a target");
w("   that depends on the way in; far: the far foot moves > 0.5 mm against the bare block (u along the normal: BETWEEN two assemblies); bump: along ONE");
w("   travel the far foot (u 20° off the normal) jumps > 0.5 mm beyond the place's 1 mm step; trap: a close-in travel that ends at a wall; drop: close in the piece");
w("   goes down ≥ 5 mm into something)");

// ───────────────────── THE FINDINGS ─────────────────────
const F: { id: string; kind: string; rule: string; title: string; shapes: string[]; numbers: string; note: string }[] = [];
const lib = (pred: (d: A) => boolean) => LIB.filter((d) => !d.empty && pred(d)).map((d) => d.name.split(" ")[0]);
const libAgg = (d: A, pk?: string) => aggOf(d, pk);
// F1 — the point against the body
{
  const sh = lib((d) => libAgg(d).T.e > 0);
  const em = Math.max(...LIB.filter((d) => !d.empty).map((d) => libAgg(d).T.em));
  const cells = SW.filter((x) => x.T.e > 0).length, cellsP = SW.filter((x) => x.P.e > 0 || x.P.a > 0).length;
  const libP = lib((d) => libAgg(d).P.e > 0 || libAgg(d).P.a > 0).length;
  F.push({ id: "F1", kind: "(v) + (i)", rule: "the landing rule (ORBIT_CHARTS §1 rule 1); P2; OS14 / C43", title: "TODAY THE GIZMO IS A POINT: the piece set at it, centred, enters the part beside every wall, rim and protrusion; P2 never does",
    shapes: sh, numbers: `today: ${sh.length} of ${LIB.filter((d) => !d.empty).length} library shapes, ${cells} of ${SW.length} sweep cells; up to ${f1(em)} mm into a part (the metric is capped at the piece's own height: 48 for A, 40 for B — "at least the piece's height", not a wall's). P2: ${libP} library shapes and ${cellsP} cells with an entry or an unmarked air gap — none.`,
    note: "Far and medium this is the MARKER only (the piece rides the shell); close in the footprint support covers it (F9). The point-vs-body gap is half a piece wide along every wall." });
}
// F2 — the steps move half a piece out
{
  const offs: number[] = [];
  for (const d of LIB) if (!d.empty) for (const v of Object.values(d.lines) as A[]) { const x = v.A; if (!x) continue; for (const [i, dz] of x.P.cont.steps as [number, number][]) { const m = (x.T.cont.steps as [number, number][]).filter((s) => Math.sign(s[1]) === Math.sign(dz) && Math.abs(Math.abs(s[1]) - Math.abs(dz)) < 1).map((s) => Math.abs(s[0] - i)); if (m.length) offs.push(Math.min(...m)); } }
  offs.sort((a, b) => a - b);
  const med = offs.length ? offs[Math.floor(offs.length / 2)]! : NaN;
  F.push({ id: "F2", kind: "(i)", rule: "P2 (§2.2 'Steps remain … moved outward by half its width'); S5", title: "P2 MOVES EVERY DEPTH STEP HALF A PIECE OFF THE WALL, it does not remove it",
    shapes: lib((d) => libAgg(d, "A").P.g > 0), numbers: `piece A on the library's travels: ${offs.length} depth steps matched T↔P; the offset between today's step and P2's: median ${f1(med)} mm (A's half-sizes 20.65 / 22.5 mm), range ${f1(offs[0] ?? NaN)} – ${f1(offs[offs.length - 1] ?? NaN)} mm. L03: today steps at the walls (91, 150 mm along the travel), P2 at 111 and 130 — the slot's floor a 19 mm band (60 − 41.3).`,
    note: "S5's 'real depth under the gizmo' holds only in the central band; the number of steps is unchanged (glided, the named event)." });
}
// F3 — heldFoot
{
  const shB = lib((d) => { const g = libAgg(d, "B"); return g.T.e > 0 && g.P.e === 0 && g.T.em >= 5; });
  const L53 = LIB.find((d) => d.name.startsWith("L53")), L19 = LIB.find((d) => d.name.startsWith("L19"));
  const bt = L53 ? libAgg(L53, "barT") : null;
  F.push({ id: "F3", kind: "(v)", rule: "WS10 (heldFoot: the two smallest sizes of the piece's own box); P2 ② / Q3", title: "TODAY THE PIECE'S RULER IS ITS TWO SMALLEST SIZES, NOT ITS FOOTPRINT: a flat piece is judged by its thickness, an oblong one fits either way",
    shapes: [...shB, "L53"], numbers: `piece B (80 x 80, 40 tall) is judged 40 x 80: today its gizmo goes to the floor of every void 40 – 80 wide (channels 60 wide: L05, L06, Q02) and the piece set there enters the rims by up to 30 mm along the whole travel (${shB.length} library shapes). The bar (20 x 100) is judged 20 x 20: turned across the 25 x 105 keyed slot today ENTERS ${bt ? `${bt.T.e} places (max ${f1(bt.T.em)} mm)` : "—"}; P2 as held: ${bt ? bt.P.e : "—"}. The lid of L19 (300 x 20 x 300), read on the map of the tray alone (the lid not yet placed): today ${L19?.goal?.landT}, P2 ${L19?.goal?.landP}, its seat ${L19?.goal?.seat} — ${L19?.goal && L19.goal.landT === L19.goal.seat ? 'today lands it on its seat too (its 300 mm footprint does not enter the 260 mm opening: bridged)' : 'today misses its seat'}.`,
    note: "The difference is visible far out (the marker) and decides the goal's landing; close in the footprint support corrects the PIECE (not the gizmo)." });
}
// F4 — nothing to land on
{
  const sh = lib((d) => libAgg(d).P.nothing > 0);
  const tAir = lib((d) => libAgg(d).T.a > 0 && libAgg(d).T.am >= 9999);
  F.push({ id: "F4", kind: "(i) + (v)", rule: "P2 ① 'nothing to land on'; S6; OS2, OS11; WS4", title: "'NOTHING TO LAND ON' IS ONE CLASS: through holes wider than the piece, gaps between islands, the inside of an L, a U, a ring, under a table, a bridge, round a small part",
    shapes: sh, numbers: `${sh.length} library shapes have places where no part is under the footprint at all; today the same places put the gizmo on a plane with nothing under the piece (${tAir.length} shapes, unmarked); P2 marks them. Sweep: ${SW.filter((x) => x.P.n > 0).length} cells (all through voids or wide gaps) marked by P2; today ${SW.filter((x) => x.T.a > 0).length} cells with an unmarked air gap.`,
    note: "The same geometry, now named: S6's 'closed for the moment' becomes P2's two answers (closed by the rims / nothing to land on). Nothing changes on the glass except the mark." });
}
// F5 — the mouth on the cap
{
  const cells = SW.filter((x) => x.T.h > 0 && x.prof === "through");
  const maxH = Math.max(0, ...cells.map((x) => x.T.h));
  const q02 = LIB.find((d) => d.name.startsWith("Q02")), l07 = LIB.find((d) => d.name.startsWith("L07"));
  const qh = q02 ? Object.entries(q02.lines).filter(([k]) => k.startsWith("front")).map(([, v]: A) => v.A.T.held) : [];
  const l7 = l07 ? Object.values(l07.lines).map((v: A) => v.A.T.held).reduce((s: number, x: number) => s + x, 0) : 0;
  F.push({ id: "F5", kind: "(iv) + (ii)", rule: "S10 / the mouth's hold (S18, P4's one exception); C7(a); C41", title: "THE MOUTH'S HOLD FIRES WHEREVER A VOID IS CLOSED ACROSS AND OPEN UP THE FACET WITH NO FLOOR — on the TOP CAP too, and along a gap between islands",
    shapes: ["Q02", "L07", ...new Set(cells.map((x) => `${x.foot}-${x.prof}@${x.pos}`))], numbers: `designed case (Q02, a channel through, seen from its end): the red going up is held ${qh.join(" / ")} mm under the lip, not held coming down — path-dependent, as labelled. Not designed: ${cells.length} sweep cells (through slots and islands open toward a cap edge, a through strip = a gap between two islands) hold the gizmo ON THE TOP CAP for up to ${maxH} mm of a dy — a dy along the gap keeps the gizmo at its first place for the whole travel. L07 (the same channel open at ONE end, seen from that end): held ${l7} — the back wall 340 mm behind counts as a floor, so no mouth, no hold, the lip has no event.`,
    note: "Whether the visible lip is a 'mouth' depends on a fact 340 mm away (the channel's far end); and the rule built for a side's lip acts on a cap where no tilt hand-over exists. No rule names either case." });
}
// F6 — the coplanar glue / thin layers
{
  const cells = SW.filter((x) => x.cap === false);
  const farMax = Math.max(0, ...cells.map((x) => x.far.T));
  const fakeC = SW.filter((x) => x.T.h > 0 && x.prof === "stepped");
  const fake = fakeC.length;
  const l42 = LIB.find((d) => d.name.startsWith("L42"));
  F.push({ id: "F6", kind: "(ii) + (iv)", rule: "the noise family (§2.6: MAP_COPLANAR_M 0.5 mm), R1 (exposed = not glued), D5, S17 / P1; WS15", title: "A LAYER THINNER THAN THE COPLANAR TOLERANCE ERASES THE FACE ABOVE IT: the top's real face 'glued' to a downward face up to 0.5 mm below it, D5 drops the cap, the charts lose the pole",
    shapes: [...new Set([...cells, ...fakeC].map((x) => `${x.sign}-${x.foot}-${x.prof}-d${x.dh}`))], numbers: `${cells.length} sweep cells (voids stepped 0.3 mm deep: layers of 0.15 mm) end with a VIRTUAL top cap: far out the foot moves up to ${f1(farMax)} mm and the facet under the gizmo turns 90° (the side band runs to the pole) — both readings (P1 keeps the same contour). ${fake} more cells (protrusions stepped 1 mm: layers of exactly 0.5 mm, the tolerance itself) keep their cap but read part of the protrusion as a VOID closed across with no floor — a false 'mouth', and the hold on the top (up to ${Math.max(0, ...fakeC.map((x) => x.T.h))} mm of a dy). The plane's level is its FIRST face's (stackOf: planes.find(...)), so the order of the parts moves a facet: L42 (a 0.3 mm step) ${l42 ? `contour Δ ${l42.det.order.contour} mm with the order reversed` : ""}.`,
    note: "Cause: a face's coplanarity is tested against the PLANE's first level, not its own, and R1 glues any opposite face of another part within 0.5 mm of that plane — whichever side of it. Triggered by a part thinner than 0.5 mm or two parts overlapping by less than 0.5 mm (a press fit, the 0.3 mm skin). The spec's noise family states the tolerances but not this." });
}
// F7 — P1 vs the box
{
  const pro = SW.filter((x) => x.sign === "protrusion"), moved = pro.filter((x) => x.far.T > 0.5);
  const ratio = moved.map((x) => x.far.T / Math.max(1e-9, x.far.box)).filter(Number.isFinite);
  const vMoved = SW.filter((x) => x.sign === "void" && x.far.T > 0.5 && x.cap !== false);
  F.push({ id: "F7", kind: "(ii)", rule: "P1 / S17 ('far or medium, a singularity at the surface does not impact the orbit of the piece - camera')", title: "EVERY PROTRUSION MOVES THE PIECE AND THE CAMERA FAR OUT BY ITS HEIGHT: the shell is built on the parts' BOX, and a protrusion grows the box",
    shapes: lib((d) => d.far && d.far.T && d.far.T.footMax > 0.5 && d.far.boxMm > 0.5), numbers: `${moved.length} of ${pro.length} protrusion cells move the far foot (both readings identical); the foot's move / the box's growth: ${f1(Math.min(...ratio))} – ${f1(Math.max(...ratio))} (the remaining ${pro.length - moved.length}: 0.3 mm, under the noise). Library: a 0.3 mm step moves it 0.3 mm, a pin 10 x 10 x 40 moves it 40 mm, the knife 85, the overhang slab 100. Voids: ${vMoved.length} cells move it (a void at an edge or corner that removes the box's extreme, or a corner through-void).`,
    note: "BETWEEN two assemblies (a shape against its bare twin, u along the facet's normal). Along ONE assembly the far foot is a different measure: F17." });
}
// F17 — the far foot along ONE assembly, the direction oblique (the critic's B1)
{
  const anyB = (R: "T" | "P") => SW.filter((x) => x[R].fn20 > 0);
  const vB = (R: "T" | "P") => anyB(R).filter((x) => x.sign === "void").length, pB = (R: "T" | "P") => anyB(R).filter((x) => x.sign === "protrusion").length;
  const mx = (k: "fb20" | "fb45") => f1(Math.max(0, ...SW.map((x) => Math.max(x.T[k], x.P[k]))));
  const lb = LIB.filter((d) => !d.empty).map((d) => ({ n: d.name.split(" ")[0], g: libAgg(d, "A") })).filter((x) => x.g.T.fn20 > 0 || x.g.P.fn20 > 0);
  const ex = ["L03", "L12", "L35", "L42", "L43", "L44"].map((k) => { const d = LIB.find((y) => y.name.startsWith(k)); if (!d) return ""; const g = libAgg(d, "A"); return `${k} T ${f1(g.T.fb20)} / ${f1(g.T.fb45)} · P ${f1(g.P.fb20)} / ${f1(g.P.fb45)}`; }).filter(Boolean).join("; ");
  F.push({ id: "F17", kind: "(ii)", rule: "P1 / S17 along a travel ('a singularity at the surface does not impact the orbit of the piece - camera'); the shell (orbit_shell.ts)", title: "ALONG ONE ASSEMBLY THE FAR FOOT BUMPS AT EVERY DEPTH STEP WHEN THE ORBIT'S DIRECTION IS OBLIQUE: by the step's depth × tan(the direction's angle off the normal)",
    shapes: lb.map((x) => x.n), numbers: `the far foot (d = 0.3 m, shellAnchor as the game calls it) along the 1 mm travels with u tilted 20° / 45° off the facet's normal toward the travel. Sweep (piece A): cells with a bump > 0.5 mm at 20° — today ${anyB("T").length} (voids ${vB("T")}, protrusions ${pB("T")}), P2 ${anyB("P").length} (voids ${vB("P")}, protrusions ${pB("P")}); by depth (max at 20° / 45°, cells bumping at 20°, T · P): ${[0.3, 1, 6, 40].map((h) => { const xs = SW.filter((x) => x.dh === h); const m = (R: "T" | "P", k: "fb20" | "fb45") => f1(Math.max(0, ...xs.map((x) => x[R][k]))); return `${h} mm: T ${m("T", "fb20")} / ${m("T", "fb45")} (${xs.filter((x) => x.T.fn20 > 0).length}) · P ${m("P", "fb20")} / ${m("P", "fb45")} (${xs.filter((x) => x.P.fn20 > 0).length})`; }).join("; ")} — depth × tan 20° = 0.36 h, × tan 45° = h; today's 1 mm outliers (${mx("fb20")} mm) are F6's false-mouth cells: the HELD place released, not a depth step. Library, piece A, max bump at 20° / 45° (mm): ${ex}. ${lb.length} library shapes bump at 20°.`,
    note: "With u along the normal (the calm's full share, a face's middle) the bump is zero by construction; the calm leaves u oblique toward a face's edges, where the shell no longer absorbs a depth step: the foot slides along u by depth × tan(angle). The study's earlier claim 'no bump along one assembly' rested on u = the normal only." });
}
// F8 — close in: drops and traps
{
  const dT = SW.filter((x) => x.T.cd > 0).length, dP = SW.filter((x) => x.P.cd > 0).length, tT = SW.filter((x) => x.T.ct > 0).length, tP = SW.filter((x) => x.P.ct > 0).length;
  const L03 = LIB.find((d) => d.name.startsWith("L03"));
  F.push({ id: "F8", kind: "(iii)", rule: "S5 ('the piece shall not go in (it shall continue its orbit)') against the close-in contact (the footprint support today, P2 ⑤) and P5 / S14", title: "CLOSE IN, THE PIECE IN CONTACT DROPS INTO EVERY SLOT IT FITS, THEN A DX ACROSS IT IS TRAPPED AT THE FAR WALL — in both readings",
    shapes: lib((d) => libAgg(d, "A").T.drops > 0), numbers: `sweep: drops ≥ 5 mm in ${dT} cells today / ${dP} P2; travels ending at a wall in ${tT} / ${tP} cells — of which voids where the piece first DROPPED IN: ${SW.filter((x) => x.sign === "void" && x.T.cd > 0 && x.T.ct > 0).length} / ${SW.filter((x) => x.sign === "void" && x.P.cd > 0 && x.P.ct > 0).length}, and protrusions (a proud part a wall, his Q1 (b), as intended): ${SW.filter((x) => x.sign === "protrusion" && x.T.ct > 0).length} / ${SW.filter((x) => x.sign === "protrusion" && x.P.ct > 0).length}. L03 (60 x 60 slot, piece A): ${L03 ? closeV(libAgg(L03, "A").T) : ""} — the piece goes in, then cannot leave by the orbit (out by the approach, S14).`,
    note: "Measured with the piece at contact (d = 0); beyond the shell's offset the piece rides the shell and does not go in (S5 holds far). The trap is P5 working as written; whether a slot crossed close in should capture the piece is not stated anywhere." });
}
// F9 — close in today = P2 ⑤, except over the edge
{
  const diff = SW.filter((x) => x.T.ct !== x.P.ct || Math.abs(x.T.cr - x.P.cr) > 1);
  const byPos: Record<string, number> = {};
  for (const x of diff) byPos[x.pos] = (byPos[x.pos] ?? 0) + 1;
  F.push({ id: "F9", kind: "(i) + (iv)", rule: "P2 ⑤ ('P2 started at the piece REPRODUCES [the footprint support]'); C24 / C43 (a piece over a facet's edge)", title: "CLOSE IN, P2 STARTED AT THE PIECE GIVES TODAY'S FOOTPRINT SUPPORT — except where the footprint hangs past the assembly's edge",
    shapes: [], numbers: `${SW.length - diff.length} of ${SW.length} cells: the same reach, traps and drops. ${diff.length} differ: by position ${JSON.stringify(byPos)} — e.g. a rebate 37 mm wide (narrower than A) along the block's edge: today the gizmo stays on the plane (bridged), P2 lets the piece land 1 – 40 mm down into it because part of the footprint is over empty space beyond the edge.`,
    note: "No rule says whether a landing may have part of the footprint over nothing (beyond the facet's polygon, beyond the box)." });
}
// F10 — jumps with no event
{
  const cells = SW.filter((x) => x.T.u > 0 || x.P.u > 0);
  F.push({ id: "F10", kind: "(iv)", rule: "C36 / WS23 (no depth ruler between the coplanar 0.5 mm and the glide's 5 mm); the noise family", title: "DEPTH STEPS OF 0.5 – 5 MM ARE JUMPS WITH NO EVENT in both readings",
    shapes: lib((d) => libAgg(d).T.u > 0 || libAgg(d).P.u > 0), numbers: `${cells.length} sweep cells (all with a 1 mm step, or a stepped 6 mm profile: 3 mm halves); max ${f1(Math.max(0, ...cells.map((x) => Math.max(x.T.um, x.P.um))))} mm. L43 (1 mm): 2 jumps on each reading; L44 (6 mm): glided.`,
    note: "P2 changes where the step is, not its size; the spec names 'a depth for flush' in the noise family but no event for the band between." });
}
// F11 — slopes
{
  const sh = ["L26", "L27", "L30", "L31", "L45", "L46"].map((k) => LIB.find((d) => d.name.startsWith(k))).filter(Boolean) as A[];
  F.push({ id: "F11", kind: "(v)", rule: "C31 / C37 / WS22 (a floor = a group within 20°, at its centre's level; beyond 20° in no group)", title: "ON A SLOPE TODAY'S POINT LANDS THE CENTRE (the uphill half enters); P2 lands the uphill edge. Beyond the 20° merge today's gizmo leaves the floor",
    shapes: sh.map((d) => d.name.split(" ")[0]), numbers: sh.map((d) => { const g = libAgg(d, "A"); return `${d.name.split(" ")[0]}: T enters ${g.T.e} (max ${f1(g.T.em)} mm), air ${g.T.a} (max ${g.T.am >= 9999 ? "∞" : f1(g.T.am)}); P enters ${g.P.e}, air ${g.P.a}`; }).join("; "),
    note: "L45 (8° gable): today 2.9 mm into the slope everywhere = half-width x tan 8°; L31 (35° ramp): today's gizmo bridged across the ramp, the piece up to 55 mm over it; P2 exact on both." });
}
// F12 — exposure and coverage
{
  const ex = LIB.filter((d) => d.exposure && Math.abs(d.exposure.today - d.exposure.s22) > Math.max(20, 0.02 * d.exposure.s22));
  const cv = LIB.filter((d) => d.coverage && d.coverage.total > 0).map((d) => ({ n: d.name.split(" ")[0], T: d.coverage.T / d.coverage.total, P: d.coverage.P / d.coverage.total, nf: d.coverage.why.noFacet / d.coverage.total, hid: d.coverage.why.hidden / d.coverage.total }));
  const low = cv.filter((x) => x.P < 0.85).map((x) => `${x.n} ${Math.round(100 * x.P)}% (hidden ${Math.round(100 * x.hid)}%, no facet ${Math.round(100 * x.nf)}%)`);
  const dif = cv.filter((x) => Math.abs(x.T - x.P) > 0.005).map((x) => `${x.n} T ${Math.round(1000 * x.T) / 10}% P ${Math.round(1000 * x.P) / 10}%`);
  F.push({ id: "F12", kind: "(i) + (iv)", rule: "S22 (exposed = reachable from outside), S24 (nothing unreachable silently), OS3, C12, C25, C26, C27", title: "TODAY COUNTS SEALED AND BURIED FACES AS SURFACE; THE FACES THAT ARE NO PLACE ARE THE SAME CLASSES IN BOTH READINGS (undersides, inner walls, walls facing no facet)",
    shapes: ex.map((d) => d.name.split(" ")[0]), numbers: `exposure differs on ${ex.length} shapes: ${ex.map((d) => `${d.name.split(" ")[0]} today ${d.exposure.today} vs S22 ${d.exposure.s22} cm²`).join("; ")}. Coverage under 85% of the S22-exposed area: ${low.join("; ") || "none"}. T and P coverage differ by more than 0.5% on: ${dif.join("; ") || "none"}.`,
    note: "L09's 3 mm gap reads 'sealed' at the flood's 4 mm resolution (the same answer as MAP_GROW's closing). P2's coverage is lower than today's where the piece can only rest ON studs or a rim (the base between studs is never touched) and higher where a footprint hangs past an edge (F9)." });
}
// F13 — goals
{
  const g = LIB.filter((d) => d.goal);
  F.push({ id: "F13", kind: "(i) + (iv)", rule: "S21 (every goal reachable), B4 (withdrawal along the entry), C45 (how a piece enters), S13", title: "THE WITHDRAWAL TEST FINDS THE BLOCKED GOAL; A GOAL ENTERED SIDEWAYS IS NO LANDING OF ANY PRINCIPLE",
    shapes: g.map((d) => d.name.split(" ")[0]), numbers: g.map((d) => `${d.name.split(" ")[0]}: ${goalV(d)}`).join("; "),
    note: "Q07: the peg under the slab is blocked along +y (S21/B4 confirmed: found at the build, not by the player). L05: the block slid in from the channel's open end (+z) — P2 along the front's normal lands at the channel's back wall (−100), 220 mm from the seat (120): a slid entry has no landing; only the approach along +z reaches it, and no rule names that entry." });
}
// F14 — sensitivity
{
  const pairs: string[] = [];
  let flipsT = 0, flipsP = 0, n = 0, ampMax = 0;
  for (const x of SW.filter((y) => y.wf === 0.9)) {
    const y = SW.find((q) => q.sign === x.sign && q.foot === x.foot && q.prof === x.prof && q.dh === x.dh && q.pos === x.pos && q.wf === 1.1);
    if (!y) continue;
    n++;
    const dT = Math.abs(y.centre.T - x.centre.T), dP = Math.abs(y.centre.P - x.centre.P);
    if (dT > 0.5 || x.centre.Tk !== y.centre.Tk) flipsT++;
    if (dP > 0.5 || x.centre.Pk !== y.centre.Pk) flipsP++;
    ampMax = Math.max(ampMax, dT / (y.w - x.w), dP / (y.w - x.w));
  }
  for (const d of LIB) if (d.sens) for (const s of d.sens) pairs.push(`${d.name.split(" ")[0]} ${s.label} ±${s.delta}: T ${s.flipT ? `${s.lo.T}→${s.hi.T} (×${s.ampT})` : "—"} P ${s.flipP ? `${s.lo.P}→${s.hi.P} (×${s.ampP})` : "—"}`);
  F.push({ id: "F14", kind: "(i)", rule: "OS15 (the classes form a continuum); §2.6 (3) persistence; B6 (at a threshold)", title: "A CLASS FLIP AT A RULER MOVES THE GIZMO BY THE FEATURE'S WHOLE DEPTH FOR A MILLIMETRE OF WIDTH, in both readings",
    shapes: lib((d) => !!d.sens), numbers: `sweep, width 0.9 → 1.1 x A (37.2 → 45.4 mm, the same cell otherwise): the reading at the feature's centre flips in ${flipsT} of ${n} today and ${flipsP} of ${n} with P2; the largest move ${f1(ampMax)} mm of gizmo per mm of width. Library rulers: ${pairs.join("; ")}.`,
    note: "Inherent to any ruler; P2 moves the ruler to the true footprint as held (L03 at 41.3: no flip for P2 since 45 binds; B at its heldFoot 40: no flip either reading — B's ruler is 80 for P2, 80 for today too since its second size binds). The margin to a ruler is what B6 would paint." });
}
// F15 — determinism
{
  const ties = lib((d) => d.detTie && Math.max(d.detTie.moved.T, d.detTie.order.T) > 0);
  const brokenT = lib((d) => d.det && (d.det.order.T > 0 || d.det.moved.T > 0 || d.det.order.contour > 0 || d.det.moved.contour > 0));
  const brokenP = lib((d) => d.det && (d.det.order.P > 0 || d.det.moved.P > 0));
  F.push({ id: "F15", kind: "(i) + (iv)", rule: "P4; S12 / S19 (a function of the placed set, not of the order); WS15", title: "P2 IS EXACTLY INVARIANT; TODAY'S DEPTH IS TOO, BUT FOR TIES EXACTLY OVER A WALL AND THE PLANE'S FIRST-FACE LEVEL",
    shapes: [...ties, ...brokenT], numbers: `travels 0.37 mm off the walls' exact places: today differs on ${brokenT.length} shapes (${brokenT.join(", ") || "none"}), P2 on ${brokenP.length}. On the travels as drawn (samples exactly over a wall) today's level differs after a quarter turn on ${ties.length} shapes (${ties.join(", ")}): a point read exactly over a wall takes either level by the rounding (measure zero).`,
    note: "The order dependence is F6's cause (the plane's level is its first face's)." });
}
// F16 — empty and small
F.push({ id: "F16", kind: "(iv)", rule: "C42 / WS25; C24", title: "NOTHING PLACED AND ONE SMALL PART HAVE NO RULE: no box, no map; round a part smaller than the piece every place but its top is 'nothing to land on'",
  shapes: ["L51", "L52"], numbers: (() => { const d = LIB.find((x) => x.name.startsWith("L52")); const g = d ? libAgg(d, "A") : null; return `L51: no map at all (the gizmo held or at the boot centre). L52 (a 30 mm cube, piece A): P2 marks ${g?.P.nothing} of ${g?.P.samples} places nothing to land on; today the gizmo sits on the facets' planes with no part under the piece at ${g?.T.a} places.`; })(),
  note: "" });

F.sort((x, y) => Number(x.id.slice(1)) - Number(y.id.slice(1)));
w();
w("═══ 3. THE FINDINGS, GROUPED BY CAUSE (evidence only — no rule change proposed) ═══");
w("Kinds: (i) a principle confirmed · (ii) a principle that breaks one of the owner's rules · (iii) two rules in conflict · (iv) a case no rule covers ·");
w("       (v) a difference between today's code and the proposal that changes what the player sees.");
for (const f of F) {
  w();
  w(`${f.id} ${f.kind} — ${f.title}`);
  w(`   rule / principle: ${f.rule}`);
  if (f.shapes.length) w(`   shapes: ${f.shapes.join(", ")}`);
  w(`   numbers: ${f.numbers}`);
  if (f.note) w(`   note: ${f.note}`);
}
const txt = out.join("\n") + "\n";
writeFileSync(join(here, "results.txt"), txt);

// ───────────────────── results.json: compact ─────────────────────
const SKT = ["e", "em", "a", "am", "u", "um", "g", "p", "h", "cr", "ct", "cd", "fn20", "fb20", "fb45"];
const SKP = ["e", "a", "u", "um", "g", "p", "n", "cr", "ct", "cd", "fn20", "fb20", "fb45"];
const code = (x: A) => [x.sign[0], x.foot, x.prof.slice(0, 2), x.wf, x.dh, x.pos.slice(0, 2)].join(".");
const compactLib = LIB.map((d) => {
  if (d.empty) return { name: d.name, classes: d.classes, empty: true };
  // per piece, aggregated over the shape's travels (the per-travel detail is in library.json, not committed)
  const lines: Record<string, A> = {};
  for (const pk of [...new Set(Object.values(d.lines).flatMap((v: A) => Object.keys(v)))] as string[]) {
    const g = aggOf(d, pk);
    const c = (x: Agg, R: string) => ({ enter: x.e, enterMax: x.em, air: x.a, airMax: Math.min(x.am, 9999), jumps: x.u, jumpMax: x.um, glides: x.g, path: x.p, ...(R === "T" ? { held: x.h } : { nothing: x.nothing }), reach: Math.round(x.reach.reduce((t, y) => t + y, 0) / Math.max(1, x.reach.length)), trapped: x.trap, drops: x.drops, samples: x.samples, farBump20: x.fb20, farBump45: x.fb45, farBumpSteps20: x.fn20 });
    lines[pk] = { T: c(g.T, "T"), P: c(g.P, "P") };
  }
  return { name: d.name, classes: d.classes, sketch: d.sketch, expect: d.expect, parts: d.parts, travels: Object.keys(d.lines), pieces: lines, far: d.far, exposure: d.exposure, coverage: d.coverage, goal: d.goal, stages: d.stages, det: d.det, detTie: d.detTie, sens: d.sens, capReal: d.capReal };
});
const json = {
  study: "ORBIT_SURFACE.md — the surface study (2026-11-16)", pieces: { A: "41.3x45x48", B: "80x80x40", bar: "20x100x20" }, thresholds: { noise: 0.5, glide: 5, skin: 0.3, shell: 60 },
  library: compactLib,
  sweep: { legend: "id = sign.footprint.profile(2).widthFactor.depth.position(2); T.e/em enter count/max, a/am air, u/um jumps 0.5-5 mm, g glides, p path-dependent places, h held by the mouth's hold, fn20 / fb20 / fb45 far-foot bumps along one travel (steps at 20°, max mm at 20° / 45°), cr close-in reach %, ct trapped ends, cd drops; P.n nothing to land on; centre.Tk: c cast, b bridged, m mouth, p plane, s beside, n none; centre.Pk: 1 contact, 0 nothing", keys: ["id", "cap", "parts", "samples", ...SKT.map((k) => `T.${k}`), ...SKP.map((k) => `P.${k}`), "far.T", "far.P", "far.nT", "far.box", "far.cu", "far.cd", "centre.T", "centre.Tk", "centre.P", "centre.Pk"],
    rows: SW.map((x) => [code(x), x.cap ? 1 : 0, x.parts, x.samples, ...SKT.map((k) => (k === "cr" ? Math.round(x.T[k]) : x.T[k])), ...SKP.map((k) => (k === "cr" ? Math.round(x.P[k]) : x.P[k])), x.far.T, x.far.P, x.far.nT, x.far.box, x.far.cu, x.far.cd, x.centre.T, ({ cast: "c", bridged: "b", mouth: "m", plane: "p", beside: "s", none: "n" } as Record<string, string>)[x.centre.Tk] ?? "?", x.centre.P, x.centre.Pk === "nothing" ? 0 : 1]) },
  findings: F,
};
writeFileSync(join(here, "results.json"), JSON.stringify(json));
console.log(txt.split("═══ 3.")[1] ? "═══ 3." + txt.split("═══ 3.")[1] : txt);
console.log(`results.txt ${txt.length} chars; results.json ${JSON.stringify(json).length} bytes`);
