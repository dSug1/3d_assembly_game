/**
 * ⭐⭐⭐ prototype — **THE HELD SECOND TOUCH, WIRED** (`RESTING_FACE_ALIGNMENT.md` §20; the owner, 2026-10-11). The decisions are
 * `input/hold_gesture.ts`'s; this holds the input in flight (`st.hold`) and calls the actions — the way in (`enterPieceOrbit`), the orbit
 * round the piece and the roll (`orbitDragStep`, dx only), the zoom (`updatePinch`), the way out (`returnToCentreOrbit`), the tap roll
 * (`rollRestingFace`), the orbit centre moved by a tap on a placed part. ⛔ No rule here.
 * ⛔⛔ (2026-10-12, the owner: *"Remove the selection of pink face on the seated / placed parts and the resulting alignment of resting face.
 * Alignment of resting face shall be with the cube only"*) — the second touch takes no pink face and aligns nothing; its highlights clock
 * is deleted with it.
 * - **Press** of the second touch (a finger while another is down, or ALT / CTRL) OFF the orbited pieces: the input starts (HELD); a finger's
 *   press on a PLACED part notes where (`centreAt`).
 * - **The first touch moving**: undecided until its dx passes the deadband (`holdDecision`) — WAY (the way in, then the orbit round the piece
 *   and the roll, dx only) or ZOOM (the pinch); decided, the finger that moves decides again (`holdSwitch`).
 * - **The first touch lifting and pressing again**: the same input goes on (no centre change, no coast, the roll's count kept).
 * - **The second touch lifting**: the way out if the way in had started; else, a TAP — on a placed part, the orbit centre moved there; else,
 *   the first held, the roll to the next axis.
 */
import { pxToMm } from "../core/units";
import { holdTapMode, holdTapRolls, pinchStarts, type HoldMode } from "../input/hold_gesture";
// ⏸ (2026-10-12) with the way in, commented out: import { holdDecision, holdSwitch, trailAnchor } from "../input/hold_gesture";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { rollRestingFace } from "./green_box_wiring";
// ⏸ (2026-10-12) with the way in, commented out: import { enterPieceOrbit, returnToCentreOrbit } from "./green_box_wiring";
import { pinchPair, syncCentre, updatePinch } from "./camera_rig";
import type { Sample } from "../input";
import type { SceneState } from "./scene_state";

const xOf = (st: SceneState, id: number | null): number | null => {
  if (id === null) return null;
  const p = st.router.all().find((q) => q.id === id);
  return p === undefined ? null : p.last.x;
};

/** ⭐ The second touch pressed (`second`), the first touch down or not (`first`), where it hit a PLACED part (`centreAt`; `null`: elsewhere). */
export function holdSecondPress(
  st: SceneState,
  second: number,
  x: number,
  first: number | null,
  centreAt: readonly [number, number, number] | null = null,
): void {
  st.hold = { second, first, mode: "HELD", secondX0: x, firstX0: xOf(st, first), t0: performance.now(), pressActed: centreAt !== null, centreAt, swAnchorMm: pxToMm(x), swStillSince: performance.now(), swFirstX0: xOf(st, first), wayIn: false };
  st.lastVerdict = "orbit: second touch held — dx of the first touch: the way in";
  st.hudDirty = true;
}

/** ⭐ The first touch pressed again while the second is held: the same input goes on. */
export function holdFirstPress(st: SceneState, first: number, x: number): void {
  const h = st.hold;
  if (h === null) return;
  h.first = first;
  // ⭐ undecided still: its dx counts from here
  if (h.mode === "HELD") h.firstX0 = x;
  h.swFirstX0 = x; // ⭐ (2026-10-12) the switch's too
  st.hudDirty = true;
}

/**
 * ⭐ A move of one of the input's two touches. `orbitStep` — the caller's orbit drag (dx only on the way in / round the piece). Returns the
 * mode now.
 */
