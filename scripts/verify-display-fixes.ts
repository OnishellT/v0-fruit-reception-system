import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function verifyDisplayFixes() {
  console.log("=".repeat(60));
  console.log("[v0] VERIFYING DISPLAY FIXES");
  console.log("=".repeat(60));

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Test 1: Provider contact_person field
  console.log("\n1️⃣  PROVIDER CONTACT FIELD TEST");
  console.log("-".repeat(60));
  const { data: providers, error: providerError } = await supabase
    .from("providers")
    .select("*")
    .is("deleted_at", null)
    .limit(3);

  if (providerError) {
    console.log("❌ Error:", providerError);
  } else {
    console.log(`✅ Found ${providers?.length || 0} providers\n`);
    providers?.forEach((p) => {
      console.log(`  Provider: ${p.name}`);
      console.log(`    code: ${p.code}`);
      console.log(`    contact_person: ${p.contact_person || "(null)"}`);
      console.log(`    phone: ${p.phone || "(null)"}`);
      console.log("");
    });
  }

  // Test 2: Asociación name field
  console.log("\n2️⃣  ASOCIACIÓN NAME FIELD TEST");
  console.log("-".repeat(60));
  const { data: asociaciones, error: asocError } = await supabase
    .from("asociaciones")
    .select(`
      *,
      providers(id, deleted_at)
    `)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (asocError) {
    console.log("❌ Error:", asocError);
  } else {
    console.log(`✅ Found ${asociaciones?.length || 0} asociaciones\n`);

    if (!asociaciones || asociaciones.length === 0) {
      console.log("  No active asociaciones found");
    } else {
      // Transform data like the action does
      const transformed = asociaciones.map((asoc) => ({
        ...asoc,
        providers_count: asoc.providers?.filter((p) => !p.deleted_at).length || 0,
      }));

      transformed.forEach((asoc, idx) => {
        console.log(`  [${idx + 1}] ${asoc.name} (${asoc.code})`);
        console.log(`      description: ${asoc.description || "(null)"}`);
        console.log(`      providers_count: ${asoc.providers_count}`);
        console.log(`      created_at: ${asoc.created_at}`);

        // Verify name field is not empty
        if (!asoc.name || asoc.name.trim() === "") {
          console.log(`      ⚠️  WARNING: Name field is empty!`);
        }
        console.log("");
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("[v0] SUMMARY");
  console.log("=".repeat(60));

  const providerContactIssue = providers?.some((p) => !p.contact_person);
  const asocNameIssue = asociaciones?.some((a) => !a.name);

  if (!providerContactIssue) {
    console.log("✅ Provider contact field: WORKING (has data)");
  } else {
    console.log("⚠️  Provider contact field: Some providers missing contact_person");
  }

  if (!asocNameIssue) {
    console.log("✅ Asociación name field: WORKING (has data)");
  } else {
    console.log("⚠️  Asociación name field: Some associations missing name");
  }

  console.log("\n[v0] ✅ Verification complete!");
  console.log("\nNote: If you still don't see the fields in the UI:");
  console.log("  1. Hard refresh your browser (Ctrl+Shift+R)");
  console.log("  2. Clear browser cache");
  console.log("  3. Restart the dev server");
}

verifyDisplayFixes().catch((error) => {
  console.error("\n❌ Fatal error:", error);
});
