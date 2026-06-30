import { Shield } from "lucide-react";

export function ChatImportPageHeader() {
  return (
    <header className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Importar chats</h2>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Enseña a tu bot cómo respondes en WhatsApp: sube conversaciones con
          clientes, revisa el tono detectado y aprueba preguntas frecuentes.
        </p>
      </div>
      <div className="flex gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Shield className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden />
        <p>
          <span className="font-medium text-foreground">Privacidad:</span> no
          guardamos los chats completos. Solo métricas, tono, FAQs sugeridas y
          una muestra breve anonimizada.
        </p>
      </div>
    </header>
  );
}
