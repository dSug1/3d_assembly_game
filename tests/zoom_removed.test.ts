// ⛔⛔ (2026-11-13, the owner: *"Set the zoom at 1 and then remove the zoom function entirely. With the approach of the piece, there is no need for
// zoom."*) THE ZOOM DELETED — its inputs (the wheel, the pinch on empty space, the two-finger pinch around the assembly, the boot-zoom slider), its
// state (`st.zoom`, `zoomAtPinchStart`, `orbitStartZoom`, the pinch tracker), its range and its keep-on-screen floor (`clampGreenZoom`,
// `minGreenZoom`, `GREEN_ZOOM_MIN` / `_MAX`) and its tunables. The camera sits the radius offset behind the piece (zoom 1, as it booted since
// 2026-10-02); only the DEMO scales its camera's distance (`demoCameraScale`, `D171`). RED against `601cc85`: every assertion below.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import * as greenBox from "../src/input/green_box";
import { holdTapMode } from "../src/input/hold_gesture";

const root = new URL("../", import.meta.url);
const code = (p: string) => readFileSync(new URL(`src/${p}`, root), "utf8");
const flat = (p: string) => code(p).replace(/\s+/g, " ");
/** the code without its comments (a comment may name what was deleted; ⏸ the parked way in's commented-out lines too) */
const live = (text: string) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");
const allSrc = (): { file: string; text: string }[] => {
  const out: { file: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".ts")) out.push({ file: p, text: readFileSync(p, "utf8") });
    }
  };
  walk(new URL("src", root).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  return out;
};

describe("⛔⛔ the zoom deleted (2026-11-13)", () => {
  it("no zoom tunable: the boot zoom, the pinch's deadband and gain, the keep-in-view margin", () => {
    for (const k of ["bootZoom", "pinchDeadband", "gainZoom", "greenKeepInViewMargin"]) expect(k in DEFAULT_CONFIG).toBe(false);
  });

  it("no zoom's range or floor: the camera's gap behind the piece is the radius offset × a plain scale (1 but for the demo)", () => {
    for (const k of ["clampGreenZoom", "minGreenZoom", "GREEN_ZOOM_MIN", "GREEN_ZOOM_MAX"]) expect(k in greenBox).toBe(false);
    expect(greenBox.cameraGapM(1.25)).toBe(1.25);
    expect(greenBox.cameraGapM(1.25, 3)).toBe(3.75); // ⛔ the zoom's clamp held it to 2 (2.5 m): the demo's scale is not a zoom
  });

  it("no pinch zoom, no wheel zoom: their modules gone, the wheel only swallowed, no pinch tracker in the state", () => {
    expect(existsSync(new URL("src/input/pinch.ts", root))).toBe(false);
    expect(existsSync(new URL("src/input/mouse_wheel_zoom.ts", root))).toBe(false);
    expect(flat("render/mouse_adapter.ts")).toContain("const onWheel = (e: WheelEvent) => e.preventDefault();");
    expect(code("render/scene_state.ts")).not.toMatch(/\bpinch: |\bzoom: number|zoomAtPinchStart|orbitStartZoom|greenZoomMin/);
    expect(code("render/scene_state.ts")).toContain("demoCameraScale: number;");
  });

  it("nothing in the source reads or writes a zoom: `st.zoom`, the pinch's start, the wheel's notches", () => {
    for (const { file, text } of allSrc()) {
      expect(live(text), file).not.toMatch(/\bst\.zoom\b|zoomAtPinchStart|orbitStartZoom|wheelZoom\(|wheelNotches\(|updatePinch\(|PinchTracker|startZoom\(/);
    }
  });

  it("the camera: the rig at 1 — only the demo scales it; no boot zoom computed, no boot-zoom slider", () => {
    expect(code("render/camera_rig.ts")).toContain("const pose = st.orbit.pose(st.demoCameraScale);");
    expect(code("render/scene.ts")).toContain("  st.demoCameraScale = 1;\n");
    expect(code("render/demo_wiring.ts")).toContain("st.demoCameraScale = demoDistanceM(d.fitM, st.cfg.cameraRadiusMaxM, d.progress) / Math.max(1e-9, rigM);");
    expect(live(code("render/tuning_menu.ts"))).not.toMatch(/boot zoom|bootZoomSlider|keep-in-view/);
    expect(code("render/green_box_wiring.ts")).toContain("const gapFull = cameraGapM(st.cfg.cameraRadiusOffsetMm / 1000, st.demoCameraScale);");
  });

  it("two fingers: a pinch zooms nothing — around the assembly it is the approach (`pinch_approach.test.ts`); elsewhere nothing moves", () => {
    expect(holdTapMode("APPROACH", true)).toBe("HELD");
    const h = flat("render/hold_wiring.ts");
    expect(h).toContain('h.mode = "APPROACH"; st.lastVerdict = "orbit: two fingers — the approach by the pinch (spread: in, pinch: out)";');
    expect(h).not.toMatch(/\bupdatePinch\b|\bpinchPair\b/);
    expect(code("input/hold_gesture.ts")).toContain('export type HoldMode = "HELD" | "WAY" | "APPROACH";');
  });
});
