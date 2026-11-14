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
    expect(aw).toContain("st.asmZoneMix = st.asmCamLast === null ? null : { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null, rule: 0, keep: null, done: 0 };");
    expect(aw).toContain("if (st.asmCamLast !== null) st.asmZoneMix = { from: poseShown(st), k: 0, rad: Math.PI / 2, axis: null, rule: 0, keep: null, done: 0 };");
    // ⭐⭐⭐ (2026-11-14) the turn by ANGLE at one speed; the spit's side off the camera's own direction
    expect(aw).toContain("zm.k = zm.rad > 1e-9 ? Math.min(1, zm.done / zm.rad) : 1;");
    expect(aw).toContain("const u = mulM(baseFrame(st)!, calmDir(st, orbitDir(cp.yaw, cp.v)));");
    // ⭐⭐⭐ (2026-11-14, the owner's records) the side read at THIS frame's camera place, in the camera stage just before its frame (⛔ the assembly's step: a frame late)
    expect(aw).toContain("export function spitStep(st: SceneState, cp: OrbitAt): void {");
    expect(aw).not.toContain("  spitStep(st);");
    expect(gb).toMatch(/const camPlace = cameraPlaceNow\(st\);[^\n]*\n(?:\s*\/\/[^\n]*\n)*\s*if \(assemblyOn\(st\)\) spitStep\(st, camPlace\);\n\s*const camFrame = cameraFrameNow\(st, camPlace, off, dtSec \* 1000\);/);
    expect(aw).toContain("const t = zm.rule === 2 ? null : poseFramingTwo(zm.from, to, piece, zm.k, zm.keep);");
    expect(aw).toContain("const r = poseAboutPiece(zm.from, to, piece, zm.k, zm.axis);");
    expect(gb).toContain("const zp = zoneMixPose(st, pp, camAt, lookAt, camFrame.up);");
    // ⭐⭐⭐ (2026-11-14) the spit's side: the SHOWN rule at the ORBIT's own angles (⛔ the piece's spring: late; ⛔ the bare orbit: the square camera's turn over the ridge unseen)
    expect(aw).not.toContain("const u = dirAt(st, st.orbit.yaw, st.orbit.elevation);");
  });
});

