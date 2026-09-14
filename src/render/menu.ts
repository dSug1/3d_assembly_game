/**
 * A COLLAPSIBLE TUNING MENU, for adjusting placeholders by hand on the glass.
 *
 * ⭐⭐ EVERY THRESHOLD IN `gestureConfig.ts` IS A PLACEHOLDER AWAITING `IN5`, AND `IN5`
 * IS A DEVICE PROCEDURE. The URL overrides (`?orbitTopRadiusM=0.15`) made a single
 * A/B possible without a rebuild; this makes a SWEEP possible without even a reload,
 * which is what finding a shape by feel actually needs.
 *
 * ⛔⛔ A CHANGE IS VALIDATED BEFORE IT IS APPLIED, AND A REFUSAL IS SHOWN.
 * `validateGestureConfig` normally runs once, in `MotionTracker`'s constructor. A
 * slider that wrote straight into the config would bypass it entirely — and several
 * of these numbers are only meaningful in combination: orbit ring heights that stop
 * climbing fold the surface back through itself, and a camera radius inside the near
 * plane renders a black page with no error at all. ⭐ So each change is tried on a
 * COPY first, and rejected changes are reported on screen rather than silently
 * dropped, which is the same reason the URL parser reports its refusals.
 *
 * ⛔ ONE CONFIG OBJECT STILL. The menu mutates the single `GestureConfig` everything
 * already holds — it does not keep a second copy. Carried rule `L1`: a tuning value
 * that existed in both a debug tool and production silently drifted apart.
 *
 * ⚠ SECTIONS COLLAPSE, AND THE STATE SURVIVES A RELOAD. A tuning session is dozens of
 * reloads, and re-collapsing four sections each time is friction that ends with the
 * menu left open over the scene. ⛔ `localStorage` is wrapped in try/catch at every
 * access: it throws outright in a private window and returns nothing after site data
 * is cleared, and a tuning menu that cannot open because storage was unavailable
 * would be a far worse failure than one that forgets.
 *
 * ⚠ Sliders AND step buttons, deliberately. `index.html` sets `touch-action: none` on
 * the whole page so the browser cannot claim the gestures, and that can interfere
 * with dragging a native range input on some devices. The buttons are plain taps and
 * always work, so a tuning session cannot be lost to a slider that will not drag.
 */

/** One adjustable number. ⚠ `set` returns an error to display, or `null` on success. */
export interface MenuSlider {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  get(): number;
  set(value: number): string | null;
}

export interface MenuSection {
  readonly title: string;
  readonly sliders: readonly MenuSlider[];
}

export interface Menu {
  /** Re-read every value from the config — after a URL override or an external change. */
  refresh(): void;
}

const PANEL_CSS = [
  "position:fixed",
  "top:0",
  "right:0",
  "bottom:0",
  "width:min(300px, 46vw)",
  "box-sizing:border-box",
  "background:rgba(10,12,16,0.93)",
  "color:#cfe3ff",
  "font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace",
  "z-index:200",
  "overflow-y:auto",
  // ⚠ The panel MUST take its own touches — unlike the readout, which must never eat
  // one. Vertical panning is allowed so a long menu can be scrolled; pinch stays the
  // camera's, because the canvas keeps `touch-action: none`.
  "touch-action:pan-y",
  "-webkit-overflow-scrolling:touch",
  "border-left:1px solid #2b3648",
].join(";");

/**
 * ⛔ Every `localStorage` access is guarded. It throws in a private window, and
 * returns nothing once site data is cleared — neither is a reason for the menu to
 * fail, so a failure to remember is simply a forgotten preference.
 */
const remembered = (key: string, fallback: boolean): boolean => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
};
const remember = (key: string, value: boolean): void => {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // Forgetting is acceptable; failing to open is not.
  }
};

const PANEL_KEY = "menu.open";
const sectionKey = (title: string) => `menu.section.${title}`;

