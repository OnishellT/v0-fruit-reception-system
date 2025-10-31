import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testFruitTypeDescription() {
  console.log("[v0] Testing fruit type description field...\n");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Test 1: Get all fruit types
    console.log("[v0] Test 1: Fetching fruit types...");
    const { data: fruitTypes, error: error1 } = await supabase
      .from("fruit_types")
      .select("*")
      .is("deleted_at", null)
      .order("type", { ascending: true });

    if (error1) {
      console.error("❌ Error:", error1);
    } else {
      console.log(`✅ Found ${fruitTypes?.length || 0} fruit types\n`);

      if (!fruitTypes || fruitTypes.length === 0) {
        console.log("  No fruit types found");
      } else {
        fruitTypes.forEach((ft, idx) => {
          console.log(`  [${idx + 1}] ${ft.type} - ${ft.subtype}`);
          console.log(`      description: ${ft.description || "(null)"}`);
          console.log(`      created_at: ${ft.created_at}`);
          console.log("");
        });
      }
    }

    // Test 2: Get specific fruit type by ID
    if (fruitTypes && fruitTypes.length > 0) {
      console.log("[v0] Test 2: Fetching single fruit type by ID...");
      const firstId = fruitTypes[0].id;
      const { data: singleFruitType, error: error2 } = await supabase
        .from("fruit_types")
        .select("*")
        .eq("id", firstId)
        .single();

      if (error2) {
        console.error("❌ Error:", error2);
      } else {
        console.log(`✅ Fetched single fruit type:`);
        console.log(`  type: ${singleFruitType.type}`);
        console.log(`  subtype: ${singleFruitType.subtype}`);
        console.log(`  description: ${singleFruitType.description || "(null)"}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("[v0] SUMMARY");
    console.log("=".repeat(60));

    const typesWithDescription = fruitTypes?.filter((ft) => ft.description) || [];
    console.log(`Total fruit types: ${fruitTypes?.length || 0}`);
    console.log(`With description: ${typesWithDescription.length}`);
    console.log(`Without description: ${(fruitTypes?.length || 0) - typesWithDescription.length}`);

    console.log("\n✅ Test complete!");
    console.log("\nThe tipos de fruto table should now display:");
    console.log("  - Tipo column");
    console.log("  - Subtipo column");
    console.log("  - Descripción column (this was missing in edit form)");
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

testFruitTypeDescription();
