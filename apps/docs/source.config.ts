import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins/remark-mdx-mermaid";
import { remarkNpm } from "fumadocs-core/mdx-plugins/remark-npm";
import { remarkSteps } from "fumadocs-core/mdx-plugins/remark-steps";
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import { remarkAutoTypeTable } from "fumadocs-typescript";
import convertPackageManager from "npm-to-yarn";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // Generates prop tables from the real TypeScript instead of transcribing
    // them: the types stay accurate by construction, and they render
    // highlighted and expandable rather than as plain strings.
    remarkPlugins: [
      remarkAutoTypeTable,
      // `### 1. Title` becomes a numbered step, and the number reaches the
      // table of contents through TOCItemType._step.
      remarkSteps,
      // An ```npm block becomes package-manager tabs. The default order puts
      // npm first; pnpm is what this repository uses and what the install
      // instructions should offer by default.
      [
        remarkNpm,
        {
          packageManagers: [
            {
              name: "pnpm",
              command: (cmd: string) => convertPackageManager(cmd, "pnpm"),
            },
            { name: "npm", command: (cmd: string) => cmd },
            {
              name: "yarn",
              command: (cmd: string) => convertPackageManager(cmd, "yarn"),
            },
            {
              name: "bun",
              command: (cmd: string) => convertPackageManager(cmd, "bun"),
            },
          ],
        },
      ],
      // A ```mermaid fence becomes <Mermaid />.
      remarkMdxMermaid,
    ],
    rehypeCodeOptions: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
    },
    // MDX options
  },
});
