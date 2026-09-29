/**
 * ⭐⭐ **`D162` — A PRESSED ALIGNED PART SHOWS ITS PIONEERFACE IN AMBER** (the owner, 2026-09-29: *"when an
 * aligned object is touched pressed or clicked pressed (left or right), highlight in amber its
 * pioneerface. when the touch or click is released, revert to current (for example amber highlighting
 * the contour of pioneerface if the pioneer-follower couple is still on)"*).
 *
 * ⭐ Which Pioneer faces are FILLED amber this frame: the ones an aligned part that is PRESSED right now is
 * aligned to. The render loop draws them over their contour and drops the fill the frame the press ends —
 * the contour stays for as long as the couple does, as before.
 * ⚠ *Pressed* is the caller's: a finger or a button physically down. A HitFace LATCHED by Space or a right
 * click (`D154`/`D161`) is not pressed — its click was released — so it reverts, as the owner asked.
 *
 * ⛔ ENGINE-FREE.
 */

/** ⭐ A face as `objectId/faceId` — the render layer's own marker key. */
export function faceKey(objectId: string, faceId: string): string {
  return `${objectId}/${faceId}`;
}

/**
 * @param pressedBodies the bodies a finger or a button is holding down now.
 * @param pioneerOf a Follower's Pioneer face, or `null` for a body aligned to nothing.
 * @returns the Pioneer faces to fill amber, as marker keys.
 */
export function pressedPioneerFaceKeys(
  pressedBodies: Iterable<string>,
  pioneerOf: (follower: string) => { readonly objectId: string; readonly faceId: string } | null,
): Set<string> {
  const keys = new Set<string>();
  for (const body of pressedBodies) {
    const ref = pioneerOf(body);
    if (ref !== null) keys.add(faceKey(ref.objectId, ref.faceId));
  }
  return keys;
}

/**
 * ⭐⭐ `D163` — **IS THE HITFACE'S FUCHSIA CONTOUR SHOWN?** (the owner, 2026-09-29: *"when hitface is latched on
 * aligned object, highlight the hitface contour in fuchsia (currently, it does not show because the follower
 * object contour is highlighted in cyan). Make sure the fuchsia overrides the cyan in such case."*).
 * ⭐ On a FREE part, always (as before). On an ALIGNED part, only while the HitFace is LATCHED (`D154`/`D161`) —
 * a plain press on an aligned part still shows none, as before. ⚠ *Overrides the cyan* is the render loop's: the
 * contour is drawn in a later rendering group than the cyan outline it shares edges with.
 */
export function hitFaceShown(onAlignedPart: boolean, latched: boolean): boolean {
  return !onAlignedPart || latched;
}
