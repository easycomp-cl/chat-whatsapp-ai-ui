-- Habilitar actualizaciones en tiempo real para el inbox del dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public."Message";
ALTER PUBLICATION supabase_realtime ADD TABLE public."Conversation";

-- Requerido para filtros en postgres_changes (ej. conversationId=eq.xxx)
ALTER TABLE public."Message" REPLICA IDENTITY FULL;
ALTER TABLE public."Conversation" REPLICA IDENTITY FULL;
