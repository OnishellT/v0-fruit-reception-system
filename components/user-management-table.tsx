"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toggleUserStatus } from "@/lib/actions/users"
import { CheckCircle, XCircle } from "lucide-react"

interface User {
  id: string
  username: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export function UserManagementTable({ users }: { users: User[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(userId)
    await toggleUserStatus(userId, !currentStatus)
    setLoading(null)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha Creación</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.username}</TableCell>
            <TableCell>{user.full_name}</TableCell>
            <TableCell>
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              {user.is_active ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Activo
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Inactivo
                </Badge>
              )}
            </TableCell>
            <TableCell>{new Date(user.created_at).toLocaleDateString("es-DO")}</TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(user.id, user.is_active)}
                disabled={loading === user.id}
              >
                {loading === user.id ? "..." : user.is_active ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
