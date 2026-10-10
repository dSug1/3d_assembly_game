/**
 * ⭐⭐⭐ **THE RESTING-FACE SELECTOR** — which face a part is instinctively laid on, and its principal axis.
 *
 * Design of record: [`Claude/40_RENDER_SCENE/spec/RESTING_FACE.md`] (the owner, 2026-10-04/05). In the part's OWN frame, from its
 * welded mesh, uniform density. ⛔ It moves nothing: it answers which face is a stable REFERENCE for the rotation to start from.
 *
 * The order of the rule (§3–§6):
 * 1. **Candidates** — the logical faces, coplanar ones merged; each one's support polygon (the 2D hull of the vertices on its
 *    plane), the centre of mass's height `h` above it and projection `c` on it, the distances `d_min` / `d_max` from `c` to the
 *    lines of the polygon's edges. ⛔ `c` outside the polygon, or the face not a supporting plane (a non-convex part): discarded.
 * 2. **The gate** — the tipping angle `θ = atan2(d_min, h)` below `thetaFloorDeg` (15°): rejected.
 * 3. **`M` FIRST** — the mirror planes of the solid that CONTAIN the face's normal (the owner: *"the face which maximizes the number
 *    of plane symmetries in the vertical direction shall be preferred: this way, a bottle stands up"*).
 * 4. **Then the score** `wS·S + wC·C + wI·I`; inside `ambiguityBand` of the best, the LOWER centre of mass wins.
 * 5. **Equivalence groups** — faces the rule cannot tell apart are ONE answer (the prism's two ends); the face chosen from the
 *    winning group is the one needing the smallest turn from the part's pose (`chooseInGroup`).
 *
 * ⛔ ENGINE-FREE (rule 1).
 */
import { add, cross, dot, length, normalize, qFromAxisAngle, qmul, qRotate, scale, shortestArc, sub, type Quat, type Vec3 } from "./vec";

/** ⭐ Every tolerance and weight of the rule (§10), lengths as shares of the bounding-box diagonal. */
export interface RestingConfig {
  readonly coplanarAngleDeg: number;
  readonly coplanarDistShare: number;
  readonly contactShare: number;
  readonly thetaFloorDeg: number;
  readonly symShare: number;
  readonly symAngleDeg: number;
  readonly wS: number;
  readonly wC: number;
  readonly wI: number;
  readonly ambiguityBand: number;
  readonly axisDegenerateTol: number;
}

/** ⭐ The agreed values (§10, §12: `thetaFloorDeg` FIXED at 15° — *"fix. we can later make a slider"*). */
export const RESTING_DEFAULTS: RestingConfig = {
  coplanarAngleDeg: 1,
  coplanarDistShare: 0.01,
  contactShare: 0.005,
  thetaFloorDeg: 15,
  symShare: 0.005,
  symAngleDeg: 1,
  wS: 0.55,
  wC: 0.2,
  wI: 0.15,
  ambiguityBand: 0.05,
  axisDegenerateTol: 0.05,
};

/** ⭐ One candidate support plane (one face, or coplanar faces merged): its metrics. Lengths in the mesh's own units. */
export interface RestingCandidate {
  /** The indices of the input faces it merges. */
  readonly faces: readonly number[];
  /** Its OUTWARD normal, in the part's frame — the direction that points DOWN when the part rests on it. */
  readonly normal: Vec3;
  readonly h: number;
  readonly dMin: number;
  readonly dMax: number;
  readonly thetaDeg: number;
  /** ⭐ `M` — the solid's mirror planes containing the normal. */
  readonly mirrors: number;
  readonly S: number;
  readonly C: number;
  readonly I: number;
  readonly score: number;
}

/** ⭐ Candidates the rule cannot tell apart — the same `M`, the same score, the same `h` (§6). */
export interface RestingGroup {
  readonly members: readonly RestingCandidate[];
  readonly mirrors: number;
  readonly score: number;
  readonly h: number;
}

export interface RestingResult {
  /** The centre of mass (the volume centroid), in the part's frame. */
  readonly com: Vec3;
  /** The groups that pass the gate, best first (the winner first). */
  readonly groups: readonly RestingGroup[];
  /** The candidates refused by the gate (θ below the floor) — reported, never chosen. */
  readonly rejected: readonly RestingCandidate[];
  /** `groups[0]`, or `null` when the part has no face at all. */
  readonly winner: RestingGroup | null;
  /**
   * ⚠ No face passed the gate — a ROUND part lying down: a faceted cylinder's side tips at half its facet angle (7.5° for 24
   * sides). Then the groups are the refused faces ranked by the tipping angle, the least tippable first (a fallback the spec did not
   * cover — to be confirmed by the owner).
   */
  readonly belowGate: boolean;
  /** The runner-up, when it was within the ambiguity band of the winner (same `M`) — reported, never chosen. */
  readonly ambiguous: RestingGroup | null;
  /** ⭐ The direction of the largest extent (the smallest moment of inertia), or `null` when it is not distinguished (§7). */
  readonly principalAxis: Vec3 | null;
}

