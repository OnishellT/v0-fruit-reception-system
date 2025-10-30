"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/search-input"

interface AuditLog {
  id: string
  action: string
  table_name: string | null
  record_id: string | null
  old_values: any
  new_values: any
  ip_address: string | null
  created_at: string
  user: {
    username: string
    full_name: string
  } | null
}

const actionLabels: Record<string, string> = {
  login: "Inicio de Sesión",
  logout: "Cierre de Sesión",
  create_user: "Crear Usuario",
  update_user: "Actualizar Usuario",
  activate_user: "Activar Usuario",
  deactivate_user: "Desactivar Usuario",
  create_reception: "Crear Recepción",
  update_reception: "Actualizar Recepción",
  delete_reception: "Eliminar Recepción",
}

const actionColors: Record<string, "default" | "secondary" | "destructive"> = {
  login: "default",
  logout: "secondary",
  create_user: "default",
  update_user: "secondary",
  activate_user: "default",
  deactivate_user: "destructive",
  create_reception: "default",
  update_reception: "secondary",
  delete_reception: "destructive",
}

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs

    const query = searchQuery.toLowerCase()
    return logs.filter((log) => {
      const searchableFields = [
        log.action,
        log.table_name,
        log.user?.username,
        log.user?.full_name,
        log.ip_address,
      ]

      return searchableFields.some((field) =>
        field ? String(field).toLowerCase().includes(query) : false,
      )
    })
  }, [logs, searchQuery])

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por acción, usuario, tabla..."
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Tabla</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    {searchQuery ? "No se encontraron registros" : "No hay registros de auditoría"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.created_at).toLocaleString("es-DO", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.user?.username || "Sistema"}</p>
                        {log.user?.full_name && <p className="text-xs text-gray-500">{log.user.full_name}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionColors[log.action] || "secondary"}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.table_name || "-"}</TableCell>
                    <TableCell>
                      {log.new_values && (
                        <div className="text-xs text-gray-600">
                          {Object.entries(log.new_values).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
