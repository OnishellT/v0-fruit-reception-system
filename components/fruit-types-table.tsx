"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { deleteFruitType } from "@/lib/actions/fruit-types"
import { useRouter } from "next/navigation"

interface FruitType {
  id: string
  type: string
  subtype: string
}

export function FruitTypesTable({ fruitTypes }: { fruitTypes: FruitType[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este tipo de fruto?")) return

    setDeleting(id)
    try {
      await deleteFruitType(id)
      router.refresh()
    } catch (error) {
      alert("Error al eliminar tipo de fruto")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Subtipo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fruitTypes.map((fruitType) => (
            <TableRow key={fruitType.id}>
              <TableCell className="font-medium">{fruitType.type}</TableCell>
              <TableCell>{fruitType.subtype}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/tipos-fruto/${fruitType.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(fruitType.id)}
                    disabled={deleting === fruitType.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
