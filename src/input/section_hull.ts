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

export interface RefineState<T> {
  readonly closed: boolean;
  readonly period: number;
  nodes: { x: number; v: T | null; open: boolean }[];
  /** the level being scanned, the next node to scan in it, the level's output so far */
  lv: number;
  i: number;
  next: { x: number; v: T | null; open: boolean }[];
  any: boolean;
  left: number;
  done: boolean;
}

/** ⭐ The base samples evaluated; the refinement not started. */
export function refineStart<T>(params: readonly number[], closed: boolean, period: number, ev: (x: number) => T | null, budget: number = LINE_REFINE_BUDGET): RefineState<T> {
  const nodes = params.map((x) => ({ x, v: ev(x), open: true }));
  if (!closed && nodes.length > 0) nodes[nodes.length - 1]!.open = false; // the last node starts no interval
  return { closed, period, nodes, lv: 0, i: 0, next: [], any: false, left: budget, done: nodes.length < 2 };
}

/** ⭐ Up to `maxEvals` more evaluations; `true` when it changed the line. */
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
      r.next.push({ x: xm, v: vm, open: true });
      r.any = true;
      changed = true;
    } else a.open = false;
  }
  return changed;
}

/** ⭐ The line's samples as they stand (sorted; in [first, first + period) when closed) — mid-level, the scanned part's and the rest's merged. */
export function refineNow<T>(r: RefineState<T>): { readonly params: number[]; readonly vals: (T | null)[] } {
  const all = r.done ? r.nodes : [...r.next, ...r.nodes.slice(r.i)];
  return { params: all.map((n) => n.x), vals: all.map((n) => n.v) };
}
