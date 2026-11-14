// ⭐⭐⭐ (2026-11-14, the owner: "the piece still snaps 180 degrees diagonally before the camera realignment brings the piece back to its position") —
// a polar zone's turn (its switch, the spit's crossing) turns the camera ABOUT THE PIECE (`poseAboutPiece`): the piece holds its place on the glass.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { poseAboutPiece, rotateAbout, type CamPose } from "../src/input/orbit_tilt";
import type { Vec3 } from "../src/core/vec";

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
/** the piece on the glass: its direction from the eye in the camera's right / up over its forward (a tangent pair) */
function onGlass(p: CamPose, piece: Vec3): [number, number] {
  const f = unit(sub(p.look, p.eye));
  const r = unit(cross(p.up, [-f[0], -f[1], -f[2]]));
  const u = cross([-f[0], -f[1], -f[2]], r);
  const v = sub(piece, p.eye);
  return [dot(v, r) / dot(v, f), dot(v, u) / dot(v, f)];
}
const close = (a: Vec3, b: Vec3, eps = 1e-9): void => {
  for (let i = 0; i < 3; i++) expect(a[i]!).toBeCloseTo(b[i]!, -Math.log10(eps));
};
/** the pose `p` turned by `th` about the line through `c` along `ax` (a rigid turn of the whole camera) */
const turned = (p: CamPose, c: Vec3, ax: Vec3, th: number): CamPose => {
  const at = (q: Vec3): Vec3 => {
    const r = rotateAbout(sub(q, c), ax, th);
    return [c[0] + r[0], c[1] + r[1], c[2] + r[2]];
  };
  return { eye: at(p.eye), look: at(p.look), up: rotateAbout(p.up, ax, th) };
};

// far out, as on Scene_0bis: the camera 7.7 m from its look point, the piece 1.3 m in front of it, off the glass's centre
const piece: Vec3 = [0.3, 6.2, -0.4];
const A: CamPose = { eye: [0, 7.5, 0], look: [0, 0, 0.5], up: [0, 0.07, 1] };

describe("the camera turned about the piece (a polar zone's turn)", () => {
  it("starts on the pose shown and ends on the new one, exactly", () => {
    const B = turned(A, piece, unit([0.1, 1, 0.2]), 2.9);
    const r0 = poseAboutPiece(A, B, piece, 0, null).pose;
    close(r0.eye, A.eye);
    close(unit(sub(r0.look, r0.eye)), unit(sub(A.look, A.eye)));
    const r1 = poseAboutPiece(A, B, piece, 1, null).pose;
    close(r1.eye, B.eye, 1e-7);
    close(r1.look, B.look, 1e-7);
    // the up square to the view (as the camera's stage squares it after, `upSquareToView`)
    const fB = unit(sub(B.look, B.eye));
    const kB = dot(B.up, fB);
    close(unit(r1.up), unit([B.up[0] - kB * fB[0], B.up[1] - kB * fB[1], B.up[2] - kB * fB[2]]), 1e-7);
  });

  it("a half turn about the piece: the piece holds its place on the glass all the way (⛔ about the view: round the glass's centre)", () => {
    const B = turned(A, piece, unit(sub(A.look, A.eye)), Math.PI * 0.999);
    const g0 = onGlass(A, piece);
    expect(Math.hypot(g0[0], g0[1])).toBeGreaterThan(0.05); // off the centre
    let hint: Vec3 | null = null;
    for (let i = 0; i <= 20; i++) {
      const r = poseAboutPiece(A, B, piece, i / 20, hint);
      hint = r.axis;
      const g = onGlass(r.pose, piece);
      expect(g[0]).toBeCloseTo(g0[0], 9);
      expect(g[1]).toBeCloseTo(g0[1], 9);
    }
  });

  it("the piece's place changed (the view's offsets turned with the heading): a straight glide, never through the opposite corner", () => {
    // B: the half turn about the view through the look point — the piece lands on the other side of the centre
    const B = turned(A, A.look, unit(sub(A.look, A.eye)), Math.PI * 0.95);
    const ga = onGlass(A, piece);
    const gb = onGlass(B, piece);
    let hint: Vec3 | null = null;
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      const r = poseAboutPiece(A, B, piece, k, hint);
      hint = r.axis;
      const g = onGlass(r.pose, piece);
      // on the straight segment from its old place to its new one (the camera coordinates blended: the tangents within the chord's bulge)
      const t = [ga[0] + (gb[0] - ga[0]) * k, ga[1] + (gb[1] - ga[1]) * k];
      expect(Math.hypot(g[0] - t[0]!, g[1] - t[1]!)).toBeLessThan(0.02);
    }
  });

  it("the piece still moving through the turn (its spring catching up, 1.7 m far out): the camera follows it, the piece holds its place on the glass", () => {
    const B = turned(A, piece, unit(sub(A.look, A.eye)), Math.PI * 0.999);
    const a: CamPose = { ...A, piece }; // the pose on the glass drew the piece HERE
    const g0 = onGlass(A, piece);
    let hint: Vec3 | null = null;
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      const now: Vec3 = [piece[0], piece[1] - 0.1 * k, piece[2] + 1.7 * k]; // the piece moved on since
      const shift = sub(now, piece);
      const Bk: CamPose = { eye: [B.eye[0] + shift[0], B.eye[1] + shift[1], B.eye[2] + shift[2]], look: [B.look[0] + shift[0], B.look[1] + shift[1], B.look[2] + shift[2]], up: B.up };
      const r = poseAboutPiece(a, Bk, now, k, hint);
      hint = r.axis;
      const g = onGlass(r.pose, now);
      expect(g[0]).toBeCloseTo(g0[0], 9);
      expect(g[1]).toBeCloseTo(g0[1], 9);
    }
  });

  it("past the half turn the way is kept (the hint): the angle grows beyond 180°, never a jump back the short way", () => {
    const ax = unit(sub(A.look, A.eye));
    const B1 = turned(A, piece, ax, Math.PI * 0.9);
    const r1 = poseAboutPiece(A, B1, piece, 0.5, null);
    const B2 = turned(A, piece, ax, Math.PI * 1.1); // the target moved on past 180° (its shortest way now the other way round)
    const r2 = poseAboutPiece(A, B2, piece, 0.5, r1.axis);
    expect(r2.angle).toBeCloseTo(Math.PI * 1.1, 9);
    expect(dot(r2.axis!, r1.axis!)).toBeGreaterThan(0.99);
  });

  it("wired: the zone's switch and the spit's crossing start from the pose on the glass; the camera's stage turns it about the piece", () => {
    const aw = readFileSync("src/render/assembly_wiring.ts", "utf8");
    const gb = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(aw).toContain("st.asmZoneMix = st.asmCamLast === null ? null : { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null };");
    expect(aw).toContain("if (st.asmCamLast !== null) st.asmZoneMix = { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null };");
    expect(aw).toContain("const r = poseAboutPiece(zm.from, to, piece, zm.k, zm.axis);");
    expect(gb).toContain("const zp = zoneMixPose(st, pp, camAt, lookAt, camFrame.up);");
  });
});
