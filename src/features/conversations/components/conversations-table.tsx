"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-datetime";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeBadge, StatusBadge } from "@/features/conversations/components/conversation-badges";
import type { Conversation, Customer } from "@/types/database.types";

type ConversationRow = Conversation & { customers: Customer | null };

export function ConversationsTable({
  conversations,
}: {
  conversations: ConversationRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "all";

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`/app/conversations?${params.toString()}`);
  }

  const filtered = conversations.filter((c) => {
    if (mode === "BOT" || mode === "HUMAN") return c.mode === mode;
    if (mode === "handoff") return c.handoff_reason;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={mode} onValueChange={(v) => setFilter("mode", v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por modo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="BOT">Modo BOT</SelectItem>
            <SelectItem value="HUMAN">Modo HUMAN</SelectItem>
            <SelectItem value="handoff">Derivadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último mensaje</TableHead>
              <TableHead>Derivación</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No hay conversaciones
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.customers?.name ?? "Sin nombre"}</TableCell>
                  <TableCell>{c.customers?.phone_number ?? "-"}</TableCell>
                  <TableCell>{c.channel}</TableCell>
                  <TableCell><ModeBadge mode={c.mode} /></TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell>
                    {formatDateTime(c.last_message_at)}
                  </TableCell>
                  <TableCell className="max-w-32 truncate">
                    {c.handoff_reason ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/app/conversations/${c.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