/** ⭐ The volume, the centre of mass and the second moment `∫ x xᵀ dV` about the centre of mass, by signed tetrahedra. */
export function massProperties(
  positions: readonly Vec3[],
  triangles: readonly number[],
): { readonly volume: number; readonly com: Vec3; readonly second: readonly (readonly number[])[] } {
  let det6 = 0;
  let g: Vec3 = [0, 0, 0];
  const C = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let t = 0; t + 2 < triangles.length; t += 3) {
    const a = positions[triangles[t]!]!;
    const b = positions[triangles[t + 1]!]!;
    const c = positions[triangles[t + 2]!]!;
    const det = dot(a, cross(b, c));
    det6 += det;
    const s = add(add(a, b), c);
    g = add(g, scale(s, det));
    // ⭐ the tetrahedron (0, a, b, c): ∫ x xᵀ = det/120 · (a aᵀ + b bᵀ + c cᵀ + s sᵀ)
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) C[i]![j]! += (det / 120) * (a[i]! * a[j]! + b[i]! * b[j]! + c[i]! * c[j]! + s[i]! * s[j]!);
  }
  // ⚠ An inward winding gives a negative volume: the ratios are unchanged, the moments flip — so the sign is taken out.
  const sign = det6 < 0 ? -1 : 1;
  const volume = (sign * det6) / 6;
  const com: Vec3 = det6 === 0 ? [0, 0, 0] : scale(g, 1 / (4 * det6));
  const second = C.map((row, i) => row.map((v, j) => sign * v - volume * com[i]! * com[j]!));
  return { volume, com, second };
}

/** ⭐ The eigenvalues and unit eigenvectors of a symmetric 3×3 matrix (cyclic Jacobi), eigenvalues ascending. */
export function symmetricEigen3(m: readonly (readonly number[])[]): { readonly values: readonly number[]; readonly vectors: readonly Vec3[] } {
  const a = m.map((r) => [...r]);
  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let sweep = 0; sweep < 50; sweep++) {
    const off = a[0]![1]! ** 2 + a[0]![2]! ** 2 + a[1]![2]! ** 2;
    if (off < 1e-30) break;
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ] as const) {
      if (Math.abs(a[p]![q]!) < 1e-300) continue;
      const theta = (a[q]![q]! - a[p]![p]!) / (2 * a[p]![q]!);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) {
        const akp = a[k]![p]!;
        const akq = a[k]![q]!;
        a[k]![p] = c * akp - s * akq;
        a[k]![q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p]![k]!;
        const aqk = a[q]![k]!;
        a[p]![k] = c * apk - s * aqk;
        a[q]![k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k]![p]!;
        const vkq = v[k]![q]!;
        v[k]![p] = c * vkp - s * vkq;
        v[k]![q] = s * vkp + c * vkq;
      }
    }
  }
  const order = [0, 1, 2].sort((i, j) => a[i]![i]! - a[j]![j]!);
  return {
    values: order.map((i) => a[i]![i]!),
    vectors: order.map((i) => [v[0]![i]!, v[1]![i]!, v[2]![i]!] as Vec3),
  };
}

/**
 * ⭐⭐ **THE SOLID'S MIRROR PLANES THROUGH ITS CENTRE OF MASS** (§4) — each as its unit normal `m` (`m` and `−m` one plane).
 * Candidates: the direction between every pair of vertices (any mirror plane that is not the identity maps some vertex onto
 * another, and that pair's difference IS its normal); merged within `angleDeg`. A candidate is a mirror plane when every vertex,
 * reflected across it, lands within `tol` of a vertex. ⚠ It reads the VERTEX SET, not the surface, and is all-or-nothing beyond
 * `tol` (a chamfer larger than `tol` removes a plane) — the cost the owner accepted.
 */
export function mirrorPlanes(positions: readonly Vec3[], com: Vec3, tol: number, angleDeg: number): Vec3[] {
  const cosA = Math.cos((angleDeg * Math.PI) / 180);
  const cands: Vec3[] = [];
  for (let i = 0; i < positions.length; i++)
    for (let j = i + 1; j < positions.length; j++) {
      const d = sub(positions[i]!, positions[j]!);
      if (length(d) < tol) continue;
      const m = normalize(d)!;
      if (!cands.some((c) => Math.abs(dot(c, m)) > cosA)) cands.push(m);
    }
  return cands.filter((m) =>
    positions.every((p) => {
      const r = sub(p, scale(m, 2 * dot(sub(p, com), m)));
      return positions.some((q) => length(sub(r, q)) <= tol);
    }),
  );
}

/** ⭐ `M` for a face normal `n`: the mirror planes CONTAINING it — their normals perpendicular to `n` (within `angleDeg`). */
export function mirrorsContaining(planes: readonly Vec3[], n: Vec3, angleDeg: number): number {
  const sinA = Math.sin((angleDeg * Math.PI) / 180);
  return planes.filter((m) => Math.abs(dot(m, n)) <= sinA).length;
}

