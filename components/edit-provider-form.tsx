"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProvider } from "@/lib/actions/providers"
import { ArrowLeft } from "lucide-react"

interface Provider {
  id: string
  code: string
  name: string
  contact: string | null
  phone: string | null
  address: string | null
  asociacion_id: string | null
}

interface Asociacion {
  id: string
  code: string
  name: string
}

export function EditProviderForm({
  provider,
  asociaciones,
}: {
  provider: Provider
  asociaciones: Asociacion[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await updateProvider(provider.id, formData)
      router.push("/dashboard/proveedores")
      router.refresh()
    } catch (error) {
      alert("Error al actualizar proveedor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Proveedor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={provider.code} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={provider.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contacto</Label>
              <Input id="contact" name="contact" defaultValue={provider.contact || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={provider.phone || ""} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={provider.address || ""} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="asociacion_id">Asociación</Label>
              <Select name="asociacion_id" defaultValue={provider.asociacion_id || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una asociación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asociación</SelectItem>
                  {asociaciones.map((asociacion) => (
                    <SelectItem key={asociacion.id} value={asociacion.id}>
                      {asociacion.code} - {asociacion.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
