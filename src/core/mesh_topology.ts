/**
 * ⭐⭐⭐ **MESH TOPOLOGY — the LOGICAL faces and edges of a real mesh, computed once at import.**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] §20 (`D50`).
 *
 * ⛔⛔⛔ **THIS EXISTS BECAUSE EVERY OUTLINE IN THE GAME WAS A BOUNDING BOX, AND A BOUNDING BOX
 * IS WORTHLESS FOR AN IMPORTED PART** (the owner, 2026-09-18: *"I want all the outlines … as
 * well as the highlighted faces … to be created from the object mesh, not from a bounding box.
 * We are currently using simple forms like rectangles. When the game will import real blender
 * objects, we cannot use bounding boxes."*).
 *
 * ⚠⚠ **IT IS ALSO THE ANSWER TO A PROBLEM I SOLVED WRONGLY TWICE.** Babylon's edge renderer
 * notches at corners — `createLine` emits one independent quad per edge and the shader widens
 * each quad in screen space, so the wedge where two edges meet is empty. ⛔ My first fix aimed
 * at adjacency, which was never the cause; my second abandoned mesh geometry for a box, which
 * abandoned the requirement. ⭐ Owning the topology fixes both: the edges come out as a **line
 * list**, which WebGL draws one pixel wide with no widening and therefore no notch, and they
 * describe the real geometry.
 *
 * ⛔⛔ **A FACE IS NOT A TRIANGLE.** `3D1` says so and this module is where that stops being a
 * problem: it welds split vertices, groups coplanar adjacent triangles into **logical faces**,
 * and hands back each face's boundary loop, area centroid and outward normal — which is exactly
 * the `Face` record `object_model.ts` wants, for a cuboid or for a bracket.
 *
 * ⛔ ENGINE-FREE. It takes two flat arrays — the positions and indices any loader produces — and
 * returns plain data.
 */
import type { Vec3 } from "./vec";
import { add, cross, dot, length, normalize, scale, sub } from "./vec";

/** One logical face: a maximal run of adjacent, coplanar triangles. */
export interface MeshFace {
  /** ⭐ Stable by construction order, so a face keeps its name across a reload of one asset. */
  readonly id: string;
  /** ⛔ TRUE OUTWARD normal — the convention `MateConnector` and `Face` already share. */
  readonly normal: Vec3;
  /** Area centroid. ⚠ NOT the mean of the boundary vertices, which a long thin face skews. */
  readonly centre: Vec3;
  /** Welded vertex indices, 3 per triangle. ⭐ What a filled face marker is drawn from. */
  readonly triangles: readonly number[];
  /** ⭐ The face's outer boundary, as a closed loop of welded indices. */
  readonly boundary: readonly number[];
}

export interface MeshTopology {
  /** Welded positions — one entry per distinct point, whatever the loader duplicated. */
  readonly positions: readonly Vec3[];
  readonly faces: readonly MeshFace[];
  /**
   * ⭐ The hard edges: every boundary edge of every logical face, de-duplicated.
   * ⛔ Emitted as a LINE LIST (pairs), never a polyline — see `offsetPositions`' header for why
   * the distinction is what removes the corner notch.
   */
  readonly edges: readonly (readonly [number, number])[];
  /** Distinct face planes touching each welded vertex — what an offset outline needs. */
  readonly vertexPlanes: readonly (readonly number[])[];
}

/**
 * ⚠ How near two triangles' normals must be to count as one face, and how near their planes.
 *
 * ⭐ `cos 1°` is deliberately tight: a curved surface tessellated into many triangles must NOT
 * collapse into one "face", or a tap on a cylinder would align to an average of its whole side.
 * ⛔ The opposite error is worse than it looks — a box's two triangles per side MUST merge, or
 * every face marker would be a triangle and every outline would carry diagonals.
 */
const COPLANAR_COS = Math.cos((1 * Math.PI) / 180);

/**
 * ⚠ Positions within this fraction of the model's own size are the same point.
 *
 * ⛔⛔ **WELDING IS NOT OPTIONAL AND IT IS THE THING THAT BIT FIRST.** A box mesh has **24
 * vertices, not 8** — four per face, duplicated so each can carry its own normal and UV — and
 * *every* exported mesh splits vertices the same way wherever a normal, a UV seam or a material
 * changes. ⭐ Without welding, no two triangles share an index, nothing is adjacent to anything,
 * and the topology is 12 disconnected triangles.
 * ⚠ RELATIVE, not absolute: this project works in metres where a part is 0.08, and a tolerance
 * that suits metres would weld a whole millimetre-scale model into one point.
 */
