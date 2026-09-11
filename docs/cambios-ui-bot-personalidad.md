# Configuración de personalidad del bot

> **Fecha:** 2026-07-31  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend:** `GET/PATCH /businesses/:id/bot-personality` (ya desplegado)

## Qué cambió en la UI

Nueva pestaña **Bot** en **Configuración** (`/app/settings`) con cuatro sub-pestañas:

| Sub-pestaña | Campos editables |
|-------------|------------------|
| **Identidad** | `bot_name`, `bot_tone`, `greeting_message`, `fallback_message` |
| **Saludos** | `tone_greetings`, `greeting_config` (tono cliente nuevo/frecuente, umbral de mensajes, combinar saludo+FAQ) |
| **Respuestas automáticas** | `conversational_responses` por trigger (variantes, modo de selección, activar/desactivar) |
| **Derivación** | `handoff_on_low_confidence`, `handoff_message`, `out_of_hours_message` |

La pestaña **Mensajes** (placeholder) fue reemplazada por **Bot**, que cubre esos mensajes y más.

## Archivos principales

- `src/features/bot-config/components/bot-settings-panel.tsx` — contenedor con sub-tabs
- `src/lib/bot-api/client.ts` — `getBotPersonality`, `patchBotPersonality`
- `src/lib/actions/bot-personality-actions.ts` — server action de guardado
- `src/features/settings/components/settings-form.tsx` — integración en Configuración

## API requerida

- `GET /businesses/:id/bot-personality` — carga inicial
- `PATCH /businesses/:id/bot-personality` — guardado parcial por sección

Autenticación: `X-API-Key` vía `BOT_API_SECRET` (mismo patrón que el resto del bot API).

## Comportamiento visible

- Vista previa en vivo de placeholders (`{nombre}`, `{negocio}`, `{bot}`, `{saludo}`) con datos de ejemplo.
- Los triggers (`greeting_pure`, `thanks`, etc.) se renderizan desde el GET; no están hardcodeados en front.
- Si el backend no responde, se muestra mensaje de error en la pestaña Bot.
- Validación cliente: máx. 20 variantes por trigger, texto máx. 500 caracteres.
- Los saludos importados desde **Importar chat** se muestran y pueden editarse sin perder el flujo de importación.

## Cómo probar

1. Ir a **Configuración → Bot**.
2. Editar nombre del bot y saludo base → **Guardar identidad**.
3. Agregar saludos sugeridos y ajustar tono cliente nuevo/frecuente → **Guardar saludos**.
4. En **Respuestas automáticas**, agregar 2 variantes en «Gracias» → **Guardar respuestas**.
5. Verificar por WhatsApp:
   - `holiii` → saludo (no handoff)
   - `gracias` → variante configurada
   - `hola estan atendiendo?` → responde la pregunta, no solo saluda

## Migraciones Supabase

Ninguna. La configuración vive en `TenantConfig` del backend.
