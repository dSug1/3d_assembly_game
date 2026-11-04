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

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"propose another way to smooth the travel of the red and green section without compromising the fact that the gizmo is always
 * at the intersection of the green and red sections, even through discontinuities such as edges"* → *"build it (option A, symetric)"*) — **THE SECTIONS
 * DRAWN THROUGH THE GIZMO**. Each line's own samples are FIXED on it — `n` evenly spread parameters (`sectionFixed`: arc lengths along an open red chain,
 * ends included; along a closed green loop, or angles round the axis over a top) — and dropped once per line (`sectionRedKey`, `sectionGreenKey`): a dx
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
