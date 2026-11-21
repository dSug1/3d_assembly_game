/**
 * ⭐⭐⭐ (2026-11-21 night, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.3a — packet R3-FIX) ONE HEADING OWNER: not latched the follower's heading, the
 * band blending the ELEVATION only; the follower draws through every logic turn not latched; latched G; one hand-over of the whole pose at each change of
 * owner (the latch, the unlatch), closed by his finger only — never a slerp across the vertical.
 * Red on the old code (`ce5abfe` … `03cd142`): the spit's band (the slerp over the vertical), the way out (G whole at w 1), the spit's latch (G at once),
 * the source vectors (the far path, the latch's start pose). The identity vector (equal headings = R3's poses) is green on the old code by design: its
 * mutant is named. Mutants run (each red): the slerp put back (`bandDir`); the elevation not blended; no hand-over of the direction (dh, de 0); the way
 * out's share ignored; the far path gated by `followActive` again; the up from the view's own heading far out (rule 6); the latch's pace by the square
 * camera's share alone (10 mm for any gap); round 2: the band's pitch paid in a polar zone (the elevation lerped there).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { dirAtHeading, followPose } from "../src/input/camera_follow";
import { meridianUp, PICTURE_CONE_DEG, PICTURE_REST, pictureStep, type PictureIn, type PicturePose, type PictureState } from "../src/input/picture";

const DEG = Math.PI / 180;
const ZERO: Vec3 = [0, 0, 0];
const GAP = 0.6;
const HANG = 0.7;
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const ang = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, unit(a)[0] * unit(b)[0] + unit(a)[1] * unit(b)[1] + unit(a)[2] * unit(b)[2]))) / DEG;
const sq = (u: Vec3, d: Vec3): Vec3 => {
  const k = u[0] * d[0] + u[1] * d[1] + u[2] * d[2];
  return unit([u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]]);
};
/** the camera direction drawn (look → eye), its elevation and its heading (deg) */
const cdir = (p: PicturePose): Vec3 => unit([p.eye[0] - p.look[0], p.eye[1] - p.look[1], p.eye[2] - p.look[2]]);
const elOf = (c: Vec3): number => Math.asin(Math.max(-1, Math.min(1, c[1]))) / DEG;
const headOf = (c: Vec3): number => Math.atan2(c[0], c[2]) / DEG;
const upDrawn = (p: PicturePose): Vec3 => sq(p.up, cdir(p));

/** the logic's pose G at the direction `us` (no offsets, the look at the foot: the follower's own rule there — no residual), its up the meridian of `psiUp` */
function poseG(us: Vec3, psiUp: number): PicturePose {
  const F = followPose(us, ZERO, ZERO, HANG, GAP, 0, 0);
  return { eye: F.eye, look: ZERO, up: sq(meridianUp(us, psiUp), us), piece: F.piece };
}
function inp(w: number, dFar: Vec3, us: Vec3, G: PicturePose, latched: boolean, share: number | null, mm: number): PictureIn {
  return { w, dFar, F: null, us, look: ZERO, foot: ZERO, hang: HANG, gapM: GAP, offYawRad: 0, offPitchRad: 0, G, latched, share, mm, spanMm: 10, coneDeg: PICTURE_CONE_DEG };
}

/** A SPIT: the follower at its 60° cap heading 0°, the logic's `us` on the other side of the vertical (heading 170°, 80° up). */
const FAR = dirAtHeading(0, 60 * DEG);
const US_SPIT = dirAtHeading(170 * DEG, 80 * DEG);
const G_SPIT = poseG(US_SPIT, 170 * DEG);

