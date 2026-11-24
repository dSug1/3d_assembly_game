// ⭐⭐ CAN EVERY PART REACH ITS SEAT? — the check of a scene's WAYS IN, for ANY scene's .glb (how to run and read it: SCENE_WORKFLOW.md §8; the
// definition: ORBIT_SURFACE.md §2.5; it is the check B4 of PART_AUTHORING.md §6, run on the exported file; first run on Scene_2 as package S0:
// ORBIT_SURFACE_SCENE2_ENTRIES.md).
// For every part the player places, at its stage of the plan (the placed set = the pre-placed parts and the parts placed before it): the ENTRY SET
// of its goal — the directions along which the part, withdrawn from its seated pose, never sinks into a placed part's UCX_ piece past the game's
// contact tolerance — on the study's sphere (642 samples) plus every face normal (±) of the part's and the placed parts' pieces, the way in the
// scene names and the authored ghosts' plunge axes. Read from the .glb with the game's own engine-free readers (model_catalog.ts, glb_geometry.ts).
// Exact (check_parts_reach_their_seat_geom.ts: a ray against the Minkowski difference, no time step). NOTHING of the game is changed or wired.
//
// Usage (ONE process, one core; Scene_2's 17 parts: about 85 s):
//   npx vite-node scripts/surface/check_parts_reach_their_seat.ts -- <scene.glb> [<plan.json>]
//   (or GLB=<scene.glb> PLAN=<plan.json> in the environment)        exit 0: PASS (warnings allowed) · 1: FAIL · 2: no file given
//   OUT=<folder>   where the results go (default: <os temp>/check_parts_reach_their_seat/<the .glb's name>) — parts_reach_their_seat.json, .txt
//   CAM_M=<metres> the camera distance the skin is converted at (default 1; the skin is mm ON THE GLASS, gestureConfig's collisionSkinMm)
//   SENS=1         also rerun the verdicts at CAM_M 0.3 and 3 (the skin's sensitivity)
//   SELF=1         the self-checks alone (a few seconds, no .glb needed; what a mutant of the geometry must turn red)
//   NOCROSS=1      skip the cross-checks on the file's own pieces (faster; the verdict then says so)
//
// ⭐ THE PLAN FILE IS OPTIONAL. Without it the .glb says everything: the ORDER is the file's (`step`, then the id; a frozen part is pre-placed), and
// each part's WAY IN is found from its seat markers (below, `wayIn`). A plan file (JSON) overrides either:
//   { "order": ["P02", "P03", …],                                        the placeable parts in the order to check (every one, once)
//     "parts": { "P03": { "marker": "MC_P03_rest", "says": "down its bore" } } }   per part: the seat marker whose normal is the way in; the plan's words
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { glbJson, readModelCatalog } from "../../src/core/model_catalog";
import { apply, glbBin, partGeometry } from "../../src/core/glb_geometry";
import { gapBetween } from "../../src/core/collision_shape";
import { DEFAULT_CONFIG } from "../../src/input/gestureConfig";
import { trackingMetresPerPx } from "../../src/input/translate";
import { mmToPx } from "../../src/core/units";
import { ENTRY_SPHERE_N } from "../probes/surface_study/checks";
import { type Pair, type Piece, type V, angleBetween, blocked, deg, depthAt, entrySet, makePair, makePairSat, makePiece, mouthAlong, normalDirs, sphere, unit } from "./check_parts_reach_their_seat_geom";
import { selfChecks } from "./check_parts_reach_their_seat_selfcheck";
import { wayIn, type WayIn } from "./check_parts_reach_their_seat_way";

const t0 = Date.now();
const argv = process.argv.slice(2);
const GLB = argv[0] ?? process.env.GLB ?? "";
const PLAN_PATH = argv[1] ?? process.env.PLAN ?? "";
if (!process.env.SELF && GLB === "") {
  console.error("usage: npx vite-node scripts/surface/check_parts_reach_their_seat.ts -- <scene.glb> [<plan.json>]   (SELF=1: the self-checks alone)");
  process.exit(2);
}

// ─── the self-checks first (known answers; the study's own answers)
const self = selfChecks();
const selfOk = self.every((s) => s.ok);
if (process.env.SELF) {
  for (const s of self) console.log(`${s.ok ? "ok  " : "FAIL"} ${s.name}: expected [${s.expected}] got [${s.got}]`);
  process.exit(selfOk ? 0 : 1);
}

