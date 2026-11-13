/**
 * ⭐⭐⭐ prototype — **THE CONTACT READOUT** (2026-11-12, `CLOSE_IN_CONTACT.md`; the slide removed whole — the owner: *"the slide is not required at all any
 * longer because the feature of pan of the piece is already available through the tilted-pole orbit"*, Q2 *"keep"*): what is left of the hover (`HOVER.md`,
 * the record) — the test that the orbited piece's RESTING FACE looks at a placed part's face, anti-parallel within `CONTACT_ALIGN_DEG`, in front of it within
 * a reach, any portion of it over that face (`faceContact`); the coplanar faces' outline (`rectComponent`, `rectsBoundary`); the shadow's projection. DISPLAY
 * ONLY: nothing latches, nothing holds the orbit.
 * Pure: the scene reaches it through numbers. Textbook geometry (separating axes, Andrew's monotone chain) — no licence, no patent.
 */
import type { Vec3 } from "../core/vec";


const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 | null => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};

/** ⭐ (2026-10-14, the hover's audit) Two faces whose planes lie within this of each other (m) are COPLANAR for the contact's choice — the in-plane distance decides. */
export const CONTACT_TIE_M = 1e-4;

/** ⭐ The resting face and the part's face count as aligned within this angle (°): the quads align exactly — this is numerical room. */
export const CONTACT_ALIGN_DEG = 2;


/**
 * ⭐⭐⭐ (2026-10-14, the owner: *"I can't hover translate in the attached configuration. Make sure the threshold distance is between resting face and collision face. Or check what else is bugging. The green piece should hover translate on the blue part's vertical face."*) — **THE CONTACT, FACE TO FACE**: the distance is measured between the RESTING FACE and the part's FACE
 * themselves — the resting face's centre above the plane of each face of each part within reach — and that face must be ANTI-PARALLEL to the
 * resting face (`alignDeg`); the part's body within `maxGapM` too (the faces overlap). ⛔ It compared the resting face with the normal of the
 * two bodies' CLOSEST POINTS, which tilts the moment those fall on an edge (the piece reaching past the face, a neighbour touched) — a piece
 * lying flat on a face could be refused. The face's own normal is the hover plane's. `nearest`: the best candidate seen, for the verdict.
 */
export interface ContactCandidate {
  readonly id: string;
  readonly bodyGapM: number;
  readonly faces: readonly {
    readonly faceId?: string;
    readonly centre: Vec3;
    readonly normal: Vec3;
    /** ⭐ (2026-10-14, the hover's second audit) the face's triangles in the world — given, the resting face's centre must lie OVER them (`CONTACT_OVER_FACE_M`) */
    readonly triangles?: readonly (readonly [Vec3, Vec3, Vec3])[];
  }[];
}

/**
 * ⭐⭐ (2026-10-14, the hover's second audit) — **THE FACES OVERLAP**: the resting face's centre, laid on the face's plane, within this of the face's own triangles (m). The
 * coloured face lies 1.5 mm inside its contour (`SCENE_1_CONTOUR_MARGIN`), so 2 mm. ⛔ It was a BODY test only: a piece BESIDE a box,
 * 10 mm above the plane of its top, turned cyan, and the settle took it 9 mm down into the air.
 */
export const CONTACT_OVER_FACE_M = 0.002;
/** ⭐ (2026-10-15) how far BEHIND a face's plane the resting face's centre may be and still latch (m) — contact rounding only: a resting face hosts IN FRONT of the face. */
export const CONTACT_BEHIND_M = 0.001;

