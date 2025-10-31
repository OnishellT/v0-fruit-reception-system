"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createQualitySchema, updateQualitySchema } from "@/lib/utils/quality-validations";
import type {
  CalidadCafe,
  CreateQualityEvaluationData,
  UpdateQualityEvaluationData,
  QualityEvaluationResponse,
  QualityEvaluationWithReceptionResponse,
} from "@/lib/types/quality-cafe";

// Get current session
async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

// Check if user is admin
async function checkIsAdmin(session: any): Promise<boolean> {
  if (!session || session.role !== "admin") {
    return false;
  }
  return true;
}

/**
 * Create a new quality evaluation record
 */
export async function createQualityEvaluation(
  data: CreateQualityEvaluationData
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  const isAdmin = await checkIsAdmin(session);
  if (!isAdmin) {
    return { success: false, error: "Forbidden: Only administrators can modify quality data" };
  }

  try {
    // Validate input
    const validated = createQualitySchema.parse(data);

    // Verify reception exists and is Café Seco
    const supabase = await createServiceRoleClient();
    
    const { data: reception, error: receptionError } = await supabase
      .from("receptions")
      .select(`
        id,
        fruit_type_id,
        fruit_types!inner (
          type,
          subtype
        )
      `)
      .eq("id", validated.recepcion_id)
      .single();

    if (receptionError || !reception) {
      console.error("Reception error:", receptionError);
      return { success: false, error: "Reception not found" };
    }

    // Check if fruit type is CAFÉ and subtype is Seco
    const fruitType = reception.fruit_types;
    if (!fruitType || fruitType.type !== "CAFÉ" || fruitType.subtype !== "Seco") {
      return { success: false, error: "Quality evaluation is only available for Café Seco receptions" };
    }

    // Check if quality evaluation already exists
    const { data: existing, error: checkError } = await supabase
      .from("calidad_cafe")
      .select("id")
      .eq("recepcion_id", validated.recepcion_id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing quality:", checkError);
      return { success: false, error: "Error checking existing quality data: " + checkError.message };
    }

    if (existing) {
      return { success: false, error: "Quality evaluation already exists for this reception" };
    }

    // Create quality evaluation
    const { data: quality, error: insertError } = await supabase
      .from("calidad_cafe")
      .insert({
        recepcion_id: validated.recepcion_id,
        violetas: validated.violetas,
        humedad: validated.humedad,
        moho: validated.moho,
        created_by: session.id,
        updated_by: session.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating quality evaluation:", insertError);
      return { success: false, error: "Failed to create quality evaluation" };
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      user_id: session.id,
      action: "create",
      table_name: "calidad_cafe",
      record_id: quality.id,
    });

    return { success: true, data: quality };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: " + error.errors[0].message };
    }
    console.error("Error in createQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Update an existing quality evaluation record
 */
export async function updateQualityEvaluation(
  recepcionId: string,
  data: UpdateQualityEvaluationData
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  const isAdmin = await checkIsAdmin(session);
  if (!isAdmin) {
    return { success: false, error: "Forbidden: Only administrators can modify quality data" };
  }

  try {
    // Validate input
    const validated = updateQualitySchema.parse(data);

    const supabase = await createServiceRoleClient();

    // Get existing quality evaluation
    const { data: existing, error: fetchError } = await supabase
      .from("calidad_cafe")
      .select("id")
      .eq("recepcion_id", recepcionId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Quality evaluation not found for this reception" };
    }

    // Update quality evaluation
    const { data: quality, error: updateError } = await supabase
      .from("calidad_cafe")
      .update({
        ...validated,
        updated_by: session.id,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating quality evaluation:", updateError);
      return { success: false, error: "Failed to update quality evaluation" };
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      user_id: session.id,
      action: "update",
      table_name: "calidad_cafe",
      record_id: quality.id,
    });

    return { success: true, data: quality };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: " + error.errors[0].message };
    }
    console.error("Error in updateQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Get quality evaluation for a specific reception
 */
export async function getQualityEvaluation(
  recepcionId: string
): Promise<QualityEvaluationResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  try {
    const supabase = await createServiceRoleClient();

    const { data: quality, error } = await supabase
      .from("calidad_cafe")
      .select("*")
      .eq("recepcion_id", recepcionId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching quality evaluation:", error);
      return { success: false, error: "Failed to fetch quality evaluation" };
    }

    return { success: true, data: quality || null };
  } catch (error: any) {
    console.error("Error in getQualityEvaluation:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}

/**
 * Get quality evaluation with full reception details
 */
export async function getQualityEvaluationWithReception(
  recepcionId: string
): Promise<QualityEvaluationWithReceptionResponse> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Unauthorized: Please log in" };
  }

  try {
    const supabase = await createServiceRoleClient();

    // Get reception details with fruit type
    const { data: reception, error: receptionError } = await supabase
      .from("receptions")
      .select(`
        id,
        reception_number,
        provider_id,
        driver_id,
        fruit_type_id,
        truck_plate,
        total_containers,
        total_weight,
        status,
        created_at,
        fruit_types!inner (
          type,
          subtype
        )
      `)
      .eq("id", recepcionId)
      .single();

    if (receptionError || !reception) {
      return { success: false, error: "Reception not found" };
    }

    // Get quality data
    const { data: quality, error: qualityError } = await supabase
      .from("calidad_cafe")
      .select("*")
      .eq("recepcion_id", recepcionId)
      .maybeSingle();

    if (qualityError) {
      console.error("Error fetching quality evaluation:", qualityError);
      return { success: false, error: "Failed to fetch quality evaluation" };
    }

    // Get user details for created_by and updated_by
    let createdByUser = null;
    let updatedByUser = null;

    if (quality) {
      const { data: creator } = await supabase
        .from("users")
        .select("id, username")
        .eq("id", quality.created_by)
        .single();

      const { data: updater } = await supabase
        .from("users")
        .select("id, username")
        .eq("id", quality.updated_by)
        .single();

      createdByUser = creator;
      updatedByUser = updater;
    }

    return {
      success: true,
      data: {
        quality: quality || null,
        reception: {
          ...reception,
          fruit_type: reception.fruit_types.type,
          fruit_subtype: reception.fruit_types.subtype,
        },
        created_by_user: createdByUser,
        updated_by_user: updatedByUser,
      },
    };
  } catch (error: any) {
    console.error("Error in getQualityEvaluationWithReception:", error);
    return { success: false, error: "Server error: Please try again later" };
  }
}
