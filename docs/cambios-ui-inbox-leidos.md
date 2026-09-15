# Cambios UI — leídos y sonido de pendientes

## Resumen

Al volver a Conversaciones, chats ya vistos volvían a marcarse pendientes y sonaba la notificación. El estado de lectura no se guardaba bien al abrir un hilo.

## Qué hace ahora

- Abrir un chat lo marca como leído (y al salir también).
- Lo leído se guarda en `localStorage` (antes solo `sessionStorage` y se perdía al salir de la sección).
- El sonido suena solo si entra un pendiente **nuevo**, no al reentrar a Conversaciones.
- La actividad ya existente la primera vez que carga el inbox no se trata como mensaje nuevo.

## Cómo probar

1. Abrir un chat con mensajes del cliente y volver a la lista: no debe quedar naranja ni sonar.
2. Ir a Dashboard y volver a Conversaciones: no debe sonar si no llegó nada nuevo.
3. Con un mensaje inbound nuevo en otro chat: sí debe sonar y verse pendiente hasta abrirlo.
