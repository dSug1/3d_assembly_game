#!/usr/bin/env bash
# ⭐⭐⭐ (2026-11-18, `Claude/40_RENDER_SCENE/spec/UPRIGHT_PICTURE.md` §2 step 6, §3 — law U) THE UPRIGHT PICTURE'S GATES, one phase after another (one
# headless run at a time; each batch starts and stops its own dev server):
#   STRETCHES=<stretches.json> OUT=<folder> bash scripts/probes/upright_batch.sh <tag> <phase> ...       EXTRA="&<tunable>=<value>" on every URL
#   hand   — the owner's ten stretches far out at 60 frames a second (hand_batch.sh)          close — the three close-in stretches (U-G7)
#   reps   — the three seeded replays (replay_batch.sh)                                       over  — Scene_1 over its top at 1 200 px a second
#   le     — the level entry's walks a (Scene_0's bottom close in) and the straight dy walks (level_entry_batch.sh)
#   loops  — the corner loops at 571 and 1 200 px a second (9.52, 20 px a frame)             more  — Scene_0 up, the edge and ridge walks
#   hold   — the dy hold's walks (hold_walk_batch.sh base)                                   half  — three stretches at 0.736     fps143 — two at 143
# Read with gravity_read.mjs (gravity's tilt and roll a metre, the frames held), the kit's gates_s1.mjs / shadow_read.mjs (A6 on the picture drawn),
# replay_cmp.mjs (U-G1's identities). ⛔ OUT never the repository (the owner's play is private). The runbook: ORBIT_GATES.md §13.
set -u
TAG="$1"; shift
P="$(dirname "${BASH_SOURCE[0]}")"
log() { echo "[$(date +%H:%M:%S)] $TAG $*" >> "$OUT/progress.txt"; }
for ph in "$@"; do
  case "$ph" in
    hand) bash "$P/hand_batch.sh" "$TAG" "vyah_11s|60|far" "vyah_42s|60|far" "ogse_3s|60|far" "ilmj_4s|60|far" "ilmj_23s|60|far" "ilmj_39s|60|far" "ilmj_60s|60|far" "ilmj_83s|60|far" "ilmj_99s|60|far" "ilmj_114s|60|far" ;;
    close) bash "$P/hand_batch.sh" "$TAG" "ilmj_23s|60|close" "ilmj_99s|60|close" "vyah_11s|60|close" ;;
    half) bash "$P/hand_batch.sh" "$TAG" "ilmj_23s|60|half" "ilmj_99s|60|half" "vyah_11s|60|half" ;;
    fps143) bash "$P/hand_batch.sh" "$TAG" "ilmj_23s|143|far" "ogse_3s|143|far" ;;
    reps) bash "$P/replay_batch.sh" "$TAG" ;;
    over) bash "$P/fast_walk_batch.sh" "${TAG}fw" f_s1_over_px20 ;;
    loops) LOOP_PX="9.52 20" bash "$P/fast_walk_batch.sh" "${TAG}fw" f_ccw_p_far_px9.52 f_ccw_p_far_px20 f_cw_m_far_px9.52 f_cw_m_far_px20 ;;
    more) bash "$P/fast_walk_batch.sh" "${TAG}fw" f_s0_up_px20 edge f_ridge_px20 ;;
    le) bash "$P/level_entry_batch.sh" "${TAG}le" a b_dy_x190 b_dy_xm190 b_dy_px4_x190 b_dy_px4_xm190 b_dy_px6_x190 b_dy_px6_xm190 ;;
    hold) bash "$P/hold_walk_batch.sh" "${TAG}hw" base ;;
    *) echo "unknown phase $ph"; exit 2 ;;
  esac >> "$OUT/batch_$TAG.log" 2>&1
  log "$ph done"
done
