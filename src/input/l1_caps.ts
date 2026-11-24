/**
 * ⭐⭐⭐ (2026-11-24, S11 — `Claude/40_RENDER_SCENE/spec/ORBIT_SURFACE_L1.md` §10) **THE CAPS BETWEEN PLACED PARTS — L1's FILLERS.**
 *
 * A hollow between placed parts deeper than its mouth is wide (R1b's DEEP place) is filled by a FILLER: a virtual box, never a solid — no collision
 * piece, no mesh, P2 / the landing / the casts never read it. Its six faces join the face map as a part of their own (`MapFace.part` = its id), so the
 * face map's own glue rule (`face_map.ts` `stackOf` → `exposedRects`: coplanar, opposite normals, overlapping, different parts) removes the faces
 * pressed together BOTH ways — the hollow's inner walls and the filler's sides — and its open faces, flush with the walls round its mouth, merge into
 * their facets: the skin passes over the mouth like a bridge.
 * * **Computed offline** (`scripts/surface/l1_caps.ts` → `src/content/<scene>_caps.json`, his Q3: precomputed), read here: `parseSceneCaps`.
 * * **Accepted only** when every face is GLUED (on a wall) or FLUSH (its open part borders an exposed coplanar face of a wall, the same way out) — or,
 *   in a placed set where a loose piece is not yet seated, on that piece's GOAL volume (the ghost bridges a goal's mouth) — and no placed body nor goal
 *   volume reaches into it: `fillerVerdict`, the script's check and the vectors' (`tests/l1_caps.test.ts`).
 * * **In the game** (`render/assembly_wiring.ts` `placedFaces`, behind `surfaceL1`): a filler's faces are pushed when all its WALLS are placed, carried
 *   by its ANCHOR's placement in the MODEL's space (`st.world`, never the drawn meshes'): `fillerFaces`.
 * ⛔ The floor is NOT a part (his rule): a frozen body is never a wall, never a snap plane, never in a set — the script leaves it out, as the face map does.
 * ⛔ ENGINE-FREE (`tests/boundary.test.ts`). Rectangles and a separating-axis test (Gottschalk et al., 1996) — textbook; no licence, no patent.
 */
import { exposedRects, type MapFace } from "./face_map";
import type { Rect2 } from "./contact";
import { PROXY_FLUSH_MM } from "../core/units";
import { add, cross, dot, qconj, qRotate, scale, sub, type Quat, type Vec3 } from "../core/vec";

/** ⭐ A filler: its box in the SCENE's authored units, in the scene's frame with every body at its goal; its walls (placed parts it needs); the loose
 * pieces whose goal volume it borders (glued once seated — not walls: the filler is there before them); its anchor (a wall and that wall's goal pose,
 * the same units) — the game carries the box by the anchor's placement. */
export interface CapFiller {
  readonly id: string;
  readonly lo: Vec3;
  readonly hi: Vec3;
  readonly walls: readonly string[];
  readonly goals: readonly string[];
  readonly anchor: { readonly id: string; readonly position: Vec3; readonly quat: Quat };
}

/** ⭐ A scene's caps (`src/content/<scene>_caps.json`): its id, its `unitM` (metres per authored unit) and its fillers. */
export interface SceneCaps {
  readonly scene: string;
  readonly unitM: number;
  readonly fillers: readonly CapFiller[];
}

const isVec3 = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === "number" && Number.isFinite(x));
const isIds = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string" && x !== "");

