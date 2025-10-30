"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";

export async function getAsociaciones() {
  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("asociaciones")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[v0] Error fetching asociaciones:", error);
      return { error: error.message, data: null };
    }
    return { data, error: null };
  } catch (error: any) {
    console.error("[v0] Exception fetching asociaciones:", error);
    return { error: error.message, data: null };
  }
}

export async function getAsociacion(id: string) {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("asociaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAsociacion(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "No autorizado", success: false };
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("asociaciones").insert({
    code,
    name,
    description,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: `El código de asociación "${code}" ya existe. Por favor use un código diferente.`,
        success: false,
      };
    }
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard/asociaciones");
  return { success: true };
}

export async function updateAsociacion(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "No autorizado", success: false };
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("asociaciones")
    .update({ code, name, description })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        error: `El código de asociación "${code}" ya existe. Por favor use un código diferente.`,
        success: false,
      };
    }
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard/asociaciones");
  return { success: true };
}

export async function deleteAsociacion(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("asociaciones").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/asociaciones");
  return { success: true };
}
