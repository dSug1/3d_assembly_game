/**
 * ⭐⭐⭐ (2026-11-25, `Claude/40_RENDER_SCENE/spec/APPROACH_CAMERA_JITTER.md` §4.5 C-a, §7.6 — packet 2b) THE RING SHOWS THE GIZMO'S LAG, NOT THE APPROACH'S
 * (`gizmoLagTravel` 1): the ring and its red / green sections are drawn at the gizmo's exact point plus the rig's base's lag along the face (`gizmoLag`,
 * his 2026-11-11 fix: *"I don't like the way the gizmo moves (it jitters slightly)"*, *"avoid adding another lerp or spring"*) — meant for the gizmo's
 * TRAVEL. But the base is the shell's anchor ALONG THE PIECE'S RAY (g + u·e(d)), oblique to the face (the calm's direction, ≈ 52° off its normal on
 * `n2b8_r04`): as he approaches, the base slides along the face and the ring was drawn sliding with it, the gizmo still (up to 39.7 mm a frame, 33.5 mm
 * off). Now the approach's own share of the base's lag (`approachLag`: the base's ONE law — `easePoint` at `gizmoEaseMs` — fed by the approach's moves
 * of the target only) is taken out before it is drawn: the base, the piece and the camera untouched, no second ease.
 * The frames below are `n2b8_r04`'s kind: his frame times 7 – 39 ms, the approach's steps of the base along u, the face's normal +z; then the orbit
 * moving `g` by his finger's events (2 – 22 mm), the approach held; then both.
 * Red first (each recorded in the study's §7.6): today's (the whole lag drawn); the approach's share removed for its own frame only (stateless); the share
 * not decayed by the base's law; the share at another time (a second ease); the wiring ignoring the switch.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { approachLag, easePoint, gizmoLag, gizmoShownAt } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const DEG = Math.PI / 180;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

const TAU = DEFAULT_CONFIG.gizmoEaseMs; // the rig's one law (45 ms)
const N: Vec3 = [0, 0, 1]; // the gizmo's face
const U: Vec3 = [Math.sin(52 * DEG), 0, Math.cos(52 * DEG)]; // the piece's ray, 52° off the face's normal (the calm's shown direction)

interface Frame {
  readonly dt: number;
  readonly g: Vec3; // the gizmo's exact point
  readonly e: number; // the foot's place along the ray (the approach's e(d))
}
/** the rig run frame by frame as the wiring does: the base eased to its foot; the lag drawn today and under C-a; the ring where it is drawn */
function run(frames: readonly Frame[], own: (was: Vec3 | null, move: Vec3, dt: number) => Vec3 | null) {
  let B: Vec3 | null = null;
  let la: Vec3 | null = null;
  let eWas: number | null = null;
  const out: { today: Vec3; drawn: Vec3; ringToday: Vec3; ring: Vec3; base: Vec3 }[] = [];
  for (const f of frames) {
    const T = add(f.g, mul(U, f.e));
    B = B === null ? [T[0], T[1], T[2]] : easePoint(B, T, f.dt, TAU);
    const atRest = B[0] === T[0] && B[1] === T[1] && B[2] === T[2];
    const move: Vec3 = eWas === null ? [0, 0, 0] : sub(T, add(f.g, mul(U, eWas))); // the foot at this frame's distance less at last frame's, all else this frame's
    const o: Vec3 | null = atRest ? null : own(la, move, f.dt);
    la = o ?? [0, 0, 0];
    eWas = f.e;
    const today = gizmoLag(B, T, N);
    const drawn = gizmoLag(B, T, N, o);
    out.push({ today, drawn, ringToday: gizmoShownAt(f.g, B, today), ring: gizmoShownAt(f.g, B, drawn), base: B });
  }
  return out;
}
const C_A = (was: Vec3 | null, move: Vec3, dt: number): Vec3 => approachLag(was, move, dt, TAU);
const maxStep = (pts: readonly Vec3[]): number => pts.slice(1).reduce((m, p, i) => Math.max(m, len(sub(p, pts[i]!))), 0) * 1000;

const G0: Vec3 = [0.1, 0.2, 0.3];
// `n2b8_r04`'s kind: onto the floor and off it again, his frame times (a 39 ms frame among them), the gizmo still
const DTS = [7, 10, 39, 11, 9, 7, 24, 8, 7, 12, 31, 9, 7, 7, 10, 18, 7, 7, 7, 7, 7, 7, 7, 7];
const ES = [0.09, 0.085, 0.06, 0.02, 0.015, 0.012, 0.011, 0.011, 0.011, 0.011, 0.02, 0.045, 0.07, 0.08, 0.085, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09];
const APPROACH: Frame[] = DTS.map((dt, i) => ({ dt, g: G0, e: ES[i]! }));
// the orbit: his finger's events move the gizmo along the face (2 – 22 mm, then nothing), the approach held
const GX = [0, 0.022, 0.022, 0.024, 0.046, 0.046, 0.048, 0.05, 0.072, 0.072, 0.072, 0.074, 0.096, 0.096, 0.098, 0.1, 0.1, 0.1];
const ORBIT: Frame[] = GX.map((x, i) => ({ dt: [7, 10, 7, 7, 24, 7, 9][i % 7]!, g: add(G0, [x, 0.4 * x, 0]), e: 0.05 }));