const WELD_RELATIVE = 1e-6;

/** Build the topology of a mesh from a loader's flat position and index arrays. */
export function meshTopology(
  positionsXYZ: ArrayLike<number>,
  indices: ArrayLike<number>,
): MeshTopology {
  const raw: Vec3[] = [];
  for (let i = 0; i + 2 < positionsXYZ.length; i += 3) {
    raw.push([
      positionsXYZ[i] ?? NaN,
      positionsXYZ[i + 1] ?? NaN,
      positionsXYZ[i + 2] ?? NaN,
    ]);
  }
  if (raw.length === 0) return EMPTY;

  // ── weld ──────────────────────────────────────────────────────────────────
  // ⛔⛔ **NON-FINITE COORDINATES ARE SKIPPED HERE, NOT ONLY AT THE WELD** — found by the NaN
  // vector, 2026-09-18. ⚠ One NaN made `span` NaN, so `tol` was NaN, so every weld key was
  // `"NaN,NaN,NaN"` and **the whole mesh collapsed to a single point** — an empty topology from
  // one bad vertex. ⭐ The guard fifteen lines down was correct and ran too late: the damage was
  // done while measuring the model, not while welding it.
  let span = 0;
  for (const p of raw) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1]) || !Number.isFinite(p[2])) continue;
    span = Math.max(span, Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]));
  }
  const tol = Math.max(span, 1) * WELD_RELATIVE;
  const key = (p: Vec3): string =>
    `${Math.round(p[0] / tol)},${Math.round(p[1] / tol)},${Math.round(p[2] / tol)}`;
  const welded: Vec3[] = [];
  const byKey = new Map<string, number>();
  const remap: number[] = [];
  for (const p of raw) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1]) || !Number.isFinite(p[2])) {
      remap.push(-1);
      continue;
    }
    const k = key(p);
    const hit = byKey.get(k);
    if (hit === undefined) {
      byKey.set(k, welded.length);
      remap.push(welded.length);
      welded.push(p);
    } else {
      remap.push(hit);
    }
  }

  // ── triangles, with their planes ─────────────────────────────────────────
  interface Tri {
    readonly v: readonly [number, number, number];
    readonly normal: Vec3;
    readonly area: number;
  }
  const tris: Tri[] = [];
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const a = remap[indices[i] ?? -1] ?? -1;
    const b = remap[indices[i + 1] ?? -1] ?? -1;
    const c = remap[indices[i + 2] ?? -1] ?? -1;
    if (a < 0 || b < 0 || c < 0) continue;
    // ⛔ A triangle whose welded corners collapsed is DEGENERATE and is dropped: its normal is
    // undefined, and a zero-area face would poison every average it took part in.
    if (a === b || b === c || a === c) continue;
    const pa = welded[a] as Vec3;
    const pb = welded[b] as Vec3;
    const pc = welded[c] as Vec3;
    const n = cross(sub(pb, pa), sub(pc, pa));
    const len = length(n);
    if (len <= 0) continue;
    tris.push({ v: [a, b, c], normal: [n[0] / len, n[1] / len, n[2] / len], area: len / 2 });
  }
  if (tris.length === 0) return { positions: welded, faces: [], edges: [], vertexPlanes: [] };

  // ⛔⛔⛔ **WHICH WAY IS OUT? DECIDED BY SIGNED VOLUME, NOT BY A WINDING CONVENTION.**
  //
  // ⚠⚠ **DEVICE-FOUND, 2026-09-18, AND IT WAS INVISIBLE IN THE WORST WAY.** `cross(b−a, c−a)`
  // encodes MY winding assumption, and Babylon's boxes wind the other way — so every normal
  // came out **INWARD**. ⛔ The outlines were then offset *into* the body and hidden by its own
  // surface: on the glass, *"no outline of any sort"*, with a green suite and correct topology.
  // ⭐⭐ And it was never only cosmetic: `CONSTRAINTS` §7 requires a **true outward normal**, so
  // every alignment and every future mate would have been computed against the far side.
  //
  // ⭐⭐⭐ **THE FIX IS NOT A SIGN FLIP — IT IS A MEASUREMENT**, because an imported mesh may
  // arrive with either winding and a blanket flip just breaks the other case. The divergence
  // theorem gives the answer from the geometry itself: for a closed surface whose triangles face
  // outward, `Σ a·(b×c)` is six times a POSITIVE volume. Negative means the winding is inverted.
  // ⚠ This is precisely the *"inverted normals"* case the owner asked about for Blender imports,
  // and it is now decided per mesh rather than assumed.
  //
  // ⛔ An OPEN surface has no enclosed volume, so the sum carries no information — near zero
  // relative to the model's own scale. ⭐ There the winding is left alone rather than guessed at
  // (`LESSONS_CARRIED` §6: suppress, do not guess), and the normals are as authored.
  let vol6 = 0;
  for (const t of tris) {
    const a = welded[t.v[0] as number] as Vec3;
    const b = welded[t.v[1] as number] as Vec3;
    const c = welded[t.v[2] as number] as Vec3;
    vol6 += dot(a, cross(b, c));
  }
  const scaleCube = Math.max(span, 1) ** 3;
  if (vol6 < -scaleCube * 1e-9) {
    // ⚠⚠ **REBUILT ONLY WHEN FLIPPING, AND THE FIRST VERSION DID NOT CARE.** It computed
    // `oriented = flip ? tris.map(…) : tris` and then cleared `tris` before pushing it back —
    // but in the no-flip case `oriented` IS `tris`, so clearing it emptied the source and every
    // mesh came out with zero faces. ⛔ Fifteen vectors caught it instantly; the lesson is that
    // an alias is not a copy, and `a = cond ? f(a) : a` hides one in plain sight.
    const flipped = tris.map((t) => ({ ...t, normal: scale(t.normal, -1) }));
    tris.length = 0;
    tris.push(...flipped);
  }

  // ── which triangles share a welded edge ──────────────────────────────────
  const edgeKey = (i: number, j: number): string => (i < j ? `${i}_${j}` : `${j}_${i}`);
  const triesOfEdge = new Map<string, number[]>();
  tris.forEach((t, ti) => {
    for (let e = 0; e < 3; e++) {
      const k = edgeKey(t.v[e] as number, t.v[(e + 1) % 3] as number);
      const list = triesOfEdge.get(k);
      if (list === undefined) triesOfEdge.set(k, [ti]);
      else list.push(ti);
    }
  });

  // ── group coplanar neighbours into logical faces ─────────────────────────
  const groupOf = new Int32Array(tris.length).fill(-1);
  const groups: number[][] = [];
  for (let seed = 0; seed < tris.length; seed++) {
    if (groupOf[seed] !== -1) continue;
    const g = groups.length;
    const members: number[] = [];
    const stack = [seed];
    groupOf[seed] = g;
    while (stack.length > 0) {
      const ti = stack.pop() as number;
      members.push(ti);
      const t = tris[ti] as Tri;
      const plane = dot(t.normal, welded[t.v[0] as number] as Vec3);
      for (let e = 0; e < 3; e++) {
        const k = edgeKey(t.v[e] as number, t.v[(e + 1) % 3] as number);
        for (const nb of triesOfEdge.get(k) ?? []) {
          if (groupOf[nb] !== -1) continue;
          const n = tris[nb] as Tri;
          if (dot(t.normal, n.normal) < COPLANAR_COS) continue;
          // ⚠ Parallel is not enough — two opposite walls of a thin part are parallel and are
          // not one face. The plane OFFSET has to match too.
          const nbPlane = dot(t.normal, welded[n.v[0] as number] as Vec3);
          if (Math.abs(nbPlane - plane) > tol * 10) continue;
          groupOf[nb] = g;
          stack.push(nb);
        }
      }
    }
    groups.push(members);
  }

  // ── each group becomes a face ────────────────────────────────────────────
  const faces: MeshFace[] = [];
  const hard = new Map<string, readonly [number, number]>();
  groups.forEach((members, gi) => {
    let area = 0;
    let nSum: Vec3 = [0, 0, 0];
    let cSum: Vec3 = [0, 0, 0];
    const triangles: number[] = [];
    // An edge used once inside the group is on its boundary; twice, interior.
    const useCount = new Map<string, number>();
    const edgeEnds = new Map<string, readonly [number, number]>();
    for (const ti of members) {
      const t = tris[ti] as Tri;
      triangles.push(t.v[0], t.v[1], t.v[2]);
      area += t.area;
      nSum = add(nSum, scale(t.normal, t.area));
      const centroid = scale(
        add(add(welded[t.v[0] as number] as Vec3, welded[t.v[1] as number] as Vec3), welded[
          t.v[2] as number
        ] as Vec3),
        1 / 3,
      );
      cSum = add(cSum, scale(centroid, t.area));
      for (let e = 0; e < 3; e++) {
        const i = t.v[e] as number;
        const j = t.v[(e + 1) % 3] as number;
        const k = edgeKey(i, j);
        useCount.set(k, (useCount.get(k) ?? 0) + 1);
        edgeEnds.set(k, [i, j]);
      }
    }
    const normal = normalize(nSum) ?? ([0, 0, 1] as Vec3);
    const centre = area > 0 ? scale(cSum, 1 / area) : ([0, 0, 0] as Vec3);
    const boundaryEdges: (readonly [number, number])[] = [];
    for (const [k, count] of useCount) {
      if (count !== 1) continue;
      const ends = edgeEnds.get(k);
      if (ends === undefined) continue;
      boundaryEdges.push(ends);
      hard.set(k, ends);
    }
    faces.push({
      id: `f${gi}`,
      normal,
      centre,
      triangles,
      boundary: chainLoop(boundaryEdges),
    });
  });

  // ── which planes touch each welded vertex ────────────────────────────────
  const vertexPlanes: number[][] = welded.map(() => []);
  faces.forEach((f, fi) => {
    const seen = new Set<number>();
    for (const v of f.triangles) {
      if (seen.has(v)) continue;
      seen.add(v);
      (vertexPlanes[v] as number[]).push(fi);
    }
  });

  return { positions: welded, faces, edges: [...hard.values()], vertexPlanes };
}

