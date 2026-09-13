/**
 * MATE CONNECTORS — Onshape's term, adopted deliberately: a local coordinate system
 * on a surface. Two objects assemble when two connectors mate.
 *
 * ⭐⭐ CARRIED FROM `vision_pipeline_python` (`AS1`–`AS9`, shipped and live-confirmed
 * 2026-08-28). That build was written stdlib-only and renderer-free precisely so it
 * could be transliterated rather than rewritten. This is that transliteration.
 * ⛔ Four things a session must NOT rediscover — each cost a live session there:
 *
 * 1. ⛔⛔ A CONNECTOR STORES THE **TRUE OUTWARD NORMAL**, SO A MATE IS
 *    **ANTI-PARALLEL**. It is the opposite of the first natural wording ("the faces
 *    point the same way"), and one place knows that sign — here.
 * 2. ⛔⛔ BREAK ON THE **RESIDUAL** OF THE UNCONSTRAINED DESIRES, NEVER ON THE
 *    OBSERVED GAP. Once mated the gap is zero BY CONSTRUCTION, so a break test that
 *    reads the gap can never fire and the mate is unbreakable. The residual is the
 *    departure between where the two connectors *want* to be before the constraint
 *    is enforced — PhysX's "force required to maintain the constraint".
 * 3. ⭐⭐ PARENT ≠ ROOT. The parent (the bigger object) STORES the relative
 *    transform and is static; the ROOT is whoever is currently held, and is
 *    re-rooted every frame. Conflating them means grabbing a child moves nothing.
 * 4. ⭐ `roll_order` IS WHAT MAKES A MATE **FASTENED** RATHER THAN **REVOLUTE**.
 *    Normals alone leave the roll about the contact axis free (Onshape's Revolute);
 *    the tangent + roll order removes the last DOF.
 */
import type { Quat, Vec3 } from "./vec";
import { dot, length, normalize, qRotate, sub } from "./vec";

export interface MateConnector {
  readonly id: string;
  /** In the owning object's LOCAL frame. */
  readonly position: Vec3;
  /** ⛔ TRUE OUTWARD normal, local frame. See rule 1. */
  readonly normal: Vec3;
  /** The roll reference, perpendicular to `normal`. Local frame. */
  readonly tangent: Vec3;
  /** Rotational symmetry of the face: 1 = none, 4 = a square, 0 = continuous. */
  readonly rollOrder: number;
  /** Capture radius, metres. */
  readonly radius: number;
  /** Connectors mate only within the same kind. */
  readonly kind: string;
}

export interface Placed {
  readonly position: Vec3;
  readonly orientation: Quat;
}

/** A connector's pose in WORLD space, given its owner's placement. */
export function worldPose(c: MateConnector, owner: Placed) {
  return {
    position: [
      owner.position[0] + qRotate(owner.orientation, c.position)[0],
      owner.position[1] + qRotate(owner.orientation, c.position)[1],
      owner.position[2] + qRotate(owner.orientation, c.position)[2],
    ] as Vec3,
    normal: qRotate(owner.orientation, c.normal),
    tangent: qRotate(owner.orientation, c.tangent),
  };
}

export interface MateTest {
  readonly withinRadius: boolean;
  readonly facing: boolean;
  readonly distance: number;
  /** `dot(nA, nB)`: −1 is a perfect mate. */
  readonly alignment: number;
}

/**
 * Can these two connectors mate right now?
 *
 * ⛔ `facing` is **anti-parallel** — see rule 1 in the header. `facingCos` is the
 * threshold on `dot(nA, nB)` and must be NEGATIVE; passing a positive number is the
 * mistake this signature exists to make visible.
 */
export function testMate(
  a: MateConnector,
  aOwner: Placed,
  b: MateConnector,
  bOwner: Placed,
  facingCos: number,
): MateTest | null {
  if (a.kind !== b.kind) return null;
  if (facingCos > 0) {
    throw new Error(
      `facingCos must be negative: a mate is ANTI-PARALLEL (got ${facingCos}).`,
    );
  }
  const pa = worldPose(a, aOwner);
  const pb = worldPose(b, bOwner);
  const na = normalize(pa.normal);
  const nb = normalize(pb.normal);
  if (!na || !nb) return null;

  const distance = length(sub(pb.position, pa.position));
  const alignment = dot(na, nb);
  return {
    distance,
    alignment,
    withinRadius: distance <= Math.min(a.radius, b.radius),
    facing: alignment <= facingCos,
  };
}

/**
 * THE RESIDUAL — how hard the mate is being pulled apart. See rule 2.
 *
 * ⛔ `desiredA` / `desiredB` are the poses the two objects would have WITHOUT the
 * mate enforced. Feeding the observed (already-constrained) poses returns ~0 forever
 * and the mate becomes unbreakable — the defect this signature is shaped to prevent.
 *
 * ⚠ Returns linear metres and angular radians SEPARATELY. Summing them needs a
 * length scale to be meaningful, and inventing one hides which term actually broke
 * the mate.
 */
export function mateResidual(
  a: MateConnector,
  desiredA: Placed,
  b: MateConnector,
  desiredB: Placed,
): { linear: number; angular: number } {
  const pa = worldPose(a, desiredA);
  const pb = worldPose(b, desiredB);
  const linear = length(sub(pb.position, pa.position));
  const na = normalize(pa.normal);
  const nb = normalize(pb.normal);
  if (!na || !nb) return { linear, angular: Math.PI };
  // Anti-parallel is the target, so the error is the angle away from 180°.
  const d = Math.max(-1, Math.min(1, dot(na, nb)));
  return { linear, angular: Math.PI - Math.acos(d) };
}
