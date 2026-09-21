"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerGarageSection } from "@/features/conversations/components/customer-garage-section";
import {
  getCustomerProfileAction,
  updateCustomerProfileAction,
} from "@/lib/actions/customer-profile-actions";
import {
  customerLegalNames,
  withLegalNameMetadata,
} from "@/lib/customers/legal-name";
import {
  buildChangedCustomerProfilePatch,
  type CustomerProfileSnapshot,
} from "@/lib/customers/profile-patch";
import { rememberProfileEventActor } from "@/lib/customers/profile-event-actor";
import { formatRutDisplay } from "@/lib/customers/rut";
import type { DeliveryRegion } from "@/lib/bot-api/types";
import type { Customer, CustomerInvoiceType } from "@/types/database.types";
import type { CustomerGarage } from "@/types/message";

type CustomerProfileSectionProps = {
  conversationId: string;
  customer: Customer | null;
  canEdit: boolean;
  deliveryRegions: DeliveryRegion[];
};

function ReadOnlyRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 text-sm">
      <dt className="text-[#202022]/50">{label}</dt>
      <dd
        className="min-w-0 text-right font-medium wrap-break-word text-[#202022]"
        title={trimmed}
      >
        {trimmed}
      </dd>
    </div>
  );
}

const INVOICE_LABELS: Record<CustomerInvoiceType, string> = {
  NONE: "Sin definir",
  RECEIPT: "Boleta",
  INVOICE: "Factura",
};

function normalizeInvoiceType(value: string | null | undefined): CustomerInvoiceType {
  const upper = value?.toUpperCase();
  if (upper === "RECEIPT" || upper === "INVOICE" || upper === "NONE") {
    return upper;
  }
  return "NONE";
}

