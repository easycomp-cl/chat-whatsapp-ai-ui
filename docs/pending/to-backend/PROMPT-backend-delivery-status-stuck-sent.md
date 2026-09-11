# Prompt para backend — ticks atascados en SENT (sin DELIVERED/READ)

Copia el bloque siguiente y pásalo al equipo de `chat-whatsapp-ai` o a un agente en ese repo.

---

## PROMPT (copiar desde aquí)

```
Repositorio: chat-whatsapp-ai (backend)
Problema reportado desde chat-whatsapp-ai-ui: los mensajes salientes de WhatsApp se ven en el celular del cliente, pero en el dashboard siempre muestran un solo tick gris (estado SENT). Nunca pasan a DELIVERED ni READ.

## Evidencia en BD de producción (Supabase easycomp-chat-bot-manager — pcbwycrgbuioumsopqbe)

Consulta sobre vista `public.messages` / tabla `Message`:

- Últimos 500 OUTBOUND: 54 SENT, 18 FAILED, 0 DELIVERED, 0 READ
- Ejemplo mensaje "hola" (2026-07-31T21:03:52Z):
  - id: cms9fjv300005swhnutz1p46t
  - whatsapp_delivery_status: SENT
  - external_id: wamid.HBgLNTY5NDA0MTQ5NzcVAgARGBIwN0Y1MDAyMzU1OEVFNjY5NDgA

Conclusión: el mensaje SÍ sale a Meta (tiene wamid y llega al usuario), pero los webhooks `statuses` (delivered/read) NO se están persistiendo en `Message.whatsappDeliveryStatus`.

## Qué debería pasar (ya documentado en backend)

1. Meta envía webhooks en `entry[].changes[].value.statuses[]` con status `sent` | `delivered` | `read` | `failed`
2. Worker BullMQ procesa `event.kind === "status"`
3. `delivery-status-router.service.ts` → `message-ingest.service.ts` → `applyOutboundDeliveryStatus`
4. UPDATE en `Message` por `externalId` (wamid), solo avanzando estado: PENDING < SENT < DELIVERED < READ

Migraciones esperadas:
- 20260728180000_whatsapp_delivery_delivered_read (enum DELIVERED, READ)
- 20260731180000_whatsapp_delivery_error (opcional, errores FAILED)

Doc vigente para UI: `docs/to-front/whatsapp-delivery-status-ui.md`

## Checklist de diagnóstico (hacer en orden)

1. **Enum en BD**
   ```sql
   SELECT unnest(enum_range(NULL::"WhatsappDeliveryStatus"));
   ```
   Debe incluir: PENDING, SENT, DELIVERED, READ, FAILED

2. **¿Algún mensaje histórico con DELIVERED/READ?**
   ```sql
   SELECT "whatsappDeliveryStatus", COUNT(*)
   FROM "Message"
   WHERE direction = 'OUTBOUND'
   GROUP BY 1;
   ```

3. **Worker ECS**
   - ¿El servicio/worker BullMQ está corriendo en el mismo entorno que api.conversai.easycomp.cl?
   - ¿Los jobs `status:{wamid}:{status}:{timestamp}` se encolan y completan sin error?

4. **Webhook Meta**
   - ¿El webhook de la app de WhatsApp apunta al backend de prod/staging correcto?
   - ¿Llegan payloads con `statuses[]` además de `messages[]`?
   - Revisar logs del controller (`whatsapp.controller.ts`) — contador `statuses` > 0

5. **Script de verificación del repo**
   ```bash
   node scripts/verify-whatsapp-delivery-status.ts
   ```
   (o variante contra staging con simulación de webhook si existe)

6. **Prueba E2E**
   - Enviar OUTBOUND desde dashboard
   - Cliente recibe y abre chat en WhatsApp
   - Verificar en BD:
     ```sql
     SELECT id, "contentText", "whatsappDeliveryStatus", "externalId", "updatedAt"
     FROM "Message"
     WHERE id = '<MESSAGE_ID>';
     ```
   - Debe pasar SENT → DELIVERED → READ (si el cliente tiene lecturas activadas)

## Fuera de alcance (UI ya OK)

- La UI en chat-whatsapp-ai-ui ya mapea SENT/DELIVERED/READ y escucha Realtime en tabla `Message`.
- No hace falta cambiar frontend hasta que la BD persista DELIVERED/READ.

## Entregable esperado

1. Causa raíz (worker caído, webhook mal configurado, mapper no enruta statuses, enum sin migrar, etc.)
2. Fix en chat-whatsapp-ai + deploy
3. Confirmación con al menos un mensaje de prueba en DELIVERED o READ en prod
```

---

## Referencias en este repo (UI)

- `docs/pending/to-backend/backend-whatsapp-delivery-status-read.md` (histórico; backend marcado implementado)
- `chat-whatsapp-ai/docs/to-front/whatsapp-delivery-status-ui.md` (contrato vigente)
- `scripts/check-delivery-status.mjs` (consulta rápida a Supabase desde UI repo)
