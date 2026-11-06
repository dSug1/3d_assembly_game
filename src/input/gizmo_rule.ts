/**
 * ⭐⭐⭐ (2026-11-06, `TILTED_ORBIT_REBUILD_SCOPE.md` §27.2, Gz0 — with the owner's DEPORTED FACE: *"same normal, continuity of edges when projected by the
 * normal to the contour face, different depth"*) **WHAT A FACE IS, FOR THE LINE TRAVELLED** — engine-free. At a place
 * (`x`, `y` on a facet's own `t`, `b`) of G1, for the green's travel (`"x"`) or the red's (`"y"`):
 * * `SURFACE` — a real face at the face's plane or proud of it; inside the face's closed region (a hole), a void open along the line — its real floor
 *   (D3); outside it, a DEPORTED face (a real face of this normal at another depth, not enclosed by the face) — the frontmost real surface along the normal;
 * * `BRIDGE` — on a void of the face CLOSED ALONG THAT LINE (faces of the face's plane on both sides along it): straight across on the face's plane (the
 *   owner: *"the void is closed on the green section travel so the green section and the gizmo shall go through"*);
 * * `GAP` — nothing of this normal under the place (a void open at the edge, beyond the face): NO SECTION THERE — the gizmo waits on the face, the orbit tilts
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

/** ⭐⭐⭐ Gz0 (§27.2) — the case at (`x`, `y`) on a facet's stack `groups`, for the line `comp` travels. */
export function gizmoCase(groups: readonly MapGroup[], x: number, y: number, comp: "x" | "y"): "SURFACE" | "BRIDGE" | "GAP" {
  const main = mainGroup(groups);
  if (main === null) return "GAP";
  // 1. the face: its plane's groups and those standing proud of it
  const face = groups.filter((g) => g.depth >= main.depth - COPLANAR_M);
  if (face.some((g) => regionReal(g.region, x, y))) return "SURFACE";
  // 2. a hole of the face (inside its closed region): crossed when closed along the line, else its real floor (D3)
  if (face.some((g) => regionContains(g.region, x, y))) {
    const c = closedAlong(groups.filter((g) => Math.abs(g.depth - main.depth) <= COPLANAR_M).map((g) => g.region), x, y);
    return (comp === "x" ? c.x : c.y) ? "BRIDGE" : "SURFACE";
  }
  // 3. outside it, a DEPORTED FACE — a real face of this normal at another depth, not enclosed by the face: the face, at its own depth
  if (groups.some((g) => g.depth < main.depth - COPLANAR_M && regionReal(g.region, x, y))) return "SURFACE";
  // 4. nothing of this normal under the place: a gap
  return "GAP";
}
