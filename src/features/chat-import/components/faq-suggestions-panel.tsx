"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveFaqSuggestionAction,
  editFaqSuggestionAction,
  rejectFaqSuggestionAction,
} from "@/lib/actions/chat-import-actions";
import { FAQ_STATUS_LABELS, hasPlaceholder } from "@/lib/chat-import/utils";
import type { FaqSuggestion } from "@/lib/bot-api/types";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function FaqEditDialog({
  suggestion,
  open,
  onOpenChange,
  importJobId,
  onSaved,
}: {
  suggestion: FaqSuggestion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importJobId: string;
  onSaved: (updated: FaqSuggestion) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [question, setQuestion] = useState(suggestion.question);
  const [answer, setAnswer] = useState(suggestion.suggested_answer ?? "");
  const [category, setCategory] = useState(suggestion.category ?? "");

  function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error("Pregunta y respuesta son obligatorias");
      return;
    }
    startTransition(async () => {
      try {
        const updated = await editFaqSuggestionAction(suggestion.id, importJobId, {
          question: question.trim(),
          suggested_answer: answer.trim(),
          category: category.trim() || undefined,
        });
        toast.success("Sugerencia actualizada");
        onSaved(updated);
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al guardar"
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar sugerencia FAQ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pregunta</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Respuesta sugerida</Label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
            />
            {hasPlaceholder(answer) && (
              <p className="text-xs text-amber-700">
                Completa los datos faltantes antes de aprobar
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FaqSuggestionRow({
  suggestion,
  importJobId,
  onUpdate,
}: {
  suggestion: FaqSuggestion;
  importJobId: string;
  onUpdate: (updated: FaqSuggestion) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const isActionable =
    suggestion.status === "pending_review" || suggestion.status === "edited";
  const answer = suggestion.suggested_answer ?? "";
  const hasMissingData =
    isActionable &&
    (hasPlaceholder(answer) || !suggestion.question.trim() || !answer.trim());

  function handleApprove() {
    if (!suggestion.question.trim() || !answer.trim()) {
      toast.error("Pregunta y respuesta son obligatorias");
      return;
    }
    if (hasPlaceholder(answer)) {
      toast.error("Completa los datos faltantes antes de aprobar");
      return;
    }
    startTransition(async () => {
      try {
        const updated = await approveFaqSuggestionAction(
          suggestion.id,
          importJobId
        );
        toast.success("FAQ aprobada y agregada al negocio");
        onUpdate(updated);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al aprobar"
        );
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectFaqSuggestionAction(suggestion.id, importJobId);
        onUpdate({ ...suggestion, status: "rejected" });
        toast.success("Sugerencia rechazada");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al rechazar"
        );
      }
    });
  }

  return (
    <>
      <TableRow>
        <TableCell className="max-w-xs">
          <p className="font-medium">{suggestion.question}</p>
          {hasMissingData && (
            <p className="mt-1 text-xs text-amber-700">
              Completa los datos faltantes antes de aprobar
            </p>
          )}
        </TableCell>
        <TableCell className="max-w-sm">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {answer || "—"}
          </p>
        </TableCell>
        <TableCell>
          {suggestion.category ? (
            <Badge variant="outline">{suggestion.category}</Badge>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell>{suggestion.evidence_count}</TableCell>
        <TableCell>
          {suggestion.confidence != null
            ? `${Math.round(suggestion.confidence * 100)}%`
            : "—"}
        </TableCell>
        <TableCell>
          <Badge
            variant={
              suggestion.status === "approved"
                ? "default"
                : suggestion.status === "rejected"
                  ? "secondary"
                  : "outline"
            }
          >
            {FAQ_STATUS_LABELS[suggestion.status] ?? suggestion.status}
          </Badge>
        </TableCell>
        <TableCell>
          {isActionable ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleApprove}
                disabled={pending || hasMissingData}
                title="Aprobar"
              >
                <Check className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                disabled={pending}
                title="Editar"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReject}
                disabled={pending}
                title="Rechazar"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
        </TableCell>
      </TableRow>

      <FaqEditDialog
        suggestion={suggestion}
        open={editOpen}
        onOpenChange={setEditOpen}
        importJobId={importJobId}
        onSaved={onUpdate}
      />
    </>
  );
}

export function FaqSuggestionsPanel({
  suggestions: initialSuggestions,
  importJobId,
}: {
  suggestions: FaqSuggestion[];
  importJobId: string;
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);

  function updateSuggestion(updated: FaqSuggestion) {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No se detectaron preguntas frecuentes en este chat.
        </p>
        <Link
          href="/app/faqs"
          className={cn(buttonVariants({ variant: "link" }), "mt-2")}
        >
          Crear FAQ manualmente
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pregunta</TableHead>
            <TableHead>Respuesta sugerida</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Evidencia</TableHead>
            <TableHead>Confianza</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suggestions.map((suggestion) => (
            <FaqSuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              importJobId={importJobId}
              onUpdate={updateSuggestion}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
