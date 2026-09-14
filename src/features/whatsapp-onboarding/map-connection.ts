import type { WhatsappConnectionRecord } from "@/lib/whatsapp/types";
import type { WhatsappConnectionView } from "./types";

export function toWhatsappConnectionView(
  record: WhatsappConnectionRecord | null | undefined
): WhatsappConnectionView | null {
  if (!record?.connected) return null;
  return {
    connected: true,
    persisted: record.persisted,
    status: "connected",
    phoneNumber: record.phone_number,
    phoneNumberId: record.phone_number_id,
    wabaId: record.waba_id,
    metaBusinessId: record.business_id,
    message: record.message,
  };
}
