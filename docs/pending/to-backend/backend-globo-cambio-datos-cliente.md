# Backend — Globo azul al cambiar datos del cliente

**Repo:** `chat-whatsapp-ai`  
**UI:** al guardar el perfil, espera el `Message` `SYSTEM` del backend (no inserta un globo local). Si el insert falla, el `PATCH` no puede responder 200 en silencio.  
**Fecha:** 2026-09-21

## Requerimiento

Cada vez que **el bot o un asesor** agrega o modifica un dato del contacto, eso queda registrado en la conversación como **globo azul de sistema** (solo panel, nunca WhatsApp). El globo dice **quién** lo hizo y **qué** se agregó o cambió, con el valor nuevo.

Tiene que persistir como `Message` (`senderType: SYSTEM`, `contentType: SYSTEM_EVENT`). Si el insert falla, el `PATCH` no puede responder 200 en silencio.

## Qué manda la UI al guardar desde el panel

`PATCH /businesses/:id/customers/:customerId`

Solo van los campos que cambiaron, más:

```json
{
  "email": "nuevo@correo.com",
  "conversation_id": "<id del chat abierto>",
  "profile_updated_by": "BUSINESS_ADMIN",
  "actor_name": "Israel Gonzalez"
}
```

Nombre y apellido no van sueltos (el schema es `.strict()` y los rechaza). Van solo dentro de `profile_metadata`, y solo si cambiaron:

```json
{
  "profile_metadata": { "first_name": "Camila", "last_name": "Soto" },
  "conversation_id": "<id>",
  "profile_updated_by": "BUSINESS_ADMIN"
}
```

Ese objeto es un merge de esas dos claves. No incluye el garage ni el historial de SKUs.

## Globo que debe quedar en el chat

`appearance: "blue_pill"`. Actor `HUMAN` si lo guardó el panel (`profile_updated_by` distinto de `BOT`). Actor `BOT` si lo extrajo el bot del mensaje del cliente.

| Quién | `kind` | Título |
|-------|--------|--------|
| Bot | `profile_saved` | El bot guardó un dato del contacto |
| Asesor | `profile_updated` | El asesor guardó un dato del contacto |

Cuerpo y `payload` para que la UI arme el globo igual después de recargar:

```ts
payload: {
  actor_name: "Israel Gonzalez", // nombre real del asesor; el bot no lo manda
  added: ["email: nuevo@correo.com", "tipo de documento: boleta"],
  modified: ["nombre visible: Israel -> Isra", "tipo de documento: boleta -> factura"]
}
```

- **se añadió:** valor nuevo, con etiqueta legible.
- **se modificó:** `campo: anterior -> nuevo`.
- **se eliminó:** (garage) `vehículo: …` / `producto: …` vía `payload.removed`.
- En `payload.actor_name` va el **nombre real del asesor**. La UI lo manda en el PATCH/DELETE. No usar “Asesor” ni el nombre del tenant.

`content_text` puede ser el mismo texto, por ejemplo `se modificó: nombre visible: Israel -> Isra`.

Si `profile_metadata` trae `first_name` / `last_name`, hablar de nombre y apellido. No usar “vehículos u otros datos del perfil” para un cambio de nombre.

No crear el globo si ningún valor cambió de verdad.

## Huecos en el código actual

1. `customers.controller.ts` arma el cuerpo con `describeProfileEventFields(changedFields)` **sin valores**. El globo queda en “email” y no dice cuál email.
2. `shouldOverwriteField` no deja que un asesor pise un campo que ya tiene texto. Cambiar un email existente no se guarda, pero el `PATCH` igual responde 200. El asesor tiene que poder **modificar** datos ya cargados.
3. `system-event.service.ts` atrapa el error del `message.create` y lo loguea (`Failed to append system event`). El perfil se guarda y el globo no existe. Si falta el enum `ContentType.SYSTEM_EVENT` (migración `20260921180000_vehicle_fitment_system_events`), pasa exactamente eso.
4. El globo debe asociarse al `conversation_id` del body. Si esa conversación no es del cliente, no inventar otra en silencio: responder error.

## Qué no hacer

- No enviar el globo por WhatsApp.
- No usarlo como preview del inbox ni como no leído del cliente.
- No incluir dueño de vehículo, RUT del dueño del auto, ni `owner`.

## Prueba

1. Chat abierto. El asesor cambia el email de un contacto que **ya tenía** email. El valor nuevo queda en el perfil.
2. Recargar el chat: la misma píldora sigue ahí (no solo en la sesión de quien guardó).
3. Otro asesor abre el mismo chat y ve la misma píldora.
4. El cliente en WhatsApp no recibe ese texto.
5. El bot guarda un nombre desde un mensaje del cliente. Píldora “El bot guardó un dato del contacto” con `nombre: …`.
6. Guardar sin cambiar nada no crea píldora.
