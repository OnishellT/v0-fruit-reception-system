"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Reception {
  id: string;
  reception_number: string;
  reception_date: string;
  truck_plate: string;
  total_containers: number;
  status: string;
  provider: { name: string; code: string };
  driver: { name: string };
  created_by_user: { username: string };
}

export function ReceptionsTable({ receptions }: { receptions: Reception[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Chofer</TableHead>
          <TableHead>Placa</TableHead>
          <TableHead className="text-right">Contenedores</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {receptions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-gray-500">
              No hay recepciones registradas
            </TableCell>
          </TableRow>
        ) : (
          receptions.map((reception) => (
            <TableRow key={reception.id}>
              <TableCell className="font-medium">
                {reception.reception_number}
              </TableCell>
              <TableCell>
                {new Date(reception.reception_date).toLocaleDateString("es-DO")}
              </TableCell>
              <TableCell>
                {reception.provider
                  ? `${reception.provider.code} - ${reception.provider.name}`
                  : "N/A"}
              </TableCell>
              <TableCell>{reception.driver?.name || "N/A"}</TableCell>
              <TableCell>{reception.truck_plate}</TableCell>
              <TableCell className="text-right">
                {reception.total_containers}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>{reception.created_by_user?.username || "N/A"}</TableCell>
              <TableCell>
                <Link href={`/dashboard/reception/${reception.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
