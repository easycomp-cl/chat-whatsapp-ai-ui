"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSettingsAction } from "@/lib/actions/app-actions";
import { NotificationSoundSettings } from "@/features/settings/components/notification-sound-settings";
import type { Business } from "@/types/database.types";
import type { KnowledgeSettings } from "@/lib/bot-api/types";

const defaultKnowledge: KnowledgeSettings = {
  enabled: true,
  topK: 5,
  chunkSize: 500,
  chunkOverlap: 50,
  minConfidence: 0.7,
  faqSimilarityThreshold: 0.78,
  autoIndexOnCreate: true,
};

export function SettingsForm({
  business,
  knowledge,
}: {
  business: Business;
  knowledge?: KnowledgeSettings;
}) {
  const [pending, startTransition] = useTransition();
  const [botEnabled, setBotEnabled] = useState(business.bot_global_enabled);
  const [threshold, setThreshold] = useState(String(business.confidence_threshold));
  const [model, setModel] = useState(business.default_ai_model);
  const [timezone, setTimezone] = useState(business.timezone);

  const kb = { ...defaultKnowledge, ...knowledge };
  const [kbEnabled, setKbEnabled] = useState(kb.enabled);
  const [topK, setTopK] = useState(String(kb.topK));
  const [chunkSize, setChunkSize] = useState(String(kb.chunkSize));
  const [chunkOverlap, setChunkOverlap] = useState(String(kb.chunkOverlap));
  const [minConfidence, setMinConfidence] = useState(String(kb.minConfidence ?? 0.7));
  const [faqThreshold, setFaqThreshold] = useState(
    String(kb.faqSimilarityThreshold ?? 0.78)
  );
  const [autoIndex, setAutoIndex] = useState(kb.autoIndexOnCreate);

  function handleSave() {
    startTransition(async () => {
      try {
        await saveSettingsAction({
          bot_global_enabled: botEnabled,
          confidence_threshold: Number(threshold),
          default_ai_model: model,
          timezone,
          knowledge: {
            enabled: kbEnabled,
            top_k: Number(topK),
            chunk_size: Number(chunkSize),
            chunk_overlap: Number(chunkOverlap),
            min_confidence: Number(minConfidence),
            faq_similarity_threshold: Number(faqThreshold),
            auto_index_on_create: autoIndex,
          },
        });
        toast.success("Configuración guardada");
      } catch {
        toast.error("Error al guardar");
      }
    });
  }

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="knowledge">Base de conocimiento</TabsTrigger>
        <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        <TabsTrigger value="messages">Mensajes</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuración general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input value={business.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={botEnabled} onCheckedChange={setBotEnabled} />
              <Label>Bot global activo</Label>
            </div>
            <div className="space-y-2">
              <Label>Umbral de confianza (RAG)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Qué tan seguro debe estar el RAG antes de responder con IA (0–1)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Modelo IA</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={pending}>
              Guardar cambios
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="knowledge" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ajustes de conocimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch checked={kbEnabled} onCheckedChange={setKbEnabled} />
              <Label>Knowledge base activa</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Top K (fragmentos de contexto)</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Umbral similitud FAQ</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={faqThreshold}
                  onChange={(e) => setFaqThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Más bajo = más flexible al matchear preguntas informales
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tamaño de chunk</Label>
                <Input
                  type="number"
                  min="100"
                  max="2000"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Solapamiento de chunk</Label>
                <Input
                  type="number"
                  min="0"
                  max="500"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Confianza mínima RAG</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={autoIndex} onCheckedChange={setAutoIndex} />
              <Label>Indexar automáticamente al crear documentos</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Los cambios de tamaño de chunk aplican a nuevas indexaciones; re-indexa documentos existentes manualmente.
            </p>
            <Button onClick={handleSave} disabled={pending}>
              Guardar ajustes KB
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Sonido de notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationSoundSettings />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="messages">
        <Card>
          <CardHeader>
            <CardTitle>Mensajes personalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Los mensajes de bienvenida, derivación y fuera de horario se configuran
              desde el backend del bot (TenantConfig). Próximamente editable desde aquí.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
