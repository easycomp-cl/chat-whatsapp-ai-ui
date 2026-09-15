# Cambios UI — Wizard de onboarding

## Resumen

Se implementó el wizard de configuración inicial del negocio como **modal/dialog** sobre la app, con layout de dos paneles (stepper lateral + formulario) inspirado en el mockup de referencia.

## Comportamiento visible

- En **desarrollo** (`NODE_ENV=development`), aparece la sección **Desarrollo** al final del sidebar con el botón **Onboarding wizard** y enlaces a **Landing page** (`/`), **Política de privacidad** y **Eliminación de datos**.
- Al pulsarlo se abre un modal centrado sobre la app (backdrop con blur).
- El wizard tiene **5 pasos**: Tu negocio → Qué ofreces → Operación → Contacto humano → Tu bot. Al completar, redirige a `/onboarding/whatsapp` para Embedded Signup.
- Barra de progreso y stepper vertical (desktop) / horizontal (móvil) con color `#7678ed`.
- Descripción del negocio: mín. 50 / máx. 1.000 caracteres con contador.
- Paso Operación: horario con selector tipo alarma (días + hora apertura/cierre), región y comuna en selects dependientes, medios de pago con checkboxes multi-selección.
- Animaciones suaves al cambiar de paso (`fade-in` + `slide-in`).
- Paso **Tu asistente** (5): toggle «Asistente con nombre propio» al inicio. Si está activo, se pide nombre del agente (mascota virtual); si no, solo tono y saludo en voz del negocio. El **mensaje de saludo es obligatorio** (mín. 10 caracteres).
- Al entrar al portal, un administrador ve un modal para **Empezar ahora** o **Hacerlo después**. «Después» lo oculta **1 hora**; luego vuelve a aparecer (también si la pestaña sigue abierta).
- Paso Contacto humano: se puede pedir un código WhatsApp para validar el número personal (plantilla AUTHENTICATION). El envío real lo hace el backend cuando la WABA y la plantilla estén listas.
- El wizard arranca con **campos vacíos** en todos los pasos (sin The Wood Club ni productos de ejemplo).
- Si el backend no responde, el wizard muestra el error al guardar. No hay modo local ni aviso de desarrollo.

## Archivos nuevos

| Ruta | Descripción |
|------|-------------|
| `src/features/onboarding/types.ts` | Tipos del wizard y setup-status |
| `src/features/onboarding/utils.ts` | Validación, merge draft, preview |
| `src/features/onboarding/components/onboarding-wizard-dialog.tsx` | Modal principal |
| `src/features/onboarding/components/onboarding-stepper.tsx` | Stepper + progreso |
| `src/features/onboarding/components/onboarding-dev-trigger.tsx` | Botón dev en sidebar |
| `src/features/onboarding/components/onboarding-required-guard.tsx` | Prompt empezar / más tarde + wizard |
| `src/features/onboarding/components/onboarding-start-prompt.tsx` | Modal inicial del onboarding |
| `src/features/onboarding/components/offering-list-editor.tsx` | Editor de productos/servicios |
| `src/features/onboarding/components/bot-preview-card.tsx` | Preview WhatsApp |
| `src/features/onboarding/components/steps/*` | Formularios por paso |

## API / backend requerido

- `GET /businesses/:id/setup-status`
- `PATCH /businesses/:id/onboarding`
- `POST /businesses/:id/onboarding/complete`

Server actions: `getSetupStatusAction`, `patchOnboardingAction`, `completeOnboardingAction` en `app-actions.ts`.

En producción, si `GET /businesses/:id/setup-status` devuelve `completed_at: null` (o el endpoint falla), aparece el modal **Empezar ahora / Hacerlo después**. El wizard no es bloqueante.

En desarrollo el aviso también aparece para poder probarlo, y el botón **Onboarding wizard** del sidebar sigue disponible.

## Cómo probar

1. `npm run dev` y entrar al portal autenticado.
2. En el sidebar, sección **Desarrollo** → **Onboarding wizard**.
3. Completar los 5 pasos; validaciones frontend activas en cada paso.
4. Con backend levantado: verificar PATCH entre pasos y POST complete al final.
5. Sin backend: al pulsar Siguiente aparece el error de guardado; los campos siguen vacíos.
