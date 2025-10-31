import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testAsociacionData() {
  console.log("[v0] Testing asociación name in data...\n");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Test the exact query used in getAsociaciones
    const { data, error } = await supabase
      .from("asociaciones")
      .select(`
        *,
        providers(id, deleted_at)
      `)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log(`✅ Found ${data?.length || 0} asociaciones:\n`);

    if (!data || data.length === 0) {
      console.log("No asociaciones found");
      return;
    }

    data.forEach((asoc, idx) => {
      console.log(`\n[${idx + 1}] Asociación data:`);
      console.log(`  id: ${asoc.id}`);
      console.log(`  code: ${asoc.code}`);
      console.log(`  name: ${asoc.name}`);
      console.log(`  description: ${asoc.description}`);
      console.log(`  created_at: ${asoc.created_at}`);
      console.log(`  providers: ${asoc.providers?.length || 0}`);

      // Check if name field exists
      if (asoc.name === undefined || asoc.name === null) {
        console.log(`  ⚠️ WARNING: name field is ${asoc.name}`);
      }
    });

    console.log("\n✅ Test complete!");
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

testAsociacionData();
