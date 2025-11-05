import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server"; // Import the service role client
import { CreateLaboratorySampleSchema } from "@/lib/schemas/cacao";
import { getFruitTypeBySubtype } from "@/lib/supabase/cacao"; // Moved import
import { revalidatePath } from "next/cache";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ receptionId: string }> },
) {
  const supabase = await createServiceRoleClient(); // Create a service role client
  try {
    const { receptionId } = await params;
    const { data: samples, error } = await supabase
      .from("laboratory_samples")
      .select("*")
      .eq("reception_id", receptionId);

    if (error) throw error;

    return NextResponse.json(samples, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ receptionId: string }> },
) {
  const supabase = await createServiceRoleClient();
  try {
    const body = await request.json();
    const { receptionId } = await params;

    // Check if a sample already exists for this reception
    const { data: existingSamples, error: existingSamplesError } =
      await supabase
        .from("laboratory_samples")
        .select("id")
        .eq("reception_id", receptionId);

    if (existingSamplesError) throw existingSamplesError;

    if (existingSamples && existingSamples.length > 0) {
      return NextResponse.json(
        { error: "A laboratory sample already exists for this reception." },
        { status: 409 },
      ); // 409 Conflict
    }

    const validation = CreateLaboratorySampleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const sampleToCreate = {
      ...validation.data,
      reception_id: receptionId,
      status: 'pending', // Set default status for new samples
    };

    const { data: sample, error } = await supabase
      .from("laboratory_samples")
      .insert(sampleToCreate)
      .select()
      .single();
    if (error) throw error;

    // Update the reception with the lab sample wet weight
    // CRITICAL: Store wet weight and calculate net effect
    const wetWeight = sampleToCreate.sample_weight;

    // Calculate new total accounting for lab sample
    // total_peso_final = total_peso_original - total_peso_descuento - wetWeight
    // The dried weight will be added later when the sample is completed
    const { data: reception, error: fetchReceptionError } = await supabase
      .from("receptions")
      .select("total_peso_original, total_peso_descuento, total_peso_final")
      .eq("id", receptionId)
      .single();

    if (fetchReceptionError) throw fetchReceptionError;

    const newTotalPesoFinal =
      Number(reception.total_peso_original || 0) -
      Number(reception.total_peso_descuento || 0) -
      Number(wetWeight);

    // Store the wet weight and update total_peso_final
    const { error: updateError } = await supabase
      .from("receptions")
      .update({
        lab_sample_wet_weight: Number(wetWeight),
        // Reset dried weight to 0 until sample is completed
        lab_sample_dried_weight: 0,
        total_peso_final: Number(newTotalPesoFinal),
      })
      .eq("id", receptionId);

    if (updateError) throw updateError;

    // Revalidate the reception details page to show updated lab sample data
    revalidatePath(`/dashboard/reception/${receptionId}`);
    revalidatePath('/dashboard/reception');

    return NextResponse.json(sample, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
