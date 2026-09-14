export type EmbeddedSignupFinishEvent =
  | "FINISH"
  | "FINISH_ONLY_WABA"
  | "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"
  | "FINISH_OBO_MIGRATION"
  | "FINISH_GRANT_ONLY_API_ACCESS";

export type EmbeddedSignupSessionData = {
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  waba_ids?: string[];
};

export type EmbeddedSignupMessage = {
  type?: string;
  event?: string;
  version?: number | string;
  data?: EmbeddedSignupSessionData & {
    current_step?: string;
    error_message?: string;
    error_id?: string;
  };
};

export type EmbeddedSignupCapture = {
  code?: string | null;
  phone_number_id?: string | null;
  waba_id?: string | null;
  business_id?: string | null;
  event?: string | null;
};

export type WhatsappConnectUiStatus =
  | "idle"
  | "sdk_loading"
  | "connecting"
  | "completing"
  | "connected"
  | "cancelled"
  | "error";

export type WhatsappConnectionView = {
  connected: boolean;
  persisted: boolean;
  status: WhatsappConnectUiStatus;
  phoneNumber?: string | null;
  phoneNumberId?: string | null;
  wabaId?: string | null;
  metaBusinessId?: string | null;
  message?: string | null;
};

export type CompleteEmbeddedSignupInput = {
  code: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  redirect_uri?: string;
};

export type FacebookOauthPayload = {
  code?: string | null;
  error?: string | null;
  error_reason?: string | null;
  error_description?: string | null;
  redirect_uri?: string | null;
};
