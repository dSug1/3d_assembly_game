#!/bin/bash
# THE LONG-WALK SERIES (2026-11-07): 16 walks x 8000 px (4 approach distances x 4 seeds) into $OUTROOT/s53, then 4 close-in walks x 4000 px into $OUTROOT/s54.
# Needs the dev server (npm run dev:usb). Analyse with analyse_walk.mjs / analyse_walk2.mjs / analyse_jumps.mjs / analyse_camera.mjs / analyse_lines.cjs <dir>.
S="${OUTROOT:?set OUTROOT to a scratch folder}"
cd "$(dirname "$0")/../.."
export URL=http://127.0.0.1:5173/
run() { O=$1; shift; mkdir -p $O; PROBE_DIR=$O OUT=$1 BOOT_MS=20000 WATCHDOG_MIN=40 "${@:2}" node scripts/probes/orbit_probe.mjs > $O/$1.log 2>&1; echo "$1 $(tail -1 $O/$1.log | cut -c1-60)"; }
for D in 0 150 300 900; do
  A=""; [ $D -gt 0 ] && A="APPR=$D"
  for SD in 11 22 33 44; do run $S/s53 w${D}_s${SD} env MODE=walk WALKS=1 WALKPX=8000 SEED=$((SD + D)) SHOT_EVERY=1600 $A & done
  wait
done
for SD in 11 22 33 44; do run $S/s54 w_s${SD} env MODE=walk WALKS=1 WALKPX=4000 SEED=$SD APPR=330 SHOT_EVERY=800 & done
wait
echo all-done
