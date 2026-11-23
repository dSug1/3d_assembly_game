/**
 * ⭐⭐⭐ (2026-11-23, package S4 — `ORBIT_SURFACE_DRIVE.md` §6) P2 DRIVES THE GIZMO AND THE SUPPORT — the vectors: V1 the gizmo's level (`driveLevel`: a
 * landing less the piece's reach — the contact; nothing → the plane; a wall → today's); V2 ⑤, no step up (read from where the piece is); V3 the
 * support on P2 = `footprintSupport` round a `Piece44`-like inverted frustum (the gate's own); V4 the split preparation (`landingFor`'s `top`); V5 the
 * switch, the drive's module at 0, the wiring. Each shown RED on its mutant first (`ORBIT_SURFACE_DRIVE.md` §10).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { driveLevel, heldPiece, heldReach, landingAxes, landingFor, landingSupport, prepareHeldSums, prepareLanding, type Landing } from "../src/core/landing_map";
import { qFromAxisAngle, type Quat, type Vec3 } from "../src/core/vec";
import { planeAxes } from "../src/input/contact";
import { footprintSupport, supportTop, SUPPORT_SLACK_M } from "../src/input/footprint";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { driveGizmoLanding, driveKey, driveSupport, landingDriveFrame } from "../src/render/landing_drive";
import type { ReadoutSource } from "../src/render/landing_readout";
import type { SceneState } from "../src/render/scene_state";
import { bx, hullPart, toConvex, type Part } from "./helpers/surface_shapes";

const M = 0.001;
const UP: Vec3 = [0, 1, 0];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const axesOf = (n: Vec3) => {
  const [a, b] = planeAxes(n);
  return landingAxes(n, a, b, null);
};

describe("⭐⭐⭐ V1 — the gizmo's level where P2 drives it (`driveLevel`)", () => {
  const land = (d: number): Landing => ({ kind: "land", depth: d, part: "A" });
  it("a landing → its depth LESS the reach (the contact); nothing → the facet's plane; inside / uncovered → today's", () => {
    expect(driveLevel(land(0.3), 0.05, 0.4, 0.2)).toBeCloseTo(0.25, 12);
    expect(driveLevel({ kind: "nothing" }, 0.05, 0.4, 0.2)).toBe(0.4);
    expect(driveLevel({ kind: "inside", part: "A" }, 0.05, 0.4, 0.2)).toBe(0.2);
    expect(driveLevel({ kind: "uncovered" }, 0.05, 0.4, 0.2)).toBe(0.2);
  });
  // the readout's piece (100 × 20 × 40 mm, its +z face down) against a wall facing +x at x = 0: P2's reference stops 50 mm out, the gizmo ON the wall
  const LOCAL: Vec3[] = [];
  for (const x of [-50, 50]) for (const y of [-10, 10]) for (const z of [-20, 20]) LOCAL.push([x * M, y * M, z * M]);
  const Q: Quat = qFromAxisAngle([1, 0, 0], Math.PI / 2);
  const held = [heldPiece(LOCAL, Q, [0, 0, 20 * M])];
  it("ON A SIDE, the piece AS HELD: the gizmo on the wall (today's level) — its reference half the piece out, as its lift hangs it (§2's correction)", () => {
    const N: Vec3 = [1, 0, 0];
    const prep = prepareLanding(toConvex([bx("W", -200, 0, 0, 400, -200, 200)]), held, axesOf(N));
    const at: Vec3 = [0, 200 * M, 0];
    const l = prep.landingAt(dot(at, prep.frame.u), dot(at, prep.frame.v));
    expect(l.kind).toBe("land");
    expect((l as { depth: number }).depth / M).toBeCloseTo(50, 6);
    expect(driveLevel(l, heldReach(held, N), 0, 0) / M).toBeCloseTo(0, 6);
  });
});

// the green piece of `Scene_1` as a box: 41.3 × 48 × 45 mm, resting face down, its reference the resting face's centre
const GREEN: Vec3[] = [];
for (const x of [-20.65, 20.65]) for (const y of [0, 48]) for (const z of [-22.5, 22.5]) GREEN.push([x * M, y * M, z * M]);
const HELD = [GREEN];
/** a host's top at y 100 mm and a box 41 mm proud on it (x 0 … 60) */
const PROUD: Part[] = [bx("H", -200, 200, 0, 100, -100, 100), bx("P", 0, 60, 100, 141, -40, 40)];

