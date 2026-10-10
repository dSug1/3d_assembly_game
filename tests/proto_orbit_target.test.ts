/**
 * ⭐⭐⭐ prototype (green box) — WHERE A PRESS PUTS THE YELLOW ORBIT TARGET (the owner, 2026-10-01).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { nearestPairCentre } from "../src/input/barycentre";
import { orbitTargetOnPress } from "../src/input/goal_lock";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const ray = { origin: [0, 0, -5] as [number, number, number], direction: [0, 0, 1] as [number, number, number] };

describe("⭐⭐⭐ prototype — the yellow orbit target on a press", () => {
  it("⭐⭐ empty space: the MIDPOINT of the two piece centres nearest the ray — not a subset barycentre", () => {
    // A and B nearest the ray (0.1 and 0.2 off it), C far (1 m off), D on the ray but BEHIND the camera (5 m from its origin)
    const A: [number, number, number] = [0.1, 0, 0];
    const B: [number, number, number] = [0, 0.2, 1];
    const C: [number, number, number] = [1, 0, 0];
    const D: [number, number, number] = [0, 0, -10];
    expect(nearestPairCentre([C, A, D, B], ray)).toEqual([0.05, 0.1, 0.5]);
    // ⭐ the order does not matter, and a third piece never pulls it (a subset barycentre of A, B, C would)
    expect(nearestPairCentre([B, C, A], ray)).toEqual([0.05, 0.1, 0.5]);
    expect(nearestPairCentre([C], ray)).toEqual([1, 0, 0]); // one piece: its centre
    expect(nearestPairCentre([], ray)).toBeNull(); // none: the target stays
  });

  it("⭐⭐ a piece in its goal: the hit point — first touch or left button only, and only when locked", () => {
    const hit: [number, number, number] = [0.3, 0.2, 0.1];
    expect(orbitTargetOnPress(true, true, true, hit)).toEqual(hit);
    expect(orbitTargetOnPress(false, true, true, hit)).toBeNull(); // a second touch: no
    expect(orbitTargetOnPress(true, false, true, hit)).toBeNull(); // the right button: no
    expect(orbitTargetOnPress(true, true, false, hit)).toBeNull(); // a free piece (or the lock off): it drags, no retarget
    expect(orbitTargetOnPress(true, true, true, null)).toBeNull();
  });

  it("⭐⭐ ONLY a press on a placed piece moves the target — empty space, the floor, the green piece do not (the owner, 2026-10-02)", async () => {
    const { EMPTY_PRESS_MOVES_TARGET } = await import("../src/input/goal_lock");
    expect(EMPTY_PRESS_MOVES_TARGET).toBe(false); // switched off, not deleted
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/EMPTY_PRESS_MOVES_TARGET && st\.cfg\.orbitCentreGraceMs > 0/);
    expect(p).toMatch(/if \(EMPTY_PRESS_MOVES_TARGET && !st\.pendingCentre\) recomputeOrbitCentre\(st, e\);/);
  });

  it("⭐ wired: empty space reads nearestPairCentre over the non-frozen pieces; a press on a piece retargets at the hit", () => {
    const c = code("render/camera_rig.ts");
    expect(c).toMatch(/nearestPairCentre\(visible,/);
    expect(c).toMatch(/st\.world\.objects\.get\(id\)\?\.frozen !== true/);
    expect(c).not.toMatch(/const c = orbitCentre\(/);
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/orbitTargetOnPress\(\s*routed\.role === "OBJECT" && st\.router\.all\(\)\.length === 1,\s*e\.pointerType !== "mouse" \|\| e\.isTrusted,/);
    expect(p).toMatch(/st\.centreBlend\.retarget\(newTarget\);[\s\S]{0,300}?syncCentre\(st\);/);
  });

  it("⭐ the yellow target is ALWAYS VISIBLE — drawn in rendering group 2, after the bodies, the depth cleared (the owner: *\"not occluded by any object\"*)", () => {
    expect(code("render/scene.ts")).toContain("st.centreMarker.renderingGroupId = 2;");
  });

  it("⭐⭐ a drag from a piece LOCKED in its goal ORBITS — the same step as empty space, and the green box's camera hears that finger", () => {
    const p = code("render/pointer_wiring.ts");
    // one step, two callers: empty space and the locked piece
    // (a third since 2026-10-05: the orbit finger keeps orbiting while a second touch is still a possible tap)
    expect(p.split("orbitDragStep(st, e.pointerId, s, ").length - 1).toBe(3);
    expect(p).toMatch(/if \(lockedInGoal && st\.router\.objects\(\)\.length === 1 && st\.router\.outside\(\)\.length === 0\) \{\s*orbitDragStep\(st, e\.pointerId, s, grip\.prev\);/);
    // its locked-piece call comes BEFORE the gate returns
    expect(p.indexOf("orbitDragStep(st, e.pointerId, s, grip.prev)")).toBeLessThan(p.indexOf("if (lockedInGoal || unsnapHolds("));
    // ⛔ without this the green box would read every frame of that drag as a RELEASE
    // ⭐ 2026-10-05: first a second touch still pending (a possible tap) keeps the orbit finger orbiting
    expect(code("render/green_box_wiring.ts")).toMatch(
      /const orbiting = pendingSecond\s*\? st\.orbitTap!\.orbitPointer\s*: out\.length === 1 && objs\.length === 0\s*\? out\[0\]!\.id\s*: lockedHolder\s*\? objs\[0\]!\.id\s*: null;/,
    );
  });
});
