#!/usr/bin/env bash
# The tilt check (tilt_check.mjs) on a dev server: bash scripts/probes/tilt_batch.sh "<scene>:<chartLayout> ..."   e.g. "1:1 0:1 4:1"
#   MODE, GZ, OUTPX, DX, FACE, NY, PX, RIM, SHOW, SWITCH pass through to the probe; EXTRA="&chartCalm=1" is appended to every URL.
#   The runbook: scripts/probes/ORBIT_GATES.md
set -u
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
server_start tilt
for c in $1; do
  S="${c%%:*}"; C="${c##*:}"
  URL="http://127.0.0.1:$PORT/?sceneIndex=$S&idleOrbitOn=0&chartLayout=$C${EXTRA:-}" node "$PROBES/tilt_check.mjs" 2>&1 | cut -c1-${WIDTH:-330}
done
server_stop