describe("⭐⭐⭐ V2 — ⑤ NO STEP UP: read from where the piece is, a part above it is a wall", () => {
  const prep = prepareLanding(toConvex(PROUD), HELD, axesOf(UP));
  const read = (xMm: number, from?: number) => prep.landingAt(dot([xMm * M, 0, 0], prep.frame.u), dot([xMm * M, 0, 0], prep.frame.v), from);
  it("the piece low beside the proud box (its reference 10 mm over the host, the place 10 mm off the box's edge): a WALL → today's level", () => {
    const l = read(-10, 110 * M + SUPPORT_SLACK_M);
    expect(l.kind).toBe("inside");
    expect(driveLevel(l, 0, 0.1, 0.1)).toBe(0.1);
  });
  it("the same place read from above the box's top (far out): its top — the marker climbs half a piece early, the piece rides the shell", () => {
    const l = read(-10, 200 * M);
    expect(l.kind).toBe("land");
    expect((l as { depth: number }).depth / M).toBeCloseTo(141, 6);
  });
  it("past half a piece from the box (x −25 mm), low: the host's top", () => {
    const l = read(-25, 110 * M + SUPPORT_SLACK_M);
    expect(l.kind).toBe("land");
    expect((l as { depth: number }).depth / M).toBeCloseTo(100, 6);
  });
});

/** a `Piece44`-like part: an inverted frustum on a host's top (y 100 mm) — its small face down (x ±40, z ±26), its wide face up 41 mm (x ±66, z ±52) */
const P44: Part[] = [
  bx("Piece4", -200, 200, 0, 100, -120, 120),
  hullPart("Piece44", [
    ...[-40, 40].flatMap((x) => [-26, 26].map((z): [number, number, number] => [x, 100, z])),
    ...[-66, 66].flatMap((x) => [-52, 52].map((z): [number, number, number] => [x, 141, z])),
  ]),
];

describe("⭐⭐⭐ V3 — THE SUPPORT ON P2 = `footprintSupport` round a `Piece44`-like frustum (the gate: contact range against `Piece44` unchanged)", () => {
  const conv = toConvex(P44);
  const parts = conv.map((p) => p.points);
  const prep = prepareLanding(conv, HELD, axesOf(UP));
  const win = DEFAULT_CONFIG.orbitShellOffsetMm * M;
  it("on a grid of the piece's places round it and of its heights in the window, P2's part and level are today's wherever P2 reads one", () => {
    let compared = 0;
    let walls = 0;
    for (let x = -130.3; x <= 130; x += 4.1)
      for (let z = -110.7; z <= 110; z += 7.3)
        for (const h of [100.6, 101, 112, 130, 140.5, 141.4, 150, 170, 195]) {
          const ref: Vec3 = [x * M, h * M, z * M];
          const l = prep.landingAt(dot(ref, prep.frame.u), dot(ref, prep.frame.v), dot(ref, UP) + SUPPORT_SLACK_M);
          const p2 = landingSupport(l, dot(ref, UP), heldReach(HELD, UP), win);
          if (p2.kind === "today") {
            walls++;
            continue;
          }
          const piece = GREEN.map((p): Vec3 => [ref[0] + p[0], ref[1] + p[1], ref[2] + p[2]]);
          const i = footprintSupport(piece, parts, UP, SUPPORT_SLACK_M, win);
          compared++;
          if (i === null) expect(p2.kind, `${x} ${z} ${h}`).toBe("none");
          else {
            expect(p2.kind, `${x} ${z} ${h}`).toBe("land");
            const s = p2 as { part: string; level: number };
            expect(s.part, `${x} ${z} ${h}`).toBe(conv[i]!.id);
            expect(Math.abs(s.level - supportTop(parts[i]!, UP)), `${x} ${z} ${h}`).toBeLessThan(1e-9);
          }
        }
    expect(compared).toBeGreaterThan(3000);
    expect(walls).toBeGreaterThan(100); // the overhang beside a piece lower than its wide top: a wall, today's rule
  });
  it("beyond the window (the piece's reference 70 mm over the host's top, far from the frustum): no support", () => {
    const ref: Vec3 = [-170 * M, 170 * M, 0];
    const l = prep.landingAt(dot(ref, prep.frame.u), dot(ref, prep.frame.v), dot(ref, UP) + SUPPORT_SLACK_M);
    expect(landingSupport(l, dot(ref, UP), 0, win).kind).toBe("none");
  });
});

describe("⭐⭐ V4 — the split preparation: `landingFor`'s `top` (read from above it = read from outside)", () => {
  const conv = toConvex(P44);
  for (const n of [UP, [1, 0, 0], [0, 0, -1], [0.6, 0.8, 0]] as Vec3[]) {
    it(`along (${n.join(", ")}): every landing from outside is at or under \`top\`, and reading from \`top\` gives the same landing`, () => {
      const p = landingFor(prepareHeldSums(conv, HELD), axesOf(n));
      let seen = -Infinity;
      for (let a = -0.25; a <= 0.25; a += 0.0071)
        for (let b = -0.25; b <= 0.25; b += 0.0067) {
          const out = p.landingAt(a, b);
          const fromTop = p.landingAt(a, b, p.top);
          expect(fromTop).toEqual(out);
          if (out.kind === "land") seen = Math.max(seen, out.depth);
        }
      expect(seen).toBeLessThanOrEqual(p.top + 1e-12);
      expect(p.top - seen).toBeLessThan(0.01); // tight: the grid's step reaches within 10 mm of the extreme
    });
  }
});

