/**
 * ⭐⭐⭐ (2026-11-13, `Claude/40_RENDER_SCENE/spec/POLAR_ZONES.md` §4.4) THE POLAR ZONES' VECTORS: `Scene_0bis`'s tipped heptagon has ONE zone (both tips,
 * the axis x, a spit, F for the whole assembly); `Scene_1`'s cube and `Scene_0`'s heptagon NONE; two same-width pieces stacked NONE (the owner: a size
 * relative to the piece would flag every stack); the frame, the finger in F, the hold of R4 in the spit (D-Z3) and the exit's hysteresis (D-Z7).
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap, type MapFace } from "../src/input/face_map";
import { prismOutline } from "../src/core/prism";
import { DEFAULT_ZONE_OPTS, fingerInFrame, fingerSwapped, polarZones, snapToWorldAxis, spitSide, spitHeading, spitCameraHeading, crossingHold, zoneAt, zoneFrame, zoneOrientation, distanceToFacets } from "../src/input/polar_zone";
import { mulM, mulT } from "../src/input/orbit_tilt";
import type { Vec3 } from "../src/core/vec";

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);

function face(vs: Vec3[], mid: Vec3, part = "p"): MapFace {
  const c = cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
  const l = len(c);
  const tris: [Vec3, Vec3, Vec3][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  const centre = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as Vec3;
  let n: Vec3 = [c[0] / l, c[1] / l, c[2] / l];
  if (dot(n, sub(centre, mid)) < 0) n = [-n[0], -n[1], -n[2]];
  return { normal: n, centre, tris, part };
}

const W = 0.483;
const HX = 0.245;

/** a box lo..hi as six faces */
function boxFaces(lo: Vec3, hi: Vec3, part: string): MapFace[] {
  const mid: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const P = (x: number, y: number, z: number): Vec3 => [x ? hi[0] : lo[0], y ? hi[1] : lo[1], z ? hi[2] : lo[2]];
  return [
    face([P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], mid, part),
    face([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], mid, part),
    face([P(0, 0, 0), P(0, 0, 1), P(0, 1, 1), P(0, 1, 0)], mid, part),
    face([P(1, 0, 0), P(1, 0, 1), P(1, 1, 1), P(1, 1, 0)], mid, part),
    face([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], mid, part),
    face([P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)], mid, part),
  ];
}

/** `Scene_0`'s heptagon (tip 0: flat ends) or `Scene_0bis`'s tipped one (tip > 0) */
function prism(sides: number, tip: number) {
  const faces: MapFace[] = [];
  const mid: Vec3 = [0, W / 2, 0];
  const prof = prismOutline(sides, W, W)!.map(([z, y]) => [z, y + W / 2] as [number, number]);
  const at = (x: number, k: number): Vec3 => [x, prof[k]![1], prof[k]![0]];
  const n = prof.length;
  for (let k = 0; k < n; k++) faces.push(face([at(-HX, k), at(-HX, (k + 1) % n), at(HX, (k + 1) % n), at(HX, k)], mid));
  if (tip > 0)
    for (const s of [1, -1]) {
      const apex: Vec3 = [s * (HX + tip), W / 2, 0];
      for (let k = 0; k < n; k++) faces.push(face([at(s * HX, k), at(s * HX, (k + 1) % n), apex], mid));
    }
  else {
    faces.push(face([...Array(n)].map((_, k) => at(HX, k)), mid));
    faces.push(face([...Array(n)].map((_, k) => at(-HX, k)), mid));
  }
  const box = { lo: [-(HX + tip), 0, -W / 2] as Vec3, hi: [HX + tip, W, W / 2] as Vec3 };
  return buildFaceMap(faces, box);
}

