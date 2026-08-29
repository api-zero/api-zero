"use client";

import { ApiError, createClient } from "@api-zero/core";
import { useCallback, useId, useRef, useState } from "react";
import { type Attempt, createFakeTransport } from "./fake-transport";

/** What the reader can change. Everything else is the library's own default. */
interface Settings {
  failures: number;
  status: 500 | 429;
  backoff: "exponential" | "linear";
  jitter: boolean;
}

/** What the policy asked for, keyed by the attempt the wait followed. */
type Delays = Record<number, number>;

/**
 * The retry policy, running for real, on a transport that never leaves the page.
 *
 * Prose cannot convey a wait. A reader can be told that the second attempt
 * comes after roughly twice the delay of the first and still not know what that
 * feels like, which is the difference between a policy that sounds reasonable
 * and one they can defend to whoever asks why the p99 tripled.
 *
 * The base delay is 400ms rather than the documented default of 1000ms, so the
 * sequence fits inside the reader's attention. Everything else — the backoff
 * curve, the jitter, the Retry-After precedence, the idempotency check — is the
 * shipped engine.
 */
export function RetryDemo() {
  const [settings, setSettings] = useState<Settings>({
    failures: 2,
    status: 500,
    backoff: "exponential",
    jitter: true,
  });
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [delays, setDelays] = useState<Delays>({});
  const [outcome, setOutcome] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAttempts([]);
    setDelays({});
    setOutcome(null);
    setRunning(true);

    const seen: Attempt[] = [];
    const api = createClient({
      baseURL: "https://api.example.com",
      transport: createFakeTransport({
        failures: settings.failures,
        status: settings.status,
        retryAfter: settings.status === 429 ? 1 : undefined,
        onAttempt: (attempt) => {
          seen.push(attempt);
          setAttempts((current) => [...current, attempt]);
        },
      }),
      retry: {
        attempts: 4,
        delay: 400,
        backoff: settings.backoff,
        jitter: settings.jitter,
        // `onRetry` fires before the wait, so it can only report what the
        // policy asked for. What the reader actually waits is the gap between
        // two attempt timestamps, and the difference between the two is
        // exactly what jitter and Retry-After do.
        onRetry: (event) => {
          setDelays((current) => ({
            ...current,
            [event.attempt]: event.delay,
          }));
        },
      },
    });

    try {
      await api.get("/users/1", { signal: controller.signal });
      setOutcome(`Resolved after ${seen.length} attempts`);
    } catch (error) {
      // Properties, not predicates: `isNotFound()` is a method, but
      // `isAborted`, `isTimeout` and `isNetworkError` are fields.
      if (error instanceof ApiError && error.isAborted) {
        setOutcome("Cancelled — the wait was interrupted, not waited out");
      } else if (error instanceof ApiError) {
        setOutcome(
          `Gave up: ${error.status || "network"} after ${seen.length} attempts`,
        );
      } else {
        setOutcome("Cancelled");
      }
    } finally {
      setRunning(false);
    }
  }, [settings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div className="flex flex-wrap items-end gap-4 border-fd-border border-b p-4">
        <Field
          label="Failures first"
          value={String(settings.failures)}
          onChange={(value) => update("failures", Number(value))}
          options={["0", "1", "2", "3"]}
        />
        <Field
          label="Status"
          value={String(settings.status)}
          onChange={(value) => update("status", Number(value) as 500 | 429)}
          options={["500", "429"]}
        />
        <Field
          label="Backoff"
          value={settings.backoff}
          onChange={(value) => update("backoff", value as Settings["backoff"])}
          options={["exponential", "linear"]}
        />
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={settings.jitter}
            onChange={(event) => update("jitter", event.target.checked)}
            className="size-4 accent-fd-primary"
          />
          Jitter
        </label>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={run}
            className="h-9 rounded-full bg-fd-primary px-4 font-medium text-fd-primary-foreground text-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.97]"
          >
            {running ? "Running…" : "Run"}
          </button>
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            disabled={!running}
            className="h-9 rounded-full border border-fd-border px-4 font-medium text-sm transition-[transform,background-color] duration-150 ease-out hover:bg-fd-accent active:scale-[0.97] disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="min-h-44 p-4 font-mono text-sm">
        {attempts.length === 0 && !outcome && (
          <p className="text-fd-muted-foreground">
            Nothing has been sent yet. The transport is local to this page — no
            request leaves your browser.
          </p>
        )}

        <ol className="flex flex-col gap-1.5">
          {attempts.map((attempt, index) => {
            const previous = attempts[index - 1];
            // From the previous response to this request, so the transport's
            // own round trip is not counted as part of the wait.
            const waited = previous ? attempt.at - previous.respondedAt : null;
            const asked = delays[attempt.number - 1];

            return (
              <li key={attempt.number} className="flex flex-col gap-1.5">
                {waited !== null && (
                  <span className="pl-14 text-fd-muted-foreground">
                    waited {waited}ms
                    {asked !== undefined && (
                      <span className="ml-2 opacity-60">
                        · policy asked for {asked}ms
                      </span>
                    )}
                  </span>
                )}
                <span className="flex gap-3">
                  <span className="w-11 shrink-0 text-fd-muted-foreground">
                    {attempt.at}ms
                  </span>
                  <span
                    className={
                      attempt.status === 200
                        ? "text-emerald-500"
                        : "text-red-500"
                    }
                  >
                    attempt {attempt.number} → {attempt.status}
                  </span>
                  {attempt.retryAfter !== undefined && (
                    <span className="text-fd-muted-foreground">
                      Retry-After: {attempt.retryAfter}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        {outcome && (
          <p className="mt-4 border-fd-border border-t pt-3 font-medium">
            {outcome}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * A labelled select.
 *
 * The label and the control live in one component rather than a wrapper taking
 * the control through `children`: an association made across a component
 * boundary is invisible to static analysis, and a label a checker cannot follow
 * is one a reviewer cannot either.
 */
function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-medium text-fd-muted-foreground text-xs"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-fd-border bg-fd-background px-2.5 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
