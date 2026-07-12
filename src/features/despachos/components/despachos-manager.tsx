"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createDeliveryRegionAction,
  deleteDeliveryRegionAction,
  rebuildDeliveryIndexAction,
  seedDeliveryCommunesAction,
  updateDeliveryCommuneAction,
  updateDeliveryRegionAction,
} from "@/lib/actions/app-actions";
import type { DeliveryCommune, DeliveryRegion } from "@/lib/bot-api/types";
import {
  DEFAULT_DELIVERY_COURIER,
  deliveryCourierOptions,
} from "@/lib/delivery/couriers";

function formatClp(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function CourierSelect({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const options = useMemo(() => deliveryCourierOptions(value), [value]);

  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? DEFAULT_DELIVERY_COURIER)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona courier" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RegionForm({
  chileRegions,
  existingNames,
  apiError,
  onDone,
}: {
  chileRegions: string[];
  existingNames: Set<string>;
  apiError: string | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const available = chileRegions.filter((r) => !existingNames.has(r.toLowerCase()));
  const [name, setName] = useState(available[0] ?? "");
  const [courier, setCourier] = useState(DEFAULT_DELIVERY_COURIER);
  const [defaultPrice, setDefaultPrice] = useState("3990");
  const [active, setActive] = useState(true);
  const [seedCommunes, setSeedCommunes] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createDeliveryRegionAction({
          name,
          courier,
          default_price: Number(defaultPrice),
          active,
          seed_communes: seedCommunes,
        });
        toast.success("Región agregada");
        router.refresh();
        onDone();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error al crear región"
        );
      }
    });
  }

  if (apiError) {
    return (
      <p className="text-sm text-destructive">
        {apiError} Sin el backend activo no se pueden guardar regiones.
      </p>
    );
  }

  if (chileRegions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudieron cargar las regiones de Chile. Recarga la página o verifica
        la conexión con el bot.
      </p>
    );
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ya tienes configuradas todas las regiones de Chile disponibles.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Región</Label>
        <Select value={name} onValueChange={(v) => setName(v ?? available[0] ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona región" />
          </SelectTrigger>
          <SelectContent>
            {available.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Courier</Label>
        <CourierSelect value={courier} onValueChange={setCourier} />
      </div>
      <div className="space-y-2">
        <Label>Precio base región (CLP)</Label>
        <Input
          type="number"
          min={0}
          value={defaultPrice}
          onChange={(e) => setDefaultPrice(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Las comunas heredan este valor salvo que tengan un precio especial.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={setActive} />
        <Label>Región activa (con despacho)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={seedCommunes} onCheckedChange={setSeedCommunes} />
        <Label>Cargar comunas oficiales de Chile</Label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Agregar región"}
      </Button>
    </form>
  );
}

function RegionPanel({ region }: { region: DeliveryRegion }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [courier, setCourier] = useState(region.courier);
  const [defaultPrice, setDefaultPrice] = useState(String(region.default_price));
  const [active, setActive] = useState(region.is_active);
  const [communeFilter, setCommuneFilter] = useState("");

  const filteredCommunes = useMemo(() => {
    const q = communeFilter.trim().toLowerCase();
    if (!q) return region.communes;
    return region.communes.filter((c) => c.name.toLowerCase().includes(q));
  }, [region.communes, communeFilter]);

  function saveRegion() {
    startTransition(async () => {
      try {
        await updateDeliveryRegionAction(region.id, {
          courier,
          default_price: Number(defaultPrice),
          active,
        });
        toast.success("Región actualizada");
        router.refresh();
      } catch {
        toast.error("Error al guardar región");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar la región ${region.name}?`)) return;
    startTransition(async () => {
      try {
        await deleteDeliveryRegionAction(region.id);
        toast.success("Región eliminada");
        router.refresh();
      } catch {
        toast.error("Error al eliminar región");
      }
    });
  }

  function handleSeedCommunes() {
    startTransition(async () => {
      try {
        const result = await seedDeliveryCommunesAction(region.id);
        toast.success(
          result.seeded > 0
            ? `${result.seeded} comunas agregadas`
            : "Todas las comunas ya estaban cargadas"
        );
        router.refresh();
      } catch {
        toast.error("Error al cargar comunas");
      }
    });
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{region.name}</span>
            <Badge variant={region.is_active ? "default" : "secondary"}>
              {region.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {region.courier} · {formatClp(region.default_price)} ·{" "}
            {region.communes.length} comunas
          </p>
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Courier</Label>
              <CourierSelect value={courier} onValueChange={setCourier} />
            </div>
            <div className="space-y-2">
              <Label>Precio base (CLP)</Label>
              <Input
                type="number"
                min={0}
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Activa</Label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={saveRegion} disabled={pending}>
              Guardar región
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSeedCommunes}
              disabled={pending}
            >
              <MapPin className="size-4" />
              Cargar comunas oficiales
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="size-4" />
              Eliminar región
            </Button>
          </div>

          {region.communes.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Sin comunas cargadas. Usa &quot;Cargar comunas oficiales&quot; para
              poblar la región.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Filtrar comunas</Label>
                <Input
                  value={communeFilter}
                  onChange={(e) => setCommuneFilter(e.target.value)}
                  placeholder="Buscar comuna..."
                />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comuna</TableHead>
                      <TableHead>Precio efectivo</TableHead>
                      <TableHead>Precio especial</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommunes.map((commune) => (
                      <CommuneRow
                        key={commune.id}
                        commune={commune}
                        regionId={region.id}
                        regionPrice={Number(defaultPrice)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CommuneRow({
  commune,
  regionId,
  regionPrice,
}: {
  commune: DeliveryCommune;
  regionId: string;
  regionPrice: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [override, setOverride] = useState(
    commune.price_override != null ? String(commune.price_override) : ""
  );
  const [active, setActive] = useState(commune.is_active);

  const effectivePrice =
    override.trim() === ""
      ? regionPrice
      : Number(override) || commune.effective_price;

  function saveOverride() {
    const trimmed = override.trim();
    const nextOverride = trimmed === "" ? null : Number(trimmed);
    if (trimmed !== "" && (Number.isNaN(nextOverride) || nextOverride! < 0)) {
      toast.error("Precio inválido");
      return;
    }
    if (nextOverride === commune.price_override) return;

    startTransition(async () => {
      try {
        await updateDeliveryCommuneAction(regionId, commune.id, {
          price_override: nextOverride,
        });
        toast.success(`Precio de ${commune.name} actualizado`);
        router.refresh();
      } catch {
        toast.error("Error al guardar comuna");
      }
    });
  }

  function toggleActive(checked: boolean) {
    setActive(checked);
    startTransition(async () => {
      try {
        await updateDeliveryCommuneAction(regionId, commune.id, {
          active: checked,
        });
        toast.success(
          checked
            ? `${commune.name} activada para despacho`
            : `${commune.name} desactivada (sin cobertura)`
        );
        router.refresh();
      } catch {
        setActive(!checked);
        toast.error("Error al actualizar comuna");
      }
    });
  }

  return (
    <TableRow className={!active ? "opacity-60" : undefined}>
      <TableCell className="font-medium">{commune.name}</TableCell>
      <TableCell>
        <span className={commune.price_override != null ? "font-medium" : ""}>
          {formatClp(effectivePrice)}
        </span>
        {commune.price_override == null && (
          <p className="text-xs text-muted-foreground">Hereda región</p>
        )}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          className="h-8 w-28"
          value={override}
          placeholder={String(regionPrice)}
          onChange={(e) => setOverride(e.target.value)}
          onBlur={saveOverride}
          disabled={pending || !active}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={active}
            onCheckedChange={toggleActive}
            disabled={pending}
          />
          <span className="text-xs text-muted-foreground">
            {active ? "Con despacho" : "Sin cobertura"}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DespachosManager({
  regions,
  chileRegions,
  apiError,
}: {
  regions: DeliveryRegion[];
  chileRegions: string[];
  apiError?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const existingNames = useMemo(
    () => new Set(regions.map((r) => r.name.toLowerCase())),
    [regions]
  );

  function handleReindex() {
    startTransition(async () => {
      try {
        await rebuildDeliveryIndexAction();
        toast.success("Documento de despacho reindexado para el bot");
        router.refresh();
      } catch {
        toast.error("Error al reindexar despachos");
      }
    });
  }

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        Configura courier y tarifas por región. Las comunas heredan el precio
        base; puedes ajustar comunas puntuales o desactivar las que no tengan
        cobertura. Los cambios se sincronizan automáticamente con la base de
        conocimiento del bot.
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Agregar región
        </Button>
        <Button variant="outline" onClick={handleReindex} disabled={pending}>
          <RefreshCw className="size-4" />
          Reindexar para el bot
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva región de despacho</DialogTitle>
          </DialogHeader>
          <RegionForm
            chileRegions={chileRegions}
            existingNames={existingNames}
            apiError={apiError ?? null}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {regions.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Agrega una región para definir courier, precio base y comunas con
            cobertura de despacho.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {regions.map((region) => (
            <RegionPanel key={region.id} region={region} />
          ))}
        </div>
      )}
    </div>
  );
}
