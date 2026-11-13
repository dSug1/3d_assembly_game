// ⭐⭐⭐ (2026-11-13, the owner: *"When I double-tap on the iphone there appears a lense on the webpage by the iphone: can my script disable this iphone
// feature for my webpage automatically ? Other features … which need to be disabled on my webpage by my code"*) THE BROWSER'S GESTURES KEPT OFF THE
// GAME (`render/browser_guards.ts`, `BROWSER_GUARDS.md`). RED against `240990f`: no module, no guard in `main.ts`, no touch callout in `index.html`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CANVAS_CANCELLED, DOCUMENT_CANCELLED, installBrowserGuards, LAUNCH_MESSAGES, LAUNCH_TITLE, launchPlatform } from "../src/render/browser_guards";

const tick = () => new Promise((r) => setTimeout(r, 0));

/** an EventTarget that records the options its listeners were added with */
class Spy extends EventTarget {
  readonly opts = new Map<string, unknown>();
  visibilityState = "visible";
  override addEventListener(t: string, l: EventListenerOrEventListenerObject | null, o?: boolean | AddEventListenerOptions): void {
    this.opts.set(t, o);
    super.addEventListener(t, l, o);
  }
}

function fakeWake() {
  const s = { asked: 0, released: 0 };
  return {
    s,
    lock: {
      request: async (_t: "screen") => {
        s.asked++;
        return { release: async () => void s.released++ };
      },
    },
  };
}

describe("⭐⭐⭐ the browser's gestures kept off the game (2026-11-13)", () => {
  it("the canvas's touches, double click, selection and context menu cancelled — by NON-passive listeners (a passive one cannot cancel)", () => {
    const canvas = new Spy();
    const doc = new Spy();
    installBrowserGuards(canvas, doc, undefined);
    for (const t of CANVAS_CANCELLED) {
      const e = new Event(t, { cancelable: true });
      canvas.dispatchEvent(e);
      expect(e.defaultPrevented, t).toBe(true);
      expect(canvas.opts.get(t), t).toEqual({ passive: false });
    }
    expect(CANVAS_CANCELLED).toEqual(["touchstart", "touchmove", "touchend", "dblclick", "selectstart", "contextmenu"]);
  });

  it("iOS Safari's pinch-zoom (it ignores `user-scalable=no`): its gesture events cancelled on the document", () => {
    const canvas = new Spy();
    const doc = new Spy();
    installBrowserGuards(canvas, doc, undefined);
    for (const t of DOCUMENT_CANCELLED) {
      const e = new Event(t, { cancelable: true });
      doc.dispatchEvent(e);
      expect(e.defaultPrevented, t).toBe(true);
    }
  });

  it("⛔ the POINTER events — the game's own input — never cancelled; nothing outside the canvas cancelled but the gesture events", () => {
    const canvas = new Spy();
    const doc = new Spy();
    installBrowserGuards(canvas, doc, undefined);
    for (const t of ["pointerdown", "pointermove", "pointerup", "click"]) {
      const e = new Event(t, { cancelable: true });
      canvas.dispatchEvent(e);
      expect(e.defaultPrevented, t).toBe(false);
    }
    const tap = new Event("touchstart", { cancelable: true });
    doc.dispatchEvent(tap); // a button of the HUD or the menus: its click kept
    expect(tap.defaultPrevented).toBe(false);
  });

  it("the screen kept awake: asked at once, again after the page comes back into view, never twice at a time; released at the removal", async () => {
    const canvas = new Spy();
    const doc = new Spy();
    const w = fakeWake();
    const off = installBrowserGuards(canvas, doc, w.lock);
    await tick();
    expect(w.s.asked).toBe(1);
    canvas.dispatchEvent(new Event("pointerdown")); // held already: not asked again
    await tick();
    expect(w.s.asked).toBe(1);
    doc.visibilityState = "hidden";
    doc.dispatchEvent(new Event("visibilitychange")); // the browser released it
    doc.visibilityState = "visible";
    doc.dispatchEvent(new Event("visibilitychange"));
    await tick();
    expect(w.s.asked).toBe(2);
    off();
    await tick();
    expect(w.s.released).toBe(1);
    const e = new Event("touchstart", { cancelable: true });
    canvas.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false); // removed
  });

  it("a refused or missing wake lock is silent (an unsupported browser, low battery)", async () => {
    const canvas = new Spy();
    const doc = new Spy();
    expect(() => installBrowserGuards(canvas, doc, undefined)).not.toThrow();
    installBrowserGuards(canvas, doc, { request: () => Promise.reject(new Error("NotAllowedError")) });
    await tick();
  });

  it("⭐⭐ the launch messages: the device's section by its user agent (an iPad asking as a Mac by its touch points); the texts are BROWSER_GUARDS.md §3's, word for word", () => {
    expect(launchPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15")).toBe("ios");
    expect(launchPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", 5)).toBe("ios"); // an iPad
    expect(launchPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", 0)).toBe("macos");
    expect(launchPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36")).toBe("android");
    expect(launchPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36")).toBe("windows");
    expect(launchPlatform("Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0")).toBeNull();
    const md = readFileSync(new URL("../Claude/10_INPUT_TOUCH/spec/BROWSER_GUARDS.md", import.meta.url), "utf8");
    const s3 = md.slice(md.indexOf("## 3."), md.indexOf("## 4.")).replace(/\n>\s+/g, " ").replace(/\*/g, "");
    expect(s3).toContain(LAUNCH_TITLE);
    for (const p of ["ios", "android", "windows", "macos"] as const) {
      expect(LAUNCH_MESSAGES[p].length, p).toBeGreaterThan(0);
      for (const m of LAUNCH_MESSAGES[p]) expect(s3, m).toContain(m);
    }
    // ⛔ the sheet that shows them is owed, in the build queue
    expect(readFileSync(new URL("../Claude/00_CORE/QUEUE.md", import.meta.url), "utf8")).toContain("THE LAUNCH MESSAGES SHEET");
  });

  it("wired: installed in `main.ts` as soon as the canvas exists (the shell and every level); `index.html` with no touch callout on the page and the canvas", () => {
    const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(main.indexOf("installBrowserGuards(canvas);")).toBeGreaterThan(main.indexOf('if (!canvas) throw new Error("no #app canvas in the document");'));
    expect(main.indexOf("installBrowserGuards(canvas);")).toBeLessThan(main.indexOf("installGameShell("));
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html.match(/-webkit-touch-callout: none;/g)?.length).toBe(2);
    expect(html).toContain("touch-action: none;");
    expect(html).toContain("overscroll-behavior: none;");
    expect(html).toContain("user-scalable=no");
  });
});
