// ⭐ (2026-11-24, S11 — ORBIT_SURFACE_L1.md §3) A MEASUREMENT, not a check: do today's DATA scenes have a SEALED or BURIED face, and which hollows
// BETWEEN PLACED parts are deeper than their mouth is wide (the caps the game would add)? Never with loose pieces at their spawn places — each scene
// (that has a `final`) in TWO states:
//   * FINISHED — every body at its GOAL (`final`'s positions and orientations); a non-frozen body with no goal where it stands;
//   * START — only the bodies whose spawn place IS their goal (placed from the start); the loose pieces left out, their GOAL volumes
//     kept to name a place that reaches into one: that piece's GOAL SLOT (the game bridges a goal's mouth with its ghost), not a cap.
// ⛔⛔ (his rule, repeated 2026-11-24: *"the floor shall not count as a part, and viewed from below the floor is not visible … it is like a UI
// inside the game scene"*) A FROZEN body — the floor — is NEVER in the set: never a wall of a hollow, never a cap's reason (the face map skips it
// too: `render/assembly_wiring.ts`, `obj.frozen`). ⛔ The first run of 2026-11-24 kept it and reported the gap under Scene_1's cube as a cap.
// Each body with the shape the GAME gives it (`render/scene.ts` → `render/bodies.ts` `make`, reproduced engine-free below: the box, the frustum —
// `core/frustum.ts` `taperTop` —, the prism — `prismMesh`'s steps on `core/prism.ts` —, the margin, the orientation; each shape checked and printed).
// Per state: B2's states at 2 mm (`exposedPerStage`); then — Scene_1 both states,
// Scene1_demo FINISHED — packet 2's R1b on the set as ONE part, each place listed: its size, how deep for its mouth, its box, the bodies round it and
// across it, its label (a CAP between placed parts, a goal slot, amber). Minutes a set.
// ⚠ The place list needs R1b's regions, which `checkProxyCover` does not return: `r1bPlaces` below is a COPY of its R1b section (as at ca4eeb0a,
// `minOver` included), kept ONLY to list the places — its two lines must equal `checkProxyCover`'s, which `--selfcheck` holds:
//   --selfcheck        on a small set (Scene_1 FINISHED, its lower right corner, no floor; ≈ 20 s)
//   --selfcheck=full   on Scene_1 FINISHED whole (both computed in full: ≈ 10 min)
// Usage: npx vite-node scripts/surface/l1_data_scenes.ts [--selfcheck | --selfcheck=full]
import { SCENES } from "../../src/content/scenes";
import { prismOutline } from "../../src/core/prism";
import { exposedPerStage, toUnion, type Convex } from "../../src/core/part_checks";
import { checkProxyCover } from "../../src/core/proxy_cover";
import { cross, dot, type Vec3 } from "../../src/core/vec";
// ⭐ (2026-11-24, S11's build) the bodies, the two states and R1b's places moved to `l1_places.ts` (shared with `l1_caps.ts`), unchanged
import { at, posed, r1bPlaces, RAD, rtrisOf, unionOf, unitOf, type Body, type Place, type State } from "./l1_places";

const SELFCHECK = process.argv.find((a) => a.startsWith("--selfcheck"));

/** ⭐ the shape against the game's code: its corners and triangles, its extents in its own frame against the contour's dims × unitM, a frustum's top
 * against `topScale` × its base, a prism's outline against `core/prism.ts` `prismOutline` (odd sides: the same polygon), its volume three ways (the
 * convex hull of its corners, its own triangles — closed and outward —, the formula) */
