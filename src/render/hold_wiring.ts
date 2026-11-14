/**
 * ⭐⭐⭐ prototype — **THE HELD SECOND TOUCH, WIRED** (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11). The decisions are
 * `input/hold_gesture.ts`'s; this holds the input in flight (`st.hold`) and calls the actions — the first touch's orbit (`orbitDragStep`), the
 * approach by the pinch (⛔ 2026-11-13 the zoom deleted), the tap roll (⭐ 2026-10-13: the yellow quad tapped, `orientTapShown`), the orbit centre
 * moved by a tap on a placed part. ⛔ No rule here. ⛔ (2026-11-14, CL1) the way in / out round the piece, parked since 2026-10-12, deleted (the
 * code at `7c38150`).
 * ⛔⛔ (2026-10-12, the owner: *"Remove the selection of pink face on the seated / placed parts and the resulting alignment of resting face.
 * Alignment of resting face shall be with the cube only"*) — the second touch takes no pink face and aligns nothing; its highlights clock
 * is deleted with it.
 * - **Press** of the second touch (a finger while another is down, or ALT / CTRL) OFF the orbited pieces: the input starts (HELD); a finger's
 *   press on a PLACED part notes where (`centreAt`).
 * - **The first touch moving**: the desktop's key — it orbits the centre; two fingers — their separation past the deadband: the APPROACH.
 * - **The first touch lifting and pressing again**: the same input goes on (no centre change, no coast, the roll's count kept).
 * - **The second touch lifting**: a TAP — on a placed part, the orbit centre moved there; else, the first held, the yellow quad tapped.
 */
import { pxToMm } from "../core/units";
import { holdTapMode, holdTapTapsYellow, type HoldMode } from "../input/hold_gesture";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { orientTapShown } from "./orient_cube";
import { retargetGizmo } from "./camera_rig";
import { pinchApproachDyMm, pinchLatched, separationMm } from "../input/assembly_orbit";
import { approachInput, approachRelease, pieceOrbitOn } from "./assembly_wiring";
import type { Sample } from "../input";
import type { SceneState } from "./scene_state";

/** ⭐⭐⭐ (2026-11-13) the two fingers' separation now (mm); `null` — one of them lifted */
const sepOf = (st: SceneState, a: number | null, b: number | null): number | null => {
  const p = a === null ? undefined : st.router.get(a);
  const q = b === null ? undefined : st.router.get(b);
  return p === undefined || q === undefined ? null : separationMm([pxToMm(p.last.x), pxToMm(p.last.y)], [pxToMm(q.last.x), pxToMm(q.last.y)]);
};

/** ⭐ The second touch pressed (`second`), the first touch down or not (`first`), where it hit a PLACED part (`centreAt`; `null`: elsewhere). */
export function holdSecondPress(
  st: SceneState,
  second: number,
  first: number | null,
  centreAt: readonly [number, number, number] | null = null,
  centreNormal: readonly [number, number, number] | null = null,
  centreHost: string | null = null,
): void {
  st.hold = { second, first, mode: "HELD", pressActed: centreAt !== null, centreAt, centreNormal, centreHost };
  st.lastVerdict = "orbit: second touch held";
  st.hudDirty = true;
}

/** ⭐ The first touch pressed again while the second is held: the same input goes on. */
export function holdFirstPress(st: SceneState, first: number): void {
  const h = st.hold;
  if (h === null) return;
  h.first = first;
  h.base = null; // ⭐ (2026-10-28) the two-finger decision's travel from here
  st.hudDirty = true;
}

