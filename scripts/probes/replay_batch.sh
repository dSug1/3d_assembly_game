#!/usr/bin/env bash
# One batch of deterministic headless replays (replay_probe.mjs, its seeded script: SEED 1, LEGS 40): a dev server from $REPO (default this
# repository), the three scenes recorded as <OUT>/<prefix>_s1.json, _s0.json, _s0bis.json; the server stopped at the end.
#   bash scripts/probes/replay_batch.sh <prefix> [twice]        EXTRA="&<tunable>=<value>" is appended to every URL (⛔ the "off" replays: step 2.5)
#   DUMP=<prefix>: every frame of each run also to <prefix>_<recording>.json (turn_rec.mjs: the timed turns for turn_table.mjs).
#   "twice" also records Scene_1 a second time (<prefix>_s1_again): a replay is deterministic, the two must be identical.
#   The runbook: scripts/probes/ORBIT_GATES.md
set -u
PREFIX="$1"; TWICE="${2:-}"
source "$(dirname "${BASH_SOURCE[0]}")/orbit_gates_lib.sh"
server_start "replay_$PREFIX"
run() { # $1 recording name, $2 scene index
  local t0=$(date +%s)
  DUMP="${DUMP:+${DUMP}_$1.json}" PROBE_DIR="$OUT" OUT="$1" URL="http://127.0.0.1:$PORT/?sceneIndex=$2&idleOrbitOn=0${EXTRA:-}" node "$PROBES/replay_probe.mjs" 2>&1 | tail -3 | cut -c1-200
  echo "   ($(( $(date +%s) - t0 )) s, $(du -h "$OUT/$1.json" 2>/dev/null | cut -f1))"
}
run "${PREFIX}_s1" 1
run "${PREFIX}_s0" 0
run "${PREFIX}_s0bis" 4
if [ "$TWICE" = "twice" ]; then run "${PREFIX}_s1_again" 1; fi
server_stop
