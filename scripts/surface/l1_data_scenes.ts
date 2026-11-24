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
import { resolveBootOrientation, type BodySpec, type BootOrientation, type FinalPose, type SceneDescriptor } from "../../src/core/game_structure";
import { taperTop } from "../../src/core/frustum";
import { apexAtTop, apexTurn, axisVertices, boxFit, prismOutline, raiseTips } from "../../src/core/prism";
import { seededRotations } from "../../src/core/random_pose";
import { DEFAULT_CONFIG } from "../../src/input/gestureConfig";
import { convexOf, exposedPerStage, toUnion, type Convex, type PartSolids } from "../../src/core/part_checks";
import { checkProxyCover, COVER_STEP_MM, minOver, R1B_AMBER_DEG, R1B_DEEP_DEG, R1B_FINE_DEG, R1B_SKY_N } from "../../src/core/proxy_cover";
import { edt, flood, renderClosing } from "../../src/core/voxels";
import { PROXY_PROBE_MM } from "../../src/core/units";
import { cross, dot, qRotate, type Quat, type Vec3 } from "../../src/core/vec";

const SELFCHECK = process.argv.find((a) => a.startsWith("--selfcheck"));

type Tri3 = [number, number, number];
type Tri = readonly [Vec3, Vec3, Vec3];
type Box3 = { lo: [number, number, number]; hi: [number, number, number] };

// ── the bodies, as the game builds them ──────────────────────────────────────────────────────────────────────────────────────────────────────
/** the game's boot rotations (`render/scene.ts`: `seededRotations(cfg.sceneSeed, 3)`) — a `{ seeded: n }` orientation reads its n-th */
const SEEDED = seededRotations(DEFAULT_CONFIG.sceneSeed, 3);
/** a box's six faces (corner k: x by bit 0, y by bit 1, z by bit 2) */
const BOX_FACES: [number, number, number, number][] = [[0, 2, 6, 4], [1, 5, 7, 3], [0, 4, 5, 1], [2, 3, 7, 6], [0, 1, 3, 2], [4, 6, 7, 5]];

/**
 * ⭐ `render/bodies.ts` `prismMesh`, engine-free: Babylon's `CreateCylinder({ height: 2, diameter: 2, tessellation: n })` — its DISTINCT positions (the
 * builder, `cylinderBuilder.js`: a ring of n + 1 at each end, the seam repeated, vertex j at angle j·2π/n: (cos −a, ±1, sin −a); each cap a fan of n
 * triangles round its centre (0, ±1, 0), its ring repeated — 4n + 6 vertices, 2n + 2 distinct, 4n triangles) — then the same steps: turned onto z
 * (`RotationX(π/2)`), the hubs read (`axisVertices`), a vertex turned to the top (`apexTurn`, `RotationZ`, `apexAtTop`), stretched onto the box less the
 * tips (`boxFit`: shift, then scale), the tips raised (`raiseTips`). Babylon's matrices act on ROW vectors: `RotationX(t)` maps (x, y, z) to
 * (x, y cos t − z sin t, y sin t + z cos t), `RotationZ(t)` (x cos t − y sin t, x sin t + y cos t, z). `null` where the game falls back to a box.
 */
