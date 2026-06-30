import { requireAppAccess } from "@/lib/auth/session";
import { NotificationSoundSettings } from "@/features/settings/components/notification-sound-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PreferenciasPage() {
  await requireAppAccess();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Preferencias</h2>
        <p className="text-muted-foreground">
          Ajustes personales de la interfaz en este navegador
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sonido de notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSoundSettings />
        </CardContent>
      </Card>
    </div>
  );
}
