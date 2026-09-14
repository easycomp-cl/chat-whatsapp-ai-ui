# Cambios UI — entrada de la app (sin landing)

## Resumen

La landing comercial ya no se sirve en `chatbotmanager.easycomp.cl`. Esa página vive en [easycomp.cl](https://easycomp.cl), que redirige al inicio de la app. `/` en esta UI redirige al login si no hay sesión, o al dashboard si hay sesión activa.

## Comportamiento visible

- `/` **no muestra** la landing morada
- Sin sesión: `/` → `/login`
- Con sesión: `/` → `/app/dashboard`
- El mismo criterio aplica si el usuario entra a `/login` con sesión activa (ya existía)
- Páginas legales (`/politica-de-privacidad`, `/eliminacion-de-datos`) siguen públicas
- «Volver al sitio» en páginas legales apunta a `https://easycomp.cl`

## Archivos principales

| Ruta | Descripción |
|------|-------------|
| `src/lib/supabase/middleware.ts` | Redirección de `/` según sesión |
| `src/app/page.tsx` | Fallback de redirección en el servidor |
| `src/app/sitemap.ts` | Sitemap sin la landing como home comercial |
| `src/components/legal/legal-page-layout.tsx` | Enlace al sitio oficial EasyComp |
| `src/lib/brand/constants.ts` | `MARKETING_SITE_URL` |

Los componentes en `src/components/landing/` y `src/lib/landing/` quedan sin uso en la ruta pública. La landing comercial se mantiene en easycomp.cl.

## Cómo probar

1. `npm run dev` → abrir `http://localhost:3001/` **sin sesión** (incógnito)
2. Confirmar redirección a `/login` (no debe verse la landing)
3. Iniciar sesión y volver a `/`
4. Confirmar redirección a `/app/dashboard`
5. Abrir `/politica-de-privacidad` y comprobar que «Volver al sitio» lleva a easycomp.cl