const OUT = process.env.OUT ?? join(tmpdir(), "check_parts_reach_their_seat", basename(GLB).replace(/\.glb$/i, ""));
mkdirSync(OUT, { recursive: true });

// ─── the contact tolerance: ONE home, gestureConfig's collisionSkinMm (mm on the glass), converted as the game does (collision_wiring.ts `skinM`)
// at a stated camera distance, Babylon's default fov 0.8 rad and a phone's viewport 844 CSS px high — the skin is a world length only once a camera is named
const FOV = 0.8, VIEW_H = 844;
const skinAt = (camM: number) => mmToPx(DEFAULT_CONFIG.collisionSkinMm) * trackingMetresPerPx(camM, FOV, VIEW_H) * 1000;
const CAM_M = Number(process.env.CAM_M ?? 1);
const SKIN = skinAt(CAM_M);

// ⚠ THE CHECK's OWN THRESHOLDS — the study's, NOT decided game constants (the owner's word on NARROW and BESIDE is owed with B4):
// ─── a NARROW set: its widest opening (the inscribed cap's angular radius) under this
const NARROW_DEG = 10;
// ─── a placed piece is BESIDE the withdrawal when it comes within this of the part's swept volume (the pre-insertion pose, `mouthAlong`)
// — larger than the fits met so far (a piston's 2.8 mm), smaller than a part
const BESIDE_MM = 10;
// ─── a ghost's authored plunge against the computed one: a difference over this is a warning
const GHOST_MM = 1;
// ─── a SEAT PAIR: PAIR_MM, PAIR_DEG — `check_parts_reach_their_seat_way.ts`
const mouth = (part: Piece[], placed: Piece[], d: V) => mouthAlong(part, placed, d, BESIDE_MM, gapBetween);

// ─── the plan file (optional)
interface PlanFile { order?: string[]; parts?: Record<string, { marker?: string; says?: string }> }
const PLAN: PlanFile = PLAN_PATH === "" ? {} : (JSON.parse(readFileSync(PLAN_PATH, "utf8")) as PlanFile);

// ─── read the model
const bytes = new Uint8Array(readFileSync(GLB));
const parsed = glbJson(bytes);
if (!("json" in parsed)) throw new Error(`the .glb: ${parsed.refusal}`);
const cat = readModelCatalog(parsed.json);
if (cat.catalog === null) throw new Error(`the catalogue refused: ${cat.refusals.join("; ")}`);
const catalog = cat.catalog;
const MM = catalog.unitM * 1000; // reference units → mm
const geo = partGeometry(parsed.json, glbBin(bytes), catalog);
const piecesOf = new Map<string, Piece[]>();
for (const g of geo) {
  piecesOf.set(g.id, g.pieces.map((pts, k) => makePiece(g.id, `ucx${k}`, pts.map((p) => { const w = apply(g.goal, p); return [w[0] * MM, w[1] * MM, w[2] * MM] as V; }))));
}

// ─── THE STAGES: the pre-placed parts (frozen) are placed from the start; every other part is checked against them and against the parts before it
// in the order — the file's (`catalog.parts`: step, then id) or the plan file's. Each placement is its own stage, parts of one step included.
const anchors = catalog.parts.filter((p) => p.frozen);
let placeable = catalog.parts.filter((p) => !p.frozen);
if (PLAN.order) {
  const byId = new Map(placeable.map((p) => [p.id, p]));
  const unknown = PLAN.order.filter((id) => !byId.has(id));
  const missing = placeable.filter((p) => !PLAN.order!.includes(p.id)).map((p) => p.id);
  if (unknown.length || missing.length || new Set(PLAN.order).size !== PLAN.order.length) {
    throw new Error(`the plan file's order must name every placeable part once — unknown: ${unknown.join(" ") || "-"}; missing: ${missing.join(" ") || "-"}`);
  }
  placeable = PLAN.order.map((id) => byId.get(id)!);
}
for (const id of Object.keys(PLAN.parts ?? {})) if (!placeable.some((p) => p.id === id)) throw new Error(`the plan file names ${id}: not a placeable part of this file`);
if (placeable.length === 0) throw new Error("no placeable part in this file: nothing to check");
const stages = placeable.map((part, i) => ({ part, placedParts: [...anchors, ...placeable.slice(0, i)] }));

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const fmtV = (v: readonly number[]) => `(${v.map((x) => (Math.abs(x) < 5e-4 ? 0 : x).toFixed(3)).join(", ")})`;
const minus = (v: readonly number[]): V => [-v[0]!, -v[1]!, -v[2]!];