// ⭐⭐⭐ (2026-11-14, the owner: "Is there a way for the camera to realign without the piece nor the assembly/scene to sometimes fly off the screen
// view?") the turn FRAMING TWO TARGETS (toric space, Lino & Christie 2012 / 2015): the piece and the camera's aim carried straight on the glass
import { poseFramingTwo, type FramingKeep } from "../src/input/orbit_tilt";
const tangentOf = (p: CamPose, q: Vec3): [number, number] => {
  const f = unit(sub(p.look, p.eye));
  const r = unit(cross(p.up, [-f[0], -f[1], -f[2]]));
  const u = cross([-f[0], -f[1], -f[2]], r);
  const v = sub(q, p.eye);
  return [dot(v, r) / dot(v, f), dot(v, u) / dot(v, f)];
};
describe("the turn framing two targets — the piece and the camera's aim (toric space)", () => {
  // far out, as on Scene_0bis: the camera 7.7 m from its aim (the assembly), the piece 1.3 m in front, off the glass's centre
  const aim: Vec3 = [0, 0, 0.5];
  const a: CamPose = { eye: [0, 7.5, 0], look: aim, up: [0, 0.07, 1], piece };
  // the realignment's target: a half turn about the line piece → aim with a tilt (both places moving on the glass, never meeting — ⭐ 2026-11-14: the half
  // turn about the VIEW through the aim carried the piece's place straight across the aim's: degenerate, the piece's turn — the next block's vector)
  const b0 = turned(turned(A, aim, unit(sub(aim, piece)), Math.PI * 0.95), aim, unit(cross(sub(aim, piece), [1, 0, 0])), 0.15);
  const b: CamPose = { eye: b0.eye, look: b0.look, up: b0.up };

  it("starts on the pose shown and ends on the new one", () => {
    const r0 = poseFramingTwo(a, b, piece, 0, null)!;
    close(r0.pose.eye, a.eye, 1e-7);
    close(unit(sub(r0.pose.look, r0.pose.eye)), unit(sub(a.look, a.eye)), 1e-7);
    const r1 = poseFramingTwo(a, b, piece, 1, r0.keep)!;
    close(r1.pose.eye, b.eye, 1e-7);
    close(unit(sub(r1.pose.look, r1.pose.eye)), unit(sub(b.look, b.eye)), 1e-7);
    const fB = unit(sub(b.look, b.eye));
    const kB = dot(b.up, fB);
    close(unit(r1.pose.up), unit([b.up[0] - kB * fB[0], b.up[1] - kB * fB[1], b.up[2] - kB * fB[2]]), 1e-7);
  });

  // ⭐⭐⭐ (2026-11-14, the owner's records) the piece straight, the aim the piece's place + their separation carried ROUND (its angle one way, its length
  // blended) — ⛔ both straight: their paths passed within hundredths, the roll spun there, and the guard handed the turn to the piece alone (the assembly off)
  it("all the way: the piece exactly on its straight line on the glass, the aim at the separation carried round (⛔ about the piece alone: the aim swung round it)", () => {
    const pa0 = tangentOf(a, piece), pa1 = tangentOf(b, piece), qa0 = tangentOf(a, aim), qa1 = tangentOf(b, aim);
    const r0 = Math.hypot(qa0[0] - pa0[0], qa0[1] - pa0[1]), r1 = Math.hypot(qa1[0] - pa1[0], qa1[1] - pa1[1]);
    const t0 = Math.atan2(qa0[1] - pa0[1], qa0[0] - pa0[0]), t1 = Math.atan2(qa1[1] - pa1[1], qa1[0] - pa1[0]);
    const dt = Math.atan2(Math.sin(t1 - t0), Math.cos(t1 - t0));
    let kp: FramingKeep | null = null;
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      const r: { readonly pose: CamPose; readonly keep: FramingKeep } = poseFramingTwo(a, b, piece, k, kp)!;
      kp = r.keep;
      const p = tangentOf(r.pose, piece), q = tangentOf(r.pose, aim);
      expect(p[0]).toBeCloseTo(pa0[0] + (pa1[0] - pa0[0]) * k, 7);
      expect(p[1]).toBeCloseTo(pa0[1] + (pa1[1] - pa0[1]) * k, 7);
      expect(Math.hypot(q[0] - p[0], q[1] - p[1])).toBeCloseTo(r0 + (r1 - r0) * k, 7);
      const th = Math.atan2(q[1] - p[1], q[0] - p[0]);
      expect(Math.cos(th - (t0 + dt * k))).toBeCloseTo(1, 7);
    }
  });

  it("random turns: both on the glass at the start and the end ⇒ the piece on it all the way, the aim never farther from it than at an end, never nearer", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    let tested = 0;
    for (let n = 0; n < 200 && tested < 60; n++) {
      const ax = unit([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]);
      const bb = turned(a, [aim[0] + rnd() - 0.5, aim[1] + rnd() - 0.5, aim[2] + rnd() - 0.5], ax, (rnd() * 2 - 1) * Math.PI);
      const bp: CamPose = { eye: bb.eye, look: bb.look, up: bb.up };
      const on = (t: [number, number]): boolean => Math.abs(t[0]) <= 0.9 && Math.abs(t[1]) <= 0.4; // a narrow glass (a phone held upright: tan 11°, tan 22°)
      // the aim: the look point of each pose (it moves with the turn's target — in the game the look point now)
      if (!on(tangentOf(a, piece)) || !on(tangentOf(a, a.look)) || !on(tangentOf(bp, piece)) || !on(tangentOf(bp, bp.look))) continue;
      let kp: FramingKeep | null = null;
      const sep = (p: CamPose, q: Vec3): number => { const x = tangentOf(p, piece), y = tangentOf(p, q); return Math.hypot(y[0] - x[0], y[1] - x[1]); };
      const s0 = sep(a, a.look), s1 = sep(bp, bp.look);
      for (let i = 0; i <= 10; i++) {
        const r = poseFramingTwo(a, bp, piece, i / 10, kp);
        if (r === null) break;
        kp = r.keep;
        expect(on(tangentOf(r.pose, piece))).toBe(true);
        // the aim (the pose's own, `b.look`) at the separation carried round: its length between the ends', never past the larger
        expect(sep(r.pose, bp.look)).toBeLessThanOrEqual(Math.max(s0, s1) + 1e-6);
        expect(sep(r.pose, bp.look)).toBeGreaterThanOrEqual(Math.min(s0, s1) - 1e-6);
      }
      tested++;
    }
    expect(tested).toBeGreaterThan(5);
  });

  it("degenerate — the piece on the line from the camera to its aim: none (the caller turns about the piece alone)", () => {
    const onRay: CamPose = { eye: [0, 7.5, 0], look: [0, 0, 0], up: [0, 0, 1], piece: [0, 6, 0] };
    expect(poseFramingTwo(onRay, onRay, [0, 6, 0], 0.5, null)).toBeNull();
  });
});

