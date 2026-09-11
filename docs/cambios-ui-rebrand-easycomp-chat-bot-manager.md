# Cambios UI — rebrand ConversAI → easycomp-chat-bot-manager

> **Fecha:** 2026-09-11

## Resumen

Refactor técnico y rebrand completo del nombre de producto **ConversAI** a **easycomp-chat-bot-manager** en código, UI, assets, claves de almacenamiento local y documentación interna.

## Constantes centralizadas

`src/lib/brand/constants.ts`:
- `PRODUCT_NAME`
- `META_APP_NAME`
- `STORAGE_PREFIX`
- `SPLINE_SCENE_ENV_KEY`
- `BRAND_ASSETS`

## Archivos renombrados

| Antes | Después |
|-------|---------|
| `public/conversai-mark.png` | `public/easycomp-chat-bot-manager-mark.png` |
| `public/conversai-lockup-transparent.png` | `public/easycomp-chat-bot-manager-lockup-transparent.png` |
| `ConversAI3DScene.tsx` | `EasycompChatBotManager3DScene.tsx` |
| `ConversAIHero3D.tsx` | `EasycompChatBotManagerHero3D.tsx` |
| `ConversAIHeroCanvas.tsx` | `EasycompChatBotManagerHeroCanvas.tsx` |
| `ConversAIScene.tsx` | `EasycompChatBotManagerScene.tsx` |
| `ConversAILogo3D.tsx` | `EasycompChatBotManagerLogo3D.tsx` |
| `docs/CONVERSAI_HERO_3D_INTEGRATION.md` | `docs/EASYCOMP_CHAT_BOT_MANAGER_HERO_3D_INTEGRATION.md` |

## Sin cambiar (infraestructura real)

- `api.conversai.easycomp.cl`
- `soporte@conversai.cl`
- `BOT_API_BASE_URL` en `.env.example`

## Variable de entorno Spline

Renombrada: `NEXT_PUBLIC_SPLINE_EASYCOMP_CHAT_BOT_MANAGER_SCENE_URL`

## Cómo probar

1. `npm run dev` y revisar landing, login, sidebar y páginas legales.
2. Verificar hero 3D y favicon (`easycomp-chat-bot-manager-mark.png`).
3. Confirmar que preferencias en localStorage usan prefijo `easycomp-chat-bot-manager:`.
