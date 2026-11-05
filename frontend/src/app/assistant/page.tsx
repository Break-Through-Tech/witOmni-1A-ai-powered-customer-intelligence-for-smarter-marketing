import { Suspense } from "react";
import { AssistantChat } from "@/components/assistant/chat";

// Strategy assistant page (spec 008).
export default function AssistantPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Strategy assistant</h1>
        <p className="mt-1 text-sm text-secondary">
          Ask in plain English. Answers use your customer data; numbers come from the dashboard, not guesses.
        </p>
      </header>
      {/* The question comes from the URL (?q=), known only at request time. */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[8px] bg-surface-1" />}>
        <AssistantChat />
      </Suspense>
    </>
  );
}
