/**
 * ⭐ THE ENVIRONMENT a model's metal reflects — generated here, no third-party image (the owner, 2026-11-13: *"create the image yourself with what is
 * best to make the chrome render properly (light blue sky lighted with sun ?, earth or sand on the floor ?)"*).
 *
 * Why: a metallic surface (Blender's Chrome: metallic 1, roughness 0.14) has no colour of its own — it shows what it reflects. With no
 * `scene.environmentTexture` it reflects black. Blender looked right because its viewport lights the model with a studio image.
 *
 * What: an equirectangular Radiance .hdr (linear RGB, values above 1 allowed), 512 × 256:
 *   - the SKY: a light grey with a tint of blue, paler at the horizon (most of what an upward chrome face shows);
 *   - the SUN: a small, very bright disc with a glow (the crisp highlight on rounded chrome), 40° up;
 *   - the GROUND: the game floor's sand yellow, darker toward the nadir (what downward faces show — the chrome sits in its room).
 * Rows are constant except round the sun, so the file's run-length coding keeps it small (≈ 63 KB).
 * ⭐ Blender's preview world uses the SAME file (`build_engine.py`), so the .blend shows the game's reflections.
 *
 * Run: `node scripts/gen_sky_hdr.mjs` → `Assets/Environment/sky_sand.hdr` (committed; the game loads it as a prefiltered HDRCubeTexture).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const W = 512, H = 256;
const OUT = fileURLToPath(new URL("../Assets/Environment/sky_sand.hdr", import.meta.url));

const ZENITH = [0.62, 0.68, 0.78];                    // light grey, a tint of blue (the owner, 2026-11-13: "the sky is too blue. make it more light greyish with a tint of blue"; 0.18, 0.38, 0.85 before)
const HORIZON = [0.88, 0.9, 0.93];
// the GROUND = the game's floor (Scene_1's "sand yellow" MAT_F, linear 0.84, 0.74, 0.52 — the owner: *"including the effect of the yellow floor of
// the scene"*), as lit: a little darker toward the nadir (the model's own shadow under it)
const FLOOR = [0.84, 0.74, 0.52];
const SAND_NEAR = FLOOR.map((v) => v * 0.85);
const SAND_FAR = FLOOR.map((v) => v * 0.6);
const SUN = { elev: (40 * Math.PI) / 180, azim: (-35 * Math.PI) / 180, radius: (1.6 * Math.PI) / 180, value: 40, color: [1, 0.95, 0.85] };

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const dir = (elev, azim) => [Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim)];
const sunDir = dir(SUN.elev, SUN.azim);

function radiance(elev, azim) {
  let c;
  if (elev >= 0) {
    const t = Math.pow(1 - Math.sin(elev), 2.5);                     // the haze rises from the horizon
    c = mix(ZENITH, HORIZON, t).map((v) => v * 1.1);
  } else {
    const t = Math.pow(Math.min(1, -elev / (Math.PI / 2)), 0.6);
    c = mix(SAND_NEAR, SAND_FAR, t);
    const band = Math.exp(-(-elev) / 0.04) * 0.25;                    // a soft bright horizon line, the sky's haze on the sand
    c = c.map((v, i) => v + band * HORIZON[i]);
  }
  const d = dir(elev, azim);
  const cos = d[0] * sunDir[0] + d[1] * sunDir[1] + d[2] * sunDir[2];
  const ang = Math.acos(Math.min(1, Math.max(-1, cos)));
  if (ang < SUN.radius) c = c.map((v, i) => v + SUN.value * SUN.color[i]);
  else c = c.map((v, i) => v + 2.0 * Math.exp(-(ang - SUN.radius) / 0.06) * SUN.color[i] + 0.3 * Math.exp(-ang / 0.5) * SUN.color[i]);
  return c;
}

function rgbe([r, g, b]) {
  const m = Math.max(r, g, b);
  if (m < 1e-32) return [0, 0, 0, 0];
  const e = Math.ceil(Math.log2(m) + 1e-9);
  const f = 256 / Math.pow(2, e);
  return [Math.min(255, Math.floor(r * f)), Math.min(255, Math.floor(g * f)), Math.min(255, Math.floor(b * f)), e + 128];
}

/** One channel of a scanline, the "new" RLE: a run of 3+ equal bytes = (128 + n, byte); else a literal (n, bytes…), n ≤ 127/128. */
function rleChannel(bytes) {
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    let run = 1;
    while (i + run < bytes.length && run < 127 && bytes[i + run] === bytes[i]) run++;
    if (run >= 3) {
      out.push(128 + run, bytes[i]);
      i += run;
      continue;
    }
    const start = i;
    let n = 0;
    while (i < bytes.length && n < 128) {
      if (i + 2 < bytes.length && bytes[i] === bytes[i + 1] && bytes[i] === bytes[i + 2]) break;
      i++;
      n++;
    }
    out.push(n, ...bytes.slice(start, start + n));
  }
  return out;
}

