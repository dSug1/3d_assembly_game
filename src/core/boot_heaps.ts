/**
 * ⭐⭐⭐ **THE BOOT STAGE'S HEAPS for a scene's `.glb` parts** (2026-11-13 — `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md` §2.5, D4 *"as the demo's"*;
 * `SCENE_WORKFLOW.md` §6.4 item 4). Engine-free; generated OFFLINE as data (`scripts/gen_scene2_boot.ts`), checked by `tests/boot_heaps.test.ts`.
 *
 * The rules of the plan:
 * - **one heap per TYPE of part** (the owner: *"keep the same types of parts close together … so it reproduces the classification by color of the
 *   demo scene"*), the heaps in a STRIP between the floor's edge and the engine, in front as the boot camera sees it;
 * - **dropped, not placed**: each part on a STABLE face of its hull (`restingFaces`: its centre of mass over the support, the tipping gate), at a
 *   random yaw, lowered until it touches the floor or the heap — a rest must HOLD (its centre of mass over its contacts), **three high at most**;
 *   ⛔ never chosen for its seating face (*"I would not lie the parts on their seating face at start"*): any stable face, as the demo's;
 * - **the order**: the parts reach their heaps in the REVERSE of the steps, so the part the player needs next is on TOP (*"the last one down is
 *   the first one lifted"*).
 * The anchor (the plinth) stands at its goal; nothing may touch it.
 */
import { convexHull3 } from "./hull3";
import { gapBetween } from "./collision_shape";
import { hull2, restingFaces } from "./resting_face";
import { apply, glbBin, partGeometry, type Placement } from "./glb_geometry";
import type { ModelCatalog } from "./model_catalog";
import { cross, length, normalize, qFromAxisAngle, qmul, qRotate, shortestArc, sub, type Quat, type Vec3 } from "./vec";

export interface BootPart {
  readonly id: string;
  readonly step: number;
  /** Its heap's name (one per type of part). */
  readonly heap: string;
  /** Its convex collision pieces, in its own frame (reference units). */
  readonly pieces: readonly (readonly Vec3[])[];
}

export interface BootOptions {
  readonly seed: number;
  /** The heaps' order along the strip (heap names). */
  readonly heapOrder: readonly string[];
  /**
   * ⭐ Where the heaps stand: an ARC round the front of the engine as the boot camera sees it (the scene frame, reference units) — an ellipse's
   * centre (x, z), its half-axes (x, z) and the angles it spans (degrees in the x–z plane, 270 = straight toward the camera at −z).
   * ⛔ (2026-11-13) one straight row along the floor's front edge first: six heaps of the engine's parts need ≈ 14.8 units of its 12.8, and a
   * second row overlapped the first (the crankshaft fell on an exhaust).
   */
  readonly arc: { readonly centre: readonly [number, number]; readonly half: readonly [number, number]; readonly spanDeg: number };
  /**
   * ⭐⭐ (2026-11-13, the owner: *"there is a problem of yaw origin … all the parts are in the … half right of the scene, instead of the front
   * half"*) THE YAW ORIGIN: the direction from the scene's centre TOWARD THE BOOT CAMERA, as an angle in the scene frame's x–z plane (degrees,
   * `atan2(z, x)`). The heaps' arc is centred on it, `spanDeg` wide — the FRONT half as the player first sees it. ⛔ It was assumed (the camera at
   * −z, 270°): the camera boots elsewhere and the heaps stood in its right half. The game READS it from the camera at load.
   */
  readonly yawOriginDeg: number;
  /** A heap's footprint as a share of its widest part's radius (a part LIES: its footprint is less than its 3D radius). */
  readonly footprintShare: number;
  /** The floor: its top and its extent (a part must lie within it). */
  readonly floorY: number;
  readonly floorHalf: number;
  /** ⭐ (2026-11-13, the owner: *"add a smaller margin before the edges of the floor"*) no part within this of the floor's edge (reference units). */
  readonly floorMargin: number;
  readonly maxStack: number;
  /**
   * ⭐ (2026-11-13, the owner: *"leave more space around the plinth so that the parts do not interfere later on … make a perimeter around the
   * plinth that the parts can't cross"*) THE PERIMETER: the anchors' footprint enlarged by this on every side (reference units) — no point of a
   * part may lie inside it.
   */
  readonly anchorMargin: number;
  /** The spread of a heap's parts around its centre, as a share of the heap's radius. */
  readonly jitterShare: number;
  readonly tries: number;
}