/** ⭐ (2026-10-14, the hover's second audit) A point's distance, in a plane (`n`), to a set of triangles lying in it — 0 inside one. */
export function distanceToTriangles(p: Vec3, n: Vec3, tris: readonly (readonly [Vec3, Vec3, Vec3])[]): number {
  let best = Infinity;
  for (const [a, b, c] of tris) {
    const ab = sub(b, a), bc = sub(c, b), ca = sub(a, c);
    const s1 = dot(cross(ab, sub(p, a)), n), s2 = dot(cross(bc, sub(p, b)), n), s3 = dot(cross(ca, sub(p, c)), n);
    if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return 0;
    best = Math.min(best, segDist(p, a, b), segDist(p, b, c), segDist(p, c, a));
  }
  return best;
}
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function segDist(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  const t = l2 > 1e-24 ? Math.min(1, Math.max(0, dot(sub(p, a), ab) / l2)) : 0;
  const d = sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
  return Math.hypot(d[0], d[1], d[2]);
}
export function faceContact(
  restingCentreW: Vec3,
  restingNormalW: Vec3,
  candidates: readonly ContactCandidate[],
  maxGapM: number,
  alignDeg = CONTACT_ALIGN_DEG,
  /** ⭐⭐ (2026-10-14) the resting face's outline in the world — given, ANY overlap with the face's triangles counts (`overlapsTriangles`) */
  restingPoly: readonly Vec3[] | null = null,
): { contact: { id: string; faceId: string | null; normal: Vec3; centre: Vec3; gapM: number } | null; nearest: { id: string; planeGapM: number; angleDeg: number; bodyGapM: number; overFace: boolean } | null } {
  const cosMin = Math.cos((alignDeg * Math.PI) / 180);
  let contact: { id: string; faceId: string | null; normal: Vec3; centre: Vec3; gapM: number; inPlaneM: number; overM: number } | null = null;
  let nearest: { id: string; planeGapM: number; angleDeg: number; bodyGapM: number; overFace: boolean } | null = null;
  for (const c of candidates) {
    for (const f of c.faces) {
      const cos = -dot(restingNormalW, f.normal); // 1: the resting face looks straight at the face
      const d = dot(f.normal, [restingCentreW[0] - f.centre[0], restingCentreW[1] - f.centre[1], restingCentreW[2] - f.centre[2]]);
      // ⭐⭐⭐ (2026-10-15, the owner: *"the green piece approaches from underneath … the slanted face allows the resting face to be close enough to the hosting
      // face. as a result, the sliding is odd"*) — a face looking away, or one the resting face is BEHIND (beyond `CONTACT_BEHIND_M`, contact rounding):
      // ⛔ it was allowed the whole reach (20 mm) behind the plane — a slanted piece tucked beside / under a part latched onto a face it was behind,
      // the hover ran on that plane and the parts "behind" it (the host among them) were exempt from its checks
      if (cos <= 0 || d < -CONTACT_BEHIND_M) continue;
      const angleDeg = (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
      const onPlane: Vec3 = [restingCentreW[0] - f.normal[0] * d, restingCentreW[1] - f.normal[1] * d, restingCentreW[2] - f.normal[2] * d];
      const overM = f.triangles === undefined ? 0 : distanceToTriangles(onPlane, f.normal, f.triangles);
      // ⭐⭐⭐ (2026-10-14, the owner: *"Most of the times, I achieve collision with the dy input of the orbit by reaching close to the gizmo with resting face and hosting faces aligned. The collision block further dy orbit move. However, the green highlight for hover latch does not appear and I need to input a slight dx orbit to latch the hover. Why is that? It is more user friendly if the latch is possible from the initial dy orbit collision."*) — ANY PORTION of the resting face over the face: ⛔ its CENTRE had to be, and the orbit keeps the
      // resting face's centre on the ring at least its least radius from the gizmo — at a dy collision near the gizmo on a narrow face the centre
      // stood past the face's edge with much of the resting face over it, and only a dx (swinging the centre over the face) latched the hover
      const overFace = restingPoly !== null && f.triangles !== undefined ? overlapsTriangles(restingPoly, f.normal, f.triangles) : overM <= CONTACT_OVER_FACE_M;
      const score = d + angleDeg * 1e-3 + (overFace ? 0 : 1);
      if (nearest === null || score < nearest.planeGapM + nearest.angleDeg * 1e-3 + (nearest.overFace ? 0 : 1)) nearest = { id: c.id, planeGapM: d, angleDeg, bodyGapM: c.bodyGapM, overFace };
      if (!(cos >= cosMin && d <= maxGapM && c.bodyGapM <= maxGapM && overFace)) continue;
      // ⭐⭐ (2026-10-14, the hover's audit) COPLANAR faces tie on the distance: the one UNDER the resting face's centre hosts (the least in-plane distance to its
      // centre) — ⛔ the first listed won, so a piece over a part's top could hover in the plane of its neighbour's, named after it
      const off: Vec3 = [restingCentreW[0] - f.centre[0] - f.normal[0] * d, restingCentreW[1] - f.centre[1] - f.normal[1] * d, restingCentreW[2] - f.centre[2] - f.normal[2] * d];
      const inPlaneM = Math.hypot(off[0], off[1], off[2]);
      // ⭐ (2026-10-14, the hover's second audit) on a tie, the face CONTAINING the centre first (⛔ by the centres alone, a centre at 0.99 over a face spanning −1 … 1 named
      // its neighbour 1 … 1.1), then the nearer centre
      const tie = contact !== null && Math.abs(d - contact.gapM) <= CONTACT_TIE_M;
      const better = contact === null || d < contact.gapM - CONTACT_TIE_M || (tie && (overM < contact.overM - 1e-9 || (Math.abs(overM - contact.overM) <= 1e-9 && inPlaneM < contact.inPlaneM)));
      if (better) contact = { id: c.id, faceId: f.faceId ?? null, normal: f.normal, centre: f.centre, gapM: Math.max(0, d), inPlaneM, overM };
    }
  }
  return { contact, nearest };
}

/** ⭐ The contact shadow's point: `p` laid on the plane of normal `n` through `c` (the resting face's outline drawn on the face it looks at). */
export function projectOntoPlane(p: Vec3, n: Vec3, c: Vec3): Vec3 {
  const d = n[0] * (p[0] - c[0]) + n[1] * (p[1] - c[1]) + n[2] * (p[2] - c[2]);
  return [p[0] - n[0] * d, p[1] - n[1] * d, p[2] - n[2] * d];
}

/** ⭐ Two faces overlap when they share more than this across (m) — touching edges do not count. */
export const CONTACT_OVERLAP_EPS_M = 1e-4;

/** ⭐ Two orthonormal axes of the plane of normal `n`. */
export function planeAxes(n: Vec3): [Vec3, Vec3] {
  const seed: Vec3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const k = dot(seed, n);
  const a = unit([seed[0] - n[0] * k, seed[1] - n[1] * k, seed[2] - n[2] * k])!;
  return [a, unit(cross(n, a))!];
}

/** ⭐ A 2-D convex hull (Andrew's monotone chain), counter-clockwise; duplicates dropped. */
export function convexHull2D(pts: readonly (readonly [number, number])[]): [number, number][] {
  const p = [...pts].map((q) => [q[0], q[1]] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, q) <= 1e-18) lo.pop();
    lo.push(q);
  }
  const up: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]!;
    while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, q) <= 1e-18) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** ⭐ Two convex 2-D polygons OVERLAP by more than `eps` across, by separating axes (the edge normals of both). */
