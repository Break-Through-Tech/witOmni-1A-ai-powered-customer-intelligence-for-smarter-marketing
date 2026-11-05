// Model setup (spec 001 §5, 008 §8): free-tier Gemini with an automatic
// fallback model and a small answer cache, both as model middleware.
import "server-only";

import { createGoogle } from "@ai-sdk/google";
import type { LanguageModelV4, LanguageModelV4Middleware, LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { APICallError, simulateReadableStream, wrapLanguageModel } from "ai";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 200;

export class AssistantConfigError extends Error {}

function provider() {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new AssistantConfigError("LLM_API_KEY is not set");
  if ((process.env.LLM_PROVIDER ?? "google") !== "google")
    throw new AssistantConfigError(`Unsupported LLM_PROVIDER: ${process.env.LLM_PROVIDER}`);
  return createGoogle({ apiKey });
}

/** Busy, rate-limited, or temporarily down: worth trying the other model. */
function isTransient(err: unknown): boolean {
  if (APICallError.isInstance(err)) {
    const s = err.statusCode ?? 0;
    return s === 429 || s >= 500 || err.isRetryable;
  }
  return false;
}

/** On a busy/limit error from the main model, run the same call on the fallback model. */
function fallbackMiddleware(fallback: LanguageModelV4): LanguageModelV4Middleware {
  return {
    specificationVersion: "v4",
    wrapGenerate: async ({ doGenerate, params }) => {
      try {
        return await doGenerate();
      } catch (err) {
        if (!isTransient(err)) throw err;
        console.warn("[assistant] main model busy, using fallback");
        return fallback.doGenerate(params);
      }
    },
    wrapStream: async ({ doStream, params }) => {
      try {
        return await doStream();
      } catch (err) {
        if (!isTransient(err)) throw err;
        console.warn("[assistant] main model busy, using fallback");
        return fallback.doStream(params);
      }
    },
  };
}

// In-memory per server instance; enough to make repeat "Generate" clicks free.
const cache = new Map<string, { at: number; parts: LanguageModelV4StreamPart[] }>();

const cacheMiddleware: LanguageModelV4Middleware = {
  specificationVersion: "v4",
  wrapStream: async ({ doStream, params }) => {
    const key = JSON.stringify({ prompt: params.prompt, tools: params.tools?.map((t) => t.name) });
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 5,
          chunks: hit.parts.map((p) =>
            p.type === "response-metadata" && p.timestamp ? { ...p, timestamp: new Date(p.timestamp) } : p,
          ),
        }),
      };
    }
    const { stream, ...rest } = await doStream();
    const parts: LanguageModelV4StreamPart[] = [];
    let failed = false;
    return {
      ...rest,
      stream: stream.pipeThrough(
        new TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>({
          transform(chunk, controller) {
            if (chunk.type === "error") failed = true;
            parts.push(chunk);
            controller.enqueue(chunk);
          },
          flush() {
            if (failed) return;
            if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
            cache.set(key, { at: Date.now(), parts });
          },
        }),
      ),
    };
  },
};

export function assistantModel({ useCache }: { useCache: boolean }) {
  const google = provider();
  const main = google(process.env.LLM_MODEL ?? "gemini-flash-lite-latest");
  const fallbackId = process.env.LLM_FALLBACK_MODEL;
  const middleware: LanguageModelV4Middleware[] = [];
  if (useCache) middleware.push(cacheMiddleware);
  if (fallbackId) middleware.push(fallbackMiddleware(google(fallbackId)));
  return middleware.length ? wrapLanguageModel({ model: main, middleware }) : main;
}
