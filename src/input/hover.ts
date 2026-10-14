/**
 * ⭐⭐⭐ prototype — **THE HOVER** (2026-10-14, the owner: *"Now we need to define the hover for the fine edge-to-edge alignment of the piece and
 * assembly. I am enclined to build the hover with a translation of the piece or even the yellow gizmo on the collision surface, possibly for a
 * limited amplitude, with a toggle back to orbit possible at any time"* → *"I agree with all your recommendations …"*; `HOVER.md`).
 *
 * A drag that STARTS ON the orbited piece slides it — and, by default, the yellow gizmo with it — in the plane of the part face its resting face
 * lies against; a drag from anywhere else orbits. Lifting the finger is the way back to the orbit (a quasimode: no toggle, no hidden mode).
 * Allowed only while the resting face and that face are ANTI-PARALLEL and IN CONTACT (`hoverContact`); every step is solved by the orbit's own
 * clearance rule, so the other faces stop and slide it. Pure: the scene reaches it through numbers.
 */
import type { Vec3 } from "../core/vec";

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 | null => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};

/** ⭐ The resting face and the part's face count as aligned within this angle (°): the quads align exactly — this is numerical room. */
export const HOVER_ALIGN_DEG = 2;

/**
 * ⭐⭐ **IN CONTACT, FROM THE GAME'S OWN GEOMETRY** — the piece RESTS at the gap kept (\`gapM\`, 1 mm) and a pose is admissible down to half of it;
 * conservative advancement stops within \`atContactM\` (0.2 mm) above the gap kept, and a slide's sub-step may land anywhere above half of it. So
 * a piece pushed onto a face sits between \`gapM / 2\` and \`gapM + atContactM\` from it: CONTACT is a gap up to \`gapM + max(atContactM, gapM / 2)\`
 * — 1.5 mm at the shipped 1 mm (the parts' own skin, 0.3 mm on the glass, and the deadbands play no part: the piece's rule is in the world).
 */
export function hoverContactM(gapM: number, atContactM: number): number {
  return gapM + Math.max(atContactM, gapM / 2);
}

/**
 * ⭐⭐ **MAY THE PIECE HOVER?** — among the bodies near it (\`contacts\`: each one's gap and the contact normal from it toward the piece), the
 * one whose face the RESTING face lies against: in contact (\`gapM\` ≤ \`maxGapM\`) and ANTI-PARALLEL (the resting face's outward normal against
 * the contact normal, within \`alignDeg\`). Its normal is the hover plane's; \`null\`: no hover (the drag orbits).
 */
export function hoverContact(
  restingNormalW: Vec3,
  contacts: readonly { readonly id: string; readonly gapM: number; readonly normal: Vec3 | null }[],
  maxGapM: number,
  alignDeg = HOVER_ALIGN_DEG,
): { id: string; normal: Vec3; gapM: number } | null {
  const cosMin = Math.cos((alignDeg * Math.PI) / 180);
  let best: { id: string; normal: Vec3; gapM: number } | null = null;
  for (const c of contacts) {
    if (c.normal === null || c.gapM > maxGapM) continue;
    if (-dot(restingNormalW, c.normal) < cosMin) continue;
    if (best === null || c.gapM < best.gapM) best = { id: c.id, normal: c.normal, gapM: c.gapM };
  }
  return best;
}

/** ⭐ The hover plane's two axes: the screen's right laid on the plane (\`e1\`), and \`n × e1\` (\`e2\`) — \`null\` with the plane edge-on to the right. */
export function hoverPlane(n: Vec3, right: Vec3): { e1: Vec3; e2: Vec3 } | null {
  const k = dot(right, n);
  const e1 = unit([right[0] - n[0] * k, right[1] - n[1] * k, right[2] - n[2] * k]);
  if (e1 === null) return null;
  const e2 = unit(cross(n, e1));
  return e2 === null ? null : { e1, e2 };
}

/**
 * ⭐⭐ **THE FINGER ON THE PLANE** (the method of \`D76\`): \`a1\`, \`a2\` the screen shadows of one metre along \`e1\` and \`e2\` (px), the finger's
 * step solved onto both so the piece follows it exactly — × \`gain\` (1: under the finger). Edge-on (the shadows nearly parallel), each axis
 * takes its projection.
 */
export function planeStepFromScreen(dxPx: number, dyPx: number, a1: readonly [number, number], a2: readonly [number, number], gain: number): [number, number] {
  const det = a1[0] * a2[1] - a1[1] * a2[0];
  const n1 = Math.hypot(a1[0], a1[1]);
  const n2 = Math.hypot(a2[0], a2[1]);
  if (Math.abs(det) > 0.05 * n1 * n2 && n1 > 1e-9 && n2 > 1e-9) {
    return [((dxPx * a2[1] - dyPx * a2[0]) / det) * gain, ((a1[0] * dyPx - a1[1] * dxPx) / det) * gain];
  }
  const u = n1 > 1e-9 ? (dxPx * a1[0] + dyPx * a1[1]) / (n1 * n1) : 0;
  const v = n2 > 1e-9 ? (dxPx * a2[0] + dyPx * a2[1]) / (n2 * n2) : 0;
  return [u * gain, v * gain];
}

