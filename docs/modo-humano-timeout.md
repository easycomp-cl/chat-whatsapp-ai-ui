# Timeout automático de modo humano

## Resumen

Una conversación en modo humano vuelve automáticamente a modo BOT tras **30 minutos sin respuesta** del asesor. Esta funcionalidad está implementada en el backend y la UI refleja el estado y cuenta regresiva.

**Importante:** El timeout solo afecta a la conversación individual, **nunca al switch global del bot**.

## Contrato backend → frontend

### Campo `human_mode_until` en conversación

- **Tipo:** `string | null | undefined`
- **Formato:** ISO 8601 timestamp (UTC recomendado)
- **Semántica:**
  - `null` o ausente (`undefined`): la conversación está en modo BOT o no tiene timeout activo
  - `string` válido ISO 8601: la conversación está en modo humano y volverá a BOT automáticamente en esa fecha/hora

La UI debe comportarse igual que hoy si el campo es `undefined` (backend aún no desplegado con el campo).

### Evento de hilo `bot_mode_resumed`

Nuevo tipo de evento de sistema en el hilo de mensajes:

```json
{
  "kind": "bot_mode_resumed",
  "actor": "SYSTEM",
  "title": "Volvió a modo BOT (30 min sin respuesta)",
  "body": "",
  "appearance": "blue_pill"
}
```

- Es un evento **interno** (no se envía al cliente de WhatsApp)
- Se renderiza en el chat con el mismo estilo que el evento `mode_changed` (pildora azul de sistema)
- Si el backend no envía texto, se usa el fallback: `"Volvió a modo BOT (30 min sin respuesta)"`

## Implementación UI

### 1. Badge global del bot (Dashboard)

El badge en `bot-status-card.tsx` ahora dice explícitamente que es global:

- **Antes:** "Bot activo" / "Bot pausado"
- **Ahora:** "Bot global activo" / "Bot global pausado"

Esto evita confusión cuando una conversación individual está en modo humano.

### 2. Badge de modo de conversación (Header del chat)

Nuevo componente `ConversationModeBadge` que muestra:

- **Modo BOT:** badge verde "Modo BOT"
- **Modo humano:**
  - Badge naranja "Modo humano"
  - Si `human_mode_until` es válido y futuro: contador "Vuelve a BOT en X min" (actualizado cada ~30 s)
  - Si falta <1 min: "Vuelve a BOT en menos de 1 min"
  - Si `human_mode_until` es `null`, `undefined`, inválido o ya pasó: no se muestra contador

El contador se actualiza cada 30 segundos mediante un `setInterval` y no causa rerenders costosos. Cuando la hora del timeout pasa, el componente detecta el cambio y debería mostrar `0`, pero el backend revalidará la conversación automáticamente.

### 3. Renderizado de evento `bot_mode_resumed`

El componente `ChatSystemEventBubble` ya renderiza todos los eventos de sistema con el mismo estilo. Se agregó el tipo `bot_mode_resumed` al enum y a la función `inferKind` para detectarlo en texto plano si llega como `content_text`.

## Tipos TypeScript

```typescript
// types/database.types.ts
export type Conversation = {
  // ... campos existentes
  human_mode_until?: string | null; // nuevo campo
};

// types/message.ts
export type SystemEventKind =
  | "profile_saved"
  | "profile_updated"
  | "handoff"
  | "mode_changed"
  | "bot_mode_resumed" // nuevo
  | "plate_lookup"
  | "vehicle_identified"
  | "fitment_check"
  | "recommendation"
  | "suggestion"
  | "quote_prepared"
  | "mechanic_note";
```

## Comportamiento ante backend sin desplegar

Si el backend aún no devuelve `human_mode_until`:

- El campo será `undefined`
- La UI no mostrará el contador (condición de guardia)
- El toggle manual de modo humano/BOT sigue funcionando igual
- Los eventos existentes se siguen renderizando normalmente

## Pruebas manuales

1. **Badge global:** Ir al dashboard y verificar que dice "Bot global activo/pausado"
2. **Badge de conversación:** Abrir una conversación y verificar que el header muestra "Modo BOT" o "Modo humano" según corresponda
3. **Contador:** En una conversación en modo humano con `human_mode_until` válido, verificar que aparece "Vuelve a BOT en X min" y que se actualiza
4. **Evento:** Si el backend envía un evento `bot_mode_resumed`, verificar que se renderiza en el chat con el estilo de pildora azul
5. **Sin campo:** Con backend antiguo (sin `human_mode_until`), verificar que todo funciona como antes

## Archivos modificados

- `types/database.types.ts` — agregar campo opcional `human_mode_until` a `Conversation`
- `types/message.ts` — agregar `bot_mode_resumed` a `SystemEventKind`
- `src/features/dashboard/components/bot-status-card.tsx` — cambiar texto a "Bot global activo/pausado"
- `src/features/conversations/components/conversation-mode-badge.tsx` — nuevo componente con badge y contador
- `src/features/conversations/components/chat-window.tsx` — integrar `ConversationModeBadge` en el header
- `src/lib/conversations/system-event.ts` — agregar `bot_mode_resumed` al set de eventos y a la función `inferKind`

## Restricciones respetadas

- No se tocó lógica de negocio del backend
- No se cambiaron dependencias ni `package-lock.json`
- No se tocó la parte de Embedded Signup/WhatsApp onboarding
- El toggle manual de modo humano/BOT sigue funcionando igual
- Los tipos son opcionales y compatibles hacia atrás
