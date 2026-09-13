// ⭐ `vitest/config`, not `vite` -- it is the superset that also types the
// `test` block. Importing the plain one type-errors on `test`, which is how
// this file is meant to tell you the two configs are not interchangeable.
import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// ⭐ `base: "./"` so a build works from a file:// path and from a Capacitor
// webview, not only from a web-server root. The previous project's browser dry
// run existed to surface exactly this class of problem early.
export default defineConfig({
  base: "./",
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
});
