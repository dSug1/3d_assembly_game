// ⭐⭐⭐ (2026-11-24, S11's build — ORBIT_SURFACE_L1.md §10) THE CAPS BETWEEN PLACED PARTS, COMPUTED OFFLINE (his Q3: precomputed) — L1's FILLERS.
// For each DATA scene with a `final` (no `.glb`: its bodies are the descriptor's), in each state (`l1_places.ts` `posed`: FINISHED — every body at its
// goal; START — the bodies placed from the start, the loose pieces' GOAL volumes beside; START skipped where it is the same set), ⛔ a frozen body — the
// floor — never in the set (his rule: not a part, never a wall, never a snap plane):
//   1. R1b's places on the set as ONE part (`r1bPlaces`, the copy of `checkProxyCover`'s R1b that `l1_data_scenes.ts --selfcheck` holds equal); the
//      DEEP ones (deeper than their mouth is wide); at START a place lying mostly in a loose piece's goal volume is its GOAL SLOT (the ghost bridges
//      it), no cap;
//   2. each deep place's box (its shell voxels' centres) CUT out of the goal volumes (⛔ a piece's goal volume never inside a filler: the cut that
//      removes the least), then each side SNAPPED OUTWARD to the nearest parallel face plane of a placed body or a goal volume within the place's
//      width (its box's narrowest side plus one voxel — the shell's centres lie half a voxel off each wall) whose face lies within that width of the
//      box's cross-section; none: refused;
//   3. ACCEPTED only if `fillerVerdict` (`src/input/l1_caps.ts`) passes in every state — each face GLUED, FLUSH, or (START) on a goal volume, nothing
//      inside — and the fillers are THE SAME in every state (else the precompute per placed set, §4.1, is owed: refused);
//   4. its WALLS: the bodies its faces are glued to or flush with in the START set (a loose piece is never a wall: the filler is there before it —
//      its face against the piece's goal is GOAL at START, GLUED once seated); its anchor: the first wall, with its goal pose.
// Written: `src/content/<scene>_caps.json` (scene units, rounded to 1e-9; deterministic) for a scene with a filler; a scene with none gets no file (a
// stale one is refused). Any refusal: a non-zero exit. ≈ 21 s an R1b set (Scene_1: two).
// Usage: npx vite-node scripts/surface/l1_caps.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { SCENES } from "../../src/content/scenes";
import type { SceneDescriptor } from "../../src/core/game_structure";
import { COVER_STEP_MM } from "../../src/core/proxy_cover";
import { toUnion } from "../../src/core/part_checks";
import type { Vec3 } from "../../src/core/vec";
import type { MapFace } from "../../src/input/face_map";
import { fillerVerdict, SIDES, type FillerVerdict } from "../../src/input/l1_caps";
import { posed, quatOf, r1bPlaces, rtrisOf, unionOf, unitOf, type Body, type Place, type State } from "./l1_places";

const CONTENT = new URL("../../src/content/", import.meta.url);
const LOADER = new URL("scene_caps.ts", CONTENT);
let refused = 0;
const refuse = (msg: string): void => {
  refused++;
  console.log(`  ⛔ REFUSED — ${msg}`);
};
const mm = (v: readonly number[]) => `(${v.map((x) => x.toFixed(2)).join(", ")})`;

/** ⭐ a body's faces as the face map takes them, in METRES (the model's space): its triangles grouped by plane (normal and level), each with its part */
function facesOf(b: Body): MapFace[] {
  const m = b.part.proxy[0]!;
  const groups = new Map<string, { n: Vec3; tris: [Vec3, Vec3, Vec3][] }>();
  for (const [i, j, k] of m.triangles) {
    const A = m.points[i]!, B = m.points[j]!, C = m.points[k]!;
    const c = [(B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])];
    const l = Math.hypot(c[0]!, c[1]!, c[2]!);
    if (!(l > 1e-12)) continue;
    const n: Vec3 = [c[0]! / l, c[1]! / l, c[2]! / l];
    const key = `${n.map((x) => x.toFixed(6)).join(",")}|${(n[0] * A[0] + n[1] * A[1] + n[2] * A[2]).toFixed(4)}`;
    const g = groups.get(key) ?? (groups.set(key, { n, tris: [] }), groups.get(key)!);
    g.tris.push([A, B, C].map((p): Vec3 => [p[0] / 1000, p[1] / 1000, p[2] / 1000]) as [Vec3, Vec3, Vec3]);
  }
  return [...groups.values()].map(({ n, tris }) => {
    let a = 0;
    const s = [0, 0, 0];
    for (const [p, q, r] of tris) {
      const w = Math.hypot((q[1] - p[1]) * (r[2] - p[2]) - (q[2] - p[2]) * (r[1] - p[1]), (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]), (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) / 2;
      a += w;
      for (let d = 0; d < 3; d++) s[d]! += (w * (p[d]! + q[d]! + r[d]!)) / 3;
    }
    return { normal: n, centre: [s[0]! / a, s[1]! / a, s[2]! / a] as Vec3, tris, part: b.spec.id };
  });
}

