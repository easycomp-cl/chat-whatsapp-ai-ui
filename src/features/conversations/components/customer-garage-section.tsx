"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Car, Eye, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  removeCustomerGarageProductAction,
  removeCustomerGarageVehicleAction,
} from "@/lib/actions/customer-profile-actions";
import { rememberProfileEventActor } from "@/lib/customers/profile-event-actor";
import { formatFullDateTime, formatShortDate } from "@/lib/format-datetime";
import {
  formatPlateDisplay,
  productHistoryDetailRows,
  productHistoryIdentity,
  productHistorySourceLabel,
  vehicleDetailRows,
  vehicleLabel,
  type GarageProductBucket,
} from "@/lib/customers/vehicle";
import type { CustomerGarage, CustomerVehicle, ProductHistoryItem } from "@/types/message";

type DetailState =
  | { kind: "vehicle"; vehicle: CustomerVehicle }
  | {
      kind: "product";
      item: ProductHistoryItem;
      bucket: GarageProductBucket;
      bucketLabel: string;
    }
  | null;

type DeleteTarget =
  | { kind: "vehicle"; vehicle: CustomerVehicle }
  | { kind: "product"; item: ProductHistoryItem; bucket: GarageProductBucket };

function DetailRows({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#202022]/45">Sin más detalles.</p>;
  }
  return (
    <dl className="space-y-2">
      {rows.map((row) => (
        <div
          key={`${row.label}-${row.value}`}
          className="flex items-start justify-between gap-3 text-sm"
        >
          <dt className="shrink-0 text-[#202022]/50">{row.label}</dt>
          <dd className="min-w-0 text-right font-medium wrap-break-word text-[#202022]">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RowActions({
  canEdit,
  onView,
  onDelete,
  deleting,
}: {
  canEdit: boolean;
  onView: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={onView}
        className="rounded-md p-1.5 text-[#202022]/35 opacity-0 transition-all group-hover:opacity-100 hover:bg-white hover:text-[#0d9488] focus-visible:opacity-100"
        aria-label="Ver detalle"
        title="Ver detalle"
      >
        <Eye className="size-3.5" strokeWidth={2} />
      </button>
      {canEdit && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-md p-1.5 text-[#202022]/35 opacity-0 transition-all group-hover:opacity-100 hover:bg-[#fee2e2] hover:text-[#dc2626] focus-visible:opacity-100 disabled:opacity-40"
          aria-label="Eliminar"
          title="Eliminar"
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

function HistoryList({
  title,
  bucket,
  items,
  canEdit,
  deletingKey,
  onView,
  onDelete,
}: {
  title: string;
  bucket: GarageProductBucket;
  items: ProductHistoryItem[];
  canEdit: boolean;
  deletingKey: string | null;
  onView: (item: ProductHistoryItem, bucket: GarageProductBucket, bucketLabel: string) => void;
  onDelete: (item: ProductHistoryItem, bucket: GarageProductBucket) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold tracking-wide text-[#202022]/45 uppercase">{title}</p>
      <ul className="space-y-1">
        {items.slice(0, 8).map((item, index) => {
          const identity = productHistoryIdentity(item);
          const rowKey = `${bucket}-${identity}-${item.at}-${index}`;
          return (
            <li
              key={rowKey}
              className="group flex items-start justify-between gap-2 rounded-lg px-1 py-1 text-xs transition-colors hover:bg-[#f9fafc]"
            >
              <button
                type="button"
                onClick={() => onView(item, bucket, title)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="wrap-break-word font-medium text-[#202022]">
                  {item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ""}
                  {item.name}
                  {item.sku ? (
                    <span className="font-normal text-[#202022]/45"> · {item.sku}</span>
                  ) : null}
                </span>
              </button>
              <div className="flex items-center gap-1">
                {item.at ? (
                  <span className="shrink-0 text-[10px] text-[#202022]/40">
                    {formatShortDate(item.at)}
                  </span>
                ) : null}
                <RowActions
                  canEdit={canEdit}
                  deleting={deletingKey === rowKey}
                  onView={() => onView(item, bucket, title)}
                  onDelete={() => onDelete(item, bucket)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type CustomerGarageSectionProps = {
  garage: CustomerGarage | null;
  conversationId?: string;
  customerId?: string;
  canEdit?: boolean;
  onGarageChange?: (garage: CustomerGarage | null) => void;
};

export function CustomerGarageSection({
  garage,
  conversationId,
  customerId,
  canEdit = false,
  onGarageChange,
}: CustomerGarageSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  if (!garage) return null;

  const hasVehicles = garage.vehicles.length > 0;
  const hasHistory =
    garage.products_consulted.length > 0 ||
    garage.products_quoted.length > 0 ||
    garage.products_purchased.length > 0;

  if (!hasVehicles && !hasHistory) return null;

  const canMutate = Boolean(canEdit && conversationId && customerId);

  function requestRemoveVehicle(vehicle: CustomerVehicle) {
    if (!canMutate) return;
    setDetail(null);
    setDeleteTarget({ kind: "vehicle", vehicle });
  }

  function requestRemoveProduct(item: ProductHistoryItem, bucket: GarageProductBucket) {
    if (!canMutate) return;
    setDetail(null);
    setDeleteTarget({ kind: "product", item, bucket });
  }

  function handleConfirmDelete() {
    if (!deleteTarget || !conversationId || !customerId) return;

    if (deleteTarget.kind === "vehicle") {
      const vehicle = deleteTarget.vehicle;
      setDeletingKey(`vehicle-${vehicle.key}`);
      startTransition(async () => {
        try {
          const result = await removeCustomerGarageVehicleAction(
            conversationId,
            customerId,
            vehicle.key
          );
          rememberProfileEventActor(conversationId, result.actorName);
          onGarageChange?.(result.garage);
          setDeleteTarget(null);
          toast.success("Vehículo eliminado");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "No se pudo eliminar el vehículo");
        } finally {
          setDeletingKey(null);
        }
      });
      return;
    }

    const { item, bucket } = deleteTarget;
    const identity = productHistoryIdentity(item);
    setDeletingKey(`${bucket}-${identity}`);
    startTransition(async () => {
      try {
        const result = await removeCustomerGarageProductAction(
          conversationId,
          customerId,
          bucket,
          identity
        );
        rememberProfileEventActor(conversationId, result.actorName);
        onGarageChange?.(result.garage);
        setDeleteTarget(null);
        toast.success("Producto eliminado del historial");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo eliminar el producto");
      } finally {
        setDeletingKey(null);
      }
    });
  }

  const deleteTitle =
    deleteTarget?.kind === "vehicle"
      ? "¿Eliminar este vehículo?"
      : deleteTarget?.kind === "product"
        ? "¿Eliminar este producto?"
        : "¿Eliminar?";

  const deleteLabel =
    deleteTarget?.kind === "vehicle"
      ? vehicleLabel(deleteTarget.vehicle)
      : deleteTarget?.kind === "product"
        ? deleteTarget.item.name
        : "";

  const deleteDescription =
    deleteTarget?.kind === "vehicle"
      ? "Se quitará del garage del contacto. Esta acción no se puede deshacer."
      : "Se quitará del historial de SKUs del contacto. Esta acción no se puede deshacer.";

  const detailTitle =
    detail?.kind === "vehicle"
      ? vehicleLabel(detail.vehicle)
      : detail?.kind === "product"
        ? detail.item.name
        : "";

  const detailRows =
    detail?.kind === "vehicle"
      ? vehicleDetailRows(detail.vehicle).map((row) =>
          row.label === "Última vez"
            ? { ...row, value: formatFullDateTime(row.value) }
            : row
        )
      : detail?.kind === "product"
        ? productHistoryDetailRows(detail.item).map((row) => {
            if (row.label === "Fuente") {
              return { ...row, value: productHistorySourceLabel(row.value) || row.value };
            }
            if (row.label === "Fecha" && row.value) {
              return { ...row, value: formatFullDateTime(row.value) };
            }
            return row;
          })
        : [];

  return (
    <>
      <section className="min-w-0 rounded-xl border border-[#202022]/8 bg-white p-4 shadow-sm">
        <h4 className="mb-3 flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
          <Car className="size-3.5 shrink-0 text-[#0d9488]" />
          <span className="truncate">Vehículos y productos</span>
        </h4>

        {hasVehicles ? (
          <ul className="mb-3 space-y-1.5">
            {garage.vehicles.map((vehicle) => {
              const active = garage.active_vehicle_key === vehicle.key;
              const extras = [vehicle.engine, vehicle.color, vehicle.fuel, vehicle.version].filter(
                Boolean
              );
              return (
                <li
                  key={vehicle.key}
                  className="group flex items-center justify-between gap-2 rounded-lg bg-[#f9fafc] px-2.5 py-1.5 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => setDetail({ kind: "vehicle", vehicle })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block wrap-break-word font-medium text-[#202022]">
                      {vehicle.plate ? formatPlateDisplay(vehicle.plate) : null}
                      {vehicle.plate && (vehicle.make || vehicle.model || vehicle.year)
                        ? " · "
                        : null}
                      {[vehicle.make, vehicle.model, vehicle.year ? String(vehicle.year) : ""]
                        .filter(Boolean)
                        .join(" ") || (!vehicle.plate ? "Vehículo" : null)}
                    </span>
                    {extras.length > 0 ? (
                      <span className="mt-0.5 block wrap-break-word font-normal text-[#202022]/45">
                        {extras.join(" · ")}
                      </span>
                    ) : null}
                  </button>
                  <div className="flex items-center gap-1">
                    {active ? (
                      <span className="shrink-0 rounded-full bg-[#dbeafe] px-1.5 py-px text-[10px] font-semibold text-[#1e40af]">
                        Activo
                      </span>
                    ) : null}
                    <RowActions
                      canEdit={canMutate}
                      deleting={deletingKey === `vehicle-${vehicle.key}`}
                      onView={() => setDetail({ kind: "vehicle", vehicle })}
                      onDelete={() => requestRemoveVehicle(vehicle)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-[#202022]/40">Sin vehículos registrados.</p>
        )}

        {hasHistory ? (
          <div className="space-y-3 border-t border-[#202022]/8 pt-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-[#202022]/45 uppercase">
              <Package className="size-3" />
              Historial de SKUs
            </p>
            <HistoryList
              title="Consultados"
              bucket="consulted"
              items={garage.products_consulted}
              canEdit={canMutate}
              deletingKey={deletingKey}
              onView={(item, bucket, bucketLabel) =>
                setDetail({ kind: "product", item, bucket, bucketLabel })
              }
              onDelete={requestRemoveProduct}
            />
            <HistoryList
              title="Cotizados"
              bucket="quoted"
              items={garage.products_quoted}
              canEdit={canMutate}
              deletingKey={deletingKey}
              onView={(item, bucket, bucketLabel) =>
                setDetail({ kind: "product", item, bucket, bucketLabel })
              }
              onDelete={requestRemoveProduct}
            />
            <HistoryList
              title="Comprados"
              bucket="purchased"
              items={garage.products_purchased}
              canEdit={canMutate}
              deletingKey={deletingKey}
              onView={(item, bucket, bucketLabel) =>
                setDetail({ kind: "product", item, bucket, bucketLabel })
              }
              onDelete={requestRemoveProduct}
            />
          </div>
        ) : null}
      </section>

      <Dialog open={detail != null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-8 wrap-break-word">{detailTitle || "Detalle"}</DialogTitle>
            <DialogDescription>
              {detail?.kind === "vehicle"
                ? "Detalle del vehículo del contacto"
                : detail?.kind === "product"
                  ? `Producto · ${detail.bucketLabel}`
                  : "Detalle"}
            </DialogDescription>
          </DialogHeader>
          <DetailRows rows={detailRows} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !pending) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deleteTitle}</DialogTitle>
            <DialogDescription>{deleteDescription}</DialogDescription>
          </DialogHeader>
          {deleteLabel ? (
            <div className="rounded-xl border border-[#202022]/10 bg-[#f9fafc] px-3 py-3">
              <p className="text-sm font-medium wrap-break-word text-[#202022]">{deleteLabel}</p>
              {deleteTarget?.kind === "product" && deleteTarget.item.sku ? (
                <p className="mt-1 text-xs text-[#202022]/50">SKU {deleteTarget.item.sku}</p>
              ) : null}
              {deleteTarget?.kind === "vehicle" &&
              garage.active_vehicle_key === deleteTarget.vehicle.key ? (
                <p className="mt-1 text-xs font-medium text-[#1e40af]">Vehículo activo</p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={pending}
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
