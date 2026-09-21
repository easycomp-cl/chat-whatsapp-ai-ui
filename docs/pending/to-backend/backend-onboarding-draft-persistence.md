# Backend — Persistencia del borrador de onboarding

> **Repo:** `chat-whatsapp-ai`  
> **UI:** wizard de onboarding (`src/features/onboarding/`)  
> Relacionado: [backend-business-logo.md](./backend-business-logo.md)

## Por qué

Hoy el usuario puede perder el avance si se corta la conexión, cierra el navegador o quiere terminar **otro día**. La UI ya guarda el borrador **en el dispositivo** y reanuda el wizard. Falta que el servidor sea la fuente de verdad entre dispositivos, sesiones y reinstalaciones.

**Bloquea en UI:** sin este contrato, el avance no se recupera en otro browser / otro PC. En el mismo dispositivo sí (localStorage).

## Qué hace ya la UI (sin esperar este cambio)

1. Autoguarda en `localStorage` (`onboarding-draft:v1:{businessId}`) en cada cambio, al cambiar de paso, al cerrar el modal y al ocultar la pestaña.
2. Rehidrata al reabrir: local primero; si llega `GET setup-status`, fusiona por timestamp.
3. Autoguarda en servidor con debounce 800 ms vía `PATCH /businesses/:id/onboarding` (borrador **parcial**, sin validar el paso).
4. **Siguiente** ya no bloquea si el PATCH falla: el paso queda en el dispositivo y se puede continuar.
5. `POST .../onboarding/complete` sigue necesitando API; si falla, **no** se borra el borrador.
6. El logo en local puede ir como `data:image/...` (máx. ~1.2 MB). **Nunca** se envía `blob:` ni `data:` en el PATCH; el servidor solo debe persistir `https://...` tras `POST /logo`.

## Modelo de datos

Persistir un JSON de borrador **por tenant**, independiente de si el onboarding está completo.

### Prisma (especificación)

```prisma
model TenantOnboardingDraft {
  id             String   @id @default(cuid())
  tenantId       String   @unique
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  currentStep    Int      @default(1) // 1..5
  draftJson      Json
  draftUpdatedAt DateTime @updatedAt
  createdAt      DateTime @default(now())
}

model Tenant {
  // ...
  onboardingCompletedAt DateTime?
  onboardingDraft       TenantOnboardingDraft?
  logoUrl               String?
}
```

Alternativa válida: columnas en `Tenant` (`onboardingDraftJson Json?`, `onboardingCurrentStep Int?`, `onboardingDraftUpdatedAt DateTime?`). Un registro por tenant, no historial.

```sql
CREATE TABLE "TenantOnboardingDraft" (
  "id"             TEXT PRIMARY KEY,
  "tenantId"       TEXT NOT NULL UNIQUE REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "currentStep"    INTEGER NOT NULL DEFAULT 1,
  "draftJson"      JSONB NOT NULL DEFAULT '{}',
  "draftUpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

No exigir migración de schema de negocio (productos, horarios) hasta `complete`. El borrador es **staging**.

## Contrato API

Auth igual que el resto (`X-API-Key` vía BFF). Solo admin del tenant.

### GET `/businesses/:id/setup-status`

Debe devolver **siempre** el borrador actual, aunque esté incompleto.

Campos extra (además de los actuales):

```json
{
  "setup_version": 1,
  "completed_at": null,
  "progress_percent": 40,
  "can_go_live": false,
  "onboarding_required": true,
  "bot_global_enabled": false,
  "current_step": 3,
  "draft_updated_at": "2026-09-17T22:15:00.000Z",
  "checklist": {
    "identity": { "done": true, "required": true },
    "offerings": { "done": true, "required": true },
    "operations": { "done": false, "required": true },
    "human_contact": { "done": false, "required": true },
    "bot_identity": { "done": false, "required": true },
    "whatsapp_channel": { "done": false, "required": false },
    "knowledge_indexed": { "done": false, "required": false }
  },
  "missing_for_go_live": ["operations", "human_contact", "bot_identity"],
  "draft": {
    "identity": {
      "business_name": "Panadería Aurora",
      "business_type": "products",
      "description": "Panadería artesanal…",
      "logo_url": "https://cdn.example.com/tenants/abc/logo.png"
    },
    "offerings": [
      {
        "type": "product",
        "name": "Pan amasado",
        "description": "Horneado diario",
        "price": 1200,
        "currency": "CLP"
      }
    ],
    "operations": {
      "schedule": "Lun-Vie 08:00-18:00",
      "region": "Metropolitana",
      "city": "Metropolitana",
      "commune": "Providencia",
      "address": "",
      "payment_methods": ["efectivo"]
    },
    "human_contact": {
      "admin_name": "María",
      "admin_phone": "+56912345678",
      "notify_on_handoff": true,
      "admin_phone_verified_at": null
    },
    "bot_identity": {
      "use_named_agent": false,
      "bot_name": "",
      "bot_tone": "profesional y cercano",
      "greeting_message": ""
    }
  }
}
```

| Campo | Regla |
|-------|--------|
| `draft` | Objeto, nunca `null`. `{}` si no hay nada. |
| `draft_updated_at` | ISO-8601 UTC de la última escritura del borrador. `null` si nunca se guardó. |
| `current_step` | Entero 1–5. Default `1`. |
| `progress_percent` | Solo pasos **válidos** (ver checklist). No subir el % por un PATCH incompleto. |
| `checklist.*.done` | `true` solo si esa sección pasa las reglas de *complete*, no por existir JSON. |

### PATCH `/businesses/:id/onboarding`

Body **parcial**. Merge profundo por sección. **No validar** campos incompletos. **No** 400 porque falte descripción, horario o teléfono.

```json
{
  "current_step": 2,
  "identity": {
    "business_name": "Panadería Aurora",
    "business_type": "products",
    "description": "todavía corta"
  }
}
```

La UI también puede mandar las 5 secciones a la vez (autosave). Ignorar claves desconocidas.

#### Merge

- Si viene `identity`, hacer `{ ...stored.identity, ...body.identity }`.
- `logo_url: null` **borra** el logo del borrador (y del tenant si ya estaba publicado).
- `logo_url` que no sea `https://` → **ignorar** (no guardar `data:` ni `blob:`).
- Si viene `offerings`, **reemplazar** el array completo (no merge por índice).
- Si viene `operations` / `human_contact` / `bot_identity`, merge de objeto.
- Si viene `current_step`, clamp 1–5 y persistir.
- Actualizar `draftUpdatedAt` siempre que cambie el JSON o el paso.
- Responder el `setup-status` completo (igual que GET).

