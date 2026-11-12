/**
 * ⭐ **A RIGHT PRISM ON A REGULAR POLYGON** (the owner, 2026-11-12: *"an heptagon extruded horizontally. One face on the floor, the opposite
 * edge at the zenith. Dimensions: overall the same as the cube of the assembly of scene 1"*) — a body's `prismSides` (`BodySpec`).
 *
 * The polygon lies in the body's own x–y plane, extruded along its own z; ONE EDGE FLAT at the bottom (a face on the floor), so an odd
 * polygon has a VERTEX at the top (the zenith) and an even one a flat top. Its bounding box is stretched to fill the body's `dims`
 * exactly (`dims[0]` across, `dims[1]` high, `dims[2]` the extrusion) — so "the same overall dimensions" holds to the millimetre; a
 * regular heptagon is 1.026 × wider than high, so the fit narrows it by 2.6 % (its angles ~1° off regular).
 *
 * ⛔ ENGINE-FREE: the mesh is built in `render/bodies.ts` from this outline; a vector reaches it here.
 */
export type Vec2 = readonly [number, number];

/** ⭐ The outline, counter-clockwise from above +z, its bounding box `w × h` centred on the origin; `null` below 3 sides or a degenerate size. */
export function prismOutline(sides: number, w: number, h: number): Vec2[] | null {
  if (!Number.isInteger(sides) || sides < 3 || !(w > 0) || !(h > 0)) return null;
  // the regular polygon whose bottom edge is flat: vertices at −90° ± half a step, then every step on
  const step = (2 * Math.PI) / sides;
  const pts: Vec2[] = [];
  for (let k = 0; k < sides; k++) {
    const a = -Math.PI / 2 + step / 2 + k * step;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return pts.map(([x, y]) => [((x - (x0 + x1) / 2) / (x1 - x0)) * w, ((y - (y0 + y1) / 2) / (y1 - y0)) * h]);
}

/**
 * ⭐ The turn about z that brings a vertex of a regular `sides`-gon ring (centred on the z axis, flat array `x, y, z, …`) to the TOP (+y) —
 * counter-clockwise from +x to +y. `null` with no ring vertex (nothing off the axis).
 */
export function apexTurn(pos: ArrayLike<number>, sides: number): number | null {
  if (!Number.isInteger(sides) || sides < 3) return null;
  let r = 0;
  for (let i = 0; i + 2 < pos.length; i += 3) r = Math.max(r, Math.hypot(pos[i]!, pos[i + 1]!));
  if (!(r > 1e-9)) return null;
  for (let i = 0; i + 2 < pos.length; i += 3)
    if (Math.hypot(pos[i]!, pos[i + 1]!) > r * (1 - 1e-6)) return Math.PI / 2 - Math.atan2(pos[i + 1]!, pos[i]!);
  return null;
}

/** ⭐ Is a vertex at the top, on the axis's vertical (x ≈ 0 at the highest y)? — the check after the turn, whichever way the engine turns. */
export function apexAtTop(pos: ArrayLike<number>): boolean {
  let top = -Infinity;
  for (let i = 1; i < pos.length; i += 3) top = Math.max(top, pos[i]!);
  for (let i = 0; i + 2 < pos.length; i += 3) if (Math.abs(pos[i + 1]! - top) < 1e-6 && Math.abs(pos[i]!) < 1e-6) return true;
  return false;
}

/** ⭐ The shift (subtracted first) and the per-axis scale that stretch the points' bounding box onto `dims`, centred; `null` if flat on an axis. */
export function boxFit(pos: ArrayLike<number>, dims: readonly [number, number, number]): { readonly centre: [number, number, number]; readonly scale: [number, number, number] } | null {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i + 2 < pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k]!, pos[i + k]!);
      hi[k] = Math.max(hi[k]!, pos[i + k]!);
    }
  const size = [0, 1, 2].map((k) => hi[k]! - lo[k]!);
  if (!size.every((s) => s > 1e-12) || !dims.every((d) => d > 0)) return null;
  return {
    centre: [(lo[0]! + hi[0]!) / 2, (lo[1]! + hi[1]!) / 2, (lo[2]! + hi[2]!) / 2],
    scale: [dims[0] / size[0]!, dims[1] / size[1]!, dims[2] / size[2]!],
  };
}

/**
 * ⭐ (2026-11-12, the owner: *"modify the heptagon of scene 0bis so that the two lateral faces have a tip, as attachment"*) **THE TIPS** — the prism's
 * two end faces (its caps) each raised into a PYRAMID whose apex stands on the polygon's centre, out along the extrusion.
 *
 * Babylon's cylinder builds each cap as a FAN round one vertex on its axis; moving those vertices out along the axis turns each flat cap into a
 * pyramid, the engine's winding kept. These two functions are that move, engine-free.
 */
/** ⭐ The vertices ON the axis (x = y = 0) — the caps' centres; read before any stretch, while the axis is the origin's. */
export function axisVertices(pos: ArrayLike<number>): number[] {
  let r = 0;
  for (let i = 0; i + 2 < pos.length; i += 3) r = Math.max(r, Math.hypot(pos[i]!, pos[i + 1]!));
  const out: number[] = [];
  if (!(r > 1e-9)) return out;
  for (let i = 0; i + 2 < pos.length; i += 3) if (Math.hypot(pos[i]!, pos[i + 1]!) < r * 1e-9) out.push(i / 3);
  return out;
}

/** ⭐ Each listed vertex pushed out along z by `tip`, away from the middle (z = 0) — in place; `false` (nothing moved) for a vertex AT the middle or a tip < 0. */
export function raiseTips(pos: { [k: number]: number; readonly length: number }, vertices: readonly number[], tip: number): boolean {
  if (!(tip >= 0) || vertices.some((v) => !(Math.abs(pos[v * 3 + 2]!) > 1e-12))) return false;
  for (const v of vertices) pos[v * 3 + 2] = pos[v * 3 + 2]! + Math.sign(pos[v * 3 + 2]!) * tip;
  return true;
}
