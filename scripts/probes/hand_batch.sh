#!/usr/bin/env bash
# ⭐⭐⭐ (2026-11-18, package FO3 S0 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §13) THE OWNER'S HAND REPLAYED (hand_replay.mjs) on a dev server, Scene_0bis:
#   STRETCHES=<stretches.json> OUT=<folder> bash scripts/probes/hand_batch.sh <tag> "<name>|<fps>|<pre>" ...
#   <name> a stretch of STRETCHES (its session, T0, T1 — cut by the lead's kit: fo3/cut_stretches.mjs); <fps> 60 or 143; <pre> far | half | close.
#   Writes <OUT>/<tag>_<name>_<fps>_<pre>.json and .log. ⛔ OUT never the repository (the owner's play is private). The runbook: ORBIT_GATES.md §11.
set -u
TAG="$1"; shift
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
[ -z "${STRETCHES:-}" ] && { echo "STRETCHES=<stretches.json> needed"; exit 2; }
server_start "hand_$TAG"
for leg in "$@"; do
  IFS="|" read -r NAME FPS PRE <<< "$leg"
  SPEC=$(node -e "const s=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).find(x=>x.name===process.argv[2]); if(!s){process.exit(3)} console.log([s.file,s.t0,s.t1].join('|'))" "$STRETCHES" "$NAME") || { echo "no stretch $NAME"; continue; }
  IFS="|" read -r SRC T0 T1 <<< "$SPEC"
  F="$OUT/${TAG}_${NAME}_${FPS}_${PRE}"
  t0=$(date +%s)
  P=""; [ "$PRE" != "far" ] && P="$PRE"
  env URL="http://127.0.0.1:$PORT/?sceneIndex=4&idleOrbitOn=0${EXTRA:-}" SRC="$SRC" T0="$T0" T1="$T1" FPS="$FPS" PRE="$P" OUTJSON="$F.json" node "$PROBES/hand_replay.mjs" > "$F.log" 2>&1
  echo "== $NAME $FPS $PRE ($(( $(date +%s) - t0 )) s): $(grep -h "viewport" "$F.log" | head -1) | $(tail -1 "$F.log")"
done
