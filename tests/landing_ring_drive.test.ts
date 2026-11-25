/**
 * ⭐⭐⭐ (2026-11-24, `ORBIT_SURFACE_READOUT.md` §15 — his word *"make the white ring show what the gizmo uses"*) THE RING SHOWS WHAT THE GIZMO USES:
 * where P2 drives the gizmo (`src.drive` not null) the ring's place, its colour and the HUD's `landing` line are the DRIVEN gizmo's own point and the
 * drive's landing — never the readout from outside; where it does not drive, the readout as built. ⛔ The readout from outside stays `mouthP2`'s.
 * RED first on its mutants (the ring on the readout always; the line ignoring the drive; the drive's point taken as today's) — the design §15.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { landingLine, landingReadoutFrame, mouthP2, ringOf, type GizmoRead, type ReadoutSource } from "../src/render/landing_readout";
import type { SceneState } from "../src/render/scene_state";
import type { FaceMap } from "../src/input/face_map";
import { qFromAxisAngle, type Quat, type Vec3 } from "../src/core/vec";
import type { Landing } from "../src/core/landing_map";
import { bx, toConvex } from "./helpers/surface_shapes";

const M = 0.001;
const LOCAL: Vec3[] = [];
for (const x of [-50, 50]) for (const y of [-10, 10]) for (const z of [-20, 20]) LOCAL.push([x * M, y * M, z * M]);
const RC: Vec3 = [0, 0, 20 * M];
const Q90: Quat = qFromAxisAngle([1, 0, 0], Math.PI / 2);
// a plate (top 40 mm) and a block standing 41 mm proud of it from x = 60 mm: from outside, at x = 11 mm, the 100 mm piece lands on the block
const PLACED = toConvex([bx("plate", -200, 200, 0, 40, -200, 200), bx("block", 60, 200, 40, 81, -200, 200)]);
const MAP = { facets: [{ n: [0, 1, 0], t: [1, 0, 0], b: [0, 0, 1] }] } as unknown as FaceMap;

/** a frame of the game: the readout at the gizmo's place x = 11 mm, the drive answering `drive` */
function frame(drive: { readonly landing: Landing; readonly reach: number } | null, driven: GizmoRead | null) {
  const greenBox = { name: "g" };
  const objects = new Map<string, unknown>([["g", { id: "g", parent: null, local: { position: [0, 0.2, 0], orientation: Q90 }, shape: { points: LOCAL } }]]);
  const st = { cfg: { landingReadout: 1 }, landing: null, greenBox, world: { objects }, orbitPieces: [{ mesh: greenBox, restingCentre: RC }], orbitPiecePlaced: false, frames: 7, sceneSpec: { id: "Scene_1" } } as unknown as SceneState;
  const asked: Vec3[][] = [];
  const src: ReadoutSource = {
    map: () => MAP,
    frame: () => null,
    placed: () => ({ key: "plate|block", parts: PLACED.map((p) => p.points), ids: PLACED.map((p) => p.id) }),
    drive: (_st, n, p) => {
      asked.push([n, p]);
      return drive;
    },
  };
  const today: GizmoRead = { hit: { point: [11 * M, 40 * M, 0] }, t: { stack: 0, normal: [0, 1, 0], surface: [11 * M, 40 * M, 0] } };
  landingReadoutFrame(st, today, today, src, false, driven);
  return { st, sh: st.landing!.shown!, asked };
}
const drivenAt = (y: number): GizmoRead => ({ hit: { point: [11 * M, y * M, 0] }, t: { stack: 0, normal: [0, 1, 0], surface: [11 * M, 40 * M, 0] } });

