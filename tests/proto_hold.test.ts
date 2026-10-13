/**
 * ⭐⭐⭐ prototype — THE HELD SECOND TOUCH (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11): the white sphere deleted; the second
 * touch (the right button) held off the orbited pieces + the first touch's dx — the way in, the orbit round the piece, the roll; its
 * release — the way out; the first touch lifted and pressed again — the same input. ⛔ (2026-10-12) no pink face from a part, no highlights' clock:
 * a second touch's TAP on a placed part moves the orbit centre; alignment is the orientation cube's only.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { holdDecision, holdSwitch, holdTapRolls, pinchStarts, trailAnchor } from "../src/input/hold_gesture";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
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
    expect(h).toContain("if (pointerId === h.first) orbitStep(false); return h.mode; }");
    // the frame's camera follows it while undecided
    expect(code("render/green_box_wiring.ts")).toContain('? (h.mode === "WAY" || h.mode === "HELD" ? h.first : null)');
    // the pinch's own gate: the second finger's dx opens it, the first still or moving; the first alone never
    // wired: judged at EITHER touch's move; the orbit steps only on the first's
    expect(h).toContain("if (pointerId !== h.first && pointerId !== h.second) return h.mode;");
    expect(h).toContain("void orbitStep; // ⏸ (2026-10-12) the way in / round the piece (the first touch's dx only) is commented out");
  });

  it("⛔⛔ (2026-10-12, *\"Remove the selection of pink face on the seated / placed parts and the resulting alignment of resting face\"*) — no pink face from a part, no highlights' clock", () => {
    const g = code("input/hold_gesture.ts");
    expect(g).not.toMatch(/export function (pinkChanges|pinkCandidate|highlightAlpha)\b/);
    expect(DEFAULT_CONFIG).not.toHaveProperty("highlightHoldMs");
    expect(DEFAULT_CONFIG).not.toHaveProperty("highlightFadeMs");
    const h = code("render/hold_wiring.ts");
    expect(h).not.toMatch(/takePink|pinkFace|highlightEndedAt|\.shown\b/);
  });

});

describe("⭐⭐⭐ prototype — the held second touch, wired", () => {
  it("⭐⭐ the press: the right button or a finger with ONE other down is the SECOND touch (not on the orbited piece); held, a new press is the FIRST again; neither grabs", () => {
    const p = code("render/pointer_wiring.ts");
    // ⭐ (2026-10-11) the desktop's key is the second touch over the orbited piece too; a finger, never on it
    expect(p).toMatch(/: st\.hold !== null\s*\? st\.hold\.first === null && e\.pointerId !== st\.hold\.second\s*\? "FIRST"\s*: null\s*: e\.pointerId === MOUSE_SECOND_ID \|\|\s*\(!onOrbited &&\s*e\.pointerType !== "mouse" &&\s*\(\(st\.router\.outside\(\)\.length === 1 && st\.router\.objects\(\)\.length === 0\) \|\| partFirst\(st, e\.pointerId\) !== null\)\)\s*\? "SECOND"/);
    expect(p).toMatch(/const rayHit =\s*holdRole !== null \? null : throughGreenBox\(/);
    // the pink face its press would take — a placed part only
    // ⛔ (2026-10-12, *"Remove the selection of pink face on the seated / placed parts"* — *"Remove the ctrl-alt raycast function in desktop"*) no pink face;
    // a finger's press on a PLACED part notes where (its tap moves the orbit centre); the key looks at nothing
    expect(p).not.toContain("pinkCandidate");
    expect(p.replace(/\s+/g, " ")).toContain("const hitObj = e.pointerId === MOUSE_SECOND_ID || inBand || pick?.hit !== true || pick.pickedMesh === null ? undefined : st.idOf.get(pick.pickedMesh);");
    expect(p).toContain("holdSecondPress(st, e.pointerId, s.x, firstNow, centreAt);");
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
    // ⭐ (2026-10-12) the zoom's start in `startZoom`
    expect(h).toMatch(/function startZoom\(st: SceneState\): void \{\s*const p = pinchPair\(st\);\s*if \(p !== null\) \{\s*st\.pinch\.begin\(p\[0\], p\[1\]\);\s*st\.zoomAtPinchStart = st\.zoom;/);
    expect(h).toContain("void orbitStep;"); // ⏸ (2026-10-12) the way in's dx-only orbit is commented out
  });

  it("⭐⭐ the release: the second — the way out (if the way in had started), else a TAP: on a placed part the orbit centre moved there, else the roll; the first — the input goes on", () => {
    const h = code("render/hold_wiring.ts");
    expect(h).toMatch(/st\.hold = \{ second, first, mode: "HELD", secondX0: x, firstX0: xOf\(st, first\), t0: performance\.now\(\), pressActed: centreAt !== null, centreAt, swAnchorMm: pxToMm\(x\), swStillSince: performance\.now\(\), swFirstX0: xOf\(st, first\), wayIn: false \};/);
    expect(h.replace(/\s+/g, " ")).toContain("if (pointerId === h.first) { h.first = null;");
    // ⛔ (2026-10-12, the owner: *"Second touch tap on seated / placed part now sets the pink gizmo (same as first touch tap on seated / placed
    // part)"*) — the ONE place the second touch moves the orbit centre: its TAP on a placed part, at its release
    expect(h).not.toMatch(/recomputeOrbitCentre/);
    expect(h.split("centreBlend.retarget").length - 1).toBe(1);
    expect(h).toMatch(/if \(tapped && h\.centreAt !== null\) \{\s*st\.centreBlend\.retarget\(\[h\.centreAt\[0\], h\.centreAt\[1\], h\.centreAt\[2\]\]\);\s*syncCentre\(st\);/);
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
    expect(p).not.toContain("if (onOrbited && e.pointerId === MOUSE_SECOND_ID && st.greenBox !== null) {"); // ⛔ (2026-10-12) the key's raycast removed
    expect(p).not.toMatch(/if \(pf !== null && selectRestingFace\(st, pf\.faceId\) && st\.hold !== null\) st\.hold\.shown = true;/); // ⛔ (2026-10-12) the key's raycast removed
    expect(code("input/mouse_second_touch.ts")).toMatch(/return s\.shiftMade\s*\? \{ target: "SECOND", kind, x: s\.x, y: s\.y, anchorOnly: true \}/);
    // ⭐⭐ (2026-10-11, *"immediately when left button is pressed. Same for the mobile input"*) the pink face taken AT THE PRESS — the key
    // held + a left press (the way in started or not, never in a zoom), and a second finger's press on a part
    expect(code("render/hold_wiring.ts")).not.toContain("takePink"); // ⛔ (2026-10-12) no pink face from a part — the key takes nothing
  });

  it("⛔ the highlights' clock deleted (2026-10-12): the resting face's fill always shown; no part pink fill; no two-cursor timer slider", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).not.toMatch(/highlightAlpha|pinkFillFrame|st\.pinkFace/);
    // ⭐ (2026-10-12) the yellow contour — shown with the quads (*"same for the outline as for the quads: … hidden below half max distance"*)
    expect(w).toMatch(/fill\.isVisible = false;[\s\S]{0,400}for \(const c of fill\.getChildMeshes\(true\)\) c\.isVisible = shown;/);
    expect(code("render/tuning_menu.ts")).not.toContain("highlightTimerSlider");
    expect(code("render/pointer_wiring.ts")).not.toContain("st.highlightEndedAt");
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
  it("⭐ a tap, undecided, the first held, its press nothing else (⭐ 2026-10-12: a press on a placed part moves the centre), aligned — and only then", () => {
    expect(holdTapRolls(true, "HELD", true, false, true)).toBe(true);
    expect(holdTapRolls(false, "HELD", true, false, true)).toBe(false); // a hold, not a tap
    expect(holdTapRolls(true, "WAY", true, false, true)).toBe(false); // the way in
    expect(holdTapRolls(true, "ZOOM", true, false, true)).toBe(false); // a zoom
    expect(holdTapRolls(true, "HELD", false, false, true)).toBe(false); // the first touch not held
    expect(holdTapRolls(true, "HELD", true, true, true)).toBe(false); // its press acted (a placed part: the centre moved)
    expect(holdTapRolls(true, "HELD", true, false, false)).toBe(false); // nothing aligned
  });
  it("⭐ wired at the second touch's release: one stop clockwise (`rollRestingFace`, sense 1), one episode; a new pink face at the press marks it", () => {
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("holdTapRolls(tapped, h.mode, h.first !== null, h.pressActed, st.restAligned && st.restRoll !== null) && rollRestingFace(st, performance.now(), 1)");
    expect(code("render/pointer_wiring.ts")).not.toContain("over the orbited piece: never the tap roll"); // ⛔ (2026-10-12) the key's raycast removed
    expect(code("render/hold_wiring.ts")).toContain("pressActed: centreAt !== null, centreAt,"); // ⭐ a tap on a placed part moves the centre, never rolls
  });
});

describe("⭐⭐ prototype — zoom ↔ way in + roll WITHOUT LIFTING (2026-10-12, *\"swap from one to another without releasing any of the two touches\"* → *\"Build with the 150ms rest. No change for desktop.\"*)", () => {
  it("⭐ the trailing anchor: nothing inside the deadband; past it, dragged to one deadband behind, `moved`", () => {
    expect(trailAnchor(10, 12.9, 3)).toEqual({ anchor: 10, moved: false });
    expect(trailAnchor(10, 14, 3)).toEqual({ anchor: 11, moved: true });
    expect(trailAnchor(10, 5, 3)).toEqual({ anchor: 8, moved: true });
  });
  it("⭐⭐ WAY → ZOOM when the second finger moves; ZOOM → WAY only after its REST (150 ms) and the first finger's dx past the deadband", () => {
    expect(holdSwitch("WAY", true, 0, 0, 3, 150)).toBe("ZOOM");
    expect(holdSwitch("WAY", false, 999, 50, 3, 150)).toBe("WAY");
    expect(holdSwitch("ZOOM", false, 150, 3.1, 3, 150)).toBe("WAY");
    expect(holdSwitch("ZOOM", false, 149, 50, 3, 150)).toBe("ZOOM"); // ⭐ the rest not over: the pinch goes on
    expect(holdSwitch("ZOOM", false, 999, 2.9, 3, 150)).toBe("ZOOM"); // the first inside its deadband
    expect(holdSwitch("ZOOM", true, 999, 50, 3, 150)).toBe("ZOOM"); // both moving: a pinch
    expect(holdSwitch("HELD", true, 999, 50, 3, 150)).toBe("HELD"); // undecided is `holdDecision`'s
    expect(DEFAULT_CONFIG.holdSwitchRestMs).toBe(150);
    expect(code("render/tuning_menu.ts")).toContain('"holdSwitchRestMs", 0, 600, 10)');
  });
});


describe("⛔⛔ the way in, the orbit round the piece and its dx roll COMMENTED OUT; the STANDARD pinch (2026-10-12, *\"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held … Comment out the way in and the piece orbit accordingly (don't remove it, as it may be useful later on). Simplify the zoom so that this reverts back to the standard zoom input design for mobile\"*)", () => {
  it("⭐ a finger: the standard pinch — either finger's travel past the deadband starts it; the desktop's key: the first touch orbits the centre", () => {
    expect(pinchStarts(3.6, 0, DB)).toBe(true);
    expect(pinchStarts(0, 3.6, DB)).toBe(true);
    expect(pinchStarts(3.4, 3.4, DB)).toBe(false);
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("if (h.second === MOUSE_SECOND_ID) { // ⭐ the desktop's key: no position, no pinch — the first touch orbits the CENTRE (the way in is commented out) if (pointerId === h.first) orbitStep(false); return h.mode; }");
    expect(h).toContain("if (!pinchStarts(travel(h.first), travel(h.second), st.cfg.motionDeadbandMm)) return h.mode; h.mode = \"ZOOM\"; startZoom(st);");
    const r = code("render/camera_rig.ts");
    expect(r).not.toMatch(/pinchDxOpen|pinchZooms|pinchMotion/);
  });
});

describe("⭐⭐ a first touch / left TAP on EMPTY space = a tap on the cube's pink face (2026-10-12, *\"a left click / first touch tap on empty is equivalent to a left click / first touch tap on the polyhedron pink face\"*)", () => {
  it("⭐ wired at the release: not the orbited piece, no second touch held, not the key; the face shown tapped", () => {
    const p = code("render/pointer_wiring.ts").replace(/\s+/g, " ");
    expect(p).toContain("(ft === null || ft.pointerId !== e.pointerId) && st.hold === null && e.pointerId !== MOUSE_SECOND_ID &&");
    expect(p).toContain("orientTapShown(st)");
    expect(code("render/orient_cube.ts")).toContain("return tag >= 0 && orientCubeTap(st, tag);"); // ⭐ (2026-10-12) the pink direction, the window deleted
  });
});
