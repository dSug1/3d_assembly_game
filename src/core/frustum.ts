/**
 * ⭐⭐⭐ **A TRUNCATED PYRAMID, MADE BY MOVING A BOX'S VERTICES — not by authoring a mesh.**
 *
 * The owner, 2026-09-22: *"modify the rectangle on the right to be a trapezoidal pyramid."*
 *
 * ⛔⛔ **WHY A TAPER AND NOT A NEW MESH.** Authoring vertices means authoring a WINDING, and a
 * winding authored by hand is a coin flip: Babylon culls back faces, so the body renders
 * inside out, and `mesh_topology.ts`'s own header records that its first version encoded the
 * wrong winding assumption and inverted every normal in the scene. ⭐ Taking the positions
 * Babylon's own box builder produced and MOVING them keeps that builder's winding, its index
 * list and its vertex splitting exactly as they were — so the only thing that changes is where
 * the points are, which is the only thing that should change.
 *
 * ⭐⭐ **AND IT IS WHY THIS LIVES IN `core/`.** The arithmetic is plain data in, plain data
 * out, so it carries golden vectors; the engine call that feeds it lives in `render/scene.ts`
 * and owns nothing. ⚠ `CONSTRAINTS` §2.
 *
 * ⛔ **EVERYTHING DOWNSTREAM IS ALREADY MESH-DERIVED AND NEEDS NO CHANGE**: `collision_shape`
 * reads the vertices (`D49`), `mesh_topology` welds and groups them into logical faces
 * (`D50`), and every outline and face marker is drawn from those. ⚠ That is the whole reason
 * this is a small change instead of a large one — and it is worth noticing that the two
 * decisions that made it small were both taken for the sake of *imported* geometry that does
 * not exist yet. The first non-box body in the scene is what proves they paid.
 *
 * ⭐⭐ **A SIDE EFFECT WORTH NAMING**: `QUEUE.md` records that the first 24 collision vectors
 * were all BOXES, that the Minkowski difference of two boxes is a box, and that GJK therefore
 * converged in one step with **three deep branches unreached by the whole suite**. A frustum
 * against a box is not a box. ⚠ This is the first body in the product that can reach them.
 */
/**
 * ⭐ Scale the x and z of every vertex in the TOP half of a mesh toward the mesh's own
 * vertical axis, turning a box into a truncated rectangular pyramid.
 *
 * `topScale` is the fraction the top face keeps: `1` is the original box, `0.5` a top half the
 * width and depth of the base, `0` a true pyramid whose apex is a point.
 *
 * ⛔⛔ **THE BASE IS LEFT ALONE, AND THAT IS LOAD-BEARING RATHER THAN TIDY.** The boot scene's
 * clearances are measured from the bodies' surfaces (`D49`), and `tests/highlight.test.ts`
 * asserts 320 mm between the two parts at rest against a capture threshold that must stay
 * clear of it. ⭐ Tapering upward leaves the widest section exactly where the box's was, so
 * that distance — and the vector that guards it — are untouched. Tapering about the centre
 * would have narrowed the base and moved a number three other assertions depend on.
 *
 * ⚠ The split is taken at the bounding box's own mid-height and the scaling is about the
 * bounding box's own x/z centre, NOT about the origin: a mesh whose author did not centre it
 * must taper about itself, or it would shear sideways as it narrowed. ⛔ The first import
 * whose origin is not at its middle is exactly where an origin assumption would surface, and
 * `D50` already had to delete one table that made a similar assumption silently.
 *
 * ⛔ **A REFUSAL, NEVER A DEFAULT** (`LESSONS_CARRIED` §6). Bad input returns `null` and the
 * caller says so out loud; substituting a plausible shape would put a body on the glass whose
 * collision volume matches nothing the eye can see.
 *
 * @returns fresh positions, or `null` if the input or `topScale` is unusable.
 */
export function taperTop(
  positionsXYZ: ArrayLike<number>,
  topScale: number,
): Float32Array | null {
  if (!Number.isFinite(topScale) || topScale < 0 || topScale > 1) return null;
  const n = positionsXYZ.length;
  if (n === 0 || n % 3 !== 0) return null;

  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i + 2 < n; i += 3) {
    const x = positionsXYZ[i] as number;
    const y = positionsXYZ[i + 1] as number;
    const z = positionsXYZ[i + 2] as number;
    // ⚠ A single NaN would otherwise propagate into every bound and out into the shape.
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const midY = (minY + maxY) / 2;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  const out = new Float32Array(n);
  for (let i = 0; i + 2 < n; i += 3) {
    const x = positionsXYZ[i] as number;
    const y = positionsXYZ[i + 1] as number;
    const z = positionsXYZ[i + 2] as number;
    // ⛔ STRICTLY above the middle. A flat mesh has every vertex AT the middle and is returned
    // unchanged rather than collapsed — it has no top half to taper.
    const top = y > midY;
    out[i] = top ? cx + (x - cx) * topScale : x;
    out[i + 1] = y;
    out[i + 2] = top ? cz + (z - cz) * topScale : z;
  }
  return out;
}
