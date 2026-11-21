// ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §3 O-1, §4.4, D-P2 — packet R2) CLOSE IN'S TURNS ABOUT THE PIECE, behind the rebuild's
// one switch `pictureOne`: the one rule (`turnFraming`, `turnPose` in `src/input/orbit_tilt.ts`) and its wiring. THE FIXTURE is R1's reproduction (the
// kit's `framing_sim.ts`, its numbers copied): the `c0` recording's f366 pose on `Scene_1`'s top (`cameraFollower` 0), the piece's recorded heights
// f366 – f378, the aim from f366's look point to the gizmo (close in the look point goes to the gizmo) or held; the logic's pose a dolly with the piece; the
// automatic tilt's PENDING turn held at k 0. Each vector shown red on a mutant (the old rule; the predicate inverted; the choice re-made each frame).
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { poseAboutPiece, poseFramingTwo, turnFraming, turnPose, type CamPose, type FramingKeep } from "../src/input/orbit_tilt";
import { onGlass } from "../src/input/roll_follow";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";

const DEG = 180 / Math.PI;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const angDeg = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (len(a) * len(b))))) * DEG;
const view = (p: CamPose): Vec3 => sub(p.look, p.eye);

// R1's fixture (`framing_sim.ts`): f366's camera, piece, look point (its aim) and the gizmo; the piece's heights f366 – f378
const EYE0: Vec3 = [0.09, 2.4, 0.21];
const PIECE0: Vec3 = [0.003, 1.155, 0.191];
const AIM0: Vec3 = [0.002, 0.389, 0.138];
const GIZMO: Vec3 = [0.003, 0.54, 0.191];
const UP0: Vec3 = [0, 0, 1];
const START: CamPose = { eye: EYE0, look: AIM0, up: UP0, piece: PIECE0 };
const YS = [1.155, 1.009, 0.89, 0.797, 0.732, 0.694, 0.671, 0.651, 0.636, 0.63, 0.603, 0.574, 0.543, 0.541];
// the glass: Babylon's vertical field (0.8 rad, the game's camera) on a portrait phone (9 : 19.5) — a half-glass across is the narrower
const FOV_Y = 0.8;
const ASPECT = 9 / 19.5;

/** one frame of the approach: the piece at height `y`, the aim `s` of the way to the gizmo (or held), the logic's pose a dolly with the piece */
function frameAt(y: number, s: number, aimToGizmo: boolean): { readonly A: Vec3; readonly b: CamPose } {
  const A: Vec3 = [PIECE0[0], y, PIECE0[2]];
  const B: Vec3 = aimToGizmo ? [AIM0[0] + (GIZMO[0] - AIM0[0]) * s, AIM0[1] + (GIZMO[1] - AIM0[1]) * s, AIM0[2] + (GIZMO[2] - AIM0[2]) * s] : AIM0;
  return { A, b: { eye: add(A, sub(EYE0, PIECE0)), look: B, up: UP0 } };
}

interface Turn {
  rule: 0 | 1 | 2;
  keep: FramingKeep | null;
  axis: Vec3 | null;
}
/** a turn drawn along the approach through the one rule, its state carried as `zoneMixPose` carries it; `closeIn` the predicate frame by frame */
function walk(closeIn: (i: number) => boolean, pictureOne: number, aimToGizmo: boolean, ys: readonly number[] = YS): CamPose[] {
  const zm: Turn = { rule: 0, keep: null, axis: null };
  return ys.map((y, i) => {
    const { A, b } = frameAt(y, i / (ys.length - 1), aimToGizmo);
    const d = turnPose(START, b, A, 0, zm, zm.axis, closeIn(i), pictureOne);
    zm.axis = d.about.axis ?? zm.axis ?? [0, 1, 0];
    zm.rule = d.rule;
    zm.keep = d.keep;
    return d.pose;
  });
}
/** ⛔ the rule as at `620f227`, copied from its `zoneMixPose`: the framing tried unless null at the first frame (then about the piece, kept); null later: about the piece that frame */
function walkOld(aimToGizmo: boolean, ys: readonly number[] = YS): CamPose[] {
  const zm: Turn = { rule: 0, keep: null, axis: null };
  return ys.map((y, i) => {
    const { A, b } = frameAt(y, i / (ys.length - 1), aimToGizmo);
    const r = poseAboutPiece(START, b, A, 0, zm.axis);
    zm.axis = r.axis ?? zm.axis ?? [0, 1, 0];
    const t = zm.rule === 2 ? null : poseFramingTwo(START, b, A, 0, zm.keep);
    if (t === null && zm.rule === 0) zm.rule = 2;
    if (t !== null) {
      zm.rule = 1;
      zm.keep = t.keep;
    }
    return t !== null ? t.pose : r.pose;
  });
}
/** each frame's view step (deg), the first from the pose shown at the turn's start */
const steps = (ps: readonly CamPose[]): number[] => ps.map((p, i) => angDeg(view(i === 0 ? START : ps[i - 1]!), view(p)));
const ALWAYS = (): boolean => true;
const NEVER = (): boolean => false;