interface Filler {
  readonly lo: [number, number, number];
  readonly hi: [number, number, number];
  readonly raw: { readonly lo: Vec3; readonly hi: Vec3 };
  readonly width: number;
  readonly snaps: string[];
  readonly place: Place;
}

/** ⭐ step 2: a deep place's box cut out of the goal volumes, then each side snapped outward (mm); null + a reason when a side finds no plane */
function fillerOf(p: Place, set: readonly Body[], goalVols: readonly Body[]): Filler | { reason: string } {
  const lo: [number, number, number] = [p.lo[0], p.lo[1], p.lo[2]], hi: [number, number, number] = [p.hi[0], p.hi[1], p.hi[2]];
  const width = Math.min(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) + COVER_STEP_MM;
  const snaps: string[] = [];
  // ⛔ a goal volume never inside: each one reaching in, the cut that removes the least
  for (const g of goalVols) {
    if ([0, 1, 2].some((d) => Math.min(hi[d]!, g.box.hi[d]!) - Math.max(lo[d]!, g.box.lo[d]!) <= 0)) continue;
    let best: { d: number; lo: boolean; v: number; cut: number } | null = null;
    for (let d = 0; d < 3; d++) {
      const ext = hi[d]! - lo[d]!;
      for (const c of [{ lo: true, v: g.box.hi[d]! }, { lo: false, v: g.box.lo[d]! }]) {
        const cut = c.lo ? c.v - lo[d]! : hi[d]! - c.v;
        if (cut > 0 && cut < ext && (best === null || cut < best.cut)) best = { d, lo: c.lo, v: c.v, cut };
      }
    }
    if (best === null) return { reason: `${g.spec.id}'s goal volume holds the place whole` };
    (best.lo ? lo : hi)[best.d] = best.v;
    snaps.push(`cut out of ${g.spec.id}'s goal volume at ${"xyz"[best.d]} ${best.v.toFixed(2)} mm`);
  }
  const planes = [...set, ...goalVols].flatMap((b) => facesOf(b).map((f) => ({ f, goal: goalVols.includes(b) })));
  for (const { side, k, s, a, b } of SIDES) {
    const at = s > 0 ? hi[k] : lo[k];
    let best: { v: number; ids: Set<string> } | null = null;
    for (const { f, goal } of planes) {
      if (Math.abs(f.normal[k]) < 1 - 1e-6) continue;
      const v = f.centre[k] * 1000;
      const out = (v - at) * s; // how far outward
      if (out < -1e-9 || out > width) continue;
      const near = (d: 0 | 1 | 2) => Math.min(...f.tris.flatMap((t) => t.map((q) => q[d] * 1000))) <= hi[d] + width && Math.max(...f.tris.flatMap((t) => t.map((q) => q[d] * 1000))) >= lo[d] - width;
      if (!near(a) || !near(b)) continue;
      const id = `${f.part}${goal ? " (goal)" : ""}`;
      if (best === null || out < (best.v - at) * s - 1e-9) best = { v, ids: new Set([id]) };
      else if (Math.abs(out - (best.v - at) * s) <= 1e-9) best.ids.add(id);
    }
    if (best === null) return { reason: `side ${side} (${at.toFixed(2)} mm) finds no face plane within the place's width ${width.toFixed(2)} mm` };
    (s > 0 ? hi : lo)[k] = best.v;
    snaps.push(`${side} ${at.toFixed(2)} → ${best.v.toFixed(2)} mm (${[...best.ids].sort().join(", ")})`);
  }
  return { lo, hi, raw: { lo: p.lo, hi: p.hi }, width, snaps, place: p };
}