// ─── each pair's obstacle built once (the cross-checks and every run share it)
const pairCache = new Map<string, Pair>();
const pairOf = (a: Piece, b: Piece): Pair => {
  const k = `${a.owner}/${a.label}|${b.owner}/${b.label}`;
  let P = pairCache.get(k);
  if (P === undefined) { P = makePair(a, b); pairCache.set(k, P); }
  return P;
};

// ─── ⭐ THE WAY IN A SCENE NAMES FOR A PART — `check_parts_reach_their_seat_way.ts` (moved 2026-11-24, S8: the landing check reads the same)

// ─── the second implementation of the pair obstacle, and the game's GJK at the seat, on this file's real pieces
function crossChecks() {
  let pairs = 0, compared = 0, depthDiff = 0, verdictDiff = 0, gjkDisagree = 0, dirs = 0, signDiff = 0;
  const sph = sphere(60);
  for (const { part, placedParts } of stages) {
    const mine = piecesOf.get(part.id)!;
    const placed = placedParts.flatMap((p) => piecesOf.get(p.id)!);
    for (const a of mine) for (const b of placed) {
      const P = pairOf(a, b);
      // the game's GJK (collision_shape.ts gapBetween): apart (> 1 µm) exactly when the depth at the seat is negative
      const gap = gapBetween(b.pts, a.pts);
      if (gap !== null && (gap > 1e-3) !== (P.depth0 < -1e-3) && Math.abs(P.depth0) > 1e-3) gjkDisagree++;
      // the SAT construction on every pair the part TOUCHES at its seat (the hard ones), and on every 7th other one
      if (!(P.depth0 > -SKIN) && (pairs % 7 !== 0)) { pairs++; continue; }
      const S = makePairSat(a, b);
      compared++;
      for (const d of sph) {
        dirs++;
        if (blocked(P, d, SKIN) !== blocked(S, d, SKIN)) verdictDiff++;
        // the depth is compared where it is one (inside M: the distance to its boundary, the same for any exact set of planes); outside, the min
        // over the planes depends on which supporting planes a construction keeps (near a sharp corner of M), so only the SIGN is compared there
        for (const t of [0, 1, 5, 25]) {
          const x: V = [d[0] * t, d[1] * t, d[2] * t];
          const dp = depthAt(P, x), ds = depthAt(S, x);
          if (dp > 1e-6 && ds > 1e-6) depthDiff = Math.max(depthDiff, Math.abs(ds - dp));
          else if ((dp > 1e-6) !== (ds > 1e-6) && Math.abs(dp - ds) > 1e-6) signDiff++;
        }
      }
      pairs++;
    }
  }
  return { pairs, compared, dirsCompared: dirs, maxDepthDiffMm: depthDiff, verdictDiff, insideOutsideDiff: signDiff, gjkDisagree };
}

// ─── the run
interface Row {
  id: string; node: string; step: number; placed: string[]; pieces: number; pairs: number;
  sharePct: number; freeSamples: number; widestDeg: number; narrowestDeg: number; regions: { members: number; openingDeg: number; centre: string; exactOnly: boolean }[];
  flag: "EMPTY" | "NARROW" | "open";
  freeExact: { d: string; openingDeg: number; contactEndMm: number; mouthMm: number | null; preInsertion: string | null }[];
  plan: {
    says: string; withdrawal: string; free: boolean; blockers: string[]; openingDeg: number; contactEndMm: number; mouthMm: number | null; mouthBy: string; nearestFreeDeg: number | null;
    /** how the way in was found (`wayIn`), its marker, and the other candidates when several seats are unnamed */
    how: WayIn["how"]; marker: string; others: { marker: string; withdrawal: string; free: boolean; blockers: string[] }[];
  };
  ghosts: { node: string; on: string; withdrawal: string; authoredMm: number; free: boolean; mouthMm: number | null; mouthBy: string; diffMm: number | null; blockers: string[] }[];
  ghostsWithoutPlunge: string[];
  seatContacts: string[]; seatGapMm: number; markerBehindUcxMm: number | null; seatOverlaps: { pair: string; depthMm: number }[];
  /** ⭐ THE CONTROL (a check never seen failing is not trusted): the part pushed PAST its seat along its way in must read BLOCKED */
  control: "BLOCKED" | "free" | null;
}