function shapeCheck(bd: Body, u: number): string {
  const b = bd.spec;
  const m = b.margin ?? 0;
  const want = b.dims.map((d) => (d + 2 * m) * u);
  const L = bd.local;
  const ext = [0, 1, 2].map((k) => Math.max(...L.map((p) => p[k]!)) - Math.min(...L.map((p) => p[k]!)));
  const extOk = ext.every((e, k) => Math.abs(e - want[k]!) < 1e-3);
  const notes: string[] = [`its frame's extents ${ext.map((e) => e.toFixed(2)).join(" × ")} mm ${extOk ? "= (dims + 2·margin)·unitM ✓" : `≠ ${want.map((e) => e.toFixed(2)).join(" × ")} ✗`}`];
  const pts = bd.part.proxy[0]!.points, tris = bd.part.proxy[0]!.triangles;
  let meshV = 0;
  for (const [a, b2, c2] of tris) meshV += dot(pts[a]!, cross(pts[b2]!, pts[c2]!)) / 6;
  const hullV = bd.k.volume;
  let formula = NaN;
  if (b.prismSides === undefined) {
    const s = b.topScale;
    formula = (want[1]! / 3) * want[0]! * want[2]! * (1 + s * s + s);
    if (s !== 1) {
      const top = L.filter((p) => p[1] > 0);
      const tx = Math.max(...top.map((p) => p[0])) - Math.min(...top.map((p) => p[0])), tz = Math.max(...top.map((p) => p[2])) - Math.min(...top.map((p) => p[2]));
      const ok = Math.abs(tx - s * want[0]!) < 1e-3 && Math.abs(tz - s * want[2]!) < 1e-3 && top.length === 4;
      notes.push(`its top face (+y, ${top.length} corners) ${tx.toFixed(2)} × ${tz.toFixed(2)} mm ${ok ? `= ${s} × its base ✓` : "✗"}`);
    }
    notes.push(`${L.length} corners, ${tris.length} triangles (the game: CreateBox — 24 vertices, 8 distinct; 36 indices)`);
  } else {
    const n = b.prismSides, tip = (b.prismTip ?? 0) * u;
    const ring = L.slice(0, n);
    let area = 0;
    for (let j = 0; j < n; j++) area += (ring[j]![0] * ring[(j + 1) % n]![1] - ring[(j + 1) % n]![0] * ring[j]![1]) / 2;
    area = Math.abs(area);
    formula = area * (want[2]! - 2 * tip) + (2 * area * tip) / 3;
    const ol = prismOutline(n, want[0]!, want[1]!);
    if (ol !== null) {
      const off = Math.max(...ring.map((p) => Math.min(...ol.map((o) => Math.hypot(o[0] - p[0], o[1] - p[1])))));
      notes.push(`its outline against prismOutline(${n}): ${off.toFixed(4)} mm at most${n % 2 === 1 ? "" : " (even: the mesh has a vertex at the top, the outline a flat bottom)"}`);
    }
    notes.push(`${L.length} corners, ${tris.length} triangles (the game: CreateCylinder — 4n + 6 = ${4 * n + 6} vertices, 2n + 2 = ${2 * n + 2} distinct; 4n = ${4 * n} triangles)`);
  }
  const vOk = Math.abs(hullV - meshV) < 1e-6 * Math.abs(hullV) && Math.abs(meshV - formula) < 1e-6 * Math.abs(formula);
  notes.push(`volume ${vOk ? "✓" : "✗"} hull ${hullV.toFixed(0)} / mesh ${meshV.toFixed(0)} / formula ${formula.toFixed(0)} mm³`);
  return `    ${b.id}: ${bd.kind}${bd.turned ? ", turned" : ""}${m > 0 ? `, margin ${(m * u).toFixed(1)} mm` : ""} — ${notes.join("; ")}`;
}

// ── a place in words ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** where a ray from `o` along `d` first enters the convex `k` (Cyrus–Beck on its planes); Infinity: it misses */
function rayIn(o: Vec3, d: Vec3, k: Convex): number {
  let t0 = 0, t1 = Infinity;
  for (const pl of k.planes) {
    const den = dot(pl.n, d), num = pl.d - dot(pl.n, o);
    if (Math.abs(den) < 1e-12) {
      if (num < 0) return Infinity;
      continue;
    }
    const t = num / den;
    if (den < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return Infinity;
  }
  return t0;
}
const tally = (m: Map<string, number[]>, id: string, v: number) => (m.get(id) ?? (m.set(id, []), m.get(id)!)).push(v);
const median = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]!;
const NEAR_MM = 4;

/**
 * ⭐ a place in words: how deep for its mouth (a wall's foot sees ±α when depth / width = cot 2α — R1b's model); its box; ROUND it — per sampled voxel
 * its nearest body and every body within `NEAR_MM`; ACROSS it — the first body a ray from the voxel along its outward normal meets (≤ 1 m) and how far
 * (the walls facing it: the gap's height); a START place reaching into a left-out piece's GOAL volume: that piece's goal slot (its share of the voxels).
 * Its verdict: a CAP — between placed parts and deeper than wide (or undercut); a GOAL SLOT — the ghost bridges it; amber — the author's choice.
 */
