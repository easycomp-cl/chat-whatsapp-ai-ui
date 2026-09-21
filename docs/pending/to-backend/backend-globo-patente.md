# Backend — globo negro de patente (auto y moto)

**Fecha:** 2026-09-21  
**Repo:** implementar en `chat-whatsapp-ai`. La UI ya consulta y muestra el resultado en el hilo.

## Qué bloquea en la UI

`+ → Consultar patente` inserta un globo negro **en el chat** (no un modal). El asesor escribe la patente ahí. Al responder `POST /conversations/:id/vehicles/lookup`, el mismo globo se agranda con todos los campos.

Ese globo es local a la pestaña. Al recargar desaparece, aunque el garage del contacto sí se actualizó. Hace falta un mensaje `SYSTEM` persistido para que todos lo vean después de refrescar.

Además, el validador actual solo acepta autos. Una moto con formato correcto vuelve `invalid_plate`.

## Contrato

`POST /conversations/:id/vehicles/lookup` sigue igual. Además de responder JSON, insertar un `Message`:

- `senderType: SYSTEM`
- `contentType: SYSTEM_EVENT`
- `direction: OUTBOUND`
- No enviar a WhatsApp

`rawPayloadJson.system_event`:

```json
{
  "kind": "plate_lookup",
  "appearance": "dark_card",
  "actor": "HUMAN",
  "title": "Vehículo del contacto",
  "body": "DONGFENG JOYEAR\n2018",
  "payload": {
    "plate": "KKRS47",
    "plate_display": "KK RS 47",
    "make": "DONGFENG",
    "model": "JOYEAR",
    "year": 2018,
    "version": "1.6 LUXURY 4X2 MT 5P",
    "color": "BLANCO",
    "fuel": null,
    "transmission": "MANUAL",
    "engine": "S2FR359",
    "vin": "…",
    "vehicle_type": "STATION WAGON"
  }
}
```

No incluir dueño, RUT ni `owner`. `not_found`, `invalid_plate` y `provider_not_configured` no son `dark_card`.

## Patentes

Hoy `isValidChileanPlate` acepta solo autos actuales. La UI ya valida y formatea estos formatos y **no llama** a la API si no cierran:

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Auto antiguo | 2 letras + 4 dígitos | `AB1234` → `AB 12 34` |
| Auto actual | 4 letras + 2 dígitos | `BBBB12` → `BB BB 12` |
| Auto nuevo (DO ene 2026) | 5 letras + 1 dígito | `BBBBB0` → `BBBBB 0` |
| Moto antigua | 2 letras + 3 dígitos | `AB123` → `AB 123` |
| Moto actual | 3 letras + 2 dígitos | `ABC12` → `ABC 12` |
| Moto nueva (DO ene 2026) | 4 letras + 1 dígito | `BBBB0` → `BBBB 0` |

El backend debe aceptar los mismos patrones en `isValidChileanPlate` / `formatChileanPlate`. Si no, una moto o un auto nuevo válido en UI vuelve `invalid_plate` y se pierde la consulta.

Normalizar: mayúsculas, sin espacios ni puntos. No persistir dueño/RUT.

## Prueba

1. Consultar `KKRS47` desde el inbox. Recargar: el globo negro sigue, con todos los campos con valor, y no llega a WhatsApp.
2. Consultar `ABC12` y `BBBB0`. No deben responder `invalid_plate` por formato. Si el proveedor no tiene el dato, `not_found` está bien.
3. `ZZ` o `ABC1` no deben llegar al proveedor (la UI ya los bloquea; el backend también debería rechazarlos barato).
