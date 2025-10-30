"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function getProviders() {
  const supabase = await createServiceRoleClient();

  const { data: providers, error } = await supabase
    .from("providers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return { error: "Error al obtener proveedores" };
  }

  return { providers };
}

export async function getDrivers() {
  const supabase = await createServiceRoleClient();

  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return { error: "Error al obtener choferes" };
  }

  return { drivers };
}

export async function getFruitTypes() {
  const supabase = await createServiceRoleClient();

  const { data: fruitTypes, error } = await supabase
    .from("fruit_types")
    .select("*")
    .eq("is_active", true)
    .order("type, subtype");

  if (error) {
    return { error: "Error al obtener tipos de frutos" };
  }

  return { fruitTypes };
}

export async function createReception(data: {
  provider_id: string;
  driver_id: string;
  fruit_type_id: string;
  truck_plate: string;
  total_containers: number;
  notes?: string;
  details: Array<{
    quantity: number;
    weight_kg: number;
  }>;
}) {
  console.log("Creating reception with data:", data);
  const session = await getSession();

  if (!session) {
    console.log("No session found");
    return { error: "No autorizado" };
  }

  console.log("Session:", session);

  const supabase = await createServiceRoleClient();

  // Convert empty strings to null for UUID fields
  const providerId = data.provider_id || null;
  const driverId = data.driver_id || null;
  const fruitTypeId = data.fruit_type_id || null;

  // Generate reception number
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const { data: lastReception } = await supabase
    .from("receptions")
    .select("reception_number")
    .like("reception_number", `REC-${dateStr}%`)
    .order("reception_number", { ascending: false })
    .limit(1)
    .single();

  let sequence = 1;
  if (lastReception) {
    const lastSeq = Number.parseInt(
      lastReception.reception_number.split("-")[2],
    );
    sequence = lastSeq + 1;
  }

  const reception_number = `REC-${dateStr}-${sequence.toString().padStart(4, "0")}`;

  const { data: reception, error: receptionError } = await supabase
    .from("receptions")
    .insert({
      reception_number,
      provider_id: providerId,
      driver_id: driverId,
      fruit_type_id: fruitTypeId,
      truck_plate: data.truck_plate,
      total_containers: data.total_containers,
      notes: data.notes,
      status: "completed",
      created_by: session.id,
    })
    .select()
    .single();

  if (receptionError) {
    console.error("Reception creation error:", receptionError);
    return { error: `Error al crear recepción: ${receptionError.message}` };
  }

  const details = data.details.map((detail, index) => ({
    reception_id: reception.id,
    fruit_type_id: fruitTypeId,
    quantity: detail.quantity,
    weight_kg: detail.weight_kg,
    line_number: index + 1,
  }));

  const { error: detailsError } = await supabase
    .from("reception_details")
    .insert(details);

  if (detailsError) {
    console.error("Reception details error:", detailsError);
    // Rollback reception if details fail
    await supabase.from("receptions").delete().eq("id", reception.id);
    return {
      error: `Error al crear detalles de recepción: ${detailsError.message}`,
    };
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    user_id: session.id,
    action: "create_reception",
    table_name: "receptions",
    record_id: reception.id,
    new_values: { reception_number, provider_id: data.provider_id },
  });

  revalidatePath("/dashboard/reception");
  return { success: true, reception_number };
}