/** ⭐ The amplitude slider's top (mm): there the limit is OFF — the hover is unlimited. */
export const HOVER_UNLIMITED_MM = 500;

/** ⭐ The hover offset held in its disc (\`maxMm\`, from where the hover began); at \`HOVER_UNLIMITED_MM\` or above, unlimited. */
export function clampDisc(u: number, v: number, maxMm: number): [number, number] {
  if (maxMm >= HOVER_UNLIMITED_MM) return [u, v];
  const r = Math.hypot(u, v);
  const m = maxMm / 1000;
  return r <= m || r < 1e-12 ? [u, v] : [(u * m) / r, (v * m) / r];
}

/**
 * ⭐⭐ **THE HOVER VIEW** (the owner: *"camera moves to align camera view with the normal of the collision surface with the same offset as the one
 * of boot"* → *"Distance + angles"*) — the camera on the piece's side of the face, looking at \`target\` along the face's normal \`n\`, at the boot
 * distance \`distM\`, turned by the CAMERA OFFSET's yaw (about \`e2\`, the plane's "up" on the screen) and pitch (about \`e1\`). Kept at least
 * \`minTiltDeg\` off the world vertical (a camera looking straight down has no up), tilted toward \`awayHint\` (where the camera was).
 */
export function hoverCameraPosition(
  target: Vec3,
  n: Vec3,
  e1: Vec3,
  e2: Vec3,
  distM: number,
  yawRad: number,
  pitchRad: number,
  awayHint: Vec3,
  minTiltDeg = 3,
): Vec3 {
  // yaw about e2, then pitch about e1 (both small): the view direction n turned toward e1 and e2
  let d: Vec3 = [
    n[0] * Math.cos(yawRad) + e1[0] * Math.sin(yawRad),
    n[1] * Math.cos(yawRad) + e1[1] * Math.sin(yawRad),
    n[2] * Math.cos(yawRad) + e1[2] * Math.sin(yawRad),
  ];
  d = [d[0] * Math.cos(pitchRad) + e2[0] * Math.sin(pitchRad), d[1] * Math.cos(pitchRad) + e2[1] * Math.sin(pitchRad), d[2] * Math.cos(pitchRad) + e2[2] * Math.sin(pitchRad)];
  const maxUp = Math.cos((minTiltDeg * Math.PI) / 180);
  if (Math.abs(d[1]) > maxUp) {
    const h = unit([awayHint[0], 0, awayHint[2]]) ?? ([1, 0, 0] as Vec3);
    const s = Math.sign(d[1]) || 1;
    const t = (minTiltDeg * Math.PI) / 180;
    d = [h[0] * Math.sin(t), s * Math.cos(t), h[2] * Math.sin(t)];
  }
  const u = unit(d) ?? n;
  return [target[0] + u[0] * distM, target[1] + u[1] * distM, target[2] + u[2] * distM];
}

/**
 * ⭐⭐ **THE WAY IN AND OUT OF THE HOVER VIEW, BY THE FINGER'S TRAVEL** (the owner: *"Use a camera movement similar to way in or way out to smooth
 * the view, controlled by delta position. Make a slider for the gain"*) — the share of the hover view, raised by a hover drag's travel and
 * lowered by an orbit drag's, \`gainPerMm\` per millimetre of finger; the blend weight eases in and out (smoothstep).
 */
export function hoverViewProgress(progress: number, travelMm: number, gainPerMm: number, toward: boolean): number {
  const d = Math.max(0, travelMm) * Math.max(0, gainPerMm);
  return Math.min(1, Math.max(0, progress + (toward ? d : -d)));
}
export function hoverViewWeight(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return p * p * (3 - 2 * p);
}

/** ⭐ The hover's second coordinate in the orbit solver's \`v\` (kept in 0 … 1 there): \`v = 0.5 + metres / HOVER_SPAN_M\`. */
export const HOVER_SPAN_M = 20;

/**
 * ⭐ (2026-10-14, the owner: *"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value (i don't know what this value shall be) when hover translation"*) — THE HOVER'S SWAY: a hover is a slide along a part, so the other parts swing at the orbit sway's SLIDING
 * angle — its least, `ORBIT_SWAY_MIN_DEG` (0.1°) — whatever the slider; 0 when the slider is 0 (no sway).
 */
export function hoverSwayDeg(sliderDeg: number, minDeg: number): number {
  return sliderDeg > 0 ? Math.min(minDeg, sliderDeg) : 0;
}
