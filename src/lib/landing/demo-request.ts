import { z } from "zod";

export const demoRequestSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  company: z.string().min(2, "Ingresa el nombre de tu empresa"),
  email: z.string().email("Ingresa un correo válido"),
  phone: z.string().optional(),
  conversationVolume: z.string().min(1, "Selecciona un rango aproximado"),
  mainProblem: z.string().min(10, "Cuéntanos brevemente tu principal desafío"),
  consent: z
    .boolean()
    .refine((v) => v === true, { message: "Debes aceptar ser contactado" }),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;

export type DemoRequestResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Envía la solicitud de demostración.
 * Hoy no hay endpoint backend — ver docs/pending/to-backend/backend-demo-request.md
 */
export async function submitDemoRequest(
  data: DemoRequestInput
): Promise<DemoRequestResult> {
  const parsed = demoRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos del formulario." };
  }

  const endpoint = process.env.NEXT_PUBLIC_DEMO_REQUEST_API_URL?.trim();

  if (!endpoint) {
    if (process.env.NODE_ENV === "development") {
      console.info("[demo-request] Sin backend — payload:", {
        ...parsed.data,
        phone: parsed.data.phone ? "[redacted]" : undefined,
      });
    }
    return {
      ok: true,
      message:
        "Recibimos tu solicitud en modo de prueba. El equipo de easycomp-chat-bot-manager te contactará pronto para coordinar la demostración.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "No pudimos enviar tu solicitud. Intenta nuevamente en unos minutos.",
      };
    }

    return {
      ok: true,
      message:
        "¡Gracias! Recibimos tu solicitud y te contactaremos para coordinar la demostración.",
    };
  } catch {
    return {
      ok: false,
      message: "Error de conexión. Verifica tu internet e intenta nuevamente.",
    };
  }
}
