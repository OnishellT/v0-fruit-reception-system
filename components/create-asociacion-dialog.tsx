"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createAsociacion } from "@/lib/actions/asociaciones"

export function CreateAsociacionDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await createAsociacion(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
      // Brief delay to show success message before closing
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) {
        // Reset states when opening
        setError(null)
        setSuccess(false)
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Asociación</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-800 px-4 py-3 rounded-md border border-green-200">
              ✅ Asociación creada exitosamente.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              name="code"
              required
              disabled={loading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              required
              disabled={loading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              disabled={loading || success}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading || success}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? "Creando..." : success ? "Creada exitosamente" : "Crear Asociación"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
