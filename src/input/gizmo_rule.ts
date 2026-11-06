/**
 * ⭐⭐⭐ (2026-11-06, the second rebuild — `TILTED_ORBIT_REBUILD_SCOPE.md` §26.4, Gz0) **WHAT A FACE IS, FOR THE LINE TRAVELLED** — engine-free. At a place
 * (`x`, `y` on a facet's own `t`, `b`) of G1, for the green's travel (`"x"`) or the red's (`"y"`):
 * * `SURFACE` — a real face at the face's plane or proud of it; or, inside the face's closed region, a void open along the line — its real floor (D3):
 *   the frontmost real surface along the face's normal;
 * * `BRIDGE` — on a void of the face CLOSED ALONG THAT LINE (faces of the face's plane on both sides along it): straight across on the face's plane (the
 *   owner: *"the void is closed on the green section travel so the green section and the gizmo shall go through"*);
 * * `GAP` — a void OPEN AT THE EDGE (outside the face's closed region) or beyond the face: NO SECTION THERE — the gizmo waits on the face, the orbit tilts
 *   on (the owner: *"the red section loop should stop at the edge of the void because the void is at the edge"*; *"the void is open on the red section
 *   travel so the orbit tilt shall take over"*).
 * ⛔ `1.0.103-`: beyond the face the parts' NEAREST POINT — on a contour pushed out by protruding parts it ran across the void to them and back.
 * ⛔ `1.0.102-`: a void bridged for BOTH lines when closed along either. ⛔ ENGINE-FREE.
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

/** ⭐⭐⭐ Gz0 — the case at (`x`, `y`) on a facet's stack `groups`, for the line `comp` travels. */
export function gizmoCase(groups: readonly MapGroup[], x: number, y: number, comp: "x" | "y"): "SURFACE" | "BRIDGE" | "GAP" {
  const main = mainGroup(groups);
  if (main === null) return "GAP";
  // the face: its plane's groups and those standing proud of it — never a void's floor behind it
  const face = groups.filter((g) => g.depth >= main.depth - COPLANAR_M);
  if (face.some((g) => regionReal(g.region, x, y))) return "SURFACE";
  const c = closedAlong(groups.filter((g) => Math.abs(g.depth - main.depth) <= COPLANAR_M).map((g) => g.region), x, y);
  if (comp === "x" ? c.x : c.y) return "BRIDGE";
  // a hole of the face open along this line: its floor (D3); a void open at the edge, or beyond the face: a GAP
  return face.some((g) => regionContains(g.region, x, y)) ? "SURFACE" : "GAP";
}