function runAll(skin: number): Row[] {
  const rows: Row[] = [];
  stages.forEach(({ part, placedParts }, i) => {
    const placedIds = placedParts.map((p) => p.id);
    const mine = piecesOf.get(part.id)!;
    const placed = placedIds.flatMap((id) => piecesOf.get(id)!);
    const ghosts = catalog.parts.flatMap((host) => host.ghosts.filter((g) => g.forPart === part.id).map((g) => ({ g, host: host.id })));
    const way = wayIn(part, placedParts, ghosts, PLAN.parts?.[part.id], MM);
    const planDirs = way.markers.map((m) => ({ label: "plan", d: unit(minus(m.normal)) }));
    const plunges = ghosts.filter((x) => x.g.plunge);
    const exactDirs = [
      ...planDirs,
      ...plunges.map((x) => ({ label: `ghost ${x.g.node}`, d: unit(minus(x.g.plunge!.axis)) })),
      ...normalDirs([...mine, ...placed]).map((d) => ({ label: "normal", d })),
    ];
    const tp = Date.now();
    const r = entrySet(mine, placed, exactDirs, skin, ENTRY_SPHERE_N, pairOf);
    if (process.env.PROGRESS) console.error(`${part.id}: ${mine.length * placed.length} pairs, ${exactDirs.length} exact directions, ${Date.now() - tp} ms`);
    const planEs = r.exact.slice(0, planDirs.length);
    const ghostEs = r.exact.slice(planDirs.length, planDirs.length + plunges.length);
    // the way in reported: the named one; of several unnamed seats, the first free one (else the first)
    const pi = Math.max(0, planEs.findIndex((e) => e.free));
    const planE = planEs[pi];
    const marker = way.markers[pi];
    const planD = planE?.d;
    const freeExact = r.exact.filter((e) => e.free && e.label === "normal");
    // the distinct free exact directions (a normal shared by several pieces counted once)
    const seen: V[] = [];
    // (1e-4 rad: the file's float32 normals of one plane differ by more than 1e-6)
    const fx = freeExact.filter((e) => { if (seen.some((s) => angleBetween(s, e.d) < 1e-4)) return false; seen.push(e.d); return true; });
    // nothing within the skin at the seat: how far the nearest placed piece is (the game's GJK)
    const seatGap = r.seatContacts.length ? 0 : Math.min(...mine.flatMap((a) => placed.map((b) => gapBetween(a.pts, b.pts) ?? Infinity)));
    // the part's own seat marker against its collision pieces' rearmost point along the way in's withdrawal (mm; > 0: the marker lies behind them)
    let markerBehindUcxMm: number | null = null;
    if (planD && marker) {
      let rear = Infinity;
      for (const a of mine) for (const q of a.pts) rear = Math.min(rear, q[0] * planD[0] + q[1] * planD[1] + q[2] * planD[2]);
      markerBehindUcxMm = r1(rear - (marker.position[0] * planD[0] + marker.position[1] * planD[1] + marker.position[2] * planD[2]) * MM);
    }
    const allFree = [...r.exact.filter((e) => e.free).map((e) => e.d)];
    const narrow = r.regions.length > 0 && r.widestDeg < NARROW_DEG;
    const planM = planE?.free ? mouth(mine, placed, planD!) : null;
    const nearestFree = !planE ? null : planE.free ? 0 : allFree.length ? Math.min(...allFree.map((d) => deg(angleBetween(d, planD!)))) : null;
    // the control: pushed past its seat (the way in itself, continued), some pair must refuse it
    const pushed = planD ? minus(planD) : null;
    const control = pushed === null ? null : mine.some((a) => placed.some((b) => blocked(pairOf(a, b), pushed, skin))) ? "BLOCKED" : "free";
    rows.push({
      id: part.id, node: part.node, step: i + 1, placed: placedIds, pieces: mine.length, pairs: mine.length * placed.length,
      sharePct: r2(r.sharePct), freeSamples: r.freeSamples, widestDeg: r1(r.widestDeg), narrowestDeg: r1(r.narrowestDeg),
      regions: r.regions.map((g) => ({ members: g.members, openingDeg: r1(g.openingDeg), centre: fmtV(g.centre), exactOnly: g.exactOnly })),
      flag: r.regions.length === 0 ? "EMPTY" : narrow ? "NARROW" : "open",
      freeExact: fx.map((e) => {
        // the pre-insertion pose, computed where the set is NARROW (§2.5: the ghost only there)
        if (!narrow) return { d: fmtV(e.d), openingDeg: r1(e.openingDeg), contactEndMm: r1(e.clearMm), mouthMm: null, preInsertion: null };
        const m = mouth(mine, placed, e.d);
        const p0 = geo.find((x) => x.id === part.id)!.goal.position;
        const pre = [p0[0] + (e.d[0] * m.mm) / MM, p0[1] + (e.d[1] * m.mm) / MM, p0[2] + (e.d[2] * m.mm) / MM];
        return { d: fmtV(e.d), openingDeg: r1(e.openingDeg), contactEndMm: r1(e.clearMm), mouthMm: r1(m.mm), preInsertion: `origin at ${fmtV(pre)} units (beyond ${m.decisive || "nothing"})` };
      }),
      plan: planE
        ? {
          says: way.says, withdrawal: fmtV(planD!), free: planE.free, blockers: planE.blockers, openingDeg: r1(planE.openingDeg), contactEndMm: r1(planE.clearMm), mouthMm: planM ? r1(planM.mm) : null, mouthBy: planM?.decisive ?? "", nearestFreeDeg: nearestFree === null ? null : r1(nearestFree),
          how: way.how, marker: marker!.node,
          others: planEs.map((e, k) => ({ marker: way.markers[k]!.node, withdrawal: fmtV(e.d), free: e.free, blockers: e.blockers })).filter((_, k) => k !== pi),
        }
        : { says: way.says, withdrawal: "", free: false, blockers: [], openingDeg: 0, contactEndMm: NaN, mouthMm: null, mouthBy: "", nearestFreeDeg: null, how: way.how, marker: "", others: [] },
      ghosts: plunges.map((x, k) => {
        const e = ghostEs[k]!;
        const authored = x.g.plunge!.depth * MM;
        const m = e.free ? mouth(mine, placed, e.d) : null;
        return { node: x.g.node, on: x.host, withdrawal: fmtV(e.d), authoredMm: r1(authored), free: e.free, mouthMm: m ? r1(m.mm) : null, mouthBy: m?.decisive ?? "", diffMm: m ? r1(m.mm - authored) : null, blockers: e.blockers };
      }),
      ghostsWithoutPlunge: ghosts.filter((x) => !x.g.plunge).map((x) => `${x.g.node} (on ${x.host})`),
      seatContacts: r.seatContacts, seatGapMm: r1(seatGap), markerBehindUcxMm, seatOverlaps: r.seatOverlaps.map((o) => ({ pair: o.pair, depthMm: r2(o.depthMm) })),
      control,
    });
  });
  return rows;
}

