import { requireSuperAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminWhatsappPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("whatsapp_accounts").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas WhatsApp</h2>
        <p className="text-muted-foreground">Canales conectados por negocio</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teléfono</TableHead>
              <TableHead>Phone Number ID</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Activo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell>{acc.phone_number}</TableCell>
                <TableCell>{acc.phone_number_id}</TableCell>
                <TableCell><Badge variant="outline">{acc.status}</Badge></TableCell>
                <TableCell>{acc.is_active ? "Sí" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
