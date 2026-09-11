"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createAgentAction, updateAgentAction } from "@/lib/actions/app-actions";
import { TEAM_MODULE } from "@/lib/roles/labels";
import type { BusinessAgent } from "@/types/database.types";

function UserForm({
  user,
  onDone,
}: {
  user?: BusinessAgent;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [notify, setNotify] = useState(user?.notify_on_handoff ?? true);
  const [active, setActive] = useState(user?.active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      phone,
      role: user?.role ?? "collaborator",
      notify_on_handoff: notify,
      active,
    };
    startTransition(async () => {
      try {
        if (user) await updateAgentAction(user.id, data);
        else await createAgentAction(data);
        toast.success(user ? TEAM_MODULE.memberUpdated : TEAM_MODULE.memberCreated);
        onDone();
      } catch {
        toast.error(TEAM_MODULE.memberSaveError);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Teléfono</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={notify} onCheckedChange={setNotify} />
        <Label>Notificar en derivación</Label>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label>Activo</Label>
        </div>
      )}
      <Button type="submit" disabled={pending}>
        Guardar
      </Button>
    </form>
  );
}

export function UsersManager({ users }: { users: BusinessAgent[] }) {
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<BusinessAgent | null>(null);

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          setEditUser(null);
          setOpen(true);
        }}
      >
        <Plus className="size-4" /> {TEAM_MODULE.createMember}
      </Button>

      <Dialog
        open={open || !!editUser}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editUser ? TEAM_MODULE.editMember : TEAM_MODULE.newMember}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={editUser ?? undefined}
            onDone={() => {
              setOpen(false);
              setEditUser(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Notificaciones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.notify_on_handoff ? "Sí" : "No"}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditUser(user)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
