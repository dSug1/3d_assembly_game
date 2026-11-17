// ⭐⭐ PACKAGE S0 — THE ENTRY-SET CHECK ON Scene_2's REAL COLLISION PIECES (ORBIT_SURFACE_BUILD.md §5; the definition: ORBIT_SURFACE.md §2.5, B4).
// For every part of Scene_2 with a goal, at its stage of the plan (the placed set = the parts before it in the plan's main order): the directions
// along which the part, withdrawn from its seated pose, never sinks into a placed part's UCX_ piece past the game's contact tolerance — the study's
// sphere (642) plus every face normal (±) of the part's and the placed parts' pieces, the plan's way in and the authored ghosts' plunge axes.
// Read from the .glb with the game's own engine-free readers (model_catalog.ts, glb_geometry.ts). Exact (entry_geom.ts: a ray against the Minkowski
// difference, no time step). NOTHING of the game is changed or wired.
//
// Usage (ONE process, one core): npx vite-node scripts/surface/scene2_entries.ts
//   OUT=<folder>   where the results go (default: <os temp>/scene2_entries) — scene2_entries.json, scene2_entries.txt
//   CAM_M=<metres> the camera distance the skin is converted at (default 1; the skin is mm ON THE GLASS, gestureConfig's collisionSkinMm)
//   SENS=1         also rerun the verdicts at CAM_M 0.3 and 3 (the skin's sensitivity)
//   SELF=1         the self-checks alone (a few seconds; what a mutant of entry_geom.ts must turn red)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { glbJson, readModelCatalog } from "../../src/core/model_catalog";
import { apply, glbBin, partGeometry } from "../../src/core/glb_geometry";
import { gapBetween } from "../../src/core/collision_shape";
import { DEFAULT_CONFIG } from "../../src/input/gestureConfig";
import { trackingMetresPerPx } from "../../src/input/translate";
import { mmToPx } from "../../src/core/units";
import { ENTRY_SPHERE_N } from "../probes/surface_study/checks";
import { type Pair, type Piece, type V, angleBetween, deg, depthAt, entrySet, makePair, makePairSat, makePiece, mouthAlong, normalDirs, blocked, sphere, unit } from "./entry_geom";
import { selfChecks } from "./entry_selfcheck";

const t0 = Date.now();
const OUT = process.env.OUT ?? join(tmpdir(), "scene2_entries");
mkdirSync(OUT, { recursive: true });
const GLB = "Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb";

// ─── the contact tolerance: ONE home, gestureConfig's collisionSkinMm (mm on the glass), converted as the game does (collision_wiring.ts `skinM`)
// at a stated camera distance, Babylon's default fov 0.8 rad and a phone's viewport 844 CSS px high — the skin is a world length only once a camera is named
const FOV = 0.8, VIEW_H = 844;
const skinAt = (camM: number) => mmToPx(DEFAULT_CONFIG.collisionSkinMm) * trackingMetresPerPx(camM, FOV, VIEW_H) * 1000;
const CAM_M = Number(process.env.CAM_M ?? 1);
const SKIN = skinAt(CAM_M);

// ─── a NARROW set: its widest opening (the inscribed cap's angular radius) under this — the study's threshold, NOT a decided game constant
const NARROW_DEG = 10;
// ─── a placed piece is BESIDE the withdrawal when it comes within this of the part's swept volume (the pre-insertion pose, entry_geom.ts mouthAlong)
// — the study's, NOT a game constant: larger than the fits here (a piston's 2.8 mm), smaller than a part
const BESIDE_MM = 10;
const mouth = (part: Piece[], placed: Piece[], d: V) => mouthAlong(part, placed, d, BESIDE_MM, gapBetween);