/** ⭐ The 2D convex hull (Andrew's monotone chain), counter-clockwise, collinear points dropped. */
export function hull2(points: readonly (readonly [number, number])[]): [number, number][] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((q) => [q[0], q[1]] as [number, number]);
  if (p.length < 3) return p;
  const x = (o: readonly number[], a: readonly number[], b: readonly number[]): number =>
    (a[0]! - o[0]!) * (b[1]! - o[1]!) - (a[1]! - o[1]!) * (b[0]! - o[0]!);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && x(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]!;
    while (upper.length >= 2 && x(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * ⭐ The winner among ranked groups (best `M`, then best score, first): inside `band` of the best score — the SAME `M` — the
 * LOWER centre of mass wins (§5: the source spec's shared-edge shortcut, without its precondition). The runner-up inside the band
 * is reported as `ambiguous`.
 */
export function pickWinner(
  ranked: readonly RestingGroup[],
  band: number,
): { readonly groups: readonly RestingGroup[]; readonly ambiguous: RestingGroup | null } {
  const [first, second] = ranked;
  if (first === undefined || second === undefined || second.mirrors !== first.mirrors || first.score - second.score >= band)
    return { groups: ranked, ambiguous: null };
  const winner = second.h < first.h ? second : first;
  const other = winner === first ? second : first;
  return { groups: [winner, other, ...ranked.slice(2)], ambiguous: other };
}

/**
 * ⭐⭐⭐ **THE SELECTOR** — the ranked resting faces of a part from its welded mesh (`meshTopology`'s positions and logical
 * faces, in its own frame).
 */
export function restingFaces(
  positions: readonly Vec3[],
  faces: readonly { readonly normal: Vec3; readonly centre: Vec3; readonly triangles: readonly number[] }[],
  cfg: RestingConfig = RESTING_DEFAULTS,
): RestingResult {
  const empty: RestingResult = { com: [0, 0, 0], groups: [], rejected: [], winner: null, belowGate: false, ambiguous: null, principalAxis: null };
  if (positions.length < 4 || faces.length === 0) return empty;
  const lo = [0, 1, 2].map((k) => Math.min(...positions.map((p) => p[k]!)));
  const hi = [0, 1, 2].map((k) => Math.max(...positions.map((p) => p[k]!)));
  const diag = Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!);
  const coplanarDist = cfg.coplanarDistShare * diag;
  const contactTol = cfg.contactShare * diag;
  const symTol = cfg.symShare * diag;
  const mp = massProperties(positions, faces.flatMap((f) => f.triangles));
  const G = mp.com;

  // ⭐ the principal axis (§7): the inertia tensor's smallest moment = the covariance's largest spread
  const eig = symmetricEigen3(mp.second);
  const [, l2, l3] = eig.values;
  const principalAxis = l3! > 0 && (l3! - l2!) / l3! >= cfg.axisDegenerateTol ? eig.vectors[2]! : null;

  // ⭐ candidates: coplanar faces merged (normals within the angle, planes within the distance)
  const cosA = Math.cos((cfg.coplanarAngleDeg * Math.PI) / 180);
  const merged: { faces: number[]; normal: Vec3 }[] = [];
  faces.forEach((f, i) => {
    const g = merged.find((m) => dot(m.normal, f.normal) >= cosA && Math.abs(dot(sub(f.centre, faces[m.faces[0]!]!.centre), m.normal)) <= coplanarDist);
    if (g) g.faces.push(i);
    else merged.push({ faces: [i], normal: f.normal });
  });

  const planes = mirrorPlanes(positions, G, symTol, cfg.symAngleDeg);
  const passed: RestingCandidate[] = [];
  const rejected: RestingCandidate[] = [];
  for (const m of merged) {
    const n = m.normal;
    // ⛔ a face that is not a supporting plane (a pocket of a non-convex part) cannot carry the part — the hull seam (§3)
    const support = Math.max(...positions.map((p) => dot(p, n)));
    const offset = dot(faces[m.faces[0]!]!.centre, n);
    if (offset < support - contactTol) continue;
    const e1 = normalize(Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0]))!;
    const e2 = cross(n, e1);
    const to2 = (p: Vec3): [number, number] => [dot(p, e1), dot(p, e2)];
    const P = hull2(positions.filter((p) => Math.abs(dot(p, n) - support) <= contactTol).map(to2));
    if (P.length < 3) continue;
    const h = support - dot(G, n);
    const c = to2(G);
    // c inside P (counter-clockwise): on the left of every edge; and the perpendicular distances to the edges' lines
    const ds: number[] = [];
    let inside = true;
    for (let i = 0; i < P.length; i++) {
      const a = P[i]!;
      const b = P[(i + 1) % P.length]!;
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const el = Math.hypot(ex, ey);
      const left = (ex * (c[1] - a[1]) - ey * (c[0] - a[0])) / el;
      if (left < -1e-12 * diag) inside = false;
      ds.push(Math.abs(left));
    }
    if (!inside) continue;
    const dMin = Math.min(...ds);
    const dMax = Math.max(...ds);
    // the support polygon's area centroid
    let A = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i]!;
      const b = P[(i + 1) % P.length]!;
      const k = a[0] * b[1] - b[0] * a[1];
      A += k;
      cx += (a[0] + b[0]) * k;
      cy += (a[1] + b[1]) * k;
    }
    const centroid: [number, number] = [cx / (3 * A), cy / (3 * A)];
    const thetaDeg = (Math.atan2(dMin, h) * 180) / Math.PI;
    const S = thetaDeg / 90;
    const C = dMin > 0 ? 1 - Math.min(1, Math.hypot(c[0] - centroid[0], c[1] - centroid[1]) / dMin) : 0;
    const I = dMax > 0 ? dMin / dMax : 0;
    const cand: RestingCandidate = {
      faces: m.faces,
      normal: n,
      h,
      dMin,
      dMax,
      thetaDeg,
      mirrors: mirrorsContaining(planes, n, cfg.symAngleDeg),
      S,
      C,
      I,
      score: cfg.wS * S + cfg.wC * C + cfg.wI * I,
    };
    (thetaDeg < cfg.thetaFloorDeg ? rejected : passed).push(cand);
  }

  // ⭐ ranked: M first, then the score, then the lower centre of mass — and the equivalence groups (§6)
  const group = (list: readonly RestingCandidate[]): RestingGroup[] => {
    const groups: RestingGroup[] = [];
    for (const c of list) {
      const g = groups[groups.length - 1];
      if (g && g.mirrors === c.mirrors && Math.abs(g.score - c.score) < 1e-6 && Math.abs(g.h - c.h) <= contactTol)
        (g.members as RestingCandidate[]).push(c);
      else groups.push({ members: [c], mirrors: c.mirrors, score: c.score, h: c.h });
    }
    return groups;
  };
  if (passed.length === 0) {
    // ⚠ nothing stable enough (a round part lying down): the least tippable face — the largest θ — reported `belowGate`
    const fallback = group([...rejected].sort((a, b) => b.thetaDeg - a.thetaDeg || b.mirrors - a.mirrors || b.score - a.score));
    return { com: G, groups: fallback, rejected, winner: fallback[0] ?? null, belowGate: fallback.length > 0, ambiguous: null, principalAxis };
  }
  passed.sort((a, b) => b.mirrors - a.mirrors || b.score - a.score || a.h - b.h);
  const picked = pickWinner(group(passed), cfg.ambiguityBand);
  return { com: G, groups: picked.groups, rejected, winner: picked.groups[0] ?? null, belowGate: false, ambiguous: picked.ambiguous, principalAxis };
}

