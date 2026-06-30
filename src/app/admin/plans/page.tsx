import { requireSuperAdmin } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPlansPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Planes</h2>
        <p className="text-muted-foreground">Administración de planes (fase futura)</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Planes disponibles</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Starter:</strong> 1.000 mensajes/mes</p>
          <p><strong>Pro:</strong> 5.000 mensajes/mes</p>
          <p><strong>Enterprise:</strong> Ilimitado</p>
          <p className="text-muted-foreground mt-4">
            Los límites se configuran en metadata_json del negocio (plan_limit).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
