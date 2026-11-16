#!/usr/bin/env bash
# The edge run (edge_noise.mjs) on a dev server: bash scripts/probes/edge_batch.sh "<scene>|<query>|<EDGE>|<AMM>|<OFFMM> ..."
#   e.g. "1|chartLayout=1&chartCalm=1|top|2.5|0"; RUN (default 240 frames), WIDTH; PARKTILT, PARKMM, TRACE, SIGN, PERIOD pass through to the probe.
#   The runbook: scripts/probes/ORBIT_GATES.md
set -u
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
server_start edge
for c in $1; do
  S=$(echo "$c" | cut -d'|' -f1); Q=$(echo "$c" | cut -d'|' -f2); E=$(echo "$c" | cut -d'|' -f3); W=$(echo "$c" | cut -d'|' -f4); O=$(echo "$c" | cut -d'|' -f5)
  URL="http://127.0.0.1:$PORT/?sceneIndex=$S&idleOrbitOn=0&$Q" EDGE="$E" AMM="$W" OFFMM="${O:-0}" RUN="${RUN:-240}" node "$PROBES/edge_noise.mjs" 2>&1 | grep -v "^  boot\|^  close in\|errors 0, recErr null" | cut -c1-${WIDTH:-330}
done
server_stop