/**
 * ⭐ The face chosen from a group (§6, the owner: *"agreed"*): the one needing the SMALLEST TURN from the pose `q` to point its
 * outward normal DOWN — the member whose world normal is most aligned with `down`.
 */
export function chooseInGroup(group: RestingGroup, q: Quat, down: Vec3 = [0, -1, 0]): RestingCandidate {
  let best = group.members[0]!;
  let bestDot = -Infinity;
  for (const m of group.members) {
    const d = dot(qRotate(q, m.normal), down);
    if (d > bestDot + 1e-12) {
      bestDot = d;
      best = m;
    }
  }
  return best;
}

/**
 * ⭐⭐ prototype — **A TAPPED FACE AS THE RESTING FACE** (2026-10-09; the owner: *"when a face of the green piece or the turquoise piece is left
 * button tapped or first touch tapped, the hit face becomes the resting face and it aligns"*): the candidate holding the face
 * `faceIndex` (of the topology the selector was given) — its merged support and metrics as the rule computed them, among the groups or
 * the refused — or, for a face the rule discarded (not a support: the centre of mass outside it), that face alone with its outward
 * `normal`, its metrics unknown (NaN).
 */
export function candidateForFace(result: RestingResult, faceIndex: number, normal: Vec3): RestingCandidate {
  for (const g of result.groups) for (const m of g.members) if (m.faces.includes(faceIndex)) return m;
  for (const m of result.rejected) if (m.faces.includes(faceIndex)) return m;
  return { faces: [faceIndex], normal, h: NaN, dMin: NaN, dMax: NaN, thetaDeg: NaN, mirrors: NaN, S: NaN, C: NaN, I: NaN, score: NaN };
}

/**
 * ⭐⭐ **A CHOSEN CANDIDATE AS THE OBJECT MODEL HOLDS IT** (2026-10-09, `object_model.ts`'s `RestingFace`): the logical faces it merges
 * — by the ids of `faces` (the same list the selector was given) — its AREA centroid over their triangles (a merged pair weighed by
 * area, not averaged), and its outward normal; the part's own frame. `null` when an index has no face.
 */
export function restingFaceRecord(
  positions: readonly Vec3[],
  faces: readonly { readonly id: string; readonly triangles: readonly number[] }[],
  chosen: RestingCandidate,
): { faceIds: string[]; centre: Vec3; normal: Vec3 } | null {
  const ids: string[] = [];
  let area = 0;
  let c: Vec3 = [0, 0, 0];
  for (const i of chosen.faces) {
    const f = faces[i];
    if (f === undefined) return null;
    ids.push(f.id);
    for (let t = 0; t + 2 < f.triangles.length; t += 3) {
      const a = positions[f.triangles[t]!]!;
      const b = positions[f.triangles[t + 1]!]!;
      const d = positions[f.triangles[t + 2]!]!;
      const w = length(cross(sub(b, a), sub(d, a))) / 2;
      c = add(c, scale([(a[0] + b[0] + d[0]) / 3, (a[1] + b[1] + d[1]) / 3, (a[2] + b[2] + d[2]) / 3], w));
      area += w;
    }
  }
  if (ids.length === 0 || !(area > 0)) return null;
  return { faceIds: ids, centre: scale(c, 1 / area), normal: chosen.normal };
}

