import { requireSuperAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireSuperAdmin();

  return (
    <AdminShell userName={profile.full_name ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
