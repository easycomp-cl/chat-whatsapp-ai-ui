# Cambios UI — timeout de modo humano (30 min)

**Fecha:** 2026-10-08  
**Backend:** spec en `docs/pending/to-backend/backend-human-mode-timeout.md` (repo `chat-whatsapp-ai`).  
**Vercel:** ninguna variable nueva.

## Resumen

Una conversación en modo humano vuelve sola a BOT a los 30 minutos sin respuesta (eso lo hace el backend, **solo esa conversación**, nunca el switch global). Esta UI:

- Distingue el **bot global** del **modo de la conversación abierta**.
- Muestra un contador si llega `human_mode_until`.
- Renderiza el evento interno `bot_mode_resumed`.

Si el backend aún no manda `human_mode_until` (`undefined`), el comportamiento es el de hoy: sin contador, el toggle manual sigue igual.

## Contrato que lee la UI

| Campo | Significado |
|-------|-------------|
| `human_mode_until` | ISO 8601 con la hora en que **esta** conversación vuelve a BOT. `null` = está en BOT. Ausente = backend no desplegó el campo. |
| Evento `bot_mode_resumed` | Mensaje de sistema (no WhatsApp). Texto preferido: `Volvió a modo BOT (30 min sin respuesta)`. |

El modo de la conversación sigue siendo `conversation.mode` (`BOT` \| `HUMAN`), igual que antes. Se lee de la fila/API de la conversación (vista `public.conversations` / inbox) y se mantiene vivo con `useLiveConversation` (Realtime + refresh existente).

## Comportamiento visible

### Header de la app

El badge del negocio pasa a **Bot global activo** / **Bot global pausado** (`bot_global_enabled`). Ya no se confunde con el modo del chat abierto.

### Header de la conversación

Junto al nombre del cliente:

- Badge **Modo humano** (naranja) o **Modo BOT** (verde).
- El switch Bot/Humano no cambia de lógica.

Si `mode === "HUMAN"` y `human_mode_until` es una fecha válida **futura**:

- Texto **Vuelve a BOT en X min** (minutos hacia arriba).
- Si falta menos de 1 minuto: **Vuelve a BOT en menos de 1 min**.
- El contador vive en un componente chico y se actualiza cada ~30 s (y al vencer).
- Al vencer, llama al `refresh()` de `useLiveConversation` (sin polling extra).

Si el campo es `null` / `undefined` / inválido o la hora ya pasó: no hay contador.

### Hilo

Los eventos `bot_mode_resumed` se ven como el globo azul de sistema (“El asesor tomó la conversación…”): centrado, interno, ícono de bot. Si no hay título/cuerpo, fallback `Volvió a modo BOT (30 min sin respuesta)`.

## Archivos principales

- `src/components/layout/app-header.tsx` — badge global
- `src/features/conversations/components/chat-window.tsx` — badge de conversación + contador
- `src/features/conversations/components/human-mode-resume-countdown.tsx` — tick aislado
- `src/lib/conversations/human-mode-until.ts` — parseo y copy del contador
- `src/lib/conversations/system-event.ts` — kind `bot_mode_resumed`
- `types/database.types.ts`, `types/message.ts` — campos opcionales

## Pasos de prueba

1. Con backend **sin** `human_mode_until`: abrir un chat en humano y en BOT. Badge global dice “Bot global …”. Header del chat dice “Modo humano” / “Modo BOT”. Sin contador. Toggle sigue funcionando.
2. Con `human_mode_until` a ~5 min en el futuro y `mode=HUMAN`: aparece “Vuelve a BOT en 5 min”. Esperar el tick (~30 s) y ver que baja (o se mantiene si el redondeo hacia arriba no cambió).
3. Con `human_mode_until` a ~30 s: “Vuelve a BOT en menos de 1 min”. Al pasar la hora, se refresca el chat; el modo debe pasar a BOT cuando el backend lo persista.
4. Insertar un `SYSTEM_EVENT` `bot_mode_resumed` (o `content_text` con el fallback): globo azul interno, no sale a WhatsApp.
5. El switch global de Ajustes/Dashboard no debe cambiar al vencer el timeout de una conversación.