export function holdMove(st: SceneState, pointerId: number, _s: Sample, _prev: Sample, orbitStep: (dxOnly: boolean) => void): HoldMode | null {
  const h = st.hold;
  if (h === null) return null;
// ⏸⏸ (2026-10-12, the owner: *"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held …
// Comment out the way in and the piece orbit accordingly (don't remove it, as it may be useful later on)"*) — kept, commented out:
// ⏸   // ⭐⭐ (2026-10-12, *"swap from one to another without releasing any of the two touches"* → *"Build with the 150ms rest. No change for
// ⏸   // desktop."*) — decided, the finger that moves decides again (`holdSwitch`); ⛔ a finger second touch only (the desktop's key has no x)
// ⏸   if (h.mode !== "HELD" && h.second !== MOUSE_SECOND_ID && (pointerId === h.first || pointerId === h.second)) {
// ⏸     const now = performance.now();
// ⏸     const fx = xOf(st, h.first);
// ⏸     const sx = xOf(st, h.second);
// ⏸     let secondMoved = false;
// ⏸     if (sx !== null) {
// ⏸       const t = trailAnchor(h.swAnchorMm, pxToMm(sx), st.cfg.motionDeadbandMm);
// ⏸       h.swAnchorMm = t.anchor;
// ⏸       if (t.moved) {
// ⏸         secondMoved = true;
// ⏸         h.swStillSince = now; // ⭐ its rest starts again, and the first finger's dx counts from here
// ⏸         h.swFirstX0 = fx;
// ⏸       }
// ⏸     }
// ⏸     if (h.swFirstX0 === null) h.swFirstX0 = fx;
// ⏸     const next = holdSwitch(
// ⏸       h.mode,
// ⏸       secondMoved,
// ⏸       now - h.swStillSince,
// ⏸       fx === null || h.swFirstX0 === null ? 0 : pxToMm(fx - h.swFirstX0),
// ⏸       st.cfg.motionDeadbandMm,
// ⏸       st.cfg.holdSwitchRestMs,
// ⏸     );
// ⏸     if (next === "ZOOM" && h.mode === "WAY") {
// ⏸       h.mode = "ZOOM";
// ⏸       startZoom(st);
// ⏸       st.lastVerdict = "orbit: the second finger moves — zoom (no lift)";
// ⏸     } else if (next === "WAY" && h.mode === "ZOOM") {
// ⏸       h.mode = "WAY";
// ⏸       st.lastVerdict = "orbit: the second finger rests, the first moves — way in + roll (no lift)";
// ⏸       startWay(st, h);
// ⏸       st.hudDirty = true;
// ⏸       return h.mode; // ⭐ the roll from the next step: this one only decided
// ⏸     }
// ⏸   }
  if (h.mode === "ZOOM") {
    updatePinch(st);
    return h.mode;
  }
  if (pointerId !== h.first && pointerId !== h.second) return h.mode;
  if (h.mode === "HELD") {
    // ⛔⛔ (2026-10-12, the owner: *"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held (=
    // left click held while CTRL/ALT is held) … Simplify the zoom so that this reverts back to the standard zoom input design for mobile"*)
    if (h.second === MOUSE_SECOND_ID) {
      // ⭐ the desktop's key: no position, no pinch — the first touch orbits the CENTRE (the way in is commented out)
      if (pointerId === h.first) orbitStep(false);
      return h.mode;
    }
    // ⭐ a finger: the STANDARD PINCH — either finger's travel past the deadband starts it (`pinchStarts`); before, nothing moves
    const travel = (id: number | null): number => {
      const q = id === null ? undefined : st.router.get(id);
      return q === undefined ? 0 : pxToMm(Math.hypot(q.last.x - q.pressed.x, q.last.y - q.pressed.y));
    };
    if (!pinchStarts(travel(h.first), travel(h.second), st.cfg.motionDeadbandMm)) return h.mode;
    h.mode = "ZOOM";
    startZoom(st);
    st.lastVerdict = "orbit: two fingers — the pinch zoom";
    st.hudDirty = true;
    return h.mode;
  }
// ⏸⏸ (2026-10-12, the owner: *"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held …
// Comment out the way in and the piece orbit accordingly (don't remove it, as it may be useful later on)"*) — kept, commented out:
// ⏸   if (h.mode === "HELD") {
// ⏸     // ⭐ (2026-10-11) judged at EITHER touch's move: the second's dx past its deadband — a zoom (the first still or not); the first's — the
// ⏸     // way in, or a zoom if the second is on its way (`holdDecision`)
// ⏸     const fx = xOf(st, h.first);
// ⏸     const sx = xOf(st, h.second);
// ⏸     const d = holdDecision(
// ⏸       fx === null || h.firstX0 === null ? 0 : pxToMm(fx - h.firstX0),
// ⏸       sx === null ? 0 : pxToMm(sx - h.secondX0),
// ⏸       st.cfg.motionDeadbandMm,
// ⏸       performance.now() - h.t0,
// ⏸       st.cfg.tapMaxDuration,
// ⏸     );
// ⏸     if (d === null) {
// ⏸       // ⭐⭐ (2026-10-11, the owner: *"there are times when CTRL while orbiting … while held it completely freezes the orbit"*) — UNDECIDED, the
// ⏸       // first touch goes on orbiting the CENTRE (dx and dy): it used to move nothing, and a drag mostly in dy never decided — frozen for as
// ⏸       // long as the key was held
// ⏸       if (pointerId === h.first) orbitStep(false);
// ⏸       return h.mode;
// ⏸     }
// ⏸     h.mode = d;
// ⏸     // ⭐ (2026-10-12) the switch's anchors from the decision
// ⏸     if (sx !== null) h.swAnchorMm = pxToMm(sx);
// ⏸     h.swStillSince = performance.now();
// ⏸     h.swFirstX0 = fx;
// ⏸     if (d === "ZOOM") {
// ⏸       // ⭐ the zoom from here — what moved while undecided is no jump
// ⏸       startZoom(st);
// ⏸       st.lastVerdict = "orbit: both touches move across — zoom";
// ⏸       st.hudDirty = true;
// ⏸       return h.mode;
// ⏸     }
// ⏸     // ⭐ WAY: the way in — the roll counted from here
// ⏸     startWay(st, h);
// ⏸   }
  void orbitStep; // ⏸ (2026-10-12) the way in / round the piece (the first touch's dx only) is commented out
  return h.mode;
}