function describe(p: Place, i: number, bodies: readonly Body[], left: readonly Body[]): string {
  const ratio = p.minSky <= 0 ? "no straight way out" : p.minSky >= 45 ? "open" : `depth ≈ ${(1 / Math.tan(2 * p.minSky * RAD)).toFixed(2)} × its mouth's width`;
  const round = new Map<string, number[]>(), across = new Map<string, number[]>(), slot = new Map<string, number[]>();
  let open = 0;
  for (const { p: q, n } of p.sample) {
    let best = "", bd = Infinity;
    for (const b of bodies) {
      if (q[0] < b.box.lo[0] - bd || q[0] > b.box.hi[0] + bd || q[1] < b.box.lo[1] - bd || q[1] > b.box.hi[1] + bd || q[2] < b.box.lo[2] - bd || q[2] > b.box.hi[2] + bd) continue;
      const d = toUnion(q, [b.k]);
      if (d <= NEAR_MM) tally(round, b.spec.id, d);
      if (d < bd) (bd = d), (best = b.spec.id);
    }
    if (bd > NEAR_MM && best !== "") tally(round, best, bd);
    for (const b of left) if (toUnion(q, [b.k]) <= 0.5) tally(slot, b.spec.id, 0);
    if (n === null) continue;
    let hit = "", ht = Infinity;
    for (const b of bodies) {
      const t = rayIn(q, n, b.k);
      if (t < ht) (ht = t), (hit = b.spec.id);
    }
    if (ht <= 1000) tally(across, hit, ht);
    else open++;
  }
  const list = (m: Map<string, number[]>, dist: boolean, k = 9) => {
    const e = [...m.entries()].sort((a, b) => b[1].length - a[1].length);
    return e.slice(0, k).map(([id, v]) => `${id} ${v.length}${dist ? ` (${median(v).toFixed(1)} mm)` : ""}`).join(", ") + (e.length > k ? `, +${e.length - k} more` : "");
  };
  const N = p.sample.length;
  const slots = [...slot.entries()].sort((a, b) => b[1].length - a[1].length);
  const inSlots = slots.reduce((t, [, v]) => t + v.length, 0);
  const slotList = slots.map(([id, v]) => `${id} (${v.length} of ${N} samples)`).join(", ");
  const label = slots.length === 0 ? "between placed parts" : inSlots * 2 >= N ? `GOAL SLOT of ${slotList}` : `between placed parts, reaching into the goal slot of ${slotList}`;
  const verdict = slots.length > 0 && inSlots * 2 >= N ? "a goal slot (the ghost bridges it), not a cap" : p.deep ? "a CAP" : "amber (the author's choice)";
  const box = [0, 1, 2].map((k) => `${"xyz"[k]} ${p.lo[k]!.toFixed(0)}…${p.hi[k]!.toFixed(0)}`).join(", ");
  return [
    `    place ${i + 1} — ${p.deep ? "DEEP" : "amber"}, ≈ ${p.area.toFixed(0)} mm², narrowest sky ±${p.minSky.toFixed(1)}° (${ratio})${p.under > 0 ? `, ${p.under} points with no straight way out` : ""}; ${box} mm, centre ${at(p.centre)} → ${verdict}`,
    `      ${label}; round it (of ${N} sampled voxels: its nearest body, and any within ${NEAR_MM} mm — median distance): ${list(round, true)}`,
    `      across it (a ray along each voxel's outward normal, its first body ≤ 1 m — median distance): ${list(across, true)}${open > 0 ? `; open ${open}` : ""}`,
  ].join("\n");
}

const lineOf = (x: { detail: string; info?: boolean }) => `${x.info ? "(info) " : ""}${x.detail}`;

