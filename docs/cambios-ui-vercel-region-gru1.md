# Cambios UI — región Vercel gru1 (São Paulo)

> **Fecha:** 2026-07-26  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Proyecto Vercel:** `chat-whatsapp-ai-ui-gwzr` (`prj_UBXOYLu3qj7L7YSuhONKnp5QA6Ho`)

## Resumen

Se alineó la región de ejecución de las Server Functions de Vercel con el resto del stack (`sa-east-1`): Supabase, Upstash Redis y AWS ECS estaban en São Paulo, pero Vercel corría en `iad1` (Virginia).

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `vercel.json` | Añadido `"regions": ["gru1"]` |
| Dashboard Vercel (API) | `functionDefaultRegions` → `["gru1"]` |

## Dependencias de deploy

- **Vercel:** redeploy necesario para que los nuevos builds ejecuten funciones en `gru1`.
- **Supabase / Redis / AWS:** sin cambios; ya estaban en `sa-east-1`.
- Variables de entorno: sin cambios.

## Cómo probar

1. Hacer redeploy en Vercel (push a `main`/`staging` o Deploy Hook).
2. En logs de una función server-side, verificar `VERCEL_REGION=gru1` (si se expone en debug).
3. Medir latencia UI → Supabase y UI → `BOT_API_BASE_URL`; debería mejorar vs `iad1` para usuarios en Chile.

## Región antes / después

| | Antes | Después |
|---|-------|---------|
| Vercel Functions | `iad1` (Washington D.C.) | `gru1` (São Paulo) |
| Supabase | `sa-east-1` | `sa-east-1` |
| Upstash Redis | `sa-east-1` | `sa-east-1` |
| AWS ECS | `sa-east-1` | `sa-east-1` |
