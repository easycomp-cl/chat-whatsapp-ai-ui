import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database.types";

export const getBusinessById = cache(async (businessId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  return data as Business | null;
});