function prismOf(n: number, whole: Vec3, tip: number): { local: Vec3[]; raw: Tri3[] } | null {
  let P: Vec3[] = [];
  for (const y of [-1, 1])
    for (let j = 0; j < n; j++) {
      const a = (j * 2 * Math.PI) / n;
      P.push([Math.cos(-a), y, Math.sin(-a)]);
    }
  P.push([0, -1, 0], [0, 1, 0]);
  const flat = () => P.flat();
  const rotX = (t: number) => (p: Vec3): Vec3 => [p[0], p[1] * Math.cos(t) - p[2] * Math.sin(t), p[1] * Math.sin(t) + p[2] * Math.cos(t)];
  const rotZ = (t: number) => (p: Vec3): Vec3 => [p[0] * Math.cos(t) - p[1] * Math.sin(t), p[0] * Math.sin(t) + p[1] * Math.cos(t), p[2]];
  const dims: [number, number, number] = [whole[0], whole[1], whole[2] - 2 * tip];
  P = P.map(rotX(Math.PI / 2));
  const hubs = tip > 0 ? axisVertices(flat()) : [];
  const turn = apexTurn(flat(), n);
  if (turn !== null) {
    P = P.map(rotZ(turn));
    if (!apexAtTop(flat())) P = P.map(rotZ(-2 * turn));
  }
  const fit = turn === null || !apexAtTop(flat()) || !(dims[2] > 0) || (tip > 0 && hubs.length !== 2) ? null : boxFit(flat(), dims);
  if (fit === null) return null;
  P = P.map((p): Vec3 => [(p[0] - fit.centre[0]) * fit.scale[0], (p[1] - fit.centre[1]) * fit.scale[1], (p[2] - fit.centre[2]) * fit.scale[2]]);
  if (hubs.length > 0) {
    const f = flat();
    if (raiseTips(f, hubs, tip)) P = P.map((_, i): Vec3 => [f[3 * i]!, f[3 * i + 1]!, f[3 * i + 2]!]);
  }
  // the ring at −z: 0 … n−1, at +z: n … 2n−1, the hubs 2n (−z), 2n + 1 (+z) — each side a quad (two triangles), each end a fan round its hub
  const raw: Tri3[] = [];
  for (let j = 0; j < n; j++) {
    const k = (j + 1) % n;
    raw.push([j, k, n + k], [j, n + k, n + j], [2 * n, k, j], [2 * n + 1, n + j, n + k]);
  }
  return { local: P, raw };
}

interface Body {
  readonly spec: BodySpec;
  readonly kind: string;
  readonly turned: boolean;
  readonly local: readonly Vec3[];
  readonly part: PartSolids;
  readonly k: Convex;
  readonly box: Box3;
}

/** ⭐ a body's surface in the scene's frame (mm), as `make` builds its mesh from the descriptor (`render/scene.ts`: the contour's dims × `unitM`,
 * the orientation, the position × `unitM`); each triangle turned outward (its normal away from the body's centre) */
function bodyOf(b: BodySpec, u: number): Body {
  const m = b.margin ?? 0;
  const h = b.dims.map((d) => (d / 2 + m) * u); // the contour's half-extents (`contourDims` × unitM)
  let kind = "box";
  let local: Vec3[] = [0, 1, 2, 3, 4, 5, 6, 7].map((k): Vec3 => [(k & 1 ? 1 : -1) * h[0]!, (k & 2 ? 1 : -1) * h[1]!, (k & 4 ? 1 : -1) * h[2]!]);
  let raw: Tri3[] = BOX_FACES.flatMap(([a, b2, c2, d]) => [[a, b2, c2], [a, c2, d]] as Tri3[]);
  if (b.prismSides !== undefined) {
    const p = prismOf(b.prismSides, [2 * h[0]!, 2 * h[1]!, 2 * h[2]!], (b.prismTip ?? 0) * u);
    if (p === null) kind = "prism (the game's fallback: a box)";
    else (kind = `prism (${b.prismSides} sides${(b.prismTip ?? 0) > 0 ? `, tips ${((b.prismTip ?? 0) * u).toFixed(1)} mm` : ""})`), (local = p.local), (raw = p.raw);
  }
  // ⭐ `make`: `taperMesh` on whatever was built, when `topScale` ≠ 1 — the game's own arithmetic (`taperTop`), in the body's frame
  if (b.topScale !== 1) {
    const t = taperTop(local.flat(), b.topScale);
    if (t === null) kind += " (UNTAPERED: taperTop refused)";
    else (local = local.map((_, i): Vec3 => [t[3 * i]!, t[3 * i + 1]!, t[3 * i + 2]!])), (kind = kind === "box" ? `frustum (top ${b.topScale})` : `${kind}, tapered ${b.topScale}`);
  }
  const q = resolveBootOrientation(b.orientation, SEEDED); // undefined: identity — the game leaves the quaternion alone
  const c = b.position.map((x) => x * u);
  const pts = local.map((p): Vec3 => {
    const r = q === undefined ? p : qRotate(q, p);
    return [c[0]! + r[0], c[1]! + r[1], c[2]! + r[2]];
  });
  const tris = raw.map(([a, b2, c2]): [number, number, number] => {
    const A = pts[a]!, B = pts[b2]!, C = pts[c2]!;
    const n = [(B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])];
    const g = [(A[0] + B[0] + C[0]) / 3 - c[0]!, (A[1] + B[1] + C[1]) / 3 - c[1]!, (A[2] + B[2] + C[2]) / 3 - c[2]!];
    return n[0]! * g[0]! + n[1]! * g[1]! + n[2]! * g[2]! >= 0 ? [a, b2, c2] : [a, c2, b2];
  });
  const mesh = { name: `UFM_${b.id}`, points: pts, triangles: tris };
  const part: PartSolids = { id: b.id, frozen: false, fitMm: 0.5, pieces: [{ name: `UCX_${b.id}`, points: pts, triangles: tris }], proxy: [mesh], renders: [] };
  const box: Box3 = { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] };
  for (const p of pts) for (let d = 0; d < 3; d++) (box.lo[d] = Math.min(box.lo[d]!, p[d]!)), (box.hi[d] = Math.max(box.hi[d]!, p[d]!));
  return { spec: b, kind, turned: q !== undefined, local, part, k: convexOf(pts)!, box };
}

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