// ─── ⭐ THE VERDICT (SCENE_WORKFLOW.md §8.4). FAIL: a goal SHUT (PART_AUTHORING.md §6.2: B4 fails when the set is empty); a way in the scene NAMES
// blocked (SCENE_WORKFLOW.md §2.3 rule 2: the way in not closed by a part placed before) — the plan file's, a ghost's plunge, the part's one seat —
// or every one of several unnamed seats blocked; the check's own self-checks or cross-checks failing. Everything else is a WARNING for the owner's
// look: a NARROW set (it needs the ghost and the plunge), a ghost off the computed pose, a seat that overlaps or floats, a way in not named.
interface Finding { level: "FAIL" | "WARN"; part: string; text: string }
function judge(rows: Row[], cross: ReturnType<typeof crossChecks> | null): Finding[] {
  const f: Finding[] = [];
  const add = (level: Finding["level"], part: string, text: string) => f.push({ level, part, text });
  if (!selfOk) add("FAIL", "-", "the check's own self-checks failed: nothing below is trusted");
  if (cross === null) add("WARN", "-", "the cross-checks on this file's pieces were skipped (NOCROSS)");
  else if (cross.verdictDiff || cross.insideOutsideDiff || cross.gjkDisagree) add("FAIL", "-", `the check's two constructions disagree on this file's pieces (verdicts ${cross.verdictDiff}, inside/outside ${cross.insideOutsideDiff}, the game's GJK ${cross.gjkDisagree}): nothing below is trusted`);
  if (anchors.length === 0) add("WARN", "-", "no pre-placed (frozen) part in the file: the first part is checked against nothing (SCENE_WORKFLOW.md §2.3 rule 9 asks for an anchor)");
  for (const r of rows) {
    const named = r.plan.how === "plan file" || r.plan.how === "ghost" || r.plan.how === "seat";
    if (r.pieces === 0) { add("FAIL", r.id, "no collision piece (UCX_) read for it: not checked"); continue; }
    if (r.flag === "EMPTY") add("FAIL", r.id, `SHUT — no direction out of its seat is free once ${r.placed.join(" ")} are placed${r.plan.blockers.length ? ` (its way in is blocked by ${r.plan.blockers.join(" ")})` : ""}`);
    else if (named && !r.plan.free) add("FAIL", r.id, `its way in is BLOCKED by ${r.plan.blockers.join(" ")} — ${r.plan.says}; withdrawal ${r.plan.withdrawal}; the nearest free direction is ${r.plan.nearestFreeDeg}° away`);
    else if (r.plan.how === "seats" && !r.plan.free) add("FAIL", r.id, `every one of its seats' directions is BLOCKED — ${r.plan.says}`);
    else if (r.plan.how === "seats") add("WARN", r.id, `its way in is not named — ${r.plan.says}; ${r.plan.marker} is free${r.plan.others.some((o) => !o.free) ? `, blocked: ${r.plan.others.filter((o) => !o.free).map((o) => o.marker).join(" ")}` : ""}: name one in the plan file`);
    else if (r.plan.how === "none") add("WARN", r.id, `${r.plan.says} (its entry set is ${r.flag}, ${r.sharePct} % of the sphere)`);
    for (const g of r.ghosts) {
      if (!g.free) add("FAIL", r.id, `the plunge of its ghost ${g.node} (on ${g.on}) is BLOCKED by ${g.blockers.join(" ")}`);
      else if (g.diffMm !== null && Math.abs(g.diffMm) > GHOST_MM) add("WARN", r.id, `its ghost ${g.node} plunges ${g.authoredMm} mm; the collision pieces clear what they pass after ${g.mouthMm} mm (${g.diffMm > 0 ? "+" : ""}${g.diffMm} mm)`);
    }
    if (r.flag === "NARROW") add("WARN", r.id, `NARROW — it enters only within ${r.widestDeg}° of its axis: it needs a ghost at the opening and the plunge${r.ghosts.length ? "" : " — ⚠ NO ghost with a plunge is authored for it"}`);
    else if (r.flag === "open" && r.plan.free && r.plan.openingDeg < NARROW_DEG) add("WARN", r.id, `its way in is free, but only ${r.plan.openingDeg}° from a blocked direction`);
    for (const o of r.seatOverlaps) add("WARN", r.id, `at its seat it sits ${o.depthMm} mm INSIDE a placed piece (${o.pair}), deeper than the contact tolerance`);
    if (r.placed.length > 0 && r.seatContacts.length === 0) add("WARN", r.id, `at its seat it touches no placed part (the nearest is ${r.seatGapMm} mm away)`);
    if (r.control === "free") add("WARN", r.id, "CONTROL: pushed past its seat along its way in, it meets nothing — a through opening, or the check does not see this seat");
  }
  return f;
}

