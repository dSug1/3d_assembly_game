#!/usr/bin/env bash
# Sourced by the orbit gates' batch scripts (tilt_batch.sh, mid_batch.sh, edge_batch.sh, replay_batch.sh) — the runbook: scripts/probes/ORBIT_GATES.md.
#   PROBES — this folder (the probes run from here, whatever the code served)
#   REPO   — the folder whose code the dev server serves (default: this repository; set it to replay another checkout)
#   OUT    — where the batch writes (the dev server's log, the replays' recordings); default <the OS temp folder>/orbit_gates_out. Never the repo.
#   PORT   — 5191 (one dev server at a time: a batch refuses to start if the port already answers)
# Git Bash on Windows: `pwd -W` gives C:/… paths that node and git both read.
winpwd() { (cd "$1" && (pwd -W 2>/dev/null || pwd)); }
PROBES="$(winpwd "$(dirname "${BASH_SOURCE[0]}")")"
REPO="${REPO:-$(winpwd "$PROBES/../..")}"
if [ -z "${OUT:-}" ]; then OUT="$(node -p "require('os').tmpdir()" | tr '\\' '/')/orbit_gates_out"; fi
mkdir -p "$OUT"
PORT=5191
SERVER_LOG=""
SERVER=""

# server_start <name>: a Vite dev server on 127.0.0.1:$PORT from $REPO, waited for (60 s at most)
server_start() {
  SERVER_LOG="$OUT/vite_$1.log"
  if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/"; then echo "port $PORT already serves something: stop"; exit 8; fi
  (cd "$REPO" && exec npx vite --host 127.0.0.1 --port "$PORT" --strictPort) > "$SERVER_LOG" 2>&1 &
  SERVER=$!
  local ok=0
  for i in $(seq 1 60); do sleep 1; if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/"; then ok=1; break; fi; done
  if [ "$ok" != 1 ]; then echo "the dev server did not start"; tail -5 "$SERVER_LOG"; server_stop; exit 7; fi
  echo "dev server up from $REPO ($(git -C "$REPO" log --oneline -1 | cut -c1-60))"
  # (2026-11-16) the server stopped on ANY exit of the batch (its end, an error, Ctrl-C, a kill it can trap) — and by a detached guard
  # (probe_guard.mjs) when the batch shell is gone without running its trap: a server must never outlive its batch
  trap server_stop EXIT
  trap "exit 130" INT TERM HUP
  node "$PROBES/probe_guard.mjs" server "$(cat /proc/$$/winpid 2>/dev/null || echo $$)" "$PORT" "$(cat /proc/$SERVER/winpid 2>/dev/null || echo 0)"
}

# server_stop: the server and everything it started (npx's node child: by the port it listens on), then its log removed
server_stop() {
  [ -z "${SERVER:-}" ] && return 0 # (2026-11-16) once only (the EXIT trap after an explicit call)
  if command -v taskkill >/dev/null 2>&1; then
    local WPID; WPID=$(cat /proc/$SERVER/winpid 2>/dev/null || echo "")
    [ -n "$WPID" ] && taskkill //PID "$WPID" //T //F > /dev/null 2>&1
  fi
  kill "$SERVER" 2>/dev/null
  sleep 1
  local PIDS; PIDS=$(netstat -ano 2>/dev/null | grep "127.0.0.1:$PORT " | grep LISTENING | awk '{print $NF}' | sort -u)
  for p in $PIDS; do taskkill //PID "$p" //T //F > /dev/null 2>&1; done
  sleep 1
  if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/"; then echo "⚠ the dev server is STILL up"; else echo "dev server stopped"; fi
  [ -n "$SERVER_LOG" ] && rm -f "$SERVER_LOG"
  SERVER=""
}
