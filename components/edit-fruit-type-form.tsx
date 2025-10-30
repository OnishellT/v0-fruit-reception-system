"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateFruitType } from "@/lib/actions/fruit-types"
import { ArrowLeft } from "lucide-react"

interface FruitType {
  id: string
  type: string
  subtype: string
}

export function EditFruitTypeForm({ fruitType }: { fruitType: FruitType }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await updateFruitType(fruitType.id, formData)
      router.push("/dashboard/tipos-fruto")
      router.refresh()
    } catch (error) {
      alert("Error al actualizar tipo de fruto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Tipo de Fruto</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Input id="type" name="type" defaultValue={fruitType.type} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtype">Subtipo *</Label>
              <Input id="subtype" name="subtype" defaultValue={fruitType.subtype} required />
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
