import { Brain } from "lucide-react";

export function KnowledgeIndexHelp() {
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <Brain className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium text-foreground">¿Qué es indexar?</p>
        <p>
          El bot no lee el PDF o TXT completo en cada mensaje. Al <strong>indexar</strong>,
          el sistema extrae el texto, lo divide en fragmentos y los prepara para búsqueda
          semántica (RAG). Así, cuando un cliente pregunta algo, el bot encuentra los
          párrafos relevantes y responde con esa información.
        </p>
        <p>
          <strong>Listo</strong> = el bot ya puede usar ese documento.{" "}
          <strong>Última indexación</strong> = cuándo se procesó por última vez. El botón{" "}
          <strong>reindexar</strong> vuelve a procesar el archivo (útil si cambiaste el
          contenido).
        </p>
      </div>
    </div>
  );
}
