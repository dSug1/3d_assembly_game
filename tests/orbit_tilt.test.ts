// ⭐⭐⭐ (2026-11-10, POLAR_ORBIT_CLEANUP.md §9.4) THE TILTED POLE — a press on a cap tilts the orbit so the cap is a side (the owner's decisions 1 (c),
// 2 (a), 3 (a), 4 the "no camera roll" rule removed). RED against `46d24db`: `src/input/orbit_tilt.ts` and the wiring (`tiltOnPress`, `tiltOff`) absent.
// ⭐ The cube's fixture is the REAL specimen (the 240 faces the page fed to `buildFaceMap`, 2026-11-09).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { anglesOfDir, capTilt, exitShare, frameMix, headingTurn, mulM, mulT, rollStep, snapHeading, swingDir, tiltBox, tiltCalmWhole, tiltFaces, type Mat3 } from "../src/input/orbit_tilt";
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
      const top = capTilt(hs, true);
      const bot = capTilt(hs, false);
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
          const R = capTilt(hs, top);
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
    const R = capTilt(hs, true);
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
  const R = capTilt(hs, true);
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

  it("⭐⭐⭐ THE EXIT'S SHARE (3 (a)): 0 in the facet's middle, rising through its edge band to 1 at the edge — toward a side (dx) and toward a cap (dy)", () => {
    const col = map.columns.find((c) => c.facets.includes(fi))!;
    expect(exitShare(map, col.mid, 0, fi, opts)).toBe(0);
    let last = 0;
    for (let f = 0.6; f <= 1.0001; f += 0.02) {
      const k = exitShare(map, col.mid + f * col.hw - 1e-9, 0, fi, opts);
      expect(k).toBeGreaterThanOrEqual(last - 1e-12);
      last = k;
    }
    expect(last).toBeGreaterThan(0.999);
    expect(exitShare(map, col.mid + 0.5 * col.hw, 0, fi, opts)).toBe(0);
    const hi = col.bounds[col.bounds.length - 1]!;
    expect(exitShare(map, col.mid, hi - 1e-9, fi, opts)).toBeGreaterThan(0.999);
    expect(exitShare(map, col.mid, hi - 12 * D, fi, opts)).toBe(0);
  });
});

describe("⭐⭐ the calm on the tilted facet whole toward EVERY edge (each a frame change) over its own edge zones (`tiltCalmWhole`)", () => {
  const f = { b: [0, 1, 0] as Vec3, bLo: 0, bHi: 0.4 };
  const z = { zoneHPct: 25, zoneMinHM: 0.03, zoneVPct: 25, zoneMinVM: 0.03 };
  const at = (L: number, y: number) => ({ surface: [0, y, 0] as Vec3, across: { L, lo: 0, hi: 0.4 } });
  it("⭐ 0 in the middle; 1 at any edge (across or up); rising smoothly through the zone (a quarter of the run), never a step", () => {
    expect(tiltCalmWhole(at(0.2, 0.2), f, z)).toBe(0);
    expect(tiltCalmWhole(at(0, 0.2), f, z)).toBe(1);
    expect(tiltCalmWhole(at(0.2, 0.4), f, z)).toBe(1);
    let last = 0;
    for (let y = 0.2; y <= 0.4 + 1e-12; y += 0.005) {
      const p = tiltCalmWhole(at(0.2, y), f, z);
      expect(p).toBeGreaterThanOrEqual(last - 1e-12);
      expect(p - last).toBeLessThan(0.1);
      last = p;
    }
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

describe("⭐⭐ wired", () => {
  it("⭐⭐⭐ the press tilts (`tiltOnPress`, a first press alone), the frame's every direction through `dirFrame`, the map built in F, the exit back to the world (`tiltOff`), the camera's roll by the exit's share", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("if (assemblyOn(st) && holdRole === null && e.pointerId !== MOUSE_SECOND_ID && st.router.all().length === 1) tiltOnPress(st);");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("buildFaceMap(tiltFaces(placedFaces(st), R), tiltBox(box, R),");
    expect(a).toContain("turnAngles(st, (d) => mulT(D0, d));");
    expect(a).toContain("turnAngles(st, (d) => mulM(D, d));");
    expect(a).toContain("const mix = frameMix(f, offsetFrame(uW, hW, o.yawRad, o.pitchRad), tl.k, tl.axis);");
    expect(a).toContain("tl.kT = map === null ? 0 : exitShare(map, mq.yaw, mq.pitch, tl.facet, mapOpts(st));");
    expect(a).toContain("const g = m === null ? gizmoFor(st) : withGOff(st, m.hit.point);");
    expect(a).toContain("tl.k = rollStep(tl.k, tl.kT, dtMs, st.cfg.tiltRollMinMs);");
    expect(a).toContain("tl.exit = stack !== tl.facet && tl.k >= 1;"); // ⭐ the world's frame only once the roll shown is whole
    expect(a).toContain("st.orbitUserV = o.v;"); // ⭐ the solver's memory turned too (the first probe: the pitch thrown to −90° at the press)
  });
  it("⭐ its two sliders: on / off, and the press's swing (300 ms)", () => {
    expect(DEFAULT_CONFIG.tiltedPole).toBe(1);
    expect(DEFAULT_CONFIG.tiltSwingMs).toBe(300);
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"tiltedPole", 0, 1, 1');
    expect(m).toContain('"tiltSwingMs", 0, 1000, 25');
    expect(DEFAULT_CONFIG.tiltRollMinMs).toBe(250);
    expect(m).toContain('"tiltRollMinMs", 0, 2000, 25');
  });
});
