"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSession } from "./auth"

export async function getCertifications() {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase.from("certifications").select("*").order("name", { ascending: true })

  if (error) throw error
  return data
}

export async function getProviderCertifications(providerId: string) {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from("provider_certifications")
    .select("*")
    .eq("provider_id", providerId)

  if (error) throw error
  return data
}

export async function addProviderCertification(providerId: string, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const certificationId = formData.get("certification_id") as string
  const issuedDate = formData.get("issued_date") as string
  const expiryDate = formData.get("expiry_date") as string
  const notes = formData.get("notes") as string

  const supabase = await createServiceRoleClient()
  const { error } = await supabase.from("provider_certifications").insert({
    provider_id: providerId,
    certification_id: certificationId,
    issued_date: issuedDate || null,
    expiry_date: expiryDate || null,
    notes: notes || null,
  })

  if (error) throw error

  revalidatePath(`/dashboard/proveedores/${providerId}`)
  return { success: true }
}

export async function removeProviderCertification(providerId: string, certificationId: string) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from("provider_certifications")
    .delete()
    .eq("provider_id", providerId)
    .eq("certification_id", certificationId)

  if (error) throw error

  revalidatePath(`/dashboard/proveedores/${providerId}`)
  return { success: true }
}
