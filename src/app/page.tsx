import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";

export default async function HomePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "SUPER_ADMIN") redirect("/admin/businesses");
  if (!profile.active || !profile.business_id) redirect("/login");
  redirect("/app/dashboard");
}