const tc = Date.now();
const cross = process.env.NOCROSS ? null : crossChecks();
if (process.env.PROGRESS) console.error(`cross-checks ${Date.now() - tc} ms`);
const tCross = Date.now() - tc;
const tm = Date.now();
const rows = runAll(SKIN);
const tMain = Date.now() - tm;
const sens: Record<string, { skinMm: number; rows: { id: string; sharePct: number; flag: string; widestDeg: number; planFree: boolean; freeExact: number }[] }> = {};
if (process.env.SENS) for (const cam of [0.3, 3]) {
  const s = skinAt(cam);
  sens[`camera ${cam} m`] = { skinMm: r2(s), rows: runAll(s).map((x) => ({ id: x.id, sharePct: x.sharePct, flag: x.flag, widestDeg: x.widestDeg, planFree: x.plan.free, freeExact: x.freeExact.length })) };
}
const findings = judge(rows, cross);
const fails = findings.filter((x) => x.level === "FAIL"), warns = findings.filter((x) => x.level === "WARN");
const controls = rows.filter((r) => r.control !== null);
const NOT_CHECKED = [
  "whether the GIZMO can bring the part to where its way in starts — read by check_where_each_part_lands.ts (B4's second half, S8)",
  "the DRAWN meshes: only the UCX_ collision pieces are read (whether they follow the drawn part is B1)",
  "ways in that need a TURN: straight withdrawals only, the part at its goal's orientation",
  "other ORDERS than the one run (a plan file's `order` runs another)",
  "the floor and the play volume: only placed parts block",
];