// ⭐⭐⭐ (2026-11-14, the owner: "in the middle of the camera roll there seems to be a jump and then camera roll continue") — the walk: far out the line
// piece → aim stood near the vertical, the piece's spring tilted it through the old reference's switch (0.95) mid-turn: a 61° roll in ONE frame
describe("the two-target turn's reference: one for the whole turn", () => {
  it("the piece → aim line tilting through 18° from the vertical mid-turn: every step of the turn as smooth as its neighbours", () => {
    const aim: Vec3 = [0, 0, 0.5];
    const piece0: Vec3 = [0, 6.48, 0.65];
    const a: CamPose = { eye: [0.3, 7.7, -0.4], look: aim, up: [0, 0.2, 1], piece: piece0 };
    // the realignment: a half turn ABOUT THE LINE piece → aim (both keep their places), as the spit's crossing far out
    const half = turned({ eye: a.eye, look: a.look, up: a.up }, aim, unit(sub(aim, piece0)), Math.PI * 0.99);
    let kp: FramingKeep | null = null;
    let prevUp: Vec3 | null = null;
    const steps: number[] = [];
    for (let i = 0; i <= 40; i++) {
      const k = i / 40;
      // the piece carried 2.2 m along z by its spring through the turn (as in the walk): the line's tilt from the vertical 1° → 19°
      const piece: Vec3 = [0, 6.48 - 0.4 * k, 0.65 + 2.2 * k];
      const shift = sub(piece, piece0);
      const b: CamPose = { eye: [half.eye[0] + shift[0], half.eye[1] + shift[1], half.eye[2] + shift[2]], look: aim, up: half.up };
      const r: { readonly pose: CamPose; readonly keep: FramingKeep } = poseFramingTwo(a, b, piece, k, kp)!;
      expect(r).not.toBeNull();
      kp = r.keep;
      const f = unit(sub(r.pose.look, r.pose.eye));
      const kk = dot(r.pose.up, f);
      const up = unit([r.pose.up[0] - kk * f[0], r.pose.up[1] - kk * f[1], r.pose.up[2] - kk * f[2]]);
      if (prevUp !== null) steps.push((Math.acos(Math.max(-1, Math.min(1, dot(prevUp, up)))) * 180) / Math.PI);
      prevUp = up;
    }
    const med = [...steps].sort((x, y) => x - y)[steps.length >> 1]!;
    expect(Math.max(...steps)).toBeLessThan(3 * med + 1); // ⛔ the old reference: one step of tens of degrees
  });
});

