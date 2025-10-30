"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSession } from "./auth"

export async function getFruitTypes() {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from("fruit_types")
    .select("*")
    .order("type", { ascending: true })
    .order("subtype", { ascending: true })

  if (error) throw error
  return data
}

export async function getFruitType(id: string) {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase.from("fruit_types").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createFruitType(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "admin") throw new Error("No autorizado")

  const type = formData.get("type") as string
  const subtype = formData.get("subtype") as string

  const supabase = await createServiceRoleClient()
  const { error } = await supabase.from("fruit_types").insert({
    type,
    subtype,
  })

  if (error) throw error

  revalidatePath("/dashboard/tipos-fruto")
  return { success: true }
}

export async function updateFruitType(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "admin") throw new Error("No autorizado")

  const type = formData.get("type") as string
  const subtype = formData.get("subtype") as string

  const supabase = await createServiceRoleClient()
  const { error } = await supabase.from("fruit_types").update({ type, subtype }).eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard/tipos-fruto")
  return { success: true }
}

export async function deleteFruitType(id: string) {
  const session = await getSession()
  if (!session || session.role !== "admin") throw new Error("No autorizado")

  const supabase = await createServiceRoleClient()
  const { error } = await supabase.from("fruit_types").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard/tipos-fruto")
  return { success: true }
}
