---
title: 0011 · Thai as the default locale
status: in-progress
statusNote: apps/web still sets defaultLocale to en
---

# 0011 · Thai as the default locale

<Status value="in-progress" note="apps/web is still en" />

- **Status:** accepted
- **Date:** 2026-08-07
- **Category:** i18n

## Context

The product's primary users are Thai, but `apps/web/src/i18n/routing.ts` sets `defaultLocale: "en"` — a leftover from scaffolding, not a decision. Meanwhile these docs are meant to lead in Thai. Leaving the two inconsistent guarantees ongoing confusion.

## Decision

**Thai is the default locale for both the product and the documentation.**

| | Default | Second language |
| --- | --- | --- |
| `apps/web` | `th` (to be fixed) | `en` |
| `apps/docs` | `th` (root) | `en` (`/en/`) |

- User-facing copy is written in Thai first, then translated to English
- **Code, comments, identifiers, and commit messages are always English**
- Technical terms stay in English inside Thai prose (trace id, ability, envelope, contract) rather than being forced into transliteration
- `message` in the error envelope is always English (for developers); users see text translated from `code`

## Alternatives considered

### English as the default for both
The usual open-source default and immediately readable to outsiders — but the actual users are Thai, and making their language second-class means Thai copy is forever a translation of English, which usually reads like one.

### Thai only
The lowest maintenance, but it shuts out contributors who don't read Thai and forecloses ever serving non-Thai users.

### Thai-first product, English-first docs
Less translation work for the docs, but creates an inconsistency that has to be explained every time — and the people writing the docs are the people writing the product.

## Consequences

**We gain:** users see their own language without choosing it · Thai copy is original rather than translated, so it reads naturally · docs and product are configured identically and easy to explain

**We give up:** everything user-facing must be written twice · VitePress local search needs a Thai tokenizer (`Intl.Segmenter`) because Thai has no word spaces · contributors who don't read Thai have a harder entry point

**What must follow:** change `apps/web/src/i18n/routing.ts` to `defaultLocale: "th"` · verify `localePrefix` behaves as expected · write `apps/web/messages/th.json` as the original and `en.json` as the translation

::: warning Current code status
| Target spec | Code today |
| --- | --- |
| `defaultLocale: "th"` | `apps/web/src/i18n/routing.ts` still says `"en"` |
| Thai is the source language for copy | `messages/{th,en}.json` contain only a `HomePage` namespace |
| A language switcher in the UI | No such component |
:::

## When to revisit

When more than half of users aren't Thai, or if the project opens up and external contribution becomes the primary source of changes.
