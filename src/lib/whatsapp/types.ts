export type WhatsappConnectionRecord = {
  connected: boolean;
  persisted: boolean;
  phone_number?: string | null;
  phone_number_id?: string | null;
  waba_id?: string | null;
  business_id?: string | null;
  status: string;
  message?: string;
};