describe("⭐⭐⭐ V1 — where P2 drives: the ring and the line are the DRIVEN gizmo's (his case: the piece below the block's top, landing on the plate)", () => {
  it("the ring on the driven point, white; the line the drive's part and Δ; the readout from outside kept for `mouthP2`", () => {
    const { st, sh, asked } = frame({ landing: { kind: "land", depth: 40 * M, part: "plate" }, reach: 0 }, drivenAt(40));
    // the drive asked at the gizmo's own place and normal (the world's: no frame)
    expect(asked).toEqual([[[0, 1, 0], [11 * M, 40 * M, 0]]]);
    expect(sh.drive).not.toBeNull();
    expect(sh.drive!.point).toEqual([11 * M, 40 * M, 0]);
    expect(sh.drive!.kind).toBe("land");
    expect(sh.drive!.part).toBe("plate");
    expect(ringOf(sh)).toEqual({ point: [11 * M, 40 * M, 0], nothing: false });
    expect(landingLine(st)).toMatch(/^P2 Δ\+0\.0 mm {2}land plate · /);
    // ⛔ the readout from outside unchanged — the block, 41 mm proud: `mouthP2`'s, never the ring's any more
    expect(sh.readout.kind).toBe("land");
    if (sh.readout.kind === "land") {
      expect(sh.readout.part).toBe("block");
      expect(Math.round((sh.readout.delta / M) * 1e6) / 1e6).toBe(41);
    }
    expect(ringOf(sh).point).not.toEqual(sh.readout.point);
    expect(mouthP2(st)).toBe("closed");
  });
  it("a driven gizmo off today's: Δ = the driven level − today's, the ring on the driven point", () => {
    const { st, sh } = frame({ landing: { kind: "land", depth: 52.5 * M, part: "plate" }, reach: 0 }, drivenAt(52.5));
    expect(Math.round((sh.drive!.delta / M) * 1e9) / 1e9).toBe(12.5);
    expect(ringOf(sh).point).toEqual([11 * M, 52.5 * M, 0]);
    expect(landingLine(st)).toMatch(/^P2 Δ\+12\.5 mm {2}land plate · /);
  });
  it("`nothing`: magenta on the driven point (the facet's plane), the line `P2 nothing`", () => {
    const { st, sh } = frame({ landing: { kind: "nothing" }, reach: 0 }, drivenAt(40));
    expect(ringOf(sh)).toEqual({ point: [11 * M, 40 * M, 0], nothing: true });
    expect(landingLine(st)).toMatch(/^P2 nothing · /);
  });
  it("`inside` / `uncovered`: the gizmo as built — the ring on it, white, the line naming the kind", () => {
    const a = frame({ landing: { kind: "inside", part: "block" }, reach: 0 }, drivenAt(40));
    expect(ringOf(a.sh)).toEqual({ point: [11 * M, 40 * M, 0], nothing: false });
    expect(landingLine(a.st)).toMatch(/^P2 inside block \(the gizmo as built\) · /);
    const b = frame({ landing: { kind: "uncovered" }, reach: 0 }, drivenAt(40));
    expect(landingLine(b.st)).toMatch(/^P2 uncovered \(the gizmo as built\) · /);
  });
});

describe("⭐⭐ V2 — where P2 does NOT drive: the readout as built (from outside)", () => {
  it("the drive null, or no driven gizmo: no `drive`; the ring on the readout's point; the line as built", () => {
    for (const [dl, dv] of [
      [null, drivenAt(40)],
      [{ landing: { kind: "land", depth: 40 * M, part: "plate" }, reach: 0 }, null],
    ] as const) {
      const { st, sh } = frame(dl, dv);
      expect(sh.drive).toBeNull();
      expect(ringOf(sh)).toEqual({ point: sh.readout.point, nothing: false });
      expect(landingLine(st)).toMatch(/^P2 Δ\+41\.0 mm {2}land block · /);
    }
  });
});

describe("⭐ V3 — the wiring: the drive's own call, the driven gizmo handed in", () => {
  it("`READOUT_SOURCE.drive` is `driveGizmoLanding`; the readout gets `mr0` (`driveGizmo`'s result)", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("drive: (st, n, p) => driveGizmoLanding(st, n, p),");
    expect(a).toContain("const mr0 = driveGizmo(st, mrT);");
    expect(a).toContain("READOUT_SOURCE, askHold, mr0);");
  });
});
