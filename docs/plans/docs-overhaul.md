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

## Phase 0 — Upgrade the stack ✅

Done. Blocks everything else. A first attempt failed and was reverted because only
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

- [x] Upgraded all five together. Nothing broke: doing them in one step is
      what the first attempt got wrong. The five Turbopack warnings the build
      used to emit are gone too.
- [x] Regions verified working (content inside the region renders, content
      outside does not, markers do not appear). Keeping one file per snippet
      anyway: a complete file shows its imports, and importing the client from
      `create-client.ts` demonstrates the intended pattern. Regions are held in
      reserve for showing a slice of a longer realistic file.

## Phase 1 — Theme and layout ◐

The site is near-black (`#0a0a0a`) because `global.css` layers a shadcn palette
(`--background`, `--card`, `--popover`) over the Fumadocs preset. Fumadocs' own
neutral preset is `hsl(0, 0%, 7.04%)` (~`#121212`) and reads far better.

- [x] Found the real cause: `@layer base { body { @apply bg-background } }`
      painted the shadcn near-black over the whole site, docs included. The
      landing now scopes that palette to itself via `.landing-surface`, so the
      documentation uses Fumadocs' neutral preset as intended.
- [x] Widths left to Fumadocs. Its defaults are already
      `--fd-sidebar-width: 268px`, `--fd-toc-width: 268px`,
      `--fd-layout-width: 1400px`, and the reference site overrides none of
      them — its whole global.css is 140 lines. Ours was fighting a theme
      tuned as a whole.
- [x] Fonts wired through `--font-sans` and `--font-mono` as the preset expects,
      instead of `className` overriding the family directly. `--font-mono` was
      never defined at all, so code blocks fell back to the system stack.
- [ ] Audit the remaining 307 lines of `global.css` for what is still needed

## Phase 2 — Page furniture ◐

- [x] `MarkdownCopyButton` + `ViewOptionsPopover` in the page header, backed
      by a new `/api/md/[[...slug]]` route serving each page as raw Markdown
      (2.7-3.2 kB per page, verified in the build output).
- [ ] Ask AI trigger, bottom-right. **Needs a decision:** the reference's
      button is backed by Inkeep, a paid third-party service. Fumadocs ships no
      free equivalent, so this means either paying for a service or hosting a
      route against an LLM API with the cost that implies.
- [x] Hover cards on internal links, previewing the target's title and
      description. Verified per page against the source: 3/3, 1/1, 0/0 —
      applied to every internal markdown link and to nothing else.
- [x] `next-validate-link` in CI, replacing the ad-hoc checker. It also
      validates `<Card href>`, which the old one could not see. Verified it
      fails on both a broken markdown link and a broken Card href.

## Phase 3 — Information architecture ✅

The current structure was translated, never questioned. `core` is dense while
`react` and `zod` are three thin pages each, so the sidebar looks lopsided and
the two smaller packages read as afterthoughts.

- [x] Three roots, each with Guides and API reference as collapsible groups. 11 groups, all with icons.
- [x] config.mdx held ApiClientConfig, RequestOptions and RetryConfig at once;
      each is its own page now. The retry page was half policy and half
      reference and became one of each.
- [x] Five guides: the provider, TanStack Query, SWR, server rendering and
      testing. SSR and testing were undocumented and are the questions someone
      evaluating the library actually asks.
- [x] Three guides plus a ZodValidationError reference. Migration was dropped:
      there is nothing to migrate from yet.
- [x] Sidebar labels stay English, matching the content

## Phase 4 — Content richness ✅

Applied to each page as it is revisited, not as a separate sweep.

- [x] 10 `TypeTable`s across the reference pages, replacing flat markdown grids.
- [x] FAQ regrouped into three sections of accordions, plus accordions in the error guides.
- [x] Only one place had two genuinely alternative blocks. In `transport.mdx` the interface and its implementation stayed sequential: they complement each other rather than competing, and tabs would hide half the explanation.
- [x] 72 blocks carry a file name — the path the file would have in the reader's project, so the snippet also shows where it goes. pnpm is `defaultIndex={1}` on all three install tab groups.
- [x] Wired and verified. Used once so far, on the CORS fix — it earns its place only where a line is genuinely being added to something existing.
- [x] All 87. Assigned by destination rather than by page, so the same target always carries the same icon and colour.
- [x] 30 callouts.
- [x] Two, both in Concepts: the package graph and the request lifecycle.

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
