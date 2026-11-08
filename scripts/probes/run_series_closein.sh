#!/bin/bash
# THE CLOSE-IN SERIES (2026-11-08, scope §32): 12 long walks x 6000 px WITH APPROACHES (A + drag in / out as a segment kind, the landing simulated after each)
# at four start distances x 3 seeds into $OUTROOT/c1, then 4 walks x 4000 px started close in into $OUTROOT/c2. Needs the dev server (npm run dev:usb).
# Analyse: node scripts/probes/analyse_closein.mjs <dir>  (and analyse_walk2.mjs / analyse_camera.mjs for the travel and the camera).
S="${OUTROOT:?set OUTROOT to a scratch folder}"
cd "$(dirname "$0")/../.."
export URL=http://127.0.0.1:5173/
run() { O=$1; shift; mkdir -p $O; PROBE_DIR=$O OUT=$1 BOOT_MS=20000 WATCHDOG_MIN=40 "${@:2}" node scripts/probes/orbit_probe.mjs > $O/$1.log 2>&1; echo "$1 $(tail -1 $O/$1.log | cut -c1-60)"; }
for D in 0 400 550 600; do
  A=""; [ $D -gt 0 ] && A="APPR=$D"
  for SD in 11 22 33; do run $S/c1 w${D}_s${SD} env MODE=walk WALKS=1 WALKPX=6000 SEED=$((SD + D)) APPROACHES=1 LAND_EVERY=1000000 $A & done
  wait
done
for SD in 44 55 66 77; do run $S/c2 w_s${SD} env MODE=walk WALKS=1 WALKPX=4000 SEED=$SD APPR=640 APPROACHES=1 APPRMAX=150 LAND_EVERY=1000000 & done
wait
echo all-done
