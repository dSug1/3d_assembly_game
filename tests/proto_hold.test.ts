/**
 * ⭐⭐⭐ prototype — THE HELD SECOND TOUCH (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11): the first touch lifted and pressed again — the
 * same input. ⛔ (2026-11-14, CL1) the parked way in / out round the piece and their decisions (`holdDecision`, `holdSwitch`, `trailAnchor`) deleted. ⛔ (2026-10-12) no pink face from a part, no highlights' clock:
 * a second touch's TAP on a placed part moves the orbit centre; alignment is the orientation cube's only.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { holdTapMode, holdTapTapsYellow } from "../src/input/hold_gesture";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ prototype — the held second touch: the rules (`input/hold_gesture.ts`)", () => {
  it("⭐⭐ undecided (HELD), the desktop key's first touch orbits the centre (no freeze); the frame's camera follows it", () => {
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("if (pointerId === h.first) orbitStep(); return h.mode; }");
    expect(code("render/green_box_wiring.ts")).toContain('? (h.mode === "HELD" ? h.first : null)');
    expect(h).toContain("if (pointerId !== h.first && pointerId !== h.second) return h.mode;");
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
    expect(p).toMatch(/: st\.hold !== null\s*\? st\.hold\.first === null && e\.pointerId !== st\.hold\.second\s*\? "FIRST"\s*: null\s*: e\.pointerId === MOUSE_SECOND_ID \|\| \(\(!onOrbited \|\| assemblyOn\(st\)\) && e\.pointerType !== "mouse" && st\.router\.outside\(\)\.length === 1\)\s*\? "SECOND"/);
    // ⛔ (2026-11-02, the parts' translation and rotation deleted, `d8134eb`) no press holds a part: every press is the orbit's
    expect(p).toContain("const routed = st.router.press(e.pointerId, s, null);");
    expect(p).not.toMatch(/throughGreenBox|partFirst|rayHit/);
    // the pink face its press would take — a placed part only
    // ⛔ (2026-10-12, *"Remove the selection of pink face on the seated / placed parts"* — *"Remove the ctrl-alt raycast function in desktop"*) no pink face;
    // a finger's press on a PLACED part notes where (its tap moves the orbit centre); the key looks at nothing
    expect(p).not.toContain("pinkCandidate");
    expect(p).toContain("const onPlaced = e.pointerId !== MOUSE_SECOND_ID && hitId !== undefined && goalLocked(hitId, st.goalCommit, st.cfg.lockPlacedPieces === 1);");
    expect(p).toContain("holdSecondPress(st, e.pointerId, firstNow, centreAt, centreN ? [centreN.x, centreN.y, centreN.z] : null, centreAt !== null ? (hitId ?? null) : null);"); // ⭐ (2026-10-19) and the host part // ⭐ (2026-10-16) the rig turned onto the gizmo's face (`orbit_rig.ts`)
    expect(p).toMatch(/\} else if \(holdRole === "FIRST"\) holdFirstPress\(st, e\.pointerId\);/);
    // ⛔ the old second-touch taps and the yaw / pitch are gone
    expect(p).not.toMatch(/orbitTap|pinkTap|tumble/);
  });

  it("⭐⭐ the moves: the input owns both touches' — the desktop's key orbits the centre, two fingers the approach; ⛔ never the centre orbit while held", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(st\.hold !== null && \(e\.pointerId === st\.hold\.first \|\| e\.pointerId === st\.hold\.second\)\) \{\s*holdMove\(st, e\.pointerId, s, prev, \(\) => orbitDragStep\(st, e\.pointerId, s, prev\)\);\s*st\.hudDirty = true;\s*return;\s*\}/);
    // ⛔ (2026-11-14, CL1) the way in's dx-only step deleted: dy always read
    expect(p).toMatch(/const dy = s\.y - prev\.y;/);
    expect(p).not.toContain("dxOnly");
    const h = code("render/hold_wiring.ts");
    // ⛔ (2026-11-13, the owner: *"remove the zoom function entirely"*) no zoom's start any more (`startZoom` deleted) — ⛔ (2026-11-14) the `\b`s
    // here were literal backspaces (the regex could never match): fixed
    expect(h).not.toMatch(/function startZoom|updatePinch|st\.pinch\b|st\.zoom\b/);
    expect(h).not.toMatch(/void orbitStep|⏸/); // ⛔ (2026-11-14, CL1) the commented-out way in deleted
  });

  it("⭐⭐ the release: the second — the way out (if the way in had started), else a TAP: on a placed part the orbit centre moved there, else the roll; the first — the input goes on", () => {
    const h = code("render/hold_wiring.ts");
    expect(h).toContain('st.hold = { second, first, mode: "HELD", pressActed: centreAt !== null, centreAt, centreNormal, centreHost };');
    expect(h.replace(/\s+/g, " ")).toContain('return "FIRST"; } h.first = null; st.hudDirty = true; return "FIRST";'); // ⛔ (2026-11-01) the approach ended first (`hover.test.ts`)
    // ⛔ (2026-10-12, the owner: *"Second touch tap on seated / placed part now sets the pink gizmo (same as first touch tap on seated / placed
    // part)"*) — the ONE place the second touch moves the orbit centre: its TAP on a placed part, at its release
    expect(h).not.toMatch(/recomputeOrbitCentre/);
    expect(h.split("retargetGizmo(").length - 1).toBe(1); // ⭐ (2026-10-16) the rig turned onto the gizmo's face (`orbit_rig.ts`)
    expect(h.replace(/\s+/g, " ")).toContain("retargetGizmo(st, [h.centreAt[0], h.centreAt[1], h.centreAt[2]], h.centreNormal, h.centreHost ?? null);");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const tapped = isTapRelease(routed.pressed.t, routed.pressed.x, routed.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop));");
    expect(p.replace(/\s+/g, " ")).toContain('if (holdRelease(st, e.pointerId, tapped) === "SECOND" && !faceTapHere) { st.hudDirty = true; return; }'); // ⭐ (2026-10-28) a second finger's tap on the piece still picks its resting face
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
    expect(a).toContain("mod: e.altKey || e.ctrlKey }");
    // a lost focus lifts it (the way out, as a release)
    expect(a).toContain('if (!modDown) return; modDown = false; apply({ type: "MOD_UP", button: -1, buttons: 0, x: 0, y: 0 });');
    // the wheel never zooms the page nor walks the history: blocked on the canvas, whatever key
    expect(a).toContain("const onWheel = (e: WheelEvent) => e.preventDefault();"); // ⛔ (2026-11-13) and zooms nothing: the zoom deleted
    const p = code("render/pointer_wiring.ts");
    // ⭐⭐ (2026-10-11, *"the action is triggered directly by CTRL being pressed or tapped : this sends a raycast which first hit is the item on
    // which the action is triggered"*) — the KEY's press acts: a part's face the pink face (as a second finger's press), the orbited piece the
    // resting face; ⛔ the left click names nothing
    expect(p).toContain('if (holdRole === "SECOND") {');
    expect(p).not.toContain('holdRole === "FIRST" && e.pointerType === "mouse"');
    expect(p).not.toContain("if (onOrbited && e.pointerId === MOUSE_SECOND_ID && st.greenBox !== null) {"); // ⛔ (2026-10-12) the key's raycast removed
    expect(p).not.toMatch(/if \(pf !== null && selectRestingFace\(st, pf\.faceId\) && st\.hold !== null\) st\.hold\.shown = true;/); // ⛔ (2026-10-12) the key's raycast removed
    // ⭐⭐ (2026-10-11, *"immediately when left button is pressed. Same for the mobile input"*) the pink face taken AT THE PRESS — the key
    // held + a left press (the way in started or not, never in a zoom), and a second finger's press on a part
    expect(code("render/hold_wiring.ts")).not.toContain("takePink"); // ⛔ (2026-10-12) no pink face from a part — the key takes nothing
  });

  it("⛔ the highlights' clock deleted (2026-10-12): the resting face's fill always shown; no part pink fill; no two-cursor timer slider", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).not.toMatch(/highlightAlpha|pinkFillFrame|st\.pinkFace/);
    // ⭐ (2026-10-12) the yellow contour — shown with the quads (*"same for the outline as for the quads: … hidden below half max distance"*)
    expect(w).toMatch(/fill\.isVisible = false;[\s\S]{0,1500}for \(const c of fill\.getChildMeshes\(true\)\) c\.isVisible = shown;/); // ⭐ (2026-10-15) shown with the quads or a slide (it was always, 2026-10-14)
    expect(code("render/tuning_menu.ts")).not.toContain("highlightTimerSlider");
    expect(code("render/pointer_wiring.ts")).not.toContain("st.highlightEndedAt");
  });
});

describe("⭐ prototype — the pink gizmo's switch (2026-10-11, *\"add a slider to hide the pink gizmo\"*)", () => {
  it("⭐ SHOWN by default (*\"set the default : pink gizmo shown\"*, after a few minutes hidden); at 0 the ring at the orbit centre is not drawn", () => {
    expect(DEFAULT_CONFIG.pinkGizmoVisible).toBe(1);
    expect(code("render/tuning_menu.ts")).toContain('"pinkGizmoVisible", 0, 1, 1)');
    const w = code("render/green_box_wiring.ts").replace(/\s+/g, " ");
    expect(w).toContain("if (st.cfg.pinkGizmoVisible !== 1) { ring.isVisible = false; return; }"); // ⛔ (2026-11-12) no longer hidden by the contact: the slide removed
  });
});

describe("⭐⭐ prototype — a first touch held on a PLACED part is the held input's first touch (2026-10-11, *\"the drag freezes the scene … I think this should enable the roll to the next axis\"*)", () => {
  it("⭐ (2026-11-02, the parts' translation deleted, `d8134eb`) a press on a part is OUTSIDE like any other: the second touch's press takes it as `first`", () => {
    const w = code("render/pointer_wiring.ts");
    expect(w).toContain("const firstNow = st.router.outside().find((q) => q.id !== e.pointerId)?.id ?? null;");
    expect(w).not.toContain("partFirst");
    expect(w).toMatch(/if \(st\.hold !== null && \(e\.pointerId === st\.hold\.first \|\| e\.pointerId === st\.hold\.second\)\) \{\s*holdMove\(/);
    expect(w).toContain("if (holdRelease(st, e.pointerId, tapped) === \"SECOND\" && !faceTapHere) {");
  });
});

describe("⭐⭐ prototype — the second touch's TAP, the first held, ROLLS to the next axis (2026-10-11, *\"left click held + CTRL/ALT tap on empty or on the pink face (=first touch held + second touch tap on empty or on the pink face) rolls to the next axis\"*)", () => {
  it("⭐ a tap, undecided, the first held, its press nothing else (⭐ 2026-10-12: a press on a placed part moves the centre) — and only then; ⭐⭐ (2026-10-13) aligned or not", () => {
    expect(holdTapTapsYellow(true, "HELD", true, false)).toBe(true);
    expect(holdTapTapsYellow(false, "HELD", true, false)).toBe(false); // a hold, not a tap
    expect(holdTapTapsYellow(true, "APPROACH", true, false)).toBe(false); // the approach (a tap that wobbled into it is judged HELD: `holdTapMode`; ⛔ 2026-11-13 no zoom)
    expect(holdTapTapsYellow(true, "HELD", false, false)).toBe(false); // the first touch not held
    expect(holdTapTapsYellow(true, "HELD", true, true)).toBe(false); // its press acted (a placed part: the centre moved)
  });
  it("⭐⭐ wired at the second touch's release (2026-10-13, *\"the second touch's tap on empty space to do exactly what the first touch's tap does: align to the yellow quad, or roll if already aligned there\"*): the YELLOW quad tapped — `orientTapShown`, as the first touch's tap on empty space", () => {
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("if (holdTapTapsYellow(tapped, mode, h.first !== null, h.pressActed) && orientTapShown(st)) {");
    expect(h).not.toContain("holdTapRolls");
    expect(code("render/pointer_wiring.ts")).not.toContain("over the orbited piece: never the tap roll"); // ⛔ (2026-10-12) the key's raycast removed
    expect(code("render/hold_wiring.ts")).toContain("pressActed: centreAt !== null, centreAt,"); // ⭐ a tap on a placed part moves the centre, never rolls
  });
});


describe("⛔⛔ the way in, the orbit round the piece and its dx roll COMMENTED OUT; the STANDARD pinch (2026-10-12, *\"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held … Comment out the way in and the piece orbit accordingly (don't remove it, as it may be useful later on). Simplify the zoom so that this reverts back to the standard zoom input design for mobile\"*)", () => {
  it("⭐ a finger: ⛔ (2026-11-13, the owner: *\"remove the zoom function entirely\"*) the standard pinch zoom deleted — two fingers away from the assembly move nothing; the desktop's key: the first touch orbits the centre", () => {
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("if (h.second === MOUSE_SECOND_ID) { // ⭐ the desktop's key: no position, no pinch — the first touch orbits the CENTRE if (pointerId === h.first) orbitStep(); return h.mode; }");
    expect(h).toContain("// ⛔⛔ (2026-11-13) elsewhere two fingers did the pinch zoom (`pinchStarts`): no zoom — nothing moves return h.mode;");
    expect(h).not.toContain("if (!pinchStarts(");
    const r = code("render/camera_rig.ts");
    expect(r).not.toMatch(/pinchDxOpen|pinchZooms|pinchMotion/);
  });
});

describe("⭐⭐ a first touch / left TAP on EMPTY space = a tap on the cube's pink face (2026-10-12, *\"a left click / first touch tap on empty is equivalent to a left click / first touch tap on the polyhedron pink face\"*)", () => {
  it("⭐ wired at the release: not the orbited piece, no second touch held, not the key; the face shown tapped", () => {
    const p = code("render/pointer_wiring.ts").replace(/\s+/g, " ");
    expect(p).toContain("} else if (st.hold === null && e.pointerId !== MOUSE_SECOND_ID && tapped) {"); // ⭐ (2026-11-02) after the piece's own tap; a part is empty space now
    expect(p).toContain("orientTapShown(st)");
    expect(code("render/orient_cube.ts")).toContain("return tag >= 0 && orientCubeTap(st, tag);"); // ⭐ (2026-10-12) the pink direction, the window deleted
  });
});

describe("⛔⛔ a second-touch TAP that wobbled into the pinch is still a tap (2026-10-13, *\"The possibility to move the gizmo by second touch tap on mobile has disappeared. Reinstate.\"*)", () => {
  it("⭐ a tapped APPROACH is judged HELD (the gizmo moved, or the roll); a held one stays the approach; the other modes unchanged (⛔ 2026-11-13 the zoom deleted)", () => {
    expect(holdTapMode("APPROACH", true)).toBe("HELD");
    expect(holdTapMode("APPROACH", false)).toBe("APPROACH");
    expect(holdTapMode("HELD", true)).toBe("HELD");
    // ⚠ why: the tap's slop (8 mm) is wider than the pinch's deadband (3.5 mm)
    expect(DEFAULT_CONFIG.doubleTapSlop).toBeGreaterThan(DEFAULT_CONFIG.motionDeadbandMm);
  });
  it("⭐ wired at the second touch's release: a tapped approach undone, the tap judged in that mode (⛔ 2026-11-13 no zoom to undo)", () => {
    const h = code("render/hold_wiring.ts").replace(/\s+/g, " ");
    expect(h).toContain("const mode = holdTapMode(h.mode, tapped); // ⭐ (2026-10-28) a tapped approach undone; an approach's end starts its coast if (mode !== h.mode && h.mode === \"APPROACH\" && h.base) st.approach = h.base.approach;");
    expect(h).toContain("if (holdTapTapsYellow(tapped, mode, h.first !== null,");
  });
});
