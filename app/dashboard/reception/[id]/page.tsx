import { getReceptionDetails } from "@/lib/actions/reception";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export default async function ReceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    redirect("/dashboard/reception/new");
  }

  const result = await getReceptionDetails(id);

  if (result.error || !result.reception) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Detalle de Recepción
        </h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">
              {result.error || "Recepción no encontrada"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { reception, details } = result;
  const totalWeight =
    details?.reduce(
      (sum, d) => sum + Number.parseFloat(d.weight_kg.toString()),
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reception">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {reception.reception_number}
          </h1>
          <p className="text-gray-600 mt-1">Detalle de la recepción</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-medium">
                {new Date(reception.reception_date).toLocaleDateString("es-DO")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Proveedor</p>
              <p className="font-medium">
                {reception.provider
                  ? `${reception.provider.code} - ${reception.provider.name}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chofer</p>
              <p className="font-medium">{reception.driver?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Placa del Camión</p>
              <p className="font-medium">{reception.truck_plate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge
                variant={
                  reception.status === "completed"
                    ? "default"
                    : reception.status === "draft"
                      ? "secondary"
                      : "destructive"
                }
                className="capitalize"
              >
                {reception.status === "completed"
                  ? "Completada"
                  : reception.status === "draft"
                    ? "Borrador"
                    : "Cancelada"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Contenedores</p>
              <p className="text-2xl font-bold">{reception.total_containers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Peso Total</p>
              <p className="text-2xl font-bold">{totalWeight.toFixed(2)} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registrado por</p>
              <p className="font-medium">
                {reception.created_by_user?.username || "N/A"}
              </p>
            </div>
            {reception.notes && (
              <div>
                <p className="text-sm text-gray-600">Notas</p>
                <p className="font-medium">{reception.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de Pesada</CardTitle>
          <CardDescription>Registro de frutos recibidos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Tipo de Fruto</TableHead>
                <TableHead>Subtipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details?.map((detail) => (
                <TableRow key={detail.id}>
                  <TableCell>{detail.line_number}</TableCell>
                  <TableCell className="font-medium">
                    {detail.fruit_type.type}
                  </TableCell>
                  <TableCell>{detail.fruit_type.subtype}</TableCell>
                  <TableCell className="text-right">
                    {detail.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number.parseFloat(detail.weight_kg.toString()).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell colSpan={3}>TOTAL</TableCell>
                <TableCell className="text-right">
                  {reception.total_containers}
                </TableCell>
                <TableCell className="text-right">
                  {totalWeight.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
