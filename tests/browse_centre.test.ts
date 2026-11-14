/**
 * ⭐⭐ (2026-11-13) BROWSING a scene's model before a part is in hand — the owner: "the player shall be able to move the center of the current orbit
 * towards the piece of his choice" → "the change of orbit center shall be done with one rapid tap followed by press (which drives the orbit). The
 * translation of the orbit center shall be done as per the mm of delta input or at a certain minimal speed, whichever is fastest".
 * `input/goal_lock.ts` (`browseTargetOnPress`, `browseGlideAt`); `render/pointer_wiring.ts`, `render/render_loop.ts`. ⭐ Every press at boot moves the centre (no tap + press since 2026-11-13).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { browseGlideAt, browseTargetOnPress } from "../src/input/goal_lock";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const hit: [number, number, number] = [1, 0.2, -3];

describe("① EVERY PRESS on a part or the floor, no part in hand, starts the glide (the owner: \"not any longer the tap + press\")", () => {
  it("a first touch / left click whose ray hits: the point to glide to", () => {
    expect(browseTargetOnPress(true, true, false, hit)).toEqual(hit);
  });
  it("⛔ not with a part in hand, not a second touch, not another button, not a miss", () => {
    expect(browseTargetOnPress(true, true, true, hit)).toBeNull();
    expect(browseTargetOnPress(false, true, false, hit)).toBeNull();
    expect(browseTargetOnPress(true, false, false, hit)).toBeNull();
    expect(browseTargetOnPress(true, true, false, null)).toBeNull();
  });
});

describe("③ the GLIDE: proportional to the finger's travel, arriving after the set travel (30 mm) whatever the distance", () => {
  const from: [number, number, number] = [0, 0, 0];
  const to: [number, number, number] = [0.7, 0, 0]; // a heap 0.7 m away
  it("PROPORTIONAL: 10 mm of 30 = a third of the way; 20 mm = two thirds (linear — no ease: the blend's slow start was the stall)", () => {
    expect(browseGlideAt(from, to, 10, 30).at[0]).toBeCloseTo(0.7 / 3, 12);
    expect(browseGlideAt(from, to, 20, 30).at[0]).toBeCloseTo((2 * 0.7) / 3, 12);
  });
  it("arrives EXACTLY at the set travel, whatever the distance (a near or a far target alike); never past it", () => {
    expect(browseGlideAt(from, to, 30, 30)).toEqual({ at: [0.7, 0, 0], arrived: true });
    expect(browseGlideAt(from, [3, 1, -2], 30, 30)).toEqual({ at: [3, 1, -2], arrived: true });
    expect(browseGlideAt(from, to, 45, 30).at).toEqual([0.7, 0, 0]);
  });
  it("a still finger: the centre stays where it is (no time-driven motion)", () => {
    expect(browseGlideAt(from, to, 0, 30)).toEqual({ at: [0, 0, 0], arrived: false });
  });
  it("the default: 12 mm (the owner: \"do 12 mm of travel instead of 30 mm\")", () => {
    expect(DEFAULT_CONFIG.browseArriveMm).toBe(12);
  });
});

describe("wired", () => {
  it("at the PRESS: picked from the model's parts and floor only, the glide started (no arming, no window); the frame moves it by the finger's travel", () => {
    const p = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8");
    expect(p).toMatch(/st\.scene\.pick\(e\.clientX, e\.clientY, \(m\) => st\.modelBrowse\.has\(m\)/);
    expect(p).toMatch(/const to = browseTargetOnPress\([^\n]*\);\s*if \(to !== null\) st\.browseGlide = \{ from: st\.centreBlend\.centreM, to, travelledMm: 0 \};/);
    expect(p).not.toMatch(/browseArmed|pendingBrowseCentre/);
    expect(p).toMatch(/st\.browseFingerMm \+= Math\.hypot\(dx, dy\) \/ mmToPx\(1\);/);
    const l = readFileSync(new URL("../src/render/render_loop.ts", import.meta.url), "utf8");
    expect(l).toMatch(/gl\.travelledMm \+= st\.browseFingerMm;\s*const g = browseGlideAt\(gl\.from, gl\.to, gl\.travelledMm, st\.cfg\.browseArriveMm\);/);
    const m = readFileSync(new URL("../src/render/model_import.ts", import.meta.url), "utf8");
    expect(m).toMatch(/for \(const m of byLayer\.get\("render"\)!\) st\.modelBrowse\.add\(m\);/);
  });
});
