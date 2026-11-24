/**
 * ⭐⭐⭐ (2026-11-24, S7 — `ORBIT_SURFACE_PART_CHECKS.md` §14 (his answers: as recommended), §15 (as designed)) B3 AND B5 — at each stage of the plan,
 * where the HELD piece (the part placed next) FIRST TOUCHES each exposed face of the placed parts (P2: the game's own landing map, `landing_map.ts` —
 * one implementation), and every exposed face that is NO PLACE, with its reason. INFORMATION (his Q3): never a failure until the playability brief
 * (`ORBIT_SURFACE.md` §7bis.2) names the faces a later part needs. Pure, engine-free, in mm (the landing map's metres inside).
 */
import { restingCandidates } from "./collision_cover";
import { apply, type Placement } from "./glb_geometry";
import { heldReach, heldSumsOn, LANDING_STEP_MM, landingFor, preparePlaced, type ConvexPiece } from "./landing_map";
import { B1_FIT_MM, B2_STEP_MM, exposedPerStage, proxyFaceModels, R7_PLANAR_DEG, type B2Tri, type B2Visit, type PartSolids } from "./part_checks";
import { PROXY_FLUSH_MM } from "./units";
import { cross, dot, normalize, qFromAxisAngle, qmul, qRotate, shortestArc, sub, type Vec3 } from "./vec";

const M = 0.001;
const RAD = Math.PI / 180;
type Tri = readonly [Vec3, Vec3, Vec3];

/** ⭐ B5's reasons, in the order they are read (§15 item 7): the first that holds names the face */
export type FaceReason = "capped" | "frozen" | "below the share" | "under an overhang" | "closed for the piece";
/** one exposed face of a placed part at a stage: its node, its outward normal and level (n·p, mm) in the scene frame, its exposed triangles and area */
export interface StageFace {
  readonly part: string;
  readonly node: string;
  readonly n: Vec3;
  readonly levelMm: number;
  readonly areaMm2: number;
  readonly tris: readonly Tri[];
}
/** ⭐ one face read for the held piece: B3's `landable` (and the first turn it lands for), B5's `reason` (`null`: a PLACE) */
export interface B3Face {
  readonly part: string;
  readonly node: string;
  readonly n: Vec3;
  readonly levelMm: number;
  readonly areaMm2: number;
  readonly samples: number;
  readonly landable: boolean;
  readonly turn: 0 | 90 | null;
  /** samples where the piece's contact lies BELOW the face by more than the fit (nothing under the proxy — B1e's) */
  readonly below: number;
  readonly reason: FaceReason | null;
}
export interface B3Stage {
  readonly placed: readonly string[];
  readonly held: string;
  /** the held piece's face it rests on (its `…_rest` proxy, or its largest resting candidate); `null`: NO ORIENTATION — its faces not read */
  readonly resting: string | null;
  readonly faces: readonly B3Face[];
  readonly ms: number;
}
export interface LandingStageOpts {
  /**
   * ⭐ is each face in a facet of the game's face map? (the game's `buildFaceMap`, `src/input` — passed in: `src/core` imports none). Absent: the share
   * not read. Called at EVERY stage with exposed faces (`placed`: its placed parts), a held piece with no orientation included (S8 reads its map).
   */
  readonly inFaceMap?: (faces: readonly StageFace[], placed: readonly string[]) => readonly boolean[];
  /** the samples' spacing on a face (mm) */
  readonly stepMm?: number;
}

const area = (t: Tri): number => {
  const c = cross(sub(t[1], t[0]), sub(t[2], t[0]));
  return Math.hypot(c[0], c[1], c[2]) / 2;
};
/** an orthonormal pair in the plane of `n` (deterministic) */
function axesOf(n: Vec3): readonly [Vec3, Vec3] {
  const seed: Vec3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const t = normalize(cross(seed, n))!;
  return [t, cross(n, t)];
}
/** does the ray from `p` along `d` meet the triangle beyond 0.01 mm? (Möller – Trumbore, one side) */
function hitsAhead(p: Vec3, d: Vec3, t: Tri): boolean {
  const e1 = sub(t[1], t[0]), e2 = sub(t[2], t[0]);
  const h = cross(d, e2);
  const a = dot(e1, h);
  if (Math.abs(a) < 1e-12) return false;
  const s = sub(p, t[0]);
  const u = dot(s, h) / a;
  if (u < 0 || u > 1) return false;
  const q = cross(s, e1);
  const v = dot(d, q) / a;
  if (v < 0 || u + v > 1) return false;
  return dot(e2, q) / a > 0.01;
}

