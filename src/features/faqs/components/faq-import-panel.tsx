"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importFaqsCsvAction,
  importFaqsJsonAction,
} from "@/lib/actions/app-actions";

export function FaqImportPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [pending, startTransition] = useTransition();

  function readFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleImportCsv() {
    if (!csvText.trim()) {
      toast.error("Pega el contenido CSV");
      return;
    }
    startTransition(async () => {
      try {
        const result = await importFaqsCsvAction(csvText);
        toast.success(`${result.imported} de ${result.total} FAQs importadas`);
        if (result.failed > 0) {
          toast.warning(`${result.failed} filas no se pudieron importar`);
        }
        setCsvText("");
        router.refresh();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al importar CSV");
      }
    });
  }

  function handleImportJson() {
    if (!jsonText.trim()) {
      toast.error("Pega el JSON");
      return;
    }
    startTransition(async () => {
      try {
        const result = await importFaqsJsonAction(jsonText);
        toast.success(`${result.imported} de ${result.total} FAQs importadas`);
        if (result.failed > 0) {
          toast.warning(`${result.failed} filas no se pudieron importar`);
        }
        setJsonText("");
        router.refresh();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al importar JSON");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar FAQs</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="size-4" />
                CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Columnas: pregunta, respuesta, categoria, prioridad, frases_alternativas, keywords
                (listas separadas por ;)
              </p>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => readFile(e, setCsvText)}
              />
              <Textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                placeholder={
                  "pregunta,respuesta,categoria,prioridad,frases_alternativas,keywords\n" +
                  "¿Cuánto cuestan las hallullas?,Las hallullas cuestan $1800,precios,10," +
                  "a cuanto las hallullas;precio hallulla,hallulla;hallullas"
                }
              />
              <Button onClick={handleImportCsv} disabled={pending} className="w-full">
                <Upload className="size-4" />
                Importar CSV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileJson className="size-4" />
                JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Array de FAQs o objeto con clave &quot;faqs&quot;. Acepta claves en español.
              </p>
              <Input
                type="file"
                accept=".json,application/json"
                onChange={(e) => readFile(e, setJsonText)}
              />
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={8}
                placeholder={
                  '[{"question":"¿Cuánto cuestan las hallullas?","answer":"$1800 las 6","keywords":["hallulla"],"alternate_phrases":["a cuanto las hallullas"]}]'
                }
              />
              <Button onClick={handleImportJson} disabled={pending} className="w-full">
                <Upload className="size-4" />
                Importar JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
