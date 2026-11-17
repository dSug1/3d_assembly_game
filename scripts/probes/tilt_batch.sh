#!/usr/bin/env bash
# The tilt check (tilt_check.mjs) on a dev server: bash scripts/probes/tilt_batch.sh "<scene> ..."   e.g. "1 0 4"
#   MODE, GZ, OUTPX, DX, FACE, NY, PX, RIM, SHOW, SWITCH pass through to the probe; DUMP=<prefix>: every frame to <prefix>_s<scene>.json (turn_rec.mjs); EXTRA="&<tunable>=<value>" is appended to every URL.
#   ⛔ (2026-11-16, step 2.5) the "<scene>:<chartLayout>" form is gone with the switch: a run named that way is refused, never run as the default.
#   The runbook: scripts/probes/ORBIT_GATES.md
set -u
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
server_start tilt
for S in $1; do
  case "$S" in *:*) echo "\"$S\": the switch chartLayout was deleted at step 2.5 (2026-11-16) — give the scene alone (e.g. \"1\")"; continue ;; esac
  DUMP="${DUMP:+${DUMP}_s$S.json}" URL="http://127.0.0.1:$PORT/?sceneIndex=$S&idleOrbitOn=0${EXTRA:-}" node "$PROBES/tilt_check.mjs" 2>&1 | cut -c1-${WIDTH:-330}
done
server_stop