describe("⭐⭐⭐ C-a — the ring shows the gizmo's travel's lag, not the approach's (`gizmoLagTravel`)", () => {
  it("the approach moving the base, the gizmo still: the ring and the sections still (< 1 mm — 0.000 here); today they slide up to 22.6 mm a frame and stand up to 32.4 mm off", () => {
    const r = run(APPROACH, C_A);
    expect(maxStep(r.map((x) => x.ring))).toBeLessThan(1e-6);
    expect(Math.max(...r.map((x) => len(x.drawn))) * 1000).toBeLessThan(1e-6);
    expect(maxStep(r.map((x) => x.ringToday))).toBeGreaterThan(22);
    expect(Math.max(...r.map((x) => len(x.today))) * 1000).toBeGreaterThan(32);
    expect(maxStep(r.map((x) => x.base))).toBeGreaterThan(16); // the base itself (the piece, the camera) moves as today
  });

  it("the orbit moving the gizmo, the approach held: the lag drawn is today's, bit for bit (his 2026-11-11 fix kept)", () => {
    const r = run(ORBIT, C_A);
    for (const x of r) expect(x.drawn).toEqual(x.today);
    expect(Math.max(...r.map((x) => len(x.today))) * 1000).toBeGreaterThan(5); // it is drawn on a lag
  });

  it("both at once: the lag drawn is the orbit's own — what a base fed by the gizmo's travel alone carries (to 1e-9 mm)", () => {
    const both: Frame[] = ORBIT.map((f, i) => ({ ...f, e: ES[i]! }));
    const r = run(both, C_A);
    const alone = run(ORBIT.map((f) => ({ ...f, e: ES[0]! })), C_A);
    r.forEach((x, i) => {
      for (let k = 0; k < 3; k++) expect(x.drawn[k]!).toBeCloseTo(alone[i]!.today[k]!, 12);
    });
    expect(Math.max(...r.map((x, i) => len(sub(x.today, alone[i]!.today)))) * 1000).toBeGreaterThan(5); // today: the approach's slide drawn on top
  });

  it("`approachLag` is the base's own law on the approach's share: last frame's less this frame's move, eased toward 0 at `gizmoEaseMs` (at rest under 0.1 mm)", () => {
    const k = Math.exp(-10 / TAU);
    const l = approachLag([0.01, 0, 0], [0.004, 0, 0.003], 10, TAU);
    expect(l[0]).toBeCloseTo(0.006 * k, 15);
    expect(l[2]).toBeCloseTo(-0.003 * k, 15);
    expect(approachLag(null, [0.002, 0, 0], 7, TAU)[0]).toBeCloseTo(-0.002 * Math.exp(-7 / TAU), 15);
    expect(approachLag([0.00005, 0, 0], [0, 0, 0], 7, TAU)).toEqual([0, 0, 0]);
    expect(approachLag([0.01, 0, 0], [0, 0, 0], 7, 0)).toEqual([0, 0, 0]);
    expect(gizmoLag([1, 2, 3], [0, 0, 0], null, [0.5, 0, 0])).toEqual([0.5, 2, 3]);
    expect(gizmoLag([1, 2, 3], [0, 0, 0], null, null)).toEqual([1, 2, 3]);
  });

  it("`gizmoLagTravel`, 0 by default (= `3b7a479`), 0 or 1 only; the wiring: none at 0, the move read at THIS frame's gizmo and direction, the base at rest none, the state reset", () => {
    expect(DEFAULT_CONFIG.gizmoLagTravel).toBe(0);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, gizmoLagTravel: 1 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, gizmoLagTravel: 2 })).toThrow();
    const w = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n");
    expect(w).toContain("st.asmGizmoLag = gizmoLag(st.asmGizmo, foot, st.gizmoNormal ?? null, approachLagFrame(st, target, us, d, foot, dtMs));");
    expect(w).toContain("  if (st.cfg.gizmoLagTravel !== 1) {\n    st.asmLagApproach = null;\n    return null;\n  }");
    expect(w).toContain("const fWas = was === null || was.d === d ? null : footOf(st, g, u, was.d + liftOf(st, u));");
    expect(w).toContain("lag = approachLag(was?.lag ?? null, fWas === null ? [0, 0, 0] : [foot[0] - fWas[0], foot[1] - fWas[1], foot[2] - fWas[2]], dtMs, st.cfg.gizmoEaseMs);");
    expect(w).toContain("if (b !== null && !(b[0] === foot[0] && b[1] === foot[1] && b[2] === foot[2])) {");
    expect(w).toContain("    asmLagApproach: null,\n");
  });
});
