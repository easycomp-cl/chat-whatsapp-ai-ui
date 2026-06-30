export type UserRole = "SUPER_ADMIN" | "BUSINESS_ADMIN" | "AGENT";

export type Profile = {
  id: string;
  user_id: string;
  business_id: string | null;
  full_name: string | null;
  role: UserRole;
  agent_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  status: string;
  bot_global_enabled: boolean;
  default_ai_model: string;
  confidence_threshold: number;
  timezone: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  business_id: string;
  customer_id: string;
  channel: string;
  channel_phone_number: string;
  status: string;
  mode: "BOT" | "HUMAN";
  assigned_admin_id: string | null;
  handoff_reason: string | null;
  bot_resume_at: string | null;
  last_message_at: string;
  chat_cleared_at: string | null;
  created_at: string;
  updated_at: string;
  customers?: Customer | null;
};

export type Customer = {
  id: string;
  business_id: string;
  phone_number: string;
  name: string | null;
};

export type MessageReaction = {
  emoji: string;
  sender_type: string;
  sender_phone?: string | null;
  created_at: string;
};

export type MessageReactionRow = {
  id: string;
  tenantId: string;
  conversationId: string;
  messageId: string;
  emoji: string;
  senderType: string;
  senderPhone: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  business_id: string;
  customer_id?: string | null;
  direction: string;
  sender_type: string;
  sender_phone?: string | null;
  receiver_phone?: string | null;
  content_text: string;
  content_type?: string | null;
  external_id?: string | null;
  ai_generated: boolean;
  created_at: string;
  reply_to_message_id?: string | null;
  quoted_text?: string | null;
  quoted_sender_type?: string | null;
  reactions?: MessageReaction[];
};

export type Faq = {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  category: string | null;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type KnowledgeDocument = {
  id: string;
  business_id: string;
  title: string;
  source_type: string;
  file_url: string | null;
  raw_text: string | null;
  status: "PENDING" | "INDEXED" | "ERROR";
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessAgent = {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  role: string;
  notify_on_handoff: boolean;
  is_primary: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ConversationNote = {
  id: string;
  business_id: string;
  conversation_id: string;
  user_id: string;
  note: string;
  created_at: string;
};

export type UsageEvent = {
  id: string;
  business_id: string;
  conversation_id: string | null;
  event_type: string;
  tokens_input: number | null;
  tokens_output: number | null;
  estimated_cost: number | null;
  created_at: string;
};

export type MetricsSummary = {
  total_messages_received: number;
  total_ai_responses: number;
  total_faq_responses: number;
  total_rag_responses: number;
  total_human_handoffs: number;
  estimated_ai_cost: number;
  estimated_hours_saved: number;
  conversations_count?: number;
};

export type TopQuestion = {
  question: string;
  count: number;
  last_asked_at?: string;
  answered_by?: string;
};

export type DailyUsage = {
  date: string;
  messages: number;
  ai_responses: number;
  estimated_cost: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      conversation_notes: {
        Row: ConversationNote;
        Insert: Omit<ConversationNote, "id" | "created_at">;
        Update: Partial<ConversationNote>;
        Relationships: [];
      };
      businesses: {
        Row: Business;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      customers: {
        Row: Customer;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      MessageReaction: {
        Row: MessageReactionRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      faqs: {
        Row: Faq;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      knowledge_documents: {
        Row: KnowledgeDocument;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      business_agents: {
        Row: BusinessAgent;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      usage_events: {
        Row: UsageEvent;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      whatsapp_accounts: {
        Row: {
          id: string;
          business_id: string;
          phone_number: string;
          phone_number_id: string;
          status: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
