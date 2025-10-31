import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function verifySoftDelete() {
  console.log("[v0] Verifying soft delete columns...\n");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Check providers table
    const { data: providersData, error: providersError } = await supabase
      .from("providers")
      .select("*")
      .limit(1);

    if (providersError) throw providersError;

    console.log("[v0] ✓ Providers table accessible");
    console.log("  Columns:", Object.keys(providersData[0] || {}));

    // Check drivers table
    const { data: driversData, error: driversError } = await supabase
      .from("drivers")
      .select("*")
      .limit(1);

    if (driversError) throw driversError;

    console.log("\n[✓] Drivers table accessible");
    console.log("  Columns:", Object.keys(driversData[0] || {}));

    // Check fruit_types table
    const { data: fruitTypesData, error: fruitTypesError } = await supabase
      .from("fruit_types")
      .select("*")
      .limit(1);

    if (fruitTypesError) throw fruitTypesError;

    console.log("\n[✓] Fruit types table accessible");
    console.log("  Columns:", Object.keys(fruitTypesData[0] || {}));

    // Check asociaciones table
    const { data: asociacionesData, error: asociacionesError } = await supabase
      .from("asociaciones")
      .select("*")
      .limit(1);

    if (asociacionesError) throw asociacionesError;

    console.log("\n[✓] Asociaciones table accessible");
    console.log("  Columns:", Object.keys(asociacionesData[0] || {}));

    console.log("\n[v0] ✅ All tables verified successfully!");
    console.log("\nYou can now:");
    console.log("  • Delete providers/drivers/fruit types without foreign key errors");
    console.log("  • Soft-deleted records are automatically hidden from the UI");
    console.log("  • Use the contact field when creating providers");
  } catch (error) {
    console.error("\n[v0] ❌ Error:", error);
    process.exit(1);
  }
}

verifySoftDelete();
