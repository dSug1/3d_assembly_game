// ⭐⭐⭐ (2026-11-13, the owner: *"When I double-tap on the iphone there appears a lense on the webpage by the iphone: can my script disable this iphone
// feature for my webpage automatically ? Other features … which need to be disabled on my webpage by my code"*) THE BROWSER'S GESTURES KEPT OFF THE
// GAME (`render/browser_guards.ts`, `BROWSER_GUARDS.md`). RED against `240990f`: no module, no guard in `main.ts`, no touch callout in `index.html`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CANVAS_CANCELLED, DOCUMENT_CANCELLED, installBrowserGuards } from "../src/render/browser_guards";

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
