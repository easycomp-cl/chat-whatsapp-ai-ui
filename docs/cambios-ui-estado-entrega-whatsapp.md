# Cambios UI — estado de entrega WhatsApp

> **Fecha:** 2026-07-11  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend relacionado:** `POST /messages/:id/resend`, campo `whatsappDeliveryStatus` en `Message`

## Resumen

La UI muestra si un mensaje saliente (bot o asesor) llegó o no a WhatsApp, y permite reenvío manual cuando falló.

## Estados visibles

| Estado BD (`whatsapp_delivery_status`) | UI |
|----------------------------------------|-----|
| `pending` | Reloj + "Enviando a WhatsApp…" |
| `sent` | ✓✓ "Entregado" |
| `failed` | ⚠ "No entregado" + botón **Reenviar** |

Mensajes antiguos sin estado: se infiere por `external_id` (null + >20 s = fallido).

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/lib/conversations/delivery-status.ts` | Resuelve estado para el front |
| `src/features/conversations/components/message-delivery-status.tsx` | Iconos + botón Reenviar |
| `src/features/conversations/components/chat-message-bubble.tsx` | Muestra estado en burbujas salientes |
| `src/features/conversations/components/chat-window.tsx` | Refresh tras reenvío |
| `src/lib/actions/app-actions.ts` | `resendMessageAction` |
| `src/lib/bot-api/client.ts` | `resendMessage()` |
| `src/lib/conversations/fetch-conversation-messages.ts` | Select incluye `whatsapp_delivery_status` |
| `types/database.types.ts` | Tipo `Message.whatsapp_delivery_status` |
| `supabase/migrations/20260711230000_whatsapp_delivery_status.sql` | Vista `messages` actualizada |

## Dependencias de deploy

1. Migración Supabase aplicada (vista `messages` con `whatsapp_delivery_status`).
2. Backend desplegado con `POST /messages/:id/resend`.
3. Vercel con `BOT_API_BASE_URL` y `BOT_API_SECRET` correctos.

## Probar

1. Login en `https://conversai.easycomp.cl`.
2. Abrir conversación con mensaje outbound fallido (`external_id` null).
3. Ver "No entregado" y botón **Reenviar**.
4. Tras token válido en backend, Reenviar → debe pasar a "Entregado".

## API usada

```http
POST /messages/:messageId/resend
X-API-Key: <BOT_API_SECRET>
```

Respuesta 200: `{ external_id, whatsapp_delivery_status: "SENT", ... }`
