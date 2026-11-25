#!/usr/bin/env bash
# ⭐ (2026-11-25, IN14) The piece zone's smoke probe (zone_probe.mjs) on its own dev server (127.0.0.1:5191), stopped at the end.
#   bash scripts/probes/zone_batch.sh [scene index, default 1]      ONLY=<scenario> EXTRA="&<tunable>=<value>"
#   The runbook: scripts/probes/ORBIT_GATES.md (one headless run at a time; no profile left in %TEMP%).
set -u
SCENE="${1:-1}"
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
server_start "zone"
URL="http://127.0.0.1:$PORT/?sceneIndex=$SCENE&bootAnimOn=0&idleOrbitOn=0${EXTRA:-}" node "$PROBES/zone_probe.mjs"
RC=$?
server_stop
exit $RC
