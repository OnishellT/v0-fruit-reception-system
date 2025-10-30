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
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { deleteAsociacion } from "@/lib/actions/asociaciones";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Asociacion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  providers?: { count: number }[];
}

export function AsociacionesTable({
  asociaciones,
}: {
  asociaciones: Asociacion[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteAsociacion(id);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar asociación");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Proveedores</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asociaciones.map((asociacion) => (
            <TableRow key={asociacion.id}>
              <TableCell className="font-medium">{asociacion.code}</TableCell>
              <TableCell>{asociacion.name}</TableCell>
              <TableCell>{asociacion.description || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {asociacion.providers?.[0]?.count || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/asociaciones/${asociacion.id}`)
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog
                    title="¿Eliminar asociación?"
                    description="¿Está seguro de que desea eliminar esta asociación? Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    variant="destructive"
                    onConfirm={() => handleDelete(asociacion.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleting === asociacion.id}
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
