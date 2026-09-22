/**
 * ⛔⛔ **THE DOCUMENTATION'S POINTERS — A CHECK, NOT A CONVENTION.**
 *
 * The tiered architecture is held together by links: a front door carries a POINTER and the
 * dossier carries the record (`Claude/README.md`, and `_QUEUE_PREAMBLE.md` has always said
 * so). ⛔ A pointer that does not resolve breaks the tier it was invented to serve — the
 * reader is sent to the record and lands nowhere, so the front door becomes the only tier
 * that works, which is the exact bloat `doc_budget.test.ts` exists to stop.
 *
 * ⭐⭐ **THE DEFECT THIS EXISTS FOR, 2026-09-22.** A sweep found **56 broken relative links**,
 * and they were one shape, not fifty-six problems: a link written for a front door at
 * `00_CORE/` — `queue_notes/IN3.md` — copied into a file one level DEEPER and never re-based.
 * ⚠ The tell was that `2026-09-16_superseded_decisions.md` carried BOTH forms of the same
 * link, the broken `../10_INPUT_TOUCH/...` and the correct `../../10_INPUT_TOUCH/...`, a few
 * lines apart. ⛔ Nothing looked, so nothing said.
 *
 * ⭐⭐⭐ THE LESSON IS THE PROJECT'S OWN, AIMED AT ITS DOCUMENTATION FOR THE SECOND TIME:
 * *a contract nothing checks is a wish* (`LESSONS_CARRIED` §2). `boundary.test.ts` checks the
 * engine boundary, `config_debt.test.ts` refuses dead tunables, `doc_budget.test.ts` checks
 * the tier SIZES — and nothing checked that the tiers were REACHABLE.
 *
 * ⚠ And a second, quieter fault came out with it: **64 links whose visible LABEL stated a
 * path that was not where the link went.** A label is a readout, and `METHOD`'s *an absent
 * readout cannot be caught by looking at the screen* has a sibling — a readout that states
 * something FALSE is read and believed. ⛔ A reader deciding whether a pointer is worth
 * following reads the label, not the destination.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

/** Every markdown file in the repo, excluding what is not ours to police. */
function allMarkdown(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) allMarkdown(p, out);
    else if (entry.endsWith(".md")) out.push(p);
  }
  return out;
}

interface Link {
  /** The visible text between the brackets, backticks stripped. */
  readonly label: string;
  /** The destination, anchor and all, exactly as written. */
  readonly target: string;
}

/**
 * ⭐ Inline links only — `[text](target)`. Reference-style links and bare URLs are not used
 * anywhere in this tree, and a regex that tried to cover them would be the bigger risk.
 */
