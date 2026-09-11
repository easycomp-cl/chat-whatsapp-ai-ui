"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateMyProfileAction, type MyProfileData } from "@/lib/actions/profile-actions";
import { ROLE_LABELS } from "@/lib/roles/labels";

export function MyProfileForm({ initial }: { initial: MyProfileData }) {
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [personalPhone, setPersonalPhone] = useState(initial.personal_phone);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await updateMyProfileAction({
          first_name: firstName,
          last_name: lastName,
          personal_phone: personalPhone,
        });
        toast.success("Perfil actualizado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil");
      }
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Datos personales</CardTitle>
        <CardDescription>
          Información de tu cuenta en easycomp-chat-bot-manager. El correo no se puede cambiar desde aquí.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">Nombre</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">Apellido</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Correo</Label>
            <Input
              id="profile-email"
              type="email"
              value={initial.email}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Teléfono personal</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={personalPhone}
              onChange={(e) => setPersonalPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label>Rol en el negocio</Label>
            <Input
              value={ROLE_LABELS[initial.role as keyof typeof ROLE_LABELS] ?? initial.role}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
