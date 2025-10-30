"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSession } from "./auth"

export async function getDrivers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("drivers").select("*").order("name", { ascending: true })

  if (error) throw error
  return data
}

export async function getDriver(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("drivers").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createDriver(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const name = formData.get("name") as string
  const license_number = formData.get("license_number") as string
  const phone = formData.get("phone") as string

  const supabase = await createClient()
  const { error } = await supabase.from("drivers").insert({
    name,
    license_number,
    phone,
  })

  if (error) throw error

  revalidatePath("/dashboard/choferes")
  return { success: true }
}

export async function updateDriver(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const name = formData.get("name") as string
  const license_number = formData.get("license_number") as string
  const phone = formData.get("phone") as string

  const supabase = await createClient()
  const { error } = await supabase.from("drivers").update({ name, license_number, phone }).eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard/choferes")
  return { success: true }
}

export async function deleteDriver(id: string) {
  const session = await getSession()
  if (!session || session.role !== "admin") throw new Error("No autorizado")

  const supabase = await createClient()
  const { error } = await supabase.from("drivers").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard/choferes")
  return { success: true }
}