// ── the two states ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
type State = "FINISHED" | "START";
const unitOf = (sc: SceneDescriptor): number => (sc.unitM ?? 1) * 1000;
const quatOf = (o: BootOrientation): Quat => resolveBootOrientation(o, SEEDED) ?? [1, 0, 0, 0];
/** a spawn place that IS the goal: the same position (1e-9 authored units) and orientation (either sign of the quaternion) */
function samePose(b: BodySpec, f: FinalPose): boolean {
  const qa = quatOf(b.orientation), qb = quatOf(f.orientation);
  return b.position.every((x, i) => Math.abs(x - f.position[i]!) < 1e-9) && Math.abs(qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3]) > 1 - 1e-12;
}
/** ⭐ the set: FINISHED — every body at its goal (none: where it stands); START — the bodies placed from the start (spawn = goal);
 * ⛔ never a FROZEN body (the floor: not a part — his rule, the header); `left`: the loose pieces left out, AT THEIR GOALS (their goal volumes);
 * `notes`: a body with no goal, the frozen ones left out */
function posed(sc: SceneDescriptor, state: State): { bodies: Body[]; left: Body[]; notes: string[] } {
  const u = unitOf(sc);
  const goal = new Map((sc.final?.bodies ?? []).map((f) => [f.id, f]));
  const bodies: Body[] = [], left: Body[] = [], notes: string[] = [];
  const frozen = sc.bodies.filter((b) => b.frozen).map((b) => b.id);
  if (frozen.length > 0) notes.push(`frozen, never a part: ${frozen.join(" ")} (left out)`);
  for (const b of sc.bodies) {
    if (b.frozen) continue;
    const f = goal.get(b.id);
    if (f === undefined) {
      notes.push(`${b.id} has no goal (${state === "FINISHED" ? "kept where it stands" : "left out"})`);
      if (state === "FINISHED") bodies.push(bodyOf(b, u));
      continue;
    }
    if (state === "FINISHED") bodies.push(bodyOf({ ...b, position: f.position, orientation: f.orientation }, u));
    else if (samePose(b, f)) bodies.push(bodyOf(b, u));
    else left.push(bodyOf({ ...b, position: f.position, orientation: f.orientation }, u));
  }
  return { bodies, left, notes };
}

// ── packet 2's R1b, each PLACE kept ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const RAD = Math.PI / 180;
/** the sky's directions and, for each, its neighbours by angle up to `capDeg` (nearest first) — `proxy_cover.ts`'s `sky`, verbatim */
function sky(n: number, capDeg: number): { dirs: Vec3[]; nb: Int32Array[]; ang: Float64Array[]; half: number } {
  const dirs: Vec3[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y);
    dirs.push([r * Math.cos(ga * i), y, r * Math.sin(ga * i)]);
  }
  const half = Math.sqrt((4 * Math.PI) / n) / 2 / RAD;
  const cosCap = Math.cos(capDeg * RAD);
  const nb: Int32Array[] = [], ang: Float64Array[] = [];
  for (let i = 0; i < n; i++) {
    const l: [number, number][] = [];
    for (let j = 0; j < n; j++) {
      const c = dot(dirs[i]!, dirs[j]!);
      if (j !== i && c >= cosCap) l.push([j, Math.acos(Math.min(1, c)) / RAD]);
    }
    l.sort((a, b) => a[1] - b[1]);
    nb.push(Int32Array.from(l.map((x) => x[0])));
    ang.push(Float64Array.from(l.map((x) => x[1])));
  }
  return { dirs, nb, ang, half };
}
const at = (p: Vec3) => `(${p.map((x) => x.toFixed(0)).join(", ")})`;