// ⭐⭐⭐ (2026-11-14, the owner's records) the two whose straight paths would MEET on the glass (a half turn about the view through the aim — the piece's
// place carried across the aim's): the separation carried round instead — no guard, no turn about the piece alone (⛔ `FRAMING_TWO_MIN`, deleted)
describe("the two-target turn: the two whose straight paths would meet on the glass — the separation carried round", () => {
  it("a half turn about the view through the aim: the two's turn all the way, the roll even (no spin where the paths would cross)", () => {
    const aim: Vec3 = [0, 0, 0.5];
    const piece0: Vec3 = [0, 6.48, 0.65];
    const a: CamPose = { eye: [0.3, 7.7, -0.4], look: aim, up: [0, 0.2, 1], piece: piece0 };
    const half = turned({ eye: a.eye, look: a.look, up: a.up }, aim, unit(sub(a.look, a.eye)), Math.PI * 0.99);
    const b: CamPose = { eye: half.eye, look: aim, up: half.up };
    let kp: FramingKeep | null = null;
    let prevUp: Vec3 | null = null;
    const steps: number[] = [];
    for (let i = 0; i <= 40; i++) {
      const r = poseFramingTwo(a, b, piece0, i / 40, kp);
      expect(r).not.toBeNull();
      kp = r!.keep;
      const f = unit(sub(r!.pose.look, r!.pose.eye));
      const kk = dot(r!.pose.up, f);
      const up = unit([r!.pose.up[0] - kk * f[0], r!.pose.up[1] - kk * f[1], r!.pose.up[2] - kk * f[2]]);
      if (prevUp !== null) steps.push((Math.acos(Math.max(-1, Math.min(1, dot(prevUp, up)))) * 180) / Math.PI);
      prevUp = up;
    }
    const med = [...steps].sort((x, y) => x - y)[steps.length >> 1]!;
    expect(Math.max(...steps)).toBeLessThan(2 * med + 0.5);
    expect(steps.reduce((x, y) => x + y, 0)).toBeGreaterThan(150); // the half turn made
  });
});

// ⭐⭐⭐ (2026-11-14, the owner's records replayed: 112 – 161° in ONE frame mid-turn) the two's angles CARRIED frame to frame (`FramingKeep`): the target
// turning on round the line, through every wrap, moves the shown camera by k × its step — ⛔ a sign kept from the first frame: a full turn added
// whenever the shortest way pointed the other way past 90° — the camera leapt by k × 360°
describe("the two-target turn's angles carried frame to frame (FramingKeep)", () => {
  it("a target turning round the piece → aim line from −80° through ±180° to +200°: every frame's step k × the target's, never a leap", () => {
    const aim: Vec3 = [0, 0, 0.5];
    const piece0: Vec3 = [0, 6.48, 0.65];
    const a: CamPose = { eye: [0.3, 7.7, -0.4], look: aim, up: [0, 0.2, 1], piece: piece0 };
    const line = unit(sub(aim, piece0));
    const k = 0.3;
    let kp: FramingKeep | null = null;
    let prev: Vec3[] | null = null;
    const axesOf = (p: CamPose): Vec3[] => { const f = unit(sub(p.look, p.eye)); const r = unit(cross(p.up, f)); return [r, cross(f, r), f]; };
    for (let deg = -80; deg <= 200; deg += 2) {
      const t = turned({ eye: a.eye, look: a.look, up: a.up }, aim, line, (deg * Math.PI) / 180);
      const r: { readonly pose: CamPose; readonly keep: FramingKeep } = poseFramingTwo(a, { eye: t.eye, look: aim, up: t.up }, piece0, k, kp)!;
      kp = r.keep;
      const ax = axesOf(r.pose);
      if (prev !== null) {
        let tr = 0;
        for (let i = 0; i < 3; i++) tr += dot(prev[i]!, ax[i]!);
        const step = (Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))) * 180) / Math.PI;
        expect(step).toBeLessThan(2 * k * 2 + 0.5); // the target's 2° × k, with the glide's slack — ⛔ the kept sign: k × 360° = 108° at the wrap
      }
      prev = ax;
    }
  });
});
