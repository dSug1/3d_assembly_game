/**
 * ⭐⭐⭐ **A SCENE'S `.glb` PARTS AS BODIES** (2026-11-14, `20_GAME_RULES/spec/PICK_AND_PLACE.md`; `GM10` – `GM12`) — engine-free.
 *
 * ⭐ THE TWO FRAMES. The file's data (the goal placements, the boot layout, the collision pieces, the face proxy) is in the SCENE frame (reference
 * units, the reference's y up). The game's world is that frame through the glTF reader's root (a MIRROR of x — Babylon's left hand) and the model's
 * `unitM`: `world = unitM · (−x, y, z)`. A rotation crosses the mirror as `(w, x, −y, −z)` (M·R·M with M = diag(−1, 1, 1)).
 *
 * ⭐⭐ A PART'S BODY. Its frame is the WORLD's at the part's GOAL, its origin the goal's centre (`goalCentre`): at its goal a body's pose is
 * `(goalCentre, identity)` — so a goal's symmetry (`yawHalfTurns`: about the world's vertical AT THE GOAL) reads in the body's own frame. Its face
 * proxy and its collision pieces are stored in that frame; anywhere else its pose is the rigid motion that carries it there.
 */
import { compose, type Placement, type TriMesh } from "./glb_geometry";
import { bootShape, type BootPart } from "./boot_heaps";
import { hull2 } from "./resting_face";
import { add, dot, length, normalize, qconj, qmul, qRotate, shortestArc, sub, type Quat, type Vec3 } from "./vec";

/** A scene-frame point in the world (metres). */
export const toWorld = (p: Vec3, unitM: number): Vec3 => [-p[0] * unitM, p[1] * unitM, p[2] * unitM];
/** A world point in the scene frame (reference units). */
export const toScene = (p: Vec3, unitM: number): Vec3 => [-p[0] / unitM, p[1] / unitM, p[2] / unitM];
/** A rotation across the mirror (its own inverse). */
export const mirrorQ = (q: Quat): Quat => [q[0], q[1], -q[2], -q[3]];

/** ⭐ A part's body: its goal centre (world), its face proxy and collision pieces in the body's frame. */
export interface BodyFrame {
  readonly id: string;
  /** World metres: the body's origin at its goal. */
  readonly goalCentre: Vec3;
  /** Where the part stands at its goal (scene frame). */
  readonly goal: Placement;
  /** The face proxy, body frame (metres) — its triangles wound outward (the mirror reverses them; swapped back). */
  readonly faces: TriMesh;
  /** The collision pieces, body frame (metres). */
  readonly pieces: readonly (readonly Vec3[])[];
}

const applyP = (t: Placement, p: Vec3): Vec3 => add(qRotate(t.rotation, p), t.position);

/** ⭐ A part's body from its goal, its collision pieces and its face proxy (both in its own part frame). */
export function bodyFrame(id: string, goal: Placement, pieces: readonly (readonly Vec3[])[], faces: TriMesh, unitM: number): BodyFrame {
  const all = pieces.flat().map((p) => toWorld(applyP(goal, p), unitM));
  const src = all.length > 0 ? all : faces.positions.map((p) => toWorld(applyP(goal, p), unitM));
  if (src.length === 0) throw new Error(`${id}: no collision piece and no face proxy`);
  const lo = [0, 1, 2].map((k) => Math.min(...src.map((p) => p[k]!)));
  const hi = [0, 1, 2].map((k) => Math.max(...src.map((p) => p[k]!)));
  const c: Vec3 = [(lo[0]! + hi[0]!) / 2, (lo[1]! + hi[1]!) / 2, (lo[2]! + hi[2]!) / 2];
  const inBody = (p: Vec3): Vec3 => sub(toWorld(applyP(goal, p), unitM), c);
  const idx: number[] = [];
  for (let k = 0; k + 2 < faces.indices.length; k += 3) idx.push(faces.indices[k]!, faces.indices[k + 2]!, faces.indices[k + 1]!);
  return {
    id,
    goalCentre: c,
    goal,
    faces: { positions: faces.positions.map(inBody), indices: idx },
    pieces: pieces.map((pc) => pc.map(inBody)),
  };
}