// ─── the outputs (no timing in the JSON: two runs must be byte-identical)
const cx = cross ?? { pairs: 0, compared: 0, dirsCompared: 0, maxDepthDiffMm: 0, verdictDiff: 0, insideOutsideDiff: 0, gjkDisagree: 0 };
const result = {
  model: GLB, planFile: PLAN_PATH === "" ? null : PLAN_PATH, unitM: catalog.unitM, sphere: ENTRY_SPHERE_N, narrowDeg: NARROW_DEG, besideMm: BESIDE_MM, ghostMm: GHOST_MM,
  skin: { onGlassMm: DEFAULT_CONFIG.collisionSkinMm, cameraM: CAM_M, fovRad: FOV, viewportPx: VIEW_H, worldMm: r2(SKIN) },
  anchors: anchors.map((p) => p.id), order: placeable.map((p) => p.id),
  selfChecks: self, crossChecks: { ...cx, maxDepthDiffMm: Number(cx.maxDepthDiffMm.toExponential(2)), skipped: cross === null }, rows, sensitivity: sens,
  verdict: { pass: fails.length === 0, failures: fails.length, warnings: warns.length, controlsBlocked: controls.filter((r) => r.control === "BLOCKED").length, controls: controls.length, findings, notChecked: NOT_CHECKED },
};
writeFileSync(join(OUT, "parts_reach_their_seat.json"), JSON.stringify(result, null, 1));
const L: string[] = [];
const w = (s: string) => L.push(s);
w(`Can every part reach its seat? — ${GLB}${PLAN_PATH === "" ? "" : ` with the plan file ${PLAN_PATH}`}: ${placeable.length} parts to place, ${anchors.length} pre-placed (${anchors.map((p) => p.id).join(" ") || "none"}); ${ENTRY_SPHERE_N} samples + exact normals; skin ${r2(SKIN)} mm in the world (${DEFAULT_CONFIG.collisionSkinMm} mm on the glass at ${CAM_M} m); NARROW < ${NARROW_DEG}°`);
w(`self-checks: ${self.filter((s) => s.ok).length}/${self.length} passed`);
for (const s of self) w(`  ${s.ok ? "ok  " : "FAIL"} ${s.name}: expected [${s.expected}] got [${s.got}]`);
w(cross === null
  ? "cross-checks on the real pieces: SKIPPED (NOCROSS)"
  : `cross-checks on the real pieces: ${cx.pairs} pairs at the seats (the game's GJK on every one), ${cx.compared} of them against the SAT construction in ${cx.dirsCompared} pair-directions × 4 points — verdicts differing ${cx.verdictDiff}, points inside one and outside the other ${cx.insideOutsideDiff}, largest depth difference inside ${cx.maxDepthDiffMm.toExponential(2)} mm; the game's GJK disagreeing on apart/touching at the seat: ${cx.gjkDisagree}`);