/**
 * ⭐⭐ prototype — **THE LONG AXIS OF A FACE** (`RESTING_FACE_ALIGNMENT.md` §3, the owner, 2026-10-05: *"the axis of symetry which is
 * the longest edge to edge and perpendicular to these edges (therefore, it cannot be the corner of the hexagone)"*). From the face's
 * points (its own frame, coplanar) and its normal: the face polygon (their 2D hull); a candidate is an edge's in-plane NORMAL `d`
 * whose opposite edge is parallel (a normal `−d`) and about whose line through the centroid the polygon is MIRROR-symmetric — the
 * axis then runs edge to edge, crossing both at right angles. The LONGEST (its extent along `d`) wins; equal ones are all returned
 * (a hexagon's three), one direction each. ⚠ A face with an ODD number of sides has none (every mirror axis runs corner to edge):
 * then its longest mirror axis of any kind, `fallback` set; and with no mirror axis at all, its longest extent across an edge.
 */
export function faceLongAxes(
  points: readonly Vec3[],
  normal: Vec3,
  tol: number,
): { readonly axes: readonly Vec3[]; readonly ends: readonly (readonly [Vec3, Vec3])[]; readonly length: number; readonly fallback: boolean } {
  const f = facePolygon(points, normal, tol);
  if (f === null) return { axes: [], ends: [], length: 0, fallback: true };
  const { P, c, edgeNormals, symmetricAbout, dedupe, extent, endsOf, to3d, edgeToEdge } = f;
  const longest = (ds: readonly (readonly [number, number])[], fallback: boolean) => {
    const L = Math.max(...ds.map(extent));
    const keep = ds.filter((d) => extent(d) >= L - tol);
    return { axes: keep.map(to3d), ends: keep.map(endsOf), length: L, fallback };
  };
  if (edgeToEdge.length > 0) return longest(edgeToEdge, false);
  // ⚠ fallback: any mirror axis (through a corner too), else the longest extent across an edge
  const corners = P.map((p) => {
    const l = Math.hypot(p[0] - c[0], p[1] - c[1]);
    return [(p[0] - c[0]) / l, (p[1] - c[1]) / l] as [number, number];
  });
  const mirrors = dedupe([...edgeNormals, ...corners].filter(symmetricAbout));
  return longest(mirrors.length > 0 ? mirrors : dedupe(edgeNormals), true);
}

/**
 * ⭐⭐ prototype — **ALL THE EDGE-TO-EDGE SYMMETRY AXES OF A FACE** (2026-10-10; the owner: *"instead of rolling to the next edge, I believe
 * rolling to the next couple of symetry axis is better: compute all the axis of symetry of the pink face when selecting it, compute all the
 * axis of symetry of the resting face when selecting it"* → *"build it with edge-to-edge axes only, keeping the long-axis first
 * alignment"*). The face's mirror lines that run EDGE TO EDGE — through its centroid, crossing two parallel edges at right angles, the face
 * symmetric about them (`faceLongAxes`'s candidates, ALL of them, not only the longest): a rectangle 2, a regular hexagon 3 (across the flats),
 * a square 2 (⛔ never its diagonals — a corner-to-corner line is no flush pose). One direction per line, the face's frame. ⚠ A face with
 * none (a triangle, an irregular part): its edges' normals, one per line (`fallback`), so a roll always has somewhere to go.
 */
export function faceFlushAxes(points: readonly Vec3[], normal: Vec3, tol: number): { readonly axes: readonly Vec3[]; readonly fallback: boolean } {
  const f = facePolygon(points, normal, tol);
  if (f === null) return { axes: [], fallback: true };
  if (f.edgeToEdge.length > 0) return { axes: f.edgeToEdge.map(f.to3d), fallback: false };
  return { axes: f.dedupe(f.edgeNormals).map(f.to3d), fallback: true };
}

/** ⭐ A planar face as a convex polygon in its own plane — what `faceLongAxes` and `faceFlushAxes` read. `null` with no polygon. */
function facePolygon(points: readonly Vec3[], normal: Vec3, tol: number) {
  const n = normalize(normal);
  if (n === null || points.length < 3) return null;
  const e1 = normalize(Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0]))!;
  const e2 = cross(n, e1);
  const P = hull2(points.map((p) => [dot(p, e1), dot(p, e2)] as [number, number]));
  if (P.length < 3) return null;
  // the polygon's area centroid
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[i]!;
    const b = P[(i + 1) % P.length]!;
    const k = a[0] * b[1] - b[0] * a[1];
    A += k;
    cx += (a[0] + b[0]) * k;
    cy += (a[1] + b[1]) * k;
  }
  const c: [number, number] = [cx / (3 * A), cy / (3 * A)];
  // the outward normals of the edges (counter-clockwise polygon)
  const edgeNormals = P.map((a, i) => {
    const b = P[(i + 1) % P.length]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] as [number, number];
  });
  const symmetricAbout = (d: readonly [number, number]): boolean =>
    P.every((p) => {
      const vx = p[0] - c[0];
      const vy = p[1] - c[1];
      const along = vx * d[0] + vy * d[1];
      // reflected across the line through c along d: the component across it flips
      const rx = c[0] + 2 * along * d[0] - vx;
      const ry = c[1] + 2 * along * d[1] - vy;
      return P.some((q) => Math.hypot(q[0] - rx, q[1] - ry) <= tol);
    });
  const extent = (d: readonly [number, number]): number => {
    const s = P.map((p) => p[0] * d[0] + p[1] * d[1]);
    return Math.max(...s) - Math.min(...s);
  };
  const dedupe = (ds: readonly (readonly [number, number])[]): (readonly [number, number])[] => {
    const out: (readonly [number, number])[] = [];
    for (const d of ds) if (!out.some((o) => Math.abs(o[0] * d[0] + o[1] * d[1]) > 1 - 1e-9)) out.push(d);
    return out;
  };
  const plane = dot(points[0]!, n);
  const to3 = (x: number, y: number): Vec3 => add(add(scale(e1, x), scale(e2, y)), scale(n, plane));
  // ⭐ an axis's two END points — where it meets its two edges: the line through the centroid along d, at the polygon's extent along d
  const endsOf = (d: readonly [number, number]): [Vec3, Vec3] => {
    const s = P.map((p) => p[0] * d[0] + p[1] * d[1]);
    const c0 = c[0] * d[0] + c[1] * d[1];
    const at = (t: number): Vec3 => to3(c[0] + d[0] * (t - c0), c[1] + d[1] * (t - c0));
    return [at(Math.min(...s)), at(Math.max(...s))];
  };
  const to3d = (d: readonly [number, number]): Vec3 => normalize(add(scale(e1, d[0]), scale(e2, d[1])))!;
  // ⭐ edge to edge: an edge normal with a parallel opposite edge, the polygon symmetric about it
  const edgeToEdge = dedupe(
    edgeNormals.filter((d) => edgeNormals.some((o) => o[0] * d[0] + o[1] * d[1] < -1 + 1e-9) && symmetricAbout(d)),
  );
  return { P, c, edgeNormals, symmetricAbout, dedupe, extent, endsOf, to3d, edgeToEdge };
}