/** ⭐ The body's world pose for the part placed at `P` (scene frame). At its goal: `(goalCentre, identity)`. */
export function bodyPoseOf(f: BodyFrame, P: Placement, unitM: number): { readonly position: Vec3; readonly orientation: Quat } {
  // D = P ∘ G⁻¹ (scene frame); in the world R' = mirrorQ(R_D), t' = W(t_D); the body's origin goes to R'·c + t'
  const gInv: Placement = { rotation: qconj(f.goal.rotation), position: qRotate(qconj(f.goal.rotation), [-f.goal.position[0], -f.goal.position[1], -f.goal.position[2]]) };
  const D = compose(P, gInv);
  const R = mirrorQ(D.rotation);
  return { position: add(qRotate(R, f.goalCentre), toWorld(D.position, unitM)), orientation: R };
}

/** ⭐ The part's scene placement for the body at `pose` — the inverse of `bodyPoseOf` (what the drawn node takes). */
export function placementOf(f: BodyFrame, pose: { readonly position: Vec3; readonly orientation: Quat }, unitM: number): Placement {
  const Rd = mirrorQ(pose.orientation);
  const tD = toScene(sub(pose.position, qRotate(pose.orientation, f.goalCentre)), unitM);
  return compose({ position: tD, rotation: Rd }, f.goal);
}

/**
 * ⭐⭐ WHICH PARTS MAY BE PICKED (the owner, 2026-11-14: *"Placed; next steps only"*): a part not placed, every part of an EARLIER step placed. ⚠ The
 * file's `step` numbers carry the plan's partial order only as groups (both banks 5, all six pistons 6): read conservatively — a step waits for
 * every lower one (`PICK_AND_PLACE.md` §2 item 5).
 */
export function pickableParts(parts: readonly { readonly id: string; readonly step: number }[], placed: ReadonlySet<string>): Set<string> {
  const out = new Set<string>();
  for (const p of parts) {
    if (placed.has(p.id)) continue;
    if (parts.every((q) => q.step >= p.step || placed.has(q.id))) out.add(p.id);
  }
  return out;
}

const DOWN: Vec3 = [0, -1, 0];

/** ⭐ The put-down's rules — the boot's (`BootRule`'s): the floor, its margin, the perimeter round the anchors, the front half. */
export interface PutDownRule {
  readonly floorY: number;
  readonly floorHalf: number;
  readonly floorMargin: number;
  /** The perimeter round the placed assembly (scene frame x0, x1, z0, z1), `null`: none. */
  readonly perimeter: { readonly x0: number; readonly x1: number; readonly z0: number; readonly z1: number } | null;
  /** The front half's direction (degrees, `atan2(z, x)` in the scene frame), `null`: anywhere. */
  readonly yawOriginDeg: number | null;
  /** The spiral's step (reference units) and its reach. */
  readonly stepU: number;
  readonly maxU: number;
}

const inside = (P: readonly (readonly [number, number])[], c: readonly [number, number]): boolean => {
  for (let i = 0; i < P.length; i++) {
    const a = P[i]!, b = P[(i + 1) % P.length]!;
    if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0) return false;
  }
  return P.length >= 3;
};

/** Two convex outlines (counter-clockwise) overlap — the separating axis test over their edges' normals. Touching IS an overlap; `tol`: an overlap up
 * to that deep is allowed (touching within it apart). */
export function outlinesOverlap(A: readonly (readonly [number, number])[], B: readonly (readonly [number, number])[], tol = 0): boolean {
  for (const P of [A, B]) {
    for (let i = 0; i < P.length; i++) {
      const a = P[i]!, b = P[(i + 1) % P.length]!;
      const n: [number, number] = [b[1] - a[1], -(b[0] - a[0])];
      const l = Math.hypot(n[0], n[1]);
      if (l === 0) continue;
      const pr = (Q: readonly (readonly [number, number])[]) => Q.map((q) => (q[0] * n[0] + q[1] * n[1]) / l);
      const pa = pr(A), pb = pr(B);
      if (Math.max(...pa) < Math.min(...pb) + tol || Math.max(...pb) < Math.min(...pa) + tol) return false;
    }
  }
  return true;
}

