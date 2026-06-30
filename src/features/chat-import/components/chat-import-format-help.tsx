export function ChatImportFormatHelp() {
  return (
    <details className="group rounded-lg border bg-muted/20 text-sm">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-muted-foreground group-open:hidden">
          ¿Cómo exportar el chat desde WhatsApp?
        </span>
        <span className="hidden group-open:inline">Formatos aceptados</span>
      </summary>
      <div className="space-y-2 border-t px-4 pb-4 pt-3 text-muted-foreground">
        <p>
          Menú del chat → Más opciones → Exportar chat. Sube el .txt tal cual,
          sin abrirlo en Excel.
        </p>
        <pre className="whitespace-pre-wrap rounded-md bg-background/80 p-3 font-mono text-xs">
{`12/05/2026, 10:42 - Cliente: Hola, cuánto sale?
12/05/2026, 10:43 - Mi Negocio: Hola 😊 El valor es de $15.000

[09-06-25, 9:27:20 p. m.] ~Caro Barquín: Hola The Wood Club tengo una consulta
[10-06-25, 8:18:36 a. m.] The Wood Club: Hola! Buen dia!`}
        </pre>
        <p className="text-xs">
          Detectamos los nombres del chat para que elijas cuál eres tú en la
          conversación.
        </p>
      </div>
    </details>
  );
}