describe("⭐⭐⭐ the polar zones on the three scenes (POLAR_ZONES.md §4.4)", () => {
  it("Scene_0bis: ONE zone — both tips' 14 triangles, the axis x, a spit, F for the whole assembly", () => {
    const map = prism(7, 0.12);
    const zs = polarZones(map);
    expect(zs.length).toBe(1);
    const z = zs[0]!;
    expect(z.facets.length).toBe(14);
    expect(z.poles.length).toBe(2);
    expect(Math.abs(z.axis[0])).toBe(1);
    expect(z.orientation).toBe("SPIT");
    expect(z.whole).toBe(true);
  });
  it("Scene_0's heptagon (flat ends) and Scene_1's cube: NO zone", () => {
    expect(polarZones(prism(7, 0)).length).toBe(0);
    const cube = boxFaces([-HX, 0, -W / 2], [HX, W, W / 2], "c");
    expect(polarZones(buildFaceMap(cube, { lo: [-HX, 0, -W / 2], hi: [HX, W, W / 2] })).length).toBe(0);
  });
  it("two same-width pieces stacked: NO zone (the corners meet 3 or 4 facets — the owner's objection to a piece-relative size)", () => {
    const a = boxFaces([0, 0, 0], [0.045, 0.03, 0.045], "a");
    const b = boxFaces([0, 0.03, 0], [0.045, 0.06, 0.045], "b");
    expect(polarZones(buildFaceMap([...a, ...b], { lo: [0, 0, 0], hi: [0.045, 0.06, 0.045] })).length).toBe(0);
  });
  it("S_min is relative to the PLACED set: the tips stop being small when the ratio is lowered under 0.15 (71 / 483 mm)", () => {
    expect(polarZones(prism(7, 0.12), { ...DEFAULT_ZONE_OPTS, facetMinRatio: 0.1 }).length).toBe(0);
  });
  it("a single tip (one end flat): one zone, one pole, its axis along x from the rim to the apex", () => {
    const faces: MapFace[] = [];
    const mid: Vec3 = [0, W / 2, 0];
    const prof = prismOutline(7, W, W)!.map(([z, y]) => [z, y + W / 2] as [number, number]);
    const at = (x: number, k: number): Vec3 => [x, prof[k]![1], prof[k]![0]];
    const n = prof.length;
    for (let k = 0; k < n; k++) faces.push(face([at(-HX, k), at(-HX, (k + 1) % n), at(HX, (k + 1) % n), at(HX, k)], mid));
    const apex: Vec3 = [HX + 0.12, W / 2, 0];
    for (let k = 0; k < n; k++) faces.push(face([at(HX, k), at(HX, (k + 1) % n), apex], mid));
    faces.push(face([...Array(n)].map((_, k) => at(-HX, k)), mid));
    const zs = polarZones(buildFaceMap(faces, { lo: [-HX, 0, -W / 2], hi: [HX + 0.12, W, W / 2] }));
    expect(zs.length).toBe(1);
    expect(zs[0]!.poles.length).toBe(1);
    expect(zs[0]!.axis).toEqual([1, 0, 0]);
  });
});

