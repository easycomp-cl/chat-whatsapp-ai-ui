import { cn } from "@/lib/utils";

export function ImportProgressBar({
  percent,
  step,
  className,
}: {
  percent: number;
  step?: string | null;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{step ?? "Procesando…"}</span>
        <span className="font-medium tabular-nums">{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function estimateImportProgress(job: {
  status: string;
  progress_percent?: number | null;
  started_at?: string | null;
}): { percent: number; step: string | null } {
  if (job.progress_percent != null && job.progress_percent > 0) {
    return {
      percent: job.progress_percent,
      step: null,
    };
  }

  if (job.status === "pending") {
    return { percent: 8, step: "En cola…" };
  }

  if (job.status === "processing" && job.started_at) {
    const elapsed = Date.now() - new Date(job.started_at).getTime();
    const estimated = Math.min(85, 15 + Math.floor(elapsed / 2000) * 5);
    return { percent: estimated, step: "Analizando con IA…" };
  }

  if (job.status === "processing") {
    return { percent: 20, step: "Analizando…" };
  }

  return { percent: 0, step: null };
}
