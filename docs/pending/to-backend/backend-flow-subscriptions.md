# Backend — Suscripciones Flow (planes easyCOMP)

> **Repo:** `chat-whatsapp-ai` (API, webhooks, persistencia, firma HMAC)  
> **UI:** este repo (catálogo, checkout, banners de mora, paywall)  
> **Proveedor:** [Flow](https://developers.flow.cl/docs/intro) — producto **Planes de suscripción**, no pago ecommerce único.  
> **Ambiente de prueba:** [sandbox.flow.cl](https://sandbox.flow.cl) · API `https://sandbox.flow.cl/api`  
> **Producción:** `https://www.flow.cl/api`

La UI **no** llama a Flow. El `SecretKey` nunca sale del backend.

`/pay/:code` (link de pago WhatsApp del cliente final) **no** es este flujo.

---

## Resumen y qué bloquea en la UI

Hoy `/admin/plans` es placeholder y `/app/usage` lee `metadata_json.plan_limit` (default 1000). No hay checkout, día de cobro, mora ni paywall.

Sin este backend no se puede:

- Cobrar Starter / Pro / Business
- Elegir día de cobro (5 / 15 / 30)
- Mostrar estado de suscripción y próximo cobro
- Avisar mora, recortar premium al día 6 y bloquear la app al día 11
- Upgrade con dos facturas prorrateadas
- Cancelar y dejar usar hasta el día anterior al cobro

---

## Decisiones de producto (cerradas)

| Tema | Decisión |
|------|----------|
| Planes | Starter **$99.990** + IVA (oferta **$79.990** + IVA los **3 primeros meses**) · Pro $149.990 + IVA (recomendado) · Business $249.990 + IVA. Mensual. |
| Trial | **No** por ahora (`trial_period_days = 0`). Se puede activar después sin cambiar el modelo. |
| Día de cobro | El cliente elige **5, 15 o 30** al contratar. **Inmutable** después. |
| Primer ciclo | Prorrateo (descuento) desde el alta hasta el próximo día de cobro. |
| Pago fallido | No se corta al instante. Aviso 5 días. 10 días de gracia desde el día de cobro. |
| Día 6 | Se bloquean funciones premium (ver lista). |
| Día 11 | Paywall modal **no cerrable** al iniciar sesión. Solo pagar. |
| Cancelación | Sigue usando hasta **día de cobro − 1**. Ejemplo: cobra el 5 → usa hasta el 4. |
| Upgrade | **Dos facturas**: días ya usados al plan actual + días restantes al plan nuevo. |
| Tarjeta | Solo en Flow (redirect). No guardar PAN/CVV. |

---

## Planes (catálogo)

Montos **netos** en UI. Flow cobra el **total con IVA 19 %** (entero CLP, redondeo al peso más cercano).

| `planId` Flow | Nombre UI | Neto lista | Neto oferta | IVA oferta | **Total oferta (Flow)** | Total lista | Copy |
|---------------|-----------|------------|-------------|------------|-------------------------|-------------|------|
| `easycomp_starter` | Starter | 99.990 | **79.990** (3 meses) | 15.198 | **95.188** | 118.988 | Para 1 local |
| `easycomp_pro` | Pro | 149.990 | — | 28.498 | **178.488** | 178.488 | 1 local, más equipo y pedidos |
| `easycomp_business` | Business | 249.990 | — | 47.498 | **297.488** | 297.488 | Cadena o varios puntos |

El plan Flow de Starter se crea con el **precio de lista** (`amount` = 118.988). La oferta son 3 cupones/descuentos de **$23.800** (diferencia con IVA) o un cupón de **$20.000** neto × 3 períodos — usar el que Flow acepte y dejar el cobro real en **$95.188** los primeros 3 invoices.

Cupón sugerido: `starter_promo_3m`. Aplicarlo en `subscription/create` (`couponId`) **solo** si `planId = easycomp_starter`. Al invoice 4 cobra lista. Si el cupón se acaba o falla, no dejar el cliente en lista desde el mes 1.

Prorrateo del primer ciclo Starter: usar tarifa diaria de la **oferta** (`95.188 / 30`), no la de lista.

`interval = 3` (mensual), `interval_count = 1`, `periods_number = 0` (indefinido), `days_until_due = 10`, `charges_retries_number = 3` (o el máximo que permita cubrir los 10 días).

`urlCallback` de **cada** plan → webhook del backend (pagos del plan).

Límites de mensajes del admin viejo (1.000 / 5.000 / ilimitado) **no** están en este catálogo. No inventarlos. Entitlements de “1 local vs cadena” quedan para una fase posterior (hoy un `business` = un local).

---

## Calendario de cobro

### Elección

Al checkout: `billing_day ∈ {5, 15, 30}`. Se persiste y **no hay endpoint de cambio**.

Si el mes no tiene ese día (p. ej. 30 en febrero): usar **el último día del mes**.

### Próximo cobro

`next_billing_date` = siguiente ocurrencia de `billing_day` **estrictamente posterior** a hoy (zona `America/Santiago`). Si hoy **es** el día de cobro y aún no se cobró, `next_billing_date` = hoy.

### Primer cobro (prorrateo)

Mes comercial de **30 días**. Tarifa diaria = `total_vigente / 30` (en Starter durante la oferta: **95.188 / 30**; después de 3 meses: **118.988 / 30**).

```
días = max(1, next_billing_date − fecha_contrato)   // días calendario hasta el primer cobro recurrente
primer_cobro = round(total_plan × días / 30)
```

Ejemplo: contrata el 20, elige día **5** → primer cobro el 20 (prorrateado hasta el 5 siguiente); el **5** siguiente cobra el mes completo.

El cobro recurrente de Flow debe alinearse a `billing_day` (`subscription_start` = primer `next_billing_date`). El prorrateo inicial es un cargo/factura aparte (ver encaje Flow).

---

## Mora (pago fallido o no pagado)

Ancla: `billing_date` del ciclo (el día elegido de **ese** mes, con ajuste fin de mes).

| Días desde `billing_date` | `access_level` | UX |
|---------------------------|----------------|----|
| 0 (cobro OK) | `active` | Normal |
| 1–5 | `past_due_notify` | App completa + banner/toasts + email diario de regularizar |
| 6–10 | `past_due_restricted` | Banner persistente + **premium cortado** |
| ≥ 11 | `locked` | Modal no cerrable. CTA pagar / actualizar tarjeta |

Si paga dentro de los 10 días → `active` de inmediato (callback Flow).

No borrar datos. El bot puede quedar pausado en restricted/locked; el historial se conserva.

### Premium a cortar en día 6 (sugerido)

**Sigue:** inbox (leer + responder humano), perfil, clientes lectura, **pantalla de facturación / pagar**.

**Cortar:**

1. Bot IA (`bot_global_enabled` forzado off; el switch no lo reactiva)
2. Flujos (no editar ni disparar)
3. Importar chat
4. Base de conocimiento (alta/edición)
5. Pack / nuevas plantillas Meta
6. Invitar usuarios (Mi equipo)
7. Catálogo alta/edición masiva
8. Cotización PDF / envío de cotización

Conversar por WhatsApp en humano se mantiene para no dejar al local ciego.

### Día 11

`GET /billing/subscription` → `access_level: "locked"`. Layout `/app/*` muestra modal a pantalla completa, sin X, sin click-outside. Un solo botón: **Regularizar pago** (Flow). Logout sí permitido.

---

## Cancelación

`POST /subscription/cancel` de Flow con `at_period_end = 1`.

- `cancel_at` = `billing_day` del ciclo vigente **menos 1 día** (23:59 Santiago).
- Ejemplo: cobra los 5, cancela el 20 → usa hasta el **4**.
- Ese día a las 00:00 pasa a `canceled` y el paywall de “sin plan” (distinto al de mora: CTA elegir plan, no solo reintentar cobro).
- No reembolsar el período ya pagado.

---

## Upgrade (dos facturas)

Solo **upgrade** (Starter → Pro/Business, Pro → Business). Downgrade: fase 2 (crédito a favor del próximo ciclo; no recortar acceso ya pagado).

Ciclo vigente `[period_start, next_billing_date)`:

```
días_ciclo     = next_billing_date − period_start          // típico ~30
días_usados    = hoy − period_start                        // plan actual
días_restantes = next_billing_date − hoy                   // plan nuevo
```

Tarifa diaria = `total_con_iva / 30`.

| Factura | Concepto | Monto |
|---------|----------|--------|
| 1 | Días usados × plan **actual** | `round(total_actual × días_usados / 30)` |
| 2 | Días restantes × plan **nuevo** | `round(total_nuevo × días_restantes / 30)` |

Si el ciclo actual **ya está pagado** (caso normal):

- Crédito = `round(total_actual × días_restantes / 30)` (días no usados del plan viejo)
- **A cobrar ahora** = factura 2 − crédito (nunca negativo; si diera 0, no cobrar)
- Las **dos líneas** se muestran igual (transparencia). El movimiento de dinero puede ser el neto.

Luego la suscripción Flow queda en el plan nuevo; el próximo `billing_day` cobra el mes completo del plan nuevo.

Preview obligatorio en UI antes de confirmar (`POST .../change-plan/preview`).

---

## Encaje con Flow (importante)

Flow factura por aniversario de `subscription_start`, no por “día 5/15/30” nativo. El **backend es dueño del calendario**.

1. Crear 3 planes (`POST /plans/create`) una vez por ambiente.
2. `POST /customer/create` con `externalId = businessId`, email y nombre del admin.
3. `POST /customer/register` + redirect `url + "?token=" + token`.
4. Callback `url_return` → `GET /customer/getRegisterStatus`.
5. `POST /subscription/create` con `subscription_start` = primer `billing_day` futuro.
6. Primer prorrateo: `customer/charge` **o** item/cupón en el primer invoice (validar en sandbox).
7. Upgrade: `changePlan` alinea el plan recurrente. Las dos facturas y el neto se calculan **en nuestro dominio**. Si Flow solo mueve un `balance`, persistir igual las dos líneas y cobrar el neto (cargo único o dos cargos). **Confirmar en sandbox** y documentar el método que funcione.
8. Mora: job diario (Santiago) calcula `access_level` según invoices Flow (`morose`, `invoice/get`, `getOverDue`) + `billing_day`.
9. Firma: HMAC-SHA256, params ordenados, campo `s`. Body `application/x-www-form-urlencoded`.

Callbacks públicos (HTTPS, idempotentes):

| Origen | URL sugerida | Siguiente llamada Flow |
|--------|----------------|------------------------|
| Registro tarjeta | `POST /webhooks/flow/register-return` | `customer/getRegisterStatus` |
| Pagos del plan (`urlCallback`) | `POST /webhooks/flow/plan-payment` | `invoice/get` y/o `payment/getStatus` (validar payload real en sandbox) |

No confiar en el POST: siempre reconsultar a Flow con el `token`.

---

## Contrato API (UI ↔ backend)

Base: igual que el resto (`/businesses/:businessId/...`). Solo `BUSINESS_ADMIN` muta billing. Colaborador puede **leer** `access_level` (para el modal).

### `POST /auth/register` (self-serve)

La UI crea el usuario en **Supabase Auth** (`signUp`) y manda esto en `user_metadata`:

```json
{
  "full_name": "María Soto",
  "business_name": "Panadería Aurora",
  "phone": "+56911111111",
  "needs_billing": true
}
```

**Funnel de la UI (no cobrar en el registro):**

1. `signUp` con sesión iniciada.
2. Onboarding obligatorio (5 pasos).
3. Conectar WhatsApp (Embedded Signup).
4. Recién ahí el usuario elige plan + `billing_day` y la UI llamará `POST /billing/checkout`.

El backend debe, al confirmar el usuario (webhook Auth o job):

1. Crear `Business` + `Profile` `BUSINESS_ADMIN`.
2. **No** forzar `plan_id` todavía: el plan se elige después de WhatsApp.
3. No aplicar este paywall a tenants existentes (sin `needs_billing`).

Sin el paso 1, el login cae en `?error=no_business`.

---

### `GET /billing/plans`

Lista fija. No hace falta pegarle a Flow en cada request (cache de catálogo).

```json
{
  "currency": "CLP",
  "iva_rate": 0.19,
  "billing_days": [5, 15, 30],
  "plans": [
    {
      "id": "easycomp_starter",
      "name": "Starter",
      "tagline": "Para 1 local",
      "recommended": false,
      "amount_net": 99990,
      "amount_iva": 18998,
      "amount_total": 118988,
      "promo": {
        "amount_net": 79990,
        "amount_iva": 15198,
        "amount_total": 95188,
        "months": 3
      },
      "interval": "month"
    }
  ]
}
```

### `GET /billing/subscription`

```json
{
  "status": "active",
  "access_level": "active",
  "plan_id": "easycomp_pro",
  "billing_day": 5,
  "billing_day_locked": true,
  "period_start": "2026-09-05",
  "period_end": "2026-10-04",
  "next_billing_date": "2026-10-05",
  "grace_deadline": null,
  "days_past_due": 0,
  "cancel_at": null,
  "card": { "brand": "Visa", "last4": "6623" },
  "restricted_features": []
}
```

`access_level`: `none` | `active` | `past_due_notify` | `past_due_restricted` | `locked` | `canceling` | `canceled`.

Sin suscripción: `status: "none"`, `access_level: "none"` (onboarding de pago; no confundir con locked de mora).

### `POST /billing/checkout`

```json
{ "plan_id": "easycomp_pro", "billing_day": 5 }
```

**201:** `{ "redirect_url": "https://sandbox.flow.cl/app/web/pay.php?token=..." }`  
**409:** ya tiene suscripción activa / `billing_day` inválido.

Tras volver de Flow, el backend crea customer+subscription+prorrateo.

### `POST /billing/change-plan/preview` y `POST /billing/change-plan`

Body: `{ "new_plan_id": "easycomp_business" }`

Preview:

```json
{
  "current_plan_id": "easycomp_pro",
  "new_plan_id": "easycomp_business",
  "days_used": 12,
  "days_remaining": 18,
  "invoice_current_plan": { "days": 12, "amount_total": 71395 },
  "invoice_new_plan": { "days": 18, "amount_total": 178488 },
  "credit_unused_current": 107093,
  "amount_due_now": 71395
}
```

(Números ilustrativos; usar la fórmula de arriba.)

### `POST /billing/cancel`

Sin body. Cancelación al fin de período (`at_period_end`).

### `POST /billing/portal` (opcional)

Re-registrar tarjeta (`customer/register` de nuevo) si la actual falla.

Errores: `400` validación, `402`/`409` mora/estado incompatible, `502` Flow caído.

---

## Persistencia sugerida (Prisma / Postgres)

No aplicar desde este repo. Spec para `chat-whatsapp-ai`.

```text
BusinessSubscription
  id, businessId unique
  planId                 // easycomp_starter | easycomp_pro | easycomp_business
  billingDay             // 5 | 15 | 30  IMMUTABLE
  status, accessLevel
  flowCustomerId, flowSubscriptionId
  periodStart, nextBillingDate, cancelAt
  cardBrand, cardLast4
  createdAt, updatedAt

BillingInvoice
  id, businessId, subscriptionId
  kind                   // signup_proration | recurring | upgrade_old | upgrade_new | retry
  flowInvoiceId?, flowOrder?
  amountNet, amountIva, amountTotal
  days, periodStart, periodEnd
  status                 // pending | paid | failed | void
  dueDate, paidAt
```

`business.metadata_json.plan_id` / `plan_limit` se pueden seguir actualizando **solo** como espejo; la fuente de verdad es `BusinessSubscription`.

Realtime opcional: la UI puede poll `GET /billing/subscription` al entrar a `/app` y tras volver del checkout.

---

## Notificaciones

Días 1–5 de mora, 1 correo/día + banner in-app (el GET ya trae `access_level` y `days_past_due`).  
Día 6: correo “funciones premium pausadas”.  
Día 11: correo “cuenta bloqueada hasta regularizar”.

---

## Env vars (solo backend)

```
FLOW_API_BASE=https://sandbox.flow.cl/api
FLOW_API_KEY=...
FLOW_SECRET_KEY=...
FLOW_PLAN_STARTER=easycomp_starter
FLOW_PLAN_PRO=easycomp_pro
FLOW_PLAN_BUSINESS=easycomp_business
FLOW_WEBHOOK_BASE=https://api-chatbotmanager.easycomp.cl
```

Nunca `NEXT_PUBLIC_*` para el secret.

---

## Cuenta sandbox (ops)

1. Registro (datos ficticios OK, **correo real**): [https://dashboard.sandbox.flow.cl/register/](https://dashboard.sandbox.flow.cl/register/)  
   País Chile, teléfono +56.
2. Confirmar el mail y completar datos del comercio.
3. **Integraciones → Integración por API** (o [Mis datos sandbox](https://sandbox.flow.cl/app/web/misDatos.php)) → copiar API Key y Secret Key al backend.
4. Crear los 3 planes (`plans/create` o portal).
5. Activar producto **suscripciones** si Flow lo pide aparte (condiciones comerciales; en sandbox suele estar para prueba).

Cuenta sandbox ≠ cuenta producción. Las keys no se mezclan.

Tarjeta de prueba Chile: `4051885600446623`, vencimiento cualquiera, CVV `123`. Simulador banco: RUT `11111111-1`, clave `123`.  
Docs: [credenciales de prueba](https://developers.flow.cl/docs/credentials).

---

## Qué debe hacer la UI cuando el API exista

- **Listo en UI:** `/register` (sesión) → onboarding obligatorio → WhatsApp → modal de plan (5/15/30). `needs_billing` en metadata; `plan_id` / `billing_day` recién al confirmar el plan. Tenants existentes no entran al paywall.
- Redirect Flow tras `POST /billing/checkout`
- Banner mora (`past_due_notify` / `past_due_restricted`)
- Deshabilitar nav/acciones premium si `restricted_features` / `past_due_restricted`
- Modal no cerrable si `locked`
- Uso del plan: plan actual, próximo cobro, cancelar, upgrade con preview de 2 facturas
- Política de privacidad: reemplazar `[COMPLETAR: proveedor de pagos]` por Flow (metadatos: estado, last4, ids; sin PAN)

---

## Pasos de prueba (sandbox)

1. Checkout Pro, día 15, tarjeta de prueba → `active`, `billing_day: 15`.
2. Intentar `PATCH` del día de cobro → 409 / no existe el endpoint.
3. Alta un día 20 con cobro el 5 → primer cargo prorrateado; recurrente el 5.
4. Upgrade Pro → Business → preview con 2 líneas; cobro neto; plan queda Business.
5. Cancelar → `cancel_at` = día 4 si `billing_day = 5`; app usable hasta entonces.
6. Forzar invoice fallido (o simular fechas) → días 1–5 banner; 6 premium off; 11 modal.
7. Pagar en día 7 → vuelve `active` y premium.
8. Colaborador con `locked` también ve el modal.

---

## Pendiente de validar en sandbox (avisar a UI)

- Payload real de `urlCallback` del plan.
- Cómo emitir el prorrateo inicial sin desfasar el aniversario.
- Upgrade: un cargo neto vs dos cargos Flow, manteniendo dos líneas en BD.
- Si suscripciones hay que “contratar” aunque sea en sandbox.
