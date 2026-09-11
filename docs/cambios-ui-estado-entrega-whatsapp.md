# Cambios UI — estado de entrega WhatsApp

> **Fecha:** 2026-07-28 (actualizado)  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend requerido:** ver [docs/pending/to-backend/backend-whatsapp-delivery-status-read.md](../pending/to-backend/backend-whatsapp-delivery-status-read.md)

## Resumen

La UI muestra el estado de entrega de mensajes salientes (bot o asesor) con ticks al estilo WhatsApp y actualización en tiempo real vía Supabase Realtime.

## Estados visibles

| Estado BD (`whatsapp_delivery_status`) | UI |
|----------------------------------------|-----|
| `pending` | Reloj + "Enviando a WhatsApp…" |
| `sent` | ✓ gris + "Enviado" |
| `delivered` | ✓✓ gris + "Entregado" |
| `read` | ✓✓ azul + "Visto" |
| `failed` | ⚠ "No entregado" + botón **Reenviar** |

Sin estado en BD: se infiere por `external_id` y antigüedad (`delivery-status.ts`).

## Archivos UI

| Archivo | Cambio |
|---------|--------|
| `src/lib/conversations/delivery-status.ts` | Estados sent/delivered/read + merge |
| `src/features/conversations/components/message-delivery-status.tsx` | Ticks y etiquetas |
| `src/lib/conversations/patch-realtime-message.ts` | Parche Realtime |
| `src/features/conversations/hooks/use-live-conversation.ts` | UPDATE instantáneo |
| `src/lib/conversations/merge-messages.ts` | Fusiona estado al sincronizar |

## Dependencias de deploy

1. **Backend** implementa webhooks `statuses` y enum `DELIVERED`/`READ` (doc pendiente).
2. Vista `messages` con `whatsapp_delivery_status` (migración UI existente).
3. Realtime habilitado en tabla `Message`.
4. `BOT_API_BASE_URL` y reenvío (`POST /messages/:id/resend`) operativos.

## Probar

1. Tras deploy backend + UI, enviar mensaje en modo humano.
2. Confirmar: reloj → ✓ Enviado → ✓✓ Entregado → ✓✓ azul Visto (si el cliente abre el chat y tiene lecturas activas).
