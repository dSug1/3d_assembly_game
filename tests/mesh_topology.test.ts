/**
 * ⭐⭐⭐ **MESH TOPOLOGY — vectors for the logical faces and edges of a real mesh (`D50`).**
 *
 * ⛔⛔ **THE FIXTURES ARE NOT ALL BOXES, AND THAT IS THE LESSON OF THE LAST TWO DAYS.** The GJK
 * suite was written entirely against boxes and three deep branches went unreached; the outline
 * work then shipped a *bounding box* twice because a box is the one shape where a bounding box
 * is right. ⭐ So: a box built the way an exporter builds one (**split vertices**), a wedge with
 * a triangular face, an L-shaped extrusion whose top is a six-sided polygon, and a mesh with a
 * degenerate triangle in it.
 */
import { describe, expect, it } from "vitest";
import { meshTopology, offsetPositions, type MeshTopology } from "@core/mesh_topology";
import { dot, length, sub, type Vec3 } from "@core/vec";

/**
 * ⭐⭐ A box built **the way a loader builds one**: 24 vertices, four per face, so no two faces
 * share an index. ⛔ Welding is what has to rescue this, and without it the topology is twelve
 * disconnected triangles.
 */
function splitBox(w: number, h: number, d: number): { pos: number[]; idx: number[] } {
  const [x, y, z] = [w / 2, h / 2, d / 2];
  const faces: [Vec3, Vec3, Vec3, Vec3][] = [
    [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]], // +z
    [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]], // -z
    [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]], // +x
    [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]], // -x
    [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]], // +y
    [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]], // -y
  ];
  const pos: number[] = [];
  const idx: number[] = [];
  for (const quad of faces) {
    const base = pos.length / 3;
    for (const p of quad) pos.push(p[0], p[1], p[2]);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { pos, idx };
}

const faceWithNormal = (t: MeshTopology, n: Vec3) =>
  t.faces.find((f) => dot(f.normal, n) > 0.999);

describe("⭐⭐⭐ a BOX as an exporter builds it — 24 vertices, 12 triangles", () => {
  const { pos, idx } = splitBox(2, 4, 6);
  const t = meshTopology(pos, idx);

  it("⛔⛔ WELDS 24 vertices down to 8 — without this nothing is adjacent to anything", () => {
    expect(pos.length / 3).toBe(24);
    expect(t.positions).toHaveLength(8);
  });

  it("⭐⭐ groups 12 triangles into SIX logical faces, not twelve", () => {
    // ⛔ THE VECTOR THAT SAYS *a face is not a triangle*. Two coplanar triangles per side must
    // merge, or every face marker would be a triangle and every outline would carry a diagonal.
    expect(t.faces).toHaveLength(6);
    for (const f of t.faces) expect(f.triangles).toHaveLength(6); // two triangles each
  });

  it("⭐ each face carries its OUTWARD normal and its area centroid", () => {
    const px = faceWithNormal(t, [1, 0, 0])!;
    expect(px.centre[0]).toBeCloseTo(1, 12);
    expect(px.centre[1]).toBeCloseTo(0, 12);
    expect(px.centre[2]).toBeCloseTo(0, 12);
    const my = faceWithNormal(t, [0, -1, 0])!;
    expect(my.centre[1]).toBeCloseTo(-2, 12);
  });

  it("⭐⭐ every face's boundary is a FOUR-point loop — the diagonal is interior, and dropped", () => {
    // ⛔ The shared edge of the two triangles is used TWICE inside the group, so it is interior.
    // ⚠ Getting this wrong is what draws a diagonal across every face of the body.
    for (const f of t.faces) expect(f.boundary).toHaveLength(4);
  });

  it("⭐⭐⭐ yields exactly TWELVE hard edges — a cube's edges, no diagonals, no duplicates", () => {
    expect(t.edges).toHaveLength(12);
    // ⭐ And every one has the length of a real box edge, never a face diagonal (√(4+16) etc.).
    const lens = t.edges
      .map(([a, b]) => length(sub(t.positions[b] as Vec3, t.positions[a] as Vec3)))
      .sort((p, q) => p - q);
    expect(lens.filter((l) => Math.abs(l - 2) < 1e-9)).toHaveLength(4);
    expect(lens.filter((l) => Math.abs(l - 4) < 1e-9)).toHaveLength(4);
    expect(lens.filter((l) => Math.abs(l - 6) < 1e-9)).toHaveLength(4);
  });

  it("⛔ opposite faces are NOT merged, though their normals are antiparallel", () => {
    // ⚠ The plane OFFSET test is what separates them; a normals-only test would fuse the two
    // sides of a thin part — and the base plate is 0.3L thick.
    const pz = faceWithNormal(t, [0, 0, 1])!;
    const mz = faceWithNormal(t, [0, 0, -1])!;
    expect(pz.id).not.toBe(mz.id);
  });
});

