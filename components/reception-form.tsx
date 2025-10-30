"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createReception } from "@/lib/actions/reception"
import { Trash2, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Provider {
  id: string
  code: string
  name: string
}

interface Driver {
  id: string
  name: string
}

interface FruitType {
  id: string
  type: string
  subtype: string
}

interface ReceptionDetail {
  fruit_type_id: string
  quantity: number
  weight_kg: number
}

export function ReceptionForm({
  providers,
  drivers,
  fruitTypes,
}: {
  providers: Provider[]
  drivers: Driver[]
  fruitTypes: FruitType[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    provider_id: "",
    driver_id: "",
    fruit_type_id: "",
    total_containers: 0,
    notes: "",
  })

  const [details, setDetails] = useState<ReceptionDetail[]>([])
  const [currentDetail, setCurrentDetail] = useState({
    fruit_type_id: "",
    quantity: 0,
    weight_kg: 0,
  })

  const addDetail = () => {
    if (!currentDetail.fruit_type_id || currentDetail.quantity <= 0 || currentDetail.weight_kg <= 0) {
      setError("Complete todos los campos del detalle")
      return
    }

    setDetails([...details, currentDetail])
    setCurrentDetail({ fruit_type_id: "", quantity: 0, weight_kg: 0 })
    setError(null)
  }

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index))
  }

  const totalQuantity = details.reduce((sum, d) => sum + d.quantity, 0)
  const totalWeight = details.reduce((sum, d) => sum + d.weight_kg, 0)
  const remainingContainers = formData.total_containers - totalQuantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.fruit_type_id) {
      setError("Debe seleccionar el tipo de fruto")
      return
    }

    if (details.length === 0) {
      setError("Debe agregar al menos un detalle de pesada")
      return
    }

    if (totalQuantity !== formData.total_containers) {
      setError(
        `La cantidad total (${totalQuantity}) no coincide con los contenedores esperados (${formData.total_containers})`,
      )
      return
    }

    setLoading(true)

    const result = await createReception({
      ...formData,
      details,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(`Recepción creada exitosamente: ${result.reception_number}`)
      setTimeout(() => {
        router.push("/dashboard/reception")
      }, 2000)
    }
  }

  const getFruitTypeLabel = (id: string) => {
    const fruit = fruitTypes.find((f) => f.id === id)
    return fruit ? `${fruit.type} - ${fruit.subtype}` : ""
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider and Driver Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="provider">Proveedor *</Label>
          <Select
            value={formData.provider_id}
            onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
            disabled={loading}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione proveedor" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.code} - {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver">Chofer *</Label>
          <Select
            value={formData.driver_id}
            onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
            disabled={loading}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione chofer" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fruit_type">Tipo de Fruto *</Label>
          <Select
            value={formData.fruit_type_id}
            onValueChange={(value) => setFormData({ ...formData, fruit_type_id: value })}
            disabled={loading}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione tipo de fruto" />
            </SelectTrigger>
            <SelectContent>
              {fruitTypes.map((fruit) => (
                <SelectItem key={fruit.id} value={fruit.id}>
                  {fruit.type} - {fruit.subtype}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_containers">Total Contenedores/Sacos *</Label>
          <Input
            id="total_containers"
            type="number"
            min="1"
            value={formData.total_containers || ""}
            onChange={(e) => setFormData({ ...formData, total_containers: Number.parseInt(e.target.value) || 0 })}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observaciones adicionales..."
          disabled={loading}
          rows={3}
        />
      </div>

      {/* Add Detail Section */}
      {formData.fruit_type_id && (
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-4">Agregar Pesada {getFruitTypeLabel(formData.fruit_type_id)}</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo de Fruto *</Label>
              <Select
                value={currentDetail.fruit_type_id}
                onValueChange={(value) => setCurrentDetail({ ...currentDetail, fruit_type_id: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {fruitTypes.map((fruit) => (
                    <SelectItem key={fruit.id} value={fruit.id}>
                      {fruit.type} - {fruit.subtype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min="1"
                value={currentDetail.quantity || ""}
                onChange={(e) => setCurrentDetail({ ...currentDetail, quantity: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Peso (kg) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={currentDetail.weight_kg || ""}
                onChange={(e) =>
                  setCurrentDetail({ ...currentDetail, weight_kg: Number.parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="flex items-end">
              <Button type="button" onClick={addDetail} disabled={loading} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Details Table */}
      {details.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Detalles de Pesada</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Tipo de Fruto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Peso (kg)</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{getFruitTypeLabel(detail.fruit_type_id)}</TableCell>
                    <TableCell className="text-right">{detail.quantity}</TableCell>
                    <TableCell className="text-right">{detail.weight_kg.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDetail(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={2}>TOTALES</TableCell>
                  <TableCell className="text-right">{totalQuantity}</TableCell>
                  <TableCell className="text-right">{totalWeight.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex gap-4 text-sm">
            <div className="flex-1 p-3 bg-blue-50 rounded-lg">
              <p className="text-gray-600">Contenedores Esperados</p>
              <p className="text-2xl font-bold text-blue-600">{formData.total_containers}</p>
            </div>
            <div className="flex-1 p-3 bg-green-50 rounded-lg">
              <p className="text-gray-600">Contenedores Registrados</p>
              <p className="text-2xl font-bold text-green-600">{totalQuantity}</p>
            </div>
            <div className="flex-1 p-3 bg-orange-50 rounded-lg">
              <p className="text-gray-600">Contenedores Restantes</p>
              <p className={`text-2xl font-bold ${remainingContainers === 0 ? "text-green-600" : "text-orange-600"}`}>
                {remainingContainers}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Guardando..." : "Guardar Recepción"}
        </Button>
      </div>
    </form>
  )
}
