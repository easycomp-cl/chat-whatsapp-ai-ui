import { PageHeader } from "@/components/layout/page-header";
import { NotificationSoundSettings } from "@/features/settings/components/notification-sound-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PreferenciasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferencias"
        description="Ajustes personales de la interfaz en este navegador"
      />
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
