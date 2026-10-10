/**
 * ⭐⭐ `D114` — **IS THERE EMPTY SPACE ON THE GLASS?** The edge band opens only when there is not.
 *
 * ⛔ The decision is `input/edge_band.ts`'s (`effectiveBandMm`, `probeGrid`); this only picks the
 * probe points against the scene. ⭐ A point is empty when a FIRST touch there would be a MISS —
 * the same two facts the press path reads: nothing under the ray, or a frozen body a first touch
 * cannot hold (`D89`, `frozenHoldAdmitted`). ⚠ Throttled to 4 Hz and it stops at the first empty
 * point, so a normal scene costs one or two picks.
 */
import { frozenHoldAdmitted } from "../input/assembly";
import { effectiveBandMm, probeGrid } from "../input/edge_band";
import { mmToPx } from "../core/units";
import type { SceneState } from "./scene_state";

const PROBE_EVERY_MS = 250;
const PROBE_SPACING_MM = 10;

export function probeEmptySpace(st: SceneState, nowMs: number): void {
  if (nowMs - st.lastEmptyProbeMs < PROBE_EVERY_MS) return;
  st.lastEmptyProbeMs = nowMs;
  const w = st.canvas.clientWidth;
  const h = st.canvas.clientHeight;
  let empty = false;
  for (const [x, y] of probeGrid(w, h, mmToPx(PROBE_SPACING_MM))) {
    const pick = st.scene.pick(x, y);
    const mesh = pick?.hit ? pick.pickedMesh : null;
    const id = mesh ? st.idOf.get(mesh) : undefined;
    // ⭐ prototype: an ORBITED piece is empty space to a touch
    if (id === undefined || st.world.objects.get(id)?.orbited === true) {
      empty = true;
      break;
    }
    const o = st.world.objects.get(id);
    if (
      o?.frozen === true &&
      !frozenHoldAdmitted(st.links.followersOf(id).some((f) => st.links.isSeated(f)))
    ) {
      empty = true;
      break;
    }
  }
  if (empty !== st.emptySpaceVisible) {
    st.emptySpaceVisible = empty;
    st.hudDirty = true;
  }
}

/** The band width in force NOW, in millimetres. */
export function bandMmNow(st: SceneState): number {
  return effectiveBandMm(st.cfg.edgeBandMm, st.emptySpaceVisible);
}