export function linksIn(text: string): Link[] {
  // ⚠ `noUncheckedIndexedAccess` is on, and both groups are non-optional in the pattern —
  // so the `?? ""` is a type obligation, not a real case.
  return [...text.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)].map((m) => ({
    label: (m[1] ?? "").replace(/`/g, "").trim(),
    target: m[2] ?? "",
  }));
}

/** The destination with any `#anchor` removed. */
function pathOf(target: string): string {
  return target.split("#")[0] ?? "";
}

/** ⚠ External and pure-anchor targets are somebody else's problem, deliberately. */
function isLocal(target: string): boolean {
  return !/^(https?:|mailto:|#)/.test(target);
}

/**
 * The broken pointers in one file.
 *
 * ⭐ `exists` is injected so the rule can be exercised against a document that is NOT on
 * disk — which is what makes the counter-example below possible. A guard that can only be
 * run against a tree that currently passes cannot be shown to fail.
 */
export function brokenLinks(
  fileAbs: string,
  text: string,
  exists: (abs: string) => boolean,
): string[] {
  const out: string[] = [];
  for (const { target } of linksIn(text)) {
    if (!isLocal(target)) continue;
    const pathPart = pathOf(target);
    if (!pathPart) continue; // a pure anchor into this same file
    if (!exists(resolve(dirname(fileAbs), decodeURIComponent(pathPart)))) out.push(target);
  }
  return out;
}

/**
 * Labels that state a path, and state the WRONG one.
 *
 * ⛔ A **bare basename** label (`PROVENANCE.md`) is left alone on purpose: it is readable
 * shorthand, not a claim about where the file sits, and forcing it to match a
 * `../../`-laden destination would make the front doors harder to read to satisfy a rule
 * nobody asked for. ⭐ The rule bites only on a label that took the trouble to spell a
 * PATH — one containing a `/` — because that is a statement a reader can act on.
 */
export function lyingLabels(text: string): { label: string; target: string }[] {
  const out: { label: string; target: string }[] = [];
  for (const { label, target } of linksIn(text)) {
    if (!isLocal(target)) continue;
    if (!label.endsWith(".md") || !label.includes("/")) continue;
    if (label !== pathOf(target)) out.push({ label, target });
  }
  return out;
}

const FILES = allMarkdown(root);

/** ⚠ Windows separators would make every message unreadable and unclickable. */
function rel(f: string): string {
  return relative(root, f).split("\\").join("/");
}

describe("⛔ the documentation's pointers resolve", () => {
  it("finds markdown to check at all — the guard's own floor", () => {
    // ⚠ A walker that silently returned [] would make every assertion below vacuous, which
    // is `METHOD`'s *a skipped check must be announced* in its cheapest form.
    expect(FILES.length).toBeGreaterThan(20);
  });

  it("⭐⭐ every relative link in every .md file resolves to a file that exists", () => {
    const offenders = FILES.flatMap((f) =>
      brokenLinks(f, readFileSync(f, "utf8"), existsSync).map((t) => `${rel(f)} -> ${t}`),
    );
    // ⚠ The message NAMES them, because "a link is broken" is not actionable.
    expect(offenders).toEqual([]);
  });

  it("⭐ a label that spells a path spells the path the link actually goes to", () => {
    const offenders = FILES.flatMap((f) =>
      lyingLabels(readFileSync(f, "utf8")).map(
        (l) => `${rel(f)}: label ${l.label} -> target ${l.target}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});

describe("⭐⭐ and the guard fires on its own counter-example", () => {
  // ⛔⛔ `METHOD`: *a test that cannot FAIL is not a test.* `boundary.test.ts` carries a
  // counter-example for exactly this reason — its first version matched the WORD "three" in
  // a comment. These are the 2026-09-22 defect in miniature, as data.
  const fakeFile = join(root, "Claude", "00_CORE", "queue_notes", "FAKE.md");
  const onlyRealFile = (abs: string) =>
    abs === join(root, "Claude", "00_CORE", "queue_notes", "IN3.md");

  it("catches the exact shape that broke: a front door's path used one level deeper", () => {
    // ⭐ This is the real defect: correct from `00_CORE/`, broken from `00_CORE/queue_notes/`.
    const doc = "see [`queue_notes/IN3.md`](queue_notes/IN3.md)";
    expect(brokenLinks(fakeFile, doc, onlyRealFile)).toEqual(["queue_notes/IN3.md"]);
  });

  it("passes the re-based form of that same link", () => {
    const doc = "see [`./IN3.md`](./IN3.md)";
    expect(brokenLinks(fakeFile, doc, onlyRealFile)).toEqual([]);
  });

  it("ignores external links and pure anchors, which are not ours to resolve", () => {
    const doc = "[a](https://example.com/x.md) [b](#section) [c](mailto:x@y.z)";
    expect(brokenLinks(fakeFile, doc, () => false)).toEqual([]);
  });

  it("catches a label that states a path the link does not go to", () => {
    const doc = "see [`../00_CORE/queue_notes/IN1.md`](./IN1.md)";
    expect(lyingLabels(doc)).toEqual([
      { label: "../00_CORE/queue_notes/IN1.md", target: "./IN1.md" },
    ]);
  });

  it("⛔ spares a BARE basename label, which is shorthand and not a claim about location", () => {
    expect(lyingLabels("see [`PROVENANCE.md`](../PROVENANCE.md)")).toEqual([]);
  });
});
