/**
 * ⭐⭐ **AUTOMATIC SHADOWS — off on a device too slow to afford them** (`D138`, the owner, 2026-09-28:
 * *"removing shadows increase from 10fps to 20fps on my tablet running the github website. Make an
 * automatic remover for weak mobile devices."*). Engine-free.
 *
 * ⭐ **MEASURED, NOT GUESSED**: no GPU name list, no device table — the frame meter reports what THIS
 * device takes with the shadows ON, and the verdict follows. ⭐ A threshold in milliseconds is a claim
 * about the hardware (`METHOD`), and here that is the point: it is judged on the device it decides for.
 *
 * ⭐ **ONCE, THEN LATCHED**: after a warm-up (boot's shader compiles are not the device's pace) and
 * enough frames to settle, the MEDIAN is compared with the budget — the median, so one hitch cannot turn
 * the shadows off — and the answer stands for the session. ⛔ Re-deciding with the shadows OFF would
 * measure a faster device and turn them back on: a flicker, the mode-keyed-on-motion shape.
 */
import type { FrameStats } from "./frame_meter";

/** Boot's own hitches (shader compiles, the first layout) are not the device's pace. */
export const AUTO_SHADOW_WARMUP_MS = 3000;
/** Enough frames for a median to mean something — 3 s at the 10 fps that prompted this. */
export const AUTO_SHADOW_MIN_FRAMES = 30;

/**
 * `"OFF"` — too slow for its shadows; `"ON"` — fast enough; `null` — not measured enough yet.
 * @param sinceArmedMs time since the measurement began (boot, or the switch set back to auto).
 * @param budgetMs the median frame time a device must beat to keep its shadows.
 */
export function autoShadowVerdict(
  stats: FrameStats | null,
  sinceArmedMs: number,
  budgetMs: number,
): "ON" | "OFF" | null {
  if (!stats || sinceArmedMs < AUTO_SHADOW_WARMUP_MS || stats.n < AUTO_SHADOW_MIN_FRAMES) return null;
  return stats.medianMs > budgetMs ? "OFF" : "ON";
}

/**
 * ⭐⭐⭐ (2026-10-15, the owner: *"make the green - turquoise piece project shadows, even on low fps device"*) — **THE SHADOW LEVEL**: `FULL` (every body,
 * every light) when the shadows are on — `shadowsOn` 1, or AUTO measuring or measured fast; else `PIECE`: the orbited piece's shadow alone, from ONE
 * light (`keyLightIndex`) — one small map with one mesh instead of three redrawing the painting. ⛔ A slow device (or the switch at 0) had none.
 */
export function shadowLevel(mode: number, auto: "ON" | "OFF" | null): "FULL" | "PIECE" {
  return mode === 1 || (mode === 2 && auto !== "OFF") ? "FULL" : "PIECE";
}

/** ⭐ The light that draws the piece's shadow alone: the strongest (−1 with none). */
export function keyLightIndex(intensities: readonly number[]): number {
  let best = -1;
  intensities.forEach((v, i) => {
    if (best < 0 || v > intensities[best]!) best = i;
  });
  return best;
}
