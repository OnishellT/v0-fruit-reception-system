"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSession } from "./auth"

export async function getProviders() {
  try {
    const supabase = await createServiceRoleClient()

    let { data, error } = await supabase
      .from("providers")
      .select("*, asociacion:asociaciones(code, name)")
      .order("name", { ascending: true })

    // If the asociaciones relationship doesn't exist, fetch without it
    if (error && error.message.includes("Could not find a relationship")) {
      console.log("[v0] Asociaciones table not set up, fetching providers without asociacion data")
      const result = await supabase.from("providers").select("*").order("name", { ascending: true })

      data = result.data
      error = result.error

      return {
        data,
        error: error ? error.message : null,
        asociacionesAvailable: false,
      }
    }

    if (error) {
      console.error("[v0] Error fetching providers:", error)
      return { error: error.message, data: null, asociacionesAvailable: false }
    }

    return { data, error: null, asociacionesAvailable: true }
  } catch (error: any) {
    console.error("[v0] Exception fetching providers:", error)
    return { error: error.message, data: null, asociacionesAvailable: false }
  }
}

export async function getProvider(id: string) {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase.from("providers").select("*, asociacion:asociaciones(*)").eq("id", id).single()

  if (error && error.message.includes("Could not find a relationship")) {
    const result = await supabase.from("providers").select("*").eq("id", id).single()

    return result.data
  }

  if (error) throw error
  return data
}

export async function createProvider(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const contact = formData.get("contact") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const asociacionId = formData.get("asociacion_id") as string

  const supabase = await createServiceRoleClient()
  const { error } = await supabase.from("providers").insert({
    name,
    code,
    contact,
    phone,
    address,
    asociacion_id: asociacionId || null,
  })

  if (error) throw error

  revalidatePath("/dashboard/proveedores")
  return { success: true }
}

export async function updateProvider(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const contact = formData.get("contact") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const asociacionId = formData.get("asociacion_id") as string

  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from("providers")
    .update({ name, code, contact, phone, address, asociacion_id: asociacionId || null })
    .eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard/proveedores")
  revalidatePath(`/dashboard/proveedores/${id}`)
  return { success: true }
}

export async function deleteProvider(id: string) {
  const session = await getSession()
  if (!session || session.role !== "admin") throw new Error("No autorizado")

  const supabase = await createServiceRoleClient()
  const { error } = await supabase.from("providers").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard/proveedores")
  return { success: true }
}