describe("R2 — the fixture is R1's reproduction (the two-target rule on the approach's end)", () => {
  it("the old rule: 7.1°, 20.3°, then the solve null and 40.2° in one frame — onto the recorded camera (0.09, 1.79, 0.21)", () => {
    const ps = walkOld(true);
    const st = steps(ps).map((x) => Math.round(x * 10) / 10);
    expect(st).toContain(7.1);
    expect(st).toContain(20.3);
    expect(st).toContain(40.2);
    const i = st.indexOf(40.2);
    const e = ps[i]!.eye.map((x) => Math.round(x * 100) / 100);
    expect(e).toEqual([0.09, 1.79, 0.21]);
  });
});

describe("R2 — close in, `pictureOne` 1: the turn about the piece for its whole life (`turnPose`)", () => {
  it("along the approach, close in: no frame's view step over 3° (the two-target rule: 7.1°, 20.3°, then 40.2°) — aim to the gizmo or held", () => {
    for (const aimToGizmo of [true, false]) expect(Math.max(...steps(walk(ALWAYS, 1, aimToGizmo)))).toBeLessThanOrEqual(3);
  });
  it("the piece's place on the glass held within 0.02 half-glass all along (a dolly: the orientation kept, the piece moving along the view)", () => {
    const g0 = onGlass(START, PIECE0, FOV_Y, ASPECT);
    for (const aimToGizmo of [true, false]) {
      walk(ALWAYS, 1, aimToGizmo).forEach((p, i) => {
        const g = onGlass(p, [PIECE0[0], YS[i]!, PIECE0[2]], FOV_Y, ASPECT);
        expect(Math.hypot(g[0] - g0[0], g[1] - g0[1])).toBeLessThan(0.02);
      });
    }
  });
  it("chosen at the turn's FIRST frame and kept: born close in, the latch dropping while it runs (backing out) — still about the piece, no step over 3°", () => {
    const back = [...YS].reverse();
    const ps = walk((i) => i === 0, 1, true, back);
    expect(Math.max(...steps(ps))).toBeLessThanOrEqual(3);
    // …and born far out, latching while it runs: the framing kept, the 620f227 poses exactly
    expect(walk((i) => i > 0, 1, true)).toEqual(walkOld(true));
  });
});

describe("R2 — everything else exactly as at `620f227`", () => {
  it("`pictureOne` 0: the old poses exactly, close in or far out", () => {
    for (const aimToGizmo of [true, false]) {
      expect(walk(ALWAYS, 0, aimToGizmo)).toEqual(walkOld(aimToGizmo));
      expect(walk(NEVER, 0, aimToGizmo)).toEqual(walkOld(aimToGizmo));
    }
  });
  it("far out (not close in), `pictureOne` 1: the framing's pose exactly (the assembly kept on the glass, 2026-11-14)", () => {
    for (const aimToGizmo of [true, false]) expect(walk(NEVER, 1, aimToGizmo)).toEqual(walkOld(aimToGizmo));
    const { A, b } = frameAt(YS[3]!, 0, false);
    expect(turnPose(START, b, A, 0.4, { rule: 0, keep: null }, null, false, 1).pose).toEqual(poseFramingTwo(START, b, A, 0.4, null)!.pose);
  });
  it("the rule's table: born close in with the switch on — about the piece (2); else not yet (0, the framing tried); a rule made is kept", () => {
    expect(turnFraming(0, true, 1)).toBe(2);
    expect(turnFraming(0, false, 1)).toBe(0);
    expect(turnFraming(0, true, 0)).toBe(0);
    expect(turnFraming(1, true, 1)).toBe(1);
    expect(turnFraming(2, false, 1)).toBe(2);
    expect(turnFraming(2, false, 0)).toBe(2);
  });
});

const raw = (p: string): string => readFileSync(p, "utf8");
describe("R2 — the switch and the wiring: every turn's drawer through the one rule", () => {
  it("`pictureOne` 1 by default, 0 / 1 only, its slider in ORBIT › CAMERA FOLLOWER", () => {
    expect(DEFAULT_CONFIG.pictureOne).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pictureOne: 2 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pictureOne: 0 })).not.toThrow();
    expect(raw("src/render/tuning_menu.ts")).toContain('"pictureOne", 0, 1, 1)');
  });
  it("the zone's turn (`zoneMixPose`) and the framing turn (`framedPose`) through `turnPose`, the predicate the automatic tilt's latch; no other caller of either pose", () => {
    expect(raw("src/render/assembly_wiring.ts")).toContain("const d = turnPose(zm.from, to, piece, zm.k, zm, zm.axis, st.asmTiltAuto, st.cfg.pictureOne);");
    expect(raw("src/input/upright.ts")).toContain("const d = turnPose(f.from, to, piece, k, f, f.axis, closeIn, pictureOne);");
    expect(raw("src/render/roll_shadow.ts")).toContain("framedPose(ft, G, piece, st.asmTiltAuto, st.cfg.pictureOne)");
    const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${d}/${e.name}`) : e.name.endsWith(".ts") ? [`${d}/${e.name}`] : []));
    const callers = files("src").filter((f) => /poseFramingTwo\(|poseAboutPiece\(/.test(raw(f)));
    expect(callers).toEqual(["src/input/orbit_tilt.ts"]);
  });
});
