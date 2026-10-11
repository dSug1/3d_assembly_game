/**
 * ⭐⭐⭐ prototype — **THE HELD SECOND TOUCH, WIRED** (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11). The decisions are
 * `input/hold_gesture.ts`'s; this holds the input in flight (`st.hold`) and calls the actions — the pink face and its alignment
 * (`alignRestingFace`), the way in (`enterPieceOrbit`), the orbit round the piece and the roll (`orbitDragStep`, dx only), the zoom
 * (`updatePinch`), the way out (`returnToCentreOrbit`). ⛔ No rule here.
 * - **Press** of the second touch (a finger while another is down, or the right button) OFF the orbited pieces: the input starts (HELD), the
 *   pink face its press would take noted; the highlights shown.
 * - **The first touch moving**: undecided until its dx passes the deadband (`holdDecision`) — WAY (the pink face taken, the way in, then the
 *   orbit round the piece and the roll, dx only, dy ignored) or ZOOM (the pinch); while HELD nothing moves.
 * - **The first touch lifting and pressing again**: the same input goes on (no centre change, no coast, the roll's count kept).
 * - **The second touch lifting**: the way out if the way in had started; else the pink face taken (a tap that did not pinch); the
 *   highlights then held and faded.
 */
import { pxToMm } from "../core/units";
import { holdDecision, pinkChanges, type HoldMode } from "../input/hold_gesture";
import { alignRestingFace, enterPieceOrbit, returnToCentreOrbit } from "./green_box_wiring";
import { pinchPair, updatePinch } from "./camera_rig";
import type { Sample } from "../input";
import type { ObjectId } from "../core/object_model";
import type { SceneState } from "./scene_state";

const xOf = (st: SceneState, id: number | null): number | null => {
  if (id === null) return null;
  const p = st.router.all().find((q) => q.id === id);
  return p === undefined ? null : p.last.x;
};

/** ⭐ The second touch pressed (`second`), the first touch down or not (`first`), the pink face its press would take (`pink`). */
export function holdSecondPress(
  st: SceneState,
  second: number,
  x: number,
  first: number | null,
  pink: { readonly objectId: ObjectId; readonly faceId: string } | null,
): void {
  st.hold = { second, first, mode: "HELD", secondX0: x, firstX0: xOf(st, first), pink, shown: false };
  st.lastVerdict = `orbit: second touch held${pink === null ? "" : ` on ${pink.objectId}/${pink.faceId}`} — dx of the first touch: the way in`;
  st.hudDirty = true;
}

/** ⭐ The first touch pressed again while the second is held: the same input goes on. */
export function holdFirstPress(st: SceneState, first: number, x: number): void {
  const h = st.hold;
  if (h === null) return;
  h.first = first;
  // ⭐ undecided still: its dx counts from here
  if (h.mode === "HELD") h.firstX0 = x;
  st.hudDirty = true;
}

/** ⭐ The pink face its press would take, now — if it changes it (the same face: nothing), aligned to, one episode; `true` if it was taken. */
function takePink(st: SceneState): boolean {
  const h = st.hold;
  if (h === null || h.pink === null) return false;
  const next = h.pink;
  h.pink = null;
  if (!pinkChanges(st.pinkFace, next)) return false;
  st.pinkFace = next;
  h.shown = true; // ⭐ an action: the highlights
  if (alignRestingFace(st, performance.now())) {
    st.episodes.touch(--st.episodeSeq, true, true);
    st.episodes.sync(true);
    st.lastVerdict = `orbit: the pink face is now ${next.objectId}/${next.faceId} — ` + st.lastVerdict.replace(/^orbit: tap 1 — /, "");
  }
  return true;
}

/**
 * ⭐ A move of one of the input's two touches. `orbitStep` — the caller's orbit drag (dx only on the way in / round the piece). Returns the
 * mode now.
 */
export function holdMove(st: SceneState, pointerId: number, s: Sample, prev: Sample, orbitStep: (dxOnly: boolean) => void): HoldMode | null {
  const h = st.hold;
  if (h === null) return null;
  if (h.mode === "ZOOM") {
    updatePinch(st);
    return h.mode;
  }
  if (pointerId !== h.first) return h.mode; // ⭐ the second touch: held, or on its way to a pinch — judged at the first's crossing
  if (h.mode === "HELD") {
    const sx = xOf(st, h.second);
    const d = holdDecision(pxToMm(s.x - (h.firstX0 ?? prev.x)), sx === null ? 0 : pxToMm(sx - h.secondX0), st.cfg.motionDeadbandMm);
    if (d === null) return h.mode;
    h.mode = d;
    if (d === "ZOOM") {
      // ⭐ the zoom from here — what moved while undecided is no jump
      const p = pinchPair(st);
      if (p !== null) {
        st.pinch.begin(p[0], p[1]);
        st.zoomAtPinchStart = st.zoom;
      }
      if (st.pinchDx !== null) st.pinchDx.open = true;
      h.pink = null; // ⭐ option B: a pinch never takes the pink face
      st.lastVerdict = "orbit: both touches move across — zoom";
      st.hudDirty = true;
      return h.mode;
    }
    // ⭐ WAY: the pink face taken (option B), then the way in — the roll counted from here
    takePink(st);
    h.shown = true; // ⭐ an action: the highlights, for as long as the input runs
    if (enterPieceOrbit(st)) st.lastVerdict += " — the way in";
    st.orbitRollAcc = 0;
    st.pieceYawGainDrag = st.pieceYawGain;
    st.hudDirty = true;
  }
  orbitStep(true);
  return h.mode;
}

/**
 * ⭐ A release. `"SECOND"` — the input ended (the way out, or the pink face taken), the highlights' clock started; `"FIRST"` — the first
 * touch lifted, the input goes on; `null` — not the input's.
 */
export function holdRelease(st: SceneState, pointerId: number): "SECOND" | "FIRST" | null {
  const h = st.hold;
  if (h === null) return null;
  if (pointerId === h.first) {
    h.first = null;
    st.hudDirty = true;
    return "FIRST";
  }
  if (pointerId !== h.second) return null;
  if (h.mode === "WAY") {
    // ⭐ the way out — from the camera as it is (a way in cut short too); the pink face unchanged
    if (st.pieceOrbit !== null || st.pieceEntry !== null) {
      st.pieceEntry = null;
      returnToCentreOrbit(st, true);
      st.lastVerdict = "orbit: the second touch lifted — the way out";
    }
  } else if (h.mode === "HELD") takePink(st); // ⭐ a press that never pinched: the pink face taken at its release
  st.hold = null;
  // ⭐⭐ (2026-10-11, the owner: *"why a second touch tap outside any object still highlights the pink face and the resting face? … There should
  // not be any action"*) — the highlights' clock only after an ACTION (the pink face taken, the way in); a tap on empty space, an undecided
  // hold or a zoom show nothing
  if (h.shown) st.highlightEndedAt = performance.now();
  st.hudDirty = true;
  return "SECOND";
}
