# Audios y notas de voz en el chat

> **Fecha:** 2026-07-31  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend:** `GET/PATCH` conversaciones, `POST /conversations/:id/messages/media`, `GET /messages/:id/media-url`

## Qué cambió en la UI

### Composer (asesor humano)

- Con la caja de texto **vacía** y sin adjunto, el botón de enviar se reemplaza por un **micrófono**.
- **1.er clic:** inicia la grabación (indicador rojo + duración).
- **2.º clic:** detiene la grabación y muestra vista previa con reproductor `<audio controls>`.
- **3.er clic** (botón enviar): manda la nota de voz por WhatsApp.
- También se puede adjuntar audio desde el menú **+** (OGG, MP3, M4A, etc., máx. 16 MB).

### Burbujas de mensaje

- Mensajes `content_type: AUDIO` muestran reproductor de audio.
- Si hay `audio_transcript` (o `content_text` transcrito), se muestra debajo del reproductor.
- Estados: «Transcribiendo…», «Sin transcripción», «Audio no disponible».

### Inbox / citas

- Preview de respuesta con prefijo 🎤 y texto transcrito cuando existe.

## Archivos principales

| Archivo | Rol |
|---------|-----|
| `src/features/conversations/components/reply-form.tsx` | Mic / grabar / enviar |
| `src/features/conversations/hooks/use-voice-recorder.ts` | MediaRecorder + blob |
| `src/features/conversations/components/chat-audio-player.tsx` | Reproductor en burbuja |
| `src/lib/conversations/message-media.ts` | Tipos AUDIO, validación 16 MB |
| `supabase/migrations/20260731140000_message_audio_transcript_view.sql` | Vista `audio_transcript` |

## API requerida

- `POST /conversations/:id/messages/media` con `file` (audio)
- `GET /messages/:id/media-url` (mismo proxy BFF que imágenes)
- Columna Prisma `audioTranscript` en `Message` (backend)

## Cómo probar

1. Abrir un chat → ver botón micrófono con input vacío.
2. Grabar nota de voz → escuchar preview → enviar.
3. Recibir nota de voz del cliente → reproductor + transcripción (puede tardar unos segundos).
4. Adjuntar `.mp3` desde menú + → llega como audio en WhatsApp.

## Migración Supabase

1. `20260731140000_message_audio_transcript_view.sql` — añade columna `audio_transcript` (NULL hasta que el backend tenga `audioTranscript`).
2. `20260731140100_message_audio_transcript_column.sql` — aplicar **después** del deploy backend con `audioTranscript`.

Si las imágenes dejaron de verse tras el cambio de audio, verificar que la vista `messages` siga exponiendo `media` (no caer al SELECT legacy sin esa columna). El fetch ahora hace fallback en cascada: completo → sin `audio_transcript` → legacy.
