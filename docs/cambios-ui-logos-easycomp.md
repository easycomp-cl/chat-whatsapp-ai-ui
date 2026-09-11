# Cambios UI — logos EasyComp

> **Fecha:** 2026-09-11

## Resumen

Se reemplazaron los isotipos antiguos (burbuja violeta / texto ConversAI) por los logos oficiales de **easyCOMP Chat Bot Manager**. El fondo negro de los PNG originales se convirtió a transparencia para usarlos sobre fondos claros y oscuros.

## Assets

| Archivo | Qué es | Dónde se usa |
|---------|--------|----------------|
| `public/easycomp-chat-bot-manager-mark.png` | Isotipo (robot + C) | Navbar landing, sidebar app/admin, favicon, hero 3D y fallback |
| `public/easycomp-chat-bot-manager-lockup-transparent.png` | Lockup apilado (ícono + easyCOMP + chat bot manager) | Login, recuperar contraseña, footer landing, páginas legales |
| `public/favicon.png` | Mark 192×192 | Favicon del navegador |

Se eliminó `public/conversai-logo.png`.

## Componente

`src/components/brand/logo.tsx` ahora acepta `variant="mark" | "lockup"`.

## Cómo probar

1. Landing `/`: navbar con isotipo + “easyCOMP”; footer con lockup; hero con mark rojo.
2. `/login` y `/forgot-password`: lockup completo.
3. App y admin: isotipo en el sidebar (dark).
4. Favicon de la pestaña del navegador.
5. Confirmar que no queda ningún logo ni correo `conversai` visible en la UI.
