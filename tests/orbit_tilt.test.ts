// ⭐⭐⭐ (2026-11-10, POLAR_ORBIT_CLEANUP.md §9.4) THE TILTED POLE — a press on a cap tilts the orbit so the cap is a side (the owner's decisions 1 (c),
// 2 (a), 3 (a), 4 the "no camera roll" rule removed). RED against `46d24db`: `src/input/orbit_tilt.ts` and the wiring (`tiltOnPress`, `tiltOff`) absent.
// ⭐ The cube's fixture is the REAL specimen (the 240 faces the page fed to `buildFaceMap`, 2026-11-09).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { anglesOfDir, capTilt, frameMix, gizmoGlide, wholeShareStep, headingTurn, mulM, mulT, poleEdgeWhole, rollDurationMs, rollStep, tiltUnderWay, snapHeading, swingDir, tiltAutoLatch, tiltBox, tiltCalmWholeHV, tiltExits, capYawRelease, mouthHold, squareTurn, squareTurning, tiltFaces, type Mat3 } from "../src/input/orbit_tilt";
import { offsetFrame, orbitDir, pitchOfV, vOfPitch } from "../src/input/assembly_orbit";
import { buildFaceMap, mapAngles, mapTarget, type MapFace } from "../src/input/face_map";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import type { ShellBox } from "../src/input/orbit_shell";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const opts = { edgeMm: 10, edgeDeg: 10 };
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dirOf = (yaw: number, pitch: number): Vec3 => orbitDir(yaw, vOfPitch(pitch));
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const cube = JSON.parse(readFileSync(new URL("./fixtures/scene_1_cube_faces.json", import.meta.url), "utf8")) as { box: ShellBox; faces: MapFace[] };

/** the camera frame in F turned into the world, as the wiring draws it (`assemblyCameraFrame`) */
function frameViaF(R: Mat3, uW: Vec3, oy: number, op: number) {
  const uF = mulT(R, uW);
  const hF = Math.atan2(uF[2], uF[0]);
  const f = offsetFrame(uF, hF, oy, op);
  return { dir: mulM(R, f.dir), up: mulM(R, f.up) };
}

describe("⭐⭐⭐ the tilt at a press on a cap (1 (c))", () => {
  it("⭐⭐ the cap's normal is the SNAPPED heading's direction in F — the cap a side facing the camera (top: up; bottom: down)", () => {
    for (const hs of [0, 90 * D, 180 * D, -90 * D]) {
      const hh: Vec3 = [Math.cos(hs), 0, Math.sin(hs)];
      const top = capTilt(hs, [0, 1, 0]);
      const bot = capTilt(hs, [0, -1, 0]);
      expect(dist(mulT(top, [0, 1, 0]), hh)).toBeLessThan(1e-12);
      expect(dist(mulT(bot, [0, -1, 0]), hh)).toBeLessThan(1e-12);
      // the tilt's axis is square to the heading and horizontal: the heading's square stays put
      const side: Vec3 = [-hh[2], 0, hh[0]];
      expect(dist(mulM(top, side), side)).toBeLessThan(1e-12);
    }
  });

  it("⭐ the heading snapped to the nearest world axis; the swing's turn adds its angle to a heading", () => {
    expect(snapHeading(30 * D)).toBeCloseTo(0, 12);
    expect(snapHeading(50 * D)).toBeCloseTo(90 * D, 12);
    expect(snapHeading(-140 * D)).toBeCloseTo(-180 * D, 12);
    const v = mulM(headingTurn(25 * D), dirOf(10 * D, 40 * D));
    expect(Math.atan2(v[2], v[0])).toBeCloseTo(35 * D, 12);
    expect(Math.asin(v[1])).toBeCloseTo(40 * D, 12);
  });

  it("⭐⭐⭐ NO ROLL AT THE TILT: the camera upright in F, turned into the world, IS the world's upright camera — offsets included, from above a top and below a bottom", () => {
    for (const hs of [0, 90 * D, 180 * D, -90 * D])
      for (const pitch of [50 * D, 65 * D, 80 * D])
        for (const top of [true, false]) {
          const R = capTilt(hs, top ? [0, 1, 0] : [0, -1, 0]);
          const uW = dirOf(hs, top ? pitch : -pitch);
          const w = offsetFrame(uW, hs, 7 * D, -12 * D);
          const f = frameViaF(R, uW, 7 * D, -12 * D);
          expect(dist(f.dir, w.dir)).toBeLessThan(1e-9);
          expect(dist(f.up, w.up)).toBeLessThan(1e-9);
        }
  });

  it("⭐⭐⭐ THE SWING (1 (c)): at the press the camera exactly where it was; at its end at the snapped heading, the same pitch, upright — no roll on the way", () => {
    const psi = 32 * D;
    const hs = snapHeading(psi);
    const delta = hs - psi;
    const R = capTilt(hs, [0, 1, 0]);
    const u0 = dirOf(psi, 60 * D);
    const uF = mulT(swingDir(R, delta, 0), u0); // the press: the orbit's angles in F
    expect(dist(mulM(swingDir(R, delta, 0), uF), u0)).toBeLessThan(1e-12);
    const u1 = mulM(swingDir(R, delta, 1), uF);
    expect(Math.atan2(u1[2], u1[0])).toBeCloseTo(hs, 9);
    expect(Math.asin(u1[1])).toBeCloseTo(60 * D, 9);
    for (const e of [0, 0.3, 0.7, 1]) {
      // mid-swing: the F camera turned into the world is upright there (its up in the vertical plane of its direction)
      const Re = swingDir(R, delta, e);
      const f = frameViaF(Re, mulM(Re, uF), 0, 0);
      const side = [f.dir[2], 0, -f.dir[0]] as Vec3;
      expect(Math.abs(dot(f.up, side))).toBeLessThan(1e-9);
      expect(f.up[1]).toBeGreaterThan(0);
    }
  });

  it("⭐ a direction's angles round-trip (the frame changes turn every stored angle through them)", () => {
    for (const [y, p] of [[0.3, 0.2], [-2.5, -0.9], [3.1, 1.2]] as const) {
      const a = anglesOfDir(dirOf(y, p), y + 0.1);
      expect(a.yaw).toBeCloseTo(y, 12);
      expect(pitchOfV(a.v)).toBeCloseTo(p, 12);
    }
  });
});