w("");
w("part  stage placed  share%  widest° narrowest° regions flag    way in (withdrawal)                        free?  mouth mm  ghosts (authored plunge vs computed mouth, mm)");
for (const r of rows) {
  const gh = r.ghosts.map((g) => `${g.node}: ${g.authoredMm} vs ${g.free ? g.mouthMm : "BLOCKED"}${g.diffMm !== null ? ` (${g.diffMm > 0 ? "+" : ""}${g.diffMm})` : ""}`).join("; ") || "-";
  const way = r.plan.how === "none" ? "not named" : r.plan.free ? "free   " : `BLOCKED by ${r.plan.blockers.join(",")} (nearest free ${r.plan.nearestFreeDeg}°)`;
  w(`${r.id}   ${String(r.step).padStart(2)}    ${String(r.placed.length).padStart(2)}   ${r.sharePct.toFixed(2).padStart(6)}  ${r.widestDeg.toFixed(1).padStart(6)}  ${r.narrowestDeg.toFixed(1).padStart(6)}    ${String(r.regions.length).padStart(3)}   ${r.flag.padEnd(6)}  ${r.plan.withdrawal.padEnd(26)} ${way} ${r.plan.free ? String(r.plan.mouthMm).padStart(7) : ""}  ${gh}`);
}
w("");
for (const r of rows) {
  w(`${r.id} ${r.node} — stage ${r.step}, placed ${r.placed.join(" ") || "nothing"}; ${r.pieces} pieces, ${r.pairs} pairs; touching at the seat: ${r.seatContacts.join(" ") || `nothing (the nearest placed piece ${r.seatGapMm} mm away)`}${r.markerBehindUcxMm === null ? "" : `; its seat marker ${r.markerBehindUcxMm} mm before its collision pieces' rearmost point along the withdrawal`}${r.seatOverlaps.length ? `; OVERLAPPING past the skin: ${r.seatOverlaps.map((o) => `${o.pair} ${o.depthMm} mm`).join(", ")}` : ""}`);
  w(`   regions: ${r.regions.map((g) => `${g.openingDeg}° at ${g.centre}${g.exactOnly ? " (exact only)" : ""} [${g.members}]`).join("; ") || "none"}`);
  w(`   way in (${r.plan.how}${r.plan.marker ? `, ${r.plan.marker}` : ""}): ${r.plan.says}${r.plan.how === "none" ? "" : `; withdrawal ${r.plan.withdrawal} ${r.plan.free ? `free, opening ${r.plan.openingDeg}°, out of contact after ${r.plan.contactEndMm} mm, beyond what it passes after ${r.plan.mouthMm} mm (${r.plan.mouthBy || "nothing beside"})` : `BLOCKED by ${r.plan.blockers.join(" ")}`}`}${r.plan.others.length ? `; the other seats: ${r.plan.others.map((o) => `${o.marker} ${o.withdrawal} ${o.free ? "free" : `BLOCKED by ${o.blockers.join(" ")}`}`).join("; ")}` : ""}`);
  if (r.control !== null) w(`   control (pushed past its seat): ${r.control}`);
  w(`   free exact normals (${r.freeExact.length}): ${r.freeExact.slice(0, 12).map((e) => `${e.d} open ${e.openingDeg}°`).join("; ") || "none"}${r.freeExact.length > 12 ? " …" : ""}`);
  if (r.flag === "NARROW") w(`   pre-insertion poses (the part's origin, scene frame): ${r.freeExact.map((e) => `${e.d} → ${e.preInsertion}`).join("; ")}`);
  if (r.ghostsWithoutPlunge.length) w(`   ghosts without a plunge (bridges, no pose to compare): ${r.ghostsWithoutPlunge.join(", ")}`);
}
for (const [k, v] of Object.entries(sens)) {
  w("");
  w(`sensitivity — ${k} (skin ${v.skinMm} mm): ${v.rows.map((x) => `${x.id} ${x.sharePct}% ${x.flag} ${x.widestDeg}° way in ${x.planFree ? "free" : "BLOCKED"} n${x.freeExact}`).join(" | ")}`);
}
w("");
w(`VERDICT — ${fails.length === 0 ? "PASS" : "FAIL"}: ${rows.length} parts checked; ${fails.length} failure${fails.length === 1 ? "" : "s"}, ${warns.length} warning${warns.length === 1 ? "" : "s"}; controls ${result.verdict.controlsBlocked}/${controls.length} read BLOCKED (each part pushed past its seat)`);
for (const x of fails) w(`  FAIL  ${x.part}: ${x.text}`);
for (const x of warns) w(`  WARN  ${x.part}: ${x.text}`);
w("  NOT CHECKED by this script:");
for (const s of NOT_CHECKED) w(`    - ${s}`);
writeFileSync(join(OUT, "parts_reach_their_seat.txt"), L.join("\n") + "\n");
console.log(L.join("\n"));
console.log(`\nwritten: ${join(OUT, "parts_reach_their_seat.json")}, .txt — cross-checks ${tCross} ms, main ${tMain} ms, total ${Date.now() - t0} ms`);
if (fails.length > 0) process.exit(1);
