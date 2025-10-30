"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";

export async function getProviders() {
  try {
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[v0] Error fetching providers:", error);
      return { error: error.message, data: null, asociacionesAvailable: false };
    }

    return { data, error: null, asociacionesAvailable: true };
  } catch (error: any) {
    console.error("[v0] Exception fetching providers:", error);
    return { error: error.message, data: null, asociacionesAvailable: false };
  }
}

export async function getProvider(id: string) {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProvider(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const contact = formData.get("contact") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const asociacionId = formData.get("asociacion_id") as string;

  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("providers").insert({
    name,
    code,
    contact_person: contact,
    phone,
    address,
    asociacion_id: asociacionId === "none" ? null : asociacionId,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `El código de proveedor "${code}" ya existe. Por favor use un código diferente.`,
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/proveedores");
  return { success: true };
}

export async function updateProvider(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const contact = formData.get("contact") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const asociacionId = formData.get("asociacion_id") as string;

  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("providers")
    .update({
      name,
      code,
      contact_person: contact,
      phone,
      address,
      asociacion_id: asociacionId === "none" ? null : asociacionId,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `El código de proveedor "${code}" ya existe. Por favor use un código diferente.`,
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/proveedores");
  revalidatePath(`/dashboard/proveedores/${id}`);
  return { success: true };
}

export async function deleteProvider(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("No autorizado");

  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("providers").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/proveedores");
  return { success: true };
}