/** ⭐ A caps file read and CHECKED — a malformed one throws, naming what is wrong (never a filler half read). */
export function parseSceneCaps(json: unknown): SceneCaps {
  const o = json as { scene?: unknown; unitM?: unknown; fillers?: unknown } | null;
  if (typeof o !== "object" || o === null) throw new Error("caps: not an object");
  if (typeof o.scene !== "string" || o.scene === "") throw new Error("caps: scene must be a non-empty string");
  if (!(typeof o.unitM === "number" && o.unitM > 0)) throw new Error(`caps ${o.scene}: unitM must be a number > 0`);
  if (!Array.isArray(o.fillers)) throw new Error(`caps ${o.scene}: fillers must be an array`);
  const fillers = o.fillers.map((f: unknown, i: number): CapFiller => {
    const x = f as { id?: unknown; lo?: unknown; hi?: unknown; walls?: unknown; goals?: unknown; anchor?: { id?: unknown; position?: unknown; quat?: unknown } } | null;
    const at = `caps ${String(o.scene)}: filler ${i}`;
    if (typeof x !== "object" || x === null || typeof x.id !== "string" || x.id === "") throw new Error(`${at}: id must be a non-empty string`);
    if (!isVec3(x.lo) || !isVec3(x.hi) || !x.lo.every((v, k) => v < (x.hi as Vec3)[k]!)) throw new Error(`${at} (${x.id}): lo < hi, three numbers each`);
    if (!isIds(x.walls) || x.walls.length === 0) throw new Error(`${at} (${x.id}): walls must be a non-empty list of part ids`);
    if (!isIds(x.goals)) throw new Error(`${at} (${x.id}): goals must be a list of part ids`);
    const a = x.anchor;
    const q = a?.quat;
    if (typeof a !== "object" || a === null || typeof a.id !== "string" || !x.walls.includes(a.id) || !isVec3(a.position)) throw new Error(`${at} (${x.id}): anchor must be one of its walls, with its goal position`);
    if (!(Array.isArray(q) && q.length === 4 && q.every((v) => typeof v === "number" && Number.isFinite(v)) && Math.abs(Math.hypot(...(q as number[])) - 1) < 1e-9)) throw new Error(`${at} (${x.id}): anchor.quat must be a unit quaternion`);
    return { id: x.id, lo: x.lo, hi: x.hi, walls: x.walls, goals: x.goals, anchor: { id: a.id, position: a.position, quat: q as unknown as Quat } };
  });
  return { scene: o.scene, unitM: o.unitM, fillers };
}

/** ⭐ The box's six sides: the axis `k`, the outward sign `s`, the two other axes (`a`, `b`) its rectangle is read on. */
export type Side = "-x" | "+x" | "-y" | "+y" | "-z" | "+z";
export const SIDES: readonly { readonly side: Side; readonly k: 0 | 1 | 2; readonly s: 1 | -1; readonly a: 0 | 1 | 2; readonly b: 0 | 1 | 2 }[] = [
  { side: "-x", k: 0, s: -1, a: 1, b: 2 },
  { side: "+x", k: 0, s: 1, a: 1, b: 2 },
  { side: "-y", k: 1, s: -1, a: 0, b: 2 },
  { side: "+y", k: 1, s: 1, a: 0, b: 2 },
  { side: "-z", k: 2, s: -1, a: 0, b: 1 },
  { side: "+z", k: 2, s: 1, a: 0, b: 1 },
];

/** ⭐ A box's six faces as the face map takes them — each its outward normal, its centre, two triangles (turned outward), `part` — in the box's units. */
export function boxFaces(lo: Vec3, hi: Vec3, part: string): MapFace[] {
  return SIDES.map(({ k, s, a, b }) => {
    const c = (u: number, v: number): Vec3 => {
      const p: [number, number, number] = [0, 0, 0];
      p[k] = s > 0 ? hi[k] : lo[k];
      p[a] = u;
      p[b] = v;
      return p;
    };
    const p00 = c(lo[a], lo[b]), p10 = c(hi[a], lo[b]), p11 = c(hi[a], hi[b]), p01 = c(lo[a], hi[b]);
    const normal: [number, number, number] = [0, 0, 0];
    normal[k] = s;
    // the corners round so that (p10 − p00) × (p11 − p00) points along the normal
    const n0 = cross(sub(p10, p00), sub(p11, p00));
    const out = dot(n0, normal) > 0;
    const tris: [Vec3, Vec3, Vec3][] = out ? [[p00, p10, p11], [p00, p11, p01]] : [[p00, p11, p10], [p00, p01, p11]];
    return { normal, centre: c((lo[a] + hi[a]) / 2, (lo[b] + hi[b]) / 2), tris, part };
  });
}

/**
 * ⭐⭐⭐ A FILLER'S FACES IN THE WORLD — the MODEL's space (`st.world`, metres): its box (authored units, the goal frame) carried by its anchor's
 * placement — `p ↦ W.position + W.orientation · G⁻¹ · (p − G.position) · unitM`, `G` the anchor's goal pose in the file. A wall at its goal on an
 * unmoved assembly: `p · unitM` exactly as the bodies' faces (`render/scene.ts`: positions and sizes × `unitM`, once).
 */
