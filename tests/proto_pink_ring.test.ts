/**
 * ⭐⭐⭐ prototype (green box) — THE PINK RING AT THE YELLOW TARGET, THE GREEN PYRAMID, AND THE HUD'S GREEN LINE
 * (the owner, 2026-10-02).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { bodyNamed, greenPyramidSizeM, pinkRingVisibility } from "../src/input/green_box";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ prototype — the pink ring's occlusion", () => {
  it("⭐ a piece in front hides it; only the green piece in front makes it translucent; nothing in front, visible", () => {
    const at = 1.0;
    const eps = 0.002;
    expect(pinkRingVisibility([], at, eps)).toBe("VISIBLE");
    expect(pinkRingVisibility([{ distanceM: 0.6, isGreenBox: true }], at, eps)).toBe("TRANSLUCENT");
    expect(pinkRingVisibility([{ distanceM: 0.6, isGreenBox: false }], at, eps)).toBe("HIDDEN");
    // the green piece AND a piece in front: the piece hides it
    expect(pinkRingVisibility([{ distanceM: 0.4, isGreenBox: true }, { distanceM: 0.7, isGreenBox: false }], at, eps)).toBe("HIDDEN");
    // ⭐ the piece the target sits ON is met right at the target — it does not hide it
    expect(pinkRingVisibility([{ distanceM: 0.9995, isGreenBox: false }], at, eps)).toBe("VISIBLE");
    // a piece BEHIND the target never hides it
    expect(pinkRingVisibility([{ distanceM: 1.3, isGreenBox: false }], at, eps)).toBe("VISIBLE");
  });

  it("⭐ wired: at the yellow target, the amber ring's size on the glass, billboarded, drawn on top; frozen bodies never hide it", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const t = st\.centreBlend\.targetM;/);
    expect(w).toMatch(/trackingMetresPerPx\(dist, st\.camera\.fov, st\.canvas\.clientHeight\) \* GIZMO_RING_PX/);
    expect(w).toMatch(/ring\.billboardMode = Mesh\.BILLBOARDMODE_ALL;/);
    expect(w).toMatch(/st\.world\.objects\.get\(id\)\?\.frozen !== true/);
    expect(w).toMatch(/ring\.alpha = v === "TRANSLUCENT" \? PINK_MASKED_ALPHA : 1;/);
    expect(w.indexOf("pinkRingFrame(st);")).toBeGreaterThan(w.indexOf("st.camera.setTarget(c.clone());"));
  });
});

describe("⭐⭐ prototype — the green piece is a PYRAMID, Piece17 × 150 %, its height halved, its length cut by 25 %", () => {
  it("⭐ 103.5 × 41.25 × 45 mm in Scene_1, its top tapered to half (Scene_0's pyramid); none without a Piece17", () => {
    const p17 = bodyNamed(SCENE_1.bodies, "Piece17")!;
    expect(p17.dims).toEqual([0.92, 0.55, 0.3]);
    const s = greenPyramidSizeM(p17.dims, SCENE_1.unitM!);
    // the owner: *"Dimensions = 150 % dimensions of the piece 17"*, *"divide the height of the green piece by 2"*, then
    // *"reduce the length of the green piece by 25%"* — the length is its longest side, the width
    [0.1035, 0.04125, 0.045].forEach((v, i) => expect(s[i]!).toBeCloseTo(v, 12));
    expect(bodyNamed(SCENE_0.bodies, "Piece17")).toBeNull();
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/bodyNamed\(st\.sceneSpec\.bodies, "Piece17"\)/);
    expect(w).toMatch(/greenPyramidSizeM\(piece17\.dims, st\.sceneSpec\.unitM \?\? 1\)/);
    expect(w).toMatch(/taperMesh\(box, OBJECT_TOP_SCALE\)/);
  });
});

describe("⭐ prototype — the HUD's green line (the owner: *\"after motion, add a line with the distance of the green piece to yellow orbit center\"*)", () => {
  it("⭐ right after motion; the distance is to the YELLOW target (the marker), set every frame", () => {
    const hud = code("render/hud.ts");
    expect(hud.indexOf("`green     ${f.green}`")).toBeGreaterThan(hud.indexOf("`motion    ${f.motion}`"));
    expect(hud.indexOf("`green     ${f.green}`")).toBeLessThan(hud.indexOf("`last      ${f.lastVerdict}`"));
    expect(code("render/hud_paint.ts")).toContain("green: greenReadout(st),");
    const w = code("render/green_box_wiring.ts");
    expect(w).toContain("const tgt = st.centreBlend.targetM;");
    expect(w).toMatch(/st\.greenBoxDistM = Math\.hypot\(box\.position\.x - tgt\[0\], box\.position\.y - tgt\[1\], box\.position\.z - tgt\[2\]\);/);
  });
});
