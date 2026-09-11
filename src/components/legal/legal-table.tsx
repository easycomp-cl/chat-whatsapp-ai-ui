import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LegalTableProps = {
  caption: string;
  headers: string[];
  children: ReactNode;
  className?: string;
};

export function LegalTable({
  caption,
  headers,
  children,
  className,
}: LegalTableProps) {
  return (
    <div className={cn("my-4 overflow-x-auto rounded-lg border", className)}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 font-medium text-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

type LegalTableRowProps = {
  cells: ReactNode[];
};

export function LegalTableRow({ cells }: LegalTableRowProps) {
  return (
    <tr className="bg-card">
      {cells.map((cell, index) => (
        <td
          key={index}
          className="px-4 py-3 align-top text-foreground/90 [&>ul]:mt-1 [&>ul]:list-disc [&>ul]:pl-4"
        >
          {cell}
        </td>
      ))}
    </tr>
  );
}
