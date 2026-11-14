/**
 * ⭐⭐⭐ prototype (green box) — WHERE A PRESS PUTS THE YELLOW ORBIT TARGET (the owner, 2026-10-01).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { orbitTargetOnPress } from "../src/input/goal_lock";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ prototype — the yellow orbit target on a press", () => {
  it("⭐⭐ a piece in its goal: the hit point — first touch or left button only, and only when locked", () => {
    const hit: [number, number, number] = [0.3, 0.2, 0.1];
    expect(orbitTargetOnPress(true, true, true, hit)).toEqual(hit);
    expect(orbitTargetOnPress(false, true, true, hit)).toBeNull(); // a second touch: no
    expect(orbitTargetOnPress(true, false, true, hit)).toBeNull(); // the right button: no
    expect(orbitTargetOnPress(true, true, false, hit)).toBeNull(); // a free piece (or the lock off): it drags, no retarget
    expect(orbitTargetOnPress(true, true, true, null)).toBeNull();
  });

  it("⭐⭐ ONLY a press on a placed piece moves the target — empty space, the floor, the green piece do not (the owner, 2026-10-02); ⛔ (2026-11-14, CL1) the switched-off empty-press retarget deleted", () => {
    expect(code("input/goal_lock.ts")).not.toMatch(/export const EMPTY_PRESS_MOVES_TARGET/);
    const p = code("render/pointer_wiring.ts");
    expect(p).not.toMatch(/EMPTY_PRESS_MOVES_TARGET &&|st\.pendingCentre|recomputeOrbitCentre\(/);
    expect(code("render/camera_rig.ts")).not.toMatch(/recomputeOrbitCentre|nearestPairCentre/);
  });

  it("⭐ wired: a press on a piece retargets at the hit", () => {
    const p = code("render/pointer_wiring.ts");
    // ⛔ (2026-11-02, `d8134eb`) no press holds a part: a press on a part is OUTSIDE, its hit read off the pick
    expect(p).toContain("const newTarget = orbitTargetOnPress(hitId !== undefined && st.router.all().length === 1 && holdRole === null, e.pointerType !== \"mouse\" || e.isTrusted,");
    // ⭐ (2026-10-13, §11nonies) NOTED at the press, moved at a TAP's release
    expect(p).toContain("st.pendingPartCentre = newTarget !== null ? { pointerId: e.pointerId, target: newTarget, normal: hitN ? [hitN.x, hitN.y, hitN.z] : null, host: hitId ?? null, x: s.x, y: s.y, t: s.t } : null;"); // ⭐ (2026-10-19) and the host part // ⭐ (2026-10-16) the rig turned onto the gizmo's face (`orbit_rig.ts`)
    expect(p.replace(/\s+/g, " ")).toContain("const to = orbitTargetOnRelease(pc.target, isTapRelease(pc.t, pc.x, pc.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop))); "); // ⭐ (2026-10-16) the rig turned onto the gizmo's face (`orbit_rig.ts`)
    expect(p).toContain("if (to !== null) retargetGizmo(st, to, pc.normal, pc.host ?? null);"); // ⛔ (2026-11-12) the slide removed
    expect(p).not.toContain("st.centreBlend.retarget(newTarget);");
  });

  it("⭐ the yellow target is ALWAYS VISIBLE — drawn in rendering group 2, after the bodies, the depth cleared (the owner: *\"not occluded by any object\"*)", () => {
    expect(code("render/scene.ts")).toContain("// ⏸   st.centreMarker.renderingGroupId = 2;"); // ⏸ (2026-11-14) the marker commented out (the owner)
    expect(code("render/scene.ts")).toContain("st.centreMarker = null;");
  });

  it("⭐⭐ a drag from a piece LOCKED in its goal ORBITS — the same step as empty space, and the green box's camera hears that finger", () => {
    const p = code("render/pointer_wiring.ts");
    // ⛔ (2026-11-02, `d8134eb`) one step, two callers: a single finger anywhere — a part is empty space — and the held second touch's first
    expect(p.split("orbitDragStep(st, e.pointerId, s, ").length - 1).toBe(2);
    expect(p).toContain("if (st.router.outside().length === 1) orbitDragStep(st, e.pointerId, s, prev);"); // ⛔ (2026-11-13) the zoom deleted (no pinch branch before it) // ⛔ (2026-11-12) no hover step first
    expect(p).not.toContain("lockedInGoal");
    // ⛔ without this the green box would read every frame of that drag as a RELEASE
    // ⭐ (2026-10-11) the held second touch's input first: its first touch orbits on the way in / round the piece only
    expect(code("render/green_box_wiring.ts")).toMatch(
      /const orbiting = h !== null\s*\? \(h\.mode === "HELD" \? h\.first : null\)[^\n]*\n\s*: out\.length === 1\s*\? out\[0\]!\.id\s*: null;/,
    );
  });
});
