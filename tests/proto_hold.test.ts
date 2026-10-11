/**
 * ⭐⭐⭐ prototype — THE HELD SECOND TOUCH (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11): the white sphere deleted; the second
 * touch (the right button) held off the orbited pieces + the first touch's dx — the way in, the orbit round the piece, the roll; its
 * release — the way out; its press on a placed part's face — the pink face (option B: at the way in or the release, never on a pinch);
 * the first touch lifted and pressed again — the same input; the highlights held, then faded (one slider, two cursors).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { highlightAlpha, holdDecision, pinkCandidate, pinkChanges } from "../src/input/hold_gesture";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const DB = 3.5;

describe("⭐⭐⭐ prototype — the held second touch: the rules (`input/hold_gesture.ts`)", () => {
  it("⭐⭐ the first touch's dx past the deadband decides: the second within half its deadband — the WAY IN; past it — a PINCH (the owner's point 4)", () => {
    expect(holdDecision(3, 0, DB)).toBeNull(); // not yet
    expect(holdDecision(-3.6, 0.7, DB)).toBe("WAY"); // the second held (its measured noise, 0.76 mm, well within)
    expect(holdDecision(3.6, 1.7, DB)).toBe("WAY");
    expect(holdDecision(3.6, -1.8, DB)).toBe("ZOOM"); // on its way: a pinch whose first finger's event happened to land first
    expect(holdDecision(3.6, 3.6, DB)).toBe("ZOOM");
  });

  it("⭐⭐ the pink face: a PLACED part only — never a frozen body (*\"frozen bodies (the floor) are never a pink face … ok\"*), never the orbited pieces", () => {
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: false, objectId: "Piece1", inBand: false })).toBe(true);
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: true, objectId: "Floor", inBand: false })).toBe(false);
    expect(pinkCandidate({ onOrbitedPiece: true, frozen: false, objectId: "green-piece", inBand: false })).toBe(false);
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: false, objectId: null, inBand: false })).toBe(false); // empty space
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: false, objectId: "Piece1", inBand: true })).toBe(false);
    // the same face again: nothing (*"same pink face pressed again does nothing"*)
    expect(pinkChanges({ objectId: "Piece1", faceId: "f2" }, { objectId: "Piece1", faceId: "f2" })).toBe(false);
    expect(pinkChanges({ objectId: "Piece1", faceId: "f2" }, { objectId: "Piece1", faceId: "f3" })).toBe(true);
    expect(pinkChanges(null, { objectId: "Piece1", faceId: "f3" })).toBe(true);
  });

  it("⭐⭐ the highlights: on during the input, held after it, then faded to nothing; none before any input", () => {
    const H = 750;
    const F = 250;
    expect(highlightAlpha(5000, true, null, H, F)).toBe(1);
    expect(highlightAlpha(5000, false, null, H, F)).toBe(0); // boot: none
    expect(highlightAlpha(1000 + 700, false, 1000, H, F)).toBe(1); // held
    expect(highlightAlpha(1000 + 750 + 125, false, 1000, H, F)).toBeCloseTo(0.5, 12); // half faded
    expect(highlightAlpha(1000 + 1000, false, 1000, H, F)).toBe(0);
    expect(highlightAlpha(1000 + 751, false, 1000, H, 0)).toBe(0); // no fade: off at once
    expect([DEFAULT_CONFIG.highlightHoldMs, DEFAULT_CONFIG.highlightFadeMs]).toEqual([750, 250]); // *"Set default timer 750 ms"*
  });
});

describe("⭐⭐⭐ prototype — the held second touch, wired", () => {
  it("⭐⭐ the press: the right button or a finger with ONE other down is the SECOND touch (not on the orbited piece); held, a new press is the FIRST again; neither grabs", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/: st\.hold !== null\s*\? st\.hold\.first === null && e\.pointerId !== st\.hold\.second\s*\? "FIRST"\s*: null\s*: !onOrbited &&\s*\(e\.pointerId === MOUSE_SECOND_ID \|\|\s*\(e\.pointerType !== "mouse" && st\.router\.outside\(\)\.length === 1 && st\.router\.objects\(\)\.length === 0\)\)\s*\? "SECOND"\s*: null;/);
    expect(p).toMatch(/const rayHit =\s*holdRole !== null \? null : throughGreenBox\(/);
    // the pink face its press would take — a placed part only
    expect(p).toMatch(/pinkCandidate\(\{ onOrbitedPiece: onOrbited, frozen, objectId: hitObj \?\? null, inBand \}\)/);
    expect(p).toMatch(/holdSecondPress\(st, e\.pointerId, s\.x, firstNow,/);
    expect(p).toMatch(/\} else if \(holdRole === "FIRST"\) holdFirstPress\(st, e\.pointerId, s\.x\);/);
    // ⛔ the old second-touch taps and the yaw / pitch are gone
    expect(p).not.toMatch(/orbitTap|pinkTap|tumble/);
  });

  it("⭐⭐ the moves: the input owns both touches' — undecided (nothing moves), the way in (dx only), or the zoom; ⛔ never the centre orbit while held", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(st\.hold !== null && \(e\.pointerId === st\.hold\.first \|\| e\.pointerId === st\.hold\.second\)\) \{\s*holdMove\(st, e\.pointerId, s, prev, \(dxOnly\) => orbitDragStep\(st, e\.pointerId, s, prev, dxOnly\)\);\s*st\.hudDirty = true;\s*return;\s*\}/);
    // dy ignored on the way in / round the piece
    expect(p).toMatch(/const dy = dxOnly \? 0 : s\.y - prev\.y;/);
    const h = code("render/hold_wiring.ts");
    // WAY: the pink face taken (option B), then the way in; the roll counted from here
    expect(h).toMatch(/takePink\(st\);\s*h\.shown = true;[^\n]*\n\s*if \(enterPieceOrbit\(st\)\) st\.lastVerdict \+= " — the way in";\s*st\.orbitRollAcc = 0;\s*st\.pieceYawGainDrag = st\.pieceYawGain;/);
    // ZOOM: the zoom from where it is decided; a pinch never takes the pink face
    expect(h).toMatch(/if \(d === "ZOOM"\) \{[\s\S]*?st\.pinch\.begin\(p\[0\], p\[1\]\);\s*st\.zoomAtPinchStart = st\.zoom;[\s\S]*?h\.pink = null;/);
    expect(h).toMatch(/orbitStep\(true\);/);
  });

  it("⭐⭐ the release: the second — the way out (if the way in had started) or the pink face of a press that never pinched; the first — the input goes on", () => {
    const h = code("render/hold_wiring.ts");
    expect(h).toMatch(/if \(h\.mode === "WAY"\) \{[\s\S]*?returnToCentreOrbit\(st, true\);[\s\S]*?\} else if \(h\.mode === "HELD"\) takePink\(st\);/);
    // ⭐⭐ (2026-10-11, *"why a second touch tap outside any object still highlights … There should not be any action"*) — the clock only
    // after an ACTION: the pink face taken, or the way in
    expect(h).toMatch(/st\.hold = null;\s*(?:\/\/[^\n]*\n\s*)+if \(h\.shown\) st\.highlightEndedAt = performance\.now\(\);/);
    expect(h).toMatch(/st\.pinkFace = next;\s*h\.shown = true;/);
    expect(h).toMatch(/st\.hold = \{ second, first, mode: "HELD", secondX0: x, firstX0: xOf\(st, first\), pink, shown: false \};/);
    expect(h).toMatch(/if \(pointerId === h\.first\) \{\s*h\.first = null;/);
    // the pink face: the same face does nothing; a new one aligned, one episode
    expect(h).toMatch(/if \(!pinkChanges\(st\.pinkFace, next\)\) return false;\s*st\.pinkFace = next;\s*h\.shown = true;[^\n]*\n\s*if \(alignRestingFace\(st, performance\.now\(\)\)\) \{\s*st\.episodes\.touch\(--st\.episodeSeq, true, true\);/);
    // ⛔ no change of the orbit centre anywhere in it
    expect(h).not.toMatch(/centreBlend\.retarget|recomputeOrbitCentre/);
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(holdRelease\(st, e\.pointerId\) === "SECOND"\) \{\s*st\.hudDirty = true;\s*return;\s*\}/);
  });

  it("⛔⛔ (2026-10-11, *\"the object systematically translates towards the world's negative depth axis when second touch is lifted\"*) the way out and the way in read the ANCHOR, never the mesh's origin", () => {
    const w = code("render/green_box_wiring.ts");
    const out = w.slice(w.indexOf("export function returnToCentreOrbit("), w.indexOf("function counterYawFrame("));
    const into = w.slice(w.indexOf("export function enterPieceOrbit("), w.indexOf("export function returnToCentreOrbit("));
    // ⭐ the anchor — the resting face's centre, what rides the rings — for the rebase's yaw and for the offset the way out fades
    expect(out).toMatch(/const a = st\.pieceAnchor;\s*const p = a === null \? box\.position : \{ x: a\[0\], y: a\[1\], z: a\[2\] \};\s*st\.orbit = new OrbitController\(/);
    expect(out).toMatch(/const a = st\.pieceAnchor;\s*const p = a === null \? box\.position : \{ x: a\[0\], y: a\[1\], z: a\[2\] \};\s*const pieceOff: Vec3 = rebase/);
    expect(into).toMatch(/const a = st\.pieceAnchor;\s*const pos = a === null \? box\.position : \{ x: a\[0\], y: a\[1\], z: a\[2\] \};/);
    // ⛔ read at the mesh, the offset carried the piece by its middle-to-face distance (20.6 mm toward −z, headless)
    expect(out).not.toMatch(/^\s*const p = box\.position;/m);
    expect(into).not.toMatch(/^\s*const pos = box\.position;/m);
  });

  it("⭐ the frame: the first touch orbits only on the way in / round the piece; no coast while the second touch is held (*\"the orbit simply waits for the re-press\"*)", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/if \(st\.hold === null\) st\.orbitInertia\.release\(now\);\s*else st\.orbitInertia\.stop\(\);/);
  });

  it("⭐⭐ the desktop (2026-10-11, *\"build with ALT and CTRL\"*): ALT or CTRL held is the second touch whenever a piece is orbited; the LEFT click while it is held names the pink face", () => {
    const flat = (t: string) => t.replace(/\s+/g, " ");
    expect(code("render/scene.ts")).toContain("() => st.greenBox !== null);");
    const a = flat(code("render/mouse_adapter.ts"));
    expect(a).toContain('const modKey = (k: string) => k === "Alt" || k === "Control";');
    expect(a).toContain('if (modKey(e.key) && !e.repeat && !modDown && orbitSecond !== undefined && orbitSecond()) { modDown = true; apply({ type: "MOD_DOWN"');
    expect(a).toContain('if (modKey(e.key) && modDown && !e.altKey && !e.ctrlKey) { modDown = false; apply({ type: "MOD_UP"');
    expect(a).toContain("mod: e.altKey || e.ctrlKey,");
    // a lost focus lifts it (the way out, as a release)
    expect(a).toContain('if (modDown) { modDown = false; apply({ type: "MOD_UP", button: -1, buttons: 0, shift: false');
    // the wheel never zooms the page nor walks the history: blocked on the canvas, whatever key
    expect(a).toContain("const onWheel = (e: WheelEvent) => { if (onWheelNotches === undefined) return; e.preventDefault();");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain('if (holdRole === "SECOND" || (holdRole === "FIRST" && e.pointerType === "mouse")) {');
    expect(p).toContain("} else holdFirstPress(st, e.pointerId, s.x, pink);");
    expect(code("render/hold_wiring.ts")).toContain('if (pink !== null && h.mode === "HELD") h.pink = pink;');
  });

  it("⭐⭐ the highlights wired: the resting face's fill and the pink face's (a child of its body) faded by one alpha; the slider with TWO cursors", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const a = highlightAlpha\(now, st\.hold !== null && st\.hold\.shown, st\.highlightEndedAt, st\.cfg\.highlightHoldMs, st\.cfg\.highlightFadeMs\);\s*pinkFillFrame\(st, a\);/);
    expect(w).toMatch(/\(fill\.material as StandardMaterial\)\.alpha = RESTING_ALPHA \* a;/);
    expect(w).toMatch(/if \(pf !== null && mesh !== undefined && st\.world\.objects\.get\(pf\.objectId\)\?\.frozen !== true\) \{/);
    const menu = code("render/tuning_menu.ts");
    expect(menu).toMatch(/highlightTimerSlider\(st\),/);
    expect(menu).toMatch(/set: \(v\) => fade\.set\(Math\.max\(0, v - st\.cfg\.highlightHoldMs\)\),/);
    expect(code("render/menu.ts")).toMatch(/if \(slider\.second !== undefined\) \{\s*addDual\(slider, slider\.second, body\);\s*continue;\s*\}/);
    // the first-touch tap on the piece shows them too
    expect(code("render/pointer_wiring.ts")).toMatch(/\/\/ ⭐ \(2026-10-11\) the highlights shown for the new resting face — held and faded\s*st\.highlightEndedAt = performance\.now\(\);/);
  });
});
