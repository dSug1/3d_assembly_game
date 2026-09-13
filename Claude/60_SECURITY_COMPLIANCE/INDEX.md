# 60 — SECURITY & COMPLIANCE · privacy, minors, dependencies, stores

> **STATUS** · live · **OWNS** · the privacy position and everything true before a
> store submission
> **READ IF** · you are adding a dependency, a network call, a capture path, or an
> SDK
> **LAST VERIFIED** · 2026-09-13

⛔⛔ **THE AUDIENCE IS ALL PUBLIC, INCLUDING YOUTH** (`D2`, carried). That single
decision makes **COPPA and GDPR-K live**, puts the build inside Google Play's Families
policy and Apple's Kids Category, and turns three architecture questions into
compliance questions.

## The position

⭐⭐ The strongest claim is a negative: **there is no network egress.** *"Nothing
leaves the device"* is then verifiable **by absence** — the predecessor's audit
established exactly this and it was worth more than any control it could have added.

| control | status |
|---|---|
| no network egress anywhere in the game | ✅ true today — **keep it that way, and check it in CI** |
| ⛔ **no third-party analytics or ads SDKs, ever** | binding. This is load-bearing for COPPA/GDPR-K, not a preference |
| every dependency licence recorded before it lands | [`../../THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md), `N13` |
| attribution ships with the **binary** | ⚠ `SEC0` seeded the file; the build must include it |
| any playtest capture compile-time-disabled in shipping builds | ⛔ `SEC2`, at package time |

⚠ **Anything that transmits is a compliance event and must be raised BEFORE it is
built.** Retrofitting a privacy position around a shipped feature is how a youth
title gets pulled.

## ⚠ Two things a web/mobile target adds that the predecessor did not have

* **A CDN or a font host is egress.** Self-host everything; a request to a
  third-party domain from a children's app is a disclosure the store will ask about.
* **Browser storage is per-device data.** `localStorage` is fine for a remembered
  setting; anything resembling a profile is a compliance question first.

## Queued

`SEC1` privacy policy + store disclosures · `SEC2` shipping-build hygiene ·
`SEC3` hash-pinned dependency tree.
