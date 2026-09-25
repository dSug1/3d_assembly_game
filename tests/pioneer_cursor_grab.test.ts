/**
 * GOLDEN VECTORS — **WHICH PIONEERFACECURSOR A PRESS GRABS** (the owner, 2026-09-25): the left
 * button INSIDE the ring on desktop; a first or second touch within a slider of 1…10 radii on
 * mobile.
 */
import { describe, expect, it } from "vitest";
import { grabbedCursor, type CursorPress } from "@input/pioneer_cursor_grab";
import { MOUSE_SECOND_ID } from "@input/mouse_second_touch";
import { DEFAULT_CONFIG } from "@input/gestureConfig";

const R = 8;
const touch = (x: number, y: number, pointerId = 1): CursorPress => ({
  x,
  y,
  pointerType: "touch",
  pointerId,
  button: 0,
});
const mouse = (x: number, y: number, button = 0): CursorPress => ({
  x,
  y,
  pointerType: "mouse",
  pointerId: 1,
  button,
});
const ONE = [{ key: "k", x: 100, y: 100 }];

describe("⭐⭐⭐ desktop: the left button INSIDE the ring", () => {
  it("⭐ inside grabs; just outside does not, WHATEVER the slider says", () => {
    // ⛔ RED against giving the mouse the touch reach.
    expect(grabbedCursor(mouse(107, 100), ONE, R, 10)).toBe("k");
    expect(grabbedCursor(mouse(109, 100), ONE, R, 10)).toBeNull();
  });

  it("⛔ the right button never grabs", () => {
    expect(grabbedCursor(mouse(100, 100, 2), ONE, R, 1)).toBeNull();
  });

  it("⛔ the mouse's synthesised second touch never grabs", () => {
    expect(grabbedCursor(touch(100, 100, MOUSE_SECOND_ID), ONE, R, 10)).toBeNull();
  });
});

describe("⭐⭐⭐ mobile: within the slider's number of radii", () => {
  it("⭐⭐ the reach is the slider × the radius", () => {
    // ⛔ RED against a reach of one radius on touch.
    expect(grabbedCursor(touch(124, 100), ONE, R, 5)).toBe("k");
    expect(grabbedCursor(touch(141, 100), ONE, R, 5)).toBeNull();
  });

  it("⛔ the slider is clamped to the owner's 1…10", () => {
    expect(grabbedCursor(touch(107, 100), ONE, R, 0.2)).toBe("k");
    expect(grabbedCursor(touch(109, 100), ONE, R, 0.2)).toBeNull();
    expect(grabbedCursor(touch(179, 100), ONE, R, 50)).toBe("k");
    expect(grabbedCursor(touch(181, 100), ONE, R, 50)).toBeNull();
  });

  it("⭐ a second touch grabs too — any touch does", () => {
    expect(grabbedCursor(touch(100, 110, 7), ONE, R, 3)).toBe("k");
  });
});

describe("⭐⭐ the owner's toggle", () => {
  it("⛔⛔ switched OFF, nothing is grabbed — not even a click dead centre", () => {
    // ⛔ RED against ignoring the toggle.
    expect(grabbedCursor(mouse(100, 100), ONE, R, 10, false)).toBeNull();
    expect(grabbedCursor(touch(100, 100), ONE, R, 10, false)).toBeNull();
  });

  it("⭐ switched ON, the same presses grab", () => {
    expect(grabbedCursor(mouse(100, 100), ONE, R, 10, true)).toBe("k");
    expect(grabbedCursor(touch(100, 100), ONE, R, 10, true)).toBe("k");
  });
});

describe("⛔⛔ the shipped default is OFF", () => {
  it("⭐ *\"default is cursor drag off\"* — the owner, 2026-09-25", () => {
    // ⛔ RED against the ON default this toggle first shipped with.
    expect(DEFAULT_CONFIG.pioneerCursorDrag).toBe(0);
    expect(
      grabbedCursor(mouse(100, 100), ONE, R, 10, DEFAULT_CONFIG.pioneerCursorDrag === 1),
    ).toBeNull();
  });
});

describe("⭐ several cursors", () => {
  it("⭐⭐ the NEAREST in reach wins", () => {
    const two = [
      { key: "far", x: 100, y: 100 },
      { key: "near", x: 130, y: 100 },
    ];
    // ⛔ RED against first-in-reach.
    expect(grabbedCursor(touch(120, 100), two, R, 10)).toBe("near");
  });

  it("⚠ none in reach, or none at all → null, and the press goes on to the ordinary rules", () => {
    expect(grabbedCursor(touch(500, 500), ONE, R, 10)).toBeNull();
    expect(grabbedCursor(touch(100, 100), [], R, 10)).toBeNull();
  });
});
