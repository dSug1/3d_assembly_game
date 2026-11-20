// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13) THE CAMERA FOLLOWER — its wiring, read in the sources.
// F1: the calm asked recorded in `calmFrame` from the target `calmTargets` hands to the ease, before the whole shares are eased; `askedDir` reads it with
// none of `dirAt`'s eases; the camera's stage writes `st.asmAsk` at the rig's solved angles.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const between = (s: string, from: string, to: string): string => {
  const i = s.indexOf(from);
  const j = s.indexOf(to, i + from.length);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(j).toBeGreaterThan(i);
  return s.slice(i, j);
};

describe("F1 — the direction asked, recorded", () => {
  it("every calm step goes through the wrapper that keeps its target; the result is the ease's own", () => {
    const a = code("render/assembly_wiring.ts");
    const w = between(a, "function calmStep(prev: CalmState | null, tg: CalmAskTarget, dtMs: number): CalmState | null {", "function calmFrame(");
    expect(w).toContain("calmAsked = tg; return calmStepEase(prev, tg, dtMs); }");
    expect(a.match(/calmStepEase\(/g)?.length).toBe(1); // the wrapper is the only caller of the ease
  });

  it("`calmFrame`: cleared, the targets, the calm asked from the whole shares BY POSITION — before they are eased", () => {
    const f = between(code("render/assembly_wiring.ts"), "function calmFrame(st: SceneState, dtMs: number): void {", "function levelHeadingOf(");
    const i0 = f.indexOf("calmAsked = null;");
    const i1 = f.indexOf("calmTargets(st, dtMs);");
    const i2 = f.indexOf("st.asmAskCalm = calmAsked === null ? null : askedCalm(calmAsked, st.asmCalmWhole, st.asmCalmWholeV);");
    const i3 = f.indexOf("st.asmCalmWhole = wholeShareStep(");
    expect(i0).toBeGreaterThanOrEqual(0);
    expect(i1).toBeGreaterThan(i0);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
  });

  it("`askedDir`: the frame's turn of the calm asked at the orbit's direction — no `asmDirEase`, no eased calm", () => {
    const d = between(code("render/assembly_wiring.ts"), "export function askedDir(st: SceneState, yaw: number, v: number): Vec3 {", "function drawnDir(");
    expect(d).toContain("return tiltDir(dirFrame(st), calmShown(orbitDir(yaw, v), st.asmAskCalm)); }");
    expect(d).not.toContain("asmDirEase");
    expect(d).not.toContain("st.asmCalm)");
  });

  it("the camera's stage records the direction asked at the rig's solved angles (`rig`), before the picture", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("st.asmAsk = askedDir(st, rig.yaw, rig.v);");
    expect(i).toBeGreaterThan(0);
    expect(g.indexOf("rollPictureFrame(st, pp,", i)).toBeGreaterThan(i);
  });
});