describe("⭐⭐⭐ OFFSET — every face plane moves by h, which a scale cannot do", () => {
  const { pos, idx } = splitBox(2, 4, 6);
  const t = meshTopology(pos, idx);

  it("⭐⭐ a box offset by h is a box grown by 2h on EVERY axis — equally, not proportionally", () => {
    // ⛔⛔ THE VECTOR THE WHOLE FUNCTION EXISTS FOR. A 2×4×6 body SCALED by 1.1 gains 0.2/0.4/0.6
    // — three different amounts. Offset by 0.5 it gains exactly 1.0 on each, which is what a
    // capture DISTANCE means.
    const out = offsetPositions(t, 0.5);
    const xs = out.map((p) => p[0]);
    const ys = out.map((p) => p[1]);
    const zs = out.map((p) => p[2]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2 + 1, 9);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(4 + 1, 9);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(6 + 1, 9);
  });

  it("⭐ a corner moves DIAGONALLY, by more than h — it is where three offset planes meet", () => {
    // ⚠ The tell that this is a mitre and not a push along one normal: the corner travels
    // h·√3 ≈ 0.866 for h = 0.5, not 0.5.
    const out = offsetPositions(t, 0.5);
    const before = t.positions[0] as Vec3;
    const after = out[0] as Vec3;
    expect(length(sub(after, before))).toBeCloseTo(0.5 * Math.sqrt(3), 6);
  });

  it("⛔ h = 0 leaves every vertex exactly where it was", () => {
    const out = offsetPositions(t, 0);
    out.forEach((p, i) => expect(length(sub(p, t.positions[i] as Vec3))).toBeCloseTo(0, 12));
  });
});

