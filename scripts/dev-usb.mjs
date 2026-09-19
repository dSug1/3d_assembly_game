/**
 * ⭐⭐ **`npm run dev:usb` — THE DEV SERVER *AND* THE TABLET MIRROR, ONE COMMAND.**
 *
 * > *"create a window on my pc which mirrors the localhost:5173 tab which the tablet is
 * > displaying. this window shall be open when the server is running"* — the owner, 2026-09-19
 *
 * ⭐ The mirror is tied to the SERVER's lifetime, not started by hand, because that is what was
 * asked and because a mirror one has to remember to start is a mirror one forgets during the
 * pass it was built for.
 *
 * ⛔⛔ **THE MIRROR MAY NEVER TAKE THE SERVER DOWN.** It talks to a cable, a daemon and a tab,
 * all of which come and go; the server talks to none of them. ⚠ If the mirror dies, it is
 * reported and the dev loop carries on — `DEVICE_TESTING_USB.md`'s procedure must still work
 * with the tablet unplugged. ⭐ The reverse is not symmetric: killing the server kills the
 * mirror, since there is nothing left to mirror.
 *
 * ⚠ `npm run dev:usb:bare` is the same server with no mirror, for when the extra window is in
 * the way or the screencast is suspected of costing frames on the device.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// ⚠ Spawned through `process.execPath` and vite's own JS entry, NOT through the `vite.cmd`
// shim: a shell shim on Windows swallows the signal that should stop the child, and an
// orphaned Vite holding 5173 is exactly the trap that cost an hour on 2026-09-18.
const server = spawn(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1"], {
  cwd: root,
  stdio: "inherit",
});

const mirror = spawn(process.execPath, [resolve(here, "mirror.mjs")], {
  cwd: root,
  stdio: "inherit",
});

mirror.on("error", (err) => console.error(`[mirror] failed to start: ${err.message}`));
mirror.on("exit", (code) => {
  if (code) console.error(`[mirror] exited (${code}) — the dev server is unaffected`);
});

const stopMirror = () => {
  if (!mirror.killed) mirror.kill();
};
server.on("exit", (code) => {
  stopMirror();
  process.exit(code ?? 0);
});
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    stopMirror();
    server.kill();
  });
}
