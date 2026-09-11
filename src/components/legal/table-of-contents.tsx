type TocItem = {
  id: string;
  label: string;
};

type TableOfContentsProps = {
  items: TocItem[];
  title?: string;
};

export function TableOfContents({
  items,
  title = "Contenido",
}: TableOfContentsProps) {
  return (
    <nav aria-label="Tabla de contenidos" className="rounded-lg border bg-muted/30 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              <span className="text-muted-foreground">{index + 1}.</span>{" "}
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