export function CustomerProfileSection({
  conversationId,
  customer,
  canEdit,
  deliveryRegions,
}: CustomerProfileSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [apiReady, setApiReady] = useState(true);
  const [showDelivery, setShowDelivery] = useState(false);

  const initialLegalNames = customerLegalNames(customer);
  const [firstName, setFirstName] = useState(initialLegalNames.first_name);
  const [lastName, setLastName] = useState(initialLegalNames.last_name);
  const [displayAlias, setDisplayAlias] = useState(customer?.display_alias ?? "");
  const [profileMetadata, setProfileMetadata] = useState<Record<string, unknown> | null>(
    customer?.profile_metadata ?? null
  );
  const [email, setEmail] = useState(customer?.email ?? "");
  const [taxId, setTaxId] = useState(customer?.tax_id ?? "");
  const [invoiceType, setInvoiceType] = useState<CustomerInvoiceType>(
    normalizeInvoiceType(customer?.invoice_type)
  );
  const [companyName, setCompanyName] = useState(customer?.company_name ?? "");
  const [businessActivity, setBusinessActivity] = useState(
    customer?.business_activity ?? ""
  );
  const [deliveryLine1, setDeliveryLine1] = useState(customer?.delivery1_line1 ?? "");
  const [deliveryRegion, setDeliveryRegion] = useState(customer?.delivery1_region ?? "");
  const [deliveryCommune, setDeliveryCommune] = useState(customer?.delivery1_commune ?? "");
  const [deliveryNotes, setDeliveryNotes] = useState(customer?.delivery1_notes ?? "");
  const [garage, setGarage] = useState<CustomerGarage | null>(customer?.garage ?? null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const baselineRef = useRef<CustomerProfileSnapshot>({
    first_name: initialLegalNames.first_name,
    last_name: initialLegalNames.last_name,
    display_alias: customer?.display_alias ?? "",
    email: customer?.email ?? "",
    tax_id: customer?.tax_id ?? "",
    invoice_type: normalizeInvoiceType(customer?.invoice_type),
    company_name: customer?.company_name ?? "",
    business_activity: customer?.business_activity ?? "",
    delivery1_line1: customer?.delivery1_line1 ?? "",
    delivery1_region: customer?.delivery1_region ?? "",
    delivery1_commune: customer?.delivery1_commune ?? "",
    delivery1_notes: customer?.delivery1_notes ?? "",
  });

  const activeRegions = useMemo(
    () => deliveryRegions.filter((r) => r.is_active),
    [deliveryRegions]
  );

  const communesForRegion = useMemo(() => {
    const region = activeRegions.find((r) => r.name === deliveryRegion);
    if (!region) return [];
    return region.communes.filter((c) => c.is_active);
  }, [activeRegions, deliveryRegion]);

  useEffect(() => {
    if (!customer?.id) return;
    const customerId: string = customer.id;
    let cancelled = false;

    function applyCustomer(c: Customer) {
      const names = customerLegalNames({
        first_name: c.first_name || c.garage?.first_name,
        last_name: c.last_name || c.garage?.last_name,
        profile_metadata: c.profile_metadata,
      });
      setFirstName(names.first_name);
      setLastName(names.last_name);
      setDisplayAlias(c.display_alias ?? "");
      setProfileMetadata((prev) => c.profile_metadata ?? prev);
      setEmail(c.email ?? "");
      setTaxId(c.tax_id ?? "");
      setInvoiceType(normalizeInvoiceType(c.invoice_type));
      setCompanyName(c.company_name ?? "");
      setBusinessActivity(c.business_activity ?? "");
      setDeliveryLine1(c.delivery1_line1 ?? "");
      setDeliveryRegion(c.delivery1_region ?? "");
      setDeliveryCommune(c.delivery1_commune ?? "");
      setDeliveryNotes(c.delivery1_notes ?? "");
      setGarage(c.garage ?? null);
      baselineRef.current = {
        first_name: names.first_name,
        last_name: names.last_name,
        display_alias: c.display_alias ?? "",
        email: c.email ?? "",
        tax_id: c.tax_id ?? "",
        invoice_type: normalizeInvoiceType(c.invoice_type),
        company_name: c.company_name ?? "",
        business_activity: c.business_activity ?? "",
        delivery1_line1: c.delivery1_line1 ?? "",
        delivery1_region: c.delivery1_region ?? "",
        delivery1_commune: c.delivery1_commune ?? "",
        delivery1_notes: c.delivery1_notes ?? "",
      };
    }

    function load() {
      if (editingRef.current) return;
      getCustomerProfileAction(customerId).then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          if (result.reason === "api_not_ready") setApiReady(false);
          return;
        }
        setApiReady(true);
        applyCustomer(result.customer);
      });
    }

    load();

    function onGarageUpdated() {
      load();
    }
    window.addEventListener("easycomp:customer-garage-updated", onGarageUpdated);

    const supabase = createClient();
    const channel = supabase
      .channel(`customer-profile-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Customer",
          filter: `id=eq.${customerId}`,
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.removeEventListener("easycomp:customer-garage-updated", onGarageUpdated);
      void supabase.removeChannel(channel);
    };
  }, [customer?.id]);

  if (!customer) return null;

  const hasSavedData =
    firstName ||
    lastName ||
    displayAlias ||
    email ||
    taxId ||
    invoiceType !== "NONE" ||
    companyName ||
    businessActivity ||
    deliveryLine1 ||
    deliveryRegion ||
    deliveryCommune;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    startTransition(async () => {
      try {
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const nextSnapshot: CustomerProfileSnapshot = {
          first_name: trimmedFirst,
          last_name: trimmedLast,
          display_alias: displayAlias,
          email,
          tax_id: taxId,
          invoice_type: invoiceType,
          company_name: companyName,
          business_activity: businessActivity,
          delivery1_line1: deliveryLine1,
          delivery1_region: deliveryRegion,
          delivery1_commune: deliveryCommune,
          delivery1_notes: deliveryNotes,
        };
        const patch = buildChangedCustomerProfilePatch(baselineRef.current, nextSnapshot);
        if (!patch) {
          toast.message("No hay cambios para guardar");
          setEditing(false);
          return;
        }
        const nextMetadata = withLegalNameMetadata(
          profileMetadata,
          trimmedFirst,
          trimmedLast
        );
        const saved = await updateCustomerProfileAction(conversationId, customer.id, patch);
        rememberProfileEventActor(conversationId, saved.actorName);
        baselineRef.current = nextSnapshot;
        setProfileMetadata(nextMetadata);
        if (saved.customer.garage !== undefined) {
          setGarage(saved.customer.garage ?? null);
        }
        toast.success("Datos del cliente guardados");
        setEditing(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudieron guardar los datos"
        );
      }
    });
  }

  function handleRutBlur() {
    if (!taxId.trim()) return;
    setTaxId(formatRutDisplay(taxId));
  }

  return (
    <>
    <section className="min-w-0 rounded-xl border border-[#202022]/8 bg-white p-4 shadow-sm">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <h4 className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
          <UserRound className="size-3.5 shrink-0 text-[#0d9488]" />
          <span className="truncate">Datos del cliente</span>
        </h4>
        {canEdit && !editing && (
          <TooltipProvider delay={400}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-[#0d9488] hover:bg-[#0d9488]/10"
                    onClick={() => setEditing(true)}
                    aria-label="Editar"
                  />
                }
              >
                <Pencil className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">Editar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {!apiReady && canEdit && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Puedes completar los datos aquí; el guardado en servidor estará activo cuando el backend
          despliegue el perfil de contacto.
        </p>
      )}

      {canEdit && editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="customer-first-name" className="text-xs">
              Nombre
            </Label>
            <Input
              id="customer-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej. Pedro"
              maxLength={80}
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-last-name" className="text-xs">
              Apellido
            </Label>
            <Input
              id="customer-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej. Soto"
              maxLength={80}
              autoComplete="family-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-alias" className="text-xs">
              Alias
            </Label>
            <Input
              id="customer-alias"
              value={displayAlias}
              onChange={(e) => setDisplayAlias(e.target.value)}
              placeholder="Ej. Pedro Ferretería ProMax"
              maxLength={80}
            />
            <p className="text-[10px] text-[#202022]/45">
              Cómo aparece en el chat e inbox.
              {customer.name ? ` WhatsApp: ${customer.name}` : ""}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-email" className="text-xs">
              Email
            </Label>
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.cl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-rut" className="text-xs">
              RUT
            </Label>
            <Input
              id="customer-rut"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              onBlur={handleRutBlur}
              placeholder="12.345.678-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Documento</Label>
            <Select
              value={invoiceType}
              onValueChange={(v) => setInvoiceType((v ?? "NONE") as CustomerInvoiceType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin definir">
                  {INVOICE_LABELS[invoiceType]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin definir</SelectItem>
                <SelectItem value="RECEIPT">Boleta</SelectItem>
                <SelectItem value="INVOICE">Factura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invoiceType === "INVOICE" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="customer-company" className="text-xs">
                  Razón social
                </Label>
                <Input
                  id="customer-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-giro" className="text-xs">
                  Giro
                </Label>
                <Input
                  id="customer-giro"
                  value={businessActivity}
                  onChange={(e) => setBusinessActivity(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-[#202022]/8 px-3 py-2 text-left text-xs font-medium text-[#202022]/70"
            onClick={() => setShowDelivery((v) => !v)}
          >
            Despacho
            <ChevronDown
              className={`size-4 transition-transform ${showDelivery ? "rotate-180" : ""}`}
            />
          </button>

          {showDelivery && (
            <div className="space-y-3 rounded-lg border border-dashed border-[#202022]/10 p-3">
              {activeRegions.length === 0 ? (
                <p className="text-xs text-[#202022]/50">
                  Configura regiones en{" "}
                  <Link href="/app/deliveries" className="text-[#0d9488] underline">
                    Despachos
                  </Link>{" "}
                  para elegir comuna.
                </p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Región</Label>
                    <Select
                      value={deliveryRegion}
                      onValueChange={(v) => {
                        setDeliveryRegion(v ?? "");
                        setDeliveryCommune("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar región" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeRegions.map((r) => (
                          <SelectItem key={r.id} value={r.name}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Comuna</Label>
                    <Select
                      value={deliveryCommune}
                      onValueChange={(v) => setDeliveryCommune(v ?? "")}
                      disabled={!deliveryRegion}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar comuna" />
                      </SelectTrigger>
                      <SelectContent>
                        {communesForRegion.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="customer-address" className="text-xs">
                  Dirección
                </Label>
                <Input
                  id="customer-address"
                  value={deliveryLine1}
                  onChange={(e) => setDeliveryLine1(e.target.value)}
                  placeholder="Calle, número, depto"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-delivery-notes" className="text-xs">
                  Notas de despacho
                </Label>
                <Input
                  id="customer-delivery-notes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Portón, horario, referencias"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={pending} className="flex-1">
              {pending ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <dl className="min-w-0 space-y-2">
          {!hasSavedData ? (
            <p className="text-sm text-[#202022]/40">
              {canEdit
                ? "Sin datos comerciales. Usa Editar para agregar nombre, alias, RUT o dirección."
                : "Sin datos comerciales registrados."}
            </p>
          ) : (
            <>
              <ReadOnlyRow label="Nombre" value={firstName} />
              <ReadOnlyRow label="Apellido" value={lastName} />
              <ReadOnlyRow label="Alias" value={displayAlias} />
              <ReadOnlyRow label="Email" value={email} />
              <ReadOnlyRow label="RUT" value={taxId} />
              {invoiceType !== "NONE" && (
                <ReadOnlyRow label="Documento" value={INVOICE_LABELS[invoiceType]} />
              )}
              <ReadOnlyRow label="Razón social" value={companyName} />
              <ReadOnlyRow label="Giro" value={businessActivity} />
              <ReadOnlyRow
                label="Despacho"
                value={
                  [deliveryLine1, deliveryCommune, deliveryRegion]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
              <ReadOnlyRow label="Notas despacho" value={deliveryNotes} />
            </>
          )}
        </dl>
      )}
    </section>
    <CustomerGarageSection
      garage={garage}
      conversationId={conversationId}
      customerId={customer?.id}
      canEdit={canEdit}
      onGarageChange={setGarage}
    />
    </>
  );
}
