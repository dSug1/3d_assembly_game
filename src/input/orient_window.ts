/**
 * ⭐⭐ prototype — **WHERE THE ORIENTATION WINDOW SITS** (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"Add a slider for the position
 * of the window with two cursors (top-bottom & left-right)"* → *"At boot on mobile, set the position of the slider to bottom left."* → *"At
 * boot on desktop, set the slider position to top right"*). Two percentages: 0 % left / top, 100 % right / bottom, across the room the window
 * has inside its margins. ⛔ No engine, no DOM: the caller says whether the device's pointer is coarse (a finger).
 */

/** ⭐ The boot position: a touch screen (a coarse pointer) bottom-left; a desktop (a mouse) top-right. */
export function orientWindowBoot(coarsePointer: boolean): { readonly xPct: number; readonly yPct: number } {
  return coarsePointer ? { xPct: 0, yPct: 100 } : { xPct: 100, yPct: 0 };
}

/** ⭐ The window's top-left corner (px) on a `cw` × `ch` canvas: `size` square, `margin` from every edge, placed at `xPct` / `yPct` of its room. */
export function orientWindowCorner(
  cw: number,
  ch: number,
  size: number,
  margin: number,
  xPct: number,
  yPct: number,
): { readonly left: number; readonly top: number } {
  const t = (v: number) => Math.min(100, Math.max(0, v)) / 100;
  return {
    left: margin + Math.max(0, cw - 2 * margin - size) * t(xPct),
    top: margin + Math.max(0, ch - 2 * margin - size) * t(yPct),
  };
}

/**
 * ⭐ (2026-10-12) the window kept CLEAR of the screen's overlays (the HUD, its toggle, the ☰, the ⏸, the score bar — rectangles in the same px):
 * one in the TOP half it overlaps pushes it down below it, one in the BOTTOM half pushes it up above it, `gap` apart; then held on the canvas.
 * The slider still decides the corner — at boot on a desktop the top-right sits under the ☰, on a phone the bottom-left over the ⏸.
 */
export function clearOfOverlays(
  left: number,
  top: number,
  size: number,
  overlays: readonly { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }[],
  ch: number,
  gap: number,
): number {
  let t = top;
  for (let pass = 0; pass < 2; pass++) {
    for (const o of overlays) {
      const across = o.left < left + size && o.right > left;
      const down = o.top < t + size && o.bottom > t;
      if (!across || !down) continue;
      t = (o.top + o.bottom) / 2 < ch / 2 ? o.bottom + gap : o.top - gap - size;
    }
  }
  return Math.min(Math.max(0, t), Math.max(0, ch - size));
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"the face of the cube which normal is pointing the most to the camera is the candidate support face"*) — of the
 * facets (as drawn: world normal and centre), the one whose normal points most toward `eye` (seen from its own centre); a facet that stands for
 * no direction (`tag < 0`) is never one. −1 with none.
 */
export function candidateFace(
  facets: readonly { readonly tag: number; readonly normal: readonly [number, number, number]; readonly centre: readonly [number, number, number] }[],
  eye: readonly [number, number, number],
): number {
  let cand = -1;
  let best = -Infinity;
  for (const f of facets) {
    if (f.tag < 0) continue;
    const t = [eye[0] - f.centre[0], eye[1] - f.centre[1], eye[2] - f.centre[2]];
    const len = Math.hypot(t[0]!, t[1]!, t[2]!) || 1;
    const k = (f.normal[0] * t[0]! + f.normal[1] * t[1]! + f.normal[2] * t[2]!) / len;
    if (k > best) {
      best = k;
      cand = f.tag;
    }
  }
  return cand;
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"in desktop mode, when the left click is pressed and held to orbit around the center or around the piece, pin the
 * cube window to a place below and to the right of the cursor. when the left click is released, freeze the position of the window"*) — the
 * position-slider values that put the window's top-left `gap` below and to the right of the cursor (`cx`, `cy`, canvas px), clamped to the
 * room inside the margins (`orientWindowCorner`'s inverse).
 */
export function orientWindowAtCursor(
  cw: number,
  ch: number,
  size: number,
  margin: number,
  cx: number,
  cy: number,
  gap: number,
): { readonly xPct: number; readonly yPct: number } {
  const pct = (v: number, room: number) => (room > 0 ? Math.min(100, Math.max(0, ((v - margin) / room) * 100)) : 0);
  return { xPct: pct(cx + gap, cw - 2 * margin - size), yPct: pct(cy + gap, ch - 2 * margin - size) };
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"add a red arrow … with an inclination and direction indicating the direction of the rotation required to rotate
 * from the green piece current quaternion to the replica quaternion"*) — the turn from `from` to `to` ([w, x, y, z]): its unit axis and its angle
 * (0…π, the short way; the axis's sense carries the direction, right-handed); `null` with no turn (under `minRad`).
 */
export function turnBetween(
  from: readonly [number, number, number, number],
  to: readonly [number, number, number, number],
  minRad = 0.01,
): { readonly axis: readonly [number, number, number]; readonly angle: number } | null {
  // rel = to · from⁻¹
  const [aw, ax, ay, az] = to;
  const [bw, bx, by, bz] = [from[0], -from[1], -from[2], -from[3]];
  let w = aw * bw - ax * bx - ay * by - az * bz;
  let x = aw * bx + ax * bw + ay * bz - az * by;
  let y = aw * by - ax * bz + ay * bw + az * bx;
  let z = aw * bz + ax * by - ay * bx + az * bw;
  if (w < 0) [w, x, y, z] = [-w, -x, -y, -z];
  const angle = 2 * Math.acos(Math.min(1, w));
  const n = Math.hypot(x, y, z);
  if (!(angle > minRad) || n < 1e-9) return null;
  return { axis: [x / n, y / n, z / n], angle };
}