describe("⭐⭐ V5 — the switch, the drive's module, the wiring", () => {
  it("`landingDrives`: default 2; 0, 1, 2 valid, 3 refused", () => {
    expect(DEFAULT_CONFIG.landingDrives).toBe(2);
    for (const v of [0, 1, 2]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, landingDrives: v })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, landingDrives: 3 })).toThrow(/landingDrives/);
  });
  const stub = (cfg: Record<string, number>, scene = "Scene_1") => {
    const greenBox = { name: "g" };
    const objects = new Map<string, unknown>([["g", { id: "g", parent: null, local: { position: [0, 0.2, 0], orientation: [1, 0, 0, 0] }, shape: { points: GREEN } }]]);
    return { cfg, landingDrive: null, greenBox, world: { objects }, orbitPieces: [{ mesh: greenBox, restingCentre: [0, 0, 0] }], orbitPiecePlaced: false, frames: 5, sceneSpec: { id: scene }, pieceHoldPrev: { anchor: [-10 * M, 110 * M, 0], approach: 0 } } as unknown as SceneState;
  };
  const conv = toConvex(PROUD);
  const src: ReadoutSource = { map: () => null, frame: () => null, placed: () => ({ key: "k", parts: conv.map((p) => p.points), ids: conv.map((p) => p.id) }) };
  it("at 0 NOTHING is prepared nor read (as deployed); in another scene neither", () => {
    for (const [cfg, scene] of [[{ landingDrives: 0 }, "Scene_1"], [{ landingDrives: 2 }, "Scene_2"]] as const) {
      const st = stub(cfg, scene);
      landingDriveFrame(st, src);
      expect(st.landingDrive).toBe(null);
      expect(driveGizmoLanding(st, UP, [0, 0, 0])).toBe(null);
      expect(driveSupport(st, UP, [0, 0.11, 0], 0.06)).toBe(null);
      expect(driveKey(st)).toBe("");
    }
  });
  it("at 1 the support only; at 2 the gizmo too — read from LAST frame's solved anchor (`pieceHoldPrev`): beside the proud box, low, a wall", () => {
    const s1 = stub({ landingDrives: 1 });
    landingDriveFrame(s1, src);
    expect(driveGizmoLanding(s1, UP, [-10 * M, 0, 0])).toBe(null);
    expect(driveSupport(s1, UP, [-30 * M, 110 * M, 0], 0.06)).toEqual({ kind: "land", part: "H", level: expect.closeTo(0.1, 9) });
    expect(driveSupport(s1, UP, [-10 * M, 110 * M, 0], 0.06)).toEqual({ kind: "today" }); // ⑤ beside the proud box, low: a wall — never its top
    const s2 = stub({ landingDrives: 2 });
    landingDriveFrame(s2, src);
    expect(driveGizmoLanding(s2, UP, [-10 * M, 0, 0])?.landing.kind).toBe("inside");
    expect(driveGizmoLanding(s2, UP, [-30 * M, 0, 0])?.landing).toEqual({ kind: "land", depth: expect.closeTo(0.1, 9), part: "H" });
    expect(driveKey(s2)).toMatch(/:0\.1105$/); // F below the box's top: its level in the sections' key
  });
  it("a frame not started by `landingDriveFrame` reads nothing (one `F` a frame)", () => {
    const st = stub({ landingDrives: 2 });
    landingDriveFrame(st, src);
    (st as { frames: number }).frames = 6;
    expect(driveGizmoLanding(st, UP, [-10 * M, 0, 0])).toBe(null);
  });
  const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const A = strip(readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8")).replace(/\s+/g, " ");
  it("the wiring: `F` before the support; the gizmo = today's driven; the readout fed today's; the support through `supportOf` (twice); the lines' key", () => {
    expect(A.indexOf("landingDriveFrame(st, READOUT_SOURCE);")).toBeGreaterThan(0);
    expect(A.indexOf("landingDriveFrame(st, READOUT_SOURCE);")).toBeLessThan(A.indexOf("supportFrame(st, dtMs);"));
    expect(A).toContain("return driveGizmo(st, rawGizmoToday(st, yaw, pitch));");
    expect(A).toContain("const mrT = rawGizmoToday(st, mq.yaw, mq.pitch); const mr0 = driveGizmo(st, mrT);");
    expect(A).toContain("landingReadoutFrame(st, mrT, mr0 === mrT ? m0g : gizmoOf(st, mq.yaw, mq.pitch, mrT), READOUT_SOURCE,");
    expect(A.split("supportOf(st, ").length - 1).toBe(2);
    expect(A.split("footprintSupport(").length - 1).toBe(1);
    expect(A).toContain("const optKey = `${o.edgeMm}|${o.edgeDeg}|${driveKey(st)}`;");
  });
  it("the menu: the slider under GIZMO & SECTIONS", () => {
    const m = readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8");
    expect(m).toContain('"landingDrives", 0, 2, 1)');
  });
});