export function fillerFaces(f: CapFiller, unitM: number, anchor: { readonly position: Vec3; readonly orientation: Quat }): MapFace[] {
  const gi = qconj(f.anchor.quat);
  const place = (p: Vec3): Vec3 => add(anchor.position, qRotate(anchor.orientation, qRotate(gi, scale(sub(p, f.anchor.position), unitM))));
  const turn = (n: Vec3): Vec3 => qRotate(anchor.orientation, qRotate(gi, n));
  return boxFaces(f.lo, f.hi, f.id).map((m) => ({
    normal: turn(m.normal),
    centre: place(m.centre),
    tris: m.tris.map((t) => [place(t[0]), place(t[1]), place(t[2])] as const),
    part: f.id,
  }));
}

// ── the acceptance ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** ⭐ A filler face's verdict: GLUED — wholly covered by opposite coplanar faces of placed parts; GOAL — the rest on a loose piece's goal volume (glued
 * once it seats); FLUSH — its open part borders an exposed coplanar face of a placed part, the same way out; NONE — neither: refused. `by`: the parts. */
export interface FaceVerdict {
  readonly side: Side;
  readonly verdict: "GLUED" | "GOAL" | "FLUSH" | "NONE";
  readonly by: readonly string[];
  /** the parts covering a FLUSH face in part (no wall: uncovered, its part would be flush the same) */
  readonly partly: readonly string[];
}
export interface FillerVerdict {
  readonly ok: boolean;
  readonly faces: readonly FaceVerdict[];
  /** placed parts and goal volumes reaching into the filler (deeper than `PROXY_FLUSH_MM`) — a filler fills a hollow, never a solid nor a goal */
  readonly inside: readonly string[];
}

/**
 * ⭐⭐⭐ THE ACCEPTANCE (§10.2): the filler's box (`lo`, `hi`, METRES — the face map's units, so `exposedRects` drops the same joints) against the
 * placed set's faces (`bodies`, each with its part — ⛔ never a frozen body) and the loose pieces' goal volumes (`goals`, each piece AT its goal). Each
 * face GLUED, GOAL or FLUSH, and nothing inside — else refused. Coplanar and bordering within `PROXY_FLUSH_MM` (half the face map's coplanar 0.5 mm).
 * ⚠ The inside test reads each part's faces as ONE CONVEX body (a data scene's part: C4); a concave part would need its pieces.
 */
