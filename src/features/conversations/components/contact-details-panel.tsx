"use client";

import { MessageCircle, PanelRightClose, Tag, Workflow } from "lucide-react";
import { FLOW_RUN_STATUS_LABELS } from "@/lib/flows/utils";
import { AiEventsAccordion } from "@/features/conversations/components/ai-events-accordion";
import { ActivateFlowsAccordion } from "@/features/conversations/components/activate-flows-accordion";
import { ContactExtraInfoAccordion } from "@/features/conversations/components/contact-extra-info-accordion";
import { ContactNotesSection } from "@/features/conversations/components/contact-notes-section";
import { CustomerFrequentToggle } from "@/features/conversations/components/customer-frequent-toggle";
import { CustomerProfileSection } from "@/features/conversations/components/customer-profile-section";
import { ConversationAvatar } from "@/features/conversations/components/conversation-avatar";
import { ModeBadge, StatusBadge } from "@/features/conversations/components/conversation-badges";
import { useInboxColumnLayoutContext } from "@/features/conversations/context/inbox-column-layout-context";
import { cn } from "@/lib/utils";
import { resolveCustomerDisplayName } from "@/lib/customers/resolve-display-name";
import type {
  DeliveryRegion,
  ConversationFlowState,
  FlowDefinition,
} from "@/lib/bot-api/types";
import type {
  Conversation,
  ConversationNoteWithAuthor,
  Customer,
} from "@/types/database.types";

type ContactDetailsPanelProps = {
  businessId: string;
  conversation: Conversation & { customers: Customer | null };
  flowState?: ConversationFlowState | null;
  notes: ConversationNoteWithAuthor[];
  events: Array<{ id: string; event_type: string; created_at: string }>;
  canEditCustomerProfile: boolean;
  deliveryRegions: DeliveryRegion[];
  activatableFlows?: FlowDefinition[];
};

export function ContactDetailsPanel({
  businessId,
  conversation,
  flowState = null,
  notes,
  events,
  canEditCustomerProfile,
  deliveryRegions,
  activatableFlows = [],
}: ContactDetailsPanelProps) {
  const {
    isContactCompact,
    contactOverlayOpen,
    contactPanelAvailable,
    toggleContactCollapsed,
  } = useInboxColumnLayoutContext();
  const showDesktopColumnClose = contactPanelAvailable && !contactOverlayOpen;
  const customer = conversation.customers;
  const displayName = resolveCustomerDisplayName(customer);
  const hasAlias = Boolean(customer?.display_alias?.trim());
  const whatsappSubtitle =
    hasAlias && customer?.name?.trim() ? customer.name : null;

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-[#f9fafc]",
        !contactOverlayOpen && "border-l border-[#202022]/8"
      )}
    >
      {showDesktopColumnClose && (
        <div className="flex shrink-0 items-center justify-end border-b border-[#202022]/8 bg-white px-2 py-2">
          <button
            type="button"
            onClick={toggleContactCollapsed}
            className="rounded-lg p-2 text-[#202022]/40 transition-colors hover:bg-[#f9fafc] hover:text-[#7678ed]"
            aria-label="Ocultar información del contacto"
            title="Ocultar información del contacto"
          >
            <PanelRightClose className="size-4" />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className={cn(
          "border-b border-[#202022]/8 bg-white text-center shadow-sm",
          isContactCompact ? "p-3" : "p-5"
        )}
      >
        <div className="mx-auto mb-3 w-fit">
          <ConversationAvatar
            name={customer?.name}
            phone={customer?.phone_number}
            seed={conversation.customer_id}
            size="lg"
          />
        </div>
        <h3 className={cn("font-semibold text-[#202022]", isContactCompact && "text-sm")}>
          {displayName}
        </h3>
        {whatsappSubtitle && (
          <p className="mt-0.5 text-xs text-[#202022]/45">WhatsApp: {whatsappSubtitle}</p>
        )}
        <a
          href={`https://wa.me/${customer?.phone_number?.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center justify-center gap-1 text-sm text-[#25D366] transition-opacity hover:opacity-80"
        >
          <MessageCircle className="size-3.5" />
          {customer?.phone_number}
        </a>

        <ContactExtraInfoAccordion
          channel={conversation.channel}
          lastMessageAt={conversation.last_message_at}
          conversationCreatedAt={conversation.created_at}
          whatsappName={customer?.name}
          showWhatsappName={!hasAlias}
        />
      </div>

      <div className={cn("space-y-4", isContactCompact ? "p-2.5" : "p-4")}>
        {customer && (
          <CustomerFrequentToggle
            businessId={businessId}
            conversationId={conversation.id}
            customerId={customer.id}
            canEdit={canEditCustomerProfile}
            profileMetadata={customer.profile_metadata}
          />
        )}

        <CustomerProfileSection
          conversationId={conversation.id}
          customer={customer}
          canEdit={canEditCustomerProfile}
          deliveryRegions={deliveryRegions}
        />

        <ContactNotesSection conversationId={conversation.id} notes={notes} />

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

        {flowState?.active_flow_run && (
          <section className="rounded-xl border border-[#7678ed]/20 bg-[#7678ed]/5 p-4 shadow-sm">
            <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#7678ed]">
              <Workflow className="size-3.5" />
              Flujo activo
            </h4>
            <p className="text-sm font-medium text-[#202022]">
              {"flow_name" in flowState.active_flow_run
                ? flowState.active_flow_run.flow_name
                : "Flujo en curso"}
            </p>
            <p className="mt-1 text-xs text-[#202022]/55">
              {FLOW_RUN_STATUS_LABELS[flowState.active_flow_run.status]}
            </p>
            {flowState.active_flow_run.status === "AWAITING_REVIEW" && (
              <a
                href="/app/flujos/revisiones"
                className="mt-2 inline-block text-xs font-medium text-[#7678ed] hover:underline"
              >
                Ir a revisiones pendientes
              </a>
            )}
          </section>
        )}

        <ActivateFlowsAccordion
          conversationId={conversation.id}
          flows={activatableFlows}
          flowState={flowState}
        />

        <AiEventsAccordion events={events} />
      </div>
      </div>
    </aside>
  );
}
