export type ContentType =
  | "TEXT"
  | "IMAGE"
  | "AUDIO"
  | "DOCUMENT"
  | "INTERACTIVE"
  | "TEMPLATE"
  | "SYSTEM_EVENT";

export type MessageSenderType = "CUSTOMER" | "BOT" | "HUMAN" | "SYSTEM";

export type SystemEventKind =
  | "profile_saved"
  | "profile_updated"
  | "handoff"
  | "mode_changed"
  | "plate_lookup"
  | "vehicle_identified"
  | "fitment_check"
  | "recommendation"
  | "suggestion"
  | "quote_prepared"
  | "mechanic_note";

export type SystemEventActor = "BOT" | "HUMAN";

export type SystemEventAppearance = "blue_pill" | "dark_card";

export type SystemEvent = {
  kind: SystemEventKind;
  actor: SystemEventActor;
  appearance: SystemEventAppearance;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
};

export type ProductHistorySource = "chat" | "quote" | "recommendation" | "purchase";

export type ProductHistoryItem = {
  product_id?: string;
  sku?: string;
  name: string;
  quantity?: number;
  vehicle_key?: string;
  source: ProductHistorySource;
  at: string;
};

export type CustomerVehicle = {
  key: string;
  plate?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  engine?: string;
  color?: string;
  fuel?: string;
  version?: string;
  source: string;
  last_seen_at: string;
};

export type CustomerGarage = {
  first_name: string | null;
  last_name: string | null;
  active_vehicle_key: string | null;
  vehicles: CustomerVehicle[];
  products_consulted: ProductHistoryItem[];
  products_quoted: ProductHistoryItem[];
  products_purchased: ProductHistoryItem[];
};
