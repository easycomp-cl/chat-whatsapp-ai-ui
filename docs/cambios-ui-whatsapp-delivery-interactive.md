# Cambios UI — Ticks de entrega + mensajes interactivos

Contratos vigentes (backend implementado):

- `chat-whatsapp-ai/docs/to-front/whatsapp-delivery-status-ui.md`
- `chat-whatsapp-ai/docs/to-front/whatsapp-interactive-ui.md`

## Ticks enviado / entregado / visto

La UI ya soportaba `SENT` → `DELIVERED` → `READ` vía Realtime. Ajustes:

- Tooltip en `FAILED` usa `whatsapp_delivery_error_message` o código Meta.
- Parche Realtime actualiza también campos de error de entrega.
- Fetch de mensajes incluye `whatsapp_delivery_error_code` y `whatsapp_delivery_error_message`.

## Mensajes interactivos (`content_type: INTERACTIVE`)

- Nuevo componente `ChatInteractiveMessage`: preview de botones (≤3) o lista (≤10 filas).
- No son clicables en el dashboard (solo vista previa; el cliente responde en WhatsApp).
- Preview en citas / respuestas: `📋` + resumen de opciones.

## Migración Supabase

`supabase/migrations/20260731170000_messages_delivery_error_interactive_view.sql`

- Expone `interactive` desde `rawPayloadJson.outbound.interactive`
- Expone errores de entrega en la vista `messages`
- Añade columnas en `"Message"` si faltan (dev local)

También pendiente en remoto easycomp-chat-bot-manager: `20260731160000_profiles_personal_fields.sql` (Mi Perfil).

## Prueba

### Ticks

1. Enviar mensaje saliente.
2. Cliente recibe y abre chat en WhatsApp.
3. Sin F5: ✓✓ gris (entregado) → ✓✓ azul (visto).

### Interactivos

**Editor + envío desde el dashboard:**

1. Abrir una conversación.
2. Pulsar **+** → **Botones WA** o **Lista WA**.
3. El campo de texto desaparece y en su lugar aparece la burbuja verde editable (mismo sitio del composer).
4. Editas cuerpo, botones u opciones directamente ahí (campos vacíos; los textos de ejemplo solo aparecen como placeholder).
5. **Enviar** solo se habilita cuando el formulario es válido; si falta algo, toast + borde rojo en campos incompletos.
6. **X** arriba para volver al texto normal.

**Flujo real (bot / backend):**

1. Flujo con nodo `choice` (2–3 opciones).
2. Cliente dispara flujo en WhatsApp.
3. En dashboard: burbuja con body + botones/lista estilo WA.

**Menú +:** se quitó **Audio** (las notas de voz van por el micrófono).

## Nota

El doc `docs/pending/to-backend/backend-whatsapp-delivery-status-read.md` quedó **obsoleto**; el backend ya lo implementó.