const verdictLine = (v: FillerVerdict) => `${v.ok ? "ACCEPTED" : "REFUSED"} — ${v.faces.map((f) => `${f.side} ${f.verdict}${f.by.length ? ` ${f.by.join("+")}` : ""}${f.partly.length && f.verdict !== "GLUED" ? ` (in part ${f.partly.join("+")})` : ""}`).join("; ")}${v.inside.length ? `; INSIDE: ${v.inside.join(", ")}` : ""}`;
const round = (x: number) => Math.round(x * 1e9) / 1e9 + 0;

const dataScenes = SCENES.filter((s): s is SceneDescriptor & { final: NonNullable<SceneDescriptor["final"]> } => s.final !== null && s.model === undefined);
for (const sc of dataScenes) {
  const u = unitOf(sc);
  const file = new URL(`${sc.id.toLowerCase()}_caps.json`, CONTENT);
  const start = posed(sc, "START");
  const fin = posed(sc, "FINISHED");
  const states: State[] = start.left.length === 0 && start.bodies.length === fin.bodies.length ? ["FINISHED"] : ["FINISHED", "START"];
  const per = new Map<State, { fillers: Filler[]; set: ReturnType<typeof posed> }>();
  console.log(`${sc.id} (${u} mm a unit): ${states.join(" + ")}${fin.notes.length ? ` — ${fin.notes.join("; ")}` : ""}`);
  for (const state of states) {
    const set = state === "FINISHED" ? fin : start;
    const t0 = performance.now();
    const r = r1bPlaces(rtrisOf(unionOf(`${sc.id}_${state}`, set.bodies.map((b) => b.part))));
    const deep = r.places.filter((p) => p.deep);
    console.log(`  ${state}: ${set.bodies.length} bodies${set.left.length ? `, goal volumes ${set.left.map((b) => b.spec.id).join(" ")}` : ""} — R1b ${((performance.now() - t0) / 1000).toFixed(0)} s: ${deep.length} deep place(s)`);
    const fillers: Filler[] = [];
    for (const [i, p] of deep.entries()) {
      // ⭐ a goal slot: most of its sampled voxels in a loose piece's goal volume (`l1_data_scenes.ts` `describe`'s rule)
      const inSlot = p.sample.filter(({ p: q }) => set.left.some((b) => toUnion(q, [b.k]) <= 0.5)).length;
      console.log(`    place ${i + 1}: ≈ ${p.area.toFixed(0)} mm², sky ±${p.minSky.toFixed(1)}°, box ${mm(p.lo)} … ${mm(p.hi)} mm${inSlot ? ` (${inSlot} of ${p.sample.length} samples in a goal volume)` : ""}`);
      if (inSlot * 2 >= p.sample.length) {
        console.log("      a GOAL SLOT (the ghost bridges it) — no cap");
        continue;
      }
      const f = fillerOf(p, set.bodies, set.left);
      if ("reason" in f) {
        refuse(`${sc.id} ${state} place ${i + 1}: ${f.reason}`);
        continue;
      }
      console.log(`      snapped (width ${f.width.toFixed(2)} mm): ${f.snaps.join("; ")}`);
      console.log(`      → filler ${mm(f.lo)} … ${mm(f.hi)} mm`);
      fillers.push(f);
    }
    per.set(state, { fillers, set });
  }
  // ⭐ step 3: the same fillers in every state, each accepted in every state
  const F = per.get("FINISHED")!.fillers;
  const S = per.get("START")?.fillers;
  if (S !== undefined && (S.length !== F.length || F.some((f, i) => [0, 1, 2].some((d) => Math.abs(f.lo[d]! - S[i]!.lo[d]!) > 1e-6 || Math.abs(f.hi[d]! - S[i]!.hi[d]!) > 1e-6))))
    refuse(`${sc.id}: the fillers differ between FINISHED and START — the precompute per placed set (ORBIT_SURFACE_L1.md §4.1) is owed`);
  const out: object[] = [];
  for (const [i, f] of F.entries()) {
    const lo: Vec3 = [f.lo[0] / 1000, f.lo[1] / 1000, f.lo[2] / 1000], hi: Vec3 = [f.hi[0] / 1000, f.hi[1] / 1000, f.hi[2] / 1000];
    const verdicts = new Map<State, FillerVerdict>();
    for (const [state, { set }] of per) {
      const v = fillerVerdict(lo, hi, set.bodies.flatMap(facesOf), set.left.flatMap(facesOf));
      console.log(`  filler ${i + 1} at ${state}: ${verdictLine(v)}`);
      if (!v.ok) refuse(`${sc.id} filler ${i + 1} at ${state}: a face neither glued nor flush, or a body inside`);
      verdicts.set(state, v);
    }
    if (verdicts.get("FINISHED")!.faces.some((x) => x.verdict === "GOAL")) refuse(`${sc.id} filler ${i + 1}: a GOAL face with every body at its goal`);
    const v0 = verdicts.get("START") ?? verdicts.get("FINISHED")!;
    const walls = [...new Set(v0.faces.filter((x) => x.verdict === "GLUED" || x.verdict === "FLUSH").flatMap((x) => x.by))].sort();
    const goals = [...new Set(v0.faces.filter((x) => x.verdict === "GOAL").flatMap((x) => x.by))].sort();
    if (walls.length === 0) {
      refuse(`${sc.id} filler ${i + 1}: no wall`);
      continue;
    }
    const anchorGoal = sc.final.bodies.find((b) => b.id === walls[0]);
    if (anchorGoal === undefined) {
      refuse(`${sc.id} filler ${i + 1}: its anchor ${walls[0]} has no goal`);
      continue;
    }
    const q = quatOf(anchorGoal.orientation);
    out.push({
      id: `L1cap_${sc.id}_${i + 1}`,
      lo: f.lo.map((x) => round(x / u)),
      hi: f.hi.map((x) => round(x / u)),
      walls,
      goals,
      anchor: { id: walls[0], position: anchorGoal.position.map(round), quat: q.map(round) },
      mm: { lo: f.lo.map((x) => round(x)), hi: f.hi.map((x) => round(x)) },
      faces: Object.fromEntries(v0.faces.map((x) => [x.side, `${x.verdict}${x.by.length ? ` ${x.by.join(" ")}` : ""}${x.partly.length && x.verdict !== "GLUED" ? ` (in part ${x.partly.join(" ")})` : ""}`])),
      place: { areaMm2: Math.round(f.place.area), minSkyDeg: round(Math.round(f.place.minSky * 10) / 10), rawLoMm: f.raw.lo.map((x) => round(Math.round(x * 100) / 100)), rawHiMm: f.raw.hi.map((x) => round(Math.round(x * 100) / 100)) },
    });
  }
  if (out.length === 0) {
    if (existsSync(file)) refuse(`${sc.id}: no filler, but ${file.pathname} stands — a stale caps file (remove it and its line in scene_caps.ts)`);
    else console.log(`  no filler — no file`);
    continue;
  }
  const json = {
    note: `L1's fillers (ORBIT_SURFACE_L1.md §10), written by scripts/surface/l1_caps.ts — never edited by hand. lo / hi in the scene's authored units, in its frame with every body at its goal; walls: the placed parts it needs; goals: loose pieces whose goal volume it borders (not walls); anchor: the wall that carries it (its goal pose); mm, faces, place: for the reader.`,
    scene: sc.id,
    unitM: sc.unitM ?? 1,
    fillers: out,
  };
  // one array of numbers or ids a line (the reader's), the rest indented
  const text = JSON.stringify(json, null, 2).replace(/\[\s+([^[\]{}]*?)\s+\]/g, (_m, inner: string) => `[${inner.split(/,\s+/).join(", ")}]`);
  writeFileSync(file, text + "\n", { encoding: "utf8" });
  console.log(`  written ${file.pathname.replace(/^.*\/src\//, "src/")} (${out.length} filler${out.length > 1 ? "s" : ""})`);
  if (!readFileSync(LOADER, "utf8").includes(`./${sc.id.toLowerCase()}_caps.json`)) refuse(`${sc.id}: its caps file is not read by src/content/scene_caps.ts — add it there`);
}
if (refused > 0) {
  console.log(`⛔ ${refused} refusal(s)`);
  process.exit(1);
}
console.log("✓ every filler accepted");
