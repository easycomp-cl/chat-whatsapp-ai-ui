# Cambios UI — globos de chat, panel de contacto y envío

## Resumen

Se corrigieron tres problemas visibles en producción en `/app/conversations`:

1. El panel derecho de información del contacto quedaba recortado.
2. URLs y texto largo se salían del globo de chat.
3. Al enviar un mensaje aparecía el toast ofuscado de Next.js (*An error occurred in the Server Components render…*) en lugar del error real.

## Panel de contacto

- Las columnas del inbox se reajustan al tamaño del contenedor (ResizeObserver) para que lista + chat + contacto no desborden.
- Si no hay espacio, el panel de contacto se estrecha en vez de salirse de la ventana.
- Textos largos (nombre, teléfono, «Guardar como cliente frecuente») hacen wrap dentro del panel.

## Globos de chat

- El texto de los mensajes usa `overflow-wrap: anywhere` para partir URLs y cadenas sin espacios.
- Los globos y la lista de mensajes tienen `min-w-0` + `overflow-x-hidden` para no empujar el layout.

## Envío de mensajes

Causa en front: las server actions hacían `throw new Error(...)`. En producción Next.js sustituye ese mensaje por el texto RSC. Además `revalidatePath` dentro de la action re-renderizaba la página como parte de la respuesta.

Qué hace ahora la UI:

- `sendConversationReplyAction` / media / interactivo **no lanzan**: devuelven `{ ok, message | error }`.
- El toast muestra el `message` del backend (canal WhatsApp inactivo, ventana de 24 h, error de Meta, etc.).
- `revalidatePath` corre en `after()` para no mezclar el envío con un crash de RSC.

Si tras este cambio el toast sigue mostrando un error del API (por ejemplo canal no activo o rechazo de Meta), corresponde al backend `chat-whatsapp-ai`, no a un crash de la UI.

## 400 en consola al abrir un chat

El poll del inbox pedía `sender_user_id` y `sender_display_name` en `public.messages`. Esas columnas no están en la vista de producción → PostgREST 400 cada 2,5 s y el hilo no refrescaba el estado de entrega.

La UI ahora pide solo columnas de la vista actual y cachea el `select` que funciona.

## Envío fallido (pending eterno)
- Si el backend falla, el globo pasa a **rojo** («No entregado») con botón **Reenviar**. Ya no se queda en «Enviando a WhatsApp…».
- Un `pending` de más de 20 s también se muestra como fallido.
- La ventana de 24 h no bloquea el envío si el contador todavía tiene tiempo (p. ej. 18 h restantes).

## Cómo probar

1. Abrir un chat con un mensaje que incluya una URL larga: debe quedar dentro del globo.
2. En viewport ≥1280px, el panel de contacto debe verse entero (scroll vertical si hace falta, no recorte horizontal).
3. Enviar un mensaje: toast de éxito o el error real del backend, nunca el texto de *Server Components render*.
