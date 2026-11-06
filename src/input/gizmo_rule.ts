/**
 * ⭐⭐⭐ (2026-11-06, the rebuild — `TILTED_ORBIT_REBUILD_SCOPE.md` §22.5, Gz0 – Gz2) **WHERE THE GIZMO IS SHOWN, FOR THE LINE TRAVELLED** — engine-free.
 * At a place (`x`, `y` on a facet's own `t`, `b`) of G1, for the green's travel (`"x"`) or the red's (`"y"`):
 * * `REAL` — inside the face's closed region, on a real face at its plane or proud of it: the frontmost real surface along its normal (Gz1);
 * * `BRIDGE` — on a void of the face CLOSED ALONG THAT LINE (faces of the face's main plane on both sides along it): straight across on the face's plane
 *   (the owner: *"the void is closed on the green section travel so the green section and the gizmo shall go through"*);
 * * `LAND` — a void OPEN along the line, or beyond the face: where the piece would land — the parts' nearest point (Gz2; the owner: *"the void is open on
 *   the red section travel so the orbit tilt shall take over"*).
 * ⛔ `1.0.102-`: a void bridged for BOTH lines when closed along either (*"why the red contour extends into the void instead of adhering to the horizontal
 * black face?"*). ⛔ ENGINE-FREE.
 */
import { closedAlong, regionArea, regionContains, regionReal, type MapGroup } from "./face_map";

/** ⭐ Two groups on one plane: their depths this close (m) — the face map's own. */
const COPLANAR_M = 0.0005;

/** ⭐ A facet's MAIN group (its largest closed region) — the face's plane. */
export function mainGroup(groups: readonly MapGroup[]): MapGroup | null {
  let best: MapGroup | null = null;
  let area = -1;
  for (const g of groups) {
    const a = regionArea(g.region);
    if (a > area) {
      area = a;
      best = g;
    }
  }
  return best;
}

/** ⭐⭐⭐ Gz0 — the gizmo's case at (`x`, `y`) on a facet's stack `groups`, for the line `comp` travels. */
export function gizmoCase(groups: readonly MapGroup[], x: number, y: number, comp: "x" | "y"): "REAL" | "BRIDGE" | "LAND" {
  const regions = groups.map((g) => g.region);
  if (!regions.some((r) => regionContains(r, x, y))) return "LAND";
  const main = mainGroup(groups);
  if (main === null) return "LAND";
  // a real face AT the face's plane or standing proud of it (never a void's floor behind it)
  if (groups.some((g) => g.depth >= main.depth - COPLANAR_M && regionReal(g.region, x, y))) return "REAL";
  const c = closedAlong(groups.filter((g) => Math.abs(g.depth - main.depth) <= COPLANAR_M).map((g) => g.region), x, y);
  return (comp === "x" ? c.x : c.y) ? "BRIDGE" : "LAND";
}