export function convexOverlap2D(a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[], eps = CONTACT_OVERLAP_EPS_M): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const axes: [number, number][] = [];
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!;
      const q = poly[(i + 1) % poly.length]!;
      const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (l > 1e-12) axes.push([-(q[1] - p[1]) / l, (q[0] - p[0]) / l]);
    }
  for (const ax of axes) {
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const p of a) {
      const t = p[0] * ax[0] + p[1] * ax[1];
      a0 = Math.min(a0, t);
      a1 = Math.max(a1, t);
    }
    for (const p of b) {
      const t = p[0] * ax[0] + p[1] * ax[1];
      b0 = Math.min(b0, t);
      b1 = Math.max(b1, t);
    }
    if (Math.min(a1, b1) - Math.max(a0, b0) <= eps) return false;
  }
  return true;
}

/**
 * ⭐⭐ (2026-10-14, the owner: *"Most of the times, I achieve collision with the dy input of the orbit by reaching close to the gizmo with resting face and hosting faces aligned. The collision block further dy orbit move. However, the green highlight for hover latch does not appear and I need to input a slight dx orbit to latch the hover. Why is that? It is more user friendly if the latch is possible from the initial dy orbit collision."* · *"when there is not any portion of the resting face in contact with a hosting face (i.e. on its full surface, the resting face faces empty) the movement shall default back to orbit even if the press has not been released."*) — **ANY PORTION OF THE RESTING FACE OVER A FACE**: the resting face's outline (`poly`, its convex
 * hull) and the face's triangles, both laid on the plane of `n`, overlap by more than `CONTACT_OVERLAP_EPS_M` across.
 */
