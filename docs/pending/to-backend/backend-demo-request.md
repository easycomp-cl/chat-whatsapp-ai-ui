# Backend pendiente — Solicitudes de demostración

## Resumen

La landing incluye un formulario de solicitud de demostración. Hoy **no existe endpoint** en el backend; la UI valida en cliente y muestra éxito en modo prueba.

## Qué bloquea

- Persistencia real de leads
- Notificación al equipo comercial
- Integración CRM / email

## Contrato API sugerido

```
POST /api/demo-requests
Content-Type: application/json
```

### Body

```json
{
  "name": "string",
  "company": "string",
  "email": "string",
  "phone": "string | null",
  "conversationVolume": "string",
  "mainProblem": "string",
  "consent": true,
  "source": "landing"
}
```

### Respuestas

| Código | Body |
|--------|------|
| 201 | `{ "ok": true, "id": "uuid" }` |
| 400 | `{ "ok": false, "message": "..." }` |
| 429 | Rate limit |

## Variable de entorno (UI)

```env
NEXT_PUBLIC_DEMO_REQUEST_API_URL=https://api.conversai.easycomp.cl/demo-requests
```

Cuando esté disponible, `submitDemoRequest()` en `src/lib/landing/demo-request.ts` enviará el POST automáticamente.

## Reglas de negocio sugeridas

- Validar email y consentimiento obligatorio
- Rate limit por IP (5 req / hora)
- Notificar a `igonzalez@easycomp.cl` o canal interno
- No almacenar datos innecesarios

## Pasos de prueba

1. Configurar `NEXT_PUBLIC_DEMO_REQUEST_API_URL`
2. Enviar formulario desde `/`
3. Verificar registro en BD o notificación
4. Confirmar mensaje de éxito en UI
