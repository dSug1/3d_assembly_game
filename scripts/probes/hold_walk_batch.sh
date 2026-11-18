#!/usr/bin/env bash
# ⭐⭐⭐ (2026-11-18, package DH) THE DY HOLD'S LONG WALKS (hold_walk_check.mjs + hold_walk_analyse.mjs) on a dev server — `DY_HOLD_REVERSAL.md` §3:
#   bash scripts/probes/hold_walk_batch.sh <tag> all|base|<walk name> ...     EXTRA="&<tunable>=<value>" is appended to every URL
#   Writes <OUT>/<tag>_<walk>.json and .log, then <OUT>/<tag>_analysis.txt (per sub-walk: the crossing, the band's finger and surface, the BLOCKED
#   frames, the travel before a dy back is honoured). The runbook: scripts/probes/ORBIT_GATES.md §10
set -u
TAG="$1"; shift
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
# name|scene|IN|env (;-separated)
W=""
for D in far:far: d736:half:HALFN=7 d515:half:HALFN=20 close:close:; do
  DN=${D%%:*}; R=${D#*:}; I=${R%%:*}; H=${R#*:}
  W="$W z_$DN|4|$I|SITE=zenith${H:+;$H}| b_$DN|4|$I|SITE=bottom${H:+;$H}|"
  W="$W zL_$DN|4|$I|SITE=zenith;LIFT=1;NS=6,30${H:+;$H}| bL_$DN|4|$I|SITE=bottom;LIFT=1;NS=6,30${H:+;$H}|"
done
W="$W zT_far|4|far|SITE=zenith;TRI=1;NS=0,0| bT_far|4|far|SITE=bottom;TRI=1;NS=0,0| zT_close|4|close|SITE=zenith;TRI=1;NS=0,0| bT_close|4|close|SITE=bottom;TRI=1;NS=0,0|"
W="$W z_far_px8|4|far|SITE=zenith;PX=8| b_far_px8|4|far|SITE=bottom;PX=8| z_close_px8|4|close|SITE=zenith;PX=8|"
W="$W zC_far|4|far|SITE=zenith;COAST=1;PX=8;NS=0,0| zW_far|4|far|SITE=zenith;WOBBLE=1;NS=0,0| zW_close|4|close|SITE=zenith;WOBBLE=1;NS=0,0| bW_far|4|far|SITE=bottom;WOBBLE=1;NS=0,0|"
W="$W s0_ridge_close|0|close|SITE=zenith;NS=3,12,30,45| s0_bottom_close|0|close|SITE=bottom;NS=3,12,30,45|"
W="$W s1_top_close|1|close|SITE=135;AY=auto;X=0;START=20;NS=3,12,30,45;KEEPDIR=1|"
BASE="z_far b_far z_close b_close zT_far zC_far"
SEL=""
for a in "$@"; do
  case "$a" in all) for w in $W; do SEL="$SEL $w"; done ;; base) for b in $BASE; do for w in $W; do [ "${w%%|*}" = "$b" ] && SEL="$SEL $w"; done; done ;;
    *) for w in $W; do [ "${w%%|*}" = "$a" ] && SEL="$SEL $w"; done ;; esac
done
[ -z "$SEL" ] && { echo "nothing to run (give all, base or walk names)"; exit 2; }
server_start "hw_$TAG"
ANA="$OUT/${TAG}_analysis.txt"
: > "$ANA"
for w in $SEL; do
  IFS="|" read -r NAME S I EXT <<< "$w"
  F="$OUT/${TAG}_${NAME}"
  t0=$(date +%s)
  EXT2="$EXT"
  env ${EXT2//;/ } URL="http://127.0.0.1:$PORT/?sceneIndex=$S&idleOrbitOn=0${EXTRA:-}" IN=$I OUTJSON="$F.json" node "$PROBES/hold_walk_check.mjs" > "$F.log" 2>&1
  echo "== $NAME ($(( $(date +%s) - t0 )) s): $(tail -1 "$F.log")"
  { echo "=== $NAME  (scene $S, IN=$I, $EXT2)"; grep -h "approach\|^  s[0-9]\|EXCEPTION\|WATCHDOG\|Error" "$F.log" | grep -v boot | sed 's/^/    /'
    node "$PROBES/hold_walk_analyse.mjs" "$F.json"; } >> "$ANA" 2>&1
done
echo "analysis: $ANA"
