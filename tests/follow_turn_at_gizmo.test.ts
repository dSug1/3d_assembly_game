// ⭐⭐⭐ (2026-11-22, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §19, D-H20 — his report on `4dbd704`: *"half of the times when the gizmo
// passes from one rectangle face to one triangle face or vice versa there is a short camera back and forth"*, and the same near `Scene_1`'s poles)
// THE FAR TURN AIMED WHERE THE GIZMO WAITS. A far turn starts on the reading at the FINGER's angles; right after the step F-3 sets the gizmo's angles to
// the map's place SHOWN, which trails a fast finger, and from the next frame the reading is the one there. The fixture is his `Scene_0bis` crossing
// (kit `follow/cap/runs_set/cap_p9` f913): the reading's geometric jump 27° → a turn on the finger's reading 40° from the heading drawn; the frames
// after, the reading where the gizmo waits: 13° back (27°).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirAtHeading, followFarStep, type FollowFarIn, type FollowState, type FollowTop, type FollowTopKnobs } from "../src/input/camera_follow";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const D = Math.PI / 180;
const DT = 1000 / 60;
const K: FollowTopKnobs = { tauMs: 200, poleDeg: 30, minDeg: 10, rollDegS: 360, paceShare: 1, degPerMm: 5, maxDegS: 520 };
const EL = 0.3;
const N: readonly [number, number, number] = [0, 0, 1];

const inp = (psiDeg: number, wasDeg: number | null, at?: number | null): FollowFarIn => ({
  ask: dirAtHeading(psiDeg * D, EL),
  orbit: dirAtHeading(psiDeg * D, EL),
  psiL: psiDeg * D,
  nW: N,
  upShown: null,
  dySign: 0,
  fingerMm: 0,
  ...(wasDeg === null ? {} : { psiLWas: wasDeg * D }),
  ...(at === undefined ? {} : { psiLAt: at === null ? null : at * D }),
});

/** the drawn heading (deg) frame by frame: 40 frames at rest on 0°, the start frame (the finger's reading 40°, last frame's calm there 13°: a 27° jump),
 *  then the gizmo waiting — the reading 27° each frame (no jump); `at` the reading where the gizmo waits handed at the start (undefined: none) */
function run(at: number | null | undefined, startDeg = 40, wasDeg = 13, waitDeg = 27): { psi: number[]; started: boolean; carried: number } {
  let s: FollowState | null = null;
  let top: FollowTop | null = null;
  for (let i = 0; i < 40; i++) {
    const r = followFarStep(s, top, inp(0, 0), DT, K);
    s = r.s;
    top = r.top;
  }
  const r0 = followFarStep(s, top, inp(startDeg, wasDeg, at), DT, K);
  s = r0.s;
  top = r0.top;
  const psi = [s.psi / D];
  for (let i = 0; i < 90; i++) {
    const r = followFarStep(s, top, inp(waitDeg, waitDeg), DT, K);
    s = r.s;
    top = r.top;
    psi.push(s.psi / D);
  }
  return { psi, started: r0.started, carried: r0.top.psiT / D };
}

describe("⭐⭐⭐ D-H20 — the far turn aimed where the gizmo waits (CAMERA_FOLLOWS_GIZMO.md §19)", () => {
  it("aimed at the reading where the gizmo waits: the drawn heading never passes it and settles on it — no back and forth", () => {
    const r = run(27);
    expect(r.started).toBe(true);
    // ⛔ before (aimed at the finger's 40°): the heading drawn went past 27° (to ≈ 32°) and the spring took it back
    expect(Math.max(...r.psi)).toBeLessThanOrEqual(27 + 0.05);
    for (let i = 1; i < r.psi.length; i++) expect(r.psi[i]!).toBeGreaterThanOrEqual(r.psi[i - 1]! - 1e-9);
    expect(r.psi[r.psi.length - 1]!).toBeCloseTo(27, 2);
    // the reading carried is the one where the gizmo waits: the next frames' reading there moves nothing
    expect(r.carried).toBeCloseTo(27, 9);
  });

  it("⛔ 0 = `4dbd704` (no reading where the gizmo waits handed): the turn aimed at the finger's reading — the heading drawn goes past and comes back", () => {
    const r = run(undefined);
    expect(r.started).toBe(true);
    expect(Math.max(...r.psi)).toBeGreaterThan(27 + 2);
    expect(r.psi[r.psi.length - 1]!).toBeCloseTo(27, 1);
    expect(r.carried).toBeCloseTo(40, 9);
  });

  it("no reading there (`null`: carried) — the reading here, exactly as without one", () => {
    expect(run(null)).toEqual(run(undefined));
  });

  it("no turn started (the jump under `followTurnMinDeg`) — the reading where the gizmo waits is not read", () => {
    // the finger's reading 8° with last frame's calm there 0°: an 8° jump, the spring pays it
    const a = run(3, 8, 0, 8);
    const b = run(undefined, 8, 0, 8);
    expect(a.started).toBe(false);
    expect(a).toEqual(b);
  });

  it("the switch `followTurnAtGizmo` is 1 by default", () => {
    expect(DEFAULT_CONFIG.followTurnAtGizmo).toBe(1);
  });

  it("the wiring: the reading where the gizmo waits is F-3's place (`asmShown`, `vOfPitch`), this frame's calm, the band read there — handed under the far rule and the switch only", () => {
    const flat = (p: string): string => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\s+/g, " ");
    const a = flat("../src/render/assembly_wiring.ts");
    const f = a.slice(a.indexOf("export function farAskedWhereHeld("), a.indexOf("export function farJumpRead("));
    expect(f).toContain("const sh = st.asmShown; if (sh === null) return undefined; const v = vOfPitch(sh.pitch); const R = dirFrame(st);");
    expect(f).toContain("return farReading(sh.yaw, v, st.asmAskCalm, R, st.cfg.followPoleDeg, tiltDir(R, orbitDir(sh.yaw, v)));");
    // F-3's rebase sets the angles to the same place
    expect(a).toContain("const sh = st.asmShown!; seamRebase(st, { yaw: sh.yaw, pitch: sh.pitch });");
    expect(a).toContain("const yaw = mq.yaw; const v = vOfPitch(mq.pitch); st.orbit.reset(yaw, v);");
    const w = flat("../src/render/camera_follow_wiring.ts");
    expect(w).toContain("const psiLAt = farTopDecided(st) && st.cfg.followTurnAtGizmo === 1 ? farAskedWhereHeld(st) : undefined;");
    expect(w).toContain("...(psiLAt !== undefined ? { psiLAt } : {}) }, dtMs, kt)");
  });
});
