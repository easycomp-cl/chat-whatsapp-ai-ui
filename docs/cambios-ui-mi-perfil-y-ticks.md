# Cambios UI — Mi Perfil y ticks de entrega

## Mi Perfil

- Nuevo ítem **Mi Perfil** al inicio del menú lateral (`/app/perfil`).
- Formulario: nombre, apellido, teléfono personal, correo (solo lectura), rol (solo lectura).
- Guardado en Supabase `profiles` + sincroniza `full_name` en auth metadata.

### Migración

`supabase/migrations/20260731160000_profiles_personal_fields.sql`

- Columnas: `first_name`, `last_name`, `personal_phone`
- Política RLS `profiles_update_own` para que cada usuario edite su fila

## Ticks de WhatsApp (enviado / entregado / visto)

La UI ya soporta:

| Estado | Visual |
|--------|--------|
| `sent` | ✓ gris |
| `delivered` | ✓✓ gris |
| `read` | ✓✓ azul |

Los ticks azules en **visto** aplican a todos los mensajes salientes (humano y bot automático).

**Limitación actual:** el backend solo persiste `SENT`. Hasta que implementen webhooks `delivered`/`read` de Meta, verás un solo tick gris. Ver `docs/pending/to-backend/backend-whatsapp-delivery-status-read.md`.

Ajuste visual: en estados con tick ya no se muestra el texto «Enviado» junto al icono (estilo WhatsApp); el estado completo queda en el `title` al pasar el mouse.

## Prueba

1. Aplicar migración en Supabase easycomp-chat-bot-manager.
2. Menú → **Mi Perfil** → editar y guardar.
3. Enviar mensaje saliente: un tick gris hasta que backend envíe `DELIVERED`/`READ`.