describe("⭐⭐⭐ NON-BOX bodies — where a bounding box is simply wrong", () => {
  /** A triangular prism: two triangular ends, three rectangular sides. */
  const wedge = () => {
    const P: Vec3[] = [
      [0, 0, 0], [4, 0, 0], [0, 3, 0],
      [0, 0, 2], [4, 0, 2], [0, 3, 2],
    ];
    const tri = [
      [0, 2, 1], [3, 4, 5],
      [0, 1, 4], [0, 4, 3],
      [1, 2, 5], [1, 5, 4],
      [2, 0, 3], [2, 3, 5],
    ];
    const pos: number[] = [];
    const idx: number[] = [];
    // ⚠ Split the vertices, as a loader would: every triangle gets its own copies.
    for (const [a, b, c] of tri) {
      const base = pos.length / 3;
      for (const v of [a, b, c] as number[]) {
        const p = P[v] as Vec3;
        pos.push(p[0], p[1], p[2]);
      }
      idx.push(base, base + 1, base + 2);
    }
    return { pos, idx };
  };

  it("⭐⭐ a WEDGE has five faces and nine edges — not the twelve of its bounding box", () => {
    // ⛔⛔ THE CASE THAT MAKES THE POINT. A bounding-box outline would draw 12 edges around a
    // body that has 9, and would show a corner where the slope is. This is the difference
    // between *outlined from the mesh* and *outlined from a box*.
    const t = meshTopology(...(({ pos, idx }) => [pos, idx] as const)(wedge()));
    expect(t.positions).toHaveLength(6);
    expect(t.faces).toHaveLength(5);
    expect(t.edges).toHaveLength(9);
  });

  it("⭐ its triangular end is a THREE-point loop and its sides are four-point loops", () => {
    const t = meshTopology(...(({ pos, idx }) => [pos, idx] as const)(wedge()));
    const loops = t.faces.map((f) => f.boundary.length).sort();
    expect(loops).toEqual([3, 3, 4, 4, 4]);
  });

  it("⭐⭐ the SLOPED face has a normal that is not an axis — a box could never say so", () => {
    const t = meshTopology(...(({ pos, idx }) => [pos, idx] as const)(wedge()));
    const sloped = t.faces.find(
      (f) => Math.abs(f.normal[0]) > 0.1 && Math.abs(f.normal[1]) > 0.1,
    );
    expect(sloped).toBeDefined();
    // The face through (4,0,·) and (0,3,·): its normal is (3,4,0)/5.
    expect(sloped!.normal[0]).toBeCloseTo(0.6, 6);
    expect(sloped!.normal[1]).toBeCloseTo(0.8, 6);
    expect(sloped!.normal[2]).toBeCloseTo(0, 6);
  });

  it("⭐⭐⭐ an L-SHAPED face is SIX-sided, and its centroid is off its bounding centre", () => {
    // ⛔⛔ A concave polygon is where an area centroid and a bounding-box centre part company,
    // and the face marker is drawn at the centroid.
    // ⚠⚠ **FAN-TRIANGULATED, NOT TWO QUADS.** My first fixture was two quads meeting at a
    // T-junction — one quad's edge spanned the other's endpoint — so they shared a POINT and not
    // an EDGE, and the grouper correctly refused to merge them. ⭐ The fixture was wrong, not the
    // code: a T-junction is not adjacency, and real exporters do not emit one.
    const L: Vec3[] = [[0, 0, 1], [4, 0, 1], [4, 1, 1], [1, 1, 1], [1, 3, 1], [0, 3, 1]];
    const fan = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5]];
    const pos: number[] = [];
    const idx: number[] = [];
    for (const tri of fan) {
      const base = pos.length / 3;
      for (const v of tri as number[]) {
        const p = L[v] as Vec3;
        pos.push(p[0], p[1], p[2]);
      }
      idx.push(base, base + 1, base + 2);
    }
    const t = meshTopology(pos, idx);
    // ⭐ All four triangles are coplanar and edge-adjacent ⇒ ONE face, and the three fan
    // diagonals are interior, so they are not in its boundary.
    expect(t.faces).toHaveLength(1);
    const f = t.faces[0]!;
    expect(f.boundary).toHaveLength(6);
    expect(t.edges).toHaveLength(6);
    // Areas 4 and 2; centroids (2,0.5) and (0.5,2) ⇒ ((4·2+2·0.5)/6, (4·0.5+2·2)/6).
    expect(f.centre[0]).toBeCloseTo(9 / 6, 6);
    expect(f.centre[1]).toBeCloseTo(6 / 6, 6);
    // ⛔ And that is NOT the centre of its bounding box, which is (2, 1.5).
    expect(Math.abs(f.centre[0] - 2)).toBeGreaterThan(0.4);
  });
});

describe("⛔ degenerate input is refused, never guessed at", () => {
  it("empty arrays give an empty topology", () => {
    const t = meshTopology([], []);
    expect(t.positions).toHaveLength(0);
    expect(t.faces).toHaveLength(0);
    expect(t.edges).toHaveLength(0);
  });

  it("⭐ a zero-area triangle is DROPPED rather than contributing a NaN normal", () => {
    // ⚠ Exporters emit these. One NaN normal would poison the area-weighted average of whatever
    // face it landed in, and the face's normal drives alignment — so it must never enter.
    const pos = [0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0];
    const idx = [0, 1, 2, 3, 4, 5];
    const t = meshTopology(pos, idx);
    expect(t.faces).toHaveLength(1);
    for (const c of t.faces[0]!.normal) expect(Number.isFinite(c)).toBe(true);
  });

  it("⭐ a NaN vertex is dropped with its triangle", () => {
    const pos = [0, 0, 0, 1, 0, 0, 0, 1, 0, NaN, 0, 0];
    const idx = [0, 1, 2, 0, 1, 3];
    const t = meshTopology(pos, idx);
    expect(t.faces).toHaveLength(1);
  });
});