// ─── the plan's main order (SCENE_2_ASSEMBLY.md §2.3: the steps 1 – 16 = E02 … E17, the plinth pre-placed) and each part's WAY IN as the plan states
// it — expressed by the part's own seat marker toward its host (the withdrawal = minus the marker's normal)
const PLAN: Record<string, { says: string; marker: string }> = {
  E02: { says: "step 1: down onto the plinth", marker: "MC_E02_plinth" },
  E03: { says: "step 2: straight down into the saddles (one axis, §2.6)", marker: "MC_E03_saddles" },
  E04: { says: "step 3: straight down onto the lower case", marker: "MC_E04_lower" },
  E05: { says: "step 4: along the bank's axis, down onto the slope", marker: "MC_E05_upper" },
  E06: { says: "step 5: along the bank's axis, down onto the slope", marker: "MC_E06_upper" },
  E07: { says: "step 6: down its bore, along the bank's axis (ONE axis, §2.6)", marker: "MC_E07_rest" },
  E08: { says: "step 7: down its bore (ONE axis)", marker: "MC_E08_rest" },
  E09: { says: "step 8: down its bore (ONE axis)", marker: "MC_E09_rest" },
  E10: { says: "step 9: down its bore (ONE axis)", marker: "MC_E10_rest" },
  E11: { says: "step 10: down its bore (ONE axis)", marker: "MC_E11_rest" },
  E12: { says: "step 11: down its bore (ONE axis)", marker: "MC_E12_rest" },
  E13: { says: "step 12: along the bank's axis, onto the deck", marker: "MC_E13_rest" },
  E14: { says: "step 13: along the bank's axis, onto the deck", marker: "MC_E14_rest" },
  E15: { says: "step 14: straight down onto the head's top face (its normal)", marker: "MC_E15_head" },
  E16: { says: "step 15: straight down onto the head's top face (its normal)", marker: "MC_E16_head" },
  E17: { says: "step 16: along the crank's axis, from the front", marker: "MC_E17_nose" },
};

// ─── read the model
const bytes = new Uint8Array(readFileSync(GLB));
const parsed = glbJson(bytes);
if (!("json" in parsed)) throw new Error(`the .glb: ${parsed.refusal}`);
const cat = readModelCatalog(parsed.json);
if (cat.catalog === null) throw new Error(`the catalogue refused: ${cat.refusals.join("; ")}`);
const catalog = cat.catalog;
const MM = catalog.unitM * 1000; // reference units → mm
const geo = partGeometry(parsed.json, glbBin(bytes), catalog);
const order = [...catalog.parts].sort((a, b) => a.id.localeCompare(b.id)); // E01 … E17 = the plan's main order (checked below against `step`)
for (let i = 1; i < order.length; i++) if (order[i]!.step < order[i - 1]!.step) throw new Error(`the ids' order breaks the file's steps at ${order[i]!.id}`);
const piecesOf = new Map<string, Piece[]>();
for (const g of geo) {
  piecesOf.set(g.id, g.pieces.map((pts, k) => makePiece(g.id, `ucx${k}`, pts.map((p) => { const w = apply(g.goal, p); return [w[0] * MM, w[1] * MM, w[2] * MM] as V; }))));
}
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const fmtV = (v: readonly number[]) => `(${v.map((x) => (Math.abs(x) < 5e-4 ? 0 : x).toFixed(3)).join(", ")})`;

// ─── each pair's obstacle built once (the cross-checks and every run share it)
const pairCache = new Map<string, Pair>();
const pairOf = (a: Piece, b: Piece): Pair => {
  const k = `${a.owner}/${a.label}|${b.owner}/${b.label}`;
  let P = pairCache.get(k);
  if (P === undefined) { P = makePair(a, b); pairCache.set(k, P); }
  return P;
};

// ─── the self-checks first (known answers; the study's own answers)
const self = selfChecks();
const selfOk = self.every((s) => s.ok);
if (process.env.SELF) {
  for (const s of self) console.log(`${s.ok ? "ok  " : "FAIL"} ${s.name}: expected [${s.expected}] got [${s.got}]`);
  process.exit(selfOk ? 0 : 1);
}

