/**
 * GOLDEN VECTORS — **`D138`: shadows switch themselves off on a device too slow for them** (the owner,
 * 2026-09-28: 10 fps with shadows, 20 fps without, on the tablet).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUTO_SHADOW_MIN_FRAMES, AUTO_SHADOW_WARMUP_MS, autoShadowVerdict } from "@core/auto_shadow";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const stats = (medianMs: number, p95Ms = medianMs, n = 60) => ({ medianMs, p95Ms, n });

describe("⭐⭐ `D138` — autoShadowVerdict", () => {
  it("⭐ the owner's tablet — 100 ms a frame with shadows — loses them; a 60 fps phone keeps them", () => {
    expect(autoShadowVerdict(stats(100), 5000, 33)).toBe("OFF");
    expect(autoShadowVerdict(stats(16.7), 5000, 33)).toBe("ON");
  });

  it("⛔ nothing is decided during the warm-up, or on too few frames — boot's hitches are not the device", () => {
    expect(autoShadowVerdict(stats(100), AUTO_SHADOW_WARMUP_MS - 1, 33)).toBeNull();
    expect(autoShadowVerdict(stats(100, 100, AUTO_SHADOW_MIN_FRAMES - 1), 5000, 33)).toBeNull();
    expect(autoShadowVerdict(null, 5000, 33)).toBeNull();
  });

  it("⭐ the MEDIAN decides, not the tail: a fast device with a few hitches keeps its shadows", () => {
    expect(autoShadowVerdict(stats(16.7, 120), 5000, 33)).toBe("ON");
  });

  it("⭐ the switch is three-way and ships on AUTO; the budget is a validated tunable", () => {
    expect(DEFAULT_CONFIG.shadowsOn).toBe(2);
    for (const v of [0, 1, 2]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, shadowsOn: v })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, shadowsOn: 3 })).toThrow(/shadowsOn/);
    expect(DEFAULT_CONFIG.autoShadowBudgetMs).toBe(33);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, autoShadowBudgetMs: 0 })).toThrow(/autoShadowBudgetMs/);
  });
});

describe("⭐⭐⭐ the orbited piece's shadow, on every device (2026-10-15, the owner: *\"make the green - turquoise piece project shadows, even on low fps device\"*)", () => {
  it("⭐⭐⭐ the level: FULL when the shadows are on (1, or auto measured fast or still measuring); else the PIECE's alone — never none", async () => {
    const { shadowLevel } = await import("../src/core/auto_shadow");
    expect(shadowLevel(1, null)).toBe("FULL");
    expect(shadowLevel(2, null)).toBe("FULL"); // auto, still measuring: on
    expect(shadowLevel(2, "ON")).toBe("FULL");
    expect(shadowLevel(2, "OFF")).toBe("PIECE"); // ✅ the slow device: the piece's shadow stays (⛔ none)
    expect(shadowLevel(0, null)).toBe("PIECE");
  });
  it("⭐⭐ the piece's shadow is drawn by ONE light, the strongest", async () => {
    const { keyLightIndex } = await import("../src/core/auto_shadow");
    expect(keyLightIndex([2, 7, 5])).toBe(1);
    expect(keyLightIndex([3])).toBe(0);
    expect(keyLightIndex([])).toBe(-1);
  });
  it("⭐⭐⭐ wired: the orbited pieces cast (a transparent-pass mesh casts only with `transparencyShadow`), and the level is applied — ⛔ the slow device switched every shadow off", () => {
    const read = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
    const l = read("render/lighting.ts");
    expect(l).toContain("g.transparencyShadow = true;");
    expect(l).toContain("export function attachOrbitedShadows(st: SceneState): void {");
    const sc = read("render/scene.ts");
    expect(sc.indexOf("attachOrbitedShadows(st);")).toBeGreaterThan(sc.indexOf("registerOrbitPieces(st);"));
    const loop = read("render/render_loop.ts");
    expect(loop).toContain("applyShadowLevel(st, shadowLevel(mode, st.autoShadow));");
    expect(loop).not.toContain("if (st.scene.shadowsEnabled !== on) st.scene.shadowsEnabled = on;");
  });
});