export async function updateReception(
  receptionId: string,
  data: {
    provider_id: string;
    driver_id: string;
    fruit_type_id: string;
    truck_plate: string;
    total_containers: number;
    notes?: string;
    details: Array<{
      id?: string;
      quantity: number;
      weight_kg: number;
    }>;
  },
) {
  console.log("Updating reception with data:", data);
  const session = await getSession();

  if (!session) {
    console.log("No session found");
    return { error: "No autorizado" };
  }

  console.log("Session:", session);

  const supabase = await createServiceRoleClient();

  // Convert empty strings to null for UUID fields
  const providerId = data.provider_id || null;
  const driverId = data.driver_id || null;
  const fruitTypeId = data.fruit_type_id || null;

  const { data: reception, error: receptionError } = await supabase
    .from("receptions")
    .update({
      provider_id: providerId,
      driver_id: driverId,
      fruit_type_id: fruitTypeId,
      truck_plate: data.truck_plate,
      total_containers: data.total_containers,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", receptionId)
    .select()
    .single();

  if (receptionError) {
    console.error("Reception update error:", receptionError);
    return { error: `Error al actualizar recepción: ${receptionError.message}` };
  }

  // Delete existing details
  const { error: deleteError } = await supabase
    .from("reception_details")
    .delete()
    .eq("reception_id", receptionId);

  if (deleteError) {
    console.error("Reception details delete error:", deleteError);
    return {
      error: `Error al eliminar detalles existentes: ${deleteError.message}`,
    };
  }

  // Insert new details
  const details = data.details.map((detail, index) => ({
    reception_id: receptionId,
    fruit_type_id: fruitTypeId,
    quantity: detail.quantity,
    weight_kg: detail.weight_kg,
    line_number: index + 1,
  }));

  const { error: detailsError } = await supabase
    .from("reception_details")
    .insert(details);

  if (detailsError) {
    console.error("Reception details error:", detailsError);
    return {
      error: `Error al crear detalles de recepción: ${detailsError.message}`,
    };
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    user_id: session.id,
    action: "update_reception",
    table_name: "receptions",
    record_id: receptionId,
    new_values: { truck_plate: data.truck_plate, total_containers: data.total_containers },
  });

  revalidatePath("/dashboard/reception");
  revalidatePath(`/dashboard/reception/${receptionId}`);
  return { success: true, reception_number: reception.reception_number };
}

export async function getReceptions() {
  const supabase = await createServiceRoleClient();

  const { data: receptions, error } = await supabase
    .from("receptions")
    .select(
      `
      *,
      provider:providers(id, code, name),
      driver:drivers(id, name),
      fruit_type:fruit_types(id, type, subtype),
      created_by_user:users(id, username)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching receptions:", error);
    return { error: "Error al obtener recepciones" };
  }

  return { receptions };
}

export async function getReceptionDetails(receptionId: string) {
  const supabase = await createServiceRoleClient();

  const { data: reception, error: receptionError } = await supabase
    .from("receptions")
    .select(
      `
      *,
      provider:providers(id, code, name),
      driver:drivers(id, name),
      fruit_type:fruit_types(id, type, subtype),
      created_by_user:users(id, username)
    `,
    )
    .eq("id", receptionId)
    .single();

  if (receptionError) {
    return { error: "Error al obtener recepción" };
  }

  const { data: details, error: detailsError } = await supabase
    .from("reception_details")
    .select(
      `
      *,
      fruit_type:fruit_types(id, type, subtype)
    `,
    )
    .eq("reception_id", receptionId)
    .order("line_number");

  if (detailsError) {
    return { error: "Error al obtener detalles" };
  }

  return { reception, details };
}

export async function createProvider(data: {
  code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
}) {
  const session = await getSession();

  if (!session) {
    return { error: "No autorizado" };
  }

  const supabase = await createServiceRoleClient();

  const { data: provider, error } = await supabase
    .from("providers")
    .insert({
      ...data,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "El código de proveedor ya existe" };
    }
    return { error: "Error al crear proveedor" };
  }

  revalidatePath("/dashboard/reception");
  return { success: true, provider };
}

export async function createDriver(data: {
  name: string;
  license_number?: string;
  phone?: string;
}) {
  const session = await getSession();

  if (!session) {
    return { error: "No autorizado" };
  }

  const supabase = await createServiceRoleClient();

  const { data: driver, error } = await supabase
    .from("drivers")
    .insert({
      ...data,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) {
    return { error: "Error al crear chofer" };
  }

  revalidatePath("/dashboard/reception");
  return { success: true, driver };
}