/**
 * ⭐⭐ prototype — **THE ROLL TO THE NEXT COUPLE OF SYMMETRY AXES** (2026-10-10; the owner: *"at the click, instead of aligning the next edge to
 * the long axis of the pink face, align the next closest couple of resting face - pink face axis"* → *"build it with edge-to-edge axes
 * only"*). From the pose `q`, the SMALLEST turn about the resting face's normal, CLOCKWISE AS SEEN FROM THE CAMERA (`view`; the scene is
 * left-handed, so positive about the normal pointing toward the camera), that makes one of the resting face's axes (`restAxes`, its frame —
 * `faceFlushAxes`) parallel to one of the pink face's (`pinkAxes`, world). An axis is a LINE, so each couple lines up every 180°; the couple
 * already aligned (within 1e-6 rad) is passed over, so a tap always moves. `null` with no axis on either side, or all along the normal.
 */
export function nextCoupleRoll(
  q: Quat,
  restNormal: Vec3,
  restAxes: readonly Vec3[],
  pinkAxes: readonly Vec3[],
  view: Vec3,
): { readonly q: Quat; readonly rest: number; readonly pink: number; readonly angleRad: number } | null {
  const n = normalize(qRotate(q, restNormal));
  if (n === null) return null;
  const a: Vec3 = dot(n, view) > 0 ? scale(n, -1) : n;
  const flat = (v: Vec3): Vec3 | null => normalize(sub(v, scale(a, dot(v, a))));
  let best: { rest: number; pink: number; angleRad: number } | null = null;
  restAxes.forEach((r0, i) => {
    const s = flat(qRotate(q, r0));
    if (s === null) return;
    pinkAxes.forEach((p0, j) => {
      const r = flat(p0);
      if (r === null) return;
      let phi = Math.atan2(dot(a, cross(s, r)), dot(s, r));
      phi = ((phi % Math.PI) + Math.PI) % Math.PI; // a line: every half turn
      if (phi <= 1e-6 || Math.PI - phi <= 1e-6) phi = Math.PI; // already aligned: the next time round
      if (best === null || phi < best.angleRad) best = { rest: i, pink: j, angleRad: phi };
    });
  });
  if (best === null) return null;
  const b: { rest: number; pink: number; angleRad: number } = best;
  return { q: qmul(qFromAxisAngle(a, b.angleRad), q), rest: b.rest, pink: b.pink, angleRad: b.angleRad };
}

/**
 * ⭐⭐ prototype — **THE RESTING-FACE ALIGNMENT'S TARGET** (`RESTING_FACE_ALIGNMENT.md` §2, the owner, 2026-10-05): from the pose `q`,
 * (1) the resting face DOWN — the smallest turn bringing its outward normal (`restNormal`, the piece's frame) along `down`; then (2) a
 * turn about the vertical bringing the face's long axis onto `toward` (the horizontal direction to the pink ring) — of the long axes
 * (`axes`, each with its two directions) the one ALREADY closest to it. `toward` with no horizontal part: (1) alone.
 */
export function restAlignTarget(q: Quat, restNormal: Vec3, axes: readonly Vec3[], toward: Vec3, down: Vec3 = [0, -1, 0]): Quat {
  const q1 = qmul(shortestArc(qRotate(q, restNormal), down), q);
  const up: Vec3 = [-down[0], -down[1], -down[2]];
  const flat = (v: Vec3): Vec3 | null => normalize(sub(v, scale(up, dot(v, up))));
  const t = flat(toward);
  if (t === null || axes.length === 0) return q1;
  let best: Vec3 | null = null;
  let bestDot = -Infinity;
  for (const a of axes)
    for (const s of [1, -1]) {
      const w = flat(scale(qRotate(q1, a), s));
      if (w === null) continue;
      const d = dot(w, t);
      if (d > bestDot) {
        bestDot = d;
        best = w;
      }
    }
  if (best === null) return q1;
  const angle = Math.atan2(dot(up, cross(best, t)), dot(best, t));
  return qmul(qFromAxisAngle(up, angle), q1);
}