export function createMenu(
  sections: readonly MenuSection[],
  parent: HTMLElement = document.body,
): Menu {
  let open = remembered(PANEL_KEY, false);

  const toggle = document.createElement("button");
  toggle.textContent = "☰";
  toggle.setAttribute("aria-label", "Tuning menu");
  toggle.style.cssText = [
    "position:fixed",
    "top:calc(6px + env(safe-area-inset-top))",
    "right:calc(6px + env(safe-area-inset-right))",
    "z-index:201",
    "width:40px",
    "height:40px",
    "font:18px/1 ui-monospace,monospace",
    "color:#cfe3ff",
    "background:rgba(10,12,16,0.82)",
    "border:1px solid #2b3648",
    "border-radius:6px",
    "touch-action:manipulation",
  ].join(";");
  parent.appendChild(toggle);

  const panel = document.createElement("div");
  panel.style.cssText = PANEL_CSS;
  panel.hidden = !open;
  parent.appendChild(panel);

  const head = document.createElement("div");
  head.textContent = "TUNING";
  head.style.cssText =
    "padding:calc(10px + env(safe-area-inset-top)) 10px 8px 10px;color:#8fa6c8;letter-spacing:1px";
  panel.appendChild(head);

  const error = document.createElement("div");
  error.style.cssText =
    "margin:0 10px 8px 10px;padding:6px;color:#ffb4b4;background:#2a1416;white-space:pre-wrap";
  error.hidden = true;
  panel.appendChild(error);

  const refreshers: (() => void)[] = [];

  const showError = (message: string | null) => {
    error.hidden = message === null;
    if (message !== null) error.textContent = "⛔ " + message;
  };

  for (const section of sections) {
    // ⭐ Sections start EXPANDED the first time — a menu whose contents are hidden by
    // default reads as an empty menu — and remember whatever the owner chooses after.
    let expanded = remembered(sectionKey(section.title), true);

    const title = document.createElement("button");
    title.style.cssText = [
      "display:flex",
      "justify-content:space-between",
      "align-items:center",
      "width:100%",
      "padding:10px",
      "font:inherit",
      "color:#7fd0a0",
      "background:transparent",
      "border:0",
      "border-top:1px solid #2b3648",
      "text-align:left",
      "touch-action:manipulation",
    ].join(";");
    const caret = document.createElement("span");
    const label = document.createElement("span");
    label.textContent = section.title;
    title.append(label, caret);
    panel.appendChild(title);

    const body = document.createElement("div");
    panel.appendChild(body);

    const applyExpanded = () => {
      body.hidden = !expanded;
      caret.textContent = expanded ? "–" : "+";
      title.setAttribute("aria-expanded", String(expanded));
    };
    title.addEventListener("click", () => {
      expanded = !expanded;
      remember(sectionKey(section.title), expanded);
      applyExpanded();
    });
    applyExpanded();

    for (const slider of section.sliders) {
      const row = document.createElement("div");
      row.style.cssText = "padding:4px 10px 8px 10px";

      const caption = document.createElement("div");
      caption.style.cssText = "display:flex;justify-content:space-between;gap:6px";
      const name = document.createElement("span");
      name.textContent = slider.label;
      const value = document.createElement("span");
      value.style.color = "#ffd79a";
      caption.append(name, value);

      const input = document.createElement("input");
      input.type = "range";
      input.min = String(slider.min);
      input.max = String(slider.max);
      input.step = String(slider.step);
      input.style.cssText = "width:100%;touch-action:none;margin:2px 0";

      const controls = document.createElement("div");
      controls.style.cssText = "display:flex;gap:6px";

      const render = () => {
        const v = slider.get();
        input.value = String(v);
        value.textContent = v.toFixed(3);
      };

      const apply = (v: number) => {
        const clamped = Math.min(slider.max, Math.max(slider.min, v));
        // ⛔ Rounded to the step before validating, so what is tested is exactly what
        // gets stored — otherwise a value could validate and then be stored different.
        const stepped = Math.round(clamped / slider.step) * slider.step;
        showError(slider.set(stepped));
        render();
      };

      input.addEventListener("input", () => apply(Number(input.value)));
      for (const [text, delta] of [["−", -1], ["+", +1]] as const) {
        const b = document.createElement("button");
        b.textContent = text;
        b.style.cssText =
          "flex:1;padding:8px;font:13px/1 ui-monospace,monospace;color:#cfe3ff;" +
          "background:#1b2533;border:1px solid #2b3648;border-radius:4px;touch-action:manipulation";
        b.addEventListener("click", () => apply(slider.get() + delta * slider.step));
        controls.appendChild(b);
      }

      row.append(caption, input, controls);
      body.appendChild(row);
      refreshers.push(render);
      render();
    }
  }

  const applyOpen = () => {
    panel.hidden = !open;
    toggle.textContent = open ? "✕" : "☰";
    if (open) for (const r of refreshers) r();
  };
  toggle.addEventListener("click", () => {
    open = !open;
    remember(PANEL_KEY, open);
    applyOpen();
  });
  applyOpen();

  return {
    refresh() {
      for (const r of refreshers) r();
    },
  };
}