/**
 * ⭐ A release. `"SECOND"` — the input ended (the way out, a centre moved, a roll); `"FIRST"` — the first touch lifted, the input goes on;
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
    h.first = null;
    st.hudDirty = true;
    return "FIRST";
  }
  if (pointerId !== h.second) return null;
// ⏸⏸ (2026-10-12, the owner: *"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held …
// Comment out the way in and the piece orbit accordingly (don't remove it, as it may be useful later on)"*) — kept, commented out:
// ⏸   if (h.mode === "WAY" || h.wayIn) {
// ⏸     // ⭐ (2026-10-12) …or a zoom switched to after the way in (`wayIn`)
// ⏸     // ⭐ the way out — from the camera as it is (a way in cut short too)
// ⏸     if (st.pieceOrbit !== null || st.pieceEntry !== null) {
// ⏸       st.pieceEntry = null;
// ⏸       returnToCentreOrbit(st, true);
// ⏸       st.lastVerdict = "orbit: the second touch lifted — the way out";
// ⏸     }
// ⏸   }
  // ⛔⛔ (2026-10-13, *"The possibility to move the gizmo by second touch tap on mobile has disappeared. Reinstate."*) — a TAP that wobbled into the pinch is a tap: the zoom it started undone (`holdTapMode`)
  const mode = holdTapMode(h.mode, tapped);
  if (mode !== h.mode) st.zoom = st.zoomAtPinchStart;
  if (mode === "HELD") {
    // ⭐⭐ (2026-10-12, the owner: *"Second touch tap on seated / placed part now sets the pink gizmo (same as first touch tap on seated / placed
    // part)"*) — the orbit centre (the pink gizmo) to where the press hit the placed part; ⛔ never also the tap roll (`pressActed`)
    if (tapped && h.centreAt !== null) {
      st.centreBlend.retarget([h.centreAt[0], h.centreAt[1], h.centreAt[2]]);
      syncCentre(st);
      st.lastVerdict = "orbit: second touch tap on a placed part — the orbit centre (the pink gizmo) moved there";
    }
    // ⭐⭐ (2026-10-11, the owner: *"left click held + CTRL/ALT tap on empty … rolls to the next axis"*) — one stop, clockwise as seen from the
    // camera (`rollRestingFace`); one episode
    if (holdTapRolls(tapped, mode, h.first !== null, h.pressActed, st.restAligned && st.restRoll !== null) && rollRestingFace(st, performance.now(), 1)) {
      st.episodes.touch(--st.episodeSeq, true, true);
      st.episodes.sync(true);
      st.lastVerdict = st.lastVerdict.replace(/^orbit: tap — roll/, "orbit: second touch tap, first held — roll");
    }
  }
  st.hold = null;
  st.hudDirty = true;
  return "SECOND";
}

/** ⭐ The zoom from here — the fingers' distance now is its start: no jump (the decision, and `holdSwitch`'s WAY → ZOOM). */
function startZoom(st: SceneState): void {
  const p = pinchPair(st);
  if (p !== null) {
    st.pinch.begin(p[0], p[1]);
    st.zoomAtPinchStart = st.zoom;
  }
}

// ⏸⏸ (2026-10-12, the owner: *"remove the roll to the next axis triggered by first touch pressed and delta position while second touch held …
// Comment out the way in and the piece orbit accordingly (don't remove it, as it may be useful later on)"*) — kept, commented out:
// ⏸ /** ⭐ The way in (once — `wayIn`; already round the piece: it goes on), the roll counted from here (the decision, and `holdSwitch`'s ZOOM → WAY). */
// ⏸ function startWay(st: SceneState, h: NonNullable<SceneState["hold"]>): void {
// ⏸   if (!h.wayIn || (st.pieceOrbit === null && st.pieceEntry === null)) {
// ⏸     if (enterPieceOrbit(st)) st.lastVerdict += " — the way in";
// ⏸   }
// ⏸   h.wayIn = true;
// ⏸   st.orbitRollAcc = 0;
// ⏸   st.pieceYawGainDrag = st.pieceYawGain;
// ⏸   st.hudDirty = true;
// ⏸ }