describe("⭐⭐⭐ the face map in F on the REAL cube — the top a side, the gizmo kept, the lines square", () => {
  const hs = -90 * D;
  const R = capTilt(hs, [0, 1, 0]);
  const hh: Vec3 = [Math.cos(hs), 0, Math.sin(hs)];
  const map = buildFaceMap(tiltFaces(cube.faces, R), tiltBox(cube.box, R));
  const world = buildFaceMap(cube.faces, cube.box);
  const fi = map.facets.findIndex((f) => dist(f.n, hh) < 1e-6);

  it("⭐⭐ the world's top is a SIDE facet in F (its normal the heading), not a cap; F's caps are the world's front and back", () => {
    expect(fi).toBeGreaterThanOrEqual(0);
    expect(map.facets[fi]!.kind).toBe("SIDE");
    expect(Math.abs(mulM(R, map.facets[map.top]!.n)[1])).toBeLessThan(1e-6);
    expect(Math.abs(mulM(R, map.facets[map.bottom]!.n)[1])).toBeLessThan(1e-6);
    expect(world.facets[world.top]!.n[1]).toBeGreaterThan(0.99);
  });

  it("⭐⭐⭐ THE GIZMO STAYS AT ITS EXACT POINT: the world's top point, its F angles (`mapAngles`), the F map's place there — the same point", () => {
    const top = world.facets[world.top]!;
    for (const [yaw, pitch] of [[-90 * D, 70 * D], [-60 * D, 60 * D], [-120 * D, 75 * D]] as const) {
      const pW = mapTarget(world, yaw, pitch, opts).surface; // on the top's plane
      expect(dot(pW, top.n) - top.e).toBeCloseTo(0, 9);
      const pF = mulT(R, pW);
      const a = mapAngles(map, pF, fi, opts);
      const back = mapTarget(map, a.yaw, a.pitch, opts);
      expect(back.stack).toBe(fi);
      expect(dist(mulM(R, back.surface), pW)).toBeLessThan(1e-6);
    }
  });

  it("⭐⭐⭐ ON THE TILTED TOP THE GREEN RUNS STRAIGHT ACROSS (the world axis square to the heading) AND THE RED STRAIGHT AWAY (along the heading)", () => {
    const col = map.columns.find((c) => c.facets.includes(fi))!;
    const p0 = mulM(R, mapTarget(map, col.mid, 0, opts).surface);
    const pG = mulM(R, mapTarget(map, col.mid + 5 * D, 0, opts).surface); // a dx: the F yaw
    const pR = mulM(R, mapTarget(map, col.mid, 5 * D, opts).surface); // a dy: the F pitch
    const g: Vec3 = [pG[0] - p0[0], pG[1] - p0[1], pG[2] - p0[2]];
    const r: Vec3 = [pR[0] - p0[0], pR[1] - p0[1], pR[2] - p0[2]];
    expect(Math.hypot(...g)).toBeGreaterThan(0.005);
    expect(Math.hypot(...r)).toBeGreaterThan(0.005);
    expect(Math.abs(g[1])).toBeLessThan(1e-9); // on the top's plane
    expect(Math.abs(dot(g, hh))).toBeLessThan(1e-9); // square to the heading: straight across
    expect(Math.abs(r[1])).toBeLessThan(1e-9);
    expect(Math.abs(Math.abs(dot(r, hh)) - Math.hypot(...r))).toBeLessThan(1e-9); // along the heading: straight away / toward
  });

});