describe("R3-FIX rule 1 – 2 — the band with the two headings nearly opposite (outside a polar zone — round 2: a spit pays no pitch): the elevation only, never over the vertical", () => {
  it("in past the band to w 1 (not latched): every view on the follower's side, never above the logic's elevation; the up never past the horizontal; no up step over 5°", () => {
    let s: PictureState = PICTURE_REST;
    const rows: PicturePose[] = [];
    for (let mm = 10; mm >= -3; mm -= 0.25) {
      const w = mm <= 0 ? 1 : 1 - (mm / 10) * (mm / 10) * (3 - 2 * (mm / 10));
      const r = pictureStep(s, inp(w, FAR, US_SPIT, G_SPIT, false, null, 0.25));
      s = r.state;
      rows.push(r.pose);
    }
    for (let i = 0; i < rows.length; i++) {
      const c = cdir(rows[i]!);
      expect(elOf(c)).toBeLessThanOrEqual(80 + 1e-6);
      expect(c[0] * FAR[0] + c[2] * FAR[2]).toBeGreaterThan(0); // the follower's side: never over the vertical
      if (elOf(c) < 85) expect(upDrawn(rows[i]!)[1]).toBeGreaterThanOrEqual(0);
      if (i > 0) expect(ang(upDrawn(rows[i - 1]!), upDrawn(rows[i]!))).toBeLessThan(5);
    }
    // w 1, not latched (rule 2): the follower's heading at the logic's elevation — NOT G whole
    const last = cdir(rows[rows.length - 1]!);
    expect(headOf(last)).toBeCloseTo(0, 6);
    expect(elOf(last)).toBeCloseTo(80, 6);
  });
});

describe("R3-FIX round 2 — in a polar zone (the spit) the band pays no pitch: the far elevation kept until the latch, the latch's hand-over the one payer", () => {
  it("a spit's band at w 0.8 (and at w 1, not latched): the follower's own pose — its elevation the far one (60°), not lerped toward the logic's 80°", () => {
    for (const w of [0.8, 1]) {
      const F = followPose(FAR, ZERO, ZERO, HANG, GAP, 0, 0);
      const r = pictureStep(PICTURE_REST, { ...inp(w, FAR, US_SPIT, G_SPIT, false, null, 0.25), polar: true });
      const c = cdir(r.pose);
      expect(elOf(c)).toBeCloseTo(60, 9);
      expect(headOf(c)).toBeCloseTo(0, 9);
      for (let i = 0; i < 3; i++) expect(r.pose.piece[i]!).toBeCloseTo(F.piece[i]!, 12);
    }
  });
});

describe("R3-FIX — equal headings (Scene_1's top): R3's poses exactly", () => {
  it("the band from the 60° cap to the logic's 87°, both at heading 0: the slerp R3 drew = the elevation's lerp (eye, piece, up)", () => {
    const us = dirAtHeading(0, 87 * DEG);
    const G = poseG(us, 0);
    let s: PictureState = PICTURE_REST;
    for (let k = 0; k <= 40; k++) {
      const w = k / 40;
      const r = pictureStep(s, inp(w, FAR, us, G, false, null, 0.25));
      s = r.state;
      // R3's own pose: slerp(dFar, us, w) on the follower's rule (no residual in this fixture), G's at w 1
      const th = ang(FAR, us) * DEG;
      const a = Math.sin((1 - w) * th) / Math.sin(th);
      const b = Math.sin(w * th) / Math.sin(th);
      const d = unit([FAR[0] * a + us[0] * b, FAR[1] * a + us[1] * b, FAR[2] * a + us[2] * b]);
      const R = w >= 1 ? G : followPose(d, ZERO, ZERO, HANG, GAP, 0, 0);
      for (let i = 0; i < 3; i++) {
        expect(r.pose.eye[i]!).toBeCloseTo(R.eye[i]!, 9);
        expect(r.pose.piece[i]!).toBeCloseTo(R.piece[i]!, 9);
      }
      expect(ang(upDrawn(r.pose), sq(meridianUp(cdir(r.pose), 0), cdir(r.pose)))).toBeLessThan(1e-4);
    }
  });
});

