# Cambios UI — performance dashboard e importar chat

> **Fecha:** 2026-07-12  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend relacionado:** `GET /businesses/:id/metrics/dashboard`, optimizaciones en `tone-analysis/consolidated`

## Resumen

El Dashboard usa un único endpoint agregado del bot API en lugar de 3 requests. Importar chat deja de forzar consolidación de tono con IA en la carga inicial (`ai=false`).

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/lib/bot-api/client.ts` | `getMetricsDashboard()`; default `useAi=false` en tono consolidado |
| `src/features/dashboard/components/dashboard-page-content.tsx` | 1 llamada `getMetricsDashboard` + Supabase count |
| `src/features/chat-import/components/importar-chat-sections-content.tsx` | `getConsolidatedToneAction(false)` en SSR |
| `src/lib/actions/chat-import-actions.ts` | Default `useAi=false` |

## Dependencias de deploy

1. Backend desplegado con `GET /businesses/:id/metrics/dashboard` y migración de índices.
2. Vercel redeploy tras merge (sin nuevas env vars).
3. `BOT_API_BASE_URL` / `BOT_API_SECRET` sin cambios.

## Cómo probar

1. Abrir `/app/dashboard` — debe cargar más rápido (1 request bot API vs 3).
2. Abrir `/app/importar-chat` — sin espera de OpenAI si no hay análisis de tono pendiente.
3. DevTools → Network: verificar `metrics/dashboard` en lugar de `summary` + `questions` + `usage`.
