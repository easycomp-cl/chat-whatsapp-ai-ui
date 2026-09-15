# Backend — Validar número personal (OTP WhatsApp) para notificaciones

> **Repo:** `chat-whatsapp-ai`  
> **Bloquea en UI:** en onboarding (paso Contacto humano) el botón **Enviar código** y confirmar el OTP.

## Por qué

Meta **no permite** mandar un WhatsApp de texto libre al celular personal del responsable si esa persona no escribió primero (ventana 24 h). Las notificaciones de derivación y la prueba de que el número es suyo tienen que ir por **plantilla aprobada**.

Hay **dos plantillas distintas**:

| Nombre | Categoría Meta | Para qué |
|--------|----------------|----------|
| `verificar_responsable_es` | **AUTHENTICATION** | OTP: “¿este WhatsApp es tuyo?” |
| `aviso_handoff_es` | **UTILITY** | Aviso real: “un cliente necesita un humano” |

No mezclarlas: AUTHENTICATION es solo códigos; UTILITY es el aviso operativo.

## Cuándo enviar el OTP

El paso 4 del wizard corre **antes** de Conectar WhatsApp. Sin WABA del negocio no se puede enviar la plantilla desde ese número.

Orden correcto:

1. Guardar `admin_phone` (E.164) y `notify_on_handoff` en el onboarding (ya existe).
2. Completar wizard + **Embedded Signup** (WABA conectada).
3. Provisionar plantillas (incluir las dos de arriba).
4. Cuando Meta apruebe `verificar_responsable_es`, la UI llama a enviar OTP.
5. Si el código es correcto → `admin_phone_verified_at`.
6. Solo entonces el worker de handoff puede usar `aviso_handoff_es` hacia ese número.

Si `notify_on_handoff` es true y el número **no** está verificado, **no enviar** avisos.

## Plantilla AUTHENTICATION (provisión)

Nombre: `verificar_responsable_es`  
Idioma: `es`  
Categoría: `AUTHENTICATION`

Cuerpo (formato Meta OTP):

```
Tu código de verificación de {{business}} es {{1}}. Válido 10 minutos. No lo compartas.
```

En AUTHENTICATION el `{{1}}` es el código; Meta a veces inyecta el OTP button automáticamente. Seguir [Authentication templates](https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates).

## Plantilla UTILITY de aviso

Nombre: `aviso_handoff_es`  
Idioma: `es`

```
Hola {{1}}, un cliente de {{2}} espera un humano. Conversación: {{3}}
```

Variables de cuerpo: nombre del responsable, nombre del negocio, nombre del cliente.

**Enlace al chat:** botón URL `Abrir chat` → `https://chatbotmanager.easycomp.cl/app/conversations/{{1}}`. Al enviar, el sufijo es el UUID de la conversación (no el URL completo). Ver [backend-whatsapp-standard-template-pack.md](./backend-whatsapp-standard-template-pack.md).

## API

### Enviar código

```
POST /businesses/:businessId/admin-phone/verification
{ "phone": "+56912345678" }
```

Reglas:

- Auth: admin del negocio.
- `phone` E.164.
- WABA conectada y plantilla `APPROVED`; si no → `409` con mensaje claro (p. ej. “Conecta WhatsApp y espera la aprobación de la plantilla”).
- Generar código 6 dígitos, TTL 10 min, hash en BD (`AdminPhoneVerification`).
- Enviar plantilla AUTHENTICATION al `phone` (no al número del negocio).
- Rate limit: 1 envío / 60 s por teléfono; máx. 5 / hora.

Respuesta `200`: `{ "ok": true, "expires_in_sec": 600, "phone": "+56912345678" }`  
No devolver el código.

### Confirmar código

```
POST /businesses/:businessId/admin-phone/verification/confirm
{ "phone": "+56912345678", "code": "123456" }
```

- Comparar hash, no reutilizar código.
- Guardar `admin_phone_verified_at` (perfil / agent primario).
- `200`: `{ "ok": true, "verified_at": "<iso>" }`
- Código inválido o vencido → `400`.

## Persistencia sugerida

| Campo | Dónde |
|-------|--------|
| `admin_phone` | ya en onboarding / agent |
| `admin_phone_verified_at` | `timestamptz?` |
| `verification_code_hash` | tabla de un solo uso |
| `verification_expires_at` | |
| `verification_sent_at` | |

## Prueba

1. WABA conectada + plantilla AUTHENTICATION `APPROVED`.
2. En onboarding, teléfono E.164 + **Enviar código**.
3. El WhatsApp **personal** recibe el OTP (no el número Business).
4. Confirmar código → verificado.
5. Handoff con `notify_on_handoff` → llega `aviso_handoff_es` al mismo número.
6. Sin verificar → no se envía aviso.