if (SELFCHECK !== undefined) {
  // ⭐ `r1bPlaces` against `checkProxyCover` — Scene_1 FINISHED: its lower right corner (goals at x > 0, y < 1 unit: Piece41's slot behind its goal,
  // between Piece19 and Piece20 under Piece39; the frustum Piece43 under Piece19), no floor — or, `--selfcheck=full`, the whole set
  const sc = SCENES.find((s) => s.id === "Scene_1")!;
  const all = posed(sc, "FINISHED").bodies;
  const full = SELFCHECK === "--selfcheck=full";
  const parts = (full ? all : all.filter((b) => !b.spec.frozen && b.box.lo[0] + b.box.hi[0] > 0 && b.box.lo[1] + b.box.hi[1] < 200)).map((b) => b.part);
  const one = unionOf("selfcheck_union", parts);
  const t0 = performance.now();
  const official = checkProxyCover([one]).filter((x) => x.rule === "R1b").map(lineOf);
  const t1 = performance.now();
  const mine = r1bPlaces(rtrisOf(one));
  const t2 = performance.now();
  const mineL = mine.lines.map(lineOf);
  console.log(`selfcheck on ${full ? `Scene_1 FINISHED whole (${parts.length} bodies)` : parts.map((p) => p.id).join(" ")} (checkProxyCover ${((t1 - t0) / 1000).toFixed(1)} s, r1bPlaces ${((t2 - t1) / 1000).toFixed(1)} s):`);
  console.log(`  checkProxyCover: ${official.join(" | ") || "none"}`);
  console.log(`  r1bPlaces:       ${mineL.join(" | ") || "none"}`);
  console.log(`  ${official.length > 0 && official.join("\n") === mineL.join("\n") ? "EQUAL ✓" : official.length === 0 && mineL.length === 0 ? "both empty (vacuous)" : "DIFFERENT ✗"} — ${mine.places.length} place(s)`);
  process.exit(0);
}

for (const sc of SCENES) {
  if (sc.final === null) {
    console.log(`${sc.id}: no final configuration — not measured`);
    continue;
  }
  const u = unitOf(sc);
  // ⭐ Scene1_demo's shell already stands at its final; its START would be the same set — FINISHED alone
  const states: State[] = sc.id === "Scene1_demo" ? ["FINISHED"] : ["FINISHED", "START"];
  for (const state of states) {
    const { bodies, left, notes } = posed(sc, state);
    const parts = bodies.map((b) => b.part);
    const goals = new Map(parts.map((p) => [p.id, { position: [0, 0, 0] as Vec3, rotation: [1, 0, 0, 0] as const }]));
    const m = exposedPerStage(parts, goals, new Set(parts.map((p) => p.id)), 2);
    const last = m.stages[m.stages.length - 1]!;
    const tot = last.parts.reduce((a, p) => ({ e: a.e + p.exposed, g: a.g + p.glued, b: a.b + p.buried, s: a.s + p.sealed }), { e: 0, g: 0, b: 0, s: 0 });
    const kinds = new Map<string, number>();
    for (const b of bodies) kinds.set(b.kind.replace(/ \(.*$/, ""), (kinds.get(b.kind.replace(/ \(.*$/, "")) ?? 0) + 1);
    console.log(`${sc.id} ${state}: ${bodies.length} of ${sc.bodies.length} bodies — ${[...kinds].map(([k, c]) => `${c} ${k}`).join(", ")}, ${bodies.filter((b) => b.turned).length} turned${left.length > 0 ? `; left out (loose: spawn ≠ goal): ${left.map((b) => b.spec.id).join(" ")}` : ""}${notes.length > 0 ? `; ${notes.join("; ")}` : ""}`);
    console.log(`  B2 (2 mm): triangles exposed ${tot.e}, glued ${tot.g}, buried ${tot.b}, SEALED ${tot.s}; buried parts: ${last.parts.filter((p) => p.buried > 0).map((p) => `${p.id}(${p.buried})`).join(" ") || "none"}; sealed parts: ${last.parts.filter((p) => p.sealed > 0).map((p) => `${p.id}(${p.sealed})`).join(" ") || "none"}`);
    if (state === "FINISHED") {
      for (const b of bodies) if (b.kind !== "box" || b.turned) console.log(shapeCheck(b, u));
      const boxes = bodies.filter((b) => b.kind === "box" && !b.turned);
      if (boxes.length > 0) console.log(`    ${boxes.length} square boxes: ${boxes.filter((b) => shapeCheck(b, u).includes("✗")).length} off their dims or volume`);
    }
    if (sc.id === "Scene_1" || sc.id === "Scene1_demo") {
      // ⭐ R1b on the set as ONE part (its render = every body's faces): the hollows deeper than their mouth is wide, each listed
      const t0 = performance.now();
      const r = r1bPlaces(rtrisOf(unionOf(`${sc.id}_${state}`, parts)));
      console.log(`  R1b on ${sc.id} ${state} as one part (${((performance.now() - t0) / 1000).toFixed(0)} s): ${r.lines.length ? r.lines.map(lineOf).join(" | ") : "no cavity deeper than its mouth is wide"}`);
      r.places.forEach((p, i) => console.log(describe(p, i, bodies, left)));
    }
  }
}