const EMPTY: MeshTopology = { positions: [], faces: [], edges: [], vertexPlanes: [] };

/**
 * Chain boundary edges into one closed loop, longest first.
 *
 * ⚠ A face with a HOLE has two loops and this returns only the outer one. ⛔ Recorded rather
 * than solved: a hole needs a polygon-with-holes triangulation to fill correctly, which is a
 * different piece of work, and an outline that traces the outer boundary of a face with a hole
 * is wrong in a way a hand can see and interpret rather than silently.
 */
function chainLoop(edges: readonly (readonly [number, number])[]): number[] {
  if (edges.length === 0) return [];
  const next = new Map<number, number[]>();
  for (const [a, b] of edges) {
    (next.get(a) ?? next.set(a, []).get(a)!).push(b);
    (next.get(b) ?? next.set(b, []).get(b)!).push(a);
  }
  let best: number[] = [];
  const usedStart = new Set<number>();
  for (const [seed] of next) {
    if (usedStart.has(seed)) continue;
    const loop: number[] = [seed];
    const used = new Set<string>();
    let cur = seed;
    for (;;) {
      const options = next.get(cur) ?? [];
      let stepped = false;
      for (const nb of options) {
        const k = cur < nb ? `${cur}_${nb}` : `${nb}_${cur}`;
        if (used.has(k)) continue;
        used.add(k);
        cur = nb;
        loop.push(nb);
        stepped = true;
        break;
      }
      if (!stepped || cur === seed) break;
    }
    for (const v of loop) usedStart.add(v);
    if (loop.length > best.length) best = loop;
  }
  // ⭐ Closed: the caller draws it as a loop, so the repeated first point is dropped here.
  if (best.length > 1 && best[0] === best[best.length - 1]) best.pop();
  return best;
}

