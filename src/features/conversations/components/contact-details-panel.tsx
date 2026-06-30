import { Clock, Globe, MessageCircle, Tag } from "lucide-react";
import { AiEventsAccordion } from "@/features/conversations/components/ai-events-accordion";
import { ConversationAvatar } from "@/features/conversations/components/conversation-avatar";
import { ModeBadge, StatusBadge } from "@/features/conversations/components/conversation-badges";
import { formatFullTime } from "@/lib/conversations/utils";
import type {
  Conversation,
  ConversationNote,
  Customer,
} from "@/types/database.types";

type ContactDetailsPanelProps = {
  conversation: Conversation & { customers: Customer | null };
  notes: ConversationNote[];
  events: Array<{ id: string; event_type: string; created_at: string }>;
};

export function ContactDetailsPanel({
  conversation,
  notes,
  events,
}: ContactDetailsPanelProps) {
  const customer = conversation.customers;
  const displayName = customer?.name ?? customer?.phone_number ?? "Contacto";

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-[#202022]/8 bg-[#f9fafc] xl:flex">
      <div className="border-b border-[#202022]/8 bg-white p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 w-fit">
          <ConversationAvatar
            name={customer?.name}
            phone={customer?.phone_number}
            seed={conversation.customer_id}
            size="lg"
          />
        </div>
        <h3 className="font-semibold text-[#202022]">{displayName}</h3>
        <a
          href={`https://wa.me/${customer?.phone_number?.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm text-[#25D366] transition-opacity hover:opacity-80"
        >
          <MessageCircle className="size-3.5" />
          {customer?.phone_number}
        </a>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-xl border border-[#202022]/8 bg-white p-4 shadow-sm">
          <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
            <Tag className="size-3.5 text-[#7678ed]" />
            Etiquetas
          </h4>
          <div className="flex flex-wrap gap-2">
            <ModeBadge mode={conversation.mode} />
            <StatusBadge status={conversation.status} />
            {conversation.handoff_reason && (
              <span className="rounded-full bg-[#ff7a55]/12 px-2.5 py-0.5 text-xs font-medium text-[#c44d2a]">
                Derivada
              </span>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#202022]/8 bg-white p-4 shadow-sm">
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
            Notas del contacto
          </h4>
          {notes.length === 0 ? (
            <p className="text-sm text-[#202022]/40">Sin notas internas</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-dashed border-amber-200 bg-amber-50/70 p-3 text-sm"
                >
                  <p className="text-[#202022]/80">{n.note}</p>
                  <p className="mt-1 text-[10px] text-amber-700/60">
                    {formatFullTime(n.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#202022]/8 bg-white p-4 shadow-sm">
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
            Información adicional
          </h4>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[#202022]/50">Canal</dt>
              <dd className="font-medium text-[#202022]">{conversation.channel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="flex items-center gap-1 text-[#202022]/50">
                <Clock className="size-3" /> Último mensaje
              </dt>
              <dd className="text-right text-xs text-[#202022]">
                {formatFullTime(conversation.last_message_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="flex items-center gap-1 text-[#202022]/50">
                <Globe className="size-3" /> Creada
              </dt>
              <dd className="text-right text-xs text-[#202022]">
                {formatFullTime(conversation.created_at)}
              </dd>
            </div>
          </dl>
        </section>

        <AiEventsAccordion events={events} />
      </div>
    </aside>
  );
}
