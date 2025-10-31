import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function verifyProviderCount() {
  console.log("[v0] Verifying provider count in asociaciones...\n");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Fetch asociaciones with provider counts
    const { data: asociaciones, error } = await supabase
      .from("asociaciones")
      .select(`
        *,
        providers!inner(id, deleted_at)
      `)
      .is("deleted_at", null)
      .is("providers.deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw error;

    console.log("[v0] Asociaciones with active provider counts:\n");

    if (!asociaciones || asociaciones.length === 0) {
      console.log("  No asociaciones found");
      return;
    }

    for (const asoc of asociaciones) {
      const activeProviders = asoc.providers?.filter(p => !p.deleted_at) || [];
      console.log(`  📋 ${asoc.name} (${asoc.code})`);
      console.log(`     └─ Active providers: ${activeProviders.length}`);
    }

    console.log("\n[v0] ✅ Provider count verification complete!");
    console.log("\nNote: The count now only includes providers where deleted_at IS NULL");
    console.log("      Soft-deleted providers are excluded from the count.");
  } catch (error) {
    console.error("\n[v0] ❌ Error:", error);
  }
}

verifyProviderCount();
