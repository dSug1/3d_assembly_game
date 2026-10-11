/**
 * ⭐⭐⭐ prototype — THE HELD SECOND TOUCH (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11): the white sphere deleted; the second
 * touch (the right button) held off the orbited pieces + the first touch's dx — the way in, the orbit round the piece, the roll; its
 * release — the way out; its press on a placed part's face — the pink face (option B: at the way in or the release, never on a pinch);
 * the first touch lifted and pressed again — the same input; the highlights held, then faded (one slider, two cursors).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { highlightAlpha, holdDecision, holdTapRolls, pinkCandidate, pinkChanges } from "../src/input/hold_gesture";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { pinchDxOpen } from "../src/input/pinch_gate";
import { orbitModifiers } from "../src/input/mouse_second_touch";

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

  it("⭐⭐ (2026-10-11, *\"zoom: make it possible also if first touch is immobile and second touch dx exit deadband\"*) the SECOND touch's dx past its deadband: a ZOOM, the first still", () => {
    expect(holdDecision(0, 3.6, DB)).toBe("ZOOM");
    expect(holdDecision(0.5, -3.6, DB)).toBe("ZOOM");
    expect(holdDecision(0, 3.4, DB)).toBeNull(); // within it: nothing yet
  });

  it("⭐⭐ (2026-10-11, *\"why when I tap CTRL during a dx orbit around the center, the piece jumps and come back?\"*) a TAP never starts the way in; undecided, the drag orbits the centre (no freeze)", () => {
    expect(holdDecision(3.6, 0, DB, 120, 200)).toBeNull(); // held 120 ms of a 200 ms tap: maybe a tap — no way in yet
    expect(holdDecision(3.6, 0, DB, 201, 200)).toBe("WAY"); // held longer: the way in
    expect(holdDecision(0, 3.6, DB, 50, 200)).toBe("ZOOM"); // the second finger's own dx: a zoom at once (a finger that moved is no tap)
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("performance.now() - h.t0, st.cfg.tapMaxDuration, );");
    // ⭐⭐ (*"while held it completely freezes the orbit"*) undecided: the first touch orbits the CENTRE (dx and dy) — a dy drag used to never decide
    expect(h).toContain("if (d === null) { // ⭐⭐");
    expect(h).toContain("if (pointerId === h.first) orbitStep(false); return h.mode; }");
    // the frame's camera follows it while undecided
    expect(code("render/green_box_wiring.ts")).toContain('? (h.mode === "WAY" || h.mode === "HELD" ? h.first : null)');
    // the pinch's own gate: the second finger's dx opens it, the first still or moving; the first alone never
    expect(pinchDxOpen(0, 3.6, DB)).toBe(true);
    expect(pinchDxOpen(4, -4, DB)).toBe(true);
    expect(pinchDxOpen(10, 1, DB)).toBe(false);
    // wired: judged at EITHER touch's move; the orbit steps only on the first's
    expect(h).toContain("if (pointerId !== h.first && pointerId !== h.second) return h.mode;");
    expect(h).toContain("if (pointerId === h.first) orbitStep(true);");
  });

  it("⭐⭐ the pink face: a PLACED part only — never a frozen body (*\"frozen bodies (the floor) are never a pink face … ok\"*), never the orbited pieces", () => {
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: false, objectId: "Piece1", inBand: false })).toBe(true);
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: true, objectId: "Floor", inBand: false })).toBe(false);
    expect(pinkCandidate({ onOrbitedPiece: true, frozen: false, objectId: "green-piece", inBand: false })).toBe(false);
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: false, objectId: null, inBand: false })).toBe(false); // empty space
    expect(pinkCandidate({ onOrbitedPiece: false, frozen: false, objectId: "Piece1", inBand: true })).toBe(false);
    // the same face again: nothing (*"same pink face pressed again does nothing"*)
    // ⭐⭐ (2026-10-11) against the face the piece is ALIGNED to — not the pink face: a plain left click on a part makes it the pink face
    // without aligning, and then the key + click on that SAME face must align (*"the logic is broken in this case. fix it"*)
    expect(pinkChanges("Piece1/f2", { objectId: "Piece1", faceId: "f2" })).toBe(false); // aligned to it already: nothing
    expect(pinkChanges("Piece1/f2", { objectId: "Piece1", faceId: "f3" })).toBe(true);
    expect(pinkChanges("frozen Floor/f1", { objectId: "Piece1", faceId: "f2" })).toBe(true); // aligned to the floor at boot
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
    expect([DEFAULT_CONFIG.highlightHoldMs, DEFAULT_CONFIG.highlightFadeMs]).toEqual([300, 250]); // *"set default hold = 300 ms fade = 250 ms"* (2026-10-11; was 750)
  });
});

describe("⭐⭐⭐ prototype — the held second touch, wired", () => {
  it("⭐⭐ the press: the right button or a finger with ONE other down is the SECOND touch (not on the orbited piece); held, a new press is the FIRST again; neither grabs", () => {
    const p = code("render/pointer_wiring.ts");
    // ⭐ (2026-10-11) the desktop's key is the second touch over the orbited piece too; a finger, never on it
    expect(p).toMatch(/: st\.hold !== null\s*\? st\.hold\.first === null && e\.pointerId !== st\.hold\.second\s*\? "FIRST"\s*: null\s*: e\.pointerId === MOUSE_SECOND_ID \|\|\s*\(!onOrbited &&\s*e\.pointerType !== "mouse" &&\s*\(\(st\.router\.outside\(\)\.length === 1 && st\.router\.objects\(\)\.length === 0\) \|\| partFirst\(st, e\.pointerId\) !== null\)\)\s*\? "SECOND"/);
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
    expect(h).toMatch(/if \(h\.mode === "WAY"\) \{[\s\S]*?returnToCentreOrbit\(st, true\);[\s\S]*?\} else if \(h\.mode === "HELD"\) \{\s*if \(takePink\(st\)\) h\.pressActed = true;/);
    // ⭐⭐ (2026-10-11, *"why a second touch tap outside any object still highlights … There should not be any action"*) — the clock only
    // after an ACTION: the pink face taken, or the way in
    expect(h).toMatch(/st\.hold = null;\s*(?:\/\/[^\n]*\n\s*)+if \(h\.shown\) st\.highlightEndedAt = performance\.now\(\);/);
    expect(h).toMatch(/st\.pinkFace = next;\s*h\.shown = true;/);
    expect(h).toMatch(/st\.hold = \{ second, first, mode: "HELD", secondX0: x, firstX0: xOf\(st, first\), pink, shown: false, t0: performance\.now\(\), pressActed: false \};/);
    const hf = h.replace(/\s+/g, " ");
    // the first touch lifted: the input goes on — ⭐⭐ (2026-10-11, *"while CTRL/ALT is pressed, left click tap defines the new pink face"*) and
    // the click that named the pink face (the mouse) takes it at its own release, the key still held
    expect(hf).toContain("if (pointerId === h.first) {");
    expect(hf).not.toContain("if (tapped && h.mode === \"HELD\" && h.pink !== null)"); // ⛔ taken at the press now
    // ⭐ (2026-10-11, *"if the same pink face is selected again, display the highlights"*) — nothing realigned, the highlights shown
    expect(hf).toContain("if (!pinkChanges(st.restRoll?.key ?? null, next)) { // ⭐");
    const same = hf.slice(hf.indexOf("if (!pinkChanges(st.restRoll?.key ?? null, next)) {"), hf.indexOf("return false; }", hf.indexOf("if (!pinkChanges(st.restRoll?.key ?? null, next)) {")));
    expect(same).toContain("h.shown = true;");
    expect(same).not.toContain("alignRestingFace");
    // the pink face: the same face does nothing; a new one aligned, one episode
    expect(h).toMatch(/return false;\s*\}\s*st\.pinkFace = next;\s*h\.shown = true;[^\n]*\n\s*if \(alignRestingFace\(st, performance\.now\(\)\)\) \{\s*st\.episodes\.touch\(--st\.episodeSeq, true, true\);/);
    // ⛔ no change of the orbit centre anywhere in it
    expect(h).not.toMatch(/centreBlend\.retarget|recomputeOrbitCentre/);
    const p = code("render/pointer_wiring.ts");
    expect(p.replace(/\s+/g, " ")).toContain(
      'if ( holdRelease( st, e.pointerId, isTapRelease(routed.pressed.t, routed.pressed.x, routed.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop)), ) === "SECOND" ) { st.hudDirty = true; return; }',
    );
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
    // ⭐⭐ (2026-10-11, *"the action is triggered directly by CTRL being pressed or tapped : this sends a raycast which first hit is the item on
    // which the action is triggered"*) — the KEY's press acts: a part's face the pink face (as a second finger's press), the orbited piece the
    // resting face; ⛔ the left click names nothing
    expect(p).toContain('if (holdRole === "SECOND") {');
    expect(p).not.toContain('holdRole === "FIRST" && e.pointerType === "mouse"');
    expect(p.replace(/\s+/g, " ")).toContain("if (onOrbited && e.pointerId === MOUSE_SECOND_ID && st.greenBox !== null) {");
    expect(p).toMatch(/if \(pf !== null && selectRestingFace\(st, pf\.faceId\) && st\.hold !== null\) st\.hold\.shown = true;/);
    expect(code("input/mouse_second_touch.ts")).toMatch(/return s\.shiftMade\s*\? \{ target: "SECOND", kind, x: s\.x, y: s\.y, anchorOnly: true \}/);
    // ⭐⭐ (2026-10-11, *"immediately when left button is pressed. Same for the mobile input"*) the pink face taken AT THE PRESS — the key
    // held + a left press (the way in started or not, never in a zoom), and a second finger's press on a part
    const hw = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(hw).not.toContain("h.pink = pink; takePink(st);"); // ⛔ (2026-10-11) the left click names no pink face — the key's press does
    const sp = hw.slice(hw.indexOf("export function holdSecondPress("), hw.indexOf("export function holdFirstPress("));
    expect(sp).toContain('st.hold = { second, first, mode: "HELD", secondX0: x, firstX0: xOf(st, first), pink, shown: false, t0: performance.now(), pressActed: false };');
    expect(sp).toContain("if (takePink(st) && st.hold !== null) st.hold.pressActed = true;");
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

describe("⭐ prototype — the pink gizmo's switch (2026-10-11, *\"add a slider to hide the pink gizmo\"*)", () => {
  it("⭐ SHOWN by default (*\"set the default : pink gizmo shown\"*, after a few minutes hidden); at 0 the ring at the orbit centre is not drawn", () => {
    expect(DEFAULT_CONFIG.pinkGizmoVisible).toBe(1);
    expect(code("render/tuning_menu.ts")).toContain('"pinkGizmoVisible", 0, 1, 1)');
    const w = code("render/green_box_wiring.ts").replace(/\s+/g, " ");
    expect(w).toContain("if (st.cfg.pinkGizmoVisible !== 1) { ring.isVisible = false; return; }");
  });
});

describe("⭐⭐ prototype — the keyboard in the orbit (2026-10-11, *\"switch Space (and probably Shift + drag) off in the orbit. leave shift tap for the moment\"*)", () => {
  it("⭐ orbiting: Space and Shift reach the mouse model as up — no Space HitFace, no Shift-made second touch; elsewhere unchanged", () => {
    expect(orbitModifiers(true, true, true)).toEqual({ shift: false, space: false });
    expect(orbitModifiers(false, true, true)).toEqual({ shift: true, space: true });
    expect(orbitModifiers(false, false, true)).toEqual({ shift: false, space: true });
    const a = code("render/mouse_adapter.ts");
    expect(a).toMatch(/const keys = orbitModifiers\(/);
    expect(a).toMatch(/shift: keys\.shift,/);
    expect(a).toMatch(/space: keys\.space,/);
    expect(a).toMatch(/if \(!e\.repeat && orbitModifiers\(/); // the SPACE event (`D155`'s freeze) not sent
  });
});

describe("⭐⭐ prototype — a first touch held on a PLACED part is the held input's first touch (2026-10-11, *\"the drag freezes the scene … I think this should enable the roll to the next axis\"*)", () => {
  it("⭐ the second touch's press takes it as `first`, its moves go to `holdMove`, its release to `holdRelease`", () => {
    const w = code("render/pointer_wiring.ts");
    expect(w).toMatch(/function partFirst\(st: SceneState, except: number \| null = null\)/);
    expect(w).toContain("?.id ?? partFirst(st, e.pointerId);");
    expect(w).toContain("|| partFirst(st, e.pointerId) !== null))"); // a finger too, after one held on a part
    expect(w).toContain("return grip !== undefined && grip.mesh !== st.greenBox ? objs[0]!.id : null;"); // ⭐ placed in its goal or not
    expect(w).toMatch(/if \(st\.hold !== null && e\.pointerId === st\.hold\.first\) \{\s*(?:\/\/[^\n]*\n\s*)+const from = grip\.prev;\s*holdMove\([^\n]*\n\s*grip\.prev = s;\s*st\.hudDirty = true;\s*return;/);
    expect(w).toContain("if (st.hold !== null && e.pointerId === st.hold.first) holdRelease(st, e.pointerId);");
  });
});

describe("⭐⭐ prototype — the second touch's TAP, the first held, ROLLS to the next axis (2026-10-11, *\"left click held + CTRL/ALT tap on empty or on the pink face (=first touch held + second touch tap on empty or on the pink face) rolls to the next axis\"*)", () => {
  it("⭐ a tap, undecided, the first held, no pink face changed, not over the orbited piece, aligned — and only then", () => {
    expect(holdTapRolls(true, "HELD", true, false, false, true)).toBe(true);
    expect(holdTapRolls(false, "HELD", true, false, false, true)).toBe(false); // a hold, not a tap
    expect(holdTapRolls(true, "WAY", true, false, false, true)).toBe(false); // the way in
    expect(holdTapRolls(true, "ZOOM", true, false, false, true)).toBe(false); // a zoom
    expect(holdTapRolls(true, "HELD", false, false, false, true)).toBe(false); // the first touch not held
    expect(holdTapRolls(true, "HELD", true, true, false, true)).toBe(false); // its press took a NEW pink face
    expect(holdTapRolls(true, "HELD", true, false, true, true)).toBe(false); // over the orbited piece (a resting face)
    expect(holdTapRolls(true, "HELD", true, false, false, false)).toBe(false); // nothing aligned
  });
  it("⭐ wired at the second touch's release: one stop clockwise (`rollRestingFace`, sense 1), one episode; a new pink face at the press marks it", () => {
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("holdTapRolls(tapped, h.mode, h.first !== null, h.pressActed, false, st.restAligned && st.restRoll !== null) && rollRestingFace(st, performance.now(), 1)");
    expect(h).toContain("if (takePink(st) && st.hold !== null) st.hold.pressActed = true;");
    expect(code("render/pointer_wiring.ts")).toContain("if (st.hold !== null) st.hold.pressActed = true; // ⭐ (2026-10-11) over the orbited piece");
  });
});
