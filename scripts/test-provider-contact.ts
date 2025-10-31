import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testProviderContact() {
  console.log("[v0] Testing provider contact field...\n");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Get the first provider to check contact_person field
    const { data: providers, error } = await supabase
      .from("providers")
      .select("*")
      .is("deleted_at", null)
      .limit(5);

    if (error) {
      console.error("Error fetching providers:", error);
      return;
    }

    console.log("[v0] Sample providers with contact fields:\n");

    if (!providers || providers.length === 0) {
      console.log("  No providers found\n");
      return;
    }

    for (const p of providers) {
      console.log(`  Provider: ${p.name} (${p.code})`);
      console.log(`    contact_person: ${p.contact_person || '(null)'}`);
      console.log(`    phone: ${p.phone || '(null)'}`);
      console.log(`    address: ${p.address || '(null)'}\n`);
    }

    // Check if there's a column mismatch issue
    console.log("[v0] Checking column names in providers table...");
    const { data: sample, error: sampleError } = await supabase
      .from("providers")
      .select("*")
      .limit(1);

    if (sampleError) {
      console.error("Error:", sampleError);
      return;
    }

    const columns = Object.keys(sample[0] || {});
    console.log("\n[v0] Available columns:");
    columns.forEach(col => console.log(`  - ${col}`));

    // Check if contact_person column exists
    if (columns.includes("contact_person")) {
      console.log("\n✅ 'contact_person' column exists in database");
    } else {
      console.log("\n❌ 'contact_person' column NOT found in database!");
      console.log("   This could be the issue.");
    }
  } catch (error) {
    console.error("\n[v0] ❌ Error:", error);
  }
}

testProviderContact();
