"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { fixMojibake } from "@/lib/text-encoding";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PendingFaqSuggestion } from "@/lib/bot-api/types";
import { FaqSuggestionsPanel } from "./faq-suggestions-panel";

export function PendingFaqsPanel({
  suggestions,
}: {
  suggestions: PendingFaqSuggestion[];
}) {
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed bg-background/60 px-6 py-10 text-center">
        <HelpCircle className="mb-3 size-8 text-emerald-500/70" aria-hidden />
        <p className="font-medium">Sin FAQs pendientes</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Cuando analices chats, las preguntas frecuentes detectadas aparecerán
          aquí para que las apruebes, edites o descartes.
        </p>
      </div>
    );
  }

  const byJob = suggestions.reduce<Record<string, PendingFaqSuggestion[]>>(
    (acc, suggestion) => {
      const key = suggestion.import_job_id ?? "sin-job";
      acc[key] = acc[key] ?? [];
      acc[key]!.push(suggestion);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
        {suggestions.length} sugerencia{suggestions.length === 1 ? "" : "s"} por
        revisar
      </p>

      {Object.entries(byJob).map(([jobId, jobSuggestions]) => (
        <Card key={jobId} className="border bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <CardTitle className="text-base font-semibold">
              {fixMojibake(jobSuggestions[0]?.import_filename) || "Importación"}
            </CardTitle>
            {jobId !== "sin-job" && (
              <Link
                href={`/app/importar-chat/${jobId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Ver importación
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <FaqSuggestionsPanel
              suggestions={jobSuggestions}
              importJobId={jobId === "sin-job" ? "" : jobId}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