/**
 * ⛔⛔⛔ **WHICH WAY IS OUT — the defect that made every outline invisible (2026-09-18).**
 *
 * ⚠⚠ `cross(b−a, c−a)` encodes a WINDING ASSUMPTION, and Babylon's boxes wind the other way, so
 * every normal came out **INWARD**. ⛔ The outlines were then offset *into* the body and hidden
 * by its own surface — *"no outline of any sort"* on the glass, with a green suite, correct face
 * grouping and correct edges. ⭐⭐ And it was never only cosmetic: `CONSTRAINTS` §7 requires a
 * **true outward normal**, so every alignment and every future mate would have been computed
 * against the far side of the body.
 *
 * ⭐⭐⭐ **THE FIXTURES BELOW ARE THE SAME BOX WOUND BOTH WAYS**, because a blanket sign flip
 * would have passed one of them and broken the other — and *"inverted normals"* is exactly what
 * the owner asked about for Blender imports.
 */
describe("⛔⛔⛔ OUTWARD, for EITHER winding — measured, not assumed", () => {
  /** A closed box. `wind` reverses every triangle, which is what an inverted export looks like. */
  function box(wind: 1 | -1): { pos: number[]; idx: number[] } {
    const { pos, idx } = splitBox(2, 4, 6);
    if (wind === 1) return { pos, idx };
    const flipped: number[] = [];
    for (let i = 0; i + 2 < idx.length; i += 3) {
      flipped.push(idx[i]!, idx[i + 2]!, idx[i + 1]!);
    }
    return { pos, idx: flipped };
  }

  for (const wind of [1, -1] as const) {
    it(`winding ${wind > 0 ? "as authored" : "REVERSED"} \u21d2 every normal points OUTWARD`, () => {
      const { pos, idx } = box(wind);
      const t = meshTopology(pos, idx);
      expect(t.faces).toHaveLength(6);
      for (const f of t.faces) {
        // ⭐ For a box centred on the origin, outward means the normal agrees with the face's
        // own position — a test that needs no table of expected axes.
        expect(dot(f.normal, f.centre)).toBeGreaterThan(0);
      }
    });

    it(`winding ${wind > 0 ? "as authored" : "REVERSED"} \u21d2 the offset GROWS the body`, () => {
      // ⛔⛔ THE VECTOR THAT WOULD HAVE CAUGHT IT. The old code produced a SMALLER box —
      // measured at 0.0394 against a half-extent of 0.04 — so the outline sat inside the
      // surface. ⚠ Nothing in the previous suite compared the offset body against the original.
      const { pos, idx } = box(wind);
      const t = meshTopology(pos, idx);
      const out = offsetPositions(t, 0.5);
      const half = (ps: readonly Vec3[], axis: number): number =>
        (Math.max(...ps.map((p) => p[axis]!)) - Math.min(...ps.map((p) => p[axis]!))) / 2;
      expect(half(out, 0)).toBeCloseTo(half(t.positions, 0) + 0.5, 9);
      expect(half(out, 1)).toBeCloseTo(half(t.positions, 1) + 0.5, 9);
      expect(half(out, 2)).toBeCloseTo(half(t.positions, 2) + 0.5, 9);
    });
  }

  it("⚠ an OPEN surface has no enclosed volume, so the winding is left as authored", () => {
    // ⛔ The signed-volume test carries no information here, and guessing would be worse than
    // doing nothing (`LESSONS_CARRIED` §6). ⚠ A single quad: whichever way it faces, it must not
    // be flipped by a rule that has nothing to go on.
    const pos = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
    const idx = [0, 1, 2, 0, 2, 3];
    const t = meshTopology(pos, idx);
    expect(t.faces).toHaveLength(1);
    expect(t.faces[0]!.normal[2]).toBeCloseTo(1, 9);
  });
});
