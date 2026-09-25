/**
 * ⭐⭐⭐ **THE TRAPEZOIDAL PYRAMID** — the owner, 2026-09-22: *"modify the rectangle on the
 * right to be a trapezoidal pyramid."*
 *
 * ⛔⛔ **THE VECTORS THAT MATTER HERE ARE THE COMPOSITIONS, NOT THE ARITHMETIC.** Scaling two
 * of three coordinates is not where a shape change goes wrong. It goes wrong downstream — in
 * the logical faces the body presents to a tap, in the collision hull that decides capture,
 * and in the boot clearance three other assertions are measured against. ⭐ `METHOD`: *a
 * composition is a thing to MEASURE, not an emergent property* — so this file runs the tapered
 * positions through `meshTopology` and through `shapeFromVertices`/`gapBetween` and states
 * what comes out, rather than trusting that mesh-derived means mesh-correct.
 */
import { describe, expect, it } from "vitest";
import { taperTop } from "../src/core/frustum";
import { meshTopology } from "../src/core/mesh_topology";
import { gapBetween, shapeFromVertices } from "../src/core/collision_shape";
import type { Vec3 } from "../src/core/vec";
import {
  BOOT_TILT_DEG,
  bootTilt,
  OBJECT_DIMS_M,
  OBJECT_TOP_SCALE,
  PYRAMID_DIMS_M,
} from "../src/core/scene_dims";
import { qFromAxisAngle, qmul } from "../src/core/vec";

/** The scene's module, in metres. ⚠ Mirrors `render/scene.ts`'s `OBJECT_SIZE_M`. */
// ⛔⛔⛔ **READ FROM THE PRODUCT, NOT RETYPED** (2026-09-25) — these mirrored `scene.ts` and went
// stale the moment the owner scaled the pyramid, with nothing going red.
/** ⭐ The part the product builds: `L × 2L × 3L`. */
const PART = OBJECT_DIMS_M;
/** ⭐ The pyramid, whose TOP face is a part's small face (the owner, 2026-09-25). */
const PYRAMID = PYRAMID_DIMS_M;
const TAPER = OBJECT_TOP_SCALE;

/**
 * A box with **split vertices** — four per face, 24 in all — which is what Babylon's builder
 * and every glTF exporter produce.
 *
 * ⛔⛔ **A SHARED-CORNER BOX WOULD BE THE WRONG SPECIMEN.** `mesh_topology`'s own header
 * records that welding is *"the thing that bit first"* precisely because a box has 24 vertices
 * and not 8. ⭐ `METHOD`: *a golden vector's fixture must be a specimen the product would
 * accept* — so the fixture duplicates its corners, and the taper has to keep the duplicates
 * coincident or the welding downstream silently stops working.
 *
 * ⚠ Wound counter-clockwise seen from OUTSIDE, consistently. `meshTopology` detects an
 * inverted winding by signed volume and flips, so what it needs is consistency, not a
 * handedness — but an INCONSISTENT fixture would test nothing and look fine.
 */
function splitBox(
  dims: readonly [number, number, number],
  centre: Vec3 = [0, 0, 0],
): { positions: number[]; indices: number[] } {
  const [ax, ay, az] = [dims[0] / 2, dims[1] / 2, dims[2] / 2];
  const c = (sx: number, sy: number, sz: number): Vec3 => [
    centre[0] + sx * ax,
    centre[1] + sy * ay,
    centre[2] + sz * az,
  ];
  const quads: Vec3[][] = [
    [c(+1, -1, +1), c(+1, -1, -1), c(+1, +1, -1), c(+1, +1, +1)], // +x
    [c(-1, -1, -1), c(-1, -1, +1), c(-1, +1, +1), c(-1, +1, -1)], // −x
    [c(-1, +1, +1), c(+1, +1, +1), c(+1, +1, -1), c(-1, +1, -1)], // +y
    [c(-1, -1, -1), c(+1, -1, -1), c(+1, -1, +1), c(-1, -1, +1)], // −y
    [c(-1, -1, +1), c(+1, -1, +1), c(+1, +1, +1), c(-1, +1, +1)], // +z
    [c(-1, +1, -1), c(+1, +1, -1), c(+1, -1, -1), c(-1, -1, -1)], // −z
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const q of quads) {
    const base = positions.length / 3;
    for (const v of q) positions.push(v[0], v[1], v[2]);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions, indices };
}

