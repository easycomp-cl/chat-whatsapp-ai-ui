"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveFlowReviewAction } from "@/lib/actions/flow-actions";
import type { FlowReview } from "@/lib/bot-api/types";

function ReviewActions({ review }: { review: FlowReview }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");

  function resolve(status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED") {
    startTransition(async () => {
      try {
        await resolveFlowReviewAction(review.id, { status, notes: notes || undefined });
        toast.success("Revisión resuelta");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al resolver");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas opcionales para el cliente..."
        rows={2}
        className="text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => resolve("APPROVED")}>
          <Check className="size-4" />
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => resolve("CHANGES_REQUESTED")}
        >
          <MessageSquareWarning className="size-4" />
          Solicitar cambios
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => resolve("REJECTED")}
        >
          <X className="size-4" />
          Rechazar
        </Button>
      </div>
    </div>
  );
}

export function FlowReviewsInbox({ reviews }: { reviews: FlowReview[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Intento</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay revisiones pendientes
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <Badge variant="secondary">{review.subject_type}</Badge>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Run: {review.flow_run_id.slice(0, 8)}…
                  </p>
                </TableCell>
                <TableCell>#{review.attempt}</TableCell>
                <TableCell>
                  {review.file?.signed_url ? (
                    review.file.mime_type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.file.signed_url}
                        alt={review.file.original_filename}
                        className="max-h-24 rounded border object-contain"
                      />
                    ) : (
                      <a
                        href={review.file.signed_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#7678ed] hover:underline"
                      >
                        {review.file.original_filename}
                      </a>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin preview</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleString("es-CL")}
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <ReviewActions review={review} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <p className="border-t p-3 text-xs text-muted-foreground">
        Al resolver, el backend envía el mensaje correspondiente al cliente por WhatsApp.
      </p>
    </div>
  );
}
