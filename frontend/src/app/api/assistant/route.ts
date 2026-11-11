import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  hasToolCall,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { checkLimits } from "@/lib/assistant/limits";
import { AssistantConfigError, assistantModel } from "@/lib/assistant/model";
import { prefetchFor } from "@/lib/assistant/prefetch";
import { buildInstructions } from "@/lib/assistant/prompt";
import { SEGMENT_GUIDE_SOURCE, type AssistantMetadata } from "@/lib/assistant/sources";
import { assistantTools } from "@/lib/assistant/tools";

// Strategy assistant endpoint (spec 008).
const MAX_HISTORY = 6; // messages sent to the model (008 §8)
const MAX_LOOKUPS = 5; // tool calls per question
const MAX_CHARS = 1000;

function json(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function textOf(m: UIMessage | undefined): string {
  return (m?.parts ?? [])
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

export async function POST(req: Request) {
  let body: { messages?: UIMessage[]; regenerate?: boolean };
  try {
    body = await req.json();
  } catch {
    return json(400, "Bad request.");
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const last = messages.at(-1);
  const question = textOf(last);
  if (last?.role !== "user" || !question) return json(400, "Ask a question first.");
  if (question.length > MAX_CHARS) return json(400, "That question is too long. Try a shorter one.");

  const visitor = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const limit = checkLimits(visitor);
  if (!limit.ok) return json(429, limit.message);

  const history = messages.slice(-MAX_HISTORY);
  const firstTurn = messages.length === 1;
  // Only first-turn Generate questions get prefetched data and the answer cache.
  const prefetched = firstTurn ? await prefetchFor(question) : undefined;

  let model;
  try {
    model = assistantModel({ useCache: Boolean(prefetched) && !body.regenerate });
  } catch (err) {
    if (err instanceof AssistantConfigError) {
      console.error("[assistant]", err.message);
      return json(503, "The assistant isn't set up yet. The rest of the dashboard still works.");
    }
    throw err;
  }

  const result = streamText({
    model,
    instructions: await buildInstructions(prefetched),
    messages: await convertToModelMessages(history),
    tools: assistantTools,
    // Up to 5 lookups, then the answer; stop as soon as a plan is shown.
    stopWhen: [isStepCount(MAX_LOOKUPS + 1), hasToolCall("present_strategy")],
    maxOutputTokens: 1200,
    maxRetries: 1,
    timeout: { totalMs: 30_000 },
    abortSignal: req.signal,
  });

  // Sources the model can cite that don't arrive as a tool result. Tool results
  // carry their own `source`; the chat checks every citation against both.
  const metadata: AssistantMetadata = {
    sources: [SEGMENT_GUIDE_SOURCE, ...(prefetched ? [prefetched.source] : [])],
  };

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      messageMetadata: ({ part }) => (part.type === "start" ? metadata : undefined),
      onError: (error) => {
        console.error("[assistant]", error);
        const msg = String((error as Error)?.message ?? "");
        if (/timeout|timed out|abort/i.test(msg)) return "That took too long. Try again.";
        return "The assistant is busy right now. The rest of the dashboard still works.";
      },
    }),
  });
}
