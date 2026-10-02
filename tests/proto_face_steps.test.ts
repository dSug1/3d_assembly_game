/**
 * ⭐⭐ prototype (green box) — an orbited piece outside the guide sphere steps through its faces as it orbits in yaw (the owner,
 * 2026-10-02: *"divide the yaw face alignment span by the number of faces … DegreesYawPerFace … DeltaXYawPerFace … every time delta x
 * position accumulates beyond DeltaXYawPerFace, rotate the piece so that the next face is anti-aligned with the normal of the face
 * holding the pink gizmo … all the faces should be anti-aligned once if the piece orbits in yaw over the full yaw face alignment
 * span"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  accumulateFaceSteps,
  antiAlignedOrientation,
  degreesYawPerFace,
  deltaXYawPerFace,
  faceOrder,
  mostAntiAligned,
  pieceFaces,
  type PieceFace,
} from "../src/input/green_box";
import { orbitDegPerMm } from "../src/input/follow_camera";
import { meshTopology } from "../src/core/mesh_topology";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { dot, IDENTITY, qAngle, qconj, qFromAxisAngle, qmul, qRotate, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

// The green piece's shape: a frustum, base 0.1035 × 0.045, top half of it, 0.04125 high — six logical faces.
function frustumFaces(): PieceFace[] {
  const W = 0.1035 / 2, H = 0.04125 / 2, D = 0.045 / 2;
  const c: Vec3[] = [
    [-W, -H, -D], [W, -H, -D], [W / 2, H, -D / 2], [-W / 2, H, -D / 2],
    [-W, -H, D], [W, -H, D], [W / 2, H, D / 2], [-W / 2, H, D / 2],
  ];
  const tris = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];
  const t = meshTopology(new Float32Array(c.flat()), tris);
  return pieceFaces(t.positions, t.faces);
}

describe("⭐⭐ prototype — stepping through the faces as the piece orbits in yaw", () => {
  it("⭐ the span ships at 180° with a slider; DegreesYawPerFace = span ÷ faces; DeltaXYawPerFace = that ÷ the yaw rate", () => {
    expect(DEFAULT_CONFIG.yawFaceAlignSpanDeg).toBe(180);
    expect(code("render/tuning_menu.ts")).toContain('"yawFaceAlignSpanDeg", 30, 720, 15)');
    expect(degreesYawPerFace(180, 6)).toBe(30);
    expect(degreesYawPerFace(180, 0)).toBe(0);
    const rate = orbitDegPerMm(DEFAULT_CONFIG, 0.5).yawDegPerMm; // 5.11 °/mm
    expect(deltaXYawPerFace(30, rate)).toBeCloseTo(30 / rate, 12);
    expect(deltaXYawPerFace(30, 0)).toBe(Infinity);
  });

  it("⭐ the face is the accumulated dx ROUNDED to whole steps: boundaries at ±½, 1½ … steps — the same going and coming back", () => {
    expect(accumulateFaceSteps(0, 2.5, 6)).toEqual({ accMm: 2.5, steps: 0 }); // under half a step: the START face holds
    expect(accumulateFaceSteps(2.5, 1, 6)).toEqual({ accMm: 3.5, steps: 1 }); // past half a step: the next face
    expect(accumulateFaceSteps(3.5, -1, 6)).toEqual({ accMm: 2.5, steps: -1 }); // ⭐ back over the SAME boundary: retraced
    expect(accumulateFaceSteps(0, -3.5, 6).steps).toBe(-1); // the other way, symmetric
    expect(accumulateFaceSteps(0.5, 13, 6).steps).toBe(2); // a fast frame crosses two
    expect(accumulateFaceSteps(1, 5, Infinity)).toEqual({ accMm: 0, steps: 0 });
  });

  it("⭐⭐ the ORDER is a chain of smallest turns from the face anti-aligned now — every face exactly once", () => {
    const faces = frustumFaces();
    expect(faces).toHaveLength(6);
    for (let s = 0; s < faces.length; s++) {
      const o = faceOrder(faces, s);
      expect(o[0]).toBe(s);
      expect(new Set(o).size).toBe(faces.length);
      // each next face is the least turn among those left
      for (let k = 1; k < o.length; k++) {
        const here = faces[o[k - 1]!]!.normal;
        const left = o.slice(k).map((i) => dot(here, faces[i]!.normal));
        expect(dot(here, faces[o[k]!]!.normal)).toBeCloseTo(Math.max(...left), 9);
      }
    }
  });

  it("⭐⭐ orbiting the WHOLE span one way anti-aligns every face once; orbiting back retraces them", () => {
    const faces = frustumFaces();
    const pink: Vec3 = [0, 0, 1];
    let q = qFromAxisAngle([1, 1, 0], 0.4);
    const order = faceOrder(faces, mostAntiAligned(faces, q, pink));
    q = antiAlignedOrientation(faces, order[0]!, q, pink);
    const span = 180;
    const rate = orbitDegPerMm(DEFAULT_CONFIG, 0.5).yawDegPerMm;
    const stepMm = deltaXYawPerFace(degreesYawPerFace(span, faces.length), rate);
    let acc = 0;
    let at = 0;
    const seen = [order[0]!];
    // the orbit in small frames of yaw, 0.7° each, as finger mm (the wiring's conversion)
    for (let yaw = 0; yaw < span - 1e-9; yaw += 0.7) {
      const a = accumulateFaceSteps(acc, Math.min(0.7, span - yaw) / rate, stepMm);
      acc = a.accMm;
      for (let k = 0; k < Math.abs(a.steps); k++) {
        at = (at + Math.sign(a.steps) + order.length) % order.length;
        q = antiAlignedOrientation(faces, order[at]!, q, pink);
        expect(dot(qRotate(q, faces[order[at]!]!.normal), pink)).toBeCloseTo(-1, 9); // exactly anti-parallel
        seen.push(order[at]!);
      }
    }
    // one step per face over the span: the last step lands back on the first (span = faces × DegreesYawPerFace)
    expect(seen).toHaveLength(faces.length + 1);
    expect(new Set(seen.slice(0, faces.length)).size).toBe(faces.length);
    // and back: one face back
    const b = accumulateFaceSteps(acc, -stepMm, stepMm);
    expect(b.steps).toBe(-1);
  });

  it("⭐ each turn is the MINIMAL one onto exact anti-parallel; one already there does not move", () => {
    const faces = frustumFaces();
    const pink: Vec3 = [Math.sin(0.3), 0.2, Math.cos(0.3)];
    const n = Math.hypot(...pink);
    const t: Vec3 = [pink[0] / n, pink[1] / n, pink[2] / n];
    for (const q0 of [IDENTITY, qFromAxisAngle([1, 2, 3], 0.7)]) {
      const i = mostAntiAligned(faces, q0, t);
      const q = antiAlignedOrientation(faces, i, q0, t);
      const before = Math.acos(Math.max(-1, Math.min(1, -dot(qRotate(q0, faces[i]!.normal), t))));
      expect(qAngle(qmul(q, qconj(q0)))).toBeCloseTo(before, 9);
      expect(qAngle(qmul(antiAlignedOrientation(faces, i, q, t), qconj(q)))).toBeCloseTo(0, 9);
    }
  });

  it("⭐⭐ outside the guide sphere the YAW orbit gain is 40 % — and DeltaXYawPerFace grows with it (the owner: *\"reduce the green box yaw orbit gain to 40% of its value\"*)", async () => {
    const { outsideYawShare } = await import("../src/input/green_box");
    expect(DEFAULT_CONFIG.boxGainYawOutsideShare).toBe(0.4);
    expect(code("render/tuning_menu.ts")).toContain('"boxGainYawOutsideShare", 0.05, 1, 0.05)');
    expect(outsideYawShare(true, 0.4)).toBe(0.4);
    expect(outsideYawShare(false, 0.4)).toBe(1);
    const inside = orbitDegPerMm(DEFAULT_CONFIG, 0.5, { yaw: outsideYawShare(false, 0.4), pitch: 1 }).yawDegPerMm;
    const outside = orbitDegPerMm(DEFAULT_CONFIG, 0.5, { yaw: outsideYawShare(true, 0.4), pitch: 1 }).yawDegPerMm;
    expect(outside).toBeCloseTo(0.4 * inside, 12);
    // 30° per face: 5.88 mm of dx inside the rate, 14.7 mm at the outside rate
    expect(deltaXYawPerFace(30, inside)).toBeCloseTo(5.88, 2);
    expect(deltaXYawPerFace(30, outside)).toBeCloseTo(14.69, 2);
    // ⭐ ONE home for the gains: the drag, the face stepping's yaw rate and the HUD all read `greenDragGains`
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/return \{ yaw: g\.yaw \* outsideYawShare\(outside, st\.cfg\.boxGainYawOutsideShare\), pitch: g\.pitch \};/);
    expect(w).toMatch(/const outside = st\.greenBox !== null && st\.faceTracks\.get\(st\.greenBox\)\?\.outside === true;/);
    expect(w).toMatch(/const g = greenDragGains\(st\);\s*const yawDegPerMm = orbitDegPerMm\(st\.cfg, st\.orbit\.elevation, g\)\.yawDegPerMm;/);
    expect(code("render/pointer_wiring.ts")).toMatch(/const g = greenDragGains\(st\);[\s\S]{0,200}st\.orbit\.drag\(-dx \* st\.cfg\.boxGainYaw \* g\.yaw,/);
    expect(code("render/hud_paint.ts")).toMatch(/const g = greenDragGains\(st\);\s*const r = orbitDegPerMm\(st\.cfg, st\.orbit\.elevation, g\);/);
  });

  it("⭐ wired: START anti-aligns the most anti-aligned face; the yaw as finger mm steps the order; the pink face's change slerps; nothing inside", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/order = pink === null \? \[\] : faceOrder\(faces, mostAntiAligned\(faces, cur, pink\)\);/);
    expect(w).toMatch(/const degPerFace = degreesYawPerFace\(st\.cfg\.yawFaceAlignSpanDeg, faces\.length\);/);
    expect(w).toMatch(/const dxPerFaceMm = deltaXYawPerFace\(degPerFace, yawDegPerMm\);/);
    expect(w).toMatch(/accumulateFaceSteps\(accMm, yawDegPerMm > 0 \? dYawDeg \/ yawDegPerMm : 0, dxPerFaceMm\)/);
    expect(w).toMatch(/else if \(pink !== null && prev\.pink !== pink\) turnTo = order\[at\]!;/);
    // inside the sphere: the faces are dropped and NOTHING is turned (no new turn is set before `continue`)
    expect(w).toMatch(/if \(step === "NONE" \|\| step === "STOP"\) \{\s*st\.faceTracks\.set\(m, \{ outside: out, faces: null,[^\n]*\n[^\n]*\n\s*continue;/);
    expect(code("render/green_box_wiring.ts")).toMatch(/if \(face !== null\) st\.pinkFaceNormal = face\.normal;/);
    expect(code("render/pointer_wiring.ts")).toMatch(/st\.pinkFaceNormal = faceWorld\(st\.world, pickedId, faceHit\.faceId\)\?\.normal \?\? st\.pinkFaceNormal;/);
  });
});
