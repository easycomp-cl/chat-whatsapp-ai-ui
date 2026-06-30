import { notFound } from "next/navigation";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { BotApiError } from "@/lib/bot-api/client";
import {
  getChatImportFaqSuggestionsAction,
  getChatImportJobAction,
  getChatImportToneAction,
} from "@/lib/actions/chat-import-actions";
import { ChatImportJobView } from "@/features/chat-import/components/chat-import-job-view";

export default async function ImportarChatJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireBusinessAdmin();
  const { jobId } = await params;

  let job;
  try {
    job = await getChatImportJobAction(jobId);
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) notFound();
    throw error;
  }

  const isCompleted = job.status === "completed";
  const [tone, suggestions] = isCompleted
    ? await Promise.all([
        getChatImportToneAction(jobId),
        getChatImportFaqSuggestionsAction(jobId),
      ])
    : [null, []];

  return (
    <ChatImportJobView
      importJobId={jobId}
      initialJob={job}
      initialTone={tone}
      initialSuggestions={suggestions}
    />
  );
}