/**
 * ⭐⭐ **THE VECTORS' OWN RULER, and it lives HERE for a reason the suite enforced.**
 *
 * This began as an `extentsOf` export in `core/frustum.ts` and `tests/unwired_debt.test.ts`
 * refused it: nothing in `src/` called it, which is the precise shape that guard exists to
 * catch (`A12`'s retired roll detector, still fed, still holding a verdict). ⛔ A measurement
 * that only vectors use is a TEST helper, not product surface.
 *
 * ⚠ It shares no expression with `taperTop` — it reads min/max off the result rather than
 * re-deriving the taper — which is `METHOD` §2: *a metric built from its own subject measures
 * nothing.*
 */
function extentsOf(positionsXYZ: ArrayLike<number>): { base: Vec3; top: Vec3 } {
  const n = positionsXYZ.length;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 1; i < n; i += 3) {
    const y = positionsXYZ[i] as number;
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const midY = (minY + maxY) / 2;
  const span = (atTop: boolean): Vec3 => {
    let nx = Infinity;
    let xx = -Infinity;
    let nz = Infinity;
    let xz = -Infinity;
    for (let i = 0; i + 2 < n; i += 3) {
      const y = positionsXYZ[i + 1] as number;
      if (atTop ? y <= midY : y > midY) continue;
      nx = Math.min(nx, positionsXYZ[i] as number);
      xx = Math.max(xx, positionsXYZ[i] as number);
      nz = Math.min(nz, positionsXYZ[i + 2] as number);
      xz = Math.max(xz, positionsXYZ[i + 2] as number);
    }
    return [xx - nx, maxY - minY, xz - nz];
  };
  return { base: span(false), top: span(true) };
}

/** World-space points of a shape sitting at `at`. */
function at(points: readonly Vec3[], x: number): Vec3[] {
  return points.map((p) => [p[0] + x, p[1], p[2]] as Vec3);
}

