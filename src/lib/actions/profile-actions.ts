"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAppAccess, getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const updateMyProfileSchema = z.object({
  first_name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  last_name: z.string().trim().max(80).optional().or(z.literal("")),
  personal_phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
});

export type MyProfileData = {
  email: string;
  first_name: string;
  last_name: string;
  personal_phone: string;
  full_name: string | null;
  role: string;
};

function splitFullName(fullName: string | null | undefined): {
  first_name: string;
  last_name: string;
} {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) return { first_name: "", last_name: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

export async function getMyProfileAction(): Promise<MyProfileData> {
  const profile = await requireAppAccess();
  const user = await getSessionUser();
  if (!user?.email) {
    throw new Error("No se pudo cargar el correo de la sesión.");
  }

  const firstName = profile.first_name?.trim() || splitFullName(profile.full_name).first_name;
  const lastName = profile.last_name?.trim() || splitFullName(profile.full_name).last_name;

  return {
    email: user.email,
    first_name: firstName,
    last_name: lastName,
    personal_phone: profile.personal_phone?.trim() ?? "",
    full_name: profile.full_name,
    role: profile.role,
  };
}

export async function updateMyProfileAction(input: {
  first_name: string;
  last_name?: string;
  personal_phone?: string;
}) {
  const profile = await requireAppAccess();
  const parsed = updateMyProfileSchema.parse(input);
  const supabase = await createClient();

  const firstName = parsed.first_name.trim();
  const lastName = (parsed.last_name ?? "").trim();
  const personalPhone = (parsed.personal_phone ?? "").trim() || null;
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName || null,
      personal_phone: personalPhone,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .eq("user_id", profile.user_id);

  if (error) {
    throw new Error(
      error.message.includes("policy") || error.message.includes("permission")
        ? "No tienes permiso para actualizar tu perfil. Aplica la migración de Supabase de Mi Perfil."
        : "No se pudo guardar el perfil."
    );
  }

  await supabase.auth.updateUser({
    data: { full_name: fullName ?? undefined },
  });

  revalidatePath("/app/perfil");
  revalidatePath("/app", "layout");
}
