# Cambios UI — Wizard de onboarding

## Resumen

Se implementó el wizard de configuración inicial del negocio como **modal/dialog** sobre la app, con layout de dos paneles (stepper lateral + formulario) inspirado en el mockup de referencia.

## Comportamiento visible

- En **desarrollo** (`NODE_ENV=development`), aparece la sección **Desarrollo** al final del sidebar con el botón **Onboarding wizard** y enlaces a **Landing page** (`/`), **Política de privacidad** y **Eliminación de datos**.
- Al pulsarlo se abre un modal centrado sobre la app (backdrop con blur).
- El wizard tiene **5 pasos**: Tu negocio → Qué ofreces → Operación → Contacto humano → Tu bot. Al completar, redirige a `/onboarding/whatsapp` para Embedded Signup.
- Barra de progreso y stepper vertical (desktop) / horizontal (móvil) con color `#7678ed`.
- Descripción del negocio: mín. 50 / máx. 1.000 caracteres con contador.
- El wizard **persiste el avance automáticamente** (localStorage + PATCH con debounce). Si se corta la conexión o el usuario cierra y vuelve otro día **en el mismo dispositivo**, recupera campos, paso y logo (si cabía en el almacenamiento local). El pie muestra Guardando / Guardado / Sin conexión.
- El prompt inicial dice **Continuar** cuando ya hay un borrador.
- Al pulsar Siguiente, si el backend falla el wizard **igual avanza**; los datos no se pierden. Activar al final sí requiere API.
- Paso **Tu negocio**: campo opcional **Logo de la empresa** (PNG, JPG o WebP, máx. 2 MB) con vista previa. Si hay logo, también aparece en la cabecera de la demo de WhatsApp del paso 5.
- Paso Operación: horario con selector tipo alarma (días + hora apertura/cierre), región y comuna en selects dependientes, medios de pago con checkboxes multi-selección.
- Animaciones suaves al cambiar de paso (`fade-in` + `slide-in`).
- Paso **Tu asistente** (5): toggle «Asistente con nombre propio» al inicio. Si está activo, se pide nombre del agente (mascota virtual); si no, solo tono y saludo en voz del negocio. El **mensaje de saludo es obligatorio** (mín. 10 caracteres).
- Al entrar al portal, un administrador ve un modal para **Empezar ahora** o **Hacerlo después**. «Después» lo oculta **1 hora**; luego vuelve a aparecer (también si la pestaña sigue abierta).
- Paso Contacto humano: se puede pedir un código WhatsApp para validar el número personal (plantilla AUTHENTICATION). El envío real lo hace el backend cuando la WABA y la plantilla estén listas.
- El wizard reanuda el **borrador guardado** (no arranca vacío si el usuario ya había escrito).
- **Contactar soporte** en el panel del wizard abre `mailto:contacto@easycomp.cl`.

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
| `src/features/onboarding/components/business-logo-picker.tsx` | Selector opcional del logo |
| `src/features/onboarding/logo-utils.ts` | Validación de archivo del logo |
| `src/features/onboarding/draft-storage.ts` | Cache local del borrador |
| `src/features/onboarding/draft-persistence.ts` | Hidratar local + servidor |
| `src/features/onboarding/use-onboarding-draft.ts` | Autoguardado |
| `src/features/onboarding/components/steps/*` | Formularios por paso |

## API / backend requerido

- `GET /businesses/:id/setup-status`
- `PATCH /businesses/:id/onboarding` — **parcial**, sin validar pasos incompletos; aceptar `current_step`
- `POST /businesses/:id/onboarding/complete`
- `GET /businesses/:id/setup-status` debe devolver `draft`, `draft_updated_at`, `current_step`

Persistencia completa: [backend-onboarding-draft-persistence.md](pending/to-backend/backend-onboarding-draft-persistence.md). Logo: [backend-business-logo.md](pending/to-backend/backend-business-logo.md).
- `POST /businesses/:id/logo` (multipart `file`) — ver [backend-business-logo.md](pending/to-backend/backend-business-logo.md)

Server actions: `getSetupStatusAction`, `patchOnboardingAction`, `completeOnboardingAction` en `app-actions.ts`.

En producción, si `GET /businesses/:id/setup-status` devuelve `completed_at: null` (o el endpoint falla), aparece el modal **Empezar ahora / Hacerlo después**. El wizard no es bloqueante.

En desarrollo el aviso también aparece para poder probarlo, y el botón **Onboarding wizard** del sidebar sigue disponible.

## Cómo probar

1. `npm run dev` y entrar al portal autenticado.
2. En el sidebar, sección **Desarrollo** → **Onboarding wizard**.
3. Escribir el nombre del negocio, cerrar el wizard, recargar la app y volver a abrirlo: el nombre y el paso deben seguir ahí. El pie debe decir que está guardado.
4. Completar los 5 pasos; validaciones frontend activas en cada paso. El logo del paso 1 se puede omitir.
4. Subir un PNG/JPG/WebP en **Logo de la empresa**, ver la miniatura y comprobarlo en la demo de WhatsApp del paso 5. Quitar el logo y continuar también debe funcionar.
5. Con backend levantado: verificar PATCH entre pasos, `POST /businesses/:id/logo` al subir imagen y POST complete al final.
6. Sin backend: al pulsar Siguiente aparece el error de guardado (si no hay API). Si hay API de onboarding pero falta el endpoint de logo, el wizard avisa y deja continuar.
