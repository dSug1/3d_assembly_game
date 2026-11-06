// ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 4c-bis) THE FACE MAP — `src/input/face_map.ts`, wired by `render/assembly_wiring.ts`
// (TILTED_ORBIT_REBUILD_SCOPE.md §15). The gizmo a FUNCTION of the orbit's angles: the angles' place on the core box, the frontmost of the slide's coplanar
// regions along the box face's axis (holes closed), the edge's slow stretch, the blend through an edge. RED against `da020af` (the module absent).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildFaceMap,
  columnAt,
  edgeBlend,
  edgeMap,
  edgeUnmap,
  filledRegion,
  mapAngles,
  mapTarget,
  regionArea,
  facetFrame,
  facetOfNormal,
  stackOf,
  syncAngle,
  topIn,
  topOut,
  type FaceMap,
  type MapFace,
} from "../src/input/face_map";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const D = Math.PI / 180;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const opts = { edgeMm: 10, edgeDeg: 10 };
/** a painting-like box: 0.5 m wide (x), 0.6 m high (y), 33 mm deep (z) */
const box: ShellBox = { lo: [-0.25, 0, -0.05], hi: [0.25, 0.6, -0.017] };
/** ⭐ (Step 5) the box as a faces contour with no face: its six sides, virtual — Step 4c-bis's core box map */
const bm = buildFaceMap([], box);
/** ⭐ is (`x`, `y`) in the region's filled cells (a hole closed counts) — the test's own reader of `filledRegion` (§22: the product reads no region) */
const regionContains = (r: { xs: readonly number[]; ys: readonly number[]; filled: Uint8Array }, x: number, y: number): boolean => {
  const i = r.xs.findIndex((v, k) => k < r.xs.length - 1 && x >= v && x <= r.xs[k + 1]!);
  const j = r.ys.findIndex((v, k) => k < r.ys.length - 1 && y >= v && y <= r.ys[k + 1]!);
  return i >= 0 && j >= 0 && r.filled[i * (r.ys.length - 1) + j] === 1;
};
/** ⭐ the facet facing `n` (a world axis) */
const facing = (fm: FaceMap, n: Vec3): number => fm.facets.findIndex((f) => dist(f.n, n) < 1e-9);
/** an axis-aligned rectangle face, normal `n` (a world axis), at `level` along it, spanning [a0, a1] × [b0, b1] on the plane's two axes in order */
function rectFace(axis: 0 | 1 | 2, sign: 1 | -1, level: number, a0: number, a1: number, b0: number, b1: number): MapFace {
  const [i0, i1] = axis === 0 ? [1, 2] : axis === 1 ? [0, 2] : [0, 1];
  const pt = (a: number, b: number): Vec3 => {
    const p = [0, 0, 0];
    p[axis] = level;
    p[i0!] = a;
    p[i1!] = b;
    return [p[0]!, p[1]!, p[2]!];
  };
  const n = [0, 0, 0];
  n[axis] = sign;
  return { normal: [n[0]!, n[1]!, n[2]!], centre: pt((a0 + a1) / 2, (b0 + b1) / 2), tris: [[pt(a0, b0), pt(a1, b0), pt(a1, b1)], [pt(a0, b0), pt(a1, b1), pt(a0, b1)]] };
}

