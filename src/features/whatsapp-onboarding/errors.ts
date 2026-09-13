export function mapEmbeddedSignupError(input: {
  event?: string | null;
  facebookError?: string | null;
  facebookReason?: string | null;
  facebookDescription?: string | null;
  backendMessage?: string | null;
  kind?:
    | "cancelled"
    | "timeout"
    | "popup"
    | "sdk"
    | "missing_code"
    | "config"
    | "backend_pending"
    | "unknown";
}): string {
  if (input.kind === "config") {
    return "Falta configurar la app de Meta en este entorno. Revisa NEXT_PUBLIC_META_APP_ID y NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID.";
  }
  if (input.kind === "sdk") {
    return "No se pudo cargar el inicio de sesión de Meta. Recarga la página e inténtalo de nuevo.";
  }
  if (input.kind === "popup") {
    return "El navegador bloqueó la ventana de Meta. Permite ventanas emergentes para este sitio e inténtalo otra vez.";
  }
  if (input.kind === "timeout") {
    return "La conexión con Meta tardó demasiado. Cierra la ventana de Facebook si sigue abierta e inténtalo de nuevo.";
  }
  if (input.kind === "missing_code") {
    return "Meta no devolvió el código de autorización. Completa el flujo hasta el final o vuelve a conectar.";
  }
  if (input.kind === "backend_pending") {
    return "WhatsApp quedó autorizado en Meta, pero el servidor aún no guarda la conexión. El equipo de backend debe implementar el endpoint de persistencia.";
  }

  const error = (input.facebookError ?? "").toLowerCase();
  const reason = (input.facebookReason ?? "").toLowerCase();
  const description = (input.facebookDescription ?? "").toLowerCase();
  const event = (input.event ?? "").toUpperCase();

  if (
    input.kind === "cancelled" ||
    event === "CANCEL" ||
    error === "access_denied" ||
    reason === "user_denied" ||
    description.includes("denied")
  ) {
    return "Cancelaste la conexión con Meta. Puedes intentarlo de nuevo cuando quieras.";
  }

  if (event === "ERROR" || error === "server_error" || error === "temporarily_unavailable") {
    return "Meta rechazó o interrumpió el alta. Revisa que la cuenta Tester tenga permiso en la app e inténtalo otra vez.";
  }

  if (input.backendMessage?.trim()) {
    return input.backendMessage.trim();
  }

  return "No se pudo conectar WhatsApp. Inténtalo de nuevo o contacta a soporte si el problema continúa.";
}
