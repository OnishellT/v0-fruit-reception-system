"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function getReceptions() {
  const supabase = await createServiceRoleClient();

  const { data: receptions, error } = await supabase
    .from("receptions")
    .select(
      `
      *,
      provider:providers!inner(id, code, name),
      driver:drivers!inner(id, name),
      fruit_type:fruit_types!inner(id, type, subtype),
      created_by_user:users(id, username)
    `,
    )
    .is("provider.deleted_at", null)
    .is("driver.deleted_at", null)
    .is("fruit_type.deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching receptions:", error);
    return { error: "Error al obtener recepciones" };
  }

  // Fetch quality data separately if needed
  if (receptions && receptions.length > 0) {
    const receptionIds = receptions.map(r => r.id);
    const { data: qualityData } = await supabase
      .from("calidad_cafe")
      .select("*")
      .in("recepcion_id", receptionIds);

    // Attach quality data to each reception
    receptions.forEach(reception => {
      reception.calidad_cafe = qualityData?.filter(q => q.recepcion_id === reception.id) || [];
    });
  }

  return { receptions };
}

export async function getReceptionDetails(receptionId: string) {
  const supabase = await createServiceRoleClient();

  const { data: reception, error } = await supabase
    .from("receptions")
    .select(
      `
      *,
      provider:providers!inner(id, code, name),
      driver:drivers!inner(id, name),
      fruit_type:fruit_types!inner(id, type, subtype),
      created_by_user:users(id, username)
    `,
    )
    .eq("id", receptionId)
    .single();

  if (error || !reception) {
    console.error("Error fetching reception details:", error);
    return { error: "Recepción no encontrada" };
  }

  // Fetch reception details separately
  const { data: details, error: detailsError } = await supabase
    .from("reception_details")
    .select(`
      id,
      fruit_type_id,
      quantity,
      weight_kg,
      line_number
    `)
    .eq("reception_id", receptionId)
    .order("line_number", { ascending: true });

  if (detailsError) {
    console.error("Error fetching reception details:", detailsError);
    return { error: "Error al cargar los detalles de la recepción: " + detailsError.message };
  }

  // Fetch fruit types separately
  let fruitTypesMap: Record<string, any> = {};
  if (details && details.length > 0) {
    const fruitTypeIds = [...new Set(details.map(d => d.fruit_type_id))];
    const { data: fruitTypes, error: fruitTypesError } = await supabase
      .from("fruit_types")
      .select("id, type, subtype")
      .in("id", fruitTypeIds);

    if (!fruitTypesError && fruitTypes) {
      fruitTypesMap = fruitTypes.reduce((acc, ft) => {
        acc[ft.id] = ft;
        return acc;
      }, {} as Record<string, any>);
    }
  }

  // Attach fruit type data to details
  const detailsWithFruitType = details?.map(detail => ({
    ...detail,
    fruit_type: detail.fruit_type_id ? fruitTypesMap[detail.fruit_type_id] : null
  })) || [];

  return { reception, details: detailsWithFruitType };
}

export async function createReception(data: any) {
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  try {
    const supabase = await createServiceRoleClient();

    // Generate reception number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");

    // Get the last reception number for today
    const { data: lastReception } = await supabase
      .from("receptions")
      .select("reception_number")
      .like("reception_number", `REC-${dateStr}-%`)
      .order("reception_number", { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (lastReception) {
      const lastSequence = parseInt(lastReception.reception_number.split("-")[2]);
      sequence = lastSequence + 1;
    }

    const reception_number = `REC-${dateStr}-${sequence.toString().padStart(4, "0")}`;

    // Insert reception
    const { data: reception, error: receptionError } = await supabase
      .from("receptions")
      .insert({
        reception_number,
        provider_id: data.provider_id,
        driver_id: data.driver_id,
        fruit_type_id: data.fruit_type_id,
        truck_plate: data.truck_plate,
        total_containers: data.total_containers,
        total_weight: data.total_weight,
        created_by: session.id,
      })
      .select()
      .single();

    if (receptionError) {
      throw receptionError;
    }

    // Insert reception details
    if (data.details && data.details.length > 0) {
      const detailsWithReception = data.details.map((detail: any) => ({
        ...detail,
        reception_id: reception.id,
      }));

      const { error: detailsError } = await supabase
        .from("reception_details")
        .insert(detailsWithReception);

      if (detailsError) {
        throw detailsError;
      }
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: session.id,
      action: "create",
      table_name: "receptions",
      record_id: reception.id,
    });

    revalidatePath("/dashboard/reception");
    return { success: true, reception };
  } catch (error: any) {
    console.error("Error creating reception:", error);
    return { error: error.message || "Error al crear la recepción" };
  }
}

export async function updateReception(id: string, data: any) {
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  try {
    const supabase = await createServiceRoleClient();

    // Update reception
    const { data: reception, error: receptionError } = await supabase
      .from("receptions")
      .update({
        provider_id: data.provider_id,
        driver_id: data.driver_id,
        fruit_type_id: data.fruit_type_id,
        truck_plate: data.truck_plate,
        total_containers: data.total_containers,
        total_weight: data.total_weight,
      })
      .eq("id", id)
      .select()
      .single();

    if (receptionError) {
      throw receptionError;
    }

    // Delete existing details
    await supabase
      .from("reception_details")
      .delete()
      .eq("reception_id", id);

    // Insert new details
    if (data.details && data.details.length > 0) {
      const detailsWithReception = data.details.map((detail: any) => ({
        ...detail,
        reception_id: id,
      }));

      const { error: detailsError } = await supabase
        .from("reception_details")
        .insert(detailsWithReception);

      if (detailsError) {
        throw detailsError;
      }
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: session.id,
      action: "update",
      table_name: "receptions",
      record_id: id,
    });

    revalidatePath("/dashboard/reception");
    revalidatePath(`/dashboard/reception/${id}`);
    return { success: true, reception };
  } catch (error: any) {
    console.error("Error updating reception:", error);
    return { error: error.message || "Error al actualizar la recepción" };
  }
}

