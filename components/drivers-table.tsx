"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { deleteDriver } from "@/lib/actions/drivers";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Driver {
  id: string;
  name: string;
  license_number: string | null;
  phone: string | null;
}

export function DriversTable({ drivers }: { drivers: Driver[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteDriver(id);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar chofer");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Licencia</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="font-medium">{driver.name}</TableCell>
              <TableCell>{driver.license_number || "-"}</TableCell>
              <TableCell>{driver.phone || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/choferes/${driver.id}`)
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog
                    title="¿Eliminar chofer?"
                    description="¿Está seguro de que desea eliminar este chofer? Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    variant="destructive"
                    onConfirm={() => handleDelete(driver.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleting === driver.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