describe("⭐⭐ the calm on the tilted facet whole toward EVERY edge (each a frame change) over its own edge zones (`tiltCalmWholeHV`)", () => {
  const f = { b: [0, 1, 0] as Vec3, bLo: 0, bHi: 0.4 };
  const z = { zoneHPct: 25, zoneMinHM: 0.03, zoneVPct: 25, zoneMinVM: 0.03 };
  const at = (L: number, y: number) => ({ surface: [0, y, 0] as Vec3, across: { L, lo: 0, hi: 0.4 } });
  it("⭐ 0 in the middle; 1 at any edge (across or up); rising smoothly through the zone (a quarter of the run), never a step", () => {
    const w = (L: number, y: number) => Math.max(tiltCalmWholeHV(at(L, y), f, z).h, tiltCalmWholeHV(at(L, y), f, z).v);
    expect(w(0.2, 0.2)).toBe(0);
    expect(w(0, 0.2)).toBe(1);
    expect(w(0.2, 0.4)).toBe(1);
    let last = 0;
    for (let y = 0.2; y <= 0.4 + 1e-12; y += 0.005) {
      const p = w(0.2, y);
      expect(p).toBeGreaterThanOrEqual(last - 1e-12);
      expect(p - last).toBeLessThan(0.1);
      last = p;
    }
  });
  it("⭐⭐⭐ (2026-11-10, *\"the tilt seems to catch up what the calm prevented\"*) in two parts: toward a `b` end the VERTICAL share alone (`v` 1, `h` 0 — the horizontal calm carried over), across both", () => {
    expect(tiltCalmWholeHV(at(0.2, 0.4), f, z)).toEqual({ h: 0, v: 1 });
    expect(tiltCalmWholeHV(at(0, 0.2), f, z)).toEqual({ h: 1, v: 0 });
  });
});

describe("⭐⭐⭐ (2026-11-10, the owner: *\"build b\"*) THE MOUTH'S HAND-OVER (`mouthHold`) and the cap's release (`capYawRelease`)", () => {
  const up = { lo: false, hi: true };
  it("⭐⭐⭐ a dy toward the open end holds (the red at the floor's edge); away, a dx, or no mouth lets go; no step keeps the state", () => {
    expect(mouthHold(false, up, 0.02, 0.001)).toBe(true);
    expect(mouthHold(true, up, -0.02, 0)).toBe(false);
    expect(mouthHold(true, up, 0.01, 0.03)).toBe(false); // ⭐ a dx: onto the bridge (§8.3: the green straight across)
    expect(mouthHold(true, null, 0.02, 0)).toBe(false);
    expect(mouthHold(true, up, 0, 0)).toBe(true);
    expect(mouthHold(false, up, 0, 0)).toBe(false);
    expect(mouthHold(false, { lo: true, hi: false }, -0.02, 0)).toBe(true); // a bottom's mouth, dy down
  });
  it("⭐⭐ over a cap of the world's frame: the side's horizontal calm kept as it came over, whole after a 45° dx (a smoothstep); either way round", () => {
    expect(capYawRelease(0)).toBe(0);
    expect(capYawRelease(Math.PI / 4)).toBe(1);
    expect(capYawRelease(-Math.PI / 8)).toBeCloseTo(0.5, 12);
    expect(capYawRelease(2 * Math.PI + 0.01)).toBeLessThan(0.01);
  });
});

describe("⭐⭐⭐ the camera's frame turned back to the world's upright (`frameMix`) — the roll paced by the share, the half turn about ONE axis", () => {
  const a = { dir: [0, 0, 1] as Vec3, up: [0, 1, 0] as Vec3 };
  const b = { dir: [0, 0, 1] as Vec3, up: [1, 0, 0] as Vec3 };
  it("⭐ k 0: the F frame; k 1: the world's", () => {
    expect(frameMix(a, b, 0, null).frame).toEqual(a);
    const f = frameMix(a, b, 1, null).frame;
    expect(dist(f.up, b.up)).toBeLessThan(1e-12);
    expect(dist(f.dir, b.dir)).toBeLessThan(1e-12);
  });
  it("⭐⭐ a quarter roll halfway: the direction kept, the up turned 45°", () => {
    const f = frameMix(a, b, 0.5, null).frame;
    expect(dist(f.dir, a.dir)).toBeLessThan(1e-12);
    expect(Math.acos(dot(f.up, a.up))).toBeCloseTo(45 * D, 9);
  });
  it("⭐⭐⭐ THE FAR EDGE'S HALF TURN (2 (a)): about the axis nearest the last one — never flipping mid-way", () => {
    const c = { dir: [0, 0, 1] as Vec3, up: [0, -1, 0] as Vec3 };
    const p = frameMix(a, c, 0.5, [0, 0, 1]);
    const m = frameMix(a, c, 0.5, [0, 0, -1]);
    expect(dist(p.frame.dir, a.dir)).toBeLessThan(1e-9);
    expect(Math.abs(dot(p.frame.up, a.up))).toBeLessThan(1e-9);
    expect(dist(p.frame.up, m.frame.up)).toBeGreaterThan(1.9); // the two ways round are opposite: the hint picks one
    expect(dist(frameMix(a, c, 0.6, p.axis).frame.up, frameMix(a, c, 0.6, [0, 0, 1]).frame.up)).toBeLessThan(1e-9); // the same way on
  });
});