export interface BootPose extends Placement {
  readonly heap: string;
  /** How many parts high it rests (1 = on the floor). */
  readonly level: number;
  /** What it rests on: the floor and / or parts. */
  readonly on: readonly string[];
}

export interface BootLayout {
  readonly poses: Readonly<Record<string, BootPose>>;
  /** The perimeter round the anchors (x0, x1, z0, z1), `null` with no anchor. */
  readonly perimeter: { readonly x0: number; readonly x1: number; readonly z0: number; readonly z1: number } | null;
  /** Each heap's centre (x, z) and radius. */
  readonly heaps: Readonly<Record<string, { readonly centre: readonly [number, number]; readonly radius: number }>>;
}

const DOWN: Vec3 = [0, -1, 0];
const CONTACT = 2e-3;
/**
 * ⛔ A part is BLOCKED when its gap to another is under this (reference units, 0.014 mm) — `gapBetween` reads touching AND overlapping as `0`,
 * never `null` (the first version tested `=== null`: no part ever blocked another; the test's counter-example caught it). The clearance also
 * survives the data's 6-decimal rounding.
 */
const CLEAR = 1e-4;
/** A heap's AREA: its parts' spots are drawn within this many times its radius of its centre (the heaps may meet at their edges; a part never rests
 *  on another heap's part). */
const AREA_SHARE = 1.2;

/** A seeded generator (Park–Miller) — the same layout for the same seed. */
function rng(seed: number): () => number {
  let s = Math.max(1, Math.floor(seed) % 2147483647);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

interface Shape {
  readonly part: BootPart;
  readonly hull: readonly Vec3[];
  readonly com: Vec3;
  readonly radius: number;
  readonly faces: readonly Vec3[];
}

/** ⭐ A part's hull, centre of mass and stable resting faces (their outward normals, in its frame). */
export function bootShape(part: BootPart): Shape {
  const h = convexHull3(part.pieces.flat());
  if (h === null) throw new Error(`${part.id}: no hull`);
  // ⚠ a sliver of the joggled hull can have NO area on the original points: no normal, no resting face — skipped
  const faces = h.triangles.flatMap(([i, j, k]) => {
    const a = h.points[i]!, b = h.points[j]!, c = h.points[k]!;
    const normal = normalize(cross(sub(b, a), sub(c, a)));
    return normal === null ? [] : [{ normal, centre: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3] as Vec3, triangles: [i, j, k] }];
  });
  const r = restingFaces(h.points, faces);
  const stable = r.groups.flatMap((g) => g.members.map((m) => m.normal));
  if (stable.length === 0) throw new Error(`${part.id}: no stable face`);
  const radius = Math.max(...h.points.map((p) => length(sub(p, r.com))));
  return { part, hull: h.points, com: r.com, radius, faces: stable };
}


/**
 * ⭐⭐ The layout. `anchors`: parts standing at their goals (pieces already in the scene frame) — obstacles, never touched.
 */