/**
 * ⭐⭐⭐ **THE MESH, OFFSET OUTWARD SO EVERY FACE PLANE MOVES BY `h`** — the capture shell.
 *
 * ⛔⛔ **A SCALE IS NOT AN OFFSET, AND THAT IS WHY THIS IS NOT ONE LINE.** Scaling a body by a
 * factor moves a far face further than a near one and a thin axis less than a thick one; the
 * capture rule is a **distance**, equal in every direction. ⭐ A true offset moves every face
 * plane out by the same `h`, and the vertex that does it is where the offset planes MEET.
 *
 * ⭐ Solved per welded vertex as a small least-squares: find `x` with `n·x = n·v + h` for every
 * face plane `n` touching that vertex. ⚠ Three independent planes (a box corner) have an exact
 * answer; more than three are overdetermined and least squares gives the best mitre; fewer —
 * an edge or an isolated vertex — are underdetermined, and the ridge term below resolves that
 * towards moving along the average normal, which is the answer a hand expects.
 *
 * ⛔ It offsets the GEOMETRY, and the capture rule measures against the geometry's **convex
 * hull** (`collision_shape.ts`). ⚠ For a convex part they are the same body. For a concave one
 * the drawn shell hugs a pocket the rule has already filled in — the same caveat `D49` recorded
 * for hollows, now visible rather than buried.
 */