describe("⭐⭐⭐ (2026-11-10, the owner: *\"Make the roll back by finger && minimum of xx ms\"*) the roll SHOWN follows the finger, a whole roll never under `tiltRollMinMs`", () => {
  it("⭐⭐ the finger's whole share at once: 0 → 1 over 250 ms at 16 ms frames (16 frames), never faster; reversible; 0 ms: the finger alone", () => {
    let k = 0;
    let frames = 0;
    while (k < 1 && frames < 100) {
      const k2 = rollStep(k, 1, 16, 250);
      expect(k2 - k).toBeLessThanOrEqual(16 / 250 + 1e-12);
      k = k2;
      frames++;
    }
    expect(frames).toBe(16);
    expect(rollStep(0.6, 0.2, 16, 250)).toBeCloseTo(0.6 - 16 / 250, 12); // the finger back: the roll comes back, as slowly
    expect(rollStep(0.5, 0.52, 16, 250)).toBe(0.52); // a slow finger: exactly the finger's
    expect(rollStep(0.1, 1, 16, 0)).toBe(1);
  });
});

describe("⭐⭐⭐ (2026-11-10, the owner: *\"fix the gap\"* — *\"poles held by edges or slanted faces\"*) A FACE HOLDING A POLE, WHATEVER ITS SLANT", () => {
  // a prism along x: its section a regular polygon in (z, y), `off` the first vertex's angle — a hexagon with a VERTEX up (an edge holds the pole: two faces
  // at 60°), a square turned 45° (a diamond: two faces at 45°, none beyond — the pole held by an edge, a VIRTUAL cap)
  const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const crs = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function prism(sides: number, off: number, R0: number, h: number) {
    const ring = (x: number) => [...Array(sides)].map((_, k) => [x, R0 * Math.sin(off + (2 * Math.PI * k) / sides), R0 * Math.cos(off + (2 * Math.PI * k) / sides)] as Vec3);
    const A = ring(-h / 2);
    const B = ring(h / 2);
    const quads: Vec3[][] = [];
    for (let k = 0; k < sides; k++) quads.push([A[k]!, B[k]!, B[(k + 1) % sides]!, A[(k + 1) % sides]!]);
    quads.push([...B].reverse(), A);
    const faces: MapFace[] = quads.map((vs) => {
      const c = crs(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
      const l = Math.hypot(...c);
      const tris: [Vec3, Vec3, Vec3][] = [];
      for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
      const centre = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as Vec3;
      const n: Vec3 = [c[0] / l, c[1] / l, c[2] / l];
      return { normal: dot(n, centre) < 0 ? ([-n[0], -n[1], -n[2]] as Vec3) : n, centre, tris };
    });
    const ys = A.map((v) => v[1]);
    const zs = A.map((v) => v[2]);
    return { faces, box: { lo: [-h / 2, Math.min(...ys), Math.min(...zs)] as Vec3, hi: [h / 2, Math.max(...ys), Math.max(...zs)] as Vec3 } };
  }
  const hs = -90 * D; // the camera at −z
  const hh: Vec3 = [Math.cos(hs), 0, Math.sin(hs)];

  it("⭐⭐⭐ the tilt lays the face's normal HORIZONTAL toward the camera — level (90°), slanted toward (60°) or away (120°) — and never rolls the view", () => {
    for (const e of [90, 60, 120, 75]) {
      const n: Vec3 = [0, Math.sin(e * D), Math.cos(e * D) * hh[2]]; // in the heading's vertical plane: e from hh toward up
      const R = capTilt(hs, n);
      expect(dist(mulT(R, n), hh)).toBeLessThan(1e-12);
      for (const pitch of [50 * D, 70 * D]) {
        const uW = dirOf(hs, pitch);
        const w = offsetFrame(uW, hs, 7 * D, -12 * D);
        const f = frameViaF(R, uW, 7 * D, -12 * D);
        expect(dist(f.up, w.up)).toBeLessThan(1e-9);
      }
    }
    // off the heading's plane (a face holding the pole whose slant faces sideways): still a side in F (its normal horizontal)
    const n2: Vec3 = [0.3, 0.9, -Math.sqrt(1 - 0.09 - 0.81)];
    expect(Math.abs(mulT(capTilt(hs, n2), n2)[1])).toBeLessThan(1e-12);
  });

  it("⭐⭐⭐ A HEXAGON WITH A VERTEX UP (an edge holds the pole): the face holding it, slanted 60°, is a SIDE in F square to the camera; ⛔ a quarter turn left it 30° off", () => {
    const { faces, box } = prism(6, 30 * D, 0.17, 0.5);
    const world = buildFaceMap(faces, box);
    const cap = world.facets[world.top]!;
    expect(cap.real).toBe(true);
    expect(Math.asin(cap.n[1]) / D).toBeCloseTo(60, 6);
    const R = capTilt(hs, cap.n);
    const map = buildFaceMap(tiltFaces(faces, R), tiltBox(box, R));
    const fi = map.facets.findIndex((f) => Math.abs(f.n[1]) < 1e-9 && dot(f.n, hh) > 0.999);
    expect(fi).toBeGreaterThanOrEqual(0);
    expect(map.facets[fi]!.kind).toBe("SIDE");
    // ⛔ the quarter turn: that face 30° off the horizontal in F
    const old = mulT(capTilt(hs, [0, 1, 0]), cap.n);
    expect(Math.abs(Math.asin(old[1]) / D)).toBeCloseTo(30, 6);
  });

  it("⭐⭐ A DIAMOND (a square turned 45°, the pole on an edge, no face beyond 45° — a VIRTUAL cap): tilted as a level one, both faces beside the edge are sides in F", () => {
    const { faces, box } = prism(4, 0, 0.2, 0.5);
    const world = buildFaceMap(faces, box);
    expect(world.facets[world.top]!.real).toBe(false);
    const R = capTilt(hs, world.facets[world.top]!.n);
    const map = buildFaceMap(tiltFaces(faces, R), tiltBox(box, R));
    const up = faces.filter((f) => f.normal[1] > 0.5).map((f) => mulT(R, f.normal));
    expect(up.length).toBe(2);
    for (const n of up) {
      const f = map.facets.find((q) => dist(q.n, n) < 1e-6);
      expect(f?.kind).toBe("SIDE");
    }
  });
});

describe("⭐⭐⭐ (2026-11-10, the owner: *\"why is there a back-and-forth jump of the scene when the gizmo crosses an edge\"*) the calm whole toward a face holding a pole BY POSITION", () => {
  const f = { b: [0, 1, 0] as Vec3, bLo: -0.25, bHi: 0.25 };
  it("⭐⭐ 1 at the edge bordering a face holding a pole, 0 in the middle, smooth through the zone; an end bordering none: nothing", () => {
    expect(poleEdgeWhole([0, -0.25, 0], f, true, true, 25, 0.03)).toBe(1);
    expect(poleEdgeWhole([0, 0.25, 0], f, true, true, 25, 0.03)).toBe(1);
    expect(poleEdgeWhole([0, 0, 0], f, true, true, 25, 0.03)).toBe(0);
    expect(poleEdgeWhole([0, -0.25, 0], f, false, true, 25, 0.03)).toBe(0); // the bottom end borders no face holding a pole
    expect(poleEdgeWhole([0, -0.25, 0], f, false, false, 25, 0.03)).toBe(0);
    let last = 0;
    for (let y = 0; y >= -0.25 - 1e-12; y -= 0.005) {
      const p = poleEdgeWhole([0, y, 0], f, true, false, 25, 0.03);
      expect(p).toBeGreaterThanOrEqual(last - 1e-12);
      expect(p - last).toBeLessThan(0.15);
      last = p;
    }
  });
});

describe("⭐⭐⭐ (2026-11-10, THE REBUILD — *\"once the tilt starts, it cannot be rolled back … and shall complete\"*, *\"keep the edge, and not use any stretch\"*, *\"1-b\"*, *\"one speed for every tilt\"*)", () => {
  it("⭐⭐⭐ ONE SPEED FOR EVERY TILT (360°/s): a far edge's half turn 0.5 s, a side's 63° 0.175 s, a swing of 30° 83 ms, none at once (⛔ 250 ms for any roll, 300 ms for any swing)", () => {
    expect(rollDurationMs(Math.PI, 360)).toBeCloseTo(500, 9);
    expect(rollDurationMs((63 * Math.PI) / 180, 360)).toBeCloseTo(175, 9);
    expect(rollDurationMs((-30 * Math.PI) / 180, 360)).toBeCloseTo(83.333, 2);
    expect(rollDurationMs(0, 360)).toBe(0);
    expect(rollDurationMs(Math.PI, 0)).toBe(0);
  });
  it("⭐⭐⭐ A TILT UNDER WAY HOLDS THE GIZMO (1-b): its swing, or its roll back started (over the edge, or out past the threshold) and not whole; whole: free", () => {
    expect(tiltUnderWay(true, false, 0)).toBe(true);
    expect(tiltUnderWay(false, true, 0.4)).toBe(true);
    expect(tiltUnderWay(false, true, 1)).toBe(false);
    expect(tiltUnderWay(false, false, 0)).toBe(false); // on the tilted face, no crossing yet: the finger has the orbit
  });
  it("⭐⭐⭐ THE ROLL ON ITS OWN CLOCK: from the crossing to whole in its duration, whatever the finger (it never comes back: the asked share is 1 from the crossing)", () => {
    const dur = rollDurationMs(Math.PI, 360);
    let k = 0;
    let t = 0;
    while (k < 1 && t < 2000) {
      k = rollStep(k, 1, 16, dur);
      t += 16;
    }
    expect(t).toBeGreaterThanOrEqual(dur);
    expect(t).toBeLessThan(dur + 16 + 1e-9);
  });
});

describe("⭐⭐⭐ (2026-11-10, the owner: *\"Build 2\"*) THE GLIDE AT AN EDGE — the switch at the edge, the jump eased by time", () => {
  it("⭐⭐⭐ (the owner's shake) the whole share on the rig's lag: an event's jump spread like the gizmo's (63 % in one τ), never past it; τ 0: at once", () => {
    const tau = DEFAULT_CONFIG.gizmoEaseMs;
    expect(wholeShareStep(0.48, 0.75, tau, tau)).toBeCloseTo(0.48 + 0.27 * (1 - Math.exp(-1)), 12);
    expect(wholeShareStep(0.48, 0.75, 16.7, tau)).toBeLessThan(0.75 - 0.27 * 0.6); // ⛔ at once (§9.6): 0.75 in the event's frame
    let x = 0.9;
    for (let i = 0; i < 60; i++) x = wholeShareStep(x, 1, 16.7, tau);
    expect(x).toBeGreaterThan(0.999);
    expect(x).toBeLessThanOrEqual(1);
    expect(wholeShareStep(0.2, 0.9, 16.7, 0)).toBe(0.9);
    expect(wholeShareStep(0.2, 0.9, -5, tau)).toBe(0.2);
  });
  it("⭐⭐⭐ the cube's bottom edge (measured: the side's ray on Piece30 at x −147, the bottom's on Piece37 at y 74 — 110 mm; the contour's place moved 1 mm): the offset back to where the travel alone puts it", () => {
    const g = gizmoGlide([-0.147, 0.016, 0.191], [-0.242, 0.016, 0.191], [-0.241, 0.016, 0.191], [-0.241, 0.074, 0.191]);
    expect(g).not.toBeNull();
    expect(Math.hypot(...g!) * 1000).toBeCloseTo(111.3, 0);
    expect(dist([-0.241 + g![0], 0.074 + g![1], 0.191 + g![2]], [-0.146, 0.016, 0.191])).toBeLessThan(1e-12); // shown: where it was + the place's own travel
  });
  it("⭐⭐⭐ (*\"Apply the glide to those steps as well\"*) A NOTCH'S WALL INSIDE ONE FACE: the place moves 20 mm along the top, the real depth climbs 85 mm out of the notch — the 85 mm glided, the 20 mm not", () => {
    const g = gizmoGlide([0.0, 0.414, 0.2], [0.0, 0.499, 0.2], [0.02, 0.499, 0.2], [0.02, 0.499, 0.2]);
    expect(g).not.toBeNull();
    expect(g![0]).toBeCloseTo(0, 12);
    expect(g![1]).toBeCloseTo(-0.085, 12);
  });
  it("⭐⭐ none for the map's own travel however fast (the real depth unchanged), none under 5 mm, none after a frame change (no last place)", () => {
    expect(gizmoGlide([0, 0.5, 0], [0, 0.5, 0], [0.12, 0.5, 0], [0.12, 0.5, 0])).toBeNull();
    expect(gizmoGlide([0, 0.5, 0], [0, 0.5, 0], [0, 0.5, 0], [0, 0.503, 0])).toBeNull();
    expect(gizmoGlide([0, 0.5, 0], null, [0, 0.5, 0], [0.2, 0.5, 0])).toBeNull();
  });
});

describe("⭐⭐⭐ (2026-11-10, the owner: *\"at close distance … it toggles on automatically\"*) THE AUTOMATIC TILT and its hysteresis", () => {
  it("⭐⭐ the latch: on within 30 % of the far distance, off only beyond 35 % — an approach round the threshold never flickers it; 0 %: never", () => {
    // ⭐ (2026-11-10, *"use m for the slider … 0.3 m"*) metres: on within 0.3 m, off only beyond 0.35 m
    expect(tiltAutoLatch(false, 0.3, 0.3)).toBe(true);
    expect(tiltAutoLatch(false, 0.31, 0.3)).toBe(false);
    expect(tiltAutoLatch(true, 0.34, 0.3)).toBe(true); // within the hysteresis: still on
    expect(tiltAutoLatch(true, 0.36, 0.3)).toBe(false); // off
    expect(tiltAutoLatch(false, 0.01, 0)).toBe(false);
  });
  it("⭐⭐⭐ THE OWNER'S HYSTERESIS: no tilt back before the tilt's swing is over and the roll shown whole — so a tilt and its tilt back take at least `tiltSwingMs` + the roll's time at `tiltRollDegS`", () => {
    expect(tiltExits(false, 1, false)).toBe(false);
    expect(tiltExits(false, 0.8, true)).toBe(false);
    expect(tiltExits(true, 1, true)).toBe(false);
    expect(tiltExits(false, 1, true)).toBe(true);
    // ⭐⭐⭐ (the owner: *"if the piece crosses the hysteresis threshold, the tilt automatically triggers on or off"*) out past it: off on the facet too — once
    // the roll shown is whole and the swing over
    expect(tiltExits(true, 1, true, true)).toBe(true);
    expect(tiltExits(true, 0.5, true, true)).toBe(false);
    expect(tiltExits(true, 1, false, true)).toBe(false);
  });
});

describe("⭐⭐ wired", () => {
  it("⭐⭐⭐ the press tilts (`tiltOnPress`, a first press alone), the frame's every direction through `dirFrame`, the map built in F, the exit back to the world (`tiltOff`), the camera's roll by the exit's share", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("if (assemblyOn(st) && holdRole === null && e.pointerId !== MOUSE_SECOND_ID && st.router.all().length === 1) tiltOnPress(st);");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("buildFaceMap(tiltFaces(placedFaces(st), R), tiltBox(box, R),");
    expect(a).toContain("turnAngles(st, (d) => mulT(D0, d));");
    expect(a).toContain("turnAngles(st, (d) => mulM(D, d));");
    expect(a).toContain("const mix = frameMix(f, offsetFrame(uW, hW, o.yawRad, o.pitchRad), tl.k, tl.axis);");
    expect(a).toContain("if (!onFacet && !tl.finishing) {"); // ⭐ the roll starts as the gizmo crosses the edge — no stretch
    expect(a).not.toContain("exitShare("); // ⛔ the stretch's share deleted
    expect(a).toContain("if (!turning && (tl === null || !(tiltUnderWay(tl.swingMs !== null, tl.finishing || tl.off, tl.k) || tl.finishing || tl.off))) return false;"); // ⭐ (2026-11-10) held to the exit itself
    expect(a).toContain("if (nW !== null) sqO.target = nW;"); // ⭐ the turn's target at the crossing itself // ⭐ 1-b: held (⭐ `1.0.120b-`: and while the square camera turns)
    expect(a).toContain("const g = m === null ? gizmoFor(st) : withGOff(st, m.hit.point);");
    expect(a).toContain("tl.k = rollStep(tl.k, tl.kT, dtMs, rollDurationMs(tl.rollRad, st.cfg.tiltRollDegS));");
    expect(a).toContain("const swingDurMs = rollDurationMs(deltaShown, st.cfg.tiltRollDegS);"); // ⭐ one speed for every tilt — ⭐ (2026-11-10) the camera's own swing: from the heading SHOWN
    expect(a).toContain("dir: swingDir(R1, deltaShown, 0)"); // ⭐ the directions' frame by the shown heading; the orbit's angles by their own (`D0`)
    expect(a).toContain("if (st.asmCalm !== null && tf >= 0 && map.facets[tf] !== undefined) st.asmCalm = { n: map.facets[tf]!.n, sH: st.asmCalm.sH, sV: 1, wA: 1 };"); // ⭐ the calm carried into F
    expect(a).toContain("st.asmCalm = tl.exitAcross && nW !== null ? { n: nW, sH: st.asmCalm.sH, sV: 1, wA: 1 } : { ...st.asmCalm, sH: 1, sV: 1 };"); // ⭐ …and out of it
    expect(a).toContain("const holdNow = mouthHold(wasHeld, m0g.mouth, dP, dY);"); // ⭐ build b
    expect(a).toContain('tiltOn(st, "auto", st.asmMouth === null ? null : st.asmMouth.hi);');
    expect(a).toContain("const kH = Math.max(tl !== null && !tl.exitAcross ? tl.k : 0, st.asmCalmWhole);");
    // ⭐⭐⭐ (`1.0.120b-`) the square camera close in: over the calm by `q`, turned at one speed, the gizmo held meanwhile, carried through the tilt's frames
    expect(a).toContain("sq.n = squareTurn(sq.n, sq.target, dtMs, st.cfg.tiltRollDegS, t);");
    expect(a).toContain("const turning = squareTurning(st.asmSquare.n, st.asmSquare.target, st.asmSquare.q);");
    expect(a).toContain("if (sqB.n !== null) sqB.n = mulT(st.asmTilt.dir, sqB.n);");
    expect(a).toContain("if (sqO.n !== null) sqO.n = mulM(D, sqO.n);");
    // ⭐⭐⭐ the roll back's target the world's camera exactly (⛔ a vertical view's heading off its own up: 0 ms, then a 180° flip)
    expect(a).toContain("const hW = calmHeading(anglesOfDir(uOW, cam.yaw).yaw, uOW, uW);");
    expect(a).not.toContain("tiltCarry("); // ⛔ the carry over the edge deleted
    expect(a).toContain("const glide = st.asmMouth !== null ? null : gizmoGlide(st.asmG, st.asmShown === null ? null : wasHeld ? s1 : tiltDir(R, st.asmShown.t.surface), s1, m.hit.point);"); // ⭐ the glide of the depth (held at a mouth: none; let go: straight from the held place)
    expect(code("render/pointer_wiring.ts")).toContain("tiltClampStep(st, yawBefore, vBefore);");
    expect(code("render/green_box_wiring.ts")).toContain("if (tiltClampStep(st, y0, v0)) st.orbitInertia.stop();");
    expect(a).toContain("tl.exit = tiltExits(onFacet, tl.k, tl.swingMs === null, tl.off);"); // ⭐ the world's frame only once the swing is over and the roll whole
    expect(a).toContain("st.asmTiltAuto = tiltAutoLatch(st.asmTiltAuto, approachDistance(st.cfg, st.approach), st.cfg.tiltAutoM);");
    expect(a).toContain("if (autoWas && !st.asmTiltAuto && st.asmTilt !== null && !st.asmTilt.off) {"); // ⭐ out past the threshold: the tilt off
    expect(a).toContain('if (st.asmTiltAuto && st.asmTilt === null) tiltOn(st, "auto", st.asmMouth === null ? null : st.asmMouth.hi);'); // ⭐ (2026-11-10) on the crossing's frame (or at a mouth's floor edge)
    expect(a).not.toContain("st.asmGOff === null) tiltOn"); // ⛔ a glide of the depth held the tilt back — onto the face, not at the edge
    expect(a).toContain("st.orbitUserV = o.v;");
    // ⭐⭐ (the owner: *"fix the gap"*) any face holding a pole, tilted by its own angle — a virtual one (a pole on an edge) too
    expect(a).toContain("const R1 = capTilt(hs, cap.n);");
    // ⭐⭐⭐ the calm made whole by position on the SHOWN direction (never eased): the back-and-forth at a crossing
    expect(a).toContain("const kV = Math.max(tl?.k ?? 0, st.asmCalmWhole, st.asmCalmWholeV);"); // ⭐ (2026-11-10) the vertical share alone toward a top / bottom edge
    expect(a).toContain("st.asmCalmWhole = capYawRelease(q.yaw - st.asmCapYaw0);"); // ⭐ (2026-11-10) over a cap: the side's horizontal calm kept, released by a dx
    expect(a).not.toContain('sh.t.band !== "SIDE") st.asmCalmWhole = 1;'); // ⛔ whole at once on a cap: the withheld yaw released at the edge
    expect(a).toContain("st.asmCalmWhole = wholeShareStep(prev, st.asmCalmWhole, dtMs, st.cfg.gizmoEaseMs);"); // ⭐ the rig's one time law
    expect(a).not.toContain("st.asmTiltAuto) st.asmCalmWhole"); // ⛔ close in only
    expect(a).toContain("if (i >= 0) st.asmCalmWholeV = poleEdgeWhole(sh.t.surface, map.facets[sh.t.stack]!, i === 0, i === col.facets.length - 1, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100);");
    expect(a).not.toContain("if (!cap.real) return;"); // ⭐ the solver's memory turned too (the first probe: the pitch thrown to −90° at the press)
  });
  it("⭐ its two sliders: on / off, and the press's swing (300 ms)", () => {
    expect(DEFAULT_CONFIG.tiltedPole).toBe(1);
    expect("tiltSwingMs" in DEFAULT_CONFIG).toBe(false); // ⛔ one speed for every tilt
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"tiltedPole", 0, 1, 1');
    expect(DEFAULT_CONFIG.tiltRollDegS).toBe(360); // ⭐ (2026-11-10, *"yes"*) a speed, not a time (`tiltRollMinMs` deleted)
    expect(m).toContain('"tiltRollDegS", 0, 1440, 30');
    expect(m).not.toContain('"tiltRollMinMs"');
    expect(DEFAULT_CONFIG.tiltAutoM).toBe(0.6); // the owner's, 2026-11-10 (0.3 m first, then *"correction: set the default at 0.6m"*) (20 % of the far distance before, 30 % before that)
    expect("tiltAutoPct" in DEFAULT_CONFIG).toBe(false);
    expect(m).toContain('"tiltAutoM", 0, 3, 0.05');
  });
});

