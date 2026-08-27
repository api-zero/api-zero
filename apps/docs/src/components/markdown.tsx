"use client";

import { memo } from "react";

/**
 * Renders an assistant message. Deliberately minimal: the model answers in
 * plain prose with markdown links, and a full markdown pipeline in the client
 * bundle would cost more than the formatting is worth here.
 */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none text-fd-foreground">
      {text.split("\n\n").map((paragraph, index) => (
        <p
          key={index}
          className="my-2 whitespace-pre-wrap first:mt-0 last:mb-0"
        >
          {renderInline(paragraph)}
        </p>
      ))}
    </div>
  );
});

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const CODE = /`([^`]+)`/g;

function renderInline(text: string) {
  const nodes: React.ReactNode[] = [];
  let last = 0;

  // Links first: they are the citations back into the documentation, and
  // losing them would make an answer unverifiable.
  for (const match of text.matchAll(LINK)) {
    if (match.index === undefined) continue;
    nodes.push(...renderCode(text.slice(last, match.index), nodes.length));
    nodes.push(
      <a
        key={`link-${match.index}`}
        href={match[2]}
        className="font-medium text-fd-primary underline underline-offset-4"
      >
        {match[1]}
      </a>,
    );
    last = match.index + match[0].length;
  }
  nodes.push(...renderCode(text.slice(last), nodes.length));

  return nodes;
}

function renderCode(text: string, offset: number) {
  const nodes: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(CODE)) {
    if (match.index === undefined) continue;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <code
        key={`code-${offset}-${match.index}`}
        className="rounded bg-fd-muted px-1 py-0.5 text-[0.85em]"
      >
        {match[1]}
      </code>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return nodes;
}