/**
 * ⭐⭐ WHERE A PUT-DOWN PART LIES (the owner, 2026-11-14: *"a free spot close to current position, respecting the rules I set for the boot (margins,
 * no stack, etc.)"* · *"the quaternion rotates the least possible to make the piece rest on the floor"*): its STABLE face needing the SMALLEST turn
 * from its orientation now made its bottom (turned by the shortest arc), then the spot NEAREST its position now (seen from above) — a spiral out —
 * where it lies on the floor, inside the floor's margin, outside the perimeter, in the front half, its outline over no other's (one high), its rest
 * holding. `null`: no spot within `maxU`.
 */
export function putDownPlacement(
  part: BootPart,
  now: Placement,
  others: readonly (readonly Vec3[])[],
  rule: PutDownRule,
): Placement | null {
  const s = bootShape(part);
  // ⭐ the least turn: the stable face whose normal, turned as the part is now, is nearest the down
  let best: { q: Quat; a: number } | null = null;
  for (const n of s.faces) {
    const w = qRotate(now.rotation, n);
    const a = Math.acos(Math.max(-1, Math.min(1, dot(normalize(w) ?? DOWN, DOWN))));
    if (best === null || a < best.a) best = { q: qmul(shortestArc(w, DOWN), now.rotation), a };
  }
  const q = best!.q;
  const rotated = s.hull.map((p) => qRotate(q, p));
  const minY = Math.min(...rotated.map((p) => p[1]));
  const cw = qRotate(q, s.com);
  const outlines = others.map((pts) => hull2(pts.map((p) => [p[0], p[2]] as [number, number])));
  const centreNow = add(qRotate(now.rotation, s.com), now.position);
  const edge = rule.floorHalf - rule.floorMargin;
  const tryAt = (cx: number, cz: number): Placement | null => {
    const base: Vec3 = [cx - cw[0], rule.floorY - minY, cz - cw[2]];
    const w = rotated.map((p) => add(p, base));
    if (w.some((p) => Math.abs(p[0]) > edge || Math.abs(p[2]) > edge)) return null;
    const out = hull2(w.map((p) => [p[0], p[2]] as [number, number]));
    const k = rule.perimeter;
    if (k !== null) {
      const box: [number, number][] = [[k.x0, k.z0], [k.x1, k.z0], [k.x1, k.z1], [k.x0, k.z1]];
      if (outlinesOverlap(out, box)) return null;
    }
    if (rule.yawOriginDeg !== null) {
      const yo = (rule.yawOriginDeg * Math.PI) / 180;
      let mx = 0, mz = 0;
      for (const p of w) (mx += p[0]), (mz += p[2]);
      // ⚠ strictly in front, by more than rounding (cos 90° is not 0)
      if ((mx / w.length) * Math.cos(yo) + (mz / w.length) * Math.sin(yo) <= 1e-9) return null;
    }
    if (outlines.some((o) => outlinesOverlap(out, o, 1e-4))) return null;
    // ⛔ the rest holds: its centre of mass over its contacts with the floor
    const contacts = hull2(w.filter((p) => p[1] - rule.floorY < 2e-3).map((p) => [p[0], p[2]] as [number, number]));
    const c = add(cw, base);
    if (!inside(contacts, [c[0], c[2]])) return null;
    return { position: base, rotation: q };
  };
  for (let r = 0; r <= rule.maxU + 1e-9; r += rule.stepU) {
    const n = r === 0 ? 1 : Math.max(8, Math.ceil((2 * Math.PI * r) / rule.stepU));
    for (let i = 0; i < n; i++) {
      const t = (2 * Math.PI * i) / n;
      const at = tryAt(centreNow[0] + r * Math.cos(t), centreNow[2] + r * Math.sin(t));
      if (at !== null) return at;
    }
  }
  return null;
}

/** ⭐ The perimeter round points (scene frame), enlarged by `margin`. */
export function perimeterOf(pts: readonly Vec3[], margin: number): PutDownRule["perimeter"] {
  if (pts.length === 0) return null;
  return {
    x0: Math.min(...pts.map((p) => p[0])) - margin,
    x1: Math.max(...pts.map((p) => p[0])) + margin,
    z0: Math.min(...pts.map((p) => p[2])) - margin,
    z1: Math.max(...pts.map((p) => p[2])) + margin,
  };
}

/** ⭐ The distance between two poses' origins (metres) — a test's helper too. */
export const poseGap = (a: Vec3, b: Vec3): number => length(sub(a, b));
