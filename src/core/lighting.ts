/**
 * ⭐⭐ **A SCENE'S LIGHTS, AS DATA** (`Scene_1`, the owner, 2026-09-27) — engine-free.
 *
 * The owner authors lights in Unity's terms: a position, an Euler rotation, an intensity, a range, a
 * spot's outer/inner angle, a colour temperature and a filter colour. This file turns them into what
 * the renderer needs — a direction, an RGB colour, and the illuminance each light delivers AT THE
 * SCENE — so `render/lighting.ts` only builds Babylon objects.
 *
 * ⛔ **THE CONVENTIONS, STATED ONCE**:
 * * Unity and Babylon are both LEFT-HANDED, `+y` up, `+z` forward — positions transfer unchanged.
 * * A Unity light shines along its local `+z`. Unity applies Euler angles Z, then X, then Y
 *   (`R = Ry · Rx · Rz`); the Z roll leaves `+z` alone, so the direction depends on X and Y only.
 * * ⚠ **INTENSITY IS READ AS URP's**: a spot or point delivers `intensity / d²`, windowed by its range
 *   `(1 − (d²/r²)²)²`, and a directional light delivers `intensity` — the owner: *"Use URP/Lit"*.
 *   Babylon's standard material has no inverse-square falloff, so the renderer is given the
 *   illuminance AT THE SCENE's centre as the light's intensity, with an unlimited range. ⚠ Exact at
 *   the centre, and within ~10% across a painting 5 units wide lit from 50 units away.
 */
import { normalize, type Vec3 } from "./vec";

export type Triple = readonly [number, number, number];

export interface LightSpec {
  readonly name: string;
  readonly type: "SPOT" | "DIRECTIONAL";
  /** Authored units (the scene's `unitM` scales it). */
  readonly position: Triple;
  /** Unity Euler angles, degrees: `(x, y, z)`. */
  readonly eulerDeg: Triple;
  readonly intensity: number;
  /** Spots only, authored units. */
  readonly range?: number;
  /** Spots only: Unity's FULL cone angles, degrees. */
  readonly spotOuterDeg?: number;
  readonly spotInnerDeg?: number;
  readonly kelvin: number;
  readonly filter: Triple;
}

export interface LightingSpec {
  /** The clear colour behind the scene, linear RGB. */
  readonly background: Triple;
  readonly lights: readonly LightSpec[];
  /** Unity's shadow strength: 0 = none, 1 = black. */
  readonly shadowStrength: number;
  /**
   * ⚠ A hemispheric FILL standing in for Unity's environment (skybox) lighting, which the owner's
   * scene has but does not list. `0` = none — then every face turned from the three lights is black.
   */
  readonly ambient: number;
}

/** ⭐ The direction a Unity light shines, from its Euler angles. */
export function unityForward(eulerDeg: Triple): Vec3 {
  const x = (eulerDeg[0] * Math.PI) / 180;
  const y = (eulerDeg[1] * Math.PI) / 180;
  return [Math.sin(y) * Math.cos(x), -Math.sin(x), Math.cos(y) * Math.cos(x)];
}

/**
 * ⭐ A colour temperature as linear-ish RGB in [0, 1], normalised so the largest channel is 1.
 * ⚠ Tanner Helland's fit of the blackbody locus (1000–40000 K) — the one Unity's own
 * `Mathf.CorrelatedColorTemperatureToRGB` approximates. Good to a few percent, which is below what
 * the eye separates at these temperatures.
 */
export function kelvinToRgb(kelvin: number): Triple {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;
  const clamp = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const rgb: [number, number, number] = [clamp(r), clamp(g), clamp(b)];
  const m = Math.max(...rgb);
  return m > 0 ? [rgb[0] / m, rgb[1] / m, rgb[2] / m] : [1, 1, 1];
}

/** The light's colour: its temperature times its filter. */
export function lightColour(l: LightSpec): Triple {
  const k = kelvinToRgb(l.kelvin);
  return [k[0] * l.filter[0], k[1] * l.filter[1], k[2] * l.filter[2]];
}

/**
 * ⭐⭐ **THE ILLUMINANCE A LIGHT DELIVERS AT A POINT**, URP's model (see the header). `0` outside a
 * spot's outer cone or beyond its range. ⚠ The spot's cone edge is smoothed between inner and outer
 * as URP does.
 */
export function illuminanceAt(l: LightSpec, point: Triple): number {
  if (l.type === "DIRECTIONAL") return Math.max(0, l.intensity);
  const d: Vec3 = [point[0] - l.position[0], point[1] - l.position[1], point[2] - l.position[2]];
  const d2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  const range = l.range ?? Infinity;
  if (!(d2 > 0) || d2 >= range * range) return 0;
  const win = Number.isFinite(range) ? Math.pow(1 - Math.pow(d2 / (range * range), 2), 2) : 1;
  let cone = 1;
  if (l.spotOuterDeg !== undefined) {
    const dir = normalize(d);
    const fwd = normalize(unityForward(l.eulerDeg));
    if (!dir || !fwd) return 0;
    const cosA = dir[0] * fwd[0] + dir[1] * fwd[1] + dir[2] * fwd[2];
    const cosOuter = Math.cos(((l.spotOuterDeg / 2) * Math.PI) / 180);
    const cosInner = Math.cos((((l.spotInnerDeg ?? l.spotOuterDeg) / 2) * Math.PI) / 180);
    if (cosA <= cosOuter) return 0;
    cone = cosInner > cosOuter ? Math.min(1, (cosA - cosOuter) / (cosInner - cosOuter)) : 1;
    cone = cone * cone;
  }
  return (Math.max(0, l.intensity) / d2) * win * cone;
}
