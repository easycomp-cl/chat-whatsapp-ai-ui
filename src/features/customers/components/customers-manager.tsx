"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConversationAvatar } from "@/features/conversations/components/conversation-avatar";
import { resolveCustomerDisplayName } from "@/lib/customers/resolve-display-name";
import {
  isCustomerFrequent,
  readFrequentCustomerOverrides,
} from "@/lib/customers/frequent-customer";
import { CLIENTS_MODULE } from "@/lib/roles/labels";
import { formatFullTime } from "@/lib/conversations/utils";
import type { CustomerListItem } from "@/lib/actions/customer-profile-actions";

type CustomersManagerProps = {
  businessId: string;
  customers: CustomerListItem[];
};

function CustomersTable({ customers }: { customers: CustomerListItem[] }) {
  if (customers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#202022]/15 bg-white px-4 py-10 text-center text-sm text-[#202022]/50">
        No hay clientes en esta categoría.
      </p>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Última actividad</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const displayName = resolveCustomerDisplayName(customer);
            return (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ConversationAvatar
                      name={customer.name}
                      phone={customer.phone_number}
                      seed={customer.id}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{displayName}</p>
                      {customer.display_alias && customer.name?.trim() && (
                        <p className="truncate text-xs text-[#202022]/45">
                          WhatsApp: {customer.name}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{customer.phone_number}</TableCell>
                <TableCell className="text-sm text-[#202022]/60">
                  {customer.last_seen_at
                    ? formatFullTime(customer.last_seen_at)
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {customer.conversation_id ? (
                    <Button variant="outline" size="sm" render={<Link href={`/app/conversations/${customer.conversation_id}`} />}>
                      <MessageSquare className="size-3.5" />
                      Ver chat
                    </Button>
                  ) : (
                    <span className="text-xs text-[#202022]/40">Sin conversación</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function CustomersManager({ businessId, customers }: CustomersManagerProps) {
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalOverrides(readFrequentCustomerOverrides(businessId));
  }, [businessId]);

  const { frequent, others } = useMemo(() => {
    const frequentList: CustomerListItem[] = [];
    const othersList: CustomerListItem[] = [];

    for (const customer of customers) {
      const isFrequent =
        customer.id in localOverrides
          ? localOverrides[customer.id] === true
          : isCustomerFrequent(customer, businessId);
      if (isFrequent) frequentList.push(customer);
      else othersList.push(customer);
    }

    return { frequent: frequentList, others: othersList };
  }, [businessId, customers, localOverrides]);

  return (
    <Tabs defaultValue="frequent">
      <TabsList>
        <TabsTrigger value="frequent">
          {CLIENTS_MODULE.tabFrequent} ({frequent.length})
        </TabsTrigger>
        <TabsTrigger value="others">
          {CLIENTS_MODULE.tabOthers} ({others.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="frequent" className="mt-4">
        <CustomersTable customers={frequent} />
      </TabsContent>
      <TabsContent value="others" className="mt-4">
        <CustomersTable customers={others} />
      </TabsContent>
    </Tabs>
  );
}
