/**
 * ⭐⭐ prototype (green box) — an orbited piece outside the guide sphere steps through its faces as it orbits in yaw (the owner,
 * 2026-10-02: *"divide the yaw face alignment span by the number of faces … DegreesYawPerFace … DeltaXYawPerFace … every time delta x
 * position accumulates beyond DeltaXYawPerFace, rotate the piece so that the next face is anti-aligned with the normal of the face
 * holding the pink gizmo … all the faces should be anti-aligned once if the piece orbits in yaw over the full yaw face alignment
 * span"*) — and since 2026-10-03 through a YAW cycle, then a PITCH cycle, then yaw again (*"order the logical faces as a chain of
 * yaw turns … when the cycle of yaw turns has finished (once the initial face came back) switch to a cycle of pitch turns"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  accumulateFaceSteps,
  antiAlignedOrientation,
  degreesYawPerFace,
  deltaXYawPerFace,
  cycleStep,
  faceCycles,
  mostAntiAligned,
  cycleTargets,
  targetAtStep,
  turnAbout,
  turnAxes,
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
    expect(DEFAULT_CONFIG.yawFaceAlignSpanDeg).toBe(75); // the owner, 2026-10-03: one span for both modes (was 180)
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

  // ⭐ the green piece outside the sphere, the pink face looking along +z (its normal), the piece turned a little at START
  const startPose = () => {
    const faces = frustumFaces();
    const pink: Vec3 = [0, 0, 1];
    const cur = qFromAxisAngle([0.2, 1, 0.1], 0.3);
    const start = mostAntiAligned(faces, cur, pink);
    const q0 = antiAlignedOrientation(faces, start, cur, pink);
    const axes = turnAxes(pink, [0, 1, 0], [0, 0, -1])!;
    return { faces, pink, start, q0, axes, cycles: faceCycles(faces, q0, start, pink, axes) };
  };
  const along = (faces: PieceFace[], i: number): number => [0, 1, 2].reduce((b, k) => (Math.abs(faces[i]!.normal[k]!) > Math.abs(faces[i]!.normal[b]!) ? k : b), 0);

  it("⭐⭐ two cycles from the START face (the owner, 2026-10-03): YAW = it, a side, the opposite face, the other side; PITCH = it, the top, the opposite face, the bottom", () => {
    const { faces, start, cycles, axes } = startPose();
    expect(faces).toHaveLength(6);
    // the axes: yaw the world vertical, pitch across the pink normal
    expect(axes.yaw[1]).toBeCloseTo(1, 9);
    expect(Math.abs(axes.pitch[0])).toBeCloseTo(1, 9);
    expect(cycles.yaw).toHaveLength(4);
    expect(cycles.pitch).toHaveLength(4);
    expect(cycles.yaw[0]).toBe(start);
    expect(cycles.pitch[0]).toBe(start);
    const opposite = faces.findIndex((_, i) => i !== start && along(faces, i) === along(faces, start));
    // the opposite face is HALF-WAY round both cycles
    expect(cycles.yaw[2]).toBe(opposite);
    expect(cycles.pitch[2]).toBe(opposite);
    // yaw's other two are the sides (mostly along x), pitch's the top and the bottom (mostly along y)
    for (const i of [cycles.yaw[1]!, cycles.yaw[3]!]) expect(along(faces, i)).toBe(0);
    for (const i of [cycles.pitch[1]!, cycles.pitch[3]!]) expect(along(faces, i)).toBe(1);
    // every face is reached
    expect(new Set([...cycles.yaw, ...cycles.pitch]).size).toBe(6);
  });

  it("⭐⭐ the sequence: the yaw cycle until the start face is back, THEN the pitch cycle, then yaw again — and back the same way", () => {
    const { cycles, start } = startPose();
    const seq = Array.from({ length: 17 }, (_, k) => cycleStep(cycles, k));
    expect(seq.map((x) => x.face)).toEqual([...cycles.yaw, ...cycles.pitch, ...cycles.yaw, ...cycles.pitch, start]);
    expect(seq.map((x) => x.cycle).slice(0, 9)).toEqual(["YAW", "YAW", "YAW", "YAW", "PITCH", "PITCH", "PITCH", "PITCH", "YAW"]);
    // backward from START: the pitch cycle, retraced
    expect([-1, -2, -3, -4].map((k) => cycleStep(cycles, k).face)).toEqual([cycles.pitch[3], cycles.pitch[2], cycles.pitch[1], start]);
  });

  it("⭐⭐ every face's orientation is computed ONCE from the START pose: each EXACTLY anti-parallel, the yaw cycle keeping the top up, the pitch cycle the sides level — and every lap comes back exactly", () => {
    const { faces, pink, q0, axes, cycles } = startPose();
    const targets = cycleTargets(faces, q0, pink, axes, cycles);
    const topIdx = faces.findIndex((f) => f.normal[1] > 0.99);
    const sideIdx = faces.findIndex((f) => f.normal[0] > 0.8);
    for (let k = 0; k < 4; k++) {
      expect(dot(qRotate(targets.yaw[k]!, faces[cycles.yaw[k]!]!.normal), pink)).toBeCloseTo(-1, 9);
      expect(dot(qRotate(targets.pitch[k]!, faces[cycles.pitch[k]!]!.normal), pink)).toBeCloseTo(-1, 9);
      // a yaw turn leaves the top up (within the frustum's own slants); a pitch turn leaves the sides across the pitch axis
      expect(qRotate(targets.yaw[k]!, faces[topIdx]!.normal)[1]).toBeGreaterThan(0.8);
      expect(Math.abs(dot(qRotate(targets.pitch[k]!, faces[sideIdx]!.normal), axes.pitch))).toBeGreaterThan(0.8);
    }
    // the steps walk those orientations; the start face's is the START pose itself, on every lap, either way
    for (const st of [0, 8, 16, -8]) expect(targetAtStep(cycles, targets, st)).toBe(q0);
    expect(targetAtStep(cycles, targets, 1)).toBe(targets.yaw[1]);
    expect(targetAtStep(cycles, targets, 5)).toBe(targets.pitch[1]);
    expect(targetAtStep(cycles, targets, -1)).toBe(targets.pitch[3]);
    // ⛔ step upon step (each turn from the last) piled up the corrections: an axis moved 66° in one step, the lap not closing
    let q = q0;
    for (let st = 0; st < 4; st++) q = turnAbout(faces, cycles.yaw[(st + 1) % 4]!, q, pink, axes.yaw, true);
    expect(qAngle(qmul(q, qconj(q0)))).toBeGreaterThan(0.05);
  });

  it("⭐ a half-turn goes about the CYCLE's axis — ⛔ not the minimal turn's arbitrary one — and a vertical pink normal falls back to the camera", () => {
    const { faces, pink, q0, axes, cycles } = startPose();
    const opposite = cycles.yaw[2]!;
    const viaYaw = turnAbout(faces, opposite, q0, pink, axes.yaw, true);
    const topIdx = faces.findIndex((f) => f.normal[1] > 0.99);
    // a yaw half-turn keeps the top on top
    expect(qRotate(viaYaw, faces[topIdx]!.normal)[1]).toBeGreaterThan(0.85);
    const viaPitch = turnAbout(faces, opposite, q0, pink, axes.pitch, true);
    // a pitch half-turn puts it underneath
    expect(qRotate(viaPitch, faces[topIdx]!.normal)[1]).toBeLessThan(-0.85);
    // the pink ring on a TOP face: no vertical to yaw about — the fallback stands in, still perpendicular to the normal
    const up = turnAxes([0, 1, 0], [0, 1, 0], [0, 0, -1])!;
    expect(dot(up.yaw, [0, 1, 0])).toBeCloseTo(0, 9);
    expect(dot(up.pitch, [0, 1, 0])).toBeCloseTo(0, 9);
    expect(turnAxes([0, 1, 0], [0, 1, 0], [0, 1, 0])).toBeNull();
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
    expect(DEFAULT_CONFIG.boxGainYawOutsideShare).toBe(0.4); // the owner, 2026-10-03: back to 0.4 (0.2 for a while)
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
    // ⭐ since 2026-10-03: while the green piece is HELD for orbit, wherever it is (`greenHeldForOrbit`)
    expect(w).toMatch(/const outside = st\.greenBox !== null && greenHeldForOrbit\(st\.greenOrbitPointer\);/);
    expect(w).toMatch(/const g = greenDragGains\(st\);\s*const yawDegPerMm = orbitDegPerMm\(st\.cfg, st\.orbit\.elevation, g\)\.yawDegPerMm;/);
    expect(code("render/pointer_wiring.ts")).toMatch(/const g = greenDragGains\(st\);[\s\S]{0,200}st\.orbit\.drag\(-dx \* st\.cfg\.boxGainYaw \* g\.yaw,/);
    expect(code("render/hud_paint.ts")).toMatch(/const g = greenDragGains\(st\);\s*const r = orbitDegPerMm\(st\.cfg, st\.orbit\.elevation, g\);/);
  });

  it("⭐ OBJECT ROTATION holds three submenus — every old slider under ROTATION IN WORLD COORDINATES, the FacesRotateByIncrement toggle under DOUBLE ORBIT MODE, then GREEN PIECE ROTATION (the owner, 2026-10-03)", () => {
    const menu = code("render/tuning_menu.ts");
    const sec = menu.slice(menu.indexOf('title: "OBJECT ROTATION"'), menu.indexOf('title: "FACE ALIGNMENT"'));
    expect(sec).toMatch(/title: "OBJECT ROTATION",[\s\S]*?sliders: \[\],\s*subsections: \[/);
    const world = sec.slice(sec.indexOf('"ROTATION IN WORLD COORDINATES"'), sec.indexOf('"DOUBLE ORBIT MODE"'));
    for (const key of ["gainRotateFree", "pitchSideConeDeg", "gainRotateConstrained", "rotationIncrementDeg", "rotateSwayDeg", "rotateSwayTauMs", "rotateSwayTurnDeg", "rotateSwayReferenceDegPerS"])
      expect(world).toContain(`"${key}"`);
    expect(sec.slice(sec.indexOf('"DOUBLE ORBIT MODE"'))).toContain('"facesRotateByIncrement", 0, 1, 1)');
    expect(DEFAULT_CONFIG.facesRotateByIncrement).toBe(0); // the owner, 2026-10-03: off by default (the continuous turn); on = the face cycles
    // ⭐ off: the face cycles do not run — dx turns the piece continuously instead (`tests/proto_green_rotation.test.ts`)
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/if \(!freeMode && !cyclesStart && step === "KEEP"/);
    // ⭐ and a third submenu, GREEN PIECE ROTATION, for that continuous turn
    expect(sec.indexOf('"GREEN PIECE ROTATION"')).toBeGreaterThan(sec.indexOf('"DOUBLE ORBIT MODE"'));
  });

  it("⭐ wired: START anti-aligns the most anti-aligned face; the yaw as finger mm steps the order; the pink face's change slerps; nothing inside", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const start = mostAntiAligned\(faces, cur, pink\);\s*target = antiAlignedOrientation\(faces, start, cur, pink\);\s*cycles = axes === null \? \{ yaw: \[start\], pitch: \[start\] \} : faceCycles\(faces, target, start, pink, axes\);/);
    expect(w).toMatch(/targets = axes === null \? \{ yaw: \[target\], pitch: \[target\] \} : cycleTargets\(faces, target, pink, axes, cycles\);/);
    expect(w).toMatch(/s \+= a\.steps;\s*target = targetAtStep\(cycles, targets, s\);/);
    // ⭐ the span covers ONE yaw + pitch period (the owner, 2026-10-03): shared among its steps, not among the faces
    expect(w).toMatch(/const degPerFace = degreesYawPerFace\(st\.cfg\.yawFaceAlignSpanDeg, cycles\.yaw\.length \+ cycles\.pitch\.length\);/);
    const { cycles } = startPose();
    expect(degreesYawPerFace(180, cycles.yaw.length + cycles.pitch.length)).toBe(22.5);
    expect(w).toMatch(/const dxPerFaceMm = deltaXYawPerFace\(degPerFace, yawDegPerMm\);/);
    expect(w).toMatch(/accumulateFaceSteps\(accMm, yawDegPerMm > 0 \? dYawDeg \/ yawDegPerMm : 0, dxPerFaceMm\)/);
    // the pink face changed: the face anti-aligned now slerps onto it, and the cycles START again from there
    expect(w).toMatch(/const now0 = cycleStep\(cycles, s\)\.face;\s*target = antiAlignedOrientation\(faces, now0, base, pink\);/);
    // inside the sphere: the faces are dropped and NOTHING is turned (no new turn is set before `continue`)
    expect(w).toMatch(/if \(step === "NONE" \|\| step === "STOP"\) \{\s*st\.faceTracks\.set\(m, \{ outside: out, faces: null,[^\n]*\n[^\n]*\n\s*continue;/);
    expect(code("render/green_box_wiring.ts")).toMatch(/if \(face !== null\) st\.pinkFaceNormal = face\.normal;/);
    expect(code("render/pointer_wiring.ts")).toMatch(/st\.pinkFaceNormal = faceWorld\(st\.world, pickedId, faceHit\.faceId\)\?\.normal \?\? st\.pinkFaceNormal;/);
  });
});