describe("⭐ taperTop — the arithmetic, and what it deliberately leaves alone", () => {
  it("`topScale` of 1 is the identity — a box stays a box, to the bit", () => {
    // ⚠ The contrast that makes every other vector here mean something: if 1 changed the mesh,
    // 'the taper did it' would be unfalsifiable.
    const { positions } = splitBox(PART);
    const out = taperTop(positions, 1);
    expect(out).not.toBeNull();
    expect([...(out as Float32Array)]).toEqual(positions.map((v) => Math.fround(v)));
  });

  it("⭐⭐ halves the TOP and leaves the BASE exactly where the box's was", () => {
    const { positions } = splitBox(PYRAMID);
    const e = extentsOf(taperTop(positions, TAPER) as Float32Array);
    // ⚠⚠ SEVEN PLACES, NOT NINE, AND THE REASON IS THE PRODUCT'S: positions are a
    // `Float32Array` all the way from Babylon's buffer to the collision hull, so 0.08 is held
    // as 0.079999998. ⛔ Nine places demands 5e-10 of a representation whose own step here is
    // about 6e-9 — the first draft of this vector failed on exactly that, and the defect was
    // in the fixture. ⭐ `METHOD`'s fifth shape: *my own fixtures*, which raise false alarms
    // that look exactly like real defects.
    // ⛔ The base is the load-bearing half: the boot clearance is measured off it.
    expect(e.base[0]).toBeCloseTo(PYRAMID[0], 7);
    expect(e.base[2]).toBeCloseTo(PYRAMID[2], 7);
    expect(e.top[0]).toBeCloseTo(PYRAMID[0] * TAPER, 7);
    expect(e.top[2]).toBeCloseTo(PYRAMID[2] * TAPER, 7);
    // ⚠ The height is untouched — a taper is not a squash.
    expect(e.base[1]).toBeCloseTo(PYRAMID[1], 7);
  });

  it("⭐⭐⭐ THE OWNER'S RULE: THE SMALL FACE **IS** A PART'S SMALL FACE", () => {
    // > *"scale the pyramid so that the small rectangular face has the same dimensions as the
    // > small rectangular face of the grey rectangle"* — the owner, 2026-09-25
    //
    // ⭐ A part is `L × 2L × 3L`, so its small rectangular face is `L × 2L`. The frustum's small
    // face is its TOP. ⚠ RED against the `1.5L × 2L × 3L` body this scaled from, whose top was
    // `0.75L × 1.5L` — and red against ANY non-uniform rescale, because both axes are asserted.
    const { positions } = splitBox(PYRAMID);
    const e = extentsOf(taperTop(positions, TAPER) as Float32Array);
    expect(e.top[0]).toBeCloseTo(PART[0], 7);
    expect(e.top[2]).toBeCloseTo(PART[1], 7);
    // ⛔⛔ THE SCALE IS UNIFORM **IN THE TWO AXES THE SMALL FACE LIVES IN**, which is the property
    // that lets one factor satisfy both. ⚠ Stated as a ratio against the part rather than as
    // literals, so it cannot be satisfied by a fixture retyped from the product.
    const k = e.base[0] / (PART[0] * 1.5);
    expect(e.base[2] / PART[2]).toBeCloseTo(k, 6);
    expect(k).toBeCloseTo(4 / 3, 6);
    // ⭐⭐ **AND THE HEIGHT CARRIES A QUARTER OFF ON TOP** — the owner, 2026-09-25: *"reduce the
    // height of the pyramid by 25%."* ⛔ `y` is the TAPER axis, so shortening it cannot touch the
    // top face: the two assertions above are the proof, not the argument.
    expect(e.base[1] / PART[1]).toBeCloseTo(k * 0.75, 6);
    // ⚠ `(8/3)L × 0.75` is exactly `2L` — the body is back on whole units.
    expect(e.base[1]).toBeCloseTo(PART[1], 6);
  });

  it("`topScale` of 0 gives a true pyramid — the top collapses to a point", () => {
    const { positions } = splitBox(PART);
    const e = extentsOf(taperTop(positions, 0) as Float32Array);
    expect(e.top[0]).toBeCloseTo(0, 12);
    expect(e.top[2]).toBeCloseTo(0, 12);
  });

  it("⛔ tapers about the MESH's own centre, not about the origin", () => {
    // ⚠ The first import whose origin is not at its middle is where an origin assumption
    // surfaces. A body centred at x = 5 must narrow toward x = 5, not shear toward 0.
    const { positions } = splitBox(PART, [5, 0, -3]);
    const out = taperTop(positions, TAPER) as Float32Array;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i + 2 < out.length; i += 3) {
      const y = out[i + 1] as number;
      if (y <= 0) continue; // the top half only
      minX = Math.min(minX, out[i] as number);
      maxX = Math.max(maxX, out[i] as number);
      minZ = Math.min(minZ, out[i + 2] as number);
      maxZ = Math.max(maxZ, out[i + 2] as number);
    }
    expect((minX + maxX) / 2).toBeCloseTo(5, 6);
    expect((minZ + maxZ) / 2).toBeCloseTo(-3, 6);
  });

  it("⛔⛔ keeps SPLIT vertices coincident, so welding downstream still works", () => {
    // A box's eight corners are each present three times. If the taper moved them by even a
    // float's width apart, `meshTopology` would weld nothing and every face would be a
    // triangle — the failure its own header calls the one that bit first.
    const { positions } = splitBox(PART);
    const out = taperTop(positions, TAPER) as Float32Array;
    const seen = new Map<string, number>();
    for (let i = 0; i + 2 < out.length; i += 3) {
      const key = `${(out[i] as number).toFixed(9)},${(out[i + 1] as number).toFixed(9)},${(out[i + 2] as number).toFixed(9)}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    // ⭐ Eight distinct corners out of 24 vertices, each appearing exactly three times.
    expect(seen.size).toBe(8);
    expect([...seen.values()].every((n) => n === 3)).toBe(true);
  });

  it("⛔ REFUSES what it cannot vouch for, rather than substituting a shape", () => {
    // `LESSONS_CARRIED` §6 — a degenerate input returns null, never a default. A stand-in here
    // would put a body on the glass whose collision volume matches nothing the eye can see.
    const { positions } = splitBox(PART);
    for (const bad of [-0.01, 1.01, NaN, Infinity, -Infinity]) {
      expect(taperTop(positions, bad)).toBeNull();
    }
    expect(taperTop([], 0.5)).toBeNull();
    expect(taperTop([1, 2], 0.5)).toBeNull(); // not a whole number of triples
    expect(taperTop([0, 0, 0, NaN, 1, 2], 0.5)).toBeNull();
  });
});

describe("⭐⭐⭐ THE COMPOSITION — what the tapered body presents to the rest of the game", () => {
  const { positions, indices } = splitBox(PYRAMID);
  const tapered = taperTop(positions, TAPER) as Float32Array;

  it("⭐⭐ is still SIX logical faces — four trapezoids and two rectangles", () => {
    // ⛔ Not a formality. If the taper broke coplanarity or welding, this would come back as 12
    // triangles, every face marker would be a triangle and every outline would carry diagonals.
    const t = meshTopology(tapered, indices);
    expect(t.faces.length).toBe(6);
    expect(t.positions.length).toBe(8);
  });

  it("⛔⛔ KEEPS EXACT ±y NORMALS — which is what the boot alignment now depends on", () => {
    // ⭐ The owner's choice, 2026-09-22: boot-align the pair on the flat bottoms, because a
    // frustum has no exact +x face and the old lookup required one within 0.01 of it. ⚠ If a
    // taper ever tilted these, the boot pair would silently stop forming — so it is asserted
    // here, beside the shape, and not only at the call site in `scene.ts`.
    const t = meshTopology(tapered, indices);
    const down = t.faces.filter((f) => f.normal[1] < -0.99);
    const up = t.faces.filter((f) => f.normal[1] > 0.99);
    expect(down.length).toBe(1);
    expect(up.length).toBe(1);
    // Exact, not merely close: these two faces are untouched by the taper.
    expect(down[0]?.normal[0]).toBeCloseTo(0, 12);
    expect(down[0]?.normal[2]).toBeCloseTo(0, 12);
  });

  it("⭐ and the four SIDES are genuinely slanted — the thing that makes it a pyramid", () => {
    const t = meshTopology(tapered, indices);
    const sides = t.faces.filter((f) => Math.abs(f.normal[1]) < 0.99);
    expect(sides.length).toBe(4);
    // ⛔⛔ THE FALSIFYING CONTRAST. Every side of the UNTAPERED box has a zero y-component; every
    // side of the frustum leans outward, so its normal carries a POSITIVE one. A taper that
    // silently did nothing would leave these at zero and this vector red.
    for (const s of sides) expect(s.normal[1]).toBeGreaterThan(0.01);
    const box = meshTopology(positions, indices);
    for (const s of box.faces.filter((f) => Math.abs(f.normal[1]) < 0.99)) {
      expect(Math.abs(s.normal[1])).toBeLessThan(1e-6);
    }
  });

  it("⭐⭐⭐ THE BOOT CLEARANCE, MEASURED THROUGH THE REAL TAPERED HULL", () => {
    // ⛔⛔ THE REASON THE TAPER GOES UPWARD RATHER THAN ABOUT THE CENTRE. `tests/highlight.test.ts`
    // asserts 0.32 between `objectA` and `objectB` at rest and requires the capture threshold to
    // sit clear of it by a real factor. ⚠ That fixture models both parts as BOXES; this one runs
    // the SHIPPED frustum through the real pipeline, so the claim is checked against the body
    // the product actually builds rather than against a stand-in for it.
    const a = shapeFromVertices(new Float32Array(splitBox(PART).positions));
    const b = shapeFromVertices(tapered);
    const gap = gapBetween(at(a.points, -0.2), at(b.points, +0.2));
    expect(gap).not.toBeNull();
    // ⛔⛔ **280 mm, AND IT HAS NOW BEEN 320, 300, 281 AND 280 — ONCE PER TIME THE BODY MOVED.**
    // `0.5L` thicker (2026-09-22), scaled 4/3, then a quarter off its height (2026-09-25). ⭐ The
    // number moving is the vector working. ⚠⚠ **AND ONE OF THOSE MOVES DID NOT MOVE IT**: this
    // file kept a RETYPED copy of the dimensions, so the product changed and the whole suite
    // stayed green (defect 66). It reads `PYRAMID_DIMS_M` now.
    //
    // ⭐⭐ **AND IT AGREES WITH THE BOX MODEL EXACTLY AGAIN, WHICH IT DID NOT AN HOUR AGO.** The
    // taper goes upward, so the frustum is narrower the higher you sample it. At `(8/3)L` tall its
    // base sat BELOW `objectA`'s bottom, and the nearest material was a cross-section a little
    // narrower than the base — 281 mm. ⛔ At `2L` the two bodies span the same `y`, so the base
    // corner itself is the nearest point and the gap is `400 − 40 − 80` on the nose.
    // ⚠ Worth stating rather than just re-baselining: the 1.3 mm was never slop, and a later
    // height change will move it back.
    expect(gap as number).toBeCloseTo(0.28, 6);
    // ⚠ And the margin is what the property is really about — the capture offset is ~60 mm of
    // world at the boot camera, so 300 mm is still five times clear of it.
    expect(gap as number).toBeGreaterThan(0.06 * 3);
  });

  it("⭐ the hull spans eight DISTINCT corners — a frustum, not a box and not a soup", () => {
    // ⚠ `QUEUE.md` records that the first 24 collision vectors were all boxes, that the
    // Minkowski difference of two boxes is a box, and that GJK therefore converged in ONE step
    // with three deep branches unreached. A frustum against a box is not a box: this is the
    // first body in the product that can reach them.
    //
    // ⛔⛔ **DISTINCT corners, and the first draft of this vector asserted the POINT COUNT and
    // was wrong.** `shapeFromVertices` keeps every finite vertex and only reduces above 64, so
    // a split-vertex box yields 24 points, not 8. ⭐ `METHOD`: *a vector written from an
    // assumption about the code is not a vector about the code* — the count was invented here
    // and the shape was read there.
    const pts = shapeFromVertices(tapered).points;
    expect(pts.length).toBe(24);
    const distinct = new Set(pts.map((q) => q.map((v) => v.toFixed(6)).join(",")));
    expect(distinct.size).toBe(8);
  });
});

describe("⭐⭐⭐ `bootTilt` — the two parts' boot pose (the owner, 2026-09-25)", () => {
  const deg = (q: readonly number[]) => (2 * Math.acos(Math.min(1, Math.abs(q[0]!))) * 180) / Math.PI;

  it("⭐⭐ ROLL ABOUT z AND PITCH ABOUT x — the BOOT CAMERA's axes, not the body's", () => {
    // ⛔⛔ THE READING THE WHOLE THING TURNS ON. `A7`'s gravity frame puts pitch on the horizontal
    // screen axis and roll on the view direction flattened onto the ground; the camera boots on
    // `−z` looking toward `+z` with `+x` to the right, so pitch is world `x` and roll world `z`.
    // ⚠ RED against reading them as the body's own axes, which for a square body agree on the
    // first rotation and diverge on the second.
    const q = bootTilt(1);
    const a = (BOOT_TILT_DEG * Math.PI) / 180;
    const expected = qmul(qFromAxisAngle([1, 0, 0], a), qFromAxisAngle([0, 0, 1], a));
    for (let i = 0; i < 4; i++)
      expect(q[i]).toBeCloseTo(expected[i] as number, 12);
  });

  it("⛔⛔ THE TWO SENSES ARE OPPOSITE, AND THAT IS NOT THE SAME AS THE INVERSE", () => {
    // ⭐ *"Same for the pyramid, in opposite senses"* — both angles negated, which for a
    // composition of two rotations about DIFFERENT axes is not `conjugate(q)`.
    // ⚠ RED against `bootTilt(-1) = qConj(bootTilt(1))`, which is the obvious wrong answer and
    // agrees with the right one whenever the two axes are parallel — so a fixture built from one
    // axis could not tell them apart.
    const a = (BOOT_TILT_DEG * Math.PI) / 180;
    const negated = qmul(
      qFromAxisAngle([1, 0, 0], -a),
      qFromAxisAngle([0, 0, 1], -a),
    );
    const conj = bootTilt(1);
    const inverse = [conj[0], -conj[1], -conj[2], -conj[3]];
    for (let i = 0; i < 4; i++)
      expect(bootTilt(-1)[i]).toBeCloseTo(negated[i] as number, 12);
    expect(
      Math.abs(bootTilt(-1)[1] - (inverse[1] as number)) +
        Math.abs(bootTilt(-1)[2] - (inverse[2] as number)) +
        Math.abs(bootTilt(-1)[3] - (inverse[3] as number)),
    ).toBeGreaterThan(1e-3);
  });

  it("⭐ the total swing is more than one 30° step and less than two", () => {
    // ⚠ A cheap sanity assertion on the COMPOSITION rather than on its parts — `METHOD`: *a
    // composition is a thing to MEASURE, not an emergent property.* Two 30° turns about
    // perpendicular axes compose to about 42°.
    expect(deg(bootTilt(1))).toBeGreaterThan(BOOT_TILT_DEG);
    expect(deg(bootTilt(1))).toBeLessThan(2 * BOOT_TILT_DEG);
    expect(deg(bootTilt(1))).toBeCloseTo(deg(bootTilt(-1)), 9);
  });
});
