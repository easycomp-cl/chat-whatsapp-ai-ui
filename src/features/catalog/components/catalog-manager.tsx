"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileJson, FileSpreadsheet, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  importCatalogCsvAction,
  importCatalogJsonAction,
} from "@/lib/actions/app-actions";
import type { CatalogProduct } from "@/lib/bot-api/types";

const CATALOG_CSV_TEMPLATE = `nombre,precio,descripcion,sku,categoria
Hallulla x6,1800,Pan fresco del día,HAL-6,Panes
Torta tres leches,3500,Porción individual,TTL-1,Tortas`;

const CATALOG_JSON_TEMPLATE = JSON.stringify(
  [
    {
      nombre: "Hallulla x6",
      precio: 1800,
      descripcion: "Pan fresco del día",
      sku: "HAL-6",
      categoria: "Panes",
    },
    {
      nombre: "Torta tres leches",
      precio: 3500,
      descripcion: "Porción individual",
      sku: "TTL-1",
      categoria: "Tortas",
    },
  ],
  null,
  2
);

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatPrice(price: number | null, currency: string) {
  if (price == null) return "-";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function CatalogManager({ products }: { products: CatalogProduct[] }) {
  const [search, setSearch] = useState("");
  const [csvText, setCsvText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [lastDocumentId, setLastDocumentId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false) ||
      (p.category?.toLowerCase().includes(q) ?? false)
    );
  });

  function handleImportCsv() {
    if (!csvText.trim()) {
      toast.error("Pega el contenido CSV");
      return;
    }
    startTransition(async () => {
      try {
        const result = await importCatalogCsvAction(csvText);
        setLastDocumentId(result.documentId);
        toast.success(`${result.products_imported ?? 0} productos importados`);
        setCsvText("");
        router.refresh();
      } catch {
        toast.error("Error al importar CSV");
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
        const result = await importCatalogJsonAction(jsonText);
        setLastDocumentId(result.documentId);
        toast.success(`${result.products_imported ?? 0} productos importados`);
        setJsonText("");
        router.refresh();
      } catch {
        toast.error("Error al importar JSON");
      }
    });
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonText(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      {lastDocumentId && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Catálogo indexado.{" "}
          <Link href="/app/knowledge" className="font-medium underline">
            Ver documento en Base de conocimiento
          </Link>
        </div>
      )}

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Productos ({products.length})</TabsTrigger>
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="shopify" className="gap-2">
            Shopify
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              Próximamente
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Input
            placeholder="Buscar por nombre, SKU o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {filtered.length === 0 ? (
            <div className="rounded-md border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                Importa productos desde CSV o JSON.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Origen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{p.sku ?? "-"}</TableCell>
                      <TableCell>{formatPrice(p.price, p.currency)}</TableCell>
                      <TableCell>{p.category ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.source}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="size-4" />
                Importar CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Columnas: nombre, precio, descripcion, sku, categoria
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadTextFile(
                    "plantilla-catalogo.csv",
                    CATALOG_CSV_TEMPLATE,
                    "text/csv;charset=utf-8"
                  )
                }
              >
                <Download className="size-4" />
                Descargar plantilla CSV
              </Button>
              <Input type="file" accept=".csv,text/csv" onChange={handleCsvFile} />
              <Textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={6}
                placeholder={"nombre,precio,descripcion\nHallulla x6,1800,Pan fresco del día"}
              />
              <Button onClick={handleImportCsv} disabled={pending}>
                Importar CSV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileJson className="size-4" />
                Importar JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Array de productos o objeto con clave &quot;products&quot;. Campos: nombre,
                precio, descripcion, sku, categoria
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadTextFile(
                    "plantilla-catalogo.json",
                    CATALOG_JSON_TEMPLATE,
                    "application/json;charset=utf-8"
                  )
                }
              >
                <Download className="size-4" />
                Descargar plantilla JSON
              </Button>
              <Input type="file" accept=".json,application/json" onChange={handleJsonFile} />
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={6}
                placeholder={'[{"name":"Hallulla x6","price":1800}]'}
              />
              <Button onClick={handleImportJson} disabled={pending}>
                Importar JSON
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shopify">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="size-4" />
                Integración Shopify
                <Badge variant="secondary">Próximamente</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-dashed bg-muted/40 px-4 py-8 text-center">
                <ShoppingBag className="mx-auto mb-3 size-8 text-muted-foreground/60" />
                <p className="font-medium">Sincronización con Shopify en desarrollo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pronto podrás conectar tu tienda y importar el catálogo automáticamente.
                  Por ahora usa las pestañas de importación CSV o JSON.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
