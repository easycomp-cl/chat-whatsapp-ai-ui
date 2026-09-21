# Backend — Validar número personal (OTP WhatsApp) para notificaciones

> **Repo:** `chat-whatsapp-ai`  
> **UI:** onboarding (paso Contacto humano) envía el WhatsApp de confirmación; el responsable toca **Confirmar**.

## Por qué

Meta **no permite** mandar un WhatsApp de texto libre al celular personal del responsable si esa persona no escribió primero (ventana 24 h). Las notificaciones de derivación y la prueba de que el número es suyo tienen que ir por **plantilla aprobada**.

Hay **dos plantillas distintas**:

| Nombre | Categoría Meta | Para qué |
|--------|----------------|----------|
| `verificar_responsable_es` | **UTILITY** | Confirmar el WhatsApp personal (cuerpo + botón **Confirmar**) |
| `aviso_handoff_es` | **UTILITY** | Aviso real: “un cliente necesita un humano” |

Ya no es AUTHENTICATION/OTP. El responsable toca **Confirmar** y abre `https://chatbotmanager.easycomp.cl/verify-phone/{token}`.

## Cuándo enviar la confirmación

El paso 4 del wizard corre **antes** de Conectar WhatsApp. Sin WABA del negocio no se puede enviar la plantilla desde ese número.

Orden correcto:

1. Guardar `admin_phone` (E.164) y `notify_on_handoff` en el onboarding (ya existe).
2. Completar wizard + **Embedded Signup** (WABA conectada).
3. Provisionar plantillas (incluir las dos de arriba).
4. Cuando Meta apruebe `verificar_responsable_es`, la UI llama a `POST /businesses/:id/admin-phone/verification`.
5. El admin toca **Confirmar** → `https://chatbotmanager.easycomp.cl/verify-phone/:token`.
6. `GET`/`POST /verify-phone/:token` (público, sin API key) marca `phoneVerifiedAt`.
7. Solo entonces el worker de handoff puede usar `aviso_handoff_es` hacia ese número.

Si `notify_on_handoff` es true y el número **no** está verificado, **no enviar** avisos.

## Plantilla UTILITY de confirmación

Nombre: `verificar_responsable_es`  
Idioma: `es`  
Categoría: `UTILITY`

```
Hola {{1}}, fuiste agregado al equipo de {{2}}. Confirma que este número es correcto.
```

Botón URL `Confirmar` → `https://chatbotmanager.easycomp.cl/verify-phone/{{1}}`. Al enviar, el sufijo es el token (no el URL completo).

## Plantilla UTILITY de aviso

Nombre: `aviso_handoff_es`  
Idioma: `es`

```
Hola {{1}}, un cliente de {{2}} espera un humano. Conversación: {{3}}
```

Variables de cuerpo: nombre del responsable, nombre del negocio, nombre del cliente.

**Enlace al chat:** botón URL `Abrir chat` → `https://chatbotmanager.easycomp.cl/app/conversations/{{1}}`. Al enviar, el sufijo es el UUID de la conversación (no el URL completo). Ver [backend-whatsapp-standard-template-pack.md](./backend-whatsapp-standard-template-pack.md).

## API

### Enviar confirmación

```
POST /businesses/:businessId/admin-phone/verification
{ "phone": "+56912345678" }
```

Reglas:

- Auth: admin del negocio.
- `phone` E.164.
- WABA conectada y plantilla `APPROVED`; si no → `409` con mensaje claro (p. ej. “Conecta WhatsApp y espera la aprobación de la plantilla”).
- Generar token de un solo uso, TTL acorde, hash en BD.
- Enviar plantilla UTILITY `verificar_responsable_es` al `phone` (no al número del negocio), con botón Confirmar.
- Rate limit: 1 envío / 60 s por teléfono; máx. 5 / hora.

Respuesta `200`: `{ "ok": true, "expires_in_sec": 600, "phone": "+56912345678" }`  
No devolver el token.

### Página pública (UI)

```
GET  /verify-phone/:token   → backend GET  /verify-phone/:token
POST /verify-phone/:token   → backend POST /verify-phone/:token
```

Sin API key. El POST marca `phoneVerifiedAt`.

### Confirmar código (legado)

```
POST /businesses/:businessId/admin-phone/verification/confirm
{ "phone": "+56912345678", "code": "123456" }
```

Ya no es el flujo principal. Si el backend aún lo expone, la UI no lo usa.

## Persistencia sugerida

| Campo | Dónde |
|-------|--------|
| `admin_phone` | ya en onboarding / agent |
| `admin_phone_verified_at` / `phoneVerifiedAt` | `timestamptz?` |
| token hash | tabla de un solo uso |
| `verification_expires_at` | |
| `verification_sent_at` | |

## Prueba

1. WABA conectada + plantilla UTILITY `verificar_responsable_es` `APPROVED`.
2. En onboarding, teléfono E.164 + **Enviar confirmación por WhatsApp**.
3. El WhatsApp **personal** recibe la plantilla (no el número Business).
4. Tocar **Confirmar** en `/verify-phone/:token` → verificado.
5. Handoff con `notify_on_handoff` → llega `aviso_handoff_es` al mismo número.
6. Sin verificar → no se envía aviso.
