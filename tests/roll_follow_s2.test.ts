// ⭐⭐⭐ (2026-11-18, FAST_ORBIT.md §12.2 R7, O8, §13.5, §14 — FO3 S2) THE FINGER READ OFF THE PICTURE DRAWN outside a spit (`fingerOnGhost`): a move on
// the picture's glass read on the logic's (the ghost's) glass — the same world move, its length kept; and its wiring (`zoneFinger`) read in the source
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import type { CamPose } from "../src/input/orbit_tilt";
import { fingerOnGhost, framedLine, poseAxes, poseRolled } from "../src/input/roll_follow";

const DEG = Math.PI / 180;
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ghost: CamPose = { eye: [1.1, 0.9, 1.3], look: [0, 0.229, 0.191], up: unit([0.1, 1, -0.2]) };
// close in: the piece on the view through the glass's centre (the framed line the view itself) — a roll is exactly a turn of the glass
const pieceOnView: Vec3 = [0.55, 0.5645, 0.7455];
/** the world move a finger move (dx right, dy up) makes on a pose's glass */
const worldOf = (p: CamPose, dx: number, dy: number): Vec3 => {
  const [, u, s] = poseAxes(p);
  return [dx * s[0] + dy * u[0], dx * s[1] + dy * u[1], dx * s[2] + dy * u[2]];
};

describe("fingerOnGhost — the finger on the picture read on the logic's glass", () => {
  it("no gap (the same pose object, or the same axes): the move as it is, bit for bit", () => {
    expect(fingerOnGhost(3.7, -1.25, ghost, ghost)).toEqual({ dx: 3.7, dy: -1.25 });
    const same: CamPose = { eye: [...ghost.eye] as Vec3, look: [...ghost.look] as Vec3, up: [...ghost.up] as Vec3 };
    expect(fingerOnGhost(3.7, -1.25, same, ghost)).toEqual({ dx: 3.7, dy: -1.25 });
    expect(fingerOnGhost(0, 0, poseRolled(ghost, framedLine(ghost, pieceOnView), 1), ghost)).toEqual({ dx: 0, dy: 0 });
  });
  it("the picture rolled by θ about the view: the move is the SAME WORLD MOVE on the ghost's glass, turned by θ, its length kept", () => {
    const line = framedLine(ghost, pieceOnView);
    for (const th of [10, -37, 90, 135, 178]) {
      const pic = poseRolled(ghost, line, th * DEG);
      for (const [dx, dy] of [[5, 0], [0, 5], [3, -4], [-2.5, 1]] as const) {
        const r = fingerOnGhost(dx, dy, pic, ghost);
        // the same world move
        const a = worldOf(pic, dx, dy);
        const b = worldOf(ghost, r.dx, r.dy);
        expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1e-9);
        // its length kept, turned by |θ| on the glass
        expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(Math.hypot(dx, dy), 12);
        const cosT = (dx * r.dx + dy * r.dy) / (dx * dx + dy * dy);
        expect(Math.acos(Math.max(-1, Math.min(1, cosT))) / DEG).toBeCloseTo(Math.abs(th), 6);
      }
    }
  });
  it("the picture rolled about a framed line off the view (far out): the world move's part on the ghost's glass, its length kept", () => {
    const piece: Vec3 = [0.21, 0.32, 0.18];
    const pic = poseRolled(ghost, framedLine(ghost, piece), 60 * DEG);
    const r = fingerOnGhost(4, 3, pic, ghost);
    expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(5, 12);
    const a = worldOf(pic, 4, 3);
    const [, u, s] = poseAxes(ghost);
    const k = 5 / Math.hypot(dot(a, s), dot(a, u));
    expect(r.dx).toBeCloseTo(dot(a, s) * k, 12);
    expect(r.dy).toBeCloseTo(dot(a, u) * k, 12);
  });
  it("a move and its opposite stay opposite (no bias); a move right on a picture rolled back half a turn reads LEFT on the logic's glass", () => {
    const pic = poseRolled(ghost, framedLine(ghost, pieceOnView), 33 * DEG);
    const p = fingerOnGhost(2, 1, pic, ghost);
    const m = fingerOnGhost(-2, -1, pic, ghost);
    expect(p.dx).toBeCloseTo(-m.dx, 12);
    expect(p.dy).toBeCloseTo(-m.dy, 12);
    const half = fingerOnGhost(5, 0, poseRolled(ghost, framedLine(ghost, pieceOnView), Math.PI), ghost);
    expect(half.dx).toBeCloseTo(-5, 9);
    expect(half.dy).toBeCloseTo(0, 9);
  });
});

describe("the wiring (`zoneFinger`) — read in the source", () => {
  const aw = readFileSync("src/render/assembly_wiring.ts", "utf8");
  it("outside a spit: the finger turned onto the logic's glass only when the picture is DRAWN with a gap; in a spit read off `asmCamLast` (the picture) as before", () => {
    expect(aw).toContain("if (sh === null || !sh.drawn || sh.picture === sh.ghost) return { dx, fdy };");
    expect(aw).toContain("const f = fingerOnGhost(dx, fdy, sh.picture, sh.ghost);");
    expect(aw).toMatch(/const z = spitZone\(st\);\n\s*if \(z === null\) \{/);
  });
});
