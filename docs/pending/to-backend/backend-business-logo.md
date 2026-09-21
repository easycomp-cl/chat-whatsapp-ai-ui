# Backend — Logo de la empresa

> **Repo:** `chat-whatsapp-ai`  
> **UI:** onboarding (paso Tu negocio). Campo **opcional**.

## Resumen

La UI permite subir un logo en el wizard de onboarding. Hoy el archivo se previsualiza en el cliente; para persistirlo hace falta un endpoint de subida y un campo en el tenant.

**Bloquea en UI:** el logo no queda guardado entre sesiones ni se puede reutilizar en cotizaciones / perfil. El onboarding **sí avanza** si la subida falla (el campo no es obligatorio).

## Auth

Igual que el resto (`X-API-Key` vía BFF / `BOT_API_SECRET`). Solo `BUSINESS_ADMIN` del tenant.

## Contrato API

### Subir logo

```
POST /businesses/:id/logo
Content-Type: multipart/form-data
```

Campo: `file` (imagen).

Aceptar: `image/png`, `image/jpeg`, `image/webp`.  
Tamaño máximo: **2 MB**.

**200:**

```json
{ "logo_url": "https://..." }
```

`logo_url` debe ser una URL pública (o firmada de larga duración) que la UI pueda mostrar con `<img>`.

**400:** tipo o tamaño inválido.  
**404:** negocio no existe.

Reemplazar el logo anterior si ya había uno.

### Quitar logo

```
DELETE /businesses/:id/logo
```

**204.** También aceptar `PATCH /businesses/:id/onboarding` con `identity.logo_url: null`.

### Onboarding

En `PATCH /businesses/:id/onboarding`, `identity.logo_url` es **opcional**:

```json
{
  "identity": {
    "business_name": "Panadería Aurora",
    "business_type": "products",
    "description": "...",
    "logo_url": "https://..."
  }
}
```

No exigir logo para `can_go_live`. Si viene `logo_url`, persistirlo en el tenant y devolverlo en `GET /businesses/:id/setup-status` → `draft.identity.logo_url`.

`GET /businesses/:id` y la vista `public.businesses` deberían exponer el mismo campo para settings y cotizaciones.

## Persistencia sugerida

Columna en Prisma / `Tenant`:

```prisma
logoUrl String?
```

Migración SQL (especificación; aplicar en `chat-whatsapp-ai`):

```sql
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
```

Storage: bucket privado o público `business-logos`, path `{tenantId}/logo.{ext}`. La URL que ve la UI no debe exigir cookies de Supabase en el browser del admin.

Vista UI `public.businesses`: añadir `"logoUrl" AS logo_url` cuando exista la columna (documentar al equipo de esta UI para actualizar `types/database.types.ts`).

## Consumidores previstos

- Onboarding (paso 1 + preview WhatsApp del paso 5)
- PDF / preview de cotización (cabecera del negocio)
- Futuro: settings del negocio

## Pasos de prueba

1. `POST /businesses/:id/logo` con un PNG < 2 MB → 200 y `logo_url` fetchable.
2. Repetir con otro archivo → reemplaza el anterior.
3. `PATCH .../onboarding` con `identity.logo_url` de ese upload → aparece en `setup-status`.
4. JPG de 3 MB → 400.
5. `DELETE /businesses/:id/logo` → `setup-status` sin logo.
6. Completar onboarding **sin** logo → `can_go_live` no debe exigir el campo.
