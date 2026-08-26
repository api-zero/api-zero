# Documentation overhaul — working plan

**Status:** in progress
**Started:** 2026-08-26
**Reference:** `fuma-nama/fumadocs` cloned at `../fumadocs-reference` (shallow)

The content rewrite is done: every page is English, every snippet is compiled,
no link is dead. What is left is presentation and structure — the docs read like
a wall of prose, and the information architecture was inherited rather than
designed.

Phases are ordered by dependency. Each is verified before the next begins.

---

## Phase 0 — Upgrade the stack

Blocks everything else. A first attempt failed and was reverted because only
`fumadocs-mdx` was moved; the cascade was not followed through.

| Package | Current | Target |
| ------- | ------- | ------ |
| `fumadocs-core` | 16.1.0 | 16.15.2 |
| `fumadocs-ui` | 16.1.0 | 16.15.2 |
| `fumadocs-mdx` | 14.0.3 | 15.3.1 (major) |
| `tailwindcss` | 4.1.17 | 4.3.3 |
| `next` | 16.0.1 | 16.3.2 |

Tailwind is the one that broke the earlier attempt: the newer `fumadocs-ui`
emits `-inset-s-4`, a utility 4.1 does not know.

**Unlocks:** `<include>file.ts#region</include>` region extraction,
`MarkdownCopyButton`, `ViewOptionsPopover`, AI search trigger, `TypeTable`.

- [ ] Upgrade all five together, build, fix fallout
- [ ] Re-evaluate one-file-per-snippet vs regions now that regions work

## Phase 1 — Theme and layout

The site is near-black (`#0a0a0a`) because `global.css` layers a shadcn palette
(`--background`, `--card`, `--popover`) over the Fumadocs preset. Fumadocs' own
neutral preset is `hsl(0, 0%, 7.04%)` (~`#121212`) and reads far better.

- [ ] Strip the shadcn palette override; keep `fumadocs-ui/css/neutral.css`
      as the source of truth, override only what genuinely differs
- [ ] Narrower left sidebar, narrower TOC, wider content with more lateral
      padding — configured on `DocsLayout`, not by hand-written CSS
- [ ] Audit the remaining 307 lines of `global.css` for what is still needed

## Phase 2 — Page furniture

- [ ] `MarkdownCopyButton` + `ViewOptionsPopover` in the page header
      (`fumadocs-ui/layouts/docs/page`)
- [ ] Ask AI trigger, bottom-right, on every view
- [ ] Hover cards on internal links: underlined, accent-coloured, previewing
      the target page's title and description
- [ ] Replace the hand-rolled Python link checker with `next-validate-link`
      in CI

## Phase 3 — Information architecture

The current structure was translated, never questioned. `core` is dense while
`react` and `zod` are three thin pages each, so the sidebar looks lopsided and
the two smaller packages read as afterthoughts.

- [ ] Redesign the tree: collapsible groups with sub-items, icons per section
- [ ] Split core's dense reference pages so headings nest and the TOC has depth
      instead of one flat column
- [ ] Expand `react`: provider patterns, TanStack Query, SWR, SSR and per-request
      clients, testing
- [ ] Expand `zod`: contracts, error handling, form integration, migrating an
      untyped client
- [x] Sidebar labels stay English, matching the content

## Phase 4 — Content richness, page by page

Applied to each page as it is revisited, not as a separate sweep.

- [ ] `TypeTable` for every prop/config table — `ApiClientConfig`,
      `RequestOptions`, `RetryConfig`, `ApiError`
- [ ] `Accordion` for the FAQ
- [ ] Two or more adjacent code blocks become `Tabs`
- [ ] Code blocks carry a file name; `pnpm` is the default install tab
- [ ] Diff highlighting where a snippet shows an addition
- [ ] Cards get coloured icons
- [ ] Callouts wherever a warning currently hides inside a paragraph
- [ ] Mermaid diagrams where a sequence or a tree explains faster than prose

## Phase 5 — Verification

- [ ] `next-validate-link` clean
- [ ] Examples typecheck, surface snapshot, size budget, tarball smoke
- [ ] Every page visually reviewed against the reference

---

## Resolved

**Sidebar label language — English.** Raised because a Spanish nav over English
content makes the reader switch language on every click. Three leftover Spanish
group labels were found and fixed at the same time.

## Notes

- `fumadocs-typescript` generates API reference from TypeScript types. Worth
  evaluating for the reference pages: it would extend the compiled-examples
  guarantee to the prop tables themselves.
- `fumadocs-twoslash` type-checks inline snippets, covering the gap the
  examples package cannot: code too small to deserve its own file.
