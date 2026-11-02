/**
 * ⭐⭐ THE DRAWN LINES' RULES (the gizmo's paths, `render/assembly_wiring.ts`'s `sectionLinesFrame`) — ⭐⭐⭐ (2026-11-02, the shell) all that is left of
 * `section_hull.ts`: the gizmo carried on the sections' hulls is deleted (the piece rides the shell, `orbit_shell.ts`; the gizmo is a readout).
 * ⛔ ENGINE-FREE. Distances and a sorted insertion — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";

/**
 * ⭐⭐ (2026-10-29, the owner: *"the green section has a strange shape. Is it OK and playable as such ?"* → *"build that"*) — **A DRAWN SECTION JOINS TWO
 * NEIGHBOURING POINTS ONLY WHEN THEY ARE NEAR**: no farther apart than 2.5 × the samples' spacing (+ 2 mm) — a step in depth (a drop into a missing piece's
 * slot, onto another surface) breaks the line. ⛔ The green joined every pair: one jump drew a straight segment across the face. (The red's own rule, shared.)
 */
export function joins(a: Vec3, b: Vec3, spacingM: number): boolean {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) <= 2.5 * spacingM + 0.002;
}

/**
 * ⭐⭐ (2026-11-02) The segments drawn around the gizmo's vertex: each neighbour by the line's own rule (`joinsPrev`, `joinsNext` — `joins`); cut off on
 * BOTH sides (it sits across a jump), the NEARER neighbour joined anyway — the ring always on a drawn line (measured: 2 frames of 953 left it 30 mm off).
 */
export function gizmoJoins(joinsPrev: boolean, joinsNext: boolean, distPrev: number, distNext: number): [boolean, boolean] {
  if (joinsPrev || joinsNext) return [joinsPrev, joinsNext];
  return distPrev <= distNext ? [true, false] : [false, true];
}

/** ⭐ Where `p` goes among the sorted `params`: after every one not past it. */
export function insertIndex(params: readonly number[], p: number): number {
  let i = 0;
  while (i < params.length && params[i]! <= p) i++;
  return i;
}
