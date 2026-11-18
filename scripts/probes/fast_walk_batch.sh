#!/usr/bin/env bash
# ⭐⭐⭐ (2026-11-18, package FO1 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §4) THE FAST WALKS (fast_walk_check.mjs + fast_walk_analyse.mjs) on a dev server:
#   bash scripts/probes/fast_walk_batch.sh <tag> all|loops|edge|others|<walk name> ...     EXTRA="&<tunable>=<value>" is appended to every URL
#   REC=1: each walk also records its inputs (<tag>_<walk>.rec.json) for the no-drift replay; DRIFT=1: each walk is then replayed from them with every
#   turn whole at once (`&tiltRollDegS=0`) and compared frame by frame (fast_walk_drift.mjs) — gate G4 (ii)
#   loops  — Scene_0bis: the corner loops of the level-entry gate (rectangle → bottom → bottom triangle → front triangle, ccw and cw), at both tips,
#            far out (approach 1.0) and part way (0.736), three loops each, at 20 and 30 px a frame
#   edge   — Scene_0bis: the gizmo on the bottom face's long edge near its middle, a zigzag across it 10 mm each side, six crossings, at 2, 8, 20 px
#   others — Scene_0bis: across the bottom to its far edge and back (20 px); over the top ridge and back (20 px); Scene_0 and Scene_1 far out: up
#            the front over two edges and back (20 px)
#   Writes <OUT>/<tag>_<walk>.json and .log, then <OUT>/<tag>_analysis.txt. The runbook: scripts/probes/ORBIT_GATES.md §9
set -u
TAG="$1"; shift
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
# the heptagon round its axis (y 0.229, z 0.191 m): the bottom's middle at -90°, a face every 360/7°; the corner bottom / lower front rectangle at -115.714°
RIM=0.2475
PHIC=-115.714
OFF=0.045
targets() { # <side ±1>: the four corner targets of the level-entry loops
  local S=$1
  node -e "const S=$S,R=$RIM,O=$OFF,C=$PHIC;const c=S*R;console.log(['F:'+(c-S*O)+':'+(C-18)+':F','B:'+(c-S*O)+':'+(C+18)+':B','T:'+(c+S*O*0.6)+':'+(C+18)+':T','U:'+(c+S*O*0.6)+':'+(C-18)+':U'].join(';'))"
}
# name|scene|IN|LPX|env (;-separated: TGT, SEQ, REPS, K, TOL …)
WALKS_LOOPS=""
for SIDE in 1 -1; do
  T=$([ "$SIDE" = 1 ] && echo p || echo m)
  TG=$(targets $SIDE)
  for D in far:0 d736:half; do
    DN=${D%%:*}; I=${D#*:}
    for PX in ${LOOP_PX:-20 30}; do
      WALKS_LOOPS="$WALKS_LOOPS f_ccw_${T}_${DN}_px${PX}|4|$I|$PX|TGT=$TG;SEQ=F,B,T,U,F;REPS=3"
      WALKS_LOOPS="$WALKS_LOOPS f_cw_${T}_${DN}_px${PX}|4|$I|$PX|TGT=$TG;SEQ=F,U,T,B,F;REPS=3"
    done
  done
done
# the zigzag across the bottom's long edge (x 0): 10 mm each side of it round the axis at the edge's radius (0.24 m: 2.39°)
ZD=2.39
ZTG="ZF0:0:$(node -p "($PHIC-12)"):F;ZB0:0:$(node -p "($PHIC+12)"):B;ZF:0:$(node -p "($PHIC-$ZD)"):*:pass;ZB:0:$(node -p "($PHIC+$ZD)"):*:pass"
WALKS_EDGE=""
for PX in 2 8 20; do WALKS_EDGE="$WALKS_EDGE f_edge_px$PX|4|0|$PX|TGT=$ZTG;SEQ=ZF0,ZB,ZF,ZB,ZF,ZB,ZF;REPS=1"; done
TP=$(targets 1)
WALKS_OTHERS="f_far_p_px20|4|0|20|TGT=$TP;o1:$(node -p "($RIM-$OFF)"):$(node -p "(-90+360/7/2+18)"):o1;SEQ=F,B,o1,B,F;REPS=1"
WALKS_OTHERS="$WALKS_OTHERS f_ridge_px20|4|0|20|TGT=R3:0:72:o3;R4:0:108:o4;SEQ=R3,R4,R3;REPS=1"
WALKS_OTHERS="$WALKS_OTHERS f_s0_up_px20|0|0|20|TGT=A:0:-141.43:*;C:0:115.71:*;SEQ=A,C,A;REPS=1"
WALKS_OTHERS="$WALKS_OTHERS f_s1_over_px20|1|0|20|TGT=A:0:-160:*;M:0:90:*;Z:0:20:*;SEQ=A,M,Z,M,A;REPS=1"
SEL=""
for a in "$@"; do
  case "$a" in
    all) SEL="$SEL $WALKS_LOOPS $WALKS_EDGE $WALKS_OTHERS" ;; loops) SEL="$SEL $WALKS_LOOPS" ;; edge) SEL="$SEL $WALKS_EDGE" ;; others) SEL="$SEL $WALKS_OTHERS" ;;
    *) for w in $WALKS_LOOPS $WALKS_EDGE $WALKS_OTHERS; do [ "${w%%|*}" = "$a" ] && SEL="$SEL $w"; done ;;
  esac