/** ⭐ A segment's ends. */
export type Edge = readonly [Vec3, Vec3];

/**
 * ⭐ A planar face's EDGES, from its points and its normal: the edges of their 2D convex hull in the face's plane, each as its two
 * original 3D points (collinear points dropped — a box face is four edges whatever its triangulation).
 */
export function faceEdges(points: readonly Vec3[], normal: Vec3): Edge[] {
  const n = normalize(normal);
  if (n === null || points.length < 3) return [];
  const e1 = normalize(Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0]))!;
  const e2 = cross(n, e1);
  const flat = points.map((p) => [dot(p, e1), dot(p, e2)] as [number, number]);
  const H = hull2(flat);
  const back = H.map((h) => points[flat.findIndex((f) => f[0] === h[0] && f[1] === h[1])]!);
  return back.map((a, i) => [a, back[(i + 1) % back.length]!] as Edge);
}

/**
 * ⭐⭐ prototype — **THE RESTING FACE'S CENTRE RIDES THE RINGS** (2026-10-09; the owner: *"as a conclusion of the way in, I want the center of
 * the resting position to be on the ring at the 0.09 m min distance (= the radius of 2nd and 3rd rings), not the center of the object"*):
 * the orbit places a point (`anchor`) and the piece is put so that its resting face's centre (`faceCentre`, its frame) is there — its
 * origin at `anchor − q·faceCentre`. ⭐ So every turn of the piece (the alignment, a roll) pivots on that centre by construction.
 */
export function placeByFaceCentre(anchor: Vec3, q: Quat, faceCentre: Vec3): Vec3 {
  return sub(anchor, qRotate(q, faceCentre));
}

/** ⭐ The distance from a point to a segment. */
export function segmentDistance(p: Vec3, e: Edge): number {
  const ab = sub(e[1], e[0]);
  const l2 = dot(ab, ab);
  const t = l2 > 0 ? Math.min(1, Math.max(0, dot(sub(p, e[0]), ab) / l2)) : 0;
  return length(sub(p, add(e[0], scale(ab, t))));
}

/**
 * ⭐⭐ prototype — **THE MATING EDGE** (`RESTING_FACE_ALIGNMENT.md` §2, the owner, 2026-10-05: *"the edge of the pink face which is
 * closest to be in horizontal plane and among those which are closest to be in horizontal plane, the edge which is closest to the
 * camera"*). Of the pink face's edges (world): those within `tolDeg` of the most horizontal one (the angle of each to the horizontal
 * plane), then the one nearest the camera. `-1` with none.
 */