// ─── the second implementation of the pair obstacle, and the game's GJK at the seat, on Scene_2's real pieces
function crossChecks() {
  let pairs = 0, compared = 0, depthDiff = 0, verdictDiff = 0, gjkDisagree = 0, dirs = 0, signDiff = 0;
  const sph = sphere(60);
  const ids = order.map((p) => p.id);
  for (let k = 1; k < ids.length; k++) {
    const mine = piecesOf.get(ids[k]!)!;
    const placed = ids.slice(0, k).flatMap((id) => piecesOf.get(id)!);
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
  plan: { says: string; withdrawal: string; free: boolean; blockers: string[]; openingDeg: number; contactEndMm: number; mouthMm: number | null; mouthBy: string; nearestFreeDeg: number | null };
  ghosts: { node: string; on: string; withdrawal: string; authoredMm: number; free: boolean; mouthMm: number | null; mouthBy: string; diffMm: number | null; blockers: string[] }[];
  ghostsWithoutPlunge: string[];
  seatContacts: string[]; seatGapMm: number; markerBehindUcxMm: number; seatOverlaps: { pair: string; depthMm: number }[];
}

function runAll(skin: number): Row[] {
  const rows: Row[] = [];
  for (let k = 1; k < order.length; k++) {
    const part = order[k]!;
    const placedIds = order.slice(0, k).map((p) => p.id);
    const mine = piecesOf.get(part.id)!;
    const placed = placedIds.flatMap((id) => piecesOf.get(id)!);
    const plan = PLAN[part.id];
    if (!plan) throw new Error(`no plan line for ${part.id}`);
    const marker = part.seats.find((s) => s.node === plan.marker);
    if (!marker) throw new Error(`${part.id}: no seat marker ${plan.marker}`);
    const planD = unit([-marker.normal[0], -marker.normal[1], -marker.normal[2]]);
    const ghosts = catalog.parts.flatMap((host) => host.ghosts.filter((g) => g.forPart === part.id).map((g) => ({ g, host: host.id })));
    const exactDirs = [
      { label: "plan", d: planD },
      ...ghosts.filter((x) => x.g.plunge).map((x) => ({ label: `ghost ${x.g.node}`, d: unit([-x.g.plunge!.axis[0], -x.g.plunge!.axis[1], -x.g.plunge!.axis[2]]) })),
      ...normalDirs([...mine, ...placed]).map((d) => ({ label: "normal", d })),
    ];
    const tp = Date.now();
    const r = entrySet(mine, placed, exactDirs, skin, ENTRY_SPHERE_N, pairOf);
    if (process.env.PROGRESS) console.error(`${part.id}: ${mine.length * placed.length} pairs, ${exactDirs.length} exact directions, ${Date.now() - tp} ms`);
    const planE = r.exact[0]!;
    const freeExact = r.exact.filter((e) => e.free && e.label === "normal");
    // the distinct free exact directions (a normal shared by several pieces counted once)
    const seen: V[] = [];
    // (1e-4 rad: the file's float32 normals of one plane differ by more than 1e-6)
    const fx = freeExact.filter((e) => { if (seen.some((s) => angleBetween(s, e.d) < 1e-4)) return false; seen.push(e.d); return true; });
    // nothing within the skin at the seat: how far the nearest placed piece is (the game's GJK)
    const seatGap = r.seatContacts.length ? 0 : Math.min(...mine.flatMap((a) => placed.map((b) => gapBetween(a.pts, b.pts) ?? Infinity)));
    // the part's own seat marker against its collision pieces' rearmost point along the plan's withdrawal (mm; > 0: the marker lies behind them)
    let rear = Infinity;
    for (const a of mine) for (const q of a.pts) rear = Math.min(rear, q[0] * planD[0] + q[1] * planD[1] + q[2] * planD[2]);
    const markerBehindUcxMm = rear - (marker.position[0] * planD[0] + marker.position[1] * planD[1] + marker.position[2] * planD[2]) * MM;
    const allFree = [...r.exact.filter((e) => e.free).map((e) => e.d)];
    const narrow = r.regions.length > 0 && r.widestDeg < NARROW_DEG;
    const planM = planE.free ? mouth(mine, placed, planD) : null;
    const nearestFree = planE.free ? 0 : allFree.length ? Math.min(...allFree.map((d) => deg(angleBetween(d, planD)))) : null;
    rows.push({
      id: part.id, node: part.node, step: k, placed: placedIds, pieces: mine.length, pairs: mine.length * placed.length,
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
      plan: { says: plan.says, withdrawal: fmtV(planD), free: planE.free, blockers: planE.blockers, openingDeg: r1(planE.openingDeg), contactEndMm: r1(planE.clearMm), mouthMm: planM ? r1(planM.mm) : null, mouthBy: planM?.decisive ?? "", nearestFreeDeg: nearestFree === null ? null : r1(nearestFree) },
      ghosts: ghosts.filter((x) => x.g.plunge).map((x, i) => {
        const e = r.exact[1 + i]!;
        const authored = x.g.plunge!.depth * MM;
        const m = e.free ? mouth(mine, placed, e.d) : null;
        return { node: x.g.node, on: x.host, withdrawal: fmtV(e.d), authoredMm: r1(authored), free: e.free, mouthMm: m ? r1(m.mm) : null, mouthBy: m?.decisive ?? "", diffMm: m ? r1(m.mm - authored) : null, blockers: e.blockers };
      }),
      ghostsWithoutPlunge: ghosts.filter((x) => !x.g.plunge).map((x) => `${x.g.node} (on ${x.host})`),
      seatContacts: r.seatContacts, seatGapMm: r1(seatGap), markerBehindUcxMm: r1(markerBehindUcxMm), seatOverlaps: r.seatOverlaps.map((o) => ({ pair: o.pair, depthMm: r2(o.depthMm) })),
    });
  }
  return rows;
}

const tc = Date.now();
const cross = process.env.NOCROSS ? { pairs: 0, compared: 0, dirsCompared: 0, maxDepthDiffMm: 0, verdictDiff: 0, insideOutsideDiff: 0, gjkDisagree: 0 } : crossChecks();
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

// ─── the outputs (no timing in the JSON: two runs must be byte-identical)
const result = {
  model: GLB, unitM: catalog.unitM, sphere: ENTRY_SPHERE_N, narrowDeg: NARROW_DEG,
  skin: { onGlassMm: DEFAULT_CONFIG.collisionSkinMm, cameraM: CAM_M, fovRad: FOV, viewportPx: VIEW_H, worldMm: r2(SKIN) },
  selfChecks: self, crossChecks: { ...cross, maxDepthDiffMm: Number(cross.maxDepthDiffMm.toExponential(2)) }, rows, sensitivity: sens,
};
writeFileSync(join(OUT, "scene2_entries.json"), JSON.stringify(result, null, 1));
const L: string[] = [];
const w = (s: string) => L.push(s);
w(`Scene_2 entry sets — ${GLB}, ${ENTRY_SPHERE_N} samples + exact normals; skin ${r2(SKIN)} mm in the world (${DEFAULT_CONFIG.collisionSkinMm} mm on the glass at ${CAM_M} m); NARROW < ${NARROW_DEG}°`);
w(`self-checks: ${self.filter((s) => s.ok).length}/${self.length} passed`);
for (const s of self) w(`  ${s.ok ? "ok  " : "FAIL"} ${s.name}: expected [${s.expected}] got [${s.got}]`);
w(`cross-checks on the real pieces: ${cross.pairs} pairs at the seats (the game's GJK on every one), ${cross.compared} of them against the SAT construction in ${cross.dirsCompared} pair-directions × 4 points — verdicts differing ${cross.verdictDiff}, points inside one and outside the other ${cross.insideOutsideDiff}, largest depth difference inside ${cross.maxDepthDiffMm.toExponential(2)} mm; the game's GJK disagreeing on apart/touching at the seat: ${cross.gjkDisagree}`);
w("");
w("part  stage placed  share%  widest° narrowest° regions flag    plan's way in (withdrawal)                 free?  mouth mm  ghosts (authored plunge vs computed mouth, mm)");
for (const r of rows) {
  const gh = r.ghosts.map((g) => `${g.node}: ${g.authoredMm} vs ${g.free ? g.mouthMm : "BLOCKED"}${g.diffMm !== null ? ` (${g.diffMm > 0 ? "+" : ""}${g.diffMm})` : ""}`).join("; ") || "-";
  w(`${r.id}   ${String(r.step).padStart(2)}    ${String(r.placed.length).padStart(2)}   ${r.sharePct.toFixed(2).padStart(6)}  ${r.widestDeg.toFixed(1).padStart(6)}  ${r.narrowestDeg.toFixed(1).padStart(6)}    ${String(r.regions.length).padStart(3)}   ${r.flag.padEnd(6)}  ${r.plan.withdrawal.padEnd(26)} ${r.plan.free ? "free   " : `BLOCKED by ${r.plan.blockers.join(",")} (nearest free ${r.plan.nearestFreeDeg}°)`} ${r.plan.free ? String(r.plan.mouthMm).padStart(7) : ""}  ${gh}`);
}
w("");
for (const r of rows) {
  w(`${r.id} ${r.node} — stage ${r.step}, placed ${r.placed.join(" ")}; ${r.pieces} pieces, ${r.pairs} pairs; touching at the seat: ${r.seatContacts.join(" ") || `nothing (the nearest placed piece ${r.seatGapMm} mm away)`}; its seat marker ${r.plan.withdrawal === "" ? "" : `${r.markerBehindUcxMm} mm`} before its collision pieces' rearmost point along the withdrawal${r.seatOverlaps.length ? `; OVERLAPPING past the skin: ${r.seatOverlaps.map((o) => `${o.pair} ${o.depthMm} mm`).join(", ")}` : ""}`);
  w(`   regions: ${r.regions.map((g) => `${g.openingDeg}° at ${g.centre}${g.exactOnly ? " (exact only)" : ""} [${g.members}]`).join("; ") || "none"}`);
  w(`   plan: ${r.plan.says}; withdrawal ${r.plan.withdrawal} ${r.plan.free ? `free, opening ${r.plan.openingDeg}°, out of contact after ${r.plan.contactEndMm} mm, beyond what it passes after ${r.plan.mouthMm} mm (${r.plan.mouthBy || "nothing beside"})` : `BLOCKED by ${r.plan.blockers.join(" ")}`}`);
  w(`   free exact normals (${r.freeExact.length}): ${r.freeExact.slice(0, 12).map((e) => `${e.d} open ${e.openingDeg}°`).join("; ") || "none"}${r.freeExact.length > 12 ? " …" : ""}`);
  if (r.flag === "NARROW") w(`   pre-insertion poses (the part's origin, scene frame): ${r.freeExact.map((e) => `${e.d} → ${e.preInsertion}`).join("; ")}`);
  if (r.ghostsWithoutPlunge.length) w(`   ghosts without a plunge (bridges, no pose to compare): ${r.ghostsWithoutPlunge.join(", ")}`);
}
for (const [k, v] of Object.entries(sens)) {
  w("");
  w(`sensitivity — ${k} (skin ${v.skinMm} mm): ${v.rows.map((x) => `${x.id} ${x.sharePct}% ${x.flag} ${x.widestDeg}° plan ${x.planFree ? "free" : "BLOCKED"} n${x.freeExact}`).join(" | ")}`);
}
writeFileSync(join(OUT, "scene2_entries.txt"), L.join("\n") + "\n");
console.log(L.join("\n"));
console.log(`\nwritten: ${join(OUT, "scene2_entries.json")}, .txt — cross-checks ${tCross} ms, main ${tMain} ms, total ${Date.now() - t0} ms`);
if (!selfOk) process.exit(1);
