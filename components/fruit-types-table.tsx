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
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { deleteFruitType } from "@/lib/actions/fruit-types";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";

interface FruitType {
  id: string;
  type: string;
  subtype: string;
}

export function FruitTypesTable({ fruitTypes }: { fruitTypes: FruitType[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFruitTypes = useMemo(() => {
    if (!searchQuery.trim()) return fruitTypes;

    const query = searchQuery.toLowerCase();
    return fruitTypes.filter((fruitType) => {
      const searchableFields = [fruitType.type, fruitType.subtype];

      return searchableFields.some((field) =>
        field ? String(field).toLowerCase().includes(query) : false,
      );
    });
  }, [fruitTypes, searchQuery]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteFruitType(id);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar tipo de fruto");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por tipo o subtipo..."
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Subtipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFruitTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  {searchQuery
                    ? "No se encontraron tipos de fruto"
                    : "No hay tipos de fruto registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredFruitTypes.map((fruitType) => (
                <TableRow key={fruitType.id}>
                  <TableCell className="font-medium">{fruitType.type}</TableCell>
                  <TableCell>{fruitType.subtype}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/tipos-fruto/${fruitType.id}`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog
                        title="¿Eliminar tipo de fruto?"
                        description="¿Está seguro de que desea eliminar este tipo de fruto? Esta acción no se puede deshacer."
                        confirmText="Eliminar"
                        variant="destructive"
                        onConfirm={() => handleDelete(fruitType.id)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleting === fruitType.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmDialog>
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
