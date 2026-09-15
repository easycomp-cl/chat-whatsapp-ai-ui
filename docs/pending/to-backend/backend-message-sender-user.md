# Backend — Remitente humano en mensajes salientes

## Qué necesita la UI

Para auditoría, cada mensaje `OUTBOUND` con `sender_type = HUMAN` debe persistir quién lo envió desde el dashboard.

| Campo UI | Origen sugerido Prisma | Tipo |
|----------|------------------------|------|
| `sender_user_id` | `sentByUserId` (UUID auth.users) | `UUID?` |
| `sender_display_name` | opcional cache `firstName + lastName` al enviar | `TEXT?` |

Exponer en vista `public.messages` cuando existan columnas en `"Message"`.

Hasta que existan, la UI **no** las pide en el `select` (PostgREST devolvía 400 en cada poll de `/app/conversations/[id]` y llenaba la consola).

## Cuándo setear (backend `chat-whatsapp-ai`)

- `POST /conversations/:id/messages` — texto
- `POST /conversations/:id/messages/media` — archivos / notas de voz

Tomar `user_id` del JWT/sesión del dashboard y guardar en el mensaje al crear.

## Comportamiento UI actual (sin backend)

- Mensajes **nuevos** en la sesión muestran nombre + apellido del usuario logueado (optimista + merge local).
- Tras recargar, mensajes antiguos sin `sender_user_id` en BD muestran **«Usuario»** hasta que backend persista el campo.

## Prueba E2E

1. Usuario A envía mensaje → burbuja muestra «Nombre Apellido A».
2. Usuario B abre la misma conversación → mismo mensaje muestra nombre de A (requiere BD).
3. Recargar página → nombre sigue visible (requiere BD).