describe("R3-FIX rule 4 — the way out with opposite headings: from G to the follower by the way out's share, in heading and elevation", () => {
  it("latched on G (170°, 80°), then out: the heading 170° × (1 − k) by the share k, never over the vertical, the follower's pose exactly at its end", () => {
    let s: PictureState = PICTURE_REST;
    let prev: PicturePose | null = null;
    for (let i = 0; i < 4; i++) {
      const r = pictureStep(s, inp(1, FAR, US_SPIT, G_SPIT, true, 1, 0));
      s = r.state;
      prev = r.pose;
    }
    for (let k = 0; k <= 1.0000001; k += 0.02) {
      const r = pictureStep(s, inp(1, FAR, US_SPIT, G_SPIT, false, Math.min(1, k), 0));
      s = r.state;
      const c = cdir(r.pose);
      expect(ang(cdir(prev!), c)).toBeLessThan(1);
      expect(headOf(c)).toBeCloseTo(170 * (1 - Math.min(1, k)), 3);
      expect(elOf(c)).toBeLessThanOrEqual(89.5);
      expect(ang(upDrawn(prev!), upDrawn(r.pose))).toBeLessThan(5);
      prev = r.pose;
    }
    const R1 = followPose(dirAtHeading(0, 80 * DEG), ZERO, ZERO, HANG, GAP, 0, 0);
    for (let i = 0; i < 3; i++) expect(prev!.eye[i]!).toBeCloseTo(R1.eye[i]!, 9);
  });
});

describe("R3-FIX rule 3 + 5 — the latch where no turn starts (a polar zone: the spit): G = the drawn pose, then his orbit mm", () => {
  it("the latch draws nothing new; held while pending; the heading to G's by the share; G exactly at its end", () => {
    let s: PictureState = PICTURE_REST;
    let prev: PicturePose | null = null;
    for (let i = 0; i < 3; i++) {
      const r = pictureStep(s, inp(1, FAR, US_SPIT, G_SPIT, false, null, 0.25));
      s = r.state;
      prev = r.pose;
    }
    const step = (share: number): PicturePose => {
      const r = pictureStep(s, inp(1, FAR, US_SPIT, G_SPIT, true, share, 0));
      s = r.state;
      const c = cdir(r.pose);
      expect(ang(cdir(prev!), c)).toBeLessThan(1);
      expect(ang(upDrawn(prev!), upDrawn(r.pose))).toBeLessThan(5);
      expect(elOf(c)).toBeLessThanOrEqual(89.5);
      if (elOf(c) < 85) expect(upDrawn(r.pose)[1]).toBeGreaterThanOrEqual(0);
      prev = r.pose;
      return r.pose;
    };
    for (let i = 0; i < 5; i++) expect(headOf(cdir(step(0)))).toBeCloseTo(0, 6); // pending: held
    for (let k = 0.02; k <= 1.0000001; k += 0.02) expect(headOf(cdir(step(Math.min(1, k))))).toBeCloseTo(170 * Math.min(1, k), 3);
    const end = step(1);
    for (let i = 0; i < 3; i++) expect(end.eye[i]!).toBeCloseTo(G_SPIT.eye[i]!, 9);
    expect(ang(upDrawn(end), upDrawn(G_SPIT))).toBeLessThan(1e-6);
  });
});

