"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import {
  addProviderCertification,
  removeProviderCertification,
} from "@/lib/actions/certifications";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Certification {
  id: string;
  name: string;
}

interface ProviderCertification {
  certification_id: string;
  issued_date: string | null;
  expiry_date: string | null;
  notes: string | null;
}

export function ProviderCertifications({
  providerId,
  certifications,
  allCertifications,
}: {
  providerId: string;
  certifications: ProviderCertification[];
  allCertifications: Certification[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await addProviderCertification(providerId, formData);
      setOpen(false);
      router.refresh();
    } catch (error) {
      alert("Error al agregar certificación");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (certificationId: string) => {
    try {
      await removeProviderCertification(providerId, certificationId);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar certificación");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Certificaciones</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Certificación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Certificación</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certification_id">Certificación *</Label>
                <Select name="certification_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una certificación" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCertifications.map((cert) => (
                      <SelectItem key={cert.id} value={cert.id}>
                        {cert.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issued_date">Fecha de Emisión</Label>
                  <Input type="date" id="issued_date" name="issued_date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Fecha de Vencimiento</Label>
                  <Input type="date" id="expiry_date" name="expiry_date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Agregando..." : "Agregar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay certificaciones registradas
          </p>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert) => {
              const certification = allCertifications.find(
                (c) => c.id === cert.certification_id,
              );
              const certificationName =
                certification?.name || "Certificación desconocida";

              return (
                <div
                  key={cert.certification_id}
                  className="flex items-start justify-between p-3 border border-border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{certificationName}</Badge>
                    </div>
                    {(cert.issued_date || cert.expiry_date) && (
                      <p className="text-sm text-muted-foreground">
                        {cert.issued_date &&
                          `Emitida: ${new Date(cert.issued_date).toLocaleDateString()}`}
                        {cert.issued_date && cert.expiry_date && " • "}
                        {cert.expiry_date &&
                          `Vence: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                      </p>
                    )}
                    {cert.notes && (
                      <p className="text-sm text-muted-foreground">
                        {cert.notes}
                      </p>
                    )}
                  </div>
                  <ConfirmDialog
                    title="¿Eliminar certificación?"
                    description="¿Está seguro de que desea eliminar esta certificación del proveedor? Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    variant="destructive"
                    onConfirm={() => handleRemove(cert.certification_id)}
                  >
                    <Button variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </ConfirmDialog>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
