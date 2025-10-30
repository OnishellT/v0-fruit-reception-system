"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateDriver } from "@/lib/actions/drivers"
import { ArrowLeft } from "lucide-react"

interface Driver {
  id: string
  name: string
  license_number: string | null
  phone: string | null
}

export function EditDriverForm({ driver }: { driver: Driver }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await updateDriver(driver.id, formData)
      router.push("/dashboard/choferes")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Chofer</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={driver.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number">Número de Licencia</Label>
              <Input id="license_number" name="license_number" defaultValue={driver.license_number || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={driver.phone || ""} />
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
