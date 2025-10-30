"use client";

import { useState, useMemo } from "react";
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
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReceptions = useMemo(() => {
    if (!searchQuery.trim()) return receptions;

    const query = searchQuery.toLowerCase();
    return receptions.filter((reception) => {
      const searchableFields = [
        reception.reception_number,
        reception.truck_plate,
        reception.status,
        reception.provider?.name,
        reception.provider?.code,
        reception.driver?.name,
        reception.created_by_user?.username,
      ];

      return searchableFields.some((field) =>
        field ? String(field).toLowerCase().includes(query) : false,
      );
    });
  }, [receptions, searchQuery]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por número, proveedor, chofer, placa..."
          />
        </div>
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
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500">
                  {searchQuery
                    ? "No se encontraron recepciones"
                    : "No hay recepciones registradas"}
                </TableCell>
              </TableRow>
            ) : (
              filteredReceptions.map((reception) => (
                <TableRow key={reception.id}>
                  <TableCell className="font-medium">
                    {reception.reception_number}
                  </TableCell>
                  <TableCell>
                    {new Date(reception.reception_date).toLocaleDateString(
                      "es-DO",
                    )}
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
                  <TableCell>
                    {reception.created_by_user?.username || "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/reception/${reception.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/reception/${reception.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
