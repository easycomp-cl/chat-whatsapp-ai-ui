# Cambios UI — páginas legales públicas

> **Fecha:** 2026-08-01  
> **Repositorio:** `chat-whatsapp-ai-ui`

## Resumen

Se añadieron dos páginas públicas sin autenticación para cumplir requisitos de Meta App Review y transparencia legal:

- `/politica-de-privacidad`
- `/eliminacion-de-datos`

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/app/politica-de-privacidad/page.tsx` | Página de política de privacidad |
| `src/app/eliminacion-de-datos/page.tsx` | Página de eliminación de datos |
| `src/components/legal/*` | Layout y componentes reutilizables |
| `src/lib/legal/constants.ts` | Constantes legales compartidas |
| `src/lib/legal/metadata.ts` | Helper de metadata SEO |
| `src/lib/legal/privacy-policy-content.tsx` | Contenido de la política |
| `src/features/onboarding/components/onboarding-dev-trigger.tsx` | Enlaces dev a páginas legales |
| `src/app/globals.css` | Estilos de impresión para páginas legales |

## Dependencias de deploy

- **Vercel:** redeploy para publicar las rutas.
- **Backend:** no requerido para visualizar las páginas.
- Callback técnico de eliminación de datos de Meta: pendiente en backend.

## Cómo probar

1. Abrir `/politica-de-privacidad` y `/eliminacion-de-datos` en ventana de incógnito.
2. Verificar HTTP 200 (sin redirección a `/login`).
3. Revisar metadata (title, description, canonical, robots).
4. Probar navegación por anclas y enlaces cruzados.
5. Verificar vista móvil y modo impresión.
6. Confirmar que rutas `/app/*` siguen protegidas.

## Pendientes legales

Completar marcadores `[COMPLETAR]` en `src/lib/legal/constants.ts` y en el contenido antes de publicación definitiva en producción.
