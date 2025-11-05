"use server"

import { db } from "@/lib/db"
import { certifications, providerCertifications } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { getSession } from "./auth"
import { eq, asc, and } from "drizzle-orm"

export async function getCertifications() {
  const data = await db
    .select()
    .from(certifications)
    .orderBy(asc(certifications.name))

  return data
}

export async function getProviderCertifications(providerId: string) {
  const data = await db
    .select()
    .from(providerCertifications)
    .where(eq(providerCertifications.providerId, providerId))

  return data
}

export async function addProviderCertification(providerId: string, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const certificationId = formData.get("certification_id") as string
  const issuedDate = formData.get("issued_date") as string
  const expiryDate = formData.get("expiry_date") as string
  const notes = formData.get("notes") as string

  await db.insert(providerCertifications).values({
    providerId,
    certificationId,
    issuedDate: issuedDate ? issuedDate : null,
    expiryDate: expiryDate ? expiryDate : null,
    notes: notes || null,
  })

  revalidatePath(`/dashboard/proveedores/${providerId}`)
  return { success: true }
}

export async function removeProviderCertification(providerId: string, certificationId: string) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  await db
    .delete(providerCertifications)
    .where(and(
      eq(providerCertifications.providerId, providerId),
      eq(providerCertifications.certificationId, certificationId)
    ))

  revalidatePath(`/dashboard/proveedores/${providerId}`)
  return { success: true }
}