export function matingEdgeIndex(edges: readonly Edge[], camera: Vec3, up: Vec3 = [0, 1, 0], tolDeg = 1): number {
  const tilt = edges.map((e) => {
    const d = normalize(sub(e[1], e[0]));
    return d === null ? Infinity : Math.asin(Math.min(1, Math.abs(dot(d, up))));
  });
  const flattest = Math.min(...tilt);
  let best = -1;
  let bestD = Infinity;
  edges.forEach((e, i) => {
    if (!(tilt[i]! <= flattest + (tolDeg * Math.PI) / 180)) return;
    const d = segmentDistance(camera, e);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** ⭐ The edge nearest a point — THE LEADING EDGE when the point is the pink ring (`-1` with none). */
export function nearestEdgeIndex(edges: readonly Edge[], p: Vec3): number {
  let best = -1;
  let bestD = Infinity;
  edges.forEach((e, i) => {
    const d = segmentDistance(p, e);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/**
 * ⭐⭐⭐ prototype — **THE RESTING-FACE ALIGNMENT, PRIORITY 1 BY EDGES** (`RESTING_FACE_ALIGNMENT.md` §2; the owner, 2026-10-05, on
 * `1.0.59q-`: *"identify the edge of the resting face which is closest to the pink gizmo (the leading edge) — identify the edge of the
 * pink face which is closest to be in horizontal plane and … closest to the camera (the mating edge) — the resting face goes to bottom
 * (no change) — rotate the piece so that the leading edge most align with the mating edge"*).
 * From the pose `q` (the piece at `at`, its resting face's normal `restNormal` and edges `faceEdgesLocal` in its own frame):
 * (1) the resting face DOWN — the smallest turn (unchanged); (2) the LEADING edge — the resting face's edge nearest `pink`, the face
 * down; (3) a turn about the vertical, the SMALLEST, making the leading edge parallel to the mating edge's horizontal direction (either
 * way along it). A mating edge with no horizontal part (vertical): (1) alone.
 */
export function restAlignToEdge(
  q: Quat,
  at: Vec3,
  restNormal: Vec3,
  faceEdgesLocal: readonly Edge[],
  pink: Vec3,
  mating: Edge,
  down: Vec3 = [0, -1, 0],
): { readonly q: Quat; readonly leading: number } {
  const q1 = qmul(shortestArc(qRotate(q, restNormal), down), q);
  const toWorld = (p: Vec3): Vec3 => add(at, qRotate(q1, p));
  const edgesWorld = faceEdgesLocal.map((e) => [toWorld(e[0]), toWorld(e[1])] as Edge);
  const leading = nearestEdgeIndex(edgesWorld, pink);
  if (leading < 0) return { q: q1, leading };
  const up: Vec3 = [-down[0], -down[1], -down[2]];
  const flat = (v: Vec3): Vec3 | null => normalize(sub(v, scale(up, dot(v, up))));
  const d = flat(sub(edgesWorld[leading]![1], edgesWorld[leading]![0]));
  const m = flat(sub(mating[1], mating[0]));
  if (d === null || m === null) return { q: q1, leading };
  // the smallest yaw onto ±m: an edge has no direction of its own
  let angle = Math.atan2(dot(up, cross(d, m)), dot(d, m));
  if (angle > Math.PI / 2) angle -= Math.PI;
  else if (angle < -Math.PI / 2) angle += Math.PI;
  return { q: qmul(qFromAxisAngle(up, angle), q1), leading };
}

/** ⭐ A face's long axes, ready for the alignment: their directions and their two end points (where each meets its edges). */
export interface LongAxes {
  readonly axes: readonly Vec3[];
  readonly ends: readonly (readonly [Vec3, Vec3])[];
}

/**
 * ⭐⭐⭐ prototype — **THE RESTING-FACE ALIGNMENT, PRIORITY 1 BY THE PINK FACE** (`RESTING_FACE_ALIGNMENT.md` §2; the owner, 2026-10-05,
 * `1.0.59q-`: *"the resting face goes to anti-align with the normal of the pink face (if no pink face, anti-align with the normal of the
 * first frozen object) — identify the long axis of the resting face (if more than one, identify the one which is most aligned with the
 * long axis of the pink face) — identify the long axis of the pink face (if more than one, … most aligned with the long axis of the
 * resting face) — if there is a tie, pick up the long axis which end vertices are closest — rotate the piece so that the long axis are
 * aligned"*). From the pose `q` (the piece at `at`; its resting face's normal and long axes in its own frame; the pink face's normal and
 * long axes in the world):
 * 1. the resting face ANTI-ALIGNED with the pink face — the smallest turn bringing its outward normal along `−pinkNormal`;
 * 2. the PAIR of long axes (one of the resting face's, one of the pink face's) most PARALLEL in that pose — both lie across the pink
 *    normal; a tie (within 1e-9) goes to the pair whose END points are closest (the nearest end of one to the nearest end of the other);
 * 3. a turn about the pink normal, the smallest (either way along an axis: ≤ 90°), making them parallel.
 * Rotation only: the piece stays where the orbit puts it. No long axis on either face: (1) alone.
 */
export function restAlignToFace(
  q: Quat,
  at: Vec3,
  restNormal: Vec3,
  restLong: LongAxes,
  pinkNormal: Vec3,
  pinkLong: LongAxes,
): { readonly q: Quat; readonly restAxis: number; readonly pinkAxis: number } {
  const pn = normalize(pinkNormal);
  if (pn === null) return { q, restAxis: -1, pinkAxis: -1 };
  const q1 = qmul(shortestArc(qRotate(q, restNormal), [-pn[0], -pn[1], -pn[2]]), q);
  const toWorld = (p: Vec3): Vec3 => add(at, qRotate(q1, p));
  const across = (v: Vec3): Vec3 | null => normalize(sub(v, scale(pn, dot(v, pn))));
  // ⭐ the turn about the pink normal making two axes parallel — the SMALLEST (either way along an axis: ≤ 90°)
  const turnFor = (rd: Vec3, pd: Vec3): number => {
    let angle = Math.atan2(dot(pn, cross(rd, pd)), dot(rd, pd));
    if (angle > Math.PI / 2) angle -= Math.PI;
    else if (angle < -Math.PI / 2) angle += Math.PI;
    return angle;
  };
  // ⭐ the pair whose turn is the smallest (the owner: *"pick up the two long axis which nullify or minimize the rotation"* — the most
  // parallel pair, the same measure); an EXACT tie (the same angle — the two senses of one turn, or two pairs already parallel) to the
  // pair whose ends are closest, so the answer is never arbitrary
  let best: { r: number; p: number; turn: number; gap: number } | null = null;
  restLong.axes.forEach((ra, r) => {
    const rd = across(qRotate(q1, ra));
    if (rd === null) return;
    pinkLong.axes.forEach((pa, p) => {
      const pd = across(pa);
      if (pd === null) return;
      const turn = Math.abs(turnFor(rd, pd));
      const re = restLong.ends[r]!.map(toWorld);
      const pe = pinkLong.ends[p]!;
      const gap = Math.min(...re.flatMap((a) => pe.map((b) => length(sub(a, b)))));
      if (best === null || turn < best.turn - 1e-9 || (Math.abs(turn - best.turn) <= 1e-9 && gap < best.gap)) best = { r, p, turn, gap };
    });
  });
  if (best === null) return { q: q1, restAxis: -1, pinkAxis: -1 };
  const { r, p } = best as { r: number; p: number };
  const angle = turnFor(across(qRotate(q1, restLong.axes[r]!))!, across(pinkLong.axes[p]!)!);
  return { q: qmul(qFromAxisAngle(pn, angle), q1), restAxis: r, pinkAxis: p };
}
