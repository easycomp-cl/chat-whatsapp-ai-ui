# Cambios UI — deshabilitar editar mensaje WhatsApp

> **Fecha:** 2026-07-28  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend relacionado:** `PATCH /messages/:id` (HTTP 501 — cerrado), ver [docs/pending/done/backend-editar-mensaje-whatsapp.md](../pending/done/backend-editar-mensaje-whatsapp.md)

## Resumen

Se oculta el botón **Editar** en burbujas salientes del asesor. La WhatsApp Cloud API no soporta editar mensajes enviados por API: el intento anterior devolvía 200 pero **enviaba un mensaje duplicado** al cliente en lugar de marcar el original como editado.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/lib/conversations/delivery-status.ts` | `canEditWhatsappMessage` devuelve `false` (flag `WHATSAPP_CLOUD_API_SUPPORTS_OUTBOUND_EDIT`) |

## Dependencias de deploy

1. Backend `chat-whatsapp-ai` con `PATCH /messages/:id` → **501** (evita duplicados si alguien llama la API directamente).
2. Deploy UI en Vercel tras merge del cambio en `delivery-status.ts`.

## Cómo probar

1. Abrir una conversación con mensaje saliente humano reciente (< 15 min).
2. Confirmar que **no** aparece el ícono de lápiz al pasar el mouse sobre la burbuja.
3. (Opcional) `PATCH /messages/:id` con API key debe responder 501 con mensaje explicativo.

## Nota para el usuario final

Si hubo un error de tipeo en WhatsApp, la corrección debe hacerse enviando un **mensaje nuevo** desde el dashboard; no existe edición in-place vía Cloud API hoy.
