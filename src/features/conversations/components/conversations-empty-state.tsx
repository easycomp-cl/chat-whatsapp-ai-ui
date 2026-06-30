import { MessageSquare } from "lucide-react";

export function ConversationsEmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center bg-[#f9fafc] text-center">
      <div className="mb-5 flex size-20 items-center justify-center rounded-2xl bg-white shadow-[0_4px_24px_rgba(118,120,237,0.15)]">
        <MessageSquare className="size-10 text-[#7678ed]" />
      </div>
      <h2 className="text-xl font-semibold text-[#202022]">ConversAI Inbox</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#202022]/50">
        Selecciona una conversación de la lista para ver el historial de mensajes,
        cambiar el modo BOT/HUMAN y agregar notas internas.
      </p>
    </section>
  );
}