describe("R3-FIX — the latch's hand-over at his pace (decided by the lead, C4): never faster than 3°/mm nor than 10 mm", () => {
  const blend = (mm: number): number => {
    const x = Math.min(1, Math.max(0, mm / 10));
    return x * x * (3 - 2 * x);
  };
  const run = (gHead: number) => {
    const G = poseG(dirAtHeading(gHead * DEG, 80 * DEG), gHead * DEG);
    let s: PictureState = PICTURE_REST;
    for (let i = 0; i < 3; i++) s = pictureStep(s, inp(1, FAR, US_SPIT, G, false, null, 0.25)).state;
    const heads: number[] = [];
    for (let mm = 0; mm <= 70.0001; mm += 0.5) {
      const r = pictureStep(s, { ...inp(1, FAR, US_SPIT, G, true, blend(mm), 0), pace: { mm, minMm: 10, degPerMm: 3 } });
      s = r.state;
      heads.push(headOf(cdir(r.pose)));
    }
    return heads;
  };
  it("a 180° gap (a spit's latch, no turn): 60 mm of his orbit finger, not 10 — at most 3° a mm", () => {
    const h = run(180).map((x) => Math.abs(x));
    expect(h[20]!).toBeCloseTo(30, 0); // 10 mm: a sixth
    expect(h[60]!).toBeCloseTo(90, 0); // 30 mm: half
    expect(h[120]!).toBeCloseTo(180, 3); // 60 mm: whole
    for (let i = 1; i < h.length; i++) expect(Math.abs(h[i]! - h[i - 1]!)).toBeLessThanOrEqual(1.5 + 1e-6); // 0.5 mm a step
  });
  it("a small gap (≤ 20°: the square camera's own share keeps the pace — Scene_1, a turn from the pose drawn): as before", () => {
    const h = run(15);
    for (let i = 0; i < h.length; i++) expect(h[i]!).toBeCloseTo(15 * blend(i * 0.5), 6);
  });
});

describe("R3-FIX rule 6 — the up the turntable's of the DRAWN heading (the follower's), never the view's own near the vertical", () => {
  it("the band on Scene_1's top with the owner's offsets (2.5°, 2°): in the cone's inner half the up is the meridian of the follower's heading; no up step over 5°", () => {
    const us = dirAtHeading(0, 87 * DEG);
    const off = { y: 2.5 * DEG, p: 2 * DEG };
    let s: PictureState = PICTURE_REST;
    let prev: Vec3 | null = null;
    let inner = 0;
    for (let k = 0; k <= 40; k++) {
      const F = followPose(FAR, ZERO, ZERO, HANG, GAP, off.y, off.p);
      const r = pictureStep(s, { ...inp(k / 40, FAR, us, poseG(us, 0), false, null, 0.25), F: k === 0 ? F : null, offYawRad: off.y, offPitchRad: off.p });
      s = r.state;
      const c = cdir(r.pose);
      const u = upDrawn(r.pose);
      if (elOf(c) >= 80) {
        inner++;
        expect(ang(u, sq(meridianUp(c, 0), c))).toBeLessThan(1);
      }
      if (prev !== null) expect(ang(prev, u)).toBeLessThan(5);
      prev = u;
    }
    expect(inner).toBeGreaterThan(3);
  });
});

describe("R3-FIX — the wiring (source)", () => {
  const raw = (f: string): string => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
  it("rule 4 (the lead's amendment): not latched the FOLLOWER draws, whatever logic turn runs — `followActive` no reason to leave the far path; the close drawer runs for the logic, not drawn; `followPark` only latched", () => {
    const p = raw("render/picture_wiring.ts");
    expect(p).toContain("const farPath = !st.asmTiltAuto && st.asmAsk !== null && !st.orbitPiecePlaced;");
    expect(p).toContain("const Gl = followActive(st) ? null : rollPictureFrame(st, pp, eye, look, up, dtMs, left);");
    expect(p).toContain("const fp = followFrame(st, pp, foot, eye, look, up, gapM, off, dtMs, hook, Gl !== null);");
    expect(p.split("followPark(st, psiPark)").length).toBe(2);
    expect(raw("render/camera_follow_wiring.ts")).toContain("if ((also !== true && !followActive(st)) || st.orbitPiecePlaced) {");
  });

  it("rule 3: a turn started at the latch starts from the pose DRAWN (last frame drawn far, the latch on now)", () => {
    expect(raw("render/assembly_wiring.ts")).toContain("if (st.asmTiltAuto && st.asmPicture?.far === true && st.cfg.pictureOne === 1 && st.cfg.cameraFollower === 1) return drawnPose(st);");
  });
});
