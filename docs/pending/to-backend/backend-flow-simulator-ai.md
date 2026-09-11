# Backend: simulador de flujos con IA (`use_ai`)

**Repo:** `chat-whatsapp-ai`  
**Bloquea en UI:** checkbox «Usar interpretación con IA» en `/app/flujos/[flowId]` → pestaña Simulador.

## Resumen

La UI envía `use_ai: true` en `POST /businesses/:businessId/flows/:flowId/simulate`. Hoy el simulador solo aplica reglas básicas (`simpleKeywordCapture`). Para que el simulador se comporte como WhatsApp real, el backend debe interpretar mensajes con el mismo motor de IA que usa el runtime de flujos cuando `use_ai` está activo.

## Contrato API

### Request (existente + campo nuevo)

```http
POST /businesses/:businessId/flows/:flowId/simulate
Content-Type: application/json
```

```json
{
  "messages": [
    { "role": "customer", "content": "Quiero una mesa de roble para 6 personas" }
  ],
  "version_id": "uuid-opcional",
  "use_ai": true
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `messages` | array | Historial de prueba (customer/agent/system) |
| `version_id` | string? | Versión a simular; si omitido, usar publicada o última DRAFT |
| `use_ai` | boolean? | **Nuevo.** `true` = extracción con IA; `false`/omitido = comportamiento MVP actual |

### Response

Sin cambios respecto al contrato actual (`FlowSimulationResult`):

- `next_message`
- `captured_fields`
- `missing_fields`
- `output_preview`
- `logs`

## Comportamiento esperado

1. **`use_ai: false` o ausente**  
   Mantener `flow-simulator.service.ts` actual (keywords, recorrido simple del grafo).

2. **`use_ai: true`**  
   - Usar el mismo servicio/prompt que `collect_fields` en runtime (o un adaptador compartido).
   - Rellenar `captured_fields` según `graph.fields` y nodos `collect_fields` / `choice`.
   - Avanzar el nodo actual del grafo según campos completos y condiciones de aristas.
   - Incluir en `logs` si se usó IA y qué nodo se evaluó.

3. **Errores**  
   - Si IA no está configurada (sin API key, etc.): `503` o `422` con mensaje claro; la UI muestra toast.
   - No fallar silenciosamente volviendo a keywords sin indicarlo en `logs`.

## Implementación sugerida (backend)

```typescript
// flow-simulator.service.ts (pseudocódigo)
async simulate(input: SimulateFlowInput) {
  const graph = await this.resolveGraph(input.version_id);
  if (input.use_ai) {
    return this.simulateWithAi(graph, input.messages);
  }
  return this.simulateWithKeywords(graph, input.messages);
}
```

Reutilizar:

- `FlowDefinition` / validación Zod existente
- Cliente OpenAI (o el que use el motor de captura en producción)
- Mapeo de `graph.fields` → schema de extracción

## Pruebas

1. Flujo `wood_quote` publicado, `use_ai: false` → mismo resultado que hoy.
2. `use_ai: true`, mensaje «mesa de roble 2x1m» → `captured_fields` con madera/dimensiones si el grafo lo define.
3. `use_ai: true` sin credenciales IA → error HTTP explícito.
4. Versión DRAFT con `version_id` → simula ese grafo, no la publicada.

## UI (ya implementado)

- `src/lib/bot-api/client.ts` → `simulateFlow` con `use_ai?`
- `src/lib/validators/schemas.ts` → `simulateFlowSchema.use_ai`
- `src/features/flows/components/flow-simulator-panel.tsx` → checkbox por defecto activado