done
[ -z "$SEL" ] && { echo "nothing to run (give all, loops, edge, others or walk names)"; exit 2; }
server_start "fw_$TAG"
ANA="$OUT/${TAG}_analysis.txt"
: > "$ANA"
for w in $SEL; do
  IFS="|" read -r NAME S I PX EXT <<< "$w"
  F="$OUT/${TAG}_${NAME}"
  TGTV=$(echo "$EXT" | tr ';' '\n' | grep -v '^SEQ=\|^REPS=\|^K=\|^TOL=' | sed 's/^TGT=//' | paste -sd';')
  SEQV=$(echo "$EXT" | tr ';' '\n' | grep '^SEQ=' | sed 's/^SEQ=//')
  REPSV=$(echo "$EXT" | tr ';' '\n' | grep '^REPS=' | sed 's/^REPS=//')
  U="http://127.0.0.1:$PORT/?sceneIndex=$S&idleOrbitOn=0${EXTRA:-}"
  t0=$(date +%s)
  env TGT="$TGTV" SEQ="${SEQV//,/ }" REPS="${REPSV:-1}" URL="$U" IN=$I LPX=$PX OUTJSON="$F.json" ${REC:+REC=$F.rec.json} node "$PROBES/fast_walk_check.mjs" > "$F.log" 2>&1
  echo "== $NAME ($(( $(date +%s) - t0 )) s): $(tail -1 "$F.log")"
  { echo "=== $NAME  (scene $S IN=$I LPX=$PX)"; grep -h "start \|loop[0-9] ->\|part way\|frames\|EXCEPTION" "$F.log" | sed 's/^/    /'
    node "$PROBES/fast_walk_analyse.mjs" "$F.json" | tail -n +2; } >> "$ANA" 2>&1
  if [ -n "${DRIFT:-}" ] && [ -n "${REC:-}" ]; then
    t0=$(date +%s)
    REPLAY="$F.rec.json" URL="$U&tiltRollDegS=0" OUTJSON="$F.replay.json" node "$PROBES/fast_walk_check.mjs" > "$F.replay.log" 2>&1
    echo "   replay ($(( $(date +%s) - t0 )) s): $(tail -1 "$F.replay.log")"
    { echo "    --- G4: the no-drift replay"; node "$PROBES/fast_walk_drift.mjs" "$F.json" "$F.replay.json" | sed 's/^/    /'; } >> "$ANA" 2>&1
  fi
done
echo "analysis: $ANA"
