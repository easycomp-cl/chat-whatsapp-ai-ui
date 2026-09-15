import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  parseWhatsAppFormatting,
  type WhatsAppFormatNode,
} from "@/lib/conversations/whatsapp-formatting";

type WhatsAppFormattedTextProps = {
  text: string;
  className?: string;
};

function RenderNodes({ nodes }: { nodes: WhatsAppFormatNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case "text":
            return <span key={index}>{node.value}</span>;
          case "bold":
            return (
              <strong key={index} className="font-semibold">
                <RenderNodes nodes={node.children} />
              </strong>
            );
          case "italic":
            return (
              <em key={index}>
                <RenderNodes nodes={node.children} />
              </em>
            );
          case "strike":
            return (
              <s key={index}>
                <RenderNodes nodes={node.children} />
              </s>
            );
          case "mono":
            return (
              <code
                key={index}
                className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.9em]"
              >
                <RenderNodes nodes={node.children} />
              </code>
            );
        }
      })}
    </>
  );
}

export function WhatsAppFormattedText({
  text,
  className,
}: WhatsAppFormattedTextProps) {
  const nodes = useMemo(() => parseWhatsAppFormatting(text), [text]);

  return (
    <span className={cn("min-w-0 wrap-anywhere", className)}>
      <RenderNodes nodes={nodes} />
    </span>
  );
}