/** ⭐ A move of one of the input's two touches. `orbitStep` — the caller's orbit drag. Returns the mode now. */
export function holdMove(st: SceneState, pointerId: number, _s: Sample, _prev: Sample, orbitStep: () => void): HoldMode | null {
  const h = st.hold;
  if (h === null) return null;
  // ⭐⭐⭐ (2026-11-13, the owner: *"build A"*) the APPROACH BY THE PINCH: the fingers' separation's change since the last read — spread IN, pinched
  // OUT (`pinchApproachDyMm`, × `approachPinchGain`). ⛔ (2026-10-28) each finger's dy half of the step (the two fingers' mean), latched by `twoFingerKind`
  if (h.mode === "APPROACH") {
    if (!pieceOrbitOn(st)) return h.mode; // ⛔ the scene orbit: no finger zoom (the part put down mid-pinch included)
    const sep = sepOf(st, h.first, h.second);
    if ((pointerId === h.first || pointerId === h.second) && sep !== null && h.base) {
      if (h.base.sep !== null) approachInput(st, pinchApproachDyMm(h.base.sep, sep, st.cfg.approachPinchGain));
      h.base.sep = sep;
    }
    return h.mode;
  }
  if (pointerId !== h.first && pointerId !== h.second) return h.mode;
  if (h.mode === "HELD") {
    // ⛔⛔ (2026-10-12, the owner: *"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held (=
    // left click held while CTRL/ALT is held) … Simplify the zoom so that this reverts back to the standard zoom input design for mobile"*)
    if (h.second === MOUSE_SECOND_ID) {
      // ⭐ the desktop's key: no position, no pinch — the first touch orbits the CENTRE
      if (pointerId === h.first) orbitStep();
      return h.mode;
    }
    // ⭐⭐⭐ (2026-11-13, the owner: *"build A"*) AROUND THE ASSEMBLY THE PINCH IS THE APPROACH: two fingers whose separation has moved past the
    // deadband from where they landed (`pinchLatched`) — whatever else they do; the approach then runs from that separation (no jump). ⛔ (2026-10-28 …
    // 2026-11-13) the first move judged once (`twoFingerKind`): common motion the approach, relative the pinch — a real swipe wobbled into the pinch
    // ⛔ only in the PIECE ORBIT: in the scene orbit two fingers move nothing (the owner: "make sure the zoom with finger is disabled in the scene orbit")
    if (pieceOrbitOn(st)) {
      const sep = sepOf(st, h.first, h.second);
      if (sep === null) return h.mode;
      if (h.base === undefined || h.base === null) h.base = { approach: st.approach, sep0: sep, sep: null };
      if (!pinchLatched(h.base.sep0, sep, st.cfg.motionDeadbandMm)) return h.mode;
      h.base.sep = sep;
      h.mode = "APPROACH";
      st.lastVerdict = "orbit: two fingers — the approach by the pinch (spread: in, pinch: out)";
      st.hudDirty = true;
      return h.mode;
    }
    // ⛔⛔ (2026-11-13) elsewhere two fingers did the pinch zoom (`pinchStarts`): no zoom — nothing moves
    return h.mode;
  }
  return h.mode;
}

/**
 * ⭐ A release. `"SECOND"` — the input ended (a centre moved, a quad tapped); `"FIRST"` — the first touch lifted, the input goes on (⛔ not the approach: ended);
 * `null` — not the input's.
 */
export function holdRelease(
  st: SceneState,
  pointerId: number,
  /** ⭐ (2026-10-11) this release ends a TAP (`isTapRelease`) */
  tapped = false,
): "SECOND" | "FIRST" | null {
  const h = st.hold;
  if (h === null) return null;
  if (pointerId === h.first) {
    // ⛔⛔ (2026-11-01, the owner: *"I approach with 2 fingers, the contours highlight, i release the second finger while the first finger stays pressed,
    // and with the first finger dy I can then drive the piece away. This should not be possible as the dy should drive the slide, not the approach
    // away."*) — the APPROACH is TWO fingers: either one lifting ends it (its coast starts), the finger left is a one-finger drag (the slide's, the
    // orbit's). ⛔ The first one lifting kept the input on: the finger left drove the approach alone, out of the slide
    if (h.mode === "APPROACH") {
      approachRelease(st);
      st.hold = null;
      st.hudDirty = true;
      return "FIRST";
    }
    h.first = null;
    st.hudDirty = true;
    return "FIRST";
  }
  if (pointerId !== h.second) return null;
  // ⛔⛔ (2026-10-13, *"The possibility to move the gizmo by second touch tap on mobile has disappeared. Reinstate."*) — a TAP that wobbled into the approach is a tap (`holdTapMode`; ⛔ 2026-11-13 no zoom)
  const mode = holdTapMode(h.mode, tapped);
  // ⭐ (2026-10-28) a tapped approach undone; an approach's end starts its coast
  if (mode !== h.mode && h.mode === "APPROACH" && h.base) st.approach = h.base.approach;
  else if (h.mode === "APPROACH") approachRelease(st);
  if (mode === "HELD") {
    // ⭐⭐ (2026-10-12, the owner: *"Second touch tap on seated / placed part now sets the pink gizmo (same as first touch tap on seated / placed
    // part)"*) — the orbit centre (the pink gizmo) to where the press hit the placed part; ⛔ never also the tap roll (`pressActed`)
    if (tapped && h.centreAt !== null) {
      // ⭐⭐⭐ (2026-10-16) and the rig turned onto the face the tap hit, at the camera's yaw
      retargetGizmo(st, [h.centreAt[0], h.centreAt[1], h.centreAt[2]], h.centreNormal, h.centreHost ?? null);
      st.lastVerdict = "orbit: second touch tap on a placed part — the orbit centre (the pink gizmo) moved there";
    }
    // ⭐⭐ (2026-10-11, *"left click held + CTRL/ALT tap on empty … rolls to the next axis"*) → (2026-10-13, *"the second touch's tap on empty space to do exactly what the first touch's tap does: align to the yellow quad, or roll if already aligned there"*) — the YELLOW quad tapped
    // (`orientTapShown`: aligned to its direction, or the roll when already aligned there); one episode (its own)
    if (holdTapTapsYellow(tapped, mode, h.first !== null, h.pressActed) && orientTapShown(st)) {
      st.lastVerdict = st.lastVerdict.replace(/^orbit: /, "orbit: second touch tap, first held — ");
    }
  }
  st.hold = null;
  st.hudDirty = true;
  return "SECOND";
}

// ⛔⛔ (2026-11-13, the owner: *"remove the zoom function entirely"*) `startZoom` deleted.
