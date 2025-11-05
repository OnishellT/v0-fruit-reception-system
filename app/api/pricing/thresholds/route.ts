import { NextRequest, NextResponse } from "next/server";
import {
  getAllDiscountThresholds,
  createDiscountThreshold,
  updateDiscountThreshold,
  deleteDiscountThreshold
} from "@/lib/actions/pricing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fruitType = searchParams.get("fruitType");

    if (!fruitType) {
      return NextResponse.json(
        { success: false, error: "fruitType es requerido" },
        { status: 400 }
      );
    }

    const result = await getAllDiscountThresholds(fruitType);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/pricing/thresholds:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 POST /api/pricing/thresholds - Received body:', body);

    const result = await createDiscountThreshold(body);
    console.log('📤 POST /api/pricing/thresholds - Server action result:', result);

    if (!result.success) {
      console.error('❌ POST /api/pricing/thresholds - Failed:', result.error);
      return NextResponse.json(result, { status: 400 });
    }

    console.log('✅ POST /api/pricing/thresholds - Success, returning:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/pricing/thresholds:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 PUT /api/pricing/thresholds - Received body:', body);

    const result = await updateDiscountThreshold(body);
    console.log('📤 PUT /api/pricing/thresholds - Server action result:', result);

    if (!result.success) {
      console.error('❌ PUT /api/pricing/thresholds - Failed:', result.error);
      return NextResponse.json(result, { status: 400 });
    }

    console.log('✅ PUT /api/pricing/thresholds - Success, returning:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/pricing/thresholds:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID es requerido" },
        { status: 400 }
      );
    }

    const result = await deleteDiscountThreshold(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in DELETE /api/pricing/thresholds:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
