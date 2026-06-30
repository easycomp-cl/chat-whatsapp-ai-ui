"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChatImportMessagesAction } from "@/lib/actions/chat-import-actions";
import type { ImportedMessage } from "@/lib/bot-api/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function MessagesPreviewPanel({
  importJobId,
}: {
  importJobId: string;
}) {
  const [messages, setMessages] = useState<ImportedMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [sampleOnly, setSampleOnly] = useState(false);
  const [pending, startTransition] = useTransition();
  const limit = 50;

  const loadMessages = useCallback(() => {
    startTransition(async () => {
      const result = await getChatImportMessagesAction(importJobId, {
        page: 1,
        limit,
        sender_role: "business",
      });
      setSampleOnly(result.sample_only ?? false);
      setMessages(result.items);
      setTotal(result.total);
    });
  }, [importJobId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {sampleOnly
          ? "Solo guardamos una muestra breve y anonimizada de cómo responde el negocio. No se almacena el chat completo ni los mensajes de clientes."
          : "Vista de respuestas del negocio detectadas en este análisis."}
      </p>

      {pending && messages.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : messages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay mensajes con este filtro.
        </p>
      ) : (
        <ScrollArea className="h-[420px] rounded-md border p-4">
          <div className="space-y-3">
            {messages.map((msg) => {
              const isBusiness = msg.sender_role === "business";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isBusiness ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isBusiness
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs opacity-80">
                      <span>{msg.sender_label ?? "Desconocido"}</span>
                      {msg.message_at && (
                        <span>
                          {format(new Date(msg.message_at), "dd/MM HH:mm", {
                            locale: es,
                          })}
                        </span>
                      )}
                      {msg.is_question && (
                        <Badge variant="secondary" className="text-[10px]">
                          Pregunta
                        </Badge>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">
                      {msg.content ?? msg.content_anonymized ?? ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} respuesta{total === 1 ? "" : "s"} de muestra
        </p>
      )}
    </div>
  );
}
