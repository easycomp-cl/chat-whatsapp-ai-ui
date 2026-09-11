# Cambios UI — Imágenes y documentos en WhatsApp

**Fecha:** 2026-07-29  
**Backend requerido:** migración `20260729190000_message_media` en `chat-whatsapp-ai`, bucket `chat-media`.

## Resumen

El chat de conversaciones ahora muestra imágenes y documentos recibidos/enviados por WhatsApp, permite adjuntar archivos al composer del asesor y resuelve URLs de preview vía API del backend (nunca Storage directo).

## Cambios visibles

### Globos de mensaje

- `IMAGE` con media disponible: imagen inline + caption opcional.
- `DOCUMENT` con media disponible: tarjeta con nombre, tipo y enlace de descarga.
- Sin media (`has_media: false`): placeholder “Imagen no disponible” / nombre del documento.
- Reenvío de mensajes fallidos funciona también para IMAGE y DOCUMENT (sin restricción solo texto).

### Composer (modo humano)

- Botón **+** (abajo a la izquierda) abre globo tipo WhatsApp con: Imágenes (JPG/PNG), PDF, Excel y Word.
- Validación por tipo en el front antes de subir.
- Switch **Enter para enviar** alineado a la derecha en la misma fila.
- UI optimista con preview local hasta confirmación del backend.

## Archivos principales

| Área | Rutas |
|------|-------|
| Tipos | `types/database.types.ts` (`MessageMedia`) |
| Vista Supabase | `supabase/migrations/20260729190000_message_media_view.sql` |
| API cliente | `src/lib/bot-api/client.ts` |
| Actions | `src/lib/actions/app-actions.ts` |
| Rutas BFF | `src/app/api/messages/[messageId]/media-url/route.ts`, `media/file/route.ts` |
| Hook URL | `src/features/conversations/hooks/use-message-media-url.ts` |
| Preview media | `src/features/conversations/components/chat-media-preview.tsx` |
| Globo | `src/features/conversations/components/chat-message-bubble.tsx` |
| Composer | `src/features/conversations/components/reply-form.tsx` |

## Deploy

1. Aplicar migración Supabase `20260729190000_message_media_view.sql` (expone columna `media` en vista `messages`).
   - **Aplicada** en easycomp-chat-bot-manager (`pcbwycrgbuioumsopqbe`) el 2026-07-29.
   - Incluye `CREATE TABLE IF NOT EXISTS MessageMedia` si el backend aún no la había creado (ver `docs/pending/to-backend/backend-message-media-table-ui-bootstrap.md`).
2. Backend con endpoints `GET /messages/:id/media-url`, `POST /conversations/:id/messages/media`.
3. Variables `BOT_API_BASE_URL` y `BOT_API_SECRET` (ya usadas por el resto del chat).

## Media inbound recién llegado

Si `media-url` o `media/file` devuelven **404** unos segundos tras el mensaje, el backend aún está descargando el archivo desde Meta. La UI reintenta con backoff y cache-bust (`?v=`) para no quedarse con el 404 cacheado del navegador.


### Inbound

1. Enviar foto y PDF desde WhatsApp al negocio.
2. Abrir conversación: ver imagen y tarjeta de documento.
3. Verificar caption si el cliente envió texto junto al adjunto.

### Outbound

1. Modo humano → adjuntar `test.jpg` (< 5 MB) con caption.
2. Verificar llegada en WhatsApp del cliente y en el dashboard.
3. Adjuntar PDF (< 50 MB) sin caption.

### Errores

1. `.gif` → rechazo en UI antes de enviar.
2. Imagen > 5 MB → toast con límite.
3. Documento > 50 MB → toast con límite.

### Dev local (`backend_proxy: true`)

- Las imágenes usan `/api/messages/:id/media/file` como proxy autenticado.

### Resiliencia (2026-07-31)

- El hook `use-message-media-url` llama al BFF `GET /api/messages/:id/media-url` (ya no server action).
- Reintentos automáticos ante 502/503/504.
- Si el bot API falla, el BFF genera URL firmada **directo desde Supabase Storage** (`chat-media`) leyendo `MessageMedia.storagePath`.
- Si la URL firmada no carga en `<img>`, reintenta vía proxy `/api/messages/:id/media/file` (también con fallback Storage).

## Fuera de alcance

- Audio, video, stickers.
- Lightbox / galería avanzada.
- Edición de mensajes con media.
