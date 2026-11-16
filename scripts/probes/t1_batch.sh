#!/usr/bin/env bash
# ⛔ THROWAWAY (package T1): t1_walk.mjs on a dev server — bash scripts/probes/t1_batch.sh "<sceneIndex> ..."; PHASE, PX pass through; EXTRA appended to the URL
set -u
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
server_start t1
for S in $1; do
  URL="http://127.0.0.1:$PORT/?sceneIndex=$S&idleOrbitOn=0${EXTRA:-}" node "$PROBES/t1_walk.mjs" 2>&1 | cut -c1-${WIDTH:-400}
done
server_stop
