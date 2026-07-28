# Cambios UI — mensajes del cliente editados o eliminados en WhatsApp

> **Fecha:** 2026-07-28  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend:** migración `20260728140000_customer_message_changes`, webhooks `edit` / `revoke`

## Resumen

Cuando un cliente edita o borra un mensaje en WhatsApp, el dashboard se actualiza en vivo (Supabase Realtime + `UPDATE` en `Message`). Los **admins** ven el historial completo; los **agentes** solo ven el estado actual (como en WhatsApp).

## Campos nuevos en `messages` (vista Supabase)

| Campo | Uso |
|-------|-----|
| `content_text` | Texto actual (editado o placeholder si fue borrado) |
| `content_text_snapshot` | Texto antes del cambio (auditoría admin) |
| `customer_edited_at` | Timestamp edición del cliente |
| `customer_revoked_at` | Timestamp borrado del cliente |

## Comportamiento por rol

| Rol | Mensaje editado | Mensaje eliminado |
|-----|-----------------|-------------------|
| `BUSINESS_ADMIN` / `SUPER_ADMIN` | Texto nuevo + badge + desplegable “texto original” | Texto original tachado + badge “Eliminado por el cliente” |
| `AGENT` | Solo texto nuevo | Solo “Mensaje eliminado por el usuario” |

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260728140000_customer_message_changes.sql` | Vista `messages` con campos nuevos |
| `types/database.types.ts` | Tipos `Message` |
| `src/lib/conversations/fetch-conversation-messages.ts` | SELECT columnas |
| `src/lib/conversations/customer-message-change.ts` | Helpers de estado |
| `src/lib/rbac.ts` | `canViewCustomerMessageAudit` |
| `src/features/conversations/components/message-customer-change-badge.tsx` | Badge + original (admin) |
| `src/features/conversations/components/chat-message-bubble.tsx` | Texto según rol |
| `src/features/conversations/components/chat-window.tsx` | Prop `showCustomerMessageAudit` |
| `src/app/app/conversations/[id]/page.tsx` | Pasa flag según rol |

## Dependencias de deploy

1. **Backend:** `prisma migrate deploy` con `20260728140000_customer_message_changes`.
2. **Supabase:** aplicar la migración SQL de la vista `messages` (mismo timestamp).
3. **UI:** deploy Vercel tras merge.

Realtime ya escucha `UPDATE` en `Message` (`use-live-conversation.ts`); no requiere cambios.

## Cómo probar

1. Como admin, abrir conversación con un cliente.
2. Cliente envía mensaje → aparece en dashboard.
3. Cliente **edita** el mensaje en WhatsApp (< 15 min):
   - Admin: texto actualizado en vivo + “Editado por el cliente” + ver original.
   - Agente (otra sesión): solo texto nuevo.
4. Cliente **borra** otro mensaje:
   - Admin: texto original tachado + “Eliminado por el cliente”.
   - Agente: placeholder sin contenido original.
