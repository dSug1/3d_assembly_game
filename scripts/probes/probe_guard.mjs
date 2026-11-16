// THE PROBES' GUARD (2026-11-16, step 2.5 — `Claude/00_CORE/queue_notes/RND5.md`): a SEPARATE node process that ends a headless probe, its Chrome
// and its profile — or a batch's dev server — whatever the probe's own event loop is doing. The runbook: scripts/probes/ORBIT_GATES.md §0.
//
// WHY (an interrupted run, 2026-11-16: `edge_batch.sh`, `node edge_noise.mjs`, headless Chrome and the Vite server on 5191 still alive long past the
// probe's 8-minute watchdog). The probe's watchdog was a `setTimeout` INSIDE the probe: it runs only while the probe's event loop turns. The batch
// script that started the probe was killed; the probe's stdout is a pipe (`| grep | cut`) whose reader went with it — and a write to a pipe is
// SYNCHRONOUS in node on Windows: the probe's next `console.log` into a pipe nobody drains blocks the event loop for ever, and a blocked loop never
// fires its timer. The dev server was started in the background by the batch script and stopped only at the script's last line — never reached.
// A deadline that lives in the process it guards is no deadline: this one lives in its own process, polls by pid, and needs nothing from the probe.
//
//   from a probe:          import { guardProbe } from "./probe_guard.mjs";  guardProbe({ chromePid: chrome.pid, prof, ms: 8 * 60_000 });
//                          → at the deadline, or as soon as the probe's parent (the batch's shell) is gone: Chrome's tree killed, the probe killed, the
//                            profile removed; the probe gone by itself: its profile removed if left, the guard ends.
//   from a batch script:   node probe_guard.mjs server <the batch shell's Windows pid> <port> [<the server's Windows pid>]
//                          → returns at once; a detached guard stops whatever listens on 127.0.0.1:<port> (and the server's tree) as soon as the batch
//                            shell is gone, or after 90 minutes; it ends by itself once the batch has stopped its server.
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const POLL_MS = 1000;
const SERVER_CAP_MS = 90 * 60_000;

/**
 * Start the guard of this probe. Through a launcher that returns at once: the guard's parent is gone before the probe runs, so a kill of the probe's TREE
 * (`taskkill /T`, a tool ending its command) never reaches the guard — it then sees the probe gone and cleans what is left.
 */
export function guardProbe({ chromePid, prof, ms }) {
  const deadline = Date.now() + ms;
  const g = spawn(process.execPath, [SELF, "probe-launch", String(process.pid), String(process.ppid), String(chromePid ?? 0), prof, String(deadline)], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  g.unref();
}

function launch(mode, args) {
  const g = spawn(process.execPath, [SELF, mode, ...args], { detached: true, stdio: "ignore", windowsHide: true });
  g.unref();
}

function alive(pid) {
  if (!(pid > 0)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}

function killTree(pid, tree = true) {
  if (!(pid > 0) || !alive(pid)) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(pid), ...(tree ? ["/T"] : []), "/F"], { stdio: "ignore", windowsHide: true });
  else {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}

function removeProfile(prof) {
  for (let i = 0; i < 10; i++) {
    try {
      rmSync(prof, { recursive: true, force: true });
      return;
    } catch {
      spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"], { windowsHide: true });
    }
  }
}

function listeners(port) {
  try {
    const out = execFileSync("netstat", ["-ano"], { encoding: "utf8", windowsHide: true });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) if (line.includes(`127.0.0.1:${port} `) && line.includes("LISTENING")) pids.add(+line.trim().split(/\s+/).pop());
    return [...pids].filter((p) => p > 0);
  } catch {
    return [];
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probeGuard([probe, parent, chrome, prof, deadline]) {
  for (;;) {
    if (!alive(+probe)) {
      // the probe ended (its own finally normally killed Chrome and removed the profile): whatever it left
      killTree(+chrome);
      removeProfile(prof);
      return;
    }
    if (Date.now() > +deadline || !alive(+parent)) {
      // Chrome first (a tree kill of the probe would reach this guard too: it is the probe's child), then the probe alone
      killTree(+chrome);
      killTree(+probe, false);
      await sleep(POLL_MS);
      removeProfile(prof);
      return;
    }
    await sleep(POLL_MS);
  }
}

async function serverGuard([batch, port, server]) {
  const end = Date.now() + SERVER_CAP_MS;
  let seen = false;
  for (;;) {
    const up = listeners(+port);
    if (up.length > 0) seen = true;
    else if (seen && !alive(+server)) return; // the batch stopped its server: nothing to guard
    if (Date.now() > end || !alive(+batch)) {
      killTree(+server);
      for (const p of listeners(+port)) killTree(p);
      return;
    }
    await sleep(POLL_MS);
  }
}

const same = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase();
if (process.argv[1] !== undefined && same(process.argv[1], SELF)) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "probe") await probeGuard(args);
  else if (mode === "probe-launch") launch("probe", args);
  else if (mode === "server-run") await serverGuard(args);
  else if (mode === "server") {
    // detach the server's guard from the calling shell (a kill of the batch's tree must not reach it), then return at once
    const [batch, port, server] = args;
    launch("server-run", [batch, port, server ?? "0"]);
  } else {
    console.error("usage: node probe_guard.mjs server <batch pid> <port> [<server pid>]");
    process.exit(2);
  }
}
