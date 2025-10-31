import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testAsociaciones() {
  console.log("[v0] Testing asociaciones display issue...\n");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Test 1: Simple query without filters
    console.log("[v0] Test 1: Fetching all asociaciones without filters...");
    const { data: allAsocs, error: allError } = await supabase
      .from("asociaciones")
      .select("*");

    if (allError) {
      console.error("  ❌ Error:", allError);
    } else {
      console.log(`  ✅ Found ${allAsocs?.length || 0} asociaciones total`);
      allAsocs?.forEach(a => {
        console.log(`    - ${a.name} (${a.code}) - deleted_at: ${a.deleted_at || 'null'}`);
      });
    }

    console.log("\n[v0] Test 2: Fetching asociaciones with deleted_at IS NULL...");
    const { data: activeAsocs, error: activeError } = await supabase
      .from("asociaciones")
      .select("*")
      .is("deleted_at", null);

    if (activeError) {
      console.error("  ❌ Error:", activeError);
    } else {
      console.log(`  ✅ Found ${activeAsocs?.length || 0} active asociaciones`);
      activeAsocs?.forEach(a => {
        console.log(`    - ${a.name} (${a.code})`);
      });
    }

    console.log("\n[v0] Test 3: Fetching with provider join (current query)...");
    const { data: joinedAsocs, error: joinedError } = await supabase
      .from("asociaciones")
      .select(`
        *,
        providers!inner(id, deleted_at)
      `)
      .is("deleted_at", null)
      .is("providers.deleted_at", null);

    if (joinedError) {
      console.error("  ❌ Error:", joinedError);
    } else {
      console.log(`  ✅ Found ${joinedAsocs?.length || 0} asociaciones with active providers`);
      joinedAsocs?.forEach(a => {
        console.log(`    - ${a.name} (${a.code}) - providers: ${a.providers?.length || 0}`);
      });
    }

    console.log("\n[v0] Test 4: Checking latest created asociación...");
    const { data: latest, error: latestError } = await supabase
      .from("asociaciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestError) {
      console.error("  ❌ Error:", latestError);
    } else {
      console.log(`  Latest: ${latest.name} (${latest.code})`);
      console.log(`    created_at: ${latest.created_at}`);
      console.log(`    deleted_at: ${latest.deleted_at || 'null'}`);
    }

    console.log("\n[v0] ✅ Test complete!");
  } catch (error) {
    console.error("\n[v0] ❌ Fatal error:", error);
  }
}

testAsociaciones();