export function overlapsTriangles(poly: readonly Vec3[], n: Vec3, tris: readonly (readonly [Vec3, Vec3, Vec3])[]): boolean {
  const [a, b] = planeAxes(n);
  const P = (p: Vec3): [number, number] => [dot(p, a), dot(p, b)];
  const hull = convexHull2D(poly.map(P));
  // ⛔ (2026-10-15) the edge margin (`hoverEdgeMarginMm`) is deleted: the latch counts any portion; the slide's bound is the CENTRE's (`insideRects`)
  return tris.some((t) => convexOverlap2D(hull, [P(t[0]), P(t[1]), P(t[2])]));
}

/**
 * ⭐⭐ (2026-10-14, the owner: *"Display also a green highlight over the biggest boundary of coplanar hosting faces so the user can visually couple it with the green highlight of the resting face (similar to yellow highlight for resting face and quad)."*) — **THE OUTLINE OF THE COPLANAR HOSTING FACES**: rectangles in the plane (each face's extent), each grown by
 * `growM` (so faces a joint apart — 3 mm between the coloured cores — read as one), the ones joined to rectangle `seed` (overlapping or touching,
 * step by step), their UNION's boundary as segments. Exact for faces square to the plane's axes (every `Scene_1` part); others are taken by their
 * extent.
 */
export interface Rect2 {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}
/** ⭐ (2026-10-15) the rectangles joined to `seed` (overlapping or touching, step by step), each grown by `growM` — the drawn outline's region (`rectsBoundary`) and the slide's bound (`insideRects`). */
export function rectComponent(rects: readonly Rect2[], seed: number, growM: number): Rect2[] {
  if (seed < 0 || seed >= rects.length) return [];
  const g = rects.map((r) => ({ x0: r.x0 - growM, y0: r.y0 - growM, x1: r.x1 + growM, y1: r.y1 + growM }));
  const touch = (a: Rect2, b: Rect2) => a.x0 <= b.x1 + 1e-9 && b.x0 <= a.x1 + 1e-9 && a.y0 <= b.y1 + 1e-9 && b.y0 <= a.y1 + 1e-9;
  const inSet = new Set<number>([seed]);
  const stack = [seed];
  while (stack.length > 0) {
    const i = stack.pop()!;
    g.forEach((r, j) => {
      if (!inSet.has(j) && touch(g[i]!, r)) {
        inSet.add(j);
        stack.push(j);
      }
    });
  }
  return [...inSet].sort((x, y) => x - y).map((i) => g[i]!);
}

/** ⭐ (2026-10-15) the BOUNDARY of a union of rectangles, as segments — what the hover's green outline draws. */
export function rectsBoundary(comp: readonly Rect2[]): [[number, number], [number, number]][] {
  const xs = [...new Set(comp.flatMap((r) => [r.x0, r.x1]))].sort((a, b) => a - b);
  const ys = [...new Set(comp.flatMap((r) => [r.y0, r.y1]))].sort((a, b) => a - b);
  const covered = (i: number, j: number): boolean => {
    if (i < 0 || j < 0 || i >= xs.length - 1 || j >= ys.length - 1) return false;
    const cx = (xs[i]! + xs[i + 1]!) / 2;
    const cy = (ys[j]! + ys[j + 1]!) / 2;
    return comp.some((r) => cx > r.x0 && cx < r.x1 && cy > r.y0 && cy < r.y1);
  };
  const segs: [[number, number], [number, number]][] = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++) {
      if (!covered(i, j)) continue;
      const x0 = xs[i]!, x1 = xs[i + 1]!, y0 = ys[j]!, y1 = ys[j + 1]!;
      if (!covered(i - 1, j)) segs.push([[x0, y0], [x0, y1]]);
      if (!covered(i + 1, j)) segs.push([[x1, y0], [x1, y1]]);
      if (!covered(i, j - 1)) segs.push([[x0, y0], [x1, y0]]);
      if (!covered(i, j + 1)) segs.push([[x0, y1], [x1, y1]]);
    }
  return segs;
}
