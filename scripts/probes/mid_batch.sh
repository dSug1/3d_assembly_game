#!/usr/bin/env bash
# The middle-crossing check (mid_check.mjs, or SCRIPT=across_check.mjs / SCRIPT=edge_noise.mjs) on a dev server:
#   bash scripts/probes/mid_batch.sh "<query>|<S0>|<A>[|IN] ..."      e.g. "chartLayout=0|0|0 chartLayout=1&chartCalm=1|0|0"
#   SCENE (default 4, Scene_0bis), SCRIPT, WIDTH; PX, PERIOD, RIM, FROM_SIDE, SHOW, BEFORE, AFTER, EVERY, FROM, GEOM pass through to the probe.
#   The runbook: scripts/probes/ORBIT_GATES.md
set -u
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
server_start mid
for c in $1; do
  Q=$(echo "$c" | cut -d'|' -f1); S=$(echo "$c" | cut -d'|' -f2); W=$(echo "$c" | cut -d'|' -f3); N=$(echo "$c" | cut -d'|' -f4)
  if [ -n "$N" ]; then export IN=1; else unset IN; fi
  URL="http://127.0.0.1:$PORT/?sceneIndex=${SCENE:-4}&idleOrbitOn=0&$Q" S0="$S" A="$W" node "$PROBES/${SCRIPT:-mid_check.mjs}" 2>&1 | cut -c1-${WIDTH:-420}
done
server_stop