export function bootLayout(parts: readonly BootPart[], anchors: readonly { readonly id: string; readonly pieces: readonly (readonly Vec3[])[] }[], opt: BootOptions): BootLayout {
  const rnd = rng(opt.seed);
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
  const shapes = new Map(parts.map((p) => [p.id, bootShape(p)]));

  // ⭐ the heaps along the ARC, in order: each taking its footprint, the gaps equal
  const heapNames = opt.heapOrder.filter((h) => parts.some((p) => p.heap === h));
  // ⭐ a heap's radius: room for its parts LYING SIDE BY SIDE — √ of their footprints squared summed (the demo's "√ of the flat area"), at least
  // its widest part's (a heap of six pistons in one piston's footprint: no landing on another held, 80 tries refused)
  const heapR = new Map(
    heapNames.map((h) => {
      const rs = parts.filter((p) => p.heap === h).map((p) => opt.footprintShare * shapes.get(p.id)!.radius);
      return [h, Math.max(Math.max(...rs), Math.sqrt(rs.reduce((a, r) => a + r * r, 0)))];
    }),
  );
  const N = 720;
  const arcPt = (i: number): [number, number] => {
    const from = opt.yawOriginDeg - opt.arc.spanDeg / 2;
    const t = ((from + (opt.arc.spanDeg * i) / N) * Math.PI) / 180;
    return [opt.arc.centre[0] + opt.arc.half[0] * Math.cos(t), opt.arc.centre[1] + opt.arc.half[1] * Math.sin(t)];
  };
  const cum: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const a = arcPt(i - 1), b = arcPt(i);
    cum.push(cum[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const L = cum[N]!;
  const total = heapNames.reduce((s, h) => s + 2 * heapR.get(h)!, 0);
  if (total > L) throw new Error(`the heaps need ${total.toFixed(2)} along the arc, it is ${L.toFixed(2)} long`);
  const gap = (L - total) / (heapNames.length + 1);
  const at = (d: number): [number, number] => {
    const i = Math.max(1, cum.findIndex((c) => c >= d));
    const f = (d - cum[i - 1]!) / Math.max(1e-12, cum[i]! - cum[i - 1]!);
    const a = arcPt(i - 1), b = arcPt(i);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
  const heaps: Record<string, { centre: [number, number]; radius: number }> = {};
  let d = gap;
  for (const h of heapNames) {
    const r = heapR.get(h)!;
    heaps[h] = { centre: at(d + r), radius: r };
    d += 2 * r + gap;
  }

  // ⭐ the drop: obstacles = the anchors and the parts already down
  const obstacles: { id: string; pieces: Vec3[][] }[] = anchors.map((a) => ({ id: a.id, pieces: a.pieces.map((p) => [...p]) }));
  const level = new Map<string, number>(anchors.map((a) => [a.id, 0]));
  const poses: Record<string, BootPose> = {};
  const order = [...parts].sort((a, b) => b.step - a.step || (a.id < b.id ? 1 : -1)); // the reverse of the steps
  // ⭐ (2026-11-13, *"randomly distribute the parts … otherwise the parts will always be the same order game after game"*) — run at EVERY boot:
  // a part collides as its HULL (one convex set — conservative: nothing rests inside another's hollow, right for a heap), and only against what
  // stands under its footprint; it starts just above that, straight onto the floor when nothing is under it. (≈ 25 s for all the pieces first.)
  type Down = { id: string; heap: string; hull: Vec3[]; lo: Vec3; hi: Vec3; outline: [number, number][] };
  const box = (pts: readonly Vec3[]): { lo: Vec3; hi: Vec3 } => ({
    lo: [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.min(...pts.map((p) => p[2]))],
    hi: [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[2]))],
  });
  // ⭐ the PERIMETER round the anchors: their footprint (x, z) enlarged by `anchorMargin`
  const anchorPts = anchors.flatMap((a) => a.pieces.flat());
  const keep =
    anchorPts.length === 0
      ? null
      : {
          x0: Math.min(...anchorPts.map((p) => p[0])) - opt.anchorMargin,
          x1: Math.max(...anchorPts.map((p) => p[0])) + opt.anchorMargin,
          z0: Math.min(...anchorPts.map((p) => p[2])) - opt.anchorMargin,
          z1: Math.max(...anchorPts.map((p) => p[2])) + opt.anchorMargin,
        };
  const down: Down[] = obstacles.flatMap((o) =>
    o.pieces.map((pc) => ({ id: o.id, heap: "", hull: pc, ...box(pc), outline: hull2(pc.map((p) => [p[0], p[2]] as [number, number])) })),
  );
  const overXZ = (a: { lo: Vec3; hi: Vec3 }, b: { lo: Vec3; hi: Vec3 }) =>
    a.lo[0] <= b.hi[0] + CONTACT && b.lo[0] <= a.hi[0] + CONTACT && a.lo[2] <= b.hi[2] + CONTACT && b.lo[2] <= a.hi[2] + CONTACT;

  for (const part of order) {
    const s = shapes.get(part.id)!;
    const hp = heaps[part.heap]!;
    let placed: BootPose | null = null;
    const why = new Map<string, number>();
    const no = (k: string): void => void why.set(k, (why.get(k) ?? 0) + 1);
    for (let t = 0; t < opt.tries && placed === null; t++) {
      const n = s.faces[Math.floor(rnd() * s.faces.length)]!;
      const q: Quat = qmul(qFromAxisAngle([0, 1, 0], rnd() * 2 * Math.PI), shortestArc(n, DOWN));
      // ⭐ a spot drawn in the heap's AREA, around its centre — the spread widening with the tries (a crowded heap finds floor), never past the area
      const area = hp.radius * AREA_SHARE;
      const spread = opt.jitterShare * hp.radius * (1 + t / 8);
      let dx = gauss() * spread, dz = gauss() * spread;
      const dl = Math.hypot(dx, dz);
      if (dl > area) (dx *= area / dl), (dz *= area / dl);
      const rotated = s.hull.map((p) => qRotate(q, p));
      const cw = qRotate(q, s.com);
      const base: Vec3 = [hp.centre[0] + dx - cw[0], 0, hp.centre[1] + dz - cw[2]];
      const minY = Math.min(...rotated.map((p) => p[1]));
      const at = (lowest: number): Placement => ({ position: [base[0], lowest - minY, base[2]], rotation: q });
      const ptsAt = (lowest: number): Vec3[] => rotated.map((p) => [p[0] + base[0], p[1] + lowest - minY, p[2] + base[2]] as Vec3);
      const fb = box(ptsAt(opt.floorY));
      const under = down.filter((d) => overXZ(fb, d));
      const hits = (lowest: number): boolean => {
        const w = ptsAt(lowest);
        return under.some((d) => (gapBetween(w, d.hull) ?? 0) < CLEAR);
      };
      let lowest = opt.floorY;
      if (hits(lowest)) {
        let hi = Math.max(...under.map((d) => d.hi[1])) + 2 * CLEAR;
        if (hits(hi)) {
          no("no room above");
          continue;
        }
        let lo = lowest;
        for (let i = 0; i < 24; i++) {
          const m = (lo + hi) / 2;
          if (hits(m)) lo = m;
          else hi = m;
        }
        lowest = hi;
      }
      const pose = at(lowest);
      const hullW = ptsAt(lowest);
      const edge = opt.floorHalf - opt.floorMargin;
      if (hullW.some((p) => Math.abs(p[0]) > edge || Math.abs(p[2]) > edge)) {
        no("within the floor's margin");
        continue;
      }
      // ⛔ never inside the plinth's PERIMETER — the hull's outline against the box (a hull point inside, or the box's corner inside the hull)
      if (keep !== null) {
        const out2 = hull2(hullW.map((p) => [p[0], p[2]] as [number, number]));
        const corners: [number, number][] = [[keep.x0, keep.z0], [keep.x1, keep.z0], [keep.x1, keep.z1], [keep.x0, keep.z1]];
        const pointIn = hullW.some((p) => p[0] > keep.x0 && p[0] < keep.x1 && p[2] > keep.z0 && p[2] < keep.z1);
        if (pointIn || corners.some((c) => insideBy(out2, c, 0))) {
          no("inside the plinth's perimeter");
          continue;
        }
      }
      // ⭐ what it rests on, and the contact points
      const on: string[] = [];
      const contacts: Vec3[] = [];
      for (const p of hullW) if (p[1] - opt.floorY < CONTACT) contacts.push(p);
      if (contacts.length > 0) on.push("floor");
      for (const d of under) {
        if ((gapBetween(hullW, d.hull) ?? 0) >= CONTACT) continue;
        if (!on.includes(d.id)) on.push(d.id);
        for (const p of hullW) if ((gapBetween([p], d.hull) ?? 0) < CONTACT) contacts.push(p);
      }
      // ⛔ a rest must HOLD: the centre of mass over the contacts' footprint (a part on an edge or a point is refused). ⚠ The margin 1 % of the
      // part's radius: 5 % refused the crankshaft on the floor (a bar 0.06 thick: its centre of mass ≈ 0.05 from its support's edge — its face had
      // passed the tipping gate, ≥ 15°)
      const c = apply(pose, s.com);
      const P = hull2(contacts.map((p) => [p[0], p[2]] as [number, number]));
      if (P.length < 3 || !insideBy(P, [c[0], c[2]], 0.01 * s.radius)) {
        no("not held");
        continue;
      }
      // ⛔ ONE heap per type — a part rests on the floor or on its own heap's parts only (the crankshaft fell on an exhaust); never the anchor
      if (on.some((x) => x !== "floor" && poses[x]?.heap !== part.heap)) {
        no("on another heap or the anchor");
        continue;
      }
      // ⛔ THREE HIGH AT MOST, BOTH WAYS THE EYE COUNTS (the demo's `D194`): up the support chain …
      const lv = 1 + Math.max(0, ...on.filter((x) => x !== "floor").map((x) => level.get(x) ?? 0));
      if (lv > opt.maxStack) {
        no("over three, up the chain");
        continue;
      }
      // … and FROM ABOVE: no point of its outline already under three of its heap's outlines (a staircase passes the chain, not this)
      const outline = hull2(hullW.map((p) => [p[0], p[2]] as [number, number]));
      const mine = down.filter((d) => d.heap === part.heap);
      const ob = box(hullW);
      const stepG = s.radius / 6;
      let over = false;
      for (let x = ob.lo[0]; x <= ob.hi[0] && !over; x += stepG)
        for (let z = ob.lo[2]; z <= ob.hi[2] && !over; z += stepG) {
          if (!insideBy(outline, [x, z], 0)) continue;
          if (mine.filter((d) => insideBy(d.outline, [x, z], 0)).length >= opt.maxStack) over = true;
        }
      if (over) {
        no("over three, from above");
        continue;
      }
      placed = { ...pose, heap: part.heap, level: lv, on };
      level.set(part.id, lv);
      down.push({ id: part.id, heap: part.heap, hull: hullW, ...ob, outline });
    }
    if (placed === null) throw new Error(`${part.id}: no rest found in heap ${part.heap} after ${opt.tries} tries — ${[...why].map(([k, v]) => `${k} ×${v}`).join("; ")}`);
    poses[part.id] = placed;
  }
  return { poses, heaps, perimeter: keep };
}

/** The point inside the counter-clockwise polygon by at least `margin` from every edge. */
function insideBy(P: readonly (readonly [number, number])[], c: readonly [number, number], margin: number): boolean {
  for (let i = 0; i < P.length; i++) {
    const a = P[i]!, b = P[(i + 1) % P.length]!;
    const ex = b[0] - a[0], ez = b[1] - a[1];
    const l = Math.hypot(ex, ez);
    if (l === 0) continue;
    const side = (ex * (c[1] - a[1]) - ez * (c[0] - a[0])) / l;
    if (side < margin) return false;
  }
  return true;
}




/**
 * ⭐⭐ A scene's BOOT RULE (`SceneDescriptor.model.boot`): the heaps by type, the anchors, and the layout's options but the seed — the layout is
 * DRAWN AT EVERY BOOT (the owner, 2026-11-13: *"there has to be a script which randomly distribute the parts within assigned areas and with the
 * rules I indicated for demo scene, otherwise the parts will always be the same order game after game"*).
 */
export interface BootRule extends Omit<BootOptions, "seed" | "yawOriginDeg"> {
  /** Each non-anchor part's heap (its type). */
  readonly heapOf: Readonly<Record<string, string>>;
  /** The parts standing at their goals from the start (D3 — the plinth). */
  readonly anchors: readonly string[];
}

/** ⭐ The layout from the scene's `.glb` bytes and its catalogue — at load (the game) or in the tests; ≈ 0.3 – 0.7 s. */
export function bootFromModel(bytes: Uint8Array, json: unknown, catalog: ModelCatalog, rule: BootRule, seed: number, yawOriginDeg: number): BootLayout {
  const geo = partGeometry(json, glbBin(bytes), catalog);
  const anchors = new Set(rule.anchors);
  const missing = geo.filter((g) => !anchors.has(g.id) && rule.heapOf[g.id] === undefined).map((g) => g.id);
  if (missing.length > 0) throw new Error(`the boot rule has no heap for ${missing.join(", ")}`);
  return bootLayout(
    geo.filter((g) => !anchors.has(g.id)).map((g) => ({ id: g.id, step: catalog.parts.find((p) => p.id === g.id)!.step, heap: rule.heapOf[g.id]!, pieces: g.pieces })),
    geo.filter((g) => anchors.has(g.id)).map((g) => ({ id: g.id, pieces: g.pieces.map((pc) => pc.map((p) => apply(g.goal, p))) })),
    { ...rule, seed, yawOriginDeg },
  );
}

/**
 * ⭐ The layout, RETRIED with the next seeds when one finds no rest for a part (the block's long cases squeezed between the plinth's perimeter
 * and the floor's margin: 4 seeds of 30 at 80 tries) — a level never falls back to the assembled engine. Returns the seed used.
 */
export function bootWithRetries(
  bytes: Uint8Array, json: unknown, catalog: ModelCatalog, rule: BootRule, seed: number, yawOriginDeg: number, attempts = 6,
): { layout: BootLayout; seed: number } {
  let last: unknown = null;
  for (let k = 0; k < attempts; k++) {
    try {
      return { layout: bootFromModel(bytes, json, catalog, rule, seed + k, yawOriginDeg), seed: seed + k };
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