interface Place {
  readonly deep: boolean;
  readonly area: number;
  readonly under: number;
  readonly minSky: number;
  readonly centre: Vec3;
  readonly lo: Vec3;
  readonly hi: Vec3;
  /** ≤ 800 of its voxels' centres, each with its outward normal (away from the closed solid; null where none) */
  readonly sample: readonly { readonly p: Vec3; readonly n: Vec3 | null }[];
}

/**
 * ⭐ `checkProxyCover`'s R1b (`core/proxy_cover.ts`, its R1b section as at ca4eeb0a — verbatim, but for the caps: the union has none, so the outside's
 * walls are the closed solid alone — and for memory: the closing's `D2` dropped once read, R2 not read) on one set of render triangles, KEPT ONLY TO
 * LIST THE PLACES (`checkProxyCover` returns its two lines, not its regions). `lines`: its two findings' details, as `checkProxyCover` writes them
 * (`--selfcheck` holds them equal); `places`: each place, the deep ones first, the largest first.
 */
function r1bPlaces(rtris: readonly Tri[], h: number = COVER_STEP_MM): { lines: { detail: string; info: boolean }[]; places: Place[] } {
  const out: { detail: string; info: boolean }[] = [];
  const sk = sky(R1B_SKY_N, R1B_AMBER_DEG + Math.sqrt((4 * Math.PI) / R1B_SKY_N) / 2 / RAD + 1);
  // ── R1: the render CLOSED at ρ (`voxels.ts`) — its distance field read, then the closing's own arrays let go ──
  const { g, n, cen, C, F } = (() => {
    const rc = renderClosing(rtris, h);
    const F = new Float32Array(rc.n);
    for (let x = 0; x < rc.n; x++) F[x] = Math.sqrt(rc.D2[x]!);
    return { g: rc.g, n: rc.n, cen: rc.cen, C: rc.C, F };
  })();
  const { nx, ny, nz } = g;
  // ── the shell: outside voxels the outside reaches (no caps: the closed solid the only wall), beside the closed solid ──
  const shell: number[] = [];
  (() => {
    const free1 = new Uint8Array(n);
    for (let x = 0; x < n; x++) free1[x] = C[x] ? 0 : 1;
    const reached = flood(g, free1);
    for (let x = 0; x < n; x++) {
      if (C[x] || !reached[x]) continue;
      const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
      if ((i > 0 && C[x - 1]) || (i < nx - 1 && C[x + 1]) || (j > 0 && C[x - nx]) || (j < ny - 1 && C[x + nx]) || (k > 0 && C[x - nx * ny]) || (k < nz - 1 && C[x + nx * ny])) shell.push(x);
    }
  })();
  // the closed solid's box: a ray leaving it has escaped
  let bi0 = nx, bi1 = -1, bj0 = ny, bj1 = -1, bk0 = nz, bk1 = -1;
  for (let x = 0; x < n; x++)
    if (C[x]) {
      const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
      (bi0 = Math.min(bi0, i)), (bi1 = Math.max(bi1, i)), (bj0 = Math.min(bj0, j)), (bj1 = Math.max(bj1, j)), (bk0 = Math.min(bk0, k)), (bk1 = Math.max(bk1, k));
    }
  const DC = edt(g, C);
  const rv = PROXY_PROBE_MM / h;
  const field = (px: number, py: number, pz: number): number => {
    const i = Math.floor(px), j = Math.floor(py), k = Math.floor(pz);
    if (i < 0 || j < 0 || k < 0 || i + 1 >= nx || j + 1 >= ny || k + 1 >= nz) return 0;
    const fx = px - i, fy = py - j, fz = pz - k;
    const b = i + nx * (j + ny * k), sy = nx, sz = nx * ny;
    const c00 = F[b]! * (1 - fx) + F[b + 1]! * fx, c10 = F[b + sy]! * (1 - fx) + F[b + sy + 1]! * fx;
    const c01 = F[b + sz]! * (1 - fx) + F[b + sz + 1]! * fx, c11 = F[b + sy + sz]! * (1 - fx) + F[b + sy + sz + 1]! * fx;
    return (c00 * (1 - fy) + c10 * fy) * (1 - fz) + (c01 * (1 - fy) + c11 * fy) * fz;
  };
  let origin: Vec3 = [0, 0, 0];
  const setOrigin = (x0: number, nn: Vec3 | null): void => {
    const i = x0 % nx, j = Math.floor(x0 / nx) % ny, k = Math.floor(x0 / (nx * ny));
    origin = [i, j, k];
    if (nn === null) return;
    if (field(i + nn[0], j + nn[1], k + nn[2]) < rv) origin = [i + nn[0], j + nn[1], k + nn[2]];
  };
  const escapes = (_x0: number, d: Vec3): boolean => {
    let px = origin[0], py = origin[1], pz = origin[2];
    for (;;) {
      const i = Math.round(px), j = Math.round(py), k = Math.round(pz);
      if (i < bi0 || i > bi1 || j < bj0 || j > bj1 || k < bk0 || k > bk1) return true;
      const f = field(px, py, pz);
      if (f > rv) return false;
      const st = Math.max(0.25, rv - f, Math.sqrt(DC[i + nx * (j + ny * k)]!) - 1.75);
      (px += d[0] * st), (py += d[1] * st), (pz += d[2] * st);
    }
  };
  const normalAt = (x: number): Vec3 | null => {
    const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
    let a = 0, b = 0, c = 0;
    for (let dk = -2; dk <= 2; dk++)
      for (let dj = -2; dj <= 2; dj++)
        for (let di = -2; di <= 2; di++) {
          const I = i + di, J = j + dj, K = k + dk;
          if (I < 0 || J < 0 || K < 0 || I >= nx || J >= ny || K >= nz || !C[I + nx * (J + ny * K)]) continue;
          (a -= di), (b -= dj), (c -= dk);
        }
    const l = Math.hypot(a, b, c);
    return l > 1e-9 ? [a / l, b / l, c / l] : null;
  };
  const memo = new Int8Array(R1B_SKY_N);
  const cos45 = Math.SQRT1_2;
  let lastBest = -1;
  const skyAt = (x: number): number => {
    memo.fill(0);
    setOrigin(x, normalAt(x));
    const vis = (d: number): boolean => {
      let m = memo[d]!;
      if (m === 0) (m = escapes(x, sk.dirs[d]!) ? 1 : 2), (memo[d] = m);
      return m === 1;
    };
    const alpha = (d: number): number => {
      const l = sk.nb[d]!;
      for (let q = 0; q < l.length; q++) if (!vis(l[q]!)) return sk.ang[d]![q]!;
      return Infinity;
    };
    let best = -1, aBest = -1;
    const nn = normalAt(x);
    if (nn !== null) {
      const cand: [number, number][] = [];
      for (let d = 0; d < R1B_SKY_N; d++) {
        const c = dot(nn, sk.dirs[d]!);
        if (c >= cos45) cand.push([d, c]);
      }
      cand.sort((a, b) => b[1] - a[1]);
      for (const [d] of cand) {
        if (!vis(d)) continue;
        const a = alpha(d);
        if (a === Infinity) return 90;
        if (a > aBest) (aBest = a), (best = d);
      }
    }
    let any = best >= 0;
    for (let d = 0; d < R1B_SKY_N; d++) {
      if (!vis(d)) continue;
      any = true;
      const a = alpha(d);
      if (a === Infinity) return 90;
      if (a > aBest) (aBest = a), (best = d);
    }
    if (!any) return 0;
    lastBest = best;
    return aBest;
  };
  const fineSky = (x: number, d0: Vec3, a0: number): number => {
    setOrigin(x, normalAt(x));
    const Rc = (a0 + 4 * sk.half + R1B_FINE_DEG) * RAD, dl = R1B_FINE_DEG * RAD;
    const M = Math.ceil((2 * Math.PI * (1 - Math.cos(Rc))) / (dl * dl));
    const t = Math.abs(d0[0]) < 0.9 ? cross(d0, [1, 0, 0]) : cross(d0, [0, 1, 0]);
    const tl = Math.hypot(t[0], t[1], t[2]);
    const u: Vec3 = [t[0] / tl, t[1] / tl, t[2] / tl], w = cross(d0, u);
    const ga = Math.PI * (3 - Math.sqrt(5));
    const dirs: Vec3[] = [], free: boolean[] = [];
    for (let i = 0; i < M; i++) {
      const ct = 1 - (1 - Math.cos(Rc)) * ((i + 0.5) / M), st = Math.sqrt(Math.max(0, 1 - ct * ct)), ph = ga * i;
      const d: Vec3 = [d0[0] * ct + (u[0] * Math.cos(ph) + w[0] * Math.sin(ph)) * st, d0[1] * ct + (u[1] * Math.cos(ph) + w[1] * Math.sin(ph)) * st, d0[2] * ct + (u[2] * Math.cos(ph) + w[2] * Math.sin(ph)) * st];
      dirs.push(d);
      free.push(escapes(x, d));
    }
    const blocked = dirs.filter((_, i) => !free[i]);
    const near = Math.cos(2 * sk.half * RAD);
    let r = 0;
    for (let i = 0; i < M; i++) {
      if (!free[i] || dot(dirs[i]!, d0) < near) continue;
      let c = -1;
      for (const b of blocked) c = Math.max(c, dot(dirs[i]!, b));
      if (c < 0) return 90;
      r = Math.max(r, Math.acos(Math.min(1, c)) / RAD - R1B_FINE_DEG / 2);
    }
    return Math.max(0, r);
  };
  const isShell = new Uint8Array(n);
  for (const x of shell) isShell[x] = 1;
  const sampleOf = new Int32Array(n).fill(-1);
  const samples: number[] = [];
  for (const x of shell) {
    if (sampleOf[x] !== -1) continue;
    samples.push(x);
    const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
    for (let dk = -1; dk <= 1; dk++)
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const I = i + di, J = j + dj, K = k + dk;
          if (I < 0 || J < 0 || K < 0 || I >= nx || J >= ny || K >= nz) continue;
          const y = I + nx * (J + ny * K);
          if (isShell[y] && sampleOf[y] === -1) sampleOf[y] = x;
        }
  }
  const cls = new Int8Array(n); // 0 open, 1 amber, 2 deep, 3 undercut
  const skyOf = new Float32Array(n);
  for (const x of samples) {
    const a = skyAt(x);
    if (a >= 90) (cls[x] = 0), (skyOf[x] = 90);
    else if (a <= 0) (cls[x] = 3), (skyOf[x] = 0);
    else {
      let lo = a - 2 * sk.half, hi = a + sk.half, r = a - sk.half;
      if (lo < R1B_AMBER_DEG && hi >= R1B_AMBER_DEG) (r = fineSky(x, sk.dirs[lastBest]!, a)), (lo = hi = r);
      skyOf[x] = Math.max(0, r);
      cls[x] = hi < R1B_DEEP_DEG ? 2 : lo >= R1B_AMBER_DEG ? 0 : 1;
    }
  }
  for (const x of shell) (cls[x] = cls[sampleOf[x]!]!), (skyOf[x] = skyOf[sampleOf[x]!]!);
  const regions = (mark: (x: number) => boolean): number[][] => {
    const seen = new Uint8Array(n);
    const res: number[][] = [];
    for (const x0 of shell) {
      if (seen[x0] || !mark(x0)) continue;
      const comp: number[] = [];
      const st = [x0];
      seen[x0] = 1;
      while (st.length > 0) {
        const x = st.pop()!;
        comp.push(x);
        const i = x % nx, j = Math.floor(x / nx) % ny, k = Math.floor(x / (nx * ny));
        for (let dk = -1; dk <= 1; dk++)
          for (let dj = -1; dj <= 1; dj++)
            for (let di = -1; di <= 1; di++) {
              const I = i + di, J = j + dj, K = k + dk;
              if (I < 0 || J < 0 || K < 0 || I >= nx || J >= ny || K >= nz) continue;
              const y = I + nx * (J + ny * K);
              if (!seen[y] && mark(y)) (seen[y] = 1), st.push(y);
            }
      }
      res.push(comp);
    }
    return res;
  };
  const centre = (c: readonly number[]): Vec3 => {
    const s = [0, 0, 0] as [number, number, number];
    for (const x of c) {
      const p = cen(x);
      (s[0] += p[0]), (s[1] += p[1]), (s[2] += p[2]);
    }
    return [s[0] / c.length, s[1] / c.length, s[2] / c.length];
  };
  const comps = regions((x) => isShell[x] === 1 && cls[x]! > 0).sort((a, b) => b.length - a.length);
  const deepFlag = comps.map((c) => c.some((x) => cls[x]! >= 2));
  const deepC = comps.filter((_, i) => deepFlag[i]), amberC = comps.filter((_, i) => !deepFlag[i]);
  const sum = (cs: number[][]) => cs.reduce((t, c) => t + c.length, 0) * h * h;
  const minSky = (c: number[]) => minOver(c, (x) => skyOf[x]!);
  if (deepC.length > 0) {
    const under = deepC.reduce((t, c) => t + c.filter((x) => cls[x] === 3).length, 0);
    const big = deepC[0]!;
    out.push({ info: false, detail: `${deepC.length} place(s) DEEPER than their mouth is wide${under > 0 ? ` or UNDERCUT (${under} points with no straight way out)` : ""} NOT CAPPED — ≈ ${sum(deepC).toFixed(0)} mm² of the outer surface; the largest ≈ ${(big.length * h * h).toFixed(0)} mm² round ${at(centre(big))}, its narrowest sky ±${minSky(big).toFixed(0)}° (under ±${R1B_DEEP_DEG}°): a flush cap (\`…_cap…\`) over each mouth` });
  }
  if (amberC.length > 0) {
    const big = amberC[0]!;
    out.push({ info: true, detail: `BORDERLINE (amber): ${amberC.length} place(s) about as deep as their mouth is wide (sky ±${R1B_DEEP_DEG}° – ±${R1B_AMBER_DEG.toFixed(1)}°) — ≈ ${sum(amberC).toFixed(0)} mm²; the largest ≈ ${(big.length * h * h).toFixed(0)} mm² round ${at(centre(big))}: capped or followed, the author's choice` });
  }
  // ── each place: its size, its narrowest sky, its undercut points, its box, a sample of its voxels (≤ 800) with their outward normals ──
  const places: Place[] = [...deepC, ...amberC].map((c, i) => {
    const lo: [number, number, number] = [Infinity, Infinity, Infinity], hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const x of c) {
      const p = cen(x);
      for (let k = 0; k < 3; k++) (lo[k] = Math.min(lo[k]!, p[k]!)), (hi[k] = Math.max(hi[k]!, p[k]!));
    }
    const stride = Math.max(1, Math.floor(c.length / 800));
    const sample: { p: Vec3; n: Vec3 | null }[] = [];
    for (let k = 0; k < c.length; k += stride) sample.push({ p: cen(c[k]!), n: normalAt(c[k]!) });
    return { deep: i < deepC.length, area: c.length * h * h, under: c.filter((x) => cls[x] === 3).length, minSky: minSky(c), centre: centre(c), lo, hi, sample };
  });
  return { lines: out, places };
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

const rtrisOf = (p: PartSolids): Tri[] => p.renders.flatMap((r) => r.triangles.map(([a, b, c]) => [r.points[a]!, r.points[b]!, r.points[c]!] as const));
const unionOf = (id: string, parts: readonly PartSolids[]): PartSolids => ({ id, frozen: false, fitMm: 0.5, pieces: parts.flatMap((p) => p.pieces), proxy: [{ name: "UFM_union_dummy", points: [[0, 0, 0], [1, 0, 0], [0, 1, 0]], triangles: [[0, 1, 2]] }], renders: parts.flatMap((p) => p.proxy) });
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
