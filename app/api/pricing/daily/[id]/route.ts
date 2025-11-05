import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { dailyPrices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/pricing/daily/[id] - Update a daily price
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json();
    const { active } = body;

    if (typeof active !== "boolean") {
      return NextResponse.json(
        { error: "El campo 'active' debe ser un booleano" },
        { status: 400 }
      );
    }

    const updatedPrice = await db
      .update(dailyPrices)
      .set({ active })
      .where(eq(dailyPrices.id, id))
      .returning();

    if (updatedPrice.length === 0) {
      return NextResponse.json(
        { error: "Precio diario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPrice[0],
    });
  } catch (error) {
    console.error("Error updating daily price:", error);
    return NextResponse.json(
      { error: "Error al actualizar precio diario" },
      { status: 500 }
    );
  }
}