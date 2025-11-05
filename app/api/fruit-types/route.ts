import { NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { getFruitTypes } from "@/lib/actions/fruit-types";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fruitTypes = await getFruitTypes();

    return NextResponse.json({
      success: true,
      data: fruitTypes,
    });
  } catch (error) {
    console.error("Error fetching fruit types:", error);
    return NextResponse.json(
      { error: "Error al obtener tipos de fruta" },
      { status: 500 }
    );
  }
}