describe("⭐⭐⭐ (2026-11-10, `1.0.120b-`, the owner: *\"build the square camera close in\"*) THE SQUARE CAMERA'S TURN (`squareTurn`, `squareTurning`)", () => {
  const Dg = Math.PI / 180;
  it("⭐⭐⭐ a vertical edge: 90° at the tilts' speed (360°/s) — a quarter in 62.5 ms, whole in 250 ms, never past; opposite normals about the fallback", () => {
    let n: Vec3 = [0, 0, -1];
    const t: Vec3 = [1, 0, 0];
    n = squareTurn(n, t, 62.5, 360, [0, 1, 0]);
    expect(Math.acos(n[0] * t[0] + n[1] * t[1] + n[2] * t[2]) / Dg).toBeCloseTo(67.5, 6);
    for (let i = 0; i < 10; i++) n = squareTurn(n, t, 62.5, 360, [0, 1, 0]);
    expect(n).toEqual(t);
    const o = squareTurn([0, 0, -1], [0, 0, 1], 125, 360, [0, 1, 0]); // 45° about the fallback
    expect(Math.acos(-o[2]) / Dg).toBeCloseTo(45, 6);
    expect(squareTurn([0, 0, -1], null, 100, 360, [0, 1, 0])).toEqual([0, 0, -1]);
  });
  it("⭐⭐ turning while more than half a degree off its face's normal and the square camera in (q > 0.5): the gizmo held", () => {
    expect(squareTurning([0, 0, -1], [1, 0, 0], 1)).toBe(true);
    expect(squareTurning([0, 0, -1], [0, 0, -1], 1)).toBe(false);
    expect(squareTurning([0, 0, -1], [1, 0, 0], 0.2)).toBe(false);
    expect(squareTurning(null, [1, 0, 0], 1)).toBe(false);
  });
});