/** Writes one panorama: `at(x, y)` gives a pixel's linear radiance. */
function writeHdr(out, about, at) {
  const header = `#?RADIANCE\n# ${about} (scripts/gen_sky_hdr.mjs)\nFORMAT=32-bit_rle_rgbe\n\n-Y ${H} +X ${W}\n`;
  const body = [];
  for (let y = 0; y < H; y++) {
    const px = [];
    for (let x = 0; x < W; x++) px.push(rgbe(at(x, y)));
    body.push(2, 2, (W >> 8) & 0xff, W & 0xff);
    for (let ch = 0; ch < 4; ch++) body.push(...rleChannel(px.map((p) => p[ch])));
  }
  mkdirSync(dirname(out), { recursive: true });
  const bytes = Buffer.concat([Buffer.from(header, "ascii"), Buffer.from(body)]);
  writeFileSync(out, bytes);
  console.log(`${out}: ${W} × ${H}, ${bytes.length} bytes`);
}

writeHdr(OUT, "Scene_2's environment: sky, sun, sand", (x, y) =>
  radiance(Math.PI / 2 - ((y + 0.5) / H) * Math.PI, ((x + 0.5) / W) * 2 * Math.PI - Math.PI));

/**
 * ⭐⭐ THE CREAM STUDIO — `Scene_2`'s environment (the owner, 2026-11-13: *"can you recreate this atmosphere"* → *"atmosphere_C_between_floor.png is
 * the setup I want. build that"*): a warm cream room all round (the fill: what the shadows and the metal see), the ground the floor's ivory, and a
 * SOFT BOX where the key light comes from (the chrome's highlight). ⭐ Laid out in BABYLON's own panorama mapping (`PanoramaToCubeMapTools`:
 * θ = atan2(z, x) across, φ = acos(y) down, in its left-handed world), so the box sits toward the scene's key light — `KEY_FROM` is the direction
 * the light comes FROM, the opposite of `Scene_2`'s directional light's travel (`src/content/scene_2.ts`).
 */
const STUDIO_OUT = fileURLToPath(new URL("../Assets/Environment/studio_cream.hdr", import.meta.url));
const WALL = [0.888, 0.831, 0.738].map((v) => v * 0.45); // the backdrop's cream (sRGB F2EBDF), as the room's light — render C's fill (its world 0.45)
const GROUND = [0.864, 0.785, 0.629].map((v) => v * 0.65); // the floor's ivory (sRGB EFE5D0), as lit under the room
const KEY_FROM = [-0.666, 0.643, 0.378]; // behind-left of the boot view (the camera at −z): render C's light, turned onto it
const BOX = { radius: (14 * Math.PI) / 180, edge: (6 * Math.PI) / 180, value: 4, color: [1, 0.93, 0.84] };
writeHdr(STUDIO_OUT, "Scene_2's cream studio: walls, ivory ground, a soft box toward the key", (x, y) => {
  const theta = ((x + 0.5) / W) * 2 * Math.PI - Math.PI;
  const phi = ((y + 0.5) / H) * Math.PI;
  const d = [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
  const up = d[1];
  let c = up >= 0 ? WALL.map((v) => v * (0.9 + 0.1 * up)) : mix(WALL, GROUND, Math.min(1, -up * 6));
  const k = Math.hypot(...KEY_FROM);
  const cos = (d[0] * KEY_FROM[0] + d[1] * KEY_FROM[1] + d[2] * KEY_FROM[2]) / k;
  const ang = Math.acos(Math.min(1, Math.max(-1, cos)));
  const w = ang < BOX.radius ? 1 : Math.max(0, 1 - (ang - BOX.radius) / BOX.edge);
  return c.map((v, i) => v + w * w * BOX.value * BOX.color[i]);
});
