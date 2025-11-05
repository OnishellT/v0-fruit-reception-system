import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { dailyPrices, users, fruitTypes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/pricing/daily - Get daily prices
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fruitTypeId = searchParams.get("fruit_type_id");
    const activeOnly = searchParams.get("active_only") === "true";

    let whereConditions = [];

    if (fruitTypeId) {
      whereConditions.push(eq(dailyPrices.fruitTypeId, fruitTypeId));
    }

    if (activeOnly) {
      whereConditions.push(eq(dailyPrices.active, true));
    }

    const prices = await db
      .select({
        id: dailyPrices.id,
        fruitTypeId: dailyPrices.fruitTypeId,
        priceDate: dailyPrices.priceDate,
        pricePerKg: dailyPrices.pricePerKg,
        createdAt: dailyPrices.createdAt,
        createdBy: dailyPrices.createdBy,
        active: dailyPrices.active,
        fruitType: {
          type: fruitTypes.type,
          subtype: fruitTypes.subtype,
        },
        createdByUser: {
          username: users.username,
        },
      })
      .from(dailyPrices)
      .leftJoin(fruitTypes, eq(dailyPrices.fruitTypeId, fruitTypes.id))
      .leftJoin(users, eq(dailyPrices.createdBy, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(dailyPrices.priceDate), desc(dailyPrices.createdAt));

    const formattedPrices = prices.map(price => ({
      ...price,
      createdBy: price.createdByUser?.username || "Unknown",
    }));

    return NextResponse.json({
      success: true,
      data: formattedPrices,
    });
  } catch (error) {
    console.error("Error fetching daily prices:", error);
    return NextResponse.json(
      { error: "Error al obtener precios diarios" },
      { status: 500 }
    );
  }
}

// POST /api/pricing/daily - Create a new daily price
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { fruit_type_id, price_date, price_per_kg } = body;

    if (!fruit_type_id || !price_date || !price_per_kg) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check if a price already exists for this fruit type and date
    const existingPrice = await db
      .select()
      .from(dailyPrices)
      .where(
        and(
          eq(dailyPrices.fruitTypeId, fruit_type_id),
          eq(dailyPrices.priceDate, price_date),
          eq(dailyPrices.active, true)
        )
      )
      .limit(1);

    if (existingPrice.length > 0) {
      return NextResponse.json(
        { error: "Ya existe un precio activo para este tipo de fruta en esta fecha" },
        { status: 400 }
      );
    }

    const newPrice = await db
      .insert(dailyPrices)
      .values({
        fruitTypeId: fruit_type_id,
        priceDate: price_date,
        pricePerKg: price_per_kg.toString(),
        createdBy: session.id,
        active: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newPrice[0],
    });
  } catch (error) {
    console.error("Error creating daily price:", error);
    return NextResponse.json(
      { error: "Error al crear precio diario" },
      { status: 500 }
    );
  }
}