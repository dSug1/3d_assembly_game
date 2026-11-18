# INDEX.md's line on the highlight's one-pixel lift, moved word for word

> Moved on 2026-11-18 from [`INDEX.md`](../INDEX.md) to make room for the orbit documents' pointers (docs pass of the audit). It is the record, not the state: the lift is `highlightLiftMm`, `D126`.

⭐⭐ **EVERY HIGHLIGHT FLOATS ONE PIXEL OFF WHAT IT MARKS** (`D126`, the owner 2026-09-27). It was a
world distance — 1.5 mm for a face marker, 2 % of the body's half-size for the aligned outline — so 10–20
px up close and under one far away. ⭐ Now `highlightLiftMm` (one CSS pixel, a slider in FACE ALIGNMENT)
is turned into metres at each body's camera distance every frame (`input/highlight_lift.ts`): face
markers are built ON the face and translated along its normal; an outline's offset is baked, so it is
rebuilt only when stale by 5 % (a zoom). ⭐ **Default 0.1 mm since 2026-09-28** (the owner; ~67/d × a 24-bit depth step at d m, vectored). One pixel is ~60× the 24-bit depth step at 3 m, ~1200× at
0.15 m. ⚠ A 16-bit depth buffer would need 2–3 px beyond ~1 m. The PioneerFaceCursor rides 3 lifts up.