/** ⭐ (§15 item 2) the stage's exposed REAL proxy triangles, per part and node, grouped by plane (normals within R7's 1°, levels within the flush) */
export function stageFaces(v: B2Visit): StageFace[] {
  const cos = Math.cos(R7_PLANAR_DEG * RAD);
  const out: StageFace[] = [];
  for (const p of v.parts) {
    const groups: { node: string; n: Vec3; level: number; tris: Tri[] }[] = [];
    p.tris.forEach((tr: B2Tri, i) => {
      if (!tr.real || p.state[i] !== 0) return;
      const level = dot(tr.n, tr.t[0]);
      const g = groups.find((x) => x.node === tr.node && dot(x.n, tr.n) >= cos && Math.abs(x.level - level) <= PROXY_FLUSH_MM);
      if (g === undefined) groups.push({ node: tr.node, n: tr.n, level, tris: [tr.t] });
      else g.tris.push(tr.t);
    });
    for (const g of groups) out.push({ part: p.id, node: g.node, n: g.n, levelMm: g.level, areaMm2: g.tris.reduce((s, t) => s + area(t), 0), tris: g.tris });
  }
  return out.sort((a, b) => (a.part < b.part ? -1 : a.part > b.part ? 1 : a.node < b.node ? -1 : a.node > b.node ? 1 : a.levelMm - b.levelMm));
}

/** ⭐ (§15 item 5) the face's samples: a lattice every `step` mm in its plane (anchored at the origin) inside each triangle, and each triangle's centre */
export function faceSamples(f: StageFace, step: number): Vec3[] {
  const [t, b] = axesOf(f.n);
  const out: Vec3[] = [];
  for (const tr of f.tris) {
    out.push([(tr[0][0] + tr[1][0] + tr[2][0]) / 3, (tr[0][1] + tr[1][1] + tr[2][1]) / 3, (tr[0][2] + tr[1][2] + tr[2][2]) / 3]);
    const uv = tr.map((q) => [dot(q, t), dot(q, b)] as const);
    const [a0, a1, a2] = uv as unknown as [readonly [number, number], readonly [number, number], readonly [number, number]];
    const det = (a1[0] - a0[0]) * (a2[1] - a0[1]) - (a2[0] - a0[0]) * (a1[1] - a0[1]);
    if (Math.abs(det) < 1e-9) continue;
    const uLo = Math.ceil(Math.min(a0[0], a1[0], a2[0]) / step), uHi = Math.floor(Math.max(a0[0], a1[0], a2[0]) / step);
    const vLo = Math.ceil(Math.min(a0[1], a1[1], a2[1]) / step), vHi = Math.floor(Math.max(a0[1], a1[1], a2[1]) / step);
    for (let i = uLo; i <= uHi; i++)
      for (let j = vLo; j <= vHi; j++) {
        const u = i * step, w = j * step;
        const l1 = ((u - a0[0]) * (a2[1] - a0[1]) - (a2[0] - a0[0]) * (w - a0[1])) / det;
        const l2 = ((a1[0] - a0[0]) * (w - a0[1]) - (u - a0[0]) * (a1[1] - a0[1])) / det;
        if (l1 < -1e-9 || l2 < -1e-9 || l1 + l2 > 1 + 1e-9) continue;
        out.push([tr[0][0] + (tr[1][0] - tr[0][0]) * l1 + (tr[2][0] - tr[0][0]) * l2, tr[0][1] + (tr[1][1] - tr[0][1]) * l1 + (tr[2][1] - tr[0][1]) * l2, tr[0][2] + (tr[1][2] - tr[0][2]) * l1 + (tr[2][2] - tr[0][2]) * l2]);
      }
  }
  return out;
}

/** ⭐ (§15 item 3) the held part's resting face: its largest `…_rest` proxy, else its largest resting candidate — its node, outward normal and centre */
export function restingFaceOf(part: PartSolids): { readonly node: string; readonly n: Vec3; readonly centre: Vec3 } | null {
  const models = proxyFaceModels(part).filter((f) => f.n !== null);
  const sized = (name: string) => models.find((f) => f.name === name);
  const rests = models.filter((f) => /_rest$/.test(f.name)).sort((a, b) => b.tris.reduce((s, t) => s + area(t), 0) - a.tris.reduce((s, t) => s + area(t), 0));
  const f = rests[0] ?? (() => {
    const c = restingCandidates(part)[0];
    return c === undefined ? undefined : sized(c.name);
  })();
  if (f === undefined) return null;
  let A = 0, cx = 0, cy = 0, cz = 0;
  for (const t of f.tris) {
    const a = area(t);
    (A += a), (cx += (a * (t[0][0] + t[1][0] + t[2][0])) / 3), (cy += (a * (t[0][1] + t[1][1] + t[2][1])) / 3), (cz += (a * (t[0][2] + t[1][2] + t[2][2])) / 3);
  }
  return A > 0 ? { node: f.name, n: f.n!, centre: [cx / A, cy / A, cz / A] } : null;
}

/**
 * ⭐⭐⭐ B3 + B5 — per stage (B2's walk, `exposedPerStage`'s visitor), the held piece (the next part of B2's order: the frozen first, then the plan's)
 * against each exposed face: its RESTING face turned onto −n (the least turn), then 0° and 90° about n; P2 read from outside over each sample, the
 * piece's CONTACT = P2's depth less its reach (`heldReach`); LANDABLE where the contact lies within the fit (`B1_FIT_MM`) of the face's plane at some
 * sample for either turn. B5's reason: capped → frozen → below the share → (landable: a PLACE) → under an overhang → closed for the piece.
 * `parts`: `readPartSolids`, in the plan's order; `goals`: each part's goal in the scene frame (mm); `frozen`: the parts placed from the start.
 */
