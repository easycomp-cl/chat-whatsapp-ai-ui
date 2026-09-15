# Cambios UI — Módulo Flujos (MVP)

## Resumen

Implementación del módulo de flujos conversacionales consumiendo el backend ya desplegado (`chat-whatsapp-ai` PR1–PR8).

## Rutas nuevas / actualizadas

| Ruta | Descripción |
|------|-------------|
| `/app/flows` | Listado, crear desde plantilla, archivar |
| `/app/flows/[flowId]` | Detalle: **editor visual**, versiones, publicar, simulador, webhook, entregas |
| `/app/flows/reviews` | Cola de revisiones `PENDING` con preview y resolve |

## Inbox (sin ruta nueva)

- **Banner** de flujo activo con nombre, versión, estado y cancelar.
- **Globo agente** cuando `AWAITING_AGENT_INPUT` + `pending_agent_input`: preview del mensaje, campos editables, envío vía `POST flow-runs/:id/agent-input`.
- **Switch BOT/HUMAN** deshabilitado si `flow_mode_locked`; toast en error `409 active_flow_exists`.
- **Badge "Flujo"** en lista de conversaciones con run activo.
- **Panel contacto**: sección "Flujo activo" + link a revisiones si aplica.
- **Activar flujo** (acordeón sobre Eventos de IA): lista flujos `ACTIVE` publicados y botón para iniciar en la conversación (`POST .../flows/:flowId/start`).

## API consumida

- `GET/POST/PATCH/DELETE /businesses/:id/flows`
- Versiones, publish, simulate
- `GET /conversations/:id` (flow state)
- `POST /businesses/:id/conversations/:conversationId/flows/:flowId/start`
- `POST flow-runs/:id/agent-input`, cancel
- `GET/POST flow-reviews`, resolve
- `PUT/GET integrations/flow-webhook`
- `GET flow-webhook-deliveries`, retry

## Variables de entorno

- `BOT_API_BASE_URL`
- `BOT_API_SECRET`

## Editor visual (v1)

- Pestaña **Editor** en detalle de flujo (`@xyflow/react`).
- Editar nodos existentes, añadir/eliminar, duplicar y conectar aristas.
- Inspector con formularios por tipo de nodo + campos globales del grafo.
- **Guardar borrador** siempre permitido (incluso con errores de validación).
- **Publicar** bloqueado si hay errores bloqueantes; panel de validación en español.
- Si solo hay versión publicada: botón «Crear borrador desde esta versión».

## Simulador

- **Simulador local paso a paso**: recorre el grafo nodo por nodo (mensaje → capturar → siguiente nodo).
- Formulario por paso para confirmar datos si el chat no los interpreta.
- Botón «Simular envío de imagen» en pasos `await_file`.
- La API backend (`use_ai`) queda para validación en WhatsApp real; ver `docs/pending/to-backend/backend-flow-simulator-ai.md`.

## Prueba manual

1. **Admin flujos:** `/app/flows` → crear `wood_quote` → **Editor** → editar nodo → guardar borrador → publicar versión → simular mensaje cliente (con/sin IA).
2. **Inbox:** conversación con flujo activo → ver banner y badge; switch HUMAN bloqueado.
3. **Globo agente:** avanzar hasta `AWAITING_AGENT_INPUT` → completar campos → enviar → mensaje BOT en hilo.
4. **Revisiones:** `/app/flows/reviews` → preview imagen → aprobar/rechazar.
5. **Webhook:** tab Webhook en detalle → guardar URL → tab Entregas tras completar flujo con `emit_event`.

## Archivos principales

- `src/lib/bot-api/types.ts`, `client.ts`
- `src/lib/actions/flow-actions.ts`
- `src/lib/flows/graph-*.ts`
- `src/features/flows/components/editor/*`
- `src/features/flows/components/*`
- `src/features/conversations/components/flow-*.tsx`
- `src/features/conversations/hooks/use-conversation-flow-state.ts`