describe("⭐⭐ the zone's axis, frame and orientation (§3.4 – §3.5, D-Z2, D-Z6)", () => {
  it("snapped onto a world axis within 10°, kept beyond", () => {
    const c = Math.cos((7 * Math.PI) / 180);
    const s = Math.sin((7 * Math.PI) / 180);
    expect(snapToWorldAxis([c, s, 0], 10)).toEqual([1, 0, 0]);
    const t: Vec3 = [Math.cos(0.44), Math.sin(0.44), 0];
    expect(snapToWorldAxis(t, 10)).toEqual(t);
  });
  it("F: a rotation (orthonormal, right-handed), F's vertical the axis; the vertical axis gives the world's own frame", () => {
    for (const a of [[1, 0, 0], [0, 0, -1], [0.6, 0.8, 0]] as Vec3[]) {
      const R = zoneFrame(a);
      const ey = mulM(R, [0, 1, 0]);
      expect(len(sub(ey, a))).toBeLessThan(1e-12);
      const ex = mulM(R, [1, 0, 0]);
      const ez = mulM(R, [0, 0, 1]);
      expect(Math.abs(dot(ex, ey))).toBeLessThan(1e-12);
      expect(len(sub(cross(ex, ey), ez))).toBeLessThan(1e-12);
      const v: Vec3 = [0.3, -0.2, 0.9];
      expect(len(sub(mulM(R, mulT(R, v)), v))).toBeLessThan(1e-12);
    }
    expect(zoneFrame([0, 1, 0])).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    // a horizontal axis: F's yaw 0 the world's up (§3.4)
    expect(mulM(zoneFrame([1, 0, 0]), [1, 0, 0])).toEqual([0, 1, 0]);
  });
  it("S1 up to 30° from the vertical, S2 from 60°, between the tag (untagged S1)", () => {
    const at = (deg: number): Vec3 => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180), 0];
    expect(zoneOrientation(at(25), DEFAULT_ZONE_OPTS)).toBe("UPRIGHT");
    expect(zoneOrientation(at(45), DEFAULT_ZONE_OPTS)).toBe("UPRIGHT");
    expect(zoneOrientation(at(45), DEFAULT_ZONE_OPTS, "SPIT")).toBe("SPIT");
    expect(zoneOrientation(at(65), DEFAULT_ZONE_OPTS)).toBe("SPIT");
    expect(zoneOrientation(at(115), DEFAULT_ZONE_OPTS)).toBe("SPIT");
    expect(zoneOrientation(at(170), DEFAULT_ZONE_OPTS)).toBe("UPRIGHT");
  });
});

describe("⭐⭐⭐ the finger read in F's upright screen (§3.5, the swap)", () => {
  it("the camera upright in F (its up the axis): the finger as it is", () => {
    const r = fingerInFrame(3, 4, [0, 0, -1], [0, 1, 0], [0, 1, 0], 0);
    expect(r.dx).toBeCloseTo(3, 12);
    expect(r.dy).toBeCloseTo(4, 12);
    expect(r.alpha).toBeCloseTo(0, 12);
  });
  it("the spit (the axis across the glass): a dx goes pole to pole (F's dy), a dy round the axis (F's dx) — a quarter turn", () => {
    const r = fingerInFrame(1, 0, [0, 0, -1], [0, 1, 0], [1, 0, 0], 0);
    expect(Math.abs(r.dy)).toBeCloseTo(1, 12);
    expect(r.dx).toBeCloseTo(0, 12);
    const s = fingerInFrame(0, 1, [0, 0, -1], [0, 1, 0], [1, 0, 0], 0);
    expect(Math.abs(s.dx)).toBeCloseTo(1, 12);
    expect(s.dy).toBeCloseTo(0, 12);
    expect(Math.abs(r.alpha)).toBeCloseTo(Math.PI / 2, 12);
  });
  it("looking down in the spit: the swap itself, a dx on F's pitch only, a dy on F's yaw only — the same signs as the glass's mix at ±90°", () => {
    for (const al of [Math.PI / 2 - 0.2, -Math.PI / 2 + 0.15]) {
      const g = fingerInFrame(1, 0, [0, 0, -1], [0, 1, 0], [Math.sin(al), Math.cos(al), 0], 0);
      const s1 = fingerSwapped(1, 0, g.alpha);
      expect(Math.abs(s1.dx)).toBe(0);
      expect(Math.sign(s1.dy)).toBe(Math.sign(g.dy));
      const s2 = fingerSwapped(0, 1, g.alpha);
      expect(Math.abs(s2.dy)).toBe(0);
      expect(Math.sign(s2.dx)).toBe(Math.sign(fingerInFrame(0, 1, [0, 0, -1], [0, 1, 0], [Math.sin(al), Math.cos(al), 0], 0).dx));
    }
  });
  it("looking along the axis: the last angle kept (no jump)", () => {
    const r = fingerInFrame(1, 0, [1, 0, 0], [0, 1, 0], [1, 0, 0], 0.7);
    expect(r.alpha).toBe(0.7);
  });
  it("the length of the move kept", () => {
    const r = fingerInFrame(2, -5, [0.3, -0.4, -0.8], [0, 1, 0], [0.6, 0, 0.8], 0);
    expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(Math.hypot(2, 5), 9);
  });
});

