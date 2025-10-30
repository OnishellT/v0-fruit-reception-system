"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { deleteProvider } from "@/lib/actions/providers"
import { useRouter } from "next/navigation"

interface Provider {
  id: string
  code: string
  name: string
  contact: string | null
  phone: string | null
  address: string | null
  asociacion?: {
    code: string
    name: string
  } | null
}

export function ProvidersTable({
  providers,
  showAsociacion = true,
}: { providers: Provider[]; showAsociacion?: boolean }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este proveedor?")) return

    setDeleting(id)
    try {
      await deleteProvider(id)
      router.refresh()
    } catch (error) {
      alert("Error al eliminar proveedor")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            {showAsociacion && <TableHead>Asociación</TableHead>}
            <TableHead>Contacto</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">{provider.code}</TableCell>
              <TableCell>{provider.name}</TableCell>
              {showAsociacion && (
                <TableCell>
                  {provider.asociacion ? (
                    <Badge variant="outline">{provider.asociacion.code}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              )}
              <TableCell>{provider.contact || "-"}</TableCell>
              <TableCell>{provider.phone || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/proveedores/${provider.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(provider.id)}
                    disabled={deleting === provider.id}
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