describe("⭐⭐⭐ (2026-11-04, Step 4c-bis) THE FACE MAP — the gizmo a function of the orbit's angles", () => {
  it("⭐⭐ the slide's regions with their HOLES CLOSED (the owner: *\"close the holes for the moment\"*): an empty slot inside the faces is filled, a notch open to the outside is not", () => {
    // a frame of four faces round a 0.1 × 0.1 hole
    const frame = [
      { x0: 0, x1: 0.3, y0: 0, y1: 0.1 },
      { x0: 0, x1: 0.3, y0: 0.2, y1: 0.3 },
      { x0: 0, x1: 0.1, y0: 0.1, y1: 0.2 },
      { x0: 0.2, x1: 0.3, y0: 0.1, y1: 0.2 },
    ];
    const r = filledRegion(frame);
    expect(regionContains(r, 0.15, 0.15)).toBe(true); // the slot: closed
    expect(regionContains(r, 0.05, 0.05)).toBe(true);
    expect(regionContains(r, 0.35, 0.15)).toBe(false);
    expect(regionArea(r)).toBeCloseTo(0.09, 12);
    // a U: the notch open at the top stays open
    const u = filledRegion(frame.filter((_, k) => k !== 1));
    expect(regionContains(u, 0.15, 0.15)).toBe(false);
  });

  it("⭐⭐ the stacks: faces by the axis they face, by plane, by contact — a 3 mm joint closes (the slide's 1.6 mm growth), 10 mm does not; the FRONTMOST region holds the point, else the NEAREST group's plane", () => {
    const front = (x0: number, x1: number) => rectFace(2, -1, -0.05, x0, x1, 0, 0.6);
    // two faces of the front, their cores 3 mm apart → ONE group; 10 mm apart → two
    const groupsOf = (fm: FaceMap) => fm.facets[facing(fm, [0, 0, -1])]!.groups.length;
    expect(groupsOf(buildFaceMap([front(-0.25, 0), front(0.003, 0.25)], box))).toBe(1);
    expect(groupsOf(buildFaceMap([front(-0.25, 0), front(0.01, 0.25)], box))).toBe(2);
    // a part sticking out of the front (z = −0.09) over x 0 … 0.1, y 0.2 … 0.3
    const fm = buildFaceMap([front(-0.25, 0.25), rectFace(2, -1, -0.09, 0, 0.1, 0.2, 0.3)], { lo: [-0.25, 0, -0.09], hi: [0.25, 0.6, -0.017] });
    const s = fm.facets[facing(fm, [0, 0, -1])]!; // its (t, b): x, y
    // frontmost first: the protrusion (depth = −z), then the painting — the facet's plane the painting's (its main region)
    expect(s.groups.map((g) => g.depth)).toEqual([expect.closeTo(0.09, 12), expect.closeTo(0.05, 12)]);
    expect(regionContains(s.groups[0]!.region, 0.05, 0.25)).toBe(true);
    expect(regionContains(s.groups[0]!.region, -0.1, 0.25)).toBe(false);
    expect(s.e).toBeCloseTo(0.09, 12); // ⭐⭐⭐ (§24.1) the facet's plane pushed out to the parts' support: the protrusion's front (its main region still the painting)
    // a face 15° off −z (the slanted block) faces −z; one 30° off faces none
    const slant = (deg: number): MapFace => ({ ...front(-0.1, 0.1), normal: [Math.sin(deg * D), 0, -Math.cos(deg * D)] });
    const { t: ft, b: fb } = facetFrame([0, 0, -1]);
    expect(stackOf([slant(15)], [0, 0, -1], ft, fb, Math.cos(20 * D)).length).toBe(1);
    expect(stackOf([slant(30)], [0, 0, -1], ft, fb, Math.cos(20 * D)).length).toBe(0);
  });

  it("⭐⭐⭐ (§24.1) THE CONTOUR CLEAR OF EVERY PART: the facets CHOSEN by their main face (a part sticking out of the front makes no facet), each plane then at the parts' SUPPORT — the front at the protrusion's −0.09 (⛔ at the main face's −0.05: close in the piece's path ran through the part, pinned by the solver)", () => {
    const faces = [
      rectFace(2, -1, -0.05, -0.25, 0.25, 0, 0.6), // the front
      rectFace(2, -1, -0.09, 0, 0.1, 0.2, 0.3), // a protrusion's front
      rectFace(2, 1, -0.017, -0.25, 0.25, 0, 0.6), // the back
      rectFace(0, -1, -0.25, 0, 0.6, -0.05, -0.017), // the left side
      rectFace(0, 1, 0.25, 0, 0.6, -0.05, -0.017), // the right side
      rectFace(0, -1, 0, 0.2, 0.3, -0.09, -0.05), // the protrusion's sides
      rectFace(0, 1, 0.1, 0.2, 0.3, -0.09, -0.05),
    ];
    const whole: ShellBox = { lo: [-0.25, 0, -0.09], hi: [0.25, 0.6, -0.017] };
    const fm = buildFaceMap(faces, whole);
    expect(fm.facets.length).toBe(6); // no facet of its own
    expect(fm.core.lo[2]).toBeCloseTo(-0.09, 12); // the protrusion's front: every part inside the contour
    expect(fm.core.hi[2]).toBeCloseTo(-0.017, 12);
    expect(fm.core.lo[0]).toBeCloseTo(-0.25, 12);
    const none = buildFaceMap([], whole).core; // no faces: the whole box
    for (const k of [0, 1, 2]) expect([none.lo[k], none.hi[k]]).toEqual([expect.closeTo(whole.lo[k]!, 12), expect.closeTo(whole.hi[k]!, 12)]);
    // at the corner (the slice's end) the −x side's place is the painting's real corner: its ray meets the left side, not the protrusion's side at x = 0
    const t = mapTarget(fm, 225 * D - 1e-9, 0, opts); // the −z side's slice end toward −x
    const ix = facing(fm, [-1, 0, 0]);
    expect(t.stack).toBe(ix);
    expect(t.surface[0]).toBeCloseTo(-0.25, 12); // on the −x side's plane
  });

  it("⭐⭐⭐ ON A SIDE the green is a HORIZONTAL plane (a dx keeps the height) and the red the WORLD's vertical plane square to the side (a dy keeps the place across it) — by construction (I1)", () => {
    for (const pitch of [-40, -20, 0, 10, 33, 44]) {
      const y0 = mapTarget(bm, 0, pitch * D, opts).surface[1];
      for (let yaw = 0; yaw < 360; yaw += 0.5) expect(mapTarget(bm, yaw * D, pitch * D, opts).surface[1]).toBeCloseTo(y0, 12);
    }
    for (const yaw of [-170, -100, -44, 0, 12, 80, 135, 200, 300]) {
      const t0 = mapTarget(bm, yaw * D, 0, opts);
      const lat = (p: Vec3) => p[0] * t0.normal[2] - p[2] * t0.normal[0]; // across the side (⟂ its normal, horizontal)
      const dep = (p: Vec3) => p[0] * t0.normal[0] + p[2] * t0.normal[2];
      for (let pitch = -45; pitch <= 45; pitch += 0.5) {
        const t = mapTarget(bm, yaw * D, pitch * D, opts);
        expect(lat(t.surface)).toBeCloseTo(lat(t0.surface), 12);
        expect(dep(t.surface)).toBeCloseTo(dep(t0.surface), 12);
        expect(t.band).toBe("SIDE");
      }
    }
  });

  it("⭐⭐⭐ NO JUMP anywhere on the box: a full turn of yaw at every pitch, a full sweep of pitch at every yaw — each step a few mm at most; ±90°: the top / bottom centre whatever the yaw", () => {
    const step = 0.25 * D;
    let worst = 0;
    for (let pitch = -90; pitch <= 90; pitch += 7.5)
      for (let yaw = 0; yaw < 2 * Math.PI; yaw += step) worst = Math.max(worst, dist(mapTarget(bm, yaw, pitch * D, opts).surface, mapTarget(bm, yaw + step, pitch * D, opts).surface));
    for (let yaw = 0; yaw < 360; yaw += 7.5)
      for (let p = -90; p < 90; p += 0.25) worst = Math.max(worst, dist(mapTarget(bm, yaw * D, p * D, opts).surface, mapTarget(bm, yaw * D, (p + 0.25) * D, opts).surface));
    expect(worst).toBeLessThan(0.006); // the steepest: the 0.6 m side over 70° of pitch, 0.25° → 2.1 mm; the 0.5 m front → 1.8 mm
    for (const yaw of [0, 33, 90, 181, 270])
      for (const sg of [1, -1]) {
        const c = mapTarget(bm, yaw * D, (sg * Math.PI) / 2, opts).surface;
        expect(dist(c, [0, sg > 0 ? 0.6 : 0, -0.0335])).toBeLessThan(1e-12);
      }
  });

  it("⭐⭐⭐ THROUGH AN EDGE, SLOWLY (the owner: *\"let the gizmo move slowly over the last and first few mm of the two faces during the arc\"*): the slice's last 10° cross the face's last 10 mm, the next face's first 10° its first 10 mm — never a wait", () => {
    const at = (yaw: number) => mapTarget(bm, yaw * D, 0, opts).surface;
    // the −z front (its slice 225° … 315°): its last 10° before 315° cross its last 10 mm (x 0.24 … 0.25)
    expect(at(305)[0]).toBeCloseTo(0.24, 9);
    expect(at(315 - 1e-9)[0]).toBeCloseTo(0.25, 6);
    // …and the +x side's first 10° its first 10 mm (z −0.05 … −0.04) — a 33 mm side keeps a third at least in its middle (10 of 33 → 10)
    expect(at(315 + 1e-9)[2]).toBeCloseTo(-0.05, 6);
    expect(at(325)[2]).toBeCloseTo(-0.04, 9);
    // moving all the way through (no stop): every 0.1° moves the place
    for (let y = 300; y < 330; y += 0.1) expect(dist(at(y), at(y + 0.1))).toBeGreaterThan(1e-5);
    // the middle linear: 70° for the front's 0.48 m
    expect(at(270)[0]).toBeCloseTo(0, 12);
    expect(at(270 + 35)[0] - at(270)[0]).toBeCloseTo(0.24, 9);
    // the stretch's own maps invert
    for (const s of [-1, -0.95, -0.5, 0, 0.3, 0.8, 0.85, 0.999, 1]) expect(edgeUnmap(edgeMap(s, 0.25, 0.3, 0.01), 0.25, 0.3, 0.01)).toBeCloseTo(s, 12);
    for (const f of [0, 0.1, 0.22, 0.5, 1]) expect(topOut(topIn(f, 0.22, 0.01, 0.0165), 0.22, 0.01, 0.0165)).toBeCloseTo(f, 12);
    // no band: no stretch (linear, the corner at the slice's end)
    expect(mapTarget(bm, 305 * D, 0, { edgeMm: 10, edgeDeg: 0 }).surface[0]).toBeCloseTo(0.25 * (35 / 45), 12);
  });

  it("⭐⭐⭐ THE BLEND THROUGH AN EDGE (`edgeBlend`): ½ at a slice's end from either side (both sides meet there), rising from 0 at the band's start; the same up a side to the top", () => {
    const b = (yaw: number, pitch = 0) => edgeBlend(bm, yaw * D, pitch * D, opts);
    expect(b(270).h).toBeNull();
    expect(b(305 - 1e-6).h).toBeNull();
    expect(b(315 - 1e-9).h!.w).toBeCloseTo(0.5, 6);
    expect(b(315 + 1e-9).h!.w).toBeCloseTo(0.5, 6);
    expect(columnAt(bm, b(315 - 1e-9).h!.yawThere).k).toBe(0); // toward the +x side
    expect(columnAt(bm, b(315 + 1e-9).h!.yawThere).k).toBe(3); // back toward the −z front
    expect(b(310).h!.w).toBeGreaterThan(0);
    expect(b(310).h!.w).toBeLessThan(0.5);
    expect(b(0, 45 - 1e-9).v!.w).toBeCloseTo(0.5, 6);
    expect(b(0, 45 + 1e-9).v!.w).toBeCloseTo(0.5, 6);
    expect(b(0, 20).v).toBeNull();
    expect(b(0, 60).v).toBeNull();
    expect(edgeBlend(bm, 0, 44.99 * D, { edgeMm: 10, edgeDeg: 0 })).toEqual({ h: null, v: null });
  });

  it("⭐⭐ AND BACK (`mapAngles` — after the slide the map's angles put where it left the gizmo): every place on the box read back to its own angles", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let k = 0; k < 400; k++) {
      const yaw = rnd() * 2 * Math.PI;
      const pitch = (rnd() * 2 - 1) * (Math.PI / 2 - 1e-3);
      const t = mapTarget(bm, yaw, pitch, opts);
      const back = mapAngles(bm, t.surface, t.stack, opts);
      expect(dist(mapTarget(bm, back.yaw, back.pitch, opts).surface, t.surface)).toBeLessThan(1e-9);
    }
    expect(facetOfNormal(bm, [0.1, 0.05, -0.99], [0, 0, 0])).toBe(facing(bm, [0, 0, -1]));
    expect(facetOfNormal(bm, null, [0.26, 0.3, -0.033])).toBe(facing(bm, [1, 0, 0]));
  });

  it("⭐⭐ OUT OF STEP, NO JUMP (`syncAngle`): the map's angle follows the orbit's step faster while it runs away, slower while it comes back — never against the finger, never a jump; caught up, exactly the orbit's", () => {
    let m = 0;
    let target = 0.35; // 20° apart after the slide
    let steps = 0;
    while (m !== target && steps < 1000) {
      const d = 0.01; // the orbit runs away
      target += d;
      const m2 = syncAngle(m, target, d, 0.5, false);
      expect(m2 - m).toBeGreaterThan(0); // the finger's way
      expect(m2 - m).toBeLessThanOrEqual(1.5 * d + 1e-12);
      m = m2;
      steps++;
    }
    expect(m).toBe(target);
    expect(steps).toBeLessThan(80); // 0.35 closed at 0.5 × 0.01 a step
    // coming back toward it: still the finger's way, slower
    expect(syncAngle(0, 0.2, -0.01, 0.5, false)).toBeCloseTo(-0.005, 12);
    // in step: the orbit's own
    expect(syncAngle(0.3, 0.3, 0.02, 0.5, false)).toBe(0.3);
    // a yaw: the gap read round the circle (359° → 1° is 2°)
    expect(syncAngle(359 * D, 1 * D + 0.01, 0.01, 0.5, true)).toBeGreaterThan(359 * D);
  });

  it("⭐⭐⭐ WIRED (`render/assembly_wiring.ts`): the gizmo from the face map at the map's angles (`mapGizmo` → `rawGizmo`, `edgeBlend`), the sections drawn from the same function; ⛔ the carrier, its hulls and its held drops gone; the knobs are sliders", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const m = mapGizmoF(st, mq.yaw, mq.pitch);"); // ⭐ (Step 6) in the orbit's frame
    expect(a).toContain("const t = mapTarget(map, yaw, pitch, o);");
    // ⭐⭐⭐ (§22) the gizmo's place the CONTOUR alone (`contourPlace`), the facet's normal, no host
    expect(a).toContain("return { hit: { point: contourPlace(map, yaw, pitch, o), normal: t.normal, host: null }, t };");
    // ⭐⭐⭐ (§21) the sections the PLANE CUTS through the gizmo's place (⛔ the sweeps of the face map)
    expect(a).toContain("const loop = cutLoop(facets, insidePlane(plane, facets));");
    expect(a).toContain("return { a: planeThrough(c, up), b: Math.hypot(r[0], r[1], r[2]) > 1e-6 ? planeThrough(c, r) : null };");
    expect(a).toContain("st.asmMapQ = map !== null && gF !== null ? mapAngles(map, gF, facetOfNormal(map, nF, gF), mapOpts(st)) : null;");
    for (const gone of ["carrierFrame(", "onGreen(", "facingChain(", "loopFor(", "faceTurnedAway", "castGizmo("]) expect(a).not.toContain(gone);
    expect(DEFAULT_CONFIG.faceEdgeSlideMm).toBe(10);
    expect(DEFAULT_CONFIG.faceEdgeSlideDeg).toBe(10);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, faceEdgeSlideDeg: 30 })).toThrow();
    expect(code("render/tuning_menu.ts")).toContain('"faceEdgeSlideMm", 0, 100, 1');
  });
});
