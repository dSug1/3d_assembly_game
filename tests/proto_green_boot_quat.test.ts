/**
 * ⭐ prototype (green box) — the green piece's boot orientation per scene (the owner, 2026-10-04: *"For this specific scene, make the
 * quaternion (1,2,3,4) at boot"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { greenBootOrientation } from "../src/input/green_box";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐ prototype — the green piece's boot quaternion", () => {
  it("⭐ Scene_1: (1, 2, 3, 4) as (w, x, y, z), normalized; any other scene: the identity", () => {
    const q = greenBootOrientation("Scene_1");
    const n = Math.sqrt(30);
    [1, 2, 3, 4].forEach((v, i) => expect(q[i]).toBeCloseTo(v / n, 12));
    expect(Math.hypot(...q)).toBeCloseTo(1, 12);
    expect(greenBootOrientation("Scene_0")).toEqual([1, 0, 0, 0]);
  });

  it("⭐ wired: the piece in use is SPAWNED with it — at boot and at each switch between the green and the turquoise piece (2026-10-04)", () => {
    expect(code("render/green_box_wiring.ts")).toMatch(/p\.mesh\.rotationQuaternion = toBabylon\(greenBootOrientation\(st\.sceneSpec\.id\)\);/);
  });
});
