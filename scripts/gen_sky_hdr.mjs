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

const header = `#?RADIANCE\n# Scene_2's environment: sky, sun, sand (scripts/gen_sky_hdr.mjs)\nFORMAT=32-bit_rle_rgbe\n\n-Y ${H} +X ${W}\n`;
const body = [];
for (let y = 0; y < H; y++) {
  const elev = Math.PI / 2 - ((y + 0.5) / H) * Math.PI;
  const px = [];
  for (let x = 0; x < W; x++) px.push(rgbe(radiance(elev, ((x + 0.5) / W) * 2 * Math.PI - Math.PI)));
  body.push(2, 2, (W >> 8) & 0xff, W & 0xff);
  for (let ch = 0; ch < 4; ch++) body.push(...rleChannel(px.map((p) => p[ch])));
}
mkdirSync(dirname(OUT), { recursive: true });
const bytes = Buffer.concat([Buffer.from(header, "ascii"), Buffer.from(body)]);
writeFileSync(OUT, bytes);
console.log(`${OUT}: ${W} × ${H}, ${bytes.length} bytes`);
