#!/usr/bin/env bash
# ⭐⭐⭐ (2026-11-17, package LF1) THE LEVEL FACE'S ENTRY GATE (level_entry_check.mjs + level_entry_analyse.mjs) on a dev server:
#   bash scripts/probes/level_entry_batch.sh <tag> a|b|c|<walk name> ...     EXTRA="&<tunable>=<value>" is appended to every URL
#   c — (2026-11-18, ES) Scene_0bis: the straight dy at 4 and 6 px a frame, both ends
#   a — Scene_0 close in: a slow dy (1 px a frame) down the lower front face near +x, −x and the middle, then across the bottom; the same coming down
#       from a top face near both ends; the +x walk with a fast finger (3 px a frame)
#   b — Scene_0bis: the corner loops (ccw, cw; both tips; far out, 0.736, 0.515, close in; 2 px a frame, once 4 px far out); in and back near the end,
#       in near the end and out in the middle, across to the far edge and back; a straight dy down the rectangle near the end and across the bottom
#   Writes <OUT>/<tag>_<walk>.json and .log, then <OUT>/<tag>_analysis.txt (every walk's events, drift and timed turns with their paths).
#   The runbook: scripts/probes/ORBIT_GATES.md §7
set -u
TAG="$1"; shift
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
# name|scene|walk|IN|px|TX|env (;-separated)|analysis env
WALKS_A="a_x190|0|bottomout|1|1|190|| a_xm190|0|bottomout|1|1|-190|| a_x0|0|bottomout|1|1|0|| a_top_x190|0|top|1|1|190||INV=1;NY=0.85 a_top_xm190|0|top|1|1|-190||INV=1;NY=0.85 a_fast_x190|0|bottomout|1|3|190||"
WALKS_B=""
for SIDE in 1 -1; do
  T=$([ "$SIDE" = 1 ] && echo p || echo m)
  for D in far:0: d736:half:HALFN=7 d515:half:HALFN=20 close:1:; do
    DN=${D%%:*}; R=${D#*:}; I=${R%%:*}; H=${R#*:}
    for L in ccw cw; do WALKS_B="$WALKS_B b_${L}_${T}_${DN}|4|loop|$I|2||LOOP=$L;START=F;SIDE=$SIDE${H:+;$H}|"; done
  done
  WALKS_B="$WALKS_B b_back_${T}_far|4|loop|0|2||LOOP=back;REPS=1;SIDE=$SIDE| b_backm_${T}_far|4|loop|0|2||LOOP=backm;REPS=1;SIDE=$SIDE| b_far_${T}_far|4|loop|0|2||LOOP=far;REPS=1;SIDE=$SIDE|"
done
WALKS_B="$WALKS_B b_ccw_p_far_px4|4|loop|0|4||LOOP=ccw;START=F;SIDE=1| b_back_p_d736|4|loop|half|2||LOOP=back;REPS=1;SIDE=1;HALFN=7| b_back_p_close|4|loop|1|2||LOOP=back;REPS=1;SIDE=1|"
WALKS_B="$WALKS_B b_dy_x190|4|bottomout|0|2|190|| b_dy_xm190|4|bottomout|0|2|-190||"
# ⭐ (2026-11-18, package ES) c — the straight dy at 4 and 6 px a frame, both ends (the free-roll gate, LEVEL_FACE_ENTRY.md §15 gate 5)
WALKS_C="b_dy_px4_x190|4|bottomout|0|4|190|| b_dy_px4_xm190|4|bottomout|0|4|-190|| b_dy_px6_x190|4|bottomout|0|6|190|| b_dy_px6_xm190|4|bottomout|0|6|-190||"
SEL=""
for a in "$@"; do
  case "$a" in a) SEL="$SEL $WALKS_A" ;; b) SEL="$SEL $WALKS_B" ;; c) SEL="$SEL $WALKS_C" ;; *) for w in $WALKS_A $WALKS_B $WALKS_C; do [ "${w%%|*}" = "$a" ] && SEL="$SEL $w"; done ;; esac
done
[ -z "$SEL" ] && { echo "nothing to run (give a, b, c or walk names)"; exit 2; }
server_start "le_$TAG"
ANA="$OUT/${TAG}_analysis.txt"
: > "$ANA"
for w in $SEL; do
  IFS="|" read -r NAME S W I PX TXV EXT AEN <<< "$w"
  F="$OUT/${TAG}_${NAME}"
  t0=$(date +%s)
  env ${TXV:+TX=$TXV} ${EXT//;/ } URL="http://127.0.0.1:$PORT/?sceneIndex=$S&idleOrbitOn=0${EXTRA:-}" WALK=$W IN=$I PX=$PX ADD=40 OUTJSON="$F.json" node "$PROBES/level_entry_check.mjs" > "$F.log" 2>&1
  echo "== $NAME ($(( $(date +%s) - t0 )) s): $(grep -c . "$F.log") lines, $(tail -1 "$F.log")"
  { echo "=== $NAME  ($S $W IN=$I PX=$PX ${TXV:+TX=$TXV} $EXT)"; grep -h "approach\|on the bottom\|on the top\|out of\|back on\|after a dx\|moved to\|start \|loop[0-9] ->\|frames\|EXCEPTION" "$F.log" | grep -v boot | sed 's/^/    /'
    env ${TXV:+TX=$TXV} ${AEN//;/ } node "$PROBES/level_entry_analyse.mjs" "$F.json" | tail -n +2; } >> "$ANA" 2>&1
done
echo "analysis: $ANA"