export function offsetPositions(topo: MeshTopology, h: number): Vec3[] {
  return topo.positions.map((v, vi) => {
    const planes = topo.vertexPlanes[vi] ?? [];
    if (planes.length === 0 || h === 0) return v;
    // Normal equations with a small ridge: (NᵀN + λI) x = Nᵀb + λv.
    // ⭐ The ridge is what makes an underdetermined vertex fall back to *stay put, displaced by
    // the planes that do exist*, instead of producing an arbitrary point on a line or plane.
    const m: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const rhs: number[] = [0, 0, 0];
    for (const fi of planes) {
      const f = topo.faces[fi];
      if (f === undefined) continue;
      const n = f.normal;
      const b = dot(n, v) + h;
      for (let r = 0; r < 3; r++) {
        const row = m[r] as number[];
        for (let c = 0; c < 3; c++) row[c] = (row[c] ?? 0) + (n[r] as number) * (n[c] as number);
        rhs[r] = (rhs[r] ?? 0) + (n[r] as number) * b;
      }
    }
    // ⭐⭐ THE EXACT SOLVE FIRST, AND THE RIDGE ONLY WHERE IT IS NEEDED. ⚠ A ridge applied
    // unconditionally biases a vertex that had a perfectly determined answer: measured at 1e-6
    // of the model's size, which a box-corner vector caught immediately (2.999999 for 3).
    // ⛔ So the regularisation now costs nothing where the system has a unique solution, and
    // only resolves the genuinely underdetermined vertices — an edge, or an isolated point.
    const exact = solve3(m, rhs);
    if (exact !== null) return exact;
    const lambda = 1e-9 * Math.max(1, Math.abs(h));
    for (let r = 0; r < 3; r++) {
      const row = m[r] as number[];
      row[r] = (row[r] ?? 0) + lambda;
      rhs[r] = (rhs[r] ?? 0) + lambda * (v[r] as number);
    }
    return solve3(m, rhs) ?? v;
  });
}

/** 3×3 solve by Gaussian elimination with partial pivoting. `null` if singular. */
function solve3(a: number[][], b: number[]): Vec3 | null {
  const m: number[][] = [
    [a[0]?.[0] ?? 0, a[0]?.[1] ?? 0, a[0]?.[2] ?? 0, b[0] ?? 0],
    [a[1]?.[0] ?? 0, a[1]?.[1] ?? 0, a[1]?.[2] ?? 0, b[1] ?? 0],
    [a[2]?.[0] ?? 0, a[2]?.[1] ?? 0, a[2]?.[2] ?? 0, b[2] ?? 0],
  ];
  const g = (r: number, c: number): number => m[r]?.[c] ?? 0;
  const put = (r: number, c: number, v: number): void => {
    const row = m[r];
    if (row) row[c] = v;
  };
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(g(r, col)) > Math.abs(g(piv, col))) piv = r;
    }
    if (Math.abs(g(piv, col)) < 1e-15) return null;
    const tmp = m[col] as number[];
    m[col] = m[piv] as number[];
    m[piv] = tmp;
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = g(r, col) / g(col, col);
      for (let c = col; c < 4; c++) put(r, c, g(r, c) - f * g(col, c));
    }
  }
  return [g(0, 3) / g(0, 0), g(1, 3) / g(1, 1), g(2, 3) / g(2, 2)];
}
