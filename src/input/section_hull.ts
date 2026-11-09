/**
 * ⭐⭐ THE SECTION LINES' SAMPLES (2026-11-02) — what is left of the gizmo's CARRIER ON THE SECTION'S HULL (2026-10-29 … Step 4c): the fixed samples of a
 * drawn line, where the gizmo's exact point is inserted among them, and how the gizmo's vertex joins its neighbours.
 * ⛔⛔⛔ (2026-11-04, the tilted orbit's rebuild, STEP 4c-bis) THE CARRIER IS DELETED — the gizmo is a FUNCTION of the orbit's angles now (THE FACE MAP,
 * `input/face_map.ts`): the sections' cuts and hulls (`sectionPoints`, `hull2`, `facingChain`, `greenPoints`, `loopOf`), the chain's steps and paces
 * (`chainStep`, `redPace`, `loopStep`, `greenPace`, `syncStep`, `loopAtYaw`, `yawAtLoop`), the sides (`loopSides`, `sideAt`, `facetRunToward`), the drops
 * (`dropRay`, `greenDrop`), the polar turn over a top (`turnAbout`), the red plane's heading (`redHeading`) and the drawn lines' keys and joins went with it.
 * They stand at `da020af` (`1.0.96-` before Step 4c-bis), the fallback the scope names (`TILTED_ORBIT_REBUILD_SCOPE.md` §13, §15).
 * ⛔ ENGINE-FREE. Arithmetic — no licence, no patent.
 */
