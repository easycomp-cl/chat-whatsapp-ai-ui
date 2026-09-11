# Cambios UI — Ventana 24 h WhatsApp

## Comportamiento visible

- Indicador compacto junto a **Vista previa WhatsApp**: icono ventana + cuenta regresiva `HH:MM:SS` con tooltip explicativo.

## Archivos

- `src/lib/conversations/whatsapp-service-window.ts`
- `src/features/conversations/hooks/use-whatsapp-service-window.ts`
- `src/features/conversations/components/whatsapp-service-window-indicator.tsx`
- `src/features/conversations/components/chat-window.tsx`
- `src/features/conversations/components/reply-form.tsx`

## Backend requerido para recontacto fuera de 24 h

`docs/pending/to-backend/backend-whatsapp-message-templates.md`

## Prueba

1. Conversación con inbound reciente → banner verde + envío normal.
2. Conversación sin inbound en 24 h → banner rojo + composer deshabilitado.
3. Tras nuevo mensaje del cliente → ventana se reabre.