export function landingPerStage(parts: readonly PartSolids[], goals: ReadonlyMap<string, Placement>, frozen: ReadonlySet<string>, opts: LandingStageOpts = {}): B3Stage[] {
  const step = opts.stepMm ?? LANDING_STEP_MM;
  const fit = B1_FIT_MM * M;
  const byId = new Map(parts.map((p) => [p.id, p] as const));
  const order = [...parts.filter((p) => frozen.has(p.id)), ...parts.filter((p) => !frozen.has(p.id))].map((p) => p.id);
  const visits: B2Visit[] = [];
  exposedPerStage(parts, goals, frozen, B2_STEP_MM, (v) => visits.push(v));
  const placedPieces = new Map(
    parts.map((p) => {
      const g = goals.get(p.id)!;
      return [p.id, p.pieces.map((pc): ConvexPiece => ({ id: p.id, points: pc.points.map((q) => { const w = apply(g, q); return [w[0] * M, w[1] * M, w[2] * M] as Vec3; }) }))] as const;
    }),
  );
  const capsOf = (id: string): Tri[] => {
    const p = byId.get(id)!, g = goals.get(id)!;
    return p.proxy.filter((x) => x.name.includes("_cap")).flatMap((x) => x.triangles.map(([a, b, c]) => [apply(g, x.points[a]!), apply(g, x.points[b]!), apply(g, x.points[c]!)] as Tri));
  };
  const out: B3Stage[] = [];
  for (const v of visits) {
    const s = v.placed.length;
    if (s >= order.length) continue;
    const t0 = performance.now();
    const held = byId.get(order[s]!)!;
    const rest = restingFaceOf(held);
    const faces = stageFaces(v);
    const kept = faces.length > 0 ? opts.inFaceMap?.(faces, v.placed) : undefined;
    if (rest === null || faces.length === 0) {
      out.push({ placed: v.placed, held: held.id, resting: rest?.node ?? null, faces: [], ms: performance.now() - t0 });
      continue;
    }
    const pp = preparePlaced(v.placed.flatMap((id) => placedPieces.get(id)!));
    const caps = v.placed.flatMap(capsOf);
    // the held piece turned onto each face direction, both turns, prepared once per (normal, turn)
    const prepared = new Map<string, { at: (p: Vec3) => { kind: string; contact: number; part: string } }>();
    const preparedFor = (n: Vec3, turn: 0 | 90) => {
      const key = `${n.map((x) => x.toFixed(6)).join(",")}#${turn}`;
      let got = prepared.get(key);
      if (got === undefined) {
        const q = qmul(qFromAxisAngle(n, turn * RAD), shortestArc(rest.n, [-n[0], -n[1], -n[2]]));
        const pts = held.pieces.map((pc) => pc.points.map((p) => { const w = qRotate(q, sub(p, rest.centre)); return [w[0] * M, w[1] * M, w[2] * M] as Vec3; }));
        const [tu, tb] = axesOf(n);
        const prep = landingFor(heldSumsOn(pp, pts), { origin: [0, 0, 0], u: tu, v: tb, n });
        const reach = heldReach(pts, n);
        got = {
          at: (p: Vec3) => {
            const l = prep.landingAt(dot(p, tu) * M, dot(p, tb) * M);
            return l.kind === "land" ? { kind: "land", contact: l.depth - reach, part: l.part } : { kind: l.kind, contact: NaN, part: "" };
          },
        };
        prepared.set(key, got);
      }
      return got;
    };
    const read: B3Face[] = faces.map((f, fi) => {
      const samples = faceSamples(f, step);
      const plane = f.levelMm * M;
      let landable = false, turn: 0 | 90 | null = null, below = 0, allOther = samples.length > 0;
      for (const tn of [0, 90] as const) {
        const pr = preparedFor(f.n, tn);
        for (const p of samples) {
          const r = pr.at(p);
          if (r.kind !== "land") {
            allOther = false;
            continue;
          }
          const gap = r.contact - plane;
          if (Math.abs(gap) <= fit) {
            landable = true;
            turn = tn;
            break;
          }
          if (gap < -fit) below++;
          if (!(r.part !== f.part && gap > fit)) allOther = false;
        }
        if (landable) break;
      }
      const capped = caps.length > 0 && samples.length > 0 && samples.every((p) => caps.some((t) => hitsAhead(p, f.n, t)));
      const reason: FaceReason | null = capped ? "capped" : frozen.has(f.part) ? "frozen" : kept !== undefined && kept[fi] !== true ? "below the share" : landable ? null : allOther ? "under an overhang" : "closed for the piece";
      return { part: f.part, node: f.node, n: f.n, levelMm: f.levelMm, areaMm2: f.areaMm2, samples: samples.length, landable, turn, below, reason };
    });
    out.push({ placed: v.placed, held: held.id, resting: rest.node, faces: read, ms: performance.now() - t0 });
  }
  return out;
}
