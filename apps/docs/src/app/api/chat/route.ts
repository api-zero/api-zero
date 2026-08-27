import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
} from "ai";
import { Document, type DocumentData } from "flexsearch";
import { z } from "zod";
import { source } from "@/lib/source";
import type { ChatUIMessage, SearchTool } from "../../../components/ai/search";

interface CustomDocument extends DocumentData {
  url: string;
  title: string;
  description: string;
  content: string;
}
const searchServer = createSearchServer();

async function createSearchServer() {
  const search = new Document<CustomDocument>({
    document: {
      id: "url",
      index: ["title", "description", "content"],
      store: true,
    },
  });

  const docs = await chunkedAll(
    source.getPages().map(async (page) => {
      if (!("getText" in page.data)) return null;

      return {
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        content: await page.data.getText("processed"),
      } as CustomDocument;
    }),
  );

  for (const doc of docs) {
    if (doc) search.add(doc);
  }

  return search;
}

async function chunkedAll<O>(promises: Promise<O>[]): Promise<O[]> {
  const SIZE = 50;
  const out: O[] = [];
  for (let i = 0; i < promises.length; i += SIZE) {
    out.push(...(await Promise.all(promises.slice(i, i + SIZE))));
  }
  return out;
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/** System prompt, you can update it to provide more specific information */
const systemPrompt = [
  "You are the documentation assistant for api-zero, a small Fetch-based HTTP",
  "client for TypeScript published as @api-zero/core, @api-zero/react and",
  "@api-zero/zod.",
  "",
  // A smaller model reads "when needed" as permission to skip searching, and
  // then answers from training data about some other HTTP client. Every
  // question is about this library, so searching is not optional.
  "ALWAYS call the `search` tool before answering, on every question, even if",
  "you believe you already know the answer. The documentation is the only",
  "source of truth about this library, and your training data is not.",
  "",
  "Ground every claim in the search results and cite them as markdown links",
  "using each result's `url` field EXACTLY as given. Those are site-relative",
  "paths such as /docs/core/guides/retries. Never prepend a domain and never",
  "invent one: a fabricated host produces a link that goes nowhere.",
  "",
  "If the search returns nothing relevant, say so plainly and suggest what the",
  "reader might look for instead. Never invent an API, an option name or a",
  "default value.",
].join("\n");

export async function POST(req: Request) {
  const reqJson = await req.json();

  const result = streamText({
    // A free model by default, deliberately. OpenRouter's `:free` tier costs
    // nothing and is capped at 20 requests a minute and 50 a day, so a public
    // endpoint that someone hammers stops answering rather than producing a
    // bill. Set OPENROUTER_MODEL to a paid model only as a conscious decision.
    model: openrouter.chat(
      process.env.OPENROUTER_MODEL ?? "minimax/minimax-m3:free",
    ),
    stopWhen: stepCountIs(5),
    tools: {
      search: searchTool,
    },
    // ai@7 rejects a `system` role inside `messages` and takes the system
    // prompt through `instructions` instead. The CLI template predates that
    // change, which is why every question failed with AI_InvalidPromptError.
    instructions: systemPrompt,
    messages: [
      ...(await convertToModelMessages<ChatUIMessage>(reqJson.messages ?? [], {
        convertDataPart(part) {
          if (part.type === "data-client")
            return {
              type: "text",
              text: `[Client Context: ${JSON.stringify(part.data)}]`,
            };
        },
      })),
    ],
    toolChoice: "auto",
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

const searchTool = tool({
  description: "Search the docs content and return raw JSON results.",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  async execute({ query, limit }) {
    const search = await searchServer;
    return await search.searchAsync(query, {
      limit,
      merge: true,
      enrich: true,
    });
  },
}) satisfies SearchTool;
