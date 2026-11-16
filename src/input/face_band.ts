/**
 * ⭐⭐⭐ (2026-11-16, `ORBIT_CHARTS.md` §10.2, §12 2.4d — the owner: *"consider adding hysteresis where needed (for example crossing of edges which trigger
 * camera movement) so that input noise does not transfer to camera movement"*) **THE BANDED FACET** — the face under the gizmo read with ONE band against
 * the place's noise, for a trigger of a camera movement (the square camera's target, under `chartLayout` 1; the wiring in `render/assembly_wiring.ts`):
 *
 * * the reading KEEPS the facet it has (`cur`) while the place is on it or within `marginM` of it (`distToCurM`: the place's distance to that facet's
 *   polygon, `distanceToFacets` in the map's own frame — the MODEL's coordinates, never a drawn mesh);
 * * farther than that it takes the facet the place is on (`here`);
 * * no reading yet (`cur` null — the first frame, or a change of frame: the reading starts afresh in the new map): `here` at once.
 *
 * ⭐ The band is `gizmoEdgeMarginMm` (the quads' own, `faceSwitches`): an edge is a place on the assembly, so the band is millimetres ON THE MODEL. Its
 * cost: at every real crossing the reading stays the last face's for the band's depth past the edge. ⛔ ENGINE-FREE. A distance hysteresis — textbook.
 */

/**
 * ⭐⭐⭐ THE FACET READ under the band: `cur` kept while `distToCurM` ≤ `marginM` (on it: 0), else `here`; `cur` null: `here`. A NaN distance is no
 * evidence of being near: `here`.
 */
export function bandedFacet(cur: number | null, here: number, distToCurM: number, marginM: number): number {
  if (cur === null || cur === here) return here;
  return distToCurM <= Math.max(0, marginM) ? cur : here;
}
