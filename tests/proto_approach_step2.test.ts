/**
 * ⭐⭐⭐ prototype (green box) — APPROACH STEP 2: the commits on the coarse push `w` (`GREEN_PIECE_PHASES.md` §3.2, §3.4; the owner,
 * 2026-10-04): forward at +10 mm (the settle, the latch), backward at −6 (the opposite face, selected), the un-commit below the snap-off
 * keeping the quaternion, the minimum distance below which none of it happens, and the outer-ring visual extension.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  antiAlignedOrientation,
  coarseMinDistance,
  mostAntiAligned,
  nextCommit,
  oppositeFace,
  pieceFaces,
  snapsActive,
  towardSignAt,
  waistParam,
  accumulatePush,
  type CommitMode,
} from "../src/input/green_box";
import { meshTopology } from "../src/core/mesh_topology";
import { dot, qFromAxisAngle, qRotate, type Vec3 } from "../src/core/vec";
import { orbitOffset, elevationGainScale } from "../src/input/orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { SCENE_1 } from "../src/content/scene_1";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const T = { snapOffMm: 6, fwdMm: 10, backMm: 6 };

function frustumFaces() {
  const W = 0.1035 / 2, H = 0.04125 / 2, D = 0.045 / 2;
  const c: Vec3[] = [
    [-W, -H, -D], [W, -H, -D], [W / 2, H, -D / 2], [-W / 2, H, -D / 2],
    [-W, -H, D], [W, -H, D], [W / 2, H, D / 2], [-W / 2, H, D / 2],
  ];
  const tris = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];
  const t = meshTopology(new Float32Array(c.flat()), tris);
  return pieceFaces(t.positions, t.faces);
}

describe("⭐⭐⭐ prototype — approach step 2: the commits", () => {
  it("⭐⭐ the state machine: forward at +10, un-commit below 6 (snaps back on), backward at −6 latched until +10, then un-commit below 6", () => {
    const run = (ws: number[], start: CommitMode = "COARSE", enabled = true) => {
      let mode = start;
      const events: string[] = [];
      for (const w of ws) {
        const s = nextCommit(mode, w, T, enabled);
        if (s.event !== "NONE") events.push(s.event);
        mode = s.mode;
      }
      return { mode, events };
    };
    expect(run([0, 4, 8, 10])).toEqual({ mode: "FORWARD", events: ["FORWARD"] });
    expect(run([10, 8, 6, 5.9])).toEqual({ mode: "COARSE", events: ["FORWARD", "UNCOMMIT"] }); // 6 ≤ w < 10 stays committed
    expect(run([0, -6, 0, 5, 9, 10, 7, 5])).toEqual({ mode: "COARSE", events: ["BACKWARD", "FORWARD", "UNCOMMIT"] });
    // a new press resets w to 0: a forward commit is undone at once (the owner: *"A new press would start the coarse-commit again"*)
    expect(run([10, 0])).toEqual({ mode: "COARSE", events: ["FORWARD", "UNCOMMIT"] });
    // below the minimum distance, COARSE takes no commit
    expect(run([10, -6], "COARSE", false)).toEqual({ mode: "COARSE", events: [] });
  });

  it("⭐ the snaps are on only in COARSE, above the minimum distance, with w below the snap-off", () => {
    expect(snapsActive("COARSE", 0, 6, true)).toBe(true);
    expect(snapsActive("COARSE", 6, 6, true)).toBe(false);
    expect(snapsActive("COARSE", 0, 6, false)).toBe(false);
    expect(snapsActive("FORWARD", 0, 6, true)).toBe(false);
    expect(snapsActive("BACKWARD", -6, 6, true)).toBe(false);
  });

  it("⭐⭐ the faces a commit takes, on a TUMBLED piece: forward the one most against the pink normal, set exactly anti-parallel; backward the opposite", () => {
    const faces = frustumFaces();
    const q = qFromAxisAngle([1, 2, 3], 2.1);
    const n: Vec3 = [0, 0, 1];
    const fwd = mostAntiAligned(faces, q, n);
    const settled = antiAlignedOrientation(faces, fwd, q, n);
    expect(dot(qRotate(settled, faces[fwd]!.normal), n)).toBeCloseTo(-1, 9);
    // opposite: top ↔ bottom, a side ↔ its other side
    const top = faces.findIndex((f) => f.normal[1] > 0.99);
    const bottom = faces.findIndex((f) => f.normal[1] < -0.99);
    expect(oppositeFace(faces, top)).toBe(bottom);
    expect(oppositeFace(faces, bottom)).toBe(top);
    // nothing selected, backward: the face whose normal ALIGNS most with the pink face's (most against −n)
    const away = mostAntiAligned(faces, q, [0, 0, -1]);
    expect(dot(qRotate(q, faces[away]!.normal), n)).toBeGreaterThan(dot(qRotate(q, faces[fwd]!.normal), n));
  });

  it("⭐⭐ the minimum distance: the distance `fwdMm` of dy before the waist, the larger side — computed on a V you can check by hand", () => {
    // d(v) = |v − 0.5| + 0.1, 0.01 of v per mm, 10 mm → 0.1 of v from the waist each side → d = 0.2
    expect(coarseMinDistance((v) => Math.abs(v - 0.5) + 0.1, 0.01, 10)).toBeCloseTo(0.2, 9);
    // lopsided: the steeper side gives the larger distance, and it is the one kept
    expect(coarseMinDistance((v) => (v < 0.5 ? 0.5 - v : 3 * (v - 0.5)) + 0.1, 0.01, 10)).toBeCloseTo(0.4, 9);
    // Scene_1's rings: a finite limit between the waist and the outer rings
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const dMin = coarseMinDistance((v) => orbitOffset(cfg, 0, v, 1).radiusM, cfg.gainOrbitElevation * elevationGainScale(cfg) * cfg.boxGainPitch, cfg.greenCommitFwdMm);
    expect(dMin).toBeGreaterThan(orbitOffset(cfg, 0, 0.5, 1).radiusM);
    expect(dMin).toBeLessThan(orbitOffset(cfg, 0, 1, 1).radiusM);
  });

  it("⭐⭐ the waist on Scene_1's rings lies between the 2nd and 3rd: finger UP (dy < 0) is toward on the 1st/2nd, away on the 3rd/4th", () => {
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const dist = (v: number) => orbitOffset(cfg, 0, v, 1).radiusM;
    const vW = waistParam(dist);
    expect(vW).toBeGreaterThan(0.05);
    expect(vW).toBeLessThan(0.95);
    expect(dist(vW)).toBeLessThan(dist(1));
    expect(dist(vW)).toBeLessThan(dist(0));
    const up = -1; // finger up: a negative screen dy
    expect(towardSignAt(1, vW) * up).toBeGreaterThan(0); // 1st ring: up pushes toward, w rises
    expect(towardSignAt(0, vW) * up).toBeLessThan(0); // 4th ring: up pushes away
  });

  it("⭐⭐ across the waist `w` STAYS and the sense is MIRRORED (the owner: *\"It shall stay but sense is mirrored\"*)", () => {
    // a toward push from the 1st ring (finger up), carried across the waist (0.55) by the orbit, the finger going on up
    let w = 0;
    const ws: number[] = [];
    for (const v of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]) {
      w = accumulatePush(w, towardSignAt(v, 0.55) * -2, 6, 10);
      ws.push(w);
    }
    expect(ws).toEqual([2, 4, 6, 8, 6, 4, 2]); // ⛔ a reset at the crossing reads 8, −2, −4…; a sign latched at the press 10, 10, 10
  });

  it("⭐⭐ wired: the sign re-read EVERY drag step from the ring half, `w` untouched by it; the waist with the minimum distance", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/st\.greenTowardSign = towardSignAt\(st\.orbit\.elevation, st\.greenWaistV\);\s*st\.greenPushMm = accumulatePush\(/);
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.greenWaistV = waistParam\(\(v\) => orbitOffset\(cfg, 0, v, GREEN_PIECE_ORBIT_ZOOM\)\.radiusM\);\s*st\.greenCoarseMinM = coarseMinDistance\(/);
    expect(w).toMatch(/st\.greenCoarseEnabled = coarseEnabled;/);
  });

  it("⭐⭐ wired: one commit step a frame; the events; the un-commit KEEPS the quaternion; the limit recomputed only on a key change; the extension", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const step = nextCommit\(st\.greenCommitMode, st\.greenPushMm, \{ snapOffMm: cfg\.greenSnapOffMm, fwdMm: cfg\.greenCommitFwdMm, backMm: cfg\.greenCommitBackMm \}, coarseEnabled\);/);
    expect(w).toMatch(/if \(key !== st\.greenCoarseMinKey\) \{\s*st\.greenCoarseMinKey = key;\s*st\.greenWaistV = waistParam\([^\n]*\n\s*st\.greenCoarseMinM = coarseMinDistance\(/);
    expect(w.match(/coarseMinDistance\(/g)).toHaveLength(1); // only on a change of what it reads
    expect(w.match(/waistParam\(/g)).toHaveLength(1); // the waist too
    // forward: the selected face, else the one most against n; backward: the opposite, else the one most along n — then selected
    expect(w).toMatch(/\? \(F \?\? mostAntiAligned\(faces, base, n\)\)\s*: F !== null\s*\? oppositeFace\(faces, F\)\s*: mostAntiAligned\(faces, base, \[-n\[0\], -n\[1\], -n\[2\]\]\);/);
    expect(w).toMatch(/st\.pieceTurns\.set\(box, \{ from: cur, to: antiAlignedOrientation\(faces, face, base, n\), t0: now, ms: cfg\.greenSnapEaseMs \}\);/);
    expect(w).toMatch(/if \(step\.event === "BACKWARD"\) selectGreenFaceIndex\(st, face\);/);
    // the un-commit: the snapped turn's stored state dropped, so it restarts FROM THE POSE AS IT IS
    expect(w).toMatch(/if \(step\.event === "UNCOMMIT"\) \{\s*st\.freeTurns\.delete\(box\);/);
    expect(w).toMatch(/if \(atRingEnd && st\.greenPushMm < 0\) k \*= 1 \+ GREEN_BACK_EXTENSION \* Math\.min\(1, -st\.greenPushMm \/ Math\.max\(1e-6, st\.cfg\.greenCommitBackMm\)\);/);
    expect(w).toMatch(/const GREEN_BACK_EXTENSION = 0\.03;/);
  });
});
