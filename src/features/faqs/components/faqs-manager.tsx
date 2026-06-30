"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { MessageCirclePlus, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createFaqAction,
  deleteFaqAction,
  updateFaqAction,
} from "@/lib/actions/app-actions";
import type { Faq } from "@/lib/bot-api/types";
import { TagInput } from "./tag-input";
import { FaqImportPanel } from "./faq-import-panel";

function FaqForm({
  faq,
  onDone,
}: {
  faq?: Faq;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [category, setCategory] = useState(faq?.category ?? "");
  const [priority, setPriority] = useState(String(faq?.priority ?? 0));
  const [active, setActive] = useState(faq?.isActive ?? true);
  const [alternatePhrases, setAlternatePhrases] = useState<string[]>(
    faq?.alternatePhrases ?? []
  );
  const [keywords, setKeywords] = useState<string[]>(faq?.keywords ?? []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      question,
      answer,
      category: category || undefined,
      priority: Number(priority),
      active,
      alternate_phrases: alternatePhrases,
      keywords,
    };
    startTransition(async () => {
      try {
        if (faq) await updateFaqAction(faq.id, data);
        else await createFaqAction(data);
        toast.success(faq ? "FAQ actualizada" : "FAQ creada");
        router.refresh();
        onDone();
      } catch {
        toast.error("Error al guardar FAQ");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Pregunta oficial</Label>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} required />
        <p className="text-xs text-muted-foreground">Como la pondrías en una web</p>
      </div>
      <div className="space-y-2">
        <Label>Respuesta</Label>
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required />
        <p className="text-xs text-muted-foreground">Texto exacto que envía el bot</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Mayor número = se evalúa antes</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Frases alternativas</Label>
        <TagInput
          value={alternatePhrases}
          onChange={setAlternatePhrases}
          placeholder="Escribe y presiona Enter — ej: a cuanto las hallullas"
        />
        <p className="text-xs text-muted-foreground">
          Cómo lo diría un cliente en WhatsApp
        </p>
      </div>
      <div className="space-y-2">
        <Label>Palabras clave</Label>
        <TagInput
          value={keywords}
          onChange={setKeywords}
          placeholder="Productos, nombres propios, jerga — ej: hallulla"
        />
        <p className="text-xs text-muted-foreground">
          Agrega cómo tus clientes preguntan en WhatsApp. Ej: &quot;a cuanto las hallullas&quot;, &quot;precio hallulla&quot;.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={setActive} />
        <Label>Activa</Label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}

export function FaqsManager({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editFaq, setEditFaq] = useState<Faq | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteFaqAction(id);
        toast.success("FAQ eliminada");
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setEditFaq(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Crear FAQ
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="size-4" />
          Importar CSV/JSON
        </Button>
        <Button variant="outline" render={<Link href="/app/importar-chat" />}>
          <MessageCirclePlus className="size-4" />
          Importar desde chat
        </Button>
      </div>

      <FaqImportPanel open={importOpen} onOpenChange={setImportOpen} />

      <Dialog
        open={open || !!editFaq}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditFaq(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editFaq ? "Editar FAQ" : "Nueva FAQ"}</DialogTitle>
          </DialogHeader>
          <FaqForm
            faq={editFaq ?? undefined}
            onDone={() => {
              setOpen(false);
              setEditFaq(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {faqs.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Crea FAQs manualmente, impórtalas desde CSV/JSON o analiza un chat de WhatsApp.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pregunta</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="max-w-xs">
                    <p className="truncate font-medium">{faq.question}</p>
                    {faq.alternatePhrases.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        +{faq.alternatePhrases.length} frases alternativas
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {faq.keywords.slice(0, 3).map((kw) => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                      {faq.keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{faq.keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{faq.category ?? "-"}</TableCell>
                  <TableCell>{faq.priority}</TableCell>
                  <TableCell>
                    <Badge variant={faq.isActive ? "default" : "secondary"}>
                      {faq.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditFaq(faq)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(faq.id)}
                      disabled={pending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
