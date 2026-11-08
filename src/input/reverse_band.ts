/**
 * ⭐⭐⭐ (2026-11-08, scope §32.13) **THE REVERSE BAND** — the finger's tremble on its OWN axis taken out of the orbit around the assembly.
 *
 * ⛔ What it was: §1.1's band (`orbitDeadbandMm`) is paid once per axis ENTERING motion; from then on every event's step passed raw, its sign
 * included — and a real finger trembles back along the way it drags. On a cap a quarter turn of finger crosses the whole face (T2: a 53 cm top in
 * ~16 mm, ~33 mm of travel per mm), so a 0.5 mm tremble moved the place ~15 mm back and forth; held at an edge (T5), each tremble left the edge and the
 * next push went back to it. The orbit's spring hid it until §32.11 deleted the spring: the piece jumped back and forth on the screen (the owner).
 *
 * ⭐ A BACKLASH per finger component (a one-dimensional play): the way the component last moved is kept; a step that way passes (first taking up any
 * slack); a step BACK is absorbed until the finger has gone back by more than the band, and only the excess passes — the way flips there. A fresh drag
 * passes its first step whole (the entry band is §1.1's). Time-free, exact (a reversal costs the band ONCE), engine-free.
 */

/** ⭐ One component's play: `dir` the way it last moved (+1 / −1; 0 none yet), `back` the finger gone back since (mm, < the band). */
export interface ReverseBand {
  dir: number;
  back: number;
}

/** ⭐ A fresh drag's state (no way yet). */
export function reverseBand(): ReverseBand {
  return { dir: 0, back: 0 };
}

/** ⭐⭐⭐ One step of `mm` through the play of `bandMm` (mutates `b`); returns the millimetres that pass. */
export function reverseBandStep(b: ReverseBand, mm: number, bandMm: number): number {
  if (mm === 0 || !Number.isFinite(mm)) return 0;
  const s = Math.sign(mm);
  const a = Math.abs(mm);
  if (b.dir === 0) {
    b.dir = s;
    b.back = 0;
    return mm;
  }
  if (s === b.dir) {
    const take = Math.min(b.back, a); // the slack taken up first: the finger back to where it turned
    b.back -= take;
    return s * (a - take);
  }
  b.back += a;
  const w = Math.max(0, bandMm);
  if (b.back <= w) return 0;
  const excess = b.back - w;
  b.dir = s;
  b.back = 0;
  return s * excess;
}