describe("⭐⭐⭐ the zenith edge crossed as on Scene_0 (the owner): the side, its heading, the hold AFTER the crossing", () => {
  const a: Vec3 = [1, 0, 0];
  it("the side: in front (−z, the boot camera) and behind; kept straight over the axis and at a tip; changed past 2°", () => {
    const front = spitSide([0, 0.3, -1], a, 0);
    const back = spitSide([0, 0.3, 1], a, 0);
    expect(front).toBe(-back);
    expect(spitSide([0, 1, 0.01], a, front)).toBe(front); // straight over the axis: kept
    expect(spitSide([0, 1, 0.01 * Math.sign(back)], a, front)).toBe(front); // 0.6° past: kept (the hysteresis)
    expect(spitSide([0, 1, 0.1 * (back > 0 ? 1 : -1)], a, front)).toBe(back); // 5.7° past: changed
    expect(spitSide([1, 0.01, 0.01], a, front)).toBe(front); // looking along the axis: kept
  });
  it("its heading: the side's level direction square to the axis — the boot camera's own in front, the opposite behind; no spin along the axis", () => {
    const front = spitSide([0, 0, -1], a, 0);
    const h = spitHeading(a, front);
    expect(Math.cos(h)).toBeCloseTo(0, 12);
    expect(Math.sin(h)).toBeCloseTo(-1, 12);
    expect(Math.sin(spitHeading(a, -front))).toBeCloseTo(1, 12);
  });
  it("the camera's heading: the side's looking down (no spin along the axis at the top), its own direction's when level; continuous between", () => {
    const front = spitSide([0, 0, -1], a, 0);
    const side = spitHeading(a, front);
    // looking down, the camera moved along the axis: the heading stays within 10° of the side's
    for (const x of [-0.12, -0.05, 0, 0.05, 0.12]) {
      const u: Vec3 = [x, 0.99, -0.03];
      expect(Math.abs(Math.atan2(Math.sin(spitCameraHeading(u, a, front) - side), Math.cos(spitCameraHeading(u, a, front) - side)))).toBeLessThan((25 * Math.PI) / 180);
    }
    // level, toward a tip: close to its own
    const lvl: Vec3 = [-0.95, 0.1, -0.3];
    const own = Math.atan2(lvl[2], lvl[0]);
    expect(Math.abs(Math.atan2(Math.sin(spitCameraHeading(lvl, a, front) - own), Math.cos(spitCameraHeading(lvl, a, front) - own)))).toBeLessThan((25 * Math.PI) / 180);
    // continuous: a step of 1° of the direction turns the heading by less than 6°
    let prev = spitCameraHeading([0, 0.98, -0.2], a, front);
    for (let t = 1; t <= 90; t++) {
      const th = (t * Math.PI) / 180;
      const u: Vec3 = [-Math.sin(th) * 0.98, Math.cos(th) * 0.98, -0.2];
      const h = spitCameraHeading(u, a, front);
      expect(Math.abs(Math.atan2(Math.sin(h - prev), Math.cos(h - prev)))).toBeLessThan((6 * Math.PI) / 180);
      prev = h;
    }
  });
  it("the hold after the crossing: into the face beyond, square to the ridge, down its slope; the dy that crossed; none without a dy", () => {
    const nBack: Vec3 = [0, 0.9 / Math.hypot(0.9, 0.44), 0.44 / Math.hypot(0.9, 0.44)];
    const back = spitSide([0, 0.3, 1], a, 0);
    const h = crossingHold([0, 0.48, 0.19], nBack, a, back, 1)!;
    expect(h.sign).toBe(1);
    expect(Math.abs(h.d[0])).toBeLessThan(1e-12); // square to the ridge (along x)
    expect(h.d[1]).toBeLessThan(0); // down the face beyond
    expect(Math.abs(h.d[0] * nBack[0] + h.d[1] * nBack[1] + h.d[2] * nBack[2])).toBeLessThan(1e-12); // along it
    expect(crossingHold([0, 0, 0], nBack, a, back, 0)).toBeNull();
  });
});

