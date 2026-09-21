# Cambios UI — Globos de sistema, patentes y fitment

**Fecha:** 2026-09-21  
**Backend:** migración `20260921180000_vehicle_fitment_system_events` + endpoints de vehículos (ya en `chat-whatsapp-ai`).  
**Vercel:** ninguna variable nueva.

## Resumen

En el hilo del inbox hay dos globos de sistema (solo panel, nunca WhatsApp):

- **Píldora azul** (`appearance: blue_pill`) para acciones del bot o del asesor.
- **Tarjeta oscura** (`appearance: dark_card`, fondo `#141414`) cuando una patente nueva trae datos del auto: marca, modelo, año y patente. Si no hay datos, sigue siendo píldora azul.

El panel de contacto muestra el **garage** (varios autos, activo resaltado) y el historial de SKUs consultados / cotizados / comprados. En cabecera hay chips de esos vehículos. Desde **+ → Herramientas EasyComp** se puede **consultar patente** y, en cotización, filtrar el catálogo por patente o marca/modelo/año.

## Cambios visibles

### Chat

- Píldora celeste centrada. Arriba a la izquierda: ícono de bot azul si lo hizo el bot, o ícono de usuario rojo y el **nombre real** del asesor (no el genérico “Asesor”). A la derecha, fecha y hora. Debajo, en `11px`: **se añadió:** / **se modificó:** con etiquetas legibles (ej. `cliente frecuente: sí`, no `manual_returning: true`). El globo usa el ancho del texto, con tope de 28rem. Si el backend manda `payload.added` / `payload.modified`, se usan esas líneas; si no, se parsean del `body` / `content_text`. El globo lo inserta el backend: la UI no duplica uno local.
- Tarjeta oscura cuando `appearance === "dark_card"` (o `plate_lookup` con marca/modelo). Siempre en filas ordenadas (Marca, Modelo, Año, Versión, Color, etc.), también si el backend mandó el body compacto con `·`. No muestra dueño ni RUT. Auto y moto usan ícono distinto.
- Mensajes viejos sin `appearance` se tratan como píldora azul.
- Si `system_event` viene vacío, se usa `content_text`.
- El preview del inbox **no** usa el texto del globo (fallback Supabase también lo salta).
- No marca el chat como no leído del cliente.

### Cabecera

Chips de todos los vehículos del garage; el activo va resaltado.

### Menú +

Junto a **Crear cotización**: **Consultar patente**. No abre un modal: inserta el mismo globo negro en el hilo. Ahí se escribe la patente. Mayúsculas, minúsculas y espacios se normalizan solos. Un ícono de información avisa que el cliente no ve el globo y que no sale por WhatsApp.

Formatos validados en la UI (no se consulta si el formato no cierra):

- Auto antiguo: `AB1234` → `AB 12 34`
- Auto actual: `BBBB12` → `BB BB 12`
- Auto nuevo (Diario Oficial ene 2026): `BBBBB0` → `BBBBB 0`
- Moto antigua: `AB123` → `AB 123`
- Moto actual: `ABC12` → `ABC 12`
- Moto nueva (Diario Oficial ene 2026): `BBBB0` → `BBBB 0`

El globo marca **Auto** o **Moto**. Al consultar, se agranda con **todos** los campos con valor: marca, modelo, año, versión, color, combustible, transmisión, motor, VIN y tipo. Si el formato no es válido, el botón queda deshabilitado y se muestra el aviso sin llamar a la API.

El servidor todavía solo acepta patentes de auto. Una moto bien escrita avisa que el formato está listo y la consulta de motos falta en backend. Spec: `docs/pending/to-backend/backend-globo-patente.md`. El globo de la consulta vive en la sesión: al recargar no reaparece hasta que el backend persista el mensaje.

### Panel de contacto

Al guardar, la UI envía **solo los campos que cambiaron**, más `conversation_id` y `profile_updated_by: BUSINESS_ADMIN`. Si no hay cambios, no llama al API.

Nombre y apellido van solo dentro de `profile_metadata` (merge de esas claves), sin reenviar el garage.

En **Vehículos y productos**, al pasar el mouse aparecen ojo (detalle) y basura (modal de confirmación). Eliminar llama `DELETE .../vehicles/:key` o `DELETE .../products` con `conversation_id` + `actor_name`. El backend debe dejar la píldora **se eliminó:**. Spec: `docs/pending/to-backend/backend-garage-eliminar-vehiculo-producto.md`.

Al guardar perfil / frecuente, la UI manda `actor_name` (nombre real del asesor) junto con `conversation_id`.

La píldora azul de “quién guardó qué” la tiene que insertar el backend como mensaje `SYSTEM` en el chat. Spec: `docs/pending/to-backend/backend-globo-cambio-datos-cliente.md`. Hasta ese insert, el aviso verde puede salir y el hilo quedar igual.

### Cotización

Campo **Vehículo / patente**. Llama a fitment y deja solo SKUs compatibles. Si no hay match, catálogo completo + aviso “base beta, no confirmado”. Si el contacto tiene auto activo, se prefiltra.

## Archivos principales

| Área | Ruta |
|------|------|
| Tipos | `types/message.ts`, `types/database.types.ts` |
| Globo | `src/features/conversations/components/chat-system-event-bubble.tsx` |
| Patente | `src/features/conversations/components/chat-plate-lookup-balloon.tsx` |
| Garage | `src/features/conversations/components/customer-garage-section.tsx` |
| Cliente API | `src/lib/bot-api/vehicles.ts`, `src/lib/bot-api/client.ts` |
| Actions | `src/lib/actions/vehicle-actions.ts`, `src/lib/actions/customer-profile-actions.ts` |
| Cotización | `src/features/quotes/product-quote-modal.tsx` |
| Vista mensajes | `supabase/migrations/20260921190000_messages_system_event_view.sql` |

## Cómo probar

1. Backend con la migración de vehículos. Sin `VEHICLE_PLATE_API_URL` está bien.
2. Inbox: `Hola me llamo Camila, mi RUT es 12.345.678-5`. Globo **El bot guardó un dato del contacto** y panel con alias + RUT.
3. Editar el email del contacto con el chat abierto. El `PATCH` lleva solo `email`. El backend debe dejar en el hilo la píldora **El asesor guardó un dato del contacto** con el email nuevo. Ver `docs/pending/to-backend/backend-globo-cambio-datos-cliente.md`.
4. `Necesito filtro para la Hilux 2018 y pastillas para el Yaris`. Dos vehículos en `garage.vehicles` y dos chips en cabecera.
5. `tengo la patente BB BB 12 y también AB1234`. Ambas se guardan; la última queda activa.
6. **+ → Consultar patente**. El globo negro valida el formato antes de llamar. `kk rs 47` → auto; `abc12` → moto; `bbbb0` → moto nueva. Solo con formato completo se consulta. El globo lista todos los campos con valor.
7. Tomar el chat y devolverlo al bot: globos de handoff / mode_changed.
8. El preview de la lista **no** queda en el texto del globo.
9. WhatsApp del cliente no recibe el globo azul.
10. Cotización: con patente o Hilux 2018, el listado se reduce a SKUs compatibles o muestra el aviso beta.
