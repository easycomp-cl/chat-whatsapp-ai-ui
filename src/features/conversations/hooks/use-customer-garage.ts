"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCustomerProfileAction } from "@/lib/actions/customer-profile-actions";
import type { CustomerGarage } from "@/types/message";
import type { Customer } from "@/types/database.types";

export function useCustomerGarage(
  customerId: string | null | undefined,
  refreshKey?: string | number
) {
  const [garage, setGarage] = useState<CustomerGarage | null>(null);
  const [profile, setProfile] = useState<Customer | null>(null);

  const reload = useCallback(async () => {
    if (!customerId) {
      setGarage(null);
      setProfile(null);
      return;
    }
    const result = await getCustomerProfileAction(customerId);
    if (!result.ok) return;
    setProfile(result.customer);
    setGarage(result.customer.garage ?? null);
  }, [customerId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  useEffect(() => {
    if (!customerId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`customer-garage-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Customer",
          filter: `id=eq.${customerId}`,
        },
        () => {
          void reload();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [customerId, reload]);

  return { garage, profile, reload };
}
