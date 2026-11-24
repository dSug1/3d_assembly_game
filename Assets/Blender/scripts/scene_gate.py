"""THE SCENE'S EXPORT GATE, called from a Blender build script after its export (SCENE_WORKFLOW.md 11.2 item 2, 2026-11-23).

A build script (build_<scene>.py) calls it right after it writes the .glb and STOPS on anything but 0:

    import scene_gate                      # this folder is the build script's own (Assets/Blender/scripts)
    code = scene_gate.run_gate(glb_path)   # the game's checks on the exported file (scripts/surface/check_scene.ts)
    if code != 0:
        sys.exit(code)                     # 1: a check FAILED - fix the scene, never the game; 2: NOT READ

The checks themselves stay the game's (TypeScript, with the game's readers and constants): this file only runs them and returns
their one verdict - 0 PASS, 1 FAIL, 2 NOT READ (no Node, no file, a crash). The rules' numbers, for a generator: rules_constants.json
beside this file (written by scripts/surface/export_rules_constants.ts - never retyped).

Plain Python 3 (Blender's own or any): run it alone as  python scene_gate.py <scene.glb> [<plan.json>]  - its exit code is the gate's.
"""
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
GATE = os.path.join("scripts", "surface", "check_scene.ts")


def run_gate(glb, plan=None, repo=REPO):
    """The gate's verdict on `glb` (a path; relative to the current folder or absolute): 0 PASS, 1 FAIL, 2 NOT READ."""
    glb = os.path.abspath(glb)
    if not os.path.isfile(glb):
        print("THE SCENE'S EXPORT GATE: NOT READ - no .glb at " + glb)
        return 2
    if shutil.which("npx") is None:
        print("THE SCENE'S EXPORT GATE: NOT READ - Node's npx is not on the PATH (install Node; the checks are the game's TypeScript)")
        return 2
    cmd = ["npx", "vite-node", GATE, "--", glb] + ([os.path.abspath(plan)] if plan else [])
    try:
        r = subprocess.run(cmd, cwd=repo, shell=(os.name == "nt"))
    except OSError as e:
        print("THE SCENE'S EXPORT GATE: NOT READ - " + str(e))
        return 2
    return r.returncode if r.returncode in (0, 1) else 2


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python scene_gate.py <scene.glb> [<plan.json>]")
        sys.exit(2)
    sys.exit(run_gate(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None))
