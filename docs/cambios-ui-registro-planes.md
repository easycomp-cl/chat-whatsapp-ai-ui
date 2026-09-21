# Registro y selección de plan

## Qué cambió

- Nueva página pública `/register`: nombre, negocio, email, teléfono opcional, contraseña y consentimiento.
- Tras crear la cuenta **la sesión queda iniciada** (si Supabase no pide confirmar email).
- El modal de plan **no** aparece en el registro. El funnel self-serve es:

  1. Crear cuenta (sesión)
  2. Onboarding obligatorio (no se puede “hacerlo después”)
  3. Conectar el número de WhatsApp
  4. Modal de plan (Starter / Pro / Business + día 5 / 15 / 30)

- Starter muestra precio de lista **$99.990** tachado y oferta **$79.990 + IVA** por **3 meses**.
- Solo se marca `needs_billing` en `user_metadata` + `localStorage` (por `user_id`). Los tenants ya existentes **no** ven este modal.
- Al confirmar el plan se guarda `plan_id` / `billing_day` y se limpia `needs_billing`. El cobro Flow **aún no** se dispara (falta backend).

## Estados visibles

| Estado | UI |
|--------|----|
| Formulario inválido | Errores por campo |
| Cuenta creada con sesión | Redirect a `/app/dashboard` → onboarding |
| Email por confirmar | “Revisa tu correo…” y luego login |
| Onboarding pendiente (alta nueva) | Wizard obligatorio, sin “hacerlo después” |
| WhatsApp sin conectar | Redirect a `/onboarding/whatsapp` |
| WhatsApp conectado + `needs_billing` | Modal de planes, no cerrable |
| Email ya registrado | Error en el formulario |
| Tenant existente | Sin modal de pago ni funnel forzado |

## Backend requerido

Ver [pending/to-backend/backend-flow-subscriptions.md](pending/to-backend/backend-flow-subscriptions.md).

Sin `Business` + `Profile` al alta, el usuario no entra al dashboard (`no_business`).

Supabase Auth debe **permitir signups** públicos.

## Prueba

1. `/register` (sin sesión).
2. Completar datos → **Crear cuenta**.
3. Debe quedar sesión e ir al dashboard (o pedir confirmar email).
4. Completar onboarding → conectar WhatsApp.
5. Tras el número conectado, se abre el modal de plan.
6. Un admin de un negocio ya existente no debe ver ese modal.
