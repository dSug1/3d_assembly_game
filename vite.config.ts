// ⭐ `vitest/config`, not `vite` -- it is the superset that also types the
// `test` block. Importing the plain one type-errors on `test`, which is how
// this file is meant to tell you the two configs are not interchangeable.
import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const BUILD_ID = buildId();
const BUILT_AT = new Date().toISOString().replace("T", " ").slice(0, 16) + "Z";
const VERSION_JSON = JSON.stringify({ build: BUILD_ID, builtAt: BUILT_AT }) + "\n";

// ⭐ `base: "./"` so a build works from a file:// path and from a Capacitor
// webview, not only from a web-server root. The previous project's browser dry
// run existed to surface exactly this class of problem early.
export default defineConfig({
  base: "./",
  // ⭐ Compiled into the bundle, so the page can say what it IS. Declared for the
  // typechecker in `src/globals.d.ts`.
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILT_AT__: JSON.stringify(BUILT_AT),
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
    {
      // ⭐ (2026-11-14) THE PLAY RECORDER's sink, dev only: `src/render/play_recorder.ts` (the page with `#rec`) posts a batch a second; each appended as
      // one line to `.recordings/<session>.jsonl` (git-ignored). No build ever serves it.
      name: "play-recorder-sink",
      apply: "serve",
      configureServer(server) {
        // the destination: REC_DIR, else the first line of `.recordings-dir` (a local, git-ignored file — the owner's own folder), else `.recordings/`
        const local = existsSync(".recordings-dir") ? readFileSync(".recordings-dir", "utf8").split(/\r?\n/)[0]?.trim() : "";
        const dir = process.env["REC_DIR"] ?? (local !== undefined && local !== "" ? local : join(process.cwd(), ".recordings"));
        server.middlewares.use((req, res, next) => {
          if (req.method !== "POST" || req.url?.split("?")[0] !== "/__rec") return next();
          let body = "";
          req.setEncoding("utf8");
          req.on("data", (c: string) => (body += c));
          req.on("end", () => {
            try {
              const session = String((JSON.parse(body) as { session?: unknown }).session ?? "unknown").replace(/[^\w.-]/g, "_");
              mkdirSync(dir, { recursive: true });
              appendFileSync(join(dir, `${session}.jsonl`), body + "\n");
              res.statusCode = 204;
              res.end();
            } catch (e) {
              res.statusCode = 400;
              res.end(String(e));
            }
          });
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
    rollupOptions: {
      output: {
        // ⭐ (2026-11-04, the audit) Babylon in its OWN chunk: its hash stands across app edits, so a
        // deploy re-downloads only the app (~103 kB gz) on the iPhone, not the whole 376 kB gz.
        // ⚠ only what the page imports STATICALLY: Babylon's lazily imported shaders and texture loaders keep their own chunks (⛔ forced in here, the
        // first load grew from 376 to 449 kB gz)
        manualChunks(id: string, { getModuleInfo }) {
          if (!id.includes("node_modules/@babylonjs/")) return undefined;
          // reached from the entry by STATIC imports alone — a shader include imported only by a lazy shader stays with it
          const seen = new Map<string, boolean>();
          const staticallyReached = (m: string): boolean => {
            const known = seen.get(m);
            if (known !== undefined) return known;
            seen.set(m, false); // a cycle reaches nothing new
            const info = getModuleInfo(m);
            const yes = info !== null && (info.isEntry || info.importers.some(staticallyReached));
            seen.set(m, yes);
            return yes;
          };
          return staticallyReached(id) ? "babylon" : undefined;
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // ⭐ (2026-11-04, the audit) threads, not forks: 42 s of the run was worker start-up.
    pool: "threads",
  },
});