#### Idempotencia y concurrencia

Last-write-wins. No hace falta `If-Unmodified-Since` en v1. Si dos pestañas escriben, queda la última. La UI compara `draft_updated_at` vs su `savedAt` local.

#### Errores

| Código | Cuándo |
|--------|--------|
| 200 | Merge OK, aunque el paso esté incompleto |
| 400 | JSON inválido, `business_type` desconocido, `current_step` fuera de 1–5 |
| 401/403 | Auth |
| 404 | Negocio no existe |
| 413 | Body enorme (p. ej. data URL). Rechazar; la UI no debería mandarlo |

**No** devolver 409/`onboarding_incomplete` en PATCH.

### POST `/businesses/:id/onboarding/complete`

Aquí sí validar go-live. Si falta una sección, **409** con `missing_for_go_live` y **no borrar** el borrador.

Si OK:

1. Materializar draft → Tenant / FAQs semilla / KB (como hoy).
2. Set `onboardingCompletedAt`.
3. Se puede **conservar** el draft como snapshot o vaciarlo; la UI lo borra en local. Preferible conservar en servidor por si reeditan.

## Validación: PATCH vs complete

| Sección | PATCH (borrador) | `complete` / checklist.done |
|---------|------------------|-----------------------------|
| identity | Cualquier subset | name ≥ 2, type, description 50–1000 |
| offerings | Array, ítems a medias | ≥ 1 ítem; name; description ≥ 10 |
| operations | Horario a medias, pagos vacíos | schedule parseable; ≥ 1 pago |
| human_contact | Nombre o teléfono suelto | name; phone E.164 |
| bot_identity | Tono/saludo parcial | greeting ≥ 10; bot_name si `use_named_agent` |
| logo | Opcional; solo URL https | Nunca requerido |

## Logo

Flujo correcto:

1. UI: `POST /businesses/:id/logo` (multipart) → `{ logo_url }`.
2. UI: `PATCH` con `identity.logo_url` https.
3. Servidor guarda en draft **y** en `Tenant.logoUrl`.

Si el upload aún no existe, la UI guarda el archivo como data URL **solo en localStorage**. El PATCH omite esa clave.

## Recuperación (casos)

| Escenario | Comportamiento esperado |
|-----------|-------------------------|
| Cierra el modal a mitad del paso 1 | GET devuelve lo tipeado; `current_step: 1` |
| “Hacerlo después” y vuelve al día siguiente (otro browser) | Mismo GET; wizard reanuda `current_step` |
| Se cae la API a mitad de escritura | PATCH 5xx; UI conserva local y reintenta |
| Completa en PC A, abre PC B | `completed_at` set; no reabrir wizard (salvo dev) |
| Dos dispositivos a la vez | Last write wins; `draft_updated_at` distinto |

## Qué no hacer

- No exigir WhatsApp conectado para persistir el draft.
- No indexar RAG / crear FAQs en cada PATCH (solo en `complete`).
- No transformar el draft en filas de catálogo hasta `complete`.
- No rechazar PATCH porque `onboarding_required === false` (dev reabre el wizard).

## Pasos de prueba backend

1. PATCH identity solo con `business_name: "Aurora"` → 200, GET lo devuelve, `checklist.identity.done === false`.
2. PATCH `current_step: 4` → GET `current_step === 4`.
3. PATCH offerings incompletos → 200, checklist offerings `done: false`.
4. POST complete con draft a medias → 409, GET sigue teniendo el draft.
5. PATCH `identity.logo_url: "data:image/png;base64,..."` → 200 y **no** persistir esa clave (o 400; preferible ignorar).
6. PATCH `identity.logo_url: "https://cdn/.../logo.png"` → GET la devuelve.
7. Dos PATCH seguidos (nombre luego descripción) → GET tiene ambos (merge, no replace ciego de identity).
8. Tras complete OK, GET `completed_at` no nulo y draft materializado en Tenant.

## UI ya preparada

| Archivo | Rol |
|---------|-----|
| `src/features/onboarding/draft-storage.ts` | Cache local |
| `src/features/onboarding/draft-persistence.ts` | Hidratación + PATCH autosave |
| `src/features/onboarding/use-onboarding-draft.ts` | Debounce 800 ms |
| `src/features/onboarding/types.ts` | `draft_updated_at`, `current_step`, patch parcial |