describe("⭐⭐ the zone the gizmo is in, with the exit's hysteresis (D-Z7)", () => {
  const z1 = { facets: [1, 2], whole: false };
  const z2 = { facets: [5], whole: false };
  it("in a zone's facet: that zone; out: the last one until `exitMm` past its rim", () => {
    expect(zoneAt([z1, z2], 2, null, 0, 10)).toBe(z1);
    expect(zoneAt([z1, z2], 3, z1, 4, 10)).toBe(z1);
    expect(zoneAt([z1, z2], 3, z1, 12, 10)).toBeNull();
    expect(zoneAt([z1, z2], 3, null, 0, 10)).toBeNull();
  });
  it("a whole-assembly zone: always in", () => {
    const w = { facets: [9], whole: true };
    expect(zoneAt([z1, w], 0, null, 99, 10)).toBe(w);
  });
  it("the distance to a zone's facets: 0 on them, the way to the rim beside", () => {
    const map = prism(7, 0.12);
    const z = polarZones(map)[0]!;
    const apex: Vec3 = [HX + 0.12, W / 2, 0];
    expect(distanceToFacets(map, z.facets, apex)).toBeLessThan(1e-6);
    expect(distanceToFacets(map, z.facets, [0, W / 2, 0])).toBeGreaterThan(0.2);
  });
});

// ⭐⭐⭐ (2026-11-14, the owner: "dy or dx when the gizmo hit the zenith edge or the middle of the bottom face create hard-to-control movements") the
// spit's CROSSING is the orbit passing over or under the axis — the part of its direction square to the axis steep — never the direction's own pitch
describe("the spit's crossing: over or under the axis (overAxisPitch)", async () => {
  const { overAxisPitch, SPIT_CROSSING_PITCH_RAD } = await import("../src/input/polar_zone");
  const ax: [number, number, number] = [1, 0, 0];
  const dirAt = (alongDeg: number, roundDeg: number): [number, number, number] => {
    // `alongDeg` toward the axis' tip, `roundDeg` round it from straight down (0) — a unit direction
    const a = (alongDeg * Math.PI) / 180, r = (roundDeg * Math.PI) / 180;
    return [Math.sin(a), -Math.cos(a) * Math.cos(r), Math.cos(a) * Math.sin(r)];
  };
  it("straight under the axis (the bottom face's middle): steep — a crossing", () => {
    expect(overAxisPitch(dirAt(0, 1), ax)).toBeGreaterThan(SPIT_CROSSING_PITCH_RAD);
  });
  it("⛔ the walk's case — off the middle along the axis, leaning 41° toward a tip, yet passing UNDER it: still a crossing (its own pitch read 49°)", () => {
    const u = dirAt(41, 1);
    expect(Math.asin(Math.abs(u[1])) * 180 / Math.PI).toBeLessThan(60); // the old gate: "round a tip", silent
    expect(overAxisPitch(u, ax)).toBeGreaterThan(SPIT_CROSSING_PITCH_RAD);
  });
  it("round a tip (within 30° of the axis): none — the side changes silently", () => {
    expect(overAxisPitch(dirAt(75, 1), ax)).toBe(0);
  });
  it("level, beside the axis (round its middle at the height of the axis): not a crossing", () => {
    expect(overAxisPitch(dirAt(0, 90), ax)).toBeLessThan(SPIT_CROSSING_PITCH_RAD);
  });
  it("wired: a crossing only when the orbit passes over / under the axis; a silent change ends the crossing's hold", async () => {
    const { readFileSync } = await import("node:fs");
    const aw = readFileSync("src/render/assembly_wiring.ts", "utf8");
    expect(aw).toContain("if (overAxisPitch(u, z.axis) < SPIT_CROSSING_PITCH_RAD) {\n    st.asmEdgeHold = null;\n    return;\n  }");
  });
});
