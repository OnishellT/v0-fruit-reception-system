"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/actions/auth"
import { revalidatePath } from "next/cache"

export async function getProviders() {
  const supabase = await createServiceRoleClient()

  const { data: providers, error } = await supabase.from("providers").select("*").eq("is_active", true).order("name")

  if (error) {
    return { error: "Error al obtener proveedores" }
  }

  return { providers }
}

export async function getDrivers() {
  const supabase = await createServiceRoleClient()

  const { data: drivers, error } = await supabase.from("drivers").select("*").eq("is_active", true).order("name")

  if (error) {
    return { error: "Error al obtener choferes" }
  }

  return { drivers }
}

export async function getFruitTypes() {
  const supabase = await createServiceRoleClient()

  const { data: fruitTypes, error } = await supabase
    .from("fruit_types")
    .select("*")
    .eq("is_active", true)
    .order("type, subtype")

  if (error) {
    return { error: "Error al obtener tipos de frutos" }
  }

  return { fruitTypes }
}

export async function createReception(data: {
  provider_id: string
  driver_id: string
  fruit_type_id: string
  total_containers: number
  notes?: string
  details: Array<{
    quantity: number
    weight_kg: number
  }>
}) {
  const session = await getSession()

  if (!session) {
    return { error: "No autorizado" }
  }

  const supabase = await createServiceRoleClient()

  // Generate reception number
  const today = new Date()
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "")
  const { data: lastReception } = await supabase
    .from("receptions")
    .select("reception_number")
    .like("reception_number", `REC-${dateStr}%`)
    .order("reception_number", { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (lastReception) {
    const lastSeq = Number.parseInt(lastReception.reception_number.split("-")[2])
    sequence = lastSeq + 1
  }

  const reception_number = `REC-${dateStr}-${sequence.toString().padStart(4, "0")}`

  const { data: reception, error: receptionError } = await supabase
    .from("receptions")
    .insert({
      reception_number,
      provider_id: data.provider_id,
      driver_id: data.driver_id,
      fruit_type_id: data.fruit_type_id,
      total_containers: data.total_containers,
      notes: data.notes,
      status: "completed",
      created_by: session.id,
    })
    .select()
    .single()

  if (receptionError) {
    return { error: "Error al crear recepción" }
  }

  const details = data.details.map((detail, index) => ({
    reception_id: reception.id,
    fruit_type_id: data.fruit_type_id,
    quantity: detail.quantity,
    weight_kg: detail.weight_kg,
    line_number: index + 1,
  }))

  const { error: detailsError } = await supabase.from("reception_details").insert(details)

  if (detailsError) {
    // Rollback reception if details fail
    await supabase.from("receptions").delete().eq("id", reception.id)
    return { error: "Error al crear detalles de recepción" }
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    user_id: session.id,
    action: "create_reception",
    table_name: "receptions",
    record_id: reception.id,
    new_values: { reception_number, provider_id: data.provider_id },
  })

  revalidatePath("/dashboard/reception")
  return { success: true, reception_number }
}

export async function getReceptions() {
  const supabase = await createServiceRoleClient()

  const { data: receptions, error } = await supabase
    .from("receptions")
    .select(
      `
      *,
      provider:providers(name, code),
      driver:drivers(name),
      created_by_user:users!receptions_created_by_fkey(username)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return { error: "Error al obtener recepciones" }
  }

  return { receptions }
}

export async function getReceptionDetails(receptionId: string) {
  const supabase = await createServiceRoleClient()

  const { data: reception, error: receptionError } = await supabase
    .from("receptions")
    .select(
      `
      *,
      provider:providers(*),
      driver:drivers(*),
      created_by_user:users!receptions_created_by_fkey(username, full_name)
    `,
    )
    .eq("id", receptionId)
    .single()

  if (receptionError) {
    return { error: "Error al obtener recepción" }
  }

  const { data: details, error: detailsError } = await supabase
    .from("reception_details")
    .select(
      `
      *,
      fruit_type:fruit_types(*)
    `,
    )
    .eq("reception_id", receptionId)
    .order("line_number")

  if (detailsError) {
    return { error: "Error al obtener detalles" }
  }

  return { reception, details }
}

export async function createProvider(data: {
  code: string
  name: string
  contact_person?: string
  phone?: string
  address?: string
}) {
  const session = await getSession()

  if (!session) {
    return { error: "No autorizado" }
  }

  const supabase = await createServiceRoleClient()

  const { data: provider, error } = await supabase
    .from("providers")
    .insert({
      ...data,
      created_by: session.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: "El código de proveedor ya existe" }
    }
    return { error: "Error al crear proveedor" }
  }

  revalidatePath("/dashboard/reception")
  return { success: true, provider }
}

export async function createDriver(data: { name: string; license_number?: string; phone?: string }) {
  const session = await getSession()

  if (!session) {
    return { error: "No autorizado" }
  }

  const supabase = await createServiceRoleClient()

  const { data: driver, error } = await supabase
    .from("drivers")
    .insert({
      ...data,
      created_by: session.id,
    })
    .select()
    .single()

  if (error) {
    return { error: "Error al crear chofer" }
  }

  revalidatePath("/dashboard/reception")
  return { success: true, driver }
}
