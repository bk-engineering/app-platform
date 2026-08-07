---
title: Status legend
status: implemented
---

# Status legend

<Status value="implemented" />

These docs are the **target spec**, not a report on the code. Status badges tell you how far to trust each page.

## Three levels

| Badge | Frontmatter value | Meaning | What to do |
| --- | --- | --- | --- |
| <Status value="implemented" inline /> | `implemented` | Code exists in this repo and matches this page | Follow it directly |
| <Status value="in-progress" inline /> | `in-progress` | Partly built; the page states what's missing | Read the "Current code status" box first |
| <Status value="planned" inline /> | `planned` | Spec only; no code yet | Use it as the blueprint when implementing |

Three levels on purpose. Add a fourth and people start arguing about which one applies.

## Where the badge lives

### 1. Frontmatter — machine-readable

```yaml
---
title: Trace ID
status: planned
statusNote: no genReqId, no AsyncLocalStorage, no header propagation
---
```

Add `statusNote` whenever `status` isn't `implemented`. Say what's *missing*, not what works.

### 2. Page badge — first line under the H1

```md
# Trace ID

<Status value="planned" />
```

Add a `note` when it's worth seeing at the top:

```md
<Status value="in-progress" note="seed script has a known issue" />
```

### 3. Section badge — when part of a page differs

```md
## How the API uses them <Status value="implemented" inline />
```

Use it when the page is `in-progress` but one section is fully built (or vice versa).

::: tip Never use raw emoji in prose
Always use `<Status />`. It translates itself for the reader's language and can be restyled in one place.
:::

## The spec-vs-code box

Every page that isn't `implemented` carries one, usually at the bottom:

```md
::: warning Current code status
| Target spec | Code today |
| --- | --- |
| refresh token rotation + reuse detection | `auth.service.ts` only verifies and re-signs — the same token stays reusable |
| a `RefreshToken` table | doesn't exist; the system is fully stateless |
:::
```

Rules for that box:

- Always cite a **real file**, never a vague "not done yet"
- The right column must be verifiable. If a reader opens the file and it doesn't match, the docs are stale
- One row per difference. Don't merge them.

## Who updates it, and when

| Event | Do this |
| --- | --- |
| Implement part of a `planned` page | Change it to `in-progress` and rewrite the box to say what's left |
| Finish a whole page | Change it to `implemented`, **delete the box**, and clear the row in the [Roadmap](/en/start/roadmap) |
| Change code so it **contradicts** the docs | Fix the docs in the same PR, not later |
| Decide to change the spec | Write an ADR that supersedes the old one, then edit the page |

::: danger Docs and code change in the same PR
"We'll update the docs later" is exactly where every SSOT dies. If a PR changes behaviour that's documented, the docs come with it — and updating a status is one line, so there's no excuse.
:::

## Both languages must agree

The `status` frontmatter of the Thai and English versions of a page must **always match**. If they don't, one side has a stale translation. See [ADR-0015](/en/adr/0015-docs-as-bilingual-ssot).

The full status picture is at [Roadmap](/en/start/roadmap).
