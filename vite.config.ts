// ⭐ `vitest/config`, not `vite` -- it is the superset that also types the
// `test` block. Importing the plain one type-errors on `test`, which is how
// this file is meant to tell you the two configs are not interchangeable.
import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";

/**
 * ⭐⭐ THE BUILD ID, STAMPED INTO THE BUNDLE AND SERVED BESIDE IT.
 *
 * ⛔ Why it exists: a device report is only evidence about the code the device was
 * running, and on 2026-09-16 a stale Pages bundle indicted a correct gesture fix for a
 * morning. `src/core/build_gate.ts` carries the full account.
 *
 * ⚠ `+dirty` is not cosmetic — it is what distinguishes the USB dev loop from the same
 * sha deployed, which is exactly the comparison that went wrong.
 */
function buildId(): string {
  // ⭐⭐ CI IS ASKED FIRST, AND NOT AS AN OPTIMISATION. `actions/checkout` makes a shallow
  // clone owned by a different uid than the one running node, which is precisely the
  // arrangement git refuses with *"dubious ownership"* — so the `git` path below can fail
  // on the ONE build that matters, and its fallback is `"unknown"`, which switches the
  // staleness gate off silently. ⛔ A guard that degrades to nothing where it is needed is
  // the `METHOD` shape this whole mechanism was built for; `GITHUB_SHA` is always set in
  // Actions and cannot fail. ⚠ A CI checkout is clean by construction, so no dirty flag.
  const ci = process.env["GITHUB_SHA"];
  if (ci !== undefined && ci.trim() !== "") return ci.trim().slice(0, 7);

  try {
    const sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const dirty = execSync("git status --porcelain", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return sha === "" ? "unknown" : sha + (dirty === "" ? "" : "+dirty");
  } catch {
    // ⛔ NEVER FAIL THE BUILD FOR THIS. A tarball with no `.git`, or a machine with no
    // git on PATH, must still produce a shippable bundle — `build_gate` treats "unknown"
    // as *no information* and simply never refreshes.
    return "unknown";
  }
}

const BUILT_AT = new Date().toISOString().replace("T", " ").slice(0, 16) + "Z";

/**
 * ⛔⛔ **ASKED THROUGH VITE'S OWN `command`, NEVER SNIFFED FROM `process.argv`.** A wrong
 * answer here has asymmetric costs: calling a dev server a build only misleads the HUD, while
 * calling a BUILD a dev server would stamp `dev-server` into the Pages bundle, where
 * `build_gate` would then compare it against itself and **never refresh** — reinstating the
 * exact stale-bundle failure the gate was written for. ⭐ So it uses the supported API, and a
 * vector pins the production side of it.
 */
export function stampFor(command: "build" | "serve"): { build: string; builtAt: string } {
  return { build: command === "build" ? buildId() : "dev-server", builtAt: BUILT_AT };
}

// ⭐ `base: "./"` so a build works from a file:// path and from a Capacitor
// webview, not only from a web-server root. The previous project's browser dry
// run existed to surface exactly this class of problem early.
export default defineConfig(({ command }) => {
  const stamp = stampFor(command);
  const VERSION_JSON = JSON.stringify(stamp) + "\n";
  const BUILD_ID = stamp.build;
  return {
  base: "./",
  // ⭐ Compiled into the bundle, so the page can say what it IS. Declared for the
  // typechecker in `src/globals.d.ts`.
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILT_AT__: JSON.stringify(stamp.builtAt),
  },
  plugins: [
    {
      name: "build-id-version-json",
      // ⛔ THE ORIGIN'S ANSWER TO *"what is current?"*, and it must exist in BOTH modes.
      // In a production build it is emitted as an asset; in dev it is served by the
      // middleware below, so the staleness gate is exercised on the USB loop instead of
      // first running for real in production. ⚠ `METHOD`: a fixture must be a specimen
      // the product would accept — an untested boot path is the same trap.
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "version.json", source: VERSION_JSON });
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split("?")[0]?.endsWith("/version.json") !== true) return next();
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(VERSION_JSON);
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@input": fileURLToPath(new URL("./src/input", import.meta.url)),
      "@render": fileURLToPath(new URL("./src/render", import.meta.url)),
    },
  },
  server: {
    // ⚠ Touch gestures cannot be tested on a desktop mouse. `--host` lets a phone
    // on the same LAN load the dev server, which is the only honest test surface
    // for this input system.
    host: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  };
});