import type { Vec3 } from "../core/vec";

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"propose another way to smooth the travel of the red and green section without compromising the fact that the gizmo is always
 * at the intersection of the green and red sections, even through discontinuities such as edges"* → *"build it (option A, symetric)"*) — **THE SECTIONS
 * DRAWN THROUGH THE GIZMO**. Each line's own samples are FIXED on it — `n` evenly spread parameters (`sectionFixed`: arc lengths along an open red chain,
 * ends included; along a closed green loop, or angles round the axis over a top) — and computed once per line (each line's own key, `sectionLinesFrame`): a dx
 * reshapes only the red, a dy only the green. The gizmo's EXACT point is then INSERTED in both (`insertIndex`), every frame — so the ring is a vertex of
 * both lines by construction, through edges and held drops alike. ⛔ (2026-11-01, reverted) the lines and the ring were three separate drops: the carrier's
 * own replaced a sample, the green's started at the carrier, and they parted wherever the drops differed (an edge, a held drop).
 */
export function sectionFixed(total: number, n: number, closed: boolean): number[] {
  const out: number[] = [];
  if (n <= 0) return out;
  if (closed) for (let k = 0; k < n; k++) out.push((total * k) / n);
  else for (let k = 0; k < n; k++) out.push(n > 1 ? (total * k) / (n - 1) : 0);
  return out;
}

/**
 * ⭐⭐ (2026-11-02) The segments drawn around the gizmo's vertex: each neighbour by the line's own rule (`joinsPrev`, `joinsNext` — `joins`); cut off on
 * BOTH sides (it sits across a jump), the NEARER neighbour joined anyway — the ring always on a drawn line (measured: 2 frames of 953 left it 30 mm off).
 */
export function gizmoJoins(joinsPrev: boolean, joinsNext: boolean, distPrev: number, distNext: number): [boolean, boolean] {
  if (joinsPrev || joinsNext) return [joinsPrev, joinsNext];
  return distPrev <= distNext ? [true, false] : [false, true];
}

/** ⭐ Where `p` goes among the sorted `params`: after every one not past it. */
export function insertIndex(params: readonly number[], p: number): number {
  let i = 0;
  while (i < params.length && params[i]! <= p) i++;
  return i;
}

/**
 * ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — I17 (3), the owner: *"build the fix"*) **THE LINES SAMPLED ADAPTIVELY** — a line drawn from samples at
 * fixed angles cut a narrow face into a CHORD through the part (the green over Piece42's slanted sides: one sample every 3.75°, the part 6.5° wide — only
 * its front sample landed on it; the line went straight through its slopes, while the gizmo itself followed them). Every interval between two neighbours
 * is split at its middle while the middle's point lies more than `tolM` off the chord, level by level over the WHOLE line (breadth first: a budget of
 * evaluations shared fairly — never spent on the first jump), at most `levels` halvings. A real jump halves until its chord lies within the tolerance of
 * the riser (each side kept: the join rule breaks it there). ⭐ RESUMABLE (`refineStart`, `refineStep`): the wiring spends a few evaluations a frame
 * (⛔ all at once: 18.6 ms for one green on the desktop — a hitch on every dy frame on a phone). The values are the line's own (`ev` — the map's gizmo);
 * `pos` reads a value's drawn point. `closed`: the last interval runs to the first + `period`. ⛔ No engine import.
 */
export const LINE_REFINE_M = 0.001;
export const LINE_REFINE_LEVELS = 7;
export const LINE_REFINE_BUDGET = 160;
/** ⭐ the evaluations a line's refinement may spend in one frame */
export const LINE_REFINE_PER_FRAME = 32;

/**
 * ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8.7 — the owner: *"why such a difference between red and green contours?"* → *"build … budgeted continuity
 * test"*) **A LINE BREAKS ONLY WHERE THE GIZMO JUMPS** — each interval carries its JOIN (`j`): `true` joined, `false` broken, `null` not yet known (drawn
 * broken — never a chord). Both ends on the SAME real face (`same`: one part, one normal, one plane) — continuous by construction, joined at once, no
 * evaluation; a face change — verified by `pathJoins` (`joinStep`), out of the same per-frame budget as the refinement. ⛔ The speed rule (`2.5 × place +
 * 2 mm`) cut every surface steeper than 66° to the big face (Piece42's sides: 3.8 × — the green cut) and joined a jump wide enough between two samples
 * (Piece44's overhang under the top: a 41 mm jump drawn as a chord while the red was dragged).
 */
export const LINE_JOIN_M = 0.003;
/** ⭐ …its parameter halved this many times at most to tell a steep stretch from a jump. */
export const LINE_JOIN_HALVINGS = 12;

/**
 * ⭐⭐⭐ Two neighbouring samples `a` (at the parameter `s0`) and `b` (at `s1`) are joined when the gizmo's path between them is CONTINUOUS: the interval
 * halved, the half with the larger step kept, until the step is under `LINE_JOIN_M` (joined) — a jump keeps its size however small the interval (broken).
 * `at(s)`: the drawn point at a parameter (`null`: nothing there — broken). `spend`: called once per evaluation.
 */
export function pathJoins(a: Vec3, b: Vec3, s0: number, s1: number, at: (s: number) => Vec3 | null, spend?: () => void): boolean {
  const d = (p: Vec3, q: Vec3): number => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  let lo = s0;
  let hi = s1;
  let A = a;
  let B = b;
  for (let k = 0; k < LINE_JOIN_HALVINGS; k++) {
    if (d(A, B) <= LINE_JOIN_M) return true;
    const m = (lo + hi) / 2;
    const M = at(m);
    spend?.();
    if (M === null) return false;
    if (d(A, M) >= d(M, B)) {
      hi = m;
      B = M;
    } else {
      lo = m;
      A = M;
    }
  }
  return d(A, B) <= LINE_JOIN_M;
}

type RefNode<T> = { x: number; v: T | null; open: boolean; j: boolean | null };

export interface RefineState<T> {
  readonly closed: boolean;
  readonly period: number;
  /** ⭐ (§8.7) both values on the same real face — their path continuous */
  readonly same: (a: T, b: T) => boolean;
  nodes: RefNode<T>[];
  /** the level being scanned, the next node to scan in it, the level's output so far */
  lv: number;
  i: number;
  next: RefNode<T>[];
  any: boolean;
  left: number;
  done: boolean;
  /** ⭐ bumped on every change of the samples or the joins (the drawing's key) */
  ver: number;
}

/** ⭐ An interval's join known at once: no value at an end — broken; the same face — joined; else unknown (to verify). */
function joinOf<T>(same: (a: T, b: T) => boolean, a: T | null, b: T | null): boolean | null {
  if (a === null || b === null) return false;
  return same(a, b) ? true : null;
}

/** ⭐ The nodes in their order as they stand — mid-level, the scanned part's and the rest's merged (the same objects). */
function nowNodes<T>(r: RefineState<T>): RefNode<T>[] {
  return r.done ? r.nodes : [...r.next, ...r.nodes.slice(r.i)];
}

/** ⭐ The base samples evaluated, their joins known where the same face holds both ends; the refinement not started. */
export function refineStart<T>(
  params: readonly number[],
  closed: boolean,
  period: number,
  ev: (x: number) => T | null,
  same: (a: T, b: T) => boolean = () => false,
  budget: number = LINE_REFINE_BUDGET,
): RefineState<T> {
  const nodes: RefNode<T>[] = params.map((x) => ({ x, v: ev(x), open: true, j: null }));
  nodes.forEach((n, k) => {
    const last = k + 1 >= nodes.length;
    if (last && !closed) {
      n.open = false; // the last node starts no interval
      n.j = false;
    } else n.j = joinOf(same, n.v, nodes[last ? 0 : k + 1]!.v);
  });
  return { closed, period, same, nodes, lv: 0, i: 0, next: [], any: false, left: budget, done: nodes.length < 2, ver: 0 };
}

/** ⭐ Up to `maxEvals` more evaluations of the refinement; `true` when it changed the line. */
export function refineStep<T>(
  r: RefineState<T>,
  ev: (x: number) => T | null,
  pos: (v: T) => Vec3,
  maxEvals: number = LINE_REFINE_PER_FRAME,
  tolM: number = LINE_REFINE_M,
  levels: number = LINE_REFINE_LEVELS,
): boolean {
  const off = (a: Vec3, b: Vec3, m: Vec3): number => {
    const ab: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const am: Vec3 = [m[0] - a[0], m[1] - a[1], m[2] - a[2]];
    const L = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
    const k = L > 1e-18 ? Math.max(0, Math.min(1, (am[0] * ab[0] + am[1] * ab[1] + am[2] * ab[2]) / L)) : 0;
    return Math.hypot(am[0] - ab[0] * k, am[1] - ab[1] * k, am[2] - ab[2] * k);
  };
  /** does the chord a → b miss the value `m` by more than the tolerance (a missing value on one side only: always) */
  const misses = (a: T | null, b: T | null, m: T | null): boolean => {
    if (a === null || b === null) return (a === null) !== (b === null) || m !== null;
    if (m === null) return true;
    return off(pos(a), pos(b), pos(m)) > tolM;
  };
  let spent = 0;
  let changed = false;
  while (!r.done && spent < maxEvals) {
    if (r.i >= r.nodes.length) {
      // the level scanned: the next one over the new nodes
      r.nodes = r.next;
      r.next = [];
      r.i = 0;
      r.lv++;
      if (!r.any || r.lv >= levels || r.left <= 0) {
        r.done = true;
        break;
      }
      r.any = false;
      continue;
    }
    const a = r.nodes[r.i]!;
    r.next.push(a);
    const bi = r.i + 1 < r.nodes.length ? r.i + 1 : 0;
    r.i++;
    if (!a.open) continue;
    if (r.left <= 0) {
      a.open = false;
      continue;
    }
    const b = r.nodes[bi]!;
    const x1 = bi === 0 ? b.x + r.period : b.x;
    const xm = (a.x + x1) / 2;
    const vm = ev(xm);
    r.left--;
    spent++;
    if (misses(a.v, b.v, vm)) {
      // ⭐ (§8.7) a continuous interval stays continuous in both halves; else each half judged again (the same face, or to verify)
      const was = a.j;
      a.j = was === true ? true : joinOf(r.same, a.v, vm);
      r.next.push({ x: xm, v: vm, open: true, j: was === true ? true : joinOf(r.same, vm, b.v) });
      r.any = true;
      changed = true;
    } else a.open = false;
  }
  if (changed) r.ver++;
  return changed;
}

/**
 * ⭐⭐⭐ (§8.7) Up to `maxEvals` evaluations verifying the joins not yet known (face changes), in the line's order (`pathJoins`); `true` when a join
 * changed. A verification is started only with its whole cost left (`LINE_JOIN_HALVINGS`).
 */
export function joinStep<T>(r: RefineState<T>, ev: (x: number) => T | null, pos: (v: T) => Vec3, maxEvals: number = LINE_REFINE_PER_FRAME): boolean {
  const all = nowNodes(r);
  let spent = 0;
  let changed = false;
  for (let k = 0; k < all.length && maxEvals - spent >= LINE_JOIN_HALVINGS; k++) {
    const a = all[k]!;
    if (a.j !== null) continue;
    const last = k + 1 >= all.length;
    if (last && !r.closed) {
      a.j = false;
      continue;
    }
    const b = all[last ? 0 : k + 1]!;
    if (a.v === null || b.v === null) {
      a.j = false;
      changed = true;
      continue;
    }
    const s1 = last ? b.x + r.period : b.x;
    a.j = pathJoins(pos(a.v), pos(b.v), a.x, s1, (s) => {
      const v = ev(s);
      return v === null ? null : pos(v);
    }, () => spent++);
    changed = true;
  }
  if (changed) r.ver++;
  return changed;
}

/** ⭐ No join left to verify. */
export function joinsKnown<T>(r: RefineState<T>): boolean {
  return nowNodes(r).every((n) => n.j !== null);
}

/** ⭐ The line's samples as they stand (sorted; in [first, first + period) when closed) and each one's join to the next (`null`: not yet known). */
export function refineNow<T>(r: RefineState<T>): { readonly params: number[]; readonly vals: (T | null)[]; readonly joins: (boolean | null)[] } {
  const all = nowNodes(r);
  return { params: all.map((n) => n.x), vals: all.map((n) => n.v), joins: all.map((n) => n.j) };
}

