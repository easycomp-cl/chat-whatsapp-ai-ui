# Cambios UI — el modo de conversación lo persiste solo el backend

**Fecha:** 2026-10-08  
**Vercel:** ninguna variable nueva.

## Resumen

El front **no** escribe `mode`, `botResumeAt` / `human_mode_until`, `handoffReason` ni `assignedAdminId` en Supabase. El único camino para cambiar el modo es `PATCH /conversations/:id/mode` (`botApi.patchConversationMode`). El backend es la fuente de verdad.

## Por qué

El backend solo inserta el evento de sistema `mode_changed` si `existing.mode !== body.mode`.

Antes, al pasar a BOT, el front hacía primero `patchConversationInDatabase` (PATCH directo a `"Conversation"`) y después el PATCH del backend. Supabase ya quedaba en BOT, el backend respondía 200 y **no** escribía el globo (“El bot vuelve a responder en este chat.”). Además el error de ese PATCH se tragaba.

Al pasar a HUMAN el orden ya era el inverso (backend primero), por eso “El asesor tomó la conversación” sí aparecía.

El PATCH del backend también calcula `human_mode_until` (regla de 30 min). Si el front pisa esos campos antes o después, se pierde el evento y el timeout.

## Qué hace ahora la UI

- `changeConversationMode` y `enableBotOnAllHumanConversationsAction` llaman solo a `botApi.patchConversationMode`.
- Si el PATCH falla, el error llega al toast (`error.message`).
- `revalidatePath` sigue; `useLiveConversation` se entera por Realtime (y el poll). No hay write directo a Supabase para el modo.
- Limpiar el chat sigue usando `patchConversationInDatabase` (`chatClearedAt`). Eso no cambia el modo.

## Pasos de prueba

1. Chat en HUMAN → pasarlo a BOT: aparece el globo de sistema de vuelta a BOT. Badge **Modo BOT**.
2. Chat en BOT → pasarlo a HUMAN: globo “El asesor tomó la conversación”, badge **Modo humano**, contador si hay `human_mode_until`.
3. Con el backend caído o un 4xx/5xx del PATCH: toast con el mensaje de error; el modo en pantalla no debe quedar “a medias”.
4. “Activar bot (N)” en la lista: mismos eventos y mismos errores visibles; no debe quedar HUMAN en BD si el PATCH falló.
