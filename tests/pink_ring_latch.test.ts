/**
 * GOLDEN VECTORS — prototype: **THE YELLOW GIZMO DOES NOT FLICKER** (2026-10-15, the owner: *"the yellow gizmo flickers sometimes when I orbit at
 * high distance"*). Measured headless on the far ring (camera 7.2 m out): at the same yaw on every turn the ring went shown → hidden → shown in
 * 2–4 frames — the camera's ray sweeping across a thin part as it comes out from behind the painting; the sway OFF changed nothing. Each frame's
 * verdict was right; switching on it every frame is the flicker. `ringLatch` adopts a new verdict once it has held `RING_SETTLE_MS`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RING_SETTLE_MS, ringLatch, type RingLatch, type RingVerdict } from "../src/input/green_box";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

/** the shown verdicts for a raw sequence at a frame interval */
function play(raw: RingVerdict[], frameMs: number): RingVerdict[] {
  let l: RingLatch | null = null;
  return raw.map((v, i) => {
    l = ringLatch(l, v, i * frameMs);
    return l.shown;
  });
}
const flips = (s: RingVerdict[]) => s.slice(1).filter((v, i) => v !== s[i]).length;

describe("⭐⭐⭐ the yellow gizmo's verdict held (2026-10-15)", () => {
  it("⭐⭐⭐ the measured pattern — hidden, 2 frames shown, 2 hidden, then shown — switches ONCE (⛔ three times)", () => {
    const raw: RingVerdict[] = [...Array(10).fill("HIDDEN"), "VISIBLE", "VISIBLE", "HIDDEN", "HIDDEN", ...Array(30).fill("VISIBLE")];
    expect(flips(raw)).toBe(3); // ⛔ what the ring did, frame by frame
    for (const ms of [7, 16.7, 33]) {
      const shown = play(raw, ms);
      expect(flips(shown)).toBe(1);
      expect(shown[shown.length - 1]).toBe("VISIBLE");
    }
  });
  it("⭐⭐ a verdict that HOLDS is adopted after RING_SETTLE_MS — a real occlusion still hides it, late by that much at most", () => {
    expect(RING_SETTLE_MS).toBe(120);
    const raw: RingVerdict[] = [...Array(5).fill("VISIBLE"), ...Array(40).fill("HIDDEN")];
    const shown = play(raw, 10);
    const at = shown.indexOf("HIDDEN");
    expect(at).toBeGreaterThan(5);
    expect((at - 5) * 10).toBeLessThanOrEqual(RING_SETTLE_MS + 10);
  });
  it("⭐ the first verdict is taken at once (no ring held back at boot)", () => {
    expect(ringLatch(null, "TRANSLUCENT", 0).shown).toBe("TRANSLUCENT");
  });
  it("⭐⭐ wired: the ring shows the HELD verdict", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("st.pinkRingLatch = ringLatch(st.pinkRingLatch, pinkRingVisibility(hits, dist, PINK_EPS_M), performance.now()); const v = st.pinkRingLatch.shown;");
  });
});
