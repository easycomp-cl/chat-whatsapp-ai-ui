"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type ChatImportSyncContextValue = {
  notifyJobsQueued: (jobIds: string[]) => void;
  watching: boolean;
};

const ChatImportSyncContext = createContext<ChatImportSyncContextValue | null>(
  null
);

export function useChatImportSync() {
  const ctx = useContext(ChatImportSyncContext);
  if (!ctx) {
    throw new Error("useChatImportSync debe usarse dentro de ChatImportSyncProvider");
  }
  return ctx;
}

export function useChatImportSyncOptional() {
  return useContext(ChatImportSyncContext);
}

function AnalysisProgressBanner() {
  return (
    <div
      role="status"
      className="mb-2 flex items-center gap-3 rounded-xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm shadow-sm dark:border-sky-800 dark:bg-sky-950/40"
    >
      <Loader2 className="size-5 shrink-0 animate-spin text-sky-600" />
      <div>
        <p className="font-semibold text-sky-900 dark:text-sky-100">
          Paso 1 en curso: analizando tu chat…
        </p>
        <p className="text-sky-800/80 dark:text-sky-200/80">
          En unos segundos se actualizarán el tono, las FAQs y el historial.
        </p>
      </div>
    </div>
  );
}

export function ChatImportSyncProvider({
  children,
  hasActiveJobs,
}: {
  children: ReactNode;
  hasActiveJobs: boolean;
}) {
  const router = useRouter();
  const [queuedJobIds, setQueuedJobIds] = useState<string[]>([]);
  const hadActiveRef = useRef(hasActiveJobs);
  const watching = hasActiveJobs || queuedJobIds.length > 0;

  function notifyJobsQueued(jobIds: string[]) {
    setQueuedJobIds((prev) => [...new Set([...prev, ...jobIds])]);
  }

  useEffect(() => {
    if (!watching) return;
    router.refresh();
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [watching, router]);

  useEffect(() => {
    if (hasActiveJobs) {
      hadActiveRef.current = true;
      return;
    }
    if (hadActiveRef.current && queuedJobIds.length > 0) {
      const timeout = setTimeout(() => {
        setQueuedJobIds([]);
        hadActiveRef.current = false;
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [hasActiveJobs, queuedJobIds.length]);

  return (
    <ChatImportSyncContext.Provider value={{ notifyJobsQueued, watching }}>
      <div className="space-y-6">
        {watching && <AnalysisProgressBanner />}
        {children}
      </div>
    </ChatImportSyncContext.Provider>
  );
}
