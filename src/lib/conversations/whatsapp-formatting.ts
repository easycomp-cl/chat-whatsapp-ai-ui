export type WhatsAppFormatNode =
  | { type: "text"; value: string }
  | { type: "bold"; children: WhatsAppFormatNode[] }
  | { type: "italic"; children: WhatsAppFormatNode[] }
  | { type: "strike"; children: WhatsAppFormatNode[] }
  | { type: "mono"; children: WhatsAppFormatNode[] };

const FORMATS = [
  { type: "mono" as const, open: "```", close: "```" },
  { type: "bold" as const, open: "*", close: "*" },
  { type: "italic" as const, open: "_", close: "_" },
  { type: "strike" as const, open: "~", close: "~" },
];

function parseSegment(text: string): WhatsAppFormatNode[] {
  const nodes: WhatsAppFormatNode[] = [];
  let index = 0;
  let buffer = "";

  const flush = () => {
    if (!buffer) return;
    nodes.push({ type: "text", value: buffer });
    buffer = "";
  };

  while (index < text.length) {
    let matched = false;

    for (const format of FORMATS) {
      if (!text.startsWith(format.open, index)) continue;

      const contentStart = index + format.open.length;
      const closeIndex = text.indexOf(format.close, contentStart);
      if (closeIndex === -1) continue;

      const inner = text.slice(contentStart, closeIndex);
      if (!inner) continue;

      flush();
      nodes.push({
        type: format.type,
        children: parseSegment(inner),
      });
      index = closeIndex + format.close.length;
      matched = true;
      break;
    }

    if (!matched) {
      buffer += text[index];
      index += 1;
    }
  }

  flush();
  return nodes;
}

export function parseWhatsAppFormatting(text: string): WhatsAppFormatNode[] {
  if (!text) return [];
  return parseSegment(text);
}

function flattenNodes(nodes: WhatsAppFormatNode[]): string {
  return nodes
    .map((node) => (node.type === "text" ? node.value : flattenNodes(node.children)))
    .join("");
}

export function stripWhatsAppFormatting(text: string): string {
  if (!text) return "";
  return flattenNodes(parseWhatsAppFormatting(text));
}