export function fillerVerdict(lo: Vec3, hi: Vec3, bodies: readonly MapFace[], goals: readonly MapFace[] = []): FillerVerdict {
  const tol = PROXY_FLUSH_MM / 1000;
  const faces: FaceVerdict[] = [];
  for (const { side, k, s, a, b } of SIDES) {
    const level = s > 0 ? hi[k] : lo[k];
    const R: Rect2 = { x0: lo[a], x1: hi[a], y0: lo[b], y1: hi[b] };
    const rectOf = (f: MapFace): Rect2 => {
      const xs = f.tris.flatMap((t) => t.map((v) => v[a]));
      const ys = f.tris.flatMap((t) => t.map((v) => v[b]));
      return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    };
    // a face on this side's plane facing `dir` (+1: the same way out as the filler's face, −1: against it)
    const onPlane = (fs: readonly MapFace[], dir: 1 | -1): MapFace[] =>
      fs.filter((f) => f.tris.length > 0 && f.normal[k] * s * dir > 1 - 1e-6 && Math.abs(f.centre[k] - level) <= tol);
    const overlaps = (r: Rect2, q: Rect2): boolean => Math.min(r.x1, q.x1) - Math.max(r.x0, q.x0) > tol && Math.min(r.y1, q.y1) - Math.max(r.y0, q.y0) > tol;
    const partsOver = (fs: readonly MapFace[], r: Rect2): string[] => [...new Set(fs.filter((f) => overlaps(rectOf(f), r)).map((f) => f.part ?? "?"))].sort();
    const covers = onPlane(bodies, -1);
    const open = exposedRects(R, covers.map(rectOf));
    if (open.length === 0) {
      faces.push({ side, verdict: "GLUED", by: partsOver(covers, R), partly: [] });
      continue;
    }
    const goalCovers = onPlane(goals, -1);
    const left = open.flatMap((r) => exposedRects(r, goalCovers.map(rectOf)));
    if (left.length === 0) {
      faces.push({ side, verdict: "GOAL", by: partsOver(goalCovers, R), partly: partsOver(covers, R) });
      continue;
    }
    // FLUSH: each open piece borders an EXPOSED piece of a coplanar face facing the same way (exposed: less the opposite faces of other parts on it)
    const same = onPlane(bodies, 1);
    const exposedOf = (g: MapFace): Rect2[] => exposedRects(rectOf(g), covers.filter((c) => c.part !== g.part).map(rectOf));
    const borders = (e: Rect2, x: Rect2): boolean =>
      ((Math.abs(e.x1 - x.x0) <= tol || Math.abs(x.x1 - e.x0) <= tol) && Math.min(e.y1, x.y1) - Math.max(e.y0, x.y0) > tol) ||
      ((Math.abs(e.y1 - x.y0) <= tol || Math.abs(x.y1 - e.y0) <= tol) && Math.min(e.x1, x.x1) - Math.max(e.x0, x.x0) > tol);
    const by = new Set<string>();
    const flush = left.every((e) => {
      let any = false;
      for (const g of same)
        if (exposedOf(g).some((x) => borders(e, x))) {
          any = true;
          by.add(g.part ?? "?");
        }
      return any;
    });
    faces.push({ side, verdict: flush ? "FLUSH" : "NONE", by: flush ? [...by].sort() : [], partly: partsOver(covers, R) });
  }
  // inside: a separating-axis test of the box against each part (its faces' corners as one convex body) — the box's axes, the part's face normals,
  // and their crosses; the overlap along the best axis is how far the part reaches in
  const byPart = new Map<string, MapFace[]>();
  for (const f of [...bodies, ...goals]) (byPart.get(f.part ?? "?") ?? (byPart.set(f.part ?? "?", []), byPart.get(f.part ?? "?")!)).push(f);
  const corners: Vec3[] = [0, 1, 2, 3, 4, 5, 6, 7].map((c): Vec3 => [c & 1 ? hi[0] : lo[0], c & 2 ? hi[1] : lo[1], c & 4 ? hi[2] : lo[2]]);
  const E: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const inside: string[] = [];
  for (const [id, fs] of byPart) {
    const pts = fs.flatMap((f) => f.tris.flatMap((t) => [t[0], t[1], t[2]]));
    const pbLo = [Infinity, Infinity, Infinity], pbHi = [-Infinity, -Infinity, -Infinity];
    for (const p of pts) for (let d = 0; d < 3; d++) (pbLo[d] = Math.min(pbLo[d]!, p[d]!)), (pbHi[d] = Math.max(pbHi[d]!, p[d]!));
    if ([0, 1, 2].some((d) => Math.min(hi[d]!, pbHi[d]!) - Math.max(lo[d]!, pbLo[d]!) <= tol)) continue;
    const axes: Vec3[] = [...E];
    for (const f of fs) {
      axes.push(f.normal);
      for (const t of f.tris) for (const [p, q] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]] as const) for (const e of E) axes.push(cross(e, sub(q, p)));
    }
    let depth = Infinity;
    for (const ax of axes) {
      const l = Math.hypot(ax[0], ax[1], ax[2]);
      if (!(l > 1e-12)) continue;
      const u: Vec3 = [ax[0] / l, ax[1] / l, ax[2] / l];
      let b0 = Infinity, b1 = -Infinity, q0 = Infinity, q1 = -Infinity;
      for (const c of corners) (b0 = Math.min(b0, dot(c, u))), (b1 = Math.max(b1, dot(c, u)));
      for (const p of pts) (q0 = Math.min(q0, dot(p, u))), (q1 = Math.max(q1, dot(p, u)));
      depth = Math.min(depth, Math.min(b1, q1) - Math.max(b0, q0));
      if (depth <= tol) break;
    }
    if (depth > tol) inside.push(id);
  }
  inside.sort();
  return { ok: faces.every((f) => f.verdict !== "NONE") && inside.length === 0, faces, inside };
}
