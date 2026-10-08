# Backend — Timeout de modo humano (30 min → BOT)

**Repo:** `chat-whatsapp-ai`  
**UI:** lista en este repo (`docs/cambios-ui-human-mode-timeout.md`).  
**Fecha:** 2026-10-08

## Qué bloquea en la UI

El badge **Modo humano / Modo BOT** y el toggle ya funcionan con `conversation.mode`. Falta que el backend:

1. Persista y **devuelva** `human_mode_until` en los datos de la conversación.
2. Pase esa conversación a BOT a los 30 min sin respuesta y escriba el evento `bot_mode_resumed`.

Hasta que el campo no venga (`undefined`), la UI no muestra contador (comportamiento actual).

## Regla de negocio

- Aplica **solo a la conversación** en modo `HUMAN`. Nunca al switch global (`bot_global_enabled` / `botGlobalEnabled`).
- A los **30 minutos sin respuesta** (definir en backend qué cuenta como respuesta: p. ej. mensaje outbound humano), esa conversación vuelve a `mode = BOT`.
- Un toggle manual a BOT o a HUMAN debe seguir funcionando; al pasar a BOT, `human_mode_until` queda `null`. Al pasar a HUMAN, se (re)calcula `now + 30 min`.

## Contrato API / BD

Campo opcional y compatible:

| Nombre UI / vista | Prisma probable | Tipo | Semántica |
|-------------------|-----------------|------|-----------|
| `human_mode_until` | `humanModeUntil` (o reutilizar `botResumeAt` **aliasado** en la vista) | `timestamptz` / string ISO 8601 | Hora en que vuelve a BOT. `null` si `mode = BOT`. |

Devolverlo en:

- `GET /conversations/:id`
- `GET /businesses/:id/conversations/inbox`
- Vista `public.conversations` (el chat abierto hace `select *` y `useLiveConversation.refresh()`)

Ejemplo:

```json
{
  "id": "<conversationId>",
  "mode": "HUMAN",
  "human_mode_until": "2026-10-08T21:15:00.000Z"
}
```

```json
{
  "id": "<conversationId>",
  "mode": "BOT",
  "human_mode_until": null
}
```

Si reutilizan la columna ya existente `"botResumeAt"` (`bot_resume_at` en la vista), aliasarla también como `human_mode_until` para no romper clientes que aún leen `bot_resume_at`.

## Evento de hilo

Al volver a BOT por timeout, insertar un `Message` interno (no WhatsApp), igual que el handoff:

- `senderType: SYSTEM`
- `contentType: SYSTEM_EVENT`
- `rawPayloadJson.system_event`:

```json
{
  "kind": "bot_mode_resumed",
  "actor": "BOT",
  "appearance": "blue_pill",
  "title": "Volvió a modo BOT (30 min sin respuesta)",
  "body": ""
}
```

Si solo mandan `content_text` con ese título, la UI también lo infiere. Preferible el JSON con `kind`.

## Webhooks / workers

- Worker o job que, con `mode = HUMAN` y `human_mode_until <= now()`, setea `mode = BOT`, `human_mode_until = null` (y limpia handoff/asignación si aplica) y persiste el evento.
- Recalcular `human_mode_until` cuando el asesor responde (si la regla es “30 min sin respuesta”).
- Realtime: un `UPDATE` en `"Conversation"` basta; la UI ya se suscribe y refresca.

## Migración sugerida (spec, no aplicar desde este repo)

```sql
-- Si NO reutilizan botResumeAt:
ALTER TABLE public."Conversation"
  ADD COLUMN IF NOT EXISTS "humanModeUntil" TIMESTAMPTZ;

-- En public.conversations, exponer:
--   "humanModeUntil" AS human_mode_until
-- o, si reutilizan la columna existente:
--   "botResumeAt" AS human_mode_until
```

## Pasos de prueba e integración

1. Pasar un chat a humano → API/vista traen `human_mode_until` ~30 min al futuro. La UI muestra el contador.
2. Esperar (o adelantar el timestamp) → `mode` pasa a `BOT`, campo `null`, aparece el globo `bot_mode_resumed`. El bot global no cambia.
3. Toggle manual a BOT antes del timeout → sin evento de timeout (o el que definan para modo manual); `human_mode_until` null.
4. Campo ausente en un entorno viejo → UI sin contador, sin errores.
