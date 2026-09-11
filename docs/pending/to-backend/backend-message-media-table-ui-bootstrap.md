# Backend — tabla MessageMedia creada desde UI (temporal)

**Contexto:** La migración UI `20260729190000_message_media_view.sql` incluye `CREATE TABLE IF NOT EXISTS public."MessageMedia"` porque en producción (easycomp-chat-bot-manager / `pcbwycrgbuioumsopqbe`) la tabla no existía al aplicar la vista.

## Acción backend

1. Verificar que la migración Prisma `20260729190000_message_media` coincide con:

```sql
MessageMedia (
  id TEXT PK,
  messageId TEXT UNIQUE FK -> Message(id),
  mimeType TEXT NOT NULL,
  filename TEXT,
  fileSize INTEGER,
  storagePath TEXT,
  createdAt TIMESTAMP(3),
  updatedAt TIMESTAMP(3)
)
```

2. Si Prisma define columnas adicionales (`waMediaId`, `downloadStatus`, etc.), aplicar `ALTER TABLE` en el siguiente deploy backend — `IF NOT EXISTS` evita conflicto si la tabla ya fue creada por la UI.

3. Confirmar que el backend persiste filas en `MessageMedia` al recibir/enviar media.

## Estado observado (2026-07-29)

Tras envío outbound de imagen por dashboard, WhatsApp entrega el mensaje pero en Supabase `MessageMedia` tenía **0 filas**. La vista `messages` devolvía `media.has_media: false` y la UI mostraba "Imagen no disponible".

**Acción requerida:** el backend debe insertar en `MessageMedia` al enviar/recibir media (migración Prisma `20260729190000_message_media` desplegada en ECS).

La UI ahora intenta `GET /messages/:id/media-url` cuando `content_type` es IMAGE/DOCUMENT y existe `external_id`, aunque `has_media` sea false en la vista.

## Sin acción si

- La migración Prisma ya se aplicó en el mismo entorno antes que la UI: la UI no modifica la tabla existente.